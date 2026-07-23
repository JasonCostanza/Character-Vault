// ── Stat Module Type ──
(function () {
    // ── Stat Templates ──
    const STAT_TEMPLATES = {
        dnd5e: [
            { name: 'STR' },
            { name: 'DEX' },
            { name: 'CON' },
            { name: 'INT' },
            { name: 'WIS' },
            { name: 'CHA' },
            { name: 'Proficiency', isProficiencyStat: true, rollable: false },
        ],
        pf2e: [
            { name: 'STR' },
            { name: 'DEX' },
            { name: 'CON' },
            { name: 'INT' },
            { name: 'WIS' },
            { name: 'CHA' },
            { name: 'Proficiency', isProficiencyStat: true, rollable: false },
        ],
        daggerheart: [
            { name: 'Agility' },
            { name: 'Strength' },
            { name: 'Finesse' },
            { name: 'Instinct' },
            { name: 'Presence' },
            { name: 'Knowledge' },
        ],
        coc: [
            { name: 'STR' },
            { name: 'CON' },
            { name: 'SIZ' },
            { name: 'DEX' },
            { name: 'APP' },
            { name: 'INT' },
            { name: 'POW' },
            { name: 'EDU' },
            { name: 'LCK' },
        ],
        vtm: [
            { name: 'Strength' },
            { name: 'Dexterity' },
            { name: 'Stamina' },
            { name: 'Charisma' },
            { name: 'Manipulation' },
            { name: 'Composure' },
            { name: 'Intelligence' },
            { name: 'Wits' },
            { name: 'Resolve' },
        ],
        cpred: [
            { name: 'INT' },
            { name: 'REF' },
            { name: 'DEX' },
            { name: 'TECH' },
            { name: 'COOL' },
            { name: 'WILL' },
            { name: 'LUCK' },
            { name: 'MOVE' },
            { name: 'BODY' },
            { name: 'EMP' },
        ],
        mothership: [{ name: 'Strength' }, { name: 'Speed' }, { name: 'Intellect' }, { name: 'Combat' }],
        sr6: [
            { name: 'Body' },
            { name: 'Agility' },
            { name: 'Reaction' },
            { name: 'Strength' },
            { name: 'Willpower' },
            { name: 'Logic' },
            { name: 'Intuition' },
            { name: 'Charisma' },
            { name: 'Edge' },
        ],
    };

    function applyStatTemplate(templateKey) {
        const template = STAT_TEMPLATES[templateKey];
        if (!template) return [];
        return template.map((t) => ({
            name: t.name,
            value: 0,
            modifier: 0,
            proficient: false,
            proficiencyRank: 'untrained',
            rollable: t.rollable !== undefined ? t.rollable : true,
            ...(t.isProficiencyStat ? { isProficiencyStat: true } : {}),
        }));
    }

    function renderStatBlock(stat, index, data, isPlayMode) {
        const layout = data.content.layout;
        const isModifierOnly = layout === 'modifier-only';
        const isLargeStat = layout === 'large-stat';
        const primaryVal = isLargeStat ? stat.value : formatModifier(stat.modifier);
        const secondaryVal = isLargeStat ? formatModifier(stat.modifier) : stat.value;

        const block = document.createElement('div');
        block.className =
            'stat-block' +
            (isPlayMode && stat.rollable ? ' stat-rollable' : '') +
            (isModifierOnly ? ' stat-modifier-only' : '');
        block.dataset.index = index;
        var sys = window.gameSystem || 'custom';
        var profIndicatorHtml = '';
        if (sys === 'pf2e') {
            var rank = stat.proficiencyRank || 'untrained';
            profIndicatorHtml =
                '<span class="stat-rank-badge" title="' +
                escapeHtml(t('rank.' + rank)) +
                '">' +
                rank.charAt(0).toUpperCase() +
                '</span>';
        } else if (stat.proficient && sys !== 'daggerheart') {
            profIndicatorHtml = '<span class="stat-proficiency-dot"></span>';
        }
        if (isModifierOnly) {
            block.innerHTML =
                profIndicatorHtml +
                `<div class="stat-name" title="${escapeHtml(stat.name || t('stat.unnamed'))}">${escapeHtml(stat.name || t('stat.unnamed'))}</div>` +
                `<div class="stat-primary">${escapeHtml(formatModifier(stat.modifier))}</div>`;
        } else {
            block.innerHTML =
                profIndicatorHtml +
                `<div class="stat-name" title="${escapeHtml(stat.name || t('stat.unnamed'))}">${escapeHtml(stat.name || t('stat.unnamed'))}</div>` +
                `<div class="stat-primary">${escapeHtml(String(primaryVal))}</div>` +
                `<div class="stat-secondary">${escapeHtml(String(secondaryVal))}</div>`;
        }

        var isAutoProf = stat.isProficiencyStat && sys === 'dnd5e';

        if (isPlayMode && !isAutoProf) {
            const nameEl = block.querySelector('.stat-name');
            if (nameEl) {
                nameEl.addEventListener('click', (e) => {
                    if (!e.ctrlKey) return;
                    e.stopPropagation();
                    enterNameQuickEdit(nameEl, block, stat, data);
                });
            }
        }

        if (isPlayMode && stat.rollable) {
            block.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    if (!isAutoProf) enterQuickEdit(block, stat, data);
                    return;
                }
                rollStatCheck(stat, data);
            });
        }

        if (isPlayMode && !stat.rollable) {
            block.addEventListener('click', (e) => {
                if (e.ctrlKey && !isAutoProf) enterQuickEdit(block, stat, data);
            });
        }

        return block;
    }

    function renderStatBlockEdit(stat, index, data) {
        const block = document.createElement('div');
        block.className = 'stat-block-edit';
        block.dataset.index = index;
        var editSys = window.gameSystem || 'custom';

        if (stat.isProficiencyStat && editSys === 'dnd5e') {
            var autoVal = typeof window.getProficiencyBonus === 'function' ? window.getProficiencyBonus() : 2;
            var deleteSvg = cvIcon('x', 12);
            block.innerHTML =
                `<div class="stat-edit-name-row">` +
                `<span class="stat-drag-handle" style="visibility:hidden">&#x2807;</span>` +
                `<input class="stat-edit-name" type="text" value="${escapeHtml(stat.name)}" readonly>` +
                `<button class="stat-edit-delete" title="${t('stat.deleteStat')}" style="visibility:hidden">${deleteSvg}</button>` +
                `</div>` +
                `<div class="stat-edit-row">` +
                `<div class="stat-edit-field"><label>${t('stat.value')}</label><span class="stat-edit-value-readonly">${autoVal}</span></div>` +
                `</div>` +
                `<div class="stat-prof-auto-badge" title="${escapeHtml(t('stat.proficiencyAutoComputed'))}">${t('stat.autoLabel')}</div>`;
            block.addEventListener('click', (e) => {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) return;
                const container = block.closest('.stat-container');
                const moduleEl = container && container.closest('.module');
                if (!moduleEl) return;
                if (moduleEl._selectedStatIndex === index) {
                    moduleEl._selectedStatIndex = null;
                } else {
                    moduleEl._selectedStatIndex = index;
                }
                container.querySelectorAll('.stat-block-edit').forEach((b) => b.classList.remove('stat-selected'));
                if (moduleEl._selectedStatIndex !== null) {
                    const sel = container.querySelector(
                        `.stat-block-edit[data-index="${moduleEl._selectedStatIndex}"]`
                    );
                    if (sel) sel.classList.add('stat-selected');
                }
            });
            return block;
        }

        var profRowHtml = '';
        if (!stat.isProficiencyStat) {
            if (editSys === 'pf2e') {
                profRowHtml = `<div class="stat-edit-prof-row" data-pf2e-rank-row></div>`;
            } else if (editSys !== 'daggerheart') {
                profRowHtml = `<div class="stat-edit-prof-row"><span class="stat-edit-prof-label">${t('stat.proficient')}</span><button class="stat-edit-prof-dot${stat.proficient ? ' active' : ''}" title="${t('stat.proficient')}"></button></div>`;
            }
        }
        var editLayout = data.content.layout;
        var isEditModOnly = editLayout === 'modifier-only';
        var valueFieldHtml = isEditModOnly
            ? ''
            : `<div class="stat-edit-field"><label class="${editLayout === 'large-stat' ? 'stat-edit-primary-label' : ''}">${t('stat.value')}</label><input type="number" class="stat-edit-value" value="${stat.value}"></div>`;
        block.innerHTML =
            `<div class="stat-edit-name-row">` +
            `<span class="stat-drag-handle">&#x2807;</span>` +
            `<input class="stat-edit-name" type="text" value="${escapeHtml(stat.name)}" placeholder="${t('stat.unnamed')}">` +
            `<button class="stat-edit-delete" title="${t('stat.deleteStat')}">${cvIcon('x', 12)}</button>` +
            `</div>` +
            `<div class="stat-edit-row">` +
            valueFieldHtml +
            `<div class="stat-edit-field"><label class="${editLayout !== 'large-stat' ? 'stat-edit-primary-label' : ''}">${t('stat.modifier')}</label><input type="number" class="stat-edit-modifier" value="${stat.modifier}"></div>` +
            `</div>` +
            profRowHtml;

        // Wire up inputs
        const nameInput = block.querySelector('.stat-edit-name');
        const valInput = block.querySelector('.stat-edit-value');
        const modInput = block.querySelector('.stat-edit-modifier');
        const deleteBtn = block.querySelector('.stat-edit-delete');
        const profDot = block.querySelector('.stat-edit-prof-dot');
        const rankRow = block.querySelector('[data-pf2e-rank-row]');

        if (profDot) {
            profDot.addEventListener('click', () => {
                stat.proficient = !stat.proficient;
                profDot.classList.toggle('active', stat.proficient);
                scheduleSave();
            });
        }

        if (rankRow) {
            var pillBar = document.createElement('div');
            pillBar.className = 'stat-rank-pills';
            var ranks = [
                { value: 'untrained', letter: 'U' },
                { value: 'trained', letter: 'T' },
                { value: 'expert', letter: 'E' },
                { value: 'master', letter: 'M' },
                { value: 'legendary', letter: 'L' },
            ];
            ranks.forEach(function (r) {
                var pill = document.createElement('button');
                pill.className =
                    'stat-rank-pill' + ((stat.proficiencyRank || 'untrained') === r.value ? ' active' : '');
                pill.textContent = r.letter;
                pill.title = t('rank.' + r.value);
                pill.dataset.rank = r.value;
                pill.addEventListener('click', function () {
                    stat.proficiencyRank = r.value;
                    pillBar.querySelectorAll('.stat-rank-pill').forEach(function (p) {
                        p.classList.remove('active');
                    });
                    pill.classList.add('active');
                    scheduleSave();
                });
                pillBar.appendChild(pill);
            });
            rankRow.appendChild(pillBar);
        }

        nameInput.addEventListener('input', () => {
            const oldName = stat.name;
            stat.name = nameInput.value;
            if (typeof window.propagateEntityRename === 'function') {
                window.propagateEntityRename(data.id, 'stat', oldName, stat.name);
            }
            scheduleSave();
            document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
        });
        if (valInput) {
            valInput.addEventListener('input', () => {
                stat.value = parseInt(valInput.value, 10) || 0;
                scheduleSave();
                document.dispatchEvent(new CustomEvent('cv:stat-values-changed', { detail: { moduleId: data.id } }));
            });
        }
        modInput.addEventListener('input', () => {
            stat.modifier = parseInt(modInput.value, 10) || 0;
            scheduleSave();
            document.dispatchEvent(new CustomEvent('cv:stat-values-changed', { detail: { moduleId: data.id } }));
        });

        [nameInput, valInput, modInput].filter(Boolean).forEach((inp) => {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') inp.blur();
            });
        });

        deleteBtn.addEventListener('click', () => {
            data.content.stats.splice(index, 1);
            const container = block.closest('.stat-container');
            // Clear selection if the deleted stat was selected
            const moduleEl = container.closest('.module');
            if (moduleEl && moduleEl._selectedStatIndex === index) {
                moduleEl._selectedStatIndex = null;
            } else if (moduleEl && moduleEl._selectedStatIndex > index) {
                moduleEl._selectedStatIndex--;
            }
            reRenderStatEdits(container, data);
            scheduleSave();
            document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
        });

        // Click on block background to select (not on inputs/buttons)
        block.addEventListener('click', (e) => {
            const target = e.target;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.closest('label')
            )
                return;
            const container = block.closest('.stat-container');
            const moduleEl = container.closest('.module');
            if (!moduleEl) return;

            // Toggle: if already selected, deselect
            if (moduleEl._selectedStatIndex === index) {
                moduleEl._selectedStatIndex = null;
            } else {
                moduleEl._selectedStatIndex = index;
            }

            // Update visual selection
            container.querySelectorAll('.stat-block-edit').forEach((b) => b.classList.remove('stat-selected'));
            if (moduleEl._selectedStatIndex !== null) {
                const selectedBlock = container.querySelector(
                    `.stat-block-edit[data-index="${moduleEl._selectedStatIndex}"]`
                );
                if (selectedBlock) selectedBlock.classList.add('stat-selected');
            }
        });

        return block;
    }

    function reRenderStatEdits(container, data) {
        container.querySelectorAll('.stat-block-edit').forEach((el) => el.remove());
        data.content.stats.forEach((stat, i) => {
            container.appendChild(renderStatBlockEdit(stat, i, data));
        });
        // Restore selection visual state
        const moduleEl = container.closest('.module');
        if (moduleEl && moduleEl._selectedStatIndex !== null && moduleEl._selectedStatIndex !== undefined) {
            const selectedBlock = container.querySelector(
                `.stat-block-edit[data-index="${moduleEl._selectedStatIndex}"]`
            );
            if (selectedBlock) selectedBlock.classList.add('stat-selected');
        }
        if (container._sortable) container._sortable.destroy();
        initStatSortable(container, data);
    }

    function initStatSortable(container, data) {
        container._sortable = new Sortable(container, {
            handle: '.stat-drag-handle',
            animation: 150,
            ghostClass: 'stat-ghost',
            filter: '',
            draggable: '.stat-block-edit, .stat-block',
            onEnd(evt) {
                const items = Array.from(container.querySelectorAll('.stat-block-edit, .stat-block'));
                const reordered = items.map((el) => data.content.stats[parseInt(el.dataset.index, 10)]).filter(Boolean);
                data.content.stats = reordered;
                // Re-index
                items.forEach((el, i) => (el.dataset.index = i));
                scheduleSave();
            },
        });
    }

    function rollStatCheck(stat, data) {
        var sys = window.gameSystem || 'custom';
        var profBonus = 0;
        if (
            (sys === 'dnd5e' || sys === 'custom') &&
            stat.proficient &&
            typeof window.getProficiencyBonus === 'function'
        ) {
            profBonus = window.getProficiencyBonus();
        } else if (sys === 'pf2e' && typeof window.computePf2eProficiencyBonus === 'function') {
            profBonus = window.computePf2eProficiencyBonus(stat.proficiencyRank);
        }
        var totalMod = stat.modifier + profBonus;
        const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
        if (sys === 'daggerheart') {
            window.rollDualityDice(
                stat.name + ' ' + t('stat.check'),
                totalMod,
                'stat.event.roll',
                'stat.log.roll',
                { name: stat.name || t('stat.unnamed'), modifier: '2d12' + modStr },
                data.id
            );
            return;
        }
        try {
            const rollPromise = TS.dice.putDiceInTray([
                { name: `${stat.name} ${t('stat.check')}`, roll: `1d20${modStr}` },
            ]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({
                    type: 'stat.event.roll',
                    message: t('stat.log.roll', { name: stat.name || t('stat.unnamed'), modifier: `1d20${modStr}` }),
                    sourceModuleId: data.id,
                });
                rollPromise
                    .then(function (rollId) {
                        if (rollId) window.pendingRolls[rollId] = { logEntryId };
                    })
                    .catch(function (e) {
                        console.warn('[CV] Dice roll failed:', e);
                    });
            }
        } catch (e) {
            console.warn('[CV] Dice roll failed:', e);
        }
    }

    function enterQuickEdit(block, stat, data) {
        const layout = data.content.layout;
        const valueField = { key: 'value', label: t('stat.value'), value: stat.value, type: 'number' };
        const modField = { key: 'modifier', label: t('stat.modifier'), value: stat.modifier, type: 'number' };

        var fields;
        if (layout === 'modifier-only') {
            fields = [modField];
        } else if (layout === 'large-stat') {
            fields = [valueField, modField];
        } else {
            fields = [modField, valueField];
        }

        window.openEditPopover(block, {
            label: stat.name || t('stat.unnamed'),
            fields: fields,
            onSave(values) {
                if (values.value !== undefined) stat.value = values.value;
                stat.modifier = values.modifier;
                scheduleSave();
                const idx = parseInt(block.dataset.index, 10);
                block.replaceWith(renderStatBlock(stat, idx, data, true));
            },
        });
    }

    function enterNameQuickEdit(nameEl, block, stat, data) {
        window.openEditPopover(nameEl, {
            label: t('common.name'),
            value: stat.name,
            type: 'text',
            onSave(newName) {
                stat.name = newName;
                scheduleSave();
                const idx = parseInt(block.dataset.index, 10);
                block.replaceWith(renderStatBlock(stat, idx, data, true));
            },
        });
    }

    // ── Stat Module Type ──
    registerModuleType('stat', {
        label: 'type.stat',

        renderBody(bodyEl, data, isPlayMode) {
            // Guard: ensure content is the right shape
            if (!data.content || typeof data.content === 'string') {
                data.content = { layout: 'large-stat', stats: [] };
            }
            if (!Array.isArray(data.content.stats)) {
                data.content.stats = [];
            }
            var guardSys = window.gameSystem || 'custom';
            data.content.stats.forEach(function (stat) {
                if (stat.proficiencyRank === undefined) {
                    stat.proficiencyRank = guardSys === 'pf2e' && stat.proficient ? 'trained' : 'untrained';
                }
            });

            const container = document.createElement('div');
            container.className = 'stat-container';

            if (isPlayMode) {
                data.content.stats.forEach((stat, i) => {
                    container.appendChild(renderStatBlock(stat, i, data, true));
                });
            } else {
                data.content.stats.forEach((stat, i) => {
                    container.appendChild(renderStatBlockEdit(stat, i, data));
                });

                initStatSortable(container, data);
            }

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        syncState(moduleEl, data) {
            // Inputs mutate data directly, but as a safety net, re-read edit values
            moduleEl.querySelectorAll('.stat-block-edit').forEach((block, i) => {
                const stat = data.content.stats[i];
                if (!stat) return;
                const nameInput = block.querySelector('.stat-edit-name');
                const valInput = block.querySelector('.stat-edit-value');
                const modInput = block.querySelector('.stat-edit-modifier');
                if (nameInput) stat.name = nameInput.value;
                if (valInput) stat.value = parseInt(valInput.value, 10) || 0;
                if (modInput) stat.modifier = parseInt(modInput.value, 10) || 0;
            });
        },
    });

    // ── Stat Settings Modal ──
    function openStatSettingsModal(moduleEl, data) {
        const existing = document.querySelector('.stat-settings-overlay');
        if (existing) {
            existing.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay stat-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('stat.settingsTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // ── Get From Board ──
        const getFromBoardBtn = document.createElement('button');
        getFromBoardBtn.type = 'button';
        getFromBoardBtn.className = 'btn-secondary sm';
        getFromBoardBtn.textContent = t('stat.eyedropper');
        getFromBoardBtn.addEventListener('click', async function () {
            try {
                const selected = await TS.creatures.getSelectedCreatures();
                if (!selected || selected.length === 0) {
                    console.warn('[CV] Stat Eyedropper: no creature selected on the board.');
                    return;
                }
                const moreInfo = await TS.creatures.getMoreInfo(selected);
                const creature = moreInfo[0];
                if (creature && creature.stats) {
                    const boardStats = creature.stats;
                    if (data.content.stats.length === 0) {
                        data.content.stats = boardStats.map(function (s) {
                            return {
                                name: s.name || t('stat.unnamed'),
                                value: s.value || 0,
                                modifier: 0,
                                proficient: false,
                                rollable: true,
                            };
                        });
                    } else {
                        boardStats.forEach(function (bs) {
                            const existing = data.content.stats.find(function (es) {
                                return es.name.toLowerCase() === bs.name.toLowerCase();
                            });
                            if (existing) existing.value = bs.value;
                        });
                    }
                    const bodyEl = moduleEl.querySelector('.module-body');
                    const typeDef = window.MODULE_TYPES?.['stat'];
                    if (typeDef && bodyEl) typeDef.renderBody(bodyEl, data, window.isPlayMode);
                    scheduleSave();
                    window.showToast(t('stat.getFromBoardSuccess'));
                }
            } catch (e) {
                console.warn('[CV] Stat Eyedropper failed:', e);
            }
        });
        body.appendChild(getFromBoardBtn);

        // ── Display Layout ──
        const layoutLabel = document.createElement('div');
        layoutLabel.className = 'cv-modal-label';
        layoutLabel.textContent = t('stat.layoutLabel');
        body.appendChild(layoutLabel);

        const layoutSelect = window.buildCvSelect(
            [
                { value: 'large-stat', label: t('stat.largeStat') },
                { value: 'large-modifier', label: t('stat.largeModifier') },
                { value: 'modifier-only', label: t('stat.modifierOnly') },
            ],
            data.content.layout || 'large-stat',
            function (val) {
                data.content.layout = val;
                const bodyEl = moduleEl.querySelector('.module-body');
                const typeDef = window.MODULE_TYPES?.['stat'];
                if (typeDef && bodyEl) typeDef.renderBody(bodyEl, data, window.isPlayMode);
                window.snapModuleHeight(moduleEl, data);
                scheduleSave();
            }
        );
        body.appendChild(layoutSelect.el);

        // ── Rollable Stats ──
        const rollableLabel = document.createElement('div');
        rollableLabel.className = 'cv-modal-label';
        rollableLabel.textContent = t('stat.rollableStats');
        body.appendChild(rollableLabel);

        const rollableList = document.createElement('div');
        rollableList.className = 'stat-settings-rollable-list';
        data.content.stats
            .filter(function (stat) {
                return !stat.isProficiencyStat;
            })
            .forEach(function (stat) {
                const row = document.createElement('div');
                row.className = 'stat-settings-rollable-row';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'cv-toggle-label';
                nameSpan.textContent = stat.name || t('stat.unnamed');
                row.appendChild(nameSpan);

                const toggle = window.makeCvToggle(!!stat.rollable, function (checked) {
                    stat.rollable = checked;
                    scheduleSave();
                });
                row.appendChild(toggle);
                rollableList.appendChild(row);
            });
        body.appendChild(rollableList);

        buildCommonSettingsSection(body, moduleEl, data);
        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-secondary sm';
        closeBtn.textContent = t('module.close');
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
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });
    }

    window.openStatSettingsModal = openStatSettingsModal;

    window.STAT_TEMPLATES = STAT_TEMPLATES;
    window.applyStatTemplate = applyStatTemplate;

    window.getAbilityModifier = function (key) {
        if (!key) return 0;
        const nameMap = {
            str: 'STR',
            dex: 'DEX',
            con: 'CON',
            int: 'INT',
            wis: 'WIS',
            cha: 'CHA',
            // Daggerheart governing traits
            agility: 'AGILITY',
            strength: 'STRENGTH',
            finesse: 'FINESSE',
            instinct: 'INSTINCT',
            presence: 'PRESENCE',
            knowledge: 'KNOWLEDGE',
        };
        const target = (nameMap[key] || key).toUpperCase();
        for (const m of window.modules || []) {
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
            const stat = m.content.stats.find((s) => s.name && s.name.toUpperCase() === target);
            if (stat) return stat.modifier || 0;
        }
        return 0;
    };

    window.getAbilityModifierFrom = function (key, moduleId) {
        if (!key) return 0;
        const target = key.toUpperCase();
        for (const m of window.modules || []) {
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
            if (moduleId && m.id !== moduleId) continue;
            const stat = m.content.stats.find((s) => s.name && s.name.toUpperCase() === target);
            if (stat) return stat.modifier || 0;
        }
        return 0;
    };

    window.getProficiencyBonus = function () {
        var sys = window.gameSystem || 'custom';
        if (sys === 'dnd5e') {
            var totalLevel =
                typeof window.getTotalCharacterLevel === 'function' ? window.getTotalCharacterLevel() : null;
            if (totalLevel !== null) return window.computeDnd5eProficiencyBonus(totalLevel);
        }
        for (const m of window.modules || []) {
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
            const profStat = m.content.stats.find((s) => s.isProficiencyStat);
            if (profStat) return profStat.value ?? 0;
        }
        return 2;
    };

    window.getStatValue = function (name) {
        if (!name) return null;
        var target = name.toUpperCase();
        for (var i = 0; i < (window.modules || []).length; i++) {
            var m = window.modules[i];
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
            var stat = m.content.stats.find(function (s) {
                return s.name && s.name.toUpperCase() === target;
            });
            if (stat) return typeof stat.value === 'number' ? stat.value : null;
        }
        return null;
    };

    window.getAllStatNames = function () {
        var names = {};
        for (var i = 0; i < (window.modules || []).length; i++) {
            var m = window.modules[i];
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) continue;
            m.content.stats.forEach(function (s) {
                if (s.name && !s.isProficiencyStat) names[s.name] = true;
            });
        }
        return Object.keys(names).sort();
    };

    document.addEventListener('cv:level-changed', function () {
        if ((window.gameSystem || 'custom') !== 'dnd5e') return;
        var totalLevel = typeof window.getTotalCharacterLevel === 'function' ? window.getTotalCharacterLevel() : null;
        if (totalLevel === null) return;
        var newBonus = window.computeDnd5eProficiencyBonus(totalLevel);
        (window.modules || []).forEach(function (m) {
            if (m.type !== 'stat' || !m.content || !Array.isArray(m.content.stats)) return;
            var profStat = m.content.stats.find(function (s) {
                return s.isProficiencyStat;
            });
            if (!profStat || profStat.value === newBonus) return;
            profStat.value = newBonus;
            var moduleEl = document.querySelector('.module[data-id="' + m.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES?.['stat'];
            if (typeDef && bodyEl) typeDef.renderBody(bodyEl, m, window.isPlayMode);
        });
    });
})();
