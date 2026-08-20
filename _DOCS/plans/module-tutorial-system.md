# Module Tutorial System

> **Status:** Phase 1 complete. Phase 2 (content) complete. Phase 3 (verification) complete. All phases done.

## Context

In preparation for 1.0, each module type gets a scoped, paged tutorial accessible via a "Help" entry in the module's overflow (kebab) menu. Each tutorial is 2–5 pages of text + inline icons describing a basic use-case. No monolithic app-wide tutorial — each module teaches itself.

All tutorial text is translatable (7 locale files). Icons are embedded in translated strings via `{icon:name}` placeholder syntax.

---

## Design Decisions

- **Centralized registry** — a single `scripts/tutorials.js` holds all tutorial page definitions and the shared modal renderer. Not split per-module.
- **18 types get tutorials** — all except `hline` and `spacer` (purely visual, no behavior).
- **Close always visible** — Previous/Close/Next in the footer. Previous hidden on page 1, Next hidden on last page (via `visibility: hidden` to preserve layout).
- **Text + inline icons** — body text uses `{icon:name}` placeholders, post-processed to `cvIcon(name, 14)` SVGs.
- **Standard cv-modal** — uses the existing `cv-modal-*` pattern. No custom z-index, no hardcoded colors.
- **Dots are visual only** — not clickable. Navigation via Previous/Next buttons.
- **Help button position** — in the overflow menu, after type-specific items, before Delete.

---

## Phase 1 — Infrastructure ✅ COMPLETE

> Read `_DOCS/NEW_MODAL_GUIDE.md` before starting. Follow the cv-modal patterns exactly.

### 1a. Create `scripts/tutorials.js`

IIFE wrapper. Contains:

**`TUTORIALS` registry object** (empty at first — Phase 2 populates it):
```js
const TUTORIALS = {};
```

**`openTutorialModal(type)`** — the modal renderer:
- Singleton guard: remove existing `.tutorial-overlay`
- Look up `TUTORIALS[type]` — if not found or empty, return silently
- Build `cv-modal-overlay` + `cv-modal-panel` (320px default width)
- Header: `cv-modal-header` with `cv-modal-title` (set from page's `titleKey`) + `cv-modal-close` (standard 12×12 X SVG)
- Body: `cv-modal-body` containing:
  - `.tutorial-body-text` div — `innerHTML` set from `t(page.bodyKey)` with `{icon:name}` replacement
  - `.tutorial-dots` div — one `.tutorial-dot` span per page, active dot gets `.active` class
- Footer: `cv-modal-footer tutorial-footer` (needs `justify-content: space-between`) containing:
  - Previous button (`btn-secondary sm`) — `visibility: hidden` on page 1
  - Close button (`btn-secondary sm`) — always visible
  - Next button (`btn-primary sm`) — `visibility: hidden` on last page
- Track `currentPage` index. Previous/Next update `currentPage`, re-render body text, update title, update dots, update button visibility.
- 4 close paths: X button, Close button, backdrop click, Escape key (document-level listener with cleanup)
- No dirty state, no focus management

**Icon post-processor:**
```js
function renderTutorialText(key) {
    return t(key).replace(/\{icon:(\w[\w-]*)\}/g, (_, name) => cvIcon(name, 14));
}
```

Expose on `window`: `openTutorialModal`

**i18n key convention:** `tutorial.<type>.<pageNum>.title` and `tutorial.<type>.<pageNum>.body`

### 1b. Add Help to overflow menu

In `scripts/module-core.js`, function `openOverflowMenu()` (~line 593):

Insert a Help entry into the `btnDefs` array **after** the type-specific spread and **before** the Delete push. Guard to skip `hline` and `spacer`:

```js
const btnDefs = [
    { onClick: () => openRenameModule(moduleEl, data), label: t('module.rename'), icon: cvIcon('pencil', 14) },
    ...(MODULE_TYPES[data?.type]?.overflowMenuItems?.(moduleEl, data) ?? []),
    // ── Help entry (skip for hline/spacer) ──
    ...(data?.type !== 'hline' && data?.type !== 'spacer'
        ? [{ onClick: () => openTutorialModal(data.type), label: t('module.help'), icon: cvIcon('help-circle', 14) }]
        : []),
    { onClick: () => openDeleteConfirm(data.id), label: t('module.deleteModule'), icon: cvIcon('trash-2', 14), cls: 'danger' },
];
```

### 1c. Add tutorial CSS

In `css/modules.css`, add a new section `/* ── Tutorial Modal ── */`:

```css
/* ── Tutorial Modal ── */
.tutorial-footer {
    justify-content: space-between;
}

.tutorial-body-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cv-text-secondary);
    user-select: none;
}

.tutorial-body-text .icon {
    vertical-align: middle;
    margin: 0 2px;
}

.tutorial-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding-top: 8px;
    user-select: none;
}

.tutorial-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cv-text-muted);
    transition: background 0.15s;
}

.tutorial-dot.active {
    background: var(--cv-accent);
}
```

### 1d. Add script tag to index.html

Add `<script src="scripts/tutorials.js"></script>` — after `shared.js` and `i18n.js`, before module scripts.

Note: the main HTML file may be `main.html` not `index.html` — check which file has the `<script>` tags.

### 1e. Add shared i18n keys

Add to all 7 locale files (`scripts/translations-en.js`, `-de.js`, `-es.js`, `-fr.js`, `-it.js`, `-pt-BR.js`, `-ru.js`):

- `module.help` — "Help" / translated equivalent
- `tutorial.previous` — "Previous" / translated
- `tutorial.next` — "Next" / translated
- `tutorial.close` — "Close" / translated

### 1f. Update ARCHITECTURE.md

Add `tutorials.js` entry to the scripts file list in `_DOCS/ARCHITECTURE.md`.

### 1g. Commit

Commit Phase 1 as a single commit.

---

## Phase 2 — Tutorial Content ✅ COMPLETE

> 6 sequential batches. Each batch is a sub-agent that reads the relevant module source + submodule doc, writes tutorial pages, and commits. Sequential to avoid merge conflicts on shared locale files and `tutorials.js`.

### Content guidelines for each agent

- Read `scripts/module-<type>.js` and `_DOCS/SUBMODULES/<TYPE>.md` to understand the module
- Write 2–5 pages covering "here's how to get started with this module"
- Page 1 should explain what the module is for
- Subsequent pages walk through a basic use-case (adding items, configuring settings, using key features)
- Use `{icon:name}` where referencing UI elements (e.g., `{icon:pencil}` for edit, `{icon:trash-2}` for delete, `{icon:settings}` for settings)
- Add `TUTORIALS.<type>` entries to `scripts/tutorials.js`
- Add `tutorial.<type>.<n>.title` and `tutorial.<type>.<n>.body` keys to all 7 locale files
- Commit the batch before the next agent starts

### Batch assignments

| Batch | Module Types | Focus |
|---|---|---|
| 1 | `stat`, `abilities`, `savingthrow` | Core attribute modules |
| 2 | `health`, `level`, `recovery` | HP/progression modules |
| 3 | `counters`, `list`, `text` | Generic container modules |
| 4 | `spells`, `weapons` | Complex game mechanic modules |
| 5 | `condition`, `defenses`, `resistance` | Status/defense modules |
| 6 | `bio`, `companions`, `actions`, `activity` | Character/tracking modules |

---

## Phase 3 — Verification ✅ COMPLETE

> Single agent after all Phase 2 batches complete.

- ✅ Tutorial modal opens for all 18 module types — `TUTORIALS` registry keys match the 18 `registerModuleType()` types exactly (excluding `hline`/`spacer`), diffed programmatically with no mismatches.
- ✅ All 7 locale files have complete `tutorial.*` keys (no gaps) — 124 required keys (60 pages × title+body, plus `module.help`/`tutorial.previous`/`tutorial.next`/`tutorial.close`) all present in every locale file.
- ✅ `{icon:name}` placeholders render as inline SVGs in the modal body — `renderTutorialText()` replaces `{icon:name}` with `cvIcon(name, 14)`; all referenced icon names (`minus`, `plus`, `x`, `more-vertical`, `help-circle`) exist in `icons.js`, and the returned markup carries the `.icon` class matched by `.tutorial-body-text .icon` CSS.
- ✅ Help entry absent from `hline`/`spacer` overflow menus — `module-core.js` gates the entry on `hasTutorial(data?.type)`, which returns `false` for both since neither has a `TUTORIALS` entry.
- ✅ All 4 close paths work (X, Close, backdrop, Escape) — all four wired in `openTutorialModal()`, with the Escape listener cleaned up on close.
- ✅ Previous/Next navigation and dot indicators update correctly — `renderPage()` updates title, body, dots, and button state on every navigation.
- ✅ Previous hidden on page 1, Next hidden on last page, Close always visible — `prevBtn`/`nextBtn` `.disabled` is toggled based on `currentPage`, and `.tutorial-footer button:disabled { visibility: hidden; }` in `modules.css` hides them while preserving layout; `closeBtn` is never disabled.

---

## Critical Files

| File | Role |
|---|---|
| `scripts/tutorials.js` | **New** — tutorial registry + modal renderer |
| `scripts/module-core.js` | Overflow menu Help entry — `openOverflowMenu()` |
| `css/modules.css` | Tutorial modal CSS section |
| `main.html` (or `index.html`) | Script tag for tutorials.js |
| `scripts/translations-en.js` | English locale keys |
| `scripts/translations-de.js` | German locale keys |
| `scripts/translations-es.js` | Spanish locale keys |
| `scripts/translations-fr.js` | French locale keys |
| `scripts/translations-it.js` | Italian locale keys |
| `scripts/translations-pt-BR.js` | Portuguese (BR) locale keys |
| `scripts/translations-ru.js` | Russian locale keys |
| `_DOCS/ARCHITECTURE.md` | File registry update |

## Existing Code to Reuse

- `cvIcon(name, size)` from `scripts/shared.js` — SVG icon markup
- `t(key, replacements)` from `scripts/i18n.js` — translation function
- `escapeHtml()` from `scripts/shared.js` — HTML escaping
- `cv-modal-*` CSS classes from `css/modules.css` — standard modal structure
- `btn-primary sm`, `btn-secondary sm` — standard button classes
- Reference `_DOCS/NEW_MODAL_GUIDE.md` for modal construction patterns
