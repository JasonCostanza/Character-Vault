# Module Grid Free Placement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status:** COMPLETE. All phases (1: 8 tasks, 2: 3 tasks, 3: 4 tasks) implemented and reviewed clean, full suite green (569/569). Final whole-branch review passed — Ready to merge: Yes, no Critical/Important findings. Implemented on branch `worktree-module-grid-free-placement`.

**Goal:** Replace the module grid's implicit, order-derived auto-repacking with persisted per-module positions (`colStart`/`rowStart`), so modules never move unless the user explicitly moves, resizes, or compacts them.

**Architecture:** Add `colStart`/`rowStart` to module data as the authoritative position. `applyLayout()` becomes a pure paint step (no packing). The existing first-fit bin-packer survives as `packAllModules()`, used only for placing brand-new/legacy-unplaced modules one at a time (via the extracted `findOpenSlot()` primitive) and for the manual "Compact Layout" action. Drag-to-move becomes a custom pointer-drag (mousedown/mousemove/mouseup) replacing SortableJS for the grid only. Resize gets collision-aware clamping via `clampResizeSpan()`.

**Tech Stack:** Vanilla JS (IIFE modules), vitest for pure-function coverage. No build step, no new dependencies — SortableJS remains loaded for other modules (spells, weapons, counters, companions) but is removed from the module grid itself.

**Spec:** This same file, `## Context` and `## Design Decisions` sections above.

## Global Constraints

- No build system — edit `.js`/`.css`/`.html` files directly, no bundler/transpiler.
- New JS files (none needed here) go in `scripts/`; module scripts are IIFEs with selective `window` exposure (rule 12) — pure/testable functions on `window`, DOM/event wiring stays private.
- New pure functions get vitest coverage in the same task (rule 13) — load the script chain via `loadScript()`, mock globals in `beforeEach`, call via `window.<name>`.
- Use `--cv-*` CSS tokens only; no hardcoded hex outside theme blocks.
- Use `escapeHtml()` for any user-provided string interpolated into HTML (not needed in this plan — no new user-string rendering).
- Call `scheduleSave()` after mutating module state; never call `saveCharacter()` directly from handlers.
- Use `null`, not `undefined`, for intentionally empty values — `colStart: null` / `rowStart: null` for unplaced modules.
- All new user-visible strings need `data-i18n`/`t()` entries in all 7 locale files (en, de, es, fr, it, pt-BR, ru).
- Update `_DOCS/ARCHITECTURE.md` inline in the same task that introduces the change (rule 11), not as a follow-up.

---

## Context

The module grid currently has no persisted position. Each module stores only
`order` (an index within its tab), `colSpan`, and `rowSpan`. Every layout pass
(`computeLayout()` in `module-core.js`) re-derives ALL module positions from
scratch via first-fit bin-packing: walk modules by `order`, scan row-major for
the first open slot each one fits. `applyLayout()` re-runs this full repack on
every mutation — create, delete, drag-end, resize, tab switch, and any
ResizeObserver-triggered height snap.

This is the root cause of the grid's "unpredictable" feel: since nothing is
pinned, a single module changing height can cascade-shift everything after it
in packing order. Tuning the packing algorithm doesn't fix this — as long as
position is *derived* from order instead of *stored*, any mutation anywhere
can move any module. The fix is to persist real per-module positions and stop
auto-repacking on mutation, letting users place modules (and leave gaps)
exactly where they want.

## Design Decisions

- **Persisted position** — add `colStart` / `rowStart` to each module's data
  alongside existing `colSpan`/`rowSpan`. These become the authoritative
  position. `order` remains for DOM-insertion/tab-history bookkeeping only —
  it no longer drives layout.
- **No automatic repacking** — `applyLayout()` becomes a pure paint step:
  read each module's stored `colStart`/`rowStart`/`colSpan`/`rowSpan` and set
  `grid-column`/`grid-row` directly. No packing, no cascading shifts, on any
  mutation (create, delete, resize, tab switch, ResizeObserver snap).
- **First-fit bin-packer kept, but scoped** — the existing full-repack
  algorithm survives as a named function (`packAllModules()` or similar) but
  is only invoked from two places: the one-time migration, and the new
  manual "Compact Layout" action. It never runs implicitly.
- **New module placement** — scans existing positions and drops into the
  first open gap it fits (single-module version of the first-fit search). If
  nothing fits, appends below the lowest occupied row.
- **Move-to-tab placement** — moving a module to another tab
  (`performModuleMove`) uses the same "first open gap" logic as new-module
  creation.
- **Drag-to-move becomes a custom pointer-drag** — mousedown/mousemove/mouseup,
  following the same math already used by the resize handle
  (`initResizeHandle`, cursor delta → grid cell via `GRID_COLUMNS`/
  `GRID_GAP`/`ROW_H`). During drag, the candidate cell is continuously
  clamped to the nearest position that doesn't overlap another module's fixed
  footprint — no overlapping preview is ever shown. On drop, `colStart`/
  `rowStart` persist and `scheduleSave()` fires. **This is a deliberate,
  scoped exception** to the project convention of always using SortableJS for
  drag — true free placement (pinned coordinates, persisted gaps, blocked
  overlap) can't be represented by SortableJS's list-reorder model, which
  always flows items into a dense sequence. SortableJS remains the standard
  everywhere else (spells, weapons, counters, companions, etc.).
- **Resize blocks at collision** — `onMouseMove` in `initResizeHandle`
  computes the max `colSpan`/`rowSpan` that doesn't intersect any other
  module's fixed position and clamps growth there. Resize stops at the wall;
  it never pushes or moves another module.
- **Manual "Compact Layout" action** — new entry (placement TBD during
  implementation — likely module overflow menu or a grid-level toolbar
  action) that runs `packAllModules()` once, on request, repacking everything
  densely. This is the old automatic behavior, now strictly opt-in.
- **Migration** — `migrateData()` gets a new version-gated step: any save
  missing `colStart`/`rowStart` gets them assigned by running the existing
  bin-packing algorithm once per tab (so modules land exactly where they
  visually are today), then the schema version bumps. No repacking happens
  again after that.
- **Testability** — the pure collision/placement logic (`findOpenSlot`,
  `wouldOverlap`, span-clamping for resize) is extracted as standalone
  functions exposed on `window` per rule 12, with vitest coverage per rule
  13. DOM/pointer-event wiring (drag handlers, resize handlers) stays
  exempt, consistent with existing patterns.

## Files Touched

- `scripts/module-core.js` — layout engine (`computeLayout`/`applyLayout`
  replaced/split), drag-to-move (SortableJS → custom pointer-drag), resize
  collision clamping, new-module placement, move-to-tab placement, new
  manual Compact action.
- `scripts/persistence.js` — migration step for `colStart`/`rowStart`,
  serialize/deserialize for the new fields.
- `_DOCS/ARCHITECTURE.md` — inline update to the module engine description
  and any relevant layout notes (rule 11).
- `_DOCS/SUBMODULES/` — update any submodule doc that references
  auto-compacting or grid packing behavior, if any exist.
- `tests/` — new/updated vitest coverage for the extracted pure placement
  functions.

## Out of Scope

- Changing the visual size classes / ResizeObserver breakpoint logic
  (`RESPONSIVE_LAYOUT.md`) — untouched, only *when* layout repaints changes,
  not the breakpoint math itself.
- Any change to SortableJS usage outside the module grid (spells, weapons,
  counters, companions, etc. keep list-reorder drag as-is).

---

## Implementation Note: Migration Mechanism

The design's "Migration" bullet describes a version-gated `migrateData()` step
that backfills `colStart`/`rowStart` by running the bin-packer once per tab.
In practice, the bin-packer needs real DOM-measured heights for auto-height
(`rowSpan: null`) modules to reproduce today's visual layout exactly —
and `migrateData()` runs on raw JSON before anything is rendered, so it
cannot measure anything.

The equivalent, DOM-accurate mechanism implemented here: `renderModule()`
already renders modules for a tab one at a time, in `order` sequence, via
`deserializeCharacter()` (active tab, on load) and `switchToTab()` (any tab,
on first switch). Each call snaps the module's real height first. If a
module arrives with `colStart`/`rowStart` still `null` — true for every
module in every pre-existing save, since the field is new — `renderModule()`
places it with `findOpenSlot()` against the tab's *already-placed* modules.
Processing legacy modules one at a time, in order, against already-placed
siblings is exactly what the old bin-packer did internally, so the visual
result matches today's layout exactly, with no separate migration pass and
no schema version bump needed (`deserializeCharacter` defaults absent fields
to `null` via `saved.colStart ?? null`, which is itself the "needs
placement" signal `renderModule()` checks for). No `migrateData()` step is
added — `tests/persistence.test.js` already asserts `version` stays `3`
after a no-op migration, confirming this doesn't require a bump.

`_DOCS/SUBMODULES/` was grepped for `auto-compact|repack|bin-pack|
computeLayout|first-fit` — no matches. No submodule doc references the old
behavior, so none need updating.

---

## Phase 1 — Persisted Positions & Free-Placement Engine

> This phase is intentionally the largest: position storage, the paint
> step, and drag-to-move are tightly coupled — shipping any one without
> the others leaves the grid in a broken state (e.g. dragging that doesn't
> persist). They land together so the app is fully working at the end of
> this phase, with resize collision-clamping (Phase 2) and the manual
> Compact action (Phase 3) as the only pieces still deferred.

### Task 1.1: Add `rectsOverlap()` and `findOpenSlot()` pure primitives

**Files:**
- Modify: `scripts/module-core.js` (add near the existing `// ── Grid Layout Algorithm ──` section, module-core.js:1053)
- Test: `tests/module-core.test.js`

**Interfaces:**
- Produces: `rectsOverlap(a, b)` — `a`/`b` are `{colStart, rowStart, colSpan, rowSpan}`; returns `boolean`. `findOpenSlot(placedRects, colSpan, rowSpan)` — `placedRects` is `{colStart, rowStart, colSpan, rowSpan}[]`; returns `{colStart, rowStart}`. Both exposed on `window`. Later tasks (1.2, 1.4, 1.6, 1.7, Phase 2) call these.

- [x] **Step 1: Write the failing tests**

Add to `tests/module-core.test.js` (after the existing `describe` blocks):

```js
describe('rectsOverlap', () => {
  it('returns true when rects share any cell', () => {
    const a = { colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2 };
    const b = { colStart: 2, rowStart: 2, colSpan: 2, rowSpan: 2 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns false when rects are adjacent but not overlapping', () => {
    const a = { colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2 };
    const b = { colStart: 3, rowStart: 1, colSpan: 2, rowSpan: 2 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns false when rects are stacked in different rows', () => {
    const a = { colStart: 1, rowStart: 1, colSpan: 4, rowSpan: 1 };
    const b = { colStart: 1, rowStart: 2, colSpan: 4, rowSpan: 1 };
    expect(rectsOverlap(a, b)).toBe(false);
  });
});

describe('findOpenSlot', () => {
  it('places at 1,1 when nothing is placed yet', () => {
    expect(findOpenSlot([], 2, 2)).toEqual({ colStart: 1, rowStart: 1 });
  });

  it('finds the next open column in the same row', () => {
    const placed = [{ colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2 }];
    expect(findOpenSlot(placed, 2, 2)).toEqual({ colStart: 3, rowStart: 1 });
  });

  it('drops to the next row when the current row cannot fit', () => {
    // Row 1 fully occupied across all 8 columns
    const placed = [{ colStart: 1, rowStart: 1, colSpan: 8, rowSpan: 1 }];
    expect(findOpenSlot(placed, 4, 1)).toEqual({ colStart: 1, rowStart: 2 });
  });

  it('never returns a column that would exceed GRID_COLUMNS', () => {
    const placed = [{ colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 1 }];
    const slot = findOpenSlot(placed, 4, 1);
    expect(slot.colStart + 4 - 1).toBeLessThanOrEqual(8);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/module-core.test.js`
Expected: FAIL with "rectsOverlap is not defined" / "findOpenSlot is not defined"

- [x] **Step 3: Implement the functions**

In `scripts/module-core.js`, replace the `// ── Grid Layout Algorithm ──` section's `getRowSpan` block (module-core.js:1053-1063 stays as-is) by adding these two functions directly after `getRowSpan`, before `computeLayout` (which Task 1.2 will remove):

```js
    function rectsOverlap(a, b) {
        return (
            a.colStart < b.colStart + b.colSpan &&
            b.colStart < a.colStart + a.colSpan &&
            a.rowStart < b.rowStart + b.rowSpan &&
            b.rowStart < a.rowStart + a.rowSpan
        );
    }

    function findOpenSlot(placedRects, colSpan, rowSpan) {
        for (let row = 1; ; row++) {
            for (let col = 1; col <= GRID_COLUMNS - colSpan + 1; col++) {
                const candidate = { colStart: col, rowStart: row, colSpan, rowSpan };
                if (!placedRects.some((r) => rectsOverlap(candidate, r))) {
                    return { colStart: col, rowStart: row };
                }
            }
        }
    }
```

- [x] **Step 4: Expose on `window`**

In the bottom-of-IIFE exposure block (module-core.js:1244-1265), add:

```js
    window.rectsOverlap = rectsOverlap;
    window.findOpenSlot = findOpenSlot;
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/module-core.test.js`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add scripts/module-core.js tests/module-core.test.js
git commit -m "feat: add rectsOverlap/findOpenSlot grid placement primitives"
```

### Task 1.2: Replace `computeLayout()` with `packAllModules()`

**Files:**
- Modify: `scripts/module-core.js:1065-1109` (the `computeLayout` function)
- Test: `tests/module-core.test.js`

**Interfaces:**
- Consumes: `findOpenSlot(placedRects, colSpan, rowSpan)`, `getRowSpan(data)` (Task 1.1, existing)
- Produces: `packAllModules(moduleDataList)` — `moduleDataList` is module data objects sorted by `order`; returns `{id, colStart, rowStart, colSpan, rowSpan}[]`. Used by Task 1.3's rewritten `applyLayout` is NOT a consumer (applyLayout no longer packs) — used by Phase 3's Compact Layout action.

- [x] **Step 1: Write the failing test**

```js
describe('packAllModules', () => {
  it('packs modules row-major, first-fit, matching declared colSpan/rowSpan', () => {
    const moduleDataList = [
      { id: 'a', colSpan: 4, rowSpan: 2 },
      { id: 'b', colSpan: 4, rowSpan: 1 },
      { id: 'c', colSpan: 2, rowSpan: 1 },
    ];
    const result = packAllModules(moduleDataList);
    expect(result).toEqual([
      { id: 'a', colStart: 1, rowStart: 1, colSpan: 4, rowSpan: 2 },
      { id: 'b', colStart: 5, rowStart: 1, colSpan: 4, rowSpan: 1 },
      { id: 'c', colStart: 5, rowStart: 2, colSpan: 2, rowSpan: 1 },
    ]);
  });

  it('returns an empty array for an empty list', () => {
    expect(packAllModules([])).toEqual([]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/module-core.test.js`
Expected: FAIL with "packAllModules is not defined"

- [x] **Step 3: Replace `computeLayout` with `packAllModules`**

Delete `computeLayout` (module-core.js:1065-1109) entirely and replace it with:

```js
    function packAllModules(moduleDataList) {
        const results = [];
        for (const data of moduleDataList) {
            const colSpan = data.colSpan;
            const rowSpan = getRowSpan(data);
            const slot = findOpenSlot(results, colSpan, rowSpan);
            results.push({ id: data.id, colStart: slot.colStart, rowStart: slot.rowStart, colSpan, rowSpan });
        }
        return results;
    }
```

(This reuses `findOpenSlot` from Task 1.1 instead of the old `occupied[][]` array — same first-fit behavior, less code.)

- [x] **Step 4: Expose on `window`**

Replace any reference to `computeLayout` in the exposure block with:

```js
    window.packAllModules = packAllModules;
```

(There is no existing `window.computeLayout` export — this is a new addition to the exposure block.)

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/module-core.test.js`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add scripts/module-core.js tests/module-core.test.js
git commit -m "refactor: replace computeLayout occupied-grid packer with packAllModules built on findOpenSlot"
```

### Task 1.3: Rewrite `applyLayout()` as a pure paint step

**Files:**
- Modify: `scripts/module-core.js:1111-1125`

**Interfaces:**
- Consumes: `getRowSpan(data)` (existing). No longer consumes `packAllModules`/`computeLayout`.
- Produces: `applyLayout()` — unchanged external signature (no args, no return), still exposed as `window.applyLayout`. Every other task in this plan calls it after mutating `colStart`/`rowStart`/`colSpan`/`rowSpan`.

- [x] **Step 1: Replace the function body**

```js
    function applyLayout() {
        if (_dragging || _batchMode) return;
        const tabModules = window.modules.filter((m) => m.tabId === window.activeTabId);
        _layingOut = true;
        for (const data of tabModules) {
            if (data.colStart == null || data.rowStart == null) continue;
            const el = moduleGrid.querySelector(`.module[data-id="${data.id}"]`);
            if (!el) continue;
            el.style.gridColumn = `${data.colStart} / span ${data.colSpan}`;
            el.style.gridRow = `${data.rowStart} / span ${getRowSpan(data)}`;
        }
        _layingOut = false;
    }
```

This is a manual verification step, not a unit test — `applyLayout` is DOM-rendering code (exempt from vitest coverage per rule 13). It's covered indirectly once Task 1.4's placement logic feeds it real `colStart`/`rowStart` values.

- [x] **Step 2: Commit**

```bash
git add scripts/module-core.js
git commit -m "refactor: applyLayout paints persisted colStart/rowStart instead of repacking"
```

### Task 1.4: Add `colStart`/`rowStart` to the module data model

**Files:**
- Modify: `scripts/module-core.js:205-216` (wizard creation)
- Modify: `scripts/persistence.js:58-69` (`serializeCharacter`)
- Modify: `scripts/persistence.js:117-128` (`deserializeCharacter`)

**Interfaces:**
- Produces: every module data object now carries `colStart`/`rowStart` (`number | null`). Task 1.5 (`renderModule`) is the consumer that resolves `null` into a real position.

- [x] **Step 1: Add the fields to new-module creation**

In `scripts/module-core.js`, in the `btnWizardCreate` click handler (module-core.js:205-216), change:

```js
        const moduleData = {
            id: generateModuleId(),
            type: wizardState.type,
            title: null,
            colSpan: GRID_COLUMNS / 2,
            rowSpan: 2,
            order: window.modules.filter((m) => m.tabId === window.activeTabId).length,
            theme: wizardState.theme,
            textColor: wizardState.textColor,
            tabId: window.activeTabId,
            content: '',
        };
```

to:

```js
        const moduleData = {
            id: generateModuleId(),
            type: wizardState.type,
            title: null,
            colSpan: GRID_COLUMNS / 2,
            rowSpan: 2,
            colStart: null,
            rowStart: null,
            order: window.modules.filter((m) => m.tabId === window.activeTabId).length,
            theme: wizardState.theme,
            textColor: wizardState.textColor,
            tabId: window.activeTabId,
            content: '',
        };
```

- [x] **Step 2: Persist the fields in `serializeCharacter`**

In `scripts/persistence.js:58-69`, change:

```js
            modules: modules.map((m) => ({
                id: m.id,
                type: m.type,
                title: m.title || null,
                colSpan: m.colSpan,
                rowSpan: m.rowSpan,
                order: m.order,
                theme: m.theme || null,
                textLight: !!m.textLight,
                tabId: m.tabId || null,
                content: m.content ?? '',
            })),
```

to:

```js
            modules: modules.map((m) => ({
                id: m.id,
                type: m.type,
                title: m.title || null,
                colSpan: m.colSpan,
                rowSpan: m.rowSpan,
                colStart: m.colStart ?? null,
                rowStart: m.rowStart ?? null,
                order: m.order,
                theme: m.theme || null,
                textLight: !!m.textLight,
                tabId: m.tabId || null,
                content: m.content ?? '',
            })),
```

- [x] **Step 3: Restore the fields in `deserializeCharacter`**

In `scripts/persistence.js:117-128`, change:

```js
                const data = {
                    id: saved.id,
                    type: saved.type,
                    title: saved.title || null,
                    colSpan: saved.colSpan ?? 4,
                    rowSpan: saved.rowSpan || null,
                    order: saved.order ?? 0,
                    theme: saved.theme || null,
                    textLight: !!saved.textLight,
                    tabId: saved.tabId || null,
                    content: saved.content ?? '',
                };
```

to:

```js
                const data = {
                    id: saved.id,
                    type: saved.type,
                    title: saved.title || null,
                    colSpan: saved.colSpan ?? 4,
                    rowSpan: saved.rowSpan || null,
                    colStart: saved.colStart ?? null,
                    rowStart: saved.rowStart ?? null,
                    order: saved.order ?? 0,
                    theme: saved.theme || null,
                    textLight: !!saved.textLight,
                    tabId: saved.tabId || null,
                    content: saved.content ?? '',
                };
```

- [x] **Step 4: Run the existing persistence tests**

Run: `npx vitest run tests/persistence.test.js`
Expected: PASS (no existing assertion checks the full serialized module shape, per `tests/persistence.test.js:51-100` — adding fields doesn't break them)

- [x] **Step 5: Commit**

```bash
git add scripts/module-core.js scripts/persistence.js
git commit -m "feat: add colStart/rowStart fields to module data model and persistence"
```

### Task 1.5: Auto-place modules with `null` position in `renderModule()`

**Files:**
- Modify: `scripts/module-core.js:871-878`

**Interfaces:**
- Consumes: `findOpenSlot(placedRects, colSpan, rowSpan)` (Task 1.1), `getRowSpan(data)` (existing), `snapModuleHeight(el, data)` (existing).
- Produces: after this task, no module ever paints with a `null` position — `renderModule()` guarantees `data.colStart`/`data.rowStart` are real numbers before `applyLayout()` runs. This is also the mechanism that places every pre-existing (legacy) module on first render, since legacy saves have `colStart: null` per Task 1.4 — see "Implementation Note: Migration Mechanism" above.

- [x] **Step 1: Update the tail of `renderModule()`**

In `scripts/module-core.js:871-878`, change:

```js
        moduleGrid.appendChild(el);
        if (data.type !== 'hline') {
            initResizeHandle(el, data);
        }
        moduleSizeObserver.observe(bodyEl);
        snapModuleHeight(el, data);
        if (!_batchMode) applyLayout();
    }
```

to:

```js
        moduleGrid.appendChild(el);
        initDragHandle(el, data);
        if (data.type !== 'hline') {
            initResizeHandle(el, data);
        }
        moduleSizeObserver.observe(bodyEl);
        snapModuleHeight(el, data);
        if (data.colStart == null || data.rowStart == null) {
            const placed = window.modules
                .filter((m) => m.tabId === data.tabId && m.id !== data.id && m.colStart != null)
                .map((m) => ({ colStart: m.colStart, rowStart: m.rowStart, colSpan: m.colSpan, rowSpan: getRowSpan(m) }));
            const slot = findOpenSlot(placed, data.colSpan, getRowSpan(data));
            data.colStart = slot.colStart;
            data.rowStart = slot.rowStart;
        }
        if (!_batchMode) applyLayout();
    }
```

(`initDragHandle` is defined in Task 1.7 — this task references it now so the two land together; the function must exist before this line runs, but since it's a `function` declaration it's hoisted within the IIFE, so definition order in the file doesn't matter.)

- [x] **Step 2: Commit**

```bash
git add scripts/module-core.js
git commit -m "feat: auto-place modules with null colStart/rowStart via findOpenSlot on render"
```

(No new unit test here — `renderModule` is DOM-rendering code, exempt per rule 13. Coverage is via `findOpenSlot`'s existing tests plus the manual grid check at the end of Phase 1.)

### Task 1.6: Fix cross-tab move placement in `performModuleMove()`

**Files:**
- Modify: `scripts/module-core.js:1231-1242`

**Interfaces:**
- Consumes: `findOpenSlot(placedRects, colSpan, rowSpan)`, `getRowSpan(data)`.
- Produces: `performModuleMove(moduleEl, data, destTab)` — same signature, called from the module settings "Move to Tab" flow (`buildCommonSettingsSection`, unchanged elsewhere).

- [x] **Step 1: Replace the function body**

In `scripts/module-core.js:1231-1242`, change:

```js
    function performModuleMove(moduleEl, data, destTab) {
        data.order = window.modules.filter((m) => m.tabId === destTab.id).length;
        data.tabId = destTab.id;
        const bodyEl = moduleEl.querySelector('.module-body');
        if (bodyEl) moduleSizeObserver.unobserve(bodyEl);
        moduleEl.remove();
        applyLayout();
        updateEmptyState();
        scheduleSave();
        window.showToast(t('module.moveToTabMoved', { tab: destTab.name }));
        window.closeAllModals();
    }
```

to:

```js
    function performModuleMove(moduleEl, data, destTab) {
        // Measure real height (for auto-height modules) before the element leaves the DOM
        const measuredRowSpan = getRowSpan(data);
        const destModules = window.modules.filter((m) => m.tabId === destTab.id && m.colStart != null);
        const placed = destModules.map((m) => ({
            colStart: m.colStart,
            rowStart: m.rowStart,
            colSpan: m.colSpan,
            rowSpan: m.rowSpan == null ? measuredRowSpan : m.rowSpan,
        }));
        const slot = findOpenSlot(placed, data.colSpan, measuredRowSpan);
        data.colStart = slot.colStart;
        data.rowStart = slot.rowStart;
        data.order = window.modules.filter((m) => m.tabId === destTab.id).length;
        data.tabId = destTab.id;
        const bodyEl = moduleEl.querySelector('.module-body');
        if (bodyEl) moduleSizeObserver.unobserve(bodyEl);
        moduleEl.remove();
        applyLayout();
        updateEmptyState();
        scheduleSave();
        window.showToast(t('module.moveToTabMoved', { tab: destTab.name }));
        window.closeAllModals();
    }
```

(`destModules` may include other auto-height modules whose own `rowSpan` is `null` — since they aren't rendered in the DOM right now, `getRowSpan` can't re-measure them; falling back to the just-measured height of the module being moved is a reasonable approximation for collision purposes and avoids a false "no collision" read. This mirrors the same DOM-measurement limit the old code always had for inactive tabs.)

- [x] **Step 2: Commit**

```bash
git add scripts/module-core.js
git commit -m "fix: performModuleMove finds an open slot in the destination tab instead of always appending"
```

### Task 1.7: Replace SortableJS grid drag with custom pointer-drag

**Files:**
- Modify: `scripts/module-core.js:880-907` (delete the `Sortable` instantiation)
- Modify: `scripts/module-core.js` (add `initDragHandle`, referenced by Task 1.5, near `initResizeHandle`)
- Modify: `scripts/module-core.js:1244-1265` (exposure block — remove `window.sortable`)

**Interfaces:**
- Consumes: `rectsOverlap(a, b)` (Task 1.1), `getRowSpan(data)`, `applyLayout()`, `scheduleSave()` (existing).
- Produces: `initDragHandle(moduleEl, data)` — called once per module from `renderModule()` (Task 1.5). Not exposed on `window` (DOM/event wiring, exempt per rule 13, same as `initResizeHandle` which is exposed only because other code calls it externally — `initDragHandle` has no external caller, so it stays private).

- [x] **Step 1: Delete the SortableJS instantiation**

Delete `scripts/module-core.js:880-907` in full:

```js
    // ── Module Drag & Drop (SortableJS) ──
    const sortable = new Sortable(moduleGrid, {
        handle: '.module-drag-handle',
        animation: 150,
        ghostClass: 'module-ghost',
        chosenClass: 'module-dragging',
        dragClass: 'module-drag-active',
        filter: '#empty-state',
        disabled: false,
        onStart() {
            _dragging = true;
            moduleGrid.querySelectorAll('.module').forEach((el) => {
                const data = window.modules.find((m) => m.id === el.dataset.id);
                el.style.gridColumn = `span ${data ? data.colSpan : 1}`;
                el.style.gridRow = `span ${data ? getRowSpan(data) : 1}`;
            });
        },
        onEnd(evt) {
            _dragging = false;
            const orderedIds = Array.from(moduleGrid.querySelectorAll('.module')).map((el) => el.dataset.id);
            const activeModules = window.modules.filter((m) => m.tabId === window.activeTabId);
            activeModules.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
            activeModules.forEach((m, i) => (m.order = i));
            applyLayout();
            console.log(`[CV] Module reordered: ${evt.item.dataset.id} → position ${evt.newIndex}`);
            scheduleSave();
        },
    });
```

- [x] **Step 2: Add `initDragHandle()`**

Add this function next to `initResizeHandle` (module-core.js, in the `// ── Module Resize Handle ──` area — add a new `// ── Module Drag Handle ──` section right after it, before `performModuleMove`):

```js
    // ── Module Drag Handle (custom free-placement drag) ──

    function initDragHandle(moduleEl, data) {
        const handle = moduleEl.querySelector('.module-drag-handle');
        if (!handle) return;

        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            const grid = document.getElementById('module-grid');
            const gridRect = grid.getBoundingClientRect();
            const gridContentWidth = gridRect.width - GRID_GAP * 2;
            const colWidth = (gridContentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

            const startX = e.clientX;
            const startY = e.clientY;
            const startColStart = data.colStart;
            const startRowStart = data.rowStart;
            const dragRowSpan = getRowSpan(data);
            let candColStart = startColStart;
            let candRowStart = startRowStart;
            let moved = false;

            function otherRects() {
                return window.modules
                    .filter((m) => m.tabId === window.activeTabId && m.id !== data.id && m.colStart != null)
                    .map((m) => ({ colStart: m.colStart, rowStart: m.rowStart, colSpan: m.colSpan, rowSpan: getRowSpan(m) }));
            }

            function onMouseMove(e) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                if (!moved && Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return;
                if (!moved) {
                    moved = true;
                    _dragging = true;
                    moduleEl.classList.add('module-dragging');
                    document.body.classList.add('module-drag-active');
                }

                const colDelta = Math.round(deltaX / (colWidth + GRID_GAP));
                const rowDelta = Math.round(deltaY / (ROW_H + GRID_GAP));
                const desiredColStart = Math.max(1, Math.min(GRID_COLUMNS - data.colSpan + 1, startColStart + colDelta));
                const desiredRowStart = Math.max(1, startRowStart + rowDelta);

                const candidate = { colStart: desiredColStart, rowStart: desiredRowStart, colSpan: data.colSpan, rowSpan: dragRowSpan };
                if (!otherRects().some((r) => rectsOverlap(candidate, r))) {
                    candColStart = desiredColStart;
                    candRowStart = desiredRowStart;
                    moduleEl.style.gridColumn = `${candColStart} / span ${data.colSpan}`;
                    moduleEl.style.gridRow = `${candRowStart} / span ${dragRowSpan}`;
                }
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (!moved) return;
                _dragging = false;
                moduleEl.classList.remove('module-dragging');
                document.body.classList.remove('module-drag-active');
                data.colStart = candColStart;
                data.rowStart = candRowStart;
                applyLayout();
                console.log(`[CV] Module moved: ${data.id} → col ${data.colStart}, row ${data.rowStart}`);
                scheduleSave();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
```

(The 4px move threshold before engaging drag avoids hijacking a plain click on the handle. `_dragging` reuses the existing flag already guarded by `applyLayout()` and the `moduleSizeObserver` callback, so nothing repaints out from under the live drag.)

- [x] **Step 3: Remove the `window.sortable` export**

In the exposure block (module-core.js:1244-1265), delete:

```js
    window.sortable = sortable;
```

(Confirmed via grep there are no other references to `window.sortable` anywhere in `scripts/`.)

- [x] **Step 4: Commit**

```bash
git add scripts/module-core.js
git commit -m "feat: replace SortableJS grid drag with custom pointer-drag for free placement"
```

(No new unit test — pointer-event wiring is DOM code, exempt per rule 13. `rectsOverlap`, the one pure piece this relies on, already has coverage from Task 1.1.)

### Task 1.8: Update `_DOCS/ARCHITECTURE.md`

**Files:**
- Modify: `_DOCS/ARCHITECTURE.md:25` (module-core.js summary row)
- Modify: `_DOCS/ARCHITECTURE.md:98` (module-core.js detail row)
- Modify: `_DOCS/ARCHITECTURE.md:588-593` (`## CSS Grid Layout` section)

**Interfaces:** None — documentation only.

- [x] **Step 1: Update the summary table row**

Change `_DOCS/ARCHITECTURE.md:25` from:

```
| `scripts/module-core.js` | Module engine: state (`modules[]`), wizard, type registry (`MODULE_TYPES`), `renderModule()`, overflow menu, drag & drop, delete confirm, resize handle |
```

to:

```
| `scripts/module-core.js` | Module engine: state (`modules[]`), wizard, type registry (`MODULE_TYPES`), `renderModule()`, overflow menu, custom pointer-drag (free placement), delete confirm, resize handle with collision clamping |
```

- [x] **Step 2: Update the detail table row**

Change `_DOCS/ARCHITECTURE.md:98` from:

```
| **module-core.js** | `modules[]` array, `moduleIdCounter`, `generateModuleId()`, `wizardState`, wizard open/close/reset, global Escape key handler, wizard interactions (type cards, color swatches), create module handler, `MODULE_TYPES{}` registry, `registerModuleType()`, `renderModule(data)`, SortableJS drag & drop, `openDeleteConfirm()`, `closeDeleteConfirm()`, `deleteModule()`, `openRenameModule()`, `initResizeHandle()` (constants `GRID_COLUMNS=4`, `GRID_GAP=8`, row height `80px`); `window.generateModuleId()` — exposed for import ID remapping |
```

to:

```
| **module-core.js** | `modules[]` array, `moduleIdCounter`, `generateModuleId()`, `wizardState`, wizard open/close/reset, global Escape key handler, wizard interactions (type cards, color swatches), create module handler, `MODULE_TYPES{}` registry, `registerModuleType()`, `renderModule(data)` — places modules with `colStart`/`rowStart` via `findOpenSlot()` when unset, custom `initDragHandle()` pointer-drag (free placement, replaces SortableJS for the grid), `openDeleteConfirm()`, `closeDeleteConfirm()`, `deleteModule()`, `openRenameModule()`, `initResizeHandle()` with collision-aware clamping via `clampResizeSpan()`, `rectsOverlap()`/`findOpenSlot()`/`packAllModules()` grid placement primitives (constants `GRID_COLUMNS=8`, `GRID_GAP=8`, row height `66px`); `window.generateModuleId()` — exposed for import ID remapping |
```

- [x] **Step 3: Rewrite the CSS Grid Layout section**

Change `_DOCS/ARCHITECTURE.md:588-593` from:

```
## CSS Grid Layout

- Container: `#module-grid` — `grid-template-columns: repeat(4, 1fr)`, gap `8px`, padding `8px`
- Modules span 1–4 columns via `grid-column: span N`
- Row height is content-driven by default; fixed when user resizes (`rowSpan * 80px + gaps`)
- `align-items: start` prevents modules from stretching to fill row height
```

to:

```
## CSS Grid Layout

- Container: `#module-grid` — `grid-template-columns: repeat(8, 1fr)`, gap `8px`, padding `8px`
- Modules span 1–8 columns; position is explicit (`grid-column: colStart / span colSpan`, `grid-row: rowStart / span rowSpan`), not auto-flow — every module's `colStart`/`rowStart` is stored on its data and persisted
- Row height is content-driven by default (`rowSpan: null` → auto-snapped to whole rows via `snapModuleHeight()`); fixed once the user resizes (`rowSpan * 66px + gaps`)
- Layout never auto-repacks. `applyLayout()` only paints each module's already-known position. Positions are assigned once — by `findOpenSlot()` when a module is created/first-placed, by the user's drag/resize, or all at once by the manual "Compact Layout" action (`packAllModules()`) — and never recomputed as a side effect of anything else
```

- [x] **Step 4: Commit**

```bash
git add "_DOCS/ARCHITECTURE.md"
git commit -m "docs: update ARCHITECTURE.md for free-placement grid engine"
```

### Phase 1 Manual Check

Not a scripted test — a quick self-review before moving to Phase 2:

- Confirm `npx vitest run` passes for the whole suite (not just the two touched files) — Task 1.4/1.6/1.7 touch shared code paths other test files exercise (`module-*.test.js` files that create/serialize modules).
- Confirm no remaining references to `computeLayout` anywhere in `scripts/` (`grep -rn computeLayout scripts/`).

---

## Phase 2 — Resize Collision Clamping

> Depends on Phase 1 (`rectsOverlap`, `getRowSpan`, `applyLayout`). Independent of Phase 3.

### Task 2.1: Add `clampResizeSpan()` pure function

**Files:**
- Modify: `scripts/module-core.js` (near `rectsOverlap`/`findOpenSlot`, module-core.js:1053 area)
- Test: `tests/module-core.test.js`

**Interfaces:**
- Consumes: `rectsOverlap(a, b)` (Task 1.1).
- Produces: `clampResizeSpan(data, placedRects, desiredColSpan, desiredRowSpan)` — `data` is `{colStart, rowStart}` of the module being resized; `placedRects` is every *other* module's `{colStart, rowStart, colSpan, rowSpan}`; returns `{colSpan, rowSpan}`, both `>= 1`. Consumed by Task 2.2.

- [x] **Step 1: Write the failing tests**

```js
describe('clampResizeSpan', () => {
  it('allows growth up to the grid edge when nothing blocks it', () => {
    const data = { colStart: 1, rowStart: 1 };
    const result = clampResizeSpan(data, [], 4, 3);
    expect(result).toEqual({ colSpan: 4, rowSpan: 3 });
  });

  it('clamps colSpan to the grid width', () => {
    const data = { colStart: 6, rowStart: 1 };
    const result = clampResizeSpan(data, [], 5, 1);
    expect(result.colSpan).toBe(3); // columns 6,7,8 only
  });

  it('clamps colSpan at a neighboring module to the right', () => {
    const data = { colStart: 1, rowStart: 1 };
    const neighbor = { colStart: 4, rowStart: 1, colSpan: 2, rowSpan: 1 };
    const result = clampResizeSpan(data, [neighbor], 6, 1);
    expect(result.colSpan).toBe(3); // stops at column 3, before neighbor's column 4
  });

  it('clamps rowSpan at a neighboring module below', () => {
    const data = { colStart: 1, rowStart: 1 };
    const neighbor = { colStart: 1, rowStart: 3, colSpan: 4, rowSpan: 1 };
    const result = clampResizeSpan(data, [neighbor], 2, 5);
    expect(result.rowSpan).toBe(2); // stops before neighbor's row 3
  });

  it('never returns a span below 1', () => {
    const data = { colStart: 1, rowStart: 1 };
    const neighborRight = { colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 1 };
    const result = clampResizeSpan(data, [neighborRight], 5, 1);
    expect(result.colSpan).toBe(1);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/module-core.test.js`
Expected: FAIL with "clampResizeSpan is not defined"

- [x] **Step 3: Implement the function**

```js
    function clampResizeSpan(data, placedRects, desiredColSpan, desiredRowSpan) {
        let colSpan = Math.max(1, Math.min(GRID_COLUMNS - data.colStart + 1, desiredColSpan));
        while (
            colSpan > 1 &&
            placedRects.some((r) =>
                rectsOverlap({ colStart: data.colStart, rowStart: data.rowStart, colSpan, rowSpan: desiredRowSpan }, r)
            )
        ) {
            colSpan--;
        }

        let rowSpan = Math.max(1, desiredRowSpan);
        while (
            rowSpan > 1 &&
            placedRects.some((r) =>
                rectsOverlap({ colStart: data.colStart, rowStart: data.rowStart, colSpan, rowSpan }, r)
            )
        ) {
            rowSpan--;
        }

        return { colSpan, rowSpan };
    }
```

- [x] **Step 4: Expose on `window`**

```js
    window.clampResizeSpan = clampResizeSpan;
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/module-core.test.js`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add scripts/module-core.js tests/module-core.test.js
git commit -m "feat: add clampResizeSpan collision-aware resize clamp"
```

### Task 2.2: Wire collision clamping into `initResizeHandle()`

**Files:**
- Modify: `scripts/module-core.js:1189-1212` (the `onMouseMove` handler inside `initResizeHandle`)

**Interfaces:**
- Consumes: `clampResizeSpan(data, placedRects, desiredColSpan, desiredRowSpan)` (Task 2.1), `getRowSpan(data)`.

- [x] **Step 1: Replace the span-calculation lines**

In `scripts/module-core.js:1189-1212`, change:

```js
            function onMouseMove(e) {
                // Calculate new colSpan from drag delta (avoids stale position after grid reflow)
                const deltaX = e.clientX - startX;
                const colDelta = Math.round(deltaX / (colWidth + GRID_GAP));
                const newColSpan = Math.max(1, Math.min(GRID_COLUMNS, startColSpan + colDelta));

                // Calculate new rowSpan from drag delta
                const deltaY = e.clientY - startY;
                const rowDelta = Math.sign(deltaY) * Math.round(Math.abs(deltaY) / (ROW_H + GRID_GAP));
                const newRowSpan = Math.max(1, startRowSpan + rowDelta);

                const changed = newColSpan !== data.colSpan || newRowSpan !== data.rowSpan;
                data.colSpan = newColSpan;
                data.rowSpan = newRowSpan;

                badge.textContent = `${data.colSpan} col × ${data.rowSpan} row`;

                if (changed && !_layoutRaf) {
                    _layoutRaf = requestAnimationFrame(() => {
                        _layoutRaf = 0;
                        applyLayout();
                    });
                }
            }
```

to:

```js
            function onMouseMove(e) {
                // Calculate desired colSpan from drag delta (avoids stale position after grid reflow)
                const deltaX = e.clientX - startX;
                const colDelta = Math.round(deltaX / (colWidth + GRID_GAP));
                const desiredColSpan = Math.max(1, startColSpan + colDelta);

                // Calculate desired rowSpan from drag delta
                const deltaY = e.clientY - startY;
                const rowDelta = Math.sign(deltaY) * Math.round(Math.abs(deltaY) / (ROW_H + GRID_GAP));
                const desiredRowSpan = Math.max(1, startRowSpan + rowDelta);

                const others = window.modules
                    .filter((m) => m.tabId === window.activeTabId && m.id !== data.id && m.colStart != null)
                    .map((m) => ({ colStart: m.colStart, rowStart: m.rowStart, colSpan: m.colSpan, rowSpan: getRowSpan(m) }));
                const clamped = clampResizeSpan(data, others, desiredColSpan, desiredRowSpan);

                const changed = clamped.colSpan !== data.colSpan || clamped.rowSpan !== data.rowSpan;
                data.colSpan = clamped.colSpan;
                data.rowSpan = clamped.rowSpan;

                badge.textContent = `${data.colSpan} col × ${data.rowSpan} row`;

                if (changed && !_layoutRaf) {
                    _layoutRaf = requestAnimationFrame(() => {
                        _layoutRaf = 0;
                        applyLayout();
                    });
                }
            }
```

- [x] **Step 2: Commit**

```bash
git add scripts/module-core.js
git commit -m "feat: clamp resize handle growth at colliding neighbors"
```

(No new unit test — this step is DOM/pointer-event wiring exempt per rule 13; the pure logic it calls, `clampResizeSpan`, already has coverage from Task 2.1.)

### Task 2.3: Update `_DOCS/ARCHITECTURE.md`

**Files:**
- Modify: `_DOCS/ARCHITECTURE.md:98` (module-core.js detail row, already touched in Task 1.8)

- [x] **Step 1: Confirm the detail row already mentions collision clamping**

Task 1.8, Step 2 already added `initResizeHandle()` with collision-aware clamping via `clampResizeSpan()` to this row. If for any reason it's missing (e.g. Phase 1 and Phase 2 land far apart and the row drifted), add it now. Otherwise this step is a no-op — confirm and move on.

- [ ] **Step 2: Commit** (only if Step 1 required a change)

```bash
git add "_DOCS/ARCHITECTURE.md"
git commit -m "docs: confirm ARCHITECTURE.md mentions resize collision clamping"
```

---

## Phase 3 — Manual "Compact Layout" Action

> Depends on Phase 1 (`packAllModules`, `applyLayout`). Independent of Phase 2.

### Task 3.1: Add the toolbar button

**Files:**
- Modify: `main.html:52` (menu-left button group)

**Interfaces:** None — markup only, wired in Task 3.2.

- [x] **Step 1: Add the button**

In `main.html`, after the `#btn-new-module` button (main.html:52), add:

```html
            <button id="btn-compact-layout" class="menu-btn" title="Compact Layout" data-i18n-title="menu.compactLayoutTitle"><svg class="icon" width="18" height="18"><use href="#cv-grid"></use></svg><span class="mode-label" data-i18n="menu.compactLayout">Compact Layout</span></button>
```

Check `scripts/icons.js` for whether a `cv-grid` icon symbol already exists (`grep -n "cv-grid" scripts/icons.js` or the SVG sprite definitions near the top of `main.html`). If no grid-shaped icon exists, use `cv-columns` or `cv-layout-grid` if either is defined instead — pick whichever existing icon in the sprite most closely reads as "grid/layout"; do not invent a new SVG path. Confirm the final `use href="#..."` value matches an icon symbol that actually exists before moving on.

- [x] **Step 2: Commit**

```bash
git add main.html
git commit -m "feat: add Compact Layout button to menu bar"
```

### Task 3.2: Wire the button to `packAllModules()`

**Files:**
- Modify: `scripts/module-core.js` (add near `performModuleMove`, and hook up the button — module-core.js has direct `document.getElementById` wiring for other menu-bar buttons; find that pattern, e.g. `btnNewModule.addEventListener('click', openWizard)`, and add alongside it)

**Interfaces:**
- Consumes: `packAllModules(moduleDataList)` (Task 1.2), `applyLayout()`, `scheduleSave()`.
- Produces: `compactActiveTab()` — not exposed on `window` (no external caller), triggered only by the button click.

- [x] **Step 1: Add `compactActiveTab()`**

Add next to `performModuleMove` in `scripts/module-core.js`:

```js
    function compactActiveTab() {
        const tabModules = window.modules
            .filter((m) => m.tabId === window.activeTabId)
            .sort((a, b) => a.order - b.order);
        const positions = packAllModules(tabModules);
        for (const pos of positions) {
            const data = tabModules.find((m) => m.id === pos.id);
            data.colStart = pos.colStart;
            data.rowStart = pos.rowStart;
        }
        applyLayout();
        console.log('[CV] Layout compacted');
        scheduleSave();
    }
```

- [x] **Step 2: Wire the button**

Find where `btnNewModule` (or another `menu-btn`) is looked up and wired near the top of `module-core.js`'s IIFE (module-core.js:14-17 declares the wizard button constants). Add a matching declaration and listener:

```js
    const btnCompactLayout = document.getElementById('btn-compact-layout');
    btnCompactLayout.addEventListener('click', compactActiveTab);
```

Place this near the other menu-bar button wiring (search for where `btnNewModule.addEventListener` is called, likely further down near `openWizard`).

- [x] **Step 3: Commit**

```bash
git add scripts/module-core.js
git commit -m "feat: wire Compact Layout button to packAllModules"
```

(No new unit test — `compactActiveTab` is a thin DOM-triggered orchestration of already-tested `packAllModules`, exempt per rule 13 as event-handler wiring.)

### Task 3.3: Add i18n keys

**Files:**
- Modify: `scripts/translations-en.js`
- Modify: `scripts/translations-de.js`
- Modify: `scripts/translations-es.js`
- Modify: `scripts/translations-fr.js`
- Modify: `scripts/translations-it.js`
- Modify: `scripts/translations-pt-BR.js`
- Modify: `scripts/translations-ru.js`

**Interfaces:** None — locale data only.

- [x] **Step 1: Add two keys to every locale file**

Add `menu.compactLayout` and `menu.compactLayoutTitle` to each of the 7 locale files, next to the existing `menu.newModule`/`menu.newModuleTitle` keys (find them via `grep -n "menu.newModule" scripts/translations-*.js` to locate the exact insertion point per file).

English (`scripts/translations-en.js`) values:
```
menu.compactLayout: 'Compact Layout'
menu.compactLayoutTitle: 'Compact Layout'
```

For the other 6 locale files, add the same two keys with a translation matching that file's tone/register for "Compact Layout" (a short label — match the terseness of the neighboring `menu.newModule` translation in the same file rather than a literal word-for-word translation).

- [x] **Step 2: Verify no locale file is missing a key**

Run: `npx vitest run tests/i18n.test.js` (if this suite checks key parity across locales) — otherwise manually grep:

```bash
grep -L "menu.compactLayout" scripts/translations-*.js
```

Expected: no output (every file matched, none missing the key).

- [x] **Step 3: Commit**

```bash
git add scripts/translations-*.js
git commit -m "feat: add Compact Layout i18n keys across all locales"
```

### Task 3.4: Update `_DOCS/ARCHITECTURE.md`

**Files:**
- Modify: `_DOCS/ARCHITECTURE.md:98` (module-core.js detail row)

- [x] **Step 1: Append the Compact Layout entry**

Add `, compactActiveTab()` to the end of the `module-core.js` detail row's function list (the same row Task 1.8 and Task 2.3 touched), right before the trailing constants parenthetical.

- [x] **Step 2: Commit**

```bash
git add "_DOCS/ARCHITECTURE.md"
git commit -m "docs: document compactActiveTab in ARCHITECTURE.md"
```

---

## Self-Review Notes

- **Spec coverage:** every `## Design Decisions` bullet maps to a task — persisted position (1.4), no auto-repack (1.3), scoped bin-packer (1.2, 3.2), new-module placement (1.5), move-to-tab placement (1.6), custom pointer-drag (1.7), resize collision blocking (2.1–2.2), manual Compact action (3.1–3.3), testability (1.1, 1.2, 2.1 all paired with vitest). The one deviation — how migration/backfill is actually triggered — is called out and justified in "Implementation Note: Migration Mechanism" above rather than left ambiguous.
- **Type consistency:** `{colStart, rowStart, colSpan, rowSpan}` rect shape is used identically by `rectsOverlap`, `findOpenSlot`, `packAllModules`, `clampResizeSpan`, and the drag handler — checked across all tasks.
- **No placeholders:** every step has real code, not descriptions of code.
