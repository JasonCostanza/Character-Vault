# Spacer

## Summary
The Spacer is a blank, contentless module whose sole purpose is to occupy grid space. It allows users to create empty gaps in their layout — pushing other modules rightward or leaving deliberate blank areas for creative freedom. In **Edit** mode the spacer is visible as a dashed outline with minimal controls; in **Play** mode it becomes completely invisible while still occupying its grid cells.

## Module Type Registration
Registered via `registerModuleType('spacer', { ... })` in `scripts/module-spacer.js`. The registration provides:

| Hook | Behavior |
|---|---|
| `label` | `'type.spacer'` — i18n key, resolves to "Spacer" in English |
| `renderBody(bodyEl, data, isPlayMode)` | Renders a `.spacer-controls` div with drag handle, label, and delete button. Hidden in play mode. Wires up the delete button to `openDeleteConfirm()`. |
| `onPlayMode(moduleEl, data)` | Hides `.spacer-controls` (`display: none`) |
| `onLayoutMode(moduleEl, data)` | Shows `.spacer-controls` (`display: ''`) |

No `syncState` hook is needed — the spacer has no user-editable content to persist.

**Note:** The spacer does **not** use the standard `.module-header` toolbar at all — it is hidden via CSS. All controls (drag, label, delete) are rendered inline within `.module-body` by `renderBody()`.

## Data Model
The Spacer uses the shared `moduleData` object from the `modules[]` array with no type-specific fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | `''` | Unused — always empty |
| `theme` | `null` | `null` | No theme color (transparent background) |
| `colSpan` | `number` | `1` | Grid columns occupied (1–4) |
| `rowSpan` | `number` | `1` | Grid rows occupied (fixed height) |

All other fields (`id`, `type`, `order`, `title`, `textLight`) are part of the shared module shell.

## Layout Mode
- The standard `.module-header` is hidden via CSS (`display: none !important`) since the spacer needs no title, text color toggle, or type-specific buttons.
- Instead, `.spacer-controls` renders inline in the `.module-body`:
  - **Drag handle** (`.spacer-drag-handle.module-drag-handle`) — braille character `⠇`, recognized by SortableJS for drag-and-drop reordering
  - **Label** (`.spacer-label`) — muted "Spacer" text so the module is identifiable
  - **Delete button** (`.spacer-delete-btn`) — X icon, opens the shared delete confirmation dialog
- The module has a **dashed border** (`1px dashed var(--cv-border)`) with a transparent background so it's clearly distinguishable from content modules.
- The standard **resize handle** is present (the spacer is not excluded like `hline`), allowing users to resize the spacer to span 1–4 columns and any number of rows.

## Play Mode
- `.spacer-controls` is hidden (`display: none`).
- CSS rule `.mode-play .module[data-type="spacer"]` makes the module visually invisible:
  - `background: transparent`
  - `border-color: transparent`
  - `box-shadow: none`
  - `pointer-events: none` — prevents accidental clicks on invisible space
- The module element retains its `grid-column: span N` and explicit pixel height, so it continues to occupy grid space and push neighboring modules aside.
- The resize handle is already hidden in play mode by the shared `applyPlayMode()` logic.

## Wizard Integration
- A new type card appears in the wizard `.wizard-type-grid` with a **dashed rectangle** SVG icon (communicating "empty/placeholder space").
- When the Spacer type is selected, the **theme picker section is hidden** (same behavior as Horizontal Line) since the spacer has no visible surface to color.
- On creation, defaults to `colSpan: 1`, `rowSpan: 1` — the smallest possible footprint. Users resize to the desired blank area.

## CSS Classes
| Class | Element | Purpose |
|---|---|---|
| `.spacer-controls` | `<div>` | Container for layout-mode controls (drag, label, delete) |
| `.spacer-drag-handle` | `<span>` | Drag handle for SortableJS reordering |
| `.spacer-label` | `<span>` | Muted label text identifying the module as a spacer |
| `.spacer-delete-btn` | `<button>` | Delete button — opens shared delete confirmation |

## Style
- The spacer uses `--cv-border` for its dashed layout-mode outline and `--cv-text-muted` for all control text/icons.
- No theme color tokens are used since the spacer is always transparent.
- The delete button highlights with `--cv-danger` on hover.
- All text within the spacer controls is `user-select: none`.

## Adding a Spacer
When a new Spacer is created through the wizard, it defaults to:
- Empty content (`''`)
- 1-column span, 1-row span
- No theme color (`null`)
- Transparent background with dashed border (layout mode only)
