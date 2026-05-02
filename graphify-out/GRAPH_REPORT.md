# Graph Report - Character Vault DEV  (2026-05-02)

## Corpus Check
- 41 files · ~222,873 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 893 edges · 26 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 215 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

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
10. `buildCvSelect()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `t()` --calls--> `openAbilitySettings()`  [INFERRED]
  scripts\i18n.js → scripts\module-abilities.js
- `t()` --calls--> `showConfirm()`  [INFERRED]
  scripts\i18n.js → scripts\module-companions.js
- `t()` --calls--> `renderCompanionRow()`  [INFERRED]
  scripts\i18n.js → scripts\module-companions.js
- `t()` --calls--> `getAttrTypeLabel()`  [INFERRED]
  scripts\i18n.js → scripts\module-companions.js
- `t()` --calls--> `openXPModal()`  [INFERRED]
  scripts\i18n.js → scripts\module-level.js

## Hyperedges (group relationships)
- **Stat Value Flow Across Modules** — cv_stat_linking, cv_cross_module_api, cv_pool_auto_compute, cv_proficiency_ranks [INFERRED 0.85]
- **Dice Roll Pipeline** — cv_dice_api, cv_pending_rolls, cv_pool_rolling, cv_attack_archetypes [EXTRACTED 0.90]
- **Game System Support Matrix** — cv_dnd5e, cv_pf2e, cv_vtm, cv_sr6, cv_cpred, cv_coc, cv_daggerheart [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (58): refreshModuleLabels(), t(), openCompanionSettings(), onLayoutMode(), onPlayMode(), renderBody(), openSaveSettings(), renderSaveBlockEdit() (+50 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): Attack Archetypes (A/B/C), Character Vault, Call of Cthulhu System, Cyberpunk Red System, Cross-Module API Pattern, Daggerheart System, TaleSpire Dice API, D&D 5e System (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (17): applyLayoutMode(), applyPlayMode(), buildSwatchPanel(), closeOverflowMenu(), closeThemePopover(), deleteModule(), handleOverflowOutsideClick(), handleThemePopoverOutsideClick() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (24): snapModuleHeight(), buildAttrOnLog(), closeItemInspect(), closeManageAttrsPanel(), ensureContent(), formatAttrValueForLog(), generateListId(), getSortedItems() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.3
Nodes (24): activateSubconditions(), applyConditionFromStaging(), applyTemplate(), buildSortHeader(), closeCondSettingsPanel(), createSettingsAppliedItem(), ensureCondContent(), generateCondId() (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (15): applyTierPreset(), autoResizeSaveNotesTextarea(), ensureSaveContent(), formatModifier(), getTierForSave(), initSaveSortable(), onLayoutMode(), onPlayMode() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (18): castSpell(), defaultContent(), extractDiceRoll(), genId(), getAvailableSlots(), onLayoutMode(), onPlayMode(), openCategoryEditModal() (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (14): buildAbilityBody(), formatModifier(), getProficiencyRank(), getProficiencyState(), initAbilitySortable(), onLayoutMode(), onPlayMode(), openAbilitySettings() (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (11): buildCompanionsDefaultContent(), ensureContent(), getAttrTypeLabel(), getSortedCompanions(), onLayoutMode(), onPlayMode(), renderBody(), renderCompanionRow() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (12): buildIconPicker(), ensureContent(), initCounterSortable(), openCounterCreateModal(), openCounterEditModal(), renderCounterColumnHeaders(), renderCounterRowEdit(), renderCounterRowPlay() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.3
Nodes (17): addResistanceToColumn(), closeResSettingsPanel(), createAssignedItemEl(), ensureResContent(), generateResId(), getAssignedKeys(), getAvailableTypes(), getResIconSvg() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (14): applyHealing(), autoSizeInput(), buildEditLayer(), buildPlayLayer(), closeHealthActionOverlay(), evaluateHealthExpression(), getEffectiveMaxHP(), onLayoutMode() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (11): ensureContent(), formatTimestamp(), getUniqueEventTypes(), getVisibleEntries(), onLayoutMode(), onPlayMode(), openActivitySettings(), renderActivityLogBody() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): autoResizeTextarea(), onLayoutMode(), onPlayMode(), renderBody(), attachCheckboxHandlers(), buildPf2eRankOptions(), renderMarkdown(), rollDualityDice() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (10): formatModifier(), initStatSortable(), onLayoutMode(), onPlayMode(), renderBody(), renderStatBlock(), renderStatBlockEdit(), reRenderStatEdits() (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.23
Nodes (9): buildEditMode(), buildPlayMode(), hasHealByRoll(), onLayoutMode(), onPlayMode(), openRecoverySettingsModal(), openRestButtonEditModal(), openRestConfirm() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (9): ensureLevelContent(), getLevelProgress(), levelUp(), onLayoutMode(), onPlayMode(), openLevelSettings(), openXPModal(), renderBody() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.48
Nodes (6): deserializeCharacter(), loadCharacter(), migrateData(), saveCharacter(), serializeCharacter(), syncModuleState()

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): loadTheme(), setTheme()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (1): MockRenderer

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (3): Data Migration Pattern, Save Blob Schema v1, scheduleSave() Debounce

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): CV Color Token Layer, Theme System (6 Themes)

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (2): Stat Block Style (large-stat/large-modifier), Two-Column Main/Off Layout

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Deletion UX Policy

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Localization System (i18n)

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Inline SVG Icon System

## Knowledge Gaps
- **21 isolated node(s):** `MockRenderer`, `MODULE_TYPES Registry`, `Quick Edit (Ctrl+Click)`, `Deletion UX Policy`, `Theme System (6 Themes)` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (3 nodes): `theme.js`, `loadTheme()`, `setTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `createStorage()`, `MockRenderer`, `setup.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `CV Color Token Layer`, `Theme System (6 Themes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `Stat Block Style (large-stat/large-modifier)`, `Two-Column Main/Off Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Deletion UX Policy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Localization System (i18n)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Inline SVG Icon System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `Community 0` to `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.542) - this node is a cross-community bridge._
- **Why does `scheduleSave()` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 17`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `escapeHtml()` connect `Community 9` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 13`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 114 inferred relationships involving `t()` (e.g. with `rollAbilityCheck()` and `renderAbilityRow()`) actually correct?**
  _`t()` has 114 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `scheduleSave()` (e.g. with `renderAbilityRowEdit()` and `renderEntries()`) actually correct?**
  _`scheduleSave()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `escapeHtml()` (e.g. with `renderAbilityRow()` and `renderAbilityRowEdit()`) actually correct?**
  _`escapeHtml()` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `openWeaponEditModal()` (e.g. with `t()` and `buildCvSelect()`) actually correct?**
  _`openWeaponEditModal()` has 4 INFERRED edges - model-reasoned connections that need verification._