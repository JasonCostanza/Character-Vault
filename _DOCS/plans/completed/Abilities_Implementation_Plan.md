# Abilities Module — Design Spec & Implementation Plan

## Context

The Abilities module tracks a character's skill checks (e.g., Acrobatics +3). It is closely related to the Stat module but strips out the raw stat value and layout-swap — only a modifier and proficiency dot remain. The module can optionally live-sync proficiency state from a linked Stats module, so toggling DEX proficient in the Stats module auto-propagates to DEX-linked abilities.

This plan captures the resolved design decisions and implementation steps for both the updated spec doc (`ABILITIES.md`) and the eventual `module-abilities.js` implementation.

---

## Resolved Design Decisions

| Question | Decision |
|---|---|
| Proficiency bonus | Baked into `modifier`. Dot is visual-only. Roll = `1d20 + modifier`. |
| `linkedStat` | Live sync: reads proficiency from a linked Stats module. Overrides the ability's manual toggle. |
| Linked module selection | Settings panel (not wizard). User picks which Stat module to link to after creation. |
| Rollable | Every ability is always rollable in Play mode. No per-ability toggle needed. |
| Quick Edit | No Ctrl+Click. Modifier edits happen in Edit mode only. |
| Templates | D&D 5e, Pathfinder 2e, Call of Cthulhu, Vampire: The Masquerade, Shadowrun 6e only. |

---

## Spec Corrections Needed in `ABILITIES.md`

1. **Data structure is wrong** — `abilities` is shown at the module root alongside `id`/`type`/`title`. It must be nested inside `content`:

```json
{
  "id": "unique-module-id",
  "type": "abilities",
  "title": "Abilities",
  "theme": null,
  "content": {
    "linkedStatModuleId": null,
    "abilities": [
      {
        "id": "unique-ability-id",
        "name": "Acrobatics",
        "modifier": 3,
        "proficiency": false,
        "linkedStat": "DEX"
      }
    ]
  }
}
```

2. **`proficiency` field behavior** — when `linkedStatModuleId` is set, the `proficiency` field on each ability is ignored in favor of live sync. The field is still stored (it holds the manual value) but only used as fallback when no linked module exists.

3. **`linkedStat` is a stat name string** — must exactly match the `name` field of a stat in the linked Stat module (e.g., `"DEX"`, `"STR"`). Case-sensitive. If no matching stat is found, falls back to the ability's own `proficiency` boolean.

4. **Remove the "wizard configuration" language** — the "configure basics in a wizard" paragraph implies complex wizard options that aren't being built. The wizard only offers: template selection + theme picker (no proficiency-mode selector). Module settings handle link configuration post-creation.

5. **Add the settings panel spec** — describe the gear button → settings overlay → Stat module dropdown mechanic (mirror Conditions/Resistances pattern).

6. **Templates section** — add CoC, VtM, Shadowrun 6e ability lists with their `linkedStat` mappings. Remove Mothership, Cyberpunk RED, Daggerheart entries. Mark templates TODO where lists still need research.

---

## Template Ability Lists (to populate in `ABILITIES.md`)

### D&D 5e (with linkedStat mappings)
| Ability | linkedStat |
|---|---|
| Acrobatics | DEX |
| Animal Handling | WIS |
| Arcana | INT |
| Athletics | STR |
| Deception | CHA |
| History | INT |
| Insight | WIS |
| Intimidation | CHA |
| Investigation | INT |
| Medicine | WIS |
| Nature | INT |
| Perception | WIS |
| Performance | CHA |
| Persuasion | CHA |
| Religion | INT |
| Sleight of Hand | DEX |
| Stealth | DEX |
| Survival | WIS |

### Pathfinder 2e (no linkedStat — PF2e has no governing stat per skill)
All 17 abilities have `linkedStat: null`.

### Call of Cthulhu — needs research for full list + linkedStat mappings
### Vampire: The Masquerade — needs research for full list + linkedStat mappings
### Shadowrun 6e — needs research for full list + linkedStat mappings

---

## Implementation Steps

### 1. Update `_DOCS/SUBMODULES/ABILITIES.md`
- Fix data structure (nest under `content`)
- Add resolved behavior for `linkedStat` and sync rules
- Add settings panel spec
- Expand template lists (D&D 5e with linkedStat mappings, PF2e; mark others TODO)
- Remove incorrect wizard-config language

### 2. Create `scripts/module-abilities.js`
Base on `module-stat.js`. Key differences from Stats:
- No `layout` field, no **Swap Layout** button
- No `value` field — only `modifier`
- No per-ability rollable flag (always rollable)
- No Ctrl+Click quick edit
- `proficiency` dot auto-synced from linked Stat module when `linkedStatModuleId` is set
- Settings panel for linked module selection
- `ABILITY_TEMPLATES` constant (mirrors `STAT_TEMPLATES` pattern)

Key functions to implement:
- `renderAbilityBlock(ability, index, data, isPlayMode)` — play mode display
- `renderAbilityBlockEdit(ability, index, data)` — edit mode row
- `reRenderAbilityEdits()` — rebuild edit blocks
- `initAbilitySortable()` — SortableJS drag-to-reorder
- `rollAbilityCheck(ability)` — calls `TS.dice.putDiceInTray`
- `getProficiencyState(ability, data)` — returns effective proficiency (sync or manual)
- `openAbilitySettings(moduleEl, data)` — settings overlay for linked Stat module
- `applyAbilityTemplate(templateKey)` — returns array of ability objects

Expose on `window`: `ABILITY_TEMPLATES`, `applyAbilityTemplate`

### 3. Update `main.html`
- Add wizard type card for "Abilities" (alphabetical: after "abilities" → check position relative to existing types)
- Add `<script src="scripts/module-abilities.js">` after `module-stat.js` in load order
- Add wizard template sub-options section (mirror stat template picker pattern)

### 4. Update `module-core.js`
- Add `wizardState.abilitiesTemplate` field
- Add creation defaults in `btnWizardCreate` handler:
  ```js
  content: { linkedStatModuleId: null, abilities: applyAbilityTemplate(wizardState.abilitiesTemplate) }
  ```
- Add `.module-ability-settings-btn` toolbar button (gear icon, Edit mode only)
- Add settings button event handler
- Hide settings button in Play mode (existing `onPlayMode` exclusion logic)
- Add overflow menu entry for settings

### 5. Add CSS to `main.css`
New section: `/* ── Abilities ── */`
- `.abilities-container` — flex column, gap between rows
- `.ability-row` — flex row, align-center: proficiency dot | name | modifier badge
- `.ability-proficiency-dot` — small circle, colored when active
- `.ability-modifier` — badge showing "+3" / "-2"
- `.ability-edit-row` — edit mode: drag handle | name input | modifier input | proficiency checkbox | delete btn
- `.ability-rollable` — pointer cursor in Play mode
- Responsive rules for xs/sm module sizes

### 6. Add translations to `translations.js`
Keys needed (all 7 languages: en, es, fr, de, it, pt-BR, ru):
- `type.abilities` — "Abilities"
- `abilities.addAbility` — "Add Ability"
- `abilities.noAbilities` — "No abilities added"
- `abilities.rollCheck` — "Roll {name} check" (for tooltip)
- `abilities.linkedStatModule` — "Linked Stat Module"
- `abilities.noLinkedModule` — "None (manual)"
- `abilities.settingsTitle` — "Ability Settings"
- `abilities.proficiency` — "Proficient"

### 7. Update `_DOCS/ARCHITECTURE.md`
- Files at a Glance: add `module-abilities.js`
- Script Load Order: add after `module-stat.js`
- Key Functions: add `rollAbilityCheck`, `getProficiencyState`, `openAbilitySettings`
- Registered module types list: add `abilities`
- Data Structures section: add abilities content shape

---

## Sync Logic (Critical Detail)

```js
function getProficiencyState(ability, data) {
    if (!data.content.linkedStatModuleId || !ability.linkedStat) {
        return ability.proficiency;
    }
    const linkedModule = window.modules.find(m => m.id === data.content.linkedStatModuleId);
    if (!linkedModule) return ability.proficiency; // graceful fallback
    const stat = linkedModule.content?.stats?.find(s => s.name === ability.linkedStat);
    return stat ? stat.proficient : ability.proficiency; // fallback if stat not found
}
```

This runs at render time. No observers needed — re-render on mode switch catches any stat changes.

---

## Files to Modify

| File | Change |
|---|---|
| `_DOCS/SUBMODULES/ABILITIES.md` | Fix spec per decisions above |
| `scripts/module-abilities.js` | **Create new** |
| `main.html` | Wizard card, script tag, wizard sub-options |
| `scripts/module-core.js` | Wizard state, creation defaults, toolbar button, mode-switch exclusions |
| `main.css` | Abilities CSS section |
| `scripts/translations.js` | All 7 languages, abilities keys |
| `_DOCS/ARCHITECTURE.md` | Files, script order, functions, types |

---

## Verification

1. Create an Abilities module via wizard → template selector appears → selecting D&D 5e populates 18 abilities
2. In Edit mode: add/remove/reorder abilities, edit name and modifier, toggle proficiency
3. In Play mode: clicking an ability sends the correct `1d20+modifier` roll to TaleSpire
4. Link an Abilities module to a Stats module via settings → toggling DEX proficient in Stats module → Acrobatics/Stealth/Sleight of Hand dots auto-update on next render
5. Delete the linked Stat module → Abilities falls back to manual proficiency gracefully
6. Verify translations render correctly in at least one non-English locale
