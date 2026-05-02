# Companions

## Companions Module Summary
This module allows users to manage their companions. Companions are typically non-player characters (NPCs) that accompany the player character in the game like a loyal dog, a helpful fairy, a robotic AI, or an imaginary deity they can communicate with. The module is intended to be lightweight and not replace the functionality of the main character management system. The main systems of the Companions module include:
- Adding and removing companions
- Managing companion attributes and stats
    - Name
    - HP
    - AC
    - Run Speed
    - Fly Speed

# UI/UX Design
The UI/UX design for the Companions module should be intuitive and user-friendly, allowing players to easily add, remove, and manage their companions. The interface should provide a clear overview of each companion's attributes and stats, with the ability to quickly view and modify these values.

The data of the companions is displayed in a table format, allowing players to quickly scan and compare the attributes of each companion. This allows the user to sort the table by any of the available attributes. Example, this druid has two companions named Rosa and Shroomy:

| Name | HP | AC | Run Speed | Fly Speed
| -------- | -------- | -------- | -------- | -------- | -------- |
| Rosa | 44 | 15 | 15 | 30 |
| Shroomy | 32 | 25 | 40 | 0 |

**Note: we have some similar functionality in the List module. That may serve as a model/reference for the Companions module.**

These entries in the table are text input fields that allow the player to edit the value directly. These text fields should not have any background or border to them to reduce visual clutter. The text itself should stand on its own to be visually clear. Values should be editable and should support simple arithmetic operations e.g. "5", "+6", or "5+7". Clicking off the field or pressing enter should save the changes, meanwhile pressing escape should cancel & discard the changes.

## Expandable Companion Drawer
Each companion row has a chevron toggle on the left side. Clicking the chevron expands a drawer below the row containing:
- **Notes** — freeform text field for attacks, abilities, flavor text. Dice notation (e.g., `"1d20+5"`, `"2d8+3"`) is auto-interactive via TaleSpire's diceFinder API and rolls directly into the dice tray when clicked.
- **Conditions** — applied condition tags/badges with toggle and value controls, sourced from the shared `CONDITION_TEMPLATES` definitions.

Drawers are **closed by default** on first load. The expanded/collapsed state (`expanded: boolean`) persists per companion across sessions.

## Adding and Removing Companions
**Adding:** Triggered from the Settings modal. Only a name is required — all attributes receive their default values. The companion appears in the table immediately and the player can fill in details inline.

**Removing:** Uses `showConfirm()` per the project convention for destructive actions. Displays the companion's name in the confirmation prompt. Add/remove events are not logged to the Activity Log.

## Layout Mode
Layout mode is focused on broad-stroke changes to the module, such as resizing, moving, and removing the module itself. In this mode, it is not expected a player will have full interaction available with individual companions.

The following functions should be available in Layout mode:
- Resize / Move / Remove the module
- Module theme
- Rename the module
- Drag attributes to reorder them in the table

## Play Mode
In Play mode, the module is focused on real-time play. The module should be locked in position and size and focus interactions on speeding up play, tracking of data, and keeping the player focused and engaged on what's important. The Companions module should allow players to interact with their companions with simple modifications. Each entry in the table is a text input field that allows the player to edit the value directly. These fields should support simple arithmetic operations like addition and subtraction.

Play mode functions include:
- Managing Companion HP
- Managing Companion AC
- Managing Companion Speed
- Track if a Companion is active or inactive
- Drag attributes to reorder them in the table

## Settings Modal
The Settings modal should allow users to configure the behavior and visible attributes of the Companions module. Users should be able to adjust settings such as:
- Add/Remove Companions
- Change Companion Names
- Add Custom Attributes
- Rearrange Attributes in the table

# Data Shape

```
module.content = {
  companions: [
    {
      id: string,
      name: string,
      notes: string,
      active: boolean,
      expanded: boolean,
      order: number,
      values: { [attrId]: <type-dependent value> },
      conditions: [
        { typeKey: string, value: number }
      ]
    }
  ],
  attributes: [
    {
      id: string,
      name: string,
      type: 'toggle' | 'number' | 'number-pair' | 'text' | 'dropdown',
      icon: string | null,
      defaultValue: <type-dependent>,
      pinned: boolean,
      builtIn: boolean
    }
  ],
  sortBy: string,
  sortDir: 'asc' | 'desc'
}
```

**Built-in attributes** (pre-seeded, `builtIn: true`):

Templates control which attributes are pre-seeded. The table layout stays consistent — four columns regardless of game system.

| Template | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| D&D 5e | HP (`number-pair`) | AC (`number`) | Run Speed (`number`) | Fly Speed (`number`) |
| Pathfinder 2e | HP (`number-pair`) | AC (`number`) | Run Speed (`number`) | Fly Speed (`number`) |
| Daggerheart | Damage (`text`) | Range (`text`) | Evasion (`number`) | Stress (`number-pair`) |

Users can add, remove, and rename attributes via the Settings modal regardless of template. Templates provide starting defaults, not constraints.

When a new attribute is added to the module, all existing companions receive that attribute with its default value. When a new companion is added, it inherits all current attributes with their defaults.

## Companion Conditions

Companion condition tracking shares the same `CONDITION_TEMPLATES` definitions used by the Conditions module. This requires extracting `CONDITION_TEMPLATES` to a shared location so both modules reference the same pool of condition names, icons, descriptions, and cascade relationships.

**What companions share with the Conditions module:**
- Condition definitions (names, icons, descriptions, value ranges)
- Cascade/subcondition behavior (activating a parent activates its children)
- Toggle and value interaction (click to toggle, click value to increment, right-click to decrement)

**What stays exclusive to the Conditions module:**
- Staging area (available-but-not-applied condition pool)
- Custom condition builder
- Full dedicated layout and sort/filter controls

Each companion stores its own applied conditions as a lightweight array: `[{ typeKey, value }]`. The template determines which game system's condition definitions are available in the picker.

# Activity Log Module Integration
The Companions module integrates with the Activity Log module to track HP changes and active/inactive state. Guard-wrap calls to `logActivity()` per the standard pattern.

**Event types:**

| Event Type (i18n key) | Message Pattern | Trigger |
|---|---|---|
| `companion.event.damage` | `"{name} took {amount} damage ({old} → {new})"` | HP decreased |
| `companion.event.heal` | `"{name} is healed {amount} HP ({old} → {new})"` | HP increased |
| `companion.event.summon` | `"{name} is summoned"` | Active toggled ON |
| `companion.event.dismiss` | `"{name} is dismissed"` | Active toggled OFF |

Add/remove companion events are not logged. AC, speed, and custom attribute changes are not logged in v1.

# Game System Specific Details

## Supported vs. Unsupported Systems

### Systems WITH Companion Mechanics

**D&D 5e** (Partial)
- Animal Companions via Beast Master Ranger archetype
- Familiars via Find Familiar spell
- No level mechanic for companions
- Basic attributes: Name, HP, AC, Speed
- No proficiency tier system needed

**Pathfinder 2e** (Full)
- Animal Companions with full minion mechanics
- Familiars with minion trait
- Companion level auto-syncs to player level
- Proficiency tiers (trained/expert/master/legendary)
- For detailed PF2e companion tracking: create a companion-specific Stats module alongside Companions module to leverage proficiency tier UI without duplicating it in Companions

**Daggerheart** (Partial)
- Ranger Companions (Beastbound subclass only)
- Companion gains an Experience whenever the player does
- Attributes: Name, Damage (d6 base), Range (Melee base), Evasion (10 base), Stress slots

### Systems WITHOUT Companion Mechanics

- **Call of Cthulhu**: No companions; emphasizes NPC management and sanity tracking
- **Vampire: The Masquerade**: No companions; uses thralls/ghouls as separate mechanics
- **Cyberpunk Red**: No player companions; has drones (Rigger minions) and vehicles, not companions
- **Mothership**: No companions; all characters are crew members
- **Shadowrun 6**: No player companions; has drones (Rigger minions) and spirits, not companions

## Design Decisions

### Level Column Removed
Companion level always syncs to player level (PF2e, Daggerheart) or doesn't exist (D&D 5e). The Level module is the source of truth; no need to duplicate. Cross-module functions can call `window.getCharacterLevel()` when needed.

### Proficiency Tiers via Stats Module
For PF2e companions requiring ability scores, proficiency tiers, or skill modifiers, users create a companion-specific Stats module alongside Companions. This reuses existing proficiency tier UI rather than reimplementing it.

### Naming Convention for Companion Stats
`window.getStatValue()` searches all stat modules and returns the first match (order-dependent). To avoid collisions between player stats and companion stats:
- Prefix companion stat names: `"Companion Strength"`, `"Rosa: DEX"`, `"Pet Intelligence"`, etc.
- This ensures Weapons module and other stat-dependent features target the correct stat

### Custom Attributes & Arithmetic
Reuse List module's attribute system rather than inventing a new one. Supported types: `toggle`, `number`, `number-pair`, `text`, `dropdown`. Built-in columns (HP, AC, Run Speed, Fly Speed) are pre-seeded with `builtIn: true`. Users add custom attributes via the Settings modal.

Arithmetic expressions (`+6`, `5+7`) are supported for `number` and `number-pair` types only. Text, toggle, and dropdown remain as-is.

### Activity Log Scope
Log HP changes only (damage/healing) — the only attribute that changes frequently during play. AC, speed, and custom attribute changes are not logged in v1. A per-attribute "log changes" toggle in Settings could be added later if demand warrants it.

### Active/Inactive Tracking
Each companion has a built-in `active` toggle (like List's toggle type). Active companions render normally; inactive companions get a muted/dimmed visual treatment but remain visible. Hiding inactive companions would risk users forgetting they exist.

Toggling active/inactive fires Activity Log events ("summoned" / "dismissed").

### Game System Discoverability
No special wizard surfacing. Game-system-specific differences are handled via templates (pre-seeded attribute sets for D&D 5e, PF2e, Daggerheart). Users who want companions add the module; templates provide system-appropriate defaults.

### Cross-Module Level Sync
Manual re-entry, no reactive coupling. The architecture is pull-based (no event bus); adding a reactive listener would swim against every existing pattern. More importantly, level-up consequences for companions always require player decisions — stat choices, maturity thresholds, ability unlocks — that can't be automated without reimplementing game rules (which violates CV's philosophy as a tracking tool, not a rules engine).

`window.getCharacterLevel()` is available if a display-only level reference is ever needed. The Activity Log already surfaces level-up events as a natural reminder to update companion stats.

### Shared Condition Definitions
`CONDITION_TEMPLATES` must be extracted from the Conditions module to a shared location so both the Conditions module and the Companions module reference the same definitions. This is a prerequisite for implementing companion conditions. The Conditions module's behavior does not change — only the data source moves.

### Companion Complexity & Other Modules
The Companions module is intentionally lightweight. For companion attacks, abilities, and spells, the approach is tiered:

- **Notes field (expandable drawer)** — each companion has a `notes` text field in its expandable drawer for quick-reference info (attacks, abilities, flavor text). Dice notation in notes is auto-interactive via TaleSpire's diceFinder API — e.g., `"Bite: 1d20+5, 1d8+3 piercing"` becomes clickable and rolls directly into the dice tray. This covers the majority of companions.
- **Companion-specific modules** — for users who need full structure (labeled rolls, damage types, enhancement stacking, proficiency tiers), create companion-specific List, Weapons, Stats, or Spells modules alongside Companions. Use the naming convention documented above to avoid stat collisions.

### Expandable Row Pattern
The chevron-driven expandable drawer is new to Character Vault. This pattern may be applicable to other modules (List, Counters) in the future but is introduced here first. The drawer contains per-companion detail (notes, conditions) that doesn't fit in table columns.

---
