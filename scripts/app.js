// ── Pending Roll Tracking ──
window.pendingRolls = {}; // rollId → { logEntryId } — populated by roll sites, consumed by handleRollResult

// ── Apply Translations on Startup ──
(function () {
    applyTranslations();
    refreshModuleLabels();

    // ── Auto-Load on Startup ──
    if (chkAutoLoad.checked && typeof TS !== 'undefined') {
        loadCharacter();
    }
})();
