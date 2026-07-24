// ── i18n ──
(function () {
    window.currentLang = localStorage.getItem('cv-language') || 'en';

    function t(key, replacements) {
        const lang = CV_TRANSLATIONS[window.currentLang] || CV_TRANSLATIONS['en'];
        let str = lang[key] || CV_TRANSLATIONS['en'][key] || key;
        if (replacements) {
            Object.keys(replacements).forEach((k) => {
                str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), replacements[k]);
            });
        }
        return str;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.dataset.i18n;
            if (el.hasAttribute('data-i18n-html')) {
                el.innerHTML = t(key);
            } else {
                el.textContent = t(key);
            }
        });
        ['title', 'placeholder'].forEach((attr) => {
            document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
                el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
            });
        });
        document.querySelectorAll('[data-i18n-tip]').forEach((el) => {
            el.setAttribute('data-tip', t(el.getAttribute('data-i18n-tip')));
        });
    }

    function refreshModuleLabels() {
        document.querySelectorAll('.module').forEach((el) => {
            const data = modules.find((m) => m.id === el.dataset.id);
            if (!data) return;
            const typeDef = MODULE_TYPES[data.type];
            if (!typeDef) return;
            const titleLabel = el.querySelector('.module-type-label');
            if (titleLabel) titleLabel.textContent = data.title || t(typeDef.label);
            const resizeHandle = el.querySelector('.module-resize-handle');
            if (resizeHandle) resizeHandle.title = t('module.dragResize');
        });
    }

    window.t = t;
    window.applyTranslations = applyTranslations;
    window.refreshModuleLabels = refreshModuleLabels;
})();
