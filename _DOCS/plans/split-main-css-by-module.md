# Split main.css by Module

## Context

`main.css` is 8,077 lines across 117 named sections. The JS side already splits cleanly by module (`scripts/module-spells.js`, `scripts/module-health.js`, etc.). CSS does not follow that convention — everything lives in one monolithic file. This makes it difficult for LLMs (and humans) to work on a single submodule's styles in isolation. Since TaleSpire's embedded Chromium loads files locally, there is zero network penalty for multiple `<link>` tags.

**Goal:** Split `main.css` into focused files that mirror the JS module structure, without introducing any behavioral or visual changes.

---

## Proposed File Structure

All CSS files go in a new `styles/` directory (mirroring `scripts/`). `main.html` gets one `<link>` per file, in cascade order.

### Load order in `main.html` (replace the single `<link rel="stylesheet" href="main.css">`)

```html
<!-- Foundation -->
<link rel="stylesheet" href="styles/theme.css">
<link rel="stylesheet" href="styles/foundation.css">
<link rel="stylesheet" href="styles/chrome.css">
<link rel="stylesheet" href="styles/module-core.css">

<!-- Submodule-specific -->
<link rel="stylesheet" href="styles/module-hr.css">
<link rel="stylesheet" href="styles/module-spacer.css">
<link rel="stylesheet" href="styles/module-stat.css">
<link rel="stylesheet" href="styles/module-abilities.css">
<link rel="stylesheet" href="styles/module-health.css">
<link rel="stylesheet" href="styles/module-level.css">
<link rel="stylesheet" href="styles/module-list.css">
<link rel="stylesheet" href="styles/module-resistance.css">
<link rel="stylesheet" href="styles/module-condition.css">
<link rel="stylesheet" href="styles/module-counters.css">
<link rel="stylesheet" href="styles/module-savingthrow.css">
<link rel="stylesheet" href="styles/module-spells.css">
```

### What goes in each file

| File | Sections from main.css |
|---|---|
| `styles/theme.css` | Dark Theme, Light Theme, Cyberpunk, Sci-Fi, Angelic, Demonic (lines 1–151) |
| `styles/foundation.css` | Icon System, Reset, Consolidated Button & UI Base Classes (152–354) |
| `styles/chrome.css` | Top Menu Bar → Settings Footer (355–757) |
| `styles/module-core.css` | Module Grid, Module Shell, Toolbar, Overflow Menu, Shared Modal, Delete Confirm, Markdown, Resize Handle, Drag & Drop, Responsive Size Classes, Custom Select (cv-select), Wizard Overlay, Attribute Wizard, Toast Notifications (759–1604 + 2986–3234 + 3870–4342 + 5034–5084) |
| `styles/module-hr.css` | Horizontal Line Module (1606–1717) |
| `styles/module-spacer.css` | Spacer Module (1718–1785) |
| `styles/module-stat.css` | Stat Module (1786–2104) |
| `styles/module-abilities.css` | Abilities Module (2105–2386) |
| `styles/module-health.css` | Health Module (2387–2685) |
| `styles/module-level.css` | Level Module (2686–2985) |
| `styles/module-list.css` | List Module, List Column Headers, List Attribute Cells, Cross-List Drag, List Manage Attributes, List Inspect Overlay (3235–3869 + 5085–5356) |
| `styles/module-resistance.css` | Resistance Module (4343–5033) |
| `styles/module-condition.css` | Condition Module (5357–6614) |
| `styles/module-counters.css` | Counters Module (6615–7044) |
| `styles/module-savingthrow.css` | Saving Throws Module (7045–7556) |
| `styles/module-spells.css` | Spells Module (7557–8077) |

---

## Critical Files to Modify

- `main.html` — replace single `<link>` with 17 `<link>` tags (in head, before `</head>`)
- `main.css` — delete after split is confirmed working (or keep as redirect/archive)
- `_DOCS/ARCHITECTURE.md` — update "Files at a Glance" and CSS section to reference `styles/` directory

---

## Risks & Mitigations

- **CSS cascade depends on link order** — the order in the table above preserves the current top-to-bottom cascade. Do not reorder `<link>` tags.
- **Non-obvious section ownership** — some sections (cv-select, Responsive Size Classes, Toast, Wizard) are not tied to one module. These go in `module-core.css` since they're shared infrastructure.
- **List Inspect Overlay lives at line 5085** (after Resistance sections) but belongs to the List module — it goes in `module-list.css`.
- **Specificity bugs are silent** — visual regression test by loading in TaleSpire and cycling through all module types in both play and edit mode before deleting `main.css`.

---

## Verification

1. Add all 17 `<link>` tags to `main.html`, keeping `main.css` link intact temporarily.
2. Load in TaleSpire — visually confirm nothing changed (duplicate styles are harmless).
3. Remove `main.css` `<link>`.
4. Test all submodule types in play and edit mode.
5. Confirm themed scrollbars, drag ghost styles, modals, tooltips, and responsive breakpoints all render correctly.
6. Delete `main.css` from disk.

---

## Notes

**Decision context (2026-04-07):** Decided to defer the CSS split. While architecturally sound, the motivation was accommodating a possibly-not-yet-adopted tool (Gemma4 local LLM). The split carries real cascade risk and migration effort. Best trigger for revisiting: when a context-limited LLM is actually in the regular workflow. Claude Code handles the current 8K-line file fine.
