// ── Level Module ──
(function () {
    'use strict';

    // ── XP Templates ──
    const LEVEL_XP_TEMPLATES = {
        dnd5e: {
            thresholds: [
                300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000,
                225000, 265000, 305000, 355000,
            ],
        },
        pf2e: {
            thresholds: [
                1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000,
                17000, 18000, 19000,
            ],
        },
    };

    // ── Bar Color Swatches ──
    const LEVEL_BAR_COLORS = [
        { color: null, label: 'Default' },
        { color: '#8B2020', label: 'Crimson' },
        { color: '#2D5A3D', label: 'Forest' },
        { color: '#1E3A5F', label: 'Navy' },
        { color: '#4A2D6B', label: 'Royal' },
        { color: '#5C3A1E', label: 'Leather' },
        { color: '#3A3A3A', label: 'Slate' },
    ];

    // ── Expression Evaluator ──
    function evaluateXPExpression(str) {
        str = String(str).trim();
        if (!str) return null;
        if (!/^[\d+\-*/.()\s]+$/.test(str)) return null;
        try {
            const result = Function('"use strict"; return (' + str + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return null;
            return Math.floor(result);
        } catch {
            return null;
        }
    }

    // ── Level from XP ──
    function getLevelFromXP(xp, thresholds) {
        let level = 1;
        for (let i = 0; i < thresholds.length; i++) {
            if (xp >= thresholds[i]) level = i + 2;
            else break;
        }
        return level;
    }

    // ── Content Shape Guard ──
    function ensureLevelContent(data) {
        if (!data.content || typeof data.content !== 'object') {
            data.content = {
                level: 1,
                currentXP: 0,
                levelingSystem: 'xp',
                xpThresholds: LEVEL_XP_TEMPLATES.dnd5e.thresholds.slice(),
                carryOverXP: true,
                barColor: null,
                barStyle: 'solid',
                className: null,
            };
        }
        if (data.content.level === undefined) data.content.level = 1;
        if (data.content.currentXP === undefined) data.content.currentXP = 0;
        if (!data.content.levelingSystem) data.content.levelingSystem = 'xp';
        if (!Array.isArray(data.content.xpThresholds))
            data.content.xpThresholds = LEVEL_XP_TEMPLATES.dnd5e.thresholds.slice();
        if (data.content.carryOverXP === undefined) data.content.carryOverXP = true;
        if (data.content.barColor === undefined) data.content.barColor = null;
        if (!data.content.barStyle) data.content.barStyle = 'solid';
        if (data.content.className === undefined) data.content.className = null;
    }

    // ── Progress Calculation ──
    function getLevelProgress(data) {
        const c = data.content;
        const level = c.level;
        const thresholds = c.xpThresholds;
        const nextThreshold = level - 1 < thresholds.length ? thresholds[level - 1] : null;
        const prevThreshold = level >= 2 ? thresholds[level - 2] || 0 : 0;
        const currentXP = c.currentXP;

        let percentage = 0;
        let canLevelUp = false;

        if (nextThreshold !== null) {
            const span = nextThreshold - prevThreshold;
            const progress = currentXP - prevThreshold;
            percentage = span > 0 ? Math.max(0, Math.min(1, progress / span)) : 0;
            canLevelUp = currentXP >= nextThreshold;
        } else {
            percentage = 1;
            canLevelUp = false;
        }

        return { level, currentXP, nextThreshold, prevThreshold, percentage, canLevelUp };
    }

    // ── Level Up ──
    function levelUp(data) {
        const c = data.content;
        const { canLevelUp, nextThreshold } = getLevelProgress(data);
        if (!canLevelUp) return;
        c.level += 1;
        if (!c.carryOverXP && nextThreshold !== null) {
            c.currentXP = nextThreshold;
        }
    }

    // ── Render Body ──
    function renderLevelBody(bodyEl, data) {
        ensureLevelContent(data);
        const c = data.content;
        const prog = getLevelProgress(data);
        const isMilestone = c.levelingSystem === 'milestone';

        bodyEl.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'level-body';

        // Level display
        const display = document.createElement('div');
        display.className = 'level-display';

        const levelLabel = document.createElement('div');
        levelLabel.className = 'level-label' + (c.className ? ' level-label-custom' : '');
        levelLabel.textContent = c.className || t('level.levelLabel');

        const numEl = document.createElement('div');
        numEl.className = 'level-number';
        numEl.textContent = c.level;
        numEl.addEventListener('click', (e) => {
            if (!modKeys.ctrl) return;
            e.stopPropagation();
            openSetLevelModal(bodyEl.closest('.module'), data);
        });

        display.appendChild(levelLabel);
        display.appendChild(numEl);
        wrap.appendChild(display);

        // Milestone stepper — shown instead of XP bar
        if (isMilestone) {
            const adjRow = document.createElement('div');
            adjRow.className = 'level-adjust-row';

            const decBtn = document.createElement('button');
            decBtn.className = 'level-adjust-btn';
            decBtn.textContent = '−';
            decBtn.title = t('level.decrementLevel');
            decBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (c.level <= 1) return;
                const oldLevel = c.level;
                c.level--;
                renderLevelBody(bodyEl, data);
                scheduleSave();
                document.dispatchEvent(new CustomEvent('cv:level-changed'));
                if (typeof window.logActivity === 'function') {
                    window.logActivity({
                        type: 'level.event.levelUp',
                        message: t('level.log.levelChange', { oldLevel: oldLevel, newLevel: c.level }),
                        sourceModuleId: data.id,
                    });
                }
            });

            const incBtn = document.createElement('button');
            incBtn.className = 'level-adjust-btn';
            incBtn.textContent = '+';
            incBtn.title = t('level.incrementLevel');
            incBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const oldLevel = c.level;
                c.level++;
                renderLevelBody(bodyEl, data);
                scheduleSave();
                document.dispatchEvent(new CustomEvent('cv:level-changed'));
                if (typeof window.logActivity === 'function') {
                    window.logActivity({
                        type: 'level.event.levelUp',
                        message: t('level.log.levelChange', { oldLevel: oldLevel, newLevel: c.level }),
                        sourceModuleId: data.id,
                    });
                }
            });

            adjRow.appendChild(decBtn);
            adjRow.appendChild(incBtn);
            wrap.appendChild(adjRow);
        }

        // XP bar — hidden in milestone mode
        if (!isMilestone) {
            const barContainer = document.createElement('div');
            barContainer.className = 'level-bar-container';

            const track = document.createElement('div');
            track.className = 'level-bar-track';

            const fill = document.createElement('div');
            fill.className = 'level-bar-fill';
            fill.style.width = (prog.percentage * 100).toFixed(1) + '%';
            if (c.barColor) fill.style.background = c.barColor;

            track.appendChild(fill);

            // Add dividers for segmented styles
            if (c.barStyle === 'segmented-10') {
                for (let i = 1; i < 10; i++) {
                    const divider = document.createElement('div');
                    divider.className = 'level-bar-divider';
                    divider.style.left = i * 10 + '%';
                    track.appendChild(divider);
                }
            } else if (c.barStyle === 'segmented-25') {
                for (let i = 1; i < 4; i++) {
                    const divider = document.createElement('div');
                    divider.className = 'level-bar-divider';
                    divider.style.left = i * 25 + '%';
                    track.appendChild(divider);
                }
            }
            barContainer.appendChild(track);

            // Hover tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'level-bar-tooltip';
            if (prog.nextThreshold !== null) {
                tooltip.textContent = t('level.xpTooltip', {
                    current: c.currentXP.toLocaleString(),
                    target: prog.nextThreshold.toLocaleString(),
                });
            } else {
                tooltip.textContent = t('level.maxLevelReached');
            }
            barContainer.appendChild(tooltip);

            barContainer.addEventListener('click', () => {
                openXPModal(bodyEl.closest('.module'), data);
            });

            wrap.appendChild(barContainer);

            // Level Up button
            if (prog.canLevelUp) {
                const lvlUpBtn = document.createElement('button');
                lvlUpBtn.className = 'level-up-btn';
                lvlUpBtn.textContent = t('level.levelUp');
                lvlUpBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    levelUp(data);
                    const moduleEl = bodyEl.closest('.module');
                    renderLevelBody(bodyEl, data);
                    if (typeof window.snapModuleHeight === 'function') {
                        window.snapModuleHeight(moduleEl, data);
                    }
                    scheduleSave();
                    document.dispatchEvent(new CustomEvent('cv:level-changed'));
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'level.event.levelUp',
                            message: t('level.log.levelUp', { level: c.level }),
                            sourceModuleId: data.id,
                        });
                    }
                });
                wrap.appendChild(lvlUpBtn);
            }
        }

        bodyEl.appendChild(wrap);
    }

    // ── Set Level Modal ──
    function openSetLevelModal(moduleEl, data) {
        const existing = document.querySelector('.level-set-overlay');
        if (existing) existing.remove();

        const c = data.content;
        const isMilestone = c.levelingSystem === 'milestone';

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay level-set-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.width = '280px';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('level.setLevelTitle');
        titleEl.style.userSelect = 'none';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('level.cancel');
        closeBtn.innerHTML = cvIcon('x', 12);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'cv-modal-input cv-modal-num';
        input.min = '1';
        input.placeholder = t('level.setLevelPlaceholder');
        input.value = c.level;
        input.spellcheck = false;
        input.autocomplete = 'off';
        body.appendChild(input);

        const warning = document.createElement('div');
        warning.className = 'level-set-warning';
        warning.textContent = t('level.setLevelWarning');
        if (isMilestone) warning.style.display = 'none';
        body.appendChild(warning);

        const errorEl = document.createElement('div');
        errorEl.className = 'level-set-error';
        errorEl.textContent = t('level.setLevelError');
        errorEl.style.display = 'none';
        body.appendChild(errorEl);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('level.cancel');
        cancelBtn.style.userSelect = 'none';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary sm';
        confirmBtn.textContent = t('level.confirm');
        confirmBtn.style.userSelect = 'none';

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        input.focus();
        input.select();

        function closeModal() {
            overlay.remove();
        }

        function confirm() {
            const newLevel = parseInt(input.value, 10);
            if (isNaN(newLevel) || newLevel < 1 || newLevel === c.level) {
                closeModal();
                return;
            }

            if (!isMilestone) {
                const xpForLevel = newLevel === 1 ? 0 : c.xpThresholds[newLevel - 2];
                if (xpForLevel === undefined) {
                    errorEl.style.display = '';
                    return;
                }
                c.currentXP = xpForLevel;
            }

            const oldLevel = c.level;
            c.level = newLevel;
            closeModal();
            const bodyEl = moduleEl.querySelector('.module-body');
            renderLevelBody(bodyEl, data);
            if (typeof window.snapModuleHeight === 'function') {
                window.snapModuleHeight(moduleEl, data);
            }
            scheduleSave();
            document.dispatchEvent(new CustomEvent('cv:level-changed'));
            if (typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'level.event.levelUp',
                    message: t('level.log.levelChange', { oldLevel: oldLevel, newLevel: newLevel }),
                    sourceModuleId: data.id,
                });
            }
        }

        input.addEventListener('input', () => {
            errorEl.style.display = 'none';
        });
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', confirm);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') closeModal();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // ── XP Modal ──
    function openXPModal(moduleEl, data) {
        const existing = document.querySelector('.level-xp-overlay');
        if (existing) existing.remove();

        const c = data.content;
        let mode = 'add';

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay level-xp-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('level.xpModalTitle');
        titleEl.style.userSelect = 'none';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('level.cancel');
        closeBtn.innerHTML = cvIcon('x', 12);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body health-action-body';

        // Add / Subtract toggle
        const modeRow = document.createElement('div');
        modeRow.className = 'level-system-toggle';
        modeRow.style.marginBottom = '10px';

        const addBtn = document.createElement('button');
        addBtn.className = 'level-system-btn active';
        addBtn.textContent = t('level.addXp');
        addBtn.style.userSelect = 'none';

        const subBtn = document.createElement('button');
        subBtn.className = 'level-system-btn';
        subBtn.textContent = t('level.subtractXp');
        subBtn.style.userSelect = 'none';

        const setBtn = document.createElement('button');
        setBtn.className = 'level-system-btn';
        setBtn.textContent = t('level.setToXp');
        setBtn.style.userSelect = 'none';

        addBtn.addEventListener('click', () => {
            mode = 'add';
            addBtn.classList.add('active');
            subBtn.classList.remove('active');
            setBtn.classList.remove('active');
            input.placeholder = t('level.xpModalPlaceholder');
        });
        subBtn.addEventListener('click', () => {
            mode = 'subtract';
            subBtn.classList.add('active');
            addBtn.classList.remove('active');
            setBtn.classList.remove('active');
            input.placeholder = t('level.xpModalPlaceholder');
        });
        setBtn.addEventListener('click', () => {
            mode = 'set';
            setBtn.classList.add('active');
            addBtn.classList.remove('active');
            subBtn.classList.remove('active');
            input.placeholder = t('level.xpModalPlaceholderSetTo');
        });

        modeRow.appendChild(addBtn);
        modeRow.appendChild(subBtn);
        modeRow.appendChild(setBtn);
        body.appendChild(modeRow);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'health-action-input';
        input.placeholder = t('level.xpModalPlaceholder');
        input.spellcheck = false;
        input.autocomplete = 'off';
        body.appendChild(input);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('level.cancel');
        cancelBtn.style.userSelect = 'none';

        const okBtn = document.createElement('button');
        okBtn.className = 'btn-primary';
        okBtn.textContent = t('level.ok');
        okBtn.style.userSelect = 'none';

        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        input.focus();

        function closeModal() {
            overlay.remove();
        }

        function confirm() {
            if (mode === 'set') {
                const targetXP = evaluateXPExpression(input.value);
                if (targetXP === null || targetXP < 0) {
                    closeModal();
                    return;
                }
                c.currentXP = targetXP;
                c.level = getLevelFromXP(targetXP, c.xpThresholds);
                const newLevel = c.level;
                closeModal();
                const bodyElSet = moduleEl.querySelector('.module-body');
                renderLevelBody(bodyElSet, data);
                if (typeof window.snapModuleHeight === 'function') {
                    window.snapModuleHeight(moduleEl, data);
                }
                scheduleSave();
                document.dispatchEvent(new CustomEvent('cv:level-changed'));
                if (typeof window.logActivity === 'function') {
                    window.logActivity({
                        type: 'level.event.xp',
                        message: t('level.log.xpSet', { newXP: targetXP, level: newLevel }),
                        sourceModuleId: data.id,
                    });
                }
                return;
            }

            const amount = evaluateXPExpression(input.value);
            if (amount === null || amount <= 0) {
                closeModal();
                return;
            }
            const oldXP = c.currentXP;
            if (mode === 'add') {
                c.currentXP += amount;
            } else {
                c.currentXP = Math.max(0, c.currentXP - amount);
            }
            const newXP = c.currentXP;
            closeModal();
            const bodyEl = moduleEl.querySelector('.module-body');
            renderLevelBody(bodyEl, data);
            if (typeof window.snapModuleHeight === 'function') {
                window.snapModuleHeight(moduleEl, data);
            }
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'level.event.xp',
                    message:
                        mode === 'add'
                            ? t('level.log.xpGain', { amount: amount, oldXP: oldXP, newXP: newXP })
                            : t('level.log.xpLoss', { amount: amount, oldXP: oldXP, newXP: newXP }),
                    sourceModuleId: data.id,
                });
            }
        }

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', confirm);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') closeModal();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // ── Settings Modal ──
    function openLevelSettings(moduleEl, data) {
        ensureLevelContent(data);
        const content = data.content;

        // Working copies
        let wSystem = content.levelingSystem;
        let wThresholds = content.xpThresholds.slice();
        let wCarryOver = content.carryOverXP;
        let wBarColor = content.barColor;
        let wBarStyle = content.barStyle;
        let wClassName = content.className;
        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay level-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('level.settingsTitle');

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('level.close');
        closeBtn.innerHTML = cvIcon('x', 12);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // ── Class Name ──
        const classSection = document.createElement('div');
        classSection.className = 'level-settings-section';

        const classLabel = document.createElement('div');
        classLabel.className = 'cv-modal-label';
        classLabel.textContent = t('level.classNameLabel');

        const classInput = document.createElement('input');
        classInput.type = 'text';
        classInput.className = 'cv-modal-input';
        classInput.value = wClassName || '';
        classInput.placeholder = t('level.classNamePlaceholder');
        classInput.maxLength = 40;
        classInput.spellcheck = false;
        classInput.autocomplete = 'off';
        classInput.addEventListener('input', () => {
            wClassName = classInput.value.trim() || null;
            dirty = true;
        });

        classSection.appendChild(classLabel);
        classSection.appendChild(classInput);
        body.appendChild(classSection);

        // ── Leveling System ──
        const systemSection = document.createElement('div');
        systemSection.className = 'level-settings-section';

        const systemLabel = document.createElement('div');
        systemLabel.className = 'cv-modal-label';
        systemLabel.textContent = t('level.systemLabel');

        const systemToggle = document.createElement('div');
        systemToggle.className = 'level-system-toggle';

        const xpBtn = document.createElement('button');
        xpBtn.className = 'level-system-btn' + (wSystem === 'xp' ? ' active' : '');
        xpBtn.textContent = t('level.systemXp');
        xpBtn.style.userSelect = 'none';

        const msBtn = document.createElement('button');
        msBtn.className = 'level-system-btn' + (wSystem === 'milestone' ? ' active' : '');
        msBtn.textContent = t('level.systemMilestone');
        msBtn.style.userSelect = 'none';

        systemToggle.appendChild(xpBtn);
        systemToggle.appendChild(msBtn);
        systemSection.appendChild(systemLabel);
        systemSection.appendChild(systemToggle);
        body.appendChild(systemSection);

        // ── XP-only sections (hidden in milestone mode) ──
        const xpOnlyWrap = document.createElement('div');
        xpOnlyWrap.style.display = wSystem === 'xp' ? '' : 'none';

        // ── XP Threshold List ──
        const threshSection = document.createElement('div');
        threshSection.className = 'level-settings-section';

        const threshLabel = document.createElement('div');
        threshLabel.className = 'cv-modal-label';
        threshLabel.textContent = t('level.thresholdsLabel');

        const threshList = document.createElement('div');
        threshList.className = 'level-threshold-list';

        function rebuildThresholdList() {
            threshList.innerHTML = '';
            wThresholds.forEach((val, idx) => {
                const row = document.createElement('div');
                row.className = 'level-threshold-row';

                const rowLabel = document.createElement('div');
                rowLabel.className = 'level-threshold-label';
                rowLabel.textContent = t('level.thresholdLevelN', { n: idx + 2 });

                const rowInput = document.createElement('input');
                rowInput.type = 'number';
                rowInput.className = 'level-threshold-input';
                rowInput.value = val;
                rowInput.min = '0';
                rowInput.addEventListener('input', () => {
                    const parsed = parseInt(rowInput.value, 10);
                    if (!isNaN(parsed) && parsed >= 0) {
                        wThresholds[idx] = parsed;
                        dirty = true;
                    }
                });

                const delBtn = document.createElement('button');
                delBtn.className = 'level-threshold-delete';
                delBtn.title = t('level.deleteThreshold');
                delBtn.innerHTML = cvIcon('x', 12);
                delBtn.addEventListener('click', () => {
                    wThresholds.splice(idx, 1);
                    dirty = true;
                    rebuildThresholdList();
                });

                row.appendChild(rowLabel);
                row.appendChild(rowInput);
                row.appendChild(delBtn);
                threshList.appendChild(row);
            });
        }
        rebuildThresholdList();

        const addThreshBtn = document.createElement('button');
        addThreshBtn.className = 'btn-secondary sm';
        addThreshBtn.textContent = t('level.addLevel');
        addThreshBtn.style.userSelect = 'none';
        addThreshBtn.style.marginTop = '4px';
        addThreshBtn.addEventListener('click', () => {
            const last = wThresholds.length > 0 ? wThresholds[wThresholds.length - 1] : 0;
            wThresholds.push(last + 1000);
            dirty = true;
            rebuildThresholdList();
        });

        threshSection.appendChild(threshLabel);
        threshSection.appendChild(threshList);
        threshSection.appendChild(addThreshBtn);
        xpOnlyWrap.appendChild(threshSection);

        // ── Carry Over XP ──
        const carrySection = document.createElement('div');
        carrySection.className = 'level-settings-section';

        const carryToggle = makeCvToggle(wCarryOver, (checked) => {
            wCarryOver = checked;
            dirty = true;
        });
        carryToggle.classList.add('level-toggle-row');

        const carryLabel = document.createElement('span');
        carryLabel.className = 'cv-toggle-label';
        carryLabel.textContent = t('level.carryOverLabel');
        carryToggle.appendChild(carryLabel);
        carrySection.appendChild(carryToggle);
        xpOnlyWrap.appendChild(carrySection);

        // ── Bar Color ──
        const colorSection = document.createElement('div');
        colorSection.className = 'level-settings-section';

        const colorLabel = document.createElement('div');
        colorLabel.className = 'cv-modal-label';
        colorLabel.textContent = t('level.barColorLabel');

        const colorSwatches = document.createElement('div');
        colorSwatches.className = 'level-color-swatches';

        LEVEL_BAR_COLORS.forEach(({ color, label }) => {
            const swatch = document.createElement('button');
            swatch.className = 'level-color-swatch';
            swatch.dataset.color = color === null ? 'default' : color;
            swatch.title = label;
            if (color !== null) swatch.style.backgroundColor = color;
            if (color === wBarColor || (color === null && wBarColor === null)) {
                swatch.classList.add('selected');
            }
            swatch.addEventListener('click', () => {
                colorSwatches.querySelectorAll('.level-color-swatch').forEach((s) => s.classList.remove('selected'));
                swatch.classList.add('selected');
                wBarColor = color;
                dirty = true;
            });
            colorSwatches.appendChild(swatch);
        });

        colorSection.appendChild(colorLabel);
        colorSection.appendChild(colorSwatches);
        xpOnlyWrap.appendChild(colorSection);

        // ── Bar Style ──
        const styleSection = document.createElement('div');
        styleSection.className = 'level-settings-section';

        const styleLabel = document.createElement('div');
        styleLabel.className = 'cv-modal-label';
        styleLabel.textContent = t('level.barStyleLabel');

        const stylePicker = document.createElement('div');
        stylePicker.className = 'level-bar-style-picker';

        [
            { value: 'solid', labelKey: 'level.barStyleSolid' },
            { value: 'segmented-10', labelKey: 'level.barStyleSeg10' },
            { value: 'segmented-25', labelKey: 'level.barStyleSeg25' },
        ].forEach(({ value, labelKey }) => {
            const btn = document.createElement('button');
            btn.className = 'level-style-btn' + (wBarStyle === value ? ' active' : '');
            btn.textContent = t(labelKey);
            btn.style.userSelect = 'none';
            btn.addEventListener('click', () => {
                stylePicker.querySelectorAll('.level-style-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                wBarStyle = value;
                dirty = true;
            });
            stylePicker.appendChild(btn);
        });

        styleSection.appendChild(styleLabel);
        styleSection.appendChild(stylePicker);
        xpOnlyWrap.appendChild(styleSection);

        body.appendChild(xpOnlyWrap);

        // System toggle logic (after xpOnlyWrap exists)
        xpBtn.addEventListener('click', () => {
            wSystem = 'xp';
            xpBtn.classList.add('active');
            msBtn.classList.remove('active');
            xpOnlyWrap.style.display = '';
            dirty = true;
        });
        msBtn.addEventListener('click', () => {
            wSystem = 'milestone';
            msBtn.classList.add('active');
            xpBtn.classList.remove('active');
            xpOnlyWrap.style.display = 'none';
            dirty = true;
        });

        buildCommonSettingsSection(body, moduleEl, data);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('level.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('level.save');

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function commitAndClose() {
            content.className = wClassName;
            content.levelingSystem = wSystem;
            content.xpThresholds = wThresholds.slice();
            content.carryOverXP = wCarryOver;
            content.barColor = wBarColor;
            content.barStyle = wBarStyle;
            const bodyEl = moduleEl.querySelector('.module-body');
            renderLevelBody(bodyEl, data);
            if (typeof window.snapModuleHeight === 'function') {
                window.snapModuleHeight(moduleEl, data);
            }
            scheduleSave();
            closeModal();
        }

        function tryClose() {
            if (dirty) {
                showConfirm(t('common.discardChanges'), closeModal);
            } else {
                closeModal();
            }
        }

        saveBtn.addEventListener('click', commitAndClose);
        cancelBtn.addEventListener('click', tryClose);
        closeBtn.addEventListener('click', tryClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) tryClose();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                tryClose();
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // ── Register Module Type ──
    registerModuleType('level', {
        label: 'type.level',

        renderBody(bodyEl, data) {
            ensureLevelContent(data);
            renderLevelBody(bodyEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openLevelSettings(moduleEl, data),
                    label: t('level.settings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    // ── Cross-Module API ──
    window.getCharacterLevel = function (moduleId) {
        const mod = moduleId
            ? window.modules.find((m) => m.id === moduleId && m.type === 'level')
            : window.modules.find((m) => m.type === 'level');
        return mod && mod.content ? mod.content.level : null;
    };

    window.getCharacterClass = function (moduleId) {
        const mod = moduleId
            ? window.modules.find((m) => m.id === moduleId && m.type === 'level')
            : window.modules.find((m) => m.type === 'level');
        return mod && mod.content ? mod.content.className || null : null;
    };

    window.LEVEL_XP_TEMPLATES = LEVEL_XP_TEMPLATES;
    window.getLevelFromXP = getLevelFromXP;

    console.log('[CV] module-level.js loaded');
})();
