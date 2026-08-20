# Responsive Layout & Size Classes

Reference for how modules adapt to different sizes, ResizeObserver behavior, and grid layout constraints.

---

## Size Class System

Every module element gets a `data-size` attribute that modules can use for CSS targeting. The attribute is set by a `ResizeObserver` watching each module's content width.

### Breakpoints

Set in `module-core.js` → `moduleSizeObserver` callback:

| `data-size` | Width (content box) | Typical grid span |
|---|---|---|
| `xs` | < 100px | 1 col |
| `sm` | 100–199px | 1 col |
| `md` | 200–349px | 1–2 cols |
| `lg` | ≥ 350px | 2+ cols |

Default is `lg` (no condition hit). Size class is set as `mod.dataset.size = size`, which maps to `[data-size="xs"]` in CSS.

### How to Use in CSS

```css
/* Normal layout */
.stat-block { display: grid; grid-template-columns: repeat(3, 1fr); }

/* Compact layout at small sizes */
.module[data-size="xs"] .stat-block,
.module[data-size="sm"] .stat-block {
  grid-template-columns: repeat(2, 1fr);
}
```

Always scope size rules to `.module[data-size="xs"]` — never write bare `.xs` selectors, which would match globally.

### Why Not CSS container queries?

TaleSpire's embedded Chromium supports container queries, but they don't interact cleanly with the `data-size` system we already have. The `ResizeObserver` approach is explicit and predictable — stick with `data-size`.

---

## ResizeObserver Setup

`moduleSizeObserver` is created in `module-core.js`. Modules are observed/unobserved automatically:

- **Observed**: when `renderModule()` mounts a new module element
- **Unobserved**: when `deleteModule()` removes one

The observer checks `contentBoxSize[0].inlineSize` (with a `contentRect.width` fallback for older Chromium).

**Re-snap trigger**: When a module's `rowSpan === null` (auto-height mode), any size change also calls `snapModuleHeight()` to recalculate the row span. This prevents the module from growing taller than its content.

### In Tests

`ResizeObserver` is mocked in `tests/helpers/setup.js`:

```js
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

Size class logic isn't unit-testable — test in TaleSpire directly at different module widths.

---

## CSS Grid Layout

`#module-grid` is a 4-column CSS Grid:

```css
#module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
}
```

Constants in `module-core.js`:

```js
const GRID_COLUMNS = 4;
const GRID_GAP = 8;      // px, matches CSS gap
```

### Column Spans

Modules span 1–4 columns:

```js
el.style.gridColumn = `span ${data.colSpan}`;
```

### Row Height

Two modes:
1. **Auto-height** (`data.rowSpan === null`): Module height is driven by content. `snapModuleHeight()` recalculates the `grid-row` span after each resize.
2. **Fixed height** (`data.rowSpan` is a number): Explicitly set by drag-resize.

```js
// Fixed height formula:
const height = data.rowSpan * 80 + (data.rowSpan - 1) * 8; // px
el.style.height = height + 'px';
el.style.gridRow = `span ${data.rowSpan}`;
```

The `80px` row unit and `8px` gap are hard-coded constants. Never compute row height outside of `module-core.js`.

---

## Module Toolbar Collapse

At small sizes, the module toolbar can't fit all buttons. The standard pattern:

- At `xs` / `sm`: hide individual toolbar buttons, show a kebab/overflow menu instead
- The overflow menu (`module-menu`) exposes the same actions in a compact flyout

CSS pattern:
```css
/* Show toolbar buttons at normal sizes */
.module-copy-btn,
.module-delete-btn { display: flex; }

/* Hide at small sizes, show overflow menu instead */
.module[data-size="xs"] .module-copy-btn,
.module[data-size="xs"] .module-delete-btn { display: none; }

.module[data-size="xs"] .module-overflow-btn { display: flex; }
```

---

## Scrollbar Layout Shift Prevention

**Rule**: All containers with `overflow-y: auto` or `overflow-x: auto` must include `scrollbar-gutter: stable`.

```css
.module-body {
  overflow-y: auto;
  scrollbar-gutter: stable; /* REQUIRED — prevents content shift on scrollbar appear */
}
```

Without this, adding content that causes a scrollbar to appear shifts the content inward by ~15px (the scrollbar width). This creates jarring jumps when lists grow.

Apply to:
- `.module-body` (already present)
- `.cv-modal-body` (already present)
- Any new scrollable container you introduce

---

## Scrollbar Theming

All scrollable elements should use the themed scrollbar style:

```css
.your-scrollable-container {
  scrollbar-width: thin;
  scrollbar-color: var(--cv-scrollbar-thumb) transparent;
}

.your-scrollable-container::-webkit-scrollbar { width: 4px; }
.your-scrollable-container::-webkit-scrollbar-track { background: transparent; }
.your-scrollable-container::-webkit-scrollbar-thumb {
  background: var(--cv-scrollbar-thumb);
  border-radius: 2px;
}
```

The `--cv-scrollbar-thumb` token is defined in all six themes in `main.css`.

---

## Gotchas

### z-index and Stacking Contexts

Modules that use `transform` or `will-change` create stacking contexts. This can cause modals and overlays to appear behind module content even at high z-index. Avoid applying transforms to `.module` itself.

### Fixed-height modules and overflow

When `data.rowSpan` is set, the module has a fixed pixel height. If content is taller, it clips. Module bodies must use `overflow-y: auto` so content scrolls rather than overflows the card boundary.

### Min-width on narrow viewports

At very narrow viewports (e.g., TaleSpire sidebar mode), all columns collapse. 1-column-span modules may become narrower than their minimum content width. Use `min-width: 0` on flex children inside modules to prevent overflow rather than horizontal scroll.

### Drag ghost size

During SortableJS drag, the dragged module's `transform` is managed by SortableJS. The `.module-ghost` placeholder should use `border: 2px dashed var(--cv-border)` and no background, matching the project-wide ghost style convention.
