# Conditions Module Implementation Plan

## Context
Adding a new "Conditions" module type that lets users track status conditions affecting their character (Blinded, Stunned, Exhaustion, etc.). Follows the same architectural pattern as the Resistances module but with key differences: single flat list instead of 3 columns, game-system template presets with cascading sub-conditions, and toggle/value condition types.

Design decisions captured in `_DOCS/RESPONSES.md` and `_DOCS/SUBMODULES/CONDITIONS.md`.

---

## Files to Modify

| File | Action | Summary |
|------|--------|---------|
| `scripts/module-condition.js` | **CREATE** | Main module implementation (~1200 lines) |
| `main.css` | Edit | Add `.cond-*` styles (~280 lines, after resistance section) |
| `main.html` | Edit | Wizard card + script tag |
| `scripts/module-core.js` | Edit | Toolbar button, wiring, wizard init, overflow menu |
| `scripts/translations.js` | Edit | All `cond.*` i18n keys (~300+ for English) |
| `_DOCS/ARCHITECTURE.md` | Edit | Register new module type in docs |

---

## Data Model

```javascript
// Module content (data.content when type === 'condition')
{
  template: 'custom',       // Game system key: dnd5e|pf2e|coc|vtm|cpred|mothership|sr6|daggerheart|custom
  applied: [],              // Conditions on the character's active list
  staging: [],              // Available conditions pool (not yet applied)
  customConditions: [],     // User-created condition definitions
  sort: { field: 'alpha', dir: 'asc' }  // 'alpha'|'value'|'custom', 'asc'|'desc'
}

// Individual condition entry (in applied[] or staging[])
{
  id: 'cond_<unique>',
  typeKey: 'blinded',       // References predefined or custom key
  type: 'toggle',           // 'toggle' or 'value'
  value: 0,                 // Current value (value-types only; 0 = inactive)
  active: true,             // Toggle state
  description: '...',       // User-editable description (defaults from template)
  maxValue: null            // Optional ceiling (e.g., 6 for Exhaustion)
}

// Custom condition definition (in customConditions[])
{
  key: 'custom_<unique>',
  name: 'My Condition',
  icon: 'skull',
  type: 'toggle',
  description: '',
  maxValue: null,
  subconditions: []          // Custom conditions don't support sub-conditions initially
}
```

---

## Implementation Phases

### Phase 1: Scaffolding & Data
**File:** `scripts/module-condition.js`

1. IIFE wrapper + `generateCondId()` + `ensureCondContent(data)` shape guard
2. `CONDITION_ICON_SVG` — ~20 placeholder icons using basic SVG shapes (eye-off, lock, skull, flame, droplet, etc.). Minimal effort — will be replaced by artist.
3. `CONDITION_TEMPLATES` — Object keyed by template ID with all 8 game systems. Each entry:
   - `nameKey` (i18n), `conditions[]` array of `{ key, nameKey, icon, type, descKey, maxValue, subconditions[] }`
   - Sub-conditions reference other condition keys in the same template
   - Cyberpunk Red and Mothership sub-groups flattened into single arrays
4. Helper functions:
   - `getCondName(item, content)` — resolve display name from template or custom
   - `getCondIconSvg(item, content)` — resolve SVG from icon key
   - `getCondDescription(item, content)` — return user-edited or default description
   - `getTemplateCondDef(typeKey, templateKey)` — lookup predefined condition definition
   - `sortAppliedList(applied, content)` — sort by field/dir; toggles treated as 0/1 for value sort

### Phase 2: Cascading Logic
**File:** `scripts/module-condition.js`

`activateSubconditions(typeKey, content)`:
- Lookup the activated condition's template definition
- For each sub-condition key:
  - Already in applied + active → skip
  - Already in applied + inactive → set active (value-types set value=1)
  - In staging → move to applied with active=true
  - Not found anywhere → create from template definition, add to applied
- No duplicates (check by typeKey)
- One-level recursion with visited-set guard to prevent cycles
- Deactivation is always manual — no auto-deactivation cascade

### Phase 3: Play Mode
**File:** `scripts/module-condition.js`

`renderPlayBody(bodyEl, data)`:
1. Empty state if no applied conditions
2. **Sort header row** (`.cond-sort-header`) — clickable Name/Value columns with direction indicators, matching List module pattern
3. **Applied list** (`.cond-applied-list`) — for each item:
   - Icon + Name span (click → toggle active; if activating, trigger `activateSubconditions`)
   - Value span (value-types only; left-click → increment respecting maxValue; right-click → decrement with floor 0, auto-deactivate at 0; `e.preventDefault()` on contextmenu)
   - Expand button (`.cond-play-expand`) — per-condition, opens expand modal
   - Inactive items get `.inactive` class (dimmed)
   - Tooltip on hover with description

### Phase 4: Expand Modal (Play Mode)
**File:** `scripts/module-condition.js`

`openCondExpandModal(item, content, data, moduleEl)`:
- Fixed centered modal (z-index 150)
- Shows: icon + name header, value editor (if value-type, with +/- buttons respecting max/floor), description textarea (editable), active/inactive toggle, **Remove** button (returns to staging), Close/X button
- Escape to dismiss
- Changes call `scheduleSave()` and re-render

### Phase 5: Edit Mode + Settings Panel
**File:** `scripts/module-condition.js`

`renderEditBody(bodyEl, data)`:
- Same sort header + applied list as play mode, but read-only display (no click interactions)
- Gear button opens settings panel overlay

`openCondSettingsPanel(moduleEl, data)` / `closeCondSettingsPanel(moduleEl, data)`:
- Absolute overlay inside module body (`.cond-settings-panel`, z-index 50) — mirrors `.res-settings-panel`
- **Template selector** dropdown at top — changing triggers warn dialog
- **Applied section** — list of applied conditions with delete button (returns to staging)
- **Staging section** — flex-wrap grid of condition chips, each with small "x" button to permanently delete from pool
- **Create Custom** button at bottom of staging

### Phase 6: SortableJS (Settings Panel)
**File:** `scripts/module-condition.js`

`initCondSettingsSortables(panel, content, data, moduleEl)`:
- Staging grid: `group: { name: 'cond-assign', pull: 'clone', put: false }`, `sort: false`
- Applied list: `group: { name: 'cond-assign', pull: true, put: true }`, sort enabled only when `sort.field === 'custom'`
- `ghostClass: 'cond-ghost'`
- `onAdd` handler: duplicate check → if value-type show value prompt → add to applied → call `activateSubconditions` → `scheduleSave()` → re-render

### Phase 7: Template Switching
**File:** `scripts/module-condition.js`

`handleTemplateChange(newTemplate, content, moduleEl, data, panel)`:
- DOM-built modal (not browser `confirm()`) with 3 buttons:
  - **Replace** — clear applied/staging/customConditions, repopulate from new template
  - **Merge** — keep existing, add new template conditions to staging (skip duplicates by key)
  - **Cancel** — revert selector
- Update `content.template`, `scheduleSave()`, re-render panel

### Phase 8: Value Prompt Modal
**File:** `scripts/module-condition.js`

`showCondValuePrompt(parentEl, defaultValue, maxValue, onConfirm, onCancel)`:
- Fixed centered (z-index 60), numeric input, clamp to 0–maxValue
- Enter to confirm, Escape to cancel

### Phase 9: Custom Condition Wizard
**File:** `scripts/module-condition.js`

`openCondWizard(moduleEl, data, settingsPanel)`:
- Full-screen overlay (z-index 200), mirrors resistance wizard structure
- **Icon grid** — selectable icons from `CONDITION_ICON_SVG`
- **Name input** — required
- **Type toggle** — Toggle vs Value buttons; Value shows optional Max Value input
- **Description textarea** — optional
- Create button → add to `customConditions[]` + `staging[]` → re-render settings → `scheduleSave()`
- No sub-condition configuration for custom conditions

### Phase 10: Registration & Core Integration
**Files:** `scripts/module-condition.js`, `scripts/module-core.js`

Registration (bottom of IIFE):
```javascript
registerModuleType('condition', {
    label: 'type.condition',
    renderBody, onPlayMode, onEditMode, syncState
});
window.openCondSettings = openCondSettingsPanel;
```

module-core.js changes:
- Toolbar: add `.module-cond-settings-btn` gear button (hidden in play mode) — same pattern as resistance (~line 571)
- Wiring: click handler calls `openCondSettings(el, data)` (~line 743)
- Wizard init: set `colSpan: 2`, `rowSpan: null`, default content shape (~line 256)
- Overflow menu: add entry for `.module-cond-settings-btn` (~line 310)
- Play/edit mode toggles: show/hide settings button (~lines 890, 945)

### Phase 11: HTML
**File:** `main.html`

- Wizard card: insert alphabetically as **first** card (Conditions < Health):
  ```html
  <div class="wizard-type-card" data-type="condition">
      <svg ...alert-circle icon...></svg>
      <span class="wizard-type-name" data-i18n="type.condition">Conditions</span>
  </div>
  ```
- Script tag: insert after `module-counters.js` (alphabetical):
  ```html
  <script src="scripts/module-condition.js"></script>
  ```

### Phase 12: CSS
**File:** `main.css` (new section after resistance styles)

Key style blocks with `.cond-*` prefix:
- Sort header row (`.cond-sort-header`, `.cond-sort-header-col`)
- Applied list (`.cond-applied-list`, `.cond-play-item`, `.cond-play-item.inactive`)
- Item parts (`.cond-play-icon`, `.cond-play-name`, `.cond-play-value`, `.cond-play-expand`)
- Settings panel (`.cond-settings-panel` absolute inset 0 z-index 50)
- Staging grid (`.cond-staging-grid`, `.cond-staging-item` with x button)
- Template selector + switch dialog
- Ghost class (`.cond-ghost` — dashed border, transparent bg, 0.4 opacity)
- Value prompt (`.cond-value-prompt` fixed centered z-index 60)
- Wizard overlay (`.cond-wizard-overlay` fixed inset 0 z-index 200)
- Expand modal (`.cond-expand-overlay` fixed centered z-index 150)
- Themed scrollbars on scrollable containers
- `user-select: none` on all UI text

### Phase 13: Translations
**File:** `scripts/translations.js`

- ~25 UI label keys (`cond.moduleSettings`, `cond.emptyState`, `cond.createCustom`, etc.)
- 9 template name keys (`cond.templateDnd5e`, etc.)
- ~120+ condition name keys (`cond.dnd5e.blinded`, etc.)
- ~120+ condition description keys (1-2 sentence summaries)
- English only for initial implementation; other languages fall back to `en`

### Phase 14: Documentation
**File:** `_DOCS/ARCHITECTURE.md`

- Add `module-condition.js` to "Files at a Glance"
- Add to script load order
- Add `'condition'` to MODULE_TYPES registry

---

## Key Behavioral Rules

1. **No duplicates** — a condition typeKey can only appear once in applied, checked on every add
2. **Cascade on activation only** — sub-conditions auto-activate (and auto-add from staging if needed), but deactivation is always manual
3. **Value floor = 0** — decrementing to 0 auto-deactivates but keeps in applied list
4. **Template switch warns** — Replace/Merge/Cancel dialog, never silent
5. **Staging "x" permanently deletes** — removes from pool entirely (custom ones removed from `customConditions` too)
6. **Sort disables reorder** — when alpha/value sort is active, SortableJS manual reorder is disabled

---

## Verification

1. Create a Conditions module from the wizard → appears with empty state
2. Open settings → select D&D 5e template → staging populates with all 14 conditions
3. Drag "Blinded" from staging to applied → appears in applied list
4. Drag "Paralyzed" from staging → Incapacitated auto-adds from staging and activates
5. Switch to play mode → click Blinded name → toggles inactive (dimmed)
6. Click Exhaustion value → increments; right-click → decrements; at 0 → auto-deactivates
7. Click expand button on a condition → modal opens with value/description/remove
8. Switch template from D&D 5e to PF2e → warn dialog → choose Merge → new conditions added
9. Create custom condition via wizard → appears in staging → drag to applied
10. Verify `scheduleSave()` called on every mutation
