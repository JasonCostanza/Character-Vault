# Dice Mechanics

Reference for TaleSpire dice integration, notation, rolling, and game system-specific mechanics.

---

## TaleSpire Dice API Overview

Character Vault rolls dice by queuing rolls into TaleSpire's dice tray, then receives results via a manifest subscription.

### Key API Functions

- **`TS.dice.putDiceInTray(rolls)`** — Queues roll(s) into the tray. Returns a `Promise<string>` resolving to the roll ID. **Note: API docs say `string`, but it is async — always use `.then()` or `await`.**
  - Accepts array of `{ name, roll }` objects. `name` is display label; `roll` is dice notation string.
  - Example: `[{ name: 'Fireball', roll: '8d6' }]`

- **`TS.dice.evaluateDiceResultsGroup(group)`** — Evaluates a single dice results group (used for pool rolls). Returns `Promise<number>` (the pool total). **Also async, despite API docs.**

### Roll Flow Diagram

```
User clicks "Roll" button (Stat, Ability, Spell, Weapon, etc.)
  ↓
Module calls TS.dice.putDiceInTray([{ name, roll }])
  ↓ (returns Promise<rollId>)
.then(rollId => {
  window.pendingRolls[rollId] = { logEntryId: entry.id }
})
  ↓ (TaleSpire user rolls dice)
Manifest fires "rollFinished" event
  ↓
window.handleRollResult(event) (in module-activity.js)
  ↓
Parses TaleSpire result tree → extractDieFaces() → pool sum or success count
  ↓
Updates Activity Log entry with total/successes
  ↓
window.pendingRolls[rollId] deleted
```

---

## Dice Notation Support

Rolls use standard notation: `NdM+/-X` (N dice, M faces, optional modifier).

### Supported Patterns

| Pattern | Example | Meaning |
|---|---|---|
| `NdM` | `2d6` | Roll N dice with M faces, sum result |
| `NdM+X` | `1d20+5` | Roll N dice, add flat modifier |
| `NdM-X` | `2d8-1` | Roll N dice, subtract flat modifier |
| `NdMkH` | `4d6kH3` | Roll N dice, keep highest M (for ability scores) |
| Pool notation | (see below) | System-specific pool mechanic |

### Parsing Helpers

- **`isDiceNotation(val)`** — Returns `true` if `val` looks like valid dice notation.
- **`extractDiceRoll(val)`** — Parses notation string; returns `{ diceExpr, modifier }` or `null` if invalid.

These helpers live in `module-spells.js` but can be extracted to `shared.js` if needed by other modules.

---

## Roll Result Handling

### Result Tree Structure (from TaleSpire)

TaleSpire returns a nested structure of dice results:

```js
{
  groups: [
    {
      name: 'Fireball',
      results: [
        [
          { face: 4, total: 4 },
          { face: 6, total: 6 },
          ...
        ]
      ]
    }
  ]
}
```

### extractDieFaces(node)

Pure helper (in module-activity.js) that walks this tree and returns a flat array of face values:

```js
window.extractDieFaces(result.groups[0]) 
// → [4, 6, 3, 5, 2, ...]
```

Used by pool rolling systems (VtM, SR6) to sum individual die faces.

### Activity Log Integration

When a roll finishes:
1. `handleRollResult()` looks up `window.pendingRolls[rollId]` → gets the log entry ID.
2. Parses the result tree (extracts faces, sums or counts successes).
3. Updates the Activity Log entry with the total/success count.
4. Clears the pending roll from the map.

---

## Game System Dice Features

### D&D 5e & Pathfinder 2e (Standard Modifier Rolls)

**Roll**: `1d20 + modifier`

**Behavior**:
- Rolls a d20 and adds the ability or skill modifier.
- TaleSpire sums the result automatically.
- Activity Log shows: `"Rolled Acrobatics check: 18 (rolled 14 + 4 modifier)"`

**Modules**: Stats, Abilities, Saving Throws, Weapons (attack rolls).

### VtM (Pool Rolling)

**Roll Type**: d10 pool; successes counted (each 6+ is 1 success, 10 is 2 successes).

**Setup**:
- Weapon has `poolSize` (number of d10s to roll) or `poolAutoCompute: true` to calculate from linked stats.
- Example: Strength 3 + Weapon 2 = 5d10 pool.

**Mechanics**:
- `TS.dice.putDiceInTray([{ name: 'Melee Attack', roll: '5d10' }])`
- On result: `extractDieFaces()` → [6, 8, 3, 10, 9] → successes: 4 (6=1, 8=1, 10=2, others=0)
- Activity Log: `"Rolled Melee Attack: 4 successes from 5d10"`

**Hunger Tracking**: VtM characters have Hunger (0–5). When rolling, if Hunger > 0, add Hunger d10s to pool (but messy critical on 1s). Accessed via `window.getConditionValue('vtm_hunger')`.

### Shadowrun 6e (Pool Rolling)

**Roll Type**: d6 pool; successes counted (each 5+ is 1 success).

**Setup**:
- Weapon has `poolSize` or `poolAutoCompute: true`.
- Typical pool = (base attribute) + (weapon rating) + (edge bonus if declared).
- Edge can be declared before rolling to add extra d6s (expended on use).

**Mechanics**:
- `TS.dice.putDiceInTray([{ name: 'Ranged Attack', roll: '8d6' }])`
- On result: `extractDieFaces()` → [5, 3, 6, 4, 5, 1, 2, 6] → successes: 4 (5, 6, 5, 6)
- Activity Log: `"Rolled Ranged Attack: 4 successes from 8d6"`

**Glitches**: If more 1s than successes, it's a glitch (critical failure).

### Daggerheart (d12 + Proficiency)

**Roll**: `1d12 + stat + proficiency rank`

**Behavior**:
- Rolls d12, adds base ability score and proficiency bonus (based on rank).
- No explicit proficiency tiers; just adds the modifier.
- Activity Log: `"Rolled Agility check: 18 (rolled 12 + 3 stat + 3 proficiency)"`

**Modules**: Stats (d12 checks), Abilities.

### Call of Cthulhu (Percentile Rolls)

**Roll Type**: d100 vs. Skill rating.

**Behavior**:
- Rolls 2d10 (percentile die) to get a number 1–100.
- Compare against skill rating (stored as a percentage, e.g., 60%).
- Success if roll ≤ skill rating; critical success if ≤ 1/5 of rating; critical failure if 96–100.

**Modules**: Stats (reference only, stored as skill ratings).

---

## Rolling Interfaces by Module

### Stats Module

```js
rollStatCheck(stat)
  ↓
Computes modifier (stat.value + stat.modifier + bonuses by system)
  ↓
TS.dice.putDiceInTray([{ 
  name: `${stat.name} Check`, 
  roll: `1d20+${modifier}` 
}])
```

### Abilities Module

```js
rollAbilityCheck(ability)
  ↓
Looks up linked stat (via getProficiencyState)
  ↓
Computes modifier (base ability + skill mod + proficiency rank)
  ↓
TS.dice.putDiceInTray([...])
```

### Saving Throws Module

```js
rollSavingThrow(save)
  ↓
Computes modifier (save.value + proficiency bonus if applicable)
  ↓
TS.dice.putDiceInTray([...])
```

### Spells Module

```js
rollAllSpellDice(spell)
  ↓
For each damage attribute with dice notation:
  ↓
TS.dice.putDiceInTray([
  { name: 'Fireball: Damage', roll: '8d6' },
  { name: 'Fireball: Dex Save DC', roll: '1d20+5' },
  ...
])

rollSingleAttribute(spell, attr)
  ↓
Same, but only one attribute
```

### Weapons Module

**Standard Attacks** (D&D/PF2e):
```js
rollAttack(weapon)
  ↓
Computes: weapon.bonus + ability mod + proficiency bonus
  ↓
TS.dice.putDiceInTray([{ name: '${weapon.name} Attack', roll: '1d20+${total}' }])

rollDamage(weapon)
  ↓
Rolls weapon.damageExpr (e.g., '2d8+3')
  ↓
TS.dice.putDiceInTray([{ name: '${weapon.name} Damage', roll: weapon.damageExpr }])
```

**Pool Attacks** (VtM/SR6):
```js
rollAttack(weapon)
  ↓
Computes pool size (weapon.poolSize or pulls from linked stats if poolAutoCompute)
  ↓
TS.dice.putDiceInTray([{ 
  name: '${weapon.name} Attack', 
  roll: '${poolSize}d${dieSize}' // e.g., '5d10' for VtM
}])
  ↓ (on result)
handleRollResult calls extractDieFaces() → counts successes
```

---

## Pending Rolls Map

`window.pendingRolls` is a temporary map matching roll IDs to log entry data:

```js
{
  'roll_abc123': { logEntryId: 'log_xyz789' },
  'roll_def456': { logEntryId: 'log_uvw012' }
}
```

- **When created**: Immediately after `TS.dice.putDiceInTray()` returns, before the user even rolls.
- **When consumed**: `handleRollResult()` reads it, updates the log entry, and deletes the key.
- **Cleanup**: If user dismisses a roll without rolling, the manifest fires `rollRemoved` event, which deletes the pending roll.

---

## Extending Dice Mechanics

### Adding a New System's Pool Rolling

If a new system uses pool rolling (e.g., "Success Count: sum d6s where 4+ = success"):

1. **Weapon data**: Add `poolSize` (or `poolAutoCompute` + stat links).
2. **Dice notation**: Use `'Xd6'` where X is pool size.
3. **Result handling**: In `handleRollResult()`, check `if (window.gameSystem === 'newsystem')` and count successes (extract faces, count 4+).
4. **Activity Log**: Log as `"X successes from Xd6"` to match VtM/SR6 style.

### Adding a New Modifier-Based System

If a new system uses standard d20/d12 + modifiers:

1. **Stat templates**: Define in `module-stat.js` `STAT_TEMPLATES`.
2. **Ability templates**: Define in `module-abilities.js` `ABILITY_TEMPLATES` if linked abilities exist.
3. **Dice check**: In the rolling function, compute modifier and call `TS.dice.putDiceInTray([{ name, roll: '1d20+' + mod }])`.
4. **No special result handling**: TaleSpire sums it automatically; Activity Log shows the total.

---

## Debugging Dice Issues

### Roll doesn't appear in Activity Log

1. Check browser console for `[CV]` messages.
2. Verify `TS.dice.putDiceInTray()` returned a promise and was awaited.
3. Check `window.pendingRolls` in dev tools — entry should exist briefly during roll, then disappear.
4. Verify `window.handleRollResult` is wired in manifest (should be subscribed to `rollFinished` event).

### Wrong success count or modifier

1. Check the notation string passed to `putDiceInTray()` — verify diceExpr is correct.
2. For pool rolls, check `extractDieFaces()` — add a console.log to see what faces were extracted.
3. Check success counting logic — VtM counts 6+ and 10=2, SR6 counts 5+, etc.
4. Verify game system is set correctly (`window.gameSystem`).

### Dice notation not recognized

1. Check `isDiceNotation()` and `extractDiceRoll()` helpers — they are fairly strict.
2. Common mistakes: spaces in notation (e.g., `'1d20 + 5'` vs `'1d20+5'`), lowercase vs. uppercase (notation is case-insensitive for die size, e.g., `'1d20'` and `'1D20'` both work).

---

## Test Coverage

Tests exist for:
- `isDiceNotation()` — valid/invalid patterns
- `extractDiceRoll()` — parsing notation
- Pool rolling success counts — VtM, SR6, custom counts
- `extractDieFaces()` — tree walking, flat extraction
- `applyTierPreset()` and `inferTierPreset()` — system → tier mapping

See `tests/` for vitest suite.
