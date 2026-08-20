# Tabs

**Implementation plan:** `_DOCS/plans/tabs-implementation.md`

| Phase | Scope | Status |
|---|---|---|
| 1 | Data layer, migration, tab bar shell, localization keys | ✅ Complete |
| 2 | Tab switching, creation, "+" button, empty state | ✅ Complete |
| 3 | Context menus, Tab Settings modal, rename, color | ✅ Complete |
| 4 | Tab deletion (move/delete modules, last-tab safety) | ✅ Complete |
| 5 | Drag reorder, scrollable tabs, global settings reset | ✅ Complete |

Create a new .js file in the `scripts` folder called `tabs.js`. This file will contain all the code related to the tabs feature of the character vault. This includes creating, deleting, renaming, and changing the color of tabs. This is not a module itself so do not name it "module-tabs.js".

**Use `/frontend-design` skill to create new UI elements.

## Tabs Summary
Tabs are an organization feature where the user can create multiple tabs at the top of the Symbiote window. This bar appears just below the `<div id="menu-bar">` These tabs can further organize things the player wants to keep seperated. Example, "Tab 1" can be for stats, saving throws, and abilities. Then on "Tab 2", the user can put their inventory of items and consumables. And finally "Tab 3" can be their notes section to store notes about their character and recent events in a text box module. 

The tab bar is always visible, even when only one tab exists. This prevents layout shifts when tabs are added or removed and keeps the "+" button always accessible.

For expanded details of any listed feature, refer to sub-section headings below.

## Tab Switching
Only the active tab's modules exist in the DOM. Switching tabs clears `#module-grid` and re-renders that tab's modules sorted by their `order` field. This keeps the DOM lean and is consistent with the existing `deserializeCharacter` load pattern. Creating a new module via the wizard places it on the currently active tab.

## Layout Mode
Each tab has a drag handle on the left side of the tab that the user can click & drag to change the order of the tabs. By default, they are in the order in which they're created.

The user can right click on the tab bar's open area to open a context menu with the following options:
- `Create new tab`

The user can also right click on a tab to open a context menu with the following options:
- `Create new tab`
- Open `Tab Settings` modal
- `Delete tab` confirmation modal

## Play Mode
The user can:
- Select a tab to view the modules on that tab.

The user can right click on the tab bar's open area to open a context menu with the following options:
- `Create new tab`

The user can also right click on a tab to open a context menu with the following options:
- `Create new tab`
- Open `Tab Settings` modal
- `Delete tab` confirmation modal

## Tab Settings Modal
The Tab Settings modal can be accessed by right clicking on a tab and selecting "Open Tab Settings". This modal offers the following options:
- `Rename tab`
- `Delete tab` confirmation modal
- `Change tab color`

## Tab Names
By default, Character Vault has one default tab with a default name of `Tab 1`. New tabs are auto-named by scanning existing "Tab #" names and finding the lowest available number (gap-filling). For example, if "Tab 1" and "Tab 3" exist, the next auto-name is "Tab 2". Custom-named tabs do not affect the numbering. The width of the tabs themselves will adjust to fit the name of the tab. The user can rename the tab to whatever they want. If the user tries to rename a tab to an empty name, it will revert back to the default name of "Tab #". If two tabs result in the same name, a modal will pop up asking the user to choose a different name since tab names must be unique.

## Scrolling Tabs
The tabs bar can scroll side-to-side to accomodate if the user creates more tabs than will fit on the screen at one time. This scroll bar of tabs will be themed according to the theme of the symbiote. The scroll bar will be hidden if there are not enough tabs to require scrolling but the real estate for the tabs will still be there to accomodate more tabs if the user creates them to avoid UI jumping in position when the scroll bar appears.

## Deleting Tabs
Confirm deletion of a tab since it's a destructive action. Deleting a tab presents the user with a modal that offers to delete all modules or move modules to an existing tab. The user is given a dropdown list of existing tabs to select as the destination for the modules. If the user selects to move the modules to an existing tab, the modules will be appended to the end of the destination tab's module order and the deleted tab will be removed. If the user selects to delete all modules, all modules on that tab will be deleted and the tab will be removed.

If the user deletes the last remaining tab, a new empty "Tab 1" is automatically created so the user is never in a zero-tab state.

## Change Tab Colors
When the user selects to change the tab color, a color picker will appear offering a choice of the basic colors offered in the symbiote color picker including the custom #RRGGBBAA option. The picker also includes a "Default" swatch that resets the tab color to `null`, reverting to the theme's default tab styling. The user can select a color and the tab's color will change to the selected color. The tab's color will be saved as part of the character vault data and will be loaded when the character vault is loaded.

## Move to Tab

Individual modules can be relocated to a different tab without deleting and recreating them. A "Move to Tab" button appears in every module's toolbar in **edit mode only** (hidden in play mode, matching the delete and theme buttons).

**Single-tab behavior:** If only one tab exists, clicking the button shows a toast ("No other tabs available") and no modal opens.

**Multi-tab behavior:** Clicking opens a modal listing all tabs except the current one, sorted by their tab order. Clicking a tab row moves the module to that tab (appended to the end of the destination tab's module order), removes the module from the DOM, closes the modal, and shows a toast ("Moved to {tab name}").

**Move mechanics:**
- The moved module's `tabId` is updated to the destination tab's ID.
- Its `order` is set to the current count of modules on the destination tab (appended to end).
- No source-tab order rebalancing is performed — gaps in order values are harmless since order is relative within a tab.
- The module remains in `window.modules`; only its DOM element is removed.

The modal closes with no action on: X button, Cancel button, Escape key, or backdrop click.

## Add Tab Button
In both Edit and Play mode, there is an "Add Tab" button at the end of the tab bar. This button is a "+" icon that the user can click to create a new tab. The "+" button is pinned outside the scrollable tab area so it remains visible at all times, even when tabs overflow. This button does not require the user to right click to access it. This is for ease of access and to encourage users to use tabs to organize their modules.

## Save/Load Tabs
Tabs are saved as part of the character vault data. When a character vault is loaded, the tabs will be loaded in the same order they were saved. The active tab (the tab the user was last viewing) is persisted via `activeTabId` and restored on load. If the saved `activeTabId` no longer exists (e.g., the tab was deleted in another session), the first tab in order is selected as fallback.

## Empty Tab State
When a tab has zero modules, a per-tab empty state is displayed (reusing the existing `#empty-state` pattern, scoped to the active tab). This prompts the user to create a module on that tab.

## Fresh Start
A new character always begins with one default tab named "Tab 1". No migration from pre-tab data is needed since tabs ship with v1.0.

## Global Settings
see `scripts\settings.js`
In the global settings, the symbiote will offer a destructive option to delete all tabs and start fresh. This will delete all tabs and all modules on those tabs, then auto-create a fresh "Tab 1" so the user lands on a usable state (consistent with the last-tab deletion rule). The user **MUST** confirm this action since it's majorly destructive and cannot be undone.

# Data Structure & Shape

Tabs follow the existing CV pattern where objects are self-describing — each module carries its own `tabId` rather than tabs maintaining a separate list of module IDs. This avoids a dual-index sync problem that doesn't exist anywhere else in the codebase.

## Serialized save blob

Two new top-level fields are added to the save blob:
- `tabs`: array of tab objects
- `activeTabId`: the ID of the tab the user was last viewing (string)

## Tab object
- `id`: unique identifier (string) — generated via a `tabIdCounter`, same pattern as `moduleIdCounter`
- `name`: display name (string)
- `order`: position in the tab bar (number) — sequential, re-stamped on reorder
- `color`: tab color (string, hex code) or `null` for default theme color

## Module object changes
Each module gains one new field:
- `tabId`: the ID of the tab this module belongs to (string)

The existing `order` field remains but is now scoped per-tab — values only need to be relative within the same tab. Since modules from different tabs are never rendered simultaneously, `order: 0` on Tab 1 and `order: 0` on Tab 2 never conflict.

## Example
```json
{
  "version": 2,
  "tabs": [
    { "id": "tab-1", "name": "Tab 1", "order": 0, "color": null },
    { "id": "tab-2", "name": "Inventory", "order": 1, "color": "#4a90d9ff" }
  ],
  "activeTabId": "tab-1",
  "modules": [
    { "id": "mod-1", "tabId": "tab-1", "order": 0, "type": "stat", "..." : "..." },
    { "id": "mod-2", "tabId": "tab-1", "order": 1, "type": "health", "..." : "..." },
    { "id": "mod-3", "tabId": "tab-2", "order": 0, "type": "list", "..." : "..." }
  ]
}
```

## Cross-module links
Stat linking, weapon-to-stat, spell-to-ability, and other cross-module references use module IDs which are globally unique. These links work unchanged across tabs — a weapon on Tab 2 can link to a stat module on Tab 1.

# Localization

All user-facing strings use the `tabs.*` namespace in `scripts/translations.js`. Keys must be added to all 7 language blocks (en, es, fr, de, it, pt-BR, ru).

## Required keys

**Context menus:**
- `tabs.createNew` — "Create new tab"
- `tabs.openSettings` — "Tab Settings"
- `tabs.delete` — "Delete tab"

**Tab Settings modal:**
- `tabs.settingsTitle` — "Tab Settings" (modal heading)
- `tabs.rename` — "Rename" (input label)
- `tabs.changeColor` — "Tab color"
- `tabs.deleteBtn` — "Delete tab"

**Tab name validation:**
- `tabs.nameEmpty` — notification when blank name reverts to default
- `tabs.nameDuplicate` — "Tab names must be unique. Please choose a different name."

**Delete confirmation modal:**
- `tabs.deleteConfirmTitle` — "Delete Tab"
- `tabs.deleteConfirmMessage` — "What would you like to do with the modules on this tab?"
- `tabs.deleteModules` — "Delete all modules"
- `tabs.moveModules` — "Move modules to:"
- `tabs.deleteConfirm` — "Delete"

**Empty tab state:**
- `tabs.emptyState` — "This tab is empty"

**Global Settings:**
- `tabs.resetAll` — "Delete all tabs and start fresh"
- `tabs.resetConfirm` — "This will delete all tabs and all modules. This cannot be undone."

**Add tab button:**
- `tabs.addTooltip` — "Add tab" (title attribute on the + button)

**Color picker:**
- `tabs.colorDefault` — "Default" (reset-to-theme swatch label)

**Default tab name:**
- `tabs.defaultName` — "Tab {n}" — uses `t('tabs.defaultName', { n: 1 })` replacement

## Locale-aware name matching

The default tab name "Tab {n}" is generated via `t()`, so it renders in the user's language (e.g., "Onglet 1" in French). The duplicate name check compares against the localized names. A user manually typing the English "Tab 1" on a French locale would not collide with the auto-generated "Onglet 1" — this is correct behavior, not a bug.