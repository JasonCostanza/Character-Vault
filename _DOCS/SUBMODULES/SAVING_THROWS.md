# Saving Throws Module

## Saving Throws Summary
The Saving Throws module tracks character saving throws, which are reactive checks against harmful effects. Each saving throw has a name (e.g., "Strength") and a value (e.g., +3). The module supports adding, editing, and deleting saving throws, as well as reordering them via drag-and-drop. Saving throws are displayed similarly to stats but are conceptually distinct as reactive checks rather than proactive attributes.

## UI/UX
This module will look similar to the Stats module in that each one is a "saving throw block". Each block displays the saving throw's name, proficiency tier (if applicable), and modifier value. The modifier value is clickable to roll the saving throw in the dice tray (e.g., "1d20+3").

Below the list of saving throws, there is a small text box for adding a custom note or description that applies to all saving throws (e.g., "+1 to all saving throws while raging"). This note supports markdown formatting and is optional.

## Game System Integration
The user can select from a list of preconfigured saving throw templates based on their game system (e.g., D&D 5e, Pathfinder). Each template includes a set of standard saving throws with appropriate names and default values. Users can customize these saving throws after selection.

Alternatively, the user can start from scratch and create custom saving throws. They can choose to enable or hide tiered proficiency. If expertise tiers are enabled, the user can select their training tiers preset (e.g., "Untrained", "Trained", "Expert", "Master") or define their own tiers via secondary modal that appears over top to define and reorder the list of tiers from highest (top) to lowest (bottom).

**Custom-Tiered saving throws** allow users to define their training tiers (e.g., "Untrained", "Trained", "Expert", "Master") in addition to a numerical modifier value. This provides flexibility for systems that use training tiers or ranks in their saving throw mechanics. All proficiency tiers are represented by a single-letter badge on the saving throw's block (e.g., "T" for Trained, "E" for Expert). The badge's color corresponds to the tier level (e.g., gray for Untrained, green for Trained, blue for Expert, purple for Master). Users can customize the tier names and colors in the module settings.

## Interactions
- The user can:
    - Click a saving throw's modifier value to roll it in the dice tray (e.g., "1d20+3").
    - Ctrl+Click a saving throw's modifier value to quick-edit it via the shared popover (`enterSaveQuickEdit`).

Adding, renaming, deleting, reordering saves, and changing proficiency tier/linked stat all happen in the settings modal's Manage Saves section (see below) — not on the module body.

## Module Toolbar / Overflow Menu

Chrome (drag handle, overflow menu) reveals on hover. The overflow menu (kebab button) provides:

| Item | Description |
|---|---|
| **Rename** | Standard module title rename |
| **Add Save** | Appends a blank save (`name: ''`, `value: 0`, `proficiencyTier: null`) directly, no modal |
| **Edit Notes** | Opens a textarea modal for the shared notes field (`openSaveNotesModal`) |
| **Module Settings** | Opens the settings modal (`openSaveSettings`) |
| **Delete** | Standard module delete button |

## Settings Modal

`openSaveSettings(moduleEl, data)`. Two kinds of fields coexist in this modal:

- **Manage Saves** (immediate-apply, no Cancel) — one row per save: drag handle (SortableJS reorder), inline-editable name input, a linked-stat select (only shown when a stat module is linked — maps this save to one of that module's stat names), a proficiency tier select (only shown when tiers are enabled), and a delete button. An **Add Save** button appends a blank save. All of these commit immediately via `scheduleSave()`, matching the pre-existing per-save edit behavior this replaced.
- **Tier configuration + linked stat module** (staged, existing pre-Phase-5 behavior) — Enable Proficiency Tiers toggle, tier preset picker, custom tier editor, and the "linked stat module" picker are held in working copies and only committed to `data.content` on **Save**; **Cancel**/Escape/click-outside discard them via a dirty-check confirm. Toggling these staged fields re-renders the Manage Saves rows live (e.g. enabling tiers immediately shows the per-row tier select) even though the underlying `tiersEnabled`/`tierPreset`/`tiers` values aren't committed until Save.

## Globals Exposed

The saving throw module IIFE exposes these on `window`:
- `applySavingThrowTemplate(key)` — Returns an array of save objects pre-populated from a named template (`dnd5e`, `pf2e`, etc.)
- `applyTierPreset(key)` — Returns an array of tier objects for a named preset; `[]` for unknown keys
- `ensureSaveContent(data)` — Shape guard; initializes missing content fields, applies dnd5e migration, returns `data.content`
- `getTierForSave(save, tiers)` — Returns the matching tier object for a save's `proficiencyTier`, or `null`
- `saveNotesCheckboxProxy(data)` — Returns a `{ get content, set content }` proxy wiring the notes field into `attachCheckboxHandlers`
- `openSaveSettings(moduleEl, data)` — Opens the settings modal described above