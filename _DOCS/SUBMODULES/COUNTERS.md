# Counters Submodule

## Summary
Using the Counters submodule, the user can track the usage of abilities, spells, or other resources that are limited by a certain number of uses. Sometimes they simply want to count the turn of combat they're on, the days since they left town, or the number of enemies they've slain.

## Data Structure

Each counters module stores its content as:
```js
data.content = {
    counters: [
        {
            id: 'counter_xxx',     // unique ID (generated on creation)
            name: 'Action Points',  // display name
            icon: 'rocket',         // icon key from icon library, or null
            value: 3,              // current value
            max: 5,                // maximum value, or null if unlimited
            min: 0,                // minimum value (reset target)
            order: 0               // manual sort order
        },
        ...
    ],
    sortBy: 'custom',              // 'custom' | counter id | 'name' | 'value'
    sortDir: 'asc'                 // 'asc' | 'desc'
}
```

Each counter has:
| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID (generated on creation) |
| `name` | string | Display name |
| `icon` | string \| null | Icon key from the icon library, or `null` for no icon |
| `value` | number | Current counter value (can be negative) |
| `max` | number \| null | Maximum value, or `null` if unlimited |
| `min` | number | Minimum value (what Reset returns to) |
| `order` | number | Manual sort order for `sortBy: 'custom'` |

### Counter Icon Library
Icons are inline SVGs using basic shapes per project conventions. Users select from a curated set of 32 icons below organized by theme. No custom icons — selection from this fixed set only.

**Generic** (5 icons):
| Key | Label |
|---|---|
| `star` | Star |
| `circle` | Circle |
| `square` | Square |
| `triangle` | Triangle |
| `diamond` | Diamond |

**Time** (5 icons):
| Key | Label |
|---|---|
| `hourglass` | Hourglass |
| `clock` | Clock |
| `stopwatch` | Stopwatch |
| `bell` | Bell |
| `timer` | Timer |

**Combat** (5 icons):
| Key | Label |
|---|---|
| `sword` | Sword |
| `shield` | Shield |
| `flame` | Flame |
| `bolt` | Bolt |
| `target` | Target |

**Resources** (5 icons):
| Key | Label |
|---|---|
| `coin` | Coin |
| `gem` | Gem |
| `potion` | Potion |
| `apple` | Apple |
| `water` | Water |

**Miscellaneous** (5 icons):
| Key | Label |
|---|---|
| `scroll` | Scroll |
| `skull` | Skull |
| `skull-crossbones` | Skull & Crossbones |
| `eye` | Eye |
| `hand` | Hand |

**Sci-Fi** (7 icons):
| Key | Label |
|---|---|
| `rocket` | Rocket |
| `laser` | Laser |
| `radiation` | Radiation |
| `circuit` | Circuit |
| `energy` | Energy |
| `robot` | Robot |
| `wrench` | Wrench |

## Module Type Registration
Registered via `registerModuleType('counters', { ... })` in `scripts/module-counters.js`. The registration provides:

| Hook | Behavior |
|---|---|
| `label` | `'type.counters'` — i18n key, resolves to "Counters" in English |
| `renderBody(bodyEl, data, isPlayMode)` | Builds the counter list with values, max displays, and reset buttons; wires up click/right-click handlers and drag handlers |
| `onPlayMode(moduleEl)` | Switches to read-only state; enables click-to-increment and right-click-to-decrement; enables sort-by-column-header |
| `onEditMode(moduleEl)` | Switches to editable state; shows the quick-add modal on Add Counter button; enables drag-to-reorder |
| `syncState(moduleEl, data)` | (Optional) Reads any inline state back into `data.content` before save |

## Grid Sizing
- Minimum **1 column** wide
- User-configurable height via `rowSpan`
- Content scrolls internally when it overflows the fixed height
- `colSpan` range: 1–4

## Module Toolbar

| Button | Mode | Description |
|---|---|---|
| **Drag handle** | Both | Standard module drag handle for grid repositioning |
| **Title** | Both | Label in play mode, editable input in edit mode |
| **Add Counter** | Edit | Opens a quick creation modal to add a new counter |
| **Change Theme** | Both | Standard theme picker |
| **Delete** | Edit | Standard module delete button |

## Module UX

### Display Format
By default, the module UI will display all active counters in a list, with:
- **Icon** (if set) — 32×32 inline SVG
- **Name** — counter display name
- **Value** — formatted as either `value / max` (if max is set) or `value` (if unlimited)
- **Reset button** — sets the counter back to its `min` value (typically 0)

### Play Mode
- **Increment** — clicking on a counter increments it by 1
- **Decrement** — right-clicking on a counter decrements it by 1
- **Boundary behavior** — increment/decrement buttons are disabled (visually grayed out) if the counter is at its `max` or `min` respectively
- **Reset** — clicking the reset button sets the counter to its `min` value
- **Sorting** — clicking on column headers (Name, Value) sorts the list ascending; clicking again toggles descending; clicking a third time returns to manual (`custom`) order. Current sort state is persisted in `sortBy` / `sortDir`.

### Edit Mode
- **Add Counter** — toolbar button opens the counter creation modal (see "Counter Creation Modal" below)
- **Edit Counter** — clicking on a counter (or double-clicking the counter row) opens the edit modal (see "Counter Edit Modal" below)
- **Delete Counter** — each counter row has a delete button
- **Drag-to-reorder** — counters can be reordered via drag handles. After reorder, `order` values are updated and `scheduleSave()` is called.
- **Sorting disabled** — when in edit mode, sort headers are not interactive; users must reorder manually with drag handles

## Counter Creation Modal

When the user clicks "Add Counter" in the toolbar, a centered overlay opens (z-index: `200`) with:

| Field | Type | Default | Description |
|---|---|---|---|
| **Name** | text input | `''` | Display name for the counter |
| **Icon** | icon picker | `null` | Selection from the fixed icon library; "None" is the first option |

**Buttons:**
- **[Create]** — adds the counter with `value: 0`, `max: null`, `min: 0`, `order: length`, and closes
- **[Cancel]** — closes without creating

The Name field is auto-focused when the modal opens.

## Counter Edit Modal

Clicking a counter in Edit mode opens a centered overlay (z-index: `200`) that allows editing:

| Field | Type | Description |
|---|---|---|
| **Name** | text input | Display name |
| **Icon** | icon picker | Selection from the fixed icon library |
| **Current Value** | number input | The `value` field |
| **Maximum Value** | number input | The `max` field (or blank for unlimited) |
| **Minimum Value** | number input | The `min` field (Reset target) |

**Validation:**
- If the user changes `max` to a value less than `current value`, the `current value` auto-clamps to the new `max` (live, as they type).
- The `min` field can be set to any integer (including negative).

**Buttons:**
- **[Save]** — commits all changes and closes
- **[Close]** — discards changes and closes
- **[Delete]** — opens delete confirmation, deletes counter and closes if confirmed

**Close behavior:**
- If any field has changed since opening, both close actions (Close button and X button) prompt for confirmation before discarding.
- The Name field is auto-focused when the modal opens.

**Top-right:**
- **[X]** button — same as Close (discard with confirmation if unsaved)

# Gotchas
- A counter cannot exceed its `max` value. Increment is disabled when at max.
- A counter cannot go below its `min` value. Decrement is disabled when at min.
- If the `max` field is left blank, the counter has no maximum and is displayed as `value` only. If it is set to `0`, the maximum is strictly `0`.
- The `min` field defaults to `0` but can be set to any integer, including negative values. Reset always returns to the `min` value, not to `0`.
- Counters can hold negative integers (e.g., `-1`), as long as they remain above `min`.
- The sort mode (`sortBy` / `sortDir`) is permanently saved and persists between sessions. It will be seen by all connected players.
- Dragging & dropping a counter in `Edit` mode updates `order` values and reverts the sorting mode back to `custom` order.
- When sorted by name or value, drag-to-reorder is disabled (the list is auto-ordered). Manual reorder is only available when `sortBy` is `'custom'`.
- The edit modal auto-clamps `value` to `max` live as the user edits the `max` field. This prevents the invalid state (value > max) from being saved.