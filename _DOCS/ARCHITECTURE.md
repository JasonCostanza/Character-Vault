# Architecture

> Code map for Character Vault. Designed to help Claude Code (and humans) find things fast without exploratory searching.

## Files at a Glance

| File | Purpose |
|---|---|
| `manifest.json` | Symbiote metadata: API subscriptions, capabilities, extras, entry point |
| `main.html` | **All markup** — HTML structure only, loads scripts via `<script src>` tags |
| `main.css` | **All styles** — theme tokens, components, overlays |
| `scripts/translations.js` | **i18n dictionary** — `CV_TRANSLATIONS` object keyed by language code (`en`, `es`, `fr`, `de`, `pt-BR`, `ru`) |
| `scripts/shared.js` | Shared utilities: `escapeHtml()`, markdown rendering (`renderMarkdown`, `attachCheckboxHandlers`, `toggleCheckboxInMarkdown`) |
| `scripts/i18n.js` | Localization: `currentLang`, `t()`, `applyTranslations()`, `refreshModuleLabels()` |
| `scripts/theme.js` | Theme system: `setTheme()`, `loadTheme()` |
| `scripts/settings.js` | Settings overlay, mode toggle, theme buttons, language picker, save/load buttons, force reload |
| `scripts/persistence.js` | Save/load system: `migrateData()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` |
| `scripts/module-core.js` | Module engine: state (`modules[]`), wizard, type registry (`MODULE_TYPES`), `renderModule()`, drag & drop, delete confirm, edit/play mode switching, resize handle |
| `scripts/module-abilities.js` | Abilities module type registration + helpers (render, edit, sortable, proficiency sync, settings panel, dice rolling) |
| `scripts/module-text.js` | Text Box module type registration |
| `scripts/module-stat.js` | Stat module type registration + helpers (render, edit, quick-edit, dice rolling) |
| `scripts/module-hr.js` | Horizontal Line module type registration |
| `scripts/module-resistance.js` | Resistance module type registration + helpers (settings panel, staging area, creation wizard, drag-to-assign) |
| `scripts/module-condition.js` | Condition module type registration + helpers (settings panel, staging area, game system templates, cascading sub-conditions, custom wizard) |
| `scripts/app.js` | Startup: applies translations, triggers auto-load |

There is no build step. Everything ships as-is to TaleSpire's embedded Chromium.

### Script Load Order

Scripts are loaded via plain `<script src>` tags (no `async`/`defer`) in `main.html`, which guarantees sequential execution. The order matters because later scripts depend on globals defined by earlier ones:

```
translations.js → shared.js → i18n.js → theme.js → settings.js → persistence.js → module-core.js → module-condition.js → module-counters.js → module-text.js → module-abilities.js → module-stat.js → module-health.js → module-hr.js → module-spacer.js → module-resistance.js → module-list.js → app.js
```

## External Dependencies (CDN)

| Library | Version | Used For |
|---|---|---|
| [SortableJS](https://github.com/SortableJS/Sortable) | 1.15.6 | Module drag-and-drop reordering |
| [Marked](https://github.com/markedjs/marked) | 15.0.7 | Markdown → HTML rendering (Text Box play mode) |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.2.5 | Sanitize rendered markdown output |

---

## main.html — Markup Sections

The HTML body contains these top-level regions, in order:

| Element / ID | Description |
|---|---|
| `#menu-bar` | Top bar with Settings, New Module, and Edit/Play toggle buttons |
| `#content` > `#module-grid` | CSS Grid container (4-col) holding all modules + `#empty-state` |
| `#settings-overlay` | Full-screen settings panel (language, theme, save/load, troubleshooting, links) |
| `#wizard-overlay` | New Module wizard (type selection, color swatch picker) |
| `#delete-confirm-overlay` | Modal dialog confirming module deletion |

---

## JavaScript — Script Files

All JS lives in `scripts/` as separate files loaded by `main.html` in dependency order. Each file uses `// ── Name ──` section headers internally.

| File | Key Functions / Globals |
|---|---|
| **shared.js** | `escapeHtml(text)`, `renderMarkdown(raw)` (Marked + DOMPurify), `attachCheckboxHandlers()`, `toggleCheckboxInMarkdown()` |
| **i18n.js** | `currentLang`, `t(key, replacements?)`, `applyTranslations()`, `refreshModuleLabels()` — lightweight localization; HTML elements use `data-i18n` / `data-i18n-*` attributes for static text, JS calls `t()` for dynamic text |
| **theme.js** | `setTheme(theme)`, `loadTheme()` — runs `loadTheme()` on load |
| **settings.js** | `modeToggle` element (toggles `.mode-edit` / `.mode-play`), `openSettings()`, `closeSettings()`, `updateThemeButtons(theme)`, language select handler, save/load button wiring, force reload, `chkAutoSave`, `chkAutoLoad` |
| **persistence.js** | `migrateData()`, `syncModuleState()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` — TaleSpire campaign localStorage persistence with auto-save debounce |
| **module-core.js** | `modules[]` array, `moduleIdCounter`, `generateModuleId()`, `wizardState`, wizard open/close/reset, global Escape key handler, wizard interactions (type cards, color swatches), create module handler, `MODULE_TYPES{}` registry, `registerModuleType()`, `renderModule(data)`, SortableJS drag & drop, `openDeleteConfirm()`, `closeDeleteConfirm()`, `deleteModule()`, `applyPlayMode()`, `applyEditMode()`, `initResizeHandle()` (constants `GRID_COLUMNS=4`, `GRID_GAP=8`, row height `80px`) |
| **module-text.js** | `registerModuleType('text', ...)` — textarea in edit mode, rendered markdown in play mode; `autoResizeTextarea()`, `syncState()` |
| **module-abilities.js** | `getProficiencyState(ability, data)`, `rollAbilityCheck(ability)`, `renderAbilityRow()`, `renderAbilityRowEdit()`, `reRenderAbilityEdits()`, `initAbilitySortable()`, `openAbilitySettings()`, `buildAbilityBody()`, `registerModuleType('abilities', ...)` — skill list with modifier badges, proficiency dots, linked Stat module sync, play mode dice rolling, settings panel |
| **module-stat.js** | `formatModifier(mod)`, `renderStatBlock()`, `renderStatBlockEdit()`, `reRenderStatEdits()`, `initStatSortable()`, `rollStatCheck(stat)`, `enterQuickEdit()`, `registerModuleType('stat', ...)` — stat blocks with values/modifiers, play mode dice rolling, edit mode inputs, layout toggle (large-stat / large-modifier) |
| **module-hr.js** | `registerModuleType('hline', ...)` — simple `<hr>` divider, header hidden in play mode |
| **module-resistance.js** | `registerModuleType('resistance', ...)` — drag-to-assign resistance/immunity/weakness columns; `openResSettingsPanel()`, `openResWizard()`, SortableJS staging area, value prompts, layout toggle |
| **module-condition.js** | `registerModuleType('condition', ...)` — game system template conditions with toggle/value types; `openCondSettingsPanel()`, `openCondWizard()`, SortableJS staging area, cascading sub-conditions, expand modal, template switching |
| **app.js** | Startup: `applyTranslations()`, `refreshModuleLabels()`, auto-load check (`chkAutoLoad` + `TS` availability → `loadCharacter()`) |

---

## main.css — Style Sections

Sections are delimited by `/* ── Name ── */` comment headers.

| Section | What it Styles |
|---|---|
| **Dark Theme** | `:root` / `[data-theme="dark"]` — all `--cv-*` token definitions |
| **Light Theme** | `[data-theme="light"]` — parchment palette override |
| **Icon System** | `.icon` base class for inline SVGs |
| **Reset** | Box-sizing reset, body layout (flex column, 100vh) |
| **Top Menu Bar** | `#menu-bar`, `#menu-left`, `#menu-right` |
| **Menu Buttons** | `.menu-btn` base + `.mode-edit` / `.mode-play` states, `.mode-label` |
| **Main Content Area** | `#content` (flex: 1, overflow scroll) |
| **Settings Overlay** | Full-screen overlay, panel, header, body, sections, form controls (select, toggle, checkboxes, tooltips, warning button variant, hint text, links), footer |
| **Module Grid** | `#module-grid` — 4-col CSS Grid, 8px gap |
| **Empty State** | `#empty-state` centered message |
| **Module** | `.module` card, `.module-header`, `.module-drag-handle`, `.module-type-label`, `.module-textcolor-btn`, `.module-copy-btn`, `.module-delete-btn` |
| **Delete Confirmation** | `.delete-confirm-overlay`, panel, title, actions, button variants |
| **Module Body / Text** | `.module-body`, `.module-textarea`, `.module-text-display`, full markdown rendered content styles (h1–h6, lists, blockquotes, code, tables, images) |
| **Module Resize & Drag** | `.module-resize-handle`, `.module-resizing`, `.module-ghost`, `.module-dragging`, `.module-drag-active` |
| **Abilities Module** | `.ability-container`, `.ability-row`, `.ability-rollable`, `.ability-proficiency-dot`, `.ability-name`, `.ability-modifier`, `.ability-edit-row`, `.ability-drag-handle`, `.ability-edit-name`, `.ability-edit-modifier`, `.ability-edit-proficiency-label`, `.ability-edit-delete`, `.ability-empty-state`, `.ability-ghost`, `.ability-settings-select` |
| **Stat Module** | `.stat-container`, `.stat-block`, `.stat-rollable`, `.stat-name`, `.stat-primary`, `.stat-secondary`, `.stat-proficiency-dot`, `.stat-block-edit`, edit inputs/toggles, `.stat-add-btn`, `.stat-quick-input`, `.stat-ghost`, wizard layout buttons (`.wizard-stat-layout`, `.wizard-layout-btn`) |
| **Wizard Overlay** | Full-screen overlay, panel, header, body, type cards grid, color swatches, footer buttons |

---

## Key Data Structures

### `modules[]` (array)
The source of truth for all modules on the sheet. Each entry:
```js
{
  id: 'module-001',       // unique, from generateModuleId()
  type: 'text',           // registered module type key
  title: null,            // custom user title (null = use type label)
  colSpan: 2,             // grid columns (1–4)
  rowSpan: 2,             // visual rows (height = rowSpan * 80px + gaps)
  order: 0,               // position index
  theme: '#2D5A3D',       // custom bg color or null
  textLight: false,       // light text mode toggle
  content: ''             // type-specific data (text content for 'text' type)
}
```

### `MODULE_TYPES{}` (registry object)
Maps type keys to behavior definitions. Each entry:
```js
{
  label: 'type.text',                          // i18n key — resolve with t(typeDef.label)
  renderBody(bodyEl, data, isPlayMode) {},     // populate .module-body
  onPlayMode(moduleEl, data) {},               // transition to play mode
  onEditMode(moduleEl, data) {},               // transition to edit mode
  syncState(moduleEl, data) {}                 // optional — sync live DOM state to data before save
}
```
Currently registered types: `abilities`, `text`, `stat`, `hline`, `health`, `spacer`, `list`, `resistance`, `condition`

### Save Blob (JSON schema v1)
Character sheet persistence format, stored via `TS.localStorage.campaign`:
```js
{
  version: 1,                   // schema version for migrations
  savedAt: '2026-03-21T...',    // ISO timestamp
  moduleIdCounter: 5,           // resume ID generation
  modules: [ /* modules[] array entries */ ]
}
```

### Abilities Module `content` (object)
When `type === 'abilities'`, the `content` field stores:
```js
{
  linkedStatModuleId: null,   // or module ID string — syncs proficiency from a Stat module
  abilities: [
    { name: 'Acrobatics', modifier: 3, proficiency: false, linkedStat: 'DEX' },
    ...
  ]
}
```

### Stat Module `content` (object)
When `type === 'stat'`, the `content` field stores:
```js
{
  layout: 'large-stat',  // or 'large-modifier'
  stats: [
    { name: 'Strength', value: 16, modifier: 3, proficient: false, rollable: true },
    ...
  ]
}
```

### Resistance Module `content` (object)
When `type === 'resistance'`, the `content` field stores:
```js
{
  layout: 'columns',       // or 'rows'
  immunities: [
    { id: 'res_abc', typeKey: 'fire', value: 'Immune', active: true }
  ],
  resistances: [
    { id: 'res_def', typeKey: 'cold', value: '5', active: true }
  ],
  weaknesses: [],
  customTypes: [
    { key: 'custom_xyz', name: 'Void', icon: 'force' }
  ]
}
```

### `wizardState` (object)
Transient state for the New Module wizard:
```js
{ type: 'text', theme: null, statLayout: 'large-stat', statTemplate: '', abilitiesTemplate: '' }
```

---

## Event & Data Flow

### Creating a Module
```
User clicks "New Module" → openWizard()
  → User picks type + color → wizardState updated
  → User clicks "Add Module" → btnWizardCreate handler
    → builds moduleData object
    → modules.push(moduleData)
    → renderModule(moduleData)  → MODULE_TYPES[type].renderBody()
    → updateEmptyState()
    → closeWizard()
```

### Edit/Play Mode Toggle
```
User clicks mode toggle button
  → classList swap: mode-edit ↔ mode-play
  → SortableJS enabled/disabled
  → applyPlayMode() or applyEditMode()
    → iterates all .module elements
    → calls MODULE_TYPES[type].onPlayMode/onEditMode per module
    → shows/hides edit-only UI (drag handle, resize handle, delete/copy/textcolor buttons)
```

### Module Resize
```
mousedown on .module-resize-handle
  → captures startX/Y, startColSpan, startRowSpan
  → mousemove: calculates delta cols/rows from pixel distance
    → updates data.colSpan, data.rowSpan
    → sets gridColumn span + pixel height on element
  → mouseup: removes listeners, logs result
```

### Module Reorder (Drag & Drop)
```
SortableJS handles drag via .module-drag-handle
  → onEnd callback:
    → reads new DOM order of .module elements
    → re-sorts modules[] array to match
    → updates order index on each entry
```

### Module Deletion
```
User clicks delete button → openDeleteConfirm(moduleId)
  → pendingDeleteId set
  → User confirms → deleteModule(moduleId)
    → removes DOM element
    → filters modules[] array
    → re-indexes order
    → updateEmptyState()
```

### Saving a Character
```
saveCharacter() called (manual button or scheduleSave debounce)
  → syncModuleState()
    → iterates .module DOM elements
    → calls MODULE_TYPES[type].syncState() per module (if defined)
  → serializeCharacter() → JSON string with version, modules[], moduleIdCounter
  → TS.localStorage.campaign.setBlob(jsonStr)
```

### Loading a Character
```
loadCharacter() called (manual button or auto-load on startup)
  → TS.localStorage.campaign.getBlob()
  → deserializeCharacter(jsonStr)
    → JSON.parse → migrateData(blob)
    → clears existing modules from DOM and modules[]
    → restores moduleIdCounter
    → iterates saved modules, calls renderModule() for each
    → updateEmptyState()
```

### Auto-Save Trigger Points
```
scheduleSave() called after:
  → module created (btnWizardCreate handler)
  → module deleted (deleteModule)
  → module reordered (SortableJS onEnd)
  → module resized (resize onMouseUp)
  → text content edited (textarea input handler)
  → text color toggled (textColorBtn handler)
  → title renamed (titleInput input handler)
  → checkbox toggled in markdown (toggleCheckboxInMarkdown)
  → stat added, deleted, edited, or reordered
  → stat quick-edit committed
  → 2-second debounce → saveCharacter()
```

### Data Sorting Cycle (for Lists/Counters)
```
User clicks a column header
  → cycles state: Ascending (`asc`) → Descending (`desc`) → Custom (`null`)
  → updates `data.content.sortBy` and `data.content.sortDir`
  → re-renders module content based on new sort
  → if ascending/descending: manual SortableJS drag is explicitly disabled
  → if custom: SortableJS drag is enabled
  → scheduleSave()
```

### Quick Edit (Play Mode)
```
User Ctrl+Clicks an editable value in Play mode
  → enters temporary inline input state (bypassing full Edit mode shift)
  → User types new value and triggers confirmation (blur, Enter)
  → value is saved to data
  → UI reverts to static text display with new value applied
  → scheduleSave()
```

---

## z-index Layers

| z-index | Element |
|---|---|
| 300 | Delete confirmation overlay |
| 200 | Settings overlay, Wizard overlay |
| 100 | Menu bar, module being dragged |
| 50 | Module being resized |
| 10 | Module resize handle |

---

## CSS Grid Layout

- Container: `#module-grid` — `grid-template-columns: repeat(4, 1fr)`, gap `8px`, padding `8px`
- Modules span 1–4 columns via `grid-column: span N`
- Row height is content-driven by default; fixed when user resizes (`rowSpan * 80px + gaps`)
- `align-items: start` prevents modules from stretching to fill row height
