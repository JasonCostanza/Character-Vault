// ── Spells Module ──
(function () {
    // ── Constants ──
    const DICE_REGEX = /\b\d+d\d+([+-]\d+)?\b/i;
    const _prepModeModules = new Set();

    // ── Helpers ──
    function isDiceNotation(val) {
        return DICE_REGEX.test(String(val));
    }

    function extractDiceRoll(val) {
        const m = String(val).match(DICE_REGEX);
        return m ? m[0] : null;
    }

    function defaultContent() {
        return {
            autoSpendSlots: true,
            showSlotErrors: true,
            resourcePools: [],
            categories: [],
            attributes: [],
            sortBy: null,
            sortDir: 'asc',
            linkedStatModuleId: null,
            spellcastingAbility: null,
            spellProficiencyRank: 'untrained',
            spellAttackOverride: null,
            spellDCOverride: null,
            casterType: null,
        };
    }

    function migrateContent(content) {
        const keySet = new Map();
        content.categories.forEach((cat) => {
            (cat.spells || []).forEach((spell) => {
                if (Array.isArray(spell.attributes)) {
                    spell.attributes.forEach((a) => {
                        if (a.key && !keySet.has(a.key)) {
                            keySet.set(a.key, generateId('attr'));
                        }
                    });
                }
            });
        });
        content.attributes = [];
        keySet.forEach((id, key) => {
            content.attributes.push({ id, name: key, type: 'text', defaultValue: '', pinned: true, builtIn: false });
        });
        content.categories.forEach((cat) => {
            (cat.spells || []).forEach((spell, i) => {
                spell.values = {};
                if (Array.isArray(spell.attributes)) {
                    spell.attributes.forEach((a) => {
                        const attrId = keySet.get(a.key);
                        if (attrId) spell.values[attrId] = a.value || '';
                    });
                    delete spell.attributes;
                }
                if (spell.order === undefined) spell.order = i;
                if (spell.expanded === undefined) spell.expanded = false;
            });
        });
        if (content.sortBy === undefined) content.sortBy = null;
        if (!content.sortDir) content.sortDir = 'asc';
    }

    function ensureContent(data) {
        if (!data.content || typeof data.content !== 'object' || Array.isArray(data.content)) {
            data.content = defaultContent();
            return;
        }
        const c = data.content;
        if (c.autoSpendSlots === undefined) c.autoSpendSlots = true;
        if (c.showSlotErrors === undefined) c.showSlotErrors = true;
        if (!Array.isArray(c.resourcePools)) {
            c.resourcePools = (c.slotLevels || []).map((sl) => ({
                id: sl.id,
                type: 'spell-slot',
                level: sl.level,
                name: null,
                max: sl.max,
                spent: sl.spent,
            }));
            delete c.slotLevels;
        }
        if (!Array.isArray(c.categories)) c.categories = [];
        const needsMigration =
            !Array.isArray(c.attributes) ||
            c.categories.some((cat) => (cat.spells || []).some((spell) => Array.isArray(spell.attributes)));
        if (needsMigration) {
            migrateContent(c);
        } else {
            if (c.sortBy === undefined) c.sortBy = null;
            if (!c.sortDir) c.sortDir = 'asc';
        }
        if (c.linkedStatModuleId === undefined) c.linkedStatModuleId = null;
        if (c.spellcastingAbility === undefined) c.spellcastingAbility = null;
        if (c.spellProficiencyRank === undefined) c.spellProficiencyRank = 'untrained';
        if (c.spellAttackOverride === undefined) c.spellAttackOverride = null;
        if (c.spellDCOverride === undefined) c.spellDCOverride = null;
        // Migrate categories: slotLevel → resourcePoolId
        c.categories.forEach((cat) => {
            if (!('resourcePoolId' in cat)) {
                if (cat.slotLevel == null) {
                    cat.resourcePoolId = null;
                } else {
                    const pool = c.resourcePools.find((p) => p.type === 'spell-slot' && p.level === cat.slotLevel);
                    cat.resourcePoolId = pool ? pool.id : null;
                }
                delete cat.slotLevel;
            }
            (cat.spells || []).forEach((spell) => {
                if (spell.slotCost === undefined) spell.slotCost = null;
                if (spell.canUpcast === undefined) spell.canUpcast = false;
                if (spell.preparedCount === undefined) spell.preparedCount = 0;
                if (spell.castsUsed === undefined) spell.castsUsed = 0;
            });
        });
        if (c.casterType === undefined) c.casterType = null;
    }

    function getSortedSpells(content, spells) {
        const sorted = spells.slice();
        if (content.sortBy === null) {
            sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
            return sorted;
        }
        const dir = content.sortDir === 'desc' ? -1 : 1;
        if (content.sortBy === '__name__') {
            sorted.sort((a, b) => {
                const an = (a.name || '').toLowerCase();
                const bn = (b.name || '').toLowerCase();
                if (an < bn) return -dir;
                if (an > bn) return dir;
                return 0;
            });
            return sorted;
        }
        const attr = content.attributes.find((a) => a.id === content.sortBy);
        sorted.sort((a, b) => {
            const av =
                a.values && a.values[content.sortBy] != null ? a.values[content.sortBy] : attr ? attr.defaultValue : '';
            const bv =
                b.values && b.values[content.sortBy] != null ? b.values[content.sortBy] : attr ? attr.defaultValue : '';
            if (attr && attr.type === 'number') {
                return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
            }
            if (attr && attr.type === 'toggle') {
                return ((av ? 1 : 0) - (bv ? 1 : 0)) * dir;
            }
            const as = String(av || '').toLowerCase();
            const bs = String(bv || '').toLowerCase();
            if (as < bs) return -dir;
            if (as > bs) return dir;
            return 0;
        });
        return sorted;
    }

    // ── Linked Stat Module Helpers ──
    function getLinkedStatNames(data) {
        var linkedId = data.content ? data.content.linkedStatModuleId : null;
        return window.getLinkedStatNames(linkedId);
    }

    // ── Spell Attack / DC Computation ──
    function spellsIsSupported(sys) {
        return sys === 'dnd5e' || sys === 'pf2e' || sys === 'custom';
    }

    function spellsComputeAttackBonus(content) {
        var sys = window.gameSystem || 'custom';
        if (!spellsIsSupported(sys)) return null;
        if (
            content.spellAttackOverride !== null &&
            content.spellAttackOverride !== undefined &&
            content.spellAttackOverride !== ''
        ) {
            return Number(content.spellAttackOverride);
        }
        var abilityMod = 0;
        if (content.spellcastingAbility) {
            var mod =
                typeof window.getAbilityModifierFrom === 'function'
                    ? window.getAbilityModifierFrom(content.spellcastingAbility, content.linkedStatModuleId)
                    : null;
            abilityMod = mod !== null && mod !== undefined ? Number(mod) : 0;
        }
        var profBonus =
            sys === 'pf2e'
                ? typeof window.computePf2eProficiencyBonus === 'function'
                    ? window.computePf2eProficiencyBonus(content.spellProficiencyRank || 'untrained')
                    : 0
                : typeof window.getProficiencyBonus === 'function'
                  ? window.getProficiencyBonus()
                  : 2;
        return abilityMod + profBonus;
    }

    function spellsComputeSpellDC(content) {
        var sys = window.gameSystem || 'custom';
        if (!spellsIsSupported(sys)) return null;
        if (
            content.spellDCOverride !== null &&
            content.spellDCOverride !== undefined &&
            content.spellDCOverride !== ''
        ) {
            return Number(content.spellDCOverride);
        }
        // DC uses the full attack value including any attack override — spell attack and DC always move together.
        var attack = spellsComputeAttackBonus(content);
        if (attack === null) return null;
        var base = sys === 'pf2e' ? 10 : 8;
        return base + attack;
    }

    function spellsFormatAttackBonus(content) {
        var val = spellsComputeAttackBonus(content);
        if (val === null) return '--';
        return (val >= 0 ? '+' : '') + val;
    }

    function spellsFormatDC(content) {
        var val = spellsComputeSpellDC(content);
        if (val === null) return '--';
        return String(val);
    }

    // ── Render Helpers ──
    function enterSpellBonusQuickEdit(chipEl, overrideKey, content, data, bodyEl) {
        window.openEditPopover(chipEl, {
            label: t('spells.' + overrideKey),
            value: content[overrideKey] !== null && content[overrideKey] !== undefined ? content[overrideKey] : '',
            type: 'number',
            allowEmpty: true,
            onSave(val) {
                content[overrideKey] = val;
                scheduleSave();
                bodyEl.innerHTML = '';
                renderSpellsPlay(bodyEl, data);
            },
        });
    }

    function computeSlotDelta(slotIndex, sl) {
        const isSpent = slotIndex >= sl.max - sl.spent;
        const newSpent = isSpent ? sl.max - 1 - slotIndex : sl.max - slotIndex;
        return newSpent - sl.spent;
    }

    function makeSlotTooltip(slotIndex, sl) {
        const delta = computeSlotDelta(slotIndex, sl);
        if (delta === 0) return null;
        const tip = document.createElement('span');
        if (delta > 0) {
            tip.className = 'spell-slot-tooltip spell-slot-tooltip--spend';
            tip.textContent = `-${delta}`;
        } else {
            tip.className = 'spell-slot-tooltip spell-slot-tooltip--recover';
            tip.textContent = `+${Math.abs(delta)}`;
        }
        return tip;
    }

    function updatePipSpent(slotIndex, sl, bodyEl, data) {
        if (slotIndex >= sl.max - sl.spent) {
            sl.spent = sl.max - 1 - slotIndex;
        } else {
            sl.spent = sl.max - slotIndex;
        }
        scheduleSave();
        bodyEl.innerHTML = '';
        renderSpellsPlay(bodyEl, data);
    }

    function handleSortClick(columnKey, content, bodyEl, data, renderFn) {
        if (content.sortBy !== columnKey) {
            content.sortBy = columnKey;
            content.sortDir = 'asc';
        } else if (content.sortDir === 'asc') {
            content.sortDir = 'desc';
        } else {
            content.sortBy = null;
            content.sortDir = 'asc';
        }
        scheduleSave();
        bodyEl.innerHTML = '';
        renderFn(bodyEl, data);
    }

    function buildSortColHeader(text, columnKey, content) {
        const th = document.createElement('th');
        th.className = 'spells-col-header';
        const span = document.createElement('span');
        span.textContent = text;
        th.appendChild(span);
        if (content.sortBy === columnKey) {
            th.classList.add('active-sort');
            const indicator = document.createElement('span');
            indicator.className = 'spells-sort-indicator';
            indicator.textContent = content.sortDir === 'desc' ? ' ▼' : ' ▲';
            th.appendChild(indicator);
        }
        return th;
    }

    // ── Chain Link Indicator ──
    function updateSpellsChainIcon(moduleEl, data) {
        window.updateChainLinkIndicator(moduleEl, 'spells', 'spells.linkedTo', data);
    }

    // ── Module Body (Table Layout) ──
    function renderSpellsPlay(bodyEl, data) {
        const preparationMode = _prepModeModules.has(data.id);
        renderSlotSummaryBar(bodyEl, data, bodyEl, preparationMode);
        const container = document.createElement('div');
        container.className = 'spells-container';
        if (data.content.categories.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'spells-empty-state';
            empty.textContent = t('spells.emptyState');
            container.appendChild(empty);
        } else {
            data.content.categories.forEach((cat) => {
                renderCategoryBlock(container, cat, data, bodyEl, preparationMode);
            });
        }
        bodyEl.appendChild(container);
    }

    function renderSlotSummaryBar(container, data, bodyEl, preparationMode) {
        const summary = document.createElement('div');
        summary.className = 'spells-slots-summary';
        const bar = document.createElement('div');
        bar.className = 'spells-slots-bar';
        const sorted = data.content.resourcePools.slice().sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity));
        sorted.forEach((sl) => {
            const group = document.createElement('div');
            group.className = 'spells-slot-group';
            const label = document.createElement('span');
            label.className = 'spells-slot-label';
            label.textContent = getPoolLabel(sl);
            group.appendChild(label);
            const pillBar = document.createElement('div');
            pillBar.className = 'spell-slot-pills';
            for (let i = 0; i < sl.max; i++) {
                const pill = document.createElement('button');
                const isSpent = i >= sl.max - sl.spent;
                pill.className = 'spell-slot-pill' + (isSpent ? ' spent' : '');
                pill.textContent = String(i + 1);
                const slotIndex = i;
                pill.addEventListener('click', () => updatePipSpent(slotIndex, sl, bodyEl, data));
                const tip = makeSlotTooltip(i, sl);
                if (tip) pill.appendChild(tip);
                pillBar.appendChild(pill);
            }
            group.appendChild(pillBar);
            bar.appendChild(group);
        });
        const sys = window.gameSystem || 'custom';
        if (spellsIsSupported(sys)) {
            const attack = spellsComputeAttackBonus(data.content);
            const dc = spellsComputeSpellDC(data.content);
            if (attack !== null || dc !== null) {
                const bonusStrip = document.createElement('div');
                bonusStrip.className = 'spells-bonus-strip';
                if (attack !== null) {
                    const isOverride =
                        data.content.spellAttackOverride !== null &&
                        data.content.spellAttackOverride !== undefined &&
                        data.content.spellAttackOverride !== '';
                    const attackChip = document.createElement('span');
                    attackChip.className = 'spells-bonus-chip' + (isOverride ? ' spells-bonus-chip--override' : '');
                    attackChip.dataset.type = 'attack';
                    attackChip.textContent = spellsFormatAttackBonus(data.content) + ' ' + t('spells.attackLabel');
                    if (isOverride) attackChip.title = t('spells.bonusOverrideIndicator');
                    attackChip.addEventListener('click', function (e) {
                        if (e.ctrlKey) {
                            e.stopPropagation();
                            enterSpellBonusQuickEdit(attackChip, 'spellAttackOverride', data.content, data, bodyEl);
                        }
                    });
                    bonusStrip.appendChild(attackChip);
                }
                if (dc !== null) {
                    const isDCOverride =
                        data.content.spellDCOverride !== null &&
                        data.content.spellDCOverride !== undefined &&
                        data.content.spellDCOverride !== '';
                    const dcChip = document.createElement('span');
                    dcChip.className = 'spells-bonus-chip' + (isDCOverride ? ' spells-bonus-chip--override' : '');
                    dcChip.dataset.type = 'dc';
                    dcChip.textContent = t('spells.dcLabel') + ' ' + spellsFormatDC(data.content);
                    if (isDCOverride) dcChip.title = t('spells.bonusOverrideIndicator');
                    dcChip.addEventListener('click', function (e) {
                        if (e.ctrlKey) {
                            e.stopPropagation();
                            enterSpellBonusQuickEdit(dcChip, 'spellDCOverride', data.content, data, bodyEl);
                        }
                    });
                    bonusStrip.appendChild(dcChip);
                }
                summary.appendChild(bonusStrip);
            }
        }
        summary.appendChild(bar);
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn-secondary sm';
        restoreBtn.textContent = t('spells.restoreAll');
        restoreBtn.addEventListener('click', () => {
            data.content.resourcePools.forEach((pool) => {
                pool.spent = 0;
            });
            data.content.categories.forEach((cat) => {
                (cat.spells || []).forEach((spell) => {
                    spell.castsUsed = 0;
                });
            });
            scheduleSave();
            bodyEl.innerHTML = '';
            renderSpellsPlay(bodyEl, data);
        });
        summary.appendChild(restoreBtn);
        if (data.content.casterType === 'prepared') {
            if (preparationMode) {
                const doneBtn = document.createElement('button');
                doneBtn.className = 'btn-secondary sm';
                doneBtn.textContent = t('spells.donePreparing');
                doneBtn.addEventListener('click', () => {
                    _prepModeModules.delete(data.id);
                    scheduleSave();
                    bodyEl.innerHTML = '';
                    renderSpellsPlay(bodyEl, data);
                });
                summary.appendChild(doneBtn);
            } else {
                const prepBtn = document.createElement('button');
                prepBtn.className = 'btn-secondary sm';
                prepBtn.textContent = t('spells.prepareSpells');
                prepBtn.addEventListener('click', () => {
                    _prepModeModules.add(data.id);
                    data.content.categories.forEach((cat) => {
                        (cat.spells || []).forEach((spell) => {
                            spell.castsUsed = 0;
                        });
                    });
                    scheduleSave();
                    bodyEl.innerHTML = '';
                    renderSpellsPlay(bodyEl, data);
                });
                summary.appendChild(prepBtn);
            }
        }
        container.appendChild(summary);
    }

    function renderCategoryBlock(container, cat, data, bodyEl, preparationMode) {
        const block = document.createElement('div');
        block.className = 'spells-category-block';
        block.dataset.catId = cat.id;
        renderCategoryHeader(block, cat, data, bodyEl, preparationMode);
        const pinnedAttrs = data.content.attributes.filter((a) => a.pinned);
        const table = document.createElement('table');
        table.className = 'spells-table';
        const thead = document.createElement('thead');
        renderSpellTableHeaders(thead, data, bodyEl, pinnedAttrs, preparationMode);
        const tbody = document.createElement('tbody');
        const sorted = getSortedSpells(data.content, cat.spells || []);
        sorted.forEach((spell) => {
            renderSpellRow(spell, cat, data, tbody, bodyEl, pinnedAttrs, preparationMode);
        });
        if ((cat.spells || []).length === 0) {
            const emptyTr = document.createElement('tr');
            const emptyTd = document.createElement('td');
            emptyTd.colSpan = 2 + pinnedAttrs.length + 1;
            emptyTd.className = 'spells-empty-state';
            emptyTd.textContent = t('spells.emptyCategory');
            emptyTr.appendChild(emptyTd);
            tbody.appendChild(emptyTr);
        }
        table.appendChild(thead);
        table.appendChild(tbody);
        if (cat.collapsed) table.style.display = 'none';
        block.appendChild(table);
        container.appendChild(block);
    }

    function renderCategoryHeader(blockEl, cat, data, bodyEl, preparationMode) {
        const header = document.createElement('div');
        header.className = 'spells-cat-header';
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'spells-cat-collapse-btn' + (cat.collapsed ? '' : ' expanded');
        collapseBtn.innerHTML = cvIcon('chevron-right', 10);
        const catName = document.createElement('span');
        catName.className = 'spells-cat-name';
        catName.textContent = cat.name || t('spells.unnamedCategory');
        header.appendChild(collapseBtn);
        header.appendChild(catName);
        const addSpellBtn = document.createElement('button');
        addSpellBtn.className = 'spells-cat-add-btn';
        addSpellBtn.title = t('spells.addSpell');
        addSpellBtn.innerHTML = cvIcon('plus', 12);
        addSpellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const moduleEl = blockEl.closest('.module');
            if (moduleEl) addSpellToCategory(moduleEl, data, cat.id);
        });
        header.appendChild(addSpellBtn);
        const catSys = window.gameSystem || 'custom';
        if (spellsIsSupported(catSys)) {
            const catAttack = spellsComputeAttackBonus(data.content);
            const catDC = spellsComputeSpellDC(data.content);
            if (catAttack !== null || catDC !== null) {
                const badgesDiv = document.createElement('div');
                badgesDiv.className = 'spells-cat-bonus-badges';
                if (catAttack !== null) {
                    const isOverride =
                        data.content.spellAttackOverride !== null &&
                        data.content.spellAttackOverride !== undefined &&
                        data.content.spellAttackOverride !== '';
                    const attackBadge = document.createElement('span');
                    attackBadge.className =
                        'spells-cat-bonus-badge' + (isOverride ? ' spells-cat-bonus-badge--override' : '');
                    attackBadge.dataset.type = 'attack';
                    attackBadge.textContent = spellsFormatAttackBonus(data.content);
                    attackBadge.addEventListener('click', function (e) {
                        if (e.ctrlKey) {
                            e.stopPropagation();
                            enterSpellBonusQuickEdit(attackBadge, 'spellAttackOverride', data.content, data, bodyEl);
                        }
                    });
                    badgesDiv.appendChild(attackBadge);
                }
                if (catDC !== null) {
                    const isDCOverride =
                        data.content.spellDCOverride !== null &&
                        data.content.spellDCOverride !== undefined &&
                        data.content.spellDCOverride !== '';
                    const dcBadge = document.createElement('span');
                    dcBadge.className =
                        'spells-cat-bonus-badge' + (isDCOverride ? ' spells-cat-bonus-badge--override' : '');
                    dcBadge.dataset.type = 'dc';
                    dcBadge.textContent = t('spells.dcLabel') + ' ' + spellsFormatDC(data.content);
                    dcBadge.addEventListener('click', function (e) {
                        if (e.ctrlKey) {
                            e.stopPropagation();
                            enterSpellBonusQuickEdit(dcBadge, 'spellDCOverride', data.content, data, bodyEl);
                        }
                    });
                    badgesDiv.appendChild(dcBadge);
                }
                header.appendChild(badgesDiv);
            }
        }
        if (cat.resourcePoolId !== null) {
            const sl = data.content.resourcePools.find((p) => p.id === cat.resourcePoolId);
            if (sl) {
                const pipsDiv = document.createElement('div');
                pipsDiv.className = 'spells-cat-pips';
                const catPillBar = document.createElement('div');
                catPillBar.className = 'spell-slot-pills';
                for (let i = 0; i < sl.max; i++) {
                    const pill = document.createElement('button');
                    const isSpent = i >= sl.max - sl.spent;
                    pill.className = 'spell-slot-pill' + (isSpent ? ' spent' : '');
                    pill.textContent = String(i + 1);
                    const slotIndex = i;
                    pill.addEventListener('click', (e) => {
                        e.stopPropagation();
                        updatePipSpent(slotIndex, sl, bodyEl, data);
                    });
                    const catTip = makeSlotTooltip(i, sl);
                    if (catTip) pill.appendChild(catTip);
                    catPillBar.appendChild(pill);
                }
                pipsDiv.appendChild(catPillBar);
                header.appendChild(pipsDiv);
            }
        }
        if (preparationMode) {
            const bulkActions = document.createElement('div');
            bulkActions.className = 'spell-prep-bulk-actions';
            const prepAllBtn = document.createElement('button');
            prepAllBtn.className = 'spell-prep-bulk-btn spell-prep-bulk-btn--prepare';
            prepAllBtn.textContent = t('spells.prepareAll');
            prepAllBtn.title = t('spells.prepareAll');
            prepAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                (cat.spells || []).forEach((spell) => {
                    if ((spell.preparedCount || 0) === 0) spell.preparedCount = 1;
                    const row = blockEl.querySelector(`tr[data-spell-id="${spell.id}"]`);
                    if (row) {
                        const countEl = row.querySelector('.spell-prepare-count');
                        if (countEl) countEl.textContent = String(spell.preparedCount);
                    }
                });
                scheduleSave();
            });
            const bulkDivider = document.createElement('span');
            bulkDivider.className = 'spell-prep-bulk-divider';
            const unprepAllBtn = document.createElement('button');
            unprepAllBtn.className = 'spell-prep-bulk-btn spell-prep-bulk-btn--unprepare';
            unprepAllBtn.textContent = t('spells.unprepareAll');
            unprepAllBtn.title = t('spells.unprepareAll');
            unprepAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                (cat.spells || []).forEach((spell) => {
                    spell.preparedCount = 0;
                    const row = blockEl.querySelector(`tr[data-spell-id="${spell.id}"]`);
                    if (row) {
                        const countEl = row.querySelector('.spell-prepare-count');
                        if (countEl) countEl.textContent = '0';
                    }
                });
                scheduleSave();
            });
            bulkActions.appendChild(prepAllBtn);
            bulkActions.appendChild(bulkDivider);
            bulkActions.appendChild(unprepAllBtn);
            header.appendChild(bulkActions);
        }
        function toggleCollapse() {
            cat.collapsed = !cat.collapsed;
            collapseBtn.classList.toggle('expanded', !cat.collapsed);
            const table = blockEl.querySelector('.spells-table');
            if (table) table.style.display = cat.collapsed ? 'none' : '';
            scheduleSave();
        }
        collapseBtn.addEventListener('click', toggleCollapse);
        header.addEventListener('click', (e) => {
            if (
                e.target.closest('.spells-cat-pips') ||
                e.target.closest('.spells-cat-collapse-btn') ||
                e.target.closest('.spells-cat-bonus-badges') ||
                e.target.closest('.spell-prep-bulk-actions') ||
                e.target.closest('.spells-cat-add-btn')
            )
                return;
            toggleCollapse();
        });
        blockEl.appendChild(header);
    }

    function renderSpellTableHeaders(thead, data, bodyEl, pinnedAttrs, preparationMode) {
        const content = data.content;
        const tr = document.createElement('tr');
        const chevTh = document.createElement('th');
        chevTh.style.width = '20px';
        tr.appendChild(chevTh);
        const nameTh = buildSortColHeader(t('spells.spellName'), '__name__', content);
        nameTh.addEventListener('click', () => handleSortClick('__name__', content, bodyEl, data, renderSpellsPlay));
        tr.appendChild(nameTh);
        pinnedAttrs.forEach((attr) => {
            const th = buildSortColHeader(attr.name, attr.id, content);
            th.addEventListener('click', () => handleSortClick(attr.id, content, bodyEl, data, renderSpellsPlay));
            tr.appendChild(th);
        });
        const castTh = document.createElement('th');
        castTh.className = 'spells-cast-th';
        castTh.style.width = '40px';
        castTh.textContent = preparationMode
            ? t('spells.prepareColumn')
            : content.casterType === 'prepared'
              ? t('spells.preparedColumn')
              : t('spells.castColumn');
        tr.appendChild(castTh);
        thead.appendChild(tr);
    }

    function makeSpellDrawerToolbarBtn(iconName, label, extraClass, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'spells-drawer-toolbar-btn' + (extraClass ? ' ' + extraClass : '');
        btn.innerHTML = cvIcon(iconName, 11);
        btn.appendChild(document.createTextNode(' ' + label));
        btn.addEventListener('click', onClick);
        return btn;
    }

    function renderSpellRow(spell, cat, data, tbody, bodyEl, pinnedAttrs, preparationMode) {
        const tr = document.createElement('tr');
        tr.className = 'spells-row';
        tr.dataset.spellId = spell.id;
        const chevTd = document.createElement('td');
        const chevBtn = document.createElement('button');
        chevBtn.className = 'spells-chevron-btn' + (spell.expanded ? ' expanded' : '');
        chevBtn.innerHTML = cvIcon('chevron-right', 10);
        chevTd.appendChild(chevBtn);
        tr.appendChild(chevTd);
        const nameTd = document.createElement('td');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'spells-name-display';
        nameSpan.textContent = spell.name || '';
        nameTd.appendChild(nameSpan);
        tr.appendChild(nameTd);
        pinnedAttrs.forEach((attr) => {
            const td = document.createElement('td');
            const valSpan = document.createElement('span');
            valSpan.className = 'spells-attr-display';
            valSpan.textContent = spell.values && spell.values[attr.id] != null ? spell.values[attr.id] : '';
            td.appendChild(valSpan);
            tr.appendChild(td);
        });
        const castTd = document.createElement('td');
        if (preparationMode) {
            const stepper = document.createElement('div');
            stepper.className = 'spell-prepare-stepper';
            const downBtn = document.createElement('button');
            downBtn.className = 'spell-prepare-step-btn';
            downBtn.textContent = '−';
            const countEl = document.createElement('span');
            countEl.className = 'spell-prepare-count';
            countEl.textContent = String(spell.preparedCount || 0);
            const upBtn = document.createElement('button');
            upBtn.className = 'spell-prepare-step-btn';
            upBtn.textContent = '+';
            downBtn.addEventListener('click', () => {
                spell.preparedCount = Math.max(0, (spell.preparedCount || 0) - 1);
                countEl.textContent = String(spell.preparedCount);
            });
            upBtn.addEventListener('click', () => {
                spell.preparedCount = (spell.preparedCount || 0) + 1;
                countEl.textContent = String(spell.preparedCount);
            });
            stepper.appendChild(downBtn);
            stepper.appendChild(countEl);
            stepper.appendChild(upBtn);
            castTd.appendChild(stepper);
        } else {
            const isPrepared = data.content.casterType === 'prepared';
            const preparedCount = spell.preparedCount || 0;
            const castsUsed = spell.castsUsed || 0;
            const prepDisabled = isPrepared && (preparedCount === 0 || castsUsed >= preparedCount);
            if (prepDisabled) {
                const castBtn = document.createElement('button');
                castBtn.className =
                    'spells-cast-btn' + (preparedCount === 0 ? ' spell-unprepared' : ' spell-exhausted');
                castBtn.title = preparedCount === 0 ? t('spells.notPreparedError') : t('spells.preparedExhaustedError');
                castBtn.textContent = '0';
                castBtn.disabled = true;
                castTd.appendChild(castBtn);
            } else {
                const castLabel = isPrepared ? String(preparedCount - castsUsed) : '⚡';
                let showedPicker = false;
                const basePool =
                    cat.resourcePoolId != null
                        ? data.content.resourcePools.find((p) => p.id === cat.resourcePoolId)
                        : null;
                const upcastCost = resolveSlotCost(spell);
                if (
                    spell.canUpcast &&
                    basePool &&
                    basePool.type === 'spell-slot' &&
                    data.content.autoSpendSlots &&
                    upcastCost > 0
                ) {
                    const allUpcastPools = data.content.resourcePools
                        .filter(
                            (p) =>
                                p.type === 'spell-slot' &&
                                p.level >= basePool.level &&
                                getAvailableSlots(data, p.id) >= upcastCost
                        )
                        .sort((a, b) => a.level - b.level);
                    if (allUpcastPools.length >= 1) {
                        const picker = document.createElement('div');
                        picker.className = 'spell-upcast-picker';
                        allUpcastPools.forEach((pool) => {
                            const pill = document.createElement('button');
                            pill.className = 'spell-upcast-pill';
                            pill.title = getPoolLabel(pool);
                            pill.textContent = String(pool.level);
                            pill.addEventListener('click', () => {
                                const moduleEl = tbody.closest('.module');
                                if (moduleEl) castSpell(moduleEl, data, spell, cat.id, pool.id);
                            });
                            picker.appendChild(pill);
                        });
                        castTd.appendChild(picker);
                        showedPicker = true;
                    }
                }
                if (!showedPicker) {
                    const castBtn = document.createElement('button');
                    castBtn.className = 'spells-cast-btn';
                    castBtn.title = t('spells.castBtn');
                    castBtn.textContent = castLabel;
                    castBtn.addEventListener('click', () => {
                        const moduleEl = tbody.closest('.module');
                        if (moduleEl) castSpell(moduleEl, data, spell, cat.id);
                    });
                    castTd.appendChild(castBtn);
                }
            }
        }
        tr.appendChild(castTd);
        const drawerTr = document.createElement('tr');
        drawerTr.className = 'spells-drawer';
        drawerTr.style.display = spell.expanded ? '' : 'none';
        const drawerTd = document.createElement('td');
        drawerTd.colSpan = 2 + pinnedAttrs.length + 1;
        drawerTd.className = 'spells-drawer-content-td';
        const drawerContent = document.createElement('div');
        drawerContent.className = 'spells-drawer-content';
        const descDisplay = document.createElement('div');
        descDisplay.className = 'spells-desc-display module-text-display';
        descDisplay.innerHTML = renderMarkdown(spell.description || '');
        drawerContent.appendChild(descDisplay);
        const toolbar = document.createElement('div');
        toolbar.className = 'spells-drawer-toolbar';
        const moduleEl = tbody.closest('.module');
        toolbar.appendChild(
            makeSpellDrawerToolbarBtn('pencil', t('spells.edit'), '', (e) => {
                e.stopPropagation();
                if (moduleEl) openSpellInspect(moduleEl, data, cat.id, spell.id);
            })
        );
        toolbar.appendChild(
            makeSpellDrawerToolbarBtn('send', t('transfer.sendToPlayer'), '', (e) => {
                e.stopPropagation();
                const srcPool = (data.content.resourcePools || []).find((p) => p.id === cat.resourcePoolId);
                const moduleMeta = {
                    attrs: data.content.attributes,
                    categoryName: cat.name,
                    poolDescriptor: srcPool
                        ? { type: srcPool.type, level: srcPool.level ?? null, name: srcPool.name ?? null }
                        : null,
                };
                window.openSendToPlayerModal(spell, 'spells', moduleMeta, data.id, spell.id);
            })
        );
        toolbar.appendChild(
            makeSpellDrawerToolbarBtn('trash', t('spells.delete'), 'spells-drawer-toolbar-btn--delete', (e) => {
                e.stopPropagation();
                if (moduleEl) {
                    showConfirm({ title: t('spells.deleteSpell'), message: t('spells.deleteSpellConfirm') }, () => {
                        deleteSpellFromModule(moduleEl, data, cat.id, spell.id, spell.name);
                    });
                }
            })
        );
        drawerContent.appendChild(toolbar);
        drawerTd.appendChild(drawerContent);
        drawerTr.appendChild(drawerTd);
        chevBtn.addEventListener('click', () => {
            spell.expanded = !spell.expanded;
            chevBtn.classList.toggle('expanded', spell.expanded);
            drawerTr.style.display = spell.expanded ? '' : 'none';
            scheduleSave();
        });
        tbody.appendChild(tr);
        tbody.appendChild(drawerTr);
    }

    // ── Slot Helpers ──
    function getPoolLabel(pool) {
        if (!pool) return '?';
        if (pool.type === 'spell-slot') return t('spells.slotLevelLabel', { n: pool.level });
        return pool.name || t('spells.customPool');
    }

    function resolveSlotCost(spell) {
        if (spell.slotCost === null || spell.slotCost === undefined || spell.slotCost === '') return 1;
        const n = Number(spell.slotCost);
        return Math.max(0, isNaN(n) ? 0 : n);
    }

    function getAvailableSlots(data, poolId) {
        const pool = data.content.resourcePools.find((p) => p.id === poolId);
        return pool ? Math.max(0, pool.max - pool.spent) : 0;
    }

    function spendSlot(data, poolId, cost = 1) {
        if (cost <= 0) return;
        const pool = data.content.resourcePools.find((p) => p.id === poolId);
        if (pool) pool.spent = Math.min(pool.max, pool.spent + cost);
    }

    function findSpellInModule(data, catId, spellId) {
        const cat = (data.content.categories || []).find((c) => c.id === catId);
        if (!cat) return null;
        return (cat.spells || []).find((s) => s.id === spellId) || null;
    }

    // ── Cast Logic ──
    function castSpell(moduleEl, data, spell, catId, overridePoolId) {
        const cat = data.content.categories.find((c) => c.id === catId);
        if (!cat) return;

        const content = data.content;
        const cost = resolveSlotCost(spell);
        const poolId = overridePoolId != null ? overridePoolId : cat.resourcePoolId;

        if (poolId != null && content.autoSpendSlots && cost > 0) {
            const available = getAvailableSlots(data, poolId);
            if (available < cost) {
                if (content.showSlotErrors) {
                    const pool = content.resourcePools.find((p) => p.id === poolId);
                    showToast(t('spells.noSlotsError', { level: getPoolLabel(pool) }), 'error');
                }
                return;
            }
        }

        if (content.casterType === 'prepared') {
            if (spell.preparedCount === 0) {
                showToast(t('spells.notPreparedError'), 'error');
                return;
            }
            if ((spell.castsUsed || 0) >= spell.preparedCount) {
                showToast(t('spells.preparedExhaustedError'), 'error');
                return;
            }
        }

        const values = spell.values || {};
        const rolls = (content.attributes || [])
            .map(function (attr) {
                var raw = values[attr.id];
                if (raw == null || raw === '') return null;
                var resolved =
                    typeof window.resolveDiceExpression === 'function' ? window.resolveDiceExpression(raw) : raw;
                if (!isDiceNotation(resolved)) return null;
                return {
                    name: (spell.name || t('spells.unnamed')) + ': ' + attr.name,
                    roll: extractDiceRoll(resolved),
                };
            })
            .filter(function (x) {
                return x && x.roll;
            });

        let rollPromise = null;
        if (typeof TS !== 'undefined' && rolls.length) {
            try {
                rollPromise = TS.dice.putDiceInTray(rolls);
            } catch (e) {
                console.warn('[CV] Spell dice roll failed:', e);
            }
        }

        let logEntryId = null;
        if (typeof window.logActivity === 'function') {
            const spellName = spell.name || t('spells.unnamed');
            let msg = t('spells.log.cast', { name: spellName });
            if (rolls.length) msg += ' — ' + rolls.map((x) => x.roll).join(', ');
            logEntryId = window.logActivity({ type: 'spells.event.cast', message: msg, sourceModuleId: data.id });
        }

        if (rollPromise) {
            rollPromise.catch(function (e) {
                console.warn('[CV] Spell dice roll failed:', e);
            });
            rollPromise.then(function (rollId) {
                if (rollId) {
                    window.pendingRolls[rollId] = {
                        logEntryId,
                        spellCast: true,
                        moduleId: data.id,
                        catId,
                        spellId: spell.id,
                        poolId,
                        slotCost: cost,
                        autoSpend: content.autoSpendSlots,
                        preparedCast: content.casterType === 'prepared',
                    };
                }
            });
        } else {
            let needsRerender = false;
            if (poolId != null && content.autoSpendSlots && cost > 0) {
                spendSlot(data, poolId, cost);
                needsRerender = true;
            }
            if (content.casterType === 'prepared') {
                spell.castsUsed = (spell.castsUsed || 0) + 1;
                needsRerender = true;
            }
            if (needsRerender) {
                scheduleSave();
                const spellModEl = document.querySelector('.module[data-id="' + data.id + '"]');
                if (spellModEl) {
                    const bodyEl = spellModEl.querySelector('.module-body');
                    if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
                }
            }
        }
    }

    // ── Settings Modal ──
    function openSpellSettings(moduleEl, data) {
        const content = data.content;
        const existing = document.querySelector('.spells-settings-overlay');
        if (existing) {
            if (existing._keyHandler) document.removeEventListener('keydown', existing._keyHandler);
            existing.remove();
        }

        const SVG_TRASH = cvIcon('trash-2', 13);
        const SVG_PIN_ON = cvIcon('pin', 13);
        const SVG_PIN_OFF = cvIcon('pin-off', 13);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay spells-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel spells-settings-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('spells.settingsTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('spells.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const bodyEl = moduleEl.querySelector('.module-body');
        function reRender() {
            if (!bodyEl) return;
            bodyEl.innerHTML = '';
            renderSpellsPlay(bodyEl, data);
            updateSpellsChainIcon(moduleEl, data);
        }

        // ── Behavior Card ──
        const behaviorCard = document.createElement('div');
        behaviorCard.className = 'spells-settings-card';

        const behaviorTitle = document.createElement('div');
        behaviorTitle.className = 'spells-settings-card-title';
        behaviorTitle.textContent = t('spells.behaviorTitle');
        behaviorCard.appendChild(behaviorTitle);

        function makeSettingsToggle(labelKey, descKey, checked, onChange) {
            const row = document.createElement('div');
            row.className = 'spells-settings-toggle-row';
            const textCol = document.createElement('div');
            textCol.className = 'spells-settings-toggle-text';
            const label = document.createElement('span');
            label.className = 'spells-settings-toggle-name';
            label.textContent = t(labelKey);
            textCol.appendChild(label);
            if (descKey) {
                const desc = document.createElement('span');
                desc.className = 'spells-settings-toggle-desc';
                desc.textContent = t(descKey);
                textCol.appendChild(desc);
            }
            const toggle = makeCvToggle(checked, onChange);
            row.appendChild(textCol);
            row.appendChild(toggle);
            return row;
        }

        behaviorCard.appendChild(
            makeSettingsToggle('spells.autoSpendLabel', 'spells.autoSpendDesc', content.autoSpendSlots, (v) => {
                content.autoSpendSlots = v;
                scheduleSave();
            })
        );
        behaviorCard.appendChild(
            makeSettingsToggle('spells.showErrorsLabel', 'spells.showErrorsDesc', content.showSlotErrors, (v) => {
                content.showSlotErrors = v;
                scheduleSave();
            })
        );

        const casterTypeRow = document.createElement('div');
        casterTypeRow.className = 'spells-settings-toggle-row';
        const casterTypeTextCol = document.createElement('div');
        casterTypeTextCol.className = 'spells-settings-toggle-text';
        const casterTypeNameEl = document.createElement('span');
        casterTypeNameEl.className = 'spells-settings-toggle-name';
        casterTypeNameEl.textContent = t('spells.casterType');
        casterTypeTextCol.appendChild(casterTypeNameEl);
        const casterTypeOptions = [
            { value: '', label: t('spells.casterType.none') },
            { value: 'prepared', label: t('spells.casterType.prepared') },
            { value: 'spontaneous', label: t('spells.casterType.spontaneous') },
        ];
        const casterTypeSelect = buildCvSelect(casterTypeOptions, content.casterType || '', (val) => {
            content.casterType = val === '' ? null : val;
            scheduleSave();
            reRender();
        });
        casterTypeRow.appendChild(casterTypeTextCol);
        casterTypeRow.appendChild(casterTypeSelect.el);
        behaviorCard.appendChild(casterTypeRow);

        body.appendChild(behaviorCard);

        // ── Spellcasting Card ──
        {
            const spellcastCard = document.createElement('div');
            spellcastCard.className = 'spells-settings-card';

            const spellcastTitle = document.createElement('div');
            spellcastTitle.className = 'spells-settings-card-title';
            spellcastTitle.textContent = t('spells.spellcastingTitle');
            spellcastCard.appendChild(spellcastTitle);

            const previewEl = document.createElement('div');
            previewEl.className = 'spells-settings-computed-preview';

            let rankRow;

            function refreshPreview() {
                const liveSys = window.gameSystem || 'custom';
                spellcastCard.style.display = spellsIsSupported(liveSys) ? '' : 'none';
                if (rankRow) rankRow.style.display = liveSys === 'pf2e' ? '' : 'none';
                const attack = spellsFormatAttackBonus(content);
                const dc = spellsFormatDC(content);
                previewEl.textContent = t('spells.computedPreview', { attack, dc });
            }

            // Linked stat module row
            const linkRow = document.createElement('div');
            linkRow.className = 'spells-settings-link-row';
            const linkLabel = document.createElement('span');
            linkLabel.className = 'spells-settings-field-label';
            linkLabel.textContent = t('spells.linkedStatModule');

            const abilitySelectWrapper = document.createElement('div');

            function buildAbilitySelect() {
                abilitySelectWrapper.innerHTML = '';
                const names = getLinkedStatNames(data);
                const opts =
                    names.length > 0
                        ? names.map((n) => ({ value: n, label: n }))
                        : [{ value: '', label: t('spells.linkStatFirst') }];
                const currentVal = content.spellcastingAbility || '';
                const sel = buildCvSelect(opts, currentVal, (val) => {
                    content.spellcastingAbility = val || null;
                    scheduleSave();
                    reRender();
                    refreshPreview();
                });
                if (names.length === 0) {
                    sel.el.style.opacity = '0.5';
                    sel.el.style.pointerEvents = 'none';
                }
                abilitySelectWrapper.appendChild(sel.el);
            }

            buildAbilitySelect();

            const statModSelect = buildStatModulePicker(
                content.linkedStatModuleId,
                (val) => {
                    content.linkedStatModuleId = val || null;
                    if (content.spellcastingAbility) {
                        const validNames = getLinkedStatNames(data);
                        const found = validNames.some(
                            (n) => n.toUpperCase() === content.spellcastingAbility.toUpperCase()
                        );
                        if (!found) content.spellcastingAbility = null;
                    }
                    scheduleSave();
                    reRender();
                    buildAbilitySelect();
                    refreshPreview();
                },
                t('spells.noLinkedModule')
            );

            linkRow.appendChild(linkLabel);
            linkRow.appendChild(statModSelect.el);
            spellcastCard.appendChild(linkRow);

            // Casting ability row
            const abilityRow = document.createElement('div');
            abilityRow.className = 'spells-settings-ability-row';
            const abilityLabel = document.createElement('span');
            abilityLabel.className = 'spells-settings-field-label';
            abilityLabel.textContent = t('spells.spellcastingAbility');
            abilityRow.appendChild(abilityLabel);
            abilityRow.appendChild(abilitySelectWrapper);
            spellcastCard.appendChild(abilityRow);

            // PF2e proficiency rank row — always built; refreshPreview() shows/hides it
            rankRow = document.createElement('div');
            rankRow.className = 'spells-settings-rank-row';
            rankRow.style.display = 'none';
            const rankLabel = document.createElement('span');
            rankLabel.className = 'spells-settings-field-label';
            rankLabel.textContent = t('spells.spellProficiency');
            const pillBar = document.createElement('div');
            pillBar.className = 'stat-rank-pills';
            const ranks = [
                { value: 'untrained', letter: 'U' },
                { value: 'trained', letter: 'T' },
                { value: 'expert', letter: 'E' },
                { value: 'master', letter: 'M' },
                { value: 'legendary', letter: 'L' },
            ];
            ranks.forEach((r) => {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className =
                    'stat-rank-pill' + ((content.spellProficiencyRank || 'untrained') === r.value ? ' active' : '');
                pill.textContent = r.letter;
                pill.title = t('rank.' + r.value);
                pill.addEventListener('click', () => {
                    content.spellProficiencyRank = r.value;
                    pillBar.querySelectorAll('.stat-rank-pill').forEach((p) => p.classList.remove('active'));
                    pill.classList.add('active');
                    scheduleSave();
                    reRender();
                    refreshPreview();
                });
                pillBar.appendChild(pill);
            });
            rankRow.appendChild(rankLabel);
            rankRow.appendChild(pillBar);
            spellcastCard.appendChild(rankRow);

            // Override row
            const overrideRow = document.createElement('div');
            overrideRow.className = 'spells-settings-override-row';
            const overrideHintLabel = document.createElement('span');
            overrideHintLabel.className = 'spells-settings-field-label';
            overrideHintLabel.textContent = t('spells.overrideHint');

            const overridePair = document.createElement('div');
            overridePair.className = 'spells-settings-override-pair';

            const attackCol = document.createElement('div');
            attackCol.className = 'spells-add-col';
            const attackColLabel = document.createElement('span');
            attackColLabel.className = 'spells-add-label';
            attackColLabel.textContent = t('spells.spellAttackOverride');
            const attackInput = document.createElement('input');
            attackInput.type = 'number';
            attackInput.className = 'spells-settings-override-input';
            attackInput.placeholder = '--';
            if (content.spellAttackOverride !== null && content.spellAttackOverride !== undefined) {
                attackInput.value = String(content.spellAttackOverride);
            }
            attackInput.addEventListener('change', () => {
                const v = attackInput.value.trim();
                content.spellAttackOverride = v === '' ? null : Number(v);
                scheduleSave();
                reRender();
                refreshPreview();
            });
            attackCol.appendChild(attackColLabel);
            attackCol.appendChild(attackInput);

            const dcCol = document.createElement('div');
            dcCol.className = 'spells-add-col';
            const dcColLabel = document.createElement('span');
            dcColLabel.className = 'spells-add-label';
            dcColLabel.textContent = t('spells.spellDCOverride');
            const dcInput = document.createElement('input');
            dcInput.type = 'number';
            dcInput.className = 'spells-settings-override-input';
            dcInput.placeholder = '--';
            if (content.spellDCOverride !== null && content.spellDCOverride !== undefined) {
                dcInput.value = String(content.spellDCOverride);
            }
            dcInput.addEventListener('change', () => {
                const v = dcInput.value.trim();
                content.spellDCOverride = v === '' ? null : Number(v);
                scheduleSave();
                reRender();
                refreshPreview();
            });
            dcCol.appendChild(dcColLabel);
            dcCol.appendChild(dcInput);

            overridePair.appendChild(attackCol);
            overridePair.appendChild(dcCol);
            overrideRow.appendChild(overrideHintLabel);
            overrideRow.appendChild(overridePair);
            spellcastCard.appendChild(overrideRow);

            refreshPreview();
            spellcastCard.appendChild(previewEl);

            body.appendChild(spellcastCard);
        }

        // ── Tab Bar ──
        const tabIds = ['columns', 'slots', 'categories'];
        const tabKeys = { columns: 'spells.tabColumns', slots: 'spells.tabSlots', categories: 'spells.tabCategories' };
        const panes = {};
        let activeTab = 'columns';

        const tabBar = document.createElement('div');
        tabBar.className = 'spells-settings-tabbar';

        const tabBtns = {};
        tabIds.forEach((id) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'spells-settings-tab' + (id === activeTab ? ' active' : '');
            btn.textContent = t(tabKeys[id]);
            btn.addEventListener('click', () => switchTab(id));
            tabBar.appendChild(btn);
            tabBtns[id] = btn;
        });
        body.appendChild(tabBar);

        function switchTab(id) {
            activeTab = id;
            tabIds.forEach((tid) => {
                tabBtns[tid].classList.toggle('active', tid === id);
                panes[tid].classList.toggle('active', tid === id);
            });
        }

        // ── Columns Pane ──
        const columnsPane = document.createElement('div');
        columnsPane.className = 'spells-settings-pane active';

        const attrListEl = document.createElement('div');
        attrListEl.className = 'spells-attr-list';
        columnsPane.appendChild(attrListEl);

        function getAttrTypeLabel(type) {
            const labels = {
                text: t('spells.attrType.text'),
                number: t('spells.attrType.number'),
                'number-pair': t('spells.attrType.numberPair'),
                toggle: t('spells.attrType.toggle'),
            };
            return labels[type] || type;
        }

        function refreshAttrList() {
            if (attrListEl._sortable) {
                attrListEl._sortable.destroy();
                attrListEl._sortable = null;
            }
            attrListEl.innerHTML = '';
            content.attributes.forEach((attr) => {
                const row = document.createElement('div');
                row.className = 'spells-attr-row';
                row.dataset.attrId = attr.id;

                const dragHandle = document.createElement('span');
                dragHandle.className = 'spells-attr-drag-handle';
                dragHandle.innerHTML = '&#x2807;';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'spells-attr-row-name';
                nameSpan.textContent = attr.name;

                const typeSpan = document.createElement('span');
                typeSpan.className = 'spells-attr-row-type';
                typeSpan.textContent = getAttrTypeLabel(attr.type);

                const pinBtn = document.createElement('button');
                pinBtn.className = 'spells-attr-pin-btn' + (attr.pinned ? ' pinned' : '');
                pinBtn.title = t(attr.pinned ? 'spells.unpinAttr' : 'spells.pinAttr');
                pinBtn.innerHTML = attr.pinned ? SVG_PIN_ON : SVG_PIN_OFF;
                pinBtn.addEventListener('click', () => {
                    attr.pinned = !attr.pinned;
                    scheduleSave();
                    refreshAttrList();
                    reRender();
                });

                row.appendChild(dragHandle);
                row.appendChild(nameSpan);
                row.appendChild(typeSpan);
                row.appendChild(pinBtn);

                if (!attr.builtIn) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'spells-attr-delete-btn';
                    deleteBtn.title = t('spells.deleteAttr');
                    deleteBtn.innerHTML = SVG_TRASH;
                    deleteBtn.addEventListener('click', () => {
                        showConfirm({ title: t('spells.deleteAttr'), message: attr.name + '?' }, () => {
                            content.attributes = content.attributes.filter((a) => a.id !== attr.id);
                            content.categories.forEach((cat) => {
                                (cat.spells || []).forEach((spell) => {
                                    delete spell.values[attr.id];
                                });
                            });
                            scheduleSave();
                            refreshAttrList();
                            reRender();
                        });
                    });
                    row.appendChild(deleteBtn);
                }

                attrListEl.appendChild(row);
            });

            if (content.attributes.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'spells-empty-state';
                empty.style.padding = '8px 0';
                empty.textContent = t('spells.noAttributes');
                attrListEl.appendChild(empty);
            }

            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                attrListEl._sortable = new Sortable(attrListEl, {
                    handle: '.spells-attr-drag-handle',
                    animation: 150,
                    ghostClass: 'spells-attr-ghost',
                    draggable: '.spells-attr-row',
                    onEnd() {
                        const rows = Array.from(attrListEl.querySelectorAll('.spells-attr-row'));
                        content.attributes = rows
                            .map((r) => content.attributes.find((a) => a.id === r.dataset.attrId))
                            .filter(Boolean);
                        scheduleSave();
                        reRender();
                    },
                });
            }
        }

        refreshAttrList();

        const addAttrRow = document.createElement('div');
        addAttrRow.className = 'spells-settings-add-row';

        const newAttrInput = document.createElement('input');
        newAttrInput.type = 'text';
        newAttrInput.className = 'cv-modal-input';
        newAttrInput.style.flex = '0 1 140px';
        newAttrInput.style.minWidth = '80px';
        newAttrInput.placeholder = t('spells.newAttrName') + '…';

        const attrTypeOptions = [
            { value: 'text', label: t('spells.attrType.text') },
            { value: 'number', label: t('spells.attrType.number') },
            { value: 'number-pair', label: t('spells.attrType.numberPair') },
            { value: 'toggle', label: t('spells.attrType.toggle') },
        ];
        const attrTypeSelect = buildCvSelect(attrTypeOptions, 'text', function () {});

        const addAttrBtn = document.createElement('button');
        addAttrBtn.className = 'btn-primary';
        addAttrBtn.textContent = t('spells.addAttribute');
        addAttrBtn.style.whiteSpace = 'nowrap';

        addAttrBtn.addEventListener('click', () => {
            const name = newAttrInput.value.trim();
            if (!name) return;
            const type = attrTypeSelect.getValue();
            const defaultValue =
                type === 'number-pair'
                    ? { current: 0, max: 0 }
                    : type === 'number'
                      ? 0
                      : type === 'toggle'
                        ? false
                        : '';
            const newAttr = { id: generateId('attr'), name, type, defaultValue, pinned: true, builtIn: false };
            content.attributes.push(newAttr);
            content.categories.forEach((cat) => {
                (cat.spells || []).forEach((spell) => {
                    spell.values[newAttr.id] =
                        type === 'number-pair'
                            ? { current: 0, max: 0 }
                            : type === 'number'
                              ? 0
                              : type === 'toggle'
                                ? false
                                : '';
                });
            });
            newAttrInput.value = '';
            scheduleSave();
            refreshAttrList();
            reRender();
        });

        newAttrInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addAttrBtn.click();
        });

        addAttrRow.appendChild(newAttrInput);
        addAttrRow.appendChild(attrTypeSelect.el);
        addAttrRow.appendChild(addAttrBtn);
        columnsPane.appendChild(addAttrRow);

        panes.columns = columnsPane;
        body.appendChild(columnsPane);

        // ── Slots Pane ──
        const slotsPane = document.createElement('div');
        slotsPane.className = 'spells-settings-pane';

        const slotListEl = document.createElement('div');
        slotListEl.className = 'spells-slot-settings-list';
        slotsPane.appendChild(slotListEl);

        let refreshCatList;
        let refreshAddCatSelect;

        function refreshSlotList() {
            slotListEl.innerHTML = '';
            content.resourcePools.forEach((pool) => {
                const row = document.createElement('div');
                row.className = 'spells-slot-settings-row';

                const badge = document.createElement('span');
                badge.className = 'pool-type-badge pool-type-badge--' + pool.type;
                badge.textContent = t('spells.poolType.' + (pool.type === 'spell-slot' ? 'spellSlot' : pool.type));
                row.appendChild(badge);

                if (pool.type === 'spell-slot') {
                    const levelLabel = document.createElement('span');
                    levelLabel.className = 'spells-slot-settings-label';
                    levelLabel.textContent = getPoolLabel(pool);
                    row.appendChild(levelLabel);
                } else {
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.className = 'cv-modal-input';
                    nameInput.style.flex = '1';
                    nameInput.style.minWidth = '0';
                    nameInput.value = pool.name || '';
                    nameInput.placeholder = getPoolLabel(pool);
                    nameInput.addEventListener('blur', () => {
                        pool.name = nameInput.value.trim() || null;
                        scheduleSave();
                        reRender();
                    });
                    row.appendChild(nameInput);
                }

                const maxInput = document.createElement('input');
                maxInput.type = 'number';
                maxInput.className = 'cv-modal-input';
                maxInput.style.width = '56px';
                maxInput.style.flexShrink = '0';
                maxInput.min = '0';
                maxInput.max = '20';
                maxInput.value = String(pool.max);
                maxInput.addEventListener('change', () => {
                    const val = Math.max(0, Math.min(20, parseInt(maxInput.value, 10) || 0));
                    maxInput.value = String(val);
                    pool.max = val;
                    if (pool.spent > pool.max) pool.spent = pool.max;
                    if (pool.type === 'spell-slot') {
                        window.logActivity &&
                            window.logActivity({
                                type: 'spells.event.slot',
                                message: t('spells.log.modifySlot', { level: pool.level, max: val }),
                                sourceModuleId: data.id,
                            });
                    }
                    scheduleSave();
                    reRender();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'spells-settings-delete-btn';
                deleteBtn.title = t('spells.removeSlotLevel');
                deleteBtn.innerHTML = SVG_TRASH;
                deleteBtn.addEventListener('click', () => {
                    const usedByCats = content.categories.some((c) => c.resourcePoolId === pool.id);
                    const doDelete = () => {
                        if (usedByCats)
                            content.categories.forEach((cat) => {
                                if (cat.resourcePoolId === pool.id) cat.resourcePoolId = null;
                            });
                        content.resourcePools = content.resourcePools.filter((p) => p.id !== pool.id);
                        if (pool.type === 'spell-slot') {
                            window.logActivity &&
                                window.logActivity({
                                    type: 'spells.event.slot',
                                    message: t('spells.log.removeSlot', { level: pool.level }),
                                    sourceModuleId: data.id,
                                });
                        }
                        scheduleSave();
                        refreshSlotList();
                        if (refreshCatList) refreshCatList();
                        if (refreshAddCatSelect) refreshAddCatSelect();
                        reRender();
                    };
                    if (usedByCats) {
                        showConfirm(
                            { title: t('spells.removeSlotLevel'), message: t('spells.removeSlotLevelConfirm') },
                            doDelete
                        );
                    } else {
                        doDelete();
                    }
                });

                row.appendChild(maxInput);
                row.appendChild(deleteBtn);
                slotListEl.appendChild(row);
            });

            if (content.resourcePools.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'spells-empty-state';
                empty.style.padding = '8px 0';
                empty.textContent = t('spells.noSlots');
                slotListEl.appendChild(empty);
            }
        }

        refreshSlotList();

        const addSlotRow = document.createElement('div');
        addSlotRow.className = 'spells-settings-add-row';

        const newSlotLevelInput = document.createElement('input');
        newSlotLevelInput.type = 'number';
        newSlotLevelInput.className = 'cv-modal-input';
        newSlotLevelInput.style.width = '56px';
        newSlotLevelInput.style.flexShrink = '0';
        newSlotLevelInput.min = '1';
        newSlotLevelInput.max = '20';
        newSlotLevelInput.placeholder = t('spells.slotLevelPlaceholder');
        newSlotLevelInput.addEventListener('keydown', (e) => {
            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            if (e.key === 'Enter') addSlotBtn.click();
        });

        const newSlotMaxInput = document.createElement('input');
        newSlotMaxInput.type = 'number';
        newSlotMaxInput.className = 'cv-modal-input';
        newSlotMaxInput.style.width = '56px';
        newSlotMaxInput.style.flexShrink = '0';
        newSlotMaxInput.min = '0';
        newSlotMaxInput.max = '20';
        newSlotMaxInput.value = '4';
        newSlotMaxInput.addEventListener('keydown', (e) => {
            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            if (e.key === 'Enter') addSlotBtn.click();
        });

        const addSlotBtn = document.createElement('button');
        addSlotBtn.className = 'spells-settings-add-btn';
        addSlotBtn.title = t('spells.addSlotLevel');
        addSlotBtn.textContent = '+';

        addSlotBtn.addEventListener('click', () => {
            const level = parseInt(newSlotLevelInput.value, 10);
            if (!level || level < 1 || level > 20) return;
            if (content.resourcePools.some((p) => p.type === 'spell-slot' && p.level === level)) return;
            const max = Math.max(0, Math.min(20, parseInt(newSlotMaxInput.value, 10) || 0));
            content.resourcePools.push({ id: generateId('rp'), type: 'spell-slot', level, name: null, max, spent: 0 });
            content.resourcePools.sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity));
            newSlotLevelInput.value = '';
            window.logActivity &&
                window.logActivity({
                    type: 'spells.event.slot',
                    message: t('spells.log.addSlot', { level }),
                    sourceModuleId: data.id,
                });
            scheduleSave();
            refreshSlotList();
            if (refreshCatList) refreshCatList();
            if (refreshAddCatSelect) refreshAddCatSelect();
            reRender();
        });

        const levelCol = document.createElement('div');
        levelCol.className = 'spells-add-col';
        const levelColLabel = document.createElement('span');
        levelColLabel.className = 'spells-add-label';
        levelColLabel.dataset.i18n = 'spells.slotLevelColLabel';
        levelColLabel.textContent = t('spells.slotLevelColLabel');
        levelCol.appendChild(levelColLabel);
        levelCol.appendChild(newSlotLevelInput);

        const maxCol = document.createElement('div');
        maxCol.className = 'spells-add-col';
        const maxColLabel = document.createElement('span');
        maxColLabel.className = 'spells-add-label';
        maxColLabel.dataset.i18n = 'spells.slotMax';
        maxColLabel.textContent = t('spells.slotMax');
        maxCol.appendChild(maxColLabel);
        maxCol.appendChild(newSlotMaxInput);

        addSlotRow.appendChild(levelCol);
        addSlotRow.appendChild(maxCol);
        addSlotRow.appendChild(addSlotBtn);
        slotsPane.appendChild(addSlotRow);

        panes.slots = slotsPane;
        body.appendChild(slotsPane);

        // ── Categories Pane ──
        const categoriesPane = document.createElement('div');
        categoriesPane.className = 'spells-settings-pane';

        const catSettingsListEl = document.createElement('div');
        catSettingsListEl.className = 'spells-cat-settings-list';
        categoriesPane.appendChild(catSettingsListEl);

        function buildSlotOptions() {
            const opts = [{ value: '', label: t('spells.catNoSlot') }];
            content.resourcePools
                .slice()
                .sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity))
                .forEach((pool) => {
                    opts.push({ value: pool.id, label: getPoolLabel(pool) });
                });
            return opts;
        }

        refreshCatList = function () {
            catSettingsListEl.innerHTML = '';
            content.categories.forEach((cat) => {
                const row = document.createElement('div');
                row.className = 'spells-cat-settings-row';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'cv-modal-input';
                nameInput.style.flex = '1';
                nameInput.style.minWidth = '0';
                nameInput.value = cat.name || '';
                nameInput.placeholder = t('spells.categoryNamePlaceholder');
                nameInput.addEventListener('blur', () => {
                    const trimmed = nameInput.value.trim();
                    if (trimmed) {
                        cat.name = trimmed;
                        scheduleSave();
                        reRender();
                    }
                });

                const currentSlotVal = cat.resourcePoolId ?? '';
                const slotSelect = buildCvSelect(buildSlotOptions(), currentSlotVal, (val) => {
                    cat.resourcePoolId = val === '' ? null : val;
                    scheduleSave();
                    reRender();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'spells-settings-delete-btn';
                deleteBtn.title = t('spells.deleteCategory');
                deleteBtn.innerHTML = SVG_TRASH;
                deleteBtn.addEventListener('click', () => {
                    showConfirm(
                        { title: t('spells.deleteCategory'), message: t('spells.deleteCategoryConfirm') },
                        () => {
                            content.categories = content.categories.filter((c) => c.id !== cat.id);
                            scheduleSave();
                            refreshCatList();
                            reRender();
                        }
                    );
                });

                row.appendChild(nameInput);
                row.appendChild(slotSelect.el);
                row.appendChild(deleteBtn);
                catSettingsListEl.appendChild(row);
            });

            if (content.categories.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'spells-empty-state';
                empty.style.padding = '8px 0';
                empty.textContent = t('spells.noCategories');
                catSettingsListEl.appendChild(empty);
            }
        };

        refreshCatList();

        const addCatRow = document.createElement('div');
        addCatRow.className = 'spells-settings-add-row';

        const newCatNameInput = document.createElement('input');
        newCatNameInput.type = 'text';
        newCatNameInput.className = 'cv-modal-input';
        newCatNameInput.style.flex = '1';
        newCatNameInput.style.minWidth = '0';
        newCatNameInput.placeholder = t('spells.categoryNamePlaceholder');

        let newCatPoolId = null;
        let addCatSlotSelectEl = buildCvSelect(buildSlotOptions(), '', (val) => {
            newCatPoolId = val === '' ? null : val;
        }).el;

        refreshAddCatSelect = function () {
            const newSelect = buildCvSelect(buildSlotOptions(), newCatPoolId ?? '', (val) => {
                newCatPoolId = val === '' ? null : val;
            });
            addCatSlotSelectEl.replaceWith(newSelect.el);
            addCatSlotSelectEl = newSelect.el;
        };

        const addCatBtn = document.createElement('button');
        addCatBtn.className = 'spells-settings-add-btn';
        addCatBtn.title = t('spells.addCategoryTitle');
        addCatBtn.textContent = '+';

        addCatBtn.addEventListener('click', () => {
            const name = newCatNameInput.value.trim();
            if (!name) return;
            content.categories.push({
                id: generateId('cat'),
                name,
                resourcePoolId: newCatPoolId,
                collapsed: false,
                spells: [],
            });
            newCatNameInput.value = '';
            newCatPoolId = null;
            scheduleSave();
            refreshCatList();
            reRender();
        });

        newCatNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addCatBtn.click();
        });

        addCatRow.appendChild(newCatNameInput);
        addCatRow.appendChild(addCatSlotSelectEl);
        addCatRow.appendChild(addCatBtn);
        categoriesPane.appendChild(addCatRow);

        panes.categories = categoriesPane;
        body.appendChild(categoriesPane);
        buildCommonSettingsSection(body, moduleEl, data);

        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeFooterBtn = document.createElement('button');
        closeFooterBtn.type = 'button';
        closeFooterBtn.className = 'btn-secondary sm';
        closeFooterBtn.textContent = t('spells.close');
        closeFooterBtn.addEventListener('click', closeModal);
        footer.appendChild(closeFooterBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeModal();
            }
        };
        document.addEventListener('keydown', keyHandler);
        overlay._keyHandler = keyHandler;
    }

    // ── Spell Inspect Modal ──
    let activeSpellInspectContext = null;

    function hideSpellInspectOverlay(ctx) {
        document.removeEventListener('keydown', ctx.onKeyDown);
        document.getElementById('list-inspect-overlay').classList.remove('open');
        document.getElementById('list-inspect-overlay').setAttribute('aria-hidden', 'true');
        activeSpellInspectContext = null;
    }

    function closeSpellInspect(isDiscard) {
        if (!activeSpellInspectContext) return;
        const ctx = activeSpellInspectContext;

        if (isDiscard) {
            const originalJson = JSON.stringify(ctx.spellOriginal);
            const editedJson = JSON.stringify(ctx.spellProxy);
            if (originalJson !== editedJson) {
                showConfirm(t('spells.discardPrompt'), function () {
                    if (ctx.isNew && !ctx.spellProxy.name) {
                        removeSpellFromCategory(ctx.data, ctx.catId, ctx.spellOriginal.id);
                    }
                    hideSpellInspectOverlay(ctx);
                    reRenderSpellsModule(ctx.moduleEl, ctx.data);
                });
                return;
            }
            if (ctx.isNew && !ctx.spellProxy.name) {
                removeSpellFromCategory(ctx.data, ctx.catId, ctx.spellOriginal.id);
                reRenderSpellsModule(ctx.moduleEl, ctx.data);
            }
        } else {
            Object.assign(ctx.spellOriginal, ctx.spellProxy);
            scheduleSave();

            if (ctx.isNew && ctx.spellProxy.name && typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'spells.event.slot',
                    message: t('spells.log.addSpell', { name: ctx.spellProxy.name }),
                    sourceModuleId: ctx.data.id,
                });
            }
            reRenderSpellsModule(ctx.moduleEl, ctx.data);
        }

        hideSpellInspectOverlay(ctx);
    }

    function openSpellInspect(moduleEl, data, catId, spellId, isNew) {
        const content = ensureContent(data);
        const cat = content.categories.find(function (c) { return c.id === catId; });
        if (!cat) return;
        const spellOriginal = (cat.spells || []).find(function (s) { return s.id === spellId; });
        if (!spellOriginal) return;

        const spellProxy = JSON.parse(JSON.stringify(spellOriginal));

        activeSpellInspectContext = {
            moduleEl: moduleEl,
            data: data,
            catId: catId,
            spellOriginal: spellOriginal,
            spellProxy: spellProxy,
            isNew: !!isNew,
            onKeyDown: function (e) {
                if (e.key === 'Escape') closeSpellInspect(true);
            },
        };

        const overlay = document.getElementById('list-inspect-overlay');
        const panel = document.getElementById('list-inspect-panel');
        panel.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'list-inspect-header';
        const title = document.createElement('span');
        title.className = 'list-inspect-title';
        title.textContent = isNew ? t('spells.addSpellTitle') : t('spells.editSpellTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.className = 'list-inspect-close-x';
        closeXBtn.innerHTML = cvIcon('x', 16);
        closeXBtn.title = t('spells.close');
        closeXBtn.addEventListener('click', function () { closeSpellInspect(true); });
        header.appendChild(title);
        header.appendChild(closeXBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'list-inspect-body';

        // Name
        const nameField = document.createElement('div');
        nameField.className = 'list-inspect-field';
        const nameLabel = document.createElement('label');
        nameLabel.className = 'list-inspect-label';
        nameLabel.textContent = t('spells.spellName');
        const nameInput = document.createElement('input');
        nameInput.className = 'list-inspect-name-input';
        nameInput.type = 'text';
        nameInput.value = spellProxy.name || '';
        nameInput.placeholder = t('spells.spellNamePlaceholder');
        nameInput.addEventListener('input', function () { spellProxy.name = nameInput.value; });
        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);
        body.appendChild(nameField);

        // Description
        const descField = document.createElement('div');
        descField.className = 'list-inspect-field';
        const descLabel = document.createElement('label');
        descLabel.className = 'list-inspect-label';
        descLabel.textContent = t('spells.spellDescription');
        const descInput = document.createElement('textarea');
        descInput.className = 'list-inspect-notes-input';
        descInput.value = spellProxy.description || '';
        descInput.placeholder = t('spells.spellDescriptionPlaceholder');
        descInput.addEventListener('input', function () { spellProxy.description = descInput.value; });
        descField.appendChild(descLabel);
        descField.appendChild(descInput);
        body.appendChild(descField);

        // Attributes grid — cell rendering delegated to the List module's
        // renderAttrValue() since spells share the same attribute-type system
        // (text/number/number-pair/toggle) and inspect-modal styling.
        if (content.attributes.length > 0) {
            const attrGrid = document.createElement('div');
            attrGrid.className = 'list-inspect-attr-grid';
            content.attributes.forEach(function (attr) {
                const attrItem = document.createElement('div');
                attrItem.className = 'list-inspect-attr-item';
                const attrLabel = document.createElement('div');
                attrLabel.className = 'list-inspect-attr-label';
                attrLabel.textContent = attr.name;
                attrItem.appendChild(attrLabel);

                const val = spellProxy.values && spellProxy.values[attr.id] != null
                    ? spellProxy.values[attr.id]
                    : attr.defaultValue;
                const cell = window.renderAttrValue(attr, val, false, spellProxy, function (newVal) {
                    if (!spellProxy.values) spellProxy.values = {};
                    spellProxy.values[attr.id] = newVal;
                });
                attrItem.appendChild(cell);
                attrGrid.appendChild(attrItem);
            });
            body.appendChild(attrGrid);
        }

        // Casting Options card
        const pool = cat.resourcePoolId
            ? content.resourcePools.find(function (p) { return p.id === cat.resourcePoolId; })
            : null;
        if (pool) {
            const castingCard = document.createElement('div');
            castingCard.className = 'spells-inspect-casting-card';
            const castingTitle = document.createElement('div');
            castingTitle.className = 'spells-settings-card-title';
            castingTitle.textContent = t('spells.castingOptions');
            castingCard.appendChild(castingTitle);

            // Slot Cost row
            const costRow = document.createElement('div');
            costRow.className = 'spells-inspect-casting-row';
            const costText = document.createElement('div');
            costText.className = 'spells-inspect-casting-text';
            const costName = document.createElement('span');
            costName.className = 'spells-inspect-casting-name';
            costName.textContent = t('spells.slotCost');
            const costDesc = document.createElement('span');
            costDesc.className = 'spells-inspect-casting-desc';
            costDesc.textContent = t('spells.slotCostDesc');
            costText.appendChild(costName);
            costText.appendChild(costDesc);
            costRow.appendChild(costText);
            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.className = 'spells-inspect-cost-input';
            costInput.min = '0';
            costInput.value = spellProxy.slotCost != null ? spellProxy.slotCost : '';
            costInput.placeholder = '1';
            costInput.addEventListener('input', function () {
                spellProxy.slotCost = costInput.value === '' ? null : Math.max(0, Number(costInput.value) || 0);
            });
            costRow.appendChild(costInput);
            castingCard.appendChild(costRow);

            // Can Upcast row (only for spell-slot type pools with autoSpend)
            if (pool.type === 'spell-slot' && content.autoSpendSlots) {
                const upcastRow = document.createElement('div');
                upcastRow.className = 'spells-inspect-casting-row';
                const upcastText = document.createElement('div');
                upcastText.className = 'spells-inspect-casting-text';
                const upcastName = document.createElement('span');
                upcastName.className = 'spells-inspect-casting-name';
                upcastName.textContent = t('spells.allowUpcast');
                const upcastDesc = document.createElement('span');
                upcastDesc.className = 'spells-inspect-casting-desc';
                upcastDesc.textContent = t('spells.canUpcastDesc');
                upcastText.appendChild(upcastName);
                upcastText.appendChild(upcastDesc);
                upcastRow.appendChild(upcastText);
                const upcastToggle = makeCvToggle(!!spellProxy.canUpcast, function (checked) {
                    spellProxy.canUpcast = checked;
                });
                upcastRow.appendChild(upcastToggle);
                castingCard.appendChild(upcastRow);
            }

            body.appendChild(castingCard);
        }

        // Footer actions
        const actions = document.createElement('div');
        actions.className = 'list-inspect-actions';

        if (!isNew) {
            const delBtn = document.createElement('button');
            delBtn.className = 'list-inspect-btn-delete';
            delBtn.textContent = t('spells.delete');
            delBtn.addEventListener('click', function () {
                showConfirm({ title: t('spells.deleteSpell'), message: t('spells.deleteSpellConfirm') }, function () {
                    deleteSpellFromModule(moduleEl, data, catId, spellOriginal.id, spellOriginal.name);
                    hideSpellInspectOverlay(activeSpellInspectContext);
                });
            });
            actions.appendChild(delBtn);

            const sendBtn = document.createElement('button');
            sendBtn.className = 'list-inspect-btn-send';
            sendBtn.innerHTML = cvIcon('send', 14) + ' ' + escapeHtml(t('transfer.sendToPlayer'));
            sendBtn.addEventListener('click', function () {
                const moduleMeta = {
                    attrs: data.content.attributes,
                    categoryName: cat.name,
                    poolDescriptor: pool
                        ? { type: pool.type, level: pool.level ?? null, name: pool.name ?? null }
                        : null,
                };
                window.openSendToPlayerModal(spellProxy, 'spells', moduleMeta, data.id, spellProxy.id);
            });
            actions.appendChild(sendBtn);
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'list-inspect-btn-close';
        cancelBtn.textContent = t('spells.cancel');
        cancelBtn.addEventListener('click', function () { closeSpellInspect(true); });
        actions.appendChild(cancelBtn);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'list-inspect-btn-save';
        saveBtn.textContent = t('spells.save');
        saveBtn.addEventListener('click', function () { closeSpellInspect(false); });
        actions.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(actions);

        document.addEventListener('keydown', activeSpellInspectContext.onKeyDown);
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');

        nameInput.focus();
    }

    function removeSpellFromCategory(data, catId, spellId) {
        const cat = (data.content.categories || []).find(function (c) { return c.id === catId; });
        if (!cat) return;
        cat.spells = (cat.spells || []).filter(function (s) { return s.id !== spellId; });
        scheduleSave();
    }

    function deleteSpellFromModule(moduleEl, data, catId, spellId, spellName) {
        removeSpellFromCategory(data, catId, spellId);
        if (typeof window.logActivity === 'function') {
            window.logActivity({
                type: 'spells.event.slot',
                message: t('spells.log.removeSpell', { name: spellName || t('spells.unnamed') }),
                sourceModuleId: data.id,
            });
        }
        reRenderSpellsModule(moduleEl, data);
    }

    function reRenderSpellsModule(moduleEl, data) {
        if (!moduleEl) return;
        const bodyEl = moduleEl.querySelector('.module-body');
        if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, data);
        if (typeof window.snapModuleHeight === 'function') window.snapModuleHeight(moduleEl, data);
        if (typeof window.reapplyPendingStates === 'function') window.reapplyPendingStates();
    }

    function addSpellToCategory(moduleEl, data, catId) {
        const content = ensureContent(data);
        const cat = content.categories.find(function (c) { return c.id === catId; });
        if (!cat) return;
        if (!cat.spells) cat.spells = [];
        // values starts empty — the inspect modal falls back to each
        // attribute's own defaultValue when a spell has no stored value yet.
        const newSpell = {
            id: generateId('spell'),
            name: '',
            description: '',
            order: cat.spells.length,
            expanded: false,
            values: {},
            slotCost: null,
            canUpcast: false,
            preparedCount: 0,
            castsUsed: 0,
        };
        cat.spells.push(newSpell);
        openSpellInspect(moduleEl, data, catId, newSpell.id, true);
    }

    // ── Cross-Module API (used by Recovery module) ──

    window.restoreAllSpellSlots = function (moduleId) {
        const data = window.modules.find((m) => m.id === moduleId);
        if (!data || data.type !== 'spells') return;
        data.content.resourcePools.forEach((pool) => {
            pool.spent = 0;
        });
        data.content.categories.forEach((cat) => {
            (cat.spells || []).forEach((spell) => {
                spell.castsUsed = 0;
            });
        });
        const el = document.querySelector(`.module[data-id="${moduleId}"]`);
        if (el) {
            const bodyEl = el.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, data);
        }
    };

    window.findSpellInModule = findSpellInModule;
    window.isDiceNotation = isDiceNotation;
    window.extractDiceRoll = extractDiceRoll;
    window.spellsDefaultContent = defaultContent;
    window.getAvailableSlots = getAvailableSlots;
    window.spendSlot = spendSlot;
    window.resolveSlotCost = resolveSlotCost;
    window.getPoolLabel = getPoolLabel;
    window.castSpell = castSpell;
    window.getSortedSpells = getSortedSpells;
    window.migrateSpellContent = migrateContent;
    window.ensureSpellContent = ensureContent;
    window.spellsIsSupported = spellsIsSupported;
    window.spellsComputeAttackBonus = spellsComputeAttackBonus;
    window.spellsComputeSpellDC = spellsComputeSpellDC;
    window.spellsFormatAttackBonus = spellsFormatAttackBonus;
    window.spellsFormatDC = spellsFormatDC;

    // ── Registration ──
    registerModuleType('spells', {
        label: 'type.spells',
        hasStatLink: true,

        renderBody(bodyEl, data) {
            ensureContent(data);
            bodyEl.innerHTML = '';
            renderSpellsPlay(bodyEl, data);
            const moduleEl = bodyEl.closest('.module');
            if (moduleEl) updateSpellsChainIcon(moduleEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openSpellSettings(moduleEl, data),
                    label: t('spells.settings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    // ── Reactive Stat Listeners ──

    document.addEventListener('cv:stat-values-changed', function (e) {
        var changedModuleId = e.detail && e.detail.moduleId;
        (window.modules || []).forEach(function (mod) {
            if (mod.type !== 'spells') return;
            if (!mod.content || mod.content.linkedStatModuleId !== changedModuleId) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, mod);
        });
    });

    document.addEventListener('cv:stats-changed', function (e) {
        var changedModuleId = e.detail && e.detail.moduleId;
        (window.modules || []).forEach(function (mod) {
            if (mod.type !== 'spells') return;
            if (!mod.content || mod.content.linkedStatModuleId !== changedModuleId) return;
            var changed = false;
            var validNames = getLinkedStatNames(mod);
            if (mod.content.spellcastingAbility) {
                var found = validNames.some(function (n) {
                    return n.toUpperCase() === mod.content.spellcastingAbility.toUpperCase();
                });
                if (!found) {
                    mod.content.spellcastingAbility = null;
                    scheduleSave();
                    changed = true;
                }
            }
            if (!changed) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, mod);
        });
    });
})();
