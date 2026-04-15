# Grid Dense Packing

## Context

Modules currently use CSS Grid auto-flow with pixel-based heights. The grid engine doesn't know about row spanning, so smaller modules can't fill gaps beside tall modules. For example, placing a 2-col/2-row module next to two stacked 2-col/1-row modules is impossible — the third module always drops below the first.

This change switches to `grid-auto-flow: dense` with proper `grid-row: span N`, so the browser automatically packs modules into available gaps. No new UI or save-data changes needed.

## Files to Modify

- `main.css` (~line 786) — `#module-grid` rule
- `scripts/module-core.js` — `renderModule()` (~line 754), `snapModuleHeight()` (~line 1328), `initResizeHandle()` (~line 1364)

## Changes

### 1. `#module-grid` CSS (`main.css:786`)

```css
#module-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-flow: dense;
    grid-auto-rows: 80px;
    align-items: stretch;
    gap: 8px;
    padding: 8px;
}
```

- Add `grid-auto-flow: dense` — enables automatic gap-filling
- Add `grid-auto-rows: 80px` — defines consistent row tracks (matches existing `ROW_H` constant)
- Change `align-items: start` to `stretch` — modules must fill their allocated grid tracks (with `start`, a `grid-row: span 2` module would collapse to content height)

### 2. `renderModule()` — use `grid-row` instead of pixel height (`module-core.js:754-756`)

Replace:
```js
if (data.rowSpan) {
    el.style.height = `${data.rowSpan * ROW_H + (data.rowSpan - 1) * GRID_GAP}px`;
}
```

With:
```js
if (data.rowSpan) {
    el.style.gridRow = `span ${data.rowSpan}`;
}
```

Also add after this block, for hline modules:
```js
if (data.type === 'hline') {
    el.style.alignSelf = 'start';
}
```

hline modules are thin dividers — without `alignSelf: start`, they'd stretch to fill an 80px row track.

### 3. `snapModuleHeight()` — compute grid-row span (`module-core.js:1328-1339`)

Replace the function body:
```js
function snapModuleHeight(el, data) {
    if (data.rowSpan !== null) return;
    if (data.type === 'hline') return;
    _snapping = true;
    el.style.gridRow = '';
    el.style.alignSelf = 'start';       // collapse to content height for measurement
    const actual = el.getBoundingClientRect().height;
    const snappedRows = Math.ceil((actual + GRID_GAP) / (ROW_H + GRID_GAP));
    el.style.alignSelf = '';             // restore stretch
    el.style.gridRow = `span ${snappedRows}`;
    _snapping = false;
}
```

Key detail: temporarily set `alignSelf: start` during measurement so the module collapses to its natural content height (otherwise `stretch` would clamp it to the 80px row track).

### 4. `initResizeHandle()` — use `grid-row` during resize (`module-core.js:1420-1424`)

Replace the pixel height calculation in `onMouseMove`:
```js
const newHeight = newRowSpan * rowHeight + (newRowSpan - 1) * GRID_GAP;
moduleEl.style.height = `${newHeight}px`;
```

With:
```js
moduleEl.style.gridRow = `span ${newRowSpan}`;
```

## Why the Math Works

With `grid-auto-rows: 80px` and `gap: 8px`:
- `grid-row: span 1` = 80px
- `grid-row: span 2` = 80 + 8 + 80 = 168px (matches old `2*80 + 1*8`)
- `grid-row: span 3` = 80 + 8 + 80 + 8 + 80 = 256px (matches old `3*80 + 2*8`)

Identical to the pixel formula. No visual change for existing modules.

## No Save Data Changes

`rowSpan` is already stored as an integer (or `null` for auto-height). We're just changing how it's applied to CSS — from pixel height to `grid-row: span N`.

## Edge Cases

- **hline modules**: Get `alignSelf: start` so they don't stretch to 80px
- **Auto-height modules**: `snapModuleHeight()` temporarily collapses the module to measure content, computes row span, and applies it. The `_snapping` flag prevents ResizeObserver re-entrancy
- **SortableJS**: After drag-and-drop, dense packing re-lays out modules. The dropped module may shift from where the ghost was — this is inherent to dense packing and acceptable
- **Existing saves**: Load and display identically — no migration needed

## Verification

1. Create a 2-col/2-row module, then two 2-col/1-row modules — the smaller ones should stack beside the tall one
2. Resize a module via the corner handle — should snap to grid rows correctly
3. Drag-reorder modules — they settle into dense-packed positions
4. Auto-height modules (no explicit rowSpan) should size to content and snap to row grid
5. hline modules should render as thin dividers, not 80px tall
6. Switch between play/edit mode — auto-height modules re-snap correctly
7. Save and reload — layout persists correctly
