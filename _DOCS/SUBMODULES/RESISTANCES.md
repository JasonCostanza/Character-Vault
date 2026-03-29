# Resistances Submodule

## Summary

The Resistances submodule is used to store the resistances of a character. Resistances are most frequently associated to the primary elements, but can also be associated to other types of damage or effects. Some systems include a value next to the resistance, such as "Resistance 5" or "Resistance 10". While other resistances are complete immunity to the element.

# Module UX
By default, the module UI will be split into 3 main columns: Immunities, Resistances, and Weaknesses. The module will be empty at first until the user selects or creates the necessary resistances for their character in the Module Settings menu.

In the Module Settings menu, there is a **Staging Area** displayed below the columns. This staging area contains all pre-defined elements (e.g., Acid, Bludgeoning, Fire) as well as any user-created custom resistances.
- The user can drag any resistance from the Staging Area into one of the 3 columns to assign it to their character.
- When a resistance is dropped into a column, a prompt asks the user for its value. If dropped into the Immunity column, the value is automatically set to "Immune". If dropped into a Resistance or Weakness column, the user can enter any text or number (e.g., "5", "x2", or "1d8").

The assigned resistances will be displayed in their respective columns with their icon, name, and value.

- Assigned resistances are always shown in alphabetical order within their column.
- Resistances have an `active` state (defaults to `true` when created). The active state is stored in the module data and persists across sessions.
- ⚠️ **Note:** Toggle functionality for the `active` state is not yet implemented in the UI.

While in `Edit` mode, the user can:
- Open the Module Settings Menu to access the Staging Area (gear/settings button)
- Drag resistances from the Staging Area into a column to add them
- Edit an existing resistance's value (click the value in Edit mode)
- Move resistances between columns (Immunities, Resistances, Weaknesses)
    - When a resistance is moved to a different column, prompt the user for the new value. If the resistance is moved to the Immunity column, the value will be set to "Immune". If the resistance is moved to a resistance or weakness column, the user can enter any text or number.
- Delete an existing resistance from a column (removing it from the character; custom ones remain available in the Staging Area)

While in `Play` mode, the user can:
- Hover over a resistance to see its name and value (If immune, it will show "Immune" instead of a value)
- ⚠️ **Note:** Toggle click functionality is not yet implemented. When implemented, clicking a resistance will toggle it as active (icon & text illuminates or darkens, based on the `active` state)

## Data Structure

The Resistances module stores data in a hierarchical structure:

```js
{
  layout: 'columns',              // 'columns' or 'rows' (affects display layout; toggle not yet implemented)
  immunities: [],                 // Array of assigned immunity objects
  resistances: [],                // Array of assigned resistance objects
  weaknesses: [],                 // Array of assigned weakness objects
  customTypes: []                 // Array of custom resistance type definitions
}

// Assigned resistance object:
{
  id: 'res_...unique id...',      // Auto-generated unique ID
  typeKey: 'fire',                // Key referencing a pre-defined or custom type
  value: '5',                     // User-provided value (or 'Immune' for immunities)
  active: true                    // Toggle state (not yet implemented in UI)
}

// Custom type definition:
{
  key: 'custom_...unique key...',  // Auto-generated unique key
  name: 'Psychic Force',           // User-provided name
  icon: 'force'                    // Icon key from the RESISTANCE_ICON_SVG set
}
```

## Layout Modes

The module supports two layout modes controlled by the `layout` property:
- **`columns`** (default): Displays the 3 categories side-by-side
- **`rows`**: Displays the 3 categories stacked vertically

⚠️ **Note:** The layout mode can only be changed programmatically; there is no UI toggle yet.

## Resistance Creation Wizard

The Resistance Creation Wizard is a modal that is used to create a new custom resistance element. It is opened by clicking a "Create Custom" button located in the Staging Area of the Module Settings menu.

### Wizard Steps
The Resistance Creation Wizard is not paged. It is a single modal with all the fields required to create a custom resistance element. The UI will vertically scroll if necessary.

1. Select the `Resistance Icon` from the icon grid (reuses the same SVG icon set as pre-defined resistances).
2. Enter the `Resistance Name` (text input).
3. Confirm the resistance (Create button is disabled until a name is entered).

Once confirmed, the custom resistance is added to the `customTypes` array in the module data and appears in the Staging Area alongside the pre-defined elements, making it available to be dragged into any column.

The user can cancel the wizard by selecting "Cancel" or "Close" on the wizard modal. This will close the wizard and return the user to the `Module Settings` menu.

# Pre-defined Resistances

The pre-defined resistances prepopulate the Staging Area in the Module Settings menu. From there, the user can drag them into their respective columns (Immunities, Resistances, Weaknesses). All icons are inline SVGs (not emoji) and are stored in the module code.

Each pre-defined type maps to a key that is used in the module data structure and can be referenced when creating custom types.

| Name (i18n key) | Type Key | Used in Custom Icons |
| --- | --- | --- |
| `res.typeAcid` | `acid` | Yes |
| `res.typeBludgeoning` | `bludgeoning` | Yes |
| `res.typeCold` | `cold` | Yes |
| `res.typeFire` | `fire` | Yes |
| `res.typeForce` | `force` | Yes |
| `res.typeLightning` | `lightning` | Yes |
| `res.typeNecrotic` | `necrotic` | Yes |
| `res.typePiercing` | `piercing` | Yes |
| `res.typePoison` | `poison` | Yes |
| `res.typePsychic` | `psychic` | Yes |
| `res.typeRadiant` | `radiant` | Yes |
| `res.typeSlashing` | `slashing` | Yes |
| `res.typeThunder` | `thunder` | Yes |

## Icon System

The Resistance module uses an inline SVG icon set. When creating a custom resistance type, the user selects from this same icon grid. Custom types store the icon key (e.g., `'fire'`, `'cold'`) in their definition, allowing them to reuse any of the pre-defined icon designs.

## Implementation Notes & Pending Features

### Fully Implemented
- Multi-column layout (Immunities, Resistances, Weaknesses)
- Drag-and-drop assignment via SortableJS
- Drag-to-move between columns
- Alphabetical sorting within columns
- Value prompts (with auto-set "Immune" for immunity column)
- Custom resistance creation with icon selection and name input
- SVG icon system with 13 pre-defined types
- i18n support for all UI text and type names
- Data persistence through save/load system
- Edit mode with value editing and deletion
- Play mode with hover tooltips

### Pending / Not Yet Implemented
- **Toggle active/inactive in Play mode**: The `active` property is stored in data but click handlers are not yet implemented. When implemented, will support toggling via click with visual feedback (dimmed/brightened).
- **Layout toggle button**: The `layout` property ('columns' vs 'rows') exists in the data structure and CSS styles support both modes, but no UI control is exposed to switch between them.
- **Same-column reordering**: Currently, SortableJS is configured to prevent reordering within the same column (no `sort: true`). Manual reorder by drag within a column is disabled.