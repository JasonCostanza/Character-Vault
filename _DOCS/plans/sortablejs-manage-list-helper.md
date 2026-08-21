# SortableJS Manage-List Helper Extraction ✅ COMPLETED

## Context

`_DOCS/SORTABLEJS_ONBOARDING.md` §6 identifies the top drag-and-drop design issue in the codebase: a "Manage list" drag-reorder block — destroy old Sortable instance, create a new one with `handle`/`animation`/`ghostClass`/`draggable`, reorder the data array in `onEnd`, `scheduleSave()` — is copy-pasted almost verbatim across 9 files. This plan extracts the identical part (Sortable lifecycle) into one shared helper, and leaves the differing part (how each module maps DOM rows back to its data array) untouched in each file.

## Non-Goals

- **Do not** touch the cross-list `group`/`pull`/`put` sites (Resistance, Condition, Weapons, List's item-transfer container). Those have a genuinely different shape and forcing them into this helper would be over-abstraction.
- **Do not** unify the per-module "map DOM row → data item" logic. Some modules key rows by `dataset.index` (array position, needs re-stamping after reorder), others by a stable `dataset.<x>Id` (looked up via `.find()`). Collapsing that difference is a separate, riskier change and isn't needed to remove the duplication that exists today.
- **Do not** fix the stale SortableJS claim in `_DOCS/ARCHITECTURE.md` about the module grid — that's an unrelated documentation correction, tracked separately.

## Current State — the 9 duplicate sites

| # | File | Lines | List | Key scheme |
|---|---|---|---|---|
| 1 | `scripts/module-abilities.js` | 554–567 | Manage Abilities | `dataset.index` (re-stamped) |
| 2 | `scripts/module-stat.js` | 513–528 | Manage Stats | `dataset.index` (re-stamped) |
| 3 | `scripts/module-savingthrow.js` | 489–504 | Manage Saves | `dataset.index` (re-stamped) |
| 4 | `scripts/module-counters.js` | 927–951 | Manage Counters | `dataset.counterId` (find) |
| 5 | `scripts/module-defenses.js` | 655–678 | Manage Defenses | `dataset.id` (find) |
| 6 | `scripts/module-recovery.js` | 387–401 | Manage Rest Buttons | `dataset.btnId` (find, via `.sort()`) |
| 7 | `scripts/module-companions.js` | 929–949 | Manage Attributes | `dataset.attrId` (find) |
| 8 | `scripts/module-list.js` | 1223–1237 | Manage Attributes | `dataset.attrId` (find, via `.sort()`) — **no destroy-guard today**, see Task 9 |
| 9 | `scripts/module-spells.js` | 1415–1430 | Manage Attributes | `dataset.attrId` (find) |

Every site does the same three things: guard-destroy the previous instance, build a `new Sortable(list, { handle, animation: 150, ghostClass, draggable, onEnd })`, and store it back on `list._sortable`. That's the extraction target.

## Proposed Helper

Add to `scripts/shared.js`, in its own `// ── Manage-List Sortable Helper ──` section, exposed on `window` per the project's module-export convention:

```js
// ── Manage-List Sortable Helper ──
function initManageListSortable(container, options) {
    if (container._sortable) {
        container._sortable.destroy();
    }
    container._sortable = new Sortable(container, {
        handle: options.handleSelector,
        animation: 150,
        ghostClass: options.ghostClass,
        draggable: options.rowSelector,
        onEnd: options.onEnd,
    });
    return container._sortable;
}
```

```js
window.initManageListSortable = initManageListSortable;
```

This is DOM/event-wiring code (creates a `Sortable` instance, wires a live event handler) and is exempt from the vitest requirement in `CLAUDE.md` rule 13, same as every other Sortable call site in the codebase today (none are unit-tested — see `_DOCS/SORTABLEJS_ONBOARDING.md` §7). Verification for every task below is manual, in-browser.

Callers keep their own `onEnd` body exactly as-is (that's the part that legitimately differs per module) and simply stop writing the destroy-guard and the `new Sortable(...)` wrapper by hand.

## Global Constraints

- `shared.js` loads before every `module-*.js` file (see `_DOCS/ARCHITECTURE.md` § Script Load Order), so `window.initManageListSortable` is available to all call sites unconditionally — no new guard needed.
- Preserve each site's existing conditional wrapping exactly (e.g. `if (content.defenses.length > 1) { ... }`, `if (typeof Sortable !== 'undefined' && content.attributes.length > 1) { ... }`). Only the inner destroy+create block is replaced by the helper call.
- Preserve each site's exact `onEnd` body, verbatim — including its `scheduleSave()`, any re-render call, and any index re-stamping.
- After each file migration, manually verify in a browser (open `main.html` directly — no build step, no TaleSpire host needed for this since it's pure DOM/JS): open the module's settings modal, drag a row to a new position, confirm the row order updates and no console errors appear.
- Update `_DOCS/ARCHITECTURE.md`'s `shared.js` row (rule 11 — inline doc update, same task as the code change) to list the new function.
- Mark each task complete in this file as you finish it (rule 17 — each task can run in its own session).

---

## Task 1: Add the helper to `shared.js` ✅

**Files:**
- Modify: `scripts/shared.js` — add the new section just before the final `window.X = ...` export block (currently ends around line 620)
- Modify: `_DOCS/ARCHITECTURE.md` — `shared.js` row in "JavaScript — Script Files", append `initManageListSortable(container, options)` to the function list

**Steps:**
- [ ] Add the `initManageListSortable` function and its `window` export as shown in "Proposed Helper" above.
- [ ] Update the `_DOCS/ARCHITECTURE.md` `shared.js` row.
- [ ] Open `main.html` in a browser. Confirm no console errors on load (the function is unused so far — this just checks for syntax errors).
- [ ] Commit: `git add scripts/shared.js _DOCS/ARCHITECTURE.md && git commit -m "Add initManageListSortable shared helper"`

---

## Task 2: Migrate `module-abilities.js` ✅

**Files:**
- Modify: `scripts/module-abilities.js:554-574`

**Before:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            if (data.content.abilities.length > 1) {
                manageList._sortable = new Sortable(manageList, {
                    handle: '.ability-manage-drag',
                    animation: 150,
                    ghostClass: 'ability-ghost',
                    draggable: '.ability-manage-row',
                    onEnd: function () {
                        const items = Array.from(manageList.querySelectorAll('.ability-manage-row'));
                        const reordered = items
                            .map((el) => data.content.abilities[parseInt(el.dataset.index, 10)])
                            .filter(Boolean);
                        data.content.abilities = reordered;
                        items.forEach(function (el, i) {
                            el.dataset.index = i;
                        });
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

**After:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            if (data.content.abilities.length > 1) {
                initManageListSortable(manageList, {
                    handleSelector: '.ability-manage-drag',
                    ghostClass: 'ability-ghost',
                    rowSelector: '.ability-manage-row',
                    onEnd: function () {
                        const items = Array.from(manageList.querySelectorAll('.ability-manage-row'));
                        const reordered = items
                            .map((el) => data.content.abilities[parseInt(el.dataset.index, 10)])
                            .filter(Boolean);
                        data.content.abilities = reordered;
                        items.forEach(function (el, i) {
                            el.dataset.index = i;
                        });
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

Note: same outer-destroy + `> 1` guard pattern as Defenses (Task 6). The outer destroy must survive so that when `abilities.length` drops to 1, the stale instance is cleaned up even though no new one is created.

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create an Abilities module, add 3+ abilities, open its settings, drag a row to reorder. Confirm the row order updates and the module body reflects the new order after closing settings.
- [ ] Commit: `git add scripts/module-abilities.js && git commit -m "Migrate Abilities Manage list to initManageListSortable"`

---

## Task 3: Migrate `module-stat.js` ✅

**Files:**
- Modify: `scripts/module-stat.js:513-528`

**Before:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            manageList._sortable = new Sortable(manageList, {
                handle: '.stat-manage-drag',
                animation: 150,
                ghostClass: 'stat-ghost',
                draggable: '.stat-manage-row',
                onEnd: function () {
                    var rows = Array.from(manageList.querySelectorAll('.stat-manage-row'));
                    data.content.stats = rows.map(function (r) { return data.content.stats[parseInt(r.dataset.index, 10)]; }).filter(Boolean);
                    rows.forEach(function (r, i) { r.dataset.index = i; });
                    scheduleSave();
                    renderRollableList();
                    reRenderModuleBody();
                    document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
                },
            });
```

**After:**
```js
            initManageListSortable(manageList, {
                handleSelector: '.stat-manage-drag',
                ghostClass: 'stat-ghost',
                rowSelector: '.stat-manage-row',
                onEnd: function () {
                    var rows = Array.from(manageList.querySelectorAll('.stat-manage-row'));
                    data.content.stats = rows.map(function (r) { return data.content.stats[parseInt(r.dataset.index, 10)]; }).filter(Boolean);
                    rows.forEach(function (r, i) { r.dataset.index = i; });
                    scheduleSave();
                    renderRollableList();
                    reRenderModuleBody();
                    document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
                },
            });
```

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Stat module, add 3+ stats, open its settings, drag a row to reorder. Confirm order updates in the settings list, the module body, and the Rollable Stats list.
- [ ] Commit: `git add scripts/module-stat.js && git commit -m "Migrate Stats Manage list to initManageListSortable"`

---

## Task 4: Migrate `module-savingthrow.js` ✅

**Files:**
- Modify: `scripts/module-savingthrow.js:489-504`

**Before:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            manageList._sortable = new Sortable(manageList, {
                handle: '.save-manage-drag',
                animation: 150,
                ghostClass: 'save-ghost',
                draggable: '.save-manage-row',
                onEnd() {
                    const rows = Array.from(manageList.querySelectorAll('.save-manage-row'));
                    content.saves = rows.map((r) => content.saves[parseInt(r.dataset.index, 10)]).filter(Boolean);
                    rows.forEach((r, i) => {
                        r.dataset.index = i;
                    });
                    scheduleSave();
                    reRenderModuleBody();
                },
            });
```

**After:**
```js
            initManageListSortable(manageList, {
                handleSelector: '.save-manage-drag',
                ghostClass: 'save-ghost',
                rowSelector: '.save-manage-row',
                onEnd() {
                    const rows = Array.from(manageList.querySelectorAll('.save-manage-row'));
                    content.saves = rows.map((r) => content.saves[parseInt(r.dataset.index, 10)]).filter(Boolean);
                    rows.forEach((r, i) => {
                        r.dataset.index = i;
                    });
                    scheduleSave();
                    reRenderModuleBody();
                },
            });
```

Note: leave the second Sortable instance in this same file (the custom tier list, ~line 768) untouched — it's a different list with a different shape, out of scope for this plan.

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Saving Throw module, add 3+ saves, open its settings, drag a row to reorder. Confirm order updates.
- [ ] Commit: `git add scripts/module-savingthrow.js && git commit -m "Migrate Saving Throw Manage list to initManageListSortable"`

---

## Task 5: Migrate `module-counters.js` ✅

**Files:**
- Modify: `scripts/module-counters.js:927-951`

**Before:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            manageList._sortable = new Sortable(manageList, {
                handle: '.counter-manage-drag',
                animation: 150,
                ghostClass: 'counter-ghost',
                draggable: '.counter-manage-row',
                onEnd: function () {
                    const rows = Array.from(manageList.querySelectorAll('.counter-manage-row'));
                    const reordered = rows
                        .map(function (row) {
                            return content.counters.find(function (c) {
                                return c.id === row.dataset.counterId;
                            });
                        })
                        .filter(Boolean);
                    content.counters = reordered;
                    content.counters.forEach(function (c, i) {
                        c.order = i;
                    });
                    content.sortBy = 'custom';
                    content.sortDir = 'asc';
                    scheduleSave();
                    reRenderCounterModule(moduleEl, data);
                },
            });
```

**After:**
```js
            initManageListSortable(manageList, {
                handleSelector: '.counter-manage-drag',
                ghostClass: 'counter-ghost',
                rowSelector: '.counter-manage-row',
                onEnd: function () {
                    const rows = Array.from(manageList.querySelectorAll('.counter-manage-row'));
                    const reordered = rows
                        .map(function (row) {
                            return content.counters.find(function (c) {
                                return c.id === row.dataset.counterId;
                            });
                        })
                        .filter(Boolean);
                    content.counters = reordered;
                    content.counters.forEach(function (c, i) {
                        c.order = i;
                    });
                    content.sortBy = 'custom';
                    content.sortDir = 'asc';
                    scheduleSave();
                    reRenderCounterModule(moduleEl, data);
                },
            });
```

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Counters module, add 3+ counters, open its settings, drag a row to reorder. Confirm order updates and `sortBy` resets to custom (column-header sort indicators clear).
- [ ] Commit: `git add scripts/module-counters.js && git commit -m "Migrate Counters Manage list to initManageListSortable"`

---

## Task 6: Migrate `module-defenses.js` ✅

**Files:**
- Modify: `scripts/module-defenses.js:655-678`

**Before:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            if (content.defenses.length > 1) {
                manageList._sortable = new Sortable(manageList, {
                    handle: '.def-manage-drag',
                    animation: 150,
                    ghostClass: 'cv-drag-ghost',
                    draggable: '.def-manage-row',
                    onEnd: function () {
                        const ids = Array.from(manageList.querySelectorAll('.def-manage-row')).map(function (el) {
                            return el.dataset.id;
                        });
                        const reordered = ids
                            .map(function (id) {
                                return content.defenses.find(function (d) {
                                    return d.id === id;
                                });
                            })
                            .filter(Boolean);
                        content.defenses = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

**After:**
```js
            if (manageList._sortable) manageList._sortable.destroy();
            if (content.defenses.length > 1) {
                initManageListSortable(manageList, {
                    handleSelector: '.def-manage-drag',
                    ghostClass: 'cv-drag-ghost',
                    rowSelector: '.def-manage-row',
                    onEnd: function () {
                        const ids = Array.from(manageList.querySelectorAll('.def-manage-row')).map(function (el) {
                            return el.dataset.id;
                        });
                        const reordered = ids
                            .map(function (id) {
                                return content.defenses.find(function (d) {
                                    return d.id === id;
                                });
                            })
                            .filter(Boolean);
                        content.defenses = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

Note: the outer `if (manageList._sortable) manageList._sortable.destroy();` stays — it must run even when `content.defenses.length` drops to 1 and the `if` block is skipped, otherwise a stale instance would linger on a list that's no longer sortable. The helper's own destroy-guard only fires when the helper itself is called.

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Defenses module, add 3+ defenses, open its settings, drag a row to reorder. Confirm order updates. Then delete defenses down to 1 and confirm no drag handle/console error appears.
- [ ] Commit: `git add scripts/module-defenses.js && git commit -m "Migrate Defenses Manage list to initManageListSortable"`

---

## Task 7: Migrate `module-recovery.js` ✅

**Files:**
- Modify: `scripts/module-recovery.js:387-401`

**Before:**
```js
            if (typeof Sortable !== 'undefined' && content.restButtons.length > 1) {
                btnList._sortable = Sortable.create(btnList, {
                    handle: '.recovery-btn-drag-handle',
                    animation: 150,
                    ghostClass: 'recovery-btn-ghost',
                    draggable: '.recovery-btn-row',
                    onEnd() {
                        const rows = Array.from(btnList.querySelectorAll('.recovery-btn-row'));
                        const newOrder = rows.map((r) => r.dataset.btnId);
                        content.restButtons.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

**After:**
```js
            if (typeof Sortable !== 'undefined' && content.restButtons.length > 1) {
                initManageListSortable(btnList, {
                    handleSelector: '.recovery-btn-drag-handle',
                    ghostClass: 'recovery-btn-ghost',
                    rowSelector: '.recovery-btn-row',
                    onEnd() {
                        const rows = Array.from(btnList.querySelectorAll('.recovery-btn-row'));
                        const newOrder = rows.map((r) => r.dataset.btnId);
                        content.restButtons.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

Note: this file has no pre-existing destroy call at all before the block (unlike Task 6) — confirm via `grep -n "_sortable" scripts/module-recovery.js` before editing that this is still true; if `renderBtnList()` (containing this block) can run more than once against the same `btnList` element without a full re-creation of `btnList`, the helper's built-in destroy-guard now fixes a latent duplicate-instance risk for free.

**Steps:**
- [ ] Confirm via grep that no destroy call precedes this block today.
- [ ] Apply the replacement above.
- [ ] In a browser, create a Recovery module, add 3+ rest buttons, open its settings, drag a row to reorder. Confirm order updates.
- [ ] Commit: `git add scripts/module-recovery.js && git commit -m "Migrate Recovery Manage list to initManageListSortable"`

---

## Task 8: Migrate `module-companions.js` ✅

**Files:**
- Modify: `scripts/module-companions.js:929-949`

**Before:**
```js
            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                attrListEl._sortable = new Sortable(attrListEl, {
                    handle: '.companion-attr-drag-handle',
                    animation: 150,
                    ghostClass: 'companion-attr-ghost',
                    draggable: '.companion-attr-row',
                    onEnd: function () {
                        var rows = Array.from(attrListEl.querySelectorAll('.companion-attr-row'));
                        var reordered = rows
                            .map(function (r) {
                                return content.attributes.find(function (a) {
                                    return a.id === r.dataset.attrId;
                                });
                            })
                            .filter(Boolean);
                        content.attributes = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

**After:**
```js
            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                initManageListSortable(attrListEl, {
                    handleSelector: '.companion-attr-drag-handle',
                    ghostClass: 'companion-attr-ghost',
                    rowSelector: '.companion-attr-row',
                    onEnd: function () {
                        var rows = Array.from(attrListEl.querySelectorAll('.companion-attr-row'));
                        var reordered = rows
                            .map(function (r) {
                                return content.attributes.find(function (a) {
                                    return a.id === r.dataset.attrId;
                                });
                            })
                            .filter(Boolean);
                        content.attributes = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
```

Note: `module-companions.js` also has a second, unrelated Sortable instance at line 654 (the companion table rows themselves). Leave it untouched — it's a different list, not a "Manage list" settings pattern, and out of scope.

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Companions module, open its settings, add 3+ custom attributes, drag a row to reorder. Confirm order updates.
- [ ] Commit: `git add scripts/module-companions.js && git commit -m "Migrate Companions Manage Attributes list to initManageListSortable"`

---

## Task 9: Migrate `module-list.js` ✅

**Files:**
- Modify: `scripts/module-list.js:1223-1237`

**Before:**
```js
            attrList._sortable = new Sortable(attrList, {
                handle: '.list-attr-drag-handle',
                animation: 150,
                ghostClass: 'list-attr-ghost',
                draggable: '.list-attr-row',
                onEnd: function () {
                    const orderedIds = Array.from(attrList.querySelectorAll('.list-attr-row')).map(function (el) {
                        return el.dataset.attrId;
                    });
                    content.attributes.sort(function (a, b) {
                        return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
                    });
                    scheduleSave();
                },
            });
```

**After:**
```js
            initManageListSortable(attrList, {
                handleSelector: '.list-attr-drag-handle',
                ghostClass: 'list-attr-ghost',
                rowSelector: '.list-attr-row',
                onEnd: function () {
                    const orderedIds = Array.from(attrList.querySelectorAll('.list-attr-row')).map(function (el) {
                        return el.dataset.attrId;
                    });
                    content.attributes.sort(function (a, b) {
                        return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
                    });
                    scheduleSave();
                },
            });
```

Note: this is the one site that had no destroy-guard before today. Check (via `grep -n "attrList" scripts/module-list.js` around this block) whether the function containing this code runs more than once per modal open without fully recreating the `attrList` element — if so, this migration also fixes a pre-existing leaked-instance bug, not just a style cleanup. Call this out if found.

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a List module, open Manage Attributes, add 3+ custom attributes, drag a row to reorder. Confirm order updates. Open/close the panel a few times and drag again, to specifically check for the leaked-instance case noted above.
- [ ] Commit: `git add scripts/module-list.js && git commit -m "Migrate List Manage Attributes to initManageListSortable"`

---

## Task 10: Migrate `module-spells.js` ✅

**Files:**
- Modify: `scripts/module-spells.js:1415-1430`

**Before:**
```js
            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                attrListEl._sortable = new Sortable(attrListEl, {
                    handle: '.spells-attr-drag-handle',
                    animation: 150,
                    ghostClass: 'spells-attr-ghost',
                    draggable: '.spells-attr-row',
                    onEnd() {
                        const rows = Array.from(attrListEl.querySelectorAll('.spells-attr-row'));
                        content.attributes = rows
                            .map((r) => content.attributes.find((a) => a.id === r.dataset.attrId))
                            .filter(Boolean);
                        scheduleSave();
                        reRender();
                    },
                });
            }
```

**After:**
```js
            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                initManageListSortable(attrListEl, {
                    handleSelector: '.spells-attr-drag-handle',
                    ghostClass: 'spells-attr-ghost',
                    rowSelector: '.spells-attr-row',
                    onEnd() {
                        const rows = Array.from(attrListEl.querySelectorAll('.spells-attr-row'));
                        content.attributes = rows
                            .map((r) => content.attributes.find((a) => a.id === r.dataset.attrId))
                            .filter(Boolean);
                        scheduleSave();
                        reRender();
                    },
                });
            }
```

**Steps:**
- [ ] Apply the replacement above.
- [ ] In a browser, create a Spells module, open its settings, add 3+ shared column attributes, drag a row to reorder. Confirm order updates.
- [ ] Commit: `git add scripts/module-spells.js && git commit -m "Migrate Spells Manage Attributes list to initManageListSortable"`

---

## Task 11: Close out the docs ✅

**Files:**
- Modify: `_DOCS/SORTABLEJS_ONBOARDING.md`

**Steps:**
- [ ] In §3 "Pattern A — Reorder Only", update the abilities code example to show the post-migration form (calling `initManageListSortable`), and add a sentence noting the shared helper now exists and where (`shared.js`).
- [ ] In §6 "Design Issues Worth Reviewing", mark issue #1 as resolved, with a one-line pointer to this plan file and to `shared.js`'s `initManageListSortable`.
- [ ] Commit: `git add _DOCS/SORTABLEJS_ONBOARDING.md && git commit -m "Update SortableJS onboarding doc after Manage-list helper extraction"`

---

## Self-Check (spec coverage)

- All 9 duplicate sites from `_DOCS/SORTABLEJS_ONBOARDING.md` §6 issue #1 have a task: Tasks 2–10. ✓
- Helper creation and its `_DOCS/ARCHITECTURE.md` update: Task 1. ✓
- Non-goals (cross-list group sites, tier-list in savingthrow, companion table rows) are explicitly excluded and called out inline in the relevant tasks so a future reader isn't left wondering why they weren't touched. ✓
- Onboarding doc closes the loop: Task 11. ✓
