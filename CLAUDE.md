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
9. **Inline SVG icons only** — Use the curated in-code SVG library to avoid memory bloat from custom image uploads. The "None" option should sit first in icon pickers. Do **not** use CSS `mask-image` (broken in TaleSpire's Chromium).
10. **Module toolbar buttons must have `title` attributes** for custom CSS tooltips (native `title` tooltips don't render in TaleSpire's Chromium). Rightmost buttons need the right-anchored tooltip override (see `.module-delete-btn[title]::after` in `main.css`).
11. **After exiting plan mode, offer to save the plan** to `_DOCS/plans/` with a kebab-case filename. Never save plans to `~/.claude/plans`.
12. **No line numbers in `_DOCS/ARCHITECTURE.md`** — reference sections and function names instead.
13. **All `.js` files go in `scripts/`** — never create JavaScript files in the project root or any other directory.
14. **Use SortableJS for all drag-to-reorder** — never write custom pointer/mouse-based drag systems. SortableJS is already loaded via CDN. Follow the existing pattern: `handle`, `animation: 150`, `ghostClass`, `draggable`, and `onEnd`. See `initStatSortable()` or `initListSortable()` as references. **Important:** Disable SortableJS manual drag-to-reorder if your module uses column header sorting and an auto-sort (asc/desc) is active.
15. **Play vs Edit Mode interaction rules**: Play mode is read-only, optimized for simple in-game actions. Edit mode allows structure and data modification. Critical stats/values should support Quick Edit (Ctrl+Click) in Play mode to bypass a full mode switch.
16. **Modal and Overlay standard**: Modals must include standard action buttons (`[Save]`/`[Create]`, `[Cancel]`/`[Close]`, and an `[X]` top-right). If editing an existing entity, consider a `[Delete]` button. Always prompt for unsaved changes if the modal is dismissed with edits pending. Values should clamp live during input to prevent invalid states.
17. **Scrollbar layout shift prevention**: All scrollable containers must use `scrollbar-gutter: stable;` to reserve scrollbar space. This prevents jarring content shifts when scrollbars appear or disappear. Apply to any element with `overflow-y: auto` or `overflow-x: auto`.

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
- **z-index layers**: 300 = delete confirm, 200 = settings/wizard overlays, 100 = menu bar + dragging module, 60 = resize handle, 50 = resizing module.
- **Grid layout**: `#module-grid` is a 4-column CSS Grid, 8px gap. Modules span 1–4 columns. Fixed row height = `rowSpan * 80px + (rowSpan - 1) * 8px`.
- **`TS.*` API unavailable** when previewing in VS Code — guard calls with `typeof TS !== 'undefined'` or test in TaleSpire directly.
- **`_localStorage/`** contains user save data — gitignored, never commit.

## Terminology

| Term | Meaning |
|---|---|
| **Module** | A container (card) on the grid. Holds content for one submodule type. |
| **Submodule** | An individual component (Stats, Health, Spells, etc.) that defines a module's behavior. Do not use "module" and "submodule" interchangeably. |
| **Module toolbar** | The bar at the top of a module (drag handle, title, action buttons). |
| **Module overlay menu** | The compact menu shown when a module is too small for its module toolbar. Also called "module menu". |
| **Wizard** | The "New Module" creation overlay (type selection, color picker). |

## Reponse behavior
- Do not tell me how to test the symbiote at the end of code changes, we're wasting tokens. Just tell me you're done with the work.