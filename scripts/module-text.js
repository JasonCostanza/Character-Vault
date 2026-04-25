// ── Text Box Module Type ──
(function () {
    function autoResizeTextarea(textarea) {
        const module = textarea.closest('.module');
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    registerModuleType('text', {
        label: 'type.text',

        renderBody(bodyEl, data, isPlayMode) {
            bodyEl.innerHTML = `
            <textarea class="module-textarea" placeholder="${t('text.placeholder')}" style="display: ${isPlayMode ? 'none' : 'block'};">${escapeHtml(data.content)}</textarea>
            <div class="module-text-display" style="display: ${isPlayMode ? 'block' : 'none'};"></div>
        `;

            const textarea = bodyEl.querySelector('.module-textarea');
            textarea.addEventListener('input', () => {
                data.content = textarea.value;
                autoResizeTextarea(textarea);
                scheduleSave();
            });

            autoResizeTextarea(textarea);

            if (isPlayMode) {
                const display = bodyEl.querySelector('.module-text-display');
                display.innerHTML = renderMarkdown(data.content);
                attachCheckboxHandlers(display, data, bodyEl.closest('.module'));
            }
        },

        onPlayMode(moduleEl) {
            const textarea = moduleEl.querySelector('.module-textarea');
            const display = moduleEl.querySelector('.module-text-display');
            if (textarea && display) {
                const data = modules.find((m) => m.id === moduleEl.dataset.id);
                display.innerHTML = renderMarkdown(textarea.value);
                attachCheckboxHandlers(display, data, moduleEl);
                textarea.style.display = 'none';
                display.style.display = 'block';
            }
        },

        onLayoutMode(moduleEl) {
            const textarea = moduleEl.querySelector('.module-textarea');
            const display = moduleEl.querySelector('.module-text-display');
            if (textarea && display) {
                textarea.style.display = 'block';
                display.style.display = 'none';
                autoResizeTextarea(textarea);
            }
        },

        syncState(moduleEl, data) {
            const textarea = moduleEl.querySelector('.module-textarea');
            if (textarea) data.content = textarea.value;
        },
    });
})();
