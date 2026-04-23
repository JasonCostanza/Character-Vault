# Weapons Submodule (Phase 3) — Bolt-On Enhancement Layer

**IMPORTANT** This is a continuation of Phase 2 (`_DOCS/plans/WEAPONS_PHASE2.md`). Phase 2 must be implemented first — this phase depends on the settled data shape and UI patterns from that work.

## Summary

Phase 3 adds support for **weapon enhancements** — items, upgrades, or modifications that attach to a weapon and alter its stats or behavior. Three supported systems use this concept:

- **Pathfinder 2e — Runes:** Striking runes increase damage dice count. Property runes add effects (Flaming adds fire damage, Keen improves crit range, etc.). Runes can be transferred between weapons.
- **Shadowrun — Accessories:** Smartgun links (dice pool bonus via neural interface), recoil compensation (gas vents, bipods, foregrips), scopes, silencers. Modify dice pools, accuracy, or recoil thresholds.
- **Cyberpunk Red — Weapon Modifications:** Attachments that alter weapon performance. Expand on this during Phase 3 research.

## Shared Pattern

All three are structurally similar: a named item attached to a weapon slot that modifies one or more weapon stats. A unified enhancement/attachment system could serve all three with per-system catalogs, rather than building three bespoke implementations.

Possible shared shape:
```
Enhancement = {
  id: string,
  name: string,
  system: string,
  effects: { field: string, operation: 'add' | 'replace' | 'multiply', value: any }[]
}
```

This is speculative — revisit after Phase 2's data shape is finalized.

## Design Considerations

- **Transferability:** PF2e runes can move between weapons. Should enhancements be weapon-bound or inventory items that slot in?
- **Stacking rules:** Some systems limit how many mods a weapon can hold. Need a slot/capacity system?
- **Display:** How do enhancements surface in the weapon card UI? Chips below traits? A sub-section?
- **Automation vs. tracking:** Per the Design Philosophy in Phase 2, lean toward displaying enhancement info and letting the player apply the effects mentally, unless the math is simple enough to automate (e.g., Striking rune just adds +1 damage die).

## Status

Stub only. Full research and design to begin after Phase 2 implementation is complete.
