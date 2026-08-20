# Action Tracker Submodule

## Summary

The Action Tracker submodule helps users track and manage actions within their turn. For D&D 5e, this includes tracking actions, bonus actions, and reactions. For PF2e, three fungible action points plus a reaction. For other systems, whatever turn resources that system defines (see "Supported Game Systems & Default Actions" below).

Users can add custom actions, and duplicates are allowed (e.g., multiple "Minor Action" pills for Shadowrun). The goal is not to enforce rules but to provide a visual planning and tracking tool — especially useful for new players learning what they can do on their turn.

Activities in this submodule are not reported to the Activity Log (e.g., do not log "[action name] used").

---

## UI/UX

### Action Pills

Actions are displayed as pill-shaped buttons. Each pill has three zones:

`([drag handle] | [action name] | [×])`

- **Drag handle** (left) — grip area for SortableJS reordering
- **Action name** (center) — the label; clicking this area toggles the pill
- **Delete button [×]** (right) — removes the action (no confirmation for single delete)

All three zones are always visible regardless of mode. Drag handles, delete buttons, and toggle behavior are always available.

### Toggle State

- **Available (on)** — lightened/highlighted pill
- **Used (off)** — darkened/muted pill

Clicking the name area of a pill toggles between these states.

### Layout Modes

Pills can be displayed in two layouts, configurable in the Settings modal:

- **Wrap** (default) — horizontal flex-wrap row; pills flow left-to-right and wrap to the next line
- **List** — vertical stack; one pill per row, full width

### Adding Actions

The [+] button in the module toolbar opens a modal to add a new action:
- Single text input for the action name
- [Accept], [Cancel], [×] buttons; Enter to accept, Escape to cancel
- Does not check for duplicates (duplicates are intentional)

### Reordering

SortableJS drag-to-reorder using the pill's drag handle. Follows existing CV patterns: `handle`, `animation: 150`, `ghostClass`, `draggable`, `onEnd`.

### Default Size

3 columns × 3 rows when added to a character sheet.

---

## Module Menu

The submodule menu in the menu bar offers:

1. **Reset All** — toggles all actions back to "available" (on). No confirmation needed.
2. **Delete All** — removes all actions. Confirmation modal required.
3. **Settings** — opens the Settings modal.

---

## Settings Modal

| Setting | Type | Description |
|---|---|---|
| **Layout** | Select: Wrap / List | Controls pill arrangement — horizontal flex-wrap (default) or vertical list |

---

## Pre-population

When the module is created, it reads the current game system from `window.gameSystem` and pre-populates with that system's default actions. If the user later changes their game system in Settings, existing Action Tracker modules are **not** updated — the user must delete and recreate the module to get new defaults.

The `custom` game system starts with no default actions.

---

## Data Model

```js
{
  layout: 'wrap',         // 'wrap' | 'list'
  actions: [
    { id: 'act_xxx', name: 'Action', used: false, order: 0 },
    { id: 'act_yyy', name: 'Bonus Action', used: false, order: 1 },
    { id: 'act_zzz', name: 'Reaction', used: false, order: 2 }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `layout` | `'wrap'` \| `'list'` | Pill layout mode |
| `actions[].id` | `string` | Unique identifier |
| `actions[].name` | `string` | Display label |
| `actions[].used` | `boolean` | `false` = available, `true` = used |
| `actions[].order` | `number` | Sort position (managed by SortableJS `onEnd`) |

---

## Globals Exposed

| Name | Description |
|---|---|
| `window.actionTrackerDefaultContent()` | Returns a fresh default `content` object (pre-populated from current game system) |
| `window.ensureActionTrackerContent(data)` | Shape guard |
| `window.resetAllActions(moduleId)` | Sets all `used` to `false`; could be called by a future Rest/Recovery module |

---

## Gotchas

- **No Activity Log integration** — toggling actions is silent. This is intentional; action tracking is a planning aid, not a logged event.
- **Duplicates are intentional** — PF2e needs 3 "Action" pills, Shadowrun needs 2+ "Minor Action" pills. Don't deduplicate.
- **Pre-population is fire-and-forget** — the module has no ongoing link to the game system setting. Changing systems does not retroactively update existing modules.
- **SortableJS in list layout** — drag direction changes from horizontal to vertical. Ensure `direction` option is set appropriately based on `layout`.

## Supported Game Systems & Default Actions

When a user creates an Action Tracker module, it should pre-populate with the default actions for their currently selected game system (from the Settings menu). The user can then add, remove, or reorder actions as they see fit. The `custom` game system starts with no default actions.

### D&D 5e (`dnd5e`)

D&D 5e uses a structured action economy where each component is a distinct resource. On their turn a character gets:

| Default Action | Notes |
|---|---|
| **Action** | The primary thing you do on your turn (attack, cast a spell, dash, dodge, disengage, help, hide, ready, use an object, etc.) |
| **Bonus Action** | Only available if a feature, spell, or ability specifically grants one. Cannot substitute for an Action or vice versa. |
| **Reaction** | One per round, refreshes at the start of your next turn. Used for opportunity attacks, Shield spell, Counterspell, etc. Triggers on specific conditions, often on another creature's turn. |

Movement is not a discrete action — characters move up to their speed freely, interleaved with actions. Free Object Interaction (e.g., drawing a weapon) is also not tracked as an action.

### Pathfinder 2e (`pf2e`)

PF2e uses a unified 3-action economy. Each action is fungible — any of the three can be spent on movement, attacks, spells, skill actions, or anything else that costs an action.

| Default Action | Notes |
|---|---|
| **Action** | First action. No penalty. |
| **Action** | Second action. Attacks take −5 MAP (−4 with agile weapons). |
| **Action** | Third action. Attacks take −10 MAP (−8 with agile weapons). |
| **Reaction** | One per round. Used for Attack of Opportunity, Shield Block, etc. |

Spells may cost 1–3 actions depending on the spell. Some activities (like Raise a Shield) cost 1 action. The visual presentation should display 3 identical "Action" pills plus a "Reaction" pill.

### Call of Cthulhu (`coc`)

CoC 7e uses a simple one-action-per-round system. Combat is not the focus of the game — encounters tend to be dangerous and brief.

| Default Action | Notes |
|---|---|
| **Action** | One significant action per round: attack (Fighting/Firearms), dodge, fighting maneuver, flee, cast a spell, or other task (e.g., pick a lock). |

Movement within reasonable distance is implicit in the action (e.g., closing to melee range to attack). Dodging an incoming attack is a reactive roll, not a separate tracked action. The simplicity here is intentional — CoC combat is fast and lethal.

### Cyberpunk Red (`cpred`)

Cyberpunk RED gives each character a Move Action and an Action on their turn. Actions can be split across movement (called "Splitting").

| Default Action | Notes |
|---|---|
| **Move** | Move up to MOVE stat × 2 in meters/yards. Can be split around your Action. |
| **Action** | Attack (melee or ranged), use a skill, interact with an object, or reload a weapon. Some weapons have Rate of Fire 2, allowing two attacks with one Action. |

There is no formal reaction system. The simplicity of 1 Move + 1 Action keeps the fast-paced cyberpunk feel.

### Daggerheart (`daggerheart`)

Daggerheart does not use traditional initiative or a fixed action economy. Instead, the spotlight passes between players and the GM based on dice results (Hope vs. Fear). The system is narrative-first.

| Default Action | Notes |
|---|---|
| **Action** | A "move" in Daggerheart terms — anything that advances the story: attack, cast a spell, interact with the environment, use a class feature, etc. |

**Optional token rule**: Groups that want more structure can use 3 Action Tokens per player per scene. A token is spent each time a player takes the spotlight. Once all tokens are spent by all players, tokens refill. Since this is an optional variant, the default preset provides a single "Action" pill. Users who use the token variant can manually add more.

### Mothership (`mothership`)

Mothership 1e uses a streamlined 1 Move + 1 Action system with simultaneous resolution. Combat is deadly and meant to be resolved quickly.

| Default Action | Notes |
|---|---|
| **Move** | Move within the scene. A character can spend their Action as a second Move if they need to cover more ground. |
| **Action** | Attack, Aim (grants advantage on next ranged combat roll if uninterrupted), use equipment, or any other significant task. |

Mothership's combat rules are intentionally lightweight. The Warden (GM) adjudicates edge cases narratively.

### Shadowrun 6e (`sr6`)

Shadowrun 6e uses a Major/Minor action system. Characters get 1 Major Action and a variable number of Minor Actions based on their Initiative.

| Default Action | Notes |
|---|---|
| **Major Action** | Attack (melee or ranged), cast a spell, use a complex skill, or sprint. You can trade 4 Minor Actions for 1 additional Major Action. |
| **Minor Action** | Default 2 per turn (more with high Initiative). Used for: Move (10m), Take Cover, Quick Draw, Call a Shot, Dodge (+Athletics to one Defense test), Change Device Mode, Stand Up, etc. |
| **Minor Action** | Second default Minor Action. |

Characters with cyberware or magic boosting Initiative may get 3–4+ Minor Actions per turn. The Major/Minor split rewards tactical planning and character builds focused on speed.

### Vampire: The Masquerade (`vtm`)

V5 uses a simple one-action-per-turn system. Combat is meant to be cinematic and fast, not a tactical miniatures exercise.

| Default Action | Notes |
|---|---|
| **Action** | One significant action per turn: attack, use a Discipline, grapple, or other major activity. Attack and defense are often resolved in the same contested roll. |

Minor Actions (drawing a weapon, making declarations like All-Out Attack/Defense, activating some Disciplines via Rouse Checks) are free and do not consume the Action. Blood Surge and Mending are also reflexive. The streamlined economy keeps the focus on narrative and social intrigue rather than combat granularity.

### Custom (`custom`)

No default actions are pre-populated. The user builds their action list from scratch to match whatever system, homebrew, or house rules they use.