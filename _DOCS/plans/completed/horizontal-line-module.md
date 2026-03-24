# Plan: Horizontal Line Module

## Context

The module wizard already has a disabled `hline` card. We need to implement it as a minimal visual divider that sits between grid rows with minimal dead space. The key challenge is CSS grid positioning — the line should snap onto grid boundaries, not float in the middle of an 80px cell.

## Approach: Negative Margins + Auto Height

The hline module uses **no explicit rowSpan** (auto height) so CSS grid creates a minimal implicit row. Negative margins (`margin: -4px 0`) pull the module 4px into each adjacent 8px gap, centering the line on the grid boundary. Total visual footprint in play mode: ~9px instead of 80px+.

## Changes

### 1. Enable Wizard Card (`main.html` ~line 126)
- Remove `disabled` class from `<div class="wizard-type-card disabled" data-type="hline">`
- Remove the `<span class="coming-soon">Coming Soon</span>` child

### 2. Hide Theme Picker for hline (`main.html`)
- Add `id="wizard-theme-section"` to the Module Theme `<div class="wizard-section">` (~line 149)
- In type card click handler (~line 365): toggle theme section visibility based on `wizardState.type === 'hline'`
- In `resetWizard()` (~line 330): re-show theme section on reset

### 3. Override Defaults in Create Handler (`main.html` ~line 391)
After building `moduleData`, if type is `hline`:
- `colSpan = 4` (always full width)
- `rowSpan = null` (auto height, no fixed span)
- `theme = null`

### 4. Adjust `renderModule()` for hline (`main.html` ~line 428)
- Remove the resize handle element for hline modules
- Skip `initResizeHandle()` call for hline

### 5. Register Module Type (`main.html`, after text module registration)
```js
registerModuleType('hline', {
    label: 'Horizontal Line',
    renderBody(bodyEl, data, isPlayMode) {
        bodyEl.innerHTML = '<hr class="hline-divider">';
    },
    onPlayMode(moduleEl, data) {
        const header = moduleEl.querySelector('.module-header');
        if (header) header.style.display = 'none';
    },
    onEditMode(moduleEl, data) {
        const header = moduleEl.querySelector('.module-header');
        if (header) header.style.display = '';
    }
});
```

### 6. CSS Styles (`main.css`, new section)
- **Negative margins**: `margin: -4px 0` to snap line onto grid boundary
- **Play mode**: transparent background, no border, hidden header — just the bare `<hr>` line
- **Edit mode**: dashed `--cv-border-subtle` outline, compact header (drag handle + delete only)
- **Permanent hides**: `.module[data-type="hline"] .module-textcolor-btn, .module-copy-btn, .module-type-label { display: none !important }` — prevents `applyEditMode()` from re-showing them
- **Line style**: `<hr>` uses `--cv-border` color, 1px height, no default margin

## Files to Modify
- `main.html` — wizard card, create handler, renderModule, module type registration
- `main.css` — new `.module[data-type="hline"]` section

## Verification
1. Open TaleSpire, load Character Vault DEV
2. Click "+" to open wizard — hline card should be selectable, theme picker should hide when selected
3. Create an hline module — should appear full-width with minimal height
4. Toggle play mode — line should appear as a thin divider between rows, no module chrome visible
5. Toggle edit mode — should show drag handle and delete button with dashed border
6. Drag the hline to reorder — SortableJS should work normally
7. Delete the hline — delete confirmation should work normally
8. Create hline between two text modules — verify the line sits on the grid boundary with minimal dead space
