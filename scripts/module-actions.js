// ── Action Tracker Module Type ──
(function () {
    'use strict';

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { layout: 'wrap', actions: [] };
        }
        if (!data.content.layout) data.content.layout = 'wrap';
        if (!Array.isArray(data.content.actions)) data.content.actions = [];
        return data.content;
    }

    // Default action names pre-populated per game system — plain data strings,
    // not translation keys, so users can freely rename/duplicate them.
    const SYSTEM_DEFAULTS = {
        dnd5e: ['Action', 'Bonus Action', 'Reaction'],
        pf2e: ['Action', 'Action', 'Action', 'Reaction'],
        coc: ['Action'],
        cpred: ['Move', 'Action'],
        daggerheart: ['Action'],
        mothership: ['Move', 'Action'],
        sr6: ['Major Action', 'Minor Action', 'Minor Action'],
        vtm: ['Action'],
        custom: [],
    };

    function actionTrackerDefaultContent() {
        const sys = window.gameSystem || 'custom';
        const defaults = SYSTEM_DEFAULTS[sys] || [];
        return {
            layout: 'wrap',
            actions: defaults.map(function (name) {
                return { id: generateId('act'), name: name, used: false };
            }),
        };
    }

    function resetAllActions(moduleId) {
        const mod = window.modules.find(function (m) {
            return m.id === moduleId;
        });
        if (!mod) return;
        mod.content.actions.forEach(function (a) {
            a.used = false;
        });
        scheduleSave();
    }

    // ── Re-render Helper ──
    function reRenderActionsModule(moduleEl, data) {
        const bodyEl = moduleEl.querySelector('.module-body');
        MODULE_TYPES['actions'].renderBody(bodyEl, data);
        snapModuleHeight(moduleEl, data);
    }

    // ── Pill Rendering ──
    function renderActionPill(action, content, moduleEl, data) {
        const pill = document.createElement('div');
        pill.className = 'actions-pill' + (action.used ? ' actions-pill-used' : '');
        pill.dataset.id = action.id;

        const handle = document.createElement('span');
        handle.className = 'actions-drag-handle';
        handle.innerHTML = '&#x2807;';
        pill.appendChild(handle);

        const nameEl = document.createElement('span');
        nameEl.className = 'actions-pill-name';
        nameEl.textContent = action.name;
        nameEl.title = action.name;
        nameEl.addEventListener('click', function () {
            action.used = !action.used;
            pill.classList.toggle('actions-pill-used', action.used);
            scheduleSave();
        });
        pill.appendChild(nameEl);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'actions-pill-delete';
        deleteBtn.title = t('actions.deleteAction');
        deleteBtn.innerHTML = cvIcon('x', 12);
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const idx = content.actions.findIndex(function (a) {
                return a.id === action.id;
            });
            if (idx !== -1) content.actions.splice(idx, 1);
            scheduleSave();
            reRenderActionsModule(moduleEl, data);
        });
        pill.appendChild(deleteBtn);

        return pill;
    }

    // ── SortableJS Reorder ──
    function initActionsSortable(listEl, content) {
        listEl._sortable = new Sortable(listEl, {
            handle: '.actions-drag-handle',
            animation: 150,
            ghostClass: 'cv-drag-ghost',
            draggable: '.actions-pill',
            direction: content.layout === 'list' ? 'vertical' : '',
            onEnd: function () {
                const rows = Array.from(listEl.querySelectorAll('.actions-pill'));
                const reordered = rows
                    .map(function (row) {
                        return content.actions.find(function (a) {
                            return a.id === row.dataset.id;
                        });
                    })
                    .filter(Boolean);
                content.actions = reordered;
                scheduleSave();
            },
        });
    }

    // ── Add Action Modal ──
    function openAddActionModal(moduleEl, data) {
        const existing = document.querySelector('.actions-add-overlay');
        if (existing) existing.remove();

        const content = ensureContent(data);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay actions-add-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel actions-add-modal';
        panel.innerHTML =
            '<div class="cv-modal-header">' +
            '<span class="cv-modal-title">' + escapeHtml(t('actions.addTitle')) + '</span>' +
            '<button type="button" class="cv-modal-close" title="' + escapeHtml(t('module.close')) + '">' +
            cvIcon('x', 12) +
            '</button>' +
            '</div>' +
            '<div class="cv-modal-body actions-add-body">' +
            '<input type="text" class="cv-modal-input actions-add-input" placeholder="' +
            escapeHtml(t('actions.namePlaceholder')) +
            '" spellcheck="false" autocomplete="off">' +
            '</div>' +
            '<div class="cv-modal-footer">' +
            '<button type="button" class="actions-add-cancel btn-secondary sm">' + escapeHtml(t('module.cancel')) + '</button>' +
            '<button type="button" class="actions-add-ok btn-primary sm">' + escapeHtml(t('actions.ok')) + '</button>' +
            '</div>';

        const input = panel.querySelector('.actions-add-input');
        const closeBtn = panel.querySelector('.cv-modal-close');
        const cancelBtn = panel.querySelector('.actions-add-cancel');
        const okBtn = panel.querySelector('.actions-add-ok');

        function confirm() {
            const name = input.value.trim();
            if (!name) {
                cancel();
                return;
            }
            content.actions.push({
                id: generateId('act'),
                name: name,
                used: false,
            });
            scheduleSave();
            cancel();
            reRenderActionsModule(moduleEl, data);
        }

        function cancel() {
            overlay.remove();
        }

        closeBtn.addEventListener('click', cancel);
        cancelBtn.addEventListener('click', cancel);
        okBtn.addEventListener('click', confirm);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cancel();
        });

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        input.focus();
    }

    // ── Settings Modal (auto-save, single Layout toggle) ──
    function openActionsSettings(moduleEl, data) {
        const existing = document.querySelector('.actions-settings-overlay');
        if (existing) existing.remove();

        const content = ensureContent(data);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay actions-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.innerHTML =
            '<div class="cv-modal-header">' +
            '<span class="cv-modal-title">' + escapeHtml(t('actions.settingsTitle')) + '</span>' +
            '<button type="button" class="cv-modal-close" title="' + escapeHtml(t('module.close')) + '">' + cvIcon('x', 12) + '</button>' +
            '</div>' +
            '<div class="cv-modal-body"></div>' +
            '<div class="cv-modal-footer">' +
            '<button type="button" class="btn-secondary sm">' + escapeHtml(t('module.close')) + '</button>' +
            '</div>';

        const body = panel.querySelector('.cv-modal-body');

        const layoutLabel = document.createElement('label');
        layoutLabel.className = 'cv-modal-label';
        layoutLabel.textContent = t('actions.layoutLabel');
        body.appendChild(layoutLabel);

        const layoutToggleLabel = document.createElement('span');
        layoutToggleLabel.className = 'cv-toggle-label';
        layoutToggleLabel.textContent = content.layout === 'list' ? t('actions.layoutList') : t('actions.layoutWrap');
        const layoutToggle = makeCvToggle(content.layout === 'list', function (checked) {
            content.layout = checked ? 'list' : 'wrap';
            layoutToggleLabel.textContent = checked ? t('actions.layoutList') : t('actions.layoutWrap');
            scheduleSave();
            reRenderActionsModule(moduleEl, data);
        });
        layoutToggle.appendChild(layoutToggleLabel);
        body.appendChild(layoutToggle);

        buildCommonSettingsSection(body, moduleEl, data);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }
        const keyHandler = function (e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                close();
            }
        };
        overlay._keyHandler = keyHandler;
        document.addEventListener('keydown', keyHandler);
        panel.querySelector('.cv-modal-close').addEventListener('click', close);
        panel.querySelector('.cv-modal-footer button').addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
    }

    // ── Module Type Registration ──
    registerModuleType('actions', {
        label: 'type.actions',

        renderBody: function (bodyEl, data) {
            const content = ensureContent(data);
            const container = document.createElement('div');
            container.className = 'actions-container' + (content.layout === 'list' ? ' actions-layout-list' : '');

            if (content.actions.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'actions-empty';
                empty.textContent = t('actions.empty');
                container.appendChild(empty);
            } else {
                const list = document.createElement('div');
                list.className = 'actions-pill-list';
                const moduleEl = bodyEl.closest('.module');
                content.actions.forEach(function (action) {
                    list.appendChild(renderActionPill(action, content, moduleEl, data));
                });
                container.appendChild(list);
                initActionsSortable(list, content);
            }

            const oldList = bodyEl.querySelector('.actions-pill-list');
            if (oldList && oldList._sortable) oldList._sortable.destroy();

            bodyEl.innerHTML = '';
            bodyEl.appendChild(container);
        },

        // Menu-only actions with no toolbar button — dispatched generically by
        // module-core.js's openOverflowMenu() via MODULE_TYPES[type].overflowMenuItems().
        overflowMenuItems: function (moduleEl, data) {
            return [
                {
                    onClick: function () {
                        openAddActionModal(moduleEl, data);
                    },
                    label: t('actions.add'),
                    icon: cvIcon('plus', 14),
                },
                {
                    onClick: function () {
                        resetAllActions(moduleEl.dataset.id);
                        reRenderActionsModule(moduleEl, data);
                    },
                    label: t('actions.resetAll'),
                    icon: cvIcon('rotate-ccw', 14),
                },
                {
                    onClick: function () {
                        showConfirm({ title: t('actions.deleteAll'), message: t('actions.deleteAllConfirm') }, function () {
                            data.content.actions = [];
                            scheduleSave();
                            reRenderActionsModule(moduleEl, data);
                        });
                    },
                    label: t('actions.deleteAll'),
                    icon: cvIcon('trash-2', 14),
                },
                {
                    onClick: function () {
                        openActionsSettings(moduleEl, data);
                    },
                    label: t('actions.settings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    // Expose for module-core toolbar wiring
    window.openAddActionModal = openAddActionModal;
    window.openActionsSettings = openActionsSettings;
    window.reRenderActionsModule = reRenderActionsModule;

    // Expose pure functions for vitest (rule 19/20)
    window.actionTrackerDefaultContent = actionTrackerDefaultContent;
    window.ensureActionTrackerContent = ensureContent;
    window.resetAllActions = resetAllActions;
})();
