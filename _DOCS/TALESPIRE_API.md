# TaleSpire API Reference

Quick reference for the TaleSpire host API used by Character Vault. These calls bridge the symbiote into TaleSpire's game engine.

---

## Critical Async Gotchas

These two functions are **listed as synchronous in TaleSpire's docs** but are actually async. Getting this wrong drops roll IDs and breaks Activity Log linking.

| Function | Documented as | Actual behavior | Correct usage |
|---|---|---|---|
| `TS.dice.putDiceInTray(rolls)` | `string` | `Promise<string>` | `.then(rollId => ...)` |
| `TS.dice.evaluateDiceResultsGroup(group)` | `number` | `Promise<number>` | `await TS.dice.evaluateDiceResultsGroup(group)` |

**Never do this:**
```js
const rollId = TS.dice.putDiceInTray([...]); // rollId is a Promise, not a string!
window.pendingRolls[rollId] = { logEntryId: entry.id }; // keyed on "[object Promise]"
```

**Always do this:**
```js
TS.dice.putDiceInTray([{ name: 'Attack', roll: '1d20+5' }])
  .then(function (rollId) {
    window.pendingRolls[rollId] = { logEntryId: entry.id };
  });
```

---

## Availability Guard

TaleSpire APIs are **unavailable in VS Code preview** and during unit tests. Always guard TS calls:

```js
if (typeof TS !== 'undefined') {
  // TS calls here
}
```

Where to guard:
- Any `TS.dice.*` call
- Any `TS.localStorage.*` call
- Any `TS.creatures.*` call
- Any manifest event subscription handling

---

## Dice API

### `TS.dice.putDiceInTray(rolls)`

Adds one or more dice rolls to the in-game dice tray. The user can then roll them physically (or virtually) in TaleSpire.

- **Input**: Array of `{ name: string, roll: string }` objects
  - `name` — Display label shown in TaleSpire dice tray
  - `roll` — Dice notation string (e.g., `'1d20+5'`, `'8d6'`, `'5d10'`)
- **Returns**: `Promise<string>` — the roll ID, used to correlate with the result event

```js
TS.dice.putDiceInTray([
  { name: 'Fireball: Damage', roll: '8d6' },
  { name: 'Dex Save', roll: '1d20+3' }
]).then(function (rollId) {
  window.pendingRolls[rollId] = { logEntryId: logEntry.id };
});
```

Multiple entries in one call share a single roll ID. They appear as separate dice groups in TaleSpire.

### `TS.dice.evaluateDiceResultsGroup(group)`

Evaluates a single dice results group and returns the numeric total.

- **Input**: A results group object from the `rollResults` event payload
- **Returns**: `Promise<number>` — the sum of all dice in the group

```js
for (const group of event.payload.resultsGroups) {
  total += await TS.dice.evaluateDiceResultsGroup(group);
}
```

Used in `handleRollResult()` for standard (non-pool) rolls. Pool rolls use `extractDieFaces()` instead, because they need individual face values for success counting, not a sum.

---

## Storage API

### `TS.localStorage.campaign.setBlob(data)`

Saves a string blob to TaleSpire's campaign-scoped localStorage.

- **Input**: String (always JSON-serialized character data)
- **Returns**: `Promise<void>`

```js
await TS.localStorage.campaign.setBlob(JSON.stringify(blob));
```

### `TS.localStorage.campaign.getBlob()`

Loads the previously saved blob for the current campaign.

- **Returns**: `Promise<string | null>` — the saved JSON string, or `null` if nothing was saved

```js
const data = await TS.localStorage.campaign.getBlob();
if (data) {
  deserializeCharacter(data);
}
```

Storage is **campaign-scoped** — each TaleSpire campaign has a separate save slot. Characters do not transfer between campaigns automatically.

---

## Manifest Event Subscriptions

Subscriptions are declared in `manifest.json`. TaleSpire calls the named function on the `window` object when the event fires.

### Current Subscriptions (`manifest.json`)

```json
{
  "api": {
    "subscriptions": {
      "dice": {
        "onRollResults": "handleRollResult"
      },
      "symbiote": {
        "onstateChangeEvent": "onStateChangeEvent"
      }
    }
  }
}
```

| Event key | Handler | Fires when |
|---|---|---|
| `dice.onRollResults` | `window.handleRollResult(event)` | A queued dice roll produces results |
| `symbiote.onstateChangeEvent` | `window.onStateChangeEvent(event)` | Symbiote state changes (currently unused) |

### `handleRollResult(event)` — Roll Results Flow

Called by TaleSpire whenever a roll is resolved. Located in `scripts/module-activity.js`.

**Event shape:**
```js
{
  kind: 'rollResults',
  payload: {
    rollId: 'roll_abc123',        // matches the ID from putDiceInTray
    resultsGroups: [               // one group per roll entry
      {
        result: { /* dice result tree */ }
      }
    ]
  }
}
```

**Logic:**
1. Checks `event.payload.rollId` against `window.pendingRolls`
2. If no match, ignores the event (roll wasn't initiated by CV)
3. If match: checks `pending.poolRoll`
   - **Standard roll**: calls `TS.dice.evaluateDiceResultsGroup()` on each group, sums totals → updates Activity Log entry
   - **Pool roll** (VtM/SR6): calls `extractDieFaces()` on result tree → counts successes by system threshold → updates Activity Log with "X successes"
4. For VtM pool rolls: also checks for critical hits (paired 10s) and bestial failure (1s with no successes)
5. Deletes `window.pendingRolls[rollId]` after processing

### `onStateChangeEvent(event)` — Symbiote State (Unused)

Subscribed but not actively used. Placeholder for future state sync.

---

## Creatures API

### `TS.creatures.getSelectedCreatures()`

Returns the currently selected creature(s) in TaleSpire.

- **Returns**: `Promise<Creature[]>`

### `TS.creatures.getMoreInfo(creatureId)`

Returns extended info for a creature by ID.

- **Returns**: `Promise<CreatureInfo>`

Currently not used by Character Vault but available if future features need to sync with the selected creature.

---

## `window.pendingRolls` Lifecycle

The pending rolls map bridges the async gap between roll dispatch and result receipt.

```js
window.pendingRolls = {};  // initialized in app.js
```

**Entry added** immediately after `putDiceInTray` resolves:
```js
window.pendingRolls[rollId] = {
  logEntryId: 'log_abc123',   // which Activity Log entry to update
  poolRoll: true,              // present + true only for VtM/SR6 pool rolls
  system: 'vtm',               // game system, used to pick success threshold
  hungerGroupIndex: 1          // VtM only: which results group is the Hunger dice
};
```

**Entry deleted** in two ways:
1. `handleRollResult()` processes the result → `delete window.pendingRolls[rollId]`
2. TaleSpire fires a `rollRemoved` event if the user dismisses without rolling → same cleanup

**Non-CV rolls** (user rolls dice from somewhere else in TaleSpire): `handleRollResult` fires but finds no entry in `pendingRolls` → silently ignored.

---

## VS Code Preview Limitations

When developing in VS Code's browser preview:

| Feature | Status | Workaround |
|---|---|---|
| `TS.dice.putDiceInTray()` | Unavailable | Guard with `typeof TS !== 'undefined'` |
| `TS.localStorage.*` | Unavailable | Guard; save/load buttons won't work |
| Manifest subscriptions | Won't fire | Test dice results in TaleSpire directly |
| `window.handleRollResult` | Will never be called | Manually call with a mock event for debugging |
| `ResizeObserver` | Available (Chrome-based) | No workaround needed |
| CSS `--cv-*` tokens | Renders with dark theme | Theme switching requires TaleSpire extras |

---

## Debugging Patterns

**Check if TS is available:**
```js
console.log('[CV] TS available:', typeof TS !== 'undefined');
```

**Inspect pending rolls:**
```js
console.log('[CV] pendingRolls:', window.pendingRolls);
```

**Simulate a roll result for debugging:**
```js
window.handleRollResult({
  kind: 'rollResults',
  payload: {
    rollId: Object.keys(window.pendingRolls)[0],
    resultsGroups: [{ result: { kind: 'sum', results: [14], operands: [] } }]
  }
});
```
