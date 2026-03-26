# CLAUDE.md

Character Vault is a TaleSpire Symbiote — a vanilla HTML/CSS/JS character sheet engine running inside TaleSpire's embedded Chromium browser. No build step; files ship as-is.

## What to Read

| Task | Read first |
|---|---|
| Code map, script load order, data structures, event flows | `_DOCS/ARCHITECTURE.md` |
| Add or modify a module type | `_DOCS/NEW_MODULE_GUIDE.md`, then `_DOCS/ARCHITECTURE.md` (MODULE_TYPES registry) |
| Work on a specific submodule (stats, health, etc.) | `_DOCS/SUBMODULES/<NAME>.md` |
| Module/layout system concepts | `_DOCS/MODULES.md` |
| Tab system | `_DOCS/TABS.md` |
| Color tokens or themes | `_DOCS/COLORS.md` |
| Translations / i18n | `_DOCS/LOCALIZATION.md` |
| Settings overlay | `_DOCS/SETTINGS_MENU.md` |
| Overall design goals | `_DOCS/_DESIGN.md` |
| Past implementation plans | `_DOCS/plans/` |

## Project Structure

```
Root:       manifest.json  main.html  main.css  README.md  LICENSE.txt
scripts/:   translations.js  shared.js  i18n.js  theme.js  settings.js
            persistence.js  module-core.js  module-text.js  module-stat.js
            module-health.js  module-hr.js  module-spacer.js  app.js
_DOCS/:     Architecture, design, color/tab/module/localization/settings refs
  SUBMODULES/:  Per-submodule design notes (STATS.md, HEALTH.md, etc.)
  plans/:       Saved implementation plans (kebab-case filenames)
_localStorage/: User save data (gitignored — never commit)
```

Per-file descriptions live in `_DOCS/ARCHITECTURE.md` § "Files at a Glance".

## Rules

1. **Never modify `LICENSE.txt`** without explicit user permission.
2. **Use `--cv-*` color tokens** for all CSS. Never hardcode hex values outside theme definition blocks. See `_DOCS/COLORS.md`.
3. **New module types must call `registerModuleType()`**. Never duplicate the module shell markup. See the `'text'` registration as the reference pattern.
4. **Insert new module types alphabetically** in the create wizard by display label.
5. **All UI text must be `user-select: none`**. Only user content and interactive elements (inputs, textareas, rendered markdown) opt in with `user-select: text`.
6. **Call `scheduleSave()` after any mutation to module state**. It debounces (2 s) into `saveCharacter()`. Never call `saveCharacter()` directly from event handlers.
7. **Use `escapeHtml()`** (in `shared.js`) when interpolating user-provided strings into HTML.
8. **Use `null`, not `undefined`**, for intentionally empty values (e.g., `title: null`, `theme: null`) — ensures clean JSON serialization.
9. **Inline SVG icons only** — `<svg class="icon">` with `stroke="currentColor"`. Do **not** use CSS `mask-image` (broken in TaleSpire's Chromium).
10. **After exiting plan mode, offer to save the plan** to `_DOCS/plans/` with a kebab-case filename. Never save plans to `~/.claude/plans`.
11. **No line numbers in `_DOCS/ARCHITECTURE.md`** — reference sections and function names instead.
12. **All `.js` files go in `scripts/`** — never create JavaScript files in the project root or any other directory.

## Conventions

- **Console logging**: Prefix all messages with `[CV]` — e.g., `console.log('[CV] Module created')`.
- **DOM-to-data binding**: Modules store `data-id` and `data-type` on their root `.module` element. Look up data via `modules.find(m => m.id === el.dataset.id)`.
- **SVG icon shapes**: Prefer basic shapes (`<line>`, `<circle>`, `<rect>`, `<polyline>`) for simple icons; use `<path d="...">` for complex geometry (gears, pencils, etc.).
- **i18n**: Static text uses `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` attributes. Dynamic text calls `t(key, replacements?)`. All user-visible strings must be translatable.
- **Script load order matters**: Sequential `<script>` tags, no `async`/`defer`. Later scripts depend on globals from earlier ones. See `_DOCS/ARCHITECTURE.md` § "Script Load Order".
- **Section headers**: `// ── Name ──` in JS, `/* ── Name ── */` in CSS.
- **TaleSpire icon reference**: https://symbiote-docs.talespire.com/icons.html

## Gotchas / Constraints

- **No build system.** No bundler, transpiler, or npm. Vanilla HTML/CSS/JS served raw by TaleSpire's embedded Chromium.
- **`mask-image` does not render** in TaleSpire's Chromium. Always use inline SVGs.
- **z-index layers**: 300 = delete confirm, 200 = settings/wizard overlays, 100 = menu bar + dragging module, 50 = resizing module, 10 = resize handle.
- **Grid layout**: `#module-grid` is a 4-column CSS Grid, 8px gap. Modules span 1–4 columns. Fixed row height = `rowSpan * 80px + (rowSpan - 1) * 8px`.
- **`TS.*` API unavailable** when previewing in VS Code — guard calls with `typeof TS !== 'undefined'` or test in TaleSpire directly.
- **`_localStorage/`** contains user save data — gitignored, never commit.
- **This is the `Character Vault DEV` instance** — changes are tested live in TaleSpire but can be roughly previewed in VS Code's HTML Preview tab.

## Terminology

| Term | Meaning |
|---|---|
| **Module** | A container (card) on the grid. Holds content for one submodule type. |
| **Submodule** | An individual component (Stats, Health, Spells, etc.) that defines a module's behavior. Do not use "module" and "submodule" interchangeably. |
| **Module toolbar** | The bar at the top of a module (drag handle, title, action buttons). |
| **Module overlay menu** | The compact menu shown when a module is too small for its module toolbar. Also called "module menu". |
| **Wizard** | The "New Module" creation overlay (type selection, color picker). |
