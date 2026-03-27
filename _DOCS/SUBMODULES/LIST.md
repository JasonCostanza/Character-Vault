# List Module

## Summary
Lists are flexible, sortable, and reorderable collections of items. In their most basic form, each item is just a name. By adding attributes, the user can extend lists into powerful tools for organizing inventory, equipment, consumables, or anything else a character might track. Lists do not have a fixed type — their function is defined entirely by the attributes the user assigns or creates.

## Data Structure

Each list module stores its content as:
```js
data.content = {
    attributes: [
        {
            id: 'attr_xxx',        // unique ID (generated on creation)
            name: 'Weight',        // display name
            type: 'number',        // 'toggle' | 'number' | 'number-pair' | 'text'
            icon: 'scale',         // icon key from icon library, or null
            defaultValue: 0,       // type-dependent default for new items
            pinned: true,          // shown inline on item rows in play mode
            builtIn: true          // true for preset attributes, false for custom
        },
        ...
    ],
    items: [
        {
            id: 'item_xxx',        // unique ID (generated on creation)
            name: 'Torch',         // item display name
            notes: '',             // built-in description/notes field
            order: 0,              // manual sort order
            values: {
                'attr_xxx': 5      // keyed by attribute ID, shape depends on type
            }
        },
        ...
    ],
    sortBy: null,                  // attribute ID, 'name', or null (manual order)
    sortDir: 'asc'                 // 'asc' | 'desc'
}
```

### Attribute Value Shapes by Type
| Type | Value Shape | Example |
|---|---|---|
| `toggle` | `boolean` | `true` (equipped) |
| `number` | `number` | `5` (weight) |
| `number-pair` | `{ current: number, max: number }` | `{ current: 8, max: 10 }` (durability) |
| `text` | `string` | `"Magical"` |

### Built-in Attribute Presets
These are selectable when adding attributes to a list. They come pre-configured with a type, icon, and default value:

| Name | Type | Default Icon | Default Value |
|---|---|---|---|
| Weight | `number` | Balance Scale | `0` |
| Durability | `number-pair` | Armour | `{ current: 0, max: 0 }` |
| Equipped | `toggle` | Helmet | `false` |
| Active | `toggle` | Power Button | `false` |
| Broken | `toggle` | Sword | `false` |
| Consumable | `toggle` | Apple | `false` |

## Module Type Registration
Registered via `registerModuleType('list', { ... })` in `scripts/module-list.js`. The registration provides:

| Hook | Behavior |
|---|---|
| `label` | `'type.list'` — i18n key, resolves to "List" in English |
| `renderBody(bodyEl, data, isPlayMode)` | Builds the item table with pinned attribute columns; wires up sort headers, expand buttons, and drag handlers |
| `onPlayMode(moduleEl)` | Switches to read-only rows; enables sort-by-column-header |
| `onEditMode(moduleEl)` | Switches to editable rows; enables drag-to-reorder and cross-list transfer; shows add/delete controls |
| `syncState(moduleEl, data)` | Reads all inline inputs back into `data.content` before save |

## Grid Sizing
- Minimum **2 columns** wide (lists need horizontal space for attribute columns)
- User-configurable height via `rowSpan`
- Content scrolls internally when it overflows the fixed height
- `colSpan` range: 2–4

## Play Mode
- **Item rows** display: item name, pinned attribute values (as icons/badges/text), and an expand button on the far right.
- **Sort by column** — clicking a column header (name or any attribute) sorts ascending; clicking again toggles descending; clicking a third time returns to manual order. Current sort state is persisted in `sortBy` / `sortDir`.
- **Item inspect overlay** — clicking the expand button opens the inspect overlay (see "Item Inspect Overlay" below).

## Edit Mode
- **Inline item editing** — item names are editable directly in the row.
- **Add Item** — toolbar button appends a new item with an empty name, empty notes, and default values for all attributes.
- **Delete Item** — each row has a delete button. No confirmation needed for individual item deletion.
- **Drag-to-reorder** — items can be reordered via drag handles. After reorder, `order` values are updated and `scheduleSave()` is called.
- **Cross-list drag transfer** — items can be dragged from one list module and dropped onto another list module on the grid using the drag handle (see "Cross-List Item Transfer" below). Other list modules are highlighted as drop targets during the drag.
- **Manage Attributes** — toolbar button opens the attribute management panel where the user can add/remove/reorder attributes and launch the Attribute Wizard.

## Module Toolbar

| Button | Mode | Description |
|---|---|---|
| **Drag handle** | Edit | Standard module drag handle for grid repositioning |
| **Title** | Both | Label in play mode, editable input in edit mode |
| **Add Item** | Edit | Appends a new blank item to the list |
| **Manage Attributes** | Edit | Opens the attribute management panel / Attribute Wizard |
| **Change Theme** | Edit | Standard theme picker |
| **Delete** | Edit | Standard module delete button |

# Attributes

## Attributes Summary
Attributes are properties shared by all items in a list. If the list is an inventory, items might share a Weight attribute. Equipment might track Equipped/Unequipped state. Attributes can be selected from the built-in presets or created with the Attribute Wizard.

## Adding Attributes
By default, a new list module has no attributes — items are name-only. The user adds attributes via the **Manage Attributes** panel (accessible from the toolbar in edit mode). When an attribute is added, every existing item gains that attribute with the configured default value.

## Removing Attributes
When an attribute is removed from a list, that attribute's values are deleted from all items. This action should prompt for confirmation since it is destructive and irreversible.

## Attribute Pinning
Each attribute has a `pinned` flag. Pinned attributes are displayed inline on item rows in play mode, giving the user control over which 2–3 key values are visible at a glance. Pinning is toggled in the **Manage Attributes** panel.

## Attribute Wizard
The Attribute Wizard allows the user to create a custom attribute. The user configures:

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | Display name for the attribute |
| **Type** | Yes | One of: `toggle`, `number`, `number-pair`, `text` |
| **Icon** | No | Selected from the icon library (see below). Defaults to `null`. |
| **Default Value** | No | The starting value for new items. Type-dependent — toggle: `false`, number: `0`, number-pair: `{ current: 0, max: 0 }`, text: `''` |

## Attribute Icon Library
Icons are inline SVGs using basic shapes per project conventions. Users select from this fixed set — they cannot provide their own.

- Balance Scale
- Power Button
- Apple
- Bread
- Bottle of Water
- Magnifying Glass
- Torch
- Flashlight
- Armour
- Helmet
- Boots
- Gloves
- T-Shirt
- Pants
- Shoes
- Gun
- Sword
- Dagger
- Wand
- Staff

# Item Inspect Overlay
Every item has an expand button on the far right of its row. Clicking it opens a centered overlay (z-index consistent with settings/wizard overlays: `200`) that displays:

- **Item name** — editable text input
- **Notes** — built-in free-text description field, always present on every item
- **All attributes** — listed with their current values, all editable

At the bottom of the overlay:
- **[Save]** button — commits changes and closes
- **[Close]** button — discards changes and closes

Top-right corner:
- **[X]** button — same behavior as [Close] (discard and close)

**IMPORTANT**: If the user has unsaved changes, both close actions (Close button and X button) must prompt the user to confirm before discarding.

# Cross-List Item Transfer
Items can be moved between list modules by dragging an item from one list and dropping it onto another list module on the grid.

**Transfer behavior:**
- The item is removed from the source list and added to the target list.
- All attribute values travel with the item.
- If the item has attributes that do not exist in the target list, those attributes are **automatically added** to the target list to accommodate the item. Existing items in the target list receive the attribute's default value.
- If the target list has attributes the item lacks, the item receives those attributes' default values.

**Example:** A list called "Backpack" has a Knife item with an "Equipped" attribute set to `true`. The target list "Belt" does not have the "Equipped" attribute. When the Knife is dragged to Belt, the Belt list gains the "Equipped" attribute. The Knife keeps its `true` value; all other Belt items get the default `false`.

# Gotchas
- Every list is independent of other lists — they do not share attributes.
- Minimum 2-column width; lists cannot be resized to 1 column.
- Sort state (`sortBy`, `sortDir`) persists across mode switches and saves.
- When sorted by an attribute, drag-to-reorder is disabled (the list is auto-ordered). Manual reorder is only available when `sortBy` is `null`.
- Removing an attribute is destructive — all values for that attribute are deleted from every item.
- The built-in `notes` field is not an attribute — it cannot be removed, pinned, or sorted by.
