# Ctrl+Click Quick-Edit Expansion

## Context
The Stats module (`module-stat.js`) has a Ctrl+Click quick-edit feature that allows users to inline-edit stat values in Play mode without switching to Edit mode. This plan covers expanding that pattern to other modules.

## Reference Implementation
- **File:** `scripts/module-stat.js`
- **Listener:** Lines 87-98 — detects `e.ctrlKey` on `.stat-block` click in Play mode
- **Edit function:** `enterQuickEdit()` at lines 224-277 — replaces display elements with `<input>` fields, commits on Enter/Escape/blur, re-renders the block in-place

## Target Modules

### Counters (`module-counters.js`)
- **What to quick-edit:** Counter value (the number)
- **Play mode element:** The counter value display
- **Behavior:** Ctrl+Click on the value → inline number input → commit updates `counter.value` → re-render

### Lists (`module-list.js`)
- **What to quick-edit:** Item name, attribute values
- **Play mode element:** Item name cell, attribute value cells
- **Behavior:** Ctrl+Click on name → inline text input. Ctrl+Click on attribute value → inline text/number input. Commit → re-render row.

### Resistances (`module-resistance.js`)
- **What to quick-edit:** Resistance value (e.g., "5", "x2")
- **Play mode element:** The value portion of a resistance pill
- **Behavior:** Ctrl+Click on value → inline text input → commit → re-render. Note: regular click already toggles active state, so Ctrl+Click specifically triggers edit.

## Implementation Notes
- All inline inputs should use the `stat-quick-input` CSS class (or a shared equivalent)
- Commit on Enter, Escape, or blur (match stat module pattern)
- Call `scheduleSave()` after commit
- Use `escapeHtml()` for any re-rendered content
- Add `data-i18n-title` tooltip hints indicating Ctrl+Click availability
