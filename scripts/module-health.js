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

// ── Health Action Overlay ──

function openHealthActionOverlay(moduleEl, data, mode) {
    closeHealthActionOverlay(moduleEl);

    const overlay = document.createElement('div');
    overlay.className = 'health-action-overlay';

    let titleKey;
    switch (mode) {
        case 'damage': titleKey = 'health.takeDamage'; break;
        case 'heal':   titleKey = 'health.heal'; break;
        case 'temp':   titleKey = 'health.setTempHP'; break;
        case 'maxmod': titleKey = 'health.moduleSettings'; break;
    }

    const subHeading = mode === 'maxmod' ? `<div class="health-action-overlay-subheading">${escapeHtml(t('health.maxHPMod'))}</div>` : '';

    overlay.innerHTML =
        `<div class="health-action-overlay-header">` +
            `<span class="health-action-overlay-title">${escapeHtml(t(titleKey))}</span>` +
            `<button class="health-action-overlay-close" title="${escapeHtml(t('health.cancel'))}">` +
                `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
            `</button>` +
        `</div>` +
        subHeading +
        `<input type="text" class="health-action-overlay-input" placeholder="0" spellcheck="false" autocomplete="off">` +
        `<div class="health-action-overlay-actions">` +
            `<button class="health-action-overlay-cancel">${escapeHtml(t('health.cancel'))}</button>` +
            `<button class="health-action-overlay-ok">${escapeHtml(t('health.ok'))}</button>` +
        `</div>`;

    const input = overlay.querySelector('.health-action-overlay-input');
    const closeBtn = overlay.querySelector('.health-action-overlay-close');
    const cancelBtn = overlay.querySelector('.health-action-overlay-cancel');
    const okBtn = overlay.querySelector('.health-action-overlay-ok');

    // Pre-fill for setters
    if (mode === 'maxmod') input.value = data.content.maxHPModifier || '';
    else if (mode === 'temp') input.value = data.content.tempHP || '';

    function confirm() {
        const result = evaluateHealthExpression(input.value);
        if (result === null) { cancel(); return; }

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
        // Re-render play mode
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['health'].renderBody(bodyEl, data, true);
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

    const body = moduleEl.querySelector('.module-body');
    body.appendChild(overlay);
    input.focus();
    input.select();
}

function closeHealthActionOverlay(moduleEl) {
    const existing = moduleEl.querySelector('.health-action-overlay');
    if (existing) existing.remove();
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

        const c = data.content;
        const effectiveMax = getEffectiveMaxHP(c);

        const container = document.createElement('div');
        container.className = 'health-container';

        // ── Main row: HP values + action buttons side by side ──
        const mainRow = document.createElement('div');
        mainRow.className = 'health-main-row';

        // ── HP values column ──
        const hpCol = document.createElement('div');
        hpCol.className = 'health-hp-col';

        const hpRow = document.createElement('div');
        hpRow.className = 'health-hp-row';

        if (isPlayMode) {
            const currentSpan = document.createElement('span');
            currentSpan.className = 'health-current';
            currentSpan.textContent = c.currentHP;

            const sepSpan = document.createElement('span');
            sepSpan.className = 'health-sep';
            sepSpan.textContent = '/';

            const maxSpan = document.createElement('span');
            maxSpan.className = 'health-max';
            maxSpan.textContent = effectiveMax;

            hpRow.appendChild(currentSpan);
            hpRow.appendChild(sepSpan);
            hpRow.appendChild(maxSpan);
        } else {
            // Edit mode: inline inputs matching play mode layout
            function makeHPInput(key, className, value) {
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

                return input;
            }

            const currentInput = makeHPInput('currentHP', 'health-current', c.currentHP);
            const sepSpan = document.createElement('span');
            sepSpan.className = 'health-sep';
            sepSpan.textContent = '/';
            const maxInput = makeHPInput('maxHP', 'health-max', c.maxHP);

            hpRow.appendChild(currentInput);
            hpRow.appendChild(sepSpan);
            hpRow.appendChild(maxInput);
        }

        hpCol.appendChild(hpRow);

        // Max HP modifier indicator
        if (c.maxHPModifier !== 0) {
            const modIndicator = document.createElement('div');
            modIndicator.className = 'health-maxmod-indicator';
            modIndicator.textContent = `(${c.maxHPModifier >= 0 ? '+' : ''}${c.maxHPModifier} MAX)`;
            hpCol.appendChild(modIndicator);
        }

        mainRow.appendChild(hpCol);

        if (isPlayMode) {
            // ── Action buttons (stacked vertically to the right) ──
            const actions = document.createElement('div');
            actions.className = 'health-actions';

            const healBtn = document.createElement('button');
            healBtn.className = 'health-action-btn health-heal-btn';
            healBtn.title = t('health.heal');
            healBtn.innerHTML =
                `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
            healBtn.addEventListener('click', () => {
                openHealthActionOverlay(bodyEl.closest('.module'), data, 'heal');
            });

            const damageBtn = document.createElement('button');
            damageBtn.className = 'health-action-btn health-damage-btn';
            damageBtn.title = t('health.takeDamage');
            damageBtn.innerHTML =
                `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
            damageBtn.addEventListener('click', () => {
                openHealthActionOverlay(bodyEl.closest('.module'), data, 'damage');
            });

            actions.appendChild(healBtn);
            actions.appendChild(damageBtn);
            mainRow.appendChild(actions);
        }

        container.appendChild(mainRow);

        // ── Temp HP row ──
        const tempRow = document.createElement('div');
        tempRow.className = 'health-temp-row';

        if (isPlayMode) {
            const tempBadge = document.createElement('button');
            tempBadge.className = 'health-temp-badge' + (c.tempHP > 0 ? ' has-temp' : '');
            tempBadge.innerHTML =
                `<span class="health-temp-value">${c.tempHP > 0 ? '+' + c.tempHP : '0'}</span>` +
                `<span class="health-temp-label">${escapeHtml(t('health.tempHP'))}</span>`;
            tempBadge.addEventListener('click', () => {
                openHealthActionOverlay(bodyEl.closest('.module'), data, 'temp');
            });
            tempRow.appendChild(tempBadge);
        } else {
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
                    // Update badge styling
                    tempBadge.classList.toggle('has-temp', c.tempHP > 0);
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

            const tempLabel = document.createElement('span');
            tempLabel.className = 'health-temp-label';
            tempLabel.textContent = t('health.tempHP');

            tempBadge.appendChild(tempInput);
            tempBadge.appendChild(tempLabel);
            tempRow.appendChild(tempBadge);
        }

        container.appendChild(tempRow);

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
        const currentInput = moduleEl.querySelector('.health-inline-input.health-current');
        const maxInput = moduleEl.querySelector('.health-inline-input.health-max');
        const tempInput = moduleEl.querySelector('.health-temp-input');

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
    }
});
