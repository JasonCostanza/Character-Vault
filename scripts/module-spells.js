// ── Spells Module ──
(function () {
    // ── Constants ──
    const DICE_REGEX = /\b\d+d\d+([+-]\d+)?\b/i;

    // ── Helpers ──
    function isDiceNotation(val) {
        return DICE_REGEX.test(String(val));
    }

    function extractDiceRoll(val) {
        const m = String(val).match(DICE_REGEX);
        return m ? m[0] : null;
    }

    function defaultContent() {
        return { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' };
    }

    function migrateContent(content) {
        const keySet = new Map();
        content.categories.forEach(cat => {
            (cat.spells || []).forEach(spell => {
                if (Array.isArray(spell.attributes)) {
                    spell.attributes.forEach(a => {
                        if (a.key && !keySet.has(a.key)) {
                            keySet.set(a.key, genId('attr'));
                        }
                    });
                }
            });
        });
        content.attributes = [];
        keySet.forEach((id, key) => {
            content.attributes.push({ id, name: key, type: 'text', defaultValue: '', pinned: true, builtIn: false });
        });
        content.categories.forEach(cat => {
            (cat.spells || []).forEach((spell, i) => {
                spell.values = {};
                if (Array.isArray(spell.attributes)) {
                    spell.attributes.forEach(a => {
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
        if (!Array.isArray(c.slotLevels)) c.slotLevels = [];
        if (!Array.isArray(c.categories)) c.categories = [];
        const needsMigration = !Array.isArray(c.attributes) ||
            c.categories.some(cat => (cat.spells || []).some(spell => Array.isArray(spell.attributes)));
        if (needsMigration) {
            migrateContent(c);
        } else {
            if (c.sortBy === undefined) c.sortBy = null;
            if (!c.sortDir) c.sortDir = 'asc';
        }
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
        const attr = content.attributes.find(a => a.id === content.sortBy);
        sorted.sort((a, b) => {
            const av = (a.values && a.values[content.sortBy] != null) ? a.values[content.sortBy] : (attr ? attr.defaultValue : '');
            const bv = (b.values && b.values[content.sortBy] != null) ? b.values[content.sortBy] : (attr ? attr.defaultValue : '');
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

    // ── Play Mode Helpers ──
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

    // ── Play Mode (Table Layout) ──
    function renderSpellsPlay(bodyEl, data) {
        renderSlotSummaryBar(bodyEl, data, bodyEl);
        const container = document.createElement('div');
        container.className = 'spells-container';
        if (data.content.categories.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'spells-empty-state';
            empty.textContent = t('spells.emptyState');
            container.appendChild(empty);
        } else {
            data.content.categories.forEach((cat) => {
                renderCategoryBlock(container, cat, data, bodyEl);
            });
        }
        bodyEl.appendChild(container);
    }

    function renderSlotSummaryBar(container, data, bodyEl) {
        const summary = document.createElement('div');
        summary.className = 'spells-slots-summary';
        const bar = document.createElement('div');
        bar.className = 'spells-slots-bar';
        const sorted = data.content.slotLevels.slice().sort((a, b) => a.level - b.level);
        sorted.forEach((sl) => {
            const group = document.createElement('div');
            group.className = 'spells-slot-group';
            const label = document.createElement('span');
            label.className = 'spells-slot-label';
            label.textContent = t('spells.slotLevelLabel', { n: sl.level });
            group.appendChild(label);
            for (let i = 0; i < sl.max; i++) {
                const pip = document.createElement('button');
                const isSpent = i >= sl.max - sl.spent;
                pip.className = 'spell-pip' + (isSpent ? ' spent' : '');
                pip.textContent = isSpent ? '○' : '●';
                const slotIndex = i;
                pip.addEventListener('click', () => updatePipSpent(slotIndex, sl, bodyEl, data));
                group.appendChild(pip);
            }
            bar.appendChild(group);
        });
        summary.appendChild(bar);
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn-secondary sm';
        restoreBtn.textContent = t('spells.restoreAll');
        restoreBtn.addEventListener('click', () => {
            data.content.slotLevels.forEach((sl) => { sl.spent = 0; });
            scheduleSave();
            bodyEl.innerHTML = '';
            renderSpellsPlay(bodyEl, data);
        });
        summary.appendChild(restoreBtn);
        container.appendChild(summary);
    }

    function renderCategoryBlock(container, cat, data, bodyEl) {
        const block = document.createElement('div');
        block.className = 'spells-category-block';
        block.dataset.catId = cat.id;
        renderCategoryHeader(block, cat, data, bodyEl);
        const pinnedAttrs = data.content.attributes.filter((a) => a.pinned);
        const table = document.createElement('table');
        table.className = 'spells-table';
        const thead = document.createElement('thead');
        renderSpellTableHeaders(thead, data, bodyEl, pinnedAttrs);
        const tbody = document.createElement('tbody');
        const sorted = getSortedSpells(data.content, cat.spells || []);
        sorted.forEach((spell) => {
            renderSpellRow(spell, cat, data, tbody, bodyEl, pinnedAttrs);
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

    function renderCategoryHeader(blockEl, cat, data, bodyEl) {
        const header = document.createElement('div');
        header.className = 'spells-cat-header';
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'spells-cat-collapse-btn' + (cat.collapsed ? '' : ' expanded');
        collapseBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        const catName = document.createElement('span');
        catName.className = 'spells-cat-name';
        catName.textContent = cat.name || t('spells.unnamedCategory');
        header.appendChild(collapseBtn);
        header.appendChild(catName);
        if (cat.slotLevel !== null) {
            const sl = data.content.slotLevels.find((s) => s.level === cat.slotLevel);
            if (sl) {
                const pipsDiv = document.createElement('div');
                pipsDiv.className = 'spells-cat-pips';
                for (let i = 0; i < sl.max; i++) {
                    const pip = document.createElement('button');
                    const isSpent = i >= sl.max - sl.spent;
                    pip.className = 'spell-pip' + (isSpent ? ' spent' : '');
                    pip.textContent = isSpent ? '○' : '●';
                    const slotIndex = i;
                    pip.addEventListener('click', (e) => { e.stopPropagation(); updatePipSpent(slotIndex, sl, bodyEl, data); });
                    pipsDiv.appendChild(pip);
                }
                header.appendChild(pipsDiv);
            }
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
            if (e.target.closest('.spells-cat-pips')) return;
            toggleCollapse();
        });
        blockEl.appendChild(header);
    }

    function renderSpellTableHeaders(thead, data, bodyEl, pinnedAttrs) {
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
        castTh.style.width = '40px';
        tr.appendChild(castTh);
        thead.appendChild(tr);
    }

    function renderSpellRow(spell, cat, data, tbody, bodyEl, pinnedAttrs) {
        const tr = document.createElement('tr');
        tr.className = 'spells-row';
        tr.dataset.spellId = spell.id;
        const chevTd = document.createElement('td');
        const chevBtn = document.createElement('button');
        chevBtn.className = 'spells-chevron-btn' + (spell.expanded ? ' expanded' : '');
        chevBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
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
            valSpan.textContent = (spell.values && spell.values[attr.id] != null) ? spell.values[attr.id] : '';
            td.appendChild(valSpan);
            tr.appendChild(td);
        });
        const castTd = document.createElement('td');
        const castBtn = document.createElement('button');
        castBtn.className = 'spells-cast-btn';
        castBtn.title = t('spells.castBtn');
        castBtn.textContent = '⚡';
        castBtn.addEventListener('click', () => {
            const moduleEl = tbody.closest('.module');
            if (moduleEl) castSpell(moduleEl, data, spell, cat.id);
        });
        castTd.appendChild(castBtn);
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

    function genId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    }

    // ── Slot Helpers ──
    function getAvailableSlots(data, slotLevel) {
        const sl = data.content.slotLevels.find((s) => s.level === slotLevel);
        return sl ? Math.max(0, sl.max - sl.spent) : 0;
    }

    function spendSlot(data, slotLevel) {
        const sl = data.content.slotLevels.find((s) => s.level === slotLevel);
        if (sl && sl.spent < sl.max) sl.spent++;
    }

    // ── Cast Logic ──
    function castSpell(moduleEl, data, spell, catId) {
        const cat = data.content.categories.find((c) => c.id === catId);
        if (!cat) return;

        const content = data.content;
        if (cat.slotLevel !== null && content.autoSpendSlots) {
            const available = getAvailableSlots(data, cat.slotLevel);
            if (available <= 0) {
                if (content.showSlotErrors) {
                    showToast(t('spells.noSlotsError', { level: t('spells.slotLevelLabel', { n: cat.slotLevel }) }), 'error');
                }
                return;
            }
        }

        const values = spell.values || {};
        const rolls = (content.attributes || [])
            .filter(attr => isDiceNotation(values[attr.id]))
            .map(attr => ({ name: (spell.name || t('spells.unnamed')) + ': ' + attr.name, roll: extractDiceRoll(values[attr.id]) }))
            .filter(x => x.roll);

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
            if (rolls.length) msg += ' — ' + rolls.map(x => x.roll).join(', ');
            logEntryId = window.logActivity({ type: 'spells.event.cast', message: msg, sourceModuleId: data.id });
        }

        if (rollPromise) {
            rollPromise.then(function (rollId) {
                if (rollId) {
                    window.pendingRolls[rollId] = {
                        logEntryId,
                        spellCast: true,
                        moduleId: data.id,
                        catId: catId,
                        slotLevel: cat.slotLevel,
                        autoSpend: content.autoSpendSlots,
                    };
                }
            });
        }
    }

    // ── Layout Mode ──

    function addInlineInputKeys(input, getOriginal) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') { input.value = getOriginal(); input.blur(); }
        });
    }

    function renderSpellsLayout(bodyEl, data) {
        renderSlotSummaryBarLayout(bodyEl, data, bodyEl);
        const container = document.createElement('div');
        container.className = 'spells-container';
        if (data.content.categories.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'spells-empty-state';
            empty.textContent = t('spells.emptyState');
            container.appendChild(empty);
        } else {
            data.content.categories.forEach((cat) => {
                renderCategoryBlockLayout(container, cat, data, bodyEl);
            });
            if (data.content.sortBy === null) {
                initCategorySortable(container, data, bodyEl);
            }
        }
        const addCatBtn = document.createElement('button');
        addCatBtn.className = 'spells-add-cat-btn';
        addCatBtn.textContent = t('spells.addCategory');
        addCatBtn.addEventListener('click', () => {
            const newCat = { id: genId('cat'), name: '', slotLevel: null, collapsed: false, spells: [] };
            data.content.categories.push(newCat);
            scheduleSave();
            bodyEl.innerHTML = '';
            renderSpellsLayout(bodyEl, data);
        });
        container.appendChild(addCatBtn);
        bodyEl.appendChild(container);
    }

    function renderSlotSummaryBarLayout(container, data, bodyEl) {
        const summary = document.createElement('div');
        summary.className = 'spells-slots-summary';
        const bar = document.createElement('div');
        bar.className = 'spells-slots-bar';
        const sorted = data.content.slotLevels.slice().sort((a, b) => a.level - b.level);
        sorted.forEach((sl) => {
            const group = document.createElement('div');
            group.className = 'spells-slot-group';
            const label = document.createElement('span');
            label.className = 'spells-slot-label';
            label.textContent = t('spells.slotLevelLabel', { n: sl.level });
            const maxIn = document.createElement('input');
            maxIn.type = 'number';
            maxIn.className = 'spells-slot-max-input';
            maxIn.value = sl.max;
            maxIn.min = 0;
            maxIn.max = 99;
            maxIn.title = t('spells.slotMax');
            maxIn.addEventListener('change', () => {
                const v = Math.max(0, Math.min(99, parseInt(maxIn.value, 10) || 0));
                sl.max = v;
                sl.spent = Math.min(sl.spent, sl.max);
                maxIn.value = v;
                scheduleSave();
            });
            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-btn sm danger';
            removeBtn.title = t('spells.removeSlotLevel');
            removeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            removeBtn.addEventListener('click', () => {
                const inUse = data.content.categories.some((cat) => cat.slotLevel === sl.level);
                if (inUse) {
                    showConfirm(t('spells.removeSlotLevelConfirm'), () => {
                        data.content.categories.forEach((cat) => { if (cat.slotLevel === sl.level) cat.slotLevel = null; });
                        data.content.slotLevels = data.content.slotLevels.filter((x) => x.id !== sl.id);
                        scheduleSave();
                        bodyEl.innerHTML = '';
                        renderSpellsLayout(bodyEl, data);
                    });
                } else {
                    data.content.slotLevels = data.content.slotLevels.filter((x) => x.id !== sl.id);
                    scheduleSave();
                    bodyEl.innerHTML = '';
                    renderSpellsLayout(bodyEl, data);
                }
            });
            group.appendChild(label);
            group.appendChild(maxIn);
            group.appendChild(removeBtn);
            bar.appendChild(group);
        });
        summary.appendChild(bar);
        const addSlotBtn = document.createElement('button');
        addSlotBtn.className = 'btn-secondary sm';
        addSlotBtn.textContent = t('spells.addSlotLevel');
        addSlotBtn.addEventListener('click', () => {
            const nextLevel = data.content.slotLevels.reduce((m, sl) => Math.max(m, sl.level), 0) + 1;
            data.content.slotLevels.push({ id: genId('sl'), level: nextLevel, max: 4, spent: 0 });
            scheduleSave();
            bodyEl.innerHTML = '';
            renderSpellsLayout(bodyEl, data);
        });
        summary.appendChild(addSlotBtn);
        container.appendChild(summary);
    }

    function renderCategoryBlockLayout(container, cat, data, bodyEl) {
        const pinnedAttrs = data.content.attributes.filter((a) => a.pinned);
        const block = document.createElement('div');
        block.className = 'spells-category-block';
        block.dataset.catId = cat.id;
        renderCategoryHeaderLayout(block, cat, data, bodyEl);
        const table = document.createElement('table');
        table.className = 'spells-table';
        const thead = document.createElement('thead');
        renderSpellTableHeadersLayout(thead, data, bodyEl, pinnedAttrs);
        const tbody = document.createElement('tbody');
        const sorted = getSortedSpells(data.content, cat.spells || []);
        sorted.forEach((spell) => {
            renderSpellRowLayout(spell, cat, data, tbody, bodyEl, pinnedAttrs);
        });
        if ((cat.spells || []).length === 0) {
            const emptyTr = document.createElement('tr');
            const emptyTd = document.createElement('td');
            emptyTd.colSpan = 4 + pinnedAttrs.length;
            emptyTd.className = 'spells-empty-state';
            emptyTd.textContent = t('spells.emptyCategory');
            emptyTr.appendChild(emptyTd);
            tbody.appendChild(emptyTr);
        }
        table.appendChild(thead);
        table.appendChild(tbody);
        if (cat.collapsed) table.style.display = 'none';
        block.appendChild(table);
        const addSpellBtn = document.createElement('button');
        addSpellBtn.className = 'spells-add-spell-btn';
        addSpellBtn.textContent = t('spells.addSpell');
        if (cat.collapsed) addSpellBtn.style.display = 'none';
        addSpellBtn.addEventListener('click', () => {
            const newSpell = {
                id: genId('sp'),
                name: '',
                description: '',
                order: (cat.spells || []).length,
                expanded: false,
                values: {},
            };
            cat.spells = cat.spells || [];
            cat.spells.push(newSpell);
            scheduleSave();
            bodyEl.innerHTML = '';
            renderSpellsLayout(bodyEl, data);
        });
        block.appendChild(addSpellBtn);
        container.appendChild(block);
        if (data.content.sortBy === null) {
            initSpellSortable(tbody, data, cat, bodyEl);
        }
    }

    function renderCategoryHeaderLayout(blockEl, cat, data, bodyEl) {
        const header = document.createElement('div');
        header.className = 'spells-cat-header spells-cat-header--layout';
        const dragHandle = document.createElement('span');
        dragHandle.className = 'spells-cat-drag-handle';
        dragHandle.innerHTML = '&#x2807;';
        header.appendChild(dragHandle);
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'spells-cat-collapse-btn' + (cat.collapsed ? '' : ' expanded');
        collapseBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cat.collapsed = !cat.collapsed;
            collapseBtn.classList.toggle('expanded', !cat.collapsed);
            const table = blockEl.querySelector('.spells-table');
            const addBtn = blockEl.querySelector('.spells-add-spell-btn');
            if (table) table.style.display = cat.collapsed ? 'none' : '';
            if (addBtn) addBtn.style.display = cat.collapsed ? 'none' : '';
            scheduleSave();
        });
        header.appendChild(collapseBtn);
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'spells-cat-name-input';
        nameInput.value = cat.name || '';
        nameInput.placeholder = t('spells.categoryNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('blur', () => {
            cat.name = nameInput.value.trim();
            scheduleSave();
        });
        addInlineInputKeys(nameInput, () => cat.name || '');
        header.appendChild(nameInput);
        const slotSelect = document.createElement('select');
        slotSelect.className = 'spells-cat-slot-select';
        slotSelect.title = t('spells.categorySlot');
        const noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = t('spells.slotNone');
        slotSelect.appendChild(noneOpt);
        data.content.slotLevels.slice().sort((a, b) => a.level - b.level).forEach((sl) => {
            const opt = document.createElement('option');
            opt.value = String(sl.level);
            opt.textContent = t('spells.slotLevelLabel', { n: sl.level });
            slotSelect.appendChild(opt);
        });
        slotSelect.value = cat.slotLevel !== null ? String(cat.slotLevel) : '';
        slotSelect.addEventListener('change', () => {
            cat.slotLevel = slotSelect.value === '' ? null : Number(slotSelect.value);
            scheduleSave();
        });
        header.appendChild(slotSelect);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn sm danger';
        deleteBtn.title = t('spells.deleteCategory');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm(t('spells.deleteCategoryConfirm'), () => {
                data.content.categories = data.content.categories.filter((c) => c.id !== cat.id);
                scheduleSave();
                bodyEl.innerHTML = '';
                renderSpellsLayout(bodyEl, data);
            });
        });
        header.appendChild(deleteBtn);
        blockEl.appendChild(header);
    }

    function renderSpellTableHeadersLayout(thead, data, bodyEl, pinnedAttrs) {
        const content = data.content;
        const tr = document.createElement('tr');
        const dragTh = document.createElement('th');
        dragTh.style.width = '20px';
        tr.appendChild(dragTh);
        const chevTh = document.createElement('th');
        chevTh.style.width = '20px';
        tr.appendChild(chevTh);
        const nameTh = buildSortColHeader(t('spells.spellName'), '__name__', content);
        nameTh.addEventListener('click', () => handleSortClick('__name__', content, bodyEl, data, renderSpellsLayout));
        tr.appendChild(nameTh);
        pinnedAttrs.forEach((attr) => {
            const th = buildSortColHeader(attr.name, attr.id, content);
            th.addEventListener('click', () => handleSortClick(attr.id, content, bodyEl, data, renderSpellsLayout));
            tr.appendChild(th);
        });
        const deleteTh = document.createElement('th');
        deleteTh.style.width = '28px';
        tr.appendChild(deleteTh);
        thead.appendChild(tr);
    }

    function renderSpellRowLayout(spell, cat, data, tbody, bodyEl, pinnedAttrs) {
        const tr = document.createElement('tr');
        tr.className = 'spells-row';
        tr.dataset.spellId = spell.id;
        const dragTd = document.createElement('td');
        const dragHandle = document.createElement('span');
        dragHandle.className = 'spells-row-handle';
        dragHandle.innerHTML = '&#x2807;';
        if (data.content.sortBy !== null) dragHandle.style.visibility = 'hidden';
        dragTd.appendChild(dragHandle);
        tr.appendChild(dragTd);
        const chevTd = document.createElement('td');
        const chevBtn = document.createElement('button');
        chevBtn.className = 'spells-chevron-btn' + (spell.expanded ? ' expanded' : '');
        chevBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        chevTd.appendChild(chevBtn);
        tr.appendChild(chevTd);
        const nameTd = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'spells-inline-input';
        nameInput.value = spell.name || '';
        nameInput.placeholder = t('spells.spellNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('blur', () => {
            spell.name = nameInput.value.trim();
            scheduleSave();
        });
        addInlineInputKeys(nameInput, () => spell.name || '');
        nameTd.appendChild(nameInput);
        tr.appendChild(nameTd);
        pinnedAttrs.forEach((attr) => {
            const td = document.createElement('td');
            const valInput = document.createElement('input');
            valInput.type = 'text';
            valInput.className = 'spells-inline-input';
            valInput.value = (spell.values && spell.values[attr.id] != null) ? spell.values[attr.id] : '';
            valInput.placeholder = attr.name;
            valInput.spellcheck = false;
            valInput.autocomplete = 'off';
            valInput.addEventListener('blur', () => {
                if (!spell.values) spell.values = {};
                spell.values[attr.id] = valInput.value;
                scheduleSave();
            });
            addInlineInputKeys(valInput, () => (spell.values && spell.values[attr.id] != null) ? spell.values[attr.id] : '');
            td.appendChild(valInput);
            tr.appendChild(td);
        });
        const deleteTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn sm danger';
        deleteBtn.title = t('spells.deleteSpell');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', () => {
            showConfirm(t('spells.deleteSpellConfirm'), () => {
                cat.spells = cat.spells.filter((s) => s.id !== spell.id);
                scheduleSave();
                bodyEl.innerHTML = '';
                renderSpellsLayout(bodyEl, data);
            });
        });
        deleteTd.appendChild(deleteBtn);
        tr.appendChild(deleteTd);
        const drawerTr = document.createElement('tr');
        drawerTr.className = 'spells-drawer';
        drawerTr.style.display = spell.expanded ? '' : 'none';
        const drawerTd = document.createElement('td');
        drawerTd.colSpan = 4 + pinnedAttrs.length;
        drawerTd.className = 'spells-drawer-content-td';
        const drawerContent = document.createElement('div');
        drawerContent.className = 'spells-drawer-content';
        const textarea = document.createElement('textarea');
        textarea.className = 'spells-desc-textarea';
        textarea.value = spell.description || '';
        textarea.placeholder = t('spells.descPlaceholder');
        textarea.addEventListener('input', () => {
            spell.description = textarea.value;
            scheduleSave();
        });
        drawerContent.appendChild(textarea);
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

    function initSpellSortable(tbody, data, cat, bodyEl) {
        if (tbody._sortable) tbody._sortable.destroy();
        if (data.content.sortBy !== null) return;
        tbody._sortable = new Sortable(tbody, {
            handle: '.spells-row-handle',
            animation: 150,
            ghostClass: 'spells-row-ghost',
            draggable: '.spells-row',
            onEnd() {
                const rows = Array.from(tbody.querySelectorAll('.spells-row'));
                const reordered = rows
                    .map((r) => cat.spells.find((s) => s.id === r.dataset.spellId))
                    .filter(Boolean);
                cat.spells = reordered;
                cat.spells.forEach((s, i) => { s.order = i; });
                scheduleSave();
                tbody.innerHTML = '';
                const pinnedAttrs = data.content.attributes.filter((a) => a.pinned);
                getSortedSpells(data.content, cat.spells).forEach((spell) => {
                    renderSpellRowLayout(spell, cat, data, tbody, bodyEl, pinnedAttrs);
                });
                initSpellSortable(tbody, data, cat, bodyEl);
            },
        });
    }

    function initCategorySortable(container, data, bodyEl) {
        if (container._catSortable) container._catSortable.destroy();
        if (data.content.sortBy !== null) return;
        container._catSortable = new Sortable(container, {
            handle: '.spells-cat-drag-handle',
            animation: 150,
            ghostClass: 'spells-category-ghost',
            draggable: '.spells-category-block',
            onEnd() {
                const blocks = Array.from(container.querySelectorAll('.spells-category-block'));
                const reordered = blocks
                    .map((b) => data.content.categories.find((c) => c.id === b.dataset.catId))
                    .filter(Boolean);
                data.content.categories = reordered;
                scheduleSave();
            },
        });
    }

    // ── Confirm Dialog ──
    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = (typeof options === 'object' && options.title) || t('spells.delete');
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';
        const titleEl = document.createElement('div');
        titleEl.className = 'delete-confirm-title';
        titleEl.style.userSelect = 'none';
        titleEl.textContent = titleText;
        const msgEl = document.createElement('div');
        msgEl.className = 'delete-confirm-msg';
        msgEl.style.userSelect = 'none';
        msgEl.textContent = message;
        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = t('delete.cancel');
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = t('delete.confirm');
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        panel.appendChild(titleEl);
        panel.appendChild(msgEl);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        function close() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(() => overlay.remove(), 200);
        }
        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', () => { onConfirm(); close(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        requestAnimationFrame(() => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); });
    }

    // ── Settings Modal ──
    function openSpellSettings(moduleEl, data) {
        const content = data.content;
        const existing = document.querySelector('.spells-settings-overlay');
        if (existing) {
            if (existing._keyHandler) document.removeEventListener('keydown', existing._keyHandler);
            existing.remove();
        }

        const SVG_TRASH = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        const SVG_PIN_ON = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>';
        const SVG_PIN_OFF = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>';

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
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const bodyEl = moduleEl.querySelector('.module-body');
        function reRender() {
            if (!bodyEl) return;
            bodyEl.innerHTML = '';
            if (window.isPlayMode) renderSpellsPlay(bodyEl, data);
            else renderSpellsLayout(bodyEl, data);
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

        behaviorCard.appendChild(makeSettingsToggle('spells.autoSpendLabel', 'spells.autoSpendDesc', content.autoSpendSlots, (v) => {
            content.autoSpendSlots = v;
            scheduleSave();
        }));
        behaviorCard.appendChild(makeSettingsToggle('spells.showErrorsLabel', 'spells.showErrorsDesc', content.showSlotErrors, (v) => {
            content.showSlotErrors = v;
            scheduleSave();
        }));

        body.appendChild(behaviorCard);

        // ── Tab Bar ──
        const tabIds = ['columns', 'slots', 'categories'];
        const tabKeys = { columns: 'spells.tabColumns', slots: 'spells.tabSlots', categories: 'spells.tabCategories' };
        const panes = {};
        let activeTab = 'columns';

        const tabBar = document.createElement('div');
        tabBar.className = 'spells-settings-tabbar';

        const tabBtns = {};
        tabIds.forEach(id => {
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
            tabIds.forEach(tid => {
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
            const labels = { text: t('spells.attrType.text'), number: t('spells.attrType.number'), 'number-pair': t('spells.attrType.numberPair'), toggle: t('spells.attrType.toggle') };
            return labels[type] || type;
        }

        function refreshAttrList() {
            if (attrListEl._sortable) { attrListEl._sortable.destroy(); attrListEl._sortable = null; }
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
                        showConfirm(
                            { title: t('spells.deleteAttr'), message: attr.name + '?' },
                            () => {
                                content.attributes = content.attributes.filter(a => a.id !== attr.id);
                                content.categories.forEach(cat => {
                                    (cat.spells || []).forEach(spell => { delete spell.values[attr.id]; });
                                });
                                scheduleSave();
                                refreshAttrList();
                                reRender();
                            }
                        );
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
                        content.attributes = rows.map(r => content.attributes.find(a => a.id === r.dataset.attrId)).filter(Boolean);
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
            const defaultValue = type === 'number-pair' ? { current: 0, max: 0 } : type === 'number' ? 0 : type === 'toggle' ? false : '';
            const newAttr = { id: genId('attr'), name, type, defaultValue, pinned: true, builtIn: false };
            content.attributes.push(newAttr);
            content.categories.forEach(cat => {
                (cat.spells || []).forEach(spell => {
                    spell.values[newAttr.id] = type === 'number-pair' ? { current: 0, max: 0 } : type === 'number' ? 0 : type === 'toggle' ? false : '';
                });
            });
            newAttrInput.value = '';
            scheduleSave();
            refreshAttrList();
            reRender();
        });

        newAttrInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addAttrBtn.click(); });

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

        function refreshSlotList() {
            slotListEl.innerHTML = '';
            content.slotLevels.forEach((sl) => {
                const row = document.createElement('div');
                row.className = 'spells-slot-settings-row';

                const levelLabel = document.createElement('span');
                levelLabel.className = 'spells-slot-settings-label';
                levelLabel.textContent = t('spells.slotLevelLabel', { n: sl.level });

                const maxInput = document.createElement('input');
                maxInput.type = 'number';
                maxInput.className = 'cv-modal-input';
                maxInput.style.width = '56px';
                maxInput.style.flexShrink = '0';
                maxInput.min = '0';
                maxInput.max = '20';
                maxInput.value = String(sl.max);
                maxInput.addEventListener('change', () => {
                    const val = Math.max(0, Math.min(20, parseInt(maxInput.value, 10) || 0));
                    maxInput.value = String(val);
                    sl.max = val;
                    if (sl.spent > sl.max) sl.spent = sl.max;
                    window.logActivity && window.logActivity({ type: 'spells.event.slot', message: t('spells.log.modifySlot', { level: sl.level, max: val }), sourceModuleId: data.id });
                    scheduleSave();
                    reRender();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'spells-settings-delete-btn';
                deleteBtn.title = t('spells.removeSlotLevel');
                deleteBtn.innerHTML = SVG_TRASH;
                deleteBtn.addEventListener('click', () => {
                    const usedByCats = content.categories.some(c => c.slotLevel === sl.level);
                    const doDelete = () => {
                        if (usedByCats) content.categories.forEach(cat => { if (cat.slotLevel === sl.level) cat.slotLevel = null; });
                        content.slotLevels = content.slotLevels.filter(s => s.level !== sl.level);
                        window.logActivity && window.logActivity({ type: 'spells.event.slot', message: t('spells.log.removeSlot', { level: sl.level }), sourceModuleId: data.id });
                        scheduleSave();
                        refreshSlotList();
                        if (refreshCatList) refreshCatList();
                        reRender();
                    };
                    if (usedByCats) {
                        showConfirm({ title: t('spells.removeSlotLevel'), message: t('spells.removeSlotLevelConfirm') }, doDelete);
                    } else {
                        doDelete();
                    }
                });

                row.appendChild(levelLabel);
                row.appendChild(maxInput);
                row.appendChild(deleteBtn);
                slotListEl.appendChild(row);
            });

            if (content.slotLevels.length === 0) {
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
        newSlotMaxInput.placeholder = t('spells.slotMax');
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
            if (content.slotLevels.some(s => s.level === level)) return;
            const max = Math.max(0, Math.min(20, parseInt(newSlotMaxInput.value, 10) || 0));
            content.slotLevels.push({ id: genId('sl'), level, max, spent: 0 });
            content.slotLevels.sort((a, b) => a.level - b.level);
            newSlotLevelInput.value = '';
            window.logActivity && window.logActivity({ type: 'spells.event.slot', message: t('spells.log.addSlot', { level }), sourceModuleId: data.id });
            scheduleSave();
            refreshSlotList();
            if (refreshCatList) refreshCatList();
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
            content.slotLevels.slice().sort((a, b) => a.level - b.level).forEach(sl => {
                opts.push({ value: String(sl.level), label: t('spells.slotLevelLabel', { n: sl.level }) });
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
                    if (trimmed) { cat.name = trimmed; scheduleSave(); reRender(); }
                });

                const currentSlotVal = (cat.slotLevel !== null && cat.slotLevel !== undefined) ? String(cat.slotLevel) : '';
                const slotSelect = buildCvSelect(buildSlotOptions(), currentSlotVal, (val) => {
                    cat.slotLevel = val === '' ? null : parseInt(val, 10);
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
                            content.categories = content.categories.filter(c => c.id !== cat.id);
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

        let newCatSlotLevel = null;
        const addCatSlotSelect = buildCvSelect(buildSlotOptions(), '', (val) => {
            newCatSlotLevel = val === '' ? null : parseInt(val, 10);
        });

        const addCatBtn = document.createElement('button');
        addCatBtn.className = 'spells-settings-add-btn';
        addCatBtn.title = t('spells.addCategoryTitle');
        addCatBtn.textContent = '+';

        addCatBtn.addEventListener('click', () => {
            const name = newCatNameInput.value.trim();
            if (!name) return;
            content.categories.push({ id: genId('cat'), name, slotLevel: newCatSlotLevel, collapsed: false, spells: [] });
            newCatNameInput.value = '';
            newCatSlotLevel = null;
            scheduleSave();
            refreshCatList();
            reRender();
        });

        newCatNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCatBtn.click(); });

        addCatRow.appendChild(newCatNameInput);
        addCatRow.appendChild(addCatSlotSelect.el);
        addCatRow.appendChild(addCatBtn);
        categoriesPane.appendChild(addCatRow);

        panes.categories = categoriesPane;
        body.appendChild(categoriesPane);

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
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        const keyHandler = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeModal(); } };
        document.addEventListener('keydown', keyHandler);
        overlay._keyHandler = keyHandler;
    }

    window.openSpellSettings = openSpellSettings;

    // ── Cross-Module API (used by Recovery module) ──

    window.restoreAllSpellSlots = function (moduleId) {
        const data = window.modules.find(m => m.id === moduleId);
        if (!data || data.type !== 'spells') return;
        data.content.slotLevels.forEach(sl => { sl.spent = 0; });
        const el = document.querySelector(`.module[data-id="${moduleId}"]`);
        if (el && window.isPlayMode) {
            const bodyEl = el.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
        }
    };

    window.isDiceNotation = isDiceNotation;
    window.extractDiceRoll = extractDiceRoll;
    window.spellsDefaultContent = defaultContent;
    window.getAvailableSlots = getAvailableSlots;
    window.spendSlot = spendSlot;
    window.castSpell = castSpell;
    window.getSortedSpells = getSortedSpells;
    window.migrateSpellContent = migrateContent;
    window.ensureSpellContent = ensureContent;

    // ── Registration ──
    registerModuleType('spells', {
        label: 'type.spells',

        renderBody(bodyEl, data, isPlayMode) {
            ensureContent(data);
            bodyEl.innerHTML = '';
            if (isPlayMode) {
                renderSpellsPlay(bodyEl, data);
            } else {
                renderSpellsLayout(bodyEl, data);
            }
        },

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onLayoutMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },
    });
})();
