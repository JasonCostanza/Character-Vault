# Health Module

## Health Module Summary
The health module is used to track the Health Points ("HP") of a character throughout a campaign. This is represented as a fraction (`Current HP` over `Max HP`). Characters can have an additional layer of hit points called `Temporary Hit Points` ("TEMP HP"). The combination of a character's `Current HP` + `Temporary HP` is referred to as their `Effective Hit Points`.

There can only be **one** Health tracker per `Health Module`. The module is fixed at 1×1 (`colSpan: 1`, `rowSpan: null` for auto-height). Resizing is not necessary for this module type.

## Data Structure

```js
{
    currentHP: 0,       // Current hit points (can go negative)
    maxHP: 0,           // Base maximum hit points
    tempHP: 0,          // Temporary hit points (floor: 0)
    maxHPModifier: 0    // Buff/debuff applied on top of maxHP
}
```

**Effective Max HP** = `maxHP + maxHPModifier`. Used for healing caps and displayed as the denominator in the HP fraction.

## Modifying Health
A few effects can be used to impact the 3 health values either positively or negatively. The primary use-cases are:
- Taking damage
- Receiving healing
- Receiving buffs in the form of `Temporary HP`
- Manual adjustment by the player

**IMPORTANT**: **Always** follow the basic rules of arithmetic.

# UI/UX of Health Module
All text input fields **MUST** allow simple mathematical equations to be entered via `evaluateHealthExpression()`. If the equation is **invalid**, e.g. "10-" we discard the edit and revert the field. However, if the user enters "-10" assume the user intends to set the value to "negative 10" and accept the change. Results are always floored to integers.

## Layout

The module body has three visual sections stacked vertically:

1. **Main row** (`health-main-row`) — HP values centered.
   - **HP column** (`health-hp-col`) — `Current / Max` display (spans or inputs depending on mode).
   - **Max HP modifier indicator** — Shown below the HP fraction only when `maxHPModifier !== 0`, formatted as `(+N MAX)` or `(-N MAX)`.
2. **Temp HP row** (`health-temp-row`) — Badge showing temp HP value and label.
3. **Action buttons row** (`health-actions-row`) — Heal and Damage buttons side by side (Heal left, Dmg right).
   - **Action buttons** (`health-actions`) — Container with two buttons arranged horizontally.

## Taking Damage
**IMPORTANT** All damage is removed from `Temporary HP` **BEFORE** the `Current HP`. Example, the character has 20 HP currently, and 3 `Temporary HP`. The user takes 8 damage. First we subtract all 3 `Temporary HP` before subtracting from the 20 `Current HP`. Resulting in 15 HP remaining. If the character has 0 `Temporary HP`, remove all damage from their `Current HP`. Example, the character has 20 HP and 0 `Temporary HP` and they take 5 damage. Because there is 0 `Temporary HP`, the damage goes towards their `Current HP` resulting in 15 HP remaining. **`Temporary HP` cannot go to less than 0**.

## Receiving Healing
**IMPORTANT** Healing is always applied to **only** `Current HP`, it **NEVER** applies to `Temporary HP`. `Current HP` can never exceed the character's **Effective Max HP** (i.e. `maxHP + maxHPModifier`) **UNLESS** the user manually adjusts this by typing in a numerical value or simple math equation which results in a value greater than the Effective Max HP.

## In `Play` Mode
- HP values are displayed as read-only text spans.
- **Heal button** — Opens the action overlay for healing input (labeled with `health.healShort`).
- **Damage button** — Opens the action overlay for damage input (labeled with `health.dmgShort`).
- **Temp HP badge** — Clickable button. Shows `+N` when temp HP > 0, otherwise `0`. Clicking opens the action overlay in `temp` mode to set a new Temp HP value.
- Both Heal and Damage use the **Health Action Overlay** (see below).

## In `Edit` Mode
- HP values become **inline text inputs** (`health-inline-input`) for `Current HP` and `Max HP`, allowing direct editing with math expressions.
- Temp HP becomes an **inline text input** inside the temp badge.
- All inputs **auto-size** to fit their content via `autoSizeInput()`.
- **Heal and Damage buttons are disabled** (present but non-interactive) — adjustments are made directly via the inputs.

## Confirming Adjustments in `Edit` Mode
If the user is actively typing in any text input field, pressing **Enter**, **Escape**, or clicking off the input field (blur) commits the value. If the expression is invalid, the field reverts to its previous value. `Temporary HP` is floored at 0 on commit.

## Temporary HP
The user can adjust Temporary HP by clicking the temp badge in `Play` mode to open the action overlay, or by editing the inline input in `Edit` mode. Temporary HP **MUST** also support simple arithmetic for consistency. Temp HP **cannot go below 0**.

## Health Action Overlay
A shared overlay (`health-action-overlay`) appended to the module body, used for four modes:

| Mode | Title key | Pre-filled? | Behavior |
|---|---|---|---|
| `damage` | `health.takeDamage` | No | Applies `applyDamage()` — temp HP absorbs first |
| `heal` | `health.heal` | No | Applies `applyHealing()` — capped at effective max |
| `temp` | `health.setTempHP` | Yes (current temp HP) | Sets `tempHP` directly (floored at 0) |
| `maxmod` | `health.moduleSettings` | Yes (current modifier) | Sets `maxHPModifier` directly |

The `maxmod` overlay also shows a subheading (`health.maxHPMod`).

**Controls:** Input field + OK/Cancel/X buttons. Enter confirms, Escape cancels. Invalid expressions cancel (revert).

## Module Toolbar
The Health module toolbar contains (in order, left to right):
- **Drag handle** (layout mode only)
- **Title** — label in play mode, editable input in layout mode
- **Overflow menu** (layout mode only) — three-dot button for the compact overlay menu
- **Module Settings** (`module-health-maxmod-btn`) — Gear icon, opens the action overlay in `maxmod` mode to set `maxHPModifier`
- **Eyedropper** (`module-health-eyedropper-btn`) — Pulls HP from the selected TaleSpire board miniature via `TS.creatures.getMoreInfo()`, setting `currentHP` and `maxHP`
- **Change Theme** — standard theme picker
- **Delete** — standard delete button

All toolbar buttons except the title label are hidden in play mode.

## syncState
Called before saving to capture any in-progress layout-mode input values. Reads `currentHP`, `maxHP`, and `tempHP` inputs, evaluates their expressions, and writes results back to `data.content`.

## Key Functions (in `module-health.js`)

| Function | Purpose |
|---|---|
| `evaluateHealthExpression(str)` | Safely evaluates a math string; returns floored integer or `null` |
| `autoSizeInput(input, buffer)` | Sets input width in `ch` units to match content length |
| `getEffectiveMaxHP(content)` | Returns `maxHP + maxHPModifier` |
| `applyDamage(content, amount)` | Subtracts from temp HP first, then current HP |
| `applyHealing(content, amount)` | Adds to current HP, capped at effective max |
| `openHealthActionOverlay(moduleEl, data, mode)` | Creates and shows the action overlay |
| `closeHealthActionOverlay(moduleEl)` | Removes the overlay from the DOM |

`openHealthActionOverlay` is exposed on `window` for cross-file access from `module-core.js`.
