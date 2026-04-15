# Activity Log: Full Module Integration Plan

## Context

The Activity Log module (`module-activity.js`) provides a global `window.logActivity()` API for recording gameplay events. Currently, only **Health** and **Recovery** integrate with it. All other modules with meaningful user actions (dice rolls, value changes, condition toggles, etc.) are silent. This plan adds activity logging to every remaining module with loggable events, organized into phases that can each be completed in a single session.

## Established Patterns (from Health/Recovery)

All new integrations must follow these conventions exactly:

- **Guard**: `if (typeof window.logActivity === 'function')`
- **Call**: `window.logActivity({ type, message, sourceModuleId })`
- **Event type naming**: `{module}.event.{action}` (e.g. `health.event.damage`)
- **i18n message key**: `{module}.log.{action}` (e.g. `health.log.damage`)
- **i18n tag label key**: Same as event type string (e.g. `health.event.damage` resolves via `t()` for filter tag display)
- **Messages**: Use `t(key, { interpolations })` -- never hardcode English strings
- **Placement**: After state mutation and `scheduleSave()`, before re-render
- **Conditional**: Only log when values actually change (`oldVal !== newVal`)
- **sourceModuleId**: Always pass `data.id`
- **Translations**: Every new key must be added to all 7 languages (en, es, fr, de, it, pt, ru) in `translations.js`

## Design Decisions

- **Dice rolls**: Log the fact a roll was initiated and what it was (stat name, modifier), NOT the result. Results go to TaleSpire's dice tray asynchronously and aren't available at call time.
- **Collections**: Log each individual add/remove as a discrete entry (they are individual user actions, not batch operations).
- **Module deletion**: Log it (destructive action worth recording). Module creation is not logged (editing noise).
- **Spell slot spend via castSpell**: Do NOT also log in `spendSlot()` -- would double-log since `castSpell()` calls `spendSlot()` internally.
- **Skipped modules**: Text (freeform edits too noisy), Horizontal Line (visual only), Spacer (visual only).

---

## Phase 1: Dice Roll Modules

> Highest visibility -- dice rolls are the core gameplay loop.

### Files to modify
- `scripts/module-stat.js`
- `scripts/module-abilities.js`
- `scripts/module-savingthrow.js`
- `scripts/module-spells.js`
- `scripts/translations.js`

### Tasks

- [x] **1A. Stats** -- `module-stat.js`
  - Modify `rollStatCheck(stat)` (line 263) to accept `data` parameter: `rollStatCheck(stat, data)`
  - Update call site at line 116: `rollStatCheck(stat, data)`
  - Add `logActivity` call after `TS.dice.putDiceInTray()` inside try block
  - Event type: `stat.event.roll`
  - Message key: `stat.log.roll` -- `"Rolled {name} check ({modifier})"`

- [x] **1B. Abilities** -- `module-abilities.js`
  - Modify `rollAbilityCheck(ability)` (line 250) to accept `data`: `rollAbilityCheck(ability, data)`
  - Update call site at line 274: `rollAbilityCheck(ability, data)`
  - Add `logActivity` call after `TS.dice.putDiceInTray()`
  - Event type: `abilities.event.roll`
  - Message key: `abilities.log.roll` -- `"Rolled {name} check ({modifier})"`

- [x] **1C. Saving Throws** -- `module-savingthrow.js`
  - Modify `rollSavingThrow(save)` (line 236) to accept `data`: `rollSavingThrow(save, data)`
  - Update call site at line 123: `rollSavingThrow(save, data)`
  - Add `logActivity` call after `TS.dice.putDiceInTray()`
  - Event type: `save.event.roll`
  - Message key: `save.log.roll` -- `"Rolled {name} save ({modifier})"`

- [x] **1D. Spells** -- `module-spells.js`
  - **Cast spell**: Add `logActivity` in `castSpell()` (line 61) after dice roll + slot logic completes. `data` already in scope.
    - Event type: `spells.event.cast`
    - Message keys: `spells.log.cast` ("Cast {name}"), `spells.log.castSlot` ("Cast {name} (spent level {level} slot)")
  - **Single attribute roll**: Modify `rollSingleAttribute(spell, attr)` (line 49) to accept `data`. Update call site at line 298.
    - Event type: `spells.event.roll`
    - Message key: `spells.log.roll` -- `"Rolled {spellName}: {attrName} ({roll})"`
  - **Restore all slots**: Add logging where `window.restoreAllSpellSlots` is called or at the restore button handler
    - Event type: `spells.event.restore`
    - Message key: `spells.log.restore` -- `"Restored all spell slots"`

- [x] **1E. Translations** -- Add all Phase 1 i18n keys to all 7 languages (~12 keys x 7 languages)

### Phase 1 Event Type Summary

| Event Type | Trigger |
|---|---|
| `stat.event.roll` | Stat check dice roll |
| `abilities.event.roll` | Ability check dice roll |
| `save.event.roll` | Saving throw dice roll |
| `spells.event.cast` | Spell cast (with optional slot) |
| `spells.event.roll` | Single spell attribute roll |
| `spells.event.restore` | All spell slots restored |

---

## Phase 2: Value Change Modules

### Files to modify
- `scripts/module-counters.js`
- `scripts/module-level.js`
- `scripts/module-condition.js`
- `scripts/translations.js`

### Tasks

- [x] **2A. Counters** -- `module-counters.js`
  - **Decrement** (line ~627): Capture `oldVal` before mutation, log after `scheduleSave()`
  - **Increment** (line ~643): Same pattern
  - **Reset** (line ~659): Log inside confirm callback after value reset
  - Event types: `counter.event.change`, `counter.event.reset`
  - Message keys: `counter.log.increment` ("Incremented {name} ({oldVal} -> {newVal})"), `counter.log.decrement` ("Decremented {name} ({oldVal} -> {newVal})"), `counter.log.reset` ("Reset {name} to {value}")

- [x] **2B. Level** -- `module-level.js`
  - **Level up** (button handler ~line 215): Log after `levelUp(data)` and `scheduleSave()`
    - Event type: `level.event.levelUp`
    - Message key: `level.log.levelUp` -- `"Leveled up to {level}"`
  - **Milestone level change** (dec ~line 138, inc ~line 149): Capture old level, log after change
    - Reuse `level.event.levelUp` type
    - Message key: `level.log.levelChange` -- `"Level changed ({oldLevel} -> {newLevel})"`
  - **XP change** (inside `openXPModal()` confirm ~line 331): Capture `oldXP` before mutation
    - Event type: `level.event.xp`
    - Message keys: `level.log.xpGain` ("Gained {amount} XP ({oldXP} -> {newXP})"), `level.log.xpLoss` ("Lost {amount} XP ({oldXP} -> {newXP})")

- [x] **2C. Conditions** -- `module-condition.js`
  - **Toggle on/off** (play mode click ~line 2009, expanded panel ~line 1791): Log after toggle state changes
    - Event type: `cond.event.toggle`
    - Message keys: `cond.log.applied` ("Applied condition: {name}"), `cond.log.removed` ("Removed condition: {name}")
  - **Value change** (play mode value click ~line 2027, expanded panel +/- ~line 1818): Capture old value
    - Event type: `cond.event.value`
    - Message key: `cond.log.valueChange` ("Changed {name} ({oldVal} -> {newVal})")
  - **Apply from staging** (`applyConditionFromStaging()` ~line 2497): Reuse `cond.log.applied`
  - **Remove from applied** (~lines 1901, 2482): Reuse `cond.log.removed`
  - Note: Use `getCondName(item, content)` for condition display name

- [x] **2D. Translations** -- Add all Phase 2 i18n keys to all 7 languages (~16 keys x 7 languages)

### Phase 2 Event Type Summary

| Event Type | Trigger |
|---|---|
| `counter.event.change` | Counter incremented or decremented |
| `counter.event.reset` | Counter reset to default |
| `level.event.levelUp` | Level up or level change |
| `level.event.xp` | XP gained or lost |
| `cond.event.toggle` | Condition applied or removed |
| `cond.event.value` | Condition value changed |

---

## Phase 3: Collection Modules + Module Lifecycle

### Files to modify
- `scripts/module-resistance.js`
- `scripts/module-list.js`
- `scripts/module-core.js`
- `scripts/translations.js`

### Tasks

- [x] **3A. Resistances** -- `module-resistance.js`
  - **Add to column** (inside `initSettingsSortables()` onAdd ~line 591): Log after `addResistanceToColumn()` + `scheduleSave()`
    - Event type: `res.event.add`
    - Message key: `res.log.add` -- `"Added {name} to {column}"`
  - **Remove** (delete handler ~line 547): Log after splice + `scheduleSave()`
    - Event type: `res.event.remove`
    - Message key: `res.log.remove` -- `"Removed {name} from {column}"`
  - **Move between columns** (onAdd else branch ~line 625): Log after move + `scheduleSave()`
    - Event type: `res.event.move`
    - Message key: `res.log.move` -- `"Moved {name} from {fromColumn} to {toColumn}"`
  - **Toggle active/inactive** (play mode ~line 241):
    - Event type: `res.event.toggle`
    - Message key: `res.log.toggle` -- `"Toggled {name} {state}"`
  - Column names use existing i18n keys: `res.immunities`, `res.resistances`, `res.weaknesses`

- [x] **3B. Lists** -- `module-list.js`
  - **Add item** (~line 797): Log after `content.items.push()` + `scheduleSave()`
    - Event type: `list.event.add`
    - Message key: `list.log.add` -- `"Added item to {listName}"`
  - **Remove item** (~line 768 edit mode, ~line 1495 expanded panel): Log before splice
    - Event type: `list.event.remove`
    - Message key: `list.log.remove` -- `"Removed {name} from {listName}"`

- [x] **3C. Module Deletion** -- `module-core.js`
  - In `deleteModule()` (~line 1149): Capture module title and type before removal, log after
    - Event type: `module.event.delete`
    - Message key: `module.log.delete` -- `"Deleted module: {title} ({type})"`

- [x] **3D. Translations** -- Add all Phase 3 i18n keys to all 7 languages (~14 keys x 7 languages)

### Phase 3 Event Type Summary

| Event Type | Trigger |
|---|---|
| `res.event.add` | Resistance assigned to column |
| `res.event.remove` | Resistance removed |
| `res.event.move` | Resistance moved between columns |
| `res.event.toggle` | Resistance toggled active/inactive |
| `list.event.add` | Item added to list |
| `list.event.remove` | Item removed from list |
| `module.event.delete` | Module deleted |

---

## Phase 4: QA and Polish

### Tasks

- [ ] **4A. Translation audit** -- Verify every new i18n key exists in all 7 language blocks
- [ ] **4B. Tag filtering** -- Verify all new event types appear as filterable tags in the Activity Log settings
- [ ] **4C. Double-log check** -- Confirm no duplicate entries (especially spells cast + slot spend, and recovery rest actions that call health functions)
- [ ] **4D. Conditional logging audit** -- Verify no log entries fire for no-op actions (e.g. counter at max being incremented)
- [ ] **4E. End-to-end test** -- Exercise every loggable action across all modules and confirm entries appear correctly with timestamps, messages, and proper tag filtering

---

## Verification

After each phase, test in TaleSpire by:
1. Creating an Activity Log module on the sheet
2. Performing each loggable action for the modules in that phase
3. Confirming log entries appear with correct messages
4. Opening Activity Log settings and confirming new event type tags appear
5. Toggling tag filters to hide/show the new event types
6. Checking that `scheduleSave()` correctly persists log entries across reload

## Complete Event Type Registry (all phases)

| Event Type | Module | Phase |
|---|---|---|
| `health.event.damage` | Health | Done |
| `health.event.heal` | Health | Done |
| `health.event.tempHP` | Health | Done |
| `health.event.adjust` | Health | Done |
| `recovery.event.rest` | Recovery | Done |
| `stat.event.roll` | Stats | 1 |
| `abilities.event.roll` | Abilities | 1 |
| `save.event.roll` | Saving Throws | 1 |
| `spells.event.cast` | Spells | 1 |
| `spells.event.roll` | Spells | 1 |
| `spells.event.restore` | Spells | 1 |
| `counter.event.change` | Counters | 2 |
| `counter.event.reset` | Counters | 2 |
| `level.event.levelUp` | Level | 2 |
| `level.event.xp` | Level | 2 |
| `cond.event.toggle` | Conditions | 2 |
| `cond.event.value` | Conditions | 2 |
| `res.event.add` | Resistances | 3 |
| `res.event.remove` | Resistances | 3 |
| `res.event.move` | Resistances | 3 |
| `res.event.toggle` | Resistances | 3 |
| `list.event.add` | Lists | 3 |
| `list.event.remove` | Lists | 3 |
| `module.event.delete` | Core | 3 |
