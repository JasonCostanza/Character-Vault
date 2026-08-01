# Character Vault

A character sheet engine for TaleSpire. Character Vault lets you craft and customize character sheets that serve any roleplaying system -- it doesn't bind itself to any particular ruleset. Whether you're building a D&D 5e statblock or running a homebrew system, Character Vault brings your sheets into TaleSpire.

# Disclaimer on AI use
My stance on AI is that if it's used with good intent, it's fine. If a developer uses AI to develop and finish a product and is transparent about that use then there is no ill-intent and I can appreciate someone getting their ideas out to the world when they otherwise would not be able to. Good ideas should not be gate kept behind skill requirements like learning how to program from scratch. Where I have issue when developers use AI and then claim it was done "by hand" when that is not a complete truth.

I want to be transparent about my use of AI in this project. The roots of this project was started by hand by myself and my trusted friends who are professional software engineers and programmers skilled in HTML, CSS and JS. However, this symbiote at its core is a hobby project and something I could not continually request their free time and energy to help grow this project nor do I have the free time or energy to learn all the required technical skills to complete the project in a reasonable amount of time. I am a Software Test Engineer since 2012. I not studied computer science formally and everything I know about code is self-taught or tutored from peers throughout my career. I treat the code produced by Claude just as I treat code from my fellow engineers at my job. When Character Vault started growing in scope and more modules were added and mechanics evolved, languages were added, I resorted to engaging AI tools to help me reach a completed tool without having to hire a team of people to build my vision which I couldn't financially support. I call this practice "AI-Assisted development". The feature designs, specifications, and testing is all done by me. I provide AI a fully designed feature document in markdown (like a PRD), the AI processes that into an implementation plan which I review for gaps, questionable decisions, and clarity. Then after implementation, I test all output personally before releasing any version publicly. When the output looked questionable, I asked my Sr. Software Engineer friend for assistance to review the code and provide guidance on next steps to ensure a safe and scalable way forward. I want to be transparent and share that most of the code at this point was written using Claude Code on a Pro subscription and a little dabbling with local LLMs (Qwen 3.6, Gemma4, etc.) for my own educational purposes as I love to tinker with tools but due to hardware limitations (GPU VRam) continually utilizing those tools was unrealistic to completing the project. For artwork, no AI art was used in this symbiote. All icons were sourced using https://game-icons.net/ or https://lucide.dev/.

I hope that clarifies my stance and discloses my personal use of AI in this project sufficiently.

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
- **Game system templates** for stats, abilities, conditions, and saving throws (D&D 5e, Pathfinder 2e, Call of Cthulhu, Vampire: The Masquerade, Cyberpunk Red, Mothership, Shadowrun, Daggerheart)

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
- `css/` folder and its contents
- `main.html`
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
