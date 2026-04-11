// ── Counters Module Type ──
(function () {
    'use strict';

    // ── ID Generation ──
    function generateCounterId() {
        return 'counter_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Confirmation Dialog ──
    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = options.title || t('counter.delete');

        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        const title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = titleText;

        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = options.cancelText || t('delete.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = options.confirmText || t('delete.confirm');

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        panel.appendChild(title);
        panel.appendChild(msg);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(function () {
                overlay.remove();
            }, 200);
        }

        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', function () {
            onConfirm();
            close();
        });

        // Close on overlay click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        requestAnimationFrame(function () {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { counters: [], sortBy: 'custom', sortDir: 'asc' };
        }
        if (!Array.isArray(data.content.counters)) data.content.counters = [];
        if (!data.content.sortBy) data.content.sortBy = 'custom';
        if (!data.content.sortDir) data.content.sortDir = 'asc';
        return data.content;
    }

    // ── Counter Icon Library — references shared CV_ICONS ──
    const COUNTER_ICON_SVG = CV_ICONS;

    // Icon picker data — organized by category for display in modals
    const COUNTER_ICON_CATEGORIES = [
        { label: 'counter.iconGeneric', keys: ['star', 'circle', 'square', 'triangle', 'diamond'] },
        { label: 'counter.iconTime', keys: ['hourglass', 'clock', 'stopwatch', 'bell', 'timer'] },
        { label: 'counter.iconCombat', keys: ['sword', 'shield', 'flame', 'bolt', 'target'] },
        { label: 'counter.iconResource', keys: ['coin', 'gem', 'potion', 'apple', 'water'] },
        { label: 'counter.iconMisc', keys: ['scroll', 'skull', 'skull-crossbones', 'eye', 'hand'] },
        { label: 'counter.iconSciFi', keys: ['rocket', 'laser', 'radiation', 'circuit', 'energy', 'robot', 'wrench'] },
    ];

    // Icon key→label map for tooltips
    const COUNTER_ICON_LABELS = {
        star: 'Star',
        circle: 'Circle',
        square: 'Square',
        triangle: 'Triangle',
        diamond: 'Diamond',
        hourglass: 'Hourglass',
        clock: 'Clock',
        stopwatch: 'Stopwatch',
        bell: 'Bell',
        timer: 'Timer',
        sword: 'Sword',
        shield: 'Shield',
        flame: 'Flame',
        bolt: 'Bolt',
        target: 'Target',
        coin: 'Coin',
        gem: 'Gem',
        potion: 'Potion',
        apple: 'Apple',
        water: 'Water',
        scroll: 'Scroll',
        skull: 'Skull',
        'skull-crossbones': 'Skull & Crossbones',
        eye: 'Eye',
        hand: 'Hand',
        rocket: 'Rocket',
        laser: 'Laser',
        radiation: 'Radiation',
        circuit: 'Circuit',
        energy: 'Energy',
        robot: 'Robot',
        wrench: 'Wrench',
    };

    // ── Sorted Counter List ──
    function getSortedCounters(content) {
        const counters = content.counters.slice();
        const sortBy = content.sortBy;
        const sortDir = content.sortDir;

        if (sortBy === 'custom' || !sortBy) {
            counters.sort(function (a, b) {
                return a.order - b.order;
            });
        } else if (sortBy === 'name') {
            counters.sort(function (a, b) {
                const cmp = (a.name || '').localeCompare(b.name || '');
                return sortDir === 'desc' ? -cmp : cmp;
            });
        } else if (sortBy === 'value') {
            counters.sort(function (a, b) {
                const cmp = a.value - b.value;
                return sortDir === 'desc' ? -cmp : cmp;
            });
        }
        return counters;
    }

    // ── Icon Picker Builder ──
    function buildIconPicker(container, selectedKey, onSelect) {
        const picker = document.createElement('div');
        picker.className = 'counter-icon-picker';

        // "None" option
        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.className = 'counter-icon-pick-btn' + (selectedKey === null ? ' selected' : '');
        noneBtn.dataset.iconKey = '';
        noneBtn.title = t('counter.iconNone');
        noneBtn.innerHTML = '<span class="counter-icon-none-label">&mdash;</span>';
        noneBtn.addEventListener('click', function () {
            picker.querySelectorAll('.counter-icon-pick-btn').forEach(function (b) {
                b.classList.remove('selected');
            });
            noneBtn.classList.add('selected');
            onSelect(null);
        });
        picker.appendChild(noneBtn);

        COUNTER_ICON_CATEGORIES.forEach(function (cat) {
            cat.keys.forEach(function (key) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'counter-icon-pick-btn' + (key === selectedKey ? ' selected' : '');
                btn.dataset.iconKey = key;
                btn.title = COUNTER_ICON_LABELS[key] || key;
                btn.innerHTML = COUNTER_ICON_SVG[key] || '';
                btn.addEventListener('click', function () {
                    picker.querySelectorAll('.counter-icon-pick-btn').forEach(function (b) {
                        b.classList.remove('selected');
                    });
                    btn.classList.add('selected');
                    onSelect(key);
                });
                picker.appendChild(btn);
            });
        });

        container.appendChild(picker);
        return picker;
    }

    // ── Creation Modal ──
    function openCounterCreateModal(moduleEl, data) {
        const content = ensureContent(data);
        const modalState = { name: '', icon: null };

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay counter-modal-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel counter-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        header.innerHTML =
            '<h3 class="cv-modal-title">' +
            escapeHtml(t('counter.createTitle')) +
            '</h3>' +
            '<button type="button" class="cv-modal-close" title="' +
            escapeHtml(t('counter.close')) +
            '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // Name field
        const nameLabel = document.createElement('label');
        nameLabel.className = 'cv-modal-label';
        nameLabel.textContent = t('counter.name');
        body.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-modal-input';
        nameInput.placeholder = t('counter.namePlaceholder');
        nameInput.addEventListener('input', function () {
            modalState.name = nameInput.value;
        });
        nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') doCreate();
            if (e.key === 'Escape') doClose();
        });
        body.appendChild(nameInput);

        // Icon picker
        const iconLabel = document.createElement('label');
        iconLabel.className = 'cv-modal-label';
        iconLabel.textContent = t('counter.icon');
        body.appendChild(iconLabel);

        buildIconPicker(body, null, function (key) {
            modalState.icon = key;
        });

        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'counter-modal-btn-cancel btn-secondary sm';
        cancelBtn.textContent = t('counter.cancel');
        cancelBtn.addEventListener('click', doClose);

        const createBtn = document.createElement('button');
        createBtn.type = 'button';
        createBtn.className = 'counter-modal-btn-create btn-primary solid';
        createBtn.textContent = t('counter.create');
        createBtn.addEventListener('click', doCreate);

        footer.appendChild(cancelBtn);
        footer.appendChild(createBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Close via X button
        header.querySelector('.cv-modal-close').addEventListener('click', doClose);

        // Close on overlay click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) doClose();
        });

        // Auto-focus name
        requestAnimationFrame(function () {
            nameInput.focus();
        });

        function doCreate() {
            const counter = {
                id: generateCounterId(),
                name: modalState.name.trim() || t('counter.unnamed'),
                icon: modalState.icon,
                value: 0,
                max: null,
                min: 0,
                order: content.counters.length,
            };
            content.counters.push(counter);
            scheduleSave();
            doClose();
            reRenderCounterModule(moduleEl, data);
        }

        function doClose() {
            overlay.remove();
        }
    }

    // ── Edit Modal ──
    function openCounterEditModal(moduleEl, data, counterId) {
        const content = ensureContent(data);
        const counter = content.counters.find(function (c) {
            return c.id === counterId;
        });
        if (!counter) return;

        // Snapshot for dirty checking
        const snapshot = {
            name: counter.name,
            icon: counter.icon,
            value: counter.value,
            max: counter.max,
            min: counter.min,
        };

        const editState = {
            name: counter.name,
            icon: counter.icon,
            value: counter.value,
            max: counter.max,
            min: counter.min,
        };

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay counter-modal-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel counter-modal-panel counter-edit-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        header.innerHTML =
            '<h3 class="cv-modal-title">' +
            escapeHtml(t('counter.editTitle')) +
            '</h3>' +
            '<button type="button" class="cv-modal-close" title="' +
            escapeHtml(t('counter.close')) +
            '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body counter-edit-body';

        // Name
        const nameLabel = document.createElement('label');
        nameLabel.className = 'cv-modal-label';
        nameLabel.textContent = t('counter.name');
        body.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-modal-input';
        nameInput.value = editState.name;
        nameInput.placeholder = t('counter.namePlaceholder');
        nameInput.addEventListener('input', function () {
            editState.name = nameInput.value;
        });
        nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') doClose();
        });
        body.appendChild(nameInput);

        // Icon
        const iconLabel = document.createElement('label');
        iconLabel.className = 'cv-modal-label';
        iconLabel.textContent = t('counter.icon');
        body.appendChild(iconLabel);

        buildIconPicker(body, editState.icon, function (key) {
            editState.icon = key;
        });

        // Number fields row
        const fieldsRow = document.createElement('div');
        fieldsRow.className = 'counter-edit-fields';

        // Current Value
        const valField = document.createElement('div');
        valField.className = 'counter-edit-field';
        const valLabel = document.createElement('label');
        valLabel.className = 'cv-modal-label';
        valLabel.textContent = t('counter.currentValue');
        const valInput = document.createElement('input');
        valInput.type = 'number';
        valInput.className = 'cv-modal-input cv-modal-num';
        valInput.value = editState.value;
        valInput.addEventListener('input', function () {
            editState.value = parseInt(valInput.value, 10) || 0;
        });
        valField.appendChild(valLabel);
        valField.appendChild(valInput);
        fieldsRow.appendChild(valField);

        // Max Value
        const maxField = document.createElement('div');
        maxField.className = 'counter-edit-field';
        const maxLabel = document.createElement('label');
        maxLabel.className = 'cv-modal-label';
        maxLabel.textContent = t('counter.maxValue');
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'cv-modal-input cv-modal-num';
        maxInput.value = editState.max !== null ? editState.max : '';
        maxInput.placeholder = t('counter.unlimited');
        maxInput.addEventListener('input', function () {
            if (maxInput.value === '') {
                editState.max = null;
            } else {
                editState.max = parseInt(maxInput.value, 10) || 0;
                // Auto-clamp value to max
                if (editState.value > editState.max) {
                    editState.value = editState.max;
                    valInput.value = editState.value;
                }
            }
        });
        maxField.appendChild(maxLabel);
        maxField.appendChild(maxInput);
        fieldsRow.appendChild(maxField);

        // Min Value
        const minField = document.createElement('div');
        minField.className = 'counter-edit-field';
        const minLabel = document.createElement('label');
        minLabel.className = 'cv-modal-label';
        minLabel.textContent = t('counter.minValue');
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'cv-modal-input cv-modal-num';
        minInput.value = editState.min;
        minInput.addEventListener('input', function () {
            editState.min = parseInt(minInput.value, 10) || 0;
        });
        minField.appendChild(minLabel);
        minField.appendChild(minInput);
        fieldsRow.appendChild(minField);

        body.appendChild(fieldsRow);
        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer counter-edit-footer';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'counter-modal-btn-delete';
        deleteBtn.textContent = t('counter.delete');
        deleteBtn.addEventListener('click', function () {
            showConfirm(t('counter.deleteConfirm'), function () {
                const idx = content.counters.findIndex(function (c) {
                    return c.id === counterId;
                });
                if (idx !== -1) content.counters.splice(idx, 1);
                // Re-index order values
                content.counters.forEach(function (c, i) {
                    c.order = i;
                });
                scheduleSave();
                overlay.remove();
                reRenderCounterModule(moduleEl, data);
            });
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'counter-modal-btn-cancel btn-secondary sm';
        closeBtn.textContent = t('counter.close');
        closeBtn.addEventListener('click', doClose);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'counter-modal-btn-create btn-primary solid';
        saveBtn.textContent = t('counter.save');
        saveBtn.addEventListener('click', doSave);

        footer.appendChild(deleteBtn);
        const rightBtns = document.createElement('div');
        rightBtns.className = 'counter-edit-footer-right';
        rightBtns.appendChild(closeBtn);
        rightBtns.appendChild(saveBtn);
        footer.appendChild(rightBtns);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Wire close actions
        header.querySelector('.cv-modal-close').addEventListener('click', doClose);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) doClose();
        });

        // Auto-focus name
        requestAnimationFrame(function () {
            nameInput.focus();
        });

        function isDirty() {
            return (
                editState.name !== snapshot.name ||
                editState.icon !== snapshot.icon ||
                editState.value !== snapshot.value ||
                editState.max !== snapshot.max ||
                editState.min !== snapshot.min
            );
        }

        function doSave() {
            counter.name = editState.name.trim() || t('counter.unnamed');
            counter.icon = editState.icon;
            counter.value = editState.value;
            counter.max = editState.max;
            counter.min = editState.min;
            scheduleSave();
            overlay.remove();
            reRenderCounterModule(moduleEl, data);
        }

        function doClose() {
            if (isDirty()) {
                showConfirm(
                    {
                        message: t('counter.discardPrompt'),
                        title: t('counter.editTitle'),
                        confirmText: t('counter.cancel'), // "Cancel" as in "Cancel the edit which discards it"
                    },
                    function () {
                        overlay.remove();
                    }
                );
                // Note: Native confirm() blocks, but ours doesn't.
                // We moved the removal into the callback.
            } else {
                overlay.remove();
            }
        }
    }

    // ── Re-render Helper ──
    function reRenderCounterModule(moduleEl, data) {
        const bodyEl = moduleEl.querySelector('.module-body');
        const isPlayModeLocal = isPlayMode;
        MODULE_TYPES['counters'].renderBody(bodyEl, data, isPlayModeLocal);
        snapModuleHeight(moduleEl, data);
    }

    // ── Play Mode: Counter Row ──
    function renderCounterRowPlay(counter, data, moduleEl) {
        const content = data.content;
        const row = document.createElement('div');
        row.className = 'counter-row-play';
        row.dataset.counterId = counter.id;

        const atMax = counter.max !== null && counter.value >= counter.max;
        const atMin = counter.value <= counter.min;

        // Icon
        if (counter.icon && COUNTER_ICON_SVG[counter.icon]) {
            const iconWrap = document.createElement('span');
            iconWrap.className = 'counter-row-icon';
            iconWrap.innerHTML = COUNTER_ICON_SVG[counter.icon];
            row.appendChild(iconWrap);
        }

        // Name
        const nameEl = document.createElement('span');
        nameEl.className = 'counter-row-name';
        nameEl.textContent = counter.name;
        nameEl.title = counter.name;
        row.appendChild(nameEl);

        // Value display
        const valueEl = document.createElement('span');
        valueEl.className = 'counter-row-value';
        if (counter.max !== null) {
            valueEl.innerHTML =
                '<span class="counter-val-current">' +
                escapeHtml(String(counter.value)) +
                '</span>' +
                '<span class="counter-val-sep"> / </span>' +
                '<span class="counter-val-max">' +
                escapeHtml(String(counter.max)) +
                '</span>';
        } else {
            valueEl.innerHTML = '<span class="counter-val-current">' + escapeHtml(String(counter.value)) + '</span>';
        }
        row.appendChild(valueEl);

        // Action buttons group
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'counter-row-actions';

        // Decrement button
        const decrementBtn = document.createElement('button');
        decrementBtn.type = 'button';
        decrementBtn.className = 'counter-decrement-btn';
        decrementBtn.title = t('counter.decrement');
        decrementBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        decrementBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (counter.value <= counter.min) return;
            counter.value--;
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });
        actionsGroup.appendChild(decrementBtn);

        // Increment button
        const incrementBtn = document.createElement('button');
        incrementBtn.type = 'button';
        incrementBtn.className = 'counter-increment-btn';
        incrementBtn.title = t('counter.increment');
        incrementBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        incrementBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (counter.max !== null && counter.value >= counter.max) return;
            counter.value++;
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });
        actionsGroup.appendChild(incrementBtn);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'counter-reset-btn';
        resetBtn.title = t('counter.reset');
        resetBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
        resetBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showConfirm(
                {
                    title: t('counter.resetCounter'),
                    message: t('counter.resetConfirm'),
                    confirmText: t('counter.reset'),
                    cancelText: t('delete.cancel'),
                },
                function () {
                    counter.value = counter.min;
                    scheduleSave();
                    reRenderCounterModule(moduleEl, data);
                }
            );
        });
        actionsGroup.appendChild(resetBtn);

        row.appendChild(actionsGroup);

        // Boundary styling
        if (atMax) row.classList.add('counter-at-max');
        if (atMin) row.classList.add('counter-at-min');

        // Increment on click
        row.addEventListener('click', function (e) {
            if (e.target.closest('.counter-row-actions')) return;
            if (counter.max !== null && counter.value >= counter.max) return;
            counter.value++;
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });

        // Decrement on right-click
        row.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            if (counter.value <= counter.min) return;
            counter.value--;
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });

        return row;
    }

    // ── Edit Mode: Counter Row ──
    function renderCounterRowEdit(counter, data, moduleEl) {
        const content = data.content;
        const row = document.createElement('div');
        row.className = 'counter-row-edit';
        row.dataset.counterId = counter.id;

        // Drag handle
        const handle = document.createElement('span');
        handle.className = 'counter-drag-handle';
        handle.innerHTML = '&#x2807;';
        row.appendChild(handle);

        // Icon
        if (counter.icon && COUNTER_ICON_SVG[counter.icon]) {
            const iconWrap = document.createElement('span');
            iconWrap.className = 'counter-row-icon counter-row-icon-sm';
            iconWrap.innerHTML = COUNTER_ICON_SVG[counter.icon];
            row.appendChild(iconWrap);
        }

        // Name
        const nameEl = document.createElement('span');
        nameEl.className = 'counter-row-name';
        nameEl.textContent = counter.name;
        nameEl.title = counter.name;
        row.appendChild(nameEl);

        // Value preview
        const valueEl = document.createElement('span');
        valueEl.className = 'counter-row-value counter-row-value-edit';
        if (counter.max !== null) {
            valueEl.textContent = counter.value + ' / ' + counter.max;
        } else {
            valueEl.textContent = String(counter.value);
        }
        row.appendChild(valueEl);

        // Action buttons group — disabled in edit mode to preserve layout
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'counter-row-actions';

        const decrementBtnEdit = document.createElement('button');
        decrementBtnEdit.type = 'button';
        decrementBtnEdit.className = 'counter-decrement-btn';
        decrementBtnEdit.title = t('counter.decrement');
        decrementBtnEdit.disabled = true;
        decrementBtnEdit.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        actionsGroup.appendChild(decrementBtnEdit);

        const incrementBtnEdit = document.createElement('button');
        incrementBtnEdit.type = 'button';
        incrementBtnEdit.className = 'counter-increment-btn';
        incrementBtnEdit.title = t('counter.increment');
        incrementBtnEdit.disabled = true;
        incrementBtnEdit.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        actionsGroup.appendChild(incrementBtnEdit);

        const resetBtnEdit = document.createElement('button');
        resetBtnEdit.type = 'button';
        resetBtnEdit.className = 'counter-reset-btn';
        resetBtnEdit.title = t('counter.reset');
        resetBtnEdit.disabled = true;
        resetBtnEdit.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
        actionsGroup.appendChild(resetBtnEdit);

        row.appendChild(actionsGroup);

        // Delete button (outside the actions group, separate from play-mode layout)
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'counter-row-delete';
        deleteBtn.title = t('counter.deleteCounter');
        deleteBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const idx = content.counters.findIndex(function (c) {
                return c.id === counter.id;
            });
            if (idx !== -1) content.counters.splice(idx, 1);
            content.counters.forEach(function (c, i) {
                c.order = i;
            });
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });
        row.appendChild(deleteBtn);

        // Click to open edit modal
        row.addEventListener('click', function (e) {
            if (e.target.closest('.counter-row-delete') || e.target.closest('.counter-drag-handle')) return;
            openCounterEditModal(moduleEl, data, counter.id);
        });

        return row;
    }

    // ── Column Headers ──
    function renderCounterColumnHeaders(container, content, moduleEl, data) {
        const SVG_UP = CV_SVG_SORT_UP;
        const SVG_DOWN = CV_SVG_SORT_DOWN;

        const headerRow = document.createElement('div');
        headerRow.className = 'counter-header-row';

        // Icon spacer — only when any counter has an icon, to keep name column aligned
        if (
            content.counters.some(function (c) {
                return c.icon;
            })
        ) {
            const iconSpacer = document.createElement('div');
            iconSpacer.className = 'counter-col-header counter-col-icon-spacer';
            headerRow.appendChild(iconSpacer);
        }

        // Column definitions
        const cols = [
            { key: 'name', cls: 'counter-col-name', labelKey: 'list.colName' },
            { key: 'value', cls: 'counter-col-value', labelKey: 'counter.colValue' },
        ];

        cols.forEach(function (col) {
            const isActive = content.sortBy === col.key;
            const colEl = document.createElement('div');
            colEl.className = 'counter-col-header ' + col.cls + (isActive ? ' active-sort' : '');
            colEl.title = escapeHtml(
                isActive ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual')) : t('list.sortAsc')
            );

            const label = document.createElement('span');
            label.className = 'list-col-header-label';
            label.textContent = t(col.labelKey);
            colEl.appendChild(label);

            if (isActive) {
                const indicator = document.createElement('span');
                indicator.className = 'list-sort-indicator';
                indicator.innerHTML = content.sortDir === 'asc' ? SVG_UP : SVG_DOWN;
                colEl.appendChild(indicator);
            }

            colEl.addEventListener('click', function () {
                if (content.sortBy === col.key) {
                    if (content.sortDir === 'asc') {
                        content.sortDir = 'desc';
                    } else {
                        content.sortBy = 'custom';
                        content.sortDir = 'asc';
                    }
                } else {
                    content.sortBy = col.key;
                    content.sortDir = 'asc';
                }
                scheduleSave();
                reRenderCounterModule(moduleEl, data);
            });

            headerRow.appendChild(colEl);
        });

        // Actions spacer — aligns with reset button column
        const actionsSpacer = document.createElement('div');
        actionsSpacer.className = 'counter-col-header counter-col-actions';
        headerRow.appendChild(actionsSpacer);

        container.appendChild(headerRow);
    }

    // ── SortableJS for Edit Mode Reorder ──
    function initCounterSortable(container, data) {
        const content = data.content;
        container._sortable = new Sortable(container, {
            handle: '.counter-drag-handle',
            animation: 150,
            ghostClass: 'counter-ghost',
            draggable: '.counter-row-edit',
            onEnd: function () {
                const rows = Array.from(container.querySelectorAll('.counter-row-edit'));
                const reordered = rows
                    .map(function (row) {
                        return content.counters.find(function (c) {
                            return c.id === row.dataset.counterId;
                        });
                    })
                    .filter(Boolean);
                content.counters = reordered;
                content.counters.forEach(function (c, i) {
                    c.order = i;
                });
                // Revert sort to custom when manually reordered
                content.sortBy = 'custom';
                content.sortDir = 'asc';
                scheduleSave();
            },
        });
    }

    // ── Module Type Registration ──
    registerModuleType('counters', {
        label: 'type.counters',

        renderBody: function (bodyEl, data, isPlayMode) {
            const content = ensureContent(data);
            const container = document.createElement('div');
            container.className = 'counter-container';
            const moduleEl = bodyEl.closest('.module');

            // Sort controls — shown in both play and edit mode
            if (content.counters.length > 0) {
                renderCounterColumnHeaders(container, content, moduleEl, data);
            }

            if (isPlayMode) {
                // Counter list
                let list = document.createElement('div');
                list.className = 'counter-list';
                let sorted = getSortedCounters(content);
                sorted.forEach(function (counter) {
                    list.appendChild(renderCounterRowPlay(counter, data, moduleEl));
                });

                if (content.counters.length === 0) {
                    let empty = document.createElement('div');
                    empty.className = 'counter-empty-state';
                    empty.textContent = t('counter.emptyState');
                    list.appendChild(empty);
                }

                container.appendChild(list);
            } else {
                // Edit mode list
                let list = document.createElement('div');
                list.className = 'counter-list counter-list-edit';

                // In edit mode, always show custom order
                let sorted = content.counters.slice().sort(function (a, b) {
                    return a.order - b.order;
                });
                sorted.forEach(function (counter) {
                    list.appendChild(renderCounterRowEdit(counter, data, moduleEl));
                });

                if (content.counters.length === 0) {
                    let empty = document.createElement('div');
                    empty.className = 'counter-empty-state';
                    empty.textContent = t('counter.emptyState');
                    list.appendChild(empty);
                }

                container.appendChild(list);

                // Init drag-to-reorder
                if (content.counters.length > 1) {
                    initCounterSortable(list, data);
                }
            }

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        onPlayMode: function (moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode: function (moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },

        syncState: function (moduleEl, data) {
            // Counter data is mutated directly via modals, nothing to sync from DOM
        },
    });

    // Expose for module-core toolbar wiring
    window.openCounterCreateModal = openCounterCreateModal;
    window.COUNTER_ICON_SVG = COUNTER_ICON_SVG;
})();
