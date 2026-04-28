# Architectural Patterns

Reference for cross-module communication, data linking, and system-wide conventions.

---

## Cross-Module APIs

Modules expose pure functions on `window.*` so other modules can query or modify shared state without direct DOM coupling.

### Stat Queries
- **`window.getAbilityModifier(key)`** — Returns the modifier value for a named ability (e.g., `'DEX'`, `'STR'`). Case-insensitive. Used by weapons, abilities, and other modules that reference ability scores.
- **`window.getProficiencyBonus()`** — Returns the proficiency bonus value from any Stat module. Used by stats, abilities, saving throws, and weapons for roll calculations.
- **`window.getStatValue(name)`** — Returns raw `.value` from a stat by name (case-insensitive). Returns `0` if stat not found. Used when you need the base ability score (before modifiers).
- **`window.getAllStatNames()`** — Returns sorted, deduped array of all non-proficiency stat names across all Stat modules. Used for dynamic UI that lists available ability scores.

### Health & Recovery
- **`window.healToFull(moduleId)`** — Restores Health module to max HP (ignoring temp HP). Called by Recovery module rest buttons.
- **`window.resetTempHP(moduleId)`** — Clears temporary HP. Called by Recovery and other modules.
- **`window.applyHealingAmount(moduleId, amount)`** — Applies healing to current HP (respects max). Called by Recovery actions and custom healers.

### Spells
- **`window.restoreAllSpellSlots(moduleId)`** — Restores all spell slot levels to max. Called by Recovery module rest buttons.

### Level & Character Queries
- **`window.getCharacterLevel(moduleId)`** — Returns current level from a Level module. Returns `0` if not found.
- **`window.getCharacterClass(moduleId)`** — Returns optional class name from Level module (may be `null`).

### Condition Queries
- **`window.getConditionValue(key)`** — Returns `.value` of the first active applied condition matching `typeKey`. Used by VtM Hunger tracking to fetch dynamic values.

### Condition Application
- **`window.applyConditionTemplate(templateKey, systemKey)`** — Loads condition template for a game system and applies to Condition module. Called by game system initialization.

### Activity Log
- **`window.logActivity(opts)`** — Adds entry to `window.activityLog[]` and returns the entry ID. Options: `{ eventType, sourceModuleId?, message }`. Called by Stats, Abilities, Saving Throws, Weapons, etc. after actions.
- **`window.handleRollResult(event)`** — Processes TaleSpire dice result, calculates totals/successes, updates pending log entry. Called by manifest `rollFinished` subscription.
- **`window.refreshActivityLog()`** — Re-renders all Activity Log module instances from `window.activityLog[]`. Call after external modifications.

### Ability Linking
- **`window.refreshLinkedAbilitiesChainIcons(statModuleId)`** — Re-renders ability rows linked to a specific Stat module (e.g., after proficiency rank changes). Called by Stat module when proficiency is edited.

### List Operations
- **`window.addListItem(moduleEl, data)`** — Programmatically adds a blank item to a List module. Called by custom wizards or templates.

### List UI Management
- **`window.openListManageAttrs(moduleEl, data)`** — Opens the Manage Attributes panel for a List module. Called by toolbar buttons and custom handlers.

### Weapon Enhancements (Phase 3)
- **`window.weaponsGenerateEnhancementKey(content)`** — Generates unique key for new enhancement.
- **`window.weaponsFindEnhancement(enhancementKey, content)`** — Looks up enhancement by key in catalog.
- **`window.weaponsGetAttachedEnhancements(weapon, content)`** — Returns array of enhancements attached to a weapon.
- **`window.weaponsGetAvailableEnhancements(content)`** — Returns array of all enhancements in catalog (not attached to any weapon).
- **`window.weaponsApplyStrikingBonus(weapon, bonus, content)`** — Increases weapon damage die by striking bonus level.
- **`window.weaponsComputeEnhancementPoolBonus(weapon, content)`** — Returns computed pool bonus from enhancements.
- **`window.weaponsComputeEnhancementAttackBonus(weapon, content)`** — Returns computed attack bonus from enhancements.
- **`window.weaponsComputeEffectivePool(weapon, content)`** — Resolves pool size: if `poolAutoCompute` is on, pulls live stat values; otherwise returns `poolSize` from weapon data.

### Settings & UI
- **`window.syncGameSystemUI()`** — Syncs game system dropdown in settings to current `window.gameSystem` value.
- **`window.openAbilitySettings(moduleEl, data)`** — Opens settings modal for Abilities module.
- **`window.openCondSettings(moduleEl, data)`** — Opens settings modal for Condition module.
- **`window.openResSettings(moduleEl, data)`** — Opens settings modal for Resistance module.
- **`window.openSpellSettings(moduleEl, data)`** — Opens settings modal for Spells module.

### PF2e Proficiency
- **`window.computePf2eProficiencyBonus(proficiencyRank)`** — Returns numeric bonus for PF2e rank ('untrained', 'trained', 'expert', 'master', 'legendary'). Returns `0` for invalid ranks.

### Shared Tier Helpers
- **`window.inferTierPreset(systemKey)`** — Returns the tier preset key ('dnd5e', 'pf2e', 'simple') matching a game system. Unknown systems fall back to 'simple'.
- **`window.applyTierPreset(key)`** — Returns tier definitions array for a preset key ('dnd5e', 'pf2e', 'simple', 'custom'). Returns `[]` for unknown.

---

## Stat Linking

Stats can be "linked" to Abilities and Saving Throws, so those modules sync their proficiency ranks with the base stat's rank.

### How It Works

1. **Abilities module** stores `data.content.linkedStatModuleId` — the module ID of a Stat module to link against.
2. **Each ability** also stores a `linkedStat` field — the name of the stat to pull from (e.g., `'DEX'`, `'STR'`).
3. When rendering or rolling, Abilities calls `getProficiencyState(ability, data)`:
   - If no `linkedStatModuleId` or `linkedStat`, use the ability's own `proficiencyRank`.
   - If link exists, look up the Stat module and find the matching stat by name, then return that stat's `proficiencyRank`.
4. When a Stat's proficiency rank is edited, the Stat module calls `window.refreshLinkedAbilitiesChainIcons(statModuleId)` to re-render any Abilities linked to it.

### Proficiency Rank Values

All proficiency-aware modules use the same rank enumeration (Daggerheart style):
- `'untrained'` — no bonus
- `'trained'` — +2 bonus (or system-specific equivalent)
- `'expert'` — +3 bonus
- `'master'` — +4 bonus
- `'legendary'` — +5 bonus

PF2e uses ranks to compute a numeric bonus via `window.computePf2eProficiencyBonus(rank)`.

### Stat Linking Diagram

```
Stat Module (e.g., DEX stat with proficiencyRank = 'trained')
  ↓ (linked via linkedStatModuleId + ability.linkedStat = 'DEX')
Ability Module (e.g., Acrobatics ability)
  ↓ (on render/roll, getProficiencyState looks up the Stat)
Uses Stat's proficiencyRank for modifier calculation
  ↓ (when Stat rank edited)
Ability rows re-render via refreshLinkedAbilitiesChainIcons()
```

---

## Data Hooks / Getters-Setters Pattern

Several modules expose getter/setter callbacks for dynamic UI updates. These allow a toggle or select to update a value and re-render without full module re-render.

### Making a Toggle with Setter

Example from Abilities module (proficiency rank select):

```js
const select = makeCvToggle(
  currentValue,
  function (newVal) { 
    ability.proficiencyRank = newVal;  // setter callback
    scheduleSave();
  }
);
```

When user changes the select, the callback fires, updates the data, and calls `scheduleSave()` (which debounces into `saveCharacter()` 2 seconds later).

### In-Place Edits (Quick Edit)

Play mode supports Ctrl+Click to bypass full Edit mode:
1. Ctrl+Click on a value in Play mode → `enterQuickEdit()` creates an inline `<input>`.
2. User types new value and hits Enter or blurs → setter callback updates data.
3. Input reverts to static text with new value applied.
4. `scheduleSave()` called.

Example: `enterQuickEditAmmo()` in weapons module.

---

## Game System Feature Matrix

Each game system key (`'dnd5e'`, `'pf2e'`, `'coc'`, etc.) has different mechanics. Modules check `window.gameSystem` and adapt their behavior.

### Supported Systems

| System | Key | Stat Names | Key Features | Modules Using |
|---|---|---|---|---|
| D&D 5e | `dnd5e` | STR, DEX, CON, INT, WIS, CHA | Proficiency bonus, ability modifiers | Stats, Abilities, Saving Throws, Health |
| Pathfinder 2e | `pf2e` | STR, DEX, CON, INT, WIS, CHA | Proficiency ranks (untrained/trained/expert/master/legendary), ability modifiers | Stats, Abilities, Saving Throws |
| Call of Cthulhu | `coc` | STR, CON, SIZ, DEX, APP, INT, POW, EDU, LCK | Skill percentage-based (not modifiers) | Stats (reference only) |
| Vampire: The Masquerade | `vtm` | Str, Dex, Sta, Cha, Man, Com, Int, Wits, Res | Hunger tracker (split Condition), pool rolling | Stats, Conditions, Weapons (pool rolls) |
| Shadowrun 6e | `sr6` | Body, Agility, Reaction, Strength, Willpower, Logic, Intuition, Charisma, Edge | Pool rolling (sum of relevant stats + gear), edge system | Stats, Weapons (pool rolls) |
| Cyberpunk Red | `cpred` | INT, REF, DEX, TECH, COOL, WILL, LUCK, MOVE, BODY, EMP | Modifier-based, role-specific bonuses | Stats |
| Mothership | `mothership` | Strength, Speed, Intellect, Combat | Panic-based saving mechanics | Stats |
| Daggerheart | `daggerheart` | Agility, Strength, Finesse, Instinct, Presence, Knowledge | d12 + proficiency rank (not modifiers) | Stats, Abilities |
| Custom | `custom` | User-defined | None | All modules (fallback) |

### Game System Checks in Code

Look for patterns like:
```js
if (window.gameSystem === 'pf2e') {
  // PF2e-specific behavior (e.g., proficiency ranks)
} else if (window.gameSystem === 'vtm' || window.gameSystem === 'sr6') {
  // Pool rolling logic
}
```

### Tier Presets by System

Saving Throw modules support system-specific tier presets:
- `'dnd5e'` → Single tier (just pass/fail)
- `'pf2e'` → Five tiers (critical failure, failure, success, critical success, +1 level version)
- `'simple'` → Four generic tiers (custom names/colors)

See `window.inferTierPreset(systemKey)` and `window.applyTierPreset(tierKey)`.

---

## Serialization & Migration

### Save Blob Schema (v1)

Characters are persisted as JSON via `TS.localStorage.campaign.setBlob()`:

```js
{
  version: 1,
  savedAt: '2026-03-21T12:34:56Z',
  moduleIdCounter: 42,
  gameSystem: 'dnd5e',
  activityLog: [ /* log entries */ ],
  modules: [ /* module data objects */ ]
}
```

### Migration Pattern

When loading, `deserializeCharacter()` calls `migrateData(blob)` to handle version upgrades. Each module type should include an `ensureContent()` guard to normalize old data shapes:

```js
function ensureContent(data) {
  if (!data.content) data.content = { /* defaults */ };
  if (!Array.isArray(data.content.stats)) data.content.stats = [];
  // ... fill in missing fields
}
```

Called during module render to gracefully handle schema mismatches.

---

## Conventions

- **Auto-save trigger**: Call `scheduleSave()` after any data mutation. Never call `saveCharacter()` directly from event handlers.
- **Window exports**: Only export *pure* functions (no DOM/side effects) on `window.*`. Keep event handlers and render functions private to the IIFE.
- **Module lookup**: Use `window.modules.find(m => m.id === data.content.linkedStatModuleId)` to find other modules by ID.
- **Null over undefined**: Use `null` for intentionally empty values (serializes cleanly). `undefined` is for missing optional properties in transient objects.
- **Console prefix**: All logging uses `[CV]` prefix for easy filtering.
