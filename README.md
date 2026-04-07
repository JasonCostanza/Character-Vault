# Character Vault

A character sheet engine for TaleSpire. Character Vault lets you craft and customize character sheets that serve any roleplaying system -- it doesn't bind itself to any particular ruleset. Whether you're building a D&D 5e statblock or running a homebrew system, Character Vault brings your sheets into TaleSpire.

## What It Is Not

Character Vault is a Swiss-Army Knife of character sheets. It will not automate rulesets (e.g., increasing a stat won't automatically update your modifier). It is a flexible layout tool, not a rules engine.

## Features

- **System-agnostic** -- works with any RPG ruleset
- **11 module types** for building sheets (see below)
- **Drag-and-drop layout** on a 4-column resizable grid
- **6 visual themes** -- Dark, Light, Cyberpunk, Sci-Fi, Angelic, Demonic
- **7 languages** -- English, Spanish, French, German, Italian, Portuguese (Brazil), Russian
- **Markdown support** in text modules (rendered in play mode)
- **TaleSpire dice integration** -- click stats, abilities, and saves to roll
- **Auto-save** with campaign-scoped persistence
- **Edit/Play modes** -- configure in Edit mode, clean display in Play mode
- **Quick-edit** -- Ctrl+Click values in Play mode to edit without switching modes
- **Game system templates** for stats, abilities, conditions, and saving throws (D&D 5e, Pathfinder 2e, Call of Cthulhu, Cyberpunk Red, and more)

## Module Types

| Module | Description |
|---|---|
| **Abilities** | Skill/ability list with modifiers, proficiency tracking, and linked stat syncing |
| **Conditions** | Toggle or valued conditions with game system templates and cascading sub-conditions |
| **Counters** | Tracked resources with current/max values (spell slots, ki points, ammo, etc.) |
| **Health** | Hit point tracker with current, max, and temporary HP |
| **Horizontal Line** | Visual divider to separate sections of your sheet |
| **List** | Inventory, spells, or any item list with optional weight tracking and sorting |
| **Resistances** | Drag-to-assign columns for immunities, resistances, and weaknesses |
| **Saving Throws** | Save values with optional proficiency tiers and notes area |
| **Spacer** | Empty block for layout spacing |
| **Stat** | Stat blocks with value/modifier display, two layout options, and dice rolling |
| **Text Box** | Freeform notes with full markdown rendering in play mode |

## Installation

Character Vault is a [TaleSpire Symbiote](https://symbiote-docs.talespire.com/#symbiotes-intro). You can install it through the in-game Symbiote browser or manually:

### Manual Installation

Place the following into `%userprofile%\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\Character Vault`:

- `scripts/` folder and its contents
- `main.html`
- `main.css`
- `manifest.json`

No build step required -- everything runs as vanilla HTML/CSS/JS.

## Themes

Six built-in themes are available from the settings panel:

- **Dark** (default) -- matches TaleSpire's native aesthetic
- **Light** -- warm parchment palette
- **Cyberpunk** -- neon pink and cyan on deep indigo
- **Sci-Fi** -- cool blue-steel HUD
- **Angelic** -- gold accents on silver-white
- **Demonic** -- blood red on crimson-black

## Localization

The UI is fully translated into 7 languages:

- English
- Español (Spanish)
- Français (French)
- Deutsch (German)
- Italiano (Italian)
- Português - Brasil (Portuguese)
- Русский (Russian)

## Contributing

Contributions are welcome! If you'd like to contribute, check out `CLAUDE.md` for coding conventions and architecture notes, and the `_DOCS/` directory for detailed design documentation.

## License

Character Vault is licensed under the **GNU General Public License v3.0** with the **Commons Clause** restriction. This means you can use, modify, and share the software freely, but you cannot sell it or sell services that derive their value from it.

See [LICENSE.txt](LICENSE.txt) for the full license text.
