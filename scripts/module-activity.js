// ── Activity Log Module Type ──
(function () {
    'use strict';

    // ── ID Generation ──
    function generateLogEntryId() {
        return 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { sortOrder: 'newest', hiddenEventTypes: [], showTimestamps: true, maxEntries: 200 };
        }
        if (!Array.isArray(data.content.hiddenEventTypes)) data.content.hiddenEventTypes = [];
        if (data.content.sortOrder !== 'newest' && data.content.sortOrder !== 'oldest') data.content.sortOrder = 'newest';
        if (typeof data.content.showTimestamps !== 'boolean') data.content.showTimestamps = true;
        if (typeof data.content.maxEntries !== 'number') data.content.maxEntries = 200;
    }

    // ── Timestamp Formatting ──
    function formatTimestamp(epochMs) {
        const d = new Date(epochMs);
        const date = d.toLocaleDateString();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date + ' \u2013 ' + time;
    }

    // ── Confirmation Dialog ──
    // Reuses the same pattern as module-counters.js showConfirm()
    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = options.title || t('activity.clearAll');

        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        const title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = titleText;

        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = options.cancelText || t('delete.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = options.confirmText || t('delete.confirm');

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        panel.appendChild(title);
        panel.appendChild(msg);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(function () { overlay.remove(); }, 200);
        }

        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', function () { onConfirm(); close(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        requestAnimationFrame(function () {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    // ── Render Helpers ──

    function getVisibleEntries(content) {
        const log = window.activityLog || [];
        const hidden = new Set(content.hiddenEventTypes);
        let filtered = log.filter(function (entry) { return !hidden.has(entry.eventType); });

        if (content.sortOrder === 'newest') {
            filtered.sort(function (a, b) { return b.timestamp - a.timestamp; });
        } else {
            filtered.sort(function (a, b) { return a.timestamp - b.timestamp; });
        }

        return filtered;
    }

    function getUniqueEventTypes() {
        const log = window.activityLog || [];
        const types = new Set();
        log.forEach(function (entry) { types.add(entry.eventType); });
        return Array.from(types).sort();
    }

    function renderTagBar(container, content, onTagToggle) {
        container.innerHTML = '';
        const types = getUniqueEventTypes();
        if (types.length === 0) return;

        const hidden = new Set(content.hiddenEventTypes);

        types.forEach(function (eventType) {
            const tag = document.createElement('button');
            tag.className = 'activity-tag' + (hidden.has(eventType) ? '' : ' active');
            tag.textContent = t(eventType) !== eventType ? t(eventType) : eventType;
            tag.style.userSelect = 'none';
            tag.addEventListener('click', function () {
                onTagToggle(eventType);
            });
            container.appendChild(tag);
        });
    }

    function renderEntries(container, content, isPlayMode, data, bodyEl) {
        container.innerHTML = '';
        const entries = getVisibleEntries(content);

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'activity-empty-state';
            empty.style.userSelect = 'none';
            empty.textContent = t('activity.emptyState');
            container.appendChild(empty);
            return;
        }

        entries.forEach(function (entry) {
            const row = document.createElement('div');
            row.className = 'activity-entry';

            if (content.showTimestamps) {
                const ts = document.createElement('span');
                ts.className = 'activity-entry-timestamp';
                ts.style.userSelect = 'none';
                ts.textContent = formatTimestamp(entry.timestamp);
                row.appendChild(ts);
            }

            const msg = document.createElement('span');
            msg.className = 'activity-entry-message';
            msg.textContent = entry.message;
            row.appendChild(msg);

            if (!isPlayMode) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'activity-entry-delete';
                deleteBtn.title = t('activity.deleteEntry');
                deleteBtn.innerHTML =
                    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
                    '</svg>';
                deleteBtn.addEventListener('click', function () {
                    const idx = window.activityLog.findIndex(function (e) { return e.id === entry.id; });
                    if (idx !== -1) {
                        window.activityLog.splice(idx, 1);
                        scheduleSave();
                        renderActivityLogBody(bodyEl, data, isPlayMode);
                    }
                });
                row.appendChild(deleteBtn);
            }

            container.appendChild(row);
        });
    }

    function renderActivityLogBody(bodyEl, data, isPlayMode) {
        ensureContent(data);
        const content = data.content;

        const existingList = bodyEl.querySelector('.activity-entry-list');
        const wasAtBottom = !existingList ||
            (existingList.scrollHeight - existingList.scrollTop - existingList.clientHeight < 5);

        bodyEl.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'activity-container';

        // Tag bar
        const tagBar = document.createElement('div');
        tagBar.className = 'activity-tag-bar';

        renderTagBar(tagBar, content, function (eventType) {
            const idx = content.hiddenEventTypes.indexOf(eventType);
            if (idx !== -1) {
                content.hiddenEventTypes.splice(idx, 1);
            } else {
                content.hiddenEventTypes.push(eventType);
            }
            scheduleSave();
            renderActivityLogBody(bodyEl, data, isPlayMode);
        });

        wrapper.appendChild(tagBar);

        // Entry list
        const entryList = document.createElement('div');
        entryList.className = 'activity-entry-list';

        renderEntries(entryList, content, isPlayMode, data, bodyEl);

        wrapper.appendChild(entryList);
        bodyEl.appendChild(wrapper);

        if (content.sortOrder === 'oldest' && wasAtBottom) {
            entryList.scrollTop = entryList.scrollHeight;
        }
    }

    // ── Global logActivity() API ──
    window.logActivity = function (opts) {
        if (!opts || !opts.type || !opts.message) {
            console.warn('[CV] logActivity() called with invalid arguments:', opts);
            return;
        }

        const entry = {
            id: generateLogEntryId(),
            timestamp: Date.now(),
            eventType: opts.type,
            sourceModuleId: opts.sourceModuleId || null,
            message: opts.message,
        };

        window.activityLog.push(entry);

        // Enforce max entries across all Activity Log module instances (use smallest maxEntries)
        const activityModules = window.modules.filter(function (m) { return m.type === 'activity'; });
        let maxEntries = 200;
        activityModules.forEach(function (m) {
            if (m.content && typeof m.content.maxEntries === 'number' && m.content.maxEntries < maxEntries) {
                maxEntries = m.content.maxEntries;
            }
        });

        while (window.activityLog.length > maxEntries) {
            // Remove oldest entry
            let oldestIdx = 0;
            for (let i = 1; i < window.activityLog.length; i++) {
                if (window.activityLog[i].timestamp < window.activityLog[oldestIdx].timestamp) {
                    oldestIdx = i;
                }
            }
            window.activityLog.splice(oldestIdx, 1);
        }

        scheduleSave();

        // Re-render all Activity Log modules
        document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
            const modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
            if (modData) {
                const bodyEl = el.querySelector('.module-body');
                const isPlay = window.isPlayMode;
                renderActivityLogBody(bodyEl, modData, isPlay);
            }
        });

        console.log('[CV] Activity logged:', entry.eventType);
    };

    // ── Custom Select Builder ──
    // Builds a themed cv-select widget (trigger + dropdown menu).
    // Returns { el, getValue() } where el is the .cv-select root div.
    function buildCvSelect(options, currentValue, onChange) {
        const chevronSvg =
            '<svg class="cv-select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

        let selected = currentValue;

        const wrapper = document.createElement('div');
        wrapper.className = 'cv-select';
        wrapper.style.marginTop = '8px';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cv-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.style.userSelect = 'none';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'cv-select-value';
        const initialOpt = options.find(function (o) { return o.value === currentValue; });
        valueSpan.textContent = initialOpt ? initialOpt.label : '';
        trigger.appendChild(valueSpan);
        trigger.insertAdjacentHTML('beforeend', chevronSvg);

        const menu = document.createElement('ul');
        menu.className = 'cv-select-menu';
        menu.setAttribute('role', 'listbox');

        options.forEach(function (opt) {
            const li = document.createElement('li');
            li.className = 'cv-select-option' + (opt.value === selected ? ' selected' : '');
            li.dataset.value = String(opt.value);
            li.setAttribute('role', 'option');
            li.style.userSelect = 'none';
            li.textContent = opt.label;
            li.addEventListener('click', function () {
                selected = opt.value;
                menu.querySelectorAll('.cv-select-option').forEach(function (o) {
                    o.classList.toggle('selected', o.dataset.value === String(selected));
                });
                valueSpan.textContent = opt.label;
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.width = '';
                onChange(opt.value);
            });
            menu.appendChild(li);
        });

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = wrapper.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen);
            if (isOpen) {
                const rect = trigger.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = (rect.bottom + 4) + 'px';
                menu.style.left = rect.left + 'px';
                menu.style.width = rect.width + 'px';
            } else {
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.width = '';
            }
        });

        document.addEventListener('click', function () {
            if (wrapper.classList.contains('open')) {
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.width = '';
            }
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);

        return {
            el: wrapper,
            getValue: function () { return selected; },
        };
    }

    // ── Module Settings ──
    function openActivitySettings(moduleEl, data) {
        ensureContent(data);
        const existing = document.querySelector('.activity-settings-overlay');
        if (existing) existing.remove();

        const working = {
            sortOrder: data.content.sortOrder,
            showTimestamps: data.content.showTimestamps,
            maxEntries: data.content.maxEntries,
        };
        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay activity-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('activity.settingsTitle');
        const closeBtnEl = document.createElement('button');
        closeBtnEl.className = 'cv-modal-close';
        closeBtnEl.title = t('activity.close');
        closeBtnEl.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtnEl);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // Sort order
        const sortLabel = document.createElement('label');
        sortLabel.className = 'cv-modal-label';
        sortLabel.style.userSelect = 'none';
        sortLabel.textContent = t('activity.sortOrder');
        body.appendChild(sortLabel);

        const sortSelectWidget = buildCvSelect(
            [
                { value: 'newest', label: t('activity.sortNewest') },
                { value: 'oldest', label: t('activity.sortOldest') },
            ],
            working.sortOrder,
            function (val) { working.sortOrder = val; dirty = true; }
        );
        body.appendChild(sortSelectWidget.el);

        // Show timestamps toggle
        const tsLabel = document.createElement('label');
        tsLabel.className = 'cv-modal-label cv-modal-checkbox-label';
        tsLabel.style.userSelect = 'none';
        const tsCheckbox = document.createElement('input');
        tsCheckbox.type = 'checkbox';
        tsCheckbox.checked = working.showTimestamps;
        tsCheckbox.addEventListener('change', function () { working.showTimestamps = tsCheckbox.checked; dirty = true; });
        tsLabel.appendChild(tsCheckbox);
        tsLabel.appendChild(document.createTextNode('\u00a0' + t('activity.showTimestamps')));
        body.appendChild(tsLabel);

        // Max entries
        const maxLabel = document.createElement('label');
        maxLabel.className = 'cv-modal-label';
        maxLabel.style.userSelect = 'none';
        maxLabel.textContent = t('activity.maxEntries');
        body.appendChild(maxLabel);

        const maxSelectWidget = buildCvSelect(
            [50, 100, 200, 500, 1000].map(function (val) { return { value: val, label: String(val) }; }),
            working.maxEntries,
            function (val) { working.maxEntries = parseInt(val, 10); dirty = true; }
        );
        body.appendChild(maxSelectWidget.el);

        // Clear all button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn-danger activity-clear-all-btn';
        clearBtn.style.marginTop = '16px';
        clearBtn.textContent = t('activity.clearAll');
        clearBtn.addEventListener('click', function () {
            showConfirm(
                { title: t('activity.clearAll'), message: t('activity.clearAllConfirm') },
                function () {
                    window.activityLog.length = 0;
                    scheduleSave();
                    // Re-render all activity modules
                    document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
                        const modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
                        if (modData) {
                            const bEl = el.querySelector('.module-body');
                            renderActivityLogBody(bEl, modData, window.isPlayMode);
                        }
                    });
                }
            );
        });
        body.appendChild(clearBtn);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('activity.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('activity.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
        }

        function save() {
            data.content.sortOrder = working.sortOrder;
            data.content.showTimestamps = working.showTimestamps;
            data.content.maxEntries = working.maxEntries;
            scheduleSave();
            const bEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bEl, data, window.isPlayMode);
            close();
        }

        closeBtnEl.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', function (e) {
            if (e.target !== overlay) return;
            if (dirty && !window.confirm(t('common.discardChanges'))) return;
            close();
        });

        function onKeydown(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (dirty && !window.confirm(t('common.discardChanges'))) return;
                close();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    // ── Expose settings opener for toolbar button ──
    window.openActivitySettings = openActivitySettings;

    // ── Register Module Type ──
    registerModuleType('activity', {
        label: 'type.activity',

        renderBody: renderActivityLogBody,

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bodyEl, data, false);
        },
    });
})();
