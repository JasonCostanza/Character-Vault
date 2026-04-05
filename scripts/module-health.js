// ── Health Module Type ──
(function () {
    // ── Health Module Helpers ──

    function evaluateHealthExpression(str) {
        str = String(str).trim();
        if (!str) return null;
        // Allow digits, operators, decimal points, spaces, parentheses
        if (!/^[\d+\-*/.()\s]+$/.test(str)) return null;
        try {
            const result = Function('"use strict"; return (' + str + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return null;
            return Math.floor(result);
        } catch {
            return null;
        }
    }

    function autoSizeInput(input, buffer) {
        const len = input.value.length || 1;
        input.style.width = len + buffer + 'ch';
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

    /** Keep play + edit layers in sync with `data.content` without rebuilding DOM. */
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
        const edit = container.querySelector('.health-layer-edit');
        if (edit) {
            const curIn = edit.querySelector('.health-inline-input.health-current');
            const maxIn = edit.querySelector('.health-inline-input.health-max');
            const tempIn = edit.querySelector('.health-temp-input');
            const tempBadge = edit.querySelector('.health-temp-badge-edit');
            if (curIn) {
                curIn.value = c.currentHP;
                autoSizeInput(curIn, 0.5);
            }
            if (maxIn) {
                maxIn.value = c.maxHP;
                autoSizeInput(maxIn, 0.5);
            }
            if (tempIn) {
                tempIn.value = c.tempHP || 0;
                autoSizeInput(tempIn, 1.5);
            }
            if (tempBadge) tempBadge.classList.toggle('has-temp', c.tempHP > 0);
            setMaxModIndicatorEl(edit.querySelector('.health-maxmod-indicator'), c);
        }
    }

    // ── Health Action Overlay ──

    function openHealthActionOverlay(moduleEl, data, mode) {
        closeHealthActionOverlay(moduleEl);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay health-action-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel health-action-modal';

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
            case 'maxmod':
                titleKey = 'health.moduleSettings';
                break;
        }

        const subHeading =
            mode === 'maxmod' ? `<div class="health-action-subheading">${escapeHtml(t('health.maxHPMod'))}</div>` : '';

        panel.innerHTML =
            `<div class="cv-modal-header">` +
            `<span class="cv-modal-title">${escapeHtml(t(titleKey))}</span>` +
            `<button class="cv-modal-close" title="${escapeHtml(t('health.cancel'))}">` +
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
            `</button>` +
            `</div>` +
            `<div class="cv-modal-body health-action-body">` +
            subHeading +
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
        if (mode === 'maxmod') input.value = data.content.maxHPModifier || '';
        else if (mode === 'temp') input.value = data.content.tempHP || '';

        function confirm() {
            const result = evaluateHealthExpression(input.value);
            if (result === null) {
                cancel();
                return;
            }

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
                case 'maxmod':
                    data.content.maxHPModifier = result;
                    break;
            }

            scheduleSave();
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

    function buildPlayLayer(bodyEl, data) {
        const c = data.content;
        const layer = document.createElement('div');
        layer.className = 'health-layer health-layer-play';

        const mainRow = document.createElement('div');
        mainRow.className = 'health-main-row';

        const hpCol = document.createElement('div');
        hpCol.className = 'health-hp-col';

        const hpRow = document.createElement('div');
        hpRow.className = 'health-hp-row';

        const currentSpan = document.createElement('span');
        currentSpan.className = 'health-current';
        currentSpan.textContent = c.currentHP;

        const sepSpan = document.createElement('span');
        sepSpan.className = 'health-sep';
        sepSpan.textContent = '/';

        const maxSpan = document.createElement('span');
        maxSpan.className = 'health-max';
        maxSpan.textContent = getEffectiveMaxHP(c);

        hpRow.appendChild(currentSpan);
        hpRow.appendChild(sepSpan);
        hpRow.appendChild(maxSpan);
        hpCol.appendChild(hpRow);

        const modPlay = document.createElement('div');
        modPlay.className = 'health-maxmod-indicator';
        setMaxModIndicatorEl(modPlay, c);
        hpCol.appendChild(modPlay);

        mainRow.appendChild(hpCol);

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
        mainRow.appendChild(actions);

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

        return layer;
    }

    function buildEditLayer(bodyEl, data) {
        const c = data.content;
        const layer = document.createElement('div');
        layer.className = 'health-layer health-layer-edit';

        function makeHPInput(key, className, value, sizeBuffer) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'health-inline-input ' + className;
            input.value = value;
            input.spellcheck = false;
            input.autocomplete = 'off';

            function commitValue() {
                const result = evaluateHealthExpression(input.value);
                if (result !== null) {
                    c[key] = key === 'tempHP' ? Math.max(0, result) : result;
                    input.value = c[key];
                    scheduleSave();
                    syncHealthLayersFromData(bodyEl.closest('.module'), data);
                } else {
                    input.value = c[key];
                }
            }

            input.addEventListener('blur', commitValue);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    commitValue();
                    input.blur();
                }
            });
            input.addEventListener('input', () => autoSizeInput(input, sizeBuffer));
            autoSizeInput(input, sizeBuffer);

            return input;
        }

        const mainRow = document.createElement('div');
        mainRow.className = 'health-main-row';

        const hpCol = document.createElement('div');
        hpCol.className = 'health-hp-col';

        const hpRow = document.createElement('div');
        hpRow.className = 'health-hp-row';

        const currentInput = makeHPInput('currentHP', 'health-current', c.currentHP, 0.5);
        const sepSpan = document.createElement('span');
        sepSpan.className = 'health-sep';
        sepSpan.textContent = '/';
        const maxInput = makeHPInput('maxHP', 'health-max', c.maxHP, 0.5);

        hpRow.appendChild(currentInput);
        hpRow.appendChild(sepSpan);
        hpRow.appendChild(maxInput);
        hpCol.appendChild(hpRow);

        const modEdit = document.createElement('div');
        modEdit.className = 'health-maxmod-indicator';
        setMaxModIndicatorEl(modEdit, c);
        hpCol.appendChild(modEdit);

        mainRow.appendChild(hpCol);

        const actions = document.createElement('div');
        actions.className = 'health-actions';

        const healBtn = document.createElement('button');
        healBtn.className = 'health-action-btn health-heal-btn';
        healBtn.title = t('health.heal');
        healBtn.textContent = t('health.healShort');
        healBtn.disabled = true;

        const damageBtn = document.createElement('button');
        damageBtn.className = 'health-action-btn health-damage-btn';
        damageBtn.title = t('health.takeDamage');
        damageBtn.textContent = t('health.dmgShort');
        damageBtn.disabled = true;

        actions.appendChild(healBtn);
        actions.appendChild(damageBtn);
        mainRow.appendChild(actions);

        layer.appendChild(mainRow);

        const tempRow = document.createElement('div');
        tempRow.className = 'health-temp-row';

        const tempBadge = document.createElement('div');
        tempBadge.className = 'health-temp-badge health-temp-badge-edit' + (c.tempHP > 0 ? ' has-temp' : '');

        const tempInput = document.createElement('input');
        tempInput.type = 'text';
        tempInput.className = 'health-temp-input';
        tempInput.value = c.tempHP || 0;
        tempInput.spellcheck = false;
        tempInput.autocomplete = 'off';

        function commitTemp() {
            const result = evaluateHealthExpression(tempInput.value);
            if (result !== null) {
                c.tempHP = Math.max(0, result);
                tempInput.value = c.tempHP;
                scheduleSave();
                tempBadge.classList.toggle('has-temp', c.tempHP > 0);
                syncHealthLayersFromData(bodyEl.closest('.module'), data);
            } else {
                tempInput.value = c.tempHP;
            }
        }

        tempInput.addEventListener('blur', commitTemp);
        tempInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                commitTemp();
                tempInput.blur();
            }
        });
        tempInput.addEventListener('input', () => autoSizeInput(tempInput, 1.5));
        autoSizeInput(tempInput, 1.5);

        const tempLabel = document.createElement('span');
        tempLabel.className = 'health-temp-label';
        tempLabel.textContent = t('health.tempHP');

        tempBadge.appendChild(tempInput);
        tempBadge.appendChild(tempLabel);
        tempRow.appendChild(tempBadge);
        layer.appendChild(tempRow);

        return layer;
    }

    // ── Health Module Type ──
    registerModuleType('health', {
        label: 'type.health',

        renderBody(bodyEl, data, isPlayMode) {
            // Guard: ensure content shape
            if (!data.content || typeof data.content === 'string') {
                data.content = { currentHP: 0, maxHP: 0, tempHP: 0, maxHPModifier: 0 };
            }
            if (data.content.maxHPModifier === undefined) data.content.maxHPModifier = 0;
            if (data.content.tempHP === undefined) data.content.tempHP = 0;

            const container = document.createElement('div');
            container.className = 'health-container';

            const playLayer = buildPlayLayer(bodyEl, data);
            const editLayer = buildEditLayer(bodyEl, data);

            if (isPlayMode) {
                playLayer.classList.add('is-active');
                editLayer.classList.remove('is-active');
            } else {
                playLayer.classList.remove('is-active');
                editLayer.classList.add('is-active');
            }

            container.appendChild(playLayer);
            container.appendChild(editLayer);

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        onPlayMode(moduleEl, data) {
            const container = moduleEl.querySelector('.health-container');
            if (!container) {
                const bodyEl = moduleEl.querySelector('.module-body');
                this.renderBody(bodyEl, data, true);
                return;
            }
            const play = container.querySelector('.health-layer-play');
            const edit = container.querySelector('.health-layer-edit');
            if (!play || !edit) {
                const bodyEl = moduleEl.querySelector('.module-body');
                this.renderBody(bodyEl, data, true);
                return;
            }
            edit.classList.remove('is-active');
            play.classList.add('is-active');
            const actions = play.querySelectorAll('.health-action-btn');
            actions.forEach((btn) => {
                btn.disabled = false;
            });
            const editActions = edit.querySelectorAll('.health-action-btn');
            editActions.forEach((btn) => {
                btn.disabled = true;
            });
            syncHealthLayersFromData(moduleEl, data);
        },

        onEditMode(moduleEl, data) {
            const container = moduleEl.querySelector('.health-container');
            if (!container) {
                const bodyEl = moduleEl.querySelector('.module-body');
                this.renderBody(bodyEl, data, false);
                return;
            }
            const play = container.querySelector('.health-layer-play');
            const edit = container.querySelector('.health-layer-edit');
            if (!play || !edit) {
                const bodyEl = moduleEl.querySelector('.module-body');
                this.renderBody(bodyEl, data, false);
                return;
            }
            play.classList.remove('is-active');
            edit.classList.add('is-active');
            const actions = play.querySelectorAll('.health-action-btn');
            actions.forEach((btn) => {
                btn.disabled = true;
            });
            const editActions = edit.querySelectorAll('.health-action-btn');
            editActions.forEach((btn) => {
                btn.disabled = true;
            });
            syncHealthLayersFromData(moduleEl, data);
        },

        syncState(moduleEl, data) {
            const currentInput = moduleEl.querySelector('.health-layer-edit .health-inline-input.health-current');
            const maxInput = moduleEl.querySelector('.health-layer-edit .health-inline-input.health-max');
            const tempInput = moduleEl.querySelector('.health-layer-edit .health-temp-input');

            if (currentInput) {
                const result = evaluateHealthExpression(currentInput.value);
                if (result !== null) data.content.currentHP = result;
            }
            if (maxInput) {
                const result = evaluateHealthExpression(maxInput.value);
                if (result !== null) data.content.maxHP = result;
            }
            if (tempInput) {
                const result = evaluateHealthExpression(tempInput.value);
                if (result !== null) data.content.tempHP = Math.max(0, result);
            }
        },
    });

    // Expose for cross-file access (module-core.js)
    window.openHealthActionOverlay = openHealthActionOverlay;
})();
