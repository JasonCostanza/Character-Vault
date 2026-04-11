// ── Save / Load System ──
(function () {
    window.activityLog = [];

    function migrateData(blob) {
        const migrators = {
            // Future: 1: (data) => { /* transform */ data.version = 2; return data; }
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
            version: 1,
            savedAt: new Date().toISOString(),
            moduleIdCounter,
            gameSystem: window.gameSystem || 'custom',
            activityLog: window.activityLog || [],
            modules: modules.map((m) => ({
                id: m.id,
                type: m.type,
                title: m.title || null,
                colSpan: m.colSpan,
                rowSpan: m.rowSpan,
                order: m.order,
                theme: m.theme || null,
                textLight: !!m.textLight,
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
        if (typeof syncGameSystemUI === 'function') syncGameSystemUI();
        window.activityLog = Array.isArray(blob.activityLog) ? blob.activityLog : [];

        // Rebuild modules sorted by order
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
                    content: saved.content ?? '',
                };
                modules.push(data);
                renderModule(data);
            });

        modules.forEach((m, i) => (m.order = i));
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
