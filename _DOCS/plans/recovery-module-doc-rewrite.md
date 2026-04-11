# Recovery Module — Doc Rewrite Plan

## Context

The current `_DOCS/SUBMODULES/REST.md` is entirely D&D 5e-specific (Hit Dice, Short/Long Rest, spell slot restoration, Con modifier linking) despite the project supporting 9 game systems. It also proposes cross-module linking — a pattern that doesn't exist anywhere in the codebase. The doc is missing a data model, UI layout, Play/Edit mode behavior, and Activity Log integration.

User chose: **Generic "Recovery" module** with **direct function calls** for cross-module communication (Recovery → Health, Recovery → Spells).

## What the Rewritten Doc Should Cover

### 1. Module Identity
- Rename from "Rest" to **"Recovery"** — system-agnostic framing
- Recovery is a **Play-mode-primary** module (like Rest was intended to be)
- Default size: `1 colSpan × 1 rowSpan` (compact action panel)

### 2. Core Concept: Configurable Rest Buttons
Instead of hardcoded "Long Rest" / "Short Rest", the module has **user-configurable rest buttons** that default from game system templates.

Each rest button has:
- A **name** (e.g., "Long Rest", "Daily Preparations", "Downtime")
- A list of **actions** it performs when clicked

### 3. Action Types (what a rest button can do)
These are the building blocks. Each rest button triggers one or more:

| Action | Target Module | What it does |
|---|---|---|
| **Heal to full** | Health | Sets `currentHP = effectiveMaxHP` |
| **Heal by roll** | Health | Rolls `NdX + modifier`, applies as healing |
| **Reset Temp HP** | Health | Sets `tempHP = 0` |
| **Restore all spell slots** | Spells | Refills all spell slots to max |
| **Restore specific spell levels** | Spells | Refills only selected spell slot levels |

Future actions (out of scope for initial doc but worth noting as extensible):
- Reset counters (Counters module)
- Restore specific resource pools

### 4. Game System Templates
When a Recovery module is created, it reads `window.gameSystem` and pre-populates sensible defaults:

**D&D 5e**: Two buttons
- "Long Rest" → Heal to full, Restore all spell slots, (optional) Reset Temp HP
- "Short Rest" → Heal by roll (Hit Dice: NdX + Con mod)

**Pathfinder 2e**: One button
- "Rest" → Heal to full, Restore all spell slots

**Other systems / Custom**: Empty — user configures from scratch

(We don't need to be exhaustive for every system in v1. Templates for D&D 5e and PF2e, empty for the rest.)

### 5. Hit Dice Subsystem (D&D 5e template)
Only relevant when the "Heal by roll" action type is configured:
- Hit Die size (d4–d12 dropdown)
- Hit Dice pool (total / remaining)
- Optional modifier (manual number input — NOT linked to another module's stat)
- Long Rest restores Hit Dice (configurable: all / half rounded down / none)

**Key change from current doc**: Drop the fragile "link Con modifier from a Stat module" design. Use a simple manual number input for the modifier. User can update it when their Con changes. This avoids:
- String-matching stat names across modules
- A novel cross-module linking pattern
- D&D-specific assumptions baked into the architecture

### 6. Direct Function Calls (Cross-Module Communication)
Recovery calls well-known global functions exposed by Health and Spells modules:

```js
// Health module exposes:
window.healToFull(moduleId)        // sets currentHP = effectiveMaxHP
window.resetTempHP(moduleId)       // sets tempHP = 0
window.applyHealing(moduleId, amount)  // existing function, add to window

// Spells module exposes:
window.restoreAllSpellSlots(moduleId)  // refills all slots
window.restoreSpellSlots(moduleId, levels[])  // refills specific levels
```

All calls are **guard-wrapped** (same pattern as `logActivity`):
```js
if (typeof window.healToFull === 'function') {
  window.healToFull(targetModuleId);
}
```

### 7. Module Targeting
Recovery needs to know WHICH Health/Spells modules to act on. Options:

**Option A — Act on ALL**: Recovery finds all Health modules and all Spells modules on the sheet and applies to all of them. Simple. Works if the user only has one of each (common case).

**Option B — Configured targets**: In Module Settings, user selects which Health/Spells modules to target from a dropdown. More flexible but adds UI complexity.

**Recommend Option A for v1** with a note in the doc that Option B can be added later if users have multiple Health/Spells modules and need selective targeting.

### 8. Data Model

```js
{
  restButtons: [
    {
      id: 'btn_abc123',
      name: 'Long Rest',
      actions: [
        { type: 'healToFull' },
        { type: 'restoreAllSpellSlots' },
        { type: 'resetTempHP' }
      ]
    },
    {
      id: 'btn_def456',
      name: 'Short Rest',
      actions: [
        { type: 'healByRoll' }
      ]
    }
  ],
  hitDice: {
    dieSize: 8,          // d8
    total: 5,            // total Hit Dice pool
    remaining: 5,        // current remaining
    modifier: 2,         // flat modifier added to each roll
    restoreOnLongRest: 'half'  // 'all' | 'half' | 'none'
  }
}
```

### 9. UI Layout (Play Mode)
- Rest buttons stacked vertically, each a full-width button
- If Hit Dice are configured: small display showing "Hit Dice: 3/5" below the buttons
- Clicking a rest button: confirmation dialog listing what will happen, then execute

### 10. UI Layout (Edit Mode)
- Rest buttons shown with edit/delete controls
- "Add Rest Button" option
- Each button expandable to configure its name and actions
- Hit Dice configuration (if healByRoll action exists on any button)

### 11. Activity Log Integration
Every rest button click logs to Activity Log:
```js
logActivity({
  type: 'recovery.event.rest',
  message: 'Long Rest: Healed to full HP, restored all spell slots',
  sourceModuleId: data.id
});
```

### 12. Files to Modify
- **Rewrite**: `_DOCS/SUBMODULES/REST.md` (rename content to Recovery)
- **Future implementation** (not part of this doc task):
  - `scripts/module-health.js` — expose global functions
  - `scripts/module-spells.js` — expose global functions  
  - `scripts/module-recovery.js` — new module file
  - `_DOCS/ARCHITECTURE.md` — register new module type

## Verification
- Review rewritten doc for game-system-agnostic language
- Confirm data model covers D&D 5e and PF2e use cases
- Confirm no cross-module linking architecture (direct function calls only)
- Confirm all UI text references use i18n patterns
