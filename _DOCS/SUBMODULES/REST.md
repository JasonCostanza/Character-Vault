# Recovery Module

## Recovery Module Summary
The Recovery module provides configurable rest/recovery buttons that automate common between-encounter actions: healing, restoring spell slots, resetting temporary HP, and rolling Hit Dice. Instead of hardcoding rest mechanics for a single game system, the module offers **user-configurable rest buttons** that each trigger a list of actions. Game system templates provide sensible defaults at creation time, but users can add, remove, or reconfigure buttons freely.

Recovery is a **Play-mode-primary** module. Its buttons are the main interaction point during gameplay. Edit mode exposes configuration (button setup, Hit Dice pool, action assignments).

## Data Structure

```js
{
  restButtons: [
    {
      id: 'btn_abc123',
      name: 'Long Rest',
      actions: [
        { type: 'healToFull' },
        { type: 'restoreAllSpellSlots' },
        { type: 'resetTempHP' }
      ]
    },
    {
      id: 'btn_def456',
      name: 'Short Rest',
      actions: [
        { type: 'healByRoll' }
      ]
    }
  ],
  hitDice: {
    dieSize: 8,               // die type (4, 6, 8, 10, 12)
    total: 5,                  // total Hit Dice pool
    remaining: 5,              // currently available
    modifier: 2,               // flat modifier added to each roll (e.g. Con mod)
    restoreOnLongRest: 'half'  // 'all' | 'half' | 'none'
  }
}
```

- `restButtons` — Ordered array of rest buttons. Each has a unique `id`, a display `name`, and an `actions` array.
- `hitDice` — Only relevant when at least one button has a `healByRoll` action. Otherwise this block is ignored and hidden from the UI.
- `hitDice.modifier` — A manually entered flat number (e.g. the character's Constitution modifier). **Not** linked to a Stat module. The user updates this value when their modifier changes.

## Action Types

Each rest button triggers one or more actions from this table:

| Action Type | Target | Behavior |
|---|---|---|
| `healToFull` | All Health modules | Sets `currentHP` to `effectiveMaxHP` on every Health module |
| `healByRoll` | All Health modules | Rolls from the Hit Dice pool (see Hit Dice Subsystem) and applies healing |
| `resetTempHP` | All Health modules | Sets `tempHP` to `0` on every Health module |
| `restoreAllSpellSlots` | All Spells modules | Refills all spent spell slots to their max on every Spells module |
| `restoreHitDice` | Self | Restores Hit Dice per the `restoreOnLongRest` setting (`all`, `half`, `none`) |

**"All modules" targeting**: Recovery discovers every Health and Spells module on the sheet and applies actions to all of them. This keeps the module simple and works for the common case (one Health module, one Spells module). If a user has no Health or Spells modules, the corresponding actions silently no-op.

## Cross-Module Communication

Recovery calls **guard-wrapped global functions** exposed by Health and Spells modules. This follows the same pattern used by `logActivity()`:

```js
// Health module will expose:
window.healToFull(moduleId)
window.resetTempHP(moduleId)
window.applyHealingAmount(moduleId, amount)

// Spells module will expose:
window.restoreAllSpellSlots(moduleId)
```

Guard pattern at call site:
```js
if (typeof window.healToFull === 'function') {
  window.healToFull(targetModuleId);
}
```

If no Health or Spells modules exist on the sheet, the guard prevents errors. Recovery never directly manipulates another module's data — it always goes through the target module's exposed functions.

## Hit Dice Subsystem

The Hit Dice subsystem is only active when at least one rest button includes a `healByRoll` action. It is primarily relevant to D&D 5e but available for any system that uses a dice-pool-based recovery mechanic.

### Rolling Hit Dice
When a rest button with `healByRoll` is clicked:
1. The user is prompted to choose how many Hit Dice to spend (up to `remaining`).
2. For each die spent: roll `1d{dieSize} + modifier`. The modifier defaults to `0` if unset.
3. Sum the results and apply as healing to all Health modules.
4. Subtract the number of dice spent from `remaining`.
5. Individual die results should be visible to the user (not just the total).

If `remaining` is `0`, the `healByRoll` action is skipped and the user is notified that no Hit Dice are available.

### Restoring Hit Dice
The `restoreHitDice` action (typically on a Long Rest button) restores Hit Dice based on the `restoreOnLongRest` setting:
- `'all'` — Set `remaining` to `total`
- `'half'` — Restore `floor(total / 2)` dice (minimum 1), capped at `total`
- `'none'` — No restoration

### Hit Dice Configuration (Edit Mode)
- **Die size**: Dropdown (`d4`, `d6`, `d8`, `d10`, `d12`)
- **Total Hit Dice**: Number input
- **Modifier**: Number input (flat value, e.g. Con modifier)
- **Restore on Long Rest**: Dropdown (`All`, `Half (rounded down)`, `None`)

## Game System Templates

When a Recovery module is created, it reads `window.gameSystem` and pre-populates defaults. Users can modify everything after creation.

### D&D 5e (`dnd5e`)
Two buttons:
- **Long Rest**
  - `healToFull`
  - `restoreAllSpellSlots`
  - `resetTempHP`
  - `restoreHitDice`
- **Short Rest**
  - `healByRoll`

Hit Dice block initialized with `dieSize: 8`, `total: 1`, `remaining: 1`, `modifier: 0`, `restoreOnLongRest: 'half'`.

### Pathfinder 2e (`pf2e`)
One button:
- **Rest**
  - `healToFull`
  - `restoreAllSpellSlots`

No Hit Dice block (no `healByRoll` actions).

### All Other Systems / Custom
Empty module — no pre-populated buttons. The user configures from scratch via Edit mode.

## UI Layout

### Play Mode
- **Rest buttons** stacked vertically, each a full-width styled button.
- **Hit Dice display** (only if `healByRoll` exists on any button): Compact indicator below the buttons showing `Hit Dice: {remaining}/{total}`.
- Clicking a rest button opens a **confirmation dialog** listing the actions that will execute (e.g., "Heal to full HP, Restore all spell slots, Reset Temp HP"). User confirms or cancels.
- If a `healByRoll` action is in the list, the confirmation dialog includes the Hit Dice spend prompt (how many dice to roll) before executing.
- After execution, results are displayed briefly (e.g., "Healed 14 HP from 2 Hit Dice").

### Edit Mode
- **Rest button list** with drag-to-reorder (SortableJS), edit, and delete controls per button.
- **Add Rest Button** option at the bottom of the list.
- Clicking **Edit** on a button opens a configuration modal:
  - Button name (text input)
  - HP Recovery dropdown (`None`, `Heal to full HP`, `Heal by Hit Dice roll`)
  - Actions checklist: Reset Temp HP, Restore All Spell Slots, Restore Hit Dice
  - **Hit Dice section** (appears when `healByRoll` is selected or `restoreHitDice` is checked):
    - Die size dropdown, total dice input, remaining dice input, modifier input, restore policy dropdown
    - Values are buffered locally — committed to the character only when Save is clicked, discarded on Cancel
- Rest buttons are **disabled** in Edit mode (no accidental rest triggers).

## Module Settings

The Module Settings menu (gear icon in toolbar/overlay menu) provides:
- Quick access to Hit Dice configuration (die size, total, modifier, restore policy)
- A link/shortcut to Edit mode for full button configuration

## Activity Log Integration

Every rest button click logs to the Activity Log:
```js
if (typeof window.logActivity === 'function') {
  window.logActivity({
    type: 'recovery.event.rest',
    message: t('recovery.log.rest', { buttonName: 'Long Rest', details: 'Healed to full, restored spell slots' }),
    sourceModuleId: data.id
  });
}
```

If a `healByRoll` action was included, the log message includes the dice results:
```js
message: t('recovery.log.hitDice', { count: 2, dieSize: 'd8', modifier: 2, total: 14 })
```

## Gotchas
- The module defaults to `1 colSpan` x `1 rowSpan`. It is resizable.
- Rest buttons are disabled in Edit mode. The module is intended for Play mode interaction.
- If no Health modules exist, healing actions silently no-op. Same for Spells actions if no Spells modules exist. No error is shown — the action just has no target.
- The Hit Dice `modifier` field is a manual number input, not linked to another module. The user is responsible for keeping it in sync with their character's Constitution modifier (or equivalent).
- An empty Recovery module (no buttons configured) shows a placeholder message directing the user to Edit mode.
- The `restoreHitDice` action should typically be placed on a "Long Rest" button, not a "Short Rest" button, but the module does not enforce this — users can configure freely.
