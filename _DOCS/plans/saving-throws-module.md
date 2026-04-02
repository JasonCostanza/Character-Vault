# Saving Throws Module — Implementation Plan

## Context
The Saving Throws module tracks reactive checks against harmful effects. Each saving throw has a name and modifier value. The module supports proficiency tiers (configurable per game system), markdown notes, game system templates, and dice rolling. It follows the Stats module pattern closely but adds a tiered proficiency system as the primary new feature.

**User clarifications:**
- No per-save icon support (removed from data structure)
- Templates for systems that have meaningful saving throws: D&D 5e, PF2e, CoC, Cyberpunk RED, Mothership
- Full tier system with presets, custom tier editor modal, per-tier colors

---

## Data Structure

```js
data.content = {
    saves: [
        {
            id: 'save-xxx',           // unique ID
            name: 'Strength',         // display name
            value: 3,                 // modifier (the rollable number)
            proficiencyTier: null     // string matching a tier name, or null
        }
    ],
    notes: '',                        // optional markdown string
    tiersEnabled: false,              // whether tier badges are visible
    tiers: [                          // always present, hidden if tiersEnabled is false
        { name: 'Untrained', letter: 'U', color: '#888888' },
        { name: 'Trained',   letter: 'T', color: '#22aa44' },
        { name: 'Expert',    letter: 'E', color: '#3388dd' },
        { name: 'Master',    letter: 'M', color: '#aa44cc' }
    ],
    tierPreset: 'simple'              // tracks preset used, or 'custom'
}
```

## Templates

**Saving throw templates:**
| Key | Saves |
|---|---|
| `dnd5e` | Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma |
| `pf2e` | Fortitude, Reflex, Will |
| `coc` | Sanity, Luck, Power |
| `cpred` | Death Save, Stun |
| `mothership` | Sanity, Fear, Body, Armor |

**Tier presets:**
| Key | Tiers |
|---|---|
| `dnd5e` | Not Proficient (N, gray), Proficient (P, green) |
| `pf2e` | Untrained (U, gray), Trained (T, green), Expert (E, blue), Master (M, purple), Legendary (L, gold) |
| `simple` | Untrained (U, gray), Trained (T, green), Expert (E, blue), Master (M, purple) |

---

## Files to Create/Modify

### 1. `scripts/module-savingthrow.js` (NEW — ~450 lines)

IIFE wrapping all module logic. Key functions:

| Function | Purpose |
|---|---|
| `generateSaveId()` | Unique ID for new saves |
| `applySavingThrowTemplate(key)` | Maps template to save objects with defaults |
| `applyTierPreset(key)` | Returns cloned tier array from presets |
| `formatModifier(n)` | +/- prefix formatting |
| `getTierForSave(save, tiers)` | Looks up tier object by name |
| `renderSaveBlock(save, index, data, isPlayMode)` | Play mode `.save-block` div |
| `renderSaveBlockEdit(save, index, data)` | Edit mode `.save-block-edit` div with inputs |
| `reRenderSaveEdits(container, data)` | Clears and rebuilds all edit blocks + SortableJS |
| `initSaveSortable(container, data)` | SortableJS on `.save-drag-handle` |
| `rollSavingThrow(save)` | `TS.dice.putDiceInTray()` with `1d20+value` |
| `enterSaveQuickEdit(block, save, data)` | Ctrl+click inline edit in play mode |
| `openSaveSettings(moduleEl, data)` | Settings modal (tier toggle, preset, custom editor) |
| `openCustomTierEditor(moduleEl, data, onSave)` | Secondary modal for custom tier definition |
| `renderNotesArea(container, data, isPlayMode)` | Markdown notes below saves grid |

**Registration call:**
```js
registerModuleType('savingthrow', {
    label: 'type.savingthrow',
    renderBody(bodyEl, data, isPlayMode) { ... },
    onPlayMode(moduleEl, data) { ... },
    onEditMode(moduleEl, data) { ... },
    syncState(moduleEl, data) { ... }
});
```

**Play mode HTML structure:**
```html
<div class="save-container">
  <div class="save-block save-rollable" data-index="0">
    <span class="save-tier-badge" style="background:green">T</span>  <!-- if tiersEnabled -->
    <div class="save-name">Strength</div>
    <div class="save-modifier">+3</div>
  </div>
  ...
</div>
<div class="save-notes-display"><!-- rendered markdown --></div>
```

**Edit mode HTML structure:**
```html
<div class="save-container">
  <div class="save-block-edit" data-index="0">
    <div class="save-edit-name-row">
      <span class="save-drag-handle">⁞</span>
      <input class="save-edit-name" value="Strength">
      <button class="save-edit-delete"><svg>...</svg></button>
    </div>
    <div class="save-edit-row">
      <div class="save-edit-field">
        <label>Mod</label>
        <input type="number" class="save-edit-value" value="3">
      </div>
      <div class="save-edit-field">  <!-- only if tiersEnabled -->
        <label>Prof</label>
        <select class="save-edit-tier">...</select>
      </div>
    </div>
  </div>
  ...
</div>
<textarea class="save-notes-textarea">...</textarea>
```

**Settings modal:** `cv-modal-overlay` / `cv-modal-panel` pattern (same as resistance settings). Contains:
- Checkbox: "Enable Proficiency Tiers"
- Dropdown: Tier preset selector (D&D 5e, PF2e, Simple, Custom)
- "Edit Custom Tiers" button (enabled when preset is Custom)
- Save / Cancel / X buttons

**Custom tier editor:** Secondary modal (higher z-index, stacked over settings). Contains:
- List of tier rows with: drag handle, name input, letter input (maxlength 1), color hex input with swatch, delete button
- SortableJS for reordering (top = highest rank)
- "Add Tier" button
- Save / Cancel / X buttons
- On save: orphaned `proficiencyTier` references on saves → set to `null`
- If all tiers deleted: force `tiersEnabled = false`

### 2. `scripts/module-core.js` — Modifications

| Location | Change |
|---|---|
| `wizardState` object | Add `savingthrowTemplate: ''` |
| `resetWizard()` | Reset saving throw template section visibility |
| Type card click handler | Toggle `#wizard-savingthrow-template` visibility |
| Template select wiring | Wire `#wizard-savingthrow-template-select` to `wizardState` |
| `btnWizardCreate` handler | Add `if (moduleData.type === 'savingthrow')` block with default content |
| `renderModule()` toolbar | Add Save Add btn (`.module-save-add-btn`) + Settings btn (`.module-save-settings-btn`) for `savingthrow` type |
| `renderModule()` events | Wire click handlers for both buttons |
| `openOverflowMenu()` | Add overflow entries for both buttons |
| `applyPlayMode()` | Hide both buttons |
| `applyEditMode()` | Show both buttons |

### 3. `main.html` — Modifications

1. **Wizard type card** — insert between Resistances and Spacer (alphabetical: "Saving Throws" between "Resistances" and "Spacer"). Shield+checkmark SVG icon.
2. **Wizard sub-option section** — `#wizard-savingthrow-template` with template dropdown (None, D&D 5e, PF2e, CoC, Cyberpunk RED, Mothership)
3. **Script tag** — `<script src="scripts/module-savingthrow.js"></script>` between module-resistance.js and module-spacer.js

### 4. `main.css` — Additions (~130 lines)

New `/* ── Saving Throws Module ── */` section after the stat module CSS:

- `.save-container` — CSS grid, `repeat(auto-fit, minmax(70px, 1fr))`, 6px gap
- `.save-block` — bg-raised, border, border-radius 6px, centered, relative
- `.save-block.save-rollable` — cursor pointer, hover accent border + shadow
- `.save-name` — 9px uppercase, text-secondary, ellipsis
- `.save-modifier` — 24px bold
- `.save-tier-badge` — absolute top-right, 14×14 circle, 9px bold white text, bg set inline
- `.save-block-edit` — flex column, padding, border
- `.save-edit-name-row` — flex row with handle, input, delete
- `.save-drag-handle` — opacity 0, show on hover
- `.save-edit-name` — flex 1, bg-sunken
- `.save-edit-delete` — icon button, opacity 0 on hover
- `.save-edit-row` — flex row
- `.save-edit-tier` — styled select dropdown
- `.save-ghost` — SortableJS ghost (opacity 0.3, dashed border)
- `.save-quick-input` — inline edit input (24px bold)
- `.save-notes-area` — margin-top 6px
- `.save-notes-textarea` — width 100%, bg-sunken, resize vertical
- `.save-notes-display` — rendered markdown styling
- Responsive: `[data-size="xs"]` and `[data-size="sm"]` overrides
- Tier editor modal row styles

### 5. `scripts/translations.js` — ~28 keys × 7 languages

Key namespace: `save.*` (matching `stat.*`, `health.*`, etc.)

Core keys: `type.savingthrow`, `save.addSave`, `save.deleteSave`, `save.unnamed`, `save.modifier`, `save.roll`, `save.moduleSettings`, `save.settingsTitle`, `save.enableTiers`, `save.tierPreset`, `save.tierPresetDnd5e`, `save.tierPresetPf2e`, `save.tierPresetSimple`, `save.tierPresetCustom`, `save.editTiers`, `save.tierName`, `save.tierLetter`, `save.tierColor`, `save.addTier`, `save.tierEditorTitle`, `save.templateLabel`, `save.templateNone`, `save.notes`, `save.notesPlaceholder`, `save.proficiency`, `save.noProficiency`, `save.save`, `save.cancel`, `save.close`

### 6. `_DOCS/ARCHITECTURE.md` — Updates

- Add `scripts/module-savingthrow.js` to Files at a Glance
- Add to Script Load Order
- Add `savingthrow` to MODULE_TYPES registry list
- Add content schema to Key Data Structures

---

## Implementation Sequence

1. **Foundation**: translations, `module-savingthrow.js` skeleton with `registerModuleType`, script tag in `main.html`, wizard card + sub-options, creation defaults in `module-core.js`
2. **Core rendering**: `renderSaveBlock()`, `renderSaveBlockEdit()`, `reRenderSaveEdits()`, `initSaveSortable()`, CSS for all blocks
3. **Interactions**: `rollSavingThrow()`, `enterSaveQuickEdit()`, toolbar buttons in `module-core.js`, overflow menu, mode switching
4. **Notes area**: `renderNotesArea()` with textarea (edit) / rendered markdown (play), CSS
5. **Tier system**: `openSaveSettings()` modal, `openCustomTierEditor()` modal, tier badge rendering, tier dropdown in edit mode, tier CSS
6. **Wizard sub-options**: template selector wiring in `module-core.js`
7. **Docs**: update `ARCHITECTURE.md`

## Key Risks

- **Tier system complexity**: Two stacked modals, SortableJS inside a modal, orphan cleanup when tiers are renamed/deleted. Mitigated by careful state sync in the save callback.
- **Escape key handling**: Secondary modal must intercept Escape before the parent modal. Use `stopPropagation` on the inner overlay's keydown listener.

## Verification

1. Create a new Saving Throws module via the wizard (with and without template)
2. Add/edit/delete/reorder saves in edit mode
3. Click modifier to roll dice in play mode (verify TaleSpire dice tray)
4. Ctrl+click for quick edit in play mode
5. Enable tiers, select each preset, verify badges render correctly
6. Open custom tier editor, add/remove/reorder tiers, verify orphan cleanup
7. Add markdown notes, verify rendering in play mode
8. Resize module, verify responsive behavior at xs/sm
9. Save and reload — verify persistence
10. Test all 7 language translations render
