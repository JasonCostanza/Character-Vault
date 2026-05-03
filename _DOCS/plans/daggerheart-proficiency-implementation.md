# Daggerheart Proficiency — Implementation Plan

## Context

Daggerheart proficiency is a character-wide value (1–6) that multiplies weapon damage dice. Proficiency 3 + d8 weapon = 3d8 damage. It does **not** affect action rolls (2d12 Hope/Fear checks). Currently Character Vault has no proficiency support for Daggerheart, and the stats module incorrectly shows a proficiency dot/toggle that's meaningless for the system.

Per the official Daggerheart character sheet, proficiency belongs visually in the **weapons section header**. The value is stored once on the weapons module's `data.content` (not per-weapon), since it applies to all weapons equally.

---

## Phase 1: i18n — `scripts/translations.js`

- [x] Add `weapons.proficiency` (`"Proficiency"`) to all 7 locale blocks, in the `weapons.*` namespace after existing weapons keys

---

## Phase 2: Data & Logic

### `scripts/module-weapons.js`

- [x] **Content guard** — `ensureWeaponsContent()` (line 262): add after line 268:
  ```js
  if (data.content.daggerheartProficiency === undefined) data.content.daggerheartProficiency = null;
  ```
  Named `daggerheartProficiency` to distinguish from D&D 5e's `proficient` (boolean), PF2e's `proficiencyRank` (string), and `getProficiencyBonus()` (5e numeric).

- [x] **Cross-module accessor** — add after existing `window.*` exports (~line 3053):
  ```js
  window.getCharacterProficiency = function () {
      var mod = window.modules.find(function (m) { return m.type === 'weapons'; });
      return mod && mod.content ? (mod.content.daggerheartProficiency || null) : null;
  };
  ```
  Follows the same pattern as `window.getCharacterLevel()`. Returns `null` when not set; consuming code treats `null` as 1.

- [x] **Dice multiplication helper** — add inside IIFE, before `weaponsFormatDamageSummary` (line 340). Mirrors `weaponsApplyStrikingBonus` (line 397) but multiplies instead of adds:
  ```js
  function weaponsApplyProficiencyDice(diceStr, proficiency) {
      if (!proficiency || proficiency <= 1) return diceStr || '';
      var match = (diceStr || '').match(/^(\d+)d(\d+)$/);
      if (!match) return diceStr || '';
      return (parseInt(match[1], 10) * proficiency) + 'd' + match[2];
  }
  ```
  Expose on `window` alongside other weapon helpers (~line 3050).

- [x] **Damage summary** — `weaponsFormatDamageSummary()` (line 341): after `var dmg = inst.dice || '';` (line 348) and before the PF2e striking block (line 349):
  ```js
  if ((window.gameSystem || 'custom') === 'daggerheart') {
      var dhProf = typeof window.getCharacterProficiency === 'function'
          ? window.getCharacterProficiency() : null;
      if (dhProf && dhProf > 1) dmg = weaponsApplyProficiencyDice(dmg, dhProf);
  }
  ```

- [x] **Action modal damage** — `openWeaponActionModal()` damage loop (line 1591): after `var diceExpr = ...` (line 1596), apply multiplication to `inst.dice` before the flat bonus is appended:
  ```js
  if (sys === 'daggerheart') {
      var dhProf = typeof window.getCharacterProficiency === 'function'
          ? window.getCharacterProficiency() : null;
      if (dhProf && dhProf > 1) {
          var baseDice = weaponsApplyProficiencyDice(inst.dice || '1d4', dhProf);
          diceExpr = baseDice + (instBonus !== 0 ? formatBonus(instBonus) : '');
      }
  }
  ```

### `scripts/module-stat.js`

- [x] **Hide proficiency dot** — `renderStatBlock()` (line 113): change `} else if (stat.proficient) {` to:
  ```js
  } else if (stat.proficient && sys !== 'daggerheart') {
  ```

- [x] **Hide proficiency toggle** — `renderStatBlockEdit()` (line 150): change `} else {` to:
  ```js
  } else if (editSys !== 'daggerheart') {
  ```

---

## Phase 3: UI

### `scripts/module-weapons.js`

Add a compact proficiency row **above** the two-column weapon layout, visible only when `gameSystem === 'daggerheart'`.

- [x] **Play mode** — `renderPlayBody()` (line 752): before appending the two-column layout, render a row with label + value badge showing `content.daggerheartProficiency || 1`. Static/read-only.

- [x] **Edit mode** — `renderEditBody()` (line 770): same position, but render a number input (`min=1`, `max=6`, `step=1`). Input handler clamps to 1–6, writes to `content.daggerheartProficiency`, calls `scheduleSave()`.

### `main.css` — within `/* ── Weapons Module ── */`

- [x] `.weapons-proficiency-row` — flex row, centered, `user-select: none`, small bottom margin
- [x] `.weapons-proficiency-label` — small uppercase text, `--cv-text-secondary`
- [x] `.weapons-proficiency-value` — badge/pill, `--cv-text-primary`, `--cv-bg-raised` (token used; plan listed `--cv-bg-secondary` which doesn't exist)
- [x] `.weapons-proficiency-input` — narrow number input (~40px), matches modal input styles

---

## Phase 4: Tests — `tests/module-weapons.test.js`

- [x] `weaponsApplyProficiencyDice('1d8', 1)` → `'1d8'`
- [x] `weaponsApplyProficiencyDice('1d8', 3)` → `'3d8'`
- [x] `weaponsApplyProficiencyDice('2d6', 2)` → `'4d6'`
- [x] `weaponsApplyProficiencyDice('1d8', null)` → `'1d8'`
- [x] `weaponsApplyProficiencyDice('1d8+3', 2)` → `'1d8+3'` (non-`NdM` pattern returned unchanged)

---

## Phase 5: Documentation

- [x] **`_DOCS/DICE_MECHANICS.md`** — replace incorrect Daggerheart section (lines 154–163):
  - Action roll: `2d12 (Hope + Fear) + trait modifier`, proficiency does NOT apply
  - Damage roll: `[proficiency]d[die]`, proficiency multiplies dice count, stored as `daggerheartProficiency`

- [x] **`_DOCS/ARCHITECTURE.md`** — add `window.getCharacterProficiency()` and `window.weaponsApplyProficiencyDice()` to the `module-weapons.js` row

- [x] **`_DOCS/SUBMODULES/WEAPONS.md`** — add "Daggerheart Proficiency" section: `data.content.daggerheartProficiency` field, `getCharacterProficiency()` accessor, `weaponsApplyProficiencyDice()` integration
