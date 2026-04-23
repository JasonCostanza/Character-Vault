# Weapons Submodule (Phase 2)

**IMPORTANT** This is a continuation of the Weapons module (_DOCS\SUBMODULES\WEAPONS.md) which represents the phase 1 implementation. Read that document to build your context before reading this one.

Phase 2 of the Weapons module will focus on implementing the remaining supported game systems. The full list of supported systems is as follows: D&D 5e (completed in phase 1), Pathfinder 2e, Call of Cthulhu, Vampire: The Masquerade, Cyberpunk Red, Mothership, Shadowrun, Daggerheart.

Each of these systems may have unique requirements of the Weapons module. It would be advisable to do some research into the weapon mechanics of each system to identify any special features or edge cases that need to be supported. For example, Pathfinder 2e has weapon runes that grant special properties to weapons and these runes can be swapped out or upgraded, so the module may need to support tracking these runes and their effects on the weapon's stats.

For each system, look up the core weapon mechanics and identify any unique features that need to be supported. Then, outline the required features to support below in respective # header 1 level sections. This will help to ensure that the implementation is comprehensive and meets the needs of players using that system. In each system's section, you can also include any relevant links to resources or documentation that will help with the implementation. Additionally, we will expand on each system before drafting our implementation plan, so be sure to include any relevant details that may impact the design of the module.

---

# Design Philosophy

Character Vault is a **tracking tool with simple roll support**, not a rules automation engine. The goal is NOT to reinvent D&D Beyond or Pathfinder Nexus. Those are specialized tools that automate everything for the player in a single ruleset. Character Vault should:

- **Automate simple things:** Put the right dice expression in TaleSpire's dice tray, compute basic attack bonuses from stored values.
- **Display relevant info:** Show weapon traits, damage types, range, ammo — so the player has the information at hand.
- **Leave the player in control:** Players know their system's rules. The module doesn't need to compute MAP penalties automatically, resolve opposed defense rolls, look up DV tables, apply critical injury effects, or trigger stress/panic. It needs to make it easy for the player to do those things themselves.

This means the 3 roll engines are thin — they format dice expressions for the tray, not adjudicate outcomes. The bulk of the work is **data shape and UI** — ensuring each system's weapons can store and display the fields players need to self-manage.

---

# Two-Tier Scope

Phase 2 uses a two-tier model based on system similarity and player expectations:

## Automated Tier: D&D 5e + Pathfinder 2e

Both are d20 + modifier systems with minimal mechanical delta. Phase 1 already automates 5e (attack bonus computation, damage expressions, dice tray integration). PF2e extends this with:

- **MAP buttons:** Restore the 3-button attack UI (1st / 2nd / 3rd) with computed -5/-10 penalties. Re-add i18n keys `weapons.attackFirst`, `weapons.attackSecond`, `weapons.attackThird` for all locales.
- **Agile trait conditional:** If weapon has "Agile", MAP becomes -4/-8 instead of -5/-10.
- **Proficiency rank branch:** PF2e uses rank + level (Trained = +2+level, Expert = +4+level, etc.) instead of 5e's flat proficiency bonus. System-gated branch in attack bonus computation.

This is not new scope — the Phase 1 decision log explicitly calls for restoring the MAP UI and implementing PF2e-specific logic in Phase 2.

## Tracking Tier: CoC, VtM, Cyberpunk Red, Mothership, Shadowrun, Daggerheart

These systems store and display system-appropriate weapon fields and put basic dice expressions in the tray. The player handles rules adjudication (opposed rolls, DV lookups, dice pool counting, success tiers, etc.). The module provides:

- System-appropriate data fields (skill values for percentile systems, pool attributes for dice pool systems, firing modes for CPR/SR, etc.)
- Basic dice tray support (format the correct dice expression for the system's attack/damage rolls)
- Weapon traits/properties as display labels, not mechanical automations
- Ammo tracking where applicable

## Phase 3 (Deferred): Bolt-On Enhancement Layer

PF2e runes, Shadowrun accessories, and Cyberpunk Red weapon mods are deferred to Phase 3. These are "things bolted onto a weapon" that modify its stats — they share a common pattern and benefit from seeing how the Phase 2 data shape settles before designing. See `_DOCS/plans/WEAPONS_PHASE3.md`.

---

# Attack Resolution Archetypes

The 8 supported systems collapse into **3 attack resolution families** (with Cyberpunk Red as a stretch-fit into the first):

## Archetype A: "Single Die + Modifier vs. Target Number"
**Systems:** D&D 5e, Pathfinder 2e, Daggerheart, Cyberpunk Red

Roll one or more dice, add modifiers, compare to a defense value. Differences are which dice, which modifiers feed in, and whether MAP exists.

## Archetype B: "Percentile Roll-Under vs. Skill"
**Systems:** Call of Cthulhu, Mothership

Roll d100, compare to a skill value. The skill IS the target number — no modifier math on the attack roll itself.

## Archetype C: "Dice Pool (Count Successes)"
**Systems:** Vampire: The Masquerade, Shadowrun

Roll N dice (pool = Attribute + Skill), count dice that meet a success threshold. Compared against difficulty or an opposed pool.

---

# Cross-System Feature Matrix

| Feature | 5e | PF2e | CoC | VtM | CPR | Moth | SR | DH |
|---|---|---|---|---|---|---|---|---|
| Ability/stat modifier on attack | Y | Y | N | N | Y | N | N | Y |
| Proficiency/skill on attack | Y | Y | Y(skill) | Y(skill) | Y(skill) | Y(skill) | Y(skill) | Y(trait) |
| Multi-attack penalty | N | Y | N | N | N | N | N | N |
| Multiple damage types per weapon | Y | Y | N | N | N | N | N | N |
| Ammunition tracking | some | some | Y | N | Y | Y | Y | N |
| Firing modes | N | N | N | N | Y | N | Y | N |
| Weapon traits/properties | Y | Y | N | N | N | N | N | Y |
| Weapon slots (main/off or equiv) | Y | Y | N | N | N | N | N | Y(pri/sec) |
| Range brackets/zones | simple | simple | Y | N | Y(DV table) | Y | Y | Y(zones) |
| Shield mechanics | Y | Y | N | N | N | N | N | Y |
| Opposed defense roll | N | N | Y(melee) | Y | Y(melee) | N | Y | N |
| Dice pool (not single die) | N | N | N | Y | N | N | Y | N |
| Stress/panic on combat | N | N | N | N | N | Y | N | N |
| Critical injury table | N | N | N | N | Y | Y | N | N |

---

# Proposed Shared Mechanics (Overlap Groups)

## 1. Attack Roll Engine
Three sub-engines, not eight:
- **Single-die + modifier** (Archetypes A): 5e, PF2e, Daggerheart, Cyberpunk Red
- **Percentile roll-under** (Archetype B): CoC, Mothership
- **Dice pool** (Archetype C): VtM, Shadowrun

## 2. Damage Pipeline
Extend Phase 1's `DamageInstance` to support:
- Dice count multiplier (Daggerheart's proficiency)
- Damage bonus source flexibility (ability mod, damage bonus from stats, or none)
- Net-hits-as-bonus pass-through (Shadowrun, VtM)

## 3. Weapon Traits/Properties
Three systems have meaningful weapon traits: 5e, PF2e, Daggerheart. These can share a trait system with per-system trait catalogs. Other systems don't use weapon traits in the same way.

## 4. Ammunition Tracking
Already exists in Phase 1 (simple count). Cyberpunk Red and Shadowrun need it per firing mode (autofire burns 10 rounds). Extend `ammoCount` with optional `ammoPerShot` or `firingModes` config.

## 5. Firing Modes
Only Cyberpunk Red and Shadowrun use firing modes. Shared sub-feature gated on those two systems.

## 6. Multi-Attack Penalty (MAP)
Only PF2e uses MAP. System-specific but already called out in Phase 1's decision log. The 3-button attack UI is PF2e-only.

## 7. Range System
Multiple systems care about range but in different ways:
- 5e/PF2e: simple string ("80/320")
- Cyberpunk Red: range brackets determine DV (the target number changes)
- Daggerheart: zone-based (Melee/Very Close/Close/Far/Very Far)
- Shadowrun: range brackets affect dice pool

Could unify as a range config object: `{ display: string, brackets?: RangeBracket[] }`

---

# Supported Systems

## D&D 5e

Phase 1 complete. See `_DOCS/SUBMODULES/WEAPONS.md` for full design. No additional core mechanics work needed for Phase 2.

**Archetype:** A (1d20 + modifier vs. AC)

## Pathfinder 2e

**Archetype:** A (1d20 + modifier vs. AC)

**Attack:** 1d20 + ability mod + proficiency vs. AC. Structurally identical to 5e. Melee uses Strength (or Dexterity with Finesse), ranged uses Dexterity.

**Multi-Attack Penalty (MAP):** The primary unique feature. If you attack more than once per turn, successive attacks take cumulative penalties: -5/-10 standard, -4/-8 for weapons with the Agile trait. Requires the 3-button attack UI (1st/2nd/3rd) with computed penalties. i18n keys `weapons.attackFirst`, `weapons.attackSecond`, `weapons.attackThird` must be re-added for all locales.

**Damage:** Damage die + Strength mod (melee) + bonuses. Ranged weapons don't add ability mod unless they have the Propulsive trait (adds half Strength). Multiple damage types per weapon are supported, same pattern as 5e's `DamageInstance[]`.

**Proficiency:** PF2e uses proficiency ranks (Untrained/Trained/Expert/Master/Legendary) that map to different numeric bonuses (+0/+2+level/+4+level/+6+level/+8+level) rather than 5e's flat proficiency bonus. The weapon needs to know the character's proficiency rank for this weapon type.

**Traits:** Rich trait system with mechanical effects — not just labels:
- **Agile:** Changes MAP to -4/-8 instead of -5/-10
- **Deadly dX:** On critical hit, adds extra dice of size X
- **Fatal dX:** On critical hit, changes weapon damage die to size X and adds one extra die
- **Finesse:** Can use Dexterity instead of Strength on melee attacks
- **Forceful:** Adds damage on successive hits in a turn
- **Propulsive:** Adds half Strength mod to ranged damage
- **Versatile [type]:** Can deal an alternate damage type
- **Reach:** Extends melee range
- **Sweep:** +1 to attack against different target after first attack

Phase 2 needs trait definitions with mechanical hooks, not just free-form strings.

**Runes:** Weapon runes (Striking, Property runes) modify damage dice count and add properties. **Deferred to Phase 3** — this is the "bolt-on enhancement" layer.

**Data shape delta from 5e:** Minimal for attack/damage core. Needs: trait-with-mechanical-effect support, MAP awareness, proficiency rank system.

**Sources:**
- [Archives of Nethys — Weapons Rules](https://2e.aonprd.com/Rules.aspx?ID=218)
- [Archives of Nethys — Weapon Traits](https://2e.aonprd.com/Traits.aspx)
- [Archives of Nethys — Damage Rolls](https://2e.aonprd.com/Rules.aspx?ID=2189)

## Call of Cthulhu

**Archetype:** B (d100 roll-under vs. skill)

**Attack:** d100 roll-under vs. weapon skill (e.g., "Handgun 45%"). No modifier math — the skill value IS the target number. There is no ability modifier or proficiency added to the roll. The skill already incorporates everything.

**Success tiers:** Three levels that modify outcomes:
- **Regular:** Roll ≤ skill value
- **Hard:** Roll ≤ half skill value
- **Extreme:** Roll ≤ one-fifth skill value
- Extreme success with impaling weapons (blades, bullets) doubles weapon damage

**Melee defense:** Fundamentally different from passive AC. When attacked in melee, the defender chooses:
- **Dodge:** Roll Dodge skill — attacker must achieve a higher success tier to hit
- **Fight Back:** Roll combat skill — acts as both defense and counter-attack; higher success tier wins and the winner deals damage

This is an opposed roll system for melee, not a static target number.

**Damage:** Weapon damage dice (e.g., 1d8) + damage bonus. The damage bonus is derived from a STR+SIZ lookup table at the character level, not per-weapon. It can be negative. No multiple damage types — simple single-value damage.

**Firearms:** Range brackets affect success tier requirements. Point-blank range (within 1/5 DEX in feet) grants a bonus die.

**Data shape delta from 5e:** Large. No `abilityMod`, no `proficient` boolean, no `proficiencyBonus`. Needs: `skillName` and `skillValue` (percentile) instead. Damage bonus is character-level, not weapon-level. Weapon needs an `impaling` flag for critical behavior.

**Sources:**
- [Call of Cthulhu Wiki — Combat](https://cthulhuwiki.chaosium.com/rules/combat.html)
- [CoC 7e Mechanics Overview](https://texarkana23.wordpress.com/tag/call-of-cthulhu-7th-edition/)
- [CoC 7e Firearms & Damage Systems](https://philgamer.wordpress.com/2018/02/15/lets-study-call-of-cthulhu-7th-edition-part-2c-firearms-damage-systems/)

## Vampire: The Masquerade

**Archetype:** C (dice pool — count d10 successes)

**Attack:** Dice pool of Attribute + Skill in d10s. Each die showing 6+ is a success. Pool composition varies by weapon type:
- **Brawl (fists, fangs):** Strength + Brawl
- **One-handed melee:** Dexterity + Melee
- **Two-handed melee:** Strength + Melee
- **Firearms:** Composure + Firearms (standard) or Dexterity + Firearms (quick-draw)
- **Thrown:** Dexterity + Athletics

Roll is compared against a difficulty (number of successes needed) or opposed by the defender's pool.

**Hunger Dice:** Deeply thematic, system-specific. Some d10s in the pool are replaced with "Hunger Dice" (red). These function normally but:
- Rolling 1 on a Hunger Die during a failure triggers **Bestial Failure** (loss of vampiric control)
- Rolling 10 on a Hunger Die paired with another 10 triggers **Messy Critical** (success, but with violent excess)

Hunger Dice count is a character-level value, not weapon-level, but the roll engine must track them.

**Critical:** Any pair of 10s rolled counts as 4 successes instead of 2 (a critical success).

**Damage:** Relatively simple — weapons have a flat damage modifier, some add Strength. Weapon data is thin compared to d20 systems.

**Weapons are secondary to the character sheet.** VtM combat is less about weapon stats and more about the dice pool composition. The character's Attributes and Skills drive the roll; the weapon is mostly a name, a damage value, and which pool to use.

**Firearm penalties:** -2 dice for targeting someone in a scuffle, -2 dice for weapons larger than a pistol.

**Data shape delta from 5e:** Very large. No d20, no AC, no proficiency boolean. Needs: `poolAttribute` + `poolSkill` (which character stats form the pool), `damageModifier` (flat number), pool size modifiers. Weapon data is minimal; the character sheet drives the roll.

**Sources:**
- [V5 Combat Primer](https://www.v5homebrew.com/wiki/Combat_Primer)
- [V5 Basic Dice Mechanics](https://www.worldanvil.com/w/crescent-city-by-night-deathjester/a/vampire-the-masquerade-v5---basic-dice-mechanics-prose)
- [V5 Rules Overview](https://philgamer.wordpress.com/2018/08/05/lets-study-vampire-the-masquerade-5th-edition-part-4-the-rules/)

## Cyberpunk Red

**Archetype:** A (stretch fit) / D (1d10 + STAT + SKILL vs. DV table)

**Attack:** 1d10 + STAT + SKILL vs. a Difficulty Value (DV). The weapon category determines which skill is used:
- **Handgun** skill for pistols
- **Shoulder Arms** for rifles, shotguns, SMGs
- **Archery** for bows/crossbows
- **Heavy Weapons** for launchers, mounted weapons
- **Autofire** skill for automatic fire (separate from the weapon's base skill)

**Melee:** Opposed roll — attacker's STAT + Melee skill + 1d10 vs. defender's DEX + Evasion + 1d10. Melee weapons ignore half armor.

**Range DV Table:** Core unique mechanic. Each weapon category has different DVs at 7 range brackets (0-12m, 13-25m, 26-50m, 51-100m, 101-200m, 200-400m, 400-800m). The target number changes with distance, not just a penalty. Some weapon/range combos are "NA" (impossible to hit).

**Autofire:** Unique sub-mechanic. Costs 10 rounds of ammo. Roll against DV; if successful, deal 2d6 damage multiplied by margin above DV, capped by weapon type (SMG max x3, Assault Rifle max x4).

**Damage:** Pure dice (2d6, 3d6, 4d6, 5d6, etc.) minus target's armor SP. No ability modifier on damage.

**Critical injuries:** Rolling 2+ sixes on damage dice triggers a critical injury that bypasses armor and inflicts a status effect from a table. System-specific.

**Brawling:** Uses full armor (unlike melee weapons which ignore half), but has special maneuvers (Grab, Choke, Throw).

**Data shape delta from 5e:** Large. Needs: `weaponCategory` (determines skill and DV table), `dvTable` or manual DV input, `autofire` config (`maxMultiplier`, `ammoCost`), `baseDamage` as pure dice string. No ability modifier, no proficiency boolean.

**Sources:**
- [Cyberpunk Red Weapon Tables](https://man.sr.ht/~rek2/Hispagatos-wiki/juegos/cyberpunkred-tables.md)
- [Cyberpunk Red Weapons & Armor (Fandom)](https://cyberpunk-red-2047.fandom.com/wiki/Weapons_and_Armor)
- [Cyberpunk Red Combat Details](https://www.thedarkfuture.com/2019/07/combat-in-cyberpunk-red-detailed.html)

## Mothership

**Archetype:** B (d100 roll-under vs. combat stat)

**Attack:** d100 roll-under vs. Combat stat (percentile value). Same core mechanic as CoC — roll under your skill to hit.

**Damage:** Weapon damage dice, armor points (AP) subtract from damage. Simple and clean — no multiple damage types, no ability modifier on damage.

**Armor:** Works as a Save — when you take damage, you can roll your Armor Save to reduce your Armor Points instead of taking HP damage. Some weapons penalize the Armor Save (weapon-level concern).

**Stress and Panic:** Combat failures add Stress to the character. Taking damage exceeding half max health, or being critically hit, triggers a Panic check: roll 2d10, must roll OVER current Stress to avoid panicking. Panic results range from phobias to adrenaline rushes (2d10 on a panic table). This is a character-level mechanic but the weapon module may need to surface or trigger it.

**Weapon properties:** Weapons have damage, range (Short/Medium/Long brackets), ammo/shots count, and special text properties.

**Critical hits:** Exist and have their own table with system-specific effects.

**Data shape delta from 5e:** Moderate, similar to CoC. Needs: `combatStat` (percentile) instead of d20+mod, simple damage dice, range brackets (S/M/L), ammo count, optional `armorSavePenalty`. Stress/panic is character-level, not weapon data.

**Sources:**
- [Mothership Player's Survival Guide Review](https://www.rpg.net/reviews/archive/18/18927.phtml)
- [Mothership Cheat Sheet](https://thealexandrian.net/creations/mothership/mothership-cheat-sheet-v1.pdf)
- [Mothership RPG Guide](https://www.creativegamelife.com/mothership-sci-fi-horror-rpg-guide)

## Shadowrun

**Archetype:** C (dice pool — count d6 successes, opposed)

**Attack:** Opposed dice pool. Attacker rolls Agility + Firearms (ranged) or relevant combat skill (melee) in d6s. Each 5+ is a hit. Defender rolls Reaction + Intuition. If attacker gets more hits, the attack lands; net hits add to base weapon damage.

**Soak:** After a hit, defender rolls Body dice to soak — each hit reduces damage by 1. This means damage resolution involves three rolls: attack, defense, and soak.

**Firing modes:** Modify the attack mechanically:
- **Single Shot (SS):** Standard, no modifiers
- **Semi-Auto (SA):** -2 Attack Rating, +1 base damage
- **Burst Fire (BF):** -4 Attack Rating, +2 damage (narrow) OR split dice pool between 2 targets (wide)
- **Full Auto (FA):** -6 Attack Rating, split dice pool among multiple targets

These are core to the weapon identity — a weapon's available firing modes define how it plays.

**Damage:** Base weapon damage is a flat number (e.g., 5P or 3S), not dice. "P" = Physical damage, "S" = Stun damage. Final damage = base + net hits - soak hits.

**Edge:** Tactical advantage system. Can be spent on attack or defense but not both in the same action. Character-level, not weapon-level.

**Accessories/modifications:** Smartgun links, recoil compensation, scopes, etc. modify dice pools and accuracy. **Deferred** — part of the "bolt-on enhancement" layer alongside PF2e runes.

**Data shape delta from 5e:** Very large. Needs: `baseDamage` (flat number, not dice), `damageCategory` ('Physical' | 'Stun'), `firingModes[]` with per-mode modifiers (AR penalty, damage bonus, ammo cost, pool splitting), `attackPool` config (which attributes form the pool), `armorPenetration`. No d20, no single target number.

**Sources:**
- [Shadowrun 6e Combat Flow Cheat Sheet](https://www.scribd.com/document/576246992/SR6-Cheat-Sheet-Combat-flow)
- [Shadowrun 6e Combat Examples](https://nighthawks.org.uk/shadowrun/6e_Combat_Examples)
- [Shadowrun System Overview (Fandom)](https://shadowrun.fandom.com/wiki/Shadowrun_system)

## Daggerheart

**Archetype:** A (2d12 "Duality Dice" + trait modifier vs. Evasion)

**Attack:** Roll 2d12 (one Hope die, one Fear die) + trait modifier vs. target's Evasion. Which die rolls higher (Hope or Fear) determines narrative control — not just hit/miss. The weapon's governing trait (Agility, Strength, Finesse, Instinct, Presence, or Knowledge) determines which character stat feeds the attack modifier.

**Damage:** Damage die multiplied by Proficiency. A character with Proficiency 2 wielding a d8 weapon rolls 2d8 + modifier. Critical success = normal damage + maximum possible dice value added on top.

**Weapon slots:** Primary and Secondary weapons — maps cleanly to Phase 1's `main`/`off` slot system.

**Weapon properties:**
- **Trait:** Governing character trait for attack rolls (Agility, Strength, Finesse, Instinct, Presence, Knowledge)
- **Range:** Zone-based (Melee, Very Close, Close, Far, Very Far) — not numeric distance
- **Burden:** One-handed or Two-handed (maps to Phase 1's `twoHanded`)
- **Damage type:** Physical (phy) or Magical (mag) — simple binary, not the granular types of 5e/PF2e
- **Damage die:** The base die size (d4, d6, d8, d10, d12)

**Weapon features:** Special properties similar to 5e/PF2e traits:
- **Powerful:** Roll an extra damage die, discard the lowest
- **Returning:** Weapon returns to hand after being thrown
- Others defined per weapon

These overlap conceptually with 5e/PF2e weapon traits — a shared trait framework with per-system catalogs could serve all three.

**Data shape delta from 5e:** Moderate. Attack structure is similar (roll + mod vs. defense). Needs: `governingTrait` instead of `abilityMod`, `proficiencyMultiplier` for damage dice count, zone-based range enum instead of free string, `damageType` simplified to phy/mag.

**Sources:**
- [Daggerheart SRD — Weapons](https://daggerheartsrd.com/rules/weapons/)
- [Daggerheart SRD — Attacking](https://daggerheartsrd.com/rules/attacking/)
- [Daggerheart.org — Weapons Reference](https://daggerheart.org/reference/weapons)
- [Daggerheart.org — Combat](https://daggerheart.org/core-mechanics/combat)

---

# Key Architectural Takeaways

1. **Three roll engines, not eight.** Single-die-plus-modifier, percentile roll-under, and dice pool cover all 8 systems. Cyberpunk Red is a stretch fit for single-die-plus-modifier but close enough to share plumbing.

2. **The data shape needs to be system-polymorphic.** A weapon in VtM has almost nothing in common with a weapon in 5e. Rather than one mega-schema, consider a shared shell (id, name, slot, icon, notes) with a system-specific `mechanics` object that carries only the fields relevant to that system.

3. **Traits/properties are a shared concept across 5e, PF2e, and Daggerheart.** A unified trait system with per-system catalogs and optional mechanical hooks would serve all three.

4. **Firing modes are Cyberpunk Red + Shadowrun only.** Shared sub-feature, but only activated for those two systems.

5. **MAP is PF2e-only.** The 3-button attack UI can be gated purely on PF2e.

6. **Damage instances (Phase 1 pattern) extend cleanly** to most systems. Only dice-pool systems (VtM, Shadowrun) need a different damage resolution path where attack margin feeds into damage.

7. **Ammo tracking generalizes well.** Phase 1's simple count works for most systems. Firing modes (Cyberpunk Red, Shadowrun) just need `ammoPerShot` per mode.

---

# Insufficiently Documented Systems

All systems had adequate publicly available SRD/wiki information for core weapon mechanics at this stage. Deeper rules nuances (exact critical injury tables, full weapon lists with stats, VtM weapon damage values) would benefit from rulebook access during implementation. If any system's mechanics prove incomplete during design, flag for human contributors in beta testing rather than guessing.

---

# Implementation Plan

## Current Code State (Read These First)

Before implementing, read these files to understand the existing patterns:

- **`scripts/module-weapons.js`** (~1543 lines, IIFE) — The primary file. Contains `registerModuleType('weapons', ...)`, all rendering, modals, trait system, and pure functions.
- **`_DOCS/SUBMODULES/WEAPONS.md`** — Phase 1 design spec with data shape, UI layout, and decision log.
- **`scripts/module-stat.js`** — Exposes `window.getAbilityModifier(key)` (line ~402) and `window.getProficiencyBonus()` (line ~412). Weapons depends on these.
- **`scripts/module-level.js`** — Exposes `window.getCharacterLevel()`. Needed for PF2e proficiency rank computation.
- **`scripts/settings.js`** — Defines `window.gameSystem`. Supported values: `'dnd5e'`, `'pf2e'`, `'coc'`, `'vtm'`, `'cpred'`, `'mothership'`, `'sr6'`, `'daggerheart'`, `'custom'`.
- **`scripts/translations.js`** — All i18n keys. Weapon keys start at `weapons.*`. 7 locales: en, es, fr, de, it, pt-BR, ru.
- **`tests/module-weapons.test.js`** and **`tests/module-weapons-traits.test.js`** — Existing test files.

## Key Existing Functions in module-weapons.js

| Function | Location | Purpose |
|---|---|---|
| `ensureWeaponsContent(data)` | ~line 155 | Shape guard — ensures all weapon fields exist with defaults. Runs on every render. |
| `weaponsComputeAttackBonus(weapon)` | ~line 180 | Computes 5e attack bonus: abilityMod + profBonus (or override). Returns number. |
| `weaponsFormatDamageSummary(weapon)` | ~line 190 | Formats damage for card display. |
| `buildWeaponCard(weapon, data, isPlayMode)` | ~line 220 | Renders a weapon card in the module body. Shows attack bonus badge for non-shields. |
| `renderPlayBody(bodyEl, data)` | ~line 474 | Play mode renderer. Contains `_warnedGameSystem` console.warn for non-5e. |
| `renderEditBody(bodyEl, data)` | ~line 496 | Edit mode renderer. Also has the `_warnedGameSystem` warning. |
| `openWeaponActionModal(weapon, data)` | ~line 580 | Play mode action modal. Single "Attack" button + per-instance damage buttons. Hardcoded `'1d20' + formatBonus(bonus)` at line ~617. |
| `openWeaponEditModal(weapon, data, onSave, onDelete)` | ~line 705 | Edit modal (~480 lines). Sections: name, icon, slot+kind, abilityMod+proficient, attackOverride+twoHanded, range, shield, damageInstances, traits, notes. `updateConditionalSections` at ~line 1102 toggles ranged/shield sections. |
| `openWeaponTraitPickerModal(...)` | ~line 1190 | Trait picker. Iterates `WEAPON_TRAITS_DND5E` at ~line 1348. Has search, canonical list, custom section. |
| `WEAPON_TRAITS_DND5E` | ~line 40 | 10 canonical 5e traits (Ammunition, Finesse, Heavy, Light, Loading, Reach, Special, Thrown, Two-Handed, Versatile). |
| `resolveWeaponTrait(traitEntry, content)` | ~line 122 | Looks up trait metadata. Currently only handles `dnd5e.*` prefix. |
| `normalizeWeaponTraits(traits, content)` | ~line 96 | Normalizes mixed string/object traits. Uses `DND5E_TRAITS_BY_NORMALIZED_NAME` map. |
| `formatBonus(n)` | ~line 188 | Formats `+3` or `-2` from a number. Used in dice expressions. |

All pure functions are exposed on `window` at bottom of IIFE (~line 1532).

## Current Weapon Data Shape (Phase 1)

```js
{
  id: string,                       // wpn_<timestamp><random>
  name: string,
  slot: 'main' | 'off',
  kind: 'melee' | 'ranged' | 'shield',
  icon: string | null,
  abilityMod: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
  proficient: boolean,
  attackBonusOverride: number | null,
  damageInstances: [{ dice: string, modFromAbility: boolean, flatBonus: number, damageType: string }],
  range: string | null,
  ammoCount: number | null,
  traits: [{ key: string, value: string | null }],
  notesMarkdown: string,
  twoHanded: boolean,
  acBonus: number | null,           // shield only
  shieldHp: number | null,          // shield only
  shieldHpMax: number | null        // shield only
}
```

Also `data.content.customWeaponTraits: [{ key, name, description }]`

## Data Shape Extension

**Strategy:** Flat optional fields with `null` defaults added to `ensureWeaponsContent`. NO nested `mechanics` sub-object — every existing function accesses `weapon.fieldName` directly, and the shape guard already handles missing fields. Existing 5e saves migrate automatically (new fields default to `null` on load, no version bump needed).

**New fields to add:**

```js
// In ensureWeaponsContent, after existing field defaults:

// PF2e
if (w.proficiencyRank === undefined) w.proficiencyRank = null;
// 'untrained' | 'trained' | 'expert' | 'master' | 'legendary' | null

// Percentile systems (CoC, Mothership)
if (w.skillName === undefined) w.skillName = null;       // e.g., "Handgun", "Combat"
if (w.skillValue === undefined) w.skillValue = null;     // e.g., 45 (means 45%)

// Dice pool systems (VtM, Shadowrun)
if (w.poolAttribute === undefined) w.poolAttribute = null;  // e.g., "Dexterity", "Agility"
if (w.poolSkill === undefined) w.poolSkill = null;          // e.g., "Firearms", "Melee"
if (w.poolSize === undefined) w.poolSize = null;            // total pool size (user-entered)

// Cyberpunk Red
if (w.weaponCategory === undefined) w.weaponCategory = null;    // e.g., "Handgun", "Shoulder Arms"
if (w.cpredStat === undefined) w.cpredStat = null;              // e.g., "REF"
if (w.cpredSkillValue === undefined) w.cpredSkillValue = null;  // numeric skill value

// Daggerheart
if (w.governingTrait === undefined) w.governingTrait = null;  // e.g., "Agility", "Strength"

// Shadowrun-specific damage
if (w.baseDamageFlat === undefined) w.baseDamageFlat = null;    // flat number (e.g., 5)
if (w.damageCategory === undefined) w.damageCategory = null;    // 'Physical' | 'Stun'

// Firing modes (CPR + SR)
if (w.firingModes === undefined) w.firingModes = null;
// FiringMode = { name: string, ammoCost: number, diceModifier: number|null, damageBonus: number|null }

// CoC
if (w.impaling === undefined) w.impaling = null;  // impaling weapon flag

// Mothership
if (w.armorSavePenalty === undefined) w.armorSavePenalty = null;
```

## SYSTEM_EDIT_CONFIG — Controls Which Modal Sections Show Per System

```js
var SYSTEM_EDIT_CONFIG = {
  dnd5e:       { abilityMod: true,  proficient: true,  profRank: false, skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  pf2e:        { abilityMod: true,  proficient: false, profRank: true,  skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  coc:         { abilityMod: false, proficient: false, profRank: false, skillField: true,  poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: true,  armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  vtm:         { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: true,  weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  cpred:       { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: false, weaponCat: true,  firingModes: true,  governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  mothership:  { abilityMod: false, proficient: false, profRank: false, skillField: true,  poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: true,  baseDmgFlat: false, dmgCategory: false },
  sr6:         { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: true,  weaponCat: false, firingModes: true,  governingTrait: false, attackOverride: false, damageInstances: false, traits: false, impaling: false, armorSavePen: false, baseDmgFlat: true,  dmgCategory: true  },
  daggerheart: { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: true,  attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
  custom:      { abilityMod: true,  proficient: true,  profRank: false, skillField: true,  poolField: true,  weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
};
```

## Edit Modal — New Sections to Add

Each section should be built as a separate builder function to manage complexity. Wrap each in a container div that `updateConditionalSections` can show/hide.

1. **Proficiency Rank** (PF2e) — `buildCvSelect` dropdown: Untrained, Trained, Expert, Master, Legendary. Replaces the proficiency toggle for PF2e.
2. **Skill Name + Skill Value** (CoC, Mothership) — text input for skill name + number input 0-100 for skill value. Mothership labels this "Combat Stat" via i18n.
3. **Pool Attribute + Pool Skill + Pool Size** (VtM, SR) — two text inputs + number input for override pool size.
4. **Weapon Category + STAT + Skill Value** (CPR) — select dropdown (Handgun, Shoulder Arms, Archery, Heavy Weapons, Autofire, Martial Arts) + text input for stat + number input for skill.
5. **Governing Trait** (Daggerheart) — select dropdown: Agility, Strength, Finesse, Instinct, Presence, Knowledge.
6. **Firing Modes** (CPR, SR) — dynamic list like damage instances. Each row: mode name (text), ammo cost (number), dice modifier (number), damage bonus (number), remove button. Plus "Add Firing Mode" button.
7. **Base Damage Flat + Damage Category** (SR) — number input for flat damage + select for Physical/Stun.
8. **Impaling** (CoC) — `makeCvToggle` for impaling weapon flag.
9. **Armor Save Penalty** (Mothership) — number input.

Existing Ability Mod + Proficient row: hide for non-d20 systems per config. Attack Bonus Override: stays visible for Archetype A systems.

## Action Modal — Three Archetype Rendering Paths

Add `getAttackArchetype(sys)` helper inside the IIFE:

```js
function getAttackArchetype(sys) {
  if (sys === 'dnd5e' || sys === 'pf2e' || sys === 'daggerheart' || sys === 'cpred') return 'A';
  if (sys === 'coc' || sys === 'mothership') return 'B';
  if (sys === 'vtm' || sys === 'sr6') return 'C';
  return 'A'; // custom falls back to single-die
}
```

### Archetype A — Single Die + Modifier
- **5e:** Current behavior unchanged. Single "Attack" button → `1d20+{bonus}`.
- **PF2e:** Three MAP buttons in the attack column:
  - "1st Attack (1d20+{bonus})"
  - "2nd Attack (1d20+{bonus-5})" (or -4 if Agile)
  - "3rd Attack (1d20+{bonus-10})" (or -8 if Agile)
  - Agile detection: `weapon.traits.some(function(tr) { return tr.key === 'pf2e.agile'; })`
- **Daggerheart:** Single "Attack" button → `2d12+{traitMod}`. Trait mod resolved via `window.getAbilityModifier(weapon.governingTrait)`.
- **CPR:** One button per firing mode (or single button if no firingModes). Expression: `1d10+{cpredSkillValue}`. Display "vs DV" as reference text below buttons (player looks up DV themselves).

### Archetype B — Percentile Roll-Under
- **Attack column:** "Roll Attack" button → `1d100`. Below the button, display reference text (NOT interactive):
  - `"{skillName}: {skillValue}%"`
  - For CoC: `"Hard: {Math.floor(skillValue/2)}% | Extreme: {Math.floor(skillValue/5)}%"`
  - If `impaling` is true, show "Impaling" label near weapon name
  - For Mothership: show armor save penalty if set
- **Damage column:** Same pattern as 5e — one button per damage instance.

### Archetype C — Dice Pool
- **Attack column:** "Roll Pool" button:
  - VtM: `{poolSize}d10` — reference text: `"{poolAttribute} + {poolSkill}"`, `"Success: 6+"`
  - SR: `{poolSize}d6` — reference text: `"{poolAttribute} + {poolSkill}"`, `"Hit: 5+"`
  - SR with firing modes: separate button per mode showing pool/ammo info
- **Damage column:**
  - VtM: standard damage instance buttons
  - SR: display flat base damage and damage category as reference label (e.g., "5P" or "3S")

**All archetypes put dice in the tray. None count successes, apply MAP automatically, or compute hit/miss.**

## weaponsComputeAttackBonus — Refactored

```js
function weaponsComputeAttackBonus(weapon) {
  // Override always wins, regardless of system
  if (weapon.attackBonusOverride !== null && weapon.attackBonusOverride !== undefined) {
    return Number(weapon.attackBonusOverride);
  }

  var sys = window.gameSystem || 'custom';

  if (sys === 'dnd5e' || sys === 'custom') {
    // Existing 5e logic — unchanged
    var abilityMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
    var profBonus = weapon.proficient && typeof window.getProficiencyBonus === 'function' ? window.getProficiencyBonus() : 0;
    return abilityMod + profBonus;
  }

  if (sys === 'pf2e') {
    var abilityMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
    var charLevel = typeof window.getCharacterLevel === 'function' ? window.getCharacterLevel() : 1;
    var rankBonusMap = { untrained: 0, trained: 2, expert: 4, master: 6, legendary: 8 };
    var rankBonus = rankBonusMap[weapon.proficiencyRank] || 0;
    var profBonus = weapon.proficiencyRank && weapon.proficiencyRank !== 'untrained' ? rankBonus + charLevel : 0;
    return abilityMod + profBonus;
  }

  if (sys === 'daggerheart') {
    // Daggerheart uses governing trait instead of ability mod
    var traitMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.governingTrait) : 0;
    return traitMod;
  }

  // Tracking tier systems — no auto-computation
  return null;
}
```

**Callers must handle `null`:**
- `buildWeaponCard`: If null, show system-appropriate info instead of bonus badge (e.g., `"45%"` for CoC, `"6d"` for pool size)
- `openWeaponActionModal`: If null, use archetype-specific dice expression instead of `1d20+bonus`

## Trait System Extension

**Add constants inside the IIFE:**

`WEAPON_TRAITS_PF2E` — 11 traits: Agile, Deadly (takesValue), Fatal (takesValue), Finesse, Forceful, Propulsive, Reach, Sweep, Versatile (takesValue), Thrown (takesValue), Two-Hand (takesValue). Follow exact pattern of `WEAPON_TRAITS_DND5E`.

`WEAPON_TRAITS_DAGGERHEART` — 2 traits: Powerful, Returning. Same structure.

Add corresponding `PF2E_TRAITS_BY_NORMALIZED_NAME` and `DAGGERHEART_TRAITS_BY_NORMALIZED_NAME` alias maps.

**`getSystemTraitCatalog()` helper:**
```js
function getSystemTraitCatalog() {
  var sys = window.gameSystem || 'custom';
  if (sys === 'dnd5e' || sys === 'custom') return WEAPON_TRAITS_DND5E;
  if (sys === 'pf2e') return WEAPON_TRAITS_PF2E;
  if (sys === 'daggerheart') return WEAPON_TRAITS_DAGGERHEART;
  return [];
}
```

**Changes to existing functions:**
- `openWeaponTraitPickerModal` (~line 1348): Replace `WEAPON_TRAITS_DND5E` with `getSystemTraitCatalog()`
- `resolveWeaponTrait` (~line 122): Add `pf2e.*` and `daggerheart.*` prefix handling alongside existing `dnd5e.*`
- `normalizeWeaponTraits` (~line 96): Use system-aware normalized name map

**Expose on `window`:** `WEAPON_TRAITS_PF2E`, `WEAPON_TRAITS_DAGGERHEART`

## module-stat.js — Extend getAbilityModifier

Extend the `nameMap` at ~line 403 to resolve Daggerheart trait names in addition to 5e abbreviations:

```js
var nameMap = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
  // Daggerheart traits — map to stat module names
  agility: 'AGILITY', strength: 'STRENGTH', finesse: 'FINESSE',
  instinct: 'INSTINCT', presence: 'PRESENCE', knowledge: 'KNOWLEDGE'
};
```

This allows `weaponsComputeAttackBonus` to call `window.getAbilityModifier('agility')` for Daggerheart weapons and get the correct value from a Daggerheart stat module.

## Weapon Card Display — System-Appropriate Info

In `buildWeaponCard` (~line 258), where the attack bonus badge is rendered:

```js
var bonus = weaponsComputeAttackBonus(weapon);
if (bonus !== null) {
  // Automated tier: show computed bonus
  bonusEl.textContent = formatBonus(bonus);
} else {
  // Tracking tier: show system-specific reference
  var sys = window.gameSystem || 'custom';
  if (sys === 'coc' || sys === 'mothership') {
    bonusEl.textContent = (weapon.skillValue || 0) + '%';
  } else if (sys === 'vtm' || sys === 'sr6') {
    bonusEl.textContent = (weapon.poolSize || 0) + 'd';
  } else if (sys === 'cpred') {
    bonusEl.textContent = '+' + (weapon.cpredSkillValue || 0);
  }
}
```

## i18n Keys to Add

All keys need entries in all 7 locales (en, es, fr, de, it, pt-BR, ru). English values listed. Non-English locales can use placeholder English copies initially.

**PF2e MAP buttons:**
- `weapons.attackFirst` → `'1st Attack'`
- `weapons.attackSecond` → `'2nd Attack'`
- `weapons.attackThird` → `'3rd Attack'`

**PF2e proficiency ranks:**
- `weapons.proficiencyRank` → `'Proficiency Rank'`
- `weapons.rank.untrained` → `'Untrained'`
- `weapons.rank.trained` → `'Trained'`
- `weapons.rank.expert` → `'Expert'`
- `weapons.rank.master` → `'Master'`
- `weapons.rank.legendary` → `'Legendary'`

**PF2e trait names + descriptions:** 11 traits × 2 keys each = 22 keys
`weapons.trait.pf2e.agile`, `weapons.trait.pf2e.agileDesc`, etc.

**Daggerheart trait names + descriptions:** 2 traits × 2 keys each = 4 keys

**System-specific field labels:**
- `weapons.skillName` → `'Skill'`
- `weapons.skillValue` → `'Skill %'`
- `weapons.combatStat` → `'Combat Stat %'`
- `weapons.poolAttribute` → `'Pool Attribute'`
- `weapons.poolSkill` → `'Pool Skill'`
- `weapons.poolSize` → `'Pool Size'`
- `weapons.weaponCategory` → `'Category'`
- `weapons.cpredStat` → `'STAT'`
- `weapons.cpredSkill` → `'Skill Value'`
- `weapons.governingTrait` → `'Governing Trait'`
- `weapons.baseDamageFlat` → `'Base Damage'`
- `weapons.damageCategory` → `'Damage Type'`
- `weapons.damagePhysical` → `'Physical'`
- `weapons.damageStun` → `'Stun'`
- `weapons.impaling` → `'Impaling'`
- `weapons.armorSavePenalty` → `'Armor Save Penalty'`
- `weapons.firingModes` → `'Firing Modes'`
- `weapons.addFiringMode` → `'Add Firing Mode'`
- `weapons.modeName` → `'Mode'`
- `weapons.ammoCost` → `'Ammo/Shot'`
- `weapons.diceModifier` → `'Dice Mod'`
- `weapons.damageBonus` → `'Dmg Bonus'`
- `weapons.rollPool` → `'Roll Pool'`
- `weapons.rollAttack` → `'Roll Attack'`

**Activity log event types:**
- `weapons.log.poolRoll` → `'{name} pool roll: {roll}'`
- `weapons.log.percentileRoll` → `'{name} attack: {roll} (vs {skill}%)'`

## Implementation Sequence

Execute these steps in order. Each step should be a separate commit.

### Step 1: Data Foundation (no UI changes, no breakage)
- Add ~15 new null-default field assignments to `ensureWeaponsContent` in `scripts/module-weapons.js`
- Refactor `weaponsComputeAttackBonus` with system branching (returns `null` for tracking tier)
- Extend `window.getAbilityModifier` name map in `scripts/module-stat.js` for Daggerheart traits
- Remove the `_warnedGameSystem` console.warn fallback from `renderPlayBody` and `renderEditBody`
- Add unit tests for refactored `weaponsComputeAttackBonus` (5e unchanged, PF2e with ranks, Daggerheart with trait, tracking tier returns null)
- Add unit tests for `ensureWeaponsContent` with new fields

### Step 2: Trait System
- Add `WEAPON_TRAITS_PF2E` (11 entries) and `WEAPON_TRAITS_DAGGERHEART` (2 entries) constants
- Add `PF2E_TRAITS_BY_NORMALIZED_NAME` and `DAGGERHEART_TRAITS_BY_NORMALIZED_NAME` maps
- Add `getSystemTraitCatalog()` helper
- Refactor `resolveWeaponTrait` to handle `pf2e.*` and `daggerheart.*` prefixes
- Refactor `normalizeWeaponTraits` for system-aware lookup
- Refactor `openWeaponTraitPickerModal` to use `getSystemTraitCatalog()` instead of hardcoded `WEAPON_TRAITS_DND5E`
- Expose `WEAPON_TRAITS_PF2E` and `WEAPON_TRAITS_DAGGERHEART` on `window`
- Add all trait-related i18n keys to `scripts/translations.js` (all 7 locales)
- Add tests for PF2e/Daggerheart trait resolution and catalog in `tests/module-weapons-traits.test.js`

### Step 3: Edit Modal
- Add `SYSTEM_EDIT_CONFIG` map inside the IIFE
- Build new system-gated field sections (extract each as a builder function)
- Expand `updateConditionalSections` to show/hide all system-gated sections
- Add all field-label i18n keys to `scripts/translations.js`
- Add CSS for new sections in `main.css` (`/* ── Weapons Module ── */` section)

### Step 4: Action Modal
- Add `getAttackArchetype(sys)` helper
- Implement Archetype A rendering (5e unchanged, PF2e MAP buttons, Daggerheart 2d12, CPR 1d10)
- Implement Archetype B rendering (d100 + skill reference display)
- Implement Archetype C rendering (pool dice + reference display)
- Add action-modal i18n keys (MAP labels, pool labels, percentile labels)

### Step 5: Weapon Card Display
- Refactor `buildWeaponCard` to show system-appropriate info when `weaponsComputeAttackBonus` returns null
- CSS adjustments for new badge content styles

### Step 6: Documentation
- Update `_DOCS/ARCHITECTURE.md` — module-weapons.js function list, new window exports
- Update `_DOCS/SUBMODULES/WEAPONS.md` — data shape with new fields, Phase 2 status

## Files Modified Summary

| File | Scope |
|---|---|
| `scripts/module-weapons.js` | Primary target. +400-500 lines, ~50 modified. Data shape, modals, traits, attack bonus. |
| `scripts/translations.js` | ~60 new i18n keys × 7 locales |
| `scripts/module-stat.js` | Extend `getAbilityModifier` name map (~10 lines) |
| `main.css` | New field section styles, MAP button styles (~40-60 lines in Weapons section) |
| `tests/module-weapons.test.js` | Test attack bonus refactor, new fields (~80-100 lines) |
| `tests/module-weapons-traits.test.js` | Test PF2e/Daggerheart traits (~40-60 lines) |
| `_DOCS/ARCHITECTURE.md` | Update module-weapons.js entry |
| `_DOCS/SUBMODULES/WEAPONS.md` | Update data shape, Phase 2 status |
