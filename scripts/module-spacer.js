// ── Spacer Module Type ──
(function () {
    registerModuleType('spacer', {
        label: 'type.spacer',
        renderBody(bodyEl, data, isPlayMode) {
            bodyEl.innerHTML = `
            <div class="spacer-controls" style="${isPlayMode ? 'display:none' : ''}">
                <span class="spacer-drag-handle module-drag-handle">&#x2807;</span>
                <span class="spacer-label">${escapeHtml(t('type.spacer'))}</span>
                <button class="spacer-delete-btn" title="${escapeHtml(t('module.deleteModule'))}">${cvIcon('x', 12)}</button>
            </div>`;

            bodyEl.querySelector('.spacer-delete-btn').addEventListener('click', () => {
                openDeleteConfirm(data.id);
            });
        },
    });
})();
