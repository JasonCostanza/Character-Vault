// ── Horizontal Line Module Type ──
(function () {
    registerModuleType('hline', {
        label: 'type.hline',
        renderBody(bodyEl, data) {
            const defaultLabel = t('type.hline');
            const labelText = data?.title && data.title !== defaultLabel ? data.title : '';

            bodyEl.innerHTML = `
            <div class="hline-divider">
                <span class="hline-drag-handle module-drag-handle">&#x2807;</span>
                <span class="hline-line"></span>
                <span class="hline-label">${escapeHtml(labelText)}</span>
                <span class="hline-line"></span>
                <button class="hline-delete-btn" title="${escapeHtml(t('module.deleteModule'))}">${cvIcon('x', 12)}</button>
            </div>`;

            const label = bodyEl.querySelector('.hline-label');

            // Wire up delete button
            bodyEl.querySelector('.hline-delete-btn').addEventListener('click', () => {
                openDeleteConfirm(data.id);
            });

            // Ctrl+Click anywhere on the divider edits the label
            const divider = bodyEl.querySelector('.hline-divider');
            divider.addEventListener('click', (e) => {
                if (!e.ctrlKey) return;
                e.stopPropagation();
                window.openEditPopover(divider, {
                    label: defaultLabel,
                    value: data?.title && data.title !== defaultLabel ? data.title : '',
                    type: 'text',
                    onSave(val) {
                        data.title = val && val !== defaultLabel ? val : null;
                        label.textContent = val;
                        scheduleSave();
                    },
                });
            });
        },
    });
})();
