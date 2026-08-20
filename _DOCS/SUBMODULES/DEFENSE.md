# Defense Module

## Defense Module Overview
The Defense module provides a configurable means for the user to track their defensive stats such as Armor Class in D&D 5e. Other systems may accomodate systems like evasion or damage reduction. The module is designed to be flexible and adaptable to various game systems while offering default settings for the supported systems of Character Vault.

## UI/UX Notes
Most commonly, characters have a primary defensive layer like Armor Class in D&D 5e. The UI should prioritize this as the spotlight stat in the Defense module. Additional defensive stats can be added as secondary layers, allowing users to track multiple defensive attributes without overwhelming the interface.

The spotlight stat should be prominently displayed, with clear labels and values. Secondary stats can be organized in a list under the primary stat, with options to expand or collapse the details for a cleaner look. The module should also allow users to customize the display of their defensive stats, such as choosing which stats to show or hide and how they are sorted.

Default module size is 2 col x 1 row. In 2+ column layout, the spotlight stat should be on its own dedicated row and carry more visual weight than the secondary stats. Secondary stats are always in list format that take up the width of the module. In 1 column format, Quick Defense buttons are a grid of icon-only buttons that take up the width of the module and illuminate darken to reflect their toggled state. In 2+ column format, Quick Defense buttons are a vertical list of buttons with icon on the left and label to the right, the buttons themselves take up the width of the module and illuminate darken to reflect their toggled state.

If a Quick Defense button is toggled on, the spotlight stat should visually reflect the applied modifier with a clear visual indicator either color, or symbol, or both.

All baked-in strings are translated to all supported languages however user-defined strings for names are left as the user entered them. This includes the names of Quick Defense buttons and the name of the spotlight stat if the user chooses to rename it in the settings menu.

### Interactions
- Display the spotlight stat (first entry in `content.defenses`) prominently
- Show remaining defenses as secondary rows in a compact list
- Ctrl+Click a value (spotlight or secondary) to open the edit popover and input a new value or apply modifiers. Entering "+2" would add 2 to the current value, while "-1" would subtract 1.
- Quick Defense buttons toggle on/off, applying their modifier to the spotlight value

### Settings Modal
`openDefenseSettingsModal(moduleEl, data)` (exposed as `window.openDefenseSettingsModal`) provides:
- **Manage Defenses** — per-defense row with drag handle, icon button (opens the icon picker popover), inline name input, `±` sign toggle, numeric value input, and delete button. All edits apply immediately (`scheduleSave()` + module body re-render). "Add Defense" appends a new blank entry. **Reordering also controls which defense is the spotlight** — position 0 in the list is always the prominently-displayed spotlight stat; every other position renders as a secondary row. There is no separate visibility/hide toggle — reordering to/from position 0 is how a stat is promoted to or demoted from the spotlight.
- **Manage Quick Defenses** — add new Quick Defense button with customizable name, icon, modifier value; reorder, edit, or delete existing ones. (Pre-existing from before this modal was expanded; unchanged behavior.)
- Common module settings (title, color, size) via `buildCommonSettingsSection()`.

### Quick Defense Buttons
User-defined defensive stats that can be added to the module for quick access during play. These could be things like "Raise Shield" or "Take Cover" that provide temporary defensive bonuses in the moment but are often not equipment-level actions like equipping a shield, dawning armor, or activating a cybernetic implant. Quick Defenses would be added as buttons in the module that, when clicked, apply a predefined modifier to the spotlight stat or a secondary stat for a specified duration (e.g., until the end of the turn). These buttons are icon-only and hovering over them would reveal a tooltip with the name of the Quick Defense and the modifier it applies.

## System-Specific Implementations
### D&D 5e
- Spotlight Stat: Armor Class (AC)

### Pathfinder 2e
- Spotlight Stat: Armor Class (AC)

### Call of Cthulhu 7e
- Spotlight Stat: Dodge (%)

### Cyberpunk Red
- Spotlight Stat: Evasion (EVA)

### Daggerheart
- Choice of Spotlight stat: Armor Class (AC) or Evasion (EVA)

### Mothership
- Spotlight Stat: Armor

### Shadowrun 6e
- Spotlight Stat: Defense Rating (DR)

### Vampire: The Masquerade 5e
- Player's choice of spotlight stat configured in the settings menu. The defensive stats of a character are determined by the character. There is no single AC-like stat — uses contested pools. Armor exists but is situational, not a core character stat.

### Custom Systems
- Blank slate the user can define their own stats