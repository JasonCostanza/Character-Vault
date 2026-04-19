# Weapon Trait Chips — Tooltips + Phase 2 Foundation

## Context

Weapon traits today are free-form comma-separated strings rendered as plain `.weapon-trait-chip` spans with no hover tooltip. This change (a) adds custom CSS tooltips showing each trait's description, and (b) converts traits to a keyed data model backed by a searchable picker modal, so the mechanical-effects work in Phase 2 (next sprint) doesn't require a second migration. Custom/homebrew traits are first-class from day one — per-character, mirroring `content.customConditions`.

## Design invariants (locked)

- **Data shape**: `weapon.traits: [{ key: string, value: string | null }]`. `value` is always `null` in v1; Phase 2 wires the value input for `takesValue` traits.
- **Key namespace**: canonical keys use `dnd5e.` prefix (e.g. `dnd5e.finesse`). Custom keys use `custom.` + generated id. Leaves `dnd5e2024.*` / `pf2e.*` room later.
- **Custom storage**: `content.customWeaponTraits: [{ key, name, description }]`, per-character.
- **Seed list**: D&D 5e 2014 PHB only (10 traits). 2024 and PF2e ship later as separate system presets.
- **Tooltips**: `data-tooltip` attribute + CSS `::after` (native `title` doesn't render in TaleSpire's Chromium — CLAUDE.md rule 10).
- **Picker UX**: searchable modal (scales to PF2e's ~40 traits); toggle rows; Done/Cancel/X per CLAUDE.md rule 15.
- **Persistence**: `scheduleSave()` after any mutation (rule 6).
- **i18n**: every user-visible string uses `data-i18n` or `t()` (rule 17).
- **IIFE + window exposure** for new pure functions (rule 19); add vitest coverage (rule 20).

## Data model: before → after

```js
// BEFORE
weapon.traits = ['Finesse', 'Light', 'Homebrew Bleed']

// AFTER (all weapons, always)
weapon.traits = [
  { key: 'dnd5e.finesse', value: null },
  { key: 'dnd5e.light',   value: null },
  { key: 'custom.wt_ab12', value: null },
]

content.customWeaponTraits = [
  { key: 'custom.wt_ab12', name: 'Homebrew Bleed', description: '' },
]
```

Migration runs inside `ensureWeaponsContent()` on every load; once a weapon is normalized and re-saved, it stays in the new shape.

## Canonical 5e 2014 trait table

New const near the top of `scripts/module-weapons.js`, alphabetical:

```js
const WEAPON_TRAITS_DND5E = [
  { key: 'dnd5e.ammunition', nameKey: 'weapons.trait.dnd5e.ammunition', descKey: 'weapons.trait.dnd5e.ammunitionDesc', takesValue: true  },
  { key: 'dnd5e.finesse',    nameKey: 'weapons.trait.dnd5e.finesse',    descKey: 'weapons.trait.dnd5e.finesseDesc',    takesValue: false },
  { key: 'dnd5e.heavy',      nameKey: 'weapons.trait.dnd5e.heavy',      descKey: 'weapons.trait.dnd5e.heavyDesc',      takesValue: false },
  { key: 'dnd5e.light',      nameKey: 'weapons.trait.dnd5e.light',      descKey: 'weapons.trait.dnd5e.lightDesc',      takesValue: false },
  { key: 'dnd5e.loading',    nameKey: 'weapons.trait.dnd5e.loading',    descKey: 'weapons.trait.dnd5e.loadingDesc',    takesValue: false },
  { key: 'dnd5e.reach',      nameKey: 'weapons.trait.dnd5e.reach',      descKey: 'weapons.trait.dnd5e.reachDesc',      takesValue: false },
  { key: 'dnd5e.special',    nameKey: 'weapons.trait.dnd5e.special',    descKey: 'weapons.trait.dnd5e.specialDesc',    takesValue: false },
  { key: 'dnd5e.thrown',     nameKey: 'weapons.trait.dnd5e.thrown',     descKey: 'weapons.trait.dnd5e.thrownDesc',     takesValue: true  },
  { key: 'dnd5e.twoHanded',  nameKey: 'weapons.trait.dnd5e.twoHanded',  descKey: 'weapons.trait.dnd5e.twoHandedDesc',  takesValue: false },
  { key: 'dnd5e.versatile',  nameKey: 'weapons.trait.dnd5e.versatile',  descKey: 'weapons.trait.dnd5e.versatileDesc',  takesValue: true  },
];
```

Also build a lookup map: `const DND5E_TRAITS_BY_NORMALIZED_NAME = new Map([...])` keyed by `name.toLowerCase().trim()` → entry, using the English `nameKey` default (e.g. `'finesse' → entry`, `'two-handed' → entry`, `'two handed' → entry`). Used by migration only.

## Pure helper signatures (expose on `window` for vitest)

```js
// Resolves a trait entry to a display-ready shape. Always returns a usable object.
resolveWeaponTrait(traitEntry, content) => {
  key, name, description, takesValue, isCustom
}

// One-shot migration. Idempotent. Mutates `content.customWeaponTraits` as a side effect
// when unknown strings are encountered; returns the normalized traits array.
normalizeWeaponTraits(traits, content) => [{ key, value: null }, ...]

// Dedupe-by-normalized-name custom trait creator. Returns the key (existing or new).
findOrCreateCustomTrait(rawName, content) => string

// Small generator for custom keys; collision-check against content.customWeaponTraits.
generateCustomTraitKey(content) => string   // e.g. 'custom.wt_ab12'
```

**`normalizeWeaponTraits` algorithm:**
1. For each entry in `traits`:
   - If it's an object with a `key` string, coerce `value` to `null` if missing. Keep.
   - If it's a string, trim. If empty, drop.
     - Lowercase + look up in `DND5E_TRAITS_BY_NORMALIZED_NAME`. If match → push `{ key: match.key, value: null }`.
     - Else → `findOrCreateCustomTrait(rawString, content)` → push `{ key, value: null }`.
2. Dedupe the resulting array by `key` (first occurrence wins).
3. Return.

**`resolveWeaponTrait`:**
1. If `traitEntry.key` starts with `dnd5e.` → find in `WEAPON_TRAITS_DND5E`, return `{ key, name: t(nameKey), description: t(descKey), takesValue, isCustom: false }`.
2. If starts with `custom.` → find in `content.customWeaponTraits`, return `{ key, name: custom.name, description: custom.description, takesValue: false, isCustom: true }`.
3. If unknown (stale data) → return `{ key, name: key, description: '', takesValue: false, isCustom: false }`.

## `scripts/module-weapons.js` — concrete edits

**1. Schema init (`ensureWeaponsContent`):**
- Guarantee `content.customWeaponTraits` is an array (default `[]`).
- For every weapon in `content.weapons`: `weapon.traits = normalizeWeaponTraits(weapon.traits || [], content)`.

**2. Remove** (edit modal, currently ~lines 894–905):
- The `traitsInput` text input, its label's placeholder, and the `input` event listener that splits on commas.
- The existing `data-i18n` attribute for `weapons.traitsPlaceholder` (key gets deleted from translations).

**3. Add** (edit modal, same location):
- A `.weapon-traits-edit-row` container holding:
  - Label `<span data-i18n="weapons.traits">Traits</span>`.
  - A `.weapon-traits-chips` wrapper that re-renders from `workingWeapon.traits`.
  - Each chip: `<span class="weapon-trait-chip weapon-trait-chip--editable" data-tooltip="…">{name}<button class="weapon-trait-chip-remove" aria-label="…">×</button></span>`. Clicking × removes that entry from `workingWeapon.traits`, re-renders the row, sets `dirty = true`.
  - Trailing `<button class="weapon-trait-add-btn" data-i18n="weapons.traitPicker.addBtn">+ Add</button>` that calls `openWeaponTraitPickerModal(workingWeapon, content, renderChips)`.
- Extract a local `renderWeaponTraitsChips()` closure inside `openWeaponEditModal` so both the add button and the picker's onChange can call it.

**4. Play-mode render (`buildWeaponCard`, currently ~141–151):**
- Replace chip creation with:
```js
weapon.traits.forEach(function (entry) {
  var resolved = resolveWeaponTrait(entry, content);
  var chip = document.createElement('span');
  chip.className = 'weapon-trait-chip';
  chip.textContent = resolved.name;
  if (resolved.description) chip.setAttribute('data-tooltip', resolved.description);
  traitsEl.appendChild(chip);
});
```
- Use `escapeHtml()` only if switching to `innerHTML`; since we're using `textContent` and `setAttribute`, escaping isn't needed.

**5. New function `openWeaponTraitPickerModal(workingWeapon, content, onChange)`:**

Modal DOM skeleton (overlay + dialog):
```
.modal-overlay.weapon-trait-picker-overlay
  .modal-dialog.weapon-trait-picker-dialog
    .modal-header
      <h3 data-i18n="weapons.traitPicker.title">
      <button class="modal-close-btn">×</button>
    .modal-body
      <input class="weapon-trait-picker-search" data-i18n-placeholder="weapons.traitPicker.searchPlaceholder">
      <div class="weapon-trait-picker-list">
        <!-- canonical rows (alphabetical by localized name) -->
        <button class="weapon-trait-picker-row" data-key="dnd5e.finesse">
          <span class="weapon-trait-picker-row-name">Finesse</span>
          <span class="weapon-trait-picker-row-check">✓</span>   <!-- shown when selected -->
        </button>
        …
        <div class="weapon-trait-picker-section-header" data-i18n="weapons.traitPicker.customHeader">
        <!-- custom rows with edit + delete affordances -->
        <div class="weapon-trait-picker-row weapon-trait-picker-row--custom" data-key="custom.wt_ab12">
          <span class="weapon-trait-picker-row-name">Homebrew Bleed</span>
          <button class="weapon-trait-picker-row-edit">✎</button>
          <button class="weapon-trait-picker-row-delete">🗑</button>
          <span class="weapon-trait-picker-row-check">✓</span>
        </div>
        …
        <!-- create-custom affordance -->
        <button class="weapon-trait-picker-create" data-i18n="weapons.traitPicker.createCustom">
        <!-- (reveals inline form with name + description + Save/Cancel on click) -->
      </div>
    .modal-footer
      <button class="btn-secondary" data-i18n="weapons.traitPicker.cancel">
      <button class="btn-primary"   data-i18n="weapons.traitPicker.done">
```

Behavior:
- **Search filter**: on input, hide rows whose localized name (case-insensitive) doesn't contain the query. Affects canonical + custom rows.
- **Toggle**: clicking a row toggles membership in a local working copy of `workingWeapon.traits` (add `{ key, value: null }` or remove by key). Row's check mark visibility reflects membership.
- **Done**: commit local copy to `workingWeapon.traits`, call `onChange()`, close modal, `scheduleSave()`.
- **Cancel / ×**: discard local copy, close. If local copy diverges from original, confirm first per rule 15.
- **Custom edit**: opens a tiny inline form pre-filled with current name/description. Save updates `content.customWeaponTraits` entry in place. Delete removes the custom trait AND strips it from every weapon's `traits` array across `content.weapons` (to prevent dangling keys).
- **Create custom**: inline form pushes a new entry; auto-selects it in the working copy so the user sees it take effect.
- Follow CLAUDE.md rule 16 (`scrollbar-gutter: stable` on the list), rule 17 (all text via `data-i18n` / `t()`), rule 15 (×, Cancel, Done, unsaved-changes prompt).

**6. IIFE exposure (bottom of `module-weapons.js` IIFE):**
```js
window.WEAPON_TRAITS_DND5E      = WEAPON_TRAITS_DND5E;
window.resolveWeaponTrait       = resolveWeaponTrait;
window.normalizeWeaponTraits    = normalizeWeaponTraits;
window.findOrCreateCustomTrait  = findOrCreateCustomTrait;
window.generateCustomTraitKey   = generateCustomTraitKey;
```

## `scripts/translations.js` — keys to add per language

Canonical trait names (short):
```
weapons.trait.dnd5e.ammunition
weapons.trait.dnd5e.finesse
weapons.trait.dnd5e.heavy
weapons.trait.dnd5e.light
weapons.trait.dnd5e.loading
weapons.trait.dnd5e.reach
weapons.trait.dnd5e.special
weapons.trait.dnd5e.thrown
weapons.trait.dnd5e.twoHanded
weapons.trait.dnd5e.versatile
```

Canonical trait descriptions — **verbatim from SRD 5.1** (released under the OGL 1.0a / Creative Commons Attribution 4.0), not paraphrased. Game mechanics must be exact: a player reading "Finesse" in a hover tooltip needs to see the canonical rule text, not an approximation. SRD 5.1 is license-compatible for redistribution; include the required SRD/OGL attribution in `LICENSE.txt` or a sibling attribution file (do NOT modify `LICENSE.txt` without explicit user permission per CLAUDE.md rule 1 — raise this for user sign-off during implementation).

Source: SRD 5.1, "Weapons" section, "Weapon Properties" subsection. All ten traits in the table above map 1:1 to SRD entries:
```
weapons.trait.dnd5e.ammunitionDesc
weapons.trait.dnd5e.finesseDesc
weapons.trait.dnd5e.heavyDesc
weapons.trait.dnd5e.lightDesc
weapons.trait.dnd5e.loadingDesc
weapons.trait.dnd5e.reachDesc
weapons.trait.dnd5e.specialDesc
weapons.trait.dnd5e.thrownDesc
weapons.trait.dnd5e.twoHandedDesc
weapons.trait.dnd5e.versatileDesc
```

Picker UI:
```
weapons.traitPicker.title
weapons.traitPicker.searchPlaceholder
weapons.traitPicker.customHeader
weapons.traitPicker.createCustom
weapons.traitPicker.customName
weapons.traitPicker.customDescription
weapons.traitPicker.addBtn
weapons.traitPicker.done
weapons.traitPicker.cancel
weapons.traitPicker.confirmDiscard
weapons.traitPicker.removeChipAria
```

Delete:
```
weapons.traitsPlaceholder     // no longer used
```

Mirror the exact same key set across every language block. English strings are source of truth; leave non-English as English placeholders if the existing pattern does so for new keys (follow whatever neighboring weapons.* keys do).

## `main.css` — additions

**1. Modify existing** `.weapon-trait-chip` rule: add `position: relative;`.

**2. New section** `/* ── Weapon Trait Chip Tooltip ── */` — copy the condition tooltip block verbatim, scoped to `.weapon-trait-chip[data-tooltip]`. Key properties:
- `bottom: calc(100% + 6px);` (tooltip above chip)
- `white-space: normal; max-width: 220px; line-height: 1.35;`
- Edge-case rules for first/last chip in `.weapon-traits` (mirror the resistance pattern).

**3. New section** `/* ── Weapon Trait Chip (Editable) ── */`:
- `.weapon-trait-chip--editable` — adds right padding for the × button.
- `.weapon-trait-chip-remove` — small round close button; `display: none` by default, `display: inline-block` inside `.weapon-trait-chip--editable`.
- `.weapon-trait-add-btn` — reuse existing ghost-button token styling (match `.module-toolbar-btn` or the closest secondary button already in the file).

**4. New section** `/* ── Weapon Trait Picker Modal ── */`:
- Overlay + dialog styling reusing `--cv-bg-raised`, `--cv-border`, `--cv-text-*` tokens (rule 2 — never hardcode hex outside theme blocks).
- `.weapon-trait-picker-list` — `max-height` to fit dialog, `overflow-y: auto`, `scrollbar-gutter: stable` (rule 16), themed scrollbar styling.
- `.weapon-trait-picker-row` — flex row, hover/focus states, selected-state visual (check mark visible when `.is-selected`).
- `.weapon-trait-picker-row--custom` — left border or icon to mark it custom.
- `.weapon-trait-picker-section-header` — small header separator.
- `.weapon-trait-picker-create` — plus-icon button styling.
- Custom-edit inline form styling (name input + description textarea + Save/Cancel).
- `user-select: none` on all label/chrome text per rule 5; `user-select: text` only on the inputs.

## `tests/` — vitest specs (rule 20)

New file `tests/module-weapons-traits.test.js`. Follow the existing pattern (load script chain via `loadScript()`, mock globals in `beforeEach`, call via `window.<name>`).

```
describe('normalizeWeaponTraits', () => {
  it('leaves already-normalized entries untouched')
  it('converts legacy string array into keyed objects')
  it('matches canonical names case-insensitively and trims whitespace')
  it('matches "Two-Handed", "two handed", "TWO-HANDED" to dnd5e.twoHanded')
  it('creates a custom trait for unknown strings and references by key')
  it('reuses an existing custom trait when the same name is migrated twice')
  it('dedupes traits by key (first occurrence wins)')
  it('returns an empty array when given null or undefined')
})

describe('resolveWeaponTrait', () => {
  it('resolves a canonical dnd5e.* key to name + description via t()')
  it('resolves a custom.* key via content.customWeaponTraits')
  it('returns a safe fallback shape for unknown keys')
  it('exposes takesValue correctly per canonical entry')
})

describe('findOrCreateCustomTrait', () => {
  it('returns the existing key when a matching name already exists')
  it('creates a new entry with a custom.* key when no match')
  it('normalizes whitespace and case when deduping')
})

describe('generateCustomTraitKey', () => {
  it('produces keys prefixed with custom.')
  it('never collides with existing entries in content.customWeaponTraits')
})
```

Mock `t(key)` in `beforeEach` to echo the key back (so assertions can verify the correct key was requested without depending on the translation file).

## Docs updates

**`_DOCS/SUBMODULES/WEAPONS.md`:**
- Replace the Phase 1 "traits are strings" note with the new keyed shape.
- Add a "Trait Picker Modal" subsection describing the modal flow (search, toggle, custom create/edit/delete).
- Add a "Custom Weapon Traits" subsection explaining `content.customWeaponTraits` persistence.
- Under "Globals Exposed", add `WEAPON_TRAITS_DND5E`, `resolveWeaponTrait`, `normalizeWeaponTraits`, `findOrCreateCustomTrait`, `generateCustomTraitKey`.
- Note the namespacing convention (`dnd5e.*`, `custom.*`, future `dnd5e2024.*` / `pf2e.*`).

**`_DOCS/ARCHITECTURE.md`:**
- Likely no changes needed — no new file, no new `registerModuleType()`, no new top-level CSS section (new CSS lives inside existing weapon block). If the Files at a Glance entry for `module-weapons.js` enumerates exposed globals, extend it.

## Critical files

| File | Change summary |
|---|---|
| `scripts/module-weapons.js` | Trait table, lookup map, migration + resolve + custom helpers, picker modal, edit-modal chip UI, play-mode tooltip wiring, IIFE exposure. |
| `scripts/translations.js` | ~30 new keys × each supported language; remove `weapons.traitsPlaceholder`. |
| `main.css` | `position: relative` on chip; new Tooltip, Editable Chip, and Picker Modal sections using `--cv-*` tokens. |
| `_DOCS/SUBMODULES/WEAPONS.md` | Document new shape, picker, custom flow, namespacing, exposed globals. |
| `tests/module-weapons-traits.test.js` | New vitest file covering the four pure helpers. |

## Implementation order

1. Add `WEAPON_TRAITS_DND5E` const + normalized-name lookup map + `takesValue` flag.
2. Implement + export the four pure helpers (`resolveWeaponTrait`, `normalizeWeaponTraits`, `findOrCreateCustomTrait`, `generateCustomTraitKey`).
3. Write vitest file and get it passing — no UI work yet.
4. Extend `ensureWeaponsContent()` to call `normalizeWeaponTraits` and guarantee `content.customWeaponTraits`.
5. **Pause and confirm with the user** how SRD 5.1 attribution should be added (new `ATTRIBUTION.md` file, OGL section appended to `LICENSE.txt`, or the README). CLAUDE.md rule 1 forbids modifying `LICENSE.txt` without explicit permission.
6. Add i18n keys in `translations.js` — English values use SRD 5.1 verbatim weapon-property text; non-English locales copy the English source as placeholders (follow whatever the neighboring `weapons.*` keys do).
7. Update `buildWeaponCard` play-mode chip render to use `resolveWeaponTrait` + `data-tooltip`.
8. Add tooltip CSS + edge-case positioning; add `position: relative` to `.weapon-trait-chip`.
9. Replace edit-modal text input with editable chip row + `+ Add` button wired to a placeholder picker.
10. Build `openWeaponTraitPickerModal`: overlay, search, canonical list, toggle behavior, Done/Cancel.
11. Add custom-trait affordances to the picker: create-form, edit, delete (with dangling-key cleanup across `content.weapons`).
12. Add picker CSS section using `--cv-*` tokens; apply scrollbar rules.
13. Remove dead code: old `traitsInput` plumbing, `weapons.traitsPlaceholder` key.
14. Update `_DOCS/SUBMODULES/WEAPONS.md`.

## Out of scope (Phase 2)

- Value input UI for `takesValue` traits (Versatile 1d10, Thrown 20/60, Ammunition 80/320).
- Mechanical effects wiring (Finesse changes attack stat; Versatile changes damage when two-handed; etc.).
- PF2e trait table + per-system preset switching.
- D&D 5e 2024 trait table / preset.
- Sharing custom traits across characters.
