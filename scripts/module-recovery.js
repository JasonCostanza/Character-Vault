// ── Recovery Module ──
(function () {
    // ── Helpers ──

    function genBtnId() {
        return 'btn_' + Math.random().toString(36).slice(2, 9);
    }

    function hasHealByRoll(content) {
        return (
            content.restButtons &&
            content.restButtons.some((btn) => btn.actions && btn.actions.some((a) => a.type === 'healByRoll'))
        );
    }

    function rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    const ACTION_TYPES = ['resetTempHP', 'restoreAllSpellSlots', 'restoreHitDice'];

    function makeHDConfigField(labelKey, val, min, onCommit) {
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

    // ── Execute Rest Button ──

    function executeRestButton(btn, content, diceCount) {
        const results = [];
        btn.actions.forEach((action) => {
            switch (action.type) {
                case 'healToFull': {
                    window.modules
                        .filter((m) => m.type === 'health')
                        .forEach((m) => {
                            if (typeof window.healToFull === 'function') window.healToFull(m.id);
                        });
                    results.push(t('recovery.action.healToFull'));
                    break;
                }
                case 'resetTempHP': {
                    window.modules
                        .filter((m) => m.type === 'health')
                        .forEach((m) => {
                            if (typeof window.resetTempHP === 'function') window.resetTempHP(m.id);
                        });
                    results.push(t('recovery.action.resetTempHP'));
                    break;
                }
                case 'restoreAllSpellSlots': {
                    window.modules
                        .filter((m) => m.type === 'spells')
                        .forEach((m) => {
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
                    window.modules
                        .filter((m) => m.type === 'health')
                        .forEach((m) => {
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
        const hasRoll = btn.actions.some((a) => a.type === 'healByRoll');
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
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        const actionList = document.createElement('ul');
        actionList.className = 'recovery-confirm-actions-list';
        btn.actions.forEach((action) => {
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
                decBtn.addEventListener('click', () => {
                    diceCount = Math.max(0, diceCount - 1);
                    updateStepper();
                });
                incBtn.addEventListener('click', () => {
                    diceCount = Math.min(hd.remaining, diceCount + 1);
                    updateStepper();
                });

                stepper.appendChild(decBtn);
                stepper.appendChild(valueEl);
                stepper.appendChild(incBtn);
                spendRow.appendChild(stepper);

                const availableSpan = document.createElement('span');
                availableSpan.className = 'recovery-hitdice-spend-available';
                availableSpan.textContent = t('recovery.diceAvailable', {
                    remaining: hd.remaining,
                    total: hd.total,
                    dieSize: hd.dieSize,
                });
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

        function closeDialog() {
            overlay.remove();
        }

        closeXBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });

        confirmBtn.addEventListener('click', () => {
            const diceCount = getDiceCount();
            const results = executeRestButton(btn, content, diceCount);
            closeDialog();
            scheduleSave();

            // Re-render this recovery module
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['recovery'].renderBody(bodyEl, data);

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

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.setAttribute('data-i18n', 'recovery.settingsTitle');
        titleEl.textContent = t('recovery.settingsTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('recovery.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        function reRenderModuleBody() {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['recovery'].renderBody(bodyEl, data);
        }

        // ── Manage Rest Buttons ──
        const manageLabel = document.createElement('div');
        manageLabel.className = 'cv-modal-label';
        manageLabel.textContent = t('recovery.manageButtons');
        body.appendChild(manageLabel);

        const btnList = document.createElement('div');
        btnList.className = 'recovery-btn-list';

        function renderBtnList() {
            if (btnList._sortable) btnList._sortable.destroy();
            btnList.innerHTML = '';

            content.restButtons.forEach((btn) => {
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
                editBtn.innerHTML = cvIcon('pencil', 12);
                editBtn.addEventListener('click', () => {
                    openRestButtonEditModal(
                        btn,
                        content,
                        () => {
                            renderBtnList();
                            reRenderModuleBody();
                        },
                        false
                    );
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'recovery-btn-row-delete';
                deleteBtn.title = t('recovery.deleteButton');
                deleteBtn.innerHTML = cvIcon('trash-2', 12);
                deleteBtn.addEventListener('click', () => {
                    content.restButtons = content.restButtons.filter((b) => b.id !== btn.id);
                    renderBtnList();
                    reRenderModuleBody();
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
                initManageListSortable(btnList, {
                    handleSelector: '.recovery-btn-drag-handle',
                    ghostClass: 'recovery-btn-ghost',
                    rowSelector: '.recovery-btn-row',
                    onEnd() {
                        const rows = Array.from(btnList.querySelectorAll('.recovery-btn-row'));
                        const newOrder = rows.map((r) => r.dataset.btnId);
                        content.restButtons.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
        }

        renderBtnList();
        body.appendChild(btnList);

        const addBtnRow = document.createElement('button');
        addBtnRow.type = 'button';
        addBtnRow.className = 'recovery-add-btn-row';
        addBtnRow.innerHTML = `${cvIcon('plus', 12)} ${escapeHtml(t('recovery.addButton'))}`;
        addBtnRow.addEventListener('click', () => {
            const newBtn = { id: genBtnId(), name: t('recovery.newButton'), actions: [] };
            openRestButtonEditModal(
                newBtn,
                content,
                () => {
                    renderBtnList();
                    reRenderModuleBody();
                },
                true
            );
        });
        body.appendChild(addBtnRow);

        // ── Hit Dice Configuration ──
        if (!content.hitDice) {
            content.hitDice = { dieSize: 8, total: 1, remaining: 1, modifier: 0, restoreOnLongRest: 'half' };
        }
        const hd = content.hitDice;

        const hdLabel = document.createElement('div');
        hdLabel.className = 'cv-modal-label';
        hdLabel.textContent = t('recovery.hitDiceConfig');
        body.appendChild(hdLabel);

        const grid = document.createElement('div');
        grid.className = 'recovery-hitdice-config-grid';

        // Die size dropdown
        const dieSizeField = document.createElement('div');
        dieSizeField.className = 'recovery-hitdice-config-field';
        const dieSizeLbl = document.createElement('div');
        dieSizeLbl.className = 'recovery-hitdice-config-label';
        dieSizeLbl.textContent = t('recovery.dieSize');
        const dieSizeSelect = document.createElement('select');
        dieSizeSelect.className = 'recovery-hitdice-config-select';
        [4, 6, 8, 10, 12].forEach((size) => {
            const opt = document.createElement('option');
            opt.value = size;
            opt.textContent = 'd' + size;
            if (hd.dieSize === size) opt.selected = true;
            dieSizeSelect.appendChild(opt);
        });
        dieSizeSelect.addEventListener('change', () => {
            hd.dieSize = parseInt(dieSizeSelect.value);
            scheduleSave();
        });
        dieSizeField.appendChild(dieSizeLbl);
        dieSizeField.appendChild(dieSizeSelect);
        grid.appendChild(dieSizeField);

        grid.appendChild(
            makeHDConfigField('recovery.totalDice', hd.total, 1, (v) => {
                hd.total = v;
                hd.remaining = Math.min(hd.remaining, hd.total);
                scheduleSave();
            })
        );

        grid.appendChild(
            makeHDConfigField('recovery.remainingDice', hd.remaining, 0, (v, input) => {
                hd.remaining = Math.min(v, hd.total);
                input.value = hd.remaining;
                scheduleSave();
            })
        );

        grid.appendChild(
            makeHDConfigField('recovery.modifier', hd.modifier || 0, -99, (v) => {
                hd.modifier = v;
                scheduleSave();
            })
        );

        // Restore on Long Rest (spans full grid width)
        const restoreField = document.createElement('div');
        restoreField.className = 'recovery-hitdice-config-field';
        restoreField.style.gridColumn = '1 / -1';
        const restoreLbl = document.createElement('div');
        restoreLbl.className = 'recovery-hitdice-config-label';
        restoreLbl.textContent = t('recovery.restoreOnLongRest');
        const restoreSelect = document.createElement('select');
        restoreSelect.className = 'recovery-hitdice-config-select';
        const currentRestore = hd.restoreOnLongRest || 'half';
        ['all', 'half', 'none'].forEach((opt) => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = t('recovery.restoreOption.' + opt);
            if (currentRestore === opt) el.selected = true;
            restoreSelect.appendChild(el);
        });
        restoreSelect.addEventListener('change', () => {
            hd.restoreOnLongRest = restoreSelect.value;
            scheduleSave();
        });
        restoreField.appendChild(restoreLbl);
        restoreField.appendChild(restoreSelect);
        grid.appendChild(restoreField);

        body.appendChild(grid);

        buildCommonSettingsSection(body, moduleEl, data);
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

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
        }
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeModal();
            }
        };
        document.addEventListener('keydown', keyHandler);
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
    window.openRecoverySettingsModal = openRecoverySettingsModal;

    // ── Module Body ──

    function buildPlayMode(bodyEl, data) {
        const content = data.content;
        const container = document.createElement('div');
        container.className = 'recovery-container cv-scroll';

        if (!content.restButtons || content.restButtons.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'recovery-empty-state';
            empty.textContent = t('recovery.emptyState');
            container.appendChild(empty);
        } else {
            content.restButtons.forEach((btn) => {
                const btnEl = document.createElement('button');
                btnEl.type = 'button';
                btnEl.className = 'recovery-rest-btn';
                btnEl.innerHTML = cvIcon('moon', 14);
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

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('recovery.editRestButton');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('recovery.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        const nameField = document.createElement('div');
        nameField.className = 'recovery-edit-field';
        const nameLabel = document.createElement('div');
        nameLabel.className = 'recovery-edit-label';
        nameLabel.textContent = t('recovery.buttonName');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'recovery-edit-name-input';
        nameInput.value = btn.name;
        nameInput.addEventListener('input', () => {
            dirty = true;
        });
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);
        body.appendChild(nameField);

        const hpRecoveryField = document.createElement('div');
        hpRecoveryField.className = 'recovery-edit-field';
        hpRecoveryField.style.marginTop = '10px';
        const hpRecoveryLabel = document.createElement('div');
        hpRecoveryLabel.className = 'recovery-edit-label';
        hpRecoveryLabel.textContent = t('recovery.hpRecovery');
        const currentHealType = btn.actions.find((a) => a.type === 'healToFull' || a.type === 'healByRoll')?.type || '';
        const healSelect = document.createElement('select');
        healSelect.className = 'settings-select';
        healSelect.addEventListener('change', () => {
            dirty = true;
        });
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
        let restoreHitDiceCb = null;
        ACTION_TYPES.forEach((actionType) => {
            const toggle = makeCvToggle(
                btn.actions.some((a) => a.type === actionType),
                () => {
                    dirty = true;
                }
            );
            const lbl = document.createElement('span');
            lbl.className = 'cv-toggle-label';
            lbl.textContent = t('recovery.actionLabel.' + actionType);
            toggle.appendChild(lbl);
            checklist.appendChild(toggle);
            const cb = toggle.querySelector('input[type="checkbox"]');
            checkboxes.push(cb);
            if (actionType === 'restoreHitDice') restoreHitDiceCb = cb;
        });

        actionsField.appendChild(checklist);
        body.appendChild(actionsField);

        // ── Hit Dice Config (shown when healByRoll or restoreHitDice is active) ──

        const localHD = content.hitDice
            ? { ...content.hitDice }
            : { dieSize: 8, total: 1, remaining: 1, modifier: 0, restoreOnLongRest: 'half' };

        const hdSectionEl = document.createElement('div');
        hdSectionEl.className = 'recovery-edit-field';
        hdSectionEl.style.marginTop = '10px';

        const hdLabel = document.createElement('div');
        hdLabel.className = 'recovery-edit-label';
        hdLabel.textContent = t('recovery.hitDiceConfig');
        hdSectionEl.appendChild(hdLabel);

        const hdConfig = document.createElement('div');
        hdConfig.className = 'recovery-hitdice-config';
        hdConfig.style.marginTop = '4px';

        const hdGrid = document.createElement('div');
        hdGrid.className = 'recovery-hitdice-config-grid';

        const dieSizeField = document.createElement('div');
        dieSizeField.className = 'recovery-hitdice-config-field';
        const dieSizeLbl = document.createElement('div');
        dieSizeLbl.className = 'recovery-hitdice-config-label';
        dieSizeLbl.textContent = t('recovery.dieSize');
        const dieSizeSelect = document.createElement('select');
        dieSizeSelect.className = 'recovery-hitdice-config-select';
        [4, 6, 8, 10, 12].forEach((size) => {
            const opt = document.createElement('option');
            opt.value = size;
            opt.textContent = 'd' + size;
            if (localHD.dieSize === size) opt.selected = true;
            dieSizeSelect.appendChild(opt);
        });
        dieSizeSelect.addEventListener('change', () => {
            localHD.dieSize = parseInt(dieSizeSelect.value);
            dirty = true;
        });
        dieSizeField.appendChild(dieSizeLbl);
        dieSizeField.appendChild(dieSizeSelect);
        hdGrid.appendChild(dieSizeField);

        hdGrid.appendChild(
            makeHDConfigField('recovery.totalDice', localHD.total, 1, (v) => {
                localHD.total = v;
                localHD.remaining = Math.min(localHD.remaining, localHD.total);
                dirty = true;
            })
        );
        hdGrid.appendChild(
            makeHDConfigField('recovery.remainingDice', localHD.remaining, 0, (v, input) => {
                localHD.remaining = Math.min(v, localHD.total);
                input.value = localHD.remaining;
                dirty = true;
            })
        );
        hdGrid.appendChild(
            makeHDConfigField('recovery.modifier', localHD.modifier || 0, -99, (v) => {
                localHD.modifier = v;
                dirty = true;
            })
        );
        hdConfig.appendChild(hdGrid);

        const restorePolicyField = document.createElement('div');
        restorePolicyField.className = 'recovery-hitdice-config-field';
        const restorePolicyLbl = document.createElement('div');
        restorePolicyLbl.className = 'recovery-hitdice-config-label';
        restorePolicyLbl.textContent = t('recovery.restoreOnLongRest');
        const restorePolicySelect = document.createElement('select');
        restorePolicySelect.className = 'recovery-hitdice-config-select';
        const currentRestorePolicy = localHD.restoreOnLongRest || 'half';
        ['all', 'half', 'none'].forEach((opt) => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = t('recovery.restoreOption.' + opt);
            if (currentRestorePolicy === opt) el.selected = true;
            restorePolicySelect.appendChild(el);
        });
        restorePolicySelect.addEventListener('change', () => {
            localHD.restoreOnLongRest = restorePolicySelect.value;
            dirty = true;
        });
        restorePolicyField.appendChild(restorePolicyLbl);
        restorePolicyField.appendChild(restorePolicySelect);
        hdConfig.appendChild(restorePolicyField);

        hdSectionEl.appendChild(hdConfig);
        body.appendChild(hdSectionEl);

        function updateHdSection() {
            const show = healSelect.value === 'healByRoll' || (restoreHitDiceCb && restoreHitDiceCb.checked);
            hdSectionEl.style.display = show ? '' : 'none';
        }
        healSelect.addEventListener('change', updateHdSection);
        if (restoreHitDiceCb) restoreHitDiceCb.addEventListener('change', updateHdSection);
        updateHdSection();

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

        function closeModal() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function tryClose() {
            if (dirty) {
                showConfirm(t('common.discardChanges'), closeModal);
            } else {
                closeModal();
            }
        }

        closeXBtn.addEventListener('click', tryClose);
        cancelBtn.addEventListener('click', tryClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) tryClose();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                tryClose();
            }
        };
        document.addEventListener('keydown', keyHandler);

        deleteBtn.addEventListener('click', () => {
            content.restButtons = content.restButtons.filter((b) => b.id !== btn.id);
            overlay.remove();
            onSaved();
            scheduleSave();
        });

        saveBtn.addEventListener('click', () => {
            btn.name = nameInput.value.trim() || t('recovery.unnamedButton');
            btn.actions = [];
            if (healSelect.value) btn.actions.push({ type: healSelect.value });
            checkboxes.forEach((cb, i) => {
                if (cb.checked) btn.actions.push({ type: ACTION_TYPES[i] });
            });
            if (btn.actions.some((a) => a.type === 'healByRoll' || a.type === 'restoreHitDice')) {
                content.hitDice = { ...localHD };
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

    // ── Module Registration ──

    registerModuleType('recovery', {
        label: 'type.recovery',

        renderBody(bodyEl, data) {
            if (!data.content || typeof data.content !== 'object' || !Array.isArray(data.content.restButtons)) {
                data.content = { restButtons: [], hitDice: null };
            }
            buildPlayMode(bodyEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openRecoverySettingsModal(moduleEl, data),
                    label: t('recovery.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });
})();
