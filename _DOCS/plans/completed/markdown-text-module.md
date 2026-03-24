# Plan: Markdown Rendering in Text Box Module

## Context

Text Box modules currently display plain text in Play mode (newlines converted to `<br>`). Users want to write formatted notes using Markdown — headings, bold, lists, code blocks, etc. In Edit mode they see raw markdown; in Play mode they see rendered output.

---

## Approach

### 1. Add CDN Libraries (`main.html` `<head>`, line 8)

Two new script tags after SortableJS:

- **marked.js** v15.0.7 (~40KB) — fast, lightweight markdown parser
- **DOMPurify** v3.2.5 (~18KB) — XSS sanitization for rendered HTML

```html
<script src="https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.2.5/dist/purify.min.js"></script>
```

### 2. Add Helper Function & Config (`main.html`, near `escapeHtml`)

```js
// Configure marked: breaks=true so single newlines become <br> (matches previous behavior)
// Links open in new tab to avoid navigating away from the symbiote
const renderer = new marked.Renderer();
renderer.link = function({ href, title, text }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;
};
marked.setOptions({ renderer, breaks: true });

function renderMarkdown(raw) {
    const html = marked.parse(raw || '');
    return DOMPurify.sanitize(html);
}
```

### 3. Modify Text Module Registration (`main.html`, lines 596–633)

**`onPlayMode`** — replace `escapeHtml(...).replace(/\n/g, '<br>')` with `renderMarkdown()`:

```js
onPlayMode(moduleEl) {
    const textarea = moduleEl.querySelector('.module-textarea');
    const display = moduleEl.querySelector('.module-text-display');
    if (textarea && display) {
        display.innerHTML = renderMarkdown(textarea.value);
        textarea.style.display = 'none';
        display.style.display = 'block';
    }
},
```

**`renderBody`** — add initial markdown render when `isPlayMode` is true on first load:

```js
if (isPlayMode) {
    const display = bodyEl.querySelector('.module-text-display');
    display.innerHTML = renderMarkdown(data.content);
}
```

**`onEditMode`** — no changes needed.

### 4. CSS Changes (`main.css`)

**Modify `.module-text-display`** (line 769): Remove `white-space: pre-wrap` — markdown block elements handle their own whitespace.

**Add scoped markdown styles** after `.module-text-display`, before the resize handle section. All colors use `--cv-*` tokens (works in both themes automatically):

- **Headings** (h1–h6): scaled font sizes, tight margins
- **Paragraphs**: compact margins
- **Links**: `--cv-accent` color, underlined, hover state
- **Lists** (ul/ol): indented, compact spacing
- **Blockquotes**: left accent border, `--cv-bg-sunken` background, italic
- **Inline code**: `--cv-bg-sunken` background, monospace, rounded
- **Code blocks** (`pre`): `--cv-bg-sunken` background, `--cv-border-subtle` border, horizontal scroll
- **Horizontal rules**: `--cv-border` color
- **Tables**: collapsed borders, `--cv-border`, header with `--cv-bg-sunken`
- **Images**: `max-width: 100%`, rounded corners
- **First/last child**: remove extra top/bottom margins

---

## Files to Modify

| File | Changes |
|---|---|
| `main.html` | Add 2 CDN `<script>` tags, add `renderMarkdown()` helper + marked config, update text module `onPlayMode` and `renderBody` |
| `main.css` | Update `.module-text-display`, add ~80 lines of scoped markdown styles |

## Security

- **DOMPurify** sanitizes all rendered HTML — strips `<script>`, event handlers, `javascript:` URIs
- Pipeline: raw text → `marked.parse()` → `DOMPurify.sanitize()` → `innerHTML`
- `escapeHtml()` in textarea initial value remains unchanged (protects textarea element)

## Edge Cases

- **Empty content**: `marked.parse('')` returns `''` — display div is simply empty
- **Copy button**: Still copies raw markdown from `textarea.value` / `data.content` — no change needed
- **Links**: Forced to `target="_blank"` via custom renderer to prevent navigating away from symbiote

## Verification

1. Add a Text Box module, type markdown with headings, **bold**, *italic*, lists, `code`, blockquotes, links, tables
2. Toggle to Play mode — confirm rendered output looks correct
3. Toggle back to Edit mode — confirm raw markdown is preserved
4. Test in both dark and light themes
5. Test XSS: type `<script>alert('xss')</script>` — confirm it's sanitized
6. Test empty module and module with only whitespace
