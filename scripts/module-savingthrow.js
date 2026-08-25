// ── Saving Throw Module ──
(function () {
    'use strict';

    // ── Templates ──
    const SAVE_TEMPLATES = {
        dnd5e: [
            { name: 'Strength', linkedStatName: 'STR' },
            { name: 'Dexterity', linkedStatName: 'DEX' },
            { name: 'Constitution', linkedStatName: 'CON' },
            { name: 'Intelligence', linkedStatName: 'INT' },
            { name: 'Wisdom', linkedStatName: 'WIS' },
            { name: 'Charisma', linkedStatName: 'CHA' },
        ],
        pf2e: [
            { name: 'Fortitude', linkedStatName: 'CON' },
            { name: 'Reflex', linkedStatName: 'DEX' },
            { name: 'Will', linkedStatName: 'WIS' },
        ],
        coc: [{ name: 'Sanity' }, { name: 'Luck' }, { name: 'Power' }],
        cpred: [{ name: 'Death Save' }, { name: 'Stun' }],
        mothership: [{ name: 'Sanity' }, { name: 'Fear' }, { name: 'Body' }, { name: 'Armor' }],
    };

    const TIER_PRESETS = {
        // One tier: proficient saves show badge; non-proficiency is the empty "None" option (not a tier row).
        dnd5e: [
            { name: 'Proficient', letter: 'P', color: '#22aa44' },
            { name: 'Expert', letter: 'E', color: '#3388dd' },
        ],
        pf2e: [
            { name: 'Untrained', letter: 'U', color: '#888888' },
            { name: 'Trained', letter: 'T', color: '#22aa44' },
            { name: 'Expert', letter: 'E', color: '#3388dd' },
            { name: 'Master', letter: 'M', color: '#aa44cc' },
            { name: 'Legendary', letter: 'L', color: '#cc9900' },
        ],
        simple: [
            { name: 'Untrained', letter: 'U', color: '#888888' },
            { name: 'Trained', letter: 'T', color: '#22aa44' },
            { name: 'Expert', letter: 'E', color: '#3388dd' },
            { name: 'Master', letter: 'M', color: '#aa44cc' },
        ],
    };

    function applySavingThrowTemplate(key) {
        const entries = SAVE_TEMPLATES[key];
        if (!entries) return [];
        return entries.map(function (entry) {
            return {
                id: generateId('save'),
                name: entry.name,
                value: 0,
                proficiencyTier: null,
                linkedStatName: entry.linkedStatName || null,
            };
        });
    }

    function applyTierPreset(key) {
        const preset = TIER_PRESETS[key];
        if (!preset) return [];
        return preset.map((tier) => ({ name: tier.name, letter: tier.letter, color: tier.color }));
    }

    // ── Content Shape Guard ──
    function ensureSaveContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = {
                saves: [],
                notes: '',
                tiersEnabled: false,
                tiers: applyTierPreset('simple'),
                tierPreset: 'simple',
                linkedStatModuleId: null,
            };
        }
        if (!Array.isArray(data.content.saves)) data.content.saves = [];
        if (typeof data.content.notes !== 'string') data.content.notes = '';
        if (typeof data.content.tiersEnabled !== 'boolean') data.content.tiersEnabled = false;
        if (!Array.isArray(data.content.tiers)) data.content.tiers = applyTierPreset('simple');
        if (!data.content.tierPreset) data.content.tierPreset = 'simple';
        if (data.content.linkedStatModuleId === undefined) data.content.linkedStatModuleId = null;
        if (data.content.tierPreset === 'dnd5e') {
            data.content.tiers = applyTierPreset('dnd5e');
            data.content.saves.forEach((save) => {
                if (save.proficiencyTier === 'Not Proficient') save.proficiencyTier = null;
            });
        }
        data.content.saves.forEach(function (save) {
            if (save.linkedStatName === undefined) save.linkedStatName = null;
        });
        return data.content;
    }

    function saveNotesCheckboxProxy(data) {
        return {
            get content() {
                return data.content.notes || '';
            },
            set content(v) {
                data.content.notes = v;
            },
        };
    }

    // ── Helpers ──
    function getSaveBaseMod(save, content) {
        if (content.linkedStatModuleId && save.linkedStatName) {
            var statMod = window.getAbilityModifierFrom(save.linkedStatName, content.linkedStatModuleId);
            return statMod + (save.value || 0);
        }
        return save.value || 0;
    }

    function getSaveTotalMod(save, content) {
        var base = getSaveBaseMod(save, content);
        var sys = window.gameSystem || 'custom';
        if (
            (sys === 'dnd5e' || sys === 'custom') &&
            typeof window.getProficiencyBonus === 'function'
        ) {
            if (save.proficiencyTier === 'Expert') return base + window.getProficiencyBonus() * 2;
            if (save.proficiencyTier === 'Proficient') return base + window.getProficiencyBonus();
        }
        if (sys === 'pf2e' && save.proficiencyTier && typeof window.computePf2eProficiencyBonus === 'function') {
            return base + window.computePf2eProficiencyBonus(save.proficiencyTier.toLowerCase());
        }
        return base;
    }

    function getTierForSave(save, tiers) {
        if (!save.proficiencyTier) return null;
        return tiers.find((tier) => tier.name === save.proficiencyTier) || null;
    }

    // ── Chain Link Indicator ──
    function updateSavingthrowChainIcon(moduleEl, data) {
        window.updateChainLinkIndicator(moduleEl, 'savingthrow', 'save.linkedTo', data);
    }

    // ── Play Mode Block ──
    function renderSaveBlock(save, index, data) {
        const content = data.content;
        const block = document.createElement('div');
        block.className = 'save-block save-rollable';
        block.dataset.index = index;
        block.dataset.saveId = save.id;

        const tier = content.tiersEnabled ? getTierForSave(save, content.tiers) : null;

        let html = '';
        if (tier) {
            html += `<span class="save-tier-badge" style="background:${escapeHtml(tier.color)}">${escapeHtml(tier.letter)}</span>`;
        }
        html += `<div class="save-name" title="${escapeHtml(save.name || t('save.unnamed'))}">${escapeHtml(save.name || t('save.unnamed'))}</div>`;
        html += `<div class="save-modifier">${escapeHtml(formatModifier(getSaveTotalMod(save, content)))}</div>`;
        block.innerHTML = html;

        block.addEventListener('click', (e) => {
            if (modKeys.ctrl) {
                enterSaveQuickEdit(block, save, data);
                return;
            }
            rollSavingThrow(save, data);
        });

        return block;
    }

    // ── Dice Rolling ──
    function rollSavingThrow(save, data) {
        var sys = window.gameSystem || 'custom';
        var profBonus = 0;
        if (
            (sys === 'dnd5e' || sys === 'custom') &&
            typeof window.getProficiencyBonus === 'function'
        ) {
            if (save.proficiencyTier === 'Expert') profBonus = window.getProficiencyBonus() * 2;
            else if (save.proficiencyTier === 'Proficient') profBonus = window.getProficiencyBonus();
        } else if (sys === 'pf2e' && save.proficiencyTier && typeof window.computePf2eProficiencyBonus === 'function') {
            profBonus = window.computePf2eProficiencyBonus(save.proficiencyTier.toLowerCase());
        }
        var totalMod = getSaveBaseMod(save, data.content) + profBonus;
        const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
        if (sys === 'daggerheart') {
            window.rollDualityDice(
                (save.name || t('save.unnamed')) + ' ' + t('save.save'),
                totalMod,
                'save.event.roll',
                'save.log.roll',
                { name: save.name || t('save.unnamed'), modifier: '2d12' + modStr },
                data.id
            );
            return;
        }
        try {
            const rollPromise = TS.dice.putDiceInTray([
                {
                    name: `${save.name || t('save.unnamed')} ${t('save.save')}`,
                    roll: `1d20${modStr}`,
                },
            ]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({
                    type: 'save.event.roll',
                    message: t('save.log.roll', { name: save.name || t('save.unnamed'), modifier: modStr }),
                    sourceModuleId: data.id,
                });
                rollPromise
                    .then(function (rollId) {
                        if (rollId) window.pendingRolls[rollId] = { logEntryId };
                    })
                    .catch(function (e) {
                        console.warn('[CV] Saving throw dice roll failed:', e);
                    });
            }
        } catch (e) {
            console.warn('[CV] Saving throw dice roll failed:', e);
        }
    }

    // ── Quick Edit (Ctrl+Click) ──
    function enterSaveQuickEdit(block, save, data) {
        const modEl = block.querySelector('.save-modifier') || block;
        window.openEditPopover(modEl, {
            label: save.name || t('save.unnamed'),
            value: save.value,
            type: 'number',
            onSave(newVal) {
                save.value = newVal;
                scheduleSave();
                const idx = parseInt(block.dataset.index, 10);
                block.replaceWith(renderSaveBlock(save, idx, data));
            },
        });
    }

    // ── Notes Area ──
    function renderNotesArea(container, data) {
        const existing = container.querySelector('.save-notes-area');
        if (existing) existing.remove();

        const notes = data.content.notes || '';
        const moduleEl = container.closest('.module');
        const area = document.createElement('div');
        area.className = 'save-notes-area';

        const display = document.createElement('div');
        display.className = 'save-notes-display';
        display.innerHTML = notes
            ? renderMarkdown(notes)
            : `<span class="save-notes-placeholder">${escapeHtml(t('save.notesPlaceholder'))}</span>`;
        area.appendChild(display);

        if (moduleEl) {
            attachCheckboxHandlers(display, saveNotesCheckboxProxy(data), moduleEl);
        }

        container.appendChild(area);
    }

    // ── Edit Notes Modal ──
    function openSaveNotesModal(moduleEl, data) {
        const existing = document.querySelector('.save-notes-edit-overlay');
        if (existing) existing.remove();

        const snapshot = data.content.notes || '';

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay save-notes-edit-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('save.notes');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('save.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
        const textarea = document.createElement('textarea');
        textarea.className = 'cv-modal-input cv-scroll save-notes-edit-textarea';
        textarea.placeholder = t('save.notesPlaceholder');
        textarea.value = snapshot;
        body.appendChild(textarea);
        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('save.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('save.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        textarea.focus();

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
        }

        function doClose() {
            if (textarea.value !== snapshot) {
                showConfirm(t('common.discardChanges'), closeModal);
            } else {
                closeModal();
            }
        }

        function doSave() {
            data.content.notes = textarea.value;
            scheduleSave();
            const container = moduleEl.querySelector('.save-container');
            if (container) renderNotesArea(container, data);
            closeModal();
        }

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                doClose();
            }
        };
        document.addEventListener('keydown', keyHandler);
        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', doClose);
        closeXBtn.addEventListener('click', doClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) doClose();
        });
    }

    // ── Settings Modal ──
    function openSaveSettings(moduleEl, data) {
        const content = data.content;

        // Working copies
        let workingTiersEnabled = content.tiersEnabled;
        let workingTierPreset = content.tierPreset;
        let workingTiers = content.tiers.map((tier) => ({ ...tier }));
        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay save-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const title = document.createElement('span');
        title.className = 'cv-modal-title';
        title.textContent = t('save.settingsTitle');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('save.close');
        closeBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        function reRenderModuleBody() {
            const bodyEl = moduleEl.querySelector('.module-body');
            const typeDef = window.MODULE_TYPES?.['savingthrow'];
            if (typeDef && bodyEl) typeDef.renderBody(bodyEl, data);
            window.snapModuleHeight(moduleEl, data);
        }

        // ── Manage Saves ──
        const manageLabel = document.createElement('div');
        manageLabel.className = 'cv-modal-label';
        manageLabel.textContent = t('save.manageSaves');
        body.appendChild(manageLabel);

        const manageList = document.createElement('div');
        manageList.className = 'save-manage-list';

        function buildManageRow(save, index) {
            const row = document.createElement('div');
            row.className = 'save-manage-row';
            row.dataset.index = index;

            const drag = document.createElement('span');
            drag.className = 'save-manage-drag';
            drag.innerHTML = '&#x2807;';
            row.appendChild(drag);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'save-manage-name';
            nameInput.value = save.name;
            nameInput.placeholder = t('save.unnamed');
            nameInput.addEventListener('input', () => {
                const oldName = save.name;
                save.name = nameInput.value;
                if (typeof window.propagateEntityRename === 'function') {
                    window.propagateEntityRename(data.id, 'save', oldName, save.name);
                }
                scheduleSave();
                const displayName = save.name || t('save.unnamed');
                const bodyEl = moduleEl.querySelector('.module-body');
                const nameEl = bodyEl && bodyEl.querySelector('.save-block[data-save-id="' + save.id + '"] .save-name');
                if (nameEl) {
                    nameEl.textContent = displayName;
                    nameEl.title = displayName;
                }
            });
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') nameInput.blur();
            });
            row.appendChild(nameInput);

            if (content.linkedStatModuleId) {
                const statNames = getLinkedStatNames(content.linkedStatModuleId);
                if (statNames.length > 0) {
                    const statOpts = [{ value: '', label: '—' }].concat(
                        statNames.map((n) => ({ value: n, label: n }))
                    );
                    const statWidget = buildCvSelect(statOpts, save.linkedStatName || '', (val) => {
                        save.linkedStatName = val || null;
                        scheduleSave();
                        reRenderModuleBody();
                    });
                    statWidget.el.classList.add('save-manage-linked-stat');
                    row.appendChild(statWidget.el);
                }
            }

            if (content.tiersEnabled) {
                const tierOpts = [{ value: '', label: t('save.noProficiency') }].concat(
                    content.tiers.map((tier) => ({ value: tier.name, label: tier.name }))
                );
                const tierWidget = buildCvSelect(tierOpts, save.proficiencyTier || '', (val) => {
                    save.proficiencyTier = val || null;
                    scheduleSave();
                    reRenderModuleBody();
                });
                tierWidget.el.classList.add('save-manage-tier');
                row.appendChild(tierWidget.el);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'save-manage-delete';
            deleteBtn.title = t('save.deleteSave');
            deleteBtn.innerHTML = cvIcon('x', 12);
            deleteBtn.addEventListener('click', () => {
                const idx = content.saves.indexOf(save);
                if (idx !== -1) content.saves.splice(idx, 1);
                scheduleSave();
                renderManageRows();
                reRenderModuleBody();
            });
            row.appendChild(deleteBtn);

            return row;
        }

        function renderManageRows() {
            manageList.innerHTML = '';
            content.saves.forEach((save, i) => {
                manageList.appendChild(buildManageRow(save, i));
            });
            if (manageList._sortable) manageList._sortable.destroy();
            initManageListSortable(manageList, {
                handleSelector: '.save-manage-drag',
                ghostClass: 'save-ghost',
                rowSelector: '.save-manage-row',
                onEnd() {
                    const rows = Array.from(manageList.querySelectorAll('.save-manage-row'));
                    content.saves = rows.map((r) => content.saves[parseInt(r.dataset.index, 10)]).filter(Boolean);
                    rows.forEach((r, i) => {
                        r.dataset.index = i;
                    });
                    scheduleSave();
                    reRenderModuleBody();
                },
            });
        }

        renderManageRows();
        body.appendChild(manageList);

        const addSaveBtn = document.createElement('button');
        addSaveBtn.type = 'button';
        addSaveBtn.className = 'btn-secondary sm';
        addSaveBtn.innerHTML = cvIcon('plus', 14) + ' ' + escapeHtml(t('save.addSave'));
        addSaveBtn.addEventListener('click', () => {
            content.saves.push({ id: generateId('save'), name: '', value: 0, proficiencyTier: null, linkedStatName: null });
            scheduleSave();
            renderManageRows();
            reRenderModuleBody();
        });
        body.appendChild(addSaveBtn);

        // Enable tiers row
        const enableRow = document.createElement('div');
        enableRow.className = 'save-settings-row';
        const enableToggle = makeCvToggle(workingTiersEnabled, (checked) => {
            workingTiersEnabled = checked;
            presetRow.style.display = workingTiersEnabled ? '' : 'none';
            dirty = true;
        });
        enableToggle.classList.add('save-settings-checkbox-label');
        const enableLabel = document.createElement('span');
        enableLabel.className = 'cv-toggle-label';
        enableLabel.textContent = t('save.enableTiers');
        enableToggle.appendChild(enableLabel);
        enableRow.appendChild(enableToggle);
        body.appendChild(enableRow);

        // Tier preset row
        const presetRow = document.createElement('div');
        presetRow.className = 'save-settings-row';
        presetRow.style.display = workingTiersEnabled ? '' : 'none';

        const presetLabel = document.createElement('label');
        presetLabel.className = 'cv-modal-label';
        presetLabel.textContent = t('save.tierPreset');
        presetRow.appendChild(presetLabel);

        const presetControls = document.createElement('div');
        presetControls.className = 'save-settings-preset-controls';

        const editTiersBtn = document.createElement('button');
        editTiersBtn.className = 'save-settings-edit-btn btn-secondary';
        editTiersBtn.textContent = t('save.editTiers');
        editTiersBtn.disabled = workingTierPreset !== 'custom';

        const presetSelectWidget = buildCvSelect(
            [
                { value: 'simple', label: t('save.tierPresetSimple') },
                { value: 'dnd5e', label: t('save.tierPresetDnd5e') },
                { value: 'pf2e', label: t('save.tierPresetPf2e') },
                { value: 'custom', label: t('save.tierPresetCustom') },
            ],
            workingTierPreset,
            (val) => {
                workingTierPreset = val;
                editTiersBtn.disabled = workingTierPreset !== 'custom';
                if (workingTierPreset !== 'custom') {
                    workingTiers = applyTierPreset(workingTierPreset);
                }
                dirty = true;
            }
        );

        presetControls.appendChild(presetSelectWidget.el);
        presetControls.appendChild(editTiersBtn);
        presetRow.appendChild(presetControls);
        body.appendChild(presetRow);

        editTiersBtn.addEventListener('click', () => {
            openCustomTierEditor(workingTiers, (newTiers) => {
                workingTiers = newTiers;
                dirty = true;
            });
        });

        // Linked stat module
        var workingLinkedStatId = content.linkedStatModuleId;
        const statPickerLabel = document.createElement('label');
        statPickerLabel.className = 'cv-modal-label';
        statPickerLabel.textContent = t('common.linkedStatModule');
        body.appendChild(statPickerLabel);

        const statPicker = buildStatModulePicker(workingLinkedStatId, function (val) {
            workingLinkedStatId = val || null;
            dirty = true;
        });
        body.appendChild(statPicker.el);

        buildCommonSettingsSection(body, moduleEl, data);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('save.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('save.save');

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function commitAndClose() {
            content.tiersEnabled = workingTiersEnabled;
            content.tierPreset = workingTierPreset;
            content.tiers = workingTiers;
            content.linkedStatModuleId = workingLinkedStatId;
            // Orphan cleanup: saves pointing at deleted/renamed tiers → null
            const tierNames = new Set(content.tiers.map((tier) => tier.name));
            content.saves.forEach((save) => {
                if (save.proficiencyTier && !tierNames.has(save.proficiencyTier)) {
                    save.proficiencyTier = null;
                }
            });
            // If all tiers deleted, force-disable
            if (content.tiers.length === 0) content.tiersEnabled = false;
            reRenderModuleBody();
            scheduleSave();
            closeModal();
        }

        function tryClose() {
            if (dirty) {
                showConfirm(t('common.discardChanges'), closeModal);
            } else {
                closeModal();
            }
        }

        saveBtn.addEventListener('click', commitAndClose);
        cancelBtn.addEventListener('click', tryClose);
        closeBtn.addEventListener('click', tryClose);
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
    }

    // ── Custom Tier Editor ──
    function openCustomTierEditor(workingTiers, onSave) {
        let editTiers = workingTiers.map((tier) => ({ ...tier }));

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay save-tier-editor-overlay';
        overlay.style.zIndex = '210';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const title = document.createElement('span');
        title.className = 'cv-modal-title';
        title.textContent = t('save.tierEditorTitle');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('save.close');
        closeBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        // Column header row
        const colHeader = document.createElement('div');
        colHeader.className = 'save-tier-col-header';
        colHeader.innerHTML =
            `<span></span>` +
            `<span class="save-tier-col-name" style="user-select:none">${escapeHtml(t('save.tierName'))}</span>` +
            `<span class="save-tier-col-letter" style="user-select:none">${escapeHtml(t('save.tierLetter'))}</span>` +
            `<span class="save-tier-col-color" style="user-select:none">${escapeHtml(t('save.tierColor'))}</span>` +
            `<span></span>`;
        body.appendChild(colHeader);

        const tierList = document.createElement('div');
        tierList.className = 'save-tier-editor-list';
        body.appendChild(tierList);

        let tierSortable = null;

        function buildTierRows() {
            tierList.innerHTML = '';
            editTiers.forEach((tier, i) => {
                const row = document.createElement('div');
                row.className = 'save-tier-row';
                row.dataset.index = i;
                row.innerHTML =
                    `<span class="save-tier-drag-handle">&#x2807;</span>` +
                    `<input type="text" class="save-tier-name-input" value="${escapeHtml(tier.name)}" placeholder="${escapeHtml(t('save.tierName'))}">` +
                    `<input type="text" class="save-tier-letter-input" value="${escapeHtml(tier.letter)}" maxlength="1" placeholder="A">` +
                    `<div class="save-tier-color-wrap">` +
                    `<input type="color" class="save-tier-color-picker" value="${escapeHtml(tier.color)}">` +
                    `<input type="text" class="save-tier-color-hex" value="${escapeHtml(tier.color)}" maxlength="7" placeholder="#888888">` +
                    `</div>` +
                    `<button class="save-tier-delete" title="${escapeHtml(t('save.deleteSave'))}">` +
                    cvIcon('x', 12) +
                    `</button>`;

                const nameInput = row.querySelector('.save-tier-name-input');
                const letterInput = row.querySelector('.save-tier-letter-input');
                const colorPicker = row.querySelector('.save-tier-color-picker');
                const colorHex = row.querySelector('.save-tier-color-hex');
                const deleteBtn = row.querySelector('.save-tier-delete');

                nameInput.addEventListener('input', () => {
                    editTiers[i].name = nameInput.value;
                });
                letterInput.addEventListener('input', () => {
                    editTiers[i].letter = letterInput.value.slice(0, 1);
                });
                colorPicker.addEventListener('input', () => {
                    editTiers[i].color = colorPicker.value;
                    colorHex.value = colorPicker.value;
                });
                colorHex.addEventListener('input', () => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(colorHex.value)) {
                        editTiers[i].color = colorHex.value;
                        colorPicker.value = colorHex.value;
                    }
                });
                deleteBtn.addEventListener('click', () => {
                    editTiers.splice(i, 1);
                    buildTierRows();
                    initTierSortable();
                });

                tierList.appendChild(row);
            });
        }

        function initTierSortable() {
            if (tierSortable) tierSortable.destroy();
            tierSortable = new Sortable(tierList, {
                handle: '.save-tier-drag-handle',
                animation: 150,
                ghostClass: 'save-ghost',
                draggable: '.save-tier-row',
                onEnd() {
                    const rows = Array.from(tierList.querySelectorAll('.save-tier-row'));
                    const reordered = rows.map((r) => editTiers[parseInt(r.dataset.index, 10)]).filter(Boolean);
                    editTiers = reordered;
                    rows.forEach((r, i) => {
                        r.dataset.index = i;
                    });
                },
            });
        }

        buildTierRows();
        initTierSortable();

        const addTierBtn = document.createElement('button');
        addTierBtn.className = 'save-add-tier-btn btn-secondary';
        addTierBtn.textContent = t('save.addTier');
        addTierBtn.addEventListener('click', () => {
            editTiers.push({ name: '', letter: '', color: '#888888' });
            buildTierRows();
            initTierSortable();
        });
        body.appendChild(addTierBtn);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('save.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('save.save');

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeEditor() {
            overlay.remove();
            document.removeEventListener('keydown', tierKeyHandler);
        }

        saveBtn.addEventListener('click', () => {
            onSave(editTiers);
            closeEditor();
        });
        cancelBtn.addEventListener('click', closeEditor);
        closeBtn.addEventListener('click', closeEditor);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeEditor();
        });

        const tierKeyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeEditor();
            }
        };
        document.addEventListener('keydown', tierKeyHandler);
    }

    // ── Module Type Registration ──
    registerModuleType('savingthrow', {
        label: 'type.savingthrow',
        hasStatLink: true,

        renderBody(bodyEl, data) {
            ensureSaveContent(data);
            const content = data.content;

            const container = document.createElement('div');
            container.className = 'save-container';

            const blocksGrid = document.createElement('div');
            blocksGrid.className = 'save-blocks-grid';

            content.saves.forEach((save, i) => {
                blocksGrid.appendChild(renderSaveBlock(save, i, data));
            });

            container.appendChild(blocksGrid);

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
            renderNotesArea(container, data);
            const moduleEl = bodyEl.closest('.module');
            if (moduleEl) updateSavingthrowChainIcon(moduleEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openSaveNotesModal(moduleEl, data),
                    label: t('save.editNotes'),
                    icon: cvIcon('pencil', 14),
                },
                {
                    onClick() {
                        data.content.saves.push({
                            id: generateId('save'),
                            name: '',
                            value: 0,
                            proficiencyTier: null,
                        });
                        const bodyEl = moduleEl.querySelector('.module-body');
                        window.MODULE_TYPES['savingthrow'].renderBody(bodyEl, data);
                        snapModuleHeight(moduleEl, data);
                        scheduleSave();
                    },
                    label: t('save.addSave'),
                    icon: cvIcon('plus', 14),
                },
                {
                    onClick: () => openSaveSettings(moduleEl, data),
                    label: t('save.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    window.applySavingThrowTemplate = applySavingThrowTemplate;
    window.applyTierPreset = applyTierPreset;
    window.ensureSaveContent = ensureSaveContent;
    window.getTierForSave = getTierForSave;
    window.saveNotesCheckboxProxy = saveNotesCheckboxProxy;
    window.getSaveTotalMod = getSaveTotalMod;

    function reRenderLinkedSaves(changedId) {
        window.modules.forEach(function (mod) {
            if (mod.type !== 'savingthrow' || !mod.content) return;
            if (mod.content.linkedStatModuleId !== changedId) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl && window.MODULE_TYPES && window.MODULE_TYPES['savingthrow']) {
                window.MODULE_TYPES['savingthrow'].renderBody(bodyEl, mod);
            }
        });
    }

    document.addEventListener('cv:stat-values-changed', function (e) {
        reRenderLinkedSaves(e.detail && e.detail.moduleId);
    });

    document.addEventListener('cv:level-changed', function () {
        window.modules.forEach(function (mod) {
            if (mod.type !== 'savingthrow' || !mod.content) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl && window.MODULE_TYPES && window.MODULE_TYPES['savingthrow']) {
                window.MODULE_TYPES['savingthrow'].renderBody(bodyEl, mod);
            }
        });
    });

    document.addEventListener('cv:stats-changed', function (e) {
        var changedId = e.detail && e.detail.moduleId;
        var validNames = getLinkedStatNames(changedId);
        window.modules.forEach(function (mod) {
            if (mod.type !== 'savingthrow' || !mod.content) return;
            if (mod.content.linkedStatModuleId !== changedId) return;
            mod.content.saves.forEach(function (save) {
                if (save.linkedStatName && validNames.indexOf(save.linkedStatName) === -1) {
                    save.linkedStatName = null;
                }
            });
        });
        reRenderLinkedSaves(changedId);
    });
})();
