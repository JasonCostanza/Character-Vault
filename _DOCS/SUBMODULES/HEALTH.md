# Health Module

## Health Module Summary
The health module is used to track the Health Points ("HP") of a character throughout a campaign. This is represented as a fraction (`Current` over `Maximum` ("MAX")). Characters can have an additional layer of hit points called `Temporary Hit Points` ("TEMP HP") which are represented similarly to a modifier in the Stats module. The combination of a character's `Current` + `Temporary Hit Points` is referred to as their `Effective Hit Points`.

There can only be **one** Health tracker per `Health Module`. Unlike stats where you can add multiple. The Module is 1x1, fits all the information inside it. Resizing is not necessary for this module type.

## Modifying Health
A few effects can be used to impact the 3 health values either positively or negatively. The primary use-cases are:
- Taking damage
- Receiving healing
- Receiving buffs in the form of `Temporary HP`
- Manual adjustment by the player

**IMPORTANT**: **Always** follow the basic rules of arithmetic.

# UI/UX of Health Module
All text input fields **MUST** allow simple mathematical equations to be entered. If the equation is **invalid**, e.g. "10-" we discard the edit. However, if the user enters "-10" assume the user intends to set the value to "negative 10" and accept the change.

## Taking Damage
**IMPORTANT** All damage is removed from `Temporary HP` **BEFORE** the `Current HP`. Example, the character has 20 HP currently, and 3 `Temporary HP`. The user takes 8 damage. First we subtract all 3 `Temporary HP` before subtracting from the 20 `Current HP`. Resulting in 15 HP remaining. If the character has 0 `Temporary HP`, remove all damage from their `Current HP`. Example, the character has 20 HP and 0 `Temporary HP` and they take 5 damage. Because there is 0 `Temporary HP`, the damage goes towards their `Current HP` resulting in 15 HP remaining. **`Temporary HP` cannot go to less than 0**.

## Receiving Healing
**IMPORTANT** Healing is always applied to **only** `Current HP`, it **NEVER** applies to `Temporary HP`. `Current HP` can never exceed the character's `Maximum HP` **UNLESS** the user manually adjusts this by typing in a numerical value or simple math equation which results in a value greater than the `Maximum HP`.

## In `Play` Mode
To apply damage, the user selects the "Damage" button (Red minus icon) next to their HP values. In the overlay menu that spawns, the user enters the amount of damage to receive then select "Okay" button to confirm or either "Cancel" button or "X" button to cancel the damage input. The damage is immediately applied and their HP values update accordingly.

## In `Edit` Mode
The player may take damage for many reasons and these adjustments need to be done quickly to not interrupt the flow of the game.

## Confirming adjustments in `Edit` mode
If the user is actively typing in any text input field, if the user presses "Enter", "Escape", or click off the input field, the result should be treated as final and updates made accordingly.

## Temporary HP
The user can adjust Temporary HP by clicking on the number in `Play` mode to be presented with the same overlay as taking damage or healing, but in this situation it's often just a "Set to" situation. Or in `Edit` mode, the modifier will display a text input field the user can modify. Temporary HP **MUST** also support simple arithmetic for consistency.

## Tools Bar
The Health module should offer the following tools in the `Tools bar` and overlay menu:
- Module Settings:
    - `Max HP Modifier` (Some buffs increase the character's `Max HP`, present the user with an overlay menu to input the modifier value)
- Eyedropper (see: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html#types/creatureinfo to retrieve miniature's stat from the board)
- Change Theme