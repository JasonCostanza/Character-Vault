# Defenses Module Reboot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Defenses module from a flat-list layout to a spotlight-stat design with secondary defense rows, toggleable Quick Defense modifier buttons, a QD settings modal, and game-system-specific templates.

**Architecture:** Single IIFE in `scripts/module-defenses.js` owns all rendering, state, and modal logic. CSS in `css/sub-defenses.css`. Integration points in `scripts/module-core.js` (toolbar buttons, wizard creation defaults). All UI text goes through `t()` with keys in all 7 locale files.

**Tech Stack:** Vanilla JS (no build step), CSS custom properties (`--cv-*` tokens), SortableJS (CDN-loaded), TaleSpire Symbiote embedded Chromium.

## Global Constraints

- All colors use `--cv-*` tokens — never hardcode hex outside theme blocks.
- All UI text must be `user-select: none`. Only user content and interactive elements opt in.
- Call `scheduleSave()` after any data mutation — never call `saveCharacter()` directly.
- Use `escapeHtml()` when interpolating user strings into HTML.
- Use `null` (not `undefined`) for intentionally empty values.
- "Edit mode" is called **Layout mode** throughout the codebase.
- SortableJS: `handle`, `animation: 150`, `ghostClass: 'cv-drag-ghost'`, `draggable`.
- Scrollable elements need `scrollbar-gutter: stable`, themed scrollbar styles (4px, transparent track, muted thumb), plus WebKit equivalents.
- IIFE + selective `window` exposure: DOM/render/event helpers stay private; pure testable functions go on `window`.
- All locale edits must update ALL 7 files: en, es, fr, de, it, pt-BR, ru.

## Design Spec

`_DOCS/plans/defenses-module-design.md` — the source of truth for all design decisions.

---

## Phase 1 — Module Script ▸ `scripts/module-defenses.js`

> **Status:** ✅ COMPLETE
> **Overwrites:** `scripts/module-defenses.js`
> **Commit:** `feat(defenses): rewrite module with spotlight, QD buttons, and settings modal`

### Context for the implementing agent

Read these before starting:
- `_DOCS/plans/defenses-module-design.md` — complete design spec
- `_DOCS/NEW_MODULE_GUIDE.md` — standard module registration pattern
- `scripts/module-recovery.js` lines 239–430 — reference for cv-modal pattern (header/body/footer, close X, overlay click-to-dismiss)
- `scripts/module-stat.js` lines 383–430 — reference for Ctrl+Click quick-edit (commitOnce guard, replaceWith pattern)
- `scripts/module-counters.js` lines 11–60 — reference for `showConfirm()` dialog pattern
- `scripts/module-companions.js` lines 17–37 — reference for `buildDefaultContent(sys)` template pattern

The current `module-defenses.js` is 349 lines. The rewrite will be larger (~600–700 lines) due to spotlight rendering, QD buttons, buffed state, and the settings modal.

### Data Shape (new)

```js
data.content = {
  defenses: [
    { id: 'def_xxxxx', name: 'AC', value: 15, icon: 'shield', showSign: false }
  ],
  quickDefenses: [
    { id: 'qd_xxxxx', name: 'Raise Shield', icon: 'shield', modifier: 2, active: false }
  ]
}
```

Key changes from old shape: `notes` field removed from defenses, `quickDefenses` array added. `ensureContent()` must handle migration from old shape (strip `notes`, add `quickDefenses: []`).

### Task 1: Write the complete `scripts/module-defenses.js`

**Files:**
- Overwrite: `scripts/module-defenses.js`

**Produces:**
- `window.ensureDefenseContent(data)` — shape guard, returns `data.content`
- `window.generateDefenseId()` — returns `'def_' + ...`
- `window.generateQDId()` — returns `'qd_' + ...`
- `window.buildDefensesDefaultContent(sys)` — returns `{ defenses: [...], quickDefenses: [...] }` based on game system
- `window.computeSpotlightValue(content)` — returns integer: `defenses[0].value` + sum of active QD modifiers
- `window.openDefenseSettingsModal(moduleEl, data)` — opens the QD settings modal

- [ ] **Step 1: Write the full module file**

Overwrite `scripts/module-defenses.js` with the complete IIFE below. The file is structured in these sections:

1. ID generation (`generateDefenseId`, `generateQDId`)
2. Default content builder (`buildDefensesDefaultContent`)
3. Content shape guard (`ensureContent`)
4. Computed values (`computeSpotlightValue`, `getActiveQDs`, `isBuffed`)
5. Confirmation dialog (`showConfirm`)
6. Icon picker popover (`openDefenseIconPicker`)
7. Quick-edit helper (`enterDefenseQuickEdit`)
8. Play mode render functions (`renderSpotlight`, `renderSecondaryRows`, `renderQDButtons`)
9. Layout mode render functions (`renderEditRow`, `renderAddRow`)
10. QD settings modal (`openQDSettingsModal`, `renderQDModalRow`, `renderQDModalBody`)
11. SortableJS initialization (`initDefenseSortable`, `initQDSortable`)
12. Module type registration (`registerModuleType`)
13. Window exports

```js
// ── Defenses Module Type ──
(function () {
    'use strict';

    // ── ID Generation ──

    function generateDefenseId() {
        return 'def_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function generateQDId() {
        return 'qd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Default Content Builder ──

    function buildDefensesDefaultContent(sys) {
        const content = { defenses: [], quickDefenses: [] };

        if (sys === 'pf2e') {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
            content.quickDefenses.push({ id: generateQDId(), name: 'Raise Shield', icon: 'shield', modifier: 2, active: false });
        } else if (sys === 'dnd3.5e') {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
            content.defenses.push({ id: generateDefenseId(), name: 'Touch AC', value: 10, icon: 'crosshair', showSign: false });
            content.defenses.push({ id: generateDefenseId(), name: 'Flat-Footed AC', value: 10, icon: 'shield', showSign: false });
        } else {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
        }

        return content;
    }

    // ── Content Shape Guard ──

    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = buildDefensesDefaultContent(window.gameSystem || 'custom');
        }
        if (!Array.isArray(data.content.defenses)) data.content.defenses = [];
        if (!Array.isArray(data.content.quickDefenses)) data.content.quickDefenses = [];
        data.content.defenses.forEach(function (def) {
            if (def.showSign === undefined) def.showSign = false;
            if (def.icon === undefined) def.icon = null;
            delete def.notes;
        });
        data.content.quickDefenses.forEach(function (qd) {
            if (qd.active === undefined) qd.active = false;
            if (qd.modifier === undefined) qd.modifier = 0;
            if (qd.icon === undefined) qd.icon = null;
        });
        return data.content;
    }

    // ── Computed Values ──

    function computeSpotlightValue(content) {
        if (!content.defenses.length) return 0;
        const base = content.defenses[0].value;
        const qdBonus = content.quickDefenses
            .filter(function (qd) { return qd.active; })
            .reduce(function (sum, qd) { return sum + (qd.modifier || 0); }, 0);
        return base + qdBonus;
    }

    function getActiveQDs(content) {
        return content.quickDefenses.filter(function (qd) { return qd.active; });
    }

    function isBuffed(content) {
        return getActiveQDs(content).length > 0;
    }

    // ── Confirmation Dialog ──

    function showConfirm(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';
        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = message;
        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel';
        cancelBtn.textContent = t('module.cancel');
        cancelBtn.addEventListener('click', function () { overlay.remove(); });
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-yes';
        confirmBtn.textContent = t('module.delete');
        confirmBtn.addEventListener('click', function () {
            overlay.remove();
            onConfirm();
        });
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        panel.appendChild(msg);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    // ── Icon Picker Popover ──

    function openDefenseIconPicker(btn, currentIcon, onSelect) {
        const existing = document.querySelector('.def-icon-picker');
        if (existing) existing.remove();

        const picker = document.createElement('div');
        picker.className = 'def-icon-picker';
        const rect = btn.getBoundingClientRect();
        picker.style.top = rect.bottom + 4 + 'px';
        picker.style.left = rect.left + 'px';

        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.title = t('def.noIcon');
        noneBtn.className = currentIcon === null ? 'selected' : '';
        noneBtn.innerHTML = '&mdash;';
        noneBtn.addEventListener('click', function () { onSelect(null); closePicker(); });
        picker.appendChild(noneBtn);

        Object.keys(CV_ICONS).forEach(function (key) {
            const iconBtn = document.createElement('button');
            iconBtn.type = 'button';
            iconBtn.className = key === currentIcon ? 'selected' : '';
            iconBtn.title = key;
            iconBtn.innerHTML = CV_ICONS[key];
            iconBtn.addEventListener('click', function () { onSelect(key); closePicker(); });
            picker.appendChild(iconBtn);
        });

        document.body.appendChild(picker);

        function closePicker() {
            picker.remove();
            document.removeEventListener('click', onOutsideClick, true);
            document.removeEventListener('keydown', onEscape);
        }
        function onOutsideClick(e) {
            if (!picker.contains(e.target) && e.target !== btn) closePicker();
        }
        function onEscape(e) {
            if (e.key === 'Escape') closePicker();
        }
        setTimeout(function () {
            document.addEventListener('click', onOutsideClick, true);
            document.addEventListener('keydown', onEscape);
        }, 0);
    }

    // ── Inline Quick-Edit (Ctrl+Click) ──

    function enterDefenseQuickEdit(el, currentValue, onCommit) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'def-quick-input';
        input.value = currentValue;
        el.replaceWith(input);
        input.focus();
        input.select();

        let committed = false;
        function commitOnce() {
            if (committed) return;
            committed = true;
            const val = parseInt(input.value, 10) || 0;
            onCommit(val);
        }

        input.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); commitOnce(); }
            if (ev.key === 'Escape') { committed = true; onCommit(currentValue); }
        });
        input.addEventListener('blur', function () {
            setTimeout(commitOnce, 50);
        });
    }

    // ── Play Mode: Spotlight ──

    function renderSpotlight(container, content, data, bodyEl) {
        if (!content.defenses.length) return;
        const def = content.defenses[0];
        const buffed = isBuffed(content);
        const displayValue = computeSpotlightValue(content);

        const section = document.createElement('div');
        section.className = 'def-spotlight';

        // Icon
        if (def.icon && CV_ICONS[def.icon]) {
            const iconEl = document.createElement('span');
            iconEl.className = 'def-spotlight-icon';
            iconEl.innerHTML = CV_ICONS[def.icon];
            section.appendChild(iconEl);
        }

        // Value
        const valueEl = document.createElement('span');
        valueEl.className = 'def-spotlight-value' + (buffed ? ' buffed' : '');
        valueEl.textContent = def.showSign
            ? (typeof window.formatModifier === 'function' ? window.formatModifier(displayValue) : (displayValue >= 0 ? '+' + displayValue : String(displayValue)))
            : String(displayValue);
        valueEl.addEventListener('click', function (e) {
            if (!e.ctrlKey && !e.metaKey) return;
            e.stopPropagation();
            enterDefenseQuickEdit(valueEl, def.value, function (newVal) {
                def.value = newVal;
                scheduleSave();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, true);
            });
        });
        section.appendChild(valueEl);

        // Label
        const labelEl = document.createElement('span');
        labelEl.className = 'def-spotlight-label';
        labelEl.textContent = def.name;
        section.appendChild(labelEl);

        // Base value (only when buffed)
        if (buffed) {
            const baseEl = document.createElement('span');
            baseEl.className = 'def-spotlight-base';
            baseEl.textContent = t('def.base', { value: String(def.value) });
            section.appendChild(baseEl);

            // Modifier badges
            const badges = document.createElement('div');
            badges.className = 'def-spotlight-badges';
            getActiveQDs(content).forEach(function (qd) {
                const badge = document.createElement('span');
                badge.className = 'def-spotlight-badge';
                const modStr = qd.modifier >= 0 ? '+' + qd.modifier : String(qd.modifier);
                badge.textContent = qd.name + ' ' + modStr;
                badges.appendChild(badge);
            });
            section.appendChild(badges);
        }

        container.appendChild(section);
    }

    // ── Play Mode: Secondary Rows ──

    function renderSecondaryRows(container, content, data, bodyEl) {
        if (content.defenses.length <= 1) return;

        const section = document.createElement('div');
        section.className = 'def-secondary';

        for (let i = 1; i < content.defenses.length; i++) {
            const def = content.defenses[i];
            const row = document.createElement('div');
            row.className = 'def-secondary-row';

            if (def.icon && CV_ICONS[def.icon]) {
                const iconEl = document.createElement('span');
                iconEl.className = 'def-secondary-icon';
                iconEl.innerHTML = CV_ICONS[def.icon];
                row.appendChild(iconEl);
            }

            const nameEl = document.createElement('span');
            nameEl.className = 'def-secondary-name';
            nameEl.textContent = def.name;
            row.appendChild(nameEl);

            const valueEl = document.createElement('span');
            valueEl.className = 'def-secondary-value';
            valueEl.textContent = def.showSign
                ? (typeof window.formatModifier === 'function' ? window.formatModifier(def.value) : (def.value >= 0 ? '+' + def.value : String(def.value)))
                : String(def.value);
            valueEl.addEventListener('click', function (e) {
                if (!e.ctrlKey && !e.metaKey) return;
                e.stopPropagation();
                enterDefenseQuickEdit(valueEl, def.value, function (newVal) {
                    def.value = newVal;
                    scheduleSave();
                    MODULE_TYPES['defenses'].renderBody(bodyEl, data, true);
                });
            });
            row.appendChild(valueEl);

            section.appendChild(row);
        }

        container.appendChild(section);
    }

    // ── Play Mode: Quick Defense Buttons ──

    function renderQDButtons(container, content, data, bodyEl, moduleEl) {
        if (!content.quickDefenses.length) return;

        const strip = document.createElement('div');
        const colSpan = data.colSpan || 2;
        strip.className = 'def-qd-strip' + (colSpan <= 1 ? ' compact' : '');

        content.quickDefenses.forEach(function (qd) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'def-qd-btn' + (qd.active ? ' active' : '');
            btn.dataset.id = qd.id;

            if (qd.icon && CV_ICONS[qd.icon]) {
                const iconEl = document.createElement('span');
                iconEl.className = 'def-qd-icon';
                iconEl.innerHTML = CV_ICONS[qd.icon];
                btn.appendChild(iconEl);
            }

            if (colSpan > 1) {
                const labelEl = document.createElement('span');
                labelEl.className = 'def-qd-label';
                labelEl.textContent = qd.name;
                btn.appendChild(labelEl);

                const modEl = document.createElement('span');
                modEl.className = 'def-qd-mod';
                modEl.textContent = qd.modifier >= 0 ? '+' + qd.modifier : String(qd.modifier);
                btn.appendChild(modEl);
            } else {
                const modStr = qd.modifier >= 0 ? '+' + qd.modifier : String(qd.modifier);
                btn.title = qd.name + ' ' + modStr;
            }

            btn.addEventListener('click', function () {
                qd.active = !qd.active;
                scheduleSave();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, true);
            });

            strip.appendChild(btn);
        });

        container.appendChild(strip);
    }

    // ── Layout Mode: Edit Row ──

    function renderEditRow(def, data, bodyEl, moduleEl) {
        const row = document.createElement('div');
        row.className = 'def-edit-row';
        row.dataset.id = def.id;

        // Drag handle
        const handle = document.createElement('span');
        handle.className = 'def-drag-handle';
        handle.innerHTML = '&#x2807;';
        row.appendChild(handle);

        // Icon button
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'def-icon-btn';
        iconBtn.title = t('def.changeIcon');
        if (def.icon && CV_ICONS[def.icon]) {
            iconBtn.innerHTML = CV_ICONS[def.icon];
        } else {
            iconBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
        }
        iconBtn.addEventListener('click', function () {
            openDefenseIconPicker(iconBtn, def.icon, function (newIcon) {
                def.icon = newIcon;
                scheduleSave();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
            });
        });
        row.appendChild(iconBtn);

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'def-name-input';
        nameInput.value = def.name;
        nameInput.addEventListener('input', function () {
            def.name = nameInput.value;
            scheduleSave();
        });
        row.appendChild(nameInput);

        // Sign toggle
        const signBtn = document.createElement('button');
        signBtn.type = 'button';
        signBtn.className = 'def-sign-toggle' + (def.showSign ? ' active' : '');
        signBtn.title = t('def.showSign');
        signBtn.textContent = '±';
        signBtn.addEventListener('click', function () {
            def.showSign = !def.showSign;
            signBtn.classList.toggle('active', def.showSign);
            scheduleSave();
        });
        row.appendChild(signBtn);

        // Value input
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.className = 'def-value-input';
        valueInput.value = def.value;
        valueInput.addEventListener('input', function () {
            def.value = parseInt(valueInput.value, 10) || 0;
            scheduleSave();
        });
        row.appendChild(valueInput);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'def-delete-btn';
        deleteBtn.title = t('def.deleteDefense');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', function () {
            showConfirm(t('def.confirmDelete', { name: def.name || t('def.unnamed') }), function () {
                const idx = data.content.defenses.findIndex(function (d) { return d.id === def.id; });
                if (idx !== -1) data.content.defenses.splice(idx, 1);
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
                scheduleSave();
            });
        });
        row.appendChild(deleteBtn);

        return row;
    }

    // ── Layout Mode: Add Defense Row ──

    function renderAddRow(data, bodyEl, moduleEl) {
        const row = document.createElement('div');
        row.className = 'def-add-row';
        row.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
            + '<span>' + escapeHtml(t('def.addDefense')) + '</span>';
        row.addEventListener('click', function () {
            data.content.defenses.push({
                id: generateDefenseId(),
                name: '',
                value: 0,
                icon: null,
                showSign: false,
            });
            MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
            scheduleSave();
            const inputs = bodyEl.querySelectorAll('.def-name-input');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        return row;
    }

    // ── SortableJS: Defense List ──

    function initDefenseSortable(container, data) {
        if (container._sortable) container._sortable.destroy();
        container._sortable = new Sortable(container, {
            handle: '.def-drag-handle',
            animation: 150,
            ghostClass: 'cv-drag-ghost',
            draggable: '.def-edit-row',
            onEnd: function () {
                const ids = Array.from(container.querySelectorAll('.def-edit-row'))
                    .map(function (el) { return el.dataset.id; });
                const reordered = ids
                    .map(function (id) {
                        return data.content.defenses.find(function (d) { return d.id === id; });
                    })
                    .filter(Boolean);
                data.content.defenses = reordered;
                scheduleSave();
            },
        });
    }

    // ── QD Settings Modal ──

    function renderQDModalRow(qd, content, data, listEl, moduleEl) {
        const row = document.createElement('div');
        row.className = 'def-qd-row';
        row.dataset.id = qd.id;

        // Drag handle
        const handle = document.createElement('span');
        handle.className = 'def-qd-drag-handle';
        handle.innerHTML = '&#x2807;';
        row.appendChild(handle);

        // Icon button
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'def-icon-btn';
        iconBtn.title = t('def.changeIcon');
        if (qd.icon && CV_ICONS[qd.icon]) {
            iconBtn.innerHTML = CV_ICONS[qd.icon];
        } else {
            iconBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
        }
        iconBtn.addEventListener('click', function () {
            openDefenseIconPicker(iconBtn, qd.icon, function (newIcon) {
                qd.icon = newIcon;
                scheduleSave();
                renderQDModalBody(listEl, content, data, moduleEl);
            });
        });
        row.appendChild(iconBtn);

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'def-qd-name-input';
        nameInput.value = qd.name;
        nameInput.addEventListener('input', function () {
            qd.name = nameInput.value;
            scheduleSave();
        });
        row.appendChild(nameInput);

        // Mod label
        const modLabel = document.createElement('span');
        modLabel.className = 'def-qd-mod-label';
        modLabel.textContent = t('def.modLabel');
        row.appendChild(modLabel);

        // Modifier input
        const modInput = document.createElement('input');
        modInput.type = 'number';
        modInput.className = 'def-qd-mod-input';
        modInput.value = qd.modifier;
        modInput.addEventListener('input', function () {
            qd.modifier = parseInt(modInput.value, 10) || 0;
            scheduleSave();
        });
        row.appendChild(modInput);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'def-qd-delete-btn';
        deleteBtn.title = t('def.deleteQD');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', function () {
            const idx = content.quickDefenses.findIndex(function (q) { return q.id === qd.id; });
            if (idx !== -1) content.quickDefenses.splice(idx, 1);
            scheduleSave();
            renderQDModalBody(listEl, content, data, moduleEl);
        });
        row.appendChild(deleteBtn);

        return row;
    }

    function renderQDModalBody(listEl, content, data, moduleEl) {
        listEl.innerHTML = '';

        if (content.quickDefenses.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'def-qd-empty';
            empty.innerHTML = escapeHtml(t('def.qdEmptyTitle')) + '<br>' + escapeHtml(t('def.qdEmptyHint'));
            listEl.appendChild(empty);
        } else {
            const rowContainer = document.createElement('div');
            rowContainer.className = 'def-qd-list';
            content.quickDefenses.forEach(function (qd) {
                rowContainer.appendChild(renderQDModalRow(qd, content, data, listEl, moduleEl));
            });
            listEl.appendChild(rowContainer);
            initQDSortable(rowContainer, content, data, listEl, moduleEl);
        }

        // Add QD row
        const addRow = document.createElement('div');
        addRow.className = 'def-qd-add-row';
        addRow.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
            + '<span>' + escapeHtml(t('def.addQD')) + '</span>';
        addRow.addEventListener('click', function () {
            content.quickDefenses.push({
                id: generateQDId(),
                name: '',
                icon: null,
                modifier: 0,
                active: false,
            });
            scheduleSave();
            renderQDModalBody(listEl, content, data, moduleEl);
            const inputs = listEl.querySelectorAll('.def-qd-name-input');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        listEl.appendChild(addRow);
    }

    function initQDSortable(container, content, data, listEl, moduleEl) {
        if (container._sortable) container._sortable.destroy();
        container._sortable = new Sortable(container, {
            handle: '.def-qd-drag-handle',
            animation: 150,
            ghostClass: 'cv-drag-ghost',
            draggable: '.def-qd-row',
            onEnd: function () {
                const ids = Array.from(container.querySelectorAll('.def-qd-row'))
                    .map(function (el) { return el.dataset.id; });
                const reordered = ids
                    .map(function (id) {
                        return content.quickDefenses.find(function (q) { return q.id === id; });
                    })
                    .filter(Boolean);
                content.quickDefenses = reordered;
                scheduleSave();
            },
        });
    }

    function openQDSettingsModal(moduleEl, data) {
        const content = ensureContent(data);

        const existing = document.querySelector('.def-settings-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay def-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('def.qdSettings');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('def.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';
        renderQDModalBody(body, content, data, moduleEl);
        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-btn cv-modal-btn-secondary';
        closeBtn.textContent = t('def.close');
        footer.appendChild(closeBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);

        function closeModal() {
            overlay.remove();
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) {
                const isPlay = window.isPlayMode;
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, isPlay);
            }
        }

        closeXBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        document.body.appendChild(overlay);
    }

    // ── Module Type Registration ──

    registerModuleType('defenses', {
        label: 'type.defenses',

        renderBody: function (bodyEl, data, isPlayMode) {
            const content = ensureContent(data);
            bodyEl.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'def-container';
            const moduleEl = bodyEl.closest('.module');

            if (content.defenses.length === 0 && isPlayMode) {
                const empty = document.createElement('div');
                empty.className = 'def-empty';
                empty.innerHTML = '<div>' + escapeHtml(t('def.emptyTitle')) + '</div>'
                    + '<div>' + escapeHtml(t('def.emptyHint')) + '</div>';
                container.appendChild(empty);
            } else if (isPlayMode) {
                renderSpotlight(container, content, data, bodyEl);
                renderSecondaryRows(container, content, data, bodyEl);
                renderQDButtons(container, content, data, bodyEl, moduleEl);
            } else {
                content.defenses.forEach(function (def) {
                    container.appendChild(renderEditRow(def, data, bodyEl, moduleEl));
                });
                if (content.defenses.length > 1) {
                    initDefenseSortable(container, data);
                }
                container.appendChild(renderAddRow(data, bodyEl, moduleEl));
            }

            bodyEl.appendChild(container);
        },

        onPlayMode: function (moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onLayoutMode: function (moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },
    });

    // ── Window Exports ──

    window.ensureDefenseContent = ensureContent;
    window.generateDefenseId = generateDefenseId;
    window.generateQDId = generateQDId;
    window.buildDefensesDefaultContent = buildDefensesDefaultContent;
    window.computeSpotlightValue = computeSpotlightValue;
    window.openDefenseSettingsModal = openQDSettingsModal;

    console.log('[CV] Defenses module registered');
})();
```

- [ ] **Step 2: Verify the script loads without errors**

Run the linter to check for syntax issues:

```bash
npm run lint -- --no-fix scripts/module-defenses.js
```

Expected: No errors (warnings about globals like `scheduleSave`, `MODULE_TYPES` etc. are fine — they're loaded earlier in the script chain).

- [ ] **Step 3: Commit**

```bash
git add scripts/module-defenses.js
git commit -m "feat(defenses): rewrite module with spotlight, QD buttons, and settings modal"
```

---

## Phase 2 — CSS + Integration ▸ `css/sub-defenses.css`, `scripts/module-core.js`, locale files

> **Status:** ✅ COMPLETE
> **Overwrites:** `css/sub-defenses.css`
> **Modifies:** `scripts/module-core.js`, all 7 `scripts/translations-*.js` files
> **Commit:** `feat(defenses): add CSS, update toolbar/wizard, and locale keys`

### Context for the implementing agent

Read these before starting:
- `_DOCS/plans/defenses-module-design.md` — complete design spec (layout, responsive, interactions)
- `css/sub-recovery.css` — reference for modal-specific CSS patterns
- `css/modules.css` lines 389–476 — `cv-modal-*` base classes (overlay, panel, header, body, footer, close button, action buttons)
- `scripts/module-core.js` — search for `module-def-add-btn` to find all locations that need updating (toolbar template ~line 850, overflow menu ~line 560, button handler ~line 1150, play/edit mode toggles ~lines 1410 and 1459)

Phase 1 must be complete before starting Phase 2.

### Task 2: Write the complete `css/sub-defenses.css`

**Files:**
- Overwrite: `css/sub-defenses.css`

- [ ] **Step 1: Write the full CSS file**

Overwrite `css/sub-defenses.css` with:

```css
/* ── Defenses Module ── */

/* Container */
.def-container { padding: 4px 0; }

/* ── Play Mode: Spotlight ── */
.def-spotlight {
    display: flex; flex-direction: column; align-items: center;
    padding: 12px 8px 8px; user-select: none;
}

.def-spotlight-icon {
    width: 20px; height: 20px; color: var(--cv-text-muted);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 2px;
}
.def-spotlight-icon .icon { width: 20px; height: 20px; }

.def-spotlight-value {
    font-size: 2.8em; font-weight: 700; color: var(--cv-text-primary);
    line-height: 1; cursor: default;
}
.def-spotlight-value.buffed {
    color: #6ee7b7;
    text-shadow: 0 0 8px rgba(110, 231, 183, 0.4);
}

.def-spotlight-label {
    font-size: 0.8em; text-transform: uppercase; color: var(--cv-text-muted);
    letter-spacing: 0.05em; margin-top: 2px;
}

.def-spotlight-base {
    font-size: 0.75em; color: var(--cv-text-muted); margin-top: 2px;
}

.def-spotlight-badges {
    display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;
    margin-top: 6px;
}

.def-spotlight-badge {
    font-size: 0.7em; padding: 2px 8px; border-radius: 10px;
    background: rgba(110, 231, 183, 0.15); color: #6ee7b7;
    border: 1px solid rgba(110, 231, 183, 0.3);
    white-space: nowrap;
}

/* ── Play Mode: Secondary Rows ── */
.def-secondary {
    border-top: 1px solid var(--cv-border-subtle);
}

.def-secondary-row {
    display: flex; align-items: center; padding: 5px 8px; gap: 8px;
    border-bottom: 1px solid var(--cv-border-subtle);
    user-select: none;
}
.def-secondary-row:last-child { border-bottom: none; }

.def-secondary-icon {
    width: 14px; height: 14px; flex-shrink: 0;
    color: var(--cv-text-muted); display: flex; align-items: center;
}
.def-secondary-icon .icon { width: 14px; height: 14px; }

.def-secondary-name {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: var(--cv-text-secondary); font-size: 0.85em;
}

.def-secondary-value {
    font-weight: 700; color: var(--cv-text-primary);
    flex-shrink: 0; min-width: 24px; text-align: right; cursor: default;
}

/* ── Play Mode: Quick Defense Buttons ── */
.def-qd-strip {
    border-top: 1px solid var(--cv-border-subtle);
    padding: 6px 4px; display: flex; flex-direction: column; gap: 2px;
}

.def-qd-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 8px; border: 1px solid var(--cv-border-subtle);
    border-radius: 4px; background: none; color: var(--cv-text-muted);
    cursor: pointer; user-select: none; width: 100%;
    font-family: inherit; font-size: 0.85em; text-align: left;
}
.def-qd-btn:hover { background: var(--cv-surface-hover); }
.def-qd-btn.active {
    background: rgba(110, 231, 183, 0.1);
    border-color: rgba(110, 231, 183, 0.4);
    color: #6ee7b7;
}

.def-qd-icon {
    width: 14px; height: 14px; flex-shrink: 0;
    display: flex; align-items: center;
}
.def-qd-icon .icon { width: 14px; height: 14px; }

.def-qd-label {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.def-qd-mod {
    flex-shrink: 0; font-weight: 600; min-width: 24px; text-align: right;
}

/* Compact mode (1-col): icon-only grid */
.def-qd-strip.compact {
    flex-direction: row; flex-wrap: wrap; gap: 4px;
    justify-content: center;
}
.def-qd-strip.compact .def-qd-btn {
    width: auto; padding: 6px;
}
.def-qd-strip.compact .def-qd-label { display: none; }
.def-qd-strip.compact .def-qd-mod { display: none; }

/* ── Layout Mode: Edit Rows ── */
.def-edit-row {
    display: flex; align-items: center; padding: 4px; gap: 6px;
}

.def-drag-handle {
    cursor: grab; color: var(--cv-text-muted); font-size: 14px;
    flex-shrink: 0; user-select: none;
}

.def-icon-btn {
    background: none; border: none; width: 24px; height: 24px;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    color: var(--cv-text-muted); cursor: pointer; border-radius: 3px; padding: 0;
}
.def-icon-btn:hover { background: var(--cv-surface-hover); }
.def-icon-btn .icon { width: 14px; height: 14px; }

.def-name-input {
    flex: 1; min-width: 60px; background: var(--cv-bg-sunken);
    border: 1px solid var(--cv-border-subtle); color: var(--cv-text-primary);
    padding: 4px 6px; border-radius: 3px; font-size: 0.85em;
    font-family: inherit;
}

.def-sign-toggle {
    background: none; border: 1px solid var(--cv-border-subtle);
    width: 24px; height: 24px; flex-shrink: 0; font-weight: 700;
    font-size: 0.8em; border-radius: 3px; color: var(--cv-text-muted);
    cursor: pointer; padding: 0;
}
.def-sign-toggle:hover { background: var(--cv-surface-hover); }
.def-sign-toggle.active { color: var(--cv-accent); border-color: var(--cv-accent); }

.def-value-input {
    width: 50px; background: var(--cv-bg-sunken);
    border: 1px solid var(--cv-border-subtle); color: var(--cv-text-primary);
    padding: 4px 6px; border-radius: 3px; font-size: 0.85em; text-align: center;
    font-family: inherit;
}

.def-delete-btn {
    background: none; border: none; width: 20px; height: 20px;
    color: var(--cv-text-muted); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; padding: 0;
}
.def-delete-btn:hover { color: var(--cv-danger); }
.def-delete-btn .icon { width: 12px; height: 12px; }

/* ── Add Defense Row ── */
.def-add-row {
    display: flex; align-items: center; justify-content: center;
    padding: 6px 4px; gap: 6px; cursor: pointer;
    color: var(--cv-text-muted); font-size: 0.8em;
    border-radius: 4px; margin-top: 4px; user-select: none;
}
.def-add-row:hover {
    background: var(--cv-surface-hover); color: var(--cv-text-secondary);
}
.def-add-row .icon { width: 14px; height: 14px; }

/* ── Empty State ── */
.def-empty {
    text-align: center; padding: 16px 12px;
    color: var(--cv-text-muted); font-size: 0.85em; user-select: none;
}

/* ── Quick-Edit Input (Play Ctrl+Click) ── */
.def-quick-input {
    background: var(--cv-bg-sunken); border: 1px solid var(--cv-accent);
    color: var(--cv-text-primary); padding: 2px 4px; border-radius: 3px;
    font-size: inherit; font-weight: inherit; text-align: inherit; outline: none;
    font-family: inherit;
}

/* ── Icon Picker Popover ── */
.def-icon-picker {
    position: fixed; z-index: 200;
    background: var(--cv-bg-surface); border: 1px solid var(--cv-border-subtle);
    border-radius: 6px; padding: 8px;
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;
    max-height: 200px; overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    scrollbar-gutter: stable; scrollbar-width: thin;
    scrollbar-color: var(--cv-text-muted) transparent;
}
.def-icon-picker::-webkit-scrollbar { width: 4px; }
.def-icon-picker::-webkit-scrollbar-track { background: transparent; }
.def-icon-picker::-webkit-scrollbar-thumb { background-color: var(--cv-text-muted); border-radius: 2px; }

.def-icon-picker button {
    background: none; border: none; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 3px; color: var(--cv-text-secondary); cursor: pointer; padding: 0;
}
.def-icon-picker button:hover { background: var(--cv-surface-hover); }
.def-icon-picker button.selected { background: var(--cv-accent); color: white; }

/* ── QD Settings Modal ── */
.def-qd-row {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 4px;
    border-bottom: 1px solid var(--cv-border-subtle);
}
.def-qd-row:last-child { border-bottom: none; }

.def-qd-drag-handle {
    cursor: grab; color: var(--cv-text-muted); font-size: 14px;
    flex-shrink: 0; user-select: none;
}

.def-qd-name-input {
    flex: 1; min-width: 80px; background: var(--cv-bg-sunken);
    border: 1px solid var(--cv-border-subtle); color: var(--cv-text-primary);
    padding: 4px 6px; border-radius: 3px; font-size: 0.85em;
    font-family: inherit;
}

.def-qd-mod-label {
    font-size: 0.75em; color: var(--cv-text-muted); white-space: nowrap;
    user-select: none; flex-shrink: 0; width: 28px; text-align: right;
}

.def-qd-mod-input {
    width: 50px; background: var(--cv-bg-sunken);
    border: 1px solid var(--cv-border-subtle); color: var(--cv-text-primary);
    padding: 4px 4px; border-radius: 3px; font-size: 0.85em; text-align: center;
    font-family: inherit;
}

.def-qd-delete-btn {
    background: none; border: none; width: 20px; height: 20px;
    color: var(--cv-text-muted); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; padding: 0;
}
.def-qd-delete-btn:hover { color: var(--cv-danger); }
.def-qd-delete-btn .icon { width: 12px; height: 12px; }

.def-qd-add-row {
    display: flex; align-items: center; justify-content: center;
    padding: 6px 4px; gap: 6px; cursor: pointer;
    color: var(--cv-text-muted); font-size: 0.8em;
    border-radius: 4px; margin-top: 4px; user-select: none;
}
.def-qd-add-row:hover {
    background: var(--cv-surface-hover); color: var(--cv-text-secondary);
}
.def-qd-add-row .icon { width: 14px; height: 14px; }

.def-qd-empty {
    text-align: center; padding: 16px 8px;
    color: var(--cv-text-muted); font-size: 0.85em;
    user-select: none; line-height: 1.5;
}

/* ── SortableJS Ghost ── */
.def-edit-row.cv-drag-ghost,
.def-qd-row.cv-drag-ghost {
    opacity: 0.4; border: 1px dashed var(--cv-text-muted); border-radius: 4px;
}

/* ── Responsive ── */
.module[data-size="xs"] .def-spotlight-value { font-size: 2.2em; }
.module[data-size="xs"] .def-secondary-name { font-size: 0.8em; }
```

- [ ] **Step 2: Verify CSS loads without syntax errors**

Open the symbiote in TaleSpire or review with a CSS linter. The file uses only `--cv-*` tokens except for the green buffed/active color (`#6ee7b7` and its rgba variants), which is a deliberate design choice for the "buffed" visual state.

### Task 3: Update `scripts/module-core.js`

**Files:**
- Modify: `scripts/module-core.js`

This task makes 5 targeted edits. Search for each code pattern to find the exact location.

- [ ] **Step 1: Update the wizard creation block**

Find the block (around line 403):
```js
        if (moduleData.type === 'defenses') {
            moduleData.content = {
                defenses: [
                    { id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false, notes: '' }
                ]
            };
            moduleData.colSpan = 1;
            moduleData.rowSpan = null;
        }
```

Replace with:
```js
        if (moduleData.type === 'defenses') {
            const sys = window.gameSystem || 'custom';
            moduleData.content = typeof window.buildDefensesDefaultContent === 'function'
                ? window.buildDefensesDefaultContent(sys)
                : { defenses: [{ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false }], quickDefenses: [] };
            moduleData.colSpan = 2;
            moduleData.rowSpan = 2;
        }
```

- [ ] **Step 2: Replace the toolbar button**

Find the defense add button in the toolbar template (around line 850):
```js
            ${data.type === 'defenses' ? `<button class="module-toolbar-btn module-def-add-btn" title="${t('def.addDefense')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>` : ''}
```

Replace with (gear icon, always visible — no `display:none` for play mode):
```js
            ${data.type === 'defenses' ? `<button class="module-toolbar-btn module-def-settings-btn" title="${t('def.qdSettings')}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>` : ''}
```

- [ ] **Step 3: Update the overflow menu entry**

Find the overflow menu entry (around line 559):
```js
            {
                sel: '.module-def-add-btn',
                label: t('def.addDefense'),
                icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            },
```

Replace with:
```js
            {
                sel: '.module-def-settings-btn',
                label: t('def.qdSettings'),
                icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            },
```

- [ ] **Step 4: Replace the button handler**

Find the add-defense button handler (around line 1150):
```js
        // Add Defense button (defenses modules only)
        const defAddBtn = el.querySelector('.module-def-add-btn');
        if (defAddBtn) {
            defAddBtn.addEventListener('click', () => {
                if (!data.content) data.content = { defenses: [] };
                if (!Array.isArray(data.content.defenses)) data.content.defenses = [];
                data.content.defenses.push({
                    id: generateDefenseId(),
                    name: '',
                    value: 0,
                    icon: null,
                    showSign: false,
                    notes: ''
                });
                const bodyEl = el.querySelector('.module-body');
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
                snapModuleHeight(el, data);
                scheduleSave();
                const inputs = bodyEl.querySelectorAll('.def-name-input');
                if (inputs.length) inputs[inputs.length - 1].focus();
            });
        }
```

Replace with:
```js
        // QD Settings button (defenses modules only)
        const defSettingsBtn = el.querySelector('.module-def-settings-btn');
        if (defSettingsBtn) {
            defSettingsBtn.addEventListener('click', () => {
                if (typeof window.openDefenseSettingsModal === 'function') window.openDefenseSettingsModal(el, data);
            });
        }
```

- [ ] **Step 5: Update play/edit mode toggle handlers**

Find the play-mode hide line (around line 1410):
```js
            const defAddBtnPlay = mod.querySelector('.module-def-add-btn');
            if (defAddBtnPlay) defAddBtnPlay.style.display = 'none';
```

Remove these 2 lines entirely. The gear button has no `display:none` guard — it stays visible in both modes.

Find the edit-mode show line (around line 1459):
```js
            const defAddBtnEdit = mod.querySelector('.module-def-add-btn');
            if (defAddBtnEdit) defAddBtnEdit.style.display = '';
```

Remove these 2 lines entirely.

- [ ] **Step 6: Verify module-core.js changes**

```bash
npm run lint -- --no-fix scripts/module-core.js
```

Expected: No new errors introduced.

### Task 4: Update all locale files

**Files:**
- Modify: `scripts/translations-en.js`
- Modify: `scripts/translations-es.js`
- Modify: `scripts/translations-fr.js`
- Modify: `scripts/translations-de.js`
- Modify: `scripts/translations-it.js`
- Modify: `scripts/translations-pt-BR.js`
- Modify: `scripts/translations-ru.js`

- [ ] **Step 1: Update English locale**

In `scripts/translations-en.js`, find the defense keys block:
```js
            'def.addDefense': 'Add Defense',
            'def.emptyTitle': 'No defenses added yet.',
            'def.emptyHint': 'Switch to Edit mode to add defense values.',
            'def.notesPlaceholder': 'Notes (optional)',
            'def.showSign': 'Show +/- sign',
            'def.deleteDefense': 'Delete defense',
            'def.changeIcon': 'Change icon',
            'def.noIcon': 'No icon',
```

Replace with:
```js
            'def.addDefense': 'Add Defense',
            'def.emptyTitle': 'No defenses configured',
            'def.emptyHint': 'Switch to Layout mode to add defense values',
            'def.showSign': 'Show +/- sign',
            'def.deleteDefense': 'Delete defense',
            'def.confirmDelete': 'Delete {name}?',
            'def.unnamed': 'Unnamed',
            'def.changeIcon': 'Change icon',
            'def.noIcon': 'No icon',
            'def.base': 'Base: {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Close',
            'def.qdSettings': 'Quick Defense Settings',
            'def.addQD': 'Add Quick Defense',
            'def.deleteQD': 'Delete quick defense',
            'def.qdEmptyTitle': 'No quick defenses configured.',
            'def.qdEmptyHint': 'Add modifiers that can be toggled on and off to adjust your spotlight defense value.',
```

- [ ] **Step 2: Update Spanish locale**

In `scripts/translations-es.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Agregar defensa',
            'def.emptyTitle': 'Sin defensas configuradas',
            'def.emptyHint': 'Cambia al modo Diseño para agregar valores de defensa',
            'def.showSign': 'Mostrar signo +/-',
            'def.deleteDefense': 'Eliminar defensa',
            'def.confirmDelete': '¿Eliminar {name}?',
            'def.unnamed': 'Sin nombre',
            'def.changeIcon': 'Cambiar icono',
            'def.noIcon': 'Sin icono',
            'def.base': 'Base: {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Cerrar',
            'def.qdSettings': 'Configuración de defensa rápida',
            'def.addQD': 'Agregar defensa rápida',
            'def.deleteQD': 'Eliminar defensa rápida',
            'def.qdEmptyTitle': 'Sin defensas rápidas configuradas.',
            'def.qdEmptyHint': 'Agrega modificadores que se activan y desactivan para ajustar tu valor de defensa principal.',
```

- [ ] **Step 3: Update French locale**

In `scripts/translations-fr.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Ajouter une défense',
            'def.emptyTitle': 'Aucune défense configurée',
            'def.emptyHint': 'Passez en mode Disposition pour ajouter des valeurs de défense',
            'def.showSign': 'Afficher le signe +/-',
            'def.deleteDefense': 'Supprimer la défense',
            'def.confirmDelete': 'Supprimer {name} ?',
            'def.unnamed': 'Sans nom',
            'def.changeIcon': 'Changer l\'icône',
            'def.noIcon': 'Aucune icône',
            'def.base': 'Base : {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Fermer',
            'def.qdSettings': 'Paramètres de défense rapide',
            'def.addQD': 'Ajouter une défense rapide',
            'def.deleteQD': 'Supprimer la défense rapide',
            'def.qdEmptyTitle': 'Aucune défense rapide configurée.',
            'def.qdEmptyHint': 'Ajoutez des modificateurs activables pour ajuster votre valeur de défense principale.',
```

- [ ] **Step 4: Update German locale**

In `scripts/translations-de.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Verteidigung hinzufügen',
            'def.emptyTitle': 'Keine Verteidigungen konfiguriert',
            'def.emptyHint': 'Wechsle in den Layout-Modus, um Verteidigungswerte hinzuzufügen',
            'def.showSign': '+/- Zeichen anzeigen',
            'def.deleteDefense': 'Verteidigung löschen',
            'def.confirmDelete': '{name} löschen?',
            'def.unnamed': 'Unbenannt',
            'def.changeIcon': 'Symbol ändern',
            'def.noIcon': 'Kein Symbol',
            'def.base': 'Basis: {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Schließen',
            'def.qdSettings': 'Schnellverteidigung-Einstellungen',
            'def.addQD': 'Schnellverteidigung hinzufügen',
            'def.deleteQD': 'Schnellverteidigung löschen',
            'def.qdEmptyTitle': 'Keine Schnellverteidigungen konfiguriert.',
            'def.qdEmptyHint': 'Füge Modifikatoren hinzu, die ein- und ausgeschaltet werden können, um deinen Hauptverteidigungswert anzupassen.',
```

- [ ] **Step 5: Update Italian locale**

In `scripts/translations-it.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Aggiungi difesa',
            'def.emptyTitle': 'Nessuna difesa configurata',
            'def.emptyHint': 'Passa alla modalità Layout per aggiungere valori di difesa',
            'def.showSign': 'Mostra segno +/-',
            'def.deleteDefense': 'Elimina difesa',
            'def.confirmDelete': 'Eliminare {name}?',
            'def.unnamed': 'Senza nome',
            'def.changeIcon': 'Cambia icona',
            'def.noIcon': 'Nessuna icona',
            'def.base': 'Base: {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Chiudi',
            'def.qdSettings': 'Impostazioni difesa rapida',
            'def.addQD': 'Aggiungi difesa rapida',
            'def.deleteQD': 'Elimina difesa rapida',
            'def.qdEmptyTitle': 'Nessuna difesa rapida configurata.',
            'def.qdEmptyHint': 'Aggiungi modificatori attivabili per regolare il tuo valore di difesa principale.',
```

- [ ] **Step 6: Update Brazilian Portuguese locale**

In `scripts/translations-pt-BR.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Adicionar defesa',
            'def.emptyTitle': 'Nenhuma defesa configurada',
            'def.emptyHint': 'Mude para o modo Layout para adicionar valores de defesa',
            'def.showSign': 'Mostrar sinal +/-',
            'def.deleteDefense': 'Excluir defesa',
            'def.confirmDelete': 'Excluir {name}?',
            'def.unnamed': 'Sem nome',
            'def.changeIcon': 'Alterar ícone',
            'def.noIcon': 'Sem ícone',
            'def.base': 'Base: {value}',
            'def.modLabel': 'Mod',
            'def.close': 'Fechar',
            'def.qdSettings': 'Configurações de defesa rápida',
            'def.addQD': 'Adicionar defesa rápida',
            'def.deleteQD': 'Excluir defesa rápida',
            'def.qdEmptyTitle': 'Nenhuma defesa rápida configurada.',
            'def.qdEmptyHint': 'Adicione modificadores que podem ser ativados e desativados para ajustar seu valor de defesa principal.',
```

- [ ] **Step 7: Update Russian locale**

In `scripts/translations-ru.js`, find the defense keys block and replace with:
```js
            'def.addDefense': 'Добавить защиту',
            'def.emptyTitle': 'Защиты не настроены',
            'def.emptyHint': 'Переключитесь в режим компоновки, чтобы добавить значения защиты',
            'def.showSign': 'Показывать знак +/-',
            'def.deleteDefense': 'Удалить защиту',
            'def.confirmDelete': 'Удалить {name}?',
            'def.unnamed': 'Без имени',
            'def.changeIcon': 'Изменить иконку',
            'def.noIcon': 'Без иконки',
            'def.base': 'База: {value}',
            'def.modLabel': 'Мод',
            'def.close': 'Закрыть',
            'def.qdSettings': 'Настройки быстрой защиты',
            'def.addQD': 'Добавить быструю защиту',
            'def.deleteQD': 'Удалить быструю защиту',
            'def.qdEmptyTitle': 'Быстрые защиты не настроены.',
            'def.qdEmptyHint': 'Добавьте модификаторы, которые можно включать и выключать для корректировки основного значения защиты.',
```

- [ ] **Step 8: Commit Phase 2**

```bash
git add css/sub-defenses.css scripts/module-core.js scripts/translations-en.js scripts/translations-es.js scripts/translations-fr.js scripts/translations-de.js scripts/translations-it.js scripts/translations-pt-BR.js scripts/translations-ru.js
git commit -m "feat(defenses): add CSS, update toolbar/wizard, and locale keys"
```

---

## Phase 3 — Tests ▸ `tests/module-defenses.test.js`

> **Status:** ✅ COMPLETE
> **Creates:** `tests/module-defenses.test.js`
> **Commit:** `test(defenses): add unit tests for pure functions`

### Context for the implementing agent

Read these before starting:
- `_DOCS/TESTING.md` — test infrastructure guide (loadScript, setup.js, minimal-dom.js, pattern)
- `tests/module-savingthrow.test.js` — reference for testing module pure functions
- `tests/module-weapons.test.js` — reference for testing system-dependent template functions

### Task 5: Write tests for pure functions

**Files:**
- Create: `tests/module-defenses.test.js`

**Tests for:**
- `window.ensureDefenseContent` — shape guard
- `window.buildDefensesDefaultContent` — system templates
- `window.computeSpotlightValue` — buffed value computation
- `window.generateDefenseId` — ID format
- `window.generateQDId` — ID format

- [ ] **Step 1: Write the test file**

Create `tests/module-defenses.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

globalThis.scheduleSave = vi.fn();
globalThis.modules = [];
globalThis.gameSystem = 'custom';
globalThis.isPlayMode = false;

beforeEach(() => {
    setupMinimalDOM();
    globalThis.modules = [];
    globalThis.scheduleSave.mockClear();
    globalThis.gameSystem = 'custom';

    loadScript('scripts/translations-en.js');
    loadScript('scripts/shared.js');
    loadScript('scripts/i18n.js');
    loadScript('scripts/module-core.js');
    loadScript('scripts/module-defenses.js');
});

// ── generateDefenseId ──

describe('generateDefenseId', () => {
    it('returns a string starting with def_', () => {
        const id = window.generateDefenseId();
        expect(id).toMatch(/^def_/);
    });

    it('generates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 50; i++) ids.add(window.generateDefenseId());
        expect(ids.size).toBe(50);
    });
});

// ── generateQDId ──

describe('generateQDId', () => {
    it('returns a string starting with qd_', () => {
        const id = window.generateQDId();
        expect(id).toMatch(/^qd_/);
    });

    it('generates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 50; i++) ids.add(window.generateQDId());
        expect(ids.size).toBe(50);
    });
});

// ── ensureDefenseContent ──

describe('ensureDefenseContent', () => {
    it('initializes empty data with defaults', () => {
        const data = { content: null };
        const content = window.ensureDefenseContent(data);
        expect(Array.isArray(content.defenses)).toBe(true);
        expect(Array.isArray(content.quickDefenses)).toBe(true);
        expect(content.defenses.length).toBeGreaterThan(0);
    });

    it('preserves existing valid content', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_test', name: 'AC', value: 15, icon: 'shield', showSign: false }],
                quickDefenses: [{ id: 'qd_test', name: 'Shield', icon: null, modifier: 2, active: true }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].value).toBe(15);
        expect(content.quickDefenses).toHaveLength(1);
        expect(content.quickDefenses[0].active).toBe(true);
    });

    it('adds missing quickDefenses array', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10, icon: null, showSign: false }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(Array.isArray(content.quickDefenses)).toBe(true);
    });

    it('strips notes field from old-format defenses', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10, icon: null, showSign: false, notes: 'old notes' }],
                quickDefenses: [],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses[0].notes).toBeUndefined();
    });

    it('fills missing defense fields with defaults', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10 }],
                quickDefenses: [],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses[0].showSign).toBe(false);
        expect(content.defenses[0].icon).toBeNull();
    });

    it('fills missing QD fields with defaults', () => {
        const data = {
            content: {
                defenses: [],
                quickDefenses: [{ id: 'qd_1', name: 'Test', modifier: 1 }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.quickDefenses[0].active).toBe(false);
        expect(content.quickDefenses[0].icon).toBeNull();
    });
});

// ── buildDefensesDefaultContent ──

describe('buildDefensesDefaultContent', () => {
    it('returns AC for dnd5e', () => {
        const content = window.buildDefensesDefaultContent('dnd5e');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.defenses[0].value).toBe(10);
        expect(content.defenses[0].icon).toBe('shield');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC for custom', () => {
        const content = window.buildDefensesDefaultContent('custom');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC + Raise Shield QD for pf2e', () => {
        const content = window.buildDefensesDefaultContent('pf2e');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.quickDefenses).toHaveLength(1);
        expect(content.quickDefenses[0].name).toBe('Raise Shield');
        expect(content.quickDefenses[0].modifier).toBe(2);
    });

    it('returns 3 defenses for dnd3.5e', () => {
        const content = window.buildDefensesDefaultContent('dnd3.5e');
        expect(content.defenses).toHaveLength(3);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.defenses[1].name).toBe('Touch AC');
        expect(content.defenses[2].name).toBe('Flat-Footed AC');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC for unknown systems', () => {
        const content = window.buildDefensesDefaultContent('vtm');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
    });
});

// ── computeSpotlightValue ──

describe('computeSpotlightValue', () => {
    it('returns base value when no QDs active', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [{ id: 'qd_1', name: 'Shield', modifier: 2, active: false }],
        };
        expect(window.computeSpotlightValue(content)).toBe(15);
    });

    it('adds active QD modifiers to base', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [
                { id: 'qd_1', name: 'Shield', modifier: 2, active: true },
                { id: 'qd_2', name: 'Cover', modifier: 2, active: true },
            ],
        };
        expect(window.computeSpotlightValue(content)).toBe(19);
    });

    it('handles negative modifiers', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [{ id: 'qd_1', name: 'Debuff', modifier: -3, active: true }],
        };
        expect(window.computeSpotlightValue(content)).toBe(12);
    });

    it('ignores inactive QDs', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [
                { id: 'qd_1', name: 'Shield', modifier: 2, active: false },
                { id: 'qd_2', name: 'Cover', modifier: 5, active: true },
            ],
        };
        expect(window.computeSpotlightValue(content)).toBe(20);
    });

    it('returns 0 when no defenses exist', () => {
        const content = { defenses: [], quickDefenses: [] };
        expect(window.computeSpotlightValue(content)).toBe(0);
    });

    it('handles empty QD array', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 18, icon: null, showSign: false }],
            quickDefenses: [],
        };
        expect(window.computeSpotlightValue(content)).toBe(18);
    });
});
```

- [ ] **Step 2: Run the tests**

```bash
npx vitest run tests/module-defenses.test.js --reporter=verbose
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/module-defenses.test.js
git commit -m "test(defenses): add unit tests for pure functions"
```

---

## ARCHITECTURE.md Update

After all phases are complete, update `_DOCS/ARCHITECTURE.md`:

1. **Files at a Glance table** — update the `module-defenses.js` row:
   ```
   | `scripts/module-defenses.js` | Defenses module type registration + helpers (spotlight stat, secondary rows, Quick Defense toggle buttons, QD settings modal, system templates, icon picker, quick-edit, SortableJS reorder) |
   ```

2. **Key Functions row** — update:
   ```
   | **module-defenses.js** | `buildDefensesDefaultContent(sys)`, `ensureContent(data)`, `computeSpotlightValue(content)`, `openQDSettingsModal(moduleEl, data)`, `registerModuleType('defenses', ...)` — spotlight stat with buffed state, QD toggle buttons, settings modal, system-specific templates; `window.ensureDefenseContent`, `window.generateDefenseId`, `window.generateQDId`, `window.buildDefensesDefaultContent`, `window.computeSpotlightValue`, `window.openDefenseSettingsModal` |
   ```

3. **CSS Files table** — update the `sub-defenses.css` row:
   ```
   | **`css/sub-defenses.css`** | Defenses Module: `.def-spotlight` play mode with buffed state glow, `.def-secondary-row` compact rows, `.def-qd-btn` toggle buttons (active green state), `.def-edit-row` layout mode, `.def-add-row`, icon picker popover, QD settings modal rows, SortableJS ghost, responsive compact QD grid. |
   ```

4. **Existing Tests table** — add row:
   ```
   | `module-defenses.test.js` | `generateDefenseId`, `generateQDId`, `ensureDefenseContent`, `buildDefensesDefaultContent`, `computeSpotlightValue` |
   ```

---

## Self-Review Checklist

- [x] **Spec coverage:** Every section of the design spec has a corresponding implementation task — spotlight, secondary rows, QD buttons, QD settings modal, system templates, responsive behavior (1-col compact), interactions (Ctrl+Click quick-edit, QD toggle, defense reorder), empty states, wizard integration (module-core.js update).
- [x] **Placeholder scan:** No TBD/TODO in the plan. All steps have actual code.
- [x] **Type consistency:** `computeSpotlightValue(content)` signature matches between Task 1 code and Task 5 tests. `buildDefensesDefaultContent(sys)` signature consistent across module-defenses.js, module-core.js, and tests. `window.openDefenseSettingsModal` matches the module-core.js handler call.
- [x] **Naming consistency:** `def-settings-overlay` (CSS class), `module-def-settings-btn` (toolbar class), `def.qdSettings` (i18n key) — all consistent. Old `module-def-add-btn` / `def.addDefense` pattern replaced everywhere.
