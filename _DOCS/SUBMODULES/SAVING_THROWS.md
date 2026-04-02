# Saving Throws Module

## Saving Throws Summary
The Saving Throws module tracks character saving throws, which are reactive checks against harmful effects. Each saving throw has a name (e.g., "Strength") and a value (e.g., +3). The module supports adding, editing, and deleting saving throws, as well as reordering them via drag-and-drop. Saving throws are displayed similarly to stats but are conceptually distinct as reactive checks rather than proactive attributes.

## UI/UX
This module will look similar to the Stats module in that each one is a "saving throw block". Each block displays the saving throw's name, proficiency tier (if applicable), and modifier value. The modifier value is clickable to roll the saving throw in the dice tray (e.g., "1d20+3").

Below the list of saving throws, there is a small text box for adding a custom note or description that applies to all saving throws (e.g., "+1 to all saving throws while raging"). This note supports markdown formatting and is optional.

## Data Structure
Each saving throw is represented as an object with the following properties:

```json
{
  "id": "unique-saving-throw-id",
  "name": "Strength",
  "value": 3,
  "proficiencyTier": "Trained", // Optional, if tiered proficiency is enabled
  "icon": "shield", // Optional icon name from the SVG library
}
```

## Game System Integration
The user can select from a list of preconfigured saving throw templates based on their game system (e.g., D&D 5e, Pathfinder). Each template includes a set of standard saving throws with appropriate names and default values. Users can customize these saving throws after selection.

Alternatively, the user can start from scratch and create custom saving throws. They can choose to enable or hide tiered proficiency. If expertise tiers are enabled, the user can select their training tiers preset (e.g., "Untrained", "Trained", "Expert", "Master") or define their own tiers via secondary modal that appears over top to define and reorder the list of tiers from highest (top) to lowest (bottom).

**Custom-Tiered saving throws** allow users to define their training tiers (e.g., "Untrained", "Trained", "Expert", "Master") in addition to a numerical modifier value. This provides flexibility for systems that use training tiers or ranks in their saving throw mechanics. All proficiency tiers are represented by a single-letter badge on the saving throw's block (e.g., "T" for Trained, "E" for Expert). The badge's color corresponds to the tier level (e.g., gray for Untrained, green for Trained, blue for Expert, purple for Master). Users can customize the tier names and colors in the module settings.

## Play Mode
- The user can:
    - Click a saving throw's modifier value to roll it in the dice tray (e.g., "1d20+3").

## Edit Mode
- The user can:
    - Add a new saving throw (via template selection or custom creation).
    - Edit an existing saving throw's name, value, and icon.
    - Delete a saving throw.
    - Reorder saving throws via drag-and-drop.
    - Change proficiency toggle or tier (if applicable).

## Module Toolbar
    - Add Saving Throw button: Opens the "Add Saving Throw" modal for template selection or custom creation.
    - Module Settings button: Opens the module settings modal where users can configure module-wide options (e.g., display settings, default templates).
    - Change Theme button: Opens the theme selection modal to customize the module's appearance.
    - Delete Module button: Deletes the entire Saving Throws module from the character sheet.