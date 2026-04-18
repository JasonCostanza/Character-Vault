# Retroactively Expose Testable Helpers — Resistance, Saving Throws, Spells

## Context

`CLAUDE.md` rules 19 and 20 (just added) require module IIFEs to expose pure helpers on `window` and to ship vitest coverage alongside new pure logic. Three existing modules predate the rules: `module-resistance.js`, `module-savingthrow.js`, `module-spells.js`. Their pure helpers are trapped in IIFE closures, which is why the three test files drafted in the prior session were deleted after failing to import them.

This plan retroactively applies the window-exposure pattern to each module and restores the test files. It is broken into three self-contained phases — one per module — so each phase can land and be verified independently before the next starts.

**Canonical pattern** (`scripts/module-stat.js:390-393`):
```js
    window.STAT_TEMPLATES = STAT_TEMPLATES;
    window.applyStatTemplate = applyStatTemplate;
    window.updateRollableBtn = updateRollableBtn;
})();
```

---

## Phase 1 — Resistance

**Source edit:** `scripts/module-resistance.js` — immediately before the closing `})();`, add:
```js
    window.ensureResContent = ensureResContent;
    window.getResName = getResName;
    window.getAssignedKeys = getAssignedKeys;
    window.getAvailableTypes = getAvailableTypes;
    window.sortColumnAlpha = sortColumnAlpha;
    window.addResistanceToColumn = addResistanceToColumn;
    window.generateResId = generateResId;
```

**Test file:** recreate `tests/module-resistance.test.js` covering:
- `ensureResContent(data)` — null content, string content, partially-missing arrays
- `getResName(item, content)` — predefined type, custom type, raw fallback, `'?'` fallback
- `getAssignedKeys(content)` — flattening of all three columns
- `getAvailableTypes(content)` — excludes assigned, includes custom, sorted alphabetically
- `sortColumnAlpha(arr, content)` — in-place sort by resolved name
- `addResistanceToColumn(content, typeKey, column, value)` — item shape, `active: true`, unique ID per call
- `generateResId()` — `res_` prefix, distinct successive calls

Mirror the load/mock pattern from `tests/module-core.test.js` (load `shared.js` → `i18n.js` → `theme.js` → `settings.js` → `persistence.js` → `module-core.js` → `module-resistance.js`; mock `scheduleSave`, `MODULE_TYPES`, `renderModule`, `updateEmptyState`).

---

## Phase 2 — Saving Throws

**Source edit:** `scripts/module-savingthrow.js` — add before closing `})();`:
```js
    window.formatModifier = formatModifier;
    window.applySavingThrowTemplate = applySavingThrowTemplate;
    window.applyTierPreset = applyTierPreset;
    window.ensureSaveContent = ensureSaveContent;
    window.getTierForSave = getTierForSave;
    window.saveNotesCheckboxProxy = saveNotesCheckboxProxy;
```

**Test file:** recreate `tests/module-savingthrow.test.js` covering:
- `formatModifier(n)` — `+3`, `-2`, `+0`, non-numeric → `+0`
- `applySavingThrowTemplate(key)` — `dnd5e` (6 saves), `pf2e` (3), `simple`, unknown → `[]`, unique IDs
- `applyTierPreset(key)` — `dnd5e`, `pf2e`, `simple`, unknown → `[]`, shape includes name/letter/color
- `ensureSaveContent(data)` — null content, string content, partial object, `dnd5e` migration (`'Not Proficient'` → `null`, tiers replaced)
- `getTierForSave(save, tiers)` — match found, `proficiencyTier: null`, no match
- `saveNotesCheckboxProxy(data)` — getter, setter, null-notes fallback to `''`

---

## Phase 3 — Spells

**Source edit:** `scripts/module-spells.js` — add before closing `})();`:
```js
    window.isDiceNotation = isDiceNotation;
    window.extractDiceRoll = extractDiceRoll;
    window.spellsDefaultContent = defaultContent;
    window.getAvailableSlots = getAvailableSlots;
    window.spendSlot = spendSlot;
    window.castSpell = castSpell;
```

Note: `defaultContent` is exposed as `spellsDefaultContent` to avoid collision — it's a common name and other modules may want their own. Tests should use `window.spellsDefaultContent`.

**Test file:** recreate `tests/module-spells.test.js` covering:
- `isDiceNotation(val)` — `'2d6'`, `'1d20+5'`, `'1d8-1'`, `'hello'`, `'10'`, `'2d'`, `'d6'`, case-insensitive
- `extractDiceRoll(val)` — embedded in prose, multiple (first returned), no match → `null`
- `spellsDefaultContent()` — shape + fresh object per call
- `getAvailableSlots(data, slotLevel)` — normal, all spent, `spent > max` clamps to 0, level not found → `0`
- `spendSlot(data, slotLevel)` — increments, respects max, no-op for missing level
- `castSpell(moduleEl, data, spell, catId, onSuccess)` — blocks cast when no slots + `showSlotErrors`, calls `onSuccess` and spends slot when available, calls `onSuccess` when `autoSpendSlots: false`, calls `onSuccess` when `slotLevel: null`, no-op for missing category

`castSpell` has DOM side effects; tests must mock `showToast`, `scheduleSave`, `MODULE_TYPES['spells'].renderBody`, and provide a `moduleEl` with a `.module-body` child.

---

## Files to Modify

| Phase | File | Change |
|---|---|---|
| 1 | `scripts/module-resistance.js` | Append 7 window assignments before `})();` |
| 1 | `tests/module-resistance.test.js` | Create |
| 2 | `scripts/module-savingthrow.js` | Append 6 window assignments before `})();` |
| 2 | `tests/module-savingthrow.test.js` | Create |
| 3 | `scripts/module-spells.js` | Append 6 window assignments before `})();` |
| 3 | `tests/module-spells.test.js` | Create |

---

## Notes

- No changes to `_DOCS/ARCHITECTURE.md` needed — these are not new files, module registrations, or CSS sections.
- Per-submodule docs (`_DOCS/SUBMODULES/RESISTANCES.md`, `SAVING_THROWS.md`, `SPELLS.md`) should gain a "Globals Exposed" section matching the `STATS.md` precedent, as part of each phase.
- `module-activity.js` is out of scope; it has no extractable pure functions (almost entirely DOM + TaleSpire API).
