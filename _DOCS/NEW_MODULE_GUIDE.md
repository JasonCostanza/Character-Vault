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
  - **Play Mode:** Read-only data display with direct in-game interactions (toggles, rolling, quick stat adjustments). Support Quick Edit (Ctrl+Click) on key values to avoid full mode toggles.
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

### Reference Implementations by Complexity

| Complexity | File | Lines | Notes |
|---|---|---|---|
| Minimal | `module-hr.js` | ~20 | No content, just a visual separator |
| Simple | `module-spacer.js` | ~25 | No content, minimal edit controls |
| Medium | `module-text.js` | ~60 | Textarea input, markdown rendering |
| Complex | `module-health.js` | ~230 | Multiple fields, action overlays, math eval |
| Complex | `module-stat.js` | ~330 | Nested arrays, drag-drop, inline editing |

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
  - [ ] Wire up Quick Edit (Ctrl+Click) if applicable
  - [ ] Ensure manual sorting is disabled when list is auto-sorted
- [ ] Add `type.typename` to translations.js (all 7 languages)
- [ ] Add module-specific translation keys (all 7 languages)
- [ ] Add wizard type card to main.html (alphabetical order)
- [ ] Add <script> tag to main.html (after module-core.js, before app.js)
- [ ] Add creation defaults in module-core.js btnWizardCreate handler
- [ ] Add header buttons in renderModule() (if applicable)
- [ ] Add button event handlers in renderModule() (if applicable)
- [ ] Add overflow menu entries in openOverflowMenu() (if applicable)
- [ ] Add button hide/show in applyPlayMode/applyEditMode (if applicable)
- [ ] Update theme/resize exclusions (if applicable)
- [ ] Add CSS section in main.css
- [ ] Add responsive size rules in main.css (if applicable)
- [ ] Update ARCHITECTURE.md
- [ ] Add wizard sub-options (if applicable)
```

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
