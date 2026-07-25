# CLAUDE.md

Character Vault is a TaleSpire Symbiote — a vanilla HTML/CSS/JS character sheet engine running inside TaleSpire's embedded Chromium browser. No build step; files ship as-is.

## What to Read

| Task | Read first |
|---|---|
| Code map, script load order, data structures, event flows | `_DOCS/ARCHITECTURE.md` |
| Cross-module APIs, stat linking, data hooks, game systems | `_DOCS/PATTERNS.md` |
| Dice rolling, TaleSpire API, pool mechanics, game system features | `_DOCS/DICE_MECHANICS.md` |
| TaleSpire host API, async gotchas, event subscriptions, TS guards | `_DOCS/TALESPIRE_API.md` |
| Writing vitest tests, script chain setup, test patterns | `_DOCS/TESTING.md` |
| Weapon traits, enhancement catalog, pool auto-compute, attack archetypes | `_DOCS/WEAPON_ENHANCEMENTS.md` |
| Responsive size classes, ResizeObserver, grid layout, scrollbar rules | `_DOCS/RESPONSIVE_LAYOUT.md` |
| Add or modify a module type | `_DOCS/NEW_MODULE_GUIDE.md`, then `_DOCS/ARCHITECTURE.md` (MODULE_TYPES registry) |
| Build or fix a modal/dialog | `_DOCS/NEW_MODAL_GUIDE.md` |
| Work on a specific submodule (stats, health, etc.) | `_DOCS/SUBMODULES/<NAME>.md` — Available: ABILITIES, ACTIVITY_LOG, CHARACTER_LEVEL, COMPANIONS, CONDITIONS, COUNTERS, HEALTH, LANGUAGES, LIST, RESISTANCES, REST, SAVING_THROWS, SPACER, SPELLS, STATS, TEXT_BOX, WEAPONS |
| Module/layout system concepts | `_DOCS/MODULES.md` |
| Tab system | `_DOCS/TABS.md` |
| Color tokens or themes | `_DOCS/COLORS.md` |
| Translations / i18n | `_DOCS/LOCALIZATION.md` |
| Settings overlay | `_DOCS/SETTINGS_MENU.md` |
| Overall design goals | `_DOCS/_DESIGN.md` |
| UI component standards (scrollbars, modals, toggles, textareas, icons, z-index) | `_DOCS/UI_STANDARDS.md` |
| Past implementation plans | `_DOCS/plans/` |

## Project Structure

Per-file descriptions, script load order, and CSS cascade: `_DOCS/ARCHITECTURE.md` § "Files at a Glance".

## Commands

```bash
npm run test        # Run vitest test suite (single pass)
npm run test:watch  # Run vitest in watch mode
npm run lint        # ESLint check on scripts/
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier format scripts/
```

## Rules

1. **Never modify `LICENSE.txt`** without explicit user permission.
2. **Use `--cv-*` color tokens** for all CSS. Never hardcode hex values outside theme definition blocks. See `_DOCS/COLORS.md`.
3. **New module types must call `registerModuleType()`**. Never duplicate the module shell markup. See the `'text'` registration as the reference pattern.
4. **Insert new module types alphabetically** in the create wizard by display label.
5. **Call `scheduleSave()` after any mutation to module state**. It debounces (2 s) into `saveCharacter()`. Never call `saveCharacter()` directly from event handlers.
6. **Use `escapeHtml()`** (in `shared.js`) when interpolating user-provided strings into HTML.
7. **Use `null`, not `undefined`**, for intentionally empty values (e.g., `title: null`, `theme: null`) — ensures clean JSON serialization.
8. **Plan files always go in `_DOCS/plans/`** with a descriptive kebab-case filename (e.g., `spell-category-collapse.md`). This applies both when exiting plan mode (offer to save) and when asked to "write a plan" / "create a plan". Never use auto-generated random names.
9. **All `.js` files go in `scripts/`** — never create JavaScript files in the project root or any other directory.
10. **All user-visible strings must be translatable** — every hardcoded text string is a bug. Use `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` attributes for static text, or call `t(key, replacements?)` for dynamic text. See `_DOCS/LOCALIZATION.md`.
11. **Update `_DOCS/ARCHITECTURE.md` inline** whenever: a new file is added to `scripts/` or `css/`, a new `registerModuleType()` is registered, or a new major CSS `/* ── Section ── */` block is introduced. Do this as part of the same task — not as a post-task cleanup step.
12. **Module scripts use IIFE + selective `window` exposure.** Wrap each `scripts/module-*.js` in an IIFE to keep DOM/event/render helpers out of the global namespace. At the bottom of the IIFE, expose any *pure, testable* functions (data transforms, shape guards, validation, calculations) on `window` so vitest can reach them. DOM/render/event handlers stay private. Reference: `module-stat.js` — see `_DOCS/SUBMODULES/STATS.md` § "Globals Exposed" for the canonical pattern.
13. **Add vitest tests when adding pure functions.** When introducing new pure logic (data transforms, shape guards, validation, template application, dice/notation parsing, math helpers), add corresponding unit tests under `tests/` as part of the same task. DOM rendering, event wiring, and TaleSpire-API-dependent code are exempt. Load the script chain via `loadScript()`, mock globals in `beforeEach`, and call the function via `window.<name>` (see rule 12).
14. If following a plan document, always mark the plan as completed at the top of the file so we do not accidentally attempt to implement it again.
15. When given a plan document with phases, implement the phase immediately without entering plan mode. Do not re-explore or re-read the entire codebase if the plan already specifies what to do. After completing a phase, always mark it as complete in the plan document.
16. When asked to review, simplify, or clean up code, only review the changes made in the current session or the specific files/functions mentioned — not the entire file or codebase unless explicitly asked.
17. **Phased plan documents**: each phase is intended to run in its own context window. Mark completed phases clearly in the plan document as you finish them.
18. **Locale edits must be total**: when editing any localized string, update ALL locale files (currently 7–8 languages). Treat an ellipsis (`...`) in user messages as a continuation indicator — never insert it as literal text.
19. **Unicode / Edit tool caution**: when editing files that contain Unicode characters or escape sequences, match exact characters. If the Edit tool fails to match, re-read the exact lines before retrying — do not fall back to PowerShell/bash heredoc workarounds.
20. **Follow UI component standards** in `_DOCS/UI_STANDARDS.md` — covers text selection, icons, tooltips, drag-to-reorder, play/edit mode, modals, scrollbars, textareas, toggles, and z-index layers.


## Conventions

- **Console logging**: Prefix all messages with `[CV]` — e.g., `console.log('[CV] Module created')`.
- **DOM-to-data binding**: Modules store `data-id` and `data-type` on their root `.module` element. Look up data via `modules.find(m => m.id === el.dataset.id)`.
- **Section headers**: `// ── Name ──` in JS, `/* ── Name ── */` in CSS.
- **TaleSpire icon reference**: https://symbiote-docs.talespire.com/icons.html

## Gotchas / Constraints

- **No build system.** No bundler, transpiler, or npm. Vanilla HTML/CSS/JS served raw by TaleSpire's embedded Chromium.
- **Grid layout**: `#module-grid` is a 4-column CSS Grid, 8px gap. Modules span 1–4 columns. Fixed row height = `rowSpan * 80px + (rowSpan - 1) * 8px`.
- **`TS.*` API unavailable** when previewing in VS Code — guard calls with `typeof TS !== 'undefined'` or test in TaleSpire directly.
- **`TS.dice.putDiceInTray()` returns `Promise<string>`**, not `string` — the API docs say `string` but it's async. Always use `.then(rollId => ...)` to capture the rollId. `TS.dice.evaluateDiceResultsGroup()` is also async — use `await`. See `handleRollResult` in `scripts/module-activity.js` for the canonical pattern.
- **`_localStorage/`** contains user save data — gitignored, never commit.

## Terminology

| Term | Meaning |
|---|---|
| **Module** | A container (card) on the grid. Holds content for one submodule type. |
| **Submodule** | An individual component (Stats, Health, Spells, etc.) that defines a module's behavior. Do not use "module" and "submodule" interchangeably. |
| **Module toolbar** | The bar at the top of a module (drag handle, title, action buttons). |
| **Module overlay menu** | The compact menu shown when a module is too small for its module toolbar. Also called "module menu". |
| **Wizard** | The "New Module" creation overlay (type selection, color picker). |

## Response behavior
- Do not tell me how to test the symbiote at the end of code changes, we're wasting tokens. Just tell me you're done with the work.

