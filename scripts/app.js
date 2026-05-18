// ── Pending Roll Tracking ──
window.pendingRolls = {}; // rollId → { logEntryId } — populated by roll sites, consumed by handleRollResult

// ── Apply Translations on Startup ──
(function () {
    applyTranslations();
    refreshModuleLabels();

    async function init() {
        if (chkAutoLoad.checked && typeof TS !== 'undefined') {
            await loadCharacter();
        }
        // Fresh start or failed load — ensure at least one tab always exists
        if (window.tabs.length === 0) {
            const defaultTab = window.createTab();
            window.activeTabId = defaultTab.id;
            window.renderTabBar();
            window.updateEmptyState();
        }
    }
    init();
})();

window.onStateChangeEvent = function (event) {
    console.log('[CV] State change event:', event);
    if (event && event.kind === 'hasInitialized') {
        initSync();
    }
};
