// ── Spacer Module Type ──
(function () {
    registerModuleType('spacer', {
        label: 'type.spacer',
        renderBody(bodyEl, data, isPlayMode) {
            bodyEl.innerHTML = `
            <div class="spacer-controls" style="${isPlayMode ? 'display:none' : ''}">
                <span class="spacer-drag-handle module-drag-handle">&#x2807;</span>
                <span class="spacer-label">${escapeHtml(t('type.spacer'))}</span>
                <button class="spacer-delete-btn" title="${escapeHtml(t('module.deleteModule'))}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>`;

            bodyEl.querySelector('.spacer-delete-btn').addEventListener('click', () => {
                openDeleteConfirm(data.id);
            });
        },
        onPlayMode(moduleEl, data) {
            const controls = moduleEl.querySelector('.spacer-controls');
            if (controls) controls.style.display = 'none';
        },
        onLayoutMode(moduleEl, data) {
            const controls = moduleEl.querySelector('.spacer-controls');
            if (controls) controls.style.display = '';
        },
    });
})();
