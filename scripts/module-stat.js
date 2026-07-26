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

    function renderStatBlock(stat, index, data) {
        const layout = data.content.layout;
        const isModifierOnly = layout === 'modifier-only';
        const isLargeStat = layout === 'large-stat';
        const primaryVal = isLargeStat ? stat.value : formatModifier(stat.modifier);
        const secondaryVal = isLargeStat ? formatModifier(stat.modifier) : stat.value;

        const block = document.createElement('div');
        block.className =
            'stat-block' +
            (stat.rollable ? ' stat-rollable' : '') +
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

        if (!isAutoProf) {
            const nameEl = block.querySelector('.stat-name');
            if (nameEl) {
                nameEl.addEventListener('click', (e) => {
                    if (!modKeys.ctrl) return;
                    e.stopPropagation();
                    enterNameQuickEdit(nameEl, block, stat, data);
                });
            }
        }

        if (stat.rollable) {
            block.addEventListener('click', (e) => {
                if (modKeys.ctrl) {
                    if (!isAutoProf) enterQuickEdit(block, stat, data);
                    return;
                }
                rollStatCheck(stat, data);
            });
        }

        if (!stat.rollable) {
            block.addEventListener('click', (e) => {
                if (modKeys.ctrl && !isAutoProf) enterQuickEdit(block, stat, data);
            });
        }

        return block;
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
                block.replaceWith(renderStatBlock(stat, idx, data));
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
                block.replaceWith(renderStatBlock(stat, idx, data));
            },
        });
    }

    // ── Stat Module Type ──
    registerModuleType('stat', {
        label: 'type.stat',

        renderBody(bodyEl, data) {
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

            data.content.stats.forEach((stat, i) => {
                container.appendChild(renderStatBlock(stat, i, data));
            });

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick() {
                        data.content.stats.push({
                            name: '',
                            value: 0,
                            modifier: 0,
                            proficient: false,
                            rollable: true,
                        });
                        const bodyEl = moduleEl.querySelector('.module-body');
                        window.MODULE_TYPES['stat'].renderBody(bodyEl, data);
                        snapModuleHeight(moduleEl, data);
                        scheduleSave();
                        document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
                    },
                    label: t('stat.addStat'),
                    icon: cvIcon('plus', 14),
                },
                {
                    onClick: () => openStatSettingsModal(moduleEl, data),
                    label: t('stat.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
            ];
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

        function reRenderModuleBody() {
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES?.['stat'];
            if (typeDef && bodyEl) typeDef.renderBody(bodyEl, data);
            window.snapModuleHeight(moduleEl, data);
        }

        // ── Manage Stats ──
        const manageLabel = document.createElement('div');
        manageLabel.className = 'cv-modal-label';
        manageLabel.textContent = t('stat.manageStats');
        body.appendChild(manageLabel);

        const manageList = document.createElement('div');
        manageList.className = 'stat-manage-list';

        function refreshAfterListChange() {
            renderManageRows();
            renderRollableList();
            reRenderModuleBody();
        }

        function buildRankPillBar(stat) {
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
                pill.className = 'stat-rank-pill' + ((stat.proficiencyRank || 'untrained') === r.value ? ' active' : '');
                pill.textContent = r.letter;
                pill.title = t('rank.' + r.value);
                pill.dataset.rank = r.value;
                pill.addEventListener('click', function () {
                    stat.proficiencyRank = r.value;
                    pillBar.querySelectorAll('.stat-rank-pill').forEach(function (p) { p.classList.remove('active'); });
                    pill.classList.add('active');
                    scheduleSave();
                    reRenderModuleBody();
                });
                pillBar.appendChild(pill);
            });
            return pillBar;
        }

        function buildAutoStatRow(stat, index) {
            const row = document.createElement('div');
            row.className = 'stat-manage-row';
            row.dataset.index = index;

            const drag = document.createElement('span');
            drag.className = 'stat-manage-drag';
            drag.innerHTML = '&#x2807;';
            drag.style.visibility = 'hidden';
            row.appendChild(drag);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'stat-manage-name';
            nameInput.value = stat.name;
            nameInput.readOnly = true;
            row.appendChild(nameInput);

            const autoBadge = document.createElement('span');
            autoBadge.className = 'stat-manage-auto-badge';
            autoBadge.title = t('stat.proficiencyAutoComputed');
            autoBadge.textContent = t('stat.autoLabel');
            row.appendChild(autoBadge);

            return row;
        }

        function buildManageRow(stat, index) {
            var sys = window.gameSystem || 'custom';
            if (stat.isProficiencyStat && sys === 'dnd5e') return buildAutoStatRow(stat, index);

            const row = document.createElement('div');
            row.className = 'stat-manage-row';
            row.dataset.index = index;

            const drag = document.createElement('span');
            drag.className = 'stat-manage-drag';
            drag.innerHTML = '&#x2807;';
            row.appendChild(drag);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'stat-manage-name';
            nameInput.value = stat.name;
            nameInput.placeholder = t('stat.unnamed');

            nameInput.addEventListener('input', function () {
                var oldName = stat.name;
                stat.name = nameInput.value;
                if (typeof window.propagateEntityRename === 'function') {
                    window.propagateEntityRename(data.id, 'stat', oldName, stat.name);
                }
                scheduleSave();
                var displayName = stat.name || t('stat.unnamed');
                var bodyEl = moduleEl.querySelector('.module-body');
                var statNameEl = bodyEl && bodyEl.querySelector('.stat-block[data-index="' + index + '"] .stat-name');
                if (statNameEl) {
                    statNameEl.textContent = displayName;
                    statNameEl.title = displayName;
                }
                var rollableLabel = rollableList.querySelector('.stat-settings-rollable-row[data-index="' + index + '"] .cv-toggle-label');
                if (rollableLabel) rollableLabel.textContent = displayName;
                document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
            });
            nameInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === 'Escape') nameInput.blur();
            });
            row.appendChild(nameInput);

            if (!stat.isProficiencyStat) {
                if (sys === 'pf2e') {
                    row.appendChild(buildRankPillBar(stat));
                } else if (sys !== 'daggerheart') {
                    var profDot = document.createElement('button');
                    profDot.className = 'stat-edit-prof-dot' + (stat.proficient ? ' active' : '');
                    profDot.title = t('stat.proficient');
                    profDot.addEventListener('click', function () {
                        stat.proficient = !stat.proficient;
                        profDot.classList.toggle('active', stat.proficient);
                        scheduleSave();
                        reRenderModuleBody();
                    });
                    row.appendChild(profDot);
                }
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'stat-manage-delete';
            deleteBtn.title = t('stat.deleteStat');
            deleteBtn.innerHTML = cvIcon('x', 12);
            deleteBtn.addEventListener('click', function () {
                data.content.stats.splice(index, 1);
                scheduleSave();
                refreshAfterListChange();
                document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
            });
            row.appendChild(deleteBtn);

            return row;
        }

        function renderManageRows() {
            manageList.innerHTML = '';
            data.content.stats.forEach(function (stat, i) {
                manageList.appendChild(buildManageRow(stat, i));
            });
            if (manageList._sortable) manageList._sortable.destroy();
            manageList._sortable = new Sortable(manageList, {
                handle: '.stat-manage-drag',
                animation: 150,
                ghostClass: 'stat-ghost',
                draggable: '.stat-manage-row',
                onEnd: function () {
                    var rows = Array.from(manageList.querySelectorAll('.stat-manage-row'));
                    data.content.stats = rows.map(function (r) { return data.content.stats[parseInt(r.dataset.index, 10)]; }).filter(Boolean);
                    rows.forEach(function (r, i) { r.dataset.index = i; });
                    scheduleSave();
                    renderRollableList();
                    reRenderModuleBody();
                    document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
                },
            });
        }

        renderManageRows();
        body.appendChild(manageList);

        const addStatBtn = document.createElement('button');
        addStatBtn.type = 'button';
        addStatBtn.className = 'btn-secondary sm';
        addStatBtn.innerHTML = cvIcon('plus', 14) + ' ' + escapeHtml(t('stat.addStat'));
        addStatBtn.addEventListener('click', function () {
            data.content.stats.push({ name: '', value: 0, modifier: 0, proficient: false, proficiencyRank: 'untrained', rollable: true });
            scheduleSave();
            refreshAfterListChange();
            document.dispatchEvent(new CustomEvent('cv:stats-changed', { detail: { moduleId: data.id } }));
        });
        body.appendChild(addStatBtn);

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
                reRenderModuleBody();
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

        function renderRollableList() {
            rollableList.innerHTML = '';
            data.content.stats.forEach(function (stat, i) {
                if (stat.isProficiencyStat) return;

                var row = document.createElement('div');
                row.className = 'stat-settings-rollable-row';
                row.dataset.index = i;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'cv-toggle-label';
                nameSpan.textContent = stat.name || t('stat.unnamed');
                row.appendChild(nameSpan);

                var toggle = window.makeCvToggle(!!stat.rollable, function (checked) {
                    stat.rollable = checked;
                    scheduleSave();
                    reRenderModuleBody();
                });
                row.appendChild(toggle);
                rollableList.appendChild(row);
            });
        }

        renderRollableList();
        body.appendChild(rollableList);

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
                            var existing = data.content.stats.find(function (es) {
                                return es.name.toLowerCase() === bs.name.toLowerCase();
                            });
                            if (existing) existing.value = bs.value;
                        });
                    }
                    refreshAfterListChange();
                    scheduleSave();
                    window.showToast(t('stat.getFromBoardSuccess'));
                }
            } catch (e) {
                console.warn('[CV] Stat Eyedropper failed:', e);
            }
        });
        body.appendChild(getFromBoardBtn);

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
            if (typeDef && bodyEl) typeDef.renderBody(bodyEl, m);
        });
    });
})();
