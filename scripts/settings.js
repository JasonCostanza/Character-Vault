// ── Settings ──
(function () {
    // ── Settings Overlay ──
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnSettingsOpen = document.getElementById('btn-settings');
    const btnSettingsClose = document.getElementById('btn-settings-close');

    function openSettings() {
        settingsOverlay.classList.add('open');
        settingsOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeSettings() {
        settingsOverlay.classList.remove('open');
        settingsOverlay.setAttribute('aria-hidden', 'true');
    }

    btnSettingsOpen.addEventListener('click', openSettings);
    btnSettingsClose.addEventListener('click', closeSettings);

    // ── Theme Toggle Buttons ──
    const themeButtons = document.querySelectorAll('.settings-toggle-btn[id^="btn-theme-"]');

    function updateThemeButtons(theme) {
        themeButtons.forEach((btn) => {
            const btnTheme = btn.id.replace('btn-theme-', '');
            btn.classList.toggle('active', btnTheme === theme);
        });
    }

    themeButtons.forEach((btn) => {
        const theme = btn.id.replace('btn-theme-', '');
        btn.addEventListener('click', () => {
            setTheme(theme);
            updateThemeButtons(theme);
        });
    });

    updateThemeButtons(localStorage.getItem('cv-theme') ?? 'dark');

    // ── UI Scale ──
    const uiScaleOptions = [
        { value: '0.9', label: '90%' },
        { value: '1', label: '100%' },
        { value: '1.1', label: '110%' },
        { value: '1.25', label: '125%' },
    ];
    const uiScaleWidget = buildCvSelect(uiScaleOptions, localStorage.getItem('cv-ui-scale') ?? '1', function (val) {
        localStorage.setItem('cv-ui-scale', val);
        applyUiScale(val);
    });
    document.getElementById('setting-ui-scale-container').appendChild(uiScaleWidget.el);

    // ── Language ──
    const langOptions = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'it', label: 'Italiano' },
        { value: 'pt-BR', label: 'Português (Brasil)' },
        { value: 'ru', label: 'Русский' },
    ];
    const langWidget = buildCvSelect(langOptions, localStorage.getItem('cv-language') ?? 'en', function (val) {
        localStorage.setItem('cv-language', val);
        window.currentLang = val;
        applyTranslations();
        refreshModuleLabels();
    });
    document.getElementById('setting-language-container').appendChild(langWidget.el);

    // ── Game System ──
    const gameSystemOptions = [
        { value: 'coc', label: 'Call of Cthulhu' },
        { value: 'cpred', label: 'Cyberpunk Red' },
        { value: 'dnd5e', label: 'D&D 5e' },
        { value: 'daggerheart', label: 'Daggerheart' },
        { value: 'mothership', label: 'Mothership' },
        { value: 'pf2e', label: 'Pathfinder 2e' },
        { value: 'sr6', label: 'Shadowrun 6e' },
        { value: 'vtm', label: 'Vampire: The Masquerade' },
        { value: 'custom', label: t('settings.gameSystemCustom') },
    ];
    const gameSystemWidget = buildCvSelect(
        gameSystemOptions,
        localStorage.getItem('cv-game-system') ?? window.gameSystem ?? 'custom',
        function (val) {
            localStorage.setItem('cv-game-system', val);
            window.gameSystem = val;
            scheduleSave();
        }
    );
    window.gameSystem = localStorage.getItem('cv-game-system') ?? 'custom';
    document.getElementById('setting-game-system-container').appendChild(gameSystemWidget.el);

    window.syncGameSystemUI = function () {
        gameSystemWidget.setValue(window.gameSystem || 'custom');
    };

    // ── Save / Load ──
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    const chkAutoSave = document.getElementById('chk-auto-save');
    const chkAutoLoad = document.getElementById('chk-auto-load');

    btnSave.addEventListener('click', async () => {
        const ok = await saveCharacter();
        showToast(t(ok ? 'toast.saveSuccess' : 'toast.saveFail'), ok ? 'success' : 'error');
    });
    btnLoad.addEventListener('click', async () => {
        const ok = await loadCharacter();
        showToast(t(ok ? 'toast.loadSuccess' : 'toast.loadFail'), ok ? 'success' : 'error');
    });

    chkAutoSave.addEventListener('change', () => {
        localStorage.setItem('cv-auto-save', chkAutoSave.checked);
    });

    chkAutoLoad.addEventListener('change', () => {
        localStorage.setItem('cv-auto-load', chkAutoLoad.checked);
    });

    chkAutoSave.checked = localStorage.getItem('cv-auto-save') === 'true';
    chkAutoLoad.checked = localStorage.getItem('cv-auto-load') === 'true';

    // ── Export / Import ──
    const btnExport = document.getElementById('btn-export');

    btnExport.addEventListener('click', async () => {
        const ok = await copyTextToClipboard(serializeCharacter());
        if (ok) {
            console.log('[CV] Character data copied to clipboard');
            showToast(t('toast.exportSuccess'), 'success');
        } else {
            console.error('[CV] Failed to copy character data to clipboard');
            showToast(t('toast.exportFail'), 'error');
        }
    });

    document.getElementById('btn-import').addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(input);

        function cleanup() {
            if (document.body.contains(input)) document.body.removeChild(input);
        }

        function onWindowFocus() {
            setTimeout(cleanup, 200);
        }

        input.addEventListener('cancel', cleanup);
        window.addEventListener('focus', onWindowFocus, { once: true });
        input.click();

        input.addEventListener('change', function () {
            window.removeEventListener('focus', onWindowFocus);
            const file = input.files[0];
            if (!file) {
                cleanup();
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', function () {
                cleanup();
                const result = validateImportData(reader.result);
                if (!result.ok) {
                    showToast(t(result.error), 'error', {
                        label: t('import.viewError'),
                        onClick: function () {
                            openImportErrorModal(result.detail);
                        },
                    });
                    return;
                }
                console.log('[CV] Import validation passed');
                handleValidImport(result.blob, result.unknownCount);
            });
            reader.addEventListener('error', function () {
                cleanup();
                showToast(t('import.errorInvalidJson'), 'error');
            });
            reader.readAsText(file);
        });
    });

    function validateImportData(jsonStr) {
        let blob;
        try {
            blob = JSON.parse(jsonStr);
        } catch (err) {
            return { ok: false, error: 'import.errorInvalidJson', detail: String(err) };
        }
        if (!blob.version || !Number.isInteger(blob.version)) {
            return { ok: false, error: 'import.errorNotCV', detail: 'Missing version field' };
        }
        if (!Array.isArray(blob.modules)) {
            return { ok: false, error: 'import.errorNotCV', detail: 'Missing modules array' };
        }
        if (blob.version > 3) {
            return {
                ok: false,
                error: 'import.errorNewerVersion',
                detail: `File version: ${blob.version}, app supports: 3`,
            };
        }
        if (blob.version < 3) {
            window.migrateData(blob);
        }
        const unknownCount = blob.modules.filter(function (m) {
            return !window.MODULE_TYPES[m.type];
        }).length;
        return { ok: true, blob: blob, unknownCount: unknownCount };
    }

    function openImportErrorModal(detail) {
        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay cv-tab-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.maxWidth = '420px';
        panel.style.width = '90%';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('h2');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('import.errorTitle');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.setAttribute('title', t('wizard.close'));
        closeBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
        const pre = document.createElement('pre');
        pre.className = 'import-error-detail';
        pre.textContent = detail;
        body.appendChild(pre);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const dismissBtn = document.createElement('button');
        dismissBtn.type = 'button';
        dismissBtn.className = 'btn-secondary';
        dismissBtn.textContent = t('wizard.close');
        footer.appendChild(dismissBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.classList.add('open');
        });

        function close() {
            overlay.classList.remove('open');
            document.removeEventListener('keydown', onEscape);
            setTimeout(function () {
                document.body.removeChild(overlay);
            }, 200);
        }

        function onEscape(e) {
            if (e.key === 'Escape') close();
        }

        closeBtn.addEventListener('click', close);
        dismissBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', onEscape);
    }

    function handleValidImport(blob, unknownCount) {
        const hasData =
            window.modules.length > 0 ||
            window.tabs.length > 1 ||
            (window.activityLog && window.activityLog.length > 0);
        if (!hasData) {
            applyOverwrite(blob, unknownCount);
        } else {
            openImportDialog(blob, unknownCount);
        }
    }

    function openImportDialog(blob, unknownCount) {
        const tabCount = blob.tabs?.length ?? 0;
        const moduleCount = blob.modules?.length ?? 0;
        const system = window.getGameSystemDisplayName(blob.gameSystem || 'custom');
        const desc = t('import.dialogDesc', { tabs: tabCount, modules: moduleCount, system: system });

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay cv-tab-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.maxWidth = '420px';
        panel.style.width = '90%';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('h2');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('import.dialogTitle');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.setAttribute('title', t('wizard.close'));
        closeBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
        const descEl = document.createElement('p');
        descEl.className = 'tab-reset-confirm-text';
        descEl.textContent = desc;
        body.appendChild(descEl);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('wizard.cancel');
        const addAsTabBtn = document.createElement('button');
        addAsTabBtn.type = 'button';
        addAsTabBtn.className = 'btn-primary';
        addAsTabBtn.textContent = t('import.addAsTab');
        const overwriteBtn = document.createElement('button');
        overwriteBtn.type = 'button';
        overwriteBtn.className = 'btn-danger';
        overwriteBtn.textContent = t('import.overwrite');
        footer.appendChild(cancelBtn);
        footer.appendChild(addAsTabBtn);
        footer.appendChild(overwriteBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.classList.add('open');
        });

        function close() {
            overlay.classList.remove('open');
            document.removeEventListener('keydown', onEscape);
            setTimeout(function () {
                document.body.removeChild(overlay);
            }, 200);
        }

        function onEscape(e) {
            if (e.key === 'Escape') close();
        }

        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', onEscape);

        addAsTabBtn.addEventListener('click', function () {
            close();
            applyAddAsNewTab(blob, unknownCount);
        });

        overwriteBtn.addEventListener('click', function () {
            close();
            applyOverwrite(blob, unknownCount);
        });
    }

    function showImportToast(unknownCount) {
        if (unknownCount > 0) {
            showToast(t('toast.importSuccessSkipped', { count: unknownCount }), 'warning');
        } else {
            showToast(t('toast.importSuccess'), 'success');
        }
    }

    function applyAddAsNewTab(blob, unknownCount) {
        const idMap = {};
        (blob.tabs || []).forEach(function (tab) {
            idMap[tab.id] = window.generateTabId();
        });
        (blob.modules || []).forEach(function (mod) {
            idMap[mod.id] = window.generateModuleId();
        });

        const importedTabName = blob.tabs?.[0]?.name || 'Imported';
        const newTab = window.createTab(importedTabName);
        const newTabId = newTab.id;

        let orderCounter = 0;
        const validModules = (blob.modules || []).filter(function (m) {
            return window.MODULE_TYPES[m.type];
        });
        validModules.forEach(function (saved) {
            const data = {
                id: idMap[saved.id],
                type: saved.type,
                title: saved.title ?? null,
                colSpan: saved.colSpan ?? 4,
                rowSpan: saved.rowSpan ?? null,
                order: orderCounter++,
                theme: saved.theme ?? null,
                textLight: !!saved.textLight,
                tabId: newTabId,
                content: saved.content ?? '',
            };
            if (
                data.content &&
                typeof data.content === 'object' &&
                data.content.linkedStatModuleId &&
                idMap[data.content.linkedStatModuleId]
            ) {
                data.content.linkedStatModuleId = idMap[data.content.linkedStatModuleId];
            }
            window.modules.push(data);
        });

        window.renderTabBar();
        window.switchToTab(newTabId);

        showImportToast(unknownCount);
    }

    function applyOverwrite(blob, unknownCount) {
        window.deserializeCharacter(blob);
        scheduleSave();
        showImportToast(unknownCount);
    }

    // ── Force Reload ──
    document.getElementById('btn-force-reload').addEventListener('click', () => {
        location.reload();
    });

    // ── Window Dimensions ──
    const dimensionsEl = document.getElementById('window-dimensions');
    function updateDimensions() {
        if (dimensionsEl) {
            dimensionsEl.textContent = `Window Size: ${window.innerWidth} x ${window.innerHeight}`;
        }
    }
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    // ── GitHub Link (copy to clipboard) ──
    // The GitHub octocat mark is a brand logo, not a generic icon, so it stays as its
    // own inline SVG rather than going through the cvIcon sprite system.
    const GITHUB_LOGO_SVG =
        '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>';
    document.getElementById('btn-github-link').addEventListener('click', async function () {
        const btn = this;
        const ok = await copyTextToClipboard('https://github.com/JasonCostanza/Character-Vault');
        if (ok) {
            console.log('[CV] GitHub URL copied to clipboard');
            btn.classList.add('copied');
            btn.innerHTML = `${cvIcon('check', 14)} ${t('settings.githubCopied')}`;
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = `${GITHUB_LOGO_SVG} ${t('settings.github')}`;
            }, 1500);
        } else {
            console.error('[CV] Failed to copy GitHub URL');
            showToast(t('settings.githubCopyFail'), 'error');
        }
    });

    // ── Reset All Tabs ──
    document.getElementById('btn-reset-tabs').addEventListener('click', function () {
        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay cv-tab-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.maxWidth = '420px';
        panel.style.width = '90%';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('h2');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('tabs.resetAll');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'cv-modal-close';
        closeBtn.setAttribute('title', t('wizard.close'));
        closeBtn.innerHTML = cvIcon('x', 16);
        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';
        const msg = document.createElement('p');
        msg.className = 'tab-reset-confirm-text';
        msg.textContent = t('tabs.resetConfirm');
        body.appendChild(msg);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('wizard.cancel');
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn-danger';
        confirmBtn.textContent = t('tabs.deleteConfirm');
        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.classList.add('open');
        });

        function close() {
            overlay.classList.remove('open');
            document.removeEventListener('keydown', onEscape);
            setTimeout(function () {
                document.body.removeChild(overlay);
            }, 200);
        }

        function onEscape(e) {
            if (e.key === 'Escape') close();
        }

        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', onEscape);

        confirmBtn.addEventListener('click', function () {
            close();
            document.querySelectorAll('.module').forEach(function (el) {
                el.remove();
            });
            window.modules.length = 0;
            if (Array.isArray(window.activityLog)) window.activityLog.length = 0;
            window.tabs.length = 0;
            window.setTabIdCounter(0);
            const fresh = window.createTab();
            window.renderTabBar();
            window.switchToTab(fresh.id);
            console.log('[CV] All tabs reset to fresh state');
        });
    });

    // ── Version & Easter Egg ──
    const versionEl = document.getElementById('settings-version');
    const devSection = document.getElementById('settings-developer');
    versionEl.textContent = 'v' + window.CV_VERSION;
    devSection.style.display = 'none';
    let _versionClicks = 0;
    versionEl.addEventListener('click', function () {
        _versionClicks++;
        if (_versionClicks >= 5) devSection.style.display = '';
    });

    // ── Debug ──
    document.getElementById('btn-debug-weapon').addEventListener('click', function () {
        if (typeof window.debugSimulateIncoming === 'function') window.debugSimulateIncoming('weapons');
    });
    document.getElementById('btn-debug-spell').addEventListener('click', function () {
        if (typeof window.debugSimulateIncoming === 'function') window.debugSimulateIncoming('spells');
    });
    document.getElementById('btn-debug-item').addEventListener('click', function () {
        if (typeof window.debugSimulateIncoming === 'function') window.debugSimulateIncoming('list');
    });

    // ── Dice ──
    const chkDiceCloseModals = document.getElementById('chk-dice-close-modals');
    chkDiceCloseModals.checked = localStorage.getItem('cv-dice-close-modals') === 'true';
    chkDiceCloseModals.addEventListener('change', () => {
        localStorage.setItem('cv-dice-close-modals', chkDiceCloseModals.checked);
    });

    window.settingsOverlay = settingsOverlay;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.updateThemeButtons = updateThemeButtons;
    window.chkAutoSave = chkAutoSave;
    window.chkAutoLoad = chkAutoLoad;
    window.chkDiceCloseModals = chkDiceCloseModals;
    window.validateImportData = validateImportData;
})();
