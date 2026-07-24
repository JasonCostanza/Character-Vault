// ── Health Module Type ──
(function () {
    // ── Health Module Helpers ──

    function evaluateHealthExpression(str) {
        return window.resolveMathExpression(str, null, false);
    }

    function getEffectiveMaxHP(content) {
        return (content.maxHP || 0) + (content.maxHPModifier || 0);
    }

    function applyDamage(content, amount) {
        if (amount <= 0) return;
        let remaining = amount;
        // Temp HP absorbs damage first
        if (content.tempHP > 0) {
            const absorbed = Math.min(content.tempHP, remaining);
            content.tempHP -= absorbed;
            remaining -= absorbed;
        }
        // Remaining goes to current HP
        content.currentHP -= remaining;
    }

    function applyHealing(content, amount) {
        if (amount <= 0) return;
        const effectiveMax = getEffectiveMaxHP(content);
        content.currentHP = Math.min(content.currentHP + amount, effectiveMax);
    }

    function setMaxModIndicatorEl(el, c) {
        if (!el) return;
        if (c.maxHPModifier !== 0) {
            el.textContent = `(${c.maxHPModifier >= 0 ? '+' : ''}${c.maxHPModifier} MAX)`;
            el.style.display = '';
        } else {
            el.textContent = '';
            el.style.display = 'none';
        }
    }

    /** Keep the module body in sync with `data.content` without rebuilding DOM. */
    function syncHealthLayersFromData(moduleEl, data) {
        const container = moduleEl.querySelector('.health-container');
        if (!container) return;
        const c = data.content;
        const play = container.querySelector('.health-layer-play');
        if (play) {
            const cur = play.querySelector('.health-current');
            const max = play.querySelector('.health-max');
            if (cur) cur.textContent = c.currentHP;
            if (max) max.textContent = getEffectiveMaxHP(c);
            setMaxModIndicatorEl(play.querySelector('.health-maxmod-indicator'), c);
            const tempBadge = play.querySelector('.health-temp-badge');
            if (tempBadge) {
                tempBadge.classList.toggle('has-temp', c.tempHP > 0);
                const tv = tempBadge.querySelector('.health-temp-value');
                if (tv) tv.textContent = c.tempHP > 0 ? '+' + c.tempHP : '0';
            }
        }
    }

    // ── Health Action Overlay ──

    function openHealthActionOverlay(moduleEl, data, mode) {
        closeHealthActionOverlay(moduleEl);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay health-action-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        let titleKey;
        switch (mode) {
            case 'damage':
                titleKey = 'health.takeDamage';
                break;
            case 'heal':
                titleKey = 'health.heal';
                break;
            case 'temp':
                titleKey = 'health.setTempHP';
                break;
        }

        panel.innerHTML =
            `<div class="cv-modal-header">` +
            `<span class="cv-modal-title">${escapeHtml(t(titleKey))}</span>` +
            `<button class="cv-modal-close" title="${escapeHtml(t('health.cancel'))}">` +
            cvIcon('x', 12) +
            `</button>` +
            `</div>` +
            `<div class="cv-modal-body health-action-body">` +
            `<input type="text" class="health-action-input" placeholder="0" spellcheck="false" autocomplete="off">` +
            `</div>` +
            `<div class="cv-modal-footer">` +
            `<button class="health-action-cancel btn-secondary sm">${escapeHtml(t('health.cancel'))}</button>` +
            `<button class="health-action-ok btn-primary">${escapeHtml(t('health.ok'))}</button>` +
            `</div>`;

        const input = panel.querySelector('.health-action-input');
        const closeBtn = panel.querySelector('.cv-modal-close');
        const cancelBtn = panel.querySelector('.health-action-cancel');
        const okBtn = panel.querySelector('.health-action-ok');

        // Pre-fill for setters
        if (mode === 'temp') input.value = data.content.tempHP || '';

        function confirm() {
            const result = evaluateHealthExpression(input.value);
            if (result === null) {
                cancel();
                return;
            }

            const oldCurrentHP = data.content.currentHP;
            const oldTempHP = data.content.tempHP;

            switch (mode) {
                case 'damage':
                    applyDamage(data.content, result);
                    break;
                case 'heal':
                    applyHealing(data.content, result);
                    break;
                case 'temp':
                    data.content.tempHP = Math.max(0, result);
                    break;
            }

            scheduleSave();
            if (typeof window.logActivity === 'function') {
                switch (mode) {
                    case 'damage': {
                        const absorbed = oldTempHP - data.content.tempHP;
                        let msg = t('health.log.damage', {
                            amount: result,
                            oldHP: oldCurrentHP,
                            newHP: data.content.currentHP,
                        });
                        if (absorbed > 0) msg += ' ' + t('health.log.tempAbsorbed', { absorbed: absorbed });
                        window.logActivity({ type: 'health.event.damage', message: msg, sourceModuleId: data.id });
                        break;
                    }
                    case 'heal':
                        window.logActivity({
                            type: 'health.event.heal',
                            message: t('health.log.heal', {
                                amount: result,
                                oldHP: oldCurrentHP,
                                newHP: data.content.currentHP,
                            }),
                            sourceModuleId: data.id,
                        });
                        break;
                    case 'temp':
                        window.logActivity({
                            type: 'health.event.tempHP',
                            message: t('health.log.tempSet', { oldTemp: oldTempHP, newTemp: data.content.tempHP }),
                            sourceModuleId: data.id,
                        });
                        break;
                }
            }
            closeHealthActionOverlay(moduleEl);
            syncHealthLayersFromData(moduleEl, data);
            if (typeof window.snapModuleHeight === 'function') {
                window.snapModuleHeight(moduleEl, data);
            }
        }

        function cancel() {
            closeHealthActionOverlay(moduleEl);
        }

        closeBtn.addEventListener('click', cancel);
        cancelBtn.addEventListener('click', cancel);
        okBtn.addEventListener('click', confirm);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });

        // Close on overlay background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cancel();
        });

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        input.focus();
        input.select();
    }

    function closeHealthActionOverlay(moduleEl) {
        const existing = document.querySelector('.health-action-overlay');
        if (existing) existing.remove();
    }

    // ── Health Settings Modal ──

    function openHealthSettingsModal(moduleEl, data) {
        const existing = document.querySelector('.health-settings-overlay');
        if (existing) {
            existing.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay health-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('health.settingsTitle');
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
        getFromBoardBtn.textContent = t('health.eyedropper');
        getFromBoardBtn.addEventListener('click', async function () {
            try {
                const selected = await TS.creatures.getSelectedCreatures();
                if (!selected || selected.length === 0) {
                    console.warn('[CV] Eyedropper: no creature selected on the board.');
                    return;
                }
                const moreInfo = await TS.creatures.getMoreInfo(selected);
                const creature = moreInfo[0];
                if (creature && creature.hp) {
                    data.content.currentHP = creature.hp.value;
                    data.content.maxHP = creature.hp.max;
                    syncHealthLayersFromData(moduleEl, data);
                    window.snapModuleHeight(moduleEl, data);
                    scheduleSave();
                    closeModal();
                    window.showToast(t('health.getFromBoardSuccess'));
                }
            } catch (e) {
                console.warn('[CV] Eyedropper failed — TS creature API may not be available:', e);
            }
        });
        body.appendChild(getFromBoardBtn);

        // ── Max HP Modifier ──
        const modLabel = document.createElement('div');
        modLabel.className = 'cv-modal-label';
        modLabel.textContent = t('health.maxHPMod');
        body.appendChild(modLabel);

        const modInput = document.createElement('input');
        modInput.type = 'text';
        modInput.className = 'health-action-input';
        modInput.placeholder = '0';
        modInput.spellcheck = false;
        modInput.autocomplete = 'off';
        modInput.value = data.content.maxHPModifier || '';

        function applyModifier() {
            const raw = modInput.value.trim();
            const result = raw === '' ? 0 : evaluateHealthExpression(raw);
            if (result !== null) {
                data.content.maxHPModifier = result;
                modInput.value = result || '';
                syncHealthLayersFromData(moduleEl, data);
                window.snapModuleHeight(moduleEl, data);
                scheduleSave();
            } else {
                modInput.value = data.content.maxHPModifier || '';
            }
        }

        modInput.addEventListener('blur', applyModifier);
        modInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') modInput.blur();
        });
        body.appendChild(modInput);

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
        modInput.focus();
        modInput.select();

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

    function buildPlayLayer(bodyEl, data) {
        const c = data.content;
        const layer = document.createElement('div');
        layer.className = 'health-layer health-layer-play';

        // Ctrl+Click quick edit on the HP numbers (relative math: "+2", "-5")
        function wireHPQuickEdit(span, key) {
            span.addEventListener('click', (e) => {
                if (!e.ctrlKey) return;
                e.stopPropagation();
                window.openEditPopover(span, {
                    label: t('health.' + key),
                    value: c[key],
                    type: 'number',
                    relative: true,
                    onSave(val) {
                        const oldVal = c[key];
                        c[key] = val;
                        scheduleSave();
                        if (oldVal !== val && typeof window.logActivity === 'function') {
                            window.logActivity({
                                type: 'health.event.adjust',
                                message: t('health.log.adjust', {
                                    field: t('health.' + key),
                                    oldVal: oldVal,
                                    newVal: val,
                                }),
                                sourceModuleId: data.id,
                            });
                        }
                        syncHealthLayersFromData(bodyEl.closest('.module'), data);
                    },
                });
            });
        }

        const mainRow = document.createElement('div');
        mainRow.className = 'health-main-row';

        const hpCol = document.createElement('div');
        hpCol.className = 'health-hp-col';

        const hpRow = document.createElement('div');
        hpRow.className = 'health-hp-row';

        const currentSpan = document.createElement('span');
        currentSpan.className = 'health-current';
        currentSpan.textContent = c.currentHP;
        wireHPQuickEdit(currentSpan, 'currentHP');

        const sepSpan = document.createElement('span');
        sepSpan.className = 'health-sep';
        sepSpan.textContent = '/';

        const maxSpan = document.createElement('span');
        maxSpan.className = 'health-max';
        maxSpan.textContent = getEffectiveMaxHP(c);
        wireHPQuickEdit(maxSpan, 'maxHP');

        hpRow.appendChild(currentSpan);
        hpRow.appendChild(sepSpan);
        hpRow.appendChild(maxSpan);
        hpCol.appendChild(hpRow);

        const modPlay = document.createElement('div');
        modPlay.className = 'health-maxmod-indicator';
        setMaxModIndicatorEl(modPlay, c);
        hpCol.appendChild(modPlay);

        mainRow.appendChild(hpCol);

        layer.appendChild(mainRow);

        const tempRow = document.createElement('div');
        tempRow.className = 'health-temp-row';

        const tempBadge = document.createElement('button');
        tempBadge.type = 'button';
        tempBadge.className = 'health-temp-badge' + (c.tempHP > 0 ? ' has-temp' : '');
        tempBadge.innerHTML =
            `<span class="health-temp-value">${c.tempHP > 0 ? '+' + c.tempHP : '0'}</span>` +
            `<span class="health-temp-label">${escapeHtml(t('health.tempHP'))}</span>`;
        tempBadge.addEventListener('click', () => {
            openHealthActionOverlay(bodyEl.closest('.module'), data, 'temp');
        });
        tempRow.appendChild(tempBadge);
        layer.appendChild(tempRow);

        const actionsRow = document.createElement('div');
        actionsRow.className = 'health-actions-row';

        const actions = document.createElement('div');
        actions.className = 'health-actions';

        const healBtn = document.createElement('button');
        healBtn.className = 'health-action-btn health-heal-btn';
        healBtn.title = t('health.heal');
        healBtn.textContent = t('health.healShort');
        healBtn.addEventListener('click', () => {
            openHealthActionOverlay(bodyEl.closest('.module'), data, 'heal');
        });

        const damageBtn = document.createElement('button');
        damageBtn.className = 'health-action-btn health-damage-btn';
        damageBtn.title = t('health.takeDamage');
        damageBtn.textContent = t('health.dmgShort');
        damageBtn.addEventListener('click', () => {
            openHealthActionOverlay(bodyEl.closest('.module'), data, 'damage');
        });

        actions.appendChild(healBtn);
        actions.appendChild(damageBtn);
        actionsRow.appendChild(actions);
        layer.appendChild(actionsRow);

        return layer;
    }

    // ── Health Module Type ──
    registerModuleType('health', {
        label: 'type.health',

        renderBody(bodyEl, data) {
            // Guard: ensure content shape
            if (!data.content || typeof data.content === 'string') {
                data.content = { currentHP: 0, maxHP: 0, tempHP: 0, maxHPModifier: 0 };
            }
            if (data.content.maxHPModifier === undefined) data.content.maxHPModifier = 0;
            if (data.content.tempHP === undefined) data.content.tempHP = 0;

            const container = document.createElement('div');
            container.className = 'health-container';

            const playLayer = buildPlayLayer(bodyEl, data);
            playLayer.classList.add('is-active');
            container.appendChild(playLayer);

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openHealthSettingsModal(moduleEl, data),
                    label: t('health.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    // ── Cross-Module API (used by Recovery module) ──

    window.healToFull = function (moduleId) {
        const data = window.modules.find((m) => m.id === moduleId);
        if (!data || data.type !== 'health') return;
        const c = data.content;
        c.currentHP = (c.maxHP || 0) + (c.maxHPModifier || 0);
        const el = document.querySelector(`.module[data-id="${moduleId}"]`);
        if (el) syncHealthLayersFromData(el, data);
    };

    window.resetTempHP = function (moduleId) {
        const data = window.modules.find((m) => m.id === moduleId);
        if (!data || data.type !== 'health') return;
        data.content.tempHP = 0;
        const el = document.querySelector(`.module[data-id="${moduleId}"]`);
        if (el) syncHealthLayersFromData(el, data);
    };

    window.applyHealingAmount = function (moduleId, amount) {
        const data = window.modules.find((m) => m.id === moduleId);
        if (!data || data.type !== 'health') return;
        applyHealing(data.content, amount);
        const el = document.querySelector(`.module[data-id="${moduleId}"]`);
        if (el) syncHealthLayersFromData(el, data);
    };

    // Expose for cross-file access (module-core.js)
    window.openHealthActionOverlay = openHealthActionOverlay;
    window.openHealthSettingsModal = openHealthSettingsModal;
})();
