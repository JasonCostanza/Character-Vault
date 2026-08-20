# Text Box

## Summary
The Text Box is a free-form rich-text submodule for notes, descriptions, backstory, session logs, or any other prose content. It always displays rendered Markdown; editing happens through a dedicated modal opened from the module's overflow menu.

## Module Type Registration
Registered via `registerModuleType('text', { ... })` in `scripts/module-text.js`. The registration provides:

| Hook | Behavior |
|---|---|
| `label` | `'type.text'` — i18n key, resolves to "Text Box" in English |
| `renderBody(bodyEl, data)` | Builds `.module-text-display`, renders resolved Markdown into it, wires the dice-token tooltip and re-render-on-stat-change listeners, attaches checkbox handlers |
| `overflowMenuItems(moduleEl, data)` | Returns Edit Content, Module Settings (via `openSimpleSettingsModal`), and Copy to Clipboard entries |

## Data Model
Text Box uses the shared `moduleData` object from the `modules[]` array. The only type-specific field is:

| Field | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | `''` | Raw Markdown text entered by the user |

All other fields (`id`, `type`, `colSpan`, `rowSpan`, `order`, `theme`, `textLight`) are part of the shared module shell.

## Display
- `.module-text-display` shows content rendered through `renderResolvedWithSpans()`, which resolves `${...}` dice-variable tokens to hoverable `.cv-resolved-token` spans before handing off to `renderMarkdown()` (in `shared.js`).
- Re-renders on the `cv:stat-values-changed` document event so resolved token values stay current.
- Interactive Markdown task-list checkboxes are wired via `attachCheckboxHandlers(displayEl, data, moduleEl)` (in `shared.js`) — toggling one updates the raw Markdown source (`data.content`) via `toggleCheckboxInMarkdown()`, then re-renders and saves.

## Edit Modal — `openTextEditModal(moduleEl, data)`
Opened from the module's overflow menu ("Edit Content"). Standard `.cv-modal-overlay` / `.cv-modal-panel` structure:
- **Body**: a single `.cv-modal-input.text-edit-textarea` (the shared modal input style extended with `resize: vertical` and a themed scrollbar; min-height 240px) pre-filled with `data.content`. The dice-variable picker (`attachDiceVariablePicker`) is attached to it.
- **Footer**: `[Cancel]` / `[Save]`, plus the standard top-right `[X]`.
- **Save**: writes the textarea value to `data.content`, calls `scheduleSave()`, and re-renders `.module-text-display` directly (no full module re-render needed).
- **Discard guard**: Escape, `[X]`, `[Cancel]`, or click-outside all route through `doClose()`, which compares the textarea's current value against the snapshot taken at open time. If changed, `showConfirm()` prompts before discarding (per the modal standard in `CLAUDE.md` rule 15).

## Markdown Rendering Support
The display div supports full Markdown rendering with styled output for:
- **Headings** (h1-h6) — scaled font sizes from 1.4em down to 0.85em
- **Paragraphs** — compact margins (0.3em)
- **Links** — accent-colored with underline, open in new tab
- **Lists** (ordered and unordered) — indented with 1.5em padding
- **Task lists** — interactive checkboxes (see above)
- **Blockquotes** — left accent border, sunken background, italic styling
- **Inline code** — sunken background, monospace font
- **Code blocks** (`pre > code`) — bordered sunken container with horizontal scroll
- **Horizontal rules** — subtle border line
- **Tables** — full-width, collapsed borders, header row with sunken background
- **Images** — max-width 100%, rounded corners

First and last child elements have their top/bottom margins removed to keep spacing tight within the module.

## Module Toolbar
The Text Box toolbar contains the shared chrome only (hover-revealed drag handle, title, overflow menu). All actions live in the overflow menu:
- **Edit Content** — opens the text editing modal
- **Module Settings** — opens `openSimpleSettingsModal` for icon/color/text-light settings
- **Copy to Clipboard** — copies `data.content` (raw Markdown) to the clipboard via `navigator.clipboard.writeText()`

## CSS Classes
| Class | Element | Purpose |
|---|---|---|
| `.module-text-display` | `<div>` | Rendered Markdown output — inherits color, word-wrap enabled |
| `.cv-modal-input` | `<textarea>` (modal) | Shared modal input/textarea style (also used by single-line modal inputs); resizable + themed scrollbar when applied to a `<textarea>` |
| `.text-edit-textarea` | `<textarea>` (modal) | Sizing override — `min-height: 240px` |

## Style
- `.module-text-display` has `padding: 8px`, `font-size: 13px`, `line-height: 1.5`
- Background is transparent so the module's theme color shows through
- All Markdown element styles use `--cv-*` color tokens (accent, text-secondary, bg-sunken, border, border-subtle)

## Adding a Text Box
When a new Text Box is created through the wizard, it defaults to:
- Empty content (`''`)
- 2-column span, 2-row span
- The wizard's selected theme color (or `null` for the default module color)

## Key Functions (in `module-text.js`)

| Function | Purpose |
|---|---|
| `renderResolvedWithSpans(content)` | Resolves `${...}` dice-variable tokens to hoverable spans, then renders through `renderMarkdown()` |
| `attachTokenTooltips(displayEl)` | Wires hover tooltips for resolved dice-variable spans |
| `openTextEditModal(moduleEl, data)` | The content edit modal (see above) |

Markdown rendering (`renderMarkdown`) and checkbox handling (`attachCheckboxHandlers`, `toggleCheckboxInMarkdown`) live in `shared.js`.
