# Graph Report - .  (2026-05-01)

## Corpus Check
- 85 files · ~222,775 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 892 edges · 26 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 214 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Localization & i18n|Localization & i18n]]
- [[_COMMUNITY_Game System & Cross-Module API|Game System & Cross-Module API]]
- [[_COMMUNITY_Module Core Engine|Module Core Engine]]
- [[_COMMUNITY_List Module|List Module]]
- [[_COMMUNITY_Condition Module|Condition Module]]
- [[_COMMUNITY_Saving Throws Module|Saving Throws Module]]
- [[_COMMUNITY_Spells Module|Spells Module]]
- [[_COMMUNITY_Companions Module|Companions Module]]
- [[_COMMUNITY_Abilities Module|Abilities Module]]
- [[_COMMUNITY_Counters Module|Counters Module]]
- [[_COMMUNITY_Resistance Module|Resistance Module]]
- [[_COMMUNITY_Health Module|Health Module]]
- [[_COMMUNITY_Activity Log Module|Activity Log Module]]
- [[_COMMUNITY_Text Box Module|Text Box Module]]
- [[_COMMUNITY_Stat Module|Stat Module]]
- [[_COMMUNITY_Weapons Module (Core)|Weapons Module (Core)]]
- [[_COMMUNITY_Weapons Module (Traits & Enhancements)|Weapons Module (Traits & Enhancements)]]
- [[_COMMUNITY_Weapons Module (Edit Modal)|Weapons Module (Edit Modal)]]
- [[_COMMUNITY_Recovery Module|Recovery Module]]
- [[_COMMUNITY_Settings & Persistence|Settings & Persistence]]
- [[_COMMUNITY_Theme System|Theme System]]
- [[_COMMUNITY_Dice Rolling System|Dice Rolling System]]
- [[_COMMUNITY_Wizard & Creation|Wizard & Creation]]
- [[_COMMUNITY_Module Toolbar|Module Toolbar]]
- [[_COMMUNITY_Markdown Rendering|Markdown Rendering]]
- [[_COMMUNITY_Color Tokens & Design|Color Tokens & Design]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 116 edges
2. `scheduleSave()` - 35 edges
3. `escapeHtml()` - 31 edges
4. `openWeaponEditModal()` - 21 edges
5. `buildWeaponCard()` - 15 edges
6. `renderPlayBody()` - 14 edges
7. `renderListBody()` - 14 edges
8. `renderSettingsPanelContent()` - 13 edges
9. `buildField()` - 12 edges
10. `getCondName()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `openAbilitySettings()` --calls--> `t()`  [INFERRED]
  scripts\module-abilities.js → scripts\i18n.js
- `showConfirm()` --calls--> `t()`  [INFERRED]
  scripts\module-companions.js → scripts\i18n.js
- `renderCompanionRow()` --calls--> `t()`  [INFERRED]
  scripts\module-companions.js → scripts\i18n.js
- `getAttrTypeLabel()` --calls--> `t()`  [INFERRED]
  scripts\module-companions.js → scripts\i18n.js
- `openXPModal()` --calls--> `t()`  [INFERRED]
  scripts\module-level.js → scripts\i18n.js

## Hyperedges (group relationships)
- **Stat Value Flow Across Modules** — cv_stat_linking, cv_cross_module_api, cv_pool_auto_compute, cv_proficiency_ranks [INFERRED 0.85]
- **Dice Roll Pipeline** — cv_dice_api, cv_pending_rolls, cv_pool_rolling, cv_attack_archetypes [EXTRACTED 0.90]
- **Game System Support Matrix** — cv_dnd5e, cv_pf2e, cv_vtm, cv_sr6, cv_cpred, cv_coc, cv_daggerheart [EXTRACTED 1.00]

## Communities

### Community 0 - "Localization & i18n"
Cohesion: 0.08
Nodes (57): refreshModuleLabels(), t(), onLayoutMode(), onPlayMode(), renderBody(), openSaveSettings(), renderSaveBlockEdit(), buildAccuracySection() (+49 more)

### Community 1 - "Game System & Cross-Module API"
Cohesion: 0.08
Nodes (30): Attack Archetypes (A/B/C), Character Vault, Call of Cthulhu System, Cyberpunk Red System, Cross-Module API Pattern, Daggerheart System, TaleSpire Dice API, D&D 5e System (+22 more)

### Community 2 - "Module Core Engine"
Cohesion: 0.1
Nodes (17): applyLayoutMode(), applyPlayMode(), buildSwatchPanel(), closeOverflowMenu(), closeThemePopover(), deleteModule(), handleOverflowOutsideClick(), handleThemePopoverOutsideClick() (+9 more)

### Community 3 - "List Module"
Cohesion: 0.18
Nodes (24): snapModuleHeight(), buildAttrOnLog(), closeItemInspect(), closeManageAttrsPanel(), ensureContent(), formatAttrValueForLog(), generateListId(), getSortedItems() (+16 more)

### Community 4 - "Condition Module"
Cohesion: 0.3
Nodes (24): activateSubconditions(), applyConditionFromStaging(), applyTemplate(), buildSortHeader(), closeCondSettingsPanel(), createSettingsAppliedItem(), ensureCondContent(), generateCondId() (+16 more)

### Community 5 - "Saving Throws Module"
Cohesion: 0.17
Nodes (15): applyTierPreset(), autoResizeSaveNotesTextarea(), ensureSaveContent(), formatModifier(), getTierForSave(), initSaveSortable(), onLayoutMode(), onPlayMode() (+7 more)

### Community 6 - "Spells Module"
Cohesion: 0.16
Nodes (18): castSpell(), defaultContent(), extractDiceRoll(), genId(), getAvailableSlots(), onLayoutMode(), onPlayMode(), openCategoryEditModal() (+10 more)

### Community 7 - "Companions Module"
Cohesion: 0.15
Nodes (12): buildCompanionsDefaultContent(), ensureContent(), getAttrTypeLabel(), getSortedCompanions(), onLayoutMode(), onPlayMode(), openCompanionSettings(), renderBody() (+4 more)

### Community 8 - "Abilities Module"
Cohesion: 0.2
Nodes (14): buildAbilityBody(), formatModifier(), getProficiencyRank(), getProficiencyState(), initAbilitySortable(), onLayoutMode(), onPlayMode(), openAbilitySettings() (+6 more)

### Community 9 - "Counters Module"
Cohesion: 0.2
Nodes (12): buildIconPicker(), ensureContent(), initCounterSortable(), openCounterCreateModal(), openCounterEditModal(), renderCounterColumnHeaders(), renderCounterRowEdit(), renderCounterRowPlay() (+4 more)

### Community 10 - "Resistance Module"
Cohesion: 0.3
Nodes (17): addResistanceToColumn(), closeResSettingsPanel(), createAssignedItemEl(), ensureResContent(), generateResId(), getAssignedKeys(), getAvailableTypes(), getResIconSvg() (+9 more)

### Community 11 - "Health Module"
Cohesion: 0.26
Nodes (14): applyHealing(), autoSizeInput(), buildEditLayer(), buildPlayLayer(), closeHealthActionOverlay(), evaluateHealthExpression(), getEffectiveMaxHP(), onLayoutMode() (+6 more)

### Community 12 - "Activity Log Module"
Cohesion: 0.24
Nodes (11): ensureContent(), formatTimestamp(), getUniqueEventTypes(), getVisibleEntries(), onLayoutMode(), onPlayMode(), openActivitySettings(), renderActivityLogBody() (+3 more)

### Community 13 - "Text Box Module"
Cohesion: 0.18
Nodes (9): autoResizeTextarea(), onLayoutMode(), onPlayMode(), renderBody(), attachCheckboxHandlers(), buildPf2eRankOptions(), renderMarkdown(), rollDualityDice() (+1 more)

### Community 14 - "Stat Module"
Cohesion: 0.2
Nodes (10): formatModifier(), initStatSortable(), onLayoutMode(), onPlayMode(), renderBody(), renderStatBlock(), renderStatBlockEdit(), reRenderStatEdits() (+2 more)

### Community 15 - "Weapons Module (Core)"
Cohesion: 0.23
Nodes (9): buildEditMode(), buildPlayMode(), hasHealByRoll(), onLayoutMode(), onPlayMode(), openRecoverySettingsModal(), openRestButtonEditModal(), openRestConfirm() (+1 more)

### Community 16 - "Weapons Module (Traits & Enhancements)"
Cohesion: 0.29
Nodes (9): ensureLevelContent(), getLevelProgress(), levelUp(), onLayoutMode(), onPlayMode(), openLevelSettings(), openXPModal(), renderBody() (+1 more)

### Community 17 - "Weapons Module (Edit Modal)"
Cohesion: 0.48
Nodes (6): deserializeCharacter(), loadCharacter(), migrateData(), saveCharacter(), serializeCharacter(), syncModuleState()

### Community 18 - "Recovery Module"
Cohesion: 1.0
Nodes (2): loadTheme(), setTheme()

### Community 20 - "Settings & Persistence"
Cohesion: 0.67
Nodes (1): MockRenderer

### Community 21 - "Theme System"
Cohesion: 0.67
Nodes (3): Data Migration Pattern, Save Blob Schema v1, scheduleSave() Debounce

### Community 24 - "Dice Rolling System"
Cohesion: 1.0
Nodes (2): CV Color Token Layer, Theme System (6 Themes)

### Community 25 - "Wizard & Creation"
Cohesion: 1.0
Nodes (2): Stat Block Style (large-stat/large-modifier), Two-Column Main/Off Layout

### Community 40 - "Module Toolbar"
Cohesion: 1.0
Nodes (1): Deletion UX Policy

### Community 41 - "Markdown Rendering"
Cohesion: 1.0
Nodes (1): Localization System (i18n)

### Community 42 - "Color Tokens & Design"
Cohesion: 1.0
Nodes (1): Inline SVG Icon System

## Knowledge Gaps
- **21 isolated node(s):** `MockRenderer`, `MODULE_TYPES Registry`, `Quick Edit (Ctrl+Click)`, `Deletion UX Policy`, `Theme System (6 Themes)` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Recovery Module`** (3 nodes): `theme.js`, `loadTheme()`, `setTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings & Persistence`** (3 nodes): `createStorage()`, `MockRenderer`, `setup.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dice Rolling System`** (2 nodes): `CV Color Token Layer`, `Theme System (6 Themes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Wizard & Creation`** (2 nodes): `Stat Block Style (large-stat/large-modifier)`, `Two-Column Main/Off Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Toolbar`** (1 nodes): `Deletion UX Policy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Markdown Rendering`** (1 nodes): `Localization System (i18n)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Color Tokens & Design`** (1 nodes): `Inline SVG Icon System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `Localization & i18n` to `Module Core Engine`, `List Module`, `Condition Module`, `Saving Throws Module`, `Spells Module`, `Companions Module`, `Abilities Module`, `Counters Module`, `Resistance Module`, `Health Module`, `Activity Log Module`, `Text Box Module`, `Stat Module`, `Weapons Module (Core)`, `Weapons Module (Traits & Enhancements)`?**
  _High betweenness centrality (0.544) - this node is a cross-community bridge._
- **Why does `scheduleSave()` connect `Condition Module` to `Localization & i18n`, `Module Core Engine`, `List Module`, `Spells Module`, `Abilities Module`, `Counters Module`, `Resistance Module`, `Activity Log Module`, `Text Box Module`, `Stat Module`, `Weapons Module (Edit Modal)`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `escapeHtml()` connect `Counters Module` to `Localization & i18n`, `Module Core Engine`, `List Module`, `Condition Module`, `Saving Throws Module`, `Abilities Module`, `Resistance Module`, `Health Module`, `Text Box Module`, `Stat Module`, `Weapons Module (Core)`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 114 inferred relationships involving `t()` (e.g. with `rollAbilityCheck()` and `renderAbilityRow()`) actually correct?**
  _`t()` has 114 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `scheduleSave()` (e.g. with `renderAbilityRowEdit()` and `renderEntries()`) actually correct?**
  _`scheduleSave()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `escapeHtml()` (e.g. with `renderAbilityRow()` and `renderAbilityRowEdit()`) actually correct?**
  _`escapeHtml()` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `openWeaponEditModal()` (e.g. with `t()` and `buildCvSelect()`) actually correct?**
  _`openWeaponEditModal()` has 4 INFERRED edges - model-reasoned connections that need verification._