# New Modal Guide

> Standardized process for adding modals and dialogs to Character Vault. Every modal **must** use the shared `cv-modal-*` CSS classes for structural elements. Creating custom CSS for overlay, panel, header, footer, or buttons is never acceptable — it creates visual drift and redundant code. Follow each section in order.

**Why this guide exists:** Commit `27aed77` removed 77 lines of redundant CSS from the recovery module's rest confirmation dialog, which had drifted from the standard modal pattern — custom overlay/panel classes, missing X close button, no header/body/footer structure, and custom button classes. This guide prevents that from happening again.

## Quick Reference — Files Touched

| File | What to Add | Always? |
|---|---|---|
| `scripts/module-TYPENAME.js` | Modal open function, close handler, event wiring | Yes |
| `main.css` | **Only** module-specific body content styles (field layouts, custom body elements) | Usually |
| `scripts/translations.js` | Modal title, button labels, field labels, placeholders — all 7 languages | Yes |
| `_DOCS/SUBMODULES/TYPENAME.md` | Document the modal's purpose and behavior | Yes |

### Never Create Custom CSS For

These classes already exist in `main.css` and handle all structural styling. Using them is mandatory.

| Class | Purpose |
|---|---|
| `.cv-modal-overlay` | Full-screen backdrop — fixed, centered, z-index 200 |
| `.cv-modal-panel` | Modal container — bg, border, radius, shadow, 320px default width |
| `.cv-modal-header` | Title + close button row — flex between, border-bottom |
| `.cv-modal-title` | Title text — 13px, bold, user-select none |
| `.cv-modal-close` | X close button — icon button, muted-to-text hover |
| `.cv-modal-body` | Scrollable content area — padding 12px 14px, flex column, gap 8px |
| `.cv-modal-footer` | Action button row — flex end, gap 8px, border-top |
| `.cv-modal-label` | Form field label — 9px uppercase, secondary color |
| `.cv-modal-input` | Text input — full width, bg-sunken, focus ring |
| `.cv-modal-num` | Number input modifier — centered text, no spinners |
| `.btn-primary sm` | Primary action button (Save, Create, OK, Confirm) |
| `.btn-secondary sm` | Secondary action button (Cancel, Close) |
| `.btn-secondary filled` | Variant with filled background |
| `.btn-danger sm` | Destructive action button (Delete) |

---

## Step 1 — Choose the Right Modal Type

Before writing code, determine which modal type fits your use case. Each type has a different structure, footer pattern, and complexity level.

| Type | When to Use | Width | Footer Pattern | Reference |
|---|---|---|---|---|
| **Action** | Single-input quick operation (damage, heal, XP adjust) | ~280px | Cancel + OK | `openHealthActionOverlay()` in `module-health.js` |
| **Edit/Create** | Multi-field form to create or edit an entity | 320px (default) | [Delete] + Cancel + Save | `openSpellEditModal()` in `module-spells.js` |
| **Settings** | Module configuration panel | 280–320px | Close (auto-save) or Cancel + Save | `openRecoverySettingsModal()` in `module-recovery.js` |
| **Detail/View** | Read-only display of an entity | 320px (default) | Contextual actions (Edit, Cast) | `openSpellDetailModal()` in `module-spells.js` |
| **Confirmation** | Destructive action gate (delete, clear, reset) | 300px max | Cancel + Confirm | `showConfirm()` in `module-counters.js` |

**Confirmation dialogs are a separate system.** They use `delete-confirm-*` classes at z-index 300 with blur backdrop and scale animation. They do **not** use `cv-modal-*`. This is intentional — they float above standard modals. See [Template E](#template-e--confirmation-dialog) for the pattern.

---

## Step 2 — Required HTML Structure

Every standard modal (types 1–4) must follow this exact skeleton. No structural elements may be omitted.

```
┌─ .cv-modal-overlay (.typename-action-overlay)  ← full-screen backdrop
│  ┌─ .cv-modal-panel                             ← modal container
│  │  ┌─ .cv-modal-header                         ← ALWAYS present
│  │  │  ├─ .cv-modal-title                       ← modal title text
│  │  │  └─ .cv-modal-close                       ← X close button (ALWAYS)
│  │  ├─ .cv-modal-body                           ← scrollable content
│  │  │  └─ (your content here)
│  │  └─ .cv-modal-footer                         ← action buttons
│  │     └─ (buttons)
```

### The X Close Button SVG

Every modal header must include the X close button. Use this exact SVG:

```html
<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
```

Standard size is `width="12" height="12"`. Do not use `width="14" height="14"` or other sizes.

### Skeleton Code (createElement style)

Use this when the body has dynamic or complex content:

```js
// 1. Remove any existing instance (singleton guard)
const existing = document.querySelector('.typename-action-overlay');
if (existing) existing.remove();

// 2. Overlay
const overlay = document.createElement('div');
overlay.className = 'cv-modal-overlay typename-action-overlay';

// 3. Panel
const panel = document.createElement('div');
panel.className = 'cv-modal-panel';

// 4. Header — ALWAYS present, ALWAYS has title + X close button
const header = document.createElement('div');
header.className = 'cv-modal-header';

const titleEl = document.createElement('span');
titleEl.className = 'cv-modal-title';
titleEl.textContent = t('typename.modalTitle');

const closeXBtn = document.createElement('button');
closeXBtn.type = 'button';
closeXBtn.className = 'cv-modal-close';
closeXBtn.title = t('typename.close');
closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

header.appendChild(titleEl);
header.appendChild(closeXBtn);
panel.appendChild(header);

// 5. Body — module-specific content goes here
const body = document.createElement('div');
body.className = 'cv-modal-body';
// ... add your content to body ...
panel.appendChild(body);

// 6. Footer — action buttons
const footer = document.createElement('div');
footer.className = 'cv-modal-footer';
// ... add your buttons to footer ...
panel.appendChild(footer);

// 7. Assembly & mount
overlay.appendChild(panel);
document.body.appendChild(overlay);
```

### Skeleton Code (innerHTML style)

Use this for simple, fixed-layout modals (like action modals):

```js
const existing = document.querySelector('.typename-action-overlay');
if (existing) existing.remove();

const overlay = document.createElement('div');
overlay.className = 'cv-modal-overlay typename-action-overlay';

const panel = document.createElement('div');
panel.className = 'cv-modal-panel typename-action-modal';
panel.innerHTML =
    `<div class="cv-modal-header">` +
    `<span class="cv-modal-title">${escapeHtml(t('typename.modalTitle'))}</span>` +
    `<button class="cv-modal-close" title="${escapeHtml(t('typename.close'))}">` +
    `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
    `</button>` +
    `</div>` +
    `<div class="cv-modal-body">` +
    `<!-- your body content -->` +
    `</div>` +
    `<div class="cv-modal-footer">` +
    `<button class="typename-cancel btn-secondary sm">${escapeHtml(t('typename.cancel'))}</button>` +
    `<button class="typename-ok btn-primary sm">${escapeHtml(t('typename.ok'))}</button>` +
    `</div>`;

overlay.appendChild(panel);
document.body.appendChild(overlay);
```

**Important:** When using innerHTML with user-provided text, always wrap with `escapeHtml()`.

---

## Step 3 — CSS Rules

### What You May Add Custom CSS For

- **Body content layout** — grids, lists, custom field arrangements inside `.cv-modal-body`
- **Width override** — via inline style (`panel.style.width = '280px'`) or a module-specific class
- **Module-specific input styling** — if you need a special input appearance (e.g. large centered number input for action modals)

### What You Must Never Add Custom CSS For

- Overlay positioning or backdrop (use `.cv-modal-overlay`)
- Panel background, border, shadow, or border-radius (use `.cv-modal-panel`)
- Header layout (use `.cv-modal-header`)
- Title font, size, or weight (use `.cv-modal-title`)
- Close button appearance (use `.cv-modal-close`)
- Body padding, gap, or scroll behavior (use `.cv-modal-body`)
- Footer layout (use `.cv-modal-footer`)
- Button appearance (use `btn-primary sm`, `btn-secondary sm`, `btn-danger sm`)

If you find yourself writing `position: fixed; inset: 0;` for a modal, **stop** — you're duplicating `.cv-modal-overlay`.

### Width Overrides

| Width | When | Method |
|---|---|---|
| 320px | Most modals (edit, detail, settings) | Default — no override needed |
| ~280px | Narrow modals (action, simple settings) | `panel.style.width = '280px'` or add a CSS class |
| 360–480px | Wide modals (multi-column settings) | Add a CSS class (e.g. `.res-settings-modal { width: 480px }`) |

Only create a CSS class for width if the same width is reused across multiple modals. For one-off overrides, use inline style.

### z-index Rules

| z-index | Element | Source |
|---|---|---|
| 400 | Toast notifications | `#toast-container` |
| 300 | Confirmation dialogs | `.delete-confirm-overlay` |
| 200 | Standard modals | `.cv-modal-overlay` |
| 100 | Menu bar, dragging module | Various |

Never create a custom z-index for a modal. Standard modals inherit z-index 200 from `.cv-modal-overlay`. Confirmation dialogs inherit 300 from `.delete-confirm-overlay`.

---

## Step 4 — JavaScript Patterns

### Singleton Guard

Every modal opening function must remove any existing instance before creating a new one. This prevents duplicate modals from stacking.

```js
const existing = document.querySelector('.typename-action-overlay');
if (existing) existing.remove();
```

Use a unique class on the overlay (e.g. `.typename-action-overlay`) as the selector.

### Close Handling — 4 Mandatory Close Paths

Every standard modal must support all four close paths:

```js
function close() {
    overlay.remove();
    document.removeEventListener('keydown', keyHandler);
}

// 1. X button
closeXBtn.addEventListener('click', close);

// 2. Cancel / Close button
cancelBtn.addEventListener('click', close);

// 3. Overlay backdrop click
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
});

// 4. Escape key (document-level)
const keyHandler = (e) => {
    if (e.key === 'Escape') {
        e.stopPropagation();
        close();
    }
};
document.addEventListener('keydown', keyHandler);
```

**Critical:** Always remove the keydown listener in the close function. Failing to do this causes memory leaks and ghost handlers on subsequent opens.

**Exception for action modals:** When the modal has a single focused input, you may attach Escape to the input's `keydown` instead of `document`. This is simpler and the input always has focus:

```js
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') cancel();
});
```

### Dirty State Guard

Use dirty state tracking when the user can make changes that would be lost on close. Apply the guard to **all** close paths (X button, Cancel, overlay click, Escape).

**When to use:** Edit/Create modals, Settings modals with Cancel + Save.
**When NOT to use:** Action modals (trivial to redo), Detail/View modals (read-only), auto-save settings modals, confirmation dialogs.

**Boolean flag approach** (simpler, most common):

```js
let dirty = false;

// Mark dirty on any user interaction
input.addEventListener('input', () => { dirty = true; });

function tryClose() {
    if (dirty && !window.confirm(t('common.discardChanges'))) return;
    forceClose();
}

function forceClose() {
    overlay.remove();
    document.removeEventListener('keydown', keyHandler);
}
```

Wire `tryClose` (guarded) to: X button, Cancel button, overlay click, Escape key.
Wire `forceClose` (unguarded) to: after saving, after deleting.

**Source reference:** `openSpellEditModal()` in `module-spells.js` for the boolean flag pattern.

**Snapshot comparison approach** (for complex state):

```js
const snapshot = JSON.stringify(editState);
function isDirty() { return JSON.stringify(editState) !== snapshot; }
```

**Source reference:** `openCounterEditModal()` in `module-counters.js` for the snapshot pattern.

### Focus Management

Standardize focus on modal open:

| Modal Type | Focus Target | Code |
|---|---|---|
| Action (single input) | The input | `input.focus(); input.select();` |
| Edit/Create (name field) | First text input | `nameInput.focus();` |
| Settings | Nothing (overlay receives focus) | `overlay.setAttribute('tabindex', '-1'); overlay.focus();` |
| Detail/View | Nothing | No focus action needed |

Focus immediately after `document.body.appendChild(overlay)`. Use `requestAnimationFrame()` only if you observe focus not taking due to CSS transitions.

---

## Step 5 — Button Arrangement

### Footer Button Order

Buttons sit in the footer, right-aligned by default (`.cv-modal-footer` uses `justify-content: flex-end`).

| Modal Type | Button Order (left → right) | Classes |
|---|---|---|
| **Action** | Cancel, OK | `btn-secondary sm`, `btn-primary sm` |
| **Edit** (new entity) | Cancel, Create | `btn-secondary sm` or `btn-secondary filled`, `btn-primary sm` |
| **Edit** (existing entity) | Delete, Cancel, Save | `btn-danger sm`, `btn-secondary sm` or `btn-secondary filled`, `btn-primary sm` |
| **Settings** (Save/Cancel) | Cancel, Save | `btn-secondary sm`, `btn-primary sm` |
| **Settings** (auto-save) | Close | `btn-secondary sm` |
| **Detail/View** | Secondary, Primary | `btn-secondary sm`, `btn-primary sm` |

### Delete Button Positioning

When a Delete button is present (editing an existing entity), position it on the far left using `marginRight: 'auto'`. This visually separates the destructive action from Save/Cancel.

```js
const deleteBtn = document.createElement('button');
deleteBtn.className = 'btn-danger sm';
deleteBtn.textContent = t('typename.delete');
deleteBtn.style.marginRight = 'auto';  // Pushes Cancel + Save to the right

// Hide for new entities
if (isNew) deleteBtn.style.display = 'none';

footer.appendChild(deleteBtn);
footer.appendChild(cancelBtn);
footer.appendChild(saveBtn);
```

**Source reference:** `openRestButtonEditModal()` in `module-recovery.js` (line 580).

### Delete Confirmation

Always confirm before deleting. Two approaches:

1. **`window.confirm()`** — for inline delete buttons within an edit modal:
   ```js
   deleteBtn.addEventListener('click', () => {
       if (!window.confirm(t('typename.deleteConfirm'))) return;
       // perform deletion ...
   });
   ```

2. **`showConfirm()`** — for standalone delete operations using the styled confirmation dialog (z-index 300):
   ```js
   showConfirm({ title: t('typename.delete'), message: t('typename.deleteMessage') }, () => {
       // perform deletion ...
   });
   ```

---

## Step 6 — Form Input Standards

### Labels

```js
const label = document.createElement('label');   // or 'div'
label.className = 'cv-modal-label';
label.textContent = t('typename.fieldLabel');
```

### Text Inputs

```js
const input = document.createElement('input');
input.type = 'text';
input.className = 'cv-modal-input';
input.value = currentValue;
input.placeholder = t('typename.placeholder');
input.spellcheck = false;
input.autocomplete = 'off';
input.addEventListener('input', () => { dirty = true; });
```

### Number Inputs

```js
const numInput = document.createElement('input');
numInput.type = 'number';
numInput.className = 'cv-modal-input cv-modal-num';
numInput.value = currentValue;
numInput.min = 0;
```

The `.cv-modal-num` class centers the text and hides the browser's number spinners.

### Custom Dropdowns

Never use native `<select>` elements in modals — they look inconsistent across browsers and don't respect the theme. Use the `cv-select` custom component instead.

```js
const selectWrapper = document.createElement('div');
selectWrapper.className = 'cv-select';

const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className = 'cv-select-trigger';
trigger.innerHTML = `<span class="cv-select-value">${escapeHtml(currentLabel)}</span>` +
    `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

const menu = document.createElement('ul');
menu.className = 'cv-select-menu';

options.forEach(opt => {
    const li = document.createElement('li');
    li.className = 'cv-select-option' + (opt.value === currentValue ? ' selected' : '');
    li.textContent = opt.label;
    li.addEventListener('click', () => {
        // Update value
        trigger.querySelector('.cv-select-value').textContent = opt.label;
        menu.querySelectorAll('.cv-select-option').forEach(o =>
            o.classList.toggle('selected', o === li));
        selectWrapper.classList.remove('open');
        // Mark dirty / save
    });
    menu.appendChild(li);
});

trigger.addEventListener('click', e => {
    e.stopPropagation();
    const rect = trigger.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = rect.bottom + 2 + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.minWidth = rect.width + 'px';
    selectWrapper.classList.toggle('open');
});

document.addEventListener('click', () => selectWrapper.classList.remove('open'));

selectWrapper.appendChild(trigger);
selectWrapper.appendChild(menu);
```

**Source reference:** `openRecoverySettingsModal()` in `module-recovery.js` (die size dropdown).

### Live Value Clamping

Clamp values during input, not on save. This prevents invalid states at all times:

```js
maxInput.addEventListener('input', () => {
    editState.max = parseInt(maxInput.value, 10) || 0;
    if (editState.value > editState.max) {
        editState.value = editState.max;
        valInput.value = editState.value;
    }
});
```

### HTML Escaping

Always use `escapeHtml()` (from `shared.js`) when interpolating user-provided strings into HTML:

```js
// WRONG — XSS vulnerability
panel.innerHTML = `<span class="cv-modal-title">${spell.name}</span>`;

// CORRECT
panel.innerHTML = `<span class="cv-modal-title">${escapeHtml(spell.name)}</span>`;
```

---

## Step 7 — Translation Requirements

Every visible string in a modal must use `t()` (dynamic text) or `data-i18n` attributes (static HTML). Hardcoded English strings are bugs.

### Required Keys for Every Modal

At minimum, add these to all 7 language blocks in `translations.js`:

```js
'typename.modalTitle':     'Modal Title',
'typename.close':          'Close',
'typename.cancel':         'Cancel',
// Add as needed:
'typename.save':           'Save',
'typename.create':         'Create',
'typename.delete':         'Delete',
'typename.ok':             'OK',
// Field-specific:
'typename.fieldLabel':     'Field Name',
'typename.placeholder':    'Enter value...',
```

### Namespace Convention

Modal keys live under the module's namespace (e.g. `spells.addSpellTitle`, `recovery.editRestButton`). Do not create a separate `modal.*` namespace.

### Discard Changes Prompt

Use the shared key `common.discardChanges` for the dirty state confirmation prompt. Check that this key exists before relying on it — if it doesn't, add it.

See `_DOCS/LOCALIZATION.md` for the full i18n reference.

---

## Copy-Paste Templates

Use these as starting points. They reflect the exact conventions used throughout the codebase. Replace `typename` with your module type key.

---

### Template A — Action Modal

Single input + confirm. No dirty state. Enter confirms, Escape cancels.
**Source reference:** `openHealthActionOverlay()` in `scripts/module-health.js`

```js
function openTypenameActionModal(moduleEl, data) {
    const existing = document.querySelector('.typename-action-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-action-overlay';

    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel typename-action-modal';
    panel.innerHTML =
        `<div class="cv-modal-header">` +
        `<span class="cv-modal-title">${escapeHtml(t('typename.modalTitle'))}</span>` +
        `<button class="cv-modal-close" title="${escapeHtml(t('typename.cancel'))}">` +
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
        `</button>` +
        `</div>` +
        `<div class="cv-modal-body typename-action-body">` +
        `<input type="text" class="typename-action-input" placeholder="0" spellcheck="false" autocomplete="off">` +
        `</div>` +
        `<div class="cv-modal-footer">` +
        `<button class="typename-action-cancel btn-secondary sm">${escapeHtml(t('typename.cancel'))}</button>` +
        `<button class="typename-action-ok btn-primary sm">${escapeHtml(t('typename.ok'))}</button>` +
        `</div>`;

    const input = panel.querySelector('.typename-action-input');
    const closeBtn = panel.querySelector('.cv-modal-close');
    const cancelBtn = panel.querySelector('.typename-action-cancel');
    const okBtn = panel.querySelector('.typename-action-ok');

    // Pre-fill if editing existing value
    input.value = data.content.someField ?? '';

    function confirm() {
        const val = parseInt(input.value, 10);
        if (isNaN(val)) { cancel(); return; }

        data.content.someField = val;
        scheduleSave();
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlayMode);
        cancel();
    }

    function cancel() {
        overlay.remove();
    }

    closeBtn.addEventListener('click', cancel);
    cancelBtn.addEventListener('click', cancel);
    okBtn.addEventListener('click', confirm);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirm();
        if (e.key === 'Escape') cancel();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cancel();
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    input.focus();
    input.select();
}
```

**Typical custom CSS** (only the body content styling — everything else is shared):
```css
.typename-action-modal { width: 280px; }
.typename-action-body { align-items: center; }
.typename-action-input {
    width: 80%;
    font-size: 18px;
    text-align: center;
    padding: 8px;
    background: var(--cv-bg-sunken);
    border: 1px solid var(--cv-border);
    border-radius: 4px;
    color: inherit;
    font-family: inherit;
    outline: none;
}
.typename-action-input:focus {
    border-color: var(--cv-accent);
    box-shadow: 0 0 0 2px var(--cv-focus-ring);
}
```

---

### Template B — Edit/Create Modal

Multi-field form with dirty state, Delete button (hidden for new entities), Cancel + Save footer.
**Source reference:** `openSpellEditModal()` in `scripts/module-spells.js`

```js
function openTypenameEditModal(moduleEl, data, entity) {
    const isNew = !entity.id;
    const working = {
        id: entity.id || genId('tn'),
        name: entity.name || '',
        // ... copy other fields
    };
    let dirty = false;

    const existing = document.querySelector('.typename-edit-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-edit-overlay';

    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel';

    // ── Header ──
    const header = document.createElement('div');
    header.className = 'cv-modal-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'cv-modal-title';
    titleEl.textContent = t(isNew ? 'typename.addTitle' : 'typename.editTitle');
    const closeXBtn = document.createElement('button');
    closeXBtn.type = 'button';
    closeXBtn.className = 'cv-modal-close';
    closeXBtn.title = t('typename.close');
    closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    header.appendChild(titleEl);
    header.appendChild(closeXBtn);
    panel.appendChild(header);

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'cv-modal-body';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'cv-modal-label';
    nameLabel.textContent = t('typename.name');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'cv-modal-input';
    nameInput.value = working.name;
    nameInput.placeholder = t('typename.namePlaceholder');
    nameInput.spellcheck = false;
    nameInput.autocomplete = 'off';
    nameInput.addEventListener('input', () => {
        working.name = nameInput.value;
        dirty = true;
    });
    body.appendChild(nameLabel);
    body.appendChild(nameInput);

    // ... add more fields to body ...

    panel.appendChild(body);

    // ── Footer ──
    const footer = document.createElement('div');
    footer.className = 'cv-modal-footer';

    if (!isNew) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger sm';
        deleteBtn.textContent = t('typename.delete');
        deleteBtn.style.marginRight = 'auto';
        deleteBtn.addEventListener('click', () => {
            if (!window.confirm(t('typename.deleteConfirm'))) return;
            // ... perform deletion ...
            scheduleSave();
            const bodyEl = moduleEl.querySelector('.module-body');
            MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlayMode);
            dirty = false;
            forceClose();
        });
        footer.appendChild(deleteBtn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary filled';
    cancelBtn.textContent = t('typename.cancel');
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary sm';
    saveBtn.textContent = t('typename.save');
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    nameInput.focus();

    // ── Close handling ──
    function forceClose() {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
    }

    function tryClose() {
        if (dirty && !window.confirm(t('common.discardChanges'))) return;
        forceClose();
    }

    function save() {
        if (!working.name.trim()) { nameInput.focus(); return; }
        // ... commit working copy to data.content ...
        scheduleSave();
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlayMode);
        dirty = false;
        forceClose();
    }

    closeXBtn.addEventListener('click', tryClose);
    cancelBtn.addEventListener('click', tryClose);
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) tryClose();
    });

    const keyHandler = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); tryClose(); }
    };
    document.addEventListener('keydown', keyHandler);
}
```

---

### Template C — Settings Modal (Cancel + Save)

Module configuration with explicit Save. Uses working copy + dirty state.
**Source reference:** `openAbilitySettings()` in `scripts/module-abilities.js`

```js
function openTypenameSettings(moduleEl, data) {
    const existing = document.querySelector('.typename-settings-overlay');
    if (existing) existing.remove();

    const working = { ...data.content };
    let dirty = false;

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-settings-overlay';

    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel';

    // ── Header ──
    const header = document.createElement('div');
    header.className = 'cv-modal-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'cv-modal-title';
    titleEl.textContent = t('typename.settingsTitle');
    const closeXBtn = document.createElement('button');
    closeXBtn.className = 'cv-modal-close';
    closeXBtn.title = t('typename.close');
    closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    header.appendChild(titleEl);
    header.appendChild(closeXBtn);

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'cv-modal-body';
    // ... add settings fields, wire dirty = true on changes ...

    // ── Footer ──
    const footer = document.createElement('div');
    footer.className = 'cv-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary sm';
    cancelBtn.textContent = t('typename.cancel');
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary sm';
    saveBtn.textContent = t('typename.save');
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function close() {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
    }

    function save() {
        Object.assign(data.content, working);
        scheduleSave();
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlayMode);
        close();
    }

    closeXBtn.addEventListener('click', () => {
        if (dirty && !window.confirm(t('common.discardChanges'))) return;
        close();
    });
    cancelBtn.addEventListener('click', () => {
        if (dirty && !window.confirm(t('common.discardChanges'))) return;
        close();
    });
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (dirty && !window.confirm(t('common.discardChanges'))) return;
        close();
    });

    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            if (dirty && !window.confirm(t('common.discardChanges'))) return;
            close();
        }
    };
    document.addEventListener('keydown', keyHandler);
}
```

### Settings Modal Variant — Auto-Save with Close Button

When settings are saved on each change (no working copy), use a single Close button instead of Cancel + Save:

```js
// Footer — just a Close button
const footer = document.createElement('div');
footer.className = 'cv-modal-footer';
const closeBtn = document.createElement('button');
closeBtn.type = 'button';
closeBtn.className = 'btn-secondary sm';
closeBtn.textContent = t('typename.close');
closeBtn.addEventListener('click', closeModal);
footer.appendChild(closeBtn);
```

In each field's change handler, call `scheduleSave()` directly. No dirty state tracking needed.

**Source reference:** `openRecoverySettingsModal()` in `scripts/module-recovery.js`.

---

### Template D — Detail/View Modal

Read-only display with contextual action buttons. No dirty state.
**Source reference:** `openSpellDetailModal()` in `scripts/module-spells.js`

```js
function openTypenameDetailModal(moduleEl, data, entity) {
    const existing = document.querySelector('.typename-detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-detail-overlay';

    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel';

    // ── Header ──
    const header = document.createElement('div');
    header.className = 'cv-modal-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'cv-modal-title';
    titleEl.textContent = entity.name || t('typename.unnamed');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cv-modal-close';
    closeBtn.title = t('typename.close');
    closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'cv-modal-body';
    // ... render read-only content (attribute rows, descriptions, etc.) ...

    // ── Footer ──
    const footer = document.createElement('div');
    footer.className = 'cv-modal-footer';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary sm';
    editBtn.textContent = t('typename.edit');
    const primaryBtn = document.createElement('button');
    primaryBtn.className = 'btn-primary sm';
    primaryBtn.textContent = t('typename.primaryAction');

    editBtn.addEventListener('click', () => {
        forceClose();
        openTypenameEditModal(moduleEl, data, entity);
    });
    primaryBtn.addEventListener('click', () => {
        // ... primary action ...
    });
    footer.appendChild(editBtn);
    footer.appendChild(primaryBtn);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function forceClose() {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
    }

    closeBtn.addEventListener('click', forceClose);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) forceClose();
    });

    const keyHandler = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); forceClose(); }
    };
    document.addEventListener('keydown', keyHandler);
}
```

---

### Template E — Confirmation Dialog

Styled destructive action confirmation. Uses `delete-confirm-*` classes at z-index 300 with scale animation. This is a **separate system** from `cv-modal-*`.

**Source reference:** `showConfirm()` in `scripts/module-counters.js`

> **Note:** `showConfirm()` is currently duplicated in `module-counters.js` and `module-activity.js`. Copy from whichever is loaded in your module's context. A future refactor may centralize this into `shared.js`.

```js
function showConfirm(options, onConfirm) {
    const message = typeof options === 'string' ? options : options.message;
    const titleText = options.title || t('typename.delete');

    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const panel = document.createElement('div');
    panel.className = 'delete-confirm-panel';

    const title = document.createElement('div');
    title.className = 'delete-confirm-title';
    title.style.userSelect = 'none';
    title.textContent = titleText;

    const msg = document.createElement('div');
    msg.className = 'delete-confirm-msg';
    msg.style.userSelect = 'none';
    msg.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'delete-confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'delete-confirm-cancel btn-secondary';
    cancelBtn.textContent = options.cancelText || t('delete.cancel');

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'delete-confirm-delete';
    confirmBtn.textContent = options.confirmText || t('delete.confirm');

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    panel.appendChild(title);
    panel.appendChild(msg);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function close() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        setTimeout(() => overlay.remove(), 200);  // Wait for close animation
    }

    cancelBtn.addEventListener('click', close);
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        close();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    // Open animation
    requestAnimationFrame(() => {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    });
}
```

**Usage:**
```js
showConfirm(
    { title: t('typename.delete'), message: t('typename.deleteMessage') },
    () => {
        // Perform the destructive action
        data.content.items = data.content.items.filter(i => i.id !== targetId);
        scheduleSave();
        // Re-render
    }
);
```

---

## Common Pitfalls

1. **Creating custom overlay/panel/header/footer CSS.** This is the #1 mistake and the reason this guide exists. If you're writing `position: fixed; inset: 0;` or `background: var(--cv-bg-surface); border-radius: 8px;` for a modal, you're duplicating shared classes.

2. **Missing the X close button.** Every modal header needs the `cv-modal-close` button with the standard SVG. No exceptions.

3. **Skipping header/body/footer structure.** Even simple modals need all three sections. The header provides the title and close button; the body holds content; the footer holds action buttons. Adding content directly to the panel is wrong.

4. **Custom button classes.** Use `btn-primary sm`, `btn-secondary sm`, `btn-danger sm`. Never create `typename-btn-confirm`, `typename-btn-cancel`, or similar.

5. **Missing Escape key handler.** Must be on every modal. Use a `document`-level listener and clean it up on close.

6. **Missing overlay click dismiss.** Every modal must close when the user clicks the backdrop: `if (e.target === overlay) close();`

7. **Inconsistent dirty state guard.** If you guard Escape, you must also guard the X button, Cancel, and overlay click. All four close paths must behave the same.

8. **Custom z-index.** Never set a custom z-index on a modal overlay. Standard modals inherit 200 from `.cv-modal-overlay`. Confirmation dialogs inherit 300 from `.delete-confirm-overlay`.

9. **Forgetting to remove the keydown listener.** Always pair `document.addEventListener('keydown', keyHandler)` with `document.removeEventListener('keydown', keyHandler)` in the close function.

10. **Missing translations.** Every visible string (title, button labels, field labels, placeholders, error messages) needs a `t()` call and entries in all 7 language blocks.

11. **Hardcoded colors.** Always use `--cv-*` tokens in modal CSS. Never use hex values.

12. **User content without escapeHtml().** Any user-provided string interpolated into HTML must be escaped. This includes entity names, descriptions, and field values.

---

## Checklist

Copy this into your plan when adding a modal:

```
- [ ] Chose the correct modal type (Action / Edit-Create / Settings / Detail / Confirm)
- [ ] Overlay uses `cv-modal-overlay` + unique identifier class
- [ ] Panel uses `cv-modal-panel` (no custom panel CSS)
- [ ] Header present with `cv-modal-header`, `cv-modal-title`, `cv-modal-close` (X button)
- [ ] X close SVG uses width="12" height="12"
- [ ] Body uses `cv-modal-body`
- [ ] Footer uses `cv-modal-footer`
- [ ] Buttons use standard classes: `btn-primary sm`, `btn-secondary sm`, `btn-danger sm`
- [ ] No custom CSS for overlay, panel, header, footer, or buttons
- [ ] Singleton guard: removes existing modal before creating
- [ ] 4 close paths wired: X button, overlay click, Escape key, Cancel/Close button
- [ ] Escape keydown listener registered on `document` with cleanup on close
- [ ] Dirty state guard on all 4 close paths (if applicable)
- [ ] Focus management: first input focused on mount (if applicable)
- [ ] All visible text uses `t()` or `data-i18n`
- [ ] Translation keys added to all 7 languages in translations.js
- [ ] User content escaped with `escapeHtml()`
- [ ] Values clamped live during input (if applicable)
- [ ] Delete button positioned left with `marginRight: 'auto'` (if applicable)
- [ ] Delete button hidden for new entities (if applicable)
- [ ] No hardcoded hex colors — uses `--cv-*` tokens only
- [ ] No custom z-index on overlay
- [ ] `scheduleSave()` called after data mutations
- [ ] Module re-rendered after save
- [ ] Submodule doc updated with modal description
```

---

## CLAUDE.md Cross-Reference

This guide enforces and expands on the following CLAUDE.md rules:

| Rule | What It Requires |
|---|---|
| **#2** | `--cv-*` color tokens for all CSS |
| **#5** | `user-select: none` on all UI text |
| **#7** | `escapeHtml()` for user-provided strings in HTML |
| **#15** | Modal standard: [Save]/[Create], [Cancel]/[Close], [X] top-right, unsaved changes prompt, live clamping |
| **#16** | `scrollbar-gutter: stable` on scrollable containers |
| **#17** | All user-visible strings must be translatable |
