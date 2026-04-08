# New Module Creation Guide

> Standardized process for adding a new module type to Character Vault. Follow each section in order — skip sections marked **(optional)** if they don't apply to your type.

## Quick Reference — Files Touched

| File | What to Add | Always? |
|---|---|---|
| `scripts/module-TYPENAME.js` | Module type registration (new file) | Yes |
| `translations.js` | `type.typename` + module-specific keys in all 7 languages | Yes |
| `main.html` | Wizard type card + `<script>` tag | Yes |
| `scripts/module-core.js` | Creation defaults, header buttons, overflow menu, mode switching | Yes |
| `main.css` | Module styles, responsive rules, overlay styles | Yes |
| `_DOCS/ARCHITECTURE.md` | Files table, script order, data structures, registered types list | Yes |
| `main.html` | Wizard sub-option section (e.g., layout picker) | Optional |
| `main.css` | Wizard sub-option visibility styles | Optional |
| `scripts/persistence.js` | Data migration (only if changing existing content shape later) | Optional |

---

## Step 1 — Define the Content Shape

Before writing code, define the `data.content` object your module will persist. This shape is initialized when the module is created and must be self-contained.

**Examples from existing modules:**

```js
// text → string
content: ''

// health → object
content: { currentHP: 0, maxHP: 0, tempHP: 0, maxHPModifier: 0 }

// stat → object with nested array
content: { layout: 'large-stat', stats: [{ name: '', value: 0, modifier: 0, proficient: false, rollable: true }] }

// hline / spacer → empty string (no data)
content: ''
```

**Rules:**
- The content must be JSON-serializable (no functions, DOM references, or circular refs)
- Provide sensible zero-state defaults — the module should render without errors on a fresh create
- If content can be corrupted (e.g., by migration), guard its shape in `renderBody()` (see Step 2)

---

## Step 2 — Create `scripts/module-TYPENAME.js`

Create a new file following this template. The filename must be `module-{typename}.js` where `typename` matches your type key.

```js
// ── Your Module Helpers (if needed) ──

// Helper functions specific to this module type go here.
// Keep them in this file — don't pollute module-core.js.

// ── Your Module Type Registration ──
registerModuleType('typename', {
    label: 'type.typename',  // i18n key — must exist in translations.js

    renderBody(bodyEl, data, isPlayMode) {
        // 1. Guard content shape (handle corrupted/migrated data)
        if (!data.content || typeof data.content === 'string') {
            data.content = { /* your zero-state defaults */ };
        }

        // 2. Build DOM
        const container = document.createElement('div');
        container.className = 'typename-container';

        if (isPlayMode) {
            // Play mode: display-only UI, clickable interactions
        } else {
            // Edit mode: inputs, controls, configuration
        }

        // 3. Replace body content
        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    },

    onPlayMode(moduleEl, data) {
        // Called when the sheet switches to play mode.
        // Re-render or toggle visibility as needed.
        const bodyEl = moduleEl.querySelector('.module-body');
        this.renderBody(bodyEl, data, true);
    },

    onEditMode(moduleEl, data) {
        // Called when the sheet switches to edit mode.
        const bodyEl = moduleEl.querySelector('.module-body');
        this.renderBody(bodyEl, data, false);
    },

    // Optional — only needed if inputs don't directly mutate data
    syncState(moduleEl, data) {
        // Read DOM input values back into data.content before save.
        // Called by persistence.js before serialization.
    }
});
```

### Required Methods

| Method | Purpose | When Called |
|---|---|---|
| `renderBody(bodyEl, data, isPlayMode)` | Populate `.module-body` with your UI | Module creation, load, mode switch |
| `onPlayMode(moduleEl, data)` | Transition to play mode | Global mode toggle |
| `onEditMode(moduleEl, data)` | Transition to edit mode | Global mode toggle |

### Optional Methods

| Method | Purpose | When to Include |
|---|---|---|
| `syncState(moduleEl, data)` | Copy DOM state → `data.content` before save | Only if inputs don't directly mutate `data` on every keystroke |

### Pattern Notes

- **Interaction Modes** — Ensure a clear distinction:
  - **Play Mode:** Read-only data display with direct in-game interactions (toggles, rolling, quick stat adjustments).
  - **Edit Mode:** Inline inputs, array manipulation, and structure changes. Cross-module drag-and-drop applies here.
- **Data Sorting** — If your module manages lists/arrays, implement the standard 3-state sorting cycle (Ascending/Descending/Custom) on column headers. Remember to disable `SortableJS` drag-to-reorder when an active auto-sort is applied. Save sort state (`sortBy`, `sortDir`) in `data.content`.
- **Modals & Overlays** — If your module requires complex modal editing:
  - Add universal buttons (`[Save]`/`[Create]`, `[Cancel]`/`[Close]`, `[X]`, and potentially `[Delete]`).
  - Implement an unsaved changes prompt if the user closes without saving.
  - Auto-clamp values live (e.g., `Current Value` cannot exceed `Max`).
- **Icons** — Use the curated SVG library. Place the `None`/`null` option first in icon pickers. Avoid custom uploads.
- **Event handlers** — Attach in `renderBody()`. They're recreated on each render, so no cleanup needed.
- **`scheduleSave()`** — Call after any user interaction that changes `data`. This triggers the auto-save debounce.
- **`escapeHtml()`** — Always escape user-supplied text before inserting into HTML strings.
- **`t(key)`** — Use for all visible text to support localization.
- **`null` not `undefined`** — Use `null` for intentionally empty values in `data.content` (e.g., `linkedModuleId: null`). `undefined` doesn't survive JSON serialization.
- **Console logging** — Prefix all `console.log` / `console.warn` / `console.error` calls with `[CV]` — e.g., `console.log('[CV] Spell added')`.

### Reference Implementations by Complexity

| Complexity | File | Lines | Notes |
|---|---|---|---|
| Minimal | `module-hr.js` | ~20 | No content, just a visual separator |
| Simple | `module-spacer.js` | ~25 | No content, minimal edit controls |
| Medium | `module-text.js` | ~60 | Textarea input, markdown rendering |
| Complex | `module-health.js` | ~230 | Multiple fields, action overlays, math eval |
| Complex | `module-stat.js` | ~330 | Nested arrays, drag-drop, inline editing |
| Advanced | `module-abilities.js` | ~400 | Settings modal with multiple fields, cross-module linking |
| Advanced | `module-savingthrow.js` | ~500 | Custom tier editor, editable list, dirty-state guard |

---

## Step 3 — Add Translations

Add keys to `translations.js` in **all 7 language blocks**: `en`, `es`, `fr`, `de`, `it`, `pt-BR`, `ru`.

### Required Key

```js
'type.typename': 'Display Name',
```

This must be inserted **alphabetically by value** within the `// Module type labels` group in each language.

### Module-Specific Keys

Namespace all keys under your type name:

```js
'typename.fieldLabel':   'Field Label',
'typename.actionName':   'Action Name',
'typename.placeholder':  'Placeholder text...',
```

### Static vs Dynamic Text

**Static HTML text** (hardcoded in `innerHTML` / template literals that won't change after render) should use `data-i18n`, `data-i18n-placeholder`, or `data-i18n-title` attributes so `applyI18n()` handles them automatically. Use `t(key)` only for text injected dynamically at runtime.

```html
<!-- Static label on a rendered element -->
<label data-i18n="typename.fieldLabel"></label>
<input data-i18n-placeholder="typename.placeholder">
<button data-i18n-title="typename.actionTooltip"></button>

<!-- Dynamic text — use t() -->
const buttonText = t('typename.actionName');
```

### Where to Insert

Each language block has this structure — add your type label in the type labels group, and your module-specific keys in a new comment section before the next module's section:

```js
// Module type labels
'type.health':  'Health',        // ← alphabetical
'type.hline':   'Horizontal Line',
'type.typename': 'Your Type',   // ← insert here alphabetically
'type.text':    'Text Box',

// Your Type submodule          // ← new section
'typename.key1': 'Value 1',
'typename.key2': 'Value 2',

// Stat submodule               // ← existing section
'stat.addStat': 'Add Stat',
```

---

## Step 4 — Add Wizard Type Card to `main.html`

### A. Wizard Card

Insert into `.wizard-type-grid` in **alphabetical order by display name**.

```html
<div class="wizard-type-card" data-type="typename">
    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
        <!-- SVG paths here -->
    </svg>
    <span class="wizard-type-name" data-i18n="type.typename">Display Name</span>
</div>
```

**Current alphabetical order:** Health, Horizontal Line, List (disabled), Spacer, Stat, Text Box

**Icon rules:**
- Use inline SVG with `stroke="currentColor"` (inherits selection color)
- Prefer basic shapes (`<line>`, `<circle>`, `<rect>`, `<polyline>`) for simple icons
- Use `<path d="...">` for complex geometry
- **Never use CSS `mask-image`** — unsupported in TaleSpire's embedded Chromium

### B. Script Tag

Add a `<script>` tag in the scripts section. Must be **after `module-core.js`** and **before `app.js`**:

```html
<script src="scripts/module-core.js"></script>
<script src="scripts/module-text.js"></script>
<script src="scripts/module-stat.js"></script>
<script src="scripts/module-health.js"></script>
<script src="scripts/module-typename.js"></script>  <!-- NEW -->
<script src="scripts/module-hr.js"></script>
<script src="scripts/module-spacer.js"></script>
<script src="scripts/app.js"></script>
```

---

## Step 5 — Update `module-core.js`

This file has several type-specific touchpoints. Only modify the ones relevant to your module.

### A. Creation Defaults — `btnWizardCreate` Handler

Add a block to set your module's initial properties:

```js
if (moduleData.type === 'typename') {
    moduleData.content = { /* your zero-state content */ };
    moduleData.colSpan = 1;     // Grid columns (1–4)
    moduleData.rowSpan = null;  // null = auto-height, number = fixed rows
}
```

**Common patterns:**
| Type | colSpan | rowSpan | theme |
|---|---|---|---|
| Standard module | `1` or `2` | `null` (auto) | User-selected |
| Full-width divider | `4` | `null` | `null` (forced) |
| Minimal spacer | `1` | `1` | `null` (forced) |

### B. Header Buttons in `renderModule()` — (if your type has toolbar actions)

Add conditional button HTML inside the `el.innerHTML` template string:

```js
${data.type === 'typename' ? `<button class="module-typename-action-btn" title="${t('typename.action')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" ...>...</svg></button>` : ''}
```

### C. Header Button Event Handlers — (if you added header buttons)

After the existing button handler blocks in `renderModule()`, add yours:

```js
const typenameActionBtn = el.querySelector('.module-typename-action-btn');
if (typenameActionBtn) {
    typenameActionBtn.addEventListener('click', () => {
        // Your action logic
        scheduleSave();
    });
}
```

**Always include a `title` attribute** on toolbar buttons — TaleSpire's Chromium does not render native `title` tooltips, so these are consumed by the custom CSS tooltip system. The rightmost button in a module toolbar (usually the delete button) needs the right-anchored tooltip override (see `.module-delete-btn[title]::after` in `main.css`). If your button sits rightmost, apply the same override class pattern.

### D. Overflow Menu — (if you added header buttons)

Add your button selectors to the `btnDefs` array in `openOverflowMenu()`:

```js
{ sel: '.module-typename-action-btn', label: t('typename.action'), icon: '<svg ...>...</svg>' },
```

This makes your buttons accessible from the kebab menu on narrow (xs/sm) modules.

### E. Mode Switching — (if you added header buttons)

In `applyPlayMode()`, hide your buttons:
```js
const typenameBtn = mod.querySelector('.module-typename-action-btn');
if (typenameBtn) typenameBtn.style.display = 'none';
```

In `applyEditMode()`, show them:
```js
const typenameBtn = mod.querySelector('.module-typename-action-btn');
if (typenameBtn) typenameBtn.style.display = '';
```

### F. Theme/Resize Exclusions — (if your type shouldn't have these)

If your module shouldn't be themeable, add it to the theme exclusion check in `renderModule()` and `openOverflowMenu()`:

```js
// renderModule header buttons
${data.type !== 'hline' && data.type !== 'spacer' && data.type !== 'typename' ? `<button class="module-theme-btn" ...>` : ''}

// openOverflowMenu theme check
if (moduleType !== 'hline' && moduleType !== 'spacer' && moduleType !== 'typename') {
```

If your module shouldn't be resizable:
```js
if (data.type !== 'hline' && data.type !== 'typename') {
    initResizeHandle(el, data);
}
```

---

## Step 6 — Add CSS to `main.css`

### A. Module Type Section

Add a new section after the existing module sections (before `/* ── Responsive Size Classes */`):

```css
/* ── Your Module Type ── */
.typename-container {
    /* Container styles */
}

/* Play mode elements */
.typename-display { }

/* Edit mode elements */
.typename-edit-row { }
.typename-edit-input { }
```

**Rules:**
- Always use `--cv-*` color tokens — never hardcode hex in component styles
- Use `var(--cv-bg-sunken)` for input backgrounds
- Use `var(--cv-border-subtle)` for input borders
- Use `var(--cv-accent)` for focus states and interactive highlights
- Use `var(--cv-danger)` / `var(--cv-success)` / `var(--cv-warning)` for semantic states
- Add `user-select: none` on non-content display text

**Scrollable containers** — Apply the full themed scrollbar pattern to any element with `overflow-y: auto`:

```css
.typename-scroll-container {
    overflow-y: auto;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--cv-text-muted) transparent;
}

.typename-scroll-container::-webkit-scrollbar {
    width: 4px;
}

.typename-scroll-container::-webkit-scrollbar-track {
    background: transparent;
}

.typename-scroll-container::-webkit-scrollbar-thumb {
    background: var(--cv-text-muted);
    border-radius: 2px;
}
```

Never omit `scrollbar-gutter: stable` — it reserves scrollbar space and prevents layout shift when the scrollbar appears.

### B. Responsive Size Classes — (if you have header buttons)

Add your buttons to the xs/sm hide rules:

```css
.module[data-size="xs"] .module-typename-action-btn {
    display: none !important;
}

.module[data-size="sm"] .module-typename-action-btn {
    display: none !important;
}
```

### C. XS Breakpoint Adjustments — (if your module needs compact styling)

```css
.module[data-size="xs"] .typename-display {
    font-size: smaller;
}
```

---

## Step 7 — Update `ARCHITECTURE.md`

Update these sections:

1. **Files at a Glance** table — add your new script file
2. **Script Load Order** — add to the sequence
3. **Key Functions / Globals** table — add notable functions
4. **`MODULE_TYPES{}` registered types list** — append your type
5. **Key Data Structures** — add your content schema if non-trivial

---

## Step 8 (Optional) — Wizard Sub-Options

If your type needs configuration at creation time (like Stat's layout picker or template selector):

### HTML (`main.html`)

Add a hidden section after the type grid, before the theme section:

```html
<div id="wizard-typename-option" class="wizard-typename-option">
    <label class="wizard-label" data-i18n="typename.optionLabel">Option</label>
    <!-- Your controls: buttons, selects, etc. -->
</div>
```

### CSS (`main.css`)

```css
.wizard-typename-option {
    display: none;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--cv-border-subtle);
}

.wizard-typename-option.visible {
    display: block;
}
```

### JS (`module-core.js`)

Add visibility toggle in type card click handler:

```js
const wizardTypenameOption = document.getElementById('wizard-typename-option');
// In type card click handler:
wizardTypenameOption.classList.toggle('visible', wizardState.type === 'typename');
```

Add reset in `resetWizard()`:

```js
if (wizardTypenameOption) {
    wizardTypenameOption.classList.toggle('visible', defaultType === 'typename');
}
```

Add state field to `wizardState`:

```js
wizardState = { type: defaultType, theme: null, statLayout: 'large-stat', statTemplate: '', typenameOption: 'default' };
```

---

## Checklist

Copy this into your plan when creating a new module:

```
- [ ] Define content shape (data.content structure)
  - [ ] Include zero-state defaults
  - [ ] Add `sortBy` / `sortDir` if managing lists
- [ ] Create `scripts/module-TYPENAME.js` with registerModuleType()
  - [ ] Implement robust Play vs Edit mode logic
  - [ ] Ensure manual sorting is disabled when list is auto-sorted
- [ ] Add `type.typename` to translations.js (all 7 languages)
- [ ] Add module-specific translation keys (all 7 languages)
- [ ] Use data-i18n / data-i18n-placeholder / data-i18n-title for static HTML text
- [ ] Add wizard type card to main.html (alphabetical order)
- [ ] Add <script> tag to main.html (after module-core.js, before app.js)
- [ ] Add creation defaults in module-core.js btnWizardCreate handler
- [ ] Add header buttons in renderModule() (if applicable)
- [ ] Add button event handlers in renderModule() (if applicable)
- [ ] Add title attributes to all toolbar buttons (if applicable)
- [ ] Add overflow menu entries in openOverflowMenu() (if applicable)
- [ ] Add button hide/show in applyPlayMode/applyEditMode (if applicable)
- [ ] Update theme/resize exclusions (if applicable)
- [ ] Add CSS section in main.css
- [ ] Apply themed scrollbar styles to any scrollable container
- [ ] Add responsive size rules in main.css (if applicable)
- [ ] Update ARCHITECTURE.md
- [ ] Add wizard sub-options (if applicable)
```

---

## Common Implementation Patterns

Use these as copy-paste starting points. They reflect the exact conventions used throughout the codebase — read the relevant source reference once to verify they haven't drifted, then skip re-reading it for future modules.

---

### Pattern A — Action Modal (single input + confirm)

Use for quick interactions that need one value from the user: add XP, adjust a modifier, set a field.
**Source reference:** `openHealthActionOverlay()` in `scripts/module-health.js`

```js
function openTypenameActionModal(moduleEl, data) {
    // Remove any existing instance (prevent duplicates)
    const existing = document.querySelector('.typename-action-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-action-overlay';

    // Use innerHTML for simple, fixed-layout modals
    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel typename-action-modal';
    panel.innerHTML =
        `<div class="cv-modal-header">` +
        `<span class="cv-modal-title">${escapeHtml(t('typename.modalTitle'))}</span>` +
        `<button class="cv-modal-close" title="${escapeHtml(t('typename.cancel'))}">` +
        `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
        `</button>` +
        `</div>` +
        `<div class="cv-modal-body">` +
        `<input type="text" class="typename-action-input" placeholder="0" spellcheck="false" autocomplete="off">` +
        `</div>` +
        `<div class="cv-modal-footer">` +
        `<button class="typename-action-cancel btn-secondary sm">${escapeHtml(t('typename.cancel'))}</button>` +
        `<button class="typename-action-ok btn-primary sm">${escapeHtml(t('typename.ok'))}</button>` +
        `</div>`;

    const input  = panel.querySelector('.typename-action-input');
    const closeBtn  = panel.querySelector('.cv-modal-close');
    const cancelBtn = panel.querySelector('.typename-action-cancel');
    const okBtn     = panel.querySelector('.typename-action-ok');

    // Pre-fill current value if editing
    input.value = data.content.someField ?? '';

    function confirm() {
        // Validate / parse input — bail silently if invalid
        const val = parseInt(input.value, 10);
        if (isNaN(val)) { cancel(); return; }

        // Mutate data, save, re-render
        data.content.someField = val;
        scheduleSave();
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['typename'].renderBody(bodyEl, data, /* isPlayMode */ true);
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
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cancel(); });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    input.focus();
    input.select();
}
```

**Note:** To support math expressions (e.g. `2d6+5`), replace `parseInt` with `evaluateHealthExpression(input.value)` from `shared.js`. Returns `null` on invalid input.

---

### Pattern B — Settings Modal (structured configuration panel)

Use for module settings with multiple fields, toggles, or selects. Uses `createElement` instead of innerHTML for readability when the body is complex.
**Source references:** `openAbilitySettings()` in `scripts/module-abilities.js`, `openSaveSettings()` in `scripts/module-savingthrow.js`

```js
function openTypenameSettings(moduleEl, data) {
    const existing = document.querySelector('.typename-settings-overlay');
    if (existing) existing.remove();

    // Work on a local copy — only commit on Save
    const working = { ...data.content };
    let dirty = false;

    const overlay = document.createElement('div');
    overlay.className = 'cv-modal-overlay typename-settings-overlay';

    const panel = document.createElement('div');
    panel.className = 'cv-modal-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'cv-modal-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'cv-modal-title';
    titleEl.textContent = t('typename.settingsTitle');
    const closeBtnEl = document.createElement('button');
    closeBtnEl.className = 'cv-modal-close';
    closeBtnEl.title = t('typename.close');
    closeBtnEl.innerHTML =
        '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    header.appendChild(titleEl);
    header.appendChild(closeBtnEl);

    // Body
    const body = document.createElement('div');
    body.className = 'cv-modal-body';

    // Example: checkbox toggle
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'cv-modal-label';
    const toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.checked = working.someToggle;
    toggleLabel.appendChild(toggleCheckbox);
    toggleLabel.appendChild(document.createTextNode('\u00a0' + t('typename.someToggle')));
    body.appendChild(toggleLabel);

    toggleCheckbox.addEventListener('change', () => {
        working.someToggle = toggleCheckbox.checked;
        dirty = true;
    });

    // Example: select dropdown
    const selectLabel = document.createElement('label');
    selectLabel.className = 'cv-modal-label';
    selectLabel.textContent = t('typename.someOption');
    const select = document.createElement('select');
    [
        { value: 'a', label: t('typename.optionA') },
        { value: 'b', label: t('typename.optionB') },
    ].forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === working.someOption) opt.selected = true;
        select.appendChild(opt);
    });
    select.addEventListener('change', () => {
        working.someOption = select.value;
        dirty = true;
    });
    body.appendChild(selectLabel);
    body.appendChild(select);

    // Footer
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
        document.removeEventListener('keydown', onKeydown);
    }

    function save() {
        // Commit working copy → data.content
        data.content.someToggle = working.someToggle;
        data.content.someOption = working.someOption;
        scheduleSave();
        // Re-render
        const bodyEl = moduleEl.querySelector('.module-body');
        const isPlay = modeToggle.classList.contains('mode-play');
        MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlay);
        close();
    }

    closeBtnEl.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    saveBtn.addEventListener('click', save);
    overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (dirty && !window.confirm(t('common.discardChanges'))) return;
        close();
    });

    function onKeydown(e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            if (dirty && !window.confirm(t('common.discardChanges'))) return;
            close();
        }
    }
    document.addEventListener('keydown', onKeydown);
}
```

**Note on dirty state:** The discard prompt guards both Escape key and clicking outside the overlay — always check `dirty` in both places. Only use this if the user's partial changes would be confusing to lose. Simple single-field settings don't need it. See `openSaveSettings()` in `scripts/module-savingthrow.js` for a real dirty-state example.

---

### Pattern C — Editable List (add / edit / delete / reorder rows)

Use inside a settings modal body when the user needs to manage an array (e.g. XP thresholds, custom categories, tier definitions).
**Source reference:** `openCustomTierEditor()` in `scripts/module-savingthrow.js`

```js
// workingItems is a local array (copy of data.content.someArray)
// Call buildRows() after any mutation to re-render the list

const listEl = document.createElement('div');
listEl.className = 'typename-item-list';
body.appendChild(listEl);

let listSortable = null;

function buildRows() {
    listEl.innerHTML = '';
    workingItems.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'typename-item-row';
        row.dataset.index = i;
        row.innerHTML =
            `<span class="typename-drag-handle">&#x2807;</span>` +
            `<input type="text" class="typename-item-input" value="${escapeHtml(item.name)}" placeholder="${escapeHtml(t('typename.itemPlaceholder'))}">` +
            `<button class="typename-item-delete" title="${escapeHtml(t('typename.deleteItem'))}">` +
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
            `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` +
            `</svg>` +
            `</button>`;

        row.querySelector('.typename-item-input').addEventListener('input', (e) => {
            workingItems[i].name = e.target.value;
            dirty = true;
        });
        row.querySelector('.typename-item-delete').addEventListener('click', () => {
            workingItems.splice(i, 1);
            buildRows();
            initSortable();
            dirty = true;
        });

        listEl.appendChild(row);
    });
}

function initSortable() {
    if (listSortable) listSortable.destroy();
    listSortable = new Sortable(listEl, {
        handle: '.typename-drag-handle',
        animation: 150,
        ghostClass: 'cv-drag-ghost',
        draggable: '.typename-item-row',
        onEnd() {
            const rows = Array.from(listEl.querySelectorAll('.typename-item-row'));
            const reordered = rows.map((r) => workingItems[parseInt(r.dataset.index, 10)]).filter(Boolean);
            workingItems.length = 0;
            reordered.forEach((item) => workingItems.push(item));
            rows.forEach((r, i) => { r.dataset.index = i; });
            dirty = true;
        },
    });
}

buildRows();
initSortable();

const addBtn = document.createElement('button');
addBtn.className = 'btn-secondary typename-add-btn';
addBtn.textContent = t('typename.addItem');
addBtn.addEventListener('click', () => {
    workingItems.push({ name: '' });
    buildRows();
    initSortable();
    dirty = true;
    // Scroll to and focus the new row's input
    const inputs = listEl.querySelectorAll('.typename-item-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
});
body.appendChild(addBtn);
```

**Important:** Always call `initSortable()` after `buildRows()` — SortableJS needs to re-attach after the DOM is rebuilt. See the memory note in `MEMORY.md` about always explicitly re-rendering the list after item removal.

---

### Pattern D — Cross-Module Linking

Use when your module needs to read data from another module instance (e.g. reference a character's level, stat block, or health pool).
**Source reference:** `openAbilitySettings()` and `buildAbilityBody()` in `scripts/module-abilities.js`

**1. Content schema** — store the linked module's ID, not a reference:
```js
content: {
    linkedTypenameModuleId: null,  // null = no link
    // ...rest of your content
}
```

**2. Linking dropdown in settings modal:**
```js
const linkLabel = document.createElement('label');
linkLabel.className = 'cv-modal-label';
linkLabel.textContent = t('typename.linkedModule');

const linkSelect = document.createElement('select');

const noneOpt = document.createElement('option');
noneOpt.value = '';
noneOpt.textContent = t('typename.noLinkedModule');
linkSelect.appendChild(noneOpt);

window.modules
    .filter((m) => m.type === 'targettype')
    .forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.title || t('type.targettype');
        linkSelect.appendChild(opt);
    });

linkSelect.value = data.content.linkedTypenameModuleId || '';
```

**3. Reading linked data at render time:**
```js
function getLinkedData(data) {
    const id = data.content.linkedTypenameModuleId;
    if (!id) return null;
    const mod = window.modules.find((m) => m.id === id && m.type === 'targettype');
    return mod ? mod.content : null;
}

// In renderBody():
const linked = getLinkedData(data);
const someValue = linked ? linked.someField : null;
```

**4. Exposing a global API** (optional — for modules consumed by many others):
```js
// At end of module-typename.js, outside registerModuleType():
window.getTypenameValue = function(moduleId) {
    const mod = window.modules.find((m) => m.id === moduleId && m.type === 'typename');
    return mod ? mod.content.someField : null;
};
```

---

### Pattern E — Column Sort (3-State Cycle)

Use when your module manages sortable lists with column headers (e.g. table, stat block with columns). Implements the standard 3-state sort toggle: Custom → Ascending → Descending → back to Custom.
**Source reference:** `module-list.js` (column header click handlers, `isSorted` flag logic)

**1. Content schema** — store sort state:
```js
content: {
    items: [ /* your data */ ],
    sortBy: null,           // null = custom/manual order, or column key (e.g., '__name__' or 'attr-id')
    sortDir: 'asc',         // 'asc' or 'desc' (only meaningful when sortBy is not null)
}
```

**2. Toggle logic on column header click** — repeats for each sortable column:
```js
columnHeader.addEventListener('click', () => {
    if (content.sortBy === 'columnKey') {
        if (content.sortDir === 'asc') {
            content.sortDir = 'desc';       // Ascending → Descending
        } else {
            content.sortBy = null;          // Descending → Custom (clear sort)
            content.sortDir = 'asc';
        }
    } else {
        content.sortBy = 'columnKey';       // Custom → Ascending (first click)
        content.sortDir = 'asc';
    }
    scheduleSave();
    // Re-render to apply new sort and update drag handle visibility
    MODULE_TYPES['typename'].renderBody(bodyEl, data, isPlayMode);
});
```

**3. Disable drag-to-reorder when sorted** — SortableJS must be disabled when an active sort is applied:
```js
const isSorted = content.sortBy !== null;

// Render drag handles only when not sorted
if (!isPlayMode && !isSorted) {
    const handle = document.createElement('span');
    handle.className = 'typename-drag-handle';
    handle.innerHTML = '&#x2807;';
    row.appendChild(handle);
}

// Initialize SortableJS only when not sorted
if (!isPlayMode && !isSorted) {
    initTypenameListSortable(container, data);
}
```

The strategy is two-pronged: no drag handle is rendered (user can't grab anything), and `initSortable()` is never called, so no SortableJS instance exists for that render cycle. Always call `renderBody()` after toggling sort to re-render with updated handle visibility.

---

## Common Pitfalls

1. **Forgetting a language** — Missing translation keys fall back to English silently. Always add to all 7 blocks.
2. **Wizard card order** — Cards must be alphabetical by display name, not by type key.
3. **Script load order** — Your module file must load after `module-core.js` or `registerModuleType` won't exist yet.
4. **Content guard in renderBody** — Always validate `data.content` shape at the top of `renderBody()`. Saved data can be corrupted or from an older version.
5. **Hardcoded colors** — Never use hex values in component CSS. Use `--cv-*` tokens.
6. **CSS mask-image** — Not supported in TaleSpire's Chromium. Use inline SVG icons.
7. **Missing scheduleSave()** — Every user interaction that changes `data` must call `scheduleSave()` or changes won't persist.
8. **Mode button visibility** — If you add header buttons, you must hide them in `applyPlayMode()` and show them in `applyEditMode()`, plus add them to the xs/sm responsive hide rules.
