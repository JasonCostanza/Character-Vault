# Settings Menu

This document describes all the avaiable app settings and their associated values.

## Language
see `_DOCS\LOCALIZATION.md`.

## Theme
- Light
- Dark

see `_DOCS\COLORS.md` for more information.

## UI Scale

Dropdown with 4 presets: 90%, 100% (default), 110%, 125%.

- Applies CSS `zoom` to `document.body` for uniform scaling of all UI elements.
- Persisted in `localStorage` as `cv-ui-scale` (default: `'1'`).
- Applied at load time via `loadUiScale()` in `theme.js` (before first paint) and on change via `applyUiScale()`.

## Save / Load
`Button`: Save
`Button`: Load
[  ] Save automatically
    `Tooltip`: "Save the character sheet after every change."
[  ] Load automatically
    `Tooltip`: "Automatically load the character sheet when you enter."

For documentation, see: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html#calls/localstorage.

## Export / Import
`Button`: Export — copies full character JSON to clipboard
`Button`: Import — opens file picker to import a `.json` file (wired in Phase 2)

## Links
- `icon-github` → [GitHub](https://github.com/JasonCostanza/Character-Vault)