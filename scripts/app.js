// ── Apply Translations on Startup ──
applyTranslations();
refreshModuleLabels();

// ── Auto-Load on Startup ──
if (chkAutoLoad.checked && typeof TS !== 'undefined') {
    loadCharacter();
}
