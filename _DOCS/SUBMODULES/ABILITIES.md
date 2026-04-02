# Abilities Module

## Summary

The Abilities module tracks a character's skill checks (e.g., Acrobatics +3). Each ability has a name, a modifier applied to a d20 roll, and an optional proficiency dot. The module supports linking to a Stat module so that proficiency state syncs automatically.

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
        "proficiency": false,
        "linkedStat": "DEX"
      }
    ]
  }
}
```

### Field Notes

- **`linkedStatModuleId`** — ID of a Stat module to sync proficiency from. When set, each ability's `proficiency` field is ignored in favor of live sync. Falls back to `ability.proficiency` if the linked module is deleted or the stat is not found.
- **`proficiency`** — Manual proficiency toggle. Used when no linked module is set, or as a fallback.
- **`linkedStat`** — Exact `name` match to a stat in the linked Stat module (case-sensitive). If no match is found, falls back to `ability.proficiency`.

## Proficiency Sync Logic

Proficiency state is resolved at render time via `getProficiencyState(ability, data)`:

```js
function getProficiencyState(ability, data) {
    if (!data.content.linkedStatModuleId || !ability.linkedStat) {
        return ability.proficiency;
    }
    const linkedModule = window.modules.find(m => m.id === data.content.linkedStatModuleId);
    if (!linkedModule) return ability.proficiency;
    const stat = linkedModule.content?.stats?.find(s => s.name === ability.linkedStat);
    return stat ? stat.proficient : ability.proficiency;
}
```

No observers needed — re-render on mode switch catches stat changes.

## Module Dimensions

Default shape: 1-column, auto-height (vertical list). Users can resize via the resize handle.

## Edit vs Play Mode

**Edit mode**: Add/remove/reorder abilities (SortableJS), edit name and modifier, toggle proficiency. Link to a Stat module via the gear settings button.

**Play mode**: Every ability is always rollable. Clicking an ability sends `1d20+modifier` to TaleSpire's dice tray. No Ctrl+Click quick edit.

## Settings Panel

The gear button (Edit mode only) opens a lightweight modal with a single dropdown: "Linked Stat Module". The dropdown lists all Stat modules on the sheet. Selecting one sets `linkedStatModuleId`. Selecting "None (manual)" clears the link.

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

## Toolbar Buttons (Edit Mode)

- `.module-abilities-settings-btn` — Gear icon → opens settings panel for linked Stat module
- `.module-abilities-add-btn` — Plus icon → appends a blank ability

## Custom Abilities

Users can create a blank module (no template) and add their own abilities. Each ability can be named freely, given any modifier, and have proficiency toggled manually.
