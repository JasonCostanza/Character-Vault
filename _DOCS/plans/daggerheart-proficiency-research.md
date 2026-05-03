# Daggerheart Proficiency — Research & Design Notes

## Context

Investigated how Daggerheart handles proficiency to determine what's missing in Character Vault's implementation. Found that Daggerheart proficiency is fundamentally different from D&D 5e / PF2e — it's a **damage dice multiplier**, not an action roll modifier.

---

## How Daggerheart Proficiency Works

### Proficiency (Damage Dice Multiplier)

- **What it is**: A character-wide value (1–6) that determines how many damage dice you roll on a successful attack
- **NOT weapon-specific** — one value applies to all weapons
- **Does NOT affect action rolls** (2d12 Hope/Fear trait checks)
- **Example**: Proficiency 3 + d8 weapon → roll `3d8` for damage. Flat modifiers are added separately.

### Progression

| Level | Tier | Proficiency (default) |
|-------|------|-----------------------|
| 1     | 1    | 1                     |
| 2     | 2    | 2 (costs 2 advancement points) |
| 5     | 3    | 3 (costs 2 advancement points) |
| 8     | 4    | 4 (costs 2 advancement points) |

- Cap is 6 (through additional advancement choices)
- Increasing proficiency costs 2 level-up advancement points

### Experiences (Separate Concept)

- Skill descriptors representing background aptitudes
- Each gives a **+2 flat modifier** to action rolls when relevant
- Activated by **spending Hope** (a narrative resource)
- Start with 2 Experiences at +2 each
- Gain new Experiences at levels 2, 5, 8
- Can increase existing Experiences by +1 (choose two) during advancement

### Action Rolls (Trait Checks)

- Roll 2d12 (Hope die + Fear die) + trait modifier
- Compare Hope vs Fear for narrative outcome
- Sum total vs Difficulty for success/failure
- **Proficiency never applies here** — only trait modifiers and Experiences

---

## Current State in Character Vault

### What works
- Duality dice (Hope/Fear) roll correctly via `rollDualityDice()` in `shared.js`
- Hope vs Fear comparison and narrative outcome labeling
- Governing trait modifiers on weapons
- Activity log integration for duality results

### Bugs / incorrect behavior
- **Proficiency dot shows on Daggerheart stats** — `module-stat.js` renders `.stat-proficiency-dot` for all non-PF2e systems when `stat.proficient` is true. Meaningless for Daggerheart since proficiency doesn't affect action rolls.
- **Proficiency toggle in stat edit mode** — `module-stat.js` shows the proficient checkbox for Daggerheart. Should be hidden.
- **DICE_MECHANICS.md is wrong** — Daggerheart section says "1d12 + stat + proficiency rank" but actual system uses 2d12 duality and proficiency doesn't apply to action rolls at all.

### Missing features

| Feature | Where | Complexity | Notes |
|---------|-------|------------|-------|
| **Proficiency value storage** | Character Level module or special stat | Medium | Needs to be character-wide, readable by weapons module |
| **Damage dice multiplication** | Weapons module (`computeAttackBonus` area) | Medium | Build notation as `[prof]d[die]` instead of `1d[die]` |
| **Proficiency UI** | Character Level module or Stats module | Low–Medium | Input for proficiency value (1–6), possibly auto-suggest based on level |
| **Experience tracking** | New submodule or Abilities extension | High | Needs Hope-spending mechanic, +2 modifiers, relevance tagging |
| **Hide stat proficiency for DH** | Stats module | Low | Conditional hide of dot + toggle when `sys === 'daggerheart'` |
| **Fix DICE_MECHANICS.md** | Documentation | Low | Correct the Daggerheart section |

---

## Recommended Implementation Order

1. **Quick fix**: Hide proficiency dot/toggle on Daggerheart stats (bug fix, small)
2. **Fix docs**: Correct DICE_MECHANICS.md Daggerheart section
3. **Proficiency storage**: Add proficiency value to Character Level module or as a Daggerheart-specific stat — design decision needed
4. **Weapon damage integration**: Weapons module reads proficiency value and multiplies damage dice
5. **Experiences**: Larger design task — potentially a new submodule or extension of Abilities

---

## Open Design Questions

- **Where should proficiency live?** Options: Character Level module field (since it scales with level), a special stat in the Stats template (like D&D 5e's "Proficiency" stat), or a new Daggerheart-specific data field.
- **Auto-compute from level?** Proficiency could auto-suggest based on character level, but players choose when to spend advancement points on it, so it's not strictly deterministic.
- **Experiences scope**: Are Experiences just flavor text with a +2 bonus, or do they need mechanical integration (Hope spending, roll modification)?
- **Weapon damage notation**: Should the weapons module store the base die (d8) and compute `[prof]d8` dynamically, or should users enter the full notation?

---

## Sources

- Daggerheart Nexus (Demiplane): Proficiency rules
- Daggerheart.org: Core mechanics — leveling up, attacking, weapons, making moves
- Daggerheart SRD 1.0 (May 2025)
