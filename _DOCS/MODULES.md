# Modules
## Module Summary
Modules are resizable containers. These modules contain other sections of a character sheet inside of it. The point of a module is to organize things as groups. Another way to think of them are as "sections". A traditional character sheet for something like Dungeons & Dragons 5e has the "stats section" and a "saving throws" section. It may also have an "inventory section" and a "spells section" for example.

Inside of a module, the user can add as many submodules as they want of the same type. If they select a `Stat` type module, they can add however many stats they want. If they select a `List` type, they can add multiple lists inside the same module, example would be multiple carrying vessels like a backpack and belt pouch having separate inventory lists. Items in those lists can be moved to any other list.

> **Terminology:** A **module** is a container. A **submodule** is something that goes inside a module. Submodule design docs live in `./_DOCS/SUBMODULES/`.

## Resizing Modules
These modules can change size to accommodate different designs and quantity of things contained therein. To resize, the user drags a corner sizing handle which snaps to rows and columns as they drag. Neighboring modules will move to accommodate.

## Module Options Menu
When a new module is added, ask the user these questions before creating the resulting module. The user cannot proceed without answering, but can cancel out of the wizard to abort the process.

- `Type` - Select the submodule type for this module:
    - `Horizontal Line` - used to visually split modules apart. E.g. split "Main Stats" from "Saving Throws" with a horizontal line. These horizontal line modules fit between grid rows.
    - `Stat` - Module type used to store stat block boxes typically containing a raw stat and a modifier in the corner of each stat box
      - `Large stat` - The raw stat is the center element, the modifier is in the smaller corner element
      - `Large modifier` - The modifier is the center element, the raw stat is in the smaller corner element
    - `List` - List type modules have two options:
        - `Unweighted` - Useful when the list does not need to account for weight. Used for more general purpose lists
        - `Weighted` - Useful when the contents of the list need to account for weight, like a backpack. Weight values are optional, but the user can set the `Max Weight` and contents of the module will accumulate into a `Current Weight` value in the form of "`Current Weight` / `Max Weight`".
    - `Text Box` - Used to write simple notes. The text box can be resized by dragging a corner sizing handle
- `Module Theme` - Offer simple color pallete or RGBA picker to set a custom background color of that module only

## Moving Modules
The user can modify the layout of their character sheet by moving modules around their sheet. To move a module, the user grabs the selection drag-handle at the edge of a module and positions it where they want to drop it. The neighboring modules will react accordingly by moving up, down, left, or right to accommodate.

By mixing sizes of neighboring modules, the user can organize however they desire. Example, the user can place two 1x2 modules side by side for a width of 4. But with a max width of 4 units wide in the window, a 1x3 cannot fit next to a 1x2 as the total width is 5 units. In this situation, the UI will suggest dropping the module above or below the target but not next to it.

---
---

## Implementation Notes

### Tech Stack
- **Layout Engine**: CSS Grid (4-column grid)
- **Drag & Drop**: [SortableJS](https://github.com/SortableJS/Sortable) (~8KB min+gzip, zero dependencies, no build step required)
- **Everything else**: Vanilla HTML/CSS/JS — no frameworks needed

### CSS Grid Setup
- The module container uses a 4-column grid: `grid-template-columns: repeat(4, 1fr)`
- Module width maps directly to `grid-column: span N` where N = 1–4
- Module height is `auto` by default — grows with content. User can manually resize via the corner handle to set a fixed height

### SortableJS Integration
```js
new Sortable(document.getElementById('module-grid'), {
  handle: '.module-drag-handle',
  animation: 150,
  ghostClass: 'module-ghost',       // CSS class for the drop placeholder
  chosenClass: 'module-dragging',   // CSS class while dragging
  onEnd: function(evt) {
    // Custom placement logic runs here
    // Validate drop position against 4-unit row constraint
    // Reflow neighboring modules if needed
  }
});
```

### Custom Placement Logic (onEnd callback)
SortableJS handles the drag interaction; the placement rules are custom code:

1. **Row-width validation** — After a drop, walk each row and sum the column spans. If a row exceeds 4 units, bump the overflow module to the next row.
2. **Drop suggestion** — While dragging, preview valid drop zones. If the dragged module's span + the target row's occupied span > 4, only highlight above/below positions, not beside.
3. **Neighbor reflow** — When a module is inserted or removed from a row, shift siblings left to fill gaps. Rows with no modules collapse.

### Module Data model
Each module is tracked as a JS object:
```js
{
  id: 'module-001',
  type: 'stats',           // submodule type (stats, inventory, spells, etc.)
  colSpan: 2,              // horizontal size: 1–4
  order: 0                 // position index in the grid
}
```
Module state is stored as an array, serialized to TaleSpire symbiote state for persistence.

### Settings Menu
- Each module renders a gear icon that toggles a small popover
- Popover contains:
  - **Horizontal Size** dropdown (1x1 through 1x4) — updates `colSpan` and `grid-column: span N`
- Changes apply immediately and trigger a row-width revalidation pass