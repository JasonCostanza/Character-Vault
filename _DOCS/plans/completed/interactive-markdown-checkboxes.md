# Plan: Interactive Markdown Checkboxes in Text Box Modules

## Context

Text Box modules render markdown via `marked.parse()` + `DOMPurify.sanitize()`. When users write `- [ ]` task lists, the checkboxes render visually but are non-interactive. Users must switch to Edit mode and manually change `- [ ]` to `- [x]`. This plan makes checkboxes clickable in Play mode, toggling the underlying markdown source so changes persist across mode switches.

**Three root causes:**
1. `DOMPurify.sanitize()` (default config) strips `<input>` elements entirely
2. `marked` adds `disabled` attribute to checkbox inputs
3. No click handler exists to sync checkbox state back to `data.content`

---

## Files to Modify

| File | Lines | What Changes |
|---|---|---|
| `main.html` | ~544–547 | Update `renderMarkdown()` — DOMPurify config + post-processing |
| `main.html` | ~652–679 | Update text module `renderBody` and `onPlayMode` — attach checkbox handlers |
| `main.css` | after ~825 | Add task list checkbox styles |

---

## Implementation

### Step 1: Update `renderMarkdown()` (main.html ~544)

Update the DOMPurify call to allow checkbox inputs:

```js
function renderMarkdown(raw) {
    const html = marked.parse(raw || '');
    return DOMPurify.sanitize(html, {
        ADD_TAGS: ['input'],
        ADD_ATTR: ['type', 'checked', 'disabled']
    });
}
```

### Step 2: Add `attachCheckboxHandlers()` helper (main.html, after `renderMarkdown`)

New function that post-processes a rendered display element:

```js
function attachCheckboxHandlers(displayEl, data) {
    const checkboxes = displayEl.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, index) => {
        cb.removeAttribute('disabled');
        cb.dataset.index = index;
        cb.addEventListener('change', () => {
            toggleCheckboxInMarkdown(data, index, cb.checked);
        });
    });
}
```

### Step 3: Add `toggleCheckboxInMarkdown()` helper (main.html, after above)

Finds the Nth task-list checkbox pattern in the raw markdown and toggles it:

```js
function toggleCheckboxInMarkdown(data, index, checked) {
    const pattern = /- \[([ xX])\]/g;
    let count = 0;
    data.content = data.content.replace(pattern, (match, mark) => {
        if (count++ === index) {
            return checked ? '- [x]' : '- [ ]';
        }
        return match;
    });
    // Also update the textarea if it exists in the DOM
    const moduleEl = document.querySelector('.module-textarea');
    // (sync handled via data.content — textarea picks it up on next Edit mode switch)
}
```

> **Note:** We don't need to find/update the textarea live. `data.content` is the source of truth. When the user switches to Edit mode, `onEditMode` already shows the textarea whose value was set from `data.content` at render time. However, we do need the textarea to reflect the updated content — so we should update `textarea.value` directly if accessible.

**Revised approach** — pass the module element so we can sync the textarea:

```js
function toggleCheckboxInMarkdown(data, moduleEl, index, checked) {
    const pattern = /- \[([ xX])\]/g;
    let count = 0;
    data.content = data.content.replace(pattern, (match, mark) => {
        if (count++ === index) {
            return checked ? '- [x]' : '- [ ]';
        }
        return match;
    });
    const textarea = moduleEl.querySelector('.module-textarea');
    if (textarea) textarea.value = data.content;
}
```

### Step 4: Wire up handlers in text module (main.html ~652–679)

In `renderBody` (when `isPlayMode` is true):
```js
if (isPlayMode) {
    const display = bodyEl.querySelector('.module-text-display');
    display.innerHTML = renderMarkdown(data.content);
    attachCheckboxHandlers(display, data, bodyEl.closest('.module'));
}
```

In `onPlayMode`:
```js
onPlayMode(moduleEl) {
    const textarea = moduleEl.querySelector('.module-textarea');
    const display = moduleEl.querySelector('.module-text-display');
    if (textarea && display) {
        const data = modules.find(m => m.id === moduleEl.dataset.id);
        display.innerHTML = renderMarkdown(textarea.value);
        attachCheckboxHandlers(display, data, moduleEl);
        textarea.style.display = 'none';
        display.style.display = 'block';
    }
}
```

`attachCheckboxHandlers` signature becomes `(displayEl, data, moduleEl)`.

### Step 5: CSS for task list checkboxes (main.css, after line ~825)

```css
/* ── Task List Checkboxes ── */
.module-text-display input[type="checkbox"] {
    appearance: none;
    width: 14px;
    height: 14px;
    border: 2px solid var(--cv-border);
    border-radius: 3px;
    background: var(--cv-bg-sunken);
    vertical-align: middle;
    margin-right: 0.4em;
    cursor: pointer;
    position: relative;
}
.module-text-display input[type="checkbox"]:checked {
    background: var(--cv-accent);
    border-color: var(--cv-accent);
}
.module-text-display input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 0px;
    width: 4px;
    height: 8px;
    border: solid var(--cv-bg-card);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}
.module-text-display li:has(> input[type="checkbox"]) {
    list-style: none;
    margin-left: -1.5em;
}
```

---

## Verification

1. Create a Text Box module, enter Edit mode, type:
   ```
   - [ ] Unchecked item
   - [x] Checked item
   - [ ] Another unchecked
   ```
2. Switch to Play mode — checkboxes should render with proper styling
3. Click an unchecked box — it should visually check
4. Switch to Edit mode — the raw markdown should show `- [x]` for the toggled item
5. Switch back to Play mode — checked state should persist
6. Test with mixed content (headings, paragraphs, multiple checkbox groups)
7. Test that non-checkbox markdown features still work correctly
