# Resistance Module Implementation Plan

## Context

The user wants to implement the Resistances submodule as specified in `_DOCS/SUBMODULES/RESISTANCES.md`. This module displays character damage resistances across 3 categories (Immunities, Resistances, Weaknesses) with a staging area for assignment, drag-and-drop via SortableJS, a creation wizard for custom types, and a layout toggle for columns vs rows orientation.

## Confirmed Decisions

1. **Inline SVG icons** for all 13 pre-defined resistance types (no emoji)
2. **Toolbar gear button** opens Module Settings panel (staging area)
3. **SortableJS drag-to-assign** from staging area into column drop zones
4. **Resistance-specific icon set** (13 damage-type SVGs)
5. **Layout toggle button** switches 3 categories between columns (side-by-side) and rows (stacked)
6. **Items removed from staging** when assigned (not cloned)
7. **Value prompt only on drop** into a different column; Immunity auto-sets "Immune"
8. **No prompt** when dropping back into the same column

## Content Data Shape

```js
{
    layout: 'columns',       // 'columns' | 'rows'
    immunities: [],          // assigned resistance objects
    resistances: [],         // assigned resistance objects
    weaknesses: [],          // assigned resistance objects
    customTypes: []          // user-created type definitions
}

// Assigned resistance object:
{ id, typeKey, value, active: true }

// Custom type definition:
{ key, name, icon }
```

## Files to Modify (in order)

### 1. `scripts/translations.js`
- Add `'type.resistance': 'Resistances'` alphabetically in type labels (all 7 langs)
- Add `res.*` keys: moduleSettings, toggleLayout, immunities, resistances, weaknesses, valuePrompt, immune, emptyState, availableTypes, createCustom, wizardTitle, wizardName, wizardIcon, wizardCreate, wizardCancel, close, deleteItem, ok, cancel, and all 13 type names

### 2. `scripts/module-resistance.js` (NEW)
- IIFE wrapper with `'use strict'`
- `PREDEFINED_RESISTANCE_TYPES[]` — 13 entries with `key` and `nameKey`
- `RESISTANCE_ICON_SVG{}` — 13 inline SVG strings (acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder)
- `ensureResContent(data)` — content shape guard
- `generateResId()` — ID generation
- Helper functions: `getResName()`, `getResIcon()`, `getAssignedKeys()`, `getAvailableTypes()`
- `renderPlayBody(bodyEl, data)` — 3 columns/rows with clickable toggle items, tooltips
- `renderEditBody(bodyEl, data)` — same layout but non-interactive display
- `openResSettingsPanel(moduleEl, data)` — absolute overlay with:
  - 3 column drop zones (SortableJS group `'res-assign'`)
  - Staging area grid (SortableJS source, items removed on assign)
  - "Create Custom" button
- `showResValuePrompt()` — inline prompt for value entry on drop
- `openResWizard()` — full-screen overlay (z-index 200) with icon grid + name input
- `registerModuleType('resistance', { ... })`
- Expose `window.openResSettings` for module-core.js

### 3. `scripts/module-core.js`
- **Creation defaults** (~line 244): `colSpan: 2, rowSpan: null`, content shape init
- **Toolbar buttons** in `renderModule()` (~line 545): settings gear + layout toggle
- **Event handlers** (~line 670): wire up settings and layout buttons
- **Overflow menu** `btnDefs` (~line 288): add 2 entries
- **applyPlayMode()** (~line 790): hide both resistance buttons
- **applyEditMode()** (~line 840): show both resistance buttons

### 4. `main.html`
- **Wizard type card**: Insert between "List" and "Spacer" (shield icon)
- **Script tag**: `<script src="scripts/module-resistance.js"></script>` before `module-list.js`

### 5. `main.css`
New section `/* ── Resistance Module ── */` after List Inspect Overlay, before Toast:
- Play mode container (columns/rows layouts)
- Play mode items (icon display, active/inactive states, hover tooltips)
- Edit mode container
- Empty state
- Settings panel (absolute overlay, header, body, columns, drop zones)
- Staging area (grid of available types)
- Value prompt (inline overlay)
- SortableJS ghost class
- Creation wizard (full-screen overlay, icon grid, name input, footer)
- Responsive: xs/sm adjustments

### 6. `_DOCS/ARCHITECTURE.md`
- Add `module-resistance.js` to Files at a Glance table
- Update script load order
- Add resistance content shape to Key Data Structures
- Add `resistance` to registered types list

## SortableJS Strategy

- Staging area: `group: { name: 'res-assign', pull: 'clone', put: false }`, `sort: false`
- Column drop zones: `group: { name: 'res-assign', pull: true, put: true }`, `sort: true`
- On `onAdd`: detect source (staging vs other column), prompt for value if column changed, auto-set "Immune" for immunity column, remove from staging DOM, re-sort alphabetically, re-render
- Cancel flow: if value prompt cancelled, reverse the move

## Key Patterns to Follow

- Health module for toolbar buttons + action overlay pattern
- List module's manage panel for settings panel overlay
- List module's attribute wizard for creation wizard
- All `--cv-*` color tokens, no hardcoded hex
- `escapeHtml()` for user strings, `t()` for UI text
- `scheduleSave()` after every mutation
- `snapModuleHeight()` after re-renders
- `user-select: none` on all non-content text

## Verification

1. Create a Resistances module via wizard — verify it appears with empty state
2. Open Module Settings, verify staging area shows all 13 pre-defined types
3. Drag a type to Immunity column — verify value auto-sets to "Immune", item removed from staging
4. Drag a type to Resistance column — verify value prompt appears
5. Move item between columns — verify prompt on column change, no prompt on same-column
6. Delete item from column — verify it reappears in staging
7. Create Custom resistance — verify it appears in staging
8. Toggle layout button — verify columns vs rows orientation
9. Switch to Play mode — verify hover tooltips, click toggle active/inactive
10. Save and reload — verify all state persists
11. Test at xs/sm sizes — verify overflow menu works
