# Fix: Stat/Ability/Save rolls ignore CoC, Mothership, CPRed dice rules

**Status:** Complete

**Issue:** [#167](https://github.com/JasonCostanza/Character-Vault/issues/167)

## Problem

`rollStatCheck()` (`module-stat.js`), `rollAbilityCheck()` (`module-abilities.js`), and
`rollSavingThrow()` (`module-savingthrow.js`) branch only on `daggerheart` before falling
through to a hardcoded `1d20+modifier` roll. CoC, Mothership, and CPRed have no branch, so
they incorrectly get d20 rolls. The Weapons module already handles these three systems
correctly (archetype `'B'` → `1d100` percentile; `cpred` → dedicated `1d10` logic) — this
fix follows that established pattern.

## Target behavior

| System | Stat/Ability/Save roll |
|---|---|
| `coc` | `1d100` vs. skill/attribute rating (percentile) |
| `mothership` | `1d100` vs. skill/attribute rating (percentile) |
| `cpred` | `1d10 + modifier` |
| everything else (unchanged) | `1d20 + modifier` (or Duality dice for `daggerheart`) |

### Which field holds the percentile value

- **Stats** (`module-stat.js`): use `stat.value` — CoC 7e attributes are already stored as
  the roll-under percentage (`_DOCS/DICE_MECHANICS.md` confirms stats are "stored as skill
  ratings" for CoC). `stat.modifier`/proficiency are not part of this roll.
- **Abilities** (`module-abilities.js`): use `getAbilityBaseMod(ability, data)` — per
  `_DOCS/SUBMODULES/ABILITIES.md`, "In Call of Cthulhu and Mothership, modifiers represent
  percentile base values displayed as a flat number." This already matches what the
  existing 1d20 fallback path computes as `totalMod`, so no new helper is needed.
- **Saves** (`module-savingthrow.js`): use `getSaveBaseMod(save, data.content)` — CoC/Mothership
  save templates (Sanity, Luck, Power, Fear, Body, Armor) have no `linkedStatName`, so this
  resolves to `save.value`, the flat percentage.

### CPRed

No new field needed — reuse the existing computed `totalMod`/`modStr`, just swap the die
from `1d20` to `1d10` (`var die = sys === 'cpred' ? '1d10' : '1d20';`).

## Implementation

For each of the three files, in the roll function, add a `coc`/`mothership` branch
immediately after the existing `daggerheart` early-return branch (same structural position —
mirrors the Weapons module's per-system branching), and swap the hardcoded `1d20` in the
default branch for a `die` variable that's `1d10` when `sys === 'cpred'`.

The percentile roll dispatch (`TS.dice.putDiceInTray` → `logActivity` → `pendingRolls`) is
extracted into a shared `window.rollPercentileDice(label, eventType, logKey, logReplacements,
sourceModuleId)` helper in `shared.js`, mirroring the existing `rollDualityDice` helper used
for `daggerheart`. All three files call it instead of inlining the plumbing.

New i18n keys needed (all 8 locales — `_DOCS` rule: locale edits must be total):
- `stat.event.percentileRoll`, `stat.log.percentileRoll`
- `abilities.event.percentileRoll`, `abilities.log.percentileRoll`
- `save.event.percentileRoll`, `save.log.percentileRoll`

Message format mirrors `weapons.log.percentileRoll` (`'{name} attack: {roll} (vs {skill}%)'`)
adapted to each module's existing verb (`Rolled {name} check (...)`, `Rolled {name} save (...)`),
producing e.g. `'Rolled {name} check ({roll} vs {skill}%)'`. `{roll}` is always `'1d100'`.

No CPRed-specific i18n keys are needed — the existing `stat.log.roll` / `abilities.log.roll` /
`save.log.roll` messages are generic enough to cover the `1d10` case.

## Files to change

- `scripts/shared.js` — new `rollPercentileDice()` helper
- `scripts/module-stat.js` — `rollStatCheck()`
- `scripts/module-abilities.js` — `rollAbilityCheck()`
- `scripts/module-savingthrow.js` — `rollSavingThrow()`
- `scripts/translations-en.js`, `-de.js`, `-es.js`, `-fr.js`, `-it.js`, `-pt-BR.js`, `-ru.js` — new percentile i18n keys

## Out of scope

- Weapons module (already correct, used as reference).
- Any UI/settings changes to expose these fields differently per system.
