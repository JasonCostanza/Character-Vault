// ── Horizontal Line Module Type ──
(function () {
    registerModuleType('hline', {
        label: 'type.hline',
        renderBody(bodyEl, data, isPlayMode) {
            const defaultLabel = t('type.hline');
            const labelText = data?.title && data.title !== defaultLabel ? data.title : '';

            bodyEl.innerHTML = `
            <div class="hline-divider">
                <span class="hline-drag-handle module-drag-handle" style="${isPlayMode ? 'display:none' : ''}">&#x2807;</span>
                <span class="hline-line"></span>
                <span class="hline-label">${escapeHtml(labelText)}</span>
                <input class="hline-input" type="text" value="${escapeHtml(labelText)}" placeholder="${escapeHtml(defaultLabel)}" />
                <span class="hline-line"></span>
                <button class="hline-delete-btn" title="${escapeHtml(t('module.deleteModule'))}" style="${isPlayMode ? 'display:none' : ''}">${cvIcon('x', 12)}</button>
            </div>`;

            const input = bodyEl.querySelector('.hline-input');
            const label = bodyEl.querySelector('.hline-label');

            // Show/hide based on initial mode
            input.style.display = isPlayMode ? 'none' : '';
            label.style.display = isPlayMode ? '' : 'none';

            // Sync input changes to data and label
            input.addEventListener('input', () => {
                const val = input.value.trim();
                data.title = val && val !== defaultLabel ? val : null;
                label.textContent = val;
                scheduleSave();
            });

            // Wire up delete button
            bodyEl.querySelector('.hline-delete-btn').addEventListener('click', () => {
                openDeleteConfirm(data.id);
            });
        },
    });
})();
