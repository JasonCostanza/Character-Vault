# Stats

## Stats Block Summary
Stat blocks are core attributes of any character sheet. These can be anything the user desires but common examples are things from common fantasy-based games like Strength, Constitution, Intelligence, Wisdom, and Charisma. Each stat has an associated modifier commonly displayed in the corner of the stat block. Stats are always displayed as compact play-mode blocks; management (rename, add, delete, reorder, proficiency) is handled through the settings modal.

## Data Structure

Each stat module stores its content as:
```js
data.content = {
    layout: 'large-stat' | 'large-modifier' | 'modifier-only',
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
| `rollable` | boolean | Whether clicking the stat triggers a dice roll |
| `isProficiencyStat` | boolean? | Present and `true` on the Proficiency stat. Omitted on all other stats. |

### The `isProficiencyStat` Flag

The `dnd5e` and `pf2e` templates pre-seed a "Proficiency" stat with `isProficiencyStat: true` and `rollable: false`. This flag allows external modules to locate the proficiency bonus without relying on the stat's display name (which the user may change).

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

The stat values can be swapped between the `Primary` and `Secondary` element using the **Display Layout** setting in the stat settings modal:
- `large-stat` layout (default): The center text (Primary) shows the **value**; the corner badge (Secondary) shows the **modifier**.
- `large-modifier` layout: The center text (Primary) shows the **modifier**; the corner badge (Secondary) shows the **value**.
- `modifier-only` layout: Only the **modifier** is shown (no value or secondary badge). Useful for NPC stat blocks that don't track base values.

### Proficiency Dot
When a stat has `proficient: true`, a small dot indicator (`stat-proficiency-dot`) is rendered inside the stat block. Proficiency is toggled per-stat in the settings modal's Manage Stats section.

Example: `images\_REFERENCE\stats.png`

## Rolling a Stat Check

Clicking any **rollable** stat block (indicated by the `stat-rollable` class and pointer cursor) sends the appropriate roll information to TaleSpire. Example: if the stat block says 18 Strength with a +3 modifier, clicking it sends a roll group named "Strength Check" with dice `1d20+3`.

Non-rollable stats do not trigger a dice roll when clicked (but still support Ctrl+Click quick editing).

All information on how to send dice rolls to TaleSpire can be found at: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html#calls/dice.

## Quick Edit (Ctrl+Click)

`Ctrl` + `Left Click` on any stat block (rollable or not) opens a shared edit popover with the stat's value and modifier fields (or modifier only for `modifier-only` layout). The primary field is auto-focused and selected. Ctrl+Click on a stat name opens a text edit popover for renaming.

Enter/Save commits, Escape/click-outside discards. Auto-proficiency stats (D&D 5e Proficiency) are excluded from Ctrl+Click.

## Stat Settings Modal — `openStatSettingsModal(moduleEl, data)`

Opened from the module's overflow menu ("Module Settings"). Contains:

### Manage Stats
Per-stat rows with:
- **Drag handle** — SortableJS reorder
- **Name input** — inline text input, changes propagate via `cv:stats-changed`
- **Proficiency control** — D&D 5e/custom: clickable dot toggle. PF2e: rank pills (U/T/E/M/L). Daggerheart: none.
- **Delete button** — removes the stat

Auto-proficiency stats (D&D 5e) show as read-only: no drag handle, no delete, "AUTO" badge.

**Add Stat** button appends a blank stat with defaults.

### Display Layout
Dropdown to switch between `large-stat`, `large-modifier`, and `modifier-only`.

### Rollable Stats
Per-stat `.cv-toggle` row (excluding proficiency stats) to enable/disable dice rolling on click. Re-renders dynamically when stats are added/removed in the Manage section.

### Get From Board
Imports stat values from a selected TaleSpire board creature. If the module has no stats, creates new entries from the board data; otherwise updates matching stat values by name.

### Common Settings
Standard icon/color/text-light settings via `buildCommonSettingsSection()`.

## Adding a Stat

Stats can be added via:
1. The **"Add Stat"** button in the settings modal's Manage Stats section
2. The **"Add Stat"** item in the overflow menu (calls the add-stat logic directly)

New stats are appended with defaults: `name: ''`, `value: 0`, `modifier: 0`, `proficient: false`, `rollable: true`. The module body is re-rendered and the module height is snapped to fit.

## Globals Exposed

The stat module IIFE exposes these on `window`:
- `STAT_TEMPLATES` — The template definitions object
- `applyStatTemplate(templateKey)` — Returns an array of stat objects from a template
- `openStatSettingsModal(moduleEl, data)` — Opens the stat settings modal
- `getAbilityModifier(key)` — Returns the modifier for a stat by name (case-insensitive, supports abbreviations)
- `getAbilityModifierFrom(key, moduleId)` — Same as above, but scoped to a specific stat module
- `getProficiencyBonus()` — Returns the proficiency bonus (auto-computed from character level for D&D 5e, or from the proficiency stat's value)
- `getStatValue(name)` — Returns the raw `.value` from any stat by name (case-insensitive)
- `getAllStatNames()` — Sorted, deduped array of all non-proficiency stat names across all stat modules
