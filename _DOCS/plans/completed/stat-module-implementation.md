# Stat Module Implementation Plan

## Context

The Stat module is the keystone submodule type for Character Vault. It displays character attributes (Strength, Dexterity, etc.) as visual stat blocks with values and modifiers, and enables dice rolling directly into TaleSpire. This is the first "real" interactive module type beyond the existing `text` and `hline` types.

**Files to modify:**
- `main.html` — Wizard changes, module type registration, helper functions, dice integration
- `main.css` — Stat block styling, wizard layout sub-option styles
- `translations.js` — i18n keys for all 6 languages
- `_DOCS/ARCHITECTURE.md` — Update code map after implementation

**No changes needed:** `manifest.json` (already has dice API subscription)

---

## Data Model

Each stat module's `content` field stores:
```js
{
  layout: 'large-stat',  // or 'large-modifier' — per-MODULE setting (set in wizard)
  stats: [
    { name: 'Strength', value: 16, modifier: 3, proficient: false, rollable: true },
    ...
  ]
}
```

- **layout** — controls whether the large center element shows raw value or modifier. All stats in the module share this.
- **proficient** — visual-only toggle (no mechanical effect). Shows a dot indicator.
- **rollable** — when true, clicking in Play mode rolls `1d20+modifier`. When false, display-only.

---

## Implementation Phases

### Phase 1: i18n Keys (translations.js)

Add to all 6 language blocks (`en`, `es`, `fr`, `de`, `pt-BR`, `ru`):

| Key | English | Purpose |
|-----|---------|---------|
| `stat.addStat` | Add Stat | Add button title |
| `stat.deleteStat` | Delete Stat | Delete button title |
| `stat.unnamed` | Unnamed | Default name for new stats |
| `stat.rollable` | Rollable | Toggle label in edit mode |
| `stat.proficient` | Proficient | Toggle label in edit mode |
| `stat.check` | Check | Suffix for roll names ("Strength Check") |
| `stat.value` | Value | Input label in edit mode |
| `stat.modifier` | Mod | Input label in edit mode |
| `stat.layoutLabel` | Layout | Wizard sub-option label |
| `stat.largeStat` | Large Stat | Wizard layout option |
| `stat.largeModifier` | Large Modifier | Wizard layout option |

---

### Phase 2: CSS (main.css)

Add `/* -- Stat Module -- */` section. Key elements:

- **`.stat-container`** — flex-wrap horizontal layout, 8px gap
- **`.stat-block`** — 90px wide bordered card, `--cv-bg-raised` background, relative positioning for the secondary element
- **`.stat-rollable`** — pointer cursor, hover highlights border with `--cv-accent`
- **`.stat-name`** — 9px uppercase label at top
- **`.stat-primary`** — 24px bold center value
- **`.stat-secondary`** — 11px pill positioned at bottom-right, overlapping the border (like the reference image's modifier circle)
- **`.stat-proficiency-dot`** — 6px `--cv-accent` circle at top-right
- **Edit mode inputs** — sunken background, accent focus ring, hidden number spinners
- **`.stat-add-btn`** — dashed border, centered plus icon, hover accent
- **`.stat-quick-input`** — inline quick-edit inputs matching stat block sizing
- **`.stat-ghost`** — SortableJS drag ghost (opacity: 0.4)
- **Wizard layout buttons** — two side-by-side preview cards showing "16 / +3" vs "+3 / 16"

---

### Phase 3: Wizard Changes (main.html)

**3A. HTML:**
- Remove `disabled` class and `<span class="coming-soon">` from the stat type card
- Add `#wizard-stat-layout` section between type grid and theme section — two toggle buttons for "Large Stat" vs "Large Modifier" with visual previews

**3B. JS:**
- Extend `wizardState` to include `statLayout: 'large-stat'`
- Update `resetWizard()` to reset layout section
- In type card click handler, toggle `#wizard-stat-layout` visibility (`display` when type is `stat`, hidden otherwise)
- Add click handlers for layout buttons
- In `btnWizardCreate` handler, add `stat` branch:
  ```js
  if (moduleData.type === 'stat') {
      moduleData.content = { layout: wizardState.statLayout, stats: [] };
  }
  ```

---

### Phase 4: Helper Functions (main.html)

Add before the module type registration:

**`formatModifier(mod)`** — returns "+3", "-1", "+0" format

**`renderStatBlock(stat, index, data, isPlayMode)`** — renders a single stat block DOM element:
- **Play mode:** Shows name, primary value, secondary value, proficiency dot. Rollable stats get click → `rollStatCheck()`. All stats support Ctrl+Click → `enterQuickEdit()`.
- **Edit mode:** Shows name input, value/modifier inputs (number), rollable/proficient checkboxes, delete button. All inputs mutate `stat` directly and call `scheduleSave()`. Enter/Escape blurs inputs.

**`initStatSortable(container, data)`** — creates SortableJS instance on the stat container for reordering. Updates `data.content.stats` array order on `onEnd`.

**`rollStatCheck(stat)`** — sends `1d20+modifier` to TaleSpire:
```js
TS.dice.putDiceInTray([{ name: `${stat.name} ${t('stat.check')}`, roll: `1d20${modStr}` }]);
```
*(Exact API shape needs verification against TaleSpire docs)*

**`enterQuickEdit(block, stat, data)`** — Ctrl+Click handler. Replaces primary/secondary elements with inline `<input type="number">`. Focus on primary. Enter/Escape/blur-away commits values and re-renders the stat block in play mode.

---

### Phase 5: Module Type Registration (main.html)

```js
registerModuleType('stat', { label, renderBody, onPlayMode, onEditMode, syncState })
```

- **renderBody** — initializes content if needed, renders all stat blocks via `renderStatBlock()`, appends add button, initializes SortableJS in edit mode
- **onPlayMode / onEditMode** — clears body and re-renders via `renderBody()` (DOM structure differs significantly between modes)
- **syncState** — re-reads edit input values into `data.content.stats` as a safety net (inputs already mutate data directly via event handlers)

---

### Phase 6: refreshModuleLabels Update (main.html)

Add stat-specific label refresh in `refreshModuleLabels()` so the "Add Stat" button title updates on language change.

---

## Implementation Order

Execute sequentially, testing at each step:

1. **translations.js** — All i18n keys (dependency-free)
2. **main.css** — Stat and wizard layout styles (no visual regressions)
3. **main.html (Wizard HTML)** — Enable stat card, add layout sub-option markup
4. **main.html (Wizard JS)** — Wire up wizardState, layout buttons, create handler
5. **main.html (Helpers)** — formatModifier, renderStatBlock, initStatSortable, rollStatCheck, enterQuickEdit
6. **main.html (Registration)** — registerModuleType('stat', ...) with all hooks
7. **main.html (refreshModuleLabels)** — Language-switch label refresh
8. **_DOCS/ARCHITECTURE.md** — Update code map

---

## Verification

1. Open wizard → select Stat → layout sub-option appears. Select "Large Modifier" → switch to Text → layout hides. Switch back to Stat → layout reappears with previous selection.
2. Create a stat module → empty body with "Add Stat" button visible (should be in Edit mode).
3. Click "Add Stat" → "Unnamed" stat block appears with 0/+0.
4. Edit name, value, modifier. Tab cycles between fields. Enter/Escape blurs.
5. Toggle rollable/proficient checkboxes. Proficiency dot appears/disappears.
6. Add multiple stats → they wrap horizontally. Drag to reorder.
7. Delete a stat → block removed.
8. Switch to Play mode → edit controls hidden, stat blocks display values.
9. Click a rollable stat → dice roll sent to TaleSpire (verify in console log).
10. Click a non-rollable stat → nothing happens.
11. Ctrl+Click any stat → inline inputs appear. Edit, press Enter → value updates.
12. Save/load cycle → all stat data persists correctly.
13. Change language → button titles and labels update (stat names stay user-authored).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **SortableJS nesting** (module grid + stat container) | Module drag uses `.module-drag-handle`; stat drag is on whole block inside `.module-body`. No conflict expected. If issues arise, add a grip handle to stat blocks. |
| **Ctrl+Click intercepted by TaleSpire** | Fallback: double-click or long-press. Test in TaleSpire first. |
| **TS.dice API shape uncertainty** | Use `putDiceInTray([{name, roll}])` as best guess. Verify against docs. Wrap in try/catch with console warning. |
| **Content type mismatch on load** | Guard in `renderBody`: if `content` is string or falsy, initialize to `{ layout: 'large-stat', stats: [] }`. |
