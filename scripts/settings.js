// ── Settings ──
(function () {
    // ── Mode Switcher ──
    const btnModeEdit = document.getElementById('btn-mode-edit');
    const btnModePlay = document.getElementById('btn-mode-play');

    window.isPlayMode = false;

    function _setMode(play) {
        window.isPlayMode = play;
        if (play) {
            btnModeEdit.classList.remove('active');
            btnModePlay.classList.add('active');
            if (typeof sortable !== 'undefined') sortable.option('disabled', true);
            applyPlayMode();
        } else {
            btnModePlay.classList.remove('active');
            btnModeEdit.classList.add('active');
            if (typeof sortable !== 'undefined') sortable.option('disabled', false);
            applyEditMode();
        }
    }

    btnModeEdit.addEventListener('click', () => _setMode(!window.isPlayMode));
    btnModePlay.addEventListener('click', () => _setMode(!window.isPlayMode));

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

    // ── Language ──
    const langSelect = document.getElementById('setting-language');

    langSelect.addEventListener('change', (e) => {
        localStorage.setItem('cv-language', e.target.value);
        window.currentLang = e.target.value;
        applyTranslations();
        refreshModuleLabels();
    });

    langSelect.value = localStorage.getItem('cv-language') ?? 'en';

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
    document.getElementById('btn-github-link').addEventListener('click', () => {
        const btn = document.getElementById('btn-github-link');
        const url = 'https://github.com/JasonCostanza/Character-Vault';

        // Create temporary input to copy text (fallback for TaleSpire's embedded browser)
        const tempInput = document.createElement('input');
        tempInput.type = 'text';
        tempInput.value = url;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();

        try {
            document.execCommand('copy');
            console.log('[CV] GitHub URL copied to clipboard');
            const svgIcon = btn.querySelector('svg');
            // Show checkmark icon and "Copied!" text
            btn.classList.add('copied');
            if (svgIcon) svgIcon.style.display = 'none';
            btn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${t('settings.githubCopied')}`;
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> ${t('settings.github')}`;
            }, 1500);
        } catch (err) {
            console.error('[CV] Failed to copy GitHub URL:', err);
            showToast('Failed to copy URL', 'error');
        } finally {
            document.body.removeChild(tempInput);
        }
    });

    window.settingsOverlay = settingsOverlay;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.updateThemeButtons = updateThemeButtons;
    window.chkAutoSave = chkAutoSave;
    window.chkAutoLoad = chkAutoLoad;
})();
