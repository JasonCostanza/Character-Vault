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

            if (typeof window.attachDiceVariablePicker === 'function') {
                window.attachDiceVariablePicker(textarea, { overlay: false });
            }

            const display = bodyEl.querySelector('.module-text-display');

            attachTokenTooltips(display);

            document.addEventListener('cv:stat-values-changed', function () {
                if (display.style.display !== 'none') {
                    display.innerHTML = renderResolvedWithSpans(data.content);
                    attachCheckboxHandlers(display, data, bodyEl.closest('.module'));
                }
            });

            if (isPlayMode) {
                display.innerHTML = renderResolvedWithSpans(data.content);
                attachCheckboxHandlers(display, data, bodyEl.closest('.module'));
            }
        },

        onPlayMode(moduleEl) {
            const textarea = moduleEl.querySelector('.module-textarea');
            const display = moduleEl.querySelector('.module-text-display');
            if (textarea && display) {
                if (typeof window.hideDiceVarTooltip === 'function') window.hideDiceVarTooltip();
                const data = modules.find((m) => m.id === moduleEl.dataset.id);
                display.innerHTML = renderResolvedWithSpans(textarea.value);
                attachCheckboxHandlers(display, data, moduleEl);
                textarea.style.display = 'none';
                display.style.display = 'block';
            }
        },

        onLayoutMode(moduleEl) {
            const textarea = moduleEl.querySelector('.module-textarea');
            const display = moduleEl.querySelector('.module-text-display');
            if (textarea && display) {
                if (typeof window.hideDiceVarTooltip === 'function') window.hideDiceVarTooltip();
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
