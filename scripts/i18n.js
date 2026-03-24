// ── i18n ──
let currentLang = localStorage.getItem('cv-language') || 'en';

function t(key, replacements) {
    const lang = CV_TRANSLATIONS[currentLang] || CV_TRANSLATIONS['en'];
    let str = lang[key] || CV_TRANSLATIONS['en'][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(k => {
            str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), replacements[k]);
        });
    }
    return str;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    ['title', 'placeholder'].forEach(attr => {
        document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
            el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
        });
    });
    document.querySelectorAll('[data-i18n-tip]').forEach(el => {
        el.setAttribute('data-tip', t(el.getAttribute('data-i18n-tip')));
    });
}

function refreshModuleLabels() {
    document.querySelectorAll('.module').forEach(el => {
        const data = modules.find(m => m.id === el.dataset.id);
        if (!data) return;
        const typeDef = MODULE_TYPES[data.type];
        if (!typeDef) return;
        const titleLabel = el.querySelector('.module-type-label');
        const titleInput = el.querySelector('.module-title-input');
        if (titleLabel) titleLabel.textContent = data.title || t(typeDef.label);
        if (titleInput) titleInput.placeholder = t(typeDef.label);
        const copyBtn = el.querySelector('.module-copy-btn');
        if (copyBtn) copyBtn.title = t('module.copyClipboard');
        const deleteBtn = el.querySelector('.module-delete-btn');
        if (deleteBtn) deleteBtn.title = t('module.deleteModule');
        const resizeHandle = el.querySelector('.module-resize-handle');
        if (resizeHandle) resizeHandle.title = t('module.dragResize');
        const textarea = el.querySelector('.module-textarea');
        if (textarea) textarea.placeholder = t('text.placeholder');
        // Stat module labels
        const statAddBtn = el.querySelector('.stat-add-btn');
        if (statAddBtn) {
            statAddBtn.title = t('stat.addStat');
            const span = statAddBtn.querySelector('span');
            if (span) span.textContent = t('stat.addStat');
        }
        el.querySelectorAll('.stat-edit-delete').forEach(btn => {
            btn.title = t('stat.deleteStat');
        });
    });
    const label = modeToggle.querySelector('.mode-label');
    if (label) {
        label.textContent = modeToggle.classList.contains('mode-play') ? t('menu.play') : t('menu.edit');
    }
}
