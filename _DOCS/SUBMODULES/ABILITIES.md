# Abilities Module

## Summary

The Abilities module tracks a character's skill checks (e.g., Acrobatics +3). Each ability has a name, a modifier applied to a d20 roll, and an optional proficiency dot. The module supports linking to a Stat module so that the stat's modifier contributes to roll calculations. Proficiency is always owned per-ability, regardless of any stat link.

In D&D 5e terms: Acrobatics [+3] → rolls `1d20+3`. In PF2e: same concept with different governing stats. In Call of Cthulhu and Mothership, modifiers represent percentile base values displayed as a flat number.

## Data Structure

```json
{
  "id": "unique-module-id",
  "type": "abilities",
  "title": "Abilities",
  "theme": null,
  "colSpan": 1,
  "rowSpan": null,
  "content": {
    "linkedStatModuleId": null,
    "abilities": [
      {
        "name": "Acrobatics",
        "modifier": 3,
        "proficiency": "none",
        "proficiencyRank": "untrained",
        "linkedStat": "DEX"
      }
    ]
  }
}
```

### Field Notes

- **`linkedStatModuleId`** — ID of a Stat module. When set, the stat module provides the base ability modifier. Proficiency is always owned by the ability itself.
- **`proficiency`** — Proficiency state: `'none'`, `'proficient'`, or `'expert'`. For D&D 5e/custom, `'expert'` doubles the proficiency bonus. Legacy boolean values are auto-migrated on load. Always the source of truth, regardless of stat link.
- **`proficiencyRank`** — PF2e proficiency rank (`untrained`/`trained`/`expert`/`master`/`legendary`). Always the source of truth.
- **`linkedStat`** — Exact `name` match to a stat in the linked Stat module (case-sensitive). Used only to pull the base modifier for rolls.

## Proficiency Sync Logic

Proficiency state is always read from `ability.proficiency` / `ability.proficiencyRank` directly. The stat link contributes only the base ability modifier.

## Module Dimensions

Default shape: 1-column, auto-height (vertical list). Users can resize via the resize handle.

### Interactions
- Every ability row is always rollable — clicking it sends `1d20+modifier` (or the system's equivalent, e.g. Duality dice for Daggerheart) to TaleSpire's dice tray.
- Ctrl+Click the row to open the shared edit popover and adjust `ability.modifier` directly (accepts relative math, e.g. `+2`). This is a bonus applied on top of any linked stat's modifier — proficiency is edited separately via the settings modal, not the popover.

### Settings Modal
`openAbilitySettings(moduleEl, data)` (exposed as `window.openAbilitySettings`) provides:
- **Manage Abilities** — per-ability row with drag handle, proficiency dot that cycles `none → proficient → expert` on click (or PF2e rank dropdown, depending on `window.gameSystem`), stat abbreviation (locked text when linked to a Stat module, editable input otherwise), inline name input, and delete button. All edits apply immediately (`scheduleSave()` + module body re-render). **Add Ability** button appends a new blank entry. Modifier is not edited here — it's Ctrl+Click-only in the module body, matching the Saving Throws pattern.
- **Linked Stat Module** — dropdown of all Stat modules on the sheet. Selecting one sets `linkedStatModuleId`; selecting "None (manual)" clears it. This section keeps its original buffered Save/Cancel/dirty-check behavior — it does not apply until Save is clicked (mirrors Saving Throws' tier-configuration fields, which use the same buffered pattern alongside their own immediate-apply manage list).
- Common module settings (title, color, size) via `buildCommonSettingsSection()`.

## Ability Templates

Templates are defined in `ABILITY_TEMPLATES` in `scripts/module-abilities.js`. The 7 supported systems:

### D&D 5e (18 skills, with linkedStat mappings)
Acrobatics → DEX, Animal Handling → WIS, Arcana → INT, Athletics → STR, Deception → CHA, History → INT, Insight → WIS, Intimidation → CHA, Investigation → INT, Medicine → WIS, Nature → INT, Perception → WIS, Performance → CHA, Persuasion → CHA, Religion → INT, Sleight of Hand → DEX, Stealth → DEX, Survival → WIS.

### Pathfinder 2e (17 skills, with linkedStat mappings)
Acrobatics → DEX, Arcana → INT, Athletics → STR, Crafting → INT, Deception → CHA, Diplomacy → CHA, Intimidation → CHA, Lore → INT, Medicine → WIS, Nature → WIS, Occultism → INT, Performance → CHA, Religion → WIS, Society → INT, Stealth → DEX, Survival → WIS, Thievery → DEX.

### Call of Cthulhu (32 skills, linkedStat mappings to CoC attributes)
Core investigator skills linked to STR, DEX, INT, APP, POW, EDU.

### Vampire: The Masquerade 5e (27 skills, linkedStat mappings to VtM attributes)
Physical, Social, and Mental skills linked to Strength, Dexterity, Stamina, Charisma, Manipulation, Wits, Intelligence.

### Cyberpunk RED (55 skills, linkedStat mappings to CPRED attributes)
Skills organized by INT, REF, DEX, TECH, COOL, WILL, EMP attributes.

### Mothership (25 skills, linkedStat mappings to Mothership stats)
Skills linked to Combat, Intellect, and Speed stats.

### Shadowrun 6e (18 skills, linkedStat mappings where applicable)
Skills linked to Agility, Logic, Charisma, Intuition, Reaction. Magic/Matrix skills have `linkedStat: null`.

## Overflow Menu

The module's `overflowMenuItems()` returns **Settings** and **Add Ability** entries that call `openAbilitySettings()` and append a blank ability directly.

## Custom Abilities

Users can create a blank module (no template) and add their own abilities. Each ability can be named freely, given any modifier, and have proficiency toggled manually.
