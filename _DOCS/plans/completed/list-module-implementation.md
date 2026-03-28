# Implementation Plan: List Module

## Context
The List module is a new submodule type for Character Vault — flexible, attribute-extensible item lists for tracking inventory, equipment, consumables, etc. Design spec: `_DOCS/SUBMODULES/LIST.md`. This is the most complex module type to date, so we break it into 7 phases, each testable independently.

---

## Files Overview

| File | Action |
|---|---|
| `scripts/module-list.js` | **NEW** — all list module logic (~800-900 lines total) |
| `main.html` | Enable wizard card, add script tag, add inspect overlay HTML |
| `scripts/module-core.js` | Wizard creation defaults, toolbar buttons, overflow menu entries, mode switching |
| `scripts/translations.js` | ~25 new `list.*` keys across all 7 languages |
| `main.css` | ~400 lines of list-specific styles |

---

## Phase 1: Skeleton Registration + Empty State

**Goal:** List appears in wizard, creates an empty module on the grid, round-trips through save/load.

### `scripts/module-list.js` (NEW)
- IIFE wrapping everything
- ID generators: `generateListId()` using `Date.now().toString(36) + Math.random().toString(36).slice(2,6)` — avoids needing a persisted counter
- `registerModuleType('list', { label, renderBody, onPlayMode, onEditMode, syncState })`
- `renderBody`: content guard ensuring shape `{ attributes: [], items: [], sortBy: null, sortDir: 'asc' }`, renders empty state message when no items
- `onPlayMode` / `onEditMode`: re-call `renderBody` with appropriate mode flag
- `syncState`: placeholder (populated in Phase 2)

### `main.html`
- Line 147: remove `disabled` class from `<div class="wizard-type-card disabled" data-type="list">`
- Between `module-spacer.js` and `app.js` script tags: add `<script src="scripts/module-list.js"></script>`

### `scripts/module-core.js`
- After the `stat` type block (~line 242), add list creation defaults:
  ```js
  if (moduleData.type === 'list') {
      moduleData.colSpan = 2;
      moduleData.rowSpan = 2;
      moduleData.content = { attributes: [], items: [], sortBy: null, sortDir: 'asc' };
  }
  ```
- In `renderModule()` header HTML (~line 537): add conditional toolbar buttons for list type:
  - `.module-list-additem-btn` (Add Item, edit mode only)
  - `.module-list-manage-btn` (Manage Attributes, edit mode only)
- In button event wiring section (~line 554): add click handlers that delegate to functions in `module-list.js`
- In `btnDefs` array (~line 282): add overflow menu entries for the two list buttons
- In `applyPlayMode()` (~line 754): hide list toolbar buttons
- In `applyEditMode()` (~line 798): show list toolbar buttons

### `scripts/translations.js`
Add keys to all 7 language blocks:
- `type.list`, `list.addItem`, `list.manageAttrs`, `list.emptyState`, `list.itemName`, `list.notes`, `list.save`, `list.close`, `list.discardPrompt`, `list.removeAttrConfirm`, `list.pinnedLabel`, `list.attrWizardTitle`, `list.attrName`, `list.attrType`, `list.attrIcon`, `list.attrDefault`, `list.attrTypeToggle`, `list.attrTypeNumber`, `list.attrTypeNumberPair`, `list.attrTypeText`, `list.presetWeight`, `list.presetDurability`, `list.presetEquipped`, `list.presetActive`, `list.presetBroken`, `list.presetConsumable`, `list.createCustom`

### `main.css`
- New section `/* ── List Module ── */`
- `.list-container` — flex column layout, `overflow-y: auto` for scroll
- `.list-empty-state` — centered message, muted text

### Verify
- Open wizard → "List" card is selectable → create → 2-col module on grid with empty state message
- Toggle play/edit mode → no errors
- Save, reload → module persists with empty content

---

## Phase 2: Item CRUD + Basic Rendering

**Goal:** Add, name, and delete items. Items render as rows.

### `scripts/module-list.js`
- `renderListItems(container, data, isPlayMode)` — builds item rows
- `addListItem(data)` — pushes new item `{ id, name: '', notes: '', order, values: {} }`, re-renders, `scheduleSave()`
- `deleteListItem(data, itemId)` — removes item, re-renders, `scheduleSave()`
- **Play mode rows:** item name as text span + expand button (placeholder for Phase 6)
- **Edit mode rows:** drag handle (placeholder) + name input + delete button
- Name input wires `input` → update `item.name` → `scheduleSave()`
- `syncState`: reads all name inputs back into data

### `main.css`
- `.list-item-row` — flex row, padding, border-bottom
- `.list-item-name` / `.list-item-name-input`
- `.list-item-delete-btn` — icon button, danger hover
- `.list-item-expand-btn` — icon button, far right

### Verify
- Edit mode → click Add Item → row appears with empty name input
- Type names → persist after save/load
- Delete items → gone
- Play mode → names display as read-only text

---

## Phase 3: Drag-to-Reorder Items

**Goal:** Drag handles reorder items in edit mode. Disabled when sorted.

### `scripts/module-list.js`
- `initListSortable(container, data)` — SortableJS on `.list-items-container`, handle: `.list-item-drag-handle`
- `onEnd`: reorder `data.content.items` array, update `order` values, `scheduleSave()`
- Only initialize when `data.content.sortBy === null`
- Store sortable instance on `container._sortable` for cleanup

### `main.css`
- `.list-item-drag-handle` — cursor grab, braille icon
- `.list-item-ghost` — opacity 0.4

### Verify
- Add 3+ items → drag handle to reorder → order persists after save/load
- Order survives mode toggle

---

## Phase 4: Manage Attributes Panel + Built-in Presets

**Goal:** Toolbar button opens attribute management. Add/remove preset attributes. Toggle pinning.

### `scripts/module-list.js`
- `LIST_ATTR_PRESETS` constant — 6 built-in presets with type, icon key, default value, `builtIn: true`
- `openManageAttrsPanel(moduleEl, data)` — renders panel as child of `.module-body` (position absolute, z-50, similar to health action overlay)
  - Lists current attributes with: name, type badge, pin toggle, delete button
  - "Add Preset" section: buttons for each preset not yet in the list
  - "Create Custom" button (placeholder, wired in Phase 6)
  - Close button
- `closeManageAttrsPanel(moduleEl)` — removes panel, re-renders list body
- Adding an attribute: push to `data.content.attributes`, set default value on all existing items' `values`, `scheduleSave()`
- Removing an attribute: confirm prompt, then splice from `attributes`, delete from all items' `values`, `scheduleSave()`
- Pin toggle: flip `attr.pinned`, `scheduleSave()`

### `main.css`
- `.list-manage-panel` — absolute, inset 0, z-50, background, scrollable
- `.list-attr-row` — flex row for each attribute
- `.list-attr-pin-btn` — toggle icon (pinned/unpinned state)
- `.list-attr-preset-btn` — button for adding presets

### Verify
- Edit mode → Manage Attributes → add "Weight" → all items gain weight column
- Add "Equipped" → toggle column appears
- Remove attribute → confirm → values gone from all items
- Pin/unpin → attribute visibility changes in play mode
- Save/load preserves attribute config

---

## Phase 5: Attribute Display, Inline Editing, Sort-by-Column

**Goal:** Pinned attributes show as columns. Column headers sort. All 4 attribute types render and edit correctly.

### `scripts/module-list.js`
- `renderColumnHeaders(container, data)` — "Name" + one column per pinned attribute, sort indicator icon
- `getSortedItems(content)` — returns items in sort order (manual uses `item.order`, attribute sort compares by type)
- Per-type play-mode renderers:
  - `toggle`: small checkbox (read-only in play mode)
  - `number`: numeric text
  - `number-pair`: "current / max" text
  - `text`: truncated text
- Per-type edit-mode renderers:
  - `toggle`: checkbox input
  - `number`: number input
  - `number-pair`: two number inputs with "/" separator
  - `text`: text input
- Sort cycling: click header → asc → click → desc → click → manual (`sortBy: null`). Persisted.
- When sorted, hide drag handles and don't init sortable (from Phase 3)
- Value changes → update `item.values[attrId]` → `scheduleSave()`

### `main.css`
- `.list-header-row` — flex row, sticky top, border-bottom, muted text
- `.list-col-header` — clickable, cursor pointer
- `.list-sort-indicator` — arrow icon, rotates for asc/desc
- `.list-attr-toggle` — small checkbox styling
- `.list-attr-number`, `.list-attr-number-pair`, `.list-attr-text` — inline value styles

### Verify
- Add attributes, set values → columns display correctly
- Click column header → items sort ascending → click again → descending → click again → manual order
- Sort indicator reflects state
- Edit values inline → changes persist
- Drag handles hidden when sorted

---

## Phase 6: Item Inspect Overlay + Attribute Wizard

**Goal:** Expand button opens full item detail modal. Custom attribute creation wizard.

### `main.html`
- Add global overlay container (after delete-confirm-overlay):
  ```html
  <div id="list-inspect-overlay" class="list-inspect-overlay">
      <div class="list-inspect-panel"><!-- populated dynamically --></div>
  </div>
  ```

### `scripts/module-list.js`

**Item Inspect Overlay:**
- `openItemInspect(moduleEl, data, itemId)` — populates `.list-inspect-panel`:
  - Item name input
  - Notes textarea (with `autoResizeTextarea`)
  - All attributes listed with full-width editors (same per-type renderers)
  - [Save] and [Close] buttons, [X] top-right
- On open: deep-clone item state as snapshot (`JSON.parse(JSON.stringify(item))`)
- On Save: copy edited values back to `data.content.items`, `scheduleSave()`, close, re-render
- On Close/X: compare current state to snapshot via `JSON.stringify`. If dirty → show discard confirmation prompt. If clean → close immediately.
- `closeItemInspect()` — hide overlay, clear state

**Attribute Wizard** (embedded in Manage Attributes panel):
- `openAttrWizard(moduleEl, data)` — replaces the preset section in the Manage Attributes panel with:
  - Name text input (required)
  - Type selector (4 radio/button options: toggle, number, number-pair, text)
  - Icon grid (20 SVG icons from `LIST_ICON_LIBRARY` constant, selectable, optional)
  - Default value input (changes based on selected type)
  - [Create] and [Cancel] buttons
- `LIST_ICON_LIBRARY` — object mapping icon keys to inline SVG strings (20 icons from the design doc)
- On Create: validate name not empty, build attribute object `{ id, name, type, icon, defaultValue, pinned: false, builtIn: false }`, push to attributes, apply defaults to all items, close wizard, re-render panel

### `main.css`
- `.list-inspect-overlay` — fixed, inset 0, z-200, backdrop blur, flex center
- `.list-inspect-panel` — max-width ~500px, bg, rounded, padded, scrollable
- `.list-inspect-field` — labeled input rows
- `.list-inspect-actions` — bottom button row
- `.list-inspect-close-x` — top-right close button
- `.list-icon-grid` — grid of icon buttons
- `.list-icon-option` — icon button with selected state

### Verify
- Click expand on item → overlay shows all fields
- Edit name/notes/values → Save → changes persist
- Close without saving → dirty prompt appears → discard works
- Create custom attribute via wizard → appears in attribute list with correct type
- Custom attribute values editable on items

---

## Phase 7: Cross-List Drag Transfer

**Goal:** Drag items between list modules. Auto-reconcile attributes.

### `scripts/module-list.js`
- Modify `initListSortable()` to use SortableJS `group` option:
  ```js
  group: { name: 'list-items', pull: true, put: true }
  ```
- `onAdd(evt)` callback on receiving container:
  1. Read `data-item-id` and `data-module-id` from dragged element
  2. Find source module data and item data
  3. Remove item from source `data.content.items`
  4. Reconcile attributes:
     - Item has attrs not in target → add those attr definitions to target, set defaults on existing target items
     - Target has attrs item lacks → set defaults on the transferred item
     - **Match by `name` + `type`** (not by ID, since IDs are per-list)
  5. Add item to target `data.content.items`
  6. `scheduleSave()` for both modules
  7. Re-render both list modules
- `onRemove(evt)` — cleanup after item leaves (data already handled in `onAdd`)
- Each `.list-item-row` carries `data-item-id` and `data-module-id` attributes for identification
- Cross-list drag works in **both** play and edit modes

### `main.css`
- `.list-drop-target` — highlight border/background when a list is a valid drop target
- `.list-item-row.sortable-drag` — visual feedback during cross-list drag

### Verify
- Two list modules, items in both → drag item from A to B → item moves
- List A has "Weight", List B does not → after transfer, List B gains "Weight" with defaults
- List B has "Equipped", transferred item lacks it → item gets default `false`
- Save/load preserves transferred state
- Works in both play and edit mode

---

## Phase Dependency Graph

```
Phase 1 (Skeleton)
    ↓
Phase 2 (Item CRUD)
    ↓
   ┌┴┐
   3  4    (can be parallel)
   └┬┘
    ↓
Phase 5 (Attributes + Sort)
    ↓
Phase 6 (Overlays + Wizard)
    ↓
Phase 7 (Cross-List Drag)
```

---

## Key Architectural Decisions

1. **ID generation** — `Date.now().toString(36) + random suffix` avoids persisting extra counters. Unique enough for a character sheet.
2. **Manage Attributes panel** — position absolute within `.module-body` (z-50), like health action overlay. Keeps it scoped to the module.
3. **Item Inspect overlay** — global overlay in `main.html` (z-200), like settings/wizard. Needs screen centering, not module-scoped.
4. **Attribute Wizard** — embedded inline in the Manage Attributes panel, not a separate overlay. Simpler flow.
5. **Cross-list drag** — SortableJS `group` option handles cross-container natively. Match attributes by `name + type` on transfer, not by ID.
6. **Sort is display-only** — `items` array always stores manual order via `item.order`. `getSortedItems()` returns a sorted copy for rendering. Manual order preserved even while sorted.
7. **All list JS in one file** — `scripts/module-list.js`, IIFE pattern like other modules.

---

## Critical Files to Reference During Implementation

| File | Why |
|---|---|
| `scripts/module-stat.js` | Closest pattern — has drag-to-reorder, toolbar buttons, complex renderBody |
| `scripts/module-health.js` | Overlay pattern (health action overlay) |
| `scripts/module-core.js` | Wizard defaults (~line 214-242), toolbar HTML (~line 536-542), button handlers (~line 554-640), mode switching (~line 742-829), overflow menu (~line 282-289) |
| `main.html` | Wizard card (line 147), script tags (~line 255-261), overlay containers |
| `scripts/translations.js` | All language blocks for new keys |
| `main.css` | Module-specific CSS patterns, overlay styles, z-index layers |
