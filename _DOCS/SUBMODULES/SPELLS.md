# Spells Module

## Summary

The Spells module provides spell tracking in a table-based layout, matching the visual pattern of the Companions and List modules. Spells are organized into user-defined categories (e.g. "Level 1 Spells", "Cantrips") and displayed as rows in a per-category table with sortable, configurable attribute columns. Spell slot spending is deferred to dice roll resolution rather than button press.

There is no pre-populated spell library — users build their own from scratch.

---

## Spell Slots

Spell slots are pip-style buttons displayed in a summary bar at the top of the module. Each slot level shows a label and one pip per slot — filled (●) = available, outline (○) = spent. Clicking a pip toggles spent state. A "Restore All" button resets all levels.

Slot levels are user-managed: add, set max, and delete them in the settings modal or in the layout-mode summary bar.

Slot spending can be automatic (triggered on roll resolution) or manual (click a pip). Both behaviors are toggled in the module settings.

### Category Header Inline Pips

If a category has a slot level assigned, a compact pip row appears in its header. These pips share state with the summary bar — clicking either updates the same data and both re-render.

---

## Spell Categories

Each category is a collapsible block containing a table of spells. The category header shows:
- A collapse/expand chevron
- The category name
- Inline pips for the associated slot level (if any)

Categories link to a slot level via `slotLevel` (an integer matching `slotLevels[].level`, or `null` for cantrips/untracked).

---

## Spell Attributes (Columns)

Shared attribute definitions live on `content.attributes` — the same record is the column definition for every category table. Attributes have:
- `id`: generated key used as the property name in `spell.values`
- `name`: column header label
- `type`: `text`, `number`, `number-pair`, or `toggle`
- `pinned`: when `true`, shown as a table column; when `false`, data is kept but hidden
- `builtIn`: `false` for all user-created attributes (no built-in columns exist)

Add, pin/unpin, reorder, and delete attributes in the Settings modal. Deleting removes the value from every spell's `values` map.

---

## Play Mode

Each spell is a table row:
- Chevron → expand/collapse the description drawer below the row
- Name cell → read-only display
- Attribute cells → read-only display (dice notation rendered via `TS.symbiote.diceFinder` if available)
- Cast button (⚡) → initiates cast flow

The cast column header shows contextual text so the button content (a lightning bolt, a remaining-uses count, or a stepper) is never ambiguous: `t('spells.prepareColumn')` ("Prep") while a prepared caster's category is in preparation mode, `t('spells.preparedColumn')` ("Prepared") for a prepared caster outside preparation mode, or `t('spells.castColumn')` ("Cast") otherwise.

### Description Drawer

Expanding a spell reveals its description text. If the TaleSpire `diceFinder` API is available, the text is processed through it to make dice notation interactive. Falls back to plain text.

### Cast Flow (Deferred Slot Spend)

Clicking Cast:
1. Pre-checks slot availability for the category's slot level. Blocks and shows a toast if `autoSpendSlots` is on and no slots remain.
2. Collects all attribute values containing dice notation.
3. Rolls them via `TS.dice.putDiceInTray()` (which returns a Promise).
4. Logs the cast to the Activity Log immediately (result appended later).
5. Registers the roll ID in `window.pendingRolls` with metadata: `{ spellCast: true, moduleId, catId, slotLevel, autoSpend }`.

When `handleRollResult` fires in `module-activity.js`, the `spellCast` branch appends the total to the log entry, calls `window.spendSlot()` if `autoSpend` is true, and re-renders the spells module to update the pip UI.

---

## Spell Management

Spell data is managed through modals and the overflow menu. The overflow menu provides entries for adding spells and categories, and opening the module settings. Editing existing spells and categories happens through the detail/edit modals opened by clicking on rows.

---

## Sorting

Sort state is module-wide (`content.sortBy`, `content.sortDir`) and applies independently per category. Column header clicks cycle: off → asc → desc → off. The Name column uses key `'__name__'`; attribute columns use their `attr.id`.

`getSortedSpells(content, spells)` is the pure sort function (exposed on `window` for testing).

---

## Data Model

```js
{
  autoSpendSlots: true,
  showSlotErrors: true,
  slotLevels: [
    { id: 'sl_xxx', level: 1, max: 4, spent: 1 }
  ],
  attributes: [
    { id: 'attr_xxx', name: 'Damage', type: 'text', defaultValue: '', pinned: true, builtIn: false }
  ],
  categories: [
    {
      id: 'cat_xxx',
      name: 'Level 1 Spells',
      slotLevel: 1,       // links to slotLevels[].level, or null for cantrips
      collapsed: false,
      spells: [
        {
          id: 'sp_xxx',
          name: 'Magic Missile',
          description: 'Three darts of magical force...',
          order: 0,
          expanded: false,
          values: {
            'attr_xxx': '3d4+3'
          }
        }
      ]
    }
  ],
  sortBy: null,       // null (manual) | '__name__' | attrId
  sortDir: 'asc'      // 'asc' | 'desc'
}
```

### Migration

`migrateContent(content)` detects old-format data (spells with `.attributes` arrays instead of `.values` objects) and converts it. Called automatically by `ensureContent()`. Also exposed as `window.migrateSpellContent` for testing.

---

## Settings Modal

`openSpellSettings(moduleEl, data)` — also exposed as `window.openSpellSettings`.

Sections:
1. **Toggles**: Auto-spend slots on cast (`autoSpendSlots`), show slot error toasts (`showSlotErrors`)
2. **Manage Columns**: list of attributes with pin/unpin toggle, delete, drag-to-reorder; add new attribute (name + type select)
3. **Manage Slot Levels**: each level with max input and delete; add slot level button
4. **Manage Categories**: each category with name input, slot level select, delete button; add category button

---

## Globals Exposed

| Name | Description |
|---|---|
| `window.isDiceNotation(val)` | Returns `true` if `val` contains a valid dice expression |
| `window.extractDiceRoll(val)` | Returns the first dice expression string from `val`, or `null` |
| `window.spellsDefaultContent()` | Returns a fresh default `content` object |
| `window.getAvailableSlots(data, slotLevel)` | Remaining slots for a level; `0` if missing or fully spent |
| `window.spendSlot(data, slotLevel)` | Increments `spent` for a slot level, capped at `max` |
| `window.restoreAllSpellSlots(moduleId)` | Resets all `spent` to `0`; called by Recovery module |
| `window.castSpell(moduleEl, data, spell, catId)` | Initiates cast flow (slot check, dice roll, activity log, pending roll registration) |
| `window.getSortedSpells(content, spells)` | Pure sort function for testing |
| `window.migrateSpellContent(content)` | Migration function for testing |
| `window.ensureSpellContent(data)` | Shape guard for testing |
| `window.openSpellSettings(moduleEl, data)` | Opens the settings modal |

---

## Gotchas

- **Drawer rows and SortableJS**: drawer `<tr>` elements are excluded from drag via `draggable: '.spells-row'`. After `onEnd`, re-render the entire tbody to re-associate drawers with their parent rows.
- **`TS.dice.putDiceInTray()` returns `Promise<string>`** — always use `.then(rollId => ...)` to capture the roll ID.
- **`diceFinder` guard**: wrap with `typeof TS !== 'undefined' && TS.symbiote && TS.symbiote.diceFinder`.
- **Slot pips in category headers share state with the summary bar** — updating either must re-render both.
- **Module re-render from `handleRollResult`**: the activity module finds the spells module element by `data-id` and calls `MODULE_TYPES['spells'].renderBody(bodyEl, data, true)`.
- **Default spawn size**: 4 col × 2 row.
