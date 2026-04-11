# Global Game System Template Refactor

## Context

Currently, every module manages its own game system template selection independently — three wizard dropdowns (stats, abilities, saving throws), one conditions settings dropdown, one saving throw tier preset dropdown, and one level XP preset dropdown. There is no concept of a "character sheet's game system." This means a user could accidentally mix D&D 5e stats with PF2e conditions, which makes no sense.

**Goal:** Replace per-module template selection with a single global game system setting stored in character save data. New modules auto-populate from this global setting. No per-module template switching after creation.

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
- `#wizard-abilities-template` / `#wizard-abilities-template-select`
- `#wizard-stat-template` / `#wizard-stat-template-select`
- `#wizard-savingthrow-template` / `#wizard-savingthrow-template-select`

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

4. **All `apply*Template()` functions return `[]` for unknown keys** — safe silent fallback, no errors thrown. Conditions' `applyTemplate()` returns `undefined` for unknown keys (also safe — it's a no-op).

5. **Settings.js uses raw localStorage per-control** — no centralized state object, no getter/setter pattern. Since `gameSystem` lives in character save data (not localStorage), it will use `scheduleSave()` for persistence, but the UI wiring follows the existing direct event listener pattern.

---

## Decisions

| Question | Decision |
|---|---|
| Where is `gameSystem` stored? | **Character save data** (per-character via `persistence.js`), not localStorage. Different characters can use different systems. |
| System change affects existing modules? | No migration needed — no current users. Implement clean new system only. |
| Wizard per-module dropdowns | **Remove entirely.** Wizard no longer shows template pickers. |
| Conditions settings template dropdown | **Remove.** System is set at creation from global setting, no per-module switching. Custom conditions still work. |
| Level XP preset dropdown | **Remove.** XP thresholds set from global system at creation. Manual threshold editing remains. |
| "Custom" global option | **Start blank.** No auto-population for any module type. |
| Module title auto-naming | Derive from global system: `getGameSystemDisplayName(sys) + ' ' + t('type.<type>')`. `null` for custom. |

---

## Implementation Plan (Phase 2) — COMPLETE (2026-04-10)

### 1. Add `gameSystem` to character save data — `scripts/persistence.js`

In `serializeCharacter()` (starts at line 23), add `gameSystem: window.gameSystem || 'custom'` to the JSON object alongside `version`, `savedAt`, `moduleIdCounter`, `modules`.

In `deserializeCharacter()` (starts at line 43), after line 64 (`moduleIdCounter = blob.moduleIdCounter || 0;`), add:
```javascript
window.gameSystem = blob.gameSystem || 'custom';
if (typeof syncGameSystemUI === 'function') syncGameSystemUI();
```

### 2. Add helpers — `scripts/shared.js`

Add before the closing `})()` and expose on `window`:

**`inferTierPreset(systemKey)`** — returns `'dnd5e'` for `'dnd5e'`, `'pf2e'` for `'pf2e'`, `'simple'` for everything else.

**`getGameSystemDisplayName(systemKey)`** — lookup object returning display name string, `null` for `'custom'`. Map:
```
dnd5e → 'D&D 5e', pf2e → 'Pathfinder 2e', coc → 'Call of Cthulhu',
vtm → 'Vampire: The Masquerade', cpred → 'Cyberpunk Red',
mothership → 'Mothership', sr6 → 'Shadowrun 6e', daggerheart → 'Daggerheart',
custom → null
```

### 3. Game System selector in settings overlay — `main.html` + `scripts/settings.js`

**`main.html`**: Insert a new `.settings-section` between the Language `</div>` (line 64) and the Theme `<!-- Theme -->` comment (line 66). Use the same pattern as the Language section. Options in this order (alphabetical by display name, Custom last):

```
coc       → Call of Cthulhu
cpred     → Cyberpunk Red
dnd5e     → D&D 5e
daggerheart → Daggerheart
mothership → Mothership
pf2e      → Pathfinder 2e
sr6       → Shadowrun 6e
vtm       → Vampire: The Masquerade
custom    → Custom / Other
```

Use `<select id="setting-game-system" class="settings-select">`. Label with `data-i18n="settings.gameSystem"`.

**`scripts/settings.js`** — Add after the language `change` listener wiring (after line 70):
- `const gameSystemSelect = document.getElementById('setting-game-system');`
- Change listener: sets `window.gameSystem = gameSystemSelect.value`, calls `scheduleSave()`
- Expose `window.syncGameSystemUI = function()` that sets `gameSystemSelect.value = window.gameSystem || 'custom'`
- Initial sync on load: `gameSystemSelect.value = window.gameSystem || 'custom'`

### 4. Initialize `window.gameSystem` — `scripts/module-core.js`

Add `window.gameSystem = 'custom';` after line 20 (`window.moduleIdCounter = 0;`) as the default before character data loads.

### 5. Remove wizard template HTML — `main.html`

Delete these three blocks. **Keep `#wizard-stat-layout` (lines 230–245) intact.**

- **Lines 209–228**: `<!-- Abilities Template -->` through closing `</div>` of `#wizard-abilities-template`
- **Lines 247–267**: `<!-- Stat Template -->` through closing `</div>` of `#wizard-stat-template`
- **Lines 269–286**: `<!-- Saving Throw Template -->` through closing `</div>` of `#wizard-savingthrow-template`

### 6. Clean up wizard state/handlers — `scripts/module-core.js`

**6a. `wizardState` object (lines 22–29):** Remove these three properties:
- Line 26: `statTemplate: '',`
- Line 27: `abilitiesTemplate: '',`
- Line 28: `savingthrowTemplate: '',`

**6b. `resetWizard()` (lines 42–137):** Remove the template reset lines:
- Line 51: `statTemplate: '',` (inside the reset assignment)
- Line 52: `abilitiesTemplate: '',`
- Line 53: `savingthrowTemplate: '',`
- Lines 87–102: Block resetting `wizard-stat-template` section (starts with `const statTemplateSelect = ...`)
- Lines 104–119: Block resetting `wizard-abilities-template` section (starts with `const abilitiesTemplateSelect = ...`)
- Lines 121–136: Block resetting `wizard-savingthrow-template` section (starts with `const savingthrowTemplateSelect = ...`)

**6c. Type card click handler (lines 161–178):** Remove lines 170–176 (the six lines toggling template section visibility):
```javascript
const statTemplateEl = document.getElementById('wizard-stat-template');
if (statTemplateEl) statTemplateEl.classList.toggle('visible', wizardState.type === 'stat');
const abilitiesTemplateEl = document.getElementById('wizard-abilities-template');
if (abilitiesTemplateEl) abilitiesTemplateEl.classList.toggle('visible', wizardState.type === 'abilities');
const savingthrowTemplateEl = document.getElementById('wizard-savingthrow-template');
if (savingthrowTemplateEl) savingthrowTemplateEl.classList.toggle('visible', wizardState.type === 'savingthrow');
```

**6d. Delete three template dropdown wiring blocks entirely:**
- Lines 189–219: Block starting with `// Stat template selection (custom cv-select)` / `const wizardStatTemplateSelect = ...` through its closing `}`
- Lines 221–250: Block starting with `// Abilities template selection (custom cv-select)` / `const wizardAbilitiesTemplateSelect = ...` through its closing `}`
- Lines 252–281: Block starting with `// Saving Throw template selection (custom cv-select)` / `const wizardSavingthrowTemplateSelect = ...` through its closing `}`

What comes before: line 188 (end of stat layout button wiring). What comes after: line 283 (comment for color swatch selection).

### 7. Rewrite `btnWizardCreate` to use global system — `scripts/module-core.js`

The `btnWizardCreate` handler spans lines 320–471. Replace each per-type block:

**Abilities block (lines 332–343):** Replace with:
```javascript
if (moduleData.type === 'abilities') {
    const sys = window.gameSystem || 'custom';
    const templateAbilities = sys !== 'custom' ? applyAbilityTemplate(sys) : [];
    moduleData.content = { linkedStatModuleId: null, abilities: templateAbilities };
    const sysName = getGameSystemDisplayName(sys);
    if (sysName && templateAbilities.length > 0) {
        moduleData.title = sysName + ' ' + t('type.abilities');
    }
    moduleData.colSpan = 2;
    moduleData.rowSpan = null;
}
```

**Stat block (lines 363–388):** Replace with (preserve the grid sizing logic):
```javascript
if (moduleData.type === 'stat') {
    const sys = window.gameSystem || 'custom';
    const templateStats = sys !== 'custom' ? applyStatTemplate(sys) : [];
    moduleData.content = { layout: wizardState.statLayout, stats: templateStats };
    const sysName = getGameSystemDisplayName(sys);
    if (sysName && templateStats.length > 0) {
        moduleData.title = sysName + ' Stats';
    }
    // --- keep existing grid sizing logic below unchanged ---
    const statCount = templateStats.length;
    if (statCount === 0) {
        moduleData.colSpan = 2;
        moduleData.rowSpan = 2;
    } else {
        const sPerRow = (cols) => (cols === 2 ? 3 : cols === 3 ? 5 : 6);
        let targetCols = 4;
        for (let cols = 2; cols <= 4; cols++) {
            if (sPerRow(cols) >= statCount) {
                targetCols = cols;
                break;
            }
        }
        const statRows = Math.ceil(statCount / sPerRow(targetCols));
        moduleData.colSpan = targetCols;
        moduleData.rowSpan = statRows + 1;
    }
}
```

**Condition block (lines 414–425):** Replace with:
```javascript
if (moduleData.type === 'condition') {
    const sys = window.gameSystem || 'custom';
    moduleData.colSpan = 2;
    moduleData.rowSpan = null;
    moduleData.content = {
        template: sys,
        applied: [],
        staging: [],
        customConditions: [],
        sortBy: null,
        sortDir: 'asc',
    };
    if (sys !== 'custom') {
        applyConditionTemplate(sys, 'replace', moduleData.content);
        const sysName = getGameSystemDisplayName(sys);
        if (sysName) moduleData.title = sysName + ' ' + t('type.condition');
    }
}
```

**Saving throw block (lines 427–448):** Replace with:
```javascript
if (moduleData.type === 'savingthrow') {
    const sys = window.gameSystem || 'custom';
    const templateSaves = sys !== 'custom' ? applySavingThrowTemplate(sys) : [];
    const tierKey = inferTierPreset(sys);
    const presetTiers = applyTierPreset(tierKey);
    const autoTierPreset = sys !== 'custom' && templateSaves.length > 0;
    moduleData.content = {
        saves: templateSaves,
        notes: '',
        tiersEnabled: autoTierPreset,
        tiers: presetTiers.length > 0 ? presetTiers : applyTierPreset('simple'),
        tierPreset: tierKey,
    };
    const sysName = getGameSystemDisplayName(sys);
    if (sysName && templateSaves.length > 0) {
        moduleData.title = sysName + ' ' + t('type.savingthrow');
    }
    const saveCount = templateSaves.length;
    moduleData.colSpan = saveCount <= 3 ? 2 : saveCount <= 6 ? 3 : 4;
    moduleData.rowSpan = null;
}
```

**Level block (lines 450–462):** Replace with:
```javascript
if (moduleData.type === 'level') {
    const sys = window.gameSystem || 'custom';
    const xpTpl = window.LEVEL_XP_TEMPLATES && window.LEVEL_XP_TEMPLATES[sys];
    moduleData.colSpan = 1;
    moduleData.rowSpan = null;
    moduleData.content = {
        level: 1,
        currentXP: 0,
        levelingSystem: 'xp',
        xpThresholds: xpTpl ? xpTpl.thresholds.slice() : [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],
        carryOverXP: true,
        barColor: null,
        barStyle: 'solid',
    };
    const sysName = getGameSystemDisplayName(sys);
    if (sysName && xpTpl) moduleData.title = sysName + ' ' + t('type.level');
}
```

### 8. Expose functions for module-core.js consumption

**`scripts/module-condition.js`**: Near the window exports at line 3028–3031 (currently only `window.openCondSettings`), add:
```javascript
window.applyConditionTemplate = applyTemplate;
```

**`scripts/module-level.js`**: Near the window exports at lines 697–704 (currently `window.getCharacterLevel` and `window.openLevelSettings`), add:
```javascript
window.LEVEL_XP_TEMPLATES = LEVEL_XP_TEMPLATES;
```

### 9. Remove conditions template dropdown + dead code — `scripts/module-condition.js`

**9a.** In `renderSettingsPanelContent()` (starts at line 2282), delete the template selector block at **lines 2309–2334**. This block starts with `// Template Selector` and ends with `body.appendChild(tplSection);`. What comes before: line 2307 (`body.className = 'cv-modal-body cond-settings-body';`). What comes after: line 2336 (`// Applied section`).

**9b.** Delete `handleTemplateChange()` entirely at **lines 2623–2707**. Only one call site exists (line 2330, already removed in 9a). No dangling references.

**Keep**: `CONDITION_TEMPLATES`, `TEMPLATE_KEYS`, `getTemplateDef()`, `getCondName()`, `getCondIconSvg()`, `getCondDescription()` — all still needed for runtime display resolution.

### 10. Remove level XP preset dropdown — `scripts/module-level.js`

All changes are inside `openLevelSettings()` (starts at line 317):

**10a.** Delete the template preset section at **lines 388–421**: starts with `const templateSection = document.createElement('div');`, includes `detectTemplate()` function definition (lines 411–416), ends with `xpOnlyWrap.appendChild(templateSection);`. Variables: `templateSection`, `templateLabel`, `templateSelect`.

**10b.** Delete the `templateSelect` change listener at **lines 496–503**: starts with `templateSelect.addEventListener('change', () => {`.

**10c.** Remove `detectTemplate()` calls at these locations:
- Line 417: `templateSelect.value = detectTemplate();` — already removed with block in 10a
- Line 454: `templateSelect.value = detectTemplate();` inside threshold input handler — delete this line only
- Line 465: `templateSelect.value = 'custom';` inside delete button handler — delete this line only
- Line 486: `templateSelect.value = 'custom';` inside add threshold button handler — delete this line only

**Keep**: The XP threshold list UI, "Add Level" button, and manual threshold editing all remain.

### 11. Update translations — `scripts/translations.js`

All 7 language blocks must be updated.

**Add** (near other `settings.*` keys):
- `'settings.gameSystem': 'Game System'`
- `'settings.gameSystemCustom': 'Custom / Other'`

**Remove** (wizard template labels — no longer needed):
- `'abilities.templateLabel'`, `'abilities.templateNone'`
- `'stat.templateLabel'`, `'stat.templateNone'`
- `'save.templateLabel'`, `'save.templateNone'`

**Remove** (conditions template switching UI — no longer needed):
- `'cond.template'` (the label, currently "Game System")
- `'cond.templateReplace'`, `'cond.templateMerge'`, `'cond.templateCancel'`
- `'cond.templateWarnTitle'`, `'cond.templateWarnMsg'`

**Remove** (level preset dropdown — no longer needed):
- `'level.templateLabel'`, `'level.templateDnd5e'`, `'level.templatePf2e'`, `'level.templateCustom'`

**Keep** (used at runtime by conditions module for display names):
- `'cond.templateDnd5e'` through `'cond.templateDaggerheart'`, `'cond.templateCustom'`

### 12. CSS cleanup — `main.css`

**Remove lines 3075–3085** — wizard stat template styles:
```css
/* Wizard stat template sub-option */
.wizard-stat-template { ... }
.wizard-stat-template.visible { ... }
```

**Remove lines 5646–5685** — conditions template selector styles:
```css
/* ── Condition Template Selector ── */
.cond-template-section { ... }
.cond-template-label { ... }
.cond-template-select { ... }
.cond-template-select:focus { ... }
```

**Remove lines 6253–6339** — conditions template switch dialog styles:
```css
/* ── Condition Template Switch Dialog ── */
.cond-template-dialog { ... }
.cond-template-dialog-panel { ... }
.cond-template-dialog-title { ... }
.cond-template-dialog-msg { ... }
.cond-template-dialog-actions { ... }
.cond-template-dialog-btn { ... }
.cond-template-dialog-btn:hover { ... }
.cond-template-dialog-btn-merge { ... }
.cond-template-dialog-btn-merge:hover { ... }
.cond-template-dialog-btn-replace { ... }
.cond-template-dialog-btn-replace:hover { ... }
```

### 13. Update documentation

- `_DOCS/ARCHITECTURE.md`: Update `wizardState` schema (remove `statTemplate`, `abilitiesTemplate`, `savingthrowTemplate`), add `gameSystem` to save data schema, note removal of per-module template selection
- `_DOCS/SUBMODULES/STATS.md`, `ABILITIES.md`, `SAVING_THROWS.md`, `CONDITIONS.md`: Update template sections — creation now uses global setting

---

## Critical Files

| File | Change |
|---|---|
| `scripts/persistence.js` | Serialize/deserialize `gameSystem` |
| `scripts/shared.js` | `inferTierPreset()`, `getGameSystemDisplayName()` |
| `scripts/settings.js` | Game system dropdown, `syncGameSystemUI()` |
| `scripts/module-core.js` | Remove wizard template state/handlers, rewrite `btnWizardCreate` |
| `scripts/module-condition.js` | Remove settings dropdown + `handleTemplateChange()`, expose `applyTemplate` |
| `scripts/module-level.js` | Remove XP preset dropdown + `detectTemplate()`, expose `LEVEL_XP_TEMPLATES` |
| `main.html` | Remove 3 wizard template sections, add settings game system selector |
| `main.css` | Remove wizard template + conditions dialog styles |
| `scripts/translations.js` | Add settings keys, remove obsolete keys |

---

## Verification

1. Settings overlay shows game system dropdown between Language and Theme, defaults to "Custom"
2. Set to "D&D 5e" → create stat module → 6 D&D stats, title "D&D 5e Stats"
3. Create abilities module → D&D 5e abilities
4. Create saving throw module → D&D 5e saves with dnd5e tier preset
5. Create conditions module → `content.template = 'dnd5e'`, conditions in staging
6. Create level module → D&D 5e XP thresholds
7. Set to "Daggerheart" → create abilities module → blank (no template), title null
8. Save, reload → game system persists and restores
9. Conditions settings panel has no template dropdown
10. Level settings has no XP preset dropdown (threshold editing still works)
