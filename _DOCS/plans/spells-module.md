# Spells Submodule Implementation Plan

## Context
Adding a new "Spells" submodule to Character Vault. Provides players with a complete in-game spell management system: spell slot tracking (pip-style per level), a user-built spell library in collapsible categories, per-spell custom attributes with auto-detected dice rolls, and a Cast button that simultaneously spends a slot and sends all dice-notation attribute values to TaleSpire's dice tray.

---

## Confirmed Design Decisions
| Decision | Choice |
|---|---|
| Spell slot UI | Pip-style toggles — filled = available, empty = spent |
| Slot→category link | Category owns `slotLevel` property; `null` = no slot (cantrips) |
| Spell attributes | Per-spell, fully custom key-value pairs |
| Dice detection | Auto-detect via regex on attribute values; [Roll] button appears inline |
| Cast action | Spends relevant slot level AND sends all dice-notation attrs to tray |
| Expanded view | Modal overlay — read-only by default; [Edit] + [Cast Spell] in footer |
| Slot restore | Individual pip click OR "Restore All" button |

---

## Data Structure (`data.content`)
```js
{
  autoSpendSlots: true,       // setting: auto-spend on cast
  showSlotErrors: true,       // setting: show error when no slots available
  slotLevels: [
    { id: 'sl_001', level: 1, max: 4, spent: 1 },
    { id: 'sl_002', level: 2, max: 3, spent: 0 }
  ],
  categories: [
    {
      id: 'cat_001',
      name: 'Cantrips',
      slotLevel: null,         // null = no slot consumed on cast
      collapsed: false,
      spells: [
        {
          id: 'sp_001',
          name: 'Fire Bolt',
          attributes: [
            { id: 'a_001', key: 'Damage', value: '2d10' },
            { id: 'a_002', key: 'Range',  value: '120 ft' }
          ]
        }
      ]
    }
  ]
}
```

---

## Files to Create / Modify
| File | Change |
|---|---|
| `scripts/module-spells.js` | **New file** — full submodule implementation |
| `main.html` | Add `<script src="scripts/module-spells.js">` after other module scripts |
| `scripts/app.js` | Ensure wizard defaults 4col × 2row for `'spells'`; add i18n label |
| `scripts/translations.js` | Add all `spells.*` i18n keys |
| `_DOCS/ARCHITECTURE.md` | Add `module-spells.js` to Files at a Glance; add `spells` to MODULE_TYPES registry |

---

## Play Mode UI

### Spell Slots Section
```
SPELL SLOTS                                  [Restore All]
Lvl 1  ● ● ● ○    Lvl 2  ● ● ○    Lvl 3  ● ○
```
- Slot levels render as labeled pip rows (wrap as needed)
- Filled pip click → spend (increment `spent`); empty pip click → restore (decrement `spent`)
- "Restore All" → sets all `spent` to 0, re-renders pips
- No slot levels defined → placeholder: "No spell slot levels configured"

### Spell List (scrollable, below slots)
```
▼ Cantrips
    Fire Bolt                             [►] [Cast]
    Mage Hand                             [►] [Cast]
▼ Level-1 Spells
    Magic Missile                         [►] [Cast]
▶ Level-2 Spells
```
- Category header click → toggle `collapsed`, re-render
- [►] → opens Spell Detail Modal
- [Cast] → `castSpell()`: spends slot (if `slotLevel` non-null and `autoSpendSlots`) then rolls all dice attrs
  - If `slotLevel: null` → just roll dice (cantrips never consume slots)
  - If `autoSpendSlots: false` → just roll dice, ignore slots
  - If no available slots + `showSlotErrors: true` → show error banner; do not roll

### Spell Detail Modal (Play mode)
```
┌──────────────────────────────────────┐
│  Magic Missile                  [X]  │
├──────────────────────────────────────┤
│  Damage:   3d4+3            [Roll]   │
│  Range:    120 ft                    │
│  Duration: Instant                   │
│  Notes:    Auto-hits, 3 darts        │
├──────────────────────────────────────┤
│  [Edit]               [Cast Spell]   │
└──────────────────────────────────────┘
```
- [Roll] appears only when `isDiceNotation(value)` returns true — sends just that attribute's dice
- [Cast Spell] → same logic as row [Cast] button; closes modal on success
- [Edit] → opens Spell Edit Modal

---

## Edit Mode UI

### Slot Levels Editor
```
SPELL SLOTS
[+ Add Level]
  Lvl 1:  max [4]  [×]
  Lvl 2:  max [3]  [×]
```
- Numeric input for `max` (min 0); `spent` clamped to `max` if max decreases
- [×] removes level; confirm if any category references that `slotLevel`

### Category & Spell Editor
```
[+ Add Category]

▼ Cantrips  [✎]  [×]    (slot: none)
    [+ Add Spell]
    ⠿ Fire Bolt        [✎]  [×]
    ⠿ Mage Hand        [✎]  [×]

▼ Level-1 Spells  [✎]  [×]    (slot: Lvl 1)
    [+ Add Spell]
    ⠿ Magic Missile    [✎]  [×]
```
- Categories: SortableJS reorder; [✎] opens Category Edit Modal; [×] deletes (confirm if has spells)
- Spells: SortableJS within each category; [✎] opens Spell Edit Modal; [×] deletes (confirm)

### Category Edit Modal
```
┌──────────────────────────────────────┐
│  Edit Category                  [X]  │
├──────────────────────────────────────┤
│  Name:  [____________________]       │
│  Slot Level:  [None ▾]               │
│                (None / Lvl 1 / ...)  │
├──────────────────────────────────────┤
│  [Cancel]                  [Save]    │
└──────────────────────────────────────┘
```
- Slot Level dropdown populated from `slotLevels` array + "None" as first option

### Spell Edit Modal
```
┌──────────────────────────────────────┐
│  Edit Spell                     [X]  │
├──────────────────────────────────────┤
│  Name:  [____________________]       │
│                                      │
│  Attributes:                         │
│  [Key_______]  [Value_________]  [×] │
│  [Key_______]  [Value_________]  [×] │
│  [+ Add Attribute]                   │
├──────────────────────────────────────┤
│  [Delete]                  [Save]    │
└──────────────────────────────────────┘
```
- [Delete] → confirm, then remove spell; calls `scheduleSave()`
- [Save] → validate name non-empty; save attribute list; call `scheduleSave()`
- [X] / background click → prompt if unsaved changes

---

## Settings Menu
- **Toggle**: Auto-spend spell slots when casting (maps to `autoSpendSlots`)
- **Toggle**: Show error when no slots available (maps to `showSlotErrors`)
- Note: Category management is edit-mode only — removed from Settings to avoid duplication with the doc's original intent.

---

## Key Functions in `module-spells.js`
| Function | Purpose |
|---|---|
| `defaultSpellsContent()` | Returns the initial empty `data.content` shape |
| `renderSpellsPlayLayer(bodyEl, data)` | Builds slot pips + scrollable category/spell list |
| `renderSpellsEditLayer(bodyEl, data)` | Builds slot editor + category/spell editor |
| `syncSpellSlots(moduleEl, data)` | Re-renders pip DOM after any spend/restore |
| `initCategorySortable(listEl, moduleEl, data)` | SortableJS on category list |
| `initSpellSortable(spellListEl, moduleEl, data, catId)` | SortableJS within a category |
| `openSpellDetailModal(moduleEl, data, spell, catId)` | Read-only expanded modal |
| `openSpellEditModal(moduleEl, data, spell, catId)` | Edit spell name + attributes |
| `openCategoryEditModal(moduleEl, data, cat)` | Edit category name + slot level |
| `castSpell(moduleEl, data, spell, catId)` | Orchestrates slot spend + dice roll |
| `rollAllSpellDice(spell)` | Sends all dice-notation attrs to `TS.dice.putDiceInTray()` |
| `rollSingleAttribute(spell, attr)` | Sends one attribute's dice to tray |
| `isDiceNotation(value)` | Regex test: does value contain dice notation? |
| `getAvailableSlots(data, slotLevel)` | Returns `max - spent` for a given level |
| `spendSlot(data, slotLevel)` | Increments `spent`, calls `scheduleSave()` |
| `restoreAllSlots(moduleEl, data)` | Resets all `spent` to 0, syncs UI, calls `scheduleSave()` |

## Dice Detection
```js
const DICE_REGEX = /\b\d+d\d+([+-]\d+)?\b/i;
function isDiceNotation(value) { return DICE_REGEX.test(String(value)); }
```
Matches: `2d6`, `1d20+5`, `3d4+3` — also when embedded in strings like `"2d6 fire damage"`.

---

## Module Registration
```js
registerModuleType('spells', {
  label: 'type.spells',                          // i18n key
  renderBody(bodyEl, data, isPlayMode) { ... },
  onPlayMode(moduleEl, data) { ... },
  onEditMode(moduleEl, data) { ... },
  syncState(moduleEl, data) { ... }
});
```
**Default size: 4col × 2row** — verify the wizard creation switch/case sets this for `'spells'`; patch `app.js` if needed.

**Wizard placement**: "Spells" label falls between "Saving Throws" and "Stats" alphabetically — insert accordingly.

---

## Verification Checklist
1. Create a Spells module → spawns at 4col × 2row
2. Edit mode: add Lvl 1 (max 4) and Lvl 2 (max 2) slot levels
3. Edit mode: add "Cantrips" (slot: none) and "Level-1 Spells" (slot: Lvl 1) categories
4. Add spell "Fire Bolt" to Cantrips: Damage `2d10`, Range `120 ft`
5. Add spell "Magic Missile" to Level-1: Damage `3d4+3`
6. Play mode: verify pip rows render with correct counts
7. Cast "Fire Bolt" → no slot spent; `2d10` roll sent to tray
8. Cast "Magic Missile" → Lvl 1 slot decrements; `3d4+3` roll sent
9. Cast again with 0 Lvl 1 slots → error banner shown; slot count stays at 0
10. Click "Restore All" → all slots reset to max; pips re-render
11. Expand "Magic Missile" modal → [Roll] next to `3d4+3`; no [Roll] next to `120 ft`
12. Edit spell from modal → attribute changes persist after reload
13. Toggle `autoSpendSlots` off → casting does not deduct slots
14. Delete a category with spells → confirmation prompt appears
15. Reload symbiote → all slot states, categories, and spells persist
