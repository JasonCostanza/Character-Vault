# TaleSpire API Reference

Quick reference for the TaleSpire host API used by Character Vault. These calls bridge the symbiote into TaleSpire's game engine.

---

## Vuplex WebView Input Quirk

Vuplex zeroes the boolean modifier flags (`ctrlKey`, `shiftKey`, `altKey`) on **all** DOM events — `KeyboardEvent`, `MouseEvent`, `PointerEvent`. The `key` property on `keydown`/`keyup` still reports correctly (e.g. `"Control"`). Character Vault works around this with `scripts/modifier-keys.js`, which tracks Ctrl state via `e.key` and exposes `modKeys.ctrl`. All click handlers must use `modKeys.ctrl` instead of `e.ctrlKey` etc. Only Ctrl is tracked — the app doesn't use Shift/Alt as modifiers.

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

**Optional second parameter — suppress auto-reporting**: Pass `true` as the second argument to suppress TaleSpire's automatic reporting of results to chat. The symbiote is then responsible for calling `TS.dice.sendDiceResult()` to report results manually. Used by duality rolls so only the winning die appears in chat.

```js
TS.dice.putDiceInTray(groups, true).then(function (rollId) {
  // Results will NOT auto-appear in TaleSpire chat.
  // Must call TS.dice.sendDiceResult() in handleRollResult.
  window.pendingRolls[rollId] = { logEntryId: entry.id, dualityRoll: true };
});
```

### `TS.dice.sendDiceResult(resultsGroups, rollId)`

Manually sends dice results to TaleSpire chat. Required when `putDiceInTray` was called with `true` to suppress auto-reporting.

- **Input**:
  - `resultsGroups` — Array of result group objects, same shape as `event.payload.resultsGroups` entries. Each has `name` and `result`.
  - `rollId` — The roll ID from the original `putDiceInTray` call.
- **Returns**: `Promise<void>`

The `result` property can be reconstructed as an addition tree to fold multiple values into one chat bubble:

```js
winningGroup.result = {
    operator: '+',
    operands: [
        winningGroup.result,      // original die roll (shows as physical die)
        { value: losingDieFace }, // other die's value (shows as number)
        { value: modifier }       // modifier, only if nonzero
    ],
    total: combinedTotal
};
winningGroup.name = '18 Agility Check (with Hope)';

await TS.dice.sendDiceResult([winningGroup], event.payload.rollId);
```

Used by duality rolls (`rollDualityDice` in `shared.js`) to show only the winning Hope or Fear die in TaleSpire chat.

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
    "version": "0.1",
    "initTimeout": 10,
    "interop": {
      "id": "64b857f7-74d9-484f-b7e2-6a3ab723ac0d"
    },
    "subscriptions": {
      "dice": {
        "onRollResults": "handleRollResult"
      },
      "symbiote": {
        "onStateChangeEvent": "onStateChangeEvent"
      },
      "clients": {
        "onClientEvent": "handleClientEvent"
      },
      "sync": {
        "onSyncMessage": "handleSyncMessage"
      }
    }
  }
}
```

| Event key | Handler | Fires when |
|---|---|---|
| `dice.onRollResults` | `window.handleRollResult(event)` | A queued dice roll produces results |
| `symbiote.onStateChangeEvent` | `window.onStateChangeEvent(event)` | Symbiote lifecycle state changes |
| `clients.onClientEvent` | `window.handleClientEvent(event)` | A client joins/leaves the board or changes mode |
| `sync.onSyncMessage` | `window.handleSyncMessage(event)` | A sync message arrives from another CV instance |

### Symbiote Initialization — IMPORTANT

**Never call `TS.clients.*` or `TS.sync.*` on page load.** These APIs require the TaleSpire backend connection to be established first. Calling them immediately throws `outOfOrderMessage`.

**The correct pattern**: wait for `hasInitialized` in `onStateChangeEvent`:

```js
window.onStateChangeEvent = function (event) {
    if (event.kind === 'hasInitialized') {
        // Safe to call TS.clients.* and TS.sync.* here
        initSync();
    }
};
```

`hasInitialized` fires once after TaleSpire injects the API and establishes the backend connection. `TS.dice.*` and `TS.localStorage.*` work immediately; `TS.clients.*` and `TS.sync.*` require `hasInitialized` first.

### `TS.sync.send(message, target)` — Size Limit

The message string is limited to **500 JS characters** (1 kB at UTF-16 encoding). Exceeding this throws a `messageTooLarge` error synchronously before the Promise rejects.

- `target` can be a clientFragment, a client ID string, `"board"` (all connected clients), or `"gms"` (all GM-privileged clients)
- The limit is measured by JS `.length` (UTF-16 code units). ASCII chars are 1 unit each; emoji and non-BMP chars count as 2 units (4 bytes) — a dense emoji string can exceed 1 kB before reaching 500 chars
- If your payload may exceed the limit, split it into chunks and reassemble on the receiver. See `sendChunked` / `handleChunk` in `scripts/sync.js`
- When chunking: the envelope fields (`v`, `t`, `txn`, `i`, `n`) consume ~69–71 chars, and JSON double-encoding of `"` and `\` within the data field can expand each slice further — measure `JSON.stringify(slice).length` to size chunks correctly, not raw character count

### Sync / Interop Manifest Format — IMPORTANT

The TaleSpire docs describe `interopId` as a concept but **the actual manifest JSON structure is different** from what the text implies:

```json
// WRONG (what the docs text implies):
{ "interopId": "my-symbiote" }

// CORRECT (what TaleSpire actually requires):
{
  "api": {
    "interop": { "id": "uuid-here" }
  }
}
```

The `id` must be a UUID. Use PowerShell `[System.Guid]::NewGuid().ToString()` to generate one.

`onClientEvent` goes under the **`clients`** subscription namespace — not `sync`, despite being documented in the sync API section of the TaleSpire docs.

### Sync Event Payload Shape

```js
// handleSyncMessage event:
event.payload.str          // the message string (NOT event.payload.message)
event.payload.fromClient   // clientFragment object { id, player }
event.payload.fromClient.id  // use this as the target for TS.sync.send() replies

// handleClientEvent event:
event.kind                 // "clientJoinedBoard" | "clientLeftBoard" | "clientModeChanged"
event.payload.client       // clientFragment { id, player: { name, ... } }
event.payload.clientMode   // present on "clientModeChanged"
```

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
