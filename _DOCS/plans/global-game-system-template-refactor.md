# Global Game System Template Refactor

## Context

Currently, every module manages its own game system template selection independently — three wizard dropdowns (stats, abilities, saving throws), one conditions settings dropdown, one saving throw tier preset dropdown, and one level XP preset dropdown. There is no concept of a "character sheet's game system." This means a user could accidentally mix D&D 5e stats with PF2e conditions, which makes no sense.

**Goal:** Replace per-module template selection with a single global game system setting stored in symbiote settings. New modules would auto-populate from this global setting. Existing modules might also react to it (TBD — see open questions below).

---

## Phase 1: Full Audit (Complete)

### Modules With Template Selection

| Module | Where Template Is Selected | Template Key Persisted? | Systems Supported |
|---|---|---|---|
| **Stat** | Wizard dropdown (`#wizard-stat-template-select`) | No — template consumed at creation; raw stat array stored | D&D 5e, PF2e, Daggerheart, CoC, VtM, Cyberpunk RED, Mothership, Shadowrun 6e |
| **Abilities** | Wizard dropdown (`#wizard-abilities-template-select`) | No — template consumed at creation; raw abilities array stored | D&D 5e, PF2e, CoC, VtM, Cyberpunk RED, Mothership, Shadowrun 6e |
| **Saving Throws** | Wizard dropdown (`#wizard-savingthrow-template-select`) | Partially — `content.tierPreset` persisted for tier normalization | D&D 5e, PF2e, CoC, Cyberpunk RED, Mothership |
| **Conditions** | Settings panel dropdown (`cond-template-select` in `openCondSettingsPanel`) | Yes — `content.template` persisted; used at every render for name/icon/desc lookup | D&D 5e, PF2e, CoC, VtM, Cyberpunk RED, Mothership, Shadowrun 6e, Daggerheart, Custom |
| **Level** | Settings panel XP Table Preset select (`openLevelSettings`) | No — `content.xpThresholds[]` stored as raw array | D&D 5e, PF2e |

### Code Locations

**`main.html`** — Three hardcoded wizard dropdown sections:
- `#wizard-abilities-template` / `#wizard-abilities-template-select` (lines ~209–228)
- `#wizard-stat-template` / `#wizard-stat-template-select` (lines ~247–267)
- `#wizard-savingthrow-template` / `#wizard-savingthrow-template-select` (lines ~269–286)

**`scripts/module-core.js`** — Wizard state and creation handler:
- `wizardState.statTemplate`, `wizardState.abilitiesTemplate`, `wizardState.savingthrowTemplate` — transient keys consumed at `btnWizardCreate`
- `resetWizard()` — shows/hides the three template selector divs
- Type card click handler — toggles template section visibility
- Template wiring click handlers for all three dropdowns
- `btnWizardCreate` handler — calls `applyStatTemplate()`, `applyAbilityTemplate()`, `applySavingThrowTemplate()`, `applyTierPreset()`

**`scripts/module-stat.js`**:
- `STAT_TEMPLATES` const — 8 systems
- `applyStatTemplate(templateKey)` — returns pre-populated stats array

**`scripts/module-abilities.js`**:
- `ABILITY_TEMPLATES` const — 7 systems
- `applyAbilityTemplate(templateKey)` — returns pre-populated abilities array

**`scripts/module-savingthrow.js`**:
- `SAVE_TEMPLATES` const — 5 systems
- `TIER_PRESETS` const — simple, dnd5e, pf2e
- `applySavingThrowTemplate(key)` / `applyTierPreset(key)` — returns pre-populated arrays
- `openSaveSettings()` — settings modal with tier preset `<select>` (simple, dnd5e, pf2e, custom)
- `ensureSaveContent()` — normalization step that re-applies tier preset if `tierPreset === 'dnd5e'`

**`scripts/module-condition.js`**:
- `CONDITION_TEMPLATES` const — 9 systems + custom
- `TEMPLATE_KEYS` const — canonical ordering for dropdowns
- `getTemplateDef()`, `getCondName()`, `getCondIconSvg()`, `getCondDescription()`, etc. — runtime lookups using `content.template`
- `applyTemplate(templateKey, mode, content)` — core apply function
- `openCondSettingsPanel` → `renderSettingsPanelContent` — settings dropdown with `cond-template-select`
- `handleTemplateChange()` — opens confirmation dialog when switching templates

**`scripts/module-level.js`**:
- `LEVEL_XP_TEMPLATES` const — dnd5e, pf2e XP threshold arrays
- `detectTemplate()` inside `openLevelSettings` — compares stored thresholds to detect current preset
- XP Table Preset `<select>` in `openLevelSettings` — custom, dnd5e, pf2e

**`scripts/translations.js`**:
- Keys: `abilities.templateLabel/None`, `stat.templateLabel/None`, `save.templateLabel/None`, `save.tierPreset*`, `cond.template*`, `level.templateLabel*`

**`scripts/settings.js`**:
- Currently has no global game system setting — new setting must be added here

### Key Architectural Notes

1. **Conditions is architecturally different from the others.** Stats/Abilities/Saves use the template key only at creation-time and store the raw output. Conditions stores `content.template` permanently and resolves all display data (names, icons, descriptions) dynamically at render. A global system change must handle these two patterns differently.

2. **System coverage is inconsistent across modules.** Daggerheart exists for Stats and Conditions but not Abilities or Saving Throws. Shadowrun exists for Stats, Abilities, Conditions but not Saving Throws. A global system selection must gracefully handle "no template defined for this module."

3. **Wizard dropdowns are static HTML** — not generated from JS objects. Adding/removing a system requires changes in both `main.html` and each JS template object.

---

## Decisions

| Question | Decision |
|---|---|
| System change affects existing modules? | No migration needed — no current users. Implement clean new system only. |
| Wizard per-module dropdowns | **Remove entirely.** Wizard no longer shows template pickers. |
| Level XP preset | **Tie to global system.** D&D 5e and PF2e auto-populate; all others default blank/custom. |
| "Custom" global option | **Start blank.** No auto-population for any module type. |

---

## Implementation Plan (Phase 2)

### 1. Add `gameSystem` to global settings — `scripts/settings.js`

- Add `gameSystem: 'dnd5e'` to the default settings object
- Supported values: `'dnd5e'`, `'pf2e'`, `'coc'`, `'vtm'`, `'cpred'`, `'mothership'`, `'sr6'`, `'daggerheart'`, `'custom'`
- Add getter/setter wired to `scheduleSave()`

### 2. Add game system selector to settings overlay UI — `main.html` + `scripts/settings.js`

- Add a new section in the settings overlay: "Game System"
- Use a `.cv-select` dropdown listing all 9 systems (alphabetical by display label, Custom last)
- onChange: update `settings.gameSystem`, call `scheduleSave()`

### 3. Remove per-module wizard template dropdowns — `main.html`

Remove these three sections entirely from `#wizard-overlay`:
- `#wizard-abilities-template` / `#wizard-abilities-template-select`
- `#wizard-stat-template` / `#wizard-stat-template-select`
- `#wizard-savingthrow-template` / `#wizard-savingthrow-template-select`

### 4. Clean up wizard state and handlers — `scripts/module-core.js`

- Remove `statTemplate`, `abilitiesTemplate`, `savingthrowTemplate` from `wizardState`
- Remove the three template wiring click handler blocks
- Remove template section visibility toggling from `resetWizard()` and type card click handler
- In `btnWizardCreate` handler: replace `wizardState.statTemplate` etc. with `settings.gameSystem`

### 5. Wire creation to global system — `scripts/module-core.js`

In `btnWizardCreate`, for each module type:
- **stat**: `applyStatTemplate(settings.gameSystem)` — falls back to empty array if no template defined for that system
- **abilities**: `applyAbilityTemplate(settings.gameSystem)` — same fallback
- **savingthrow**: `applySavingThrowTemplate(settings.gameSystem)` + `applyTierPreset(inferTierPreset(settings.gameSystem))` — same fallback
- **condition**: set `content.template = settings.gameSystem` (already handles `'custom'` as empty)
- **level**: if `settings.gameSystem` is `'dnd5e'` or `'pf2e'`, auto-populate `content.xpThresholds` from `LEVEL_XP_TEMPLATES[settings.gameSystem]`; otherwise leave empty

Add a small helper `inferTierPreset(systemKey)` — maps `'dnd5e'` → `'dnd5e'`, `'pf2e'` → `'pf2e'`, everything else → `'simple'`.

### 6. Handle "no template" gracefully in apply functions

Each `apply*Template()` function already returns an array. Verify they return `[]` (not error) when called with an unsupported key. Add fallback if needed:
- `applyStatTemplate(key)` — if `STAT_TEMPLATES[key]` undefined, return `[]`
- `applyAbilityTemplate(key)` — same
- `applySavingThrowTemplate(key)` — same

### 7. Update translations — `scripts/translations.js`

- Add keys for the new settings section: `settings.gameSystem`, `settings.gameSystemLabel`, plus display names for all 9 systems (reuse existing `cond.template*` keys where possible, or add a unified `system.*` namespace)
- Remove or deprecate: `abilities.templateLabel`, `abilities.templateNone`, `stat.templateLabel`, `stat.templateNone`, `save.templateLabel`, `save.templateNone` (wizard labels no longer needed)

### 8. Update documentation

- `_DOCS/ARCHITECTURE.md`: Update `wizardState` schema, note removal of per-module template fields, add `settings.gameSystem`
- `_DOCS/SUBMODULES/STATS.md`: Update "Stat Templates" section — creation now uses global setting
- `_DOCS/SUBMODULES/ABILITIES.md`: Same
- `_DOCS/SUBMODULES/SAVING_THROWS.md`: Same
- `_DOCS/SUBMODULES/CONDITIONS.md`: Note that `content.template` is now initialized from global setting at creation

---

## Critical Files

| File | Change |
|---|---|
| `scripts/settings.js` | Add `gameSystem` field, getter/setter, settings UI section |
| `main.html` | Remove 3 wizard template dropdown sections; add game system selector to settings overlay |
| `scripts/module-core.js` | Remove template wizard state/handlers; wire `btnWizardCreate` to `settings.gameSystem` |
| `scripts/module-stat.js` | Verify `applyStatTemplate` returns `[]` for unknown keys |
| `scripts/module-abilities.js` | Verify `applyAbilityTemplate` returns `[]` for unknown keys |
| `scripts/module-savingthrow.js` | Verify `applySavingThrowTemplate` returns `[]` for unknown keys; add `inferTierPreset` helper |
| `scripts/module-level.js` | Wire XP preset to global system at creation |
| `scripts/translations.js` | Add settings keys, remove obsolete wizard template keys |
| `_DOCS/ARCHITECTURE.md` | Inline updates to wizardState, settings schema |
| `_DOCS/SUBMODULES/*.md` | Update template sections |

---

## Verification

- Open settings overlay → confirm game system selector appears and saves correctly
- Set system to D&D 5e → create Stat module → confirm STR/DEX/CON/INT/WIS/CHA populated
- Set system to D&D 5e → create Abilities module → confirm D&D 5e skills populated
- Set system to D&D 5e → create Saving Throws → confirm 6 saves + D&D 5e tier preset
- Set system to D&D 5e → create Conditions → confirm `content.template === 'dnd5e'`
- Set system to D&D 5e → create Level → confirm XP thresholds auto-populated
- Set system to Daggerheart → create Abilities → confirm blank (no Daggerheart abilities template)
- Set system to Custom → create any module → confirm all start blank
- Verify no wizard template dropdowns appear for any module type
