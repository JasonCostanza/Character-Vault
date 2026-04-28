# Daggerheart Duality Dice

## Context

Daggerheart's core resolution mechanic rolls two d12s simultaneously — a **Hope die** and a **Fear die**. The sum of both plus a trait modifier determines success, but the *individual* d12 comparison determines the narrative outcome:

- Hope > Fear → "with Hope" (player gains a Hope token)
- Fear > Hope → "with Fear" (GM gains a Fear token)
- Tied → critical success, "with Hope"

CV already has Daggerheart support for stats (6 governing traits), weapon traits, and conditions — but all rolls currently use either `1d20+mod` (stats/abilities/saves) or an undifferentiated `2d12+bonus` (weapons). Neither format exposes the individual Hope/Fear die values.

The VtM hunger dice pattern — two named dice groups in `TS.dice.putDiceInTray()` — is the exact infrastructure we'll reuse.

## Approach

### 1. Shared helper: `rollDualityDice()` in `shared.js`

Create a single reusable function that all roll sites call when `gameSystem === 'daggerheart'`:

```javascript
window.rollDualityDice = function (label, modifier, eventType, logKey, logReplacements, sourceModuleId) {
    var modStr = modifier >= 0 ? '+' + modifier : String(modifier);
    var notation = '2d12' + modStr;
    var groups = [
        { name: label + ' (' + t('dice.hope') + ')', roll: '1d12' + modStr },
        { name: label + ' (' + t('dice.fear') + ')', roll: '1d12' }
    ];
    var rollPromise = TS.dice.putDiceInTray(groups);
    if (typeof window.logActivity === 'function') {
        var logEntryId = window.logActivity({
            type: eventType,
            message: t(logKey, logReplacements),
            sourceModuleId: sourceModuleId
        });
        rollPromise.then(function (rollId) {
            if (rollId) window.pendingRolls[rollId] = {
                logEntryId: logEntryId,
                dualityRoll: true
            };
        });
    }
};
```

The modifier goes on the Hope group so TaleSpire's total (`1d12+mod` + `1d12`) is correct.

### 2. Activity log: duality result handler in `handleRollResult()` — `module-activity.js`

Add a new branch after the existing `poolRoll` block (~line 493), before the standard total fallback (~line 540):

```javascript
if (entry && pending.dualityRoll) {
    var resultGroups = event.payload.resultsGroups || [];
    var hopeFace = 0;
    var fearFace = 0;
    if (resultGroups[0] && resultGroups[0].result) {
        var hf = extractDieFaces(resultGroups[0].result);
        hopeFace = hf.length ? hf[0] : 0;
    }
    if (resultGroups[1] && resultGroups[1].result) {
        var ff = extractDieFaces(resultGroups[1].result);
        fearFace = ff.length ? ff[0] : 0;
    }
    var dualityLabel;
    if (hopeFace === fearFace) {
        dualityLabel = t('dice.criticalWithHope');
    } else if (hopeFace > fearFace) {
        dualityLabel = t('dice.withHope');
    } else {
        dualityLabel = t('dice.withFear');
    }
    entry.message += ' → ' + total + ' — ' + dualityLabel;
    // scheduleSave + re-render (same as pool roll block)
}
```

Display format examples:
- `Rolled Agility check (2d12+3) → 19 — with Hope`
- `Rolled Agility check (2d12+3) → 14 — with Fear`
- `Rolled Agility check (2d12+3) → 22 — Critical — with Hope`

Uses the existing `→` and `—` delimiters that the activity log renderer already highlights via `<span class="activity-roll-result">`.

### 3. Roll site changes

Each module's roll function gets a Daggerheart early-return that delegates to `rollDualityDice()`:

**`module-stat.js` — `rollStatCheck()` (~line 300)**

After computing `totalMod` (line 308), before the `try` block:

```javascript
if (sys === 'daggerheart') {
    window.rollDualityDice(
        stat.name + ' ' + t('stat.check'), totalMod,
        'stat.event.roll', 'stat.log.roll',
        { name: stat.name || t('stat.unnamed'), modifier: '2d12' + modStr },
        data.id
    );
    return;
}
```

**`module-abilities.js` — `rollAbilityCheck()` (~line 261)**

Same pattern after computing `totalMod` (line 269):

```javascript
if (sys === 'daggerheart') {
    window.rollDualityDice(
        ability.name + ' ' + t('abilities.check'), totalMod,
        'abilities.event.roll', 'abilities.log.roll',
        { name: ability.name || t('abilities.unnamed'), modifier: '2d12' + modStr },
        data.id
    );
    return;
}
```

**`module-savingthrow.js` — `rollSavingThrow()` (~line 227)**

Same pattern after computing `totalMod` (line 235):

```javascript
if (sys === 'daggerheart') {
    window.rollDualityDice(
        (save.name || t('save.unnamed')) + ' ' + t('save.save'), totalMod,
        'save.event.roll', 'save.log.roll',
        { name: save.name || t('save.unnamed'), modifier: '2d12' + modStr },
        data.id
    );
    return;
}
```

**`module-weapons.js` — Daggerheart attack branch (~line 1411)**

Replace the current `2d12` single-group block. This one can't use the shared helper directly because `makeRollBtn` creates a button (not an immediate roll). Instead, wire the button click to build two duality groups inline, following the VtM hunger button pattern at line 1466:

```javascript
} else if (sys === 'daggerheart') {
    var rollExpr = '2d12' + formatBonus(bonus);
    var dualityBtn = document.createElement('button');
    dualityBtn.className = 'btn-primary weapon-action-btn';
    dualityBtn.textContent = t('weapons.attack') + ' (' + rollExpr + ')';
    (function (b) {
        dualityBtn.addEventListener('click', function () {
            window.rollDualityDice(
                weapon.name || t('weapons.unnamed'), b,
                'weapons.event.roll', 'weapons.log.attack',
                { name: weapon.name || t('weapons.unnamed'), roll: rollExpr },
                data.id
            );
        });
    }(bonus));
    attackCol.appendChild(dualityBtn);
}
```

### 4. i18n keys — `translations.js`

New keys (add to each language's dice/shared section):

| Key | en | Purpose |
|---|---|---|
| `dice.hope` | `Hope` | Dice group label |
| `dice.fear` | `Fear` | Dice group label |
| `dice.withHope` | `with Hope` | Log result — hope wins |
| `dice.withFear` | `with Fear` | Log result — fear wins |
| `dice.criticalWithHope` | `Critical — with Hope` | Log result — tie |

5 keys × 7 languages = 35 translation entries.

## Files Modified

| File | Change |
|---|---|
| `scripts/shared.js` | Add `window.rollDualityDice()` helper |
| `scripts/module-activity.js` | Add `dualityRoll` branch in `handleRollResult()` |
| `scripts/module-stat.js` | Daggerheart early-return in `rollStatCheck()` |
| `scripts/module-abilities.js` | Daggerheart early-return in `rollAbilityCheck()` |
| `scripts/module-savingthrow.js` | Daggerheart early-return in `rollSavingThrow()` |
| `scripts/module-weapons.js` | Replace `2d12` single-group with duality button |
| `scripts/translations.js` | 5 new keys × 7 languages |

## What This Does NOT Include

- **Hope/Fear token economy** — that's a table-level mechanic; players can track tokens with an existing counter module if desired
- **Automated success/failure thresholds** — CV is a tracking tool, not a rules engine
- **Damage dice** — weapon damage rolls remain system-agnostic (unaffected by duality)
