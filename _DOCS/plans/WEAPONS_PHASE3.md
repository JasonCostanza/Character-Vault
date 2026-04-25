# Weapons Submodule (Phase 3) — Enhancement Layer

> **Status:** Designed. Ready for implementation.

## Summary

Phase 3 adds **weapon enhancements** — attachable items that modify a weapon's stats or behavior. Three systems use this concept: PF2e runes, SR6 accessories, and CPR weapon mods. All others (5e, CoC, VtM, Mothership, Daggerheart) are unaffected.

Enhancements are **inventory-based items** stored in a single catalog on `data.content`, attachable/detachable to any weapon. This mirrors the existing `customWeaponTraits` catalog pattern. A "Create & attach" shortcut in the picker keeps friction low for systems where players rarely transfer mods between weapons.

## Design Decisions (Resolved)

These were open in the original stub; now locked:

- **Transferability:** All enhancements are inventory items that can be attached/detached, for all three systems — not only PF2e.
- **Stacking rules:** No enforcement in data model or UI. Players self-enforce RAW or house rules.
- **Display:** Chips in a distinct section below traits, visually separated from trait chips.
- **Automation:** Narrow. Only trivially mechanical effects are computed (Striking dice, smartlink pool bonus, CPR attack bonus). Complex/crit-dependent effects (Flaming, Keen, Deadly, silencer detection) display name + description only — player applies mentally. CV has no concept of crit detection, so crit-dependent automation is out of scope.
- **Architecture:** Single unified catalog with per-system entry shapes (not a generic `{field, operation, value}` effects engine). This matches codebase idioms — no CV code uses field/operation indirection.

## Data Shape

### New content-level catalog

```
data.content = {
  weapons: Weapon[],
  customWeaponTraits: CustomTrait[],    // existing
  enhancementCatalog: Enhancement[]     // NEW
}
```

### Enhancement entry shapes (tagged union by `system`)

```
Enhancement = RuneEntry | AccessoryEntry | WeaponModEntry

RuneEntry = {
  key: string,                          // 'enh_xxxxxx' (same generation pattern as custom trait keys)
  system: 'pf2e',
  name: string,
  type: 'fundamental' | 'property',
  description: string,
  damageDiceBonus: number | null        // +1 Striking, +2 Greater Striking, +3 Major Striking; null for property runes
}

AccessoryEntry = {
  key: string,
  system: 'sr6',
  name: string,
  category: 'smartlink' | 'recoilComp' | 'scope' | 'silencer' | 'other',
  description: string,
  poolBonus: number | null              // automatable for smartlink; null for narrative-only accessories
}

WeaponModEntry = {
  key: string,
  system: 'cpred',
  name: string,
  category: string,                     // free-form text (e.g. "Scope", "Smartgun Link", "Extended Magazine")
  description: string,
  attackBonus: number | null            // narrow named bonus; null for narrative-only mods
}
```

### New weapon field

```
Weapon = {
  // ...all Phase 2 fields unchanged...

  // Phase 3
  attachedEnhancements: string[] | null   // keys referencing enhancementCatalog entries
}
```

Use `null` (not `undefined`) as the empty default, per CLAUDE.md rule 8.

## Attach / Detach Mechanics

- `weapon.attachedEnhancements` is an array of catalog keys. Order = display order.
- The catalog entry is the source of truth for name, description, and any automatable values.
- **Available pool** = any `enhancementCatalog` entry whose key is NOT in any weapon's `attachedEnhancements`, filtered to `entry.system === window.gameSystem`.
- **Attach:** picker shows the available pool, plus a **`+ Create new`** button that opens an inline mini-form, creates the catalog entry, and attaches it in one action. This eliminates the two-step friction for SR6/CPR users who just want to add a mod.
- **Detach:** removes the key from `attachedEnhancements`; catalog entry persists (available for re-attach).
- **Delete from catalog:** removes the entry from `enhancementCatalog` AND strips its key from all weapons' `attachedEnhancements`. Prompt for confirmation.
- **No stacking enforcement.** Any number of enhancements can attach to any weapon.

## Automation Hooks

Only three narrow compute hooks. All are applied at roll/display time — never mutate saved weapon data so detaching cleanly reverts.

### PF2e Striking (`damageDiceBonus`)

- At damage roll dispatch time, sum `damageDiceBonus` from all attached runes with `system === 'pf2e'`.
- Apply to the first `DamageInstance`'s `dice` field: e.g. `1d8` with `damageDiceBonus: 2` → `3d8`.
- Parse dice string with a helper (e.g. `parseAndAddDice('1d8', 2)` → `'3d8'`).
- Also update the card's damage summary display via the same logic in `weaponsFormatDamageSummary()`.

### SR6 smartlink (`poolBonus`)

- In `weaponsComputeAttackBonus()` sr6 branch (currently returns `null` — tracking tier), sum `poolBonus` from attached accessories with `system === 'sr6'`.
- Add the sum to `weapon.poolSize` for the card display bonus text.
- This does NOT change the tracking-tier return of `null` — pool bonuses surface in the `Xd` display, not in a computed attack bonus.

### CPR weapon mod (`attackBonus`)

- In `weaponsComputeAttackBonus()` cpred branch (currently returns `null`), sum `attackBonus` from attached mods with `system === 'cpred'`.
- If sum > 0, add it to the `cpredSkillValue` display. Same tracking-tier caveat as SR6.

## SYSTEM_EDIT_CONFIG Changes

Add an `enhancements` flag to the existing matrix in `module-weapons.js`:

```
dnd5e:       { ...existing, enhancements: false },
pf2e:        { ...existing, enhancements: true  },
coc:         { ...existing, enhancements: false },
vtm:         { ...existing, enhancements: false },
cpred:       { ...existing, enhancements: true  },
mothership:  { ...existing, enhancements: false },
sr6:         { ...existing, enhancements: true  },
daggerheart: { ...existing, enhancements: false },
custom:      { ...existing, enhancements: false },
```

## ensureWeaponsContent() Additions

In the content-level guard:
```js
if (!Array.isArray(data.content.enhancementCatalog)) data.content.enhancementCatalog = [];
```

In the per-weapon loop:
```js
if (w.attachedEnhancements === undefined) w.attachedEnhancements = null;
```

## UI Surfaces

### Card view — enhancement chip strip

- Render below the traits row in `buildWeaponCard()`.
- Distinct visual treatment from trait chips (use a different background token or border style — exact tokens TBD during CSS, but must be distinguishable at a glance).
- Each chip shows the enhancement `name`. Hover tooltip shows `description`.
- Cap at 3 visible chips; overflow renders as a `+N` chip.
- Reuse `showChipTooltip()` / `hideChipTooltip()` from the traits row.

### Edit modal — enhancements section

- New section in the weapon edit modal, gated by `SYSTEM_EDIT_CONFIG.enhancements`.
- Pattern: mirror `buildFiringModesSection()` for the list-row layout.
- Shows currently attached enhancements as rows, each with:
  - Name (bold) + description (muted, truncated)
  - "Detach" button (removes key from `attachedEnhancements`)
- Below the list: **`+ Attach`** button opens a picker dropdown/sub-panel listing available enhancements.
- The picker includes a **`+ Create new`** entry at the top → opens an inline mini-form with fields appropriate to the current `window.gameSystem`:
  - PF2e: name, type (fundamental/property), description, damageDiceBonus (if fundamental)
  - SR6: name, category (select), description, poolBonus
  - CPR: name, category (text), description, attackBonus
- Creating via the picker auto-attaches the new entry.
- **"Manage Catalog…"** link/button opens a catalog editor sub-modal where the player can edit or delete entries independent of any weapon. This is useful for PF2e players managing a rune inventory across multiple weapons.

### Catalog editor sub-modal

- Lists all `enhancementCatalog` entries filtered by `window.gameSystem`.
- Each row: name, system-specific summary (e.g. "Fundamental, +2 dice" or "Smartlink, +1 pool"), attached-to weapon name or "Unattached".
- Edit button opens the per-system form for that entry.
- Delete button removes from catalog + strips from all weapons. Confirm prompt.
- Standard modal chrome: `[Close]` / `[X]`, no `[Save]` — edits are live with `scheduleSave()`.

## Pure Functions to Expose on `window` (Rule 19)

These are the testable pure helpers. Expose at the bottom of the IIFE:

- `window.weaponsGenerateEnhancementKey(catalog)` — collision-avoiding key generator (mirrors `generateCustomTraitKey`)
- `window.weaponsFindEnhancement(content, key)` — catalog lookup by key
- `window.weaponsGetAttachedEnhancements(weapon, content)` — resolves `attachedEnhancements` keys to full catalog entries
- `window.weaponsGetAvailableEnhancements(content, weapons, system)` — returns catalog entries not attached to any weapon, filtered by system
- `window.weaponsApplyStrikingBonus(diceStr, bonus)` — parses `'1d8'` + bonus `2` → `'3d8'`
- `window.weaponsComputeEnhancementPoolBonus(weapon, content)` — sums `poolBonus` from attached sr6 accessories
- `window.weaponsComputeEnhancementAttackBonus(weapon, content)` — sums `attackBonus` from attached cpred mods

## Vitest Coverage (Rule 20)

Add tests under `tests/` for all functions listed above. Key cases:

- `generateEnhancementKey` — produces `enh_` prefix, avoids collision with existing keys
- `findEnhancement` — returns entry or `undefined`; handles empty catalog
- `getAttachedEnhancements` — handles `null` attachedEnhancements, missing catalog entries (orphan keys), empty catalog
- `getAvailableEnhancements` — filters by system, excludes keys attached to any weapon, handles edge cases (no weapons, no catalog entries)
- `applyStrikingBonus` — `'1d8' + 1 → '2d8'`, `'2d6' + 2 → '4d6'`, `'1d8' + 0 → '1d8'`, handles null/empty
- `computeEnhancementPoolBonus` — sums only sr6 entries with `poolBonus`, ignores others
- `computeEnhancementAttackBonus` — sums only cpred entries with `attackBonus`, ignores others

Follow existing test patterns: `loadScript()` chain, mock globals in `beforeEach`, call via `window.<name>`.

## Existing Code to Reuse

| What | Where | How |
|---|---|---|
| Catalog key generation | `generateCustomTraitKey()` in `module-weapons.js` (custom traits section) | Clone pattern for `generateEnhancementKey()` |
| Catalog lookup + resolve | `resolveWeaponTrait()` in `module-weapons.js` | Pattern for `findEnhancement()` / resolve-to-display |
| Modal list-row section | `buildFiringModesSection()` in `module-weapons.js` | UI pattern for attached-enhancements section |
| Chip tooltips | `showChipTooltip()` / `hideChipTooltip()` in `module-weapons.js` | Reuse directly for enhancement chip tooltips |
| Modal building blocks | `buildField()`, `buildCvSelect()`, `makeCvToggle()` in `shared.js` / `module-weapons.js` | Standard form elements |
| System gating | `SYSTEM_EDIT_CONFIG` matrix in `module-weapons.js` | Add `enhancements` flag |

## Files to Modify

| File | Changes |
|---|---|
| `scripts/module-weapons.js` | All new logic: data shape guard, catalog helpers, compute hooks, UI sections, card chips, catalog modal |
| `scripts/translations.js` | i18n keys for enhancement UI (section labels, button text, placeholders, tooltips, confirm prompts) |
| `main.css` | New `/* ── Weapon Enhancements ── */` section for chip styles and catalog modal |
| `_DOCS/SUBMODULES/WEAPONS.md` | Extend Data Shape with `enhancementCatalog` + `attachedEnhancements`; add Phase 3 sections |
| `_DOCS/ARCHITECTURE.md` | Note the new content field and new CSS section (rule 18) |
| `tests/` | New test file for Phase 3 pure functions |

## Design Rationale (For Future Context)

- **Single catalog, not three:** A PF2e character never sees SR6 entries. `window.gameSystem` filters automatically. One code path is simpler than three.
- **Per-system entry shapes, not unified effects engine:** No CV code uses `{field, operation, value}` indirection. Each system has 1-2 automatable numeric fields. Flat shapes are honest about the narrow automation scope and match the `firingModes` precedent.
- **"Create & attach" shortcut:** The catalog model is architecturally clean but adds UX friction for SR6/CPR players who think of mods as "gun features" not "inventory items." The shortcut collapses the two-step flow into one click.
- **Automation at roll time, not in saved data:** Detaching a rune must cleanly revert the weapon's stats. Computing bonuses at roll/display time instead of writing them into the `Weapon` fields makes this automatic.
