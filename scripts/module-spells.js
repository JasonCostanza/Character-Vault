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
        return { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [] };
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

    // ── Dice Rolling ──
    function rollAllSpellDice(spell) {
        if (typeof TS === 'undefined') return null;
        const rolls = (spell.attributes || [])
            .map((a) => ({ key: a.key, roll: extractDiceRoll(a.value) }))
            .filter((x) => x.roll);
        if (!rolls.length) return null;
        try {
            return TS.dice.putDiceInTray(rolls.map((x) => ({ name: (spell.name || t('spells.unnamed')) + ': ' + x.key, roll: x.roll })));
        } catch (e) {
            console.warn('[CV] Spell dice roll failed:', e);
            return null;
        }
    }

    function rollSingleAttribute(spell, attr, data) {
        if (typeof TS === 'undefined') return;
        const roll = extractDiceRoll(attr.value);
        if (!roll) return;
        try {
            const rollPromise = TS.dice.putDiceInTray([{ name: (spell.name || t('spells.unnamed')) + ': ' + attr.key, roll }]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({ type: 'spells.event.roll', message: t('spells.log.roll', { spellName: spell.name || t('spells.unnamed'), attrName: attr.key, roll }), sourceModuleId: data.id });
                rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId }; });
            }
        } catch (e) {
            console.warn('[CV] Attribute dice roll failed:', e);
        }
    }

    // ── Cast Logic ──
    function castSpell(moduleEl, data, spell, catId, onSuccess) {
        const cat = data.content.categories.find((c) => c.id === catId);
        if (!cat) return;

        let slotSpent = false;
        if (cat.slotLevel !== null && data.content.autoSpendSlots) {
            const available = getAvailableSlots(data, cat.slotLevel);
            if (available <= 0) {
                if (data.content.showSlotErrors) {
                    showToast(t('spells.noSlotsError', { level: t('spells.slotLevelLabel', { n: cat.slotLevel }) }), 'error');
                }
                return;
            }
            spendSlot(data, cat.slotLevel);
            scheduleSave();
            slotSpent = true;
            const bodyEl = moduleEl.querySelector('.module-body');
            MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
        }

        const rollPromise = rollAllSpellDice(spell);
        if (typeof window.logActivity === 'function') {
            const spellName = spell.name || t('spells.unnamed');
            let msg = slotSpent
                ? t('spells.log.castSlot', { name: spellName, level: cat.slotLevel })
                : t('spells.log.cast', { name: spellName });
            const diceRolls = (spell.attributes || []).map((a) => extractDiceRoll(a.value)).filter(Boolean);
            if (diceRolls.length) msg += ' \u2014 ' + diceRolls.join(', ');
            const logEntryId = window.logActivity({ type: 'spells.event.cast', message: msg, sourceModuleId: data.id });
            if (rollPromise && logEntryId) {
                rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId }; });
            }
        }
        if (onSuccess) onSuccess();
    }

    // ── Play Mode ──
    function renderSpellsPlayLayer(bodyEl, data) {
        const c = data.content;
        const container = document.createElement('div');
        container.className = 'spells-play-container';

        // ── Slot Levels Section ──
        const slotsSection = document.createElement('div');
        slotsSection.className = 'spells-slots-section';

        const slotsHeader = document.createElement('div');
        slotsHeader.className = 'spells-slots-header';
        const slotsLabel = document.createElement('span');
        slotsLabel.className = 'spells-slots-label';
        slotsLabel.textContent = t('spells.slots');
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn-secondary sm';
        restoreBtn.textContent = t('spells.restoreAll');
        restoreBtn.addEventListener('click', () => {
            c.slotLevels.forEach((sl) => { sl.spent = 0; });
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                window.logActivity({ type: 'spells.event.restore', message: t('spells.log.restore'), sourceModuleId: data.id });
            }
            MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
        });
        slotsHeader.appendChild(slotsLabel);
        slotsHeader.appendChild(restoreBtn);
        slotsSection.appendChild(slotsHeader);

        if (c.slotLevels.length === 0) {
            const noSlots = document.createElement('div');
            noSlots.className = 'spells-no-slots-msg';
            noSlots.textContent = t('spells.noSlots');
            slotsSection.appendChild(noSlots);
        } else {
            const pipsWrap = document.createElement('div');
            pipsWrap.className = 'spells-pips-wrap';
            c.slotLevels.forEach((sl) => {
                const row = document.createElement('div');
                row.className = 'spells-pip-row';
                const label = document.createElement('span');
                label.className = 'spells-pip-label';
                label.textContent = t('spells.slotLevelLabel', { n: sl.level });
                row.appendChild(label);
                for (let i = 0; i < sl.max; i++) {
                    const pip = document.createElement('button');
                    const isSpent = i >= sl.max - sl.spent;
                    pip.className = 'spell-pip' + (isSpent ? ' spent' : '');
                    pip.title = isSpent ? t('spells.pipRestore') : t('spells.pipSpend');
                    const slotIndex = i;
                    pip.addEventListener('click', () => {
                        const clickedIsSpent = slotIndex >= sl.max - sl.spent;
                        if (clickedIsSpent) {
                            sl.spent = sl.max - 1 - slotIndex;
                        } else {
                            sl.spent = sl.max - slotIndex;
                        }
                        scheduleSave();
                        if (typeof window.logActivity === 'function') {
                            const key = clickedIsSpent ? 'spells.log.pipRestore' : 'spells.log.pipSpend';
                            window.logActivity({ type: 'spells.event.slot', message: t(key, { level: sl.level }), sourceModuleId: data.id });
                        }
                        MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
                    });
                    row.appendChild(pip);
                }
                pipsWrap.appendChild(row);
            });
            slotsSection.appendChild(pipsWrap);
        }
        container.appendChild(slotsSection);

        // ── Spell List ──
        const listScroll = document.createElement('div');
        listScroll.className = 'spells-list-scroll';

        if (c.categories.length === 0) {
            const noCats = document.createElement('div');
            noCats.className = 'spells-no-cats-msg';
            noCats.textContent = t('spells.noCategories');
            listScroll.appendChild(noCats);
        } else {
            c.categories.forEach((cat) => {
                const catEl = document.createElement('div');
                catEl.className = 'spells-category';

                const catHeader = document.createElement('button');
                catHeader.className = 'spells-cat-header';

                const collapseIcon = document.createElement('span');
                collapseIcon.className = 'spells-collapse-icon';
                collapseIcon.innerHTML = cat.collapsed
                    ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

                const catName = document.createElement('span');
                catName.className = 'spells-cat-name';
                catName.textContent = cat.name || t('spells.unnamedCategory');

                const slotBadge = document.createElement('span');
                slotBadge.className = 'spells-cat-slot-badge';
                slotBadge.textContent = cat.slotLevel === null
                    ? t('spells.slotNone')
                    : t('spells.slotLevelLabel', { n: cat.slotLevel });

                catHeader.appendChild(collapseIcon);
                catHeader.appendChild(catName);
                catHeader.appendChild(slotBadge);
                catHeader.addEventListener('click', () => {
                    cat.collapsed = !cat.collapsed;
                    scheduleSave();
                    MODULE_TYPES['spells'].renderBody(bodyEl, data, true);
                });
                catEl.appendChild(catHeader);

                if (!cat.collapsed) {
                    const spellList = document.createElement('div');
                    spellList.className = 'spells-spell-list';

                    if (!cat.spells || cat.spells.length === 0) {
                        const noSpells = document.createElement('div');
                        noSpells.className = 'spells-no-spells-msg';
                        noSpells.textContent = t('spells.noSpells');
                        spellList.appendChild(noSpells);
                    } else {
                        cat.spells.forEach((spell) => {
                            const spellRow = document.createElement('div');
                            spellRow.className = 'spells-spell-row';

                            const spellName = document.createElement('span');
                            spellName.className = 'spells-spell-name';
                            spellName.textContent = spell.name || t('spells.unnamed');

                            const actions = document.createElement('div');
                            actions.className = 'spells-spell-actions';

                            const expandBtn = document.createElement('button');
                            expandBtn.className = 'spells-expand-btn icon-btn sm';
                            expandBtn.title = t('spells.details');
                            expandBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
                            expandBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                openSpellDetailModal(bodyEl.closest('.module'), data, spell, cat.id);
                            });

                            const castBtn = document.createElement('button');
                            castBtn.className = 'btn-primary sm';
                            castBtn.textContent = t('spells.cast');
                            castBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                castSpell(bodyEl.closest('.module'), data, spell, cat.id, null);
                            });

                            actions.appendChild(expandBtn);
                            actions.appendChild(castBtn);
                            spellRow.appendChild(spellName);
                            spellRow.appendChild(actions);
                            spellList.appendChild(spellRow);
                        });
                    }
                    catEl.appendChild(spellList);
                }
                listScroll.appendChild(catEl);
            });
        }
        container.appendChild(listScroll);
        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    }

    // ── Spell Detail Modal ──
    function openSpellDetailModal(moduleEl, data, spell, catId) {
        const existing = document.querySelector('.spells-detail-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay spells-detail-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = spell.name || t('spells.unnamed');
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('spells.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        if (!spell.attributes || spell.attributes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'spells-detail-empty';
            empty.textContent = t('spells.noAttributes');
            body.appendChild(empty);
        } else {
            spell.attributes.forEach((attr) => {
                const row = document.createElement('div');
                row.className = 'spells-detail-attr-row';

                const keyEl = document.createElement('span');
                keyEl.className = 'spells-detail-attr-key';
                keyEl.textContent = attr.key;

                const valueEl = document.createElement('span');
                valueEl.className = 'spells-detail-attr-value';
                valueEl.textContent = attr.value;

                row.appendChild(keyEl);
                row.appendChild(valueEl);

                if (isDiceNotation(attr.value)) {
                    const rollBtn = document.createElement('button');
                    rollBtn.className = 'btn-primary sm';
                    rollBtn.textContent = t('spells.roll');
                    rollBtn.addEventListener('click', () => rollSingleAttribute(spell, attr, data));
                    row.appendChild(rollBtn);
                }

                body.appendChild(row);
            });
        }

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-secondary sm';
        editBtn.textContent = t('spells.edit');
        const castBtn = document.createElement('button');
        castBtn.className = 'btn-primary sm';
        castBtn.textContent = t('spells.castSpell');

        editBtn.addEventListener('click', () => {
            forceClose();
            openSpellEditModal(moduleEl, data, spell, catId);
        });
        castBtn.addEventListener('click', () => {
            castSpell(moduleEl, data, spell, catId, forceClose);
        });
        footer.appendChild(editBtn);
        footer.appendChild(castBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        closeBtn.addEventListener('click', forceClose);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) forceClose(); });

        const keyHandler = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); forceClose(); }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // ── Spell Edit Modal ──
    function openSpellEditModal(moduleEl, data, spell, catId) {
        const isNew = !spell.id;
        const workingSpell = {
            id: spell.id || genId('sp'),
            name: spell.name || '',
            attributes: (spell.attributes || []).map((a) => ({ ...a })),
        };
        let dirty = false;

        const existing = document.querySelector('.spells-edit-spell-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay spells-edit-spell-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t(isNew ? 'spells.addSpellTitle' : 'spells.editSpellTitle');
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('spells.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'cv-modal-label';
        nameLabel.textContent = t('spells.spellName');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-modal-input';
        nameInput.value = workingSpell.name;
        nameInput.placeholder = t('spells.spellNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', () => { workingSpell.name = nameInput.value; dirty = true; });
        body.appendChild(nameLabel);
        body.appendChild(nameInput);

        const attrsLabel = document.createElement('div');
        attrsLabel.className = 'cv-modal-label';
        attrsLabel.textContent = t('spells.attributes');
        body.appendChild(attrsLabel);

        const attrsList = document.createElement('div');
        attrsList.className = 'spells-attrs-list';
        body.appendChild(attrsList);

        function buildAttrRows() {
            attrsList.innerHTML = '';
            workingSpell.attributes.forEach((attr, i) => {
                const row = document.createElement('div');
                row.className = 'spells-attr-edit-row';

                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.className = 'spells-attr-key-input';
                keyInput.value = attr.key;
                keyInput.placeholder = t('spells.attrKey');
                keyInput.spellcheck = false;
                keyInput.autocomplete = 'off';
                keyInput.addEventListener('input', () => { workingSpell.attributes[i].key = keyInput.value; dirty = true; });

                const valInput = document.createElement('input');
                valInput.type = 'text';
                valInput.className = 'spells-attr-value-input';
                valInput.value = attr.value;
                valInput.placeholder = t('spells.attrValue');
                valInput.spellcheck = false;
                valInput.autocomplete = 'off';
                valInput.addEventListener('input', () => { workingSpell.attributes[i].value = valInput.value; dirty = true; });

                const delBtn = document.createElement('button');
                delBtn.className = 'icon-btn sm danger';
                delBtn.title = t('spells.removeAttr');
                delBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                delBtn.addEventListener('click', () => {
                    workingSpell.attributes.splice(i, 1);
                    dirty = true;
                    buildAttrRows();
                });

                row.appendChild(keyInput);
                row.appendChild(valInput);
                row.appendChild(delBtn);
                attrsList.appendChild(row);
            });
        }
        buildAttrRows();

        const addAttrBtn = document.createElement('button');
        addAttrBtn.className = 'btn-secondary sm';
        addAttrBtn.style.alignSelf = 'flex-start';
        addAttrBtn.textContent = t('spells.addAttribute');
        addAttrBtn.addEventListener('click', () => {
            workingSpell.attributes.push({ id: genId('a'), key: '', value: '' });
            dirty = true;
            buildAttrRows();
            const inputs = attrsList.querySelectorAll('.spells-attr-key-input');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        body.appendChild(addAttrBtn);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        if (!isNew) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger sm';
            deleteBtn.textContent = t('spells.delete');
            deleteBtn.addEventListener('click', () => {
                if (!window.confirm(t('spells.deleteSpellConfirm'))) return;
                const cat = data.content.categories.find((c) => c.id === catId);
                if (cat) cat.spells = cat.spells.filter((s) => s.id !== spell.id);
                scheduleSave();
                const bodyEl = moduleEl.querySelector('.module-body');
                const isPlay = isPlayMode;
                MODULE_TYPES['spells'].renderBody(bodyEl, data, isPlay);
                dirty = false;
                forceClose();
            });
            footer.appendChild(deleteBtn);
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary filled';
        cancelBtn.textContent = t('spells.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('spells.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        nameInput.focus();

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function close() {
            if (dirty && !window.confirm(t('spells.discardChanges'))) return;
            forceClose();
        }

        function save() {
            if (!workingSpell.name.trim()) { nameInput.focus(); return; }
            const cat = data.content.categories.find((c) => c.id === catId);
            if (!cat) { forceClose(); return; }
            if (isNew) {
                cat.spells = cat.spells || [];
                cat.spells.push({
                    id: workingSpell.id,
                    name: workingSpell.name.trim(),
                    attributes: workingSpell.attributes.map((a) => ({
                        id: a.id || genId('a'),
                        key: a.key,
                        value: a.value,
                    })),
                });
            } else {
                const idx = cat.spells.findIndex((s) => s.id === spell.id);
                if (idx !== -1) {
                    cat.spells[idx] = {
                        id: spell.id,
                        name: workingSpell.name.trim(),
                        attributes: workingSpell.attributes.map((a) => ({
                            id: a.id || genId('a'),
                            key: a.key,
                            value: a.value,
                        })),
                    };
                }
            }
            scheduleSave();
            const bodyEl = moduleEl.querySelector('.module-body');
            const isPlay = isPlayMode;
            MODULE_TYPES['spells'].renderBody(bodyEl, data, isPlay);
            dirty = false;
            forceClose();
        }

        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        const keyHandler = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // ── Category Edit Modal ──
    function openCategoryEditModal(moduleEl, data, cat) {
        const isNew = !cat.id;
        const working = {
            id: cat.id || genId('cat'),
            name: cat.name || '',
            slotLevel: cat.slotLevel !== undefined ? cat.slotLevel : null,
        };
        let dirty = false;

        const existing = document.querySelector('.spells-edit-cat-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay spells-edit-cat-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t(isNew ? 'spells.addCategoryTitle' : 'spells.editCategoryTitle');
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('spells.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'cv-modal-label';
        nameLabel.textContent = t('spells.categoryName');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-modal-input';
        nameInput.value = working.name;
        nameInput.placeholder = t('spells.categoryNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', () => { working.name = nameInput.value; dirty = true; });
        body.appendChild(nameLabel);
        body.appendChild(nameInput);

        const slotLabel = document.createElement('label');
        slotLabel.className = 'cv-modal-label';
        slotLabel.textContent = t('spells.categorySlot');
        const slotSelect = document.createElement('select');
        slotSelect.className = 'settings-select';
        const noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = t('spells.slotNone');
        slotSelect.appendChild(noneOpt);
        data.content.slotLevels.forEach((sl) => {
            const opt = document.createElement('option');
            opt.value = String(sl.level);
            opt.textContent = t('spells.slotLevelLabel', { n: sl.level });
            if (sl.level === working.slotLevel) opt.selected = true;
            slotSelect.appendChild(opt);
        });
        if (working.slotLevel === null) slotSelect.value = '';
        slotSelect.addEventListener('change', () => {
            working.slotLevel = slotSelect.value === '' ? null : Number(slotSelect.value);
            dirty = true;
        });
        body.appendChild(slotLabel);
        body.appendChild(slotSelect);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary filled';
        cancelBtn.textContent = t('spells.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('spells.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        nameInput.focus();

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function close() {
            if (dirty && !window.confirm(t('spells.discardChanges'))) return;
            forceClose();
        }

        function save() {
            if (!working.name.trim()) { nameInput.focus(); return; }
            if (isNew) {
                data.content.categories.push({
                    id: working.id,
                    name: working.name.trim(),
                    slotLevel: working.slotLevel,
                    collapsed: false,
                    spells: [],
                });
            } else {
                const c = data.content.categories.find((x) => x.id === cat.id);
                if (c) { c.name = working.name.trim(); c.slotLevel = working.slotLevel; }
            }
            scheduleSave();
            const bodyEl = moduleEl.querySelector('.module-body');
            const isPlay = isPlayMode;
            MODULE_TYPES['spells'].renderBody(bodyEl, data, isPlay);
            dirty = false;
            forceClose();
        }

        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        const keyHandler = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // ── Edit Mode ──
    function renderSpellsEditLayer(bodyEl, data) {
        const c = data.content;
        const container = document.createElement('div');
        container.className = 'spells-edit-container';

        // ── Slot Levels Section ──
        const slotsSection = document.createElement('div');
        slotsSection.className = 'spells-edit-section';

        const slotsHdr = document.createElement('div');
        slotsHdr.className = 'spells-edit-section-header';
        const slotsLabelEl = document.createElement('span');
        slotsLabelEl.className = 'spells-edit-section-label';
        slotsLabelEl.textContent = t('spells.slots');
        const addSlotBtn = document.createElement('button');
        addSlotBtn.className = 'btn-secondary sm';
        addSlotBtn.textContent = t('spells.addSlotLevel');
        addSlotBtn.addEventListener('click', () => {
            const nextLevel = c.slotLevels.reduce((m, sl) => Math.max(m, sl.level), 0) + 1;
            c.slotLevels.push({ id: genId('sl'), level: nextLevel, max: 4, spent: 0 });
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                window.logActivity({ type: 'spells.event.slot', message: t('spells.log.addSlot', { level: nextLevel }), sourceModuleId: data.id });
            }
            MODULE_TYPES['spells'].renderBody(bodyEl, data, false);
        });
        slotsHdr.appendChild(slotsLabelEl);
        slotsHdr.appendChild(addSlotBtn);
        slotsSection.appendChild(slotsHdr);

        c.slotLevels.forEach((sl) => {
            const slRow = document.createElement('div');
            slRow.className = 'spells-slot-level-row';

            const lbl = document.createElement('span');
            lbl.className = 'spells-slot-level-label';
            lbl.textContent = t('spells.slotLevelLabel', { n: sl.level });

            const maxLbl = document.createElement('span');
            maxLbl.className = 'spells-slot-max-label';
            maxLbl.textContent = t('spells.slotMax');

            const maxIn = document.createElement('input');
            maxIn.type = 'number';
            maxIn.className = 'spells-slot-max-input';
            maxIn.value = sl.max;
            maxIn.min = 0;
            maxIn.max = 99;
            maxIn.addEventListener('change', () => {
                const v = Math.max(0, Math.min(99, parseInt(maxIn.value, 10) || 0));
                sl.max = v;
                sl.spent = Math.min(sl.spent, sl.max);
                maxIn.value = v;
                scheduleSave();
                if (typeof window.logActivity === 'function') {
                    window.logActivity({ type: 'spells.event.slot', message: t('spells.log.modifySlot', { level: sl.level, max: v }), sourceModuleId: data.id });
                }
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-btn sm danger';
            removeBtn.title = t('spells.removeSlotLevel');
            removeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            removeBtn.addEventListener('click', () => {
                const inUse = c.categories.some((cat) => cat.slotLevel === sl.level);
                if (inUse && !window.confirm(t('spells.removeSlotLevelConfirm'))) return;
                if (inUse) c.categories.forEach((cat) => { if (cat.slotLevel === sl.level) cat.slotLevel = null; });
                const removedLevel = sl.level;
                c.slotLevels = c.slotLevels.filter((x) => x.id !== sl.id);
                scheduleSave();
                if (typeof window.logActivity === 'function') {
                    window.logActivity({ type: 'spells.event.slot', message: t('spells.log.removeSlot', { level: removedLevel }), sourceModuleId: data.id });
                }
                MODULE_TYPES['spells'].renderBody(bodyEl, data, false);
            });

            slRow.appendChild(lbl);
            slRow.appendChild(maxLbl);
            slRow.appendChild(maxIn);
            slRow.appendChild(removeBtn);
            slotsSection.appendChild(slRow);
        });
        container.appendChild(slotsSection);

        // Divider
        const divider = document.createElement('div');
        divider.className = 'spells-edit-divider';
        container.appendChild(divider);

        // ── Categories Section ──
        const catsSection = document.createElement('div');
        catsSection.className = 'spells-edit-section';

        const catsHdr = document.createElement('div');
        catsHdr.className = 'spells-edit-section-header';
        const addCatBtn = document.createElement('button');
        addCatBtn.className = 'btn-secondary sm';
        addCatBtn.textContent = t('spells.addCategory');
        addCatBtn.addEventListener('click', () => {
            openCategoryEditModal(bodyEl.closest('.module'), data, {});
        });
        catsHdr.appendChild(addCatBtn);
        catsSection.appendChild(catsHdr);

        const catListEl = document.createElement('div');
        catListEl.className = 'spells-cat-edit-list';

        let catSortable = null;

        function buildCatList() {
            catListEl.innerHTML = '';
            c.categories.forEach((cat) => {
                const catEl = document.createElement('div');
                catEl.className = 'spells-edit-cat';
                catEl.dataset.catId = cat.id;

                const catHdrRow = document.createElement('div');
                catHdrRow.className = 'spells-edit-cat-header';

                const dragHandle = document.createElement('span');
                dragHandle.className = 'spells-cat-drag-handle';
                dragHandle.innerHTML = '&#x2807;';

                const collapseBtn = document.createElement('button');
                collapseBtn.className = 'icon-btn sm';
                collapseBtn.title = cat.collapsed ? t('spells.expand') : t('spells.collapse');
                collapseBtn.innerHTML = cat.collapsed
                    ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
                collapseBtn.addEventListener('click', () => {
                    cat.collapsed = !cat.collapsed;
                    scheduleSave();
                    buildCatList();
                    initCatSortable();
                });

                const catNameEl = document.createElement('span');
                catNameEl.className = 'spells-edit-cat-name';
                catNameEl.textContent = cat.name || t('spells.unnamedCategory');

                const slotBadge = document.createElement('span');
                slotBadge.className = 'spells-cat-slot-badge';
                slotBadge.textContent = cat.slotLevel === null
                    ? t('spells.slotNone')
                    : t('spells.slotLevelLabel', { n: cat.slotLevel });

                const editCatBtn = document.createElement('button');
                editCatBtn.className = 'icon-btn sm';
                editCatBtn.title = t('spells.editCategory');
                editCatBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
                editCatBtn.addEventListener('click', () => {
                    openCategoryEditModal(bodyEl.closest('.module'), data, cat);
                });

                const deleteCatBtn = document.createElement('button');
                deleteCatBtn.className = 'icon-btn sm danger';
                deleteCatBtn.title = t('spells.deleteCategory');
                deleteCatBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                deleteCatBtn.addEventListener('click', () => {
                    const hasSpells = cat.spells && cat.spells.length > 0;
                    if (hasSpells && !window.confirm(t('spells.deleteCategoryConfirm'))) return;
                    c.categories = c.categories.filter((x) => x.id !== cat.id);
                    scheduleSave();
                    buildCatList();
                    initCatSortable();
                });

                catHdrRow.appendChild(dragHandle);
                catHdrRow.appendChild(collapseBtn);
                catHdrRow.appendChild(catNameEl);
                catHdrRow.appendChild(slotBadge);
                catHdrRow.appendChild(editCatBtn);
                catHdrRow.appendChild(deleteCatBtn);
                catEl.appendChild(catHdrRow);

                if (!cat.collapsed) {
                    const spellSection = document.createElement('div');
                    spellSection.className = 'spells-edit-spell-section';

                    const spellListEl = document.createElement('div');
                    spellListEl.className = 'spells-edit-spell-list';
                    spellListEl.dataset.catId = cat.id;

                    (cat.spells || []).forEach((spell) => {
                        const spellRow = document.createElement('div');
                        spellRow.className = 'spells-edit-spell-row';
                        spellRow.dataset.spellId = spell.id;

                        const spellDragHandle = document.createElement('span');
                        spellDragHandle.className = 'spells-spell-drag-handle';
                        spellDragHandle.innerHTML = '&#x2807;';

                        const spellNameEl = document.createElement('span');
                        spellNameEl.className = 'spells-edit-spell-name';
                        spellNameEl.textContent = spell.name || t('spells.unnamed');

                        const editSpellBtn = document.createElement('button');
                        editSpellBtn.className = 'icon-btn sm';
                        editSpellBtn.title = t('spells.editSpell');
                        editSpellBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
                        editSpellBtn.addEventListener('click', () => {
                            openSpellEditModal(bodyEl.closest('.module'), data, spell, cat.id);
                        });

                        const deleteSpellBtn = document.createElement('button');
                        deleteSpellBtn.className = 'icon-btn sm danger';
                        deleteSpellBtn.title = t('spells.deleteSpell');
                        deleteSpellBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                        deleteSpellBtn.addEventListener('click', () => {
                            if (!window.confirm(t('spells.deleteSpellConfirm'))) return;
                            cat.spells = cat.spells.filter((s) => s.id !== spell.id);
                            scheduleSave();
                            buildCatList();
                            initCatSortable();
                        });

                        spellRow.appendChild(spellDragHandle);
                        spellRow.appendChild(spellNameEl);
                        spellRow.appendChild(editSpellBtn);
                        spellRow.appendChild(deleteSpellBtn);
                        spellListEl.appendChild(spellRow);
                    });

                    if (cat.spells && cat.spells.length > 1) {
                        new Sortable(spellListEl, {
                            handle: '.spells-spell-drag-handle',
                            animation: 150,
                            ghostClass: 'spells-spell-ghost',
                            draggable: '.spells-edit-spell-row',
                            onEnd() {
                                const rows = Array.from(spellListEl.querySelectorAll('.spells-edit-spell-row'));
                                cat.spells = rows.map((r) => cat.spells.find((s) => s.id === r.dataset.spellId)).filter(Boolean);
                                scheduleSave();
                            },
                        });
                    }

                    spellSection.appendChild(spellListEl);

                    const addSpellBtn = document.createElement('button');
                    addSpellBtn.className = 'btn-secondary sm';
                    addSpellBtn.textContent = t('spells.addSpell');
                    addSpellBtn.addEventListener('click', () => {
                        openSpellEditModal(bodyEl.closest('.module'), data, {}, cat.id);
                    });
                    spellSection.appendChild(addSpellBtn);

                    catEl.appendChild(spellSection);
                }
                catListEl.appendChild(catEl);
            });
        }

        function initCatSortable() {
            if (catSortable) catSortable.destroy();
            if (c.categories.length > 1) {
                catSortable = new Sortable(catListEl, {
                    handle: '.spells-cat-drag-handle',
                    animation: 150,
                    ghostClass: 'spells-cat-ghost',
                    draggable: '.spells-edit-cat',
                    onEnd() {
                        const catEls = Array.from(catListEl.querySelectorAll('.spells-edit-cat'));
                        c.categories = catEls.map((el) => c.categories.find((cat) => cat.id === el.dataset.catId)).filter(Boolean);
                        scheduleSave();
                    },
                });
            }
        }

        buildCatList();
        initCatSortable();

        catsSection.appendChild(catListEl);
        container.appendChild(catsSection);
        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    }

    // ── Settings Modal ──
    function openSpellSettings(moduleEl, data) {
        const existing = document.querySelector('.spells-settings-overlay');
        if (existing) existing.remove();

        const working = {
            autoSpendSlots: data.content.autoSpendSlots,
            showSlotErrors: data.content.showSlotErrors,
        };

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay spells-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('spells.settingsTitle');
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('spells.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        function makeToggle(labelKey, checked, onChange) {
            const toggle = makeCvToggle(checked, onChange);
            toggle.className = 'spells-settings-toggle-label';
            const label = document.createElement('span');
            label.className = 'cv-toggle-label';
            label.textContent = t(labelKey);
            toggle.appendChild(label);
            return toggle;
        }

        body.appendChild(makeToggle('spells.autoSpendSlots', working.autoSpendSlots, (v) => { working.autoSpendSlots = v; }));
        body.appendChild(makeToggle('spells.showSlotErrors', working.showSlotErrors, (v) => { working.showSlotErrors = v; }));

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary filled';
        cancelBtn.textContent = t('spells.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('spells.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function save() {
            data.content.autoSpendSlots = working.autoSpendSlots;
            data.content.showSlotErrors = working.showSlotErrors;
            scheduleSave();
            forceClose();
        }

        closeBtn.addEventListener('click', forceClose);
        cancelBtn.addEventListener('click', forceClose);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) forceClose(); });

        const keyHandler = (e) => { if (e.key === 'Escape') { e.stopPropagation(); forceClose(); } };
        document.addEventListener('keydown', keyHandler);
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

    // ── Registration ──
    registerModuleType('spells', {
        label: 'type.spells',

        renderBody(bodyEl, data, isPlayMode) {
            if (!data.content || typeof data.content !== 'object' || Array.isArray(data.content)) {
                data.content = defaultContent();
            }
            if (data.content.autoSpendSlots === undefined) data.content.autoSpendSlots = true;
            if (data.content.showSlotErrors === undefined) data.content.showSlotErrors = true;
            if (!Array.isArray(data.content.slotLevels)) data.content.slotLevels = [];
            if (!Array.isArray(data.content.categories)) data.content.categories = [];

            bodyEl.innerHTML = '';
            if (isPlayMode) {
                renderSpellsPlayLayer(bodyEl, data);
            } else {
                renderSpellsEditLayer(bodyEl, data);
            }
        },

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },
    });
})();
