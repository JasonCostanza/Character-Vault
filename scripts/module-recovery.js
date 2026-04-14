// ── Recovery Module ──
(function () {
    // ── Helpers ──

    function genBtnId() {
        return 'btn_' + Math.random().toString(36).slice(2, 9);
    }

    function hasHealByRoll(content) {
        return content.restButtons && content.restButtons.some(btn =>
            btn.actions && btn.actions.some(a => a.type === 'healByRoll')
        );
    }

    function rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    const ACTION_TYPES = ['resetTempHP', 'restoreAllSpellSlots', 'restoreHitDice'];

    // ── Execute Rest Button ──

    function executeRestButton(btn, content, diceCount) {
        const results = [];
        btn.actions.forEach(action => {
            switch (action.type) {
                case 'healToFull': {
                    window.modules.filter(m => m.type === 'health').forEach(m => {
                        if (typeof window.healToFull === 'function') window.healToFull(m.id);
                    });
                    results.push(t('recovery.action.healToFull'));
                    break;
                }
                case 'resetTempHP': {
                    window.modules.filter(m => m.type === 'health').forEach(m => {
                        if (typeof window.resetTempHP === 'function') window.resetTempHP(m.id);
                    });
                    results.push(t('recovery.action.resetTempHP'));
                    break;
                }
                case 'restoreAllSpellSlots': {
                    window.modules.filter(m => m.type === 'spells').forEach(m => {
                        if (typeof window.restoreAllSpellSlots === 'function') window.restoreAllSpellSlots(m.id);
                    });
                    results.push(t('recovery.action.restoreAllSpellSlots'));
                    break;
                }
                case 'healByRoll': {
                    if (!content.hitDice) break;
                    const hd = content.hitDice;
                    if (hd.remaining <= 0 || diceCount <= 0) break;
                    const count = Math.min(diceCount, hd.remaining);
                    let total = 0;
                    for (let i = 0; i < count; i++) {
                        total += rollDie(hd.dieSize) + (hd.modifier || 0);
                    }
                    total = Math.max(0, total);
                    hd.remaining -= count;
                    window.modules.filter(m => m.type === 'health').forEach(m => {
                        if (typeof window.applyHealingAmount === 'function') window.applyHealingAmount(m.id, total);
                    });
                    results.push(t('recovery.action.healByRoll', { count, dieSize: hd.dieSize, total }));
                    break;
                }
                case 'restoreHitDice': {
                    if (!content.hitDice) break;
                    const hd = content.hitDice;
                    const policy = hd.restoreOnLongRest || 'half';
                    if (policy === 'all') {
                        hd.remaining = hd.total;
                    } else if (policy === 'half') {
                        hd.remaining = Math.min(hd.total, hd.remaining + Math.max(1, Math.floor(hd.total / 2)));
                    }
                    results.push(t('recovery.action.restoreHitDice'));
                    break;
                }
            }
        });
        return results;
    }

    // ── Confirmation Dialog ──

    function openRestConfirm(moduleEl, data, btn) {
        const content = data.content;
        const hasRoll = btn.actions.some(a => a.type === 'healByRoll');
        const hd = content.hitDice;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay recovery-confirm-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = btn.name;
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('recovery.cancel');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const actionList = document.createElement('ul');
        actionList.className = 'recovery-confirm-actions-list';
        btn.actions.forEach(action => {
            const item = document.createElement('li');
            item.className = 'recovery-confirm-action-item';
            item.textContent = t('recovery.actionLabel.' + action.type);
            actionList.appendChild(item);
        });
        body.appendChild(actionList);

        // Hit Dice spend prompt
        let getDiceCount = () => 0;
        if (hasRoll) {
            const spendSection = document.createElement('div');
            spendSection.className = 'recovery-hitdice-spend';

            if (hd && hd.remaining > 0) {
                const spendLabel = document.createElement('div');
                spendLabel.className = 'recovery-hitdice-spend-label';
                spendLabel.textContent = t('recovery.howManyDice');
                spendSection.appendChild(spendLabel);

                const spendRow = document.createElement('div');
                spendRow.className = 'recovery-hitdice-spend-row';

                const stepper = document.createElement('div');
                stepper.className = 'recovery-dice-stepper';

                const decBtn = document.createElement('button');
                decBtn.type = 'button';
                decBtn.className = 'recovery-dice-stepper-btn';
                decBtn.textContent = '\u2212';

                const valueEl = document.createElement('span');
                valueEl.className = 'recovery-dice-stepper-value';
                let diceCount = 1;
                valueEl.textContent = diceCount;

                const incBtn = document.createElement('button');
                incBtn.type = 'button';
                incBtn.className = 'recovery-dice-stepper-btn';
                incBtn.textContent = '+';

                function updateStepper() {
                    valueEl.textContent = diceCount;
                    decBtn.disabled = diceCount <= 0;
                    incBtn.disabled = diceCount >= hd.remaining;
                }
                updateStepper();
                decBtn.addEventListener('click', () => { diceCount = Math.max(0, diceCount - 1); updateStepper(); });
                incBtn.addEventListener('click', () => { diceCount = Math.min(hd.remaining, diceCount + 1); updateStepper(); });

                stepper.appendChild(decBtn);
                stepper.appendChild(valueEl);
                stepper.appendChild(incBtn);
                spendRow.appendChild(stepper);

                const availableSpan = document.createElement('span');
                availableSpan.className = 'recovery-hitdice-spend-available';
                availableSpan.textContent = t('recovery.diceAvailable', { remaining: hd.remaining, total: hd.total, dieSize: hd.dieSize });
                spendRow.appendChild(availableSpan);

                spendSection.appendChild(spendRow);
                getDiceCount = () => diceCount;
            } else {
                const noHDLabel = document.createElement('div');
                noHDLabel.className = 'recovery-hitdice-spend-label';
                noHDLabel.textContent = t('recovery.noDiceAvailable');
                spendSection.appendChild(noHDLabel);
            }
            body.appendChild(spendSection);
        }

        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('recovery.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn-primary sm';
        confirmBtn.textContent = t('recovery.doRest');

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeDialog() { overlay.remove(); }

        closeXBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });

        confirmBtn.addEventListener('click', () => {
            const diceCount = getDiceCount();
            const results = executeRestButton(btn, content, diceCount);
            closeDialog();
            scheduleSave();

            // Re-render this recovery module
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['recovery'].renderBody(bodyEl, data, true);

            // Log activity
            if (typeof window.logActivity === 'function' && results.length > 0) {
                window.logActivity({
                    type: 'recovery.event.rest',
                    message: t('recovery.log.rest', { buttonName: escapeHtml(btn.name), details: results.join(', ') }),
                    sourceModuleId: data.id,
                });
            }

            if (results.length > 0) {
                showToast(results.join(' \u00b7 '), 'success');
            }
        });
    }

    // ── Hit Dice Settings Modal ──

    function openRecoverySettingsModal(moduleEl, data) {
        const content = data.content;

        const existing = document.querySelector('.recovery-settings-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay recovery-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.width = '280px';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.setAttribute('data-i18n', 'recovery.moduleSettings');
        titleEl.textContent = t('recovery.moduleSettings');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('recovery.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        if (!hasHealByRoll(content)) {
            const msg = document.createElement('p');
            msg.className = 'recovery-hd-modal-empty';
            msg.textContent = t('recovery.noHealByRollConfigured');
            body.appendChild(msg);
        } else {
            if (!content.hitDice) {
                content.hitDice = { dieSize: 8, total: 1, remaining: 1, modifier: 0, restoreOnLongRest: 'half' };
            }
            const hd = content.hitDice;

            const grid = document.createElement('div');
            grid.className = 'recovery-hitdice-config-grid';

            // Die size dropdown
            const dieSizeField = document.createElement('div');
            dieSizeField.className = 'recovery-hitdice-config-field';
            const dieSizeLbl = document.createElement('div');
            dieSizeLbl.className = 'recovery-hitdice-config-label';
            dieSizeLbl.textContent = t('recovery.dieSize');
            const dieSizeSelect = document.createElement('div');
            dieSizeSelect.className = 'cv-select';
            const dieSizeTrigger = document.createElement('button');
            dieSizeTrigger.type = 'button';
            dieSizeTrigger.className = 'cv-select-trigger';
            dieSizeTrigger.innerHTML = `<span class="cv-select-value">d${hd.dieSize}</span><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
            const dieSizeMenu = document.createElement('ul');
            dieSizeMenu.className = 'cv-select-menu';
            [4, 6, 8, 10, 12].forEach(size => {
                const opt = document.createElement('li');
                opt.className = 'cv-select-option' + (hd.dieSize === size ? ' selected' : '');
                opt.textContent = 'd' + size;
                opt.addEventListener('click', () => {
                    hd.dieSize = size;
                    dieSizeTrigger.querySelector('.cv-select-value').textContent = 'd' + size;
                    dieSizeMenu.querySelectorAll('.cv-select-option').forEach(o => o.classList.toggle('selected', o.textContent === 'd' + size));
                    dieSizeSelect.classList.remove('open');
                    scheduleSave();
                });
                dieSizeMenu.appendChild(opt);
            });
            dieSizeTrigger.addEventListener('click', e => {
                e.stopPropagation();
                const rect = dieSizeTrigger.getBoundingClientRect();
                dieSizeMenu.style.position = 'fixed';
                dieSizeMenu.style.top = rect.bottom + 2 + 'px';
                dieSizeMenu.style.left = rect.left + 'px';
                dieSizeMenu.style.minWidth = rect.width + 'px';
                dieSizeSelect.classList.toggle('open');
            });
            document.addEventListener('click', () => dieSizeSelect.classList.remove('open'));
            dieSizeSelect.appendChild(dieSizeTrigger);
            dieSizeSelect.appendChild(dieSizeMenu);
            dieSizeField.appendChild(dieSizeLbl);
            dieSizeField.appendChild(dieSizeSelect);
            grid.appendChild(dieSizeField);

            function makeNumField(labelKey, val, min, onCommit) {
                const field = document.createElement('div');
                field.className = 'recovery-hitdice-config-field';
                const lbl = document.createElement('div');
                lbl.className = 'recovery-hitdice-config-label';
                lbl.textContent = t(labelKey);
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'recovery-hitdice-config-input';
                input.min = min;
                input.value = val;
                input.addEventListener('change', () => {
                    const v = parseInt(input.value);
                    if (!isNaN(v) && v >= parseInt(min)) {
                        onCommit(v, input);
                    } else {
                        input.value = val;
                    }
                });
                field.appendChild(lbl);
                field.appendChild(input);
                return field;
            }

            grid.appendChild(makeNumField('recovery.totalDice', hd.total, 1, (v) => {
                hd.total = v;
                hd.remaining = Math.min(hd.remaining, hd.total);
                scheduleSave();
            }));

            grid.appendChild(makeNumField('recovery.remainingDice', hd.remaining, 0, (v, input) => {
                hd.remaining = Math.min(v, hd.total);
                input.value = hd.remaining;
                scheduleSave();
            }));

            grid.appendChild(makeNumField('recovery.modifier', hd.modifier || 0, -99, (v) => {
                hd.modifier = v;
                scheduleSave();
            }));

            body.appendChild(grid);

            // Restore on Long Rest
            const restoreField = document.createElement('div');
            restoreField.className = 'recovery-hitdice-config-field';
            restoreField.style.marginTop = '8px';
            const restoreLbl = document.createElement('div');
            restoreLbl.className = 'recovery-hitdice-config-label';
            restoreLbl.textContent = t('recovery.restoreOnLongRest');
            restoreField.appendChild(restoreLbl);

            const restoreOptions = ['all', 'half', 'none'];
            const currentRestore = hd.restoreOnLongRest || 'half';
            const restoreSelect = document.createElement('div');
            restoreSelect.className = 'cv-select';
            const restoreTrigger = document.createElement('button');
            restoreTrigger.type = 'button';
            restoreTrigger.className = 'cv-select-trigger';
            restoreTrigger.innerHTML = `<span class="cv-select-value">${escapeHtml(t('recovery.restoreOption.' + currentRestore))}</span><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
            const restoreMenu = document.createElement('ul');
            restoreMenu.className = 'cv-select-menu';
            restoreOptions.forEach(opt => {
                const li = document.createElement('li');
                li.className = 'cv-select-option' + (currentRestore === opt ? ' selected' : '');
                li.textContent = t('recovery.restoreOption.' + opt);
                li.dataset.value = opt;
                li.addEventListener('click', () => {
                    hd.restoreOnLongRest = opt;
                    restoreTrigger.querySelector('.cv-select-value').textContent = t('recovery.restoreOption.' + opt);
                    restoreMenu.querySelectorAll('.cv-select-option').forEach(o => o.classList.toggle('selected', o.dataset.value === opt));
                    restoreSelect.classList.remove('open');
                    scheduleSave();
                });
                restoreMenu.appendChild(li);
            });
            restoreTrigger.addEventListener('click', e => {
                e.stopPropagation();
                const rect = restoreTrigger.getBoundingClientRect();
                restoreMenu.style.position = 'fixed';
                restoreMenu.style.top = rect.bottom + 2 + 'px';
                restoreMenu.style.left = rect.left + 'px';
                restoreMenu.style.minWidth = rect.width + 'px';
                restoreSelect.classList.toggle('open');
            });
            document.addEventListener('click', () => restoreSelect.classList.remove('open'));
            restoreSelect.appendChild(restoreTrigger);
            restoreSelect.appendChild(restoreMenu);
            restoreField.appendChild(restoreSelect);
            body.appendChild(restoreField);
        }

        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-secondary sm';
        closeBtn.textContent = t('recovery.close');
        closeBtn.addEventListener('click', closeModal);
        footer.appendChild(closeBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() { overlay.remove(); }
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    }
    window.openRecoverySettingsModal = openRecoverySettingsModal;

    // ── Play Mode ──

    function buildPlayMode(bodyEl, data) {
        const content = data.content;
        const container = document.createElement('div');
        container.className = 'recovery-container';

        if (!content.restButtons || content.restButtons.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'recovery-empty-state';
            empty.textContent = t('recovery.emptyState');
            container.appendChild(empty);
        } else {
            content.restButtons.forEach(btn => {
                const btnEl = document.createElement('button');
                btnEl.type = 'button';
                btnEl.className = 'recovery-rest-btn';
                btnEl.innerHTML = `<svg class="icon recovery-rest-btn-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
                const nameSpan = document.createElement('span');
                nameSpan.className = 'recovery-rest-btn-name';
                nameSpan.textContent = btn.name;
                btnEl.appendChild(nameSpan);
                btnEl.addEventListener('click', () => {
                    openRestConfirm(bodyEl.closest('.module'), data, btn);
                });
                container.appendChild(btnEl);
            });
        }

        if (hasHealByRoll(content) && content.hitDice) {
            const hd = content.hitDice;
            const hdRow = document.createElement('div');
            hdRow.className = 'recovery-hitdice-row';

            const label = document.createElement('span');
            label.className = 'recovery-hitdice-label';
            label.textContent = t('recovery.hitDiceLabel');

            const value = document.createElement('span');
            value.className = 'recovery-hitdice-value' + (hd.remaining === 0 ? ' depleted' : '');
            value.textContent = `${hd.remaining}/${hd.total}`;

            const die = document.createElement('span');
            die.className = 'recovery-hitdice-die';
            die.textContent = `(d${hd.dieSize})`;

            hdRow.appendChild(label);
            hdRow.appendChild(value);
            hdRow.appendChild(die);
            container.appendChild(hdRow);
        }

        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    }

    // ── Rest Button Edit Modal ──

    function openRestButtonEditModal(btn, content, onSaved, isNew) {
        const existing = document.querySelector('.recovery-btn-edit-overlay');
        if (existing) existing.remove();

        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay recovery-btn-edit-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.width = '280px';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('recovery.editRestButton');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('recovery.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const nameField = document.createElement('div');
        nameField.className = 'recovery-edit-field';
        const nameLabel = document.createElement('div');
        nameLabel.className = 'recovery-edit-label';
        nameLabel.textContent = t('recovery.buttonName');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'recovery-edit-name-input';
        nameInput.value = btn.name;
        nameInput.addEventListener('input', () => { dirty = true; });
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);
        body.appendChild(nameField);

        const hpRecoveryField = document.createElement('div');
        hpRecoveryField.className = 'recovery-edit-field';
        hpRecoveryField.style.marginTop = '10px';
        const hpRecoveryLabel = document.createElement('div');
        hpRecoveryLabel.className = 'recovery-edit-label';
        hpRecoveryLabel.textContent = t('recovery.hpRecovery');
        const currentHealType = btn.actions.find(a => a.type === 'healToFull' || a.type === 'healByRoll')?.type || '';
        const healSelect = document.createElement('select');
        healSelect.className = 'settings-select';
        healSelect.addEventListener('change', () => { dirty = true; });
        [
            { value: '', label: t('recovery.hpRecovery.none') },
            { value: 'healToFull', label: t('recovery.actionLabel.healToFull') },
            { value: 'healByRoll', label: t('recovery.actionLabel.healByRoll') },
        ].forEach(({ value, label }) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            if (value === currentHealType) opt.selected = true;
            healSelect.appendChild(opt);
        });
        hpRecoveryField.appendChild(hpRecoveryLabel);
        hpRecoveryField.appendChild(healSelect);
        body.appendChild(hpRecoveryField);

        const actionsField = document.createElement('div');
        actionsField.className = 'recovery-edit-field';
        actionsField.style.marginTop = '10px';
        const actionsLabel = document.createElement('div');
        actionsLabel.className = 'recovery-edit-label';
        actionsLabel.textContent = t('recovery.actions');
        actionsField.appendChild(actionsLabel);

        const checklist = document.createElement('div');
        checklist.className = 'recovery-action-checklist';
        const checkboxes = [];
        ACTION_TYPES.forEach(actionType => {
            const toggle = document.createElement('label');
            toggle.className = 'recovery-action-toggle';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = btn.actions.some(a => a.type === actionType);
            cb.addEventListener('change', () => { dirty = true; });
            const lbl = document.createElement('span');
            lbl.className = 'recovery-action-toggle-label';
            lbl.textContent = t('recovery.actionLabel.' + actionType);
            toggle.appendChild(cb);
            toggle.appendChild(lbl);
            checklist.appendChild(toggle);
            checkboxes.push(cb);
        });

        actionsField.appendChild(checklist);
        body.appendChild(actionsField);

        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger sm';
        deleteBtn.textContent = t('recovery.deleteButton');
        deleteBtn.style.marginRight = 'auto';
        if (isNew) deleteBtn.style.display = 'none';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('recovery.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('recovery.save');

        footer.appendChild(deleteBtn);
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function tryClose() {
            if (dirty && !confirm(t('common.discardChanges'))) return;
            overlay.remove();
        }

        closeXBtn.addEventListener('click', tryClose);
        cancelBtn.addEventListener('click', tryClose);
        overlay.addEventListener('click', e => { if (e.target === overlay) tryClose(); });

        deleteBtn.addEventListener('click', () => {
            content.restButtons = content.restButtons.filter(b => b.id !== btn.id);
            overlay.remove();
            onSaved();
            scheduleSave();
        });

        saveBtn.addEventListener('click', () => {
            btn.name = nameInput.value.trim() || t('recovery.unnamedButton');
            btn.actions = [];
            if (healSelect.value) btn.actions.push({ type: healSelect.value });
            checkboxes.forEach((cb, i) => { if (cb.checked) btn.actions.push({ type: ACTION_TYPES[i] }); });
            if (btn.actions.some(a => a.type === 'healByRoll') && !content.hitDice) {
                content.hitDice = { dieSize: 8, total: 1, remaining: 1, modifier: 0, restoreOnLongRest: 'half' };
            }
            if (isNew) content.restButtons.push(btn);
            dirty = false;
            overlay.remove();
            onSaved();
            scheduleSave();
        });

        nameInput.focus();
        nameInput.select();
    }

    // ── Edit Mode ──

    function buildEditMode(bodyEl, moduleEl, data) {
        const content = data.content;
        const container = document.createElement('div');
        container.className = 'recovery-edit-container';

        const btnList = document.createElement('div');
        btnList.className = 'recovery-btn-list';

        let sortableInstance = null;

        function renderBtnList() {
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
            btnList.innerHTML = '';

            content.restButtons.forEach(btn => {
                const row = document.createElement('div');
                row.className = 'recovery-btn-row';
                row.dataset.btnId = btn.id;

                const dragHandle = document.createElement('span');
                dragHandle.className = 'recovery-btn-drag-handle';
                dragHandle.innerHTML = '&#x2807;';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'recovery-btn-row-name';
                nameSpan.textContent = btn.name;

                const rowActions = document.createElement('div');
                rowActions.className = 'recovery-btn-row-actions';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'recovery-btn-row-edit';
                editBtn.title = t('recovery.editButton');
                editBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
                editBtn.addEventListener('click', () => {
                    openRestButtonEditModal(btn, content, renderBtnList, false);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'recovery-btn-row-delete';
                deleteBtn.title = t('recovery.deleteButton');
                deleteBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
                deleteBtn.addEventListener('click', () => {
                    content.restButtons = content.restButtons.filter(b => b.id !== btn.id);
                    renderBtnList();
                    scheduleSave();
                });

                rowActions.appendChild(editBtn);
                rowActions.appendChild(deleteBtn);
                row.appendChild(dragHandle);
                row.appendChild(nameSpan);
                row.appendChild(rowActions);
                btnList.appendChild(row);
            });

            if (typeof Sortable !== 'undefined' && content.restButtons.length > 1) {
                sortableInstance = Sortable.create(btnList, {
                    handle: '.recovery-btn-drag-handle',
                    animation: 150,
                    ghostClass: 'recovery-btn-ghost',
                    draggable: '.recovery-btn-row',
                    onEnd() {
                        const rows = Array.from(btnList.querySelectorAll('.recovery-btn-row'));
                        const newOrder = rows.map(r => r.dataset.btnId);
                        content.restButtons.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                        scheduleSave();
                    },
                });
            }
        }

        renderBtnList();
        container.appendChild(btnList);

        const addRow = document.createElement('button');
        addRow.type = 'button';
        addRow.className = 'recovery-add-btn-row';
        addRow.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ${escapeHtml(t('recovery.addButton'))}`;
        addRow.addEventListener('click', () => {
            const newBtn = { id: genBtnId(), name: t('recovery.newButton'), actions: [] };
            openRestButtonEditModal(newBtn, content, renderBtnList, true);
        });
        container.appendChild(addRow);

        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    }

    // ── Module Registration ──

    registerModuleType('recovery', {
        label: 'type.recovery',

        renderBody(bodyEl, data, isPlayMode) {
            if (!data.content || typeof data.content !== 'object' || !Array.isArray(data.content.restButtons)) {
                data.content = { restButtons: [], hitDice: null };
            }
            if (isPlayMode) {
                buildPlayMode(bodyEl, data);
            } else {
                buildEditMode(bodyEl, bodyEl.closest('.module'), data);
            }
        },

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            buildPlayMode(bodyEl, data);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            buildEditMode(bodyEl, moduleEl, data);
        },
    });
})();
