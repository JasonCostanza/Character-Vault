# Localization (i18n) System for Character Vault

## Context

Character Vault already has a language selector in Settings that saves to localStorage (`cv-language`) with 6 language options — but it does nothing. There are ~50 user-facing strings (buttons, labels, placeholders, tooltips, dialogs) hardcoded in English across both static HTML and dynamic JS. This plan wires up a lightweight i18n system so those strings respond to the language setting. Player-entered text and console/debug messages are excluded.

## Approach

### 1. Create `translations.js`

New file at project root. Defines a single global `CV_TRANSLATIONS` object keyed by language code (`en`, `es`, `fr`, `de`, `pt-BR`, `ru`). Each language maps flat dot-notation keys to translated strings.

**Key naming convention** — prefix by UI region:
- `menu.*` — top menu bar
- `settings.*` — settings overlay
- `wizard.*` — new module wizard
- `delete.*` — delete confirmation dialog
- `module.*` — module header buttons/handles
- `type.*` — module type labels (Text Box, Horizontal Line, etc.)
- `text.*` — text box submodule
- `empty.*` — empty state
- `link.*` — footer links

All 6 languages will have complete translations (AI-generated for non-English). Missing keys still fall back to English as a safety net. Native speakers should review the translations over time.

### 2. Add i18n Runtime (top of inline `<script>` in main.html)

Three pieces:

- **`currentLang`** — initialized from `localStorage.getItem('cv-language') || 'en'`
- **`t(key, replacements?)`** — looks up `CV_TRANSLATIONS[currentLang][key]`, falls back to `en`, then to the raw key. Optional `{token}` interpolation.
- **`applyTranslations()`** — batch-updates static HTML using data attributes:
  - `data-i18n="key"` → sets `textContent` (or `innerHTML` if `data-i18n-html` is present)
  - `data-i18n-title="key"` → sets `title` attribute
  - `data-i18n-placeholder="key"` → sets `placeholder` attribute
  - `data-i18n-tip="key"` → sets `data-tip` attribute
- **`refreshModuleLabels()`** — re-translates all rendered module elements (title labels, input placeholders, button titles, textarea placeholders, mode label). Called on language change and startup.

### 3. Mark Static HTML Elements

Add `data-i18n` / `data-i18n-*` attributes to all user-facing elements in the HTML. The English text stays as default content (graceful fallback). Elements marked:

- **Menu bar**: Settings button title, New Module label+title, mode toggle title
- **Settings overlay**: title, all labels, theme buttons, save/load buttons, checkbox labels, tooltip tips, troubleshooting button, close button title, GitHub link
- **Wizard overlay**: title, close title, Type/Module Theme labels, type card names, "Coming Soon" badges, color swatch titles, Cancel/Add Module buttons
- **Delete dialog**: title, message, Cancel/Delete buttons
- **Empty state**: message (uses `data-i18n-html` since it contains `<strong>`)

Language `<option>` elements are NOT translated — endonyms stay as-is.

Mode toggle label is NOT marked with `data-i18n` — it's handled dynamically by `refreshModuleLabels()` since its key changes based on current mode (edit vs play).

### 4. Update Dynamic JS Strings

Replace hardcoded English in JavaScript with `t()` calls:

- **Mode toggle**: `'Play'`/`'Edit'` → `t('menu.play')`/`t('menu.edit')`
- **`renderModule()` template**: button titles, resize handle title, title input placeholder, display title
- **Module type registry**: `label` stores the i18n key (`'type.text'`, `'type.hline'`), resolved via `t(typeDef.label)` at point of use
- **Title input comparison**: `val !== typeDef.label` → `val !== t(typeDef.label)`
- **`applyPlayMode()`**: title label fallback uses `t(typeDef.label)`
- **Text box `renderBody`**: placeholder → `t('text.placeholder')`

### 5. Wire Up Language Change

Update the existing language select handler to also set `currentLang`, call `applyTranslations()`, and call `refreshModuleLabels()`.

### 6. Initial Load

Call `applyTranslations()` and `refreshModuleLabels()` near the end of the script (before auto-load) so the page renders in the saved language on startup.

### 7. Load `translations.js`

Add `<script src="translations.js"></script>` in `<head>` after the existing CDN scripts, before `</head>`.

## Files Modified

- **`translations.js`** — NEW: translation dictionary with ~50 keys per language
- **`main.html`** — script tag, i18n runtime, `data-i18n` attributes on HTML, `t()` calls in JS, language change handler, startup translation
- **`_DOCS/ARCHITECTURE.md`** — documented translations.js, i18n section, updated language/module type docs

## Verification

1. Open Character Vault DEV in TaleSpire
2. Confirm English renders correctly (all strings present, no raw keys visible)
3. Open Settings → change language → verify all static labels, button titles, tooltips, and placeholders update without page reload
4. Add a text module → verify placeholder and header buttons are translated
5. Switch to Play mode → verify mode label translates
6. Switch back to English → confirm everything reverts cleanly
7. Reload the symbiote → confirm saved language preference is applied on startup
