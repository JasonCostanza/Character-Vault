# SortableJS Onboarding

> Purpose: give a new engineer the facts needed to fix or improve drag-and-drop in Character Vault. Read this file first. Then open the code files listed below.

## 1. What This Project Uses

Character Vault uses the SortableJS library for all drag-and-drop.

- Library: [SortableJS](https://github.com/SortableJS/Sortable)
- Version: 1.15.6
- Loaded from a CDN in `main.html`, line 35:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>
  ```
- No npm package. No build step. The library is a single global `Sortable` object.
- Full SortableJS docs: https://github.com/SortableJS/Sortable#readme

There is no custom drag code. Every drag-and-drop feature in the app calls `new Sortable(...)` or `Sortable.create(...)`.

## 2. Where SortableJS Is Used

The app creates 20 separate Sortable instances across 15 files. Each instance controls one drag list. Some modules have more than one.

| File | Line | What it sorts |
|---|---|---|
| `scripts/module-core.js` | 881 | The main module grid (drag a module card to reorder it on the sheet) |
| `scripts/tabs.js` | 730 | The tab bar (drag a tab to reorder tabs) |
| `scripts/module-abilities.js` | 556 | Manage Abilities list (settings modal) |
| `scripts/module-stat.js` | 514 | Manage Stats list (settings modal) |
| `scripts/module-savingthrow.js` | 490, 768 | Manage Saves list; custom tier list |
| `scripts/module-counters.js` | 928 | Manage Counters list |
| `scripts/module-companions.js` | 654, 930 | Companion table rows; Manage Attributes list |
| `scripts/module-list.js` | 850, 1223 | List item rows (cross-module drag); Manage Attributes list |
| `scripts/module-condition.js` | 2593, 2603 | Staging area (source); Applied conditions (target) |
| `scripts/module-resistance.js` | 550, 561 (×N) | Staging area (source); one instance per column (immunities/resistances/weaknesses/custom), created in a `.forEach` at line 560 — 4 instances typical, not 2 |
| `scripts/module-defenses.js` | 479, 657 | Quick Defense buttons; Manage Defenses list |
| `scripts/module-actions.js` | 101 | Action pills |
| `scripts/module-recovery.js` | 388 | Manage Rest Buttons list |
| `scripts/module-weapons.js` | 1856 | Weapon rows per hand slot (main/off) |
| `scripts/module-spells.js` | 1416 | Manage spell column attributes list |

**Tip:** search for `new Sortable(` or `Sortable.create(` to find every instance directly. Do not trust line numbers above once the files change — re-search.

## 3. The Two Drag Patterns Used

Every Sortable instance in this codebase falls into one of two patterns.

### Pattern A — Reorder Only (most common)

One list. The user drags rows up and down inside it. On drop, the code reads the new DOM order and writes it back into the data array.

All reorder-only lists in settings modals use a shared helper in `scripts/shared.js` called `initManageListSortable(container, options)`. It handles the destroy-before-recreate lifecycle (see §5) and hardcodes `animation: 150`. Each caller supplies its own `onEnd` callback.

Example, from `module-abilities.js`:
```js
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
        scheduleSave();
    },
});
```

Key point: SortableJS moves DOM elements only. It never touches your data array. Your `onEnd` handler is responsible for reading the new DOM order and rewriting the array. If you forget this step, the drag looks like it worked, but the change is lost on the next re-render or save.

### Pattern B — Cross-List Transfer

Two or more lists share a `group` name. The user can drag an item from one list into another. SortableJS moves the DOM element for you; your code decides what happens to the data.

Three variants exist in this codebase:

**B1. Clone from a palette (Resistance, Condition modules)**
A "staging" list holds template items. Dragging from staging does not remove the template — it clones it into the target list.
```js
// source (module-resistance.js:550)
stagingGrid._sortable = new Sortable(stagingGrid, {
    group: { name: 'res-assign', pull: 'clone', put: false },
    sort: false,
    ...
});
// target (module-resistance.js:561)
colList._sortable = new Sortable(colList, {
    group: { name: 'res-assign', pull: true, put: true },
    ...
    onAdd: function (evt) { /* create the real data entry, remove the cloned DOM node */ }
});
```

**B2. Move between columns in the same module (Weapons module)**
Main-hand and off-hand weapon lists share a group name that is unique per module instance (`'weapon-manage-' + data.id`). This lets the user drag a weapon between hands, but stops drag from leaking into a different Weapons module elsewhere on the sheet.

**B3. Move between separate module instances (List module)**
Every List module's item container shares the same group name, `'list-transfer'`. A user can drag an inventory item from one List module directly into another. `onAdd` on the target list calls `transferItem()`, which removes the item from the source module's data and adds it to the target module's data, then re-renders both modules.

## 4. Standard Config Options Used Everywhere

| Option | Meaning | Typical value here |
|---|---|---|
| `handle` | CSS selector for the drag handle. Only clicking this element starts a drag. | `.module-drag-handle`, `.ability-manage-drag`, etc. |
| `draggable` | CSS selector for what counts as a draggable row. | `.ability-manage-row`, `.list-item-row`, etc. |
| `animation` | Drag/drop animation duration in ms. | `150` (used everywhere — keep it consistent) |
| `ghostClass` | CSS class applied to the placeholder left in the original spot while dragging. | e.g. `ability-ghost`, `module-ghost` |
| `group` | Shares drag capability across multiple lists. String = simple sharing. Object = fine control (`pull`/`put`). | Only set when cross-list drag is needed (Pattern B) |
| `sort` | Whether items can be reordered inside the list itself. | `false` on staging/clone-only lists |
| `onStart` / `onEnd` / `onAdd` | Lifecycle callbacks. `onEnd` fires on the list the drag started in. `onAdd` fires on the list an item was dropped into (cross-list only). | see Pattern A/B examples above |

**Ghost effect convention:** every ghost class in this project uses the same dashed-border look (see `feedback_drag_ghost_style` team convention — dashed border, muted background, no shadow). Example from `css/modules.css`:
```css
.module-ghost {
    opacity: 0.3;
    border: 2px dashed var(--cv-accent);
    background-color: var(--cv-bg-sunken);
    box-shadow: none;
}
```
If you add a new sortable list, copy this pattern for its ghost class. Do not invent a new visual style.

## 5. The One Rule That Prevents Most Bugs

**Destroy the old Sortable instance before you re-render its list.**

Every module that re-renders a sortable list (settings modals, list bodies, etc.) follows this exact sequence:

```js
if (container._sortable) {
    container._sortable.destroy();
}
container.innerHTML = '';           // or otherwise clear/rebuild the DOM
// ... rebuild rows ...
container._sortable = new Sortable(container, { ... });
```

Why this matters: SortableJS attaches listeners to the DOM element and registers the element in an internal group registry (used for cross-list drag). If you replace the element's contents without calling `.destroy()` first, you get:
- Duplicate/ghost Sortable instances still listening on detached or stale nodes.
- Cross-list drag (`group`) breaking, because the registry holds a reference to an instance that no longer matches the visible list.

The instance is stored on the DOM node itself as `el._sortable` so it can be found again later. This is the project's own convention, not a SortableJS requirement — SortableJS also exposes `Sortable.get(el)` for the same purpose (used once, in `module-weapons.js:1850`, for the per-slot weapon lists).

## 6. Design Issues Worth Reviewing

If you are looking at this codebase to help debug or redesign drag-and-drop, these are the areas most likely to need attention, ranked by how much they matter.

1. **~~The "Manage list" reorder pattern was copy-pasted nearly verbatim in 9+ files.~~** **Resolved.** The Sortable lifecycle (destroy + create + store) is now handled by `initManageListSortable(container, options)` in `scripts/shared.js`. Each module still owns its `onEnd` callback. This was the biggest finding. It's not that some modules hold more than one Sortable instance — several do, but each of those is either a paired cross-list feature (Condition, Resistance — see Pattern B1, required by the library, not a smell) or one instance per hand slot (Weapons — same reason). The real duplication is a *different* pattern: a settings-modal list where the user drags a row, the code reads `dataset.index` (or a dataset ID), rewrites the matching data array in the new order, then calls `scheduleSave()`. That exact 15–20 line block appears, with only CSS class names and array field names changed, in:
   `module-abilities.js:556`, `module-stat.js:514`, `module-savingthrow.js:490`, `module-counters.js:928`, `module-defenses.js:657`, `module-recovery.js:388`, `module-companions.js:930`, `module-list.js:1223`, `module-spells.js:1416`.
   Two of those files (`module-savingthrow.js`, `module-companions.js`) each carry *two* independent copies of the boilerplate in the same file, for two unrelated lists — that's the "some modules have more than one" case worth caring about, not the cross-list pairs.
   Likely why it exists: `CLAUDE.md` rule 12 keeps each `module-*.js` file deliberately isolated (IIFE + selective `window` exposure), and the project's general convention favors avoiding shared abstractions until they're clearly justified ("three similar lines is better than a premature abstraction"). At 9+ near-identical copies, that threshold has been passed — this is a legitimate case for a shared helper in `shared.js`, not premature abstraction.
2. **`_DOCS/ARCHITECTURE.md` is out of date on the module grid.** It currently states the module grid uses "custom pointer-drag (free placement), replaces SortableJS for the grid" — this is **wrong**. The grid (`module-core.js:881`) still uses SortableJS today, same as every other list. Flag this to Jason before trusting that file's drag description.
3. **Group-name collisions are manual.** Cross-list groups are plain strings (`'list-transfer'`, `'weapon-manage-' + data.id`, `'res-assign'`, `'cond-assign'`). There is no central registry of group names. A typo or a copy-paste into a new module could silently create an unintended cross-list drag connection.
4. **`Sortable.get(el)` vs. `el._sortable`.** Only one file (`module-weapons.js`) uses the library's own `Sortable.get()` lookup. Every other file stores the instance on a custom `_sortable` property. Both work, but the inconsistency is worth noting if you standardize the destroy/rebuild pattern.

## 7. How to Reproduce and Test Changes

There is no build step. Open `main.html` directly, or serve the folder with any static file server, in a regular Chromium-based browser. `TS.*` calls (the TaleSpire host API) will fail outside TaleSpire itself, but all SortableJS drag behavior is pure DOM/JS and works fine in a normal browser tab.

No automated tests currently cover SortableJS behavior directly (drag interactions are DOM/event-driven and are exempt from the project's unit test rule — see `_DOCS/TESTING.md`). Manual testing in-browser is the way to verify a fix.
