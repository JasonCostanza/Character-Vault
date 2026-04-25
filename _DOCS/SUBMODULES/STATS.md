# Stats

## Stats Block Summary
Stat blocks are core attributes of any character sheet. These can be anything the user desires but common examples are things from common fantasy-based games like Strength, Constitution, Intelligence, Wisdom, and Charisma. Each stat has an associated modifier commonly displayed in the corner of the stat block. Stats can be renamed, value changed, and modifier changed at-will by entering `Edit` mode.

## Data Structure

Each stat module stores its content as:
```js
data.content = {
    layout: 'large-stat' | 'large-modifier',
    stats: [
        { name: 'STR', value: 10, modifier: 0, proficient: false, rollable: true },
        ...
    ]
}
```

- `layout` — Controls which value is visually prominent (see "Stat Block Style" below).
- `stats` — Ordered array of individual stat entries.

Each stat entry has:
| Field | Type | Description |
|---|---|---|
| `name` | string | Display name (e.g. "STR", "Wisdom") |
| `value` | number | The raw stat value |
| `modifier` | number | The modifier (displayed as "+x" or "-x") |
| `proficient` | boolean | Whether the proficiency dot is shown |
| `rollable` | boolean | Whether clicking the stat in Play mode triggers a dice roll |
| `isProficiencyStat` | boolean? | Present and `true` on the Proficiency stat. Omitted on all other stats. |

### The `isProficiencyStat` Flag

The `dnd5e` and `pf2e` templates pre-seed a "Proficiency" stat with `isProficiencyStat: true` and `rollable: false`. This flag allows external modules to locate the proficiency bonus without relying on the stat's display name (which the user may change).

The proficiency stat does **not** show the "Proficient" checkbox in layout mode — it is meaningless for this stat.

External modules that need the proficiency bonus should look it up like this:
```js
const statModule = window.modules.find((m) => m.id === linkedStatModuleId);
const prof = statModule?.content?.stats?.find((s) => s.isProficiencyStat);
const profBonus = prof?.modifier ?? 0;
```

## Stat Templates

When creating a new stat module through the wizard, the user can select a game system template to pre-populate stats. Templates are defined in `STAT_TEMPLATES` and exposed globally via `window.STAT_TEMPLATES`.

Available templates:
| Key | System | Stats |
|---|---|---|
| `dnd5e` | D&D 5th Edition | STR, DEX, CON, INT, WIS, CHA, Proficiency |
| `pf2e` | Pathfinder 2e | STR, DEX, CON, INT, WIS, CHA, Proficiency |
| `daggerheart` | Daggerheart | Agility, Strength, Finesse, Instinct, Presence, Knowledge |
| `coc` | Call of Cthulhu | STR, CON, SIZ, DEX, APP, INT, POW, EDU, LCK |
| `vtm` | Vampire: The Masquerade | Strength, Dexterity, Stamina, Charisma, Manipulation, Composure, Intelligence, Wits, Resolve |
| `cpred` | Cyberpunk RED | INT, REF, DEX, TECH, COOL, WILL, LUCK, MOVE, BODY, EMP |
| `mothership` | Mothership | Strength, Speed, Intellect, Combat |
| `sr6` | Shadowrun 6e | Body, Agility, Reaction, Strength, Willpower, Logic, Intuition, Charisma, Edge |

All template stats are initialized with `value: 0`, `modifier: 0`, `proficient: false`, `rollable: true`. When a template is selected, the module title is automatically set to "[Template Name] Stats" (e.g. "D&D 5e Stats").

The user can also choose "None (blank)" to start with an empty stat list.

## Stat Block Style

Each stat block is a 1x1 object on the overall grid and fits within its `Module` container. Each stat block has a `Name` field at the top of it, a `value` in large text, then a `modifier` in the lower right corner in the format "+x" where x is the modifier the user provides. Each stat block has a border around the main stat and a border around the modifier.

The stat values can be swapped between the `Primary` and `Secondary` element using the **Swap Layout** toolbar button:
- `large-stat` layout (default): The center text (Primary) shows the **value**; the corner badge (Secondary) shows the **modifier**.
- `large-modifier` layout: The center text (Primary) shows the **modifier**; the corner badge (Secondary) shows the **value**.

In layout mode, the label for whichever field is currently the Primary element is visually highlighted with the `stat-edit-primary-label` class.

### Proficiency Dot
When a stat has `proficient: true`, a small dot indicator (`stat-proficiency-dot`) is rendered inside the stat block. This can be toggled per-stat in layout mode via the checkbox.

Example: `images\_REFERENCE\stats.png`

## Module Toolbar Buttons (Layout Mode Only)

Stat modules have three extra toolbar buttons that are only visible in Edit mode:

| Button | Class | Description |
|---|---|---|
| **Add Stat** | `.module-addstat-btn` | Appends a new blank stat to the list |
| **Toggle Rollable** | `.module-rollable-btn` | Toggles the `rollable` flag on the currently selected stat. Disabled when no stat is selected. Shows an `active` state when the selected stat is rollable. |
| **Swap Layout** | `.module-swaplayout-btn` | Toggles between `large-stat` and `large-modifier` layout for the entire module |

## Stat Selection (Layout Mode)

In layout mode, clicking on the background of a stat block (not on inputs or buttons) selects it. The selected stat gets the `stat-selected` class. Clicking the same stat again deselects it. Selection state is tracked on the module element as `moduleEl._selectedStatIndex`.

Selection is required to use the **Toggle Rollable** toolbar button. When a stat is deleted, the selection is cleared if it was the deleted stat, or adjusted if a stat before the selected one was removed.

## Rolling a Stat Check

When in `Play` mode, the user can click on any **rollable** stat block (indicated by the `stat-rollable` class and pointer cursor) and the symbiote sends the appropriate roll information to TaleSpire. Example: if the stat block says 18 Strength with a +3 modifier, clicking it sends a roll group named "Strength Check" with dice `1d20+3`.

Non-rollable stats do not trigger a dice roll when clicked in Play mode (but still support Ctrl+Click quick editing).

All information on how to send dice rolls to TaleSpire can be found at: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html#calls/dice.

## Modifying a Stat Block Value (Layout Mode)

When in `Edit` mode, all stat blocks change from static text to editable text fields. Each edit block shows:
- A **drag handle** (`⁞`) for reordering
- A **name input** field
- A **delete button** (X icon)
- **Value** and **Modifier** number inputs
- A **Proficient** checkbox

Pressing `Enter` or `Escape` while typing drops focus from that text field. All inputs call `scheduleSave()` on change.

## Quick Edit (Ctrl+Click)

If the user is in `Play` mode and uses `Ctrl` + `Left Click` on any stat block (rollable or not), the stat enters quick layout mode. Both the Primary and Secondary values are replaced with number inputs inline. The primary input is auto-focused and selected.

Pressing `Enter`, `Escape`, or losing focus commits the changes and re-renders the stat block in place. This bypasses rolling the stat. A `commitOnce` guard prevents double-commits from overlapping blur/keydown events.

## Drag-to-Reorder

In layout mode, stats can be reordered by dragging the handle (`⁞`) on each stat block. This uses the Sortable.js library. After a drag completes, the `data.content.stats` array is reordered to match the new DOM order and `scheduleSave()` is called.

The sortable instance is stored on `container._sortable` and is destroyed and re-initialized whenever the stat list is re-rendered (e.g. after a delete).

**Important:** If the Stats module uses column header sorting with an active auto-sort (asc/desc), disable SortableJS manual drag-to-reorder for that column. Allowing both simultaneous auto-sort and manual drag creates confusing UX where the list re-sorts immediately after the user drags.

## Adding a Stat

When a new stat is added via the toolbar button, it is appended with defaults: `name: ''`, `value: 0`, `modifier: 0`, `proficient: false`, `rollable: true`. The module body is re-rendered and the module height is snapped to fit.

## Globals Exposed

The stat module IIFE exposes these on `window`:
- `STAT_TEMPLATES` — The template definitions object
- `applyStatTemplate(templateKey)` — Returns an array of stat objects from a template
- `updateRollableBtn(moduleEl, data)` — Updates the rollable toolbar button state
