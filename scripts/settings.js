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
