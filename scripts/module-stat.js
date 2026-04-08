// ── Stat Module Type ──
(function () {
    // ── Stat Templates ──
    const STAT_TEMPLATES = {
        dnd5e: [{ name: 'STR' }, { name: 'DEX' }, { name: 'CON' }, { name: 'INT' }, { name: 'WIS' }, { name: 'CHA' }],
        pf2e: [{ name: 'STR' }, { name: 'DEX' }, { name: 'CON' }, { name: 'INT' }, { name: 'WIS' }, { name: 'CHA' }],
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
            rollable: true,
        }));
    }

    // ── Stat Module Helpers ──
    function formatModifier(mod) {
        const n = parseInt(mod, 10) || 0;
        return n >= 0 ? `+${n}` : `${n}`;
    }

    function updateRollableBtn(moduleEl, data) {
        const btn = moduleEl.querySelector('.module-rollable-btn');
        if (!btn) return;
        const idx = moduleEl._selectedStatIndex;
        if (idx === null || idx === undefined || !data.content.stats[idx]) {
            btn.classList.remove('active');
            btn.classList.add('disabled');
            btn.title = t('stat.toggleRollable');
        } else {
            btn.classList.remove('disabled');
            btn.classList.toggle('active', data.content.stats[idx].rollable);
            btn.title = data.content.stats[idx].rollable ? t('stat.rollableOn') : t('stat.rollableOff');
        }
    }

    function renderStatBlock(stat, index, data, isPlayMode) {
        const isLargeStat = data.content.layout === 'large-stat';
        const primaryVal = isLargeStat ? stat.value : formatModifier(stat.modifier);
        const secondaryVal = isLargeStat ? formatModifier(stat.modifier) : stat.value;

        const block = document.createElement('div');
        block.className = 'stat-block' + (isPlayMode && stat.rollable ? ' stat-rollable' : '');
        block.dataset.index = index;
        block.innerHTML =
            (stat.proficient ? '<span class="stat-proficiency-dot"></span>' : '') +
            `<div class="stat-name" title="${escapeHtml(stat.name || t('stat.unnamed'))}">${escapeHtml(stat.name || t('stat.unnamed'))}</div>` +
            `<div class="stat-primary">${escapeHtml(String(primaryVal))}</div>` +
            `<div class="stat-secondary">${escapeHtml(String(secondaryVal))}</div>`;

        if (isPlayMode && stat.rollable) {
            block.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    enterQuickEdit(block, stat, data);
                    return;
                }
                rollStatCheck(stat);
            });
        }

        if (isPlayMode && !stat.rollable) {
            block.addEventListener('click', (e) => {
                if (e.ctrlKey) enterQuickEdit(block, stat, data);
            });
        }

        return block;
    }

    function renderStatBlockEdit(stat, index, data) {
        const block = document.createElement('div');
        block.className = 'stat-block-edit';
        block.dataset.index = index;
        block.innerHTML =
            `<div class="stat-edit-name-row">` +
            `<span class="stat-drag-handle">&#x2807;</span>` +
            `<input class="stat-edit-name" type="text" value="${escapeHtml(stat.name)}" placeholder="${t('stat.unnamed')}">` +
            `<button class="stat-edit-delete" title="${t('stat.deleteStat')}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` +
            `</div>` +
            `<div class="stat-edit-row">` +
            `<div class="stat-edit-field"><label class="${data.content.layout === 'large-stat' ? 'stat-edit-primary-label' : ''}">${t('stat.value')}</label><input type="number" class="stat-edit-value" value="${stat.value}"></div>` +
            `<div class="stat-edit-field"><label class="${data.content.layout === 'large-modifier' ? 'stat-edit-primary-label' : ''}">${t('stat.modifier')}</label><input type="number" class="stat-edit-modifier" value="${stat.modifier}"></div>` +
            `</div>` +
            `<div class="stat-edit-toggles">` +
            `<label class="stat-edit-toggle"><input type="checkbox" class="stat-edit-proficient" ${stat.proficient ? 'checked' : ''}>${t('stat.proficient')}</label>` +
            `</div>`;

        // Wire up inputs
        const nameInput = block.querySelector('.stat-edit-name');
        const valInput = block.querySelector('.stat-edit-value');
        const modInput = block.querySelector('.stat-edit-modifier');
        const profCb = block.querySelector('.stat-edit-proficient');
        const deleteBtn = block.querySelector('.stat-edit-delete');

        nameInput.addEventListener('input', () => {
            stat.name = nameInput.value;
            scheduleSave();
        });
        valInput.addEventListener('input', () => {
            stat.value = parseInt(valInput.value, 10) || 0;
            scheduleSave();
        });
        modInput.addEventListener('input', () => {
            stat.modifier = parseInt(modInput.value, 10) || 0;
            scheduleSave();
        });
        profCb.addEventListener('change', () => {
            stat.proficient = profCb.checked;
            scheduleSave();
        });

        [nameInput, valInput, modInput].forEach((inp) => {
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
                updateRollableBtn(moduleEl, data);
            } else if (moduleEl && moduleEl._selectedStatIndex > index) {
                moduleEl._selectedStatIndex--;
                updateRollableBtn(moduleEl, data);
            }
            reRenderStatEdits(container, data);
            scheduleSave();
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
            updateRollableBtn(moduleEl, data);
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

    function rollStatCheck(stat) {
        const modStr = stat.modifier >= 0 ? `+${stat.modifier}` : `${stat.modifier}`;
        try {
            TS.dice.putDiceInTray([{ name: `${stat.name} ${t('stat.check')}`, roll: `1d20${modStr}` }]);
        } catch (e) {
            console.warn('[CV] Dice roll failed:', e);
        }
    }

    function enterQuickEdit(block, stat, data) {
        const isLargeStat = data.content.layout === 'large-stat';
        const primaryEl = block.querySelector('.stat-primary');
        const secondaryEl = block.querySelector('.stat-secondary');
        if (!primaryEl || !secondaryEl) return;

        const primaryInput = document.createElement('input');
        primaryInput.type = 'number';
        primaryInput.className = 'stat-quick-input';
        primaryInput.value = isLargeStat ? stat.value : stat.modifier;

        const secondaryInput = document.createElement('input');
        secondaryInput.type = 'number';
        secondaryInput.className = 'stat-quick-input stat-quick-secondary';
        secondaryInput.value = isLargeStat ? stat.modifier : stat.value;

        primaryEl.replaceWith(primaryInput);
        secondaryEl.replaceWith(secondaryInput);
        primaryInput.focus();
        primaryInput.select();

        function commit() {
            if (isLargeStat) {
                stat.value = parseInt(primaryInput.value, 10) || 0;
                stat.modifier = parseInt(secondaryInput.value, 10) || 0;
            } else {
                stat.modifier = parseInt(primaryInput.value, 10) || 0;
                stat.value = parseInt(secondaryInput.value, 10) || 0;
            }
            scheduleSave();
            // Re-render this block in-place
            const container = block.parentElement;
            const idx = parseInt(block.dataset.index, 10);
            const isPlayModeLocal = isPlayMode;
            const newBlock = renderStatBlock(stat, idx, data, isPlayModeLocal);
            block.replaceWith(newBlock);
        }

        let committed = false;
        function commitOnce() {
            if (committed) return;
            committed = true;
            commit();
        }

        [primaryInput, secondaryInput].forEach((inp) => {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    commitOnce();
                }
            });
            inp.addEventListener('blur', () => {
                setTimeout(commitOnce, 50);
            });
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

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
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

    window.STAT_TEMPLATES = STAT_TEMPLATES;
    window.applyStatTemplate = applyStatTemplate;
    window.updateRollableBtn = updateRollableBtn;
})();
