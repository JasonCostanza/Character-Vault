# Weapons Module

> **Status:** Phase 2 complete. Supports D&D 5e, Pathfinder 2e, Call of Cthulhu, Vampire: The Masquerade, Cyberpunk Red, Mothership, Shadowrun 6e, and Daggerheart. Phase 3 (PF2e runes, SR6 accessories, CPR weapon mods) deferred — see `_DOCS/plans/WEAPONS_PHASE3.md`.

## Summary

The Weapons submodule manages a character's weapons and off-hand equipment. Each weapon is a card in a two-column main/off-hand layout. The module uses a **two-tier model**: Automated Tier (d20 systems with computed bonuses: 5e, PF2e, Daggerheart, CPR) and Tracking Tier (dice-pool and percentile systems where the player adjudicates: CoC, VtM, Mothership, SR6). Three attack archetypes are supported: A (single die + modifier), B (percentile roll-under), and C (dice pool).

## Default Size

When added via the wizard, default to **4 cols × 2 rows** to accommodate two columns of cards with adequate vertical space for traits and ammo display.

## Data Shape

The submodule stores its state on `data.content`:

```
data.content = {
  weapons: Weapon[]
}

Weapon = {
  id: string,                       // cv-style id (generateWeaponId())
  name: string,
  slot: 'main' | 'off',             // which column it lives in
  kind: 'melee' | 'ranged' | 'shield',
  icon: string | null,              // key into CV_ICONS; null = "None"
  abilityMod: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
  proficient: boolean,
  attackBonusOverride: number | null, // if non-null, bypasses computed bonus
  damageInstances: DamageInstance[],
  range: string | null,             // e.g. "80/320" — ranged only
  ammoCount: number | null,         // ranged only
  traits: TraitEntry[],             // keyed trait objects (key + optional value)
  notesMarkdown: string,
  twoHanded: boolean,
  // Shield-only fields (kind === 'shield'):
  acBonus: number | null,
  shieldHp: number | null,
  shieldHpMax: number | null,
  // Phase 2 — PF2e
  proficiencyRank: 'untrained' | 'trained' | 'expert' | 'master' | 'legendary' | null,
  // Phase 2 — Percentile systems (CoC, Mothership)
  skillName: string | null,         // e.g. "Handgun"
  skillValue: number | null,        // e.g. 45 (means 45%)
  // Phase 2 — Dice pool systems (VtM, SR6)
  poolAttribute: string | null,     // e.g. "Dexterity"
  poolSkill: string | null,         // e.g. "Firearms"
  poolSize: number | null,          // total dice in pool
  // Phase 2 — Cyberpunk Red
  weaponCategory: string | null,    // e.g. "Handgun", "Shoulder Arms"
  cpredStat: string | null,         // e.g. "REF"
  cpredSkillValue: number | null,   // numeric skill total
  // Phase 2 — Daggerheart
  governingTrait: string | null,    // e.g. "Agility", "Strength"
  // Phase 2 — Shadowrun 6e
  baseDamageFlat: number | null,    // flat base damage number
  damageCategory: 'Physical' | 'Stun' | null,
  // Phase 2 — Firing modes (CPR + SR6)
  firingModes: FiringMode[] | null,
  // Phase 2 — Call of Cthulhu
  impaling: boolean | null,
  // Phase 2 — Mothership
  armorSavePenalty: number | null
}

FiringMode = {
  name: string,                     // e.g. "Semi-Auto"
  ammoCost: number,
  diceModifier: number | null,      // added to pool size or skill value
  damageBonus: number | null        // added to flat damage (SR6) or damage roll
}

TraitEntry = {
  key: string,                      // e.g. "dnd5e.finesse", "pf2e.agile", "custom.wt_abc123"
  value: string | null              // optional value (e.g. die size for Versatile)
}

DamageInstance = {
  dice: string,                     // e.g. "1d8"
  modFromAbility: boolean,          // adds the weapon's abilityMod value
  flatBonus: number,                // adds a fixed number
  damageType: string                // "slashing", "fire", etc.
}
```

Use `null` (not `undefined`) for intentionally empty optional fields per CLAUDE.md rule 8.

## UI Layout

The submodule body is split into **two columns separated by a dashed vertical divider**, mirroring the Resistances submodule (`module-resistance.js`). Left column = `slot: 'main'`, right column = `slot: 'off'`.

### Card anatomy

Each weapon card displays:

- Icon (left)
- Name (primary line)
- Attack bonus (computed or override, with a subtle indicator if overridden)
- Primary damage summary (first damage instance; e.g. `1d8+3 slashing`)
- Traits row (compact chips; truncates)
- Ranged weapons show a small ammo pip with remaining count
- Shields show AC bonus and current HP / max HP

### Two-handed weapons

When `twoHanded: true`, the card renders in its assigned slot **and** a greyed-out, non-interactable placeholder card appears in the opposite slot indicating that hand is consumed. The placeholder is not draggable and does not open a modal.

## Edit Mode

Clicking a card in Edit mode opens an edit modal. Reference: `openSpellDetailModal()` in `scripts/module-spells.js` for the canonical modal structure.

- Standard action buttons per CLAUDE.md rule 15: `[Save]`, `[Cancel]`, `[Delete]`, and top-right `[X]`
- Unsaved-changes prompt on dismissal with edits pending
- Live clamping on numeric inputs (ammo count ≥ 0, shield HP ≤ shieldHpMax, etc.)
- All fields of the weapon data shape are editable
- Damage instances are a dynamic list (add / remove rows)
- Traits entered as a comma-separated or chip-input field (free-form in Phase 1)
- Notes field supports Markdown (rendered to HTML via existing markdown helper)

## Play Mode

Clicking a card in Play mode opens an **action modal** with two columns:

- **Left column:** Single "Attack" button (`1d20 + bonus`)
- **Right column:** Damage buttons — one per `DamageInstance` so the GM can cherry-pick which damage types apply against resistance/weakness

**Quick Edit (Ctrl+Click)** per CLAUDE.md rule 14: Ctrl+click directly on a card's ammo pip or shield HP value opens an inline quick-edit without entering full Edit mode.

## Attack Roll Mechanics (5e)

Attack bonus is computed as:

```
attackBonus = abilityModValue + (proficient ? proficiencyBonus : 0)
```

- `abilityModValue` is read from the character's Stats/Abilities submodule via a shared lookup helper (resolve during implementation — likely a new `window.getAbilityModifier(key)` helper exposed by `module-stat.js` or `module-abilities.js`)
- `proficiencyBonus` comes from the character-level source (Character Level submodule or equivalent)
- If `attackBonusOverride` is set, it replaces the computed value entirely

The attack roll sent to TaleSpire is `1d20 + {attackBonus}`.

## Damage Roll Mechanics

Each `DamageInstance` is rolled and logged **as its own entry** so a GM can apply per-type resistance/weakness cleanly. For each instance:

```
damageRoll = {dice} + (modFromAbility ? abilityModValue : 0) + flatBonus
```

The damage type string is passed through to the Activity Log entry so it's visible in the log stream.

## Drag & Drop

Use **SortableJS** per CLAUDE.md rule 13. Reference `initStatSortable()` in `module-stat.js` for the setup pattern. Both columns are Sortable instances with a shared `group` name so cards can be dragged between main-hand and off-hand — dropping a card in the other column updates its `slot` field.

Reference `module-resistance.js` for the two-column column-reassignment pattern (it does the same with `COLUMN_KEYS`).

When a two-handed weapon is dragged, its placeholder in the opposite column is rebuilt after the drop settles.

## Icons

Reuse existing keys in `CV_ICONS` (`scripts/shared.js`): `sword`, `shield`, `dagger`, `bow`, `axe`, `staff`, `gun`.

Add these missing keys during implementation: `crossbow`, `mace`, `spear`, `grenade`, `bullet`. Follow the existing inline SVG convention (viewBox `0 0 24 24`, `stroke="currentColor"`). Per CLAUDE.md rule 9, the icon picker lists "None" first.

## Activity Log Integration

Reuse the existing round-trip pattern. Reference `module-stat.js` and `module-abilities.js` for the canonical dispatch:

```
const rollPromise = TS.dice.putDiceInTray([{ name: label, roll: rollExpr }]);
const logEntryId = window.logActivity({
  type: 'weapons.event.roll',
  message: 'Player attacks with Longsword',
  sourceModuleId: data.id
});
rollPromise.then(function (rollId) {
  if (rollId) window.pendingRolls[rollId] = { logEntryId };
});
```

`window.handleRollResult()` in `module-activity.js` auto-appends the result to the pending log entry when the dice resolve.

**Per-instance damage logging:** each `DamageInstance` produces its own `logActivity` call so the stream reads like:

```
Player attacks with Flaming Longsword → 17 (hit)
Longsword damage: 11 slashing
Longsword damage: 4 fire
```

This keeps damage types isolated in the log for GM adjudication of resistance/weakness.

Event type namespace: `weapons.event.roll`, `weapons.event.damage`, `weapons.event.shield-damage` (for manual shield HP decrements).

## Shield Handling (Phase 1)

Shields are weapons with `kind: 'shield'`. They carry `acBonus`, `shieldHp`, and `shieldHpMax` alongside the shared fields. Shields do not produce attack rolls.

Shield HP decrement in Phase 1 is **manual** — the player edits the value (Quick Edit supported). A `weapons.event.shield-damage` log entry is emitted when the value decreases, matching the format `"{Shield Name} took 1 damage (10 → 9 HP)"`. There is no incoming-damage hook from other modules in Phase 1.

## Game System Awareness

Read `window.gameSystem` from `scripts/settings.js`. Phase 1 gates all mechanical logic to `'dnd5e'`. Any other value falls back to 5e math and emits one `console.warn('[CV] Weapons: non-5e game system not yet supported, using 5e math')` per module render.

Phase 2 will need to gate on `window.gameSystem` to show 1 button (5e) vs. 3 buttons with MAP offsets (PF2e: −5/−10 standard, −4/−8 Agile) in the attack dispatch.

## Phase 1 Out of Scope

These items are deliberately deferred to Phase 2:

- PF2e and other game systems (MAP calculation, Agile trait, etc.)
- Predefined per-system trait lists with mechanical effects (Agile, Light, Finesse, Versatile, Heavy, Thrown, Reach, Ammunition)
- Shield Break Threshold (BT) and broken/destroyed states
- Equipped / unequipped / stowed state tracking (only main/off handedness in Phase 1)
- Incoming-damage → shield HP round-trip from other modules
- Drag-and-drop between Weapons and other submodules
- Ammunition type tracking (just a count in Phase 1)

## Registration Checklist

Implementation must follow `_DOCS/NEW_MODULE_GUIDE.md`. High-level:

1. Create `scripts/module-weapons.js` with IIFE wrapping per CLAUDE.md rule 19
2. Register via `registerModuleType()` with `renderBody`, `onPlayMode`, `onEditMode`, `syncState`
3. Expose pure functions on `window` for vitest coverage per rule 19 (e.g., `window.weaponsComputeAttackBonus`, `window.weaponsEnsureContent`)
4. Add vitest tests for pure functions per rule 20
5. Add `<script>` tag to `main.html` in load order (after `module-activity.js`)
6. Add default entry to `module-core.js` MODULE_TYPES registry, alphabetically in the wizard per rule 4
7. Add `/* ── Weapons Module ── */` section to `main.css` using `--cv-*` tokens
8. Add i18n keys per CLAUDE.md rule 17 (`data-i18n` attributes + `t()` for dynamic strings)
9. Update `_DOCS/ARCHITECTURE.md` inline per rule 18 (Files at a Glance, MODULE_TYPES registry, new CSS section)
10. Extend `CV_ICONS` in `shared.js` with the missing weapon icons

## Critical Reference Files

- `scripts/module-stat.js` — IIFE + `registerModuleType()` canonical pattern; `initStatSortable()`; roll dispatch with round-trip
- `scripts/module-abilities.js` — closest analog for bonus-based rolls
- `scripts/module-spells.js` — `openSpellDetailModal()` as the modal reference
- `scripts/module-resistance.js` — two-column layout with dashed divider + cross-column drag
- `scripts/module-activity.js` — `window.logActivity()`, `window.handleRollResult()`, `window.pendingRolls`
- `scripts/settings.js` — `window.gameSystem` read pattern
- `scripts/shared.js` — `CV_ICONS` inline SVG registry
- `_DOCS/NEW_MODULE_GUIDE.md` — registration checklist
- `_DOCS/ARCHITECTURE.md` — MODULE_TYPES registry

## Decision Log (Input for Phase 2)

Decisions made during Phase 1 design that Phase 2 must respect or revisit:

- **Single `traits: string[]` field, free-form in Phase 1.** Phase 2 needs to migrate this into a system-aware list without breaking existing saves. Consider a hybrid: keep `traits` as string array, add a parallel `traitMeta` map if needed, or upgrade to objects with `{key, label, system}`.
- **Slot-only organization (main/off).** If Phase 2 adds equipped/unequipped/stowed, those become a third axis — likely a `state` field alongside `slot`.
- **Shield HP manual decrement only.** Phase 2 wiring to incoming damage needs a shared damage bus or explicit subscription; no such infrastructure exists yet.
- **Single attack button in Phase 1.** The 3-button (1st/2nd/3rd) UI was removed because all three produced identical rolls in 5e. Phase 2 must re-introduce it gated on `window.gameSystem`, with per-system MAP logic (PF2e standard: −5/−10; Agile: −4/−8). Re-add i18n keys `weapons.attackFirst`, `weapons.attackSecond`, `weapons.attackThird` for all locales.
- **`attackBonusOverride` exists as an escape hatch.** Phase 2 system-specific logic should still honor the override when set.
- **Damage instances are always logged individually.** Phase 2 resistance/weakness automation (if pursued) can consume those isolated log entries directly.
- **Non-5e systems fall back to 5e math with a console warning.** Phase 2 replaces the fallback with real system-specific implementations — the fallback should be removed, not layered over.
