# Rest Module

## Rest Module Summary
The Rest module is a fairly simplistic module in that it caters mostly to game systems with a standard Rest system like D&D 5e and PF2e. The two primary buttons are "Long Rest" and "Short Rest".

## Module Creation
**IMPORTANT** When a Rest module is created, the user is immediately prompted with a dialog menu to link the Rest module to a Health module. The dialog lists all Health type modules in order in an "unlinked" list consisting of their Module Name, Current Health, and Max Health. This is to make them identifiable if they have multiple Health modules. Clicking any of these listed Health modules moves them up into a "Linked" section. The user can link multiple Health modules at one time or split up their Rest modules to handle different Health modules.

# Long Rest Button
A `Long Rest` resets `Current HP` to maximum on all linked Health modules. Temporary HP and Hit Die restoration are controlled by the module settings (see below).

Clicking `Long Rest` also automatically un-toggles Hit Die counters based on the restore setting (all, half, or none).

Disabled in `Edit` mode.

# Short Rest Button
Clicking `Short Rest` sends a dice roll string `1d{Hit Die}+{Mod}` to TaleSpire. When the result returns, the rolled amount is applied as healing to all linked Health modules. If no modifier is linked, the roll is just `1d{Hit Die}`.

The user is responsible for manually toggling their Hit Die counters to track usage.

Disabled when all Hit Die are spent. Disabled in `Edit` mode.

# Hit Die Counters
Below the `Long` and `Short` buttons are a row of toggle boxes which represent each `Hit Die` that the player has available. The number of toggle boxes is represented by the `Hit Die Count` in the Module settings. If all `Hit Die` are toggled on, disable the `Short Rest` button.

**IMPORTANT** When referring to the toggle states, `On` = unavailable or used, `Off` = available or unused. Toggles are enforced sequentially: spent from left to right, restored from right to left. Clicking a toggle spends the next available (leftmost `Off`) or restores the last spent (rightmost `On`).

Example: "[x] [x] [ ] [ ]" = 2 of 4 `Hit Die` are spent. Spending one more → "[x] [x] [x] [ ]". Restoring one → "[x] [ ] [ ] [ ]".

# Module Settings
## Reset-All Options
**IMPORTANT** Ensure all settings are wired up to their described functions or intent.
Customization Options:
- [Toggle] Reset "Temporary HP" to `0` on `Long Rest`
- [Toggle] Reset "Temporary HP" to `0` on `Short Rest`
- [Dropdown] Hit Die Size:
    - [`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`]
- Hit Die Count: [`number input field`]
- Link `Con Modifier` from a targeted `Stat module`
    - User is prompted to target a Stat block. The modifier value is pulled into the Short Rest dice roll string `1d{Hit Die}+{Mod}`
    - If no modifier is linked, the roll is just `1d{Hit Die}` (modifier assumed `0`)
- [Dropdown] Hit Die Restore on Long Rest:
    - Restore all `Hit Die`
    - Restore half `Hit Die` (rounded down)
    - Restore no `Hit Die`

# Gotchas
- The user can re-link module links at any time from the `Module Settings` menu.
- The module size is resizable but defaults to `1 colSpan` x `1 rowSpan`
- This module is supposed to be used primarily in `Play` mode. It will not offer much functionality in `Edit` mode except resizing it, moving it, and accessing the Module Toolbar.