// ── Defenses Module Type ──
(function () {
    'use strict';

    // ── ID Generation ──
    function generateDefenseId() {
        return 'def_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { defenses: [] };
        }
        if (!Array.isArray(data.content.defenses)) data.content.defenses = [];
        data.content.defenses.forEach(function (def) {
            if (def.showSign === undefined) def.showSign = false;
            if (def.notes === undefined) def.notes = '';
            if (def.icon === undefined) def.icon = null;
        });
        return data.content;
    }

    // ── Value Formatting ──
    function formatDefenseValue(value, showSign) {
        if (showSign) return window.formatModifier(value);
        return String(value);
    }

    // ── Play Mode Row ──
    function renderPlayRow(def, data, bodyEl) {
        const row = document.createElement('div');
        row.className = 'def-row';
        row.dataset.id = def.id;

        // Icon
        const iconEl = document.createElement('span');
        iconEl.className = 'def-icon';
        if (def.icon && CV_ICONS[def.icon]) {
            iconEl.innerHTML = CV_ICONS[def.icon];
        } else {
            iconEl.style.display = 'none';
        }
        row.appendChild(iconEl);

        // Name
        const nameEl = document.createElement('span');
        nameEl.className = 'def-name';
        nameEl.textContent = def.name;
        row.appendChild(nameEl);

        // Expand indicator
        const indicator = document.createElement('span');
        indicator.className = 'def-expand-indicator';
        if (def.notes && def.notes.trim()) {
            indicator.textContent = '▸';
        } else {
            indicator.style.display = 'none';
        }
        row.appendChild(indicator);

        // Value
        const valueEl = document.createElement('span');
        valueEl.className = 'def-value';
        valueEl.textContent = formatDefenseValue(def.value, def.showSign);
        row.appendChild(valueEl);

        // Notes (hidden by default)
        const notesEl = document.createElement('div');
        notesEl.className = 'def-notes';
        notesEl.textContent = def.notes || '';
        row.after(notesEl);

        // Row click — toggle notes or quick-edit
        row.addEventListener('click', function (e) {
            if (e.ctrlKey || e.metaKey) return;
            if (!def.notes || !def.notes.trim()) return;
            const isOpen = notesEl.classList.toggle('open');
            indicator.textContent = isOpen ? '▾' : '▸';
        });

        // Ctrl+Click on value — inline quick-edit
        valueEl.addEventListener('click', function (e) {
            if (!e.ctrlKey && !e.metaKey) return;
            e.stopPropagation();

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'def-quick-input';
            input.value = def.value;
            input.style.width = '50px';
            valueEl.replaceWith(input);
            input.focus();
            input.select();

            let committed = false;
            function commitOnce() {
                if (committed) return;
                committed = true;
                def.value = parseInt(input.value, 10) || 0;
                scheduleSave();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, true);
            }

            input.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === 'Escape') commitOnce();
            });
            input.addEventListener('blur', function () {
                setTimeout(commitOnce, 50);
            });
        });

        // Ctrl+Click on name — inline quick-edit
        nameEl.addEventListener('click', function (e) {
            if (!e.ctrlKey && !e.metaKey) return;
            e.stopPropagation();

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'def-quick-input';
            input.value = def.name;
            nameEl.replaceWith(input);
            input.focus();
            input.select();

            let committed = false;
            function commitOnce() {
                if (committed) return;
                committed = true;
                def.name = input.value;
                scheduleSave();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, true);
            }

            input.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === 'Escape') commitOnce();
            });
            input.addEventListener('blur', function () {
                setTimeout(commitOnce, 50);
            });
        });

        return { row, notesEl };
    }

    // ── Edit Mode Row ──
    function renderEditRow(def, index, data, bodyEl, moduleEl) {
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
            openDefenseIconPicker(iconBtn, def, data, bodyEl, moduleEl);
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
            const idx = data.content.defenses.findIndex(function (d) { return d.id === def.id; });
            if (idx !== -1) data.content.defenses.splice(idx, 1);
            MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
            snapModuleHeight(moduleEl, data);
            scheduleSave();
        });
        row.appendChild(deleteBtn);

        // Notes textarea (full width below the row controls)
        const notesInput = document.createElement('textarea');
        notesInput.className = 'def-notes-input';
        notesInput.value = def.notes || '';
        notesInput.placeholder = t('def.notesPlaceholder');
        notesInput.rows = 1;
        notesInput.addEventListener('input', function () {
            def.notes = notesInput.value;
            scheduleSave();
        });
        row.appendChild(notesInput);

        return row;
    }

    // ── Icon Picker Popover ──
    function openDefenseIconPicker(btn, def, data, bodyEl, moduleEl) {
        const existing = document.querySelector('.def-icon-picker');
        if (existing) existing.remove();

        const picker = document.createElement('div');
        picker.className = 'def-icon-picker';

        const rect = btn.getBoundingClientRect();
        picker.style.top = rect.bottom + 4 + 'px';
        picker.style.left = rect.left + 'px';

        // "None" option
        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.title = t('def.noIcon');
        noneBtn.className = def.icon === null ? 'selected' : '';
        noneBtn.innerHTML = '&mdash;';
        noneBtn.addEventListener('click', function () {
            def.icon = null;
            closePicker();
            MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
            scheduleSave();
        });
        picker.appendChild(noneBtn);

        // All icons
        Object.keys(CV_ICONS).forEach(function (key) {
            const iconBtn = document.createElement('button');
            iconBtn.type = 'button';
            iconBtn.className = key === def.icon ? 'selected' : '';
            iconBtn.title = key;
            iconBtn.innerHTML = CV_ICONS[key];
            iconBtn.addEventListener('click', function () {
                def.icon = key;
                closePicker();
                MODULE_TYPES['defenses'].renderBody(bodyEl, data, false);
                scheduleSave();
            });
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

    // ── SortableJS Drag-to-Reorder ──
    function initDefenseSortable(container, data, bodyEl, moduleEl) {
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

    // ── Module Type Registration ──
    registerModuleType('defenses', {
        label: 'type.defenses',

        renderBody: function (bodyEl, data, isPlayMode) {
            const content = ensureContent(data);
            bodyEl.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'def-container';
            const moduleEl = bodyEl.closest('.module');

            if (content.defenses.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'def-empty';
                empty.innerHTML = '<div>' + escapeHtml(t('def.emptyTitle')) + '</div>'
                    + '<div>' + escapeHtml(t('def.emptyHint')) + '</div>';
                container.appendChild(empty);
            } else if (isPlayMode) {
                content.defenses.forEach(function (def) {
                    const { row, notesEl } = renderPlayRow(def, data, bodyEl);
                    container.appendChild(row);
                    container.appendChild(notesEl);
                });
            } else {
                content.defenses.forEach(function (def, index) {
                    container.appendChild(renderEditRow(def, index, data, bodyEl, moduleEl));
                });
                if (content.defenses.length > 1) {
                    initDefenseSortable(container, data, bodyEl, moduleEl);
                }
            }

            bodyEl.appendChild(container);
            if (moduleEl) snapModuleHeight(moduleEl, data);
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
    window.formatDefenseValue = formatDefenseValue;
    window.generateDefenseId = generateDefenseId;
})();
