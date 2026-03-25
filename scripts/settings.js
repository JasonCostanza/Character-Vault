// ── Mode Toggle ──
const modeToggle = document.getElementById('btn-mode-toggle');
modeToggle.addEventListener('click', () => {
    const isEdit = modeToggle.classList.contains('mode-edit');
    const label = modeToggle.querySelector('.mode-label');

    if (isEdit) {
        modeToggle.classList.replace('mode-edit', 'mode-play');
        label.textContent = t('menu.play');
        if (typeof sortable !== 'undefined') sortable.option('disabled', true);
        applyPlayMode();
    } else {
        modeToggle.classList.replace('mode-play', 'mode-edit');
        label.textContent = t('menu.edit');
        if (typeof sortable !== 'undefined') sortable.option('disabled', false);
        applyEditMode();
    }
});

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
const btnThemeDark = document.getElementById('btn-theme-dark');
const btnThemeLight = document.getElementById('btn-theme-light');

function updateThemeButtons(theme) {
    btnThemeDark.classList.toggle('active', theme === 'dark');
    btnThemeLight.classList.toggle('active', theme === 'light');
}

btnThemeDark.addEventListener('click', () => {
    setTheme('dark');
    updateThemeButtons('dark');
});

btnThemeLight.addEventListener('click', () => {
    setTheme('light');
    updateThemeButtons('light');
});

updateThemeButtons(localStorage.getItem('cv-theme') ?? 'dark');

// ── Language ──
const langSelect = document.getElementById('setting-language');

langSelect.addEventListener('change', (e) => {
    localStorage.setItem('cv-language', e.target.value);
    currentLang = e.target.value;
    applyTranslations();
    refreshModuleLabels();
});

langSelect.value = localStorage.getItem('cv-language') ?? 'en';

// ── Save / Load ──
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const chkAutoSave = document.getElementById('chk-auto-save');
const chkAutoLoad = document.getElementById('chk-auto-load');

btnSave.addEventListener('click', () => { saveCharacter(); });
btnLoad.addEventListener('click', () => { loadCharacter(); });

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

// ── GitHub Link (copy to clipboard) ──
document.getElementById('btn-github-link').addEventListener('click', () => {
    const btn = document.getElementById('btn-github-link');
    const url = 'https://github.com/JasonCostanza/Character-Vault';
    navigator.clipboard.writeText(url).then(() => {
        const originalText = btn.textContent.trim();
        const svgIcon = btn.querySelector('svg');
        // Show checkmark icon and "Copied!" text
        btn.classList.add('copied');
        if (svgIcon) svgIcon.style.display = 'none';
        btn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${t('settings.githubCopied')}`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> ${t('settings.github')}`;
        }, 1500);
    });
});
