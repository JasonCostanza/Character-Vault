// ── Apply Translations on Startup ──
(function () {
    applyTranslations();
    refreshModuleLabels();

    // ── Auto-Load on Startup ──
    if (chkAutoLoad.checked && typeof TS !== 'undefined') {
        loadCharacter();
    }
})();
