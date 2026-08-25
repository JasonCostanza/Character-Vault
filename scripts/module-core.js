// ── Module Core ──
(function () {
    // ── Module State ──
    window.modules = [];
    window.moduleIdCounter = 0;
    window.gameSystem = window.gameSystem || 'custom';

    function generateModuleId() {
        return `module-${String(++window.moduleIdCounter).padStart(3, '0')}`;
    }

    // ── New Module Wizard ──
    const wizardOverlay = document.getElementById('wizard-overlay');
    const btnNewModule = document.getElementById('btn-new-module');
    const btnWizardClose = document.getElementById('btn-wizard-close');
    const btnWizardCancel = document.getElementById('btn-wizard-cancel');
    const btnWizardCreate = document.getElementById('btn-wizard-create');
    const wizardTypeCards = document.querySelectorAll('.wizard-type-card');
    const wizardSwatches = document.querySelectorAll('.wizard-swatch');

    // Apply background color from data-color for non-default, non-custom swatches
    wizardSwatches.forEach((swatch) => {
        const color = swatch.dataset.color;
        if (color && color !== 'custom') {
            swatch.style.backgroundColor = color;
        }
    });

    let lastWizardType = null;

    let wizardState = {
        type: 'text',
        theme: null,
        textColor: null,
        statLayout: 'large-stat',
    };

    function openWizard() {
        resetWizard();
        wizardOverlay.classList.add('open');
        wizardOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeWizard() {
        wizardOverlay.classList.remove('open');
        wizardOverlay.setAttribute('aria-hidden', 'true');
    }

    function resetWizard() {
        // Pick remembered type, or first non-disabled card
        const firstAvailable = Array.from(wizardTypeCards).find((c) => !c.classList.contains('disabled'));
        const defaultType = lastWizardType || (firstAvailable ? firstAvailable.dataset.type : 'text');

        wizardState = {
            type: defaultType,
            theme: null,
            textColor: null,
            statLayout: 'large-stat',
        };

        wizardTypeCards.forEach((card) => {
            card.classList.toggle('selected', card.dataset.type === defaultType);
        });

        wizardSwatches.forEach((sw) => {
            sw.classList.toggle('selected', sw.dataset.color === '');
        });

        const customHex = document.getElementById('wizard-custom-hex');
        const customHexWrap = document.getElementById('wizard-hex-wrap');
        const customHexDot = document.getElementById('wizard-hex-dot');
        if (customHex) {
            customHex.value = '';
        }
        if (customHexWrap) {
            customHexWrap.classList.remove('valid');
        }
        if (customHexDot) {
            customHexDot.style.backgroundColor = '';
        }

        const themeSection = document.getElementById('wizard-theme-section');
        if (themeSection)
            themeSection.style.display = defaultType === 'hline' || defaultType === 'spacer' ? 'none' : '';

        const statLayoutSection = document.getElementById('wizard-stat-layout');
        if (statLayoutSection) {
            statLayoutSection.classList.toggle('visible', defaultType === 'stat');
            statLayoutSection.querySelectorAll('.wizard-layout-btn').forEach((btn) => {
                btn.classList.toggle('selected', btn.dataset.layout === 'large-stat');
            });
        }

        const tcRow = document.getElementById('wizard-text-color-row');
        if (tcRow) {
            tcRow.querySelectorAll('.text-color-chip').forEach((c) => c.classList.remove('selected'));
            syncWizardTextChipPreviews();
        }
    }

    btnNewModule.addEventListener('click', openWizard);
    btnWizardClose.addEventListener('click', closeWizard);
    btnWizardCancel.addEventListener('click', closeWizard);

    // ── Global Escape Key ──
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (activeOverflowMenu) {
                closeOverflowMenu();
            } else if (deleteConfirmOverlay.classList.contains('open')) {
                closeDeleteConfirm();
            } else if (wizardOverlay.classList.contains('open')) {
                closeWizard();
            } else if (settingsOverlay.classList.contains('open')) {
                closeSettings();
            }
        }
    });

    // Type card selection
    const wizardThemeSection = document.getElementById('wizard-theme-section');
    const wizardStatLayout = document.getElementById('wizard-stat-layout');
    wizardTypeCards.forEach((card) => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            wizardTypeCards.forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            wizardState.type = card.dataset.type;
            wizardThemeSection.style.display =
                wizardState.type === 'hline' || wizardState.type === 'spacer' ? 'none' : '';
            wizardStatLayout.classList.toggle('visible', wizardState.type === 'stat');
        });
    });

    // Stat layout button selection
    wizardStatLayout.querySelectorAll('.wizard-layout-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            wizardStatLayout.querySelectorAll('.wizard-layout-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            wizardState.statLayout = btn.dataset.layout;
        });
    });

    // Color swatch selection
    const wizardCustomHex = document.getElementById('wizard-custom-hex');
    const wizardHexWrap = document.getElementById('wizard-hex-wrap');
    const wizardHexDot = document.getElementById('wizard-hex-dot');
    const wizardTextColorRow = document.getElementById('wizard-text-color-row');
    const wizardTextChips = wizardTextColorRow.querySelectorAll('.text-color-chip');

    const TEXT_COLOR_CSS = { light: 'var(--cv-module-text-light)', dark: 'var(--cv-module-text-dark)' };

    function syncWizardTextChipPreviews() {
        const bg = wizardState.theme || '';
        wizardTextChips.forEach((chip) => {
            chip.style.backgroundColor = bg || 'var(--cv-bg-surface)';
            const tc = chip.dataset.textColor;
            chip.style.color = TEXT_COLOR_CSS[tc] || 'var(--cv-text)';
        });
    }

    wizardSwatches.forEach((swatch) => {
        swatch.addEventListener('click', () => {
            wizardSwatches.forEach((s) => s.classList.remove('selected'));
            swatch.classList.add('selected');
            const color = swatch.dataset.color || '';
            wizardCustomHex.value = color;
            wizardHexDot.style.backgroundColor = color || '';
            wizardHexWrap.classList.toggle('valid', !!color);
            wizardState.theme = color || null;
            syncWizardTextChipPreviews();
        });
    });

    wizardCustomHex.addEventListener('input', () => {
        const val = normalizeHexInput(wizardCustomHex);
        if (val) {
            wizardHexWrap.classList.add('valid');
            wizardHexDot.style.backgroundColor = val;
            wizardSwatches.forEach((s) => s.classList.remove('selected'));
            wizardState.theme = val;
        } else {
            wizardHexWrap.classList.remove('valid');
            wizardHexDot.style.backgroundColor = '';
            wizardState.theme = null;
        }
        syncWizardTextChipPreviews();
    });

    wizardTextChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const alreadySelected = chip.classList.contains('selected');
            wizardTextChips.forEach((c) => c.classList.remove('selected'));
            if (!alreadySelected) {
                chip.classList.add('selected');
                wizardState.textColor = chip.dataset.textColor || null;
            } else {
                wizardState.textColor = null;
            }
        });
    });

    // ── Create Module ──
    btnWizardCreate.addEventListener('click', () => {
        const moduleData = {
            id: generateModuleId(),
            type: wizardState.type,
            title: null,
            colSpan: GRID_COLUMNS / 2,
            rowSpan: 2,
            order: window.modules.filter((m) => m.tabId === window.activeTabId).length,
            theme: wizardState.theme,
            textColor: wizardState.textColor,
            tabId: window.activeTabId,
            content: '',
        };

        if (moduleData.type === 'abilities') {
            const sys = window.gameSystem || 'custom';
            const templateAbilities = sys !== 'custom' ? applyAbilityTemplate(sys) : [];
            moduleData.content = { linkedStatModuleId: null, abilities: templateAbilities };
            const sysName = getGameSystemDisplayName(sys);
            if (sysName && templateAbilities.length > 0) {
                moduleData.title = sysName + ' ' + t('type.abilities');
            }
            moduleData.rowSpan = null;
        }

        if (moduleData.type === 'hline') {
            moduleData.colSpan = GRID_COLUMNS;
            moduleData.rowSpan = null;
            moduleData.theme = null;
            moduleData.textColor = null;
        }

        if (moduleData.type === 'spacer') {
            moduleData.colSpan = 1;
            moduleData.rowSpan = 1;
            moduleData.theme = null;
            moduleData.textColor = null;
        }

        if (moduleData.type === 'health') {
            moduleData.content = { currentHP: 0, maxHP: 0, tempHP: 0, maxHPModifier: 0 };
            moduleData.colSpan = 2;
            moduleData.rowSpan = null;
        }

        if (moduleData.type === 'stat') {
            const sys = window.gameSystem || 'custom';
            const templateStats = sys !== 'custom' ? applyStatTemplate(sys) : [];
            moduleData.content = { layout: wizardState.statLayout, stats: templateStats };
            const sysName = getGameSystemDisplayName(sys);
            if (sysName && templateStats.length > 0) {
                moduleData.title = sysName + ' Stats';
            }
            const statCount = templateStats.length;
            if (statCount === 0) {
                moduleData.colSpan = 4;
                moduleData.rowSpan = 2;
            } else {
                // Estimate stat blocks per row based on minmax(70px,1fr) auto-fit at typical widths
                const sPerRow = (cols) => (cols === 4 ? 3 : cols === 6 ? 5 : 6);
                let targetCols = GRID_COLUMNS;
                for (let cols = GRID_COLUMNS / 2; cols <= GRID_COLUMNS; cols += 2) {
                    if (sPerRow(cols) >= statCount) {
                        targetCols = cols;
                        break;
                    }
                }
                const statRows = Math.ceil(statCount / sPerRow(targetCols));
                moduleData.colSpan = targetCols;
                moduleData.rowSpan = statRows + 1;
            }
        }

        if (moduleData.type === 'list') {
            moduleData.rowSpan = 2;
            moduleData.content = { attributes: [], items: [], sortBy: null, sortDir: 'asc' };
        }

        if (moduleData.type === 'counters') {
            moduleData.rowSpan = 2;
            moduleData.content = { counters: [], sortBy: 'custom', sortDir: 'asc' };
        }

        if (moduleData.type === 'actions') {
            moduleData.content =
                typeof window.actionTrackerDefaultContent === 'function'
                    ? window.actionTrackerDefaultContent()
                    : { layout: 'wrap', actions: [] };
            moduleData.colSpan = 3;
            moduleData.rowSpan = 3;
        }

        if (moduleData.type === 'resistance') {
            moduleData.rowSpan = null;
            moduleData.content = {
                layout: 'columns',
                immunities: [],
                resistances: [],
                weaknesses: [],
                customTypes: [],
            };
        }

        if (moduleData.type === 'condition') {
            const sys = window.gameSystem || 'custom';
            moduleData.rowSpan = null;
            moduleData.content = {
                template: sys,
                applied: [],
                staging: [],
                customConditions: [],
                sortBy: null,
                sortDir: 'asc',
            };
            if (sys !== 'custom') {
                applyConditionTemplate(sys, 'replace', moduleData.content);
                const sysName = getGameSystemDisplayName(sys);
                if (sysName) moduleData.title = sysName + ' ' + t('type.condition');
            }
        }

        if (moduleData.type === 'savingthrow') {
            const sys = window.gameSystem || 'custom';
            const templateSaves = sys !== 'custom' ? window.applySavingThrowTemplate(sys) : [];
            const tierKey = window.inferTierPreset(sys);
            const presetTiers = window.applyTierPreset(tierKey);
            const autoTierPreset = sys !== 'custom' && templateSaves.length > 0;
            moduleData.content = {
                saves: templateSaves,
                notes: '',
                tiersEnabled: autoTierPreset,
                tiers: presetTiers.length > 0 ? presetTiers : window.applyTierPreset('simple'),
                tierPreset: tierKey,
            };
            const sysName = getGameSystemDisplayName(sys);
            if (sysName && templateSaves.length > 0) {
                moduleData.title = sysName + ' ' + t('type.savingthrow');
            }
            const saveCount = templateSaves.length;
            moduleData.colSpan = saveCount <= 3 ? GRID_COLUMNS / 2 : saveCount <= 6 ? 6 : GRID_COLUMNS;
            moduleData.rowSpan = null;
        }

        if (moduleData.type === 'level') {
            const sys = window.gameSystem || 'custom';
            const xpTpl = window.LEVEL_XP_TEMPLATES && window.LEVEL_XP_TEMPLATES[sys];
            moduleData.colSpan = 2;
            moduleData.rowSpan = null;
            moduleData.content = {
                level: 1,
                currentXP: 0,
                levelingSystem: 'xp',
                xpThresholds: xpTpl
                    ? xpTpl.thresholds.slice()
                    : [
                          300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000,
                          165000, 195000, 225000, 265000, 305000, 355000,
                      ],
                carryOverXP: true,
                barColor: null,
                barStyle: 'solid',
                className: null,
            };
            const sysName = getGameSystemDisplayName(sys);
            if (sysName && xpTpl) moduleData.title = sysName + ' ' + t('type.level');
        }

        if (moduleData.type === 'spells') {
            moduleData.colSpan = GRID_COLUMNS;
            moduleData.rowSpan = 4;
            moduleData.content = {
                autoSpendSlots: true,
                showSlotErrors: true,
                resourcePools: [],
                casterType: null,
                categories: [],
            };
        }

        if (moduleData.type === 'activity') {
            moduleData.rowSpan = 3;
            moduleData.content = { sortOrder: 'newest', hiddenEventTypes: [], showTimestamps: true, maxEntries: 200 };
        }

        if (moduleData.type === 'bio') {
            moduleData.rowSpan = 4;
            moduleData.content = buildBioDefaultContent();
        }

        if (moduleData.type === 'recovery') {
            const sys = window.gameSystem || 'custom';
            moduleData.colSpan = 2;
            moduleData.rowSpan = null;
            if (sys === 'dnd5e') {
                moduleData.content = {
                    restButtons: [
                        {
                            id: 'btn_' + Math.random().toString(36).slice(2, 9),
                            name: t('recovery.longRest'),
                            actions: [
                                { type: 'healToFull' },
                                { type: 'restoreAllSpellSlots' },
                                { type: 'resetTempHP' },
                                { type: 'restoreHitDice' },
                            ],
                        },
                        {
                            id: 'btn_' + Math.random().toString(36).slice(2, 9),
                            name: t('recovery.shortRest'),
                            actions: [{ type: 'healByRoll' }],
                        },
                    ],
                    hitDice: { dieSize: 8, total: 1, remaining: 1, modifier: 0, restoreOnLongRest: 'half' },
                };
            } else if (sys === 'pf2e') {
                moduleData.content = {
                    restButtons: [
                        {
                            id: 'btn_' + Math.random().toString(36).slice(2, 9),
                            name: t('recovery.rest'),
                            actions: [{ type: 'healToFull' }, { type: 'restoreAllSpellSlots' }],
                        },
                    ],
                    hitDice: null,
                };
            } else {
                moduleData.content = { restButtons: [], hitDice: null };
            }
        }

        if (moduleData.type === 'weapons') {
            moduleData.content = { weapons: [] };
            moduleData.colSpan = GRID_COLUMNS;
            moduleData.rowSpan = 2;
        }

        if (moduleData.type === 'companions') {
            const sys = window.gameSystem || 'custom';
            moduleData.colSpan = GRID_COLUMNS;
            moduleData.rowSpan = null;
            moduleData.content =
                typeof window.buildCompanionsDefaultContent === 'function'
                    ? window.buildCompanionsDefaultContent(sys)
                    : { companions: [], attributes: [], sortBy: null, sortDir: 'asc' };
            const sysName = getGameSystemDisplayName(sys);
            if (sysName) moduleData.title = sysName + ' ' + t('type.companions');
        }

        if (moduleData.type === 'defenses') {
            const sys = window.gameSystem || 'custom';
            moduleData.content =
                typeof window.buildDefensesDefaultContent === 'function'
                    ? window.buildDefensesDefaultContent(sys)
                    : {
                          defenses: [{ id: generateId('def'), name: 'AC', value: 10, icon: 'shield', showSign: false }],
                          quickDefenses: [],
                      };
            moduleData.rowSpan = 2;
        }

        lastWizardType = moduleData.type;
        window.modules.push(moduleData);
        renderModule(moduleData);
        updateEmptyState();
        closeWizard();
        console.log(`[CV] Module created: ${moduleData.id} (${moduleData.type})`);
        scheduleSave();
    });

    // ── Module Type Registry ──
    // Each module type registers: label, renderBody(bodyEl, data), and
    // optionally overflowMenuItems(moduleEl, data) → [{ onClick, label, icon }].
    const MODULE_TYPES = {};

    function registerModuleType(type, config) {
        MODULE_TYPES[type] = config;
    }

    // ── Module Rendering ──
    const moduleGrid = document.getElementById('module-grid');
    const emptyState = document.getElementById('empty-state');

    function updateEmptyState() {
        const tabModuleCount = window.modules.filter((m) => m.tabId === window.activeTabId).length;
        emptyState.style.display = tabModuleCount === 0 ? 'flex' : 'none';
    }

    // ── Module Rename Modal ──
    function openRenameModule(moduleEl, data) {
        const typeDef = MODULE_TYPES[data.type];
        const defaultLabel = typeDef ? t(typeDef.label) : '';

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay module-rename-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('module.renameTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cv-input module-rename-input';
        input.value = data.title || '';
        input.placeholder = defaultLabel;
        body.appendChild(input);
        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('module.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('common.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        input.focus();
        input.select();

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
        }

        function commitRename() {
            const val = input.value.trim();
            data.title = val && val !== defaultLabel ? val : null;
            const label = moduleEl.querySelector('.module-type-label');
            if (label) label.textContent = data.title || defaultLabel;
            scheduleSave();
            if (window.refreshLinkedAbilitiesChainIcons) {
                window.refreshLinkedAbilitiesChainIcons(data.id);
            }
            closeModal();
        }

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeModal();
            } else if (e.key === 'Enter') {
                commitRename();
            }
        };
        document.addEventListener('keydown', keyHandler);
        saveBtn.addEventListener('click', commitRename);
        cancelBtn.addEventListener('click', closeModal);
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // ── Module Overflow Menu ──
    let activeOverflowMenu = null;
    let activeOverflowModule = null;

    function openOverflowMenu(moduleEl, overflowBtn) {
        closeOverflowMenu();

        const data = window.modules.find((m) => m.id === moduleEl.dataset.id);

        const menu = document.createElement('div');
        menu.className = 'module-overflow-menu';

        // Rename first, Delete last; each type contributes its own entries via
        // MODULE_TYPES[type].overflowMenuItems(moduleEl, data).
        const btnDefs = [
            {
                onClick: () => openRenameModule(moduleEl, data),
                label: t('module.rename'),
                icon: cvIcon('pencil', 14),
            },
            ...(MODULE_TYPES[data?.type]?.overflowMenuItems?.(moduleEl, data) ?? []),
            // ── Help entry (only when the type has tutorial content) ──
            ...(hasTutorial(data?.type)
                ? [{ onClick: () => openTutorialModal(data.type), label: t('module.help'), icon: cvIcon('help-circle', 14) }]
                : []),
            {
                onClick: () => openDeleteConfirm(data.id),
                label: t('module.deleteModule'),
                icon: cvIcon('trash-2', 14),
                cls: 'danger',
            },
        ];

        btnDefs.forEach((def) => {
            const item = document.createElement('button');
            item.className = 'module-overflow-menu-item' + (def.cls ? ' ' + def.cls : '');
            item.innerHTML = def.icon + `<span>${escapeHtml(def.label)}</span>`;
            item.addEventListener('click', () => {
                def.onClick();
                closeOverflowMenu();
            });
            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        // Position below the kebab button
        const rect = overflowBtn.getBoundingClientRect();
        menu.style.top = rect.bottom + 4 + 'px';
        menu.style.left = rect.left + 'px';

        // Clamp to viewport
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = window.innerWidth - menuRect.width - 4 + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = rect.top - menuRect.height - 4 + 'px';
        }

        activeOverflowMenu = menu;
        activeOverflowModule = moduleEl;
        moduleEl.classList.add('module--chrome-active');

        requestAnimationFrame(() => {
            document.addEventListener('click', handleOverflowOutsideClick);
        });
    }

    function closeOverflowMenu() {
        if (activeOverflowMenu) {
            activeOverflowMenu.remove();
            activeOverflowMenu = null;
            document.removeEventListener('click', handleOverflowOutsideClick);
        }
        if (activeOverflowModule) {
            activeOverflowModule.classList.remove('module--chrome-active');
            activeOverflowModule = null;
        }
    }

    function handleOverflowOutsideClick(e) {
        if (activeOverflowMenu && !activeOverflowMenu.contains(e.target)) {
            closeOverflowMenu();
        }
    }

    const THEME_SWATCHES = [
        { color: '', key: 'wizard.swatchDefault', cls: 'overflow-swatch-default' },
        { color: '#8B2020', key: 'wizard.swatchCrimson' },
        { color: '#2D5A3D', key: 'wizard.swatchForest' },
        { color: '#1E3A5F', key: 'wizard.swatchNavy' },
        { color: '#4A2D6B', key: 'wizard.swatchRoyal' },
        { color: '#5C3A1E', key: 'wizard.swatchLeather' },
        { color: '#3A3A3A', key: 'wizard.swatchSlate' },
    ];

    function buildSwatchPanel(container, moduleEl, data, onClose) {
        const label = document.createElement('div');
        label.className = 'overflow-theme-label';
        label.textContent = t('module.changeTheme');
        container.appendChild(label);

        const row = document.createElement('div');
        row.className = 'overflow-swatch-row';

        const currentTheme = data.theme || '';

        // Hex input (always visible)
        const hexWrap = document.createElement('div');
        hexWrap.className = 'hex-input-wrap';

        const hexDot = document.createElement('span');
        hexDot.className = 'hex-input-dot';

        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'cv-hex-input';
        hexInput.placeholder = '#000000';
        hexInput.maxLength = 7;
        hexInput.spellcheck = false;

        if (currentTheme) {
            hexInput.value = currentTheme;
            hexDot.style.backgroundColor = currentTheme;
            hexWrap.classList.add('valid');
        }

        hexWrap.appendChild(hexDot);
        hexWrap.appendChild(hexInput);

        function syncHexState(color) {
            hexInput.value = color || '';
            hexDot.style.backgroundColor = color || '';
            hexWrap.classList.toggle('valid', !!color);
        }

        // Text color chips (built first so bg swatch clicks can sync them)
        const tcSection = document.createElement('div');
        tcSection.className = 'text-color-section';
        const tcLabel = document.createElement('div');
        tcLabel.className = 'text-color-label overflow-theme-label';
        tcLabel.textContent = t('wizard.textColor');
        tcSection.appendChild(tcLabel);

        const tcRow = document.createElement('div');
        tcRow.className = 'text-color-row overflow-swatch-row';
        const tcOptions = [
            { value: 'light', key: 'wizard.textColorLight' },
            { value: 'dark', key: 'wizard.textColorDark' },
        ];
        const currentTextColor = data.textColor || '';

        function syncTextChipPreviews() {
            const bg = data.theme || '';
            tcRow.querySelectorAll('.text-color-chip').forEach((chip) => {
                chip.style.backgroundColor = bg || 'var(--cv-bg-surface)';
                const tc = chip.dataset.textColor;
                chip.style.color = TEXT_COLOR_CSS[tc] || 'var(--cv-text)';
            });
        }

        tcOptions.forEach((opt) => {
            const chip = document.createElement('button');
            chip.className = 'text-color-chip';
            chip.dataset.textColor = opt.value;
            chip.title = t(opt.key);
            chip.textContent = 'Abc';
            if (opt.value === currentTextColor) chip.classList.add('selected');
            chip.addEventListener('click', () => {
                const alreadySelected = chip.classList.contains('selected');
                tcRow.querySelectorAll('.text-color-chip').forEach((c) => c.classList.remove('selected'));
                if (!alreadySelected) {
                    chip.classList.add('selected');
                    data.textColor = opt.value;
                    moduleEl.classList.remove('module-text-light', 'module-text-dark');
                    moduleEl.classList.add('module-text-' + opt.value);
                } else {
                    data.textColor = null;
                    moduleEl.classList.remove('module-text-light', 'module-text-dark');
                }
                scheduleSave();
            });
            tcRow.appendChild(chip);
        });
        tcSection.appendChild(tcRow);

        THEME_SWATCHES.forEach((sw) => {
            const btn = document.createElement('button');
            btn.className = 'overflow-swatch' + (sw.cls ? ' ' + sw.cls : '');
            btn.title = t(sw.key);
            if (sw.color) btn.style.backgroundColor = sw.color;
            if (sw.color === currentTheme) btn.classList.add('selected');

            btn.addEventListener('click', () => {
                row.querySelectorAll('.overflow-swatch').forEach((s) => s.classList.remove('selected'));
                btn.classList.add('selected');
                data.theme = sw.color || null;
                moduleEl.style.backgroundColor = sw.color || '';
                syncHexState(sw.color);
                syncTextChipPreviews();
                scheduleSave();
            });
            row.appendChild(btn);
        });

        const isCustom = currentTheme && !THEME_SWATCHES.some((sw) => sw.color === currentTheme);
        if (isCustom) {
            row.querySelectorAll('.overflow-swatch').forEach((s) => s.classList.remove('selected'));
        }

        hexInput.addEventListener('input', () => {
            const val = normalizeHexInput(hexInput);
            if (val) {
                hexWrap.classList.add('valid');
                hexDot.style.backgroundColor = val;
                row.querySelectorAll('.overflow-swatch').forEach((s) => s.classList.remove('selected'));
                data.theme = val;
                moduleEl.style.backgroundColor = val;
                syncTextChipPreviews();
                scheduleSave();
            } else {
                hexWrap.classList.remove('valid');
                hexDot.style.backgroundColor = '';
            }
        });

        hexInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && onClose) onClose();
        });

        hexWrap.addEventListener('click', (e) => e.stopPropagation());

        row.appendChild(hexWrap);
        container.appendChild(row);

        container.appendChild(tcSection);
        syncTextChipPreviews();
    }

    function renderModule(data) {
        const typeDef = MODULE_TYPES[data.type];
        if (!typeDef) {
            console.warn(`[CV] Unknown module type: ${data.type}`);
            return;
        }

        const el = document.createElement('div');
        el.className = 'module';
        el.dataset.id = data.id;
        el.dataset.type = data.type;
        el.style.gridColumn = `span ${data.colSpan}`;

        if (data.rowSpan) {
            el.style.gridRow = `span ${data.rowSpan}`;
        }

        if (data.type === 'hline') {
            el.style.alignSelf = 'center';
        }

        if (data.theme) {
            el.style.backgroundColor = data.theme;
        }

        if (data.textColor === 'light' || data.textColor === 'dark') {
            el.classList.add('module-text-' + data.textColor);
        }

        const showResize = data.type !== 'hline';
        const displayTitle = data.title || t(typeDef.label);
        el.innerHTML = `
        <div class="module-header">
            <span class="module-drag-handle">&#x2807;</span>
            ${MODULE_TYPES[data.type]?.hasStatLink ? `<span class="module-${data.type}-link-indicator" title="" style="display:none">${cvIcon('link', 12)}</span>` : ''}
            <span class="module-type-label">${escapeHtml(displayTitle)}</span>
            <button class="module-overflow-btn" title="${t('module.moreOptions')}">${cvIcon('more-vertical', 14)}</button>
        </div>
        <div class="module-body cv-scroll"></div>
        ${showResize ? `<div class="module-resize-handle" title="${t('module.dragResize')}"></div>` : ''}
    `;

        // Overflow menu (kebab button)
        const overflowBtn = el.querySelector('.module-overflow-btn');
        overflowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openOverflowMenu(el, overflowBtn);
        });

        const bodyEl = el.querySelector('.module-body');
        typeDef.renderBody(bodyEl, data);

        moduleGrid.appendChild(el);
        if (data.type !== 'hline') {
            initResizeHandle(el, data);
        }
        moduleSizeObserver.observe(bodyEl);
        snapModuleHeight(el, data);
        if (!_batchMode) applyLayout();
    }

    // ── Module Drag & Drop (SortableJS) ──
    const sortable = new Sortable(moduleGrid, {
        handle: '.module-drag-handle',
        animation: 150,
        ghostClass: 'module-ghost',
        chosenClass: 'module-dragging',
        dragClass: 'module-drag-active',
        filter: '#empty-state',
        disabled: false,
        onStart() {
            _dragging = true;
            moduleGrid.querySelectorAll('.module').forEach((el) => {
                const data = window.modules.find((m) => m.id === el.dataset.id);
                el.style.gridColumn = `span ${data ? data.colSpan : 1}`;
                el.style.gridRow = `span ${data ? getRowSpan(data) : 1}`;
            });
        },
        onEnd(evt) {
            _dragging = false;
            const orderedIds = Array.from(moduleGrid.querySelectorAll('.module')).map((el) => el.dataset.id);
            const activeModules = window.modules.filter((m) => m.tabId === window.activeTabId);
            activeModules.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
            activeModules.forEach((m, i) => (m.order = i));
            applyLayout();
            console.log(`[CV] Module reordered: ${evt.item.dataset.id} → position ${evt.newIndex}`);
            scheduleSave();
        },
    });

    // ── Delete Confirmation ──
    const deleteConfirmOverlay = document.getElementById('delete-confirm-overlay');
    const btnDeleteCancel = document.getElementById('btn-delete-cancel');
    const btnDeleteConfirm = document.getElementById('btn-delete-confirm');
    let pendingDeleteId = null;

    function openDeleteConfirm(moduleId) {
        pendingDeleteId = moduleId;
        deleteConfirmOverlay.classList.add('open');
        deleteConfirmOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteConfirm() {
        pendingDeleteId = null;
        deleteConfirmOverlay.classList.remove('open');
        deleteConfirmOverlay.setAttribute('aria-hidden', 'true');
    }

    function deleteModule(moduleId) {
        const moduleData = window.modules.find((m) => m.id === moduleId);
        const moduleTitle = moduleData
            ? moduleData.title ||
              t(MODULE_TYPES[moduleData.type] ? MODULE_TYPES[moduleData.type].label : 'module.unknownType')
            : moduleId;
        const moduleType = moduleData ? moduleData.type : 'unknown';

        const el = moduleGrid.querySelector(`.module[data-id="${moduleId}"]`);
        if (el) {
            const bodyEl = el.querySelector('.module-body');
            if (bodyEl) moduleSizeObserver.unobserve(bodyEl);
            el.remove();
        }
        window.modules = window.modules.filter((m) => m.id !== moduleId);
        window.modules.forEach((m, i) => (m.order = i));
        applyLayout();
        updateEmptyState();
        console.log(`[CV] Module deleted: ${moduleId}`);
        scheduleSave();
        if (typeof window.logActivity === 'function') {
            window.logActivity({
                type: 'module.event.delete',
                message: t('module.log.delete', { title: moduleTitle, type: moduleType }),
                sourceModuleId: moduleId,
            });
        }
    }

    btnDeleteCancel.addEventListener('click', closeDeleteConfirm);

    btnDeleteConfirm.addEventListener('click', () => {
        if (pendingDeleteId) {
            deleteModule(pendingDeleteId);
        }
        closeDeleteConfirm();
    });

    // ── Simple Module Settings Modal (theme + move-to-tab only) ──
    function openSimpleSettingsModal(moduleEl, data, overlayClass, titleKey) {
        const existing = document.querySelector('.' + overlayClass);
        if (existing) {
            existing.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay ' + overlayClass;

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t(titleKey);
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
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
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // ── Module Size Constants ──
    const GRID_COLUMNS = 8;
    const GRID_GAP = 8;
    const ROW_H = 66;

    // ── Auto-Snap Height to Grid Rows ──
    let _snapping = false;
    let _layingOut = false;
    let _batchMode = false;
    let _dragging = false;

    function snapModuleHeight(el, data) {
        if (data.rowSpan !== null) return;
        if (data.type === 'hline') return;
        _snapping = true;
        // Temporarily clear grid-row and collapse to content height for measurement
        el.style.gridRow = '';
        el.style.alignSelf = 'start';
        const actual = el.getBoundingClientRect().height;
        const snappedRows = Math.ceil((actual + GRID_GAP) / (ROW_H + GRID_GAP));
        el.style.alignSelf = '';
        el.style.gridRow = `span ${snappedRows}`;
        _snapping = false;
    }

    // ── Grid Layout Algorithm ──

    function getRowSpan(data) {
        if (data.rowSpan !== null) return data.rowSpan;
        const el = moduleGrid.querySelector(`.module[data-id="${data.id}"]`);
        if (el) {
            const match = (el.style.gridRow || '').match(/span\s+(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        return 1;
    }

    function computeLayout(moduleDataList) {
        const results = [];
        const occupied = [];

        function isOccupied(row, col) {
            return !!(occupied[row] && occupied[row][col]);
        }

        function markOccupied(rowStart, colStart, colSpan, rowSpan) {
            for (let r = rowStart; r < rowStart + rowSpan; r++) {
                if (!occupied[r]) occupied[r] = [];
                for (let c = colStart; c < colStart + colSpan; c++) {
                    occupied[r][c] = true;
                }
            }
        }

        for (const data of moduleDataList) {
            const colSpan = data.colSpan;
            const rowSpan = getRowSpan(data);
            let placed = false;

            for (let row = 1; !placed; row++) {
                for (let col = 1; col <= GRID_COLUMNS - colSpan + 1; col++) {
                    let fits = true;
                    outer: for (let r = row; r < row + rowSpan; r++) {
                        for (let c = col; c < col + colSpan; c++) {
                            if (isOccupied(r, c)) {
                                fits = false;
                                break outer;
                            }
                        }
                    }
                    if (fits) {
                        markOccupied(row, col, colSpan, rowSpan);
                        results.push({ id: data.id, colStart: col, rowStart: row, colSpan, rowSpan });
                        placed = true;
                        break;
                    }
                }
            }
        }

        return results;
    }

    function applyLayout() {
        if (_dragging || _batchMode) return;
        const tabModules = window.modules
            .filter((m) => m.tabId === window.activeTabId)
            .sort((a, b) => a.order - b.order);
        const positions = computeLayout(tabModules);
        _layingOut = true;
        for (const pos of positions) {
            const el = moduleGrid.querySelector(`.module[data-id="${pos.id}"]`);
            if (!el) continue;
            el.style.gridColumn = `${pos.colStart} / span ${pos.colSpan}`;
            el.style.gridRow = `${pos.rowStart} / span ${pos.rowSpan}`;
        }
        _layingOut = false;
    }

    // ── ResizeObserver for Size Classes ──
    const moduleSizeObserver = new ResizeObserver((entries) => {
        if (_snapping || _layingOut || _dragging) return; // avoid re-entrancy
        let needsLayout = false;
        for (const entry of entries) {
            const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
            const mod = entry.target.closest('.module');
            if (!mod) continue;
            let size = 'lg';
            if (w < 100) size = 'xs';
            else if (w < 200) size = 'sm';
            else if (w < 350) size = 'md';
            mod.dataset.size = size;

            const data = window.modules.find((m) => m.id === mod.dataset.id);
            if (data && data.rowSpan === null) {
                snapModuleHeight(mod, data);
                needsLayout = true;
            }
        }
        if (needsLayout) applyLayout();
    });

    // ── Module Resize Handle ──

    function initResizeHandle(moduleEl, data) {
        const handle = moduleEl.querySelector('.module-resize-handle');
        if (!handle) return;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (moduleEl.classList.contains('module-resizing')) return;

            const grid = document.getElementById('module-grid');
            const gridRect = grid.getBoundingClientRect();
            const gridContentWidth = gridRect.width - GRID_GAP * 2; // subtract padding
            const colWidth = (gridContentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

            const startX = e.clientX;
            const startY = e.clientY;
            const startColSpan = data.colSpan;
            // When rowSpan is null (auto-height), derive from actual rendered height
            const startRowSpan =
                data.rowSpan ||
                Math.max(1, Math.round((moduleEl.getBoundingClientRect().height + GRID_GAP) / (ROW_H + GRID_GAP)));

            moduleEl.classList.add('module-resizing');
            handle.classList.add('resizing');

            // Dashed outline (module-resizing) + live badge stand in for the ghost here —
            // a separate overlay box can't work for resize: shrinking always nests the new
            // footprint inside the old one (or vice versa when growing), so one of the two
            // boxes is always fully hidden behind the other. Styling the one real,
            // live-reflowing element avoids that and keeps resize feeling as live as reposition.
            const badge = document.createElement('div');
            badge.className = 'module-resize-badge';
            badge.textContent = `${startColSpan} col × ${startRowSpan} row`;
            moduleEl.appendChild(badge);

            let _layoutRaf = 0;

            function onMouseMove(e) {
                // Calculate new colSpan from drag delta (avoids stale position after grid reflow)
                const deltaX = e.clientX - startX;
                const colDelta = Math.round(deltaX / (colWidth + GRID_GAP));
                const newColSpan = Math.max(1, Math.min(GRID_COLUMNS, startColSpan + colDelta));

                // Calculate new rowSpan from drag delta
                const deltaY = e.clientY - startY;
                const rowDelta = Math.sign(deltaY) * Math.round(Math.abs(deltaY) / (ROW_H + GRID_GAP));
                const newRowSpan = Math.max(1, startRowSpan + rowDelta);

                const changed = newColSpan !== data.colSpan || newRowSpan !== data.rowSpan;
                data.colSpan = newColSpan;
                data.rowSpan = newRowSpan;

                badge.textContent = `${data.colSpan} col × ${data.rowSpan} row`;

                if (changed && !_layoutRaf) {
                    _layoutRaf = requestAnimationFrame(() => {
                        _layoutRaf = 0;
                        applyLayout();
                    });
                }
            }

            function onMouseUp() {
                moduleEl.classList.remove('module-resizing');
                handle.classList.remove('resizing');
                badge.remove();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                cancelAnimationFrame(_layoutRaf);
                applyLayout();
                console.log(`[CV] Module resized: ${data.id} → ${data.colSpan} cols, ${data.rowSpan || '?'} rows`);
                scheduleSave();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    function performModuleMove(moduleEl, data, destTab) {
        data.order = window.modules.filter((m) => m.tabId === destTab.id).length;
        data.tabId = destTab.id;
        const bodyEl = moduleEl.querySelector('.module-body');
        if (bodyEl) moduleSizeObserver.unobserve(bodyEl);
        moduleEl.remove();
        applyLayout();
        updateEmptyState();
        scheduleSave();
        window.showToast(t('module.moveToTabMoved', { tab: destTab.name }));
        window.closeAllModals();
    }

    window.MODULE_TYPES = MODULE_TYPES;
    window.registerModuleType = registerModuleType;
    window.openSimpleSettingsModal = openSimpleSettingsModal;
    window.moduleGrid = moduleGrid;
    window.updateEmptyState = updateEmptyState;
    window.renderModule = renderModule;
    window.openDeleteConfirm = openDeleteConfirm;
    window.applyLayout = applyLayout;
    window.setLayoutBatchMode = (val) => {
        _batchMode = val;
    };
    window.GRID_COLUMNS = GRID_COLUMNS;
    window.GRID_GAP = GRID_GAP;
    window.ROW_H = ROW_H;
    window.snapModuleHeight = snapModuleHeight;
    window.initResizeHandle = initResizeHandle;
    window.openWizard = openWizard;
    window.closeWizard = closeWizard;
    window.buildSwatchPanel = buildSwatchPanel;
    window.performModuleMove = performModuleMove;
    window.sortable = sortable;
    window.generateModuleId = generateModuleId;
})();
