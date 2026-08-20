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
| `renderBody(bodyEl, data)` | Builds the counter list with values, max displays, and increment/decrement/reset buttons; wires up click/right-click handlers |

## Grid Sizing
- Minimum **1 column** wide
- User-configurable height via `rowSpan`
- Content scrolls internally when it overflows the fixed height
- `colSpan` range: 1–4

## Module Toolbar / Overflow Menu

Chrome (drag handle, overflow menu) reveals on hover. The overflow menu (kebab button) provides:

| Item | Description |
|---|---|
| **Rename** | Standard module title rename |
| **Add Counter** | Opens the quick creation modal (see "Counter Creation Modal" below) |
| **Module Settings** | Opens the settings modal (see "Settings Modal" below) |
| **Delete** | Standard module delete button |

## Module UX

### Display Format
The module body always displays active counters in a list, with:
- **Icon** (if set) — 32×32 inline SVG
- **Name** — counter display name
- **Value** — formatted as either `value / max` (if max is set) or `value` (if unlimited)
- **Increment / Decrement / Reset buttons**

### Interactions
- **Increment** — clicking on a counter (or its increment button) increments it by 1
- **Decrement** — right-clicking on a counter (or clicking its decrement button) decrements it by 1
- **Boundary behavior** — increment/decrement buttons are disabled (visually grayed out) if the counter is at its `max` or `min` respectively
- **Reset** — clicking the reset button sets the counter to its `min` value
- **Sorting** — clicking on column headers (Name, Value) sorts the list ascending; clicking again toggles descending; clicking a third time returns to manual (`custom`) order. Current sort state is persisted in `sortBy` / `sortDir`.

## Settings Modal

`openCounterSettingsModal(moduleEl, data)` — opened via the overflow menu's "Module Settings" item. Contains:

- **Manage Counters** — one row per counter: drag handle (SortableJS reorder), icon button (opens the Counter Edit Modal), inline-editable name input (commits on every keystroke via `scheduleSave()` + `propagateEntityRename()`), value/max preview button (opens the Counter Edit Modal), delete button (removes the counter and re-indexes `order`)
- **Add Counter** button — opens the Counter Creation Modal; on create, both the module body and the Manage Counters list refresh
- Common settings section (theme, size, etc. via `buildCommonSettingsSection()`)

Both `openCounterCreateModal()` and `openCounterEditModal()` accept an optional trailing callback, invoked after the create/save/delete completes, so the settings modal's Manage Counters list can refresh itself without a full modal reopen.

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

Opened from the Manage Counters list (icon or value button) in the settings modal — a centered overlay (z-index: `200`) that allows editing:

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
- Dragging & dropping a counter in the Manage Counters list updates `order` values and reverts the sorting mode back to `custom` order.
- The edit modal auto-clamps `value` to `max` live as the user edits the `max` field. This prevents the invalid state (value > max) from being saved.