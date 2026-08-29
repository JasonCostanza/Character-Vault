# SortableJS Drag UX Polish

## Status: ✅ COMPLETE — all phases implemented

## Context

Character Vault has 20 SortableJS instances across the codebase. They all work, but the visual feedback is inconsistent — ghost placeholders use different opacities, border widths, border colors, and backgrounds depending on which submodule you're in. The item being dragged gets no visual enhancement in any context except the module grid. Drag handle hover behavior varies from "always visible" to "fade on hover" to "no hover state at all." The result is functional but unpolished — each submodule feels like it was styled independently (because it was).

This plan unifies the drag experience so it feels like one cohesive system: same ghost, same "held item" ring, same handle behavior everywhere.

---

## Phase 1: Unified Ghost CSS — ✅ COMPLETE

**Goal**: All ghost placeholders use the same visual recipe. Per-context overrides allowed only for `border-radius`.

### 1.1 — Add canonical `.cv-drag-ghost` to `css/components.css`

Add a `/* ── Drag & Drop ── */` section (after the `.cv-scroll` block):

```css
.cv-drag-ghost {
    opacity: 0.3;
    border: 2px dashed var(--cv-accent);
    background-color: var(--cv-bg-sunken);
    box-shadow: none;
}
```

### 1.2 — Align divergent ghost classes

These already match the canonical values — just remove any `!important`:
- `css/tabs.css` `.tab-ghost` — remove `!important` from border and background
- `css/sub-savingthrow.css` `.save-ghost` — remove `!important` from border

These need property fixes:
- `css/sub-list.css` `.list-attr-ghost` — `transparent` bg → `var(--cv-bg-sunken)`
- `css/sub-companions.css` `.companion-attr-ghost` — `1px` border → `2px`
- `css/sub-spells.css` `.spells-attr-ghost` — `1px` border → `2px`
- `css/sub-resistance.css` `.res-ghost` — border `1px` → `2px`, remove `!important`; bg `transparent` → `var(--cv-bg-sunken)`, remove `!important`; opacity `0.4` → `0.3`
- `css/sub-condition.css` `.cond-ghost` — same three fixes as `.res-ghost`
- `css/sub-weapons.css` `.weapon-ghost` — border `1px` → `2px`, remove `!important`; bg `color-mix(...)` → `var(--cv-bg-sunken)`, remove `!important`; opacity `0.4` → `0.3`
- `css/sub-recovery.css` `.recovery-btn-ghost` — same three fixes as `.weapon-ghost`
- `css/sub-actions.css` `.actions-pill.cv-drag-ghost` — border color `--cv-border` → `--cv-accent`; bg `transparent` → `var(--cv-bg-sunken)`; opacity `0.5` → `0.3`; add `border-radius: 20px` (pill shape override)
- `css/sub-defenses.css` `.def-manage-row.cv-drag-ghost, .def-qd-row.cv-drag-ghost` — border `1px dashed --cv-text-muted` → `2px dashed var(--cv-accent)`; add `background-color: var(--cv-bg-sunken)`; opacity `0.4` → `0.3`; keep `border-radius: 4px`

**Files touched**: `css/components.css`, `css/tabs.css`, `css/sub-savingthrow.css`, `css/sub-list.css`, `css/sub-companions.css`, `css/sub-spells.css`, `css/sub-resistance.css`, `css/sub-condition.css`, `css/sub-weapons.css`, `css/sub-recovery.css`, `css/sub-actions.css`, `css/sub-defenses.css`

---

## Phase 2: Chosen-Class Enhancement — ✅ COMPLETE

**Goal**: The item being dragged gets a subtle accent ring so users can distinguish "what I'm holding" from "where it will land." Module grid already has this via `module-dragging`; all other sortables need it.

### 2.1 — Add `.cv-drag-chosen` to `css/components.css`

Append to the `/* ── Drag & Drop ── */` section:

```css
.cv-drag-chosen {
    outline: 2px solid var(--cv-accent);
    outline-offset: 1px;
    z-index: 1;
}
```

`outline` is layout-neutral (no border-box impact). `z-index: 1` lifts the item above siblings during drag.

### 2.2 — Update `initManageListSortable` in `scripts/shared.js`

Add `chosenClass` with a default so all 9 callers get the effect for free:

```js
chosenClass: options.chosenClass ?? 'cv-drag-chosen',
```

### 2.3 — Add `chosenClass: 'cv-drag-chosen'` to 11 standalone Sortable instances

After each existing `ghostClass:` line, add `chosenClass: 'cv-drag-chosen',`:

- `scripts/module-defenses.js` — QD list sortable
- `scripts/module-companions.js` — companion table sortable
- `scripts/module-savingthrow.js` — tier list sortable
- `scripts/module-actions.js` — actions pill sortable
- `scripts/module-condition.js` — staging grid AND applied list sortables (2 instances)
- `scripts/module-list.js` — list item sortable
- `scripts/module-resistance.js` — staging grid AND column list sortables (2 instances)
- `scripts/tabs.js` — tab sortable
- `scripts/module-weapons.js` — weapon manage sortable

Do NOT touch `module-core.js` — it already has `chosenClass: 'module-dragging'`.

**Files touched**: `css/components.css`, `scripts/shared.js`, plus 9 module scripts

---

## Phase 3: Drag Handle Consistency — ✅ COMPLETE

**Goal**: Submodule inline drag handles use a consistent dim-to-reveal pattern: `opacity: 0.5` at rest → `opacity: 1` on hover, with `transition: opacity 0.15s ease`.

### Handles to update

| Handle | File | Change |
|---|---|---|
| `.tab-drag-handle` | `css/tabs.css` | `0.35` → `0.5`, hover `0.7` → `1`, add transition |
| `.companion-drag-handle` | `css/sub-companions.css` | Add `opacity: 0.5`, add transition (hover already `1`) |
| `.companion-attr-drag-handle` | `css/sub-companions.css` | Add `opacity: 0.5`, add transition (hover already `1`) |
| `.spells-attr-drag-handle` | `css/sub-spells.css` | Add `opacity: 0.5`, add transition (hover already `1`) |
| `.list-item-drag-handle` | `css/sub-list.css` | Already `0.5` → `1`; just add transition |
| `.save-tier-drag-handle` | `css/sub-savingthrow.css` | `0.6` → `0.5`, add transition |
| `.recovery-btn-drag-handle` | `css/sub-recovery.css` | Already `0.5`; add transition + add `:hover { opacity: 1; }` |
| `.actions-drag-handle` | `css/sub-actions.css` | Add `opacity: 0.5`, add transition, add `:hover { opacity: 1; }` |
| `.def-qd-drag-handle` | `css/sub-defenses.css` | Add `opacity: 0.5`, add transition, add `:hover { opacity: 1; }` |

### Leave unchanged

- `.module-drag-handle` — reveal-on-card-hover pattern is intentional
- `.list-attr-drag-handle`, `.def-manage-row` handles — management panel context (always visible)
- `.hline-drag-handle`, `.spacer-drag-handle` — always visible on layout modules by design

**Files touched**: `css/tabs.css`, `css/sub-companions.css`, `css/sub-spells.css`, `css/sub-list.css`, `css/sub-savingthrow.css`, `css/sub-recovery.css`, `css/sub-actions.css`, `css/sub-defenses.css`

---

## Phase 4: Cleanup — ✅ COMPLETE

### 4.1 — Fix hardcoded color in `css/sub-list.css`

Line ~446: `background: rgba(192, 135, 74, 0.06)` → `background: color-mix(in srgb, var(--cv-accent) 6%, transparent)`

### 4.2 — Remove dead spell-category drag CSS from `css/sub-spells.css`

Remove `.spells-category-ghost` (line 139) and `.spells-cat-drag-handle` + its `:hover` (lines 158-168). No Sortable instance or JS code references these classes.

### 4.3 — Update `_DOCS/UI_STANDARDS.md` Drag-to-Reorder section

Document the canonical ghost and chosen patterns, the border-radius-only override rule, and the handle opacity standard.

### 4.4 — Update `_DOCS/ARCHITECTURE.md`

Add the `/* ── Drag & Drop ── */` section notation under the `css/components.css` entry.
