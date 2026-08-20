# Architecture

> Code map for Character Vault. Designed to help Claude Code (and humans) find things fast without exploratory searching.

**Important:** When referencing this file in prompts or issues, use section names and function names, never line numbers. Line numbers change as the file evolves; section/function references remain stable.

## Files at a Glance

| File | Purpose |
|---|---|
| `manifest.json` | Symbiote metadata: API subscriptions, capabilities, extras, entry point |
| `main.html` | **All markup** — HTML structure only, loads scripts via `<script src>` tags |
| `css/` | **All styles** — see "CSS Files" section below for per-file breakdown |
| `scripts/translations.js` | **i18n dictionary** — `CV_TRANSLATIONS` object keyed by language code (`en`, `es`, `fr`, `de`, `pt-BR`, `ru`) |
| `scripts/icons.js` | SVG icon sprite registry — injects a hidden `<svg>` sprite of `<symbol>` defs into `document.body` and exposes `cvIcon(name, size)` / `CV_ICON_KEYS`. RPG-content icons from game-icons.net (filled), UI chrome + condition icons from Lucide (stroke). See `ATTRIBUTION.md` |
| `scripts/modifier-keys.js` | Modifier key tracker — Vuplex WebView zeroes `ctrlKey` on all events; this tracks state via `e.key` on keydown/keyup and exposes `modKeys.ctrl` |
| `scripts/shared.js` | Shared utilities: `escapeHtml()`, markdown rendering (`renderMarkdown`, `attachCheckboxHandlers`, `toggleCheckboxInMarkdown`), `buildCvSelect()` themed dropdown builder, `buildStatModulePicker()` stat module linking dropdown, `getLinkedStatNames()` stat name lookup |
| `scripts/i18n.js` | Localization: `currentLang`, `t()`, `applyTranslations()`, `refreshModuleLabels()` |
| `scripts/tutorials.js` | Per-module-type tutorial system: `TUTORIALS` registry (paged title/body i18n keys per module type), `openTutorialModal(type)` paged modal renderer with `{icon:name}` inline icon post-processing. Opened via a Help entry in the module overflow menu (skipped for `hline`/`spacer`) |
| `scripts/popover-edit.js` | Shared Ctrl+Click edit popover: `openEditPopover(anchorEl, options)`, `resolveMathExpression()` — anchored floating form for quick value edits with simple math input |
| `scripts/theme.js` | Theme system: `setTheme()`, `loadTheme()` |
| `scripts/settings.js` | Settings overlay, mode toggle, theme buttons, language picker, save/load buttons, force reload |
| `scripts/persistence.js` | Save/load system: `migrateData()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` |
| `scripts/tabs.js` | Tab system: state management (`tabs[]`, `activeTabId`, `tabIdCounter`), tab bar rendering, tab CRUD (`createTab`, `getNextTabName`), switching, context menus (Phase 2+) |
| `scripts/module-core.js` | Module engine: state (`modules[]`), wizard, type registry (`MODULE_TYPES`), `renderModule()`, overflow menu, custom pointer-drag (free placement), delete confirm, resize handle with collision clamping |
| `scripts/module-activity.js` | Activity Log submodule — event log with tag filtering, character-level shared data (`window.activityLog`), global `logActivity()` API |
| `scripts/module-bio.js` | Bio submodule — character identity, portrait upload, physical traits, biography (markdown), personality (collapsible), system-gated fields, sub-tabs (Overview/Details); Ctrl+Click quick edit on filled short fields, `openBioEditModal()` — one consolidated Edit Overview / Edit Details modal per tab (all fields, short + long-form) via the overflow menu, also opened by clicking any empty ("Click to add…") field, focused on that field |
| `scripts/module-abilities.js` | Abilities module type registration + helpers (render, Ctrl+Click quick edit, Manage Abilities settings-modal list, proficiency sync, dice rolling) |
| `scripts/module-text.js` | Text Box module type registration |
| `scripts/module-stat.js` | Stat module type registration + helpers (render, edit, quick-edit, dice rolling) |
| `scripts/module-hr.js` | Horizontal Line module type registration |
| `scripts/module-health.js` | Health module type registration + helpers (HP/Max HP/Temp HP tracking, damage/healing, quick-edit, play/edit layers, health action overlay) |
| `scripts/module-level.js` | Level/XP module type registration + helpers (XP-based or milestone leveling, optional class name, progress bar, level-up logic, XP modal, settings modal, cross-module API) |
| `scripts/module-spacer.js` | Spacer module type registration (blank visual separator, no content) |
| `scripts/module-resistance.js` | Resistance module type registration + helpers (settings panel, staging area, creation wizard, drag-to-assign) |
| `scripts/module-savingthrow.js` | Saving Throw module type registration + helpers (render blocks, edit blocks, sortable, quick-edit, dice rolling, notes area, settings modal, custom tier editor) |
| `scripts/module-spells.js` | Spells module type registration + helpers (pip-style slot tracking, category/spell editor, SortableJS reorder, cast logic, detail/edit/settings modals, dice roll dispatch) |
| `scripts/module-list.js` | List module type registration + helpers (multi-column item tables, custom attributes, attribute wizard, cross-list drag transfer, inspect overlay, sortable) |
| `scripts/module-condition.js` | Condition module type registration + helpers (settings panel, staging area, game system templates, cascading sub-conditions, custom wizard) |
| `scripts/module-counters.js` | Counters module type registration + helpers (increment/decrement/reset rows, icon picker, sortable column headers, create/edit modals, settings modal with Manage Counters list) |
| `scripts/module-recovery.js` | Recovery module type registration + helpers (rest buttons, hit dice subsystem, confirmation dialog, game system templates, cross-module API calls to Health and Spells, settings modal with Manage Rest Buttons list) |
| `scripts/module-companions.js` | Companions module type registration + helpers (table display, inline editing, expandable drawer with notes, SortableJS row reorder, sort by column, active/inactive toggle, settings modal with add/remove companions and custom attributes) |
| `scripts/module-weapons.js` | Weapons module type registration + helpers (two-column main/off layout, weapon cards, attack/damage roll dispatch, SortableJS cross-column drag, quick-edit ammo/shield HP, action modal, edit modal, Phase 3 `enhancementCatalog` on `data.content` with attach/detach/create/catalog-editor UI) |
| `scripts/module-defenses.js` | Defenses module type registration + helpers (spotlight stat, secondary rows, Quick Defense toggle buttons, settings modal with Manage Defenses + Manage Quick Defenses lists, system templates, icon picker, quick-edit, SortableJS reorder) |
| `scripts/module-actions.js` | Action Tracker module type registration + helpers (mode-agnostic toggle-able action pills, wrap/list layout, SortableJS reorder, add/settings modals, Reset All/Delete All, game system pre-population) |
| `scripts/dice-variables.js` | Dice variable resolution engine: token parser, `resolveToken()`, `resolveDiceExpression()`, `formatDiceExpressionDisplay()`, `getAllDiceVariables()`, `propagateDiceVariableRename()`. Loaded after all module scripts so it can read `window.modules` from any module type. |
| `scripts/sync.js` | Cross-player transfer layer — connection tracking (`connectedPlayers`, `connectedClients`), sync protocol (offer/accept/decline/cancel/ping), transaction state machine (`pendingOutgoing`, `pendingIncoming`), compact/expand transfer format, incoming validation/sanitization, menu bar connection indicator. Manifest handlers: `handleSyncMessage`, `handleSyncClientEvent`, `handleClientEvent`. Public API: `initSync()`, `getConnectedPlayers()`, `compactForTransfer()`, `expandReceived()`, `validateIncoming()`, `generateTxnId()` |
| `scripts/app.js` | Startup: applies translations, triggers auto-load |

There is no build step. Everything ships as-is to TaleSpire's embedded Chromium.

### Script Load Order

Scripts are loaded via plain `<script src>` tags (no `async`/`defer`) in `main.html`, which guarantees sequential execution. The order matters because later scripts depend on globals defined by earlier ones:

```
translations.js → icons.js → shared.js → i18n.js → popover-edit.js → theme.js → settings.js → persistence.js → tabs.js → module-core.js → module-activity.js → module-condition.js → module-counters.js → module-text.js → module-abilities.js → module-stat.js → module-health.js → module-hr.js → module-level.js → module-spacer.js → module-resistance.js → module-savingthrow.js → module-spells.js → module-list.js → module-recovery.js → module-weapons.js → module-companions.js → module-defenses.js → module-actions.js → dice-variables.js → sync.js → app.js
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
| `#menu-bar` | Top bar with Settings and New Module buttons, and `#sync-indicator` (peer count badge, hidden when zero peers) |
| `#tab-bar` | Tab bar with scrollable tab items (`#tab-scroll-area`) and add-tab button (`#btn-add-tab`), between menu bar and content area |
| `#content` > `#module-grid` | CSS Grid container (4-col) holding all modules + `#empty-state` |
| `#settings-overlay` | Full-screen settings panel (language, theme, save/load, troubleshooting, links) |
| `#wizard-overlay` | New Module wizard (type selection, color swatch picker) |
| `#delete-confirm-overlay` | Modal dialog confirming module deletion |

---

## JavaScript — Script Files

All JS lives in `scripts/` as separate files loaded by `main.html` in dependency order. Each file uses `// ── Name ──` section headers internally.

| File | Key Functions / Globals |
|---|---|
| **modifier-keys.js** | `modKeys.ctrl` — polyfill for Vuplex zeroing `ctrlKey`; tracks state via `keydown`/`keyup` `e.key`; resets on `blur` |
| **shared.js** | `escapeHtml(text)`, `renderMarkdown(raw)` (Marked + DOMPurify), `attachCheckboxHandlers()`, `toggleCheckboxInMarkdown()`, `inferTierPreset(systemKey)`, `getGameSystemDisplayName(systemKey)`, `buildCvSelect(options, currentValue, onChange)`, `buildStatModulePicker(selectedId, onChange, noneLabel)`, `getLinkedStatNames(moduleId)` |
| **i18n.js** | `currentLang`, `t(key, replacements?)`, `applyTranslations()`, `refreshModuleLabels()` — lightweight localization; HTML elements use `data-i18n` / `data-i18n-*` attributes for static text, JS calls `t()` for dynamic text |
| **popover-edit.js** | `window.openEditPopover(anchorEl, options)` — shared Ctrl+Click edit popover (single-value shorthand or multi-field `fields[]` form; Enter/Save commits, Escape/click-outside discards; one open at a time; adds `.module--chrome-active` to the anchor's module while open); `window.resolveMathExpression(raw, currentValue, relative)` — pure math input resolver (`"9+2"` → 11; with `relative`, leading-operator input applies to the current value: `"+2"` on 9 → 11). Number fields render as text inputs so expressions parse; `min`/`max` clamp, `allowEmpty` commits `null` on empty |
| **theme.js** | `setTheme(theme)`, `loadTheme()` — runs `loadTheme()` on load |
| **settings.js** | `openSettings()`, `closeSettings()`, `updateThemeButtons(theme)`, language select handler, game system select handler, `syncGameSystemUI()`, save/load button wiring, force reload, `chkAutoSave`, `chkAutoLoad` |
| **persistence.js** | `migrateData()`, `syncModuleState()`, `serializeCharacter()`, `deserializeCharacter()`, `saveCharacter()`, `loadCharacter()`, `scheduleSave()` — TaleSpire campaign localStorage persistence with auto-save debounce |
| **module-core.js** | `modules[]` array, `moduleIdCounter`, `generateModuleId()`, `wizardState`, wizard open/close/reset, global Escape key handler, wizard interactions (type cards, color swatches), create module handler, `MODULE_TYPES{}` registry, `registerModuleType()`, `renderModule(data)` — places modules with `colStart`/`rowStart` via `findOpenSlot()` when unset, custom `initDragHandle()` pointer-drag (free placement, replaces SortableJS for the grid), `openDeleteConfirm()`, `closeDeleteConfirm()`, `deleteModule()`, `openRenameModule()`, `initResizeHandle()` with collision-aware clamping via `clampResizeSpan()`, `rectsOverlap()`/`findOpenSlot()`/`packAllModules()` grid placement primitives, `compactActiveTab()` — manual "Compact Layout" action (constants `GRID_COLUMNS=8`, `GRID_GAP=8`, row height `66px`); `window.generateModuleId()` — exposed for import ID remapping |
| **module-activity.js** | `registerModuleType('activity', ...)`, `window.logActivity(opts)` — global API other modules call to add entries (returns `entry.id`), `window.openActivitySettings(moduleEl, data)` — settings modal opener, `window.activityLog[]` — character-level array of log entries shared across all Activity Log module instances, `window.handleRollResult(event)` — manifest-subscribed callback that appends roll totals (or success counts for pool rolls) to pending log entries, `window.extractDieFaces(node)` — pure helper: walks TS dice result tree and returns flat array of integer face values |
| **module-text.js** | `registerModuleType('text', ...)` — always renders resolved markdown in `.module-text-display`; `openTextEditModal(moduleEl, data)` — textarea modal (Save/Cancel, discard-unsaved-changes prompt) wired via `overflowMenuItems()` as "Edit Content" |
| **module-bio.js** | `buildBioField(labelKey, value, opts)` — label + value, wires Ctrl+Click quick edit on filled short fields via `opts.key`; empty values render a muted, clickable placeholder (`.bio-field-value--empty`) that opens the field's modal, `buildBioBlockField()`/`buildPersonalityBlock()`/`buildBiographyDisplay()` — long-form displays, clickable only while empty, `buildPortraitFrame(content, moduleEl)` — hover-reveal upload/change/remove controls, `renderOverview()`/`renderDetails()`/`renderSystemSection()` — always-rendered tab content (no more edit/play split), `openBioEditModal(moduleEl, content, tab, focusKey)` — consolidated Edit Overview / Edit Details modal (all fields for that tab, short + long-form, optional `focusKey` to scroll/focus one field; discard-confirm), driven by `OVERVIEW_MODAL_FIELDS` / `getDetailsModalFieldDefs()` field-descriptor lists, wired via `overflowMenuItems()` as Edit Overview/Edit Details, `registerModuleType('bio', ...)`; `window.buildBioDefaultContent`, `window.getRaceLabel`, `window.getSystemFields`, `window.shouldShowBioField` |
| **module-abilities.js** | `rollAbilityCheck(ability)`, `renderAbilityRow()`, `enterAbilityQuickEdit()`, `openAbilitySettings()` (Manage Abilities list + Linked Stat Module picker), `buildAbilityBody()`, `registerModuleType('abilities', ...)` — skill list with modifier badges, proficiency dots, linked Stat module sync, Ctrl+Click modifier edit, dice rolling |
| **module-stat.js** | `renderStatBlock()`, `rollStatCheck(stat)`, `enterQuickEdit()`, `enterNameQuickEdit()`, `openStatSettingsModal()` (expanded: Manage Stats section with inline name inputs, SortableJS reorder, proficiency controls, add/delete; plus Display Layout and Rollable Stats), `registerModuleType('stat', ...)` — stat blocks with values/modifiers, dice rolling, Ctrl+Click quick edit, layout toggle (large-stat / large-modifier / modifier-only); `window.getAbilityModifier(key)`, `window.getProficiencyBonus()` — cross-module stat lookups; `window.getStatValue(name)` — returns raw `.value` from any stat by name (case-insensitive), `window.getAllStatNames()` — sorted, deduped array of all non-proficiency stat names across all stat modules |
| **module-hr.js** | `registerModuleType('hline', ...)` — labeled divider; module header always hidden, own hover-reveal drag handle + delete button, Ctrl+Click edits the label |
| **module-health.js** | `evaluateHealthExpression()`, `applyDamage()`, `applyHealing()`, `syncHealthLayersFromData()`, `buildPlayLayer()`, `registerModuleType('health', ...)` — HP/Max HP/Temp HP display, damage/healing overlays, quick-edit, settings modal via `overflowMenuItems()`; exposes `window.healToFull()`, `window.resetTempHP()`, `window.applyHealingAmount()` for cross-module use |
| **module-level.js** | `evaluateXPExpression()`, `getLevelProgress()`, `levelUp()`, `renderLevelBody()`, `openXPModal()`, `openLevelSettings()`, `registerModuleType('level', ...)`, `window.getCharacterLevel()`, `window.getCharacterClass()`, `window.LEVEL_XP_TEMPLATES` — XP tracking with thresholds or milestone leveling, progress bar, level-up button, optional class name label, cross-module API |
| **module-spacer.js** | `registerModuleType('spacer', ...)` — trivial module type, just visual spacing |
| **module-resistance.js** | `registerModuleType('resistance', ...)` — drag-to-assign resistance/immunity/weakness columns; `openResSettingsPanel()`, `openResWizard()`, SortableJS staging area, value prompts, layout toggle |
| **module-savingthrow.js** | `applySavingThrowTemplate(key)`, `applyTierPreset(key)`, `formatModifier(n)`, `renderSaveBlock()`, `rollSavingThrow()`, `enterSaveQuickEdit()`, `renderNotesArea()` (always renders the markdown display; empty notes show a muted placeholder), `openSaveNotesModal(moduleEl, data)` — textarea modal wired via `overflowMenuItems()` as "Edit Notes", `openSaveSettings()` (expanded: Manage Saves section with inline name edit, per-row tier/linked-stat selects, SortableJS reorder, add/delete — alongside the existing staged tiersEnabled/tierPreset/tiers/linkedStatModuleId fields), `openCustomTierEditor()`, `registerModuleType('savingthrow', ...)` |
| **module-spells.js** | `isDiceNotation(val)`, `extractDiceRoll(val)`, `defaultContent()`, `genId(prefix)`, `ensureContent(data)`, `migrateContent(content)`, `getSortedSpells(content, spells)`, `getAvailableSlots(data, slotLevel)`, `spendSlot(data, slotLevel)`, `rollAllSpellDice(spell, content)`, `castSpell(moduleEl, data, spell, catId)`, `renderSpellsPlay(bodyEl, data)`, `openSpellSettings(moduleEl, data)` (also `window.openSpellSettings`), `registerModuleType('spells', ...)` — table-based spell display with per-category collapsible tables, expandable description drawers, pip-style slot tracking, cast-on-resolution deferred slot spend, shared column attributes managed (and reorderable) in settings |
| **module-list.js** | `renderListBody()`, `renderAttrValue(attr, value, asDisplay, ...)`, `renderColumnHeaders()`, `openColumnPicker()`, `openManageAttrsPanel()` (attribute rows with SortableJS column reorder, presets, custom-attribute wizard), `openAttrWizard()`, `openItemInspect()`/`closeItemInspect()`, `initListSortable()` (manual reorder + cross-list transfer), `logItemRename()`, `window.addListItem()`, `registerModuleType('list', ...)` — multi-column item tables with custom attributes, Ctrl+Click item-name edit, Add Item / Module Settings via `overflowMenuItems()` |
| **module-condition.js** | `registerModuleType('condition', ...)` — game system template conditions with toggle/value types; `openCondSettingsPanel()`, `openCondWizard()`, `window.applyConditionTemplate`, SortableJS staging area, cascading sub-conditions, expand modal; `window.getConditionValue(key)` — returns `.value` of the first active applied condition matching `typeKey` (used for VtM Hunger split) |
| **module-counters.js** | `ensureContent(data)`, `getSortedCounters(content)`, `buildIconPicker()`, `openCounterCreateModal(moduleEl, data, onCreated?)`, `openCounterEditModal(moduleEl, data, counterId, onChange?)` (both accept an optional callback so the settings modal's Manage Counters list can refresh itself), `renderCounterRowPlay()`, `renderCounterColumnHeaders()`, `registerModuleType('counters', ...)`, `openCounterSettingsModal(moduleEl, data)` — Manage Counters section (drag reorder, inline name edit, icon/value buttons opening the edit modal, delete) plus Add Counter and common settings; `window.openCounterCreateModal`, `window.openCounterSettingsModal` |
| **module-recovery.js** | `executeRestButton()`, `openRestConfirm()`, `openRecoverySettingsModal(moduleEl, data)` (Manage Rest Buttons list — drag reorder, inline edit opening `openRestButtonEditModal()`, delete, add — above the existing Hit Dice config grid and common settings), `buildPlayMode(bodyEl, data)`, `openRestButtonEditModal(btn, content, onSaved, isNew)`, `registerModuleType('recovery', ...)` — rest buttons with configurable action lists, hit dice subsystem, confirmation dialog, game system templates; calls `window.healToFull()`, `window.resetTempHP()`, `window.applyHealingAmount()`, `window.restoreAllSpellSlots()`; `window.openRecoverySettingsModal` |
| **module-defenses.js** | `buildDefensesDefaultContent(sys)`, `ensureContent(data)`, `computeSpotlightValue(content)`, `openDefenseIconPicker()`, `renderSpotlight()`, `renderSecondaryRows()`, `renderQDButtons()`, `renderQDModalBody()` (Quick Defense list), `openDefenseSettingsModal(moduleEl, data)` (Manage Defenses section — drag reorder, icon/name/sign/value inline edit, delete, add — above the Manage Quick Defenses section and common settings), `registerModuleType('defenses', ...)` — spotlight stat with buffed state, QD toggle buttons, settings modal, system-specific templates; `window.ensureDefenseContent`, `window.generateDefenseId`, `window.generateQDId`, `window.buildDefensesDefaultContent`, `window.computeSpotlightValue`, `window.openDefenseSettingsModal` |
| **module-actions.js** | `ensureContent(data)`, `actionTrackerDefaultContent()` (game-system-seeded pills), `resetAllActions(moduleId)`, `renderActionPill()`, `initActionsSortable()`, `openAddActionModal(moduleEl, data)`, `openActionsSettings(moduleEl, data)`, `registerModuleType('actions', ...)` — mode-agnostic toggle-able action pills (wrap/list layout), no Activity Log integration by design; `window.openAddActionModal`, `window.openActionsSettings`, `window.actionTrackerDefaultContent`, `window.ensureActionTrackerContent`, `window.resetAllActions` |
| **dice-variables.js** | `window.hasDiceVariables(expr)`, `window.resolveDiceExpression(expr)`, `window.resolveToken(inner)`, `window.formatDiceExpressionDisplay(expr)`, `window.getAllDiceVariables()`, `window.propagateDiceVariableRename(moduleId, type, oldName, newName)` — dice expression variable interpolation engine; resolves `${type.name.moduleId}` tokens at roll time; test-only exports: `window._parseDiceVarToken`, `window._normalizeOperators` |
| **module-companions.js** | `buildCompanionsDefaultContent(sys)` (window export) — seeded attributes per game system; `ensureContent(data)` — shape guard; `evaluateExpression(str)` — arithmetic eval; `getSortedCompanions(content)` — null/asc/desc sort; `makeValueCell()` — inline edit spans with arithmetic and HP Activity Log logging; `renderCompanionRow()` — tr + expandable drawer tr; `renderCompanionsBody()` — full table with sticky thead sort headers, SortableJS on tbody; `openCompanionSettings()` (window export) — settings modal with add/rename/delete companions and add/pin/delete custom attributes; `registerModuleType('companions', ...)` |
| **module-weapons.js** | `generateWeaponId()`, `ensureWeaponsContent(data)`, `weaponsComputeAttackBonus(weapon)`, `weaponsFormatDamageSummary(weapon, content?)`, `getAttackArchetype(sys)`, `getSystemTraitCatalog()`, `resolveWeaponTrait(entry, content)`, `normalizeWeaponTraits(traits, content)`, `findOrCreateCustomTrait(name, content)`, `generateCustomTraitKey(content)`, `renderWeaponsBody(bodyEl, data)`, `openWeaponModuleSettings(moduleEl, data)` (Manage Weapons per-slot lists with SortableJS reorder/slot transfer, Add Weapon, Daggerheart proficiency, linked stat module), `openWeaponActionModal(moduleEl, data, weapon)`, `openWeaponEditModal(moduleEl, data, weapon, bodyEl, onDone?)`, `enterQuickEditAmmo()`, `enterQuickEditShieldHp()`, `buildEnhancementsSection()`, `openEnhancementPickerPanel()`, `openEnhancementInlineForm()`, `openEnhancementCatalogModal()`, `registerModuleType('weapons', ...)` — Phase 3 window exports: `weaponsGenerateEnhancementKey`, `weaponsFindEnhancement`, `weaponsGetAttachedEnhancements`, `weaponsGetAvailableEnhancements`, `weaponsApplyStrikingBonus`, `weaponsComputeEnhancementPoolBonus`, `weaponsComputeEnhancementAttackBonus`; `window.weaponsComputeEffectivePool(weapon, content)` — resolves pool size from live stat values when `poolAutoCompute` is on, otherwise returns `poolSize`; `window.weaponsApplyProficiencyDice(diceStr, proficiency)` — multiplies NdM dice count by Daggerheart proficiency rank (non-NdM patterns returned unchanged); `window.getCharacterProficiency()` — reads `daggerheartProficiency` from the first weapons module's `data.content` |
| **app.js** | Startup: `applyTranslations()`, `refreshModuleLabels()`, auto-load check (`chkAutoLoad` + `TS` availability → `loadCharacter()`); initializes `window.pendingRolls = {}` |

---

## CSS Files

CSS is organized in the `css/` directory with a strict cascade order. Later files depend on earlier ones.

| File | Purpose |
|---|---|
| **`css/tokens.css`** | All 6 theme color palettes (Dark, Light/Parchment, Cyberpunk, Sci-Fi, Angelic, Demonic) with `--cv-*` custom property definitions. Every other file depends on these tokens. |
| **`css/components.css`** | Shared UI components: toggle switches (`.cv-toggle`), icon buttons (`.icon`), base button styles, menu bar (`.menu-btn`), settings overlay form controls, custom select dropdowns, toast notifications, focus states, edit popover (`.cv-edit-popover`). |
| **`css/modules.css`** | Module system and grid layout: 4-column CSS Grid, `.module` containers, drag handles, resize handles (z-index layers), overflow menus, theme swatches, delete confirmation modal, responsive size classes (`.module.xs/.sm`), wizard overlay, SortableJS ghost effects. |
| **`css/tabs.css`** | Tab bar layout: `#tab-bar` flex container, `#tab-scroll-area` scrollable tab list, `.tab-item` tabs with active/hover states, `#btn-add-tab` add button. |
| **`css/sub-abilities.css`** | Abilities Module: `.ability-container`, `.ability-row`, proficiency dots/rank badges, `.ability-manage-*` (Manage Abilities settings-modal list, SortableJS drag handling). |
| **`css/sub-activity.css`** | Activity Log Module: `.activity-container`, tag-based filter bar, entry list with timestamps, delete buttons, responsive adjustments for small modules. |
| **`css/sub-bio.css`** | Bio Module: `.bio-tab-bar`, `.bio-portrait-frame` (hover-reveal upload/change/remove controls), `.bio-field` system, `.bio-field-value--empty` (placeholder styling), `.bio-section-divider`, `.bio-collapse-header`, `.bio-personality-grid`, system-gated `.bio-system-header`. |
| **`css/sub-companions.css`** | Companions Module: `.companion-table`, `.companion-row` with expandable drawers for notes, inline editing, sort headers, settings modal with add/remove UI. |
| **`css/sub-condition.css`** | Condition Module: `.cond-play-item`/`.cond-edit-item`, value controls, expand modal for details, cascading sub-conditions, custom wizard overlay, SortableJS staging. |
| **`css/sub-counters.css`** | Counters Module: `.counter-row-play`, increment/decrement buttons, icon picker modal, sticky column headers, `.counter-manage-*` Manage Counters list (settings modal), create/edit modal overrides. |
| **`css/sub-health.css`** | Health Module: `.health-layer-play`/`.health-layer-edit`, current/max/temp HP display, damage/healing action overlays, quick-edit mode, responsive layouts. |
| **`css/sub-level.css`** | Level Module: `.level-bar` progress display, `.level-up-btn` styling, XP/milestone tracking bar, settings modal for configuration. |
| **`css/sub-list.css`** | List Module: `.list-table`, `.list-item-row`, sticky column headers with sort, attribute management modal, inspect overlay, cross-list drag transfer. |
| **`css/sub-recovery.css`** | Recovery Module: rest action buttons, hit dice display/spending interface, confirmation dialogs, `.recovery-btn-list` Manage Rest Buttons list (settings modal, drag-to-reorder), `.recovery-edit-field` Rest Button Edit Modal fields. |
| **`css/sub-resistance.css`** | Resistance Module: `.res-layout-columns`/`.res-layout-rows`, play/edit items, settings panel with column-based assignment, wizard overlay, value prompt modal, SortableJS staging. |
| **`css/sub-savingthrow.css`** | Saving Throw Module: `.save-block` play mode, tier badges, quick-edit overlays, `.save-manage-*` Manage Saves list (settings modal), notes display + placeholder + edit modal textarea, settings/custom tier modals. |
| **`css/sub-spells.css`** | Spells Module: `.spells-category`, spell rows, pip-style slot tracking (`.spell-pip`), collapsible categories, detail/edit/settings modals, layout mode editors, SortableJS reorder. |
| **`css/sub-stat.css`** | Stat Module: `.stat-block` play mode, stat name/primary/secondary/proficiency display, quick-edit inputs, layout mode editable blocks, layout toggle buttons, responsive sizing. |
| **`css/sub-weapons.css`** | Weapons Module: `.weapons-container` two-column layout, `.weapon-card`, damage summary, trait chips, ammo/shield HP pips, enhancement UI (chips/picker/form/catalog), quick-edit, cross-column SortableJS drag. |
| **`css/sub-defenses.css`** | Defenses Module: `.def-spotlight` with buffed state glow, `.def-secondary-row` compact rows, `.def-qd-btn` toggle buttons (active green state), `.def-manage-row` Manage Defenses list (settings modal), icon picker popover, `.def-qd-row` Manage Quick Defenses list, SortableJS ghost, responsive compact QD grid. |
| **`css/sub-actions.css`** | Action Tracker Module: `.actions-pill` toggle-able pills (available/used states), `.actions-pill-list` wrap/list layouts, drag handle + delete zones, SortableJS ghost, empty state. |
| **`css/sub-dice-variables.css`** | Dice Variables: autocomplete picker dropdown, blur overlay chips, hover tooltip, broken-reference styling. (Created in Phase 3.) |
| **`css/sub-transfer.css`** | Cross-player transfer: `.sync-indicator` menu bar badge (people icon + peer count), `.list-item-pending` dimmed/hourglass pending item state. Transfer modal styles added in Phase 1B+. |

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
  order: 0,               // position index within the tab (not global)
  theme: '#2D5A3D',       // custom bg color or null
  textLight: false,       // light text mode toggle
  tabId: 'tab-1',         // ID of the tab this module belongs to
  content: ''             // type-specific data (text content for 'text' type)
}
```

### `tabs[]` (array)
The live tab list. Each entry mirrors the save blob shape:
```js
{
  id: 'tab-1',      // unique, from generateTabId()
  name: 'Tab 1',    // display name
  order: 0,         // position in tab bar (re-stamped on reorder)
  color: null       // custom hex color string, or null for theme default
}
```

### `MODULE_TYPES{}` (registry object)
Maps type keys to behavior definitions. Each entry:
```js
{
  label: 'type.text',                          // i18n key — resolve with t(typeDef.label)
  renderBody(bodyEl, data) {},                 // populate .module-body
  syncState(moduleEl, data) {},                // optional — sync live DOM state to data before save
  overflowMenuItems(moduleEl, data) {}         // optional — [{ onClick, label, icon }] entries for the options menu (between Rename and Delete)
}
```
Currently registered types: `abilities`, `activity`, `companions`, `text`, `stat`, `hline`, `health`, `level`, `spacer`, `list`, `counters`, `defenses`, `resistance`, `savingthrow`, `spells`, `condition`, `recovery`, `weapons`, `actions`

### Save Blob (JSON schema v2)
Character sheet persistence format, stored via `TS.localStorage.campaign`:
```js
{
  version: 2,                   // schema version for migrations
  savedAt: '2026-03-21T...',    // ISO timestamp
  moduleIdCounter: 5,           // resume ID generation
  tabIdCounter: 2,              // resume tab ID generation
  gameSystem: 'dnd5e',          // global game system key (dnd5e | pf2e | coc | vtm | cpred | mothership | sr6 | daggerheart | custom)
  tabs: [                       // ordered list of tab objects
    { id: 'tab-1', name: 'Tab 1', order: 0, color: null }
  ],
  activeTabId: 'tab-1',         // ID of the last-viewed tab; falls back to tabs[0] if missing
  activityLog: [ /* activity log entries — character-level, shared across all Activity Log modules */ ],
  modules: [ /* modules[] array entries — each has a tabId field */ ]
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

### Defenses Module `content` (object)
When `type === 'defenses'`, the `content` field stores:
```js
{
  defenses: [
    { id: 'def_xxxxx', name: 'AC', value: 15, icon: 'shield', showSign: false }
  ],
  quickDefenses: [
    { id: 'qd_xxxxx', name: 'Raise Shield', icon: 'shield', modifier: 2, active: false }
  ]
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

### Action Tracker Module `content` (object)
When `type === 'actions'`, the `content` field stores:
```js
{
  layout: 'wrap',                   // 'wrap' | 'list'
  actions: [
    { id: 'act_abc123', name: 'Action', used: false }
  ]
}
```
Pre-populated on creation from `SYSTEM_DEFAULTS` keyed by `window.gameSystem` (see `scripts/module-actions.js`); `custom` starts empty. Action names are plain user-editable strings, not translation keys — duplicates (e.g. PF2e's three "Action" pills) are intentional and never deduplicated. Default size: 3col × 3row.

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

### Unified Mode + Hover-Reveal Chrome
There is no Edit/Play mode toggle — the sheet is always in its interactive (play-style) state. Module chrome is revealed on hover:
```
Default: module shows static title + play-style body; no visible controls
Hover (.module:hover): drag handle (left), options/kebab button (right), resize handle (bottom-right) fade in
Menu open: .module--chrome-active class pins chrome visible while the options menu is open
```
The options (overflow) menu is built from `MODULE_TYPES[type].overflowMenuItems(moduleEl, data)` — each type contributes its own `{ onClick, label, icon }` entries between the always-present Rename (first) and Delete (last) items; there are no per-type toolbar buttons in the module header. SortableJS reorder and the resize handle are always enabled.

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

- Container: `#module-grid` — `grid-template-columns: repeat(8, 1fr)`, gap `8px`, padding `8px`
- Modules span 1–8 columns; position is explicit (`grid-column: colStart / span colSpan`, `grid-row: rowStart / span rowSpan`), not auto-flow — every module's `colStart`/`rowStart` is stored on its data and persisted
- Row height is content-driven by default (`rowSpan: null` → auto-snapped to whole rows via `snapModuleHeight()`); fixed once the user resizes (`rowSpan * 66px + gaps`)
- Layout never auto-repacks. `applyLayout()` only paints each module's already-known position. Positions are assigned once — by `findOpenSlot()` when a module is created/first-placed, by the user's drag/resize, or all at once by the manual "Compact Layout" action (`packAllModules()`) — and never recomputed as a side effect of anything else
