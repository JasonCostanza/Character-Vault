# Text Box

## Summary
The Text Box is a free-form rich-text submodule for notes, descriptions, backstory, session logs, or any other prose content. In **Edit** mode the user writes raw Markdown in a textarea; in **Play** mode the Markdown is rendered to styled HTML. It is currently the only registered module type (`'text'`).

## Module Type Registration
Registered via `registerModuleType('text', { ... })` (main.html lines 610-652). The registration provides:

| Hook | Behavior |
|---|---|
| `label` | `'Text Box'` -- displayed in the module header and wizard |
| `renderBody(bodyEl, data, isPlayMode)` | Builds both the textarea and the display div; wires up the `input` listener; auto-sizes the textarea |
| `onPlayMode(moduleEl)` | Hides the textarea, renders Markdown into `.module-text-display`, shows the display div |
| `onEditMode(moduleEl)` | Hides the display div, shows the textarea, re-runs auto-resize |

## Data Model
Text Box uses the shared `moduleData` object from the `modules[]` array. The only type-specific field is:

| Field | Type | Description |
|---|---|---|
| `content` | `string` | Raw Markdown text entered by the user. Defaults to `''` |

All other fields (`id`, `type`, `colSpan`, `rowSpan`, `order`, `theme`, `textLight`) are part of the shared module shell.

## Edit Mode
- The textarea (`.module-textarea`) is visible and the display div is hidden.
- Placeholder text reads **"Write your notes..."**.
- On every `input` event the textarea value is written back to `data.content` and `autoResizeTextarea()` is called.
- `autoResizeTextarea()` resets `style.height` to `'auto'` then sets it to `scrollHeight + 'px'`, so the textarea grows with its content without a scrollbar.
- The textarea has no manual resize handle (`resize: none` in CSS); height is purely content-driven.
- On focus, the textarea shows a subtle inset focus ring using `--cv-focus-ring`.

## Play Mode
- The textarea is hidden and `.module-text-display` is shown.
- Content is rendered through the `renderMarkdown(raw)` utility which:
  1. Parses raw Markdown via **Marked** (with `breaks: true` so single newlines become `<br>`)
  2. Uses a custom link renderer that adds `target="_blank"` and `rel="noopener noreferrer"` to all links
  3. Sanitizes the output through **DOMPurify** to prevent XSS

## Markdown Rendering Support
The display div supports full Markdown rendering with styled output for:
- **Headings** (h1-h6) -- scaled font sizes from 1.4em down to 0.85em
- **Paragraphs** -- compact margins (0.3em)
- **Links** -- accent-colored with underline, open in new tab
- **Lists** (ordered and unordered) -- indented with 1.5em padding
- **Blockquotes** -- left accent border, sunken background, italic styling
- **Inline code** -- sunken background, monospace font
- **Code blocks** (`pre > code`) -- bordered sunken container with horizontal scroll
- **Horizontal rules** -- subtle border line
- **Tables** -- full-width, collapsed borders, header row with sunken background
- **Images** -- max-width 100%, rounded corners

First and last child elements have their top/bottom margins removed to keep spacing tight within the module.

## CSS Classes
| Class | Element | Purpose |
|---|---|---|
| `.module-textarea` | `<textarea>` | Edit mode input -- transparent bg, no border, inherits font and color |
| `.module-text-display` | `<div>` | Play mode rendered output -- inherits color, word-wrap enabled |

Placeholder color adapts to the text color mode: white-alpha for dark text modules, black-alpha for `.text-light` modules.

## Style (main.css lines 734-862)
- Both textarea and display share `padding: 8px`, `font-size: 13px`, `line-height: 1.5`
- The textarea has `min-height: 80px` and `flex: 1` so it fills available module height
- Background is transparent so the module's theme color shows through
- All Markdown element styles use `--cv-*` color tokens (accent, text-secondary, bg-sunken, border, border-subtle)

## Adding a Text Box
When a new Text Box is created through the wizard, it defaults to:
- Empty content (`''`)
- 2-column span, 2-row span
- The wizard's selected theme color (or `null` for the default module color)
