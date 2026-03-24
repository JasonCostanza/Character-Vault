# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Character Vault is a TaleSpire Symbiote — a web-based plugin that runs inside TaleSpire's embedded Chromium browser. It serves as a character sheet engine for tabletop RPGs.

## File Structure

- `manifest.json` — Symbiote metadata, API subscriptions, capabilities, and entry point config
- `main.html` — Main HTML file (entry point)
- `main.css` — Stylesheet
- `README.md` — Project readme
- `LICENSE.txt` — GPL-3.0 with Commons Clause license

## Folder Structure

- `./_DOCS/` — Internal-use markdown files for design documents, implementation notes, and AI context. Not part of the shipped symbiote. Contents: `ARCHITECTURE.md` (code map — **read this first** for line ranges, data structures, and event flows), `_DESIGN.md` (overall design), `TABS.md` (tab system), `MODULES.md` (module/layout system), `COLORS.md` (color system and `--cv-*` token definitions)
- `./_DOCS/SUBMODULES/` — Submodule design notes. Contents: `STATS.md`, `SAVING_THROWS.md`, `ABILITIES.md`, `SPELLS.md`, `INVENTORY.md`, `COMPANIONS.md`, `NOTES.md`, `COUNTERS.md`
- `./_DOCS/plans/` — Saved implementation plans. Use kebab-case filenames based on the feature or task (e.g., `vitest-qase-test-infrastructure.md`, `exploding-dice-refactor.md`). **DO NOT** save them in the global plans directory, `~\.claude\plans`

## TaleSpire Symbiote Architecture

- Symbiotes are HTML/CSS/JS apps loaded via TaleSpire's embedded Chromium browser
- `manifest.json` defines:
  - **API subscriptions**: `dice.onRollResults` → `handleRollResult`, `symbiote.onstateChangeEvent` → `onStateChangeEvent`
  - **Capabilities**: `runInBackground` — the symbiote continues running when not in focus
  - **Extras**: TaleSpire-provided `fonts`, `icons`, `colorStyles`, and `diceFinder`
  - **Entry point**: `main.html`
- Background color is `#000000`; the UI should be designed for a dark theme consistent with TaleSpire's aesthetic
- Communication with TaleSpire happens through the symbiote JS API (e.g., `TS.dice`, `TS.symbiote`)

## Development

- No build system — this is a vanilla HTML/CSS/JS project served directly by TaleSpire
- To test, the symbiote folder must reside in TaleSpire's `Symbiotes` directory (this repo's location)
- This is the `Character Vault DEV` instance; changes are tested live in TaleSpire

## Project Rules

- **Never modify `LICENSE.txt` without explicit user permission.**
- **Always use `--cv-*` color tokens from `./_DOCS/COLORS.md` when writing CSS.** Never hardcode hex color values in component styles — only in the theme definition blocks. Refer to `COLORS.md` for the full token table and usage guidelines.
- **After exiting plan mode, offer to save the plan to `./_DOCS/plans/`.** Use a kebab-case filename describing the feature or task (e.g., `spell-slot-tracking.md`). If the user accepts, write the plan there.

## Gotchas

- **Buttons with icons use inline SVGs.** Use `<svg class="icon">` with `stroke="currentColor"` so icons inherit color from the button state. Prefer basic shapes (`<line>`, `<circle>`, `<rect>`, `<polyline>`) for simple icons, but use `<path d="...">` when the icon requires curves or complex geometry (gears, pencils, etc.). **Do not use CSS `mask-image` for icons** — it does not render in TaleSpire's embedded Chromium browser.
- **Module ≠ Submodule.** A **Module** is a container (e.g., a tab panel or section) that holds one or more **Submodules**. A **Submodule** is an individual component (e.g., Stats, Abilities, Spells) that lives inside a Module. Do not use these terms interchangeably.
- **New module types must use `registerModuleType()`.** All modules share a common shell (header with drag handle, resize handle, theme, height mode). Never build a new module by duplicating the shell markup — instead call `registerModuleType('typeName', { label, renderBody, onPlayMode, onEditMode })` and the shared `renderModule()` function handles the rest. See the `'text'` registration as the reference pattern.
- Pay attention to when a file says `# Note to Claude`. This will be an important callout from me to you.
- Iconography for native Talespire icons can be found at: https://symbiote-docs.talespire.com/icons.html

## License

GPL-3.0 with Commons Clause. Keep it open source and give credit. Commercial use requires explicit written permission.
