// ── Saving Throw Module ──
(function () {
    'use strict';

    // ── ID Generation ──
    function generateSaveId() {
        return 'save_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Templates ──
    const SAVE_TEMPLATES = {
        dnd5e: ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'],
        pf2e: ['Fortitude', 'Reflex', 'Will'],
        coc: ['Sanity', 'Luck', 'Power'],
        cpred: ['Death Save', 'Stun'],
        mothership: ['Sanity', 'Fear', 'Body', 'Armor'],
    };

    const TIER_PRESETS = {
        // One tier: proficient saves show badge; non-proficiency is the empty "None" option (not a tier row).
        dnd5e: [{ name: 'Proficient', letter: 'P', color: '#22aa44' }],
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
        const names = SAVE_TEMPLATES[key];
        if (!names) return [];
        return names.map((name) => ({
            id: generateSaveId(),
            name,
            value: 0,
            proficiencyTier: null,
        }));
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
            };
        }
        if (!Array.isArray(data.content.saves)) data.content.saves = [];
        if (typeof data.content.notes !== 'string') data.content.notes = '';
        if (typeof data.content.tiersEnabled !== 'boolean') data.content.tiersEnabled = false;
        if (!Array.isArray(data.content.tiers)) data.content.tiers = applyTierPreset('simple');
        if (!data.content.tierPreset) data.content.tierPreset = 'simple';
        if (data.content.tierPreset === 'dnd5e') {
            data.content.tiers = applyTierPreset('dnd5e');
            data.content.saves.forEach((save) => {
                if (save.proficiencyTier === 'Not Proficient') save.proficiencyTier = null;
            });
        }
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
    function formatModifier(n) {
        const val = parseInt(n, 10) || 0;
        return val >= 0 ? `+${val}` : `${val}`;
    }

    function getTierForSave(save, tiers) {
        if (!save.proficiencyTier) return null;
        return tiers.find((tier) => tier.name === save.proficiencyTier) || null;
    }

    // ── Play Mode Block ──
    function renderSaveBlock(save, index, data) {
        const content = data.content;
        const block = document.createElement('div');
        block.className = 'save-block save-rollable';
        block.dataset.index = index;

        const tier = content.tiersEnabled ? getTierForSave(save, content.tiers) : null;

        let html = '';
        if (tier) {
            html += `<span class="save-tier-badge" style="background:${escapeHtml(tier.color)}">${escapeHtml(tier.letter)}</span>`;
        }
        html += `<div class="save-name" title="${escapeHtml(save.name || t('save.unnamed'))}">${escapeHtml(save.name || t('save.unnamed'))}</div>`;
        html += `<div class="save-modifier">${escapeHtml(formatModifier(save.value))}</div>`;
        block.innerHTML = html;

        block.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                enterSaveQuickEdit(block, save, data);
                return;
            }
            rollSavingThrow(save, data);
        });

        return block;
    }

    // ── Layout Mode Block ──
    function renderSaveBlockEdit(save, index, data) {
        const content = data.content;
        const block = document.createElement('div');
        block.className = 'save-block-edit';
        block.dataset.index = index;

        block.innerHTML =
            `<div class="save-edit-name-row">` +
            `<span class="save-drag-handle">&#x2807;</span>` +
            `<input class="save-edit-name" type="text" value="${escapeHtml(save.name)}" placeholder="${escapeHtml(t('save.unnamed'))}">` +
            `<button class="save-edit-delete" title="${escapeHtml(t('save.deleteSave'))}">` +
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
            `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` +
            `</svg>` +
            `</button>` +
            `</div>` +
            `<div class="save-edit-row">` +
            `<div class="save-edit-field">` +
            `<label>${escapeHtml(t('save.modifier'))}</label>` +
            `<input type="number" class="save-edit-value" value="${save.value}">` +
            `</div>` +
            `</div>`;

        const nameInput = block.querySelector('.save-edit-name');
        const valInput = block.querySelector('.save-edit-value');
        const deleteBtn = block.querySelector('.save-edit-delete');

        if (content.tiersEnabled) {
            const tierOpts = [{ value: '', label: t('save.noProficiency') }].concat(
                content.tiers.map((tier) => ({ value: tier.name, label: tier.name }))
            );
            const tierWidget = buildCvSelect(tierOpts, save.proficiencyTier || '', (val) => {
                save.proficiencyTier = val || null;
                scheduleSave();
            });
            const tierField = document.createElement('div');
            tierField.className = 'save-edit-field';
            const tierLabel = document.createElement('label');
            tierLabel.textContent = t('save.proficiency');
            tierField.appendChild(tierLabel);
            tierField.appendChild(tierWidget.el);
            block.querySelector('.save-edit-row').appendChild(tierField);
        }

        nameInput.addEventListener('input', () => {
            save.name = nameInput.value;
            scheduleSave();
        });
        valInput.addEventListener('input', () => {
            save.value = parseInt(valInput.value, 10) || 0;
            scheduleSave();
        });

        [nameInput, valInput].forEach((inp) => {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') inp.blur();
            });
        });

        deleteBtn.addEventListener('click', () => {
            content.saves.splice(index, 1);
            const blocksGrid = block.closest('.save-blocks-grid');
            if (blocksGrid) reRenderSaveEdits(blocksGrid, data);
            scheduleSave();
        });

        return block;
    }

    function reRenderSaveEdits(blocksGrid, data) {
        blocksGrid.querySelectorAll('.save-block-edit').forEach((el) => el.remove());
        data.content.saves.forEach((save, i) => {
            blocksGrid.appendChild(renderSaveBlockEdit(save, i, data));
        });
        if (blocksGrid._sortable) blocksGrid._sortable.destroy();
        initSaveSortable(blocksGrid, data);
    }

    function initSaveSortable(blocksGrid, data) {
        blocksGrid._sortable = new Sortable(blocksGrid, {
            handle: '.save-drag-handle',
            animation: 150,
            ghostClass: 'save-ghost',
            draggable: '.save-block-edit, .save-block',
            onEnd() {
                const items = Array.from(blocksGrid.querySelectorAll('.save-block-edit, .save-block'));
                const reordered = items.map((el) => data.content.saves[parseInt(el.dataset.index, 10)]).filter(Boolean);
                data.content.saves = reordered;
                items.forEach((el, i) => {
                    el.dataset.index = i;
                });
                scheduleSave();
            },
        });
    }

    // ── Dice Rolling ──
    function rollSavingThrow(save, data) {
        var sys = window.gameSystem || 'custom';
        var profBonus = 0;
        if ((sys === 'dnd5e' || sys === 'custom') && save.proficiencyTier === 'Proficient' && typeof window.getProficiencyBonus === 'function') {
            profBonus = window.getProficiencyBonus();
        } else if (sys === 'pf2e' && save.proficiencyTier && typeof window.computePf2eProficiencyBonus === 'function') {
            profBonus = window.computePf2eProficiencyBonus(save.proficiencyTier.toLowerCase());
        }
        var totalMod = save.value + profBonus;
        const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
        try {
            const rollPromise = TS.dice.putDiceInTray([
                {
                    name: `${save.name || t('save.unnamed')} ${t('save.save')}`,
                    roll: `1d20${modStr}`,
                },
            ]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({ type: 'save.event.roll', message: t('save.log.roll', { name: save.name || t('save.unnamed'), modifier: modStr }), sourceModuleId: data.id });
                rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId }; });
            }
        } catch (e) {
            console.warn('[CV] Saving throw dice roll failed:', e);
        }
    }

    // ── Quick Edit (Ctrl+Click in Play Mode) ──
    function enterSaveQuickEdit(block, save, data) {
        const modEl = block.querySelector('.save-modifier');
        if (!modEl) return;

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'save-quick-input';
        input.value = save.value;

        modEl.replaceWith(input);
        input.focus();
        input.select();

        let committed = false;
        function commitOnce() {
            if (committed) return;
            committed = true;
            save.value = parseInt(input.value, 10) || 0;
            scheduleSave();
            const container = block.parentElement;
            const idx = parseInt(block.dataset.index, 10);
            const newBlock = renderSaveBlock(save, idx, data);
            block.replaceWith(newBlock);
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') commitOnce();
        });
        input.addEventListener('blur', () => setTimeout(commitOnce, 50));
    }

    // ── Notes Area ──
    function autoResizeSaveNotesTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function renderNotesArea(container, data, isPlayMode) {
        const existing = container.querySelector('.save-notes-area');
        if (existing) existing.remove();

        const notes = data.content.notes || '';
        const moduleEl = container.closest('.module');
        const area = document.createElement('div');
        area.className = 'save-notes-area';

        const textarea = document.createElement('textarea');
        textarea.className = 'save-notes-textarea';
        textarea.rows = 1;
        textarea.placeholder = t('text.placeholder');
        textarea.value = notes;
        textarea.style.display = isPlayMode ? 'none' : 'block';

        const display = document.createElement('div');
        display.className = 'save-notes-display';
        display.style.display = isPlayMode ? 'block' : 'none';
        display.innerHTML = isPlayMode ? renderMarkdown(notes) : '';

        textarea.addEventListener('input', () => {
            data.content.notes = textarea.value;
            autoResizeSaveNotesTextarea(textarea);
            scheduleSave();
        });

        area.appendChild(textarea);
        area.appendChild(display);

        if (isPlayMode && moduleEl) {
            attachCheckboxHandlers(display, saveNotesCheckboxProxy(data), moduleEl);
        }

        autoResizeSaveNotesTextarea(textarea);
        if (!isPlayMode && typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => autoResizeSaveNotesTextarea(textarea));
            ro.observe(area);
        }

        container.appendChild(area);
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
        overlay.className = 'cv-modal-overlay';
        overlay.style.zIndex = '200';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const title = document.createElement('h3');
        title.className = 'cv-modal-title';
        title.textContent = t('save.settingsTitle');
        title.style.userSelect = 'none';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // Enable tiers row
        const enableRow = document.createElement('div');
        enableRow.className = 'save-settings-row';
        const enableToggle = makeCvToggle(workingTiersEnabled, (checked) => {
            workingTiersEnabled = checked;
            presetRow.style.display = workingTiersEnabled ? '' : 'none';
            dirty = true;
        });
        enableToggle.className = 'save-settings-checkbox-label';
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
        presetLabel.style.userSelect = 'none';
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

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('save.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary';
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
        }

        function commitAndClose() {
            content.tiersEnabled = workingTiersEnabled;
            content.tierPreset = workingTierPreset;
            content.tiers = workingTiers;
            // Orphan cleanup: saves pointing at deleted/renamed tiers → null
            const tierNames = new Set(content.tiers.map((tier) => tier.name));
            content.saves.forEach((save) => {
                if (save.proficiencyTier && !tierNames.has(save.proficiencyTier)) {
                    save.proficiencyTier = null;
                }
            });
            // If all tiers deleted, force-disable
            if (content.tiers.length === 0) content.tiersEnabled = false;
            // Re-render
            const bodyEl = moduleEl.querySelector('.module-body');
            const isPlay = isPlayMode;
            MODULE_TYPES['savingthrow'].renderBody(bodyEl, data, isPlay);
            scheduleSave();
            closeModal();
        }

        saveBtn.addEventListener('click', commitAndClose);
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (dirty) {
                    if (window.confirm(t('save.discardChanges'))) closeModal();
                } else {
                    closeModal();
                }
            }
        });
    }

    // ── Custom Tier Editor ──
    function openCustomTierEditor(workingTiers, onSave) {
        let editTiers = workingTiers.map((tier) => ({ ...tier }));

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay';
        overlay.style.zIndex = '210';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const title = document.createElement('h3');
        title.className = 'cv-modal-title';
        title.textContent = t('save.tierEditorTitle');
        title.style.userSelect = 'none';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

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
                    `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
                    `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` +
                    `</svg>` +
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
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('save.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary';
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
        }

        saveBtn.addEventListener('click', () => {
            onSave(editTiers);
            closeEditor();
        });
        cancelBtn.addEventListener('click', closeEditor);
        closeBtn.addEventListener('click', closeEditor);

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeEditor();
            }
        });
    }

    // ── Module Type Registration ──
    registerModuleType('savingthrow', {
        label: 'type.savingthrow',

        renderBody(bodyEl, data, isPlayMode) {
            ensureSaveContent(data);
            const content = data.content;

            const container = document.createElement('div');
            container.className = 'save-container';

            const blocksGrid = document.createElement('div');
            blocksGrid.className = 'save-blocks-grid';

            if (isPlayMode) {
                content.saves.forEach((save, i) => {
                    blocksGrid.appendChild(renderSaveBlock(save, i, data));
                });
            } else {
                content.saves.forEach((save, i) => {
                    blocksGrid.appendChild(renderSaveBlockEdit(save, i, data));
                });
                initSaveSortable(blocksGrid, data);
            }

            container.appendChild(blocksGrid);

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
            renderNotesArea(container, data, isPlayMode);
        },

        onPlayMode(moduleEl, data) {
            ensureSaveContent(data);
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onLayoutMode(moduleEl, data) {
            ensureSaveContent(data);
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },

        syncState(moduleEl, data) {
            moduleEl.querySelectorAll('.save-block-edit').forEach((block, i) => {
                const save = data.content.saves[i];
                if (!save) return;
                const nameInput = block.querySelector('.save-edit-name');
                const valInput = block.querySelector('.save-edit-value');
                if (nameInput) save.name = nameInput.value;
                if (valInput) save.value = parseInt(valInput.value, 10) || 0;
            });
            const textarea = moduleEl.querySelector('.save-notes-textarea');
            if (textarea) data.content.notes = textarea.value;
        },
    });

    window.applySavingThrowTemplate = applySavingThrowTemplate;
    window.applyTierPreset = applyTierPreset;
    window.formatModifier = formatModifier;
    window.ensureSaveContent = ensureSaveContent;
    window.getTierForSave = getTierForSave;
    window.saveNotesCheckboxProxy = saveNotesCheckboxProxy;
    window.openSaveSettings = openSaveSettings;
})();
