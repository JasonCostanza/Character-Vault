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
        cancelBtn.textContent = t('delete.cancel');
        cancelBtn.addEventListener('click', function () { overlay.remove(); });
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-yes';
        confirmBtn.textContent = t('delete.confirm');
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
