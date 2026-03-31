# Module Misalignments & ToDo List

After reviewing the current implementation and documentation against our newly established `module_design_patterns.md`, I've identified several active misalignments, outdated documents, and UI inconsistencies that we need to address. 

## Outstanding ToDos

### 1. Resistances Module Updates
**Files to reference:**
- `_DOCS/SUBMODULES/RESISTANCES.md`
- `scripts/module-resistance.js`
- `main.css`

**Guidance:**
- **[ ] Outdated Documentation:** The `RESISTANCES.md` file has a section for "Pending Features" referencing the `active` toggle in Play mode. We recently removed this interaction because it interfered with the TaleSpire `diceFinder` API. Update the documentation to remove this "pending" feature.
- **[ ] Missing UI Feature:** The documentation defines a layout structure `layout: 'columns' | 'rows'`, but explicitly notes there is no UI. We need to either create a `.module-swaplayout-btn` (similar to `module-stat.js`) and wire it up, or entirely strip the horizontal/vertical layout modes from `module-resistance.js` and `RESISTANCES.md`.

### 2. Icon Library Centralization
**Files to reference:**
- `_DOCS/SUBMODULES/COUNTERS.md`, `_DOCS/SUBMODULES/LIST.md`, `_DOCS/SUBMODULES/RESISTANCES.md`
- `scripts/module-counters.js`, `scripts/module-list.js`, `scripts/module-resistance.js`
- `main.html` (or wherever standard SVGs are placed/referenced)

**Guidance:**
- **[ ] Consolidate Icon Sets:** Currently, `Counters` has 32 distinct icons, `Lists` has 27, and `Resistances` has 13. Create a unified, global standard `CV_ICONS` SVG library object (perhaps in `shared.js` or `main.html`) and update all three modules' wizard pickers to pull from this single source. Update the individual `SUBMODULE` docs to reference the global library rather than duplicating the icon lists.

### 3. Deletion UX Concurrency
**Files to reference:**
- `scripts/module-list.js` (look for item deletion logic)
- `scripts/module-counters.js` (look for counter modal deletion logic)
- `scripts/module-core.js` (for the standard `openDeleteConfirm` method)
- `_DOCS/SUBMODULES/LIST.md`, `_DOCS/SUBMODULES/COUNTERS.md`

**Guidance:**
- **[ ] Standardize Row/Item Deletion Flow:** Decide securely if nested elements (like list items or counters) require `z-index: 300` confirmation popups or if they instantly delete. Currently `LIST.md` specifies "No confirmation needed" whereas `COUNTERS.md` enforces it. Update both the code (`deleteItem()` / `deleteCounter()`) and the documentation to match the decided universal policy.

### 4. Sorting Indicator Validation
**Files to reference:**
- `scripts/module-counters.js`
- `scripts/module-list.js`
- `main.css`

**Guidance:**
- **[ ] Visual Indicator Audit:** Code review the sorting logic within both `Counters` and `List` scripts to ensure they are utilizing the exact same CSS classes (e.g., `.sort-asc`, `.sort-desc`) and rendering the identical SVG caret/arrow indicators. Consolidate any duplicate CSS logic into `main.css`.

### 5. Quick-Edit (Ctrl+Click) Consistency
**Files to reference:**
- `scripts/module-stat.js` (as the reference implementation for Quick-Edit)
- `scripts/module-list.js`
- `scripts/module-counters.js`
- `scripts/module-resistance.js`
- Respective `_DOCS/SUBMODULES/` markdown files.

**Guidance:**
- **[ ] Expand Ctrl+Click Paradigm:** Implement the satisfying `Ctrl+Click` interaction from the Stat module across other modules. It should allow a user in Play mode to perform an immediate inline edit (e.g., editing List Item names, Counter magnitudes, or Resistance values) without toggling the entire module to Edit mode. Add the corresponding event listeners to `module-list.js`, `module-counters.js`, and `module-resistance.js` and update their Markdown documentation.
