// ── Text Box Module Type ──
(function () {
    function renderResolvedWithSpans(content) {
        if (!content || typeof content !== 'string') return '';
        if (!window.hasDiceVariables || !window.hasDiceVariables(content)) {
            return renderMarkdown(content);
        }

        var nonce = Math.random().toString(36).slice(2, 8);
        var TOKEN_RE = /\$\{([^}]+)\}/g;
        var entries = [];
        var idx = 0;

        TOKEN_RE.lastIndex = 0;
        var withPlaceholders = content.replace(TOKEN_RE, function (match, inner) {
            var placeholder = 'CVTOK' + nonce + idx++ + 'END';
            var resolved = window.resolveToken ? window.resolveToken(inner) : null;
            var displayName = window.getTokenDisplayName ? window.getTokenDisplayName(inner) : inner;
            entries.push({ placeholder, resolved, displayName });
            return placeholder;
        });

        var html = renderMarkdown(withPlaceholders);

        entries.forEach(function (entry) {
            var val = (entry.resolved !== null && entry.resolved !== undefined) ? String(entry.resolved) : '??';
            var broken = entry.resolved === null || entry.resolved === undefined;
            var cls = broken ? 'cv-resolved-token cv-resolved-token--broken' : 'cv-resolved-token';
            var safeName = entry.displayName.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var safeVal = val.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
            var span = '<span class="' + cls + '" data-token-display="' + safeName + '" data-token-resolved="' + safeVal + '">' + val + '</span>';
            html = html.split(entry.placeholder).join(span);
        });

        return html;
    }

    function attachTokenTooltips(displayEl) {
        displayEl.addEventListener('mouseover', function (e) {
            var span = e.target.closest ? e.target.closest('.cv-resolved-token') : null;
            if (!span) {
                if (typeof window.hideDiceVarTooltip === 'function') window.hideDiceVarTooltip();
                return;
            }
            if (typeof window.showDiceVarTooltip === 'function') {
                window.showDiceVarTooltip(
                    span.dataset.tokenDisplay + ' = ' + span.dataset.tokenResolved,
                    span.getBoundingClientRect()
                );
            }
        });
        displayEl.addEventListener('mouseleave', function () {
            if (typeof window.hideDiceVarTooltip === 'function') window.hideDiceVarTooltip();
        });
    }

    function openTextEditModal(moduleEl, data) {
        const existing = document.querySelector('.text-edit-overlay');
        if (existing) existing.remove();

        const snapshot = data.content || '';

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay text-edit-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('text.editTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';
        const textarea = document.createElement('textarea');
        textarea.className = 'cv-modal-input text-edit-textarea';
        textarea.placeholder = t('text.placeholder');
        textarea.value = snapshot;
        body.appendChild(textarea);
        panel.appendChild(body);

        if (typeof window.attachDiceVariablePicker === 'function') {
            window.attachDiceVariablePicker(textarea, { overlay: false });
        }

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('module.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('common.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        textarea.focus();

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
        }

        function doClose() {
            if (textarea.value !== snapshot) {
                showConfirm(
                    {
                        title: t('text.editTitle'),
                        message: t('text.discardPrompt'),
                        confirmText: t('module.cancel'),
                    },
                    closeModal
                );
            } else {
                closeModal();
            }
        }

        function doSave() {
            data.content = textarea.value;
            scheduleSave();
            const display = moduleEl.querySelector('.module-text-display');
            if (display) {
                display.innerHTML = renderResolvedWithSpans(data.content);
                attachCheckboxHandlers(display, data, moduleEl);
            }
            closeModal();
        }

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                doClose();
            }
        };
        document.addEventListener('keydown', keyHandler);
        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', doClose);
        closeXBtn.addEventListener('click', doClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) doClose();
        });
    }

    registerModuleType('text', {
        label: 'type.text',

        renderBody(bodyEl, data) {
            bodyEl.innerHTML = `<div class="module-text-display"></div>`;

            const display = bodyEl.querySelector('.module-text-display');

            attachTokenTooltips(display);

            display.innerHTML = renderResolvedWithSpans(data.content);
            attachCheckboxHandlers(display, data, bodyEl.closest('.module'));
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openTextEditModal(moduleEl, data),
                    label: t('text.editContent'),
                    icon: cvIcon('pencil', 14),
                },
                {
                    onClick: () =>
                        window.openSimpleSettingsModal(moduleEl, data, 'text-settings-overlay', 'text.settingsTitle'),
                    label: t('text.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
                {
                    onClick() {
                        window.copyTextToClipboard(data.content || '');
                    },
                    label: t('module.copyClipboard'),
                    icon: cvIcon('clipboard-copy', 14),
                },
            ];
        },
    });

    // ── Reactive Stat Listener ──
    document.addEventListener('cv:stat-values-changed', function () {
        (window.modules || []).forEach(function (mod) {
            if (mod.type !== 'text') return;
            const moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            const display = moduleEl && moduleEl.querySelector('.module-text-display');
            if (!display) return;
            display.innerHTML = renderResolvedWithSpans(mod.content);
            attachCheckboxHandlers(display, mod, moduleEl);
        });
    });
})();
