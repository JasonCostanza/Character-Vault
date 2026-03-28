# Resistances Submodule

## Summary

The Resistances submodule is used to store the resistances of a character. Resistances are most frequently associated to the primary elements, but can also be associated to other types of damage or effects. Some systems include a value next to the resistance, such as "Resistance 5" or "Resistance 10". While other resistances are complete immunity to the element.

# Module UX
By default, the module UI will be split into 3 main columns: Immunities, Resistances, and Weaknesses. The module will be empty at first until the user selects or creates the necessary resistances for their character in the Module Settings menu. 

In the Module Settings menu, there is a **Staging Area** displayed below the columns. This staging area contains all pre-defined elements (e.g., Acid, Bludgeoning, Fire) as well as any user-created custom resistances.
- The user can drag any resistance from the Staging Area into one of the 3 columns to assign it to their character.
- When a resistance is dropped into a column, a prompt asks the user for its value. If dropped into the Immunity column, the value is automatically set to "Immune". If dropped into a Resistance or Weakness column, the user can enter any text or number (e.g., "5", "x2", or "1d8").

The active resistances will be displayed in their respective columns with their icon, name, and value.

- Active resistances are always shown in alphabetical order within their column.
- Resistances always default to toggled `On` when created or added to a column.

While in `Edit` mode, the user can:
- Open the Module Settings Menu to access the Staging Area
- Drag resistances from the Staging Area into a column to add them
- Edit an existing resistance's value
- Move resistances between columns (Immunities, Resistances, Weaknesses)
    - When a resistance is moved to a different column, prompt the user for the new value. If the resistance is moved to the Immunity column, the value will be set to "Immune". If the resistance is moved to a resistance or weakness column, the user can enter any text or number.
- Delete an existing resistance from a column (removing it from the character; custom ones remain available in the Staging Area)

While in `Play` mode, the user can:
- Hover over a resistance to see its name and value (If immune, it will show "Immune" instead of a value)
- Click on a resistance to toggle it as active (icon & text illuminates or darkens, this persists through sessions and should be recorded in save/load data)

## Resistance Creation Wizard

The Resistance Creation Wizard is a modal that is used to create a new custom resistance element. It is opened by clicking a "Create Custom" button located in the Staging Area of the Module Settings menu.

### Wizard Steps
The Resistance Creation Wizard is not paged. It is a single modal with all the fields required to create a custom resistance element. The UI will vertically scroll if necessary.

1. Select the `Resistance Icon` (uses the standard module icon grid).
2. Enter the `Resistance Name`.
3. Confirm the resistance.

Once confirmed, the custom resistance is added to the Staging Area alongside the pre-defined elements, making it available to be dragged into any column.

The user can cancel the wizard by selecting "Cancel" or "Close" on the wizard modal. This will close the wizard and return the user to the `Module Settings` menu.

# Pre-defined Resistances
The pre-defined resistances prepopulate the Staging Area in the Module Settings menu. From there, the user can drag them into their active columns (Immunities, Resistances, Weaknesses).

| Name | Icon |
| --- | --- |
| Acid | 🧪 |
| Bludgeoning | 🔨 |
| Cold | ❄️ |
| Fire | 🔥 |
| Force | 💥 |
| Lightning | ⚡ |
| Necrotic | 💀 |
| Piercing | 🗡️ |
| Poison | ☠️ |
| Psychic | 🧠 |
| Radiant | ☀️ |
| Slashing | ⚔️ |
| Thunder | 🔊 |