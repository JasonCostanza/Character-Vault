# Save/Load System Implementation Plan

## Context

Character Vault currently has no data persistence. The Settings menu has Save/Load buttons and Auto-save/Auto-load checkboxes, but they're all stubs. Without persistence, all modules are lost when the symbiote is closed. This plan implements save/load using TaleSpire's campaign-scoped localStorage API, with a forward-looking schema that supports future export/import sharing.

## Storage API

TaleSpire provides `TS.localStorage.campaign.setBlob(str)` / `getBlob()` / `deleteBlob()` — string-based, scoped per symbiote per campaign, 5MB max. Character sheets are per-campaign (different characters in different campaigns), so campaign storage is the right scope.

## Save Schema (v1)

```json
{
  "version": 1,
  "savedAt": "2026-03-21T14:30:00.000Z",
  "moduleIdCounter": 5,
  "modules": [
    {
      "id": "module-001",
      "type": "text",
      "title": "Backstory",
      "colSpan": 2,
      "rowSpan": 2,
      "order": 0,
      "theme": "#2D5A3D",
      "textLight": false,
      "content": "# My Character\nLevel 5 Wizard"
    }
  ]
}
```

- **`version`** — integer for future migrations (v1→v2→v3 sequential transforms)
- **`savedAt`** — ISO timestamp for debugging / future "last saved" display
- **`moduleIdCounter`** — ensures new modules after load don't collide with existing IDs
- **`title`** — custom user-defined module title (`null` when using the default type label)
- **`modules`** — direct serialization of the `modules[]` array; `content` is type-specific and opaque to the save system (future submodule types store their data here)

## Implementation — All changes in `main.html`

### Step 1: Add `syncState` to module type registration

**File:** `main.html:416-418` — `registerModuleType()`

Add optional `syncState` parameter. This hook lets each module type sync live DOM state back to its data object before serialization.

```js
function registerModuleType(type, { label, renderBody, onPlayMode, onEditMode, syncState }) {
    MODULE_TYPES[type] = { label, renderBody, onPlayMode, onEditMode, syncState };
}
```

**File:** `main.html:610-652` — text type registration

Add `syncState` to the text type:

```js
syncState(moduleEl, data) {
    const textarea = moduleEl.querySelector('.module-textarea');
    if (textarea) data.content = textarea.value;
}
```

### Step 2: Core save/load functions

Insert a new `// ── Save / Load System ──` section after line 295 (after checkbox init, before Module State). These functions are defined early but only *called* after all dependencies (`MODULE_TYPES`, `renderModule`, etc.) are ready.

#### `migrateData(blob)` — sequential version migration
```js
function migrateData(blob) {
    const migrators = {
        // Future: 1: (data) => { /* transform */ data.version = 2; return data; }
    };
    while (migrators[blob.version]) {
        console.log(`[CV] Migrating save data v${blob.version} → v${blob.version + 1}`);
        blob = migrators[blob.version](blob);
    }
    return blob;
}
```

#### `syncModuleState()` — safety pass before serialization
```js
function syncModuleState() {
    document.querySelectorAll('.module').forEach(el => {
        const data = modules.find(m => m.id === el.dataset.id);
        if (!data) return;
        const typeDef = MODULE_TYPES[data.type];
        if (typeDef?.syncState) typeDef.syncState(el, data);
    });
}
```

#### `serializeCharacter()` — returns JSON string
```js
function serializeCharacter() {
    syncModuleState();
    return JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        moduleIdCounter,
        modules: modules.map(m => ({
            id: m.id, type: m.type, title: m.title || null,
            colSpan: m.colSpan, rowSpan: m.rowSpan, order: m.order,
            theme: m.theme || null, textLight: !!m.textLight,
            content: m.content ?? ''
        }))
    });
}
```

#### `deserializeCharacter(jsonStr)` — parses JSON and rebuilds UI
```js
function deserializeCharacter(jsonStr) {
    let blob;
    try { blob = JSON.parse(jsonStr); }
    catch (e) { console.error('[CV] Failed to parse save data:', e); return false; }

    if (!blob?.version || !Array.isArray(blob.modules)) {
        console.error('[CV] Invalid save data structure');
        return false;
    }

    blob = migrateData(blob);

    // Clear existing modules
    document.querySelectorAll('.module').forEach(el => el.remove());
    modules.length = 0;

    // Restore counter (ensure it's at least as high as max existing ID)
    moduleIdCounter = blob.moduleIdCounter || 0;

    // Rebuild modules sorted by order
    blob.modules.slice().sort((a, b) => a.order - b.order).forEach(saved => {
        if (!MODULE_TYPES[saved.type]) {
            console.warn(`[CV] Skipping unknown module type: ${saved.type}`);
            return;
        }
        const data = {
            id: saved.id, type: saved.type, title: saved.title || null,
            colSpan: saved.colSpan ?? 2, rowSpan: saved.rowSpan ?? 2,
            order: saved.order ?? 0, theme: saved.theme || null,
            textLight: !!saved.textLight, content: saved.content ?? ''
        };
        modules.push(data);
        renderModule(data);
    });

    modules.forEach((m, i) => m.order = i);
    updateEmptyState();
    console.log(`[CV] Loaded ${modules.length} modules`);
    return true;
}
```

#### `saveCharacter()` / `loadCharacter()` — TaleSpire storage wrappers
```js
function saveCharacter() {
    try {
        const data = serializeCharacter();
        TS.localStorage.campaign.setBlob(data);
        console.log(`[CV] Saved (${data.length} bytes)`);
        return true;
    } catch (e) { console.error('[CV] Save failed:', e); return false; }
}

function loadCharacter() {
    try {
        const data = TS.localStorage.campaign.getBlob();
        if (!data) { console.log('[CV] No saved data found'); return false; }
        return deserializeCharacter(data);
    } catch (e) { console.error('[CV] Load failed:', e); return false; }
}
```

### Step 3: Wire up buttons

Replace the stubs at lines 277-283:

```js
btnSave.addEventListener('click', () => { saveCharacter(); });
btnLoad.addEventListener('click', () => { loadCharacter(); });
```

### Step 4: Auto-save with debounce

Add alongside the save/load functions:

```js
let autoSaveTimer = null;
function scheduleSave() {
    if (chkAutoSave.checked) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(saveCharacter, 2000);
    }
}
```

**Add `scheduleSave()` calls at these trigger points:**

| Trigger | Location | After |
|---|---|---|
| Module created | line 406 | `console.log` in `btnWizardCreate` handler |
| Module deleted | line 550 | `console.log` in `deleteModule()` |
| Module reordered | line 503 | `console.log` in SortableJS `onEnd` |
| Module resized | line 715 | `console.log` in resize `onMouseUp` |
| Text content edited | line 622 | `autoResizeTextarea()` in textarea `input` handler |
| Text color toggled | line 478 | `classList.toggle` in textColorBtn handler |

### Step 5: Auto-load on startup

Add at the very end of the `<script>` block (line 721, before `</script>`):

```js
// ── Auto-Load on Startup ──
if (chkAutoLoad.checked && typeof TS !== 'undefined') {
    loadCharacter();
}
```

The `typeof TS` check prevents errors when testing outside TaleSpire.

## Phase 2: Export/Import (Future — schema-ready, not implemented now)

The save schema already supports export with minimal transformation:

- **Export**: `serializeCharacter()` minus `moduleIdCounter`, copy JSON to clipboard
- **Import**: Parse JSON, reassign all module IDs (reset counter), then `deserializeCharacter()`
- **UI**: Add Export/Import buttons in Settings. Import opens a textarea overlay for pasting JSON. Export copies to clipboard with visual feedback.

No code changes needed now — the v1 schema is forward-compatible.

## Edge Cases Handled

- **Unknown module type in save data**: Skipped with warning (handles version downgrades)
- **Missing fields**: `??` defaults prevent crashes on partial data
- **No saved data**: `getBlob()` returns falsy → graceful no-op
- **Parse failure**: try/catch → error logged, UI unchanged
- **TS API unavailable** (dev testing outside TaleSpire): `typeof TS` guard on auto-load; try/catch on manual save/load
- **Auto-save during load**: No spurious triggers — programmatic textarea value setting doesn't fire `input` events
- **SortableJS after load**: Queries children dynamically, no reinitialization needed

## Verification

1. Create several text modules with content, themes, and varied sizes
2. Click Save in Settings → check console for `[CV] Saved (N bytes)`
3. Refresh the symbiote → modules are gone (expected without auto-load)
4. Click Load → modules restored with correct content, colors, sizes, and order
5. Enable Auto-save → edit a module → check console for auto-save after 2s
6. Enable Auto-load → refresh → modules load automatically
7. Test with no saved data → Load shows "No saved data found" in console
8. Test in play mode → Load restores modules in play mode correctly

## Step 6: Update `_DOCS/ARCHITECTURE.md`

After all code changes are complete, update the architecture doc to reflect the new save/load system. Line numbers below are approximate — use actual post-edit line numbers.

### 6a. Update the JS Sections table

- Change the **Save / Load** row (currently line 50) from stub description to reflect the new functions:
  ```
  | ??? | **Save / Load System** | `migrateData()`, `syncModuleState()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` — TaleSpire campaign localStorage persistence with auto-save debounce |
  ```
- Update the **Module Type Registry** row to mention the new `syncState` hook:
  ```
  | ??? | **Module Type Registry** | `MODULE_TYPES{}` object, `registerModuleType(type, { label, renderBody, onPlayMode, onEditMode, syncState })` |
  ```
- Update the **Text Box Module Type** row to mention `syncState`:
  ```
  | ??? | **Text Box Module Type** | `registerModuleType('text', ...)` — textarea in edit mode, rendered markdown in play mode; `autoResizeTextarea()`, `syncState()` |
  ```
- Add a new row at the end of the table for Auto-Load on Startup:
  ```
  | ??? | **Auto-Load on Startup** | Checks `chkAutoLoad` + `TS` availability, calls `loadCharacter()` |
  ```
- Re-number all line ranges in the table to match the actual code after edits.

### 6b. Update `MODULE_TYPES{}` in Key Data Structures

Add `syncState` to the registry object definition (currently line 108-117):

```js
{
  label: 'Text Box',
  renderBody(bodyEl, data, isPlayMode) {},
  onPlayMode(moduleEl, data) {},
  onEditMode(moduleEl, data) {},
  syncState(moduleEl, data) {}              // optional — sync live DOM state to data before save
}
```

### 6c. Add Save Schema to Key Data Structures

After the `wizardState` section (currently line 120-124), add:

```markdown
### Save Blob (JSON schema v1)
Character sheet persistence format, stored via `TS.localStorage.campaign`:
\```js
{
  version: 1,                   // schema version for migrations
  savedAt: '2026-03-21T...',    // ISO timestamp
  moduleIdCounter: 5,           // resume ID generation
  modules: [ /* modules[] array entries */ ]
}
\```
```

### 6d. Add Save/Load event flow

After the Module Deletion flow (currently line 172-181), add:

```markdown
### Saving a Character
\```
saveCharacter() called (manual button or scheduleSave debounce)
  → syncModuleState()
    → iterates .module DOM elements
    → calls MODULE_TYPES[type].syncState() per module (if defined)
  → serializeCharacter() → JSON string with version, modules[], moduleIdCounter
  → TS.localStorage.campaign.setBlob(jsonStr)
\```

### Loading a Character
\```
loadCharacter() called (manual button or auto-load on startup)
  → TS.localStorage.campaign.getBlob()
  → deserializeCharacter(jsonStr)
    → JSON.parse → migrateData(blob)
    → clears existing modules from DOM and modules[]
    → restores moduleIdCounter
    → iterates saved modules, calls renderModule() for each
    → updateEmptyState()
\```

### Auto-Save Trigger Points
\```
scheduleSave() called after:
  → module created (btnWizardCreate handler)
  → module deleted (deleteModule)
  → module reordered (SortableJS onEnd)
  → module resized (resize onMouseUp)
  → text content edited (textarea input handler)
  → text color toggled (textColorBtn handler)
  → 2-second debounce → saveCharacter()
\```
```

## Files Modified

- `main.html` — All code changes (save/load functions, auto-save hooks, button wiring, registerModuleType update)
- `_DOCS/ARCHITECTURE.md` — Update JS sections table, key data structures, and event flows as described in Step 6
