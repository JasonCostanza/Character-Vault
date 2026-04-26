# Dice Pool Improvements

## Context

Dice-pool systems (VtM, SR6) are currently "Tracking Tier" — the player manually computes their pool size, clicks to roll, and adjudicates raw dice. The three pool fields (`poolAttribute`, `poolSkill`, `poolSize`) are disconnected from character data: attribute/skill are free-text labels, pool size must be manually maintained on every weapon when stats change, there's no success counting, no VtM Hunger integration, and no SR6 accuracy tracking. These changes bring pool systems closer to the polish that d20 systems already have.

---

## A. Cross-Module Data Infrastructure

New window helpers following the `getAbilityModifier()` pattern at `module-stat.js:402-416`. Place them directly below that function, before the closing `})()`.

### `scripts/module-stat.js` — two new functions

**`window.getStatValue(name)`** — returns raw `.value` (not modifier) from stat modules. Case-insensitive name match. Returns `null` if not found.

Pattern to follow (mirroring `getAbilityModifier`):
```javascript
window.getStatValue = function (name) {
    if (!name) return null;
    var target = name.toUpperCase();
    for (var i = 0; i < (window.modules || []).length; i++) {
        var m = window.modules[i];
        if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
        var stat = m.content.stats.find(function (s) { return s.name && s.name.toUpperCase() === target; });
        if (stat) return typeof stat.value === 'number' ? stat.value : null;
    }
    return null;
};
```

**`window.getAllStatNames()`** — returns `string[]` of all stat names across all stat modules, deduped and sorted. For populating pool dropdowns.

```javascript
window.getAllStatNames = function () {
    var names = {};
    for (var i = 0; i < (window.modules || []).length; i++) {
        var m = window.modules[i];
        if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
        m.content.stats.forEach(function (s) {
            if (s.name && !s.isProficiencyStat) names[s.name] = true;
        });
    }
    return Object.keys(names).sort();
};
```

### `scripts/module-condition.js` — one new function

Place just before `console.log('[CV] Condition module registered');` at line 3014, alongside the other window exposures at line 3009-3012.

**`window.getConditionValue(key)`** — iterates all condition modules' `data.content.applied` arrays. Finds first item with matching `.typeKey` (or `.key`) that has `active === true` and returns its `.value`. Returns `null` if not found.

```javascript
window.getConditionValue = function (key) {
    if (!key) return null;
    for (var i = 0; i < (window.modules || []).length; i++) {
        var m = window.modules[i];
        if (m.type !== 'condition' || !m.content || !Array.isArray(m.content.applied)) continue;
        var item = m.content.applied.find(function (c) { return c.typeKey === key && c.active; });
        if (item && typeof item.value === 'number') return item.value;
    }
    return null;
};
```

The VtM Hunger condition has `typeKey: 'vtm_hunger'` (see `module-condition.js:604`), type `'value'`, maxValue 5. Applied items store `.active` (boolean) and `.value` (number, see lines 1836-1840).

---

## B. Auto-Computed Pool from Character Stats

### Data shape changes

Add to shape guard (`weaponsEnsureContent`, line ~255-257 area):
```javascript
if (w.poolAdjustment === undefined) w.poolAdjustment = null;
if (typeof w.poolAutoCompute !== 'boolean') w.poolAutoCompute = false;
```

Existing `poolAttribute`, `poolSkill`, `poolSize` fields are unchanged. `poolAutoCompute` defaults to `false` so existing weapons keep manual behavior. New weapons on pool systems should default `true` — set this in the "create new weapon" code path.

### New pure helper (expose on `window` per rule 19)

```javascript
function weaponsComputeEffectivePool(weapon, content) {
    if (!weapon.poolAutoCompute) return Number(weapon.poolSize) || 0;
    var attrVal = typeof window.getStatValue === 'function' ? window.getStatValue(weapon.poolAttribute) : null;
    var skillVal = typeof window.getStatValue === 'function' ? window.getStatValue(weapon.poolSkill) : null;
    if (attrVal === null && skillVal === null) return Number(weapon.poolSize) || 0;
    var base = (attrVal || 0) + (skillVal || 0);
    var adj = Number(weapon.poolAdjustment) || 0;
    var enhBonus = weaponsComputeEnhancementPoolBonus(weapon, content);
    return Math.max(0, base + adj + enhBonus);
}
```

Expose: `window.weaponsComputeEffectivePool = weaponsComputeEffectivePool;` at bottom (line ~2795).

### Edit modal changes — `buildPoolSection()` at line 883

Replace the current function. New structure:

1. **Pool Attribute** — replace `<input type="text">` with a combobox: a text input with a dropdown populated by `getAllStatNames()`. The input still accepts free text (for stats not tracked in a module). On focus, show the dropdown. On typing, filter. On select, populate the input.
2. **Pool Skill** — same combobox treatment.
3. **Pool Size** — when `poolAutoCompute` is true, show as a read-only computed display with the breakdown (e.g. "Agility 5 + Firearms 4 + Adj +1 = 10"). When false, show the existing number input.
4. **Pool Adjustment** — new `<input type="number">` field, visible only when `poolAutoCompute` is true.
5. **Auto/Manual toggle** — a `makeCvToggle(poolAutoCompute, onChange)` that switches between auto and manual. When switching to auto, attempt to resolve current text labels; when switching to manual, copy the computed value into `poolSize`.

### Card display changes — line 456-458

Replace the raw `weapon.poolSize` reads with `weaponsComputeEffectivePool(weapon, data.content)`:

Line 456 (VtM card): `bonusEl.textContent = weaponsComputeEffectivePool(weapon, data.content) + 'd';`

Line 458 (SR6 card): `bonusEl.textContent = weaponsComputeEffectivePool(weapon, data.content) + 'd';` (the enhancement bonus is already inside `weaponsComputeEffectivePool`).

### Play mode action modal — line 1292

Replace `var poolSize = Number(weapon.poolSize) || 0;` with `var poolSize = weaponsComputeEffectivePool(weapon, data.content);`. The `data` variable is available in `openWeaponActionModal(moduleEl, data, weapon)` at line 1179.

### i18n keys needed (all locales in `translations.js`)
- `weapons.poolAdjustment` — "Pool Adjustment"
- `weapons.poolAutoCompute` — "Auto-compute"
- `weapons.poolManual` — "Manual"
- `weapons.poolBreakdown` — "{attr} {attrVal} + {skill} {skillVal}" (template for breakdown)

---

## C. SR6 Accuracy / Limit

### Data shape

Add to shape guard (line ~267 area): `if (w.accuracy === undefined) w.accuracy = null;`

### System capabilities map — `SYSTEM_EDIT_CONFIG` at line 804

Add `accuracy: true` to `sr6` entry. Add `accuracy: false` to all other entries.

### Edit modal

New section builder `buildAccuracySection(workingWeapon, onDirty)` — follows the pattern of `buildArmorSavePenRow` (line 1139). Single number input, label "Accuracy". Append to modal body after `poolSection` (line 1822). Add visibility toggle in `updateConditionalSections` (line 1836): `accuracySection.style.display = cfg.accuracy ? '' : 'none';`

### Action modal — line 1309

After the "5-6 = hit" reference text line, add:
```javascript
if (sys === 'sr6' && weapon.accuracy !== null) {
    attackCol.appendChild(makeRefText(t('weapons.sr6Accuracy') + ': ' + weapon.accuracy));
}
```

### i18n keys
- `weapons.sr6Accuracy` — "Limit"
- `weapons.accuracy` — "Accuracy"

---

## D. VtM Damage Model Rework

### System capabilities map — `SYSTEM_EDIT_CONFIG` at line 808

Change the `vtm` entry:
- `damageInstances: false` (was `true`)
- `baseDmgFlat: true` (was `false`)
- `dmgCategory: true` (was `false`)

### `buildBaseDmgSection()` at line 1102

Currently hardcodes SR6 damage categories (Physical/Stun). Make it system-aware:

```javascript
var sys = window.gameSystem || 'custom';
var categories;
if (sys === 'vtm') {
    categories = [
        { value: 'Superficial', label: t('weapons.damageSuperficial') },
        { value: 'Aggravated',  label: t('weapons.damageAggravated')  },
    ];
} else {
    categories = [
        { value: 'Physical', label: t('weapons.damagePhysical') },
        { value: 'Stun',     label: t('weapons.damageStun')     },
    ];
}
```

Pass `categories` to `buildCvSelect` (line 1124-1131) instead of the hardcoded array.

### Action modal — line 1315

The existing `if (sys === 'sr6')` block at line 1315-1330 handles flat damage display. Expand the condition to include VtM:

```javascript
if (sys === 'sr6' || sys === 'vtm') {
    var flatDmg = weapon.baseDamageFlat;
    var dmgCat;
    if (sys === 'sr6') {
        dmgCat = weapon.damageCategory === 'Stun' ? 'S' : 'P';
    } else {
        dmgCat = weapon.damageCategory === 'Aggravated' ? ' Agg' : ' Sup';
    }
    if (flatDmg !== null && flatDmg !== undefined) {
        // ... existing column build code ...
        dmgFlatEl.textContent = flatDmg + dmgCat;
        if (sys === 'vtm') {
            var marginNote = document.createElement('div');
            marginNote.className = 'weapon-action-ref';
            marginNote.textContent = t('weapons.vtmDmgMargin');
            damageCol.appendChild(marginNote);
        }
    }
}
```

### i18n keys
- `weapons.damageSuperficial` — "Superficial"
- `weapons.damageAggravated` — "Aggravated"
- `weapons.vtmDmgMargin` — "(+ margin of success)"

---

## E. VtM Hunger Dice

### Action modal — archetype C block, line 1291-1310

For VtM, read Hunger and split the pool into two dice groups:

```javascript
} else if (archetype === 'C') {
    var poolSize = weaponsComputeEffectivePool(weapon, data.content);
    var dieType = sys === 'sr6' ? 'd6' : 'd10';

    // VtM Hunger split
    var hungerCount = 0;
    if (sys === 'vtm') {
        var rawHunger = typeof window.getConditionValue === 'function' ? window.getConditionValue('vtm_hunger') : null;
        hungerCount = rawHunger ? Math.min(rawHunger, poolSize) : 0;
    }
    var regularCount = poolSize - hungerCount;

    // ... existing poolModes block for SR6 stays the same ...

    if (!poolModes) {
        if (hungerCount > 0) {
            // Build two-group roll expression
            var poolExpr = regularCount + dieType;
            var hungerExpr = hungerCount + dieType;
            var displayLabel = t('weapons.rollPool') + ' (' + poolSize + dieType + ')';
            // ... custom roll button that sends two groups ...
        } else {
            var poolExpr = poolSize + dieType;
            // ... existing single-group button ...
        }
    }

    // Show breakdown for VtM with hunger
    if (hungerCount > 0) {
        attackCol.appendChild(makeRefText(regularCount + dieType + ' + ' + hungerCount + dieType + ' ' + t('weapons.hunger')));
    }
}
```

The two-group dispatch needs a custom click handler instead of `makeRollBtn`, because `makeRollBtn` sends a single expression:

```javascript
btn.addEventListener('click', function () {
    if (typeof TS === 'undefined') return;
    var groups = [
        { name: weapon.name || t('weapons.unnamed'), roll: regularCount + dieType },
        { name: (weapon.name || t('weapons.unnamed')) + ' (' + t('weapons.hunger') + ')', roll: hungerCount + dieType }
    ];
    var rollPromise = TS.dice.putDiceInTray(groups);
    if (typeof window.logActivity === 'function') {
        var logEntryId = window.logActivity({
            type: 'weapons.event.poolRoll',
            message: t('weapons.log.poolRoll', { name: weapon.name || t('weapons.unnamed'), roll: poolSize + dieType }),
            sourceModuleId: data.id,
        });
        rollPromise.then(function (rollId) {
            if (rollId) window.pendingRolls[rollId] = {
                logEntryId: logEntryId,
                poolRoll: true,
                system: sys,
                hungerGroupIndex: 1,
            };
        });
    }
});
```

### i18n keys
- `weapons.hunger` — "Hunger"

---

## F. Success Counting for Pool Rolls

### `scripts/module-activity.js` — `handleRollResult` at line 463

Currently (line 465-485): sums all groups via `evaluateDiceResultsGroup`, appends total to log entry as ` → {total}`.

Add a new branch before the generic total-append. When `pending.poolRoll` is true, parse individual die faces instead:

**New helper** (inside the IIFE, above `handleRollResult`):

```javascript
function extractDieFaces(node) {
    if (!node || typeof node !== 'object') return [];
    if (typeof node.kind === 'string' && Array.isArray(node.results)) {
        return node.results.slice();
    }
    if (Array.isArray(node.operands)) {
        var faces = [];
        node.operands.forEach(function (op) {
            faces = faces.concat(extractDieFaces(op));
        });
        return faces;
    }
    return [];
}
```

This mirrors the tree-walking pattern already in `notationFromResult` (line 494-503). The result tree structure is documented in comments at line 491-493:
- `rollResultsOperation: { operator, operands[] }`
- `rollResult: { kind: 'd6', results: [int, ...] }` — individual die face values
- `rollValue: { value: int }`

**Modified pending-roll handling:**

```javascript
const pending = window.pendingRolls[event.payload.rollId];
if (pending) {
    delete window.pendingRolls[event.payload.rollId];
    const entry = window.activityLog.find(function (e) { return e.id === pending.logEntryId; });

    if (entry && pending.poolRoll) {
        var groups = event.payload.resultsGroups || [];
        var threshold = pending.system === 'sr6' ? 5 : 6;
        var allFaces = [];
        var hungerFaces = [];

        groups.forEach(function (group, idx) {
            var faces = group && group.result ? extractDieFaces(group.result) : [];
            if (idx === pending.hungerGroupIndex) {
                hungerFaces = faces;
            } else {
                allFaces = allFaces.concat(faces);
            }
        });

        var regularSuccesses = allFaces.filter(function (f) { return f >= threshold; }).length;
        var hungerSuccesses = hungerFaces.filter(function (f) { return f >= threshold; }).length;
        var totalSuccesses = regularSuccesses + hungerSuccesses;

        var resultLabel = pending.system === 'sr6' ? 'hits' : 'successes';
        var resultText = ' → ' + totalSuccesses + ' ' + t('weapons.pool.' + resultLabel);

        // VtM special results
        if (pending.system === 'vtm') {
            var allTens = allFaces.filter(function (f) { return f === 10; }).length;
            var hungerTens = hungerFaces.filter(function (f) { return f === 10; }).length;
            var hungerOnes = hungerFaces.filter(function (f) { return f === 1; }).length;
            var totalTens = allTens + hungerTens;
            var critPairs = Math.floor(totalTens / 2);
            if (critPairs > 0 && hungerTens > 0) {
                resultText += ' — ' + t('weapons.vtm.messyCrit');
            } else if (critPairs > 0) {
                resultText += ' — ' + t('weapons.vtm.crit');
            }
            if (hungerOnes > 0 && totalSuccesses === 0) {
                resultText += ' — ' + t('weapons.vtm.bestialFailure');
            }
        }

        entry.message += resultText;
        scheduleSave();
        // re-render activity log modules (existing pattern from line 480-483)
        document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
            var modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
            if (modData) renderActivityLogBody(el.querySelector('.module-body'), modData, window.isPlayMode);
        });
        return;
    }

    // ... existing non-pool handling (line 477-485) ...
}
```

### Metadata contract — `window.pendingRolls[rollId]`

Pool rolls store extra fields alongside the existing `logEntryId`:
```javascript
{
    logEntryId: string,
    poolRoll: true,
    system: 'vtm' | 'sr6',
    hungerGroupIndex: number | undefined,  // VtM only: which resultsGroups index is hunger
}
```

Non-pool rolls continue storing only `{ logEntryId }` and hit the existing code path.

### SR6 pool roll dispatch

The existing `makeRollBtn` calls at lines 1300/1304 need the same metadata treatment. Change the click handler to store `poolRoll: true, system: sys` in pendingRolls. Either modify `makeRollBtn` to accept optional metadata, or build custom buttons for archetype C (same approach as the Hunger split button in section E).

### i18n keys
- `weapons.pool.hits` — "hits"
- `weapons.pool.successes` — "successes"
- `weapons.vtm.messyCrit` — "Messy Critical!"
- `weapons.vtm.crit` — "Critical!"
- `weapons.vtm.bestialFailure` — "Bestial Failure!"

---

## Files to Modify

| File | Section | Changes |
|---|---|---|
| `scripts/module-stat.js` | After line 425 | Add `getStatValue()`, `getAllStatNames()` |
| `scripts/module-condition.js` | Before line 3014 | Add `getConditionValue()` |
| `scripts/module-weapons.js` | Shape guard (~255) | Add `poolAdjustment`, `poolAutoCompute`, `accuracy` defaults |
| `scripts/module-weapons.js` | After `weaponsComputeEnhancementPoolBonus` (~382) | Add `weaponsComputeEffectivePool()` |
| `scripts/module-weapons.js` | Card render (~456-458) | Use `weaponsComputeEffectivePool` |
| `scripts/module-weapons.js` | `SYSTEM_EDIT_CONFIG` (804-813) | VtM: flip damage flags. SR6: add accuracy. All: add accuracy field |
| `scripts/module-weapons.js` | `buildPoolSection` (883-933) | Combobox dropdowns, auto/manual toggle, adjustment field |
| `scripts/module-weapons.js` | `buildBaseDmgSection` (1102-1137) | System-aware damage categories |
| `scripts/module-weapons.js` | Archetype C block (1291-1310) | VtM hunger split, effective pool, SR6 accuracy ref, metadata in pendingRolls |
| `scripts/module-weapons.js` | Flat damage display (1315-1330) | Expand to include VtM |
| `scripts/module-weapons.js` | Window exposures (~2795) | Expose `weaponsComputeEffectivePool` |
| `scripts/module-activity.js` | Above `handleRollResult` (~462) | Add `extractDieFaces()` helper |
| `scripts/module-activity.js` | Inside `handleRollResult` (473-485) | Pool-aware branch with success counting |
| `scripts/translations.js` | All 6 locale blocks | ~15 new keys (see each section above) |
| `main.css` | Weapons section | Combobox dropdown styles, pool breakdown display |
| `_DOCS/SUBMODULES/WEAPONS.md` | Data shape, capabilities map, action modal | Updated docs |
| `_DOCS/ARCHITECTURE.md` | Window functions table | `getStatValue`, `getAllStatNames`, `getConditionValue`, `weaponsComputeEffectivePool` |

## Implementation Order

1. **Cross-module helpers** (A) — foundation, small scope, no UI
2. **SR6 Accuracy** (C) — quick data+UI add, no dependencies beyond shape guard
3. **VtM damage rework** (D) — capability map flip + `buildBaseDmgSection` system-awareness
4. **Auto-computed pool** (B) — depends on A; largest UI change (combobox, toggle, adjustment)
5. **VtM Hunger dice** (E) — depends on A (`getConditionValue`); action modal dispatch rework
6. **Success counting** (F) — depends on E (hunger group parsing); touches activity module
