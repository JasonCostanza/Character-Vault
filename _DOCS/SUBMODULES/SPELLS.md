# Spells Module

## Spells Summary
The Spells module provides a comprehensive set of tools for managing and utilizing spells within the game. It includes features for creating, customizing, and casting spells. There are two main segments to this module: The spell slots, and the spell library.

When a user creates a blank Spells module, they will be presented with a clean slate to work with. The module will be empty and allow the user to add categories (e.g. "Level-1 Spells", "Level-2 Spells", "Level-3 Spells", etc.) and then add spells to those categories. Each spell can have its own unique properties, such as damage, range, and cooldown.

## Spell Slots
Spell slots are a crucial aspect of the Spells module. They represent the number of spells can be cast at that level. For example, a character might have 3 level-1 spell slots, 2 level-2 spell slots, and 1 level-3 spell slot. The user can manage these spell slots by adding or removing them as needed. This allows for a flexible and customizable spellcasting system that can be tailored to the needs of the game. By clicking a spell slot, the user "spends" that spell slot, meaning they cannot be used again until they are refreshed (e.g. after a long rest).

Spell slots can be manually spent by the user, or they can be automatically spent when a spell is cast.

## Spell Categories
Spell Categories are a way to organize spells within the Spells module in a list format. Each category can represent a different level of spells (e.g. "Level-1 Spells", "Level-2 Spells", etc.). Within each category, users can add individual spells, which can have their own unique properties such as damage, range, and cooldown. This allows for a structured and organized way to manage spells within the game. Each category can be expanded or collapsed to show or hide the spells within it, making it easier for users to navigate through their spell collection when they have access to a large number of spells.

# Edit Mode
The user can:
- Add, remove, edit spell categories
- Add, remove, edit spells within those categories
- Manage spell slots (add/remove)

# Play Mode
The user can:
- Cast spells by clicking on a Cast button located on each spell, which will spend the corresponding spell slot (if one is available, presents an error if not) and send the damage roll to Talespire's dice tray.
- Expand the spell's details by clicking on an expand button, which will show the spell's properties (e.g. damage, range, cooldown) in a modal window.

# Module Settings Menu
The module settings menu allows the user to customize various aspects of the Spells module. This includes options for how spell slots are displayed, how spells are organized within categories, and other visual and functional settings. The user can access this menu by clicking on the settings icon within the Spells module toolbar or overlay menu.

Within the settings menu the user can:
- Add/Edit/Remove spell categories
- Enable/Disable automatic spell slot spending when a spell is cast
- Enable/Disable error messages when no spell slots are available of the appropriate level for the spell being cast
- Add/Edit/Remove Attributes on each spell (e.g. damage, range, cooldown, shape, etc.)

# Gotchas
- We are **not** providing the user with a pre-populated spell library as there are far too many between different editions of D&D and other RPG systems. D&D 5e alone has 500+ spells. Instead, we are giving the user the tools to create their own spell library from scratch or copy/pasting relevant information from online sources.
- A spell's expanded details view is default **read-only**, but the user can edit the spell's properties by clicking an "Edit" button within the expanded details view, which will allow them to modify the spell's attributes and save their changes all in that expanded view. **We use read-only** so the user can access dice roll strings like "Damage" without accidentally modifying them.
- The Spells module is spawned at a default size of 4 col x 2 row. The user can resize it after the fact, but we want to make sure it is large enough to show a few spells and their details immediately.

## Globals Exposed

The spells module IIFE exposes these on `window`:
- `isDiceNotation(val)` — Returns `true` if the string contains a valid dice expression (e.g. `2d6`, `1d20+5`)
- `extractDiceRoll(val)` — Extracts and returns the first dice expression from a string, or `null`
- `spellsDefaultContent()` — Returns a fresh default content object `{ autoSpendSlots, showSlotErrors, slotLevels, categories }`
- `getAvailableSlots(data, slotLevel)` — Returns remaining slots for a level; `0` if the level is missing or fully spent
- `spendSlot(data, slotLevel)` — Increments `spent` for the given slot level, capped at `max`
- `castSpell(moduleEl, data, spell, catId, onSuccess)` — Runs cast logic: slot check, slot spend, dice roll, activity log, `onSuccess` callback