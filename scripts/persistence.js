// ── Save / Load System ──
(function () {
    window.activityLog = [];

    function migrateData(blob) {
        const migrators = {
            1: function (data) {
                data.tabs = [{ id: 'tab-1', name: 'Tab 1', order: 0, color: null }];
                data.activeTabId = 'tab-1';
                data.tabIdCounter = 1;
                if (Array.isArray(data.modules)) {
                    data.modules.forEach(function (m) { m.tabId = 'tab-1'; });
                }
                data.version = 2;
                return data;
            },
        };
        while (migrators[blob.version]) {
            console.log(`[CV] Migrating save data v${blob.version} → v${blob.version + 1}`);
            blob = migrators[blob.version](blob);
        }
        return blob;
    }

    function syncModuleState() {
        document.querySelectorAll('.module').forEach((el) => {
            const data = modules.find((m) => m.id === el.dataset.id);
            if (!data) return;
            const typeDef = MODULE_TYPES[data.type];
            if (typeDef?.syncState) typeDef.syncState(el, data);
        });
    }

    function serializeCharacter() {
        syncModuleState();
        return JSON.stringify({
            version: 2,
            savedAt: new Date().toISOString(),
            moduleIdCounter,
            tabIdCounter: window.getTabIdCounter(),
            gameSystem: window.gameSystem || 'custom',
            activityLog: window.activityLog || [],
            tabs: window.tabs.map(function (t) {
                return { id: t.id, name: t.name, order: t.order, color: t.color || null };
            }),
            activeTabId: window.activeTabId,
            modules: modules.map((m) => ({
                id: m.id,
                type: m.type,
                title: m.title || null,
                colSpan: m.colSpan,
                rowSpan: m.rowSpan,
                order: m.order,
                theme: m.theme || null,
                textLight: !!m.textLight,
                tabId: m.tabId || null,
                content: m.content ?? '',
            })),
        });
    }

    function deserializeCharacter(jsonStr) {
        let blob;
        try {
            blob = JSON.parse(jsonStr);
        } catch (e) {
            console.error('[CV] Failed to parse save data:', e);
            return false;
        }

        if (!blob?.version || !Array.isArray(blob.modules)) {
            console.error('[CV] Invalid save data structure');
            return false;
        }

        blob = migrateData(blob);

        // Clear existing modules
        document.querySelectorAll('.module').forEach((el) => el.remove());
        modules.length = 0;

        // Restore counter (ensure it's at least as high as max existing ID)
        moduleIdCounter = blob.moduleIdCounter || 0;
        window.gameSystem = blob.gameSystem || 'custom';
        localStorage.setItem('cv-game-system', window.gameSystem);
        if (typeof syncGameSystemUI === 'function') syncGameSystemUI();
        window.activityLog = Array.isArray(blob.activityLog) ? blob.activityLog : [];

        // Restore tab state
        window.tabs = Array.isArray(blob.tabs) ? blob.tabs : [];
        window.setTabIdCounter(blob.tabIdCounter || window.tabs.length);
        const savedTabId = blob.activeTabId;
        const validTabId = window.tabs.find(function (t) { return t.id === savedTabId; }) ? savedTabId : null;
        window.activeTabId = validTabId ?? (window.tabs[0]?.id ?? null);

        // Rebuild modules sorted by order (Phase 1: render all; Phase 2 will scope to active tab)
        blob.modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((saved) => {
                if (!MODULE_TYPES[saved.type]) {
                    console.warn(`[CV] Skipping unknown module type: ${saved.type}`);
                    return;
                }
                const data = {
                    id: saved.id,
                    type: saved.type,
                    title: saved.title || null,
                    colSpan: saved.colSpan ?? 2,
                    rowSpan: saved.rowSpan || null,
                    order: saved.order ?? 0,
                    theme: saved.theme || null,
                    textLight: !!saved.textLight,
                    tabId: saved.tabId || null,
                    content: saved.content ?? '',
                };
                modules.push(data);
                renderModule(data);
            });

        modules.forEach((m, i) => (m.order = i));
        if (typeof renderTabBar === 'function') renderTabBar();
        updateEmptyState();
        console.log(`[CV] Loaded ${modules.length} modules`);
        return true;
    }

    async function saveCharacter() {
        try {
            const data = serializeCharacter();
            await TS.localStorage.campaign.setBlob(data);
            console.log(`[CV] Saved (${data.length} bytes)`);
            return true;
        } catch (e) {
            console.error('[CV] Save failed:', e);
            return false;
        }
    }

    async function loadCharacter() {
        try {
            const data = await TS.localStorage.campaign.getBlob();
            if (!data) {
                console.log('[CV] No saved data found');
                return false;
            }
            return deserializeCharacter(data);
        } catch (e) {
            console.error('[CV] Load failed:', e);
            return false;
        }
    }

    let autoSaveTimer = null;
    function scheduleSave() {
        if (chkAutoSave.checked) {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(saveCharacter, 2000);
        }
    }

    window.migrateData = migrateData;
    window.syncModuleState = syncModuleState;
    window.serializeCharacter = serializeCharacter;
    window.deserializeCharacter = deserializeCharacter;
    window.saveCharacter = saveCharacter;
    window.loadCharacter = loadCharacter;
    window.scheduleSave = scheduleSave;
})();
