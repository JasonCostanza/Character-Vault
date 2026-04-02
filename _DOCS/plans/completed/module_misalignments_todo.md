# Module Misalignments & ToDo List

After reviewing the current implementation and documentation against our newly established `module_design_patterns.md`, I've identified several active misalignments, outdated documents, and UI inconsistencies that we need to address. 

## Outstanding ToDos

### 1. Resistances Module Updates
**Files to reference:**
- `_DOCS/SUBMODULES/RESISTANCES.md`
- `scripts/module-resistance.js`
- `main.css`

**Guidance:**
- **[x] Outdated Documentation:** Updated `RESISTANCES.md` — active toggle and layout swap are both fully implemented. Removed all "not yet implemented" language.
- **[x] Missing UI Feature:** Layout swap button (`.module-res-layout-btn`) was already implemented in `module-core.js`. Docs updated to reflect this.

### 2. Icon Library Centralization
**Files to reference:**
- `_DOCS/SUBMODULES/COUNTERS.md`, `_DOCS/SUBMODULES/LIST.md`, `_DOCS/SUBMODULES/RESISTANCES.md`
- `scripts/module-counters.js`, `scripts/module-list.js`, `scripts/module-resistance.js`
- `main.html` (or wherever standard SVGs are placed/referenced)

**Guidance:**
- **[x] Consolidate Icon Sets:** Created unified `CV_ICONS` in `shared.js` (~68 icons). All three modules now reference the shared library. Per-module category filtering deferred to `_DOCS/plans/icon-picker-filtering.md`.

### 3. Deletion UX Concurrency
**Files to reference:**
- `scripts/module-list.js` (look for item deletion logic)
- `scripts/module-counters.js` (look for counter modal deletion logic)
- `scripts/module-core.js` (for the standard `openDeleteConfirm` method)
- `_DOCS/SUBMODULES/LIST.md`, `_DOCS/SUBMODULES/COUNTERS.md`

**Guidance:**
- **[x] Standardize Row/Item Deletion Flow:** Documented tiered deletion policy in `_DOCS/_DESIGN.md`. Current behavior is consistent: inline row deletes are instant, modal/destructive deletes require confirmation. No code changes needed.

### 4. Sorting Indicator Validation
**Files to reference:**
- `scripts/module-counters.js`
- `scripts/module-list.js`
- `main.css`

**Guidance:**
- **[x] Visual Indicator Audit:** Extracted shared `CV_SVG_SORT_UP` / `CV_SVG_SORT_DOWN` to `shared.js`. Updated counters, lists, and conditions modules to reference them. Consolidated `.active-sort` CSS into a single shared rule. Removed duplicate `.cond-sort-indicator` CSS (conditions now uses `.list-sort-indicator`).

### 5. Quick-Edit (Ctrl+Click) Consistency
**Files to reference:**
- `scripts/module-stat.js` (as the reference implementation for Quick-Edit)
- `scripts/module-list.js`
- `scripts/module-counters.js`
- `scripts/module-resistance.js`
- Respective `_DOCS/SUBMODULES/` markdown files.

**Guidance:**
- **[x] Expand Ctrl+Click Paradigm:** Deferred to a standalone plan — see `_DOCS/plans/ctrl-click-quick-edit-expansion.md`.
