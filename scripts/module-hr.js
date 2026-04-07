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
                <button class="hline-delete-btn" title="${escapeHtml(t('module.deleteModule'))}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
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
                // Also sync the header title input so persistence picks it up
                const headerInput = bodyEl.closest('.module')?.querySelector('.module-title-input');
                if (headerInput) headerInput.value = val;
                scheduleSave();
            });

            // Wire up delete button
            bodyEl.querySelector('.hline-delete-btn').addEventListener('click', () => {
                openDeleteConfirm(data.id);
            });
        },
        onPlayMode(moduleEl, data) {
            // Sync label text, show label, hide input
            const label = moduleEl.querySelector('.hline-label');
            const input = moduleEl.querySelector('.hline-input');
            if (label) {
                const defaultLabel = t('type.hline');
                label.textContent = data?.title && data.title !== defaultLabel ? data.title : '';
                label.style.display = '';
            }
            if (input) input.style.display = 'none';

            // Hide edit controls
            const dragHandle = moduleEl.querySelector('.hline-drag-handle');
            if (dragHandle) dragHandle.style.display = 'none';
            const deleteBtn = moduleEl.querySelector('.hline-delete-btn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        },
        onEditMode(moduleEl, data) {
            // Show input, hide static label
            const label = moduleEl.querySelector('.hline-label');
            const input = moduleEl.querySelector('.hline-input');
            if (label) label.style.display = 'none';
            if (input) {
                const defaultLabel = t('type.hline');
                input.value = data?.title && data.title !== defaultLabel ? data.title : '';
                input.style.display = '';
            }

            // Show edit controls
            const dragHandle = moduleEl.querySelector('.hline-drag-handle');
            if (dragHandle) dragHandle.style.display = '';
            const deleteBtn = moduleEl.querySelector('.hline-delete-btn');
            if (deleteBtn) deleteBtn.style.display = '';
        },
    });
})();
