# Character Level Module — Implementation Plan

## Context
The Character Level module tracks character level and XP progression. It's referenced by other modules (Abilities, Saving Throws, Spells) for level-based calculations like proficiency bonus. The design doc is at `_DOCS/SUBMODULES/CHARACTER_LEVEL.md`.

**Key design decisions (confirmed with user):**
- XP thresholds are **cumulative** (total XP from level 1, D&D 5e style)
- Milestone mode uses the **same layout but hides the progress bar**
- Level-ups are **one at a time** (no auto-chaining)
- **Pre-built XP templates** included (D&D 5e, PF2e)
- **Multiple level modules allowed** per sheet; other modules link via dropdown
- Progress bar: **solid + segmented** (10% and 25% marks)
- Bar colors use **theme accent swatches** (same as module theme picker)
- Default size: **colSpan 1, rowSpan null** (auto-height)

---

## Files to Create
| File | Purpose |
|---|---|
| `scripts/module-level.js` | Module type registration, rendering, XP modal, settings modal, templates |

## Files to Modify
| File | Change |
|---|---|
| `main.html` | Add wizard type card (alphabetically between "Health" and "Horizontal Line"), add `<script>` tag |
| `main.css` | Progress bar styles, level display styles, XP modal styles, settings modal styles |
| `scripts/module-core.js` | Wizard default content, toolbar buttons, overflow menu btnDefs |
| `scripts/translations.js` | All i18n keys for the module |

---

## Content Data Schema
```js
content: {
  level: 1,
  currentXP: 0,
  levelingSystem: 'xp',            // 'xp' | 'milestone'
  xpThresholds: [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],  // D&D 5e default, cumulative
  carryOverXP: true,
  barColor: null,                   // hex string or null (uses --cv-accent)
  barStyle: 'solid'                 // 'solid' | 'segmented-10' | 'segmented-25'
}
```

---

## Implementation Steps

### Step 1: Create `scripts/module-level.js`

**XP Templates** — stored as a constant object:
```js
const LEVEL_XP_TEMPLATES = {
  'dnd5e': { label: 'D&D 5e', thresholds: [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000] },
  'pf2e':  { label: 'Pathfinder 2e', thresholds: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000] }
};
```

**Key functions:**

1. `renderLevelBody(bodyEl, data, isPlayMode)` — Main render
   - Level display: prominent number with "Level" label
   - Progress bar (hidden when `levelingSystem === 'milestone'`):
     - Track (`.level-bar-track`) with fill (`.level-bar-fill`)
     - Fill width = percentage of current XP toward next level threshold
     - Segmented overlay marks if `barStyle` is segmented
     - Hover tooltip: "450 / 900 XP"
   - "Level Up" button: visible when `currentXP >= nextThreshold` (XP mode only)
   - Click bar → `openXPModal()`

2. `openXPModal(moduleEl, data)` — XP add/subtract modal
   - Same pattern as `openHealthActionOverlay()` in module-health.js
   - Input field supporting math expressions (reuse `evaluateHealthExpression()` from shared.js)
   - Add/Subtract toggle or signed input
   - Shows current XP and threshold
   - On confirm: update `data.content.currentXP`, clamp to 0 minimum, re-render, `scheduleSave()`

3. `openLevelSettings(moduleEl, data)` — Settings modal
   - Leveling system toggle: Milestone / XP (radio or segmented control)
   - XP template dropdown (D&D 5e, PF2e, Custom) — pre-fills threshold list
   - XP threshold list:
     - Each row: "Level N:" label + XP input (editable)
     - Delete button per row
     - "Add Level" button at bottom
     - Rows are labeled Level 2, Level 3, etc. (thresholds[0] = Level 2 threshold)
   - Carry over XP toggle (checkbox)
   - Bar color: theme swatches (reuse the swatch pattern from wizard/theme picker)
   - Bar style: solid / segmented-10 / segmented-25 (radio or visual picker)

4. `getLevelProgress(data)` — Helper returning `{ level, currentXP, nextThreshold, percentage, canLevelUp }`
   - Looks up `xpThresholds[level - 1]` for the next level's cumulative target
   - Previous threshold = `xpThresholds[level - 2]` (or 0 for level 1)
   - Progress = `(currentXP - prevThreshold) / (nextThreshold - prevThreshold)`
   - `canLevelUp = currentXP >= nextThreshold`

5. `levelUp(data)` — Increments level by 1
   - If carryOverXP: `currentXP` stays as-is (excess carries naturally with cumulative thresholds)
   - If !carryOverXP: `currentXP = xpThresholds[level - 2]` (reset to the just-reached threshold)
   - Actually wait — with cumulative thresholds and carryover, XP just stays. With no carryover, XP resets to the threshold of the new level. Let me reconsider...
   - With cumulative: Level 5 needs 6500 total. User has 7000 XP. Level up → Level 6 (needs 14000).
     - Carry over: currentXP stays 7000. Progress bar shows 7000-6500 / 14000-6500 = 500/7500.
     - No carry over: currentXP resets to 6500 (the level 5 threshold). Progress = 0/7500.
   - This is clean and correct.

6. **Cross-module API** — expose globally:
```js
window.getCharacterLevel = function(moduleId) {
  const mod = window.modules.find(m => m.id === moduleId && m.type === 'level');
  return mod ? mod.content.level : null;
};
```

7. `registerModuleType('level', { ... })` call at end of file.

### Step 2: Modify `main.html`

**Wizard type card** — insert between Health (line 155) and Horizontal Line (line 156), alphabetically by label "Level":
```html
<div class="wizard-type-card" data-type="level">
    <svg ...><!-- trending-up or bar-chart icon --></svg>
    <span class="wizard-type-name" data-i18n="type.level">Level</span>
</div>
```

**Script tag** — insert alphabetically among module-*.js files, between `module-hr.js` and `module-list.js`:
```html
<script src="scripts/module-level.js"></script>
```

### Step 3: Modify `scripts/module-core.js`

**Wizard defaults** (in `btnWizardCreate` click handler, after the savingthrow block):
```js
if (moduleData.type === 'level') {
    moduleData.colSpan = 1;
    moduleData.rowSpan = null;
    moduleData.content = {
        level: 1,
        currentXP: 0,
        levelingSystem: 'xp',
        xpThresholds: LEVEL_XP_TEMPLATES['dnd5e'].thresholds.slice(),
        carryOverXP: true,
        barColor: null,
        barStyle: 'solid'
    };
}
```

**Toolbar buttons** (in `renderModule()` header template):
- Settings button (edit mode): `.module-level-settings-btn`
- These get wired in the event listener section and added to `btnDefs` for overflow menu.

**Overflow menu** — add entries to `btnDefs` array for the level module buttons.

### Step 4: Add CSS to `main.css`

```
/* ── Level Module ── */

/* Level display */
.level-display          — flex container, centered, prominent level number
.level-number           — large font, bold
.level-label            — small "LEVEL" text above/below number

/* Progress bar */
.level-bar-container    — wrapper, clickable, position: relative
.level-bar-track        — background track (--cv-bg-sunken), rounded
.level-bar-fill         — filled portion, transition width, uses barColor or --cv-accent
.level-bar-segment      — segment marks (borders at 10% or 25% intervals)
.level-bar-tooltip      — hover tooltip showing "450 / 900 XP"

/* Level up button */
.level-up-btn           — accent-colored button, appears when canLevelUp

/* Milestone mode */
.level-milestone .level-bar-container — display: none
```

### Step 5: Add i18n keys to `scripts/translations.js`

```
type.level
level.label
level.xp_tooltip          — "{current} / {target} XP"
level.level_up
level.add_xp
level.subtract_xp
level.settings.title
level.settings.system
level.settings.milestone
level.settings.xp
level.settings.thresholds
level.settings.add_level
level.settings.carry_over
level.settings.bar_color
level.settings.bar_style
level.settings.solid
level.settings.segmented_10
level.settings.segmented_25
level.settings.template
level.settings.custom
level.xp_modal.title
level.xp_modal.placeholder  — e.g. "e.g. 50, 2d6+5"
```

---

## Cross-Module Linking (future consideration)

When other modules (Abilities, Saving Throws) need to reference character level:
- They add `linkedLevelModuleId` to their content schema
- Their settings modal gets a "Linked Level Module" dropdown listing all level modules
- They call `window.getCharacterLevel(linkedLevelModuleId)` to get the current level

This is a **separate task** — the Level module just needs to expose the API. The consuming modules get updated later.

---

## Verification

1. Create a Level module from the wizard — verify it appears with default D&D 5e thresholds
2. Click the XP bar → verify modal opens, add XP, confirm bar updates
3. Add enough XP to exceed threshold → verify "Level Up" button appears
4. Click Level Up → verify level increments, XP carries over (or resets based on setting)
5. Open settings → switch to Milestone → verify bar hides, level still displays
6. Open settings → change to PF2e template → verify thresholds update
7. Open settings → change bar style to segmented → verify segment marks render
8. Open settings → change bar color → verify fill color changes
9. Test in both Play and Edit modes
10. Create multiple Level modules → verify both work independently
11. Verify `window.getCharacterLevel(moduleId)` returns correct level
12. Resize module (colSpan changes) → verify layout adapts
