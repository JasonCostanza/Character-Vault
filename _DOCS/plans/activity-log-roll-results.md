# Fix: Roll Results Not Appearing in Activity Log

## Context

After wiring up `handleRollResult`, no result ever reaches the log — console only shows the initial `[CV] Activity logged: stat.event.roll` entry.

Root cause discovered by cross-referencing the user's own working Dice-Vault symbiote (`github.com/JasonCostanza/Dice-Vault`):

1. **`TS.dice.putDiceInTray()` returns a `Promise<string>`, not a `string`.** The current code assigns the Promise object to `rollId` and uses it as an object key — which stringifies to `"[object Promise]"`. The real `rollId` string that TaleSpire returns in `rollResults` never matches that key, so every `handleRollResult` call exits early at `if (!pending) return`.

2. **`TS.dice.evaluateDiceResultsGroup()` is also async** (per Dice-Vault's usage), so summing results needs `await`.

The `{ kind, payload }` event envelope shape was correct — that part doesn't need to change.

## The Fix

### 1. Roll sites — await the rollId Promise

Pattern change at all four roll sites. Current broken pattern:
```javascript
const rollId = TS.dice.putDiceInTray([...]);       // rollId is a Promise!
const logEntryId = window.logActivity({...});
if (rollId) window.pendingRolls[rollId] = { logEntryId };  // key = "[object Promise]"
```

Corrected pattern (fire-and-forget `.then` so we don't need to make the calling function async):
```javascript
const rollPromise = TS.dice.putDiceInTray([...]);
const logEntryId = window.logActivity({...});
rollPromise.then(function (rollId) {
    if (rollId) window.pendingRolls[rollId] = { logEntryId };
});
```

Applied to:
- `scripts/module-stat.js` → `rollStatCheck()`
- `scripts/module-abilities.js` → `rollAbilityCheck()`
- `scripts/module-savingthrow.js` → `rollSavingThrow()`
- `scripts/module-spells.js` → `rollSingleAttribute()`

### 2. `handleRollResult` — async + await evaluate

In `scripts/module-activity.js`, the handler is `async` and `await`s each `evaluateDiceResultsGroup` call:

```javascript
window.handleRollResult = async function (event) {
    console.log('[CV] handleRollResult', event.kind, event.payload && event.payload.rollId);
    if (event.kind === 'rollResults') {
        const pending = window.pendingRolls[event.payload.rollId];
        if (!pending) return;
        delete window.pendingRolls[event.payload.rollId];

        let total = 0;
        if (typeof TS !== 'undefined' && event.payload.resultsGroups) {
            for (const group of event.payload.resultsGroups) {
                total += await TS.dice.evaluateDiceResultsGroup(group);
            }
        }

        const entry = window.activityLog.find(function (e) { return e.id === pending.logEntryId; });
        if (entry) {
            entry.message += ' → ' + total;
            scheduleSave();
            document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
                const modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
                if (modData) renderActivityLogBody(el.querySelector('.module-body'), modData, window.isPlayMode);
            });
        }
    } else if (event.kind === 'rollRemoved') {
        delete window.pendingRolls[event.payload.rollId];
    }
};
```

## Reference

- Dice-Vault `RollManager.js` shows the canonical Promise pattern: `TS.dice.putDiceInTray(cfg, true).then((rollId) => { trackedRollIds[rollId] = {...} });`
- Dice-Vault uses `await TS.dice.evaluateDiceResultsGroup(group)` to sum results.
- The `{ kind, payload }` envelope on subscription events is documented at `symbiote-docs.talespire.com/manifest_doc_v1.html`.
