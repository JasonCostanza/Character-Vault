# UI Standards

Component-level design specs for Character Vault. Every UI-facing change must follow these rules.

## Text Selection

All UI text must be `user-select: none`. Only user content and interactive elements (inputs, textareas, rendered markdown) opt in with `user-select: text`.

## Icons

**Inline SVG only** — use the curated in-code SVG library (`cvIcon()`) to avoid memory bloat from custom image uploads. The "None" option should sit first in icon pickers.

**Shape preference**: basic shapes (`<line>`, `<circle>`, `<rect>`, `<polyline>`) for simple icons; `<path d="...">` for complex geometry (gears, pencils, etc.).

## Tooltips

Module toolbar buttons must have `title` attributes for custom CSS tooltips (native `title` tooltips don't render in TaleSpire's Chromium). Rightmost buttons need the right-anchored tooltip override (see `.module-delete-btn[title]::after` in `css/modules.css`).

## Drag-to-Reorder

**Use SortableJS for all drag-to-reorder** — never write custom pointer/mouse-based drag systems. SortableJS is already loaded via CDN. Follow the existing pattern: `handle`, `animation: 150`, `ghostClass`, `draggable`, and `onEnd`. See `initStatSortable()` or `initListSortable()` as references.

## Play vs Edit Mode

Play mode is read-only, optimized for simple in-game actions. Edit mode allows structure and data modification. Critical stats/values should support Quick Edit (Ctrl+Click) in Play mode to bypass a full mode switch.

Play and Edit modes must share identical layout structure — no jarring reflows on mode switch.

## Modals & Overlays

Modals must include standard action buttons (`[Save]`/`[Create]`, `[Cancel]`/`[Close]`, and an `[X]` top-right). If editing an existing entity, consider a `[Delete]` button. Always prompt for unsaved changes if the modal is dismissed with edits pending. Values should clamp live during input to prevent invalid states.

Reference: `openSpellInspect()` in `scripts/module-spells.js`.

### Native Dialogs Blocked

`window.confirm()` / `window.alert()` / `window.prompt()` are blocked in TaleSpire's embedded Chromium — they return `false`/`undefined` silently without showing any dialog. Use the custom `showConfirm(message, onConfirm)` DOM dialog pattern instead.

Reference implementations: `showConfirm()` in `scripts/module-counters.js` and `scripts/module-activity.js`. The CSS for the dialog lives under the `/* ── Delete Confirm Overlay ── */` section in `css/modules.css`.

## Scrollbar Styling

Every element that can scroll (any `overflow-y: auto`, `overflow-x: auto`, or `<textarea>`) must have:

1. `scrollbar-gutter: stable;` — prevents layout shift
2. Themed scrollbar styles:
   ```css
   scrollbar-width: thin;
   scrollbar-color: var(--cv-text-muted) transparent;
   ```
3. WebKit rules:
   ```css
   ::-webkit-scrollbar { width: 4px; }
   ::-webkit-scrollbar-track { background: transparent; }
   ::-webkit-scrollbar-thumb { background-color: var(--cv-text-muted); border-radius: 2px; }
   ```

Missing scrollbar theming is a recurring bug — check every scrollable element before finishing a task.

## Textareas

All `<textarea>` elements must use `resize: vertical` (never `none` or `both`) so users can drag taller but not wider. Textareas must also have the full scrollbar styling above.

Reference implementation: `.list-inspect-notes-input` in `css/sub-list.css`.

## Boolean Toggles

All on/off UI controls must use the `.cv-toggle` pattern (hidden input + `.cv-toggle-track` with sliding thumb). Create toggles via `makeCvToggle(checked, onChange)` from `shared.js`. This ensures consistent theming across all six color schemes. Text labels should sit as a sibling span with `.cv-toggle-label` class.

## z-index Layers

| z-index | Usage |
|---|---|
| 300 | Delete confirm overlay |
| 200 | Settings / wizard overlays |
| 100 | Menu bar + dragging module |
| 60 | Resize handle |
| 50 | Resizing module |
