# Architecture

> Code map for Character Vault. Designed to help Claude Code (and humans) find things fast without exploratory searching.

**Important:** When referencing this file in prompts or issues, use section names and function names, never line numbers. Line numbers change as the file evolves; section/function references remain stable.

## Files at a Glance

| File | Purpose |
|---|---|
| `manifest.json` | Symbiote metadata: API subscriptions, capabilities, extras, entry point |
| `main.html` | **All markup** — HTML structure only, loads scripts via `<script src>` tags |
| `main.css` | **All styles** — theme tokens, components, overlays |
| `scripts/translations.js` | **i18n dictionary** — `CV_TRANSLATIONS` object keyed by language code (`en`, `es`, `fr`, `de`, `pt-BR`, `ru`) |
| `scripts/shared.js` | Shared utilities: `escapeHtml()`, markdown rendering (`renderMarkdown`, `attachCheckboxHandlers`, `toggleCheckboxInMarkdown`), `buildCvSelect()` themed dropdown builder |
| `scripts/i18n.js` | Localization: `currentLang`, `t()`, `applyTranslations()`, `refreshModuleLabels()` |
| `scripts/theme.js` | Theme system: `setTheme()`, `loadTheme()` |
| `scripts/settings.js` | Settings overlay, mode toggle, theme buttons, language picker, save/load buttons, force reload |
| `scripts/persistence.js` | Save/load system: `migrateData()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` |
| `scripts/module-core.js` | Module engine: state (`modules[]`), wizard, type registry (`MODULE_TYPES`), `renderModule()`, drag & drop, delete confirm, edit/play mode switching, resize handle |
| `scripts/module-activity.js` | Activity Log submodule — event log with tag filtering, character-level shared data (`window.activityLog`), global `logActivity()` API |
| `scripts/module-abilities.js` | Abilities module type registration + helpers (render, edit, sortable, proficiency sync, settings panel, dice rolling) |
| `scripts/module-text.js` | Text Box module type registration |
| `scripts/module-stat.js` | Stat module type registration + helpers (render, edit, quick-edit, dice rolling) |
| `scripts/module-hr.js` | Horizontal Line module type registration |
| `scripts/module-health.js` | Health module type registration + helpers (HP/Max HP/Temp HP tracking, damage/healing, quick-edit, play/edit layers, health action overlay) |
| `scripts/module-level.js` | Level/XP module type registration + helpers (XP-based or milestone leveling, progress bar, level-up logic, XP modal, settings modal, cross-module API) |
| `scripts/module-spacer.js` | Spacer module type registration (blank visual separator, no content) |
| `scripts/module-resistance.js` | Resistance module type registration + helpers (settings panel, staging area, creation wizard, drag-to-assign) |
| `scripts/module-savingthrow.js` | Saving Throw module type registration + helpers (render blocks, edit blocks, sortable, quick-edit, dice rolling, notes area, settings modal, custom tier editor) |
| `scripts/module-spells.js` | Spells module type registration + helpers (pip-style slot tracking, category/spell editor, SortableJS reorder, cast logic, detail/edit/settings modals, dice roll dispatch) |
| `scripts/module-list.js` | List module type registration + helpers (multi-column item tables, custom attributes, attribute wizard, cross-list drag transfer, inspect overlay, sortable) |
| `scripts/module-condition.js` | Condition module type registration + helpers (settings panel, staging area, game system templates, cascading sub-conditions, custom wizard) |
| `scripts/module-recovery.js` | Recovery module type registration + helpers (rest buttons, hit dice subsystem, confirmation dialog, game system templates, cross-module API calls to Health and Spells) |
| `scripts/module-weapons.js` | Weapons module type registration + helpers (two-column main/off layout, weapon cards, attack/damage roll dispatch, SortableJS cross-column drag, quick-edit ammo/shield HP, action modal, edit modal) |
| `scripts/app.js` | Startup: applies translations, triggers auto-load |

There is no build step. Everything ships as-is to TaleSpire's embedded Chromium.

### Script Load Order

Scripts are loaded via plain `<script src>` tags (no `async`/`defer`) in `main.html`, which guarantees sequential execution. The order matters because later scripts depend on globals defined by earlier ones:

```
translations.js → shared.js → i18n.js → theme.js → settings.js → persistence.js → module-core.js → module-activity.js → module-condition.js → module-counters.js → module-text.js → module-abilities.js → module-stat.js → module-health.js → module-hr.js → module-level.js → module-spacer.js → module-resistance.js → module-savingthrow.js → module-spells.js → module-list.js → module-recovery.js → module-weapons.js → app.js
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
| **shared.js** | `escapeHtml(text)`, `renderMarkdown(raw)` (Marked + DOMPurify), `attachCheckboxHandlers()`, `toggleCheckboxInMarkdown()`, `inferTierPreset(systemKey)`, `getGameSystemDisplayName(systemKey)`, `buildCvSelect(options, currentValue, onChange)` |
| **i18n.js** | `currentLang`, `t(key, replacements?)`, `applyTranslations()`, `refreshModuleLabels()` — lightweight localization; HTML elements use `data-i18n` / `data-i18n-*` attributes for static text, JS calls `t()` for dynamic text |
| **theme.js** | `setTheme(theme)`, `loadTheme()` — runs `loadTheme()` on load |
| **settings.js** | `modeToggle` element (toggles `.mode-edit` / `.mode-play`), `openSettings()`, `closeSettings()`, `updateThemeButtons(theme)`, language select handler, game system select handler, `syncGameSystemUI()`, save/load button wiring, force reload, `chkAutoSave`, `chkAutoLoad` |
| **persistence.js** | `migrateData()`, `syncModuleState()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` — TaleSpire campaign localStorage persistence with auto-save debounce |
| **module-core.js** | `modules[]` array, `moduleIdCounter`, `generateModuleId()`, `wizardState`, wizard open/close/reset, global Escape key handler, wizard interactions (type cards, color swatches), create module handler, `MODULE_TYPES{}` registry, `registerModuleType()`, `renderModule(data)`, SortableJS drag & drop, `openDeleteConfirm()`, `closeDeleteConfirm()`, `deleteModule()`, `applyPlayMode()`, `applyEditMode()`, `initResizeHandle()` (constants `GRID_COLUMNS=4`, `GRID_GAP=8`, row height `80px`) |
| **module-activity.js** | `registerModuleType('activity', ...)`, `window.logActivity(opts)` — global API other modules call to add entries (returns `entry.id`), `window.openActivitySettings(moduleEl, data)` — settings modal opener, `window.activityLog[]` — character-level array of log entries shared across all Activity Log module instances, `window.handleRollResult(event)` — manifest-subscribed callback that appends roll totals to pending log entries |
| **module-text.js** | `registerModuleType('text', ...)` — textarea in edit mode, rendered markdown in play mode; `autoResizeTextarea()`, `syncState()` |
| **module-abilities.js** | `getProficiencyState(ability, data)`, `rollAbilityCheck(ability)`, `renderAbilityRow()`, `renderAbilityRowEdit()`, `reRenderAbilityEdits()`, `initAbilitySortable()`, `openAbilitySettings()`, `buildAbilityBody()`, `registerModuleType('abilities', ...)` — skill list with modifier badges, proficiency dots, linked Stat module sync, play mode dice rolling, settings panel |
| **module-stat.js** | `formatModifier(mod)`, `renderStatBlock()`, `renderStatBlockEdit()`, `reRenderStatEdits()`, `initStatSortable()`, `rollStatCheck(stat)`, `enterQuickEdit()`, `registerModuleType('stat', ...)` — stat blocks with values/modifiers, play mode dice rolling, edit mode inputs, layout toggle (large-stat / large-modifier) |
| **module-hr.js** | `registerModuleType('hline', ...)` — simple `<hr>` divider, header hidden in play mode |
| **module-health.js** | `evaluateHealthExpression()`, `applyDamage()`, `applyHealing()`, `syncHealthLayersFromData()`, `buildPlayLayer()`, `buildEditLayer()`, `registerModuleType('health', ...)` — HP/Max HP/Temp HP display, damage/healing overlays, quick-edit, sync play and edit layers; exposes `window.healToFull()`, `window.resetTempHP()`, `window.applyHealingAmount()` for cross-module use |
| **module-level.js** | `evaluateXPExpression()`, `getLevelProgress()`, `levelUp()`, `renderLevelBody()`, `openXPModal()`, `openLevelSettings()`, `registerModuleType('level', ...)`, `window.getCharacterLevel()`, `window.LEVEL_XP_TEMPLATES` — XP tracking with thresholds or milestone leveling, progress bar, level-up button, cross-module API |
| **module-spacer.js** | `registerModuleType('spacer', ...)` — trivial module type, just visual spacing |
| **module-resistance.js** | `registerModuleType('resistance', ...)` — drag-to-assign resistance/immunity/weakness columns; `openResSettingsPanel()`, `openResWizard()`, SortableJS staging area, value prompts, layout toggle |
| **module-savingthrow.js** | `applySavingThrowTemplate(key)`, `applyTierPreset(key)`, `formatModifier(n)`, `renderSaveBlock()`, `renderSaveBlockEdit()`, `reRenderSaveEdits()`, `initSaveSortable()`, `rollSavingThrow()`, `enterSaveQuickEdit()`, `renderNotesArea()`, `openSaveSettings()`, `openCustomTierEditor()`, `registerModuleType('savingthrow', ...)` |
| **module-spells.js** | `isDiceNotation(val)`, `extractDiceRoll(val)`, `defaultContent()`, `genId(prefix)`, `getAvailableSlots(data, slotLevel)`, `spendSlot(data, slotLevel)`, `restoreAllSlots(moduleEl, data)`, `rollAllSpellDice(spell)`, `rollSingleAttribute(spell, attr)`, `castSpell(moduleEl, data, spell, catId, onSuccess)`, `renderSpellsPlayLayer(bodyEl, data)`, `renderSpellsEditLayer(bodyEl, data)`, `syncSpellSlots(moduleEl, data)`, `openSpellDetailModal(moduleEl, data, spell, catId)`, `openSpellEditModal(moduleEl, data, spell, catId)`, `openCategoryEditModal(moduleEl, data, cat)`, `openSpellSettings(moduleEl, data)` (also `window.openSpellSettings`), `registerModuleType('spells', ...)` |
| **module-list.js** | `renderListBody()`, `renderListItem()`, `renderAttributeCell()`, `renderColumnHeaders()`, `buildAttributeWizard()`, `buildInspectOverlay()`, `initSortableItems()`, `initSortableAttributes()`, `closeManageAttrsPanel()`, `registerModuleType('list', ...)`, `syncState()` — multi-column item tables with custom attributes, attribute wizard, cross-list drag transfer, sort control |
| **module-condition.js** | `registerModuleType('condition', ...)` — game system template conditions with toggle/value types; `openCondSettingsPanel()`, `openCondWizard()`, `window.applyConditionTemplate`, SortableJS staging area, cascading sub-conditions, expand modal |
| **module-recovery.js** | `registerModuleType('recovery', ...)` — rest buttons with configurable action lists, hit dice subsystem, confirmation dialog, game system templates; calls `window.healToFull()`, `window.resetTempHP()`, `window.applyHealingAmount()`, `window.restoreAllSpellSlots()` |
| **module-weapons.js** | `generateWeaponId()`, `ensureWeaponsContent(data)`, `weaponsComputeAttackBonus(weapon)`, `weaponsFormatDamageSummary(weapon)`, `getAttackArchetype(sys)`, `getSystemTraitCatalog()`, `resolveWeaponTrait(entry, content)`, `normalizeWeaponTraits(traits, content)`, `findOrCreateCustomTrait(name, content)`, `generateCustomTraitKey(content)`, `renderPlayBody(bodyEl, data)`, `renderEditBody(bodyEl, data)`, `initWeaponsSortable(mainCol, offCol, data, bodyEl)`, `openWeaponActionModal(moduleEl, data, weapon)`, `openWeaponEditModal(moduleEl, data, weapon, bodyEl)`, `enterQuickEditAmmo()`, `enterQuickEditShieldHp()`, `registerModuleType('weapons', ...)` — window exports: `generateWeaponId`, `ensureWeaponsContent`, `weaponsComputeAttackBonus`, `weaponsFormatDamageSummary`, `normalizeWeaponTraits`, `resolveWeaponTrait`, `findOrCreateCustomTrait`, `generateCustomTraitKey`, `getSystemTraitCatalog`, `WEAPON_TRAITS_DND5E`, `WEAPON_TRAITS_PF2E`, `WEAPON_TRAITS_DAGGERHEART` |
| **app.js** | Startup: `applyTranslations()`, `refreshModuleLabels()`, auto-load check (`chkAutoLoad` + `TS` availability → `loadCharacter()`); initializes `window.pendingRolls = {}` |

---

## main.css — Style Sections

Sections are delimited by `/* ── Name ── */` comment headers.

| Section | What it Styles |
|---|---|
| **Dark Theme** | `:root` / `[data-theme="dark"]` — all `--cv-*` token definitions |
| **Light Theme** | `[data-theme="light"]` — parchment palette override |
| **Cyberpunk Theme** | `[data-theme="cyberpunk"]` — neon palette override |
| **Sci-Fi Theme** | `[data-theme="scifi"]` — futuristic palette override |
| **Angelic Theme** | `[data-theme="angelic"]` — light angelic palette override |
| **Demonic Theme** | `[data-theme="demonic"]` — dark demonic palette override |
| **Icon System** | `.icon` base class for inline SVGs |
| **Toggle Switch** | `.cv-toggle`, `.cv-toggle-track` — styled boolean toggles (track + sliding thumb) with all theme support |
| **Reset** | Box-sizing reset, body layout (flex column, 100vh) |
| **Consolidated Button & UI Base Classes** | Shared `.btn-*`, form element resets, focus states |
| **Top Menu Bar** | `#menu-bar`, `#menu-left`, `#menu-right` |
| **Menu Buttons** | `.menu-btn` base + `.mode-edit` / `.mode-play` states, `.mode-label` |
| **Mode Toggle (Edit/Play)** | `#mode-toggle` toggle switch styling |
| **Main Content Area** | `#content` (flex: 1, overflow scroll) |
| **Settings Overlay** | Full-screen overlay, panel, header, body, sections, form controls (select, toggle, checkboxes, tooltips, warning button variant, hint text, links), footer |
| **Settings Header, Body, Language Select, Theme Toggle, Save/Load Buttons, Checkboxes, Links, Footer** | Sub-sections of the settings overlay |
| **Module Grid** | `#module-grid` — 4-col CSS Grid, 8px gap |
| **Empty State** | `#empty-state` centered message |
| **Module** | `.module` card, `.module-header`, `.module-drag-handle`, `.module-type-label`, `.module-textcolor-btn`, `.module-copy-btn`, `.module-delete-btn` |
| **Module Toolbar Tooltips** | `.module-*[title]::after` custom tooltip styling |
| **Module Toolbar Button** | `.module-btn` base styling |
| **Toolbar Button Overrides** | `.module-delete-btn[title]::after` and other position-specific tooltip overrides |
| **Health Module Header Buttons** | Health-specific action buttons in toolbar |
| **Module Overflow (Kebab) Button** | `.module-overflow-btn` and `.module-menu-btn` |
| **Module Overflow Menu (Flyout)** | `.module-menu` flyout panel |
| **Overflow Theme Swatch Panel** | Theme color selection in overflow menu |
| **Delete Confirmation** | `.delete-confirm-overlay`, panel, title, actions, button variants |
| **Markdown Rendered Content** | Styles for h1–h6, lists, blockquotes, code, tables, images in rendered markdown |
| **Task List Checkboxes** | Checkbox styles within markdown |
| **Module Body / Text** | `.module-body`, `.module-textarea`, `.module-text-display` |
| **Module Resize & Drag** | `.module-resize-handle` (z-index 60), `.module-resizing` (z-index 50), `.module-ghost`, `.module-dragging`, `.module-drag-active` |
| **Horizontal Line Module** | `.hline-container` styling |
| **Spacer Module** | `.spacer-container` styling (purely layout) |
| **Stat Module** | `.stat-container`, `.stat-block`, `.stat-rollable`, `.stat-name`, `.stat-primary`, `.stat-secondary`, `.stat-proficiency-dot`, `.stat-block-edit`, edit inputs/toggles, `.stat-add-btn`, `.stat-quick-input`, `.stat-ghost`, wizard layout buttons (`.wizard-stat-layout`, `.wizard-layout-btn`) |
| **Health Module** | `.health-container`, `.health-layer-play`, `.health-layer-edit`, `.health-current`, `.health-max`, `.health-temp-badge`, `.health-maxmod-indicator`, `.health-inline-input` — sub-sections: Play Mode HP Display, Temp HP Badge, Play Mode Main Row, Action Buttons, Health Action Overlay, Edit Mode Inputs, Responsive XS |
| **Level Module** | `.level-container`, `.level-bar`, `.level-up-btn`, `.level-progress` — sub-sections: Level Bar, Level Up Button, Level Settings Modal |
| **Counters Module** | `.counter-container`, `.counter-list`, `.counter-row`, `.counter-row-play`, `.counter-row-edit`, `.counter-inc-btn`, `.counter-dec-btn`, `.icon-picker-modal` — sub-sections: Column Headers, Play/Edit Mode Row, Icon Picker, Counter Modal Overrides |
| **Abilities Module** | `.ability-container`, `.ability-row`, `.ability-rollable`, `.ability-proficiency-dot`, `.ability-name`, `.ability-modifier`, `.ability-edit-row`, `.ability-drag-handle`, `.ability-edit-name`, `.ability-edit-modifier`, `.ability-edit-proficiency-label`, `.ability-edit-delete`, `.ability-empty-state`, `.ability-ghost`, `.ability-settings-select` |
| **Activity Log Module** | `.activity-container`, `.activity-tag-bar`, `.activity-tag`, `.activity-entry-list`, `.activity-entry`, `.activity-entry-timestamp`, `.activity-entry-message`, `.activity-entry-delete`, `.activity-empty-state`, `.activity-clear-all-btn` — sub-sections: Responsive |
| **Resistance Module** | `.resistance-container`, `.resistance-section`, `.resistance-item`, `.resistance-item-play`, `.resistance-item-edit`, `.resistance-staging-area` — sub-sections: Shared Layout, Play/Edit Sections, Play Mode Items/Tooltips, Edit Mode Items, Empty State, Settings Panel, Staging Area, Creation Wizard, SortableJS Ghost |
| **Saving Throws Module** | `.save-container`, `.save-block`, `.save-rollable`, `.save-name`, `.save-modifier`, `.save-tier-badge`, `.save-block-edit`, `.save-edit-name-row`, `.save-drag-handle`, `.save-edit-name`, `.save-edit-value`, `.save-edit-tier`, `.save-quick-input`, `.save-ghost`, `.save-notes-area`, `.save-notes-textarea`, `.save-notes-display` — sub-sections: Play Mode Blocks, Quick Edit Input, Edit Mode Blocks, Notes Area, Settings Modal, Custom Tier Editor, Responsive XS/SM |
| **Spells Module** | `.spells-play-container`, `.spells-slots-section`, `.spells-category`, `.spell-pip`, `.spells-spell-row`, `.spells-detail-modal`, `.spells-edit-container` — sub-sections: Play Mode, Slot Level Rows, Spell List, Category, Spell Rows, Detail Modal Attributes, Spell Edit Modal Attributes, Edit Mode, Category Edit List, Spell Edit List, SortableJS Ghost Classes, Settings Toggle |
| **List Module** | `.list-container`, `.list-table`, `.list-column-header`, `.list-item-row`, `.list-attr-cell`, `.list-manage-attrs-panel`, `.list-inspect-overlay` — sub-sections: Column Headers, Attribute Cells, Cross-List Drag Transfer, Manage Attributes Panel, Attribute Wizard, Inspect Overlay |
| **Condition Module** | `.condition-container`, `.condition-applied-list`, `.condition-item`, `.condition-staging-area`, `.condition-settings-panel` — sub-sections: Shared Layout, Sort Header, Applied List, Play Mode Items/Tooltips, Edit Mode Items, Settings Panel, Template Selector, Expand Modal, Custom Wizard, SortableJS Ghost |
| **Shared Modal** | Styles for modals (detail, edit, settings) |
| **Custom Select (`cv-select`)** | `.cv-select` custom select component |
| **Responsive Size Classes / ResizeObserver** | `.module.xs`, `.module.sm`, etc. for responsive sizing |
| **Toast Notifications** | `.toast` notification styling |
| **List Inspect Overlay** | `.list-inspect-overlay` read-only item details modal |
| **Wizard Overlay** | Full-screen overlay, panel, header, body, type cards grid, color swatches, footer buttons |
| **Weapons Module** | `.weapons-container`, `.weapons-column`, `.weapons-divider`, `.weapon-card`, `.weapon-drag-handle`, `.weapon-ghost`, `.weapon-name`, `.weapon-bonus`, `.weapon-damage-summary`, `.weapon-trait-chip`, `.weapon-ammo-pip`, `.weapon-shield-hp`, `.weapon-add-btn`, `.weapon-quick-edit-input` — sub-sections: Weapon Action Modal, Weapon Edit Modal |

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
Currently registered types: `abilities`, `activity`, `text`, `stat`, `hline`, `health`, `level`, `spacer`, `list`, `counters`, `resistance`, `savingthrow`, `spells`, `condition`, `recovery`, `weapons`

### Save Blob (JSON schema v1)
Character sheet persistence format, stored via `TS.localStorage.campaign`:
```js
{
  version: 1,                   // schema version for migrations
  savedAt: '2026-03-21T...',    // ISO timestamp
  moduleIdCounter: 5,           // resume ID generation
  gameSystem: 'dnd5e',          // global game system key (dnd5e | pf2e | coc | vtm | cpred | mothership | sr6 | daggerheart | custom)
  activityLog: [ /* activity log entries — character-level, shared across all Activity Log modules */ ],
  modules: [ /* modules[] array entries */ ]
}
```

### `window.pendingRolls` (object)
Maps a TaleSpire `rollId` (returned by `TS.dice.putDiceInTray()`) to the Activity Log entry it should update when the result arrives. Populated by each roll site; consumed and deleted by `window.handleRollResult` in `module-activity.js`. Entries for rolls dismissed without rolling are cleaned up via the `rollRemoved` event.
```js
{ 'roll_abc123': { logEntryId: 'log_xyz789' } }
```

### `window.activityLog[]` (character-level array)
Shared across all Activity Log module instances. Each entry:
```js
{
  id: 'log_abc123xyz',       // unique ID from generateLogEntryId()
  timestamp: 1712345678901,  // Date.now() epoch ms
  eventType: 'damage_taken', // arbitrary string, used for tag filtering
  sourceModuleId: 'module-005' | null,
  message: 'Took 8 fire damage'
}
```

### Activity Log Module `content` (object)
Per-instance view settings (NOT the log entries themselves — those are in `window.activityLog`):
```js
{
  sortOrder: 'newest',       // 'newest' or 'oldest'
  hiddenEventTypes: [],      // eventType strings the user toggled OFF
  showTimestamps: true,      // whether timestamps are visible
  maxEntries: 200            // max log entries to keep
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

### Saving Throw Module `content` (object)
When `type === 'savingthrow'`, the `content` field stores:
```js
{
  saves: [
    { id: 'save_abc', name: 'Strength', value: 3, proficiencyTier: null }
  ],
  notes: '',            // optional markdown string
  tiersEnabled: false,  // whether tier badges are visible
  tiers: [              // always present; used when tiersEnabled is true
    { name: 'Untrained', letter: 'U', color: '#888888' },
    { name: 'Trained',   letter: 'T', color: '#22aa44' }
  ],
  tierPreset: 'simple'  // 'simple' | 'dnd5e' | 'pf2e' | 'custom'
}
```

### Health Module `content` (object)
When `type === 'health'`, the `content` field stores:
```js
{
  currentHP: 0,        // current hit points
  maxHP: 0,            // base maximum hit points
  tempHP: 0,           // temporary hit points (absorbed first on damage)
  maxHPModifier: 0     // adjustment to max HP (e.g., from constitution modifier)
}
```

### Level Module `content` (object)
When `type === 'level'`, the `content` field stores:
```js
{
  level: 1,                                           // current character level
  currentXP: 0,                                       // accumulated experience points
  levelingSystem: 'xp',                               // 'xp' or 'milestone'
  xpThresholds: [300, 900, 2700, ...],               // XP required for each level (from template or custom)
  carryOverXP: true,                                  // whether excess XP carries to next level
  barColor: null,                                     // custom progress bar color or null
  barStyle: 'solid'                                   // 'solid' or other variants
}
```

### Counters Module `content` (object)
When `type === 'counters'`, the `content` field stores:
```js
{
  counters: [
    { id: 'counter_abc', name: 'Action Surge', value: 1, max: 1, icon: 'lightning' }
  ],
  sortBy: 'custom',    // 'custom', or column name for asc/desc sorts
  sortDir: 'asc'       // 'asc' or 'desc'
}
```

### List Module `content` (object)
When `type === 'list'`, the `content` field stores:
```js
{
  attributes: [
    { id: 'attr_001', name: 'Weight', type: 'number', icon: null }
  ],
  items: [
    { id: 'item_001', name: 'Rope', values: { attr_001: 10 } }
  ],
  sortBy: null,        // null = custom order, or attribute ID
  sortDir: 'asc'       // 'asc' or 'desc'
}
```

### Condition Module `content` (object)
When `type === 'condition'`, the `content` field stores:
```js
{
  template: 'custom',                // 'custom', 'dnd5e', 'pf2e', etc.
  applied: [
    { id: 'cond_001', condKey: 'dnd5e_blinded', value: null }
  ],
  staging: [],                       // conditions in the wizard, not yet applied
  customConditions: [],              // user-defined condition templates
  sortBy: null,                      // null = custom order, or field name
  sortDir: 'asc'                     // 'asc' or 'desc'
}
```

### Spells Module `content` (object)
When `type === 'spells'`, the `content` field stores:
```js
{
  autoSpendSlots: true,       // setting: auto-spend on cast
  showSlotErrors: true,       // setting: show error when no slots available
  slotLevels: [
    { id: 'sl_001', level: 1, max: 4, spent: 1 }
  ],
  categories: [
    {
      id: 'cat_001',
      name: 'Cantrips',
      slotLevel: null,         // null = no slot consumed on cast
      collapsed: false,
      spells: [
        {
          id: 'sp_001',
          name: 'Fire Bolt',
          attributes: [
            { id: 'a_001', key: 'Damage', value: '2d10' },
            { id: 'a_002', key: 'Range',  value: '120 ft' }
          ]
        }
      ]
    }
  ]
}
```
Default size: 4col × 2row.

### Recovery Module `content` (object)
When `type === 'recovery'`, the `content` field stores:
```js
{
  restButtons: [
    {
      id: 'btn_abc123',             // unique ID
      name: 'Long Rest',            // display name
      actions: [
        { type: 'healToFull' },
        { type: 'restoreAllSpellSlots' },
        { type: 'resetTempHP' },
        { type: 'restoreHitDice' }
      ]
    }
  ],
  hitDice: {                        // null if no healByRoll action on any button
    dieSize: 8,                     // die type: 4, 6, 8, 10, or 12
    total: 5,                       // total Hit Dice pool
    remaining: 5,                   // currently available
    modifier: 2,                    // flat modifier added to each roll (e.g. Con mod)
    restoreOnLongRest: 'half'       // 'all' | 'half' | 'none'
  }
}
```
Action types: `healToFull`, `healByRoll`, `resetTempHP`, `restoreAllSpellSlots`, `restoreHitDice`. Cross-module calls use `window.healToFull(moduleId)`, `window.resetTempHP(moduleId)`, `window.applyHealingAmount(moduleId, amount)`, and `window.restoreAllSpellSlots(moduleId)` exposed by Health and Spells modules.

### `wizardState` (object)
Transient state for the New Module wizard:
```js
{ type: 'text', theme: null, statLayout: 'large-stat' }
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
| 60 | Module resize handle |
| 50 | Module being resized |

---

## CSS Grid Layout

- Container: `#module-grid` — `grid-template-columns: repeat(4, 1fr)`, gap `8px`, padding `8px`
- Modules span 1–4 columns via `grid-column: span N`
- Row height is content-driven by default; fixed when user resizes (`rowSpan * 80px + gaps`)
- `align-items: start` prevents modules from stretching to fill row height
