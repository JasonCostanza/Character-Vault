# Spacer Module Implementation Plan

## Context

Modules in Character Vault are laid out in a 4-column CSS Grid with auto-flow, meaning they always left-justify. Users have no way to create empty space in the middle of their layout. A **Spacer module** — a blank, invisible-in-play module — lets users push other modules rightward or create gaps for creative layout freedom. This is far simpler than the alternative (free-positioning), which would require rewriting the entire grid/drag-and-drop system.

## Approach

Add a new `'spacer'` module type following the `hline` pattern: hide the standard module header, render minimal inline controls (drag handle + delete button) in the body, and make it completely invisible in play mode while still occupying grid space.

## Design Document

`_DOCS/SUBMODULES/SPACER.md` — Full submodule spec (already written).

## Files to Change

### 1. NEW: `scripts/module-spacer.js`

Register `'spacer'` via `registerModuleType()`:
- **`renderBody`**: Render a `.spacer-controls` div containing a drag handle (`.module-drag-handle` for SortableJS), a muted "Spacer" label, and an X delete button. Hidden in play mode.
- **`onPlayMode`**: Hide `.spacer-controls`
- **`onEditMode`**: Show `.spacer-controls`
- No `syncState` needed (no content to persist)

### 2. `main.html`

- Add wizard type card in `.wizard-type-grid` (before the disabled "list" card):
  - Icon: dashed rectangle SVG (`stroke-dasharray="4 3"` on a `<rect>`)
  - Label: `data-i18n="type.spacer"`
- Add `<script src="scripts/module-spacer.js"></script>` after `module-hr.js`

### 3. `scripts/module-core.js`

- **Create handler** (~line 196): Add spacer defaults block:
  ```js
  if (moduleData.type === 'spacer') {
      moduleData.colSpan = 1;
      moduleData.rowSpan = 1;
      moduleData.theme = null;
  }
  ```
- **Wizard theme section**: Update two conditions (in `resetWizard()` and the type-card click handler) to hide the theme picker for spacer:
  ```js
  type === 'hline'  →  type === 'hline' || type === 'spacer'
  ```

### 4. `main.css`

Add after the Horizontal Line Module section:
- `.module[data-type="spacer"] .module-header` — `display: none !important`
- `.module[data-type="spacer"]` — `background: transparent; border: 1px dashed var(--cv-border)`
- `.spacer-controls` — flex row with drag handle, label, delete button (muted styling)
- `.mode-play .module[data-type="spacer"]` — `border-color: transparent; box-shadow: none; pointer-events: none` (invisible but space-occupying)

### 5. `translations.js`

Add `'type.spacer'` key to all 7 language blocks (en, es, fr, de, it, pt-BR, ru).

## Why This Works

- **Resize handle**: `renderModule()` adds a resize handle for all non-hline types, so spacer gets it automatically
- **Drag-and-drop**: The inline `.module-drag-handle` class is what SortableJS uses — zero extra wiring
- **Grid space**: In play mode, the module element keeps its `grid-column: span N` and explicit pixel height. Only the visual styling goes transparent.
- **Persistence**: Serializes like any module (`type: 'spacer'`, `content: ''`, `theme: null`). No migration needed for existing saves.
- **Height snapping**: `rowSpan: 1` (not null) means fixed height — `snapModuleHeight` skips it, which is correct.

## Verification

1. Open TaleSpire with the Character Vault DEV symbiote
2. Enter edit mode, click "New Module"
3. Verify the Spacer card appears in the wizard type grid with a dashed-rectangle icon
4. Verify the theme section hides when Spacer is selected
5. Create a spacer — confirm it appears as a small (1x1) dashed-border box
6. Resize the spacer — confirm colSpan/rowSpan update correctly
7. Drag the spacer between other modules — confirm reordering works
8. Delete the spacer via the X button — confirm delete confirmation and removal
9. Switch to play mode — confirm the spacer becomes completely invisible (no border, no background) but other modules remain offset by the space it occupies
10. Save and reload — confirm the spacer persists and loads correctly
