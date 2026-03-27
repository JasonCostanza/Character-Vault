// ── List Module ──
// Flexible, attribute-extensible item lists for inventory, equipment, consumables, etc.
(function () {
    'use strict';

    // ── ID Generation ──
    function generateListId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { attributes: [], items: [], sortBy: null, sortDir: 'asc' };
        }
        if (!Array.isArray(data.content.attributes)) data.content.attributes = [];
        if (!Array.isArray(data.content.items)) data.content.items = [];
        if (data.content.sortBy === undefined) data.content.sortBy = null;
        if (!data.content.sortDir) data.content.sortDir = 'asc';
        return data.content;
    }

    // ── Preset Icon SVGs ──
    var LIST_ICON_SVG = {
        scale:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="4 7 12 3 20 7"/><line x1="4" y1="7" x2="4" y2="13"/><line x1="20" y1="7" x2="20" y2="13"/><path d="M4 13a4 4 0 0 0 8 0"/><path d="M12 13a4 4 0 0 0 8 0"/></svg>',
        armour: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/></svg>',
        helmet: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C7 2 3 6 3 11v3h2v-1a7 7 0 0 1 14 0v1h2v-3c0-5-4-9-9-9z"/><rect x="3" y="14" width="18" height="4" rx="1"/></svg>',
        power:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        sword:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="2" x2="7" y2="18"/><line x1="21" y1="6" x2="12" y2="6"/><path d="M5 20l2-2"/><path d="M3 22l2-2"/></svg>',
        apple:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1-1 3-1.5 4 0"/><path d="M17 6c2 2 3 5 2.5 9s-2.5 6-5.5 7c-1 .3-1.7.3-2 0-3-1-5-3-5.5-7S7 8 9 6c1-1 3-1 4 0s2-.5 4 0z"/></svg>'
    };

    // ── Built-in Attribute Presets ──
    var LIST_ATTR_PRESETS = [
        { key: 'presetWeight',      type: 'number',      icon: 'scale',  defaultValue: 0 },
        { key: 'presetDurability',   type: 'number-pair', icon: 'armour', defaultValue: { current: 0, max: 0 } },
        { key: 'presetEquipped',     type: 'toggle',      icon: 'helmet', defaultValue: false },
        { key: 'presetActive',       type: 'toggle',      icon: 'power',  defaultValue: false },
        { key: 'presetBroken',       type: 'toggle',      icon: 'sword',  defaultValue: false },
        { key: 'presetConsumable',   type: 'toggle',      icon: 'apple',  defaultValue: false }
    ];

    // ── Render Empty State ──
    function renderEmptyState(container) {
        container.innerHTML = `<div class="list-empty-state">${escapeHtml(t('list.emptyState'))}</div>`;
    }

    // ── Cross-List Item Transfer ──

    function getModuleDataFromContainer(container) {
        const moduleEl = container.closest('.module');
        if (!moduleEl) return null;
        return window.modules.find(m => m.id === moduleEl.dataset.id) || null;
    }

    function transferItem(itemId, sourceData, targetData) {
        const srcContent = ensureContent(sourceData);
        const tgtContent = ensureContent(targetData);

        // Find and remove item from source
        const itemIdx = srcContent.items.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return false;
        const item = srcContent.items.splice(itemIdx, 1)[0];

        // Merge attributes: add any source attributes missing from target
        srcContent.attributes.forEach(srcAttr => {
            const exists = tgtContent.attributes.find(a => a.id === srcAttr.id);
            if (!exists) {
                const clonedAttr = JSON.parse(JSON.stringify(srcAttr));
                tgtContent.attributes.push(clonedAttr);
                tgtContent.items.forEach(tgtItem => {
                    if (!tgtItem.values) tgtItem.values = {};
                    tgtItem.values[clonedAttr.id] = clonedAttr.defaultValue;
                });
            }
        });

        // Fill any target attributes the item is missing
        tgtContent.attributes.forEach(tgtAttr => {
            if (!item.values) item.values = {};
            if (!(tgtAttr.id in item.values)) {
                item.values[tgtAttr.id] = tgtAttr.defaultValue;
            }
        });

        // Add item to target
        item.order = tgtContent.items.length;
        tgtContent.items.push(item);

        return true;
    }

    // ── Sortable (Edit Mode — reorder + cross-list transfer) ──
    function initListSortable(container, data) {
        if (container._sortable) container._sortable.destroy();
        const content = ensureContent(data);
        container._sortable = new Sortable(container, {
            group: 'list-transfer',
            handle: '.list-item-drag-handle',
            animation: 150,
            ghostClass: 'list-item-ghost',
            draggable: '.list-item-row',

            onStart(evt) {
                // Highlight all other list modules as potential drop targets
                document.querySelectorAll('.module[data-type="list"]').forEach(mod => {
                    if (!mod.contains(evt.from)) {
                        mod.classList.add('list-drop-target');
                    }
                });
            },

            onEnd(evt) {
                // Remove all drop-target highlights
                document.querySelectorAll('.module.list-drop-target').forEach(mod => {
                    mod.classList.remove('list-drop-target');
                });

                // If item stayed in the same list, update reorder
                if (evt.from === evt.to) {
                    const rows = Array.from(container.querySelectorAll('.list-item-row'));
                    const reordered = rows
                        .map(el => content.items.find(i => i.id === el.dataset.itemId))
                        .filter(Boolean);
                    content.items = reordered;
                    scheduleSave();
                }
            },

            onAdd(evt) {
                // Item was dropped here from another list
                const itemId = evt.item.dataset.itemId;
                const sourceData = getModuleDataFromContainer(evt.from);
                const targetData = data;
                if (!sourceData || !targetData) return;

                const success = transferItem(itemId, sourceData, targetData);
                if (!success) return;

                console.log('[CV] Item transferred between lists:', itemId);

                // Re-render both modules
                const sourceModuleEl = evt.from.closest('.module');
                const targetModuleEl = evt.to.closest('.module');

                if (sourceModuleEl) {
                    const srcBody = sourceModuleEl.querySelector('.module-body');
                    renderListBody(srcBody, sourceData, false);
                    snapModuleHeight(sourceModuleEl, sourceData);
                }
                if (targetModuleEl) {
                    const tgtBody = targetModuleEl.querySelector('.module-body');
                    renderListBody(tgtBody, targetData, false);
                    snapModuleHeight(targetModuleEl, targetData);
                }

                scheduleSave();
            }
        });
    }

    // ── Render List Body ──
    function renderListBody(bodyEl, data, isPlayMode) {
        const content = ensureContent(data);
        // Destroy any existing SortableJS before clearing, so orphaned instances
        // don't linger in the group registry and interfere with future transfers
        const oldContainer = bodyEl.querySelector('.list-container');
        if (oldContainer && oldContainer._sortable) {
            oldContainer._sortable.destroy();
        }
        bodyEl.innerHTML = '';

        // Play mode: simple render, no sortable
        if (isPlayMode) {
            if (content.items.length === 0) {
                renderEmptyState(bodyEl);
                return;
            }
            const container = document.createElement('div');
            container.className = 'list-container';
            content.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'list-item-row';
                row.dataset.itemId = item.id;
                row.innerHTML = `
                    <span class="list-item-name">${escapeHtml(item.name || t('list.itemName'))}</span>
                    <button class="list-item-expand-btn" title="${escapeHtml(t('list.inspect'))}">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                `;
                container.appendChild(row);
            });
            bodyEl.appendChild(container);
            return;
        }

        // Edit mode: always create container (even if empty) so it can be a drop target
        const container = document.createElement('div');
        container.className = 'list-container';

        if (content.items.length === 0) {
            container.innerHTML = `<div class="list-empty-state">${escapeHtml(t('list.emptyState'))}</div>`;
        } else {
            content.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'list-item-row';
                row.dataset.itemId = item.id;
                row.innerHTML = `
                    <span class="list-item-drag-handle">&#x2807;</span>
                    <input class="list-item-name-input" type="text" value="${escapeHtml(item.name)}" placeholder="${escapeHtml(t('list.itemName'))}" />
                    <button class="list-item-delete-btn" title="${escapeHtml(t('list.deleteItem'))}">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                `;
                const nameInput = row.querySelector('.list-item-name-input');
                nameInput.addEventListener('input', () => {
                    item.name = nameInput.value;
                    scheduleSave();
                });
                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') nameInput.blur();
                });

                const deleteBtn = row.querySelector('.list-item-delete-btn');
                deleteBtn.addEventListener('click', () => {
                    const idx = content.items.findIndex(i => i.id === item.id);
                    if (idx !== -1) {
                        content.items.splice(idx, 1);
                        renderListBody(bodyEl, data, false);
                        snapModuleHeight(bodyEl.closest('.module'), data);
                        scheduleSave();
                    }
                });

                container.appendChild(row);
            });
        }

        bodyEl.appendChild(container);

        // Initialize SortableJS for reorder + cross-list transfer
        initListSortable(container, data);
    }

    // ── Add Item ──
    // Called from module-core.js toolbar button handler
    window.addListItem = function (moduleEl, data) {
        const content = ensureContent(data);
        const values = {};
        content.attributes.forEach(attr => {
            values[attr.id] = attr.defaultValue;
        });
        content.items.push({
            id: generateListId('item'),
            name: '',
            notes: '',
            order: content.items.length,
            values: values
        });
        const bodyEl = moduleEl.querySelector('.module-body');
        renderListBody(bodyEl, data, false);
        snapModuleHeight(moduleEl, data);
        scheduleSave();
        // Focus the new item's name input
        const rows = bodyEl.querySelectorAll('.list-item-name-input');
        if (rows.length > 0) rows[rows.length - 1].focus();
    };

    // ── Manage Attributes Panel ──

    function closeManageAttrsPanel(moduleEl, data) {
        var panel = moduleEl.querySelector('.list-manage-panel');
        if (!panel) return;
        panel.remove();
        // Re-render list body in edit mode
        var bodyEl = moduleEl.querySelector('.module-body');
        renderListBody(bodyEl, data, false);
        snapModuleHeight(moduleEl, data);
    }

    function openManageAttrsPanel(moduleEl, data) {
        closeManageAttrsPanel(moduleEl, data);
        var content = ensureContent(data);

        var panel = document.createElement('div');
        panel.className = 'list-manage-panel';

        renderManagePanelContent(panel, moduleEl, data, content);

        var bodyEl = moduleEl.querySelector('.module-body');
        bodyEl.appendChild(panel);
    }

    function renderManagePanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // ── Header ──
        var header = document.createElement('div');
        header.className = 'list-manage-header';
        header.innerHTML =
            '<span class="list-manage-title">' + escapeHtml(t('list.manageAttrs')) + '</span>' +
            '<button class="list-manage-close" title="' + escapeHtml(t('list.close')) + '">' +
                '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        header.querySelector('.list-manage-close').addEventListener('click', function () {
            closeManageAttrsPanel(moduleEl, data);
        });
        panel.appendChild(header);

        // ── Body (scrollable) ──
        var body = document.createElement('div');
        body.className = 'list-manage-body';

        // ── Current Attributes Section ──
        if (content.attributes.length === 0) {
            var noAttrs = document.createElement('div');
            noAttrs.className = 'list-manage-no-attrs';
            noAttrs.textContent = t('list.noAttrs');
            body.appendChild(noAttrs);
        } else {
            content.attributes.forEach(function (attr) {
                var row = document.createElement('div');
                row.className = 'list-attr-row';

                // Icon
                var iconSpan = document.createElement('span');
                iconSpan.className = 'list-attr-icon';
                if (attr.icon && LIST_ICON_SVG[attr.icon]) {
                    iconSpan.innerHTML = LIST_ICON_SVG[attr.icon];
                }
                row.appendChild(iconSpan);

                // Name
                var nameSpan = document.createElement('span');
                nameSpan.className = 'list-attr-name';
                nameSpan.textContent = attr.name;
                row.appendChild(nameSpan);

                // Type badge
                var typeBadge = document.createElement('span');
                typeBadge.className = 'list-attr-type-badge';
                typeBadge.textContent = t('list.attrType' + attr.type.charAt(0).toUpperCase() + attr.type.slice(1).replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }));
                row.appendChild(typeBadge);

                // Pin toggle
                var pinBtn = document.createElement('button');
                pinBtn.className = 'list-attr-pin-btn' + (attr.pinned ? ' pinned' : '');
                pinBtn.title = escapeHtml(t('list.pinnedLabel'));
                pinBtn.innerHTML = attr.pinned
                    ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v6l-2 4h4v7l1 2 1-2v-7h4l-2-4V4"/><line x1="8" y1="4" x2="16" y2="4"/></svg>'
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v6l-2 4h4v7l1 2 1-2v-7h4l-2-4V4"/><line x1="8" y1="4" x2="16" y2="4"/></svg>';
                pinBtn.addEventListener('click', function () {
                    attr.pinned = !attr.pinned;
                    scheduleSave();
                    renderManagePanelContent(panel, moduleEl, data, content);
                });
                row.appendChild(pinBtn);

                // Delete button
                var deleteBtn = document.createElement('button');
                deleteBtn.className = 'list-attr-delete-btn';
                deleteBtn.title = escapeHtml(t('list.deleteItem'));
                deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                deleteBtn.addEventListener('click', function () {
                    if (!confirm(t('list.removeAttrConfirm'))) return;
                    var idx = content.attributes.indexOf(attr);
                    if (idx !== -1) content.attributes.splice(idx, 1);
                    // Remove from all items
                    content.items.forEach(function (item) {
                        if (item.values) delete item.values[attr.id];
                    });
                    scheduleSave();
                    renderManagePanelContent(panel, moduleEl, data, content);
                });
                row.appendChild(deleteBtn);

                body.appendChild(row);
            });
        }

        // ── Add Preset Section ──
        var usedKeys = content.attributes
            .filter(function (a) { return a.builtIn; })
            .map(function (a) { return a.presetKey; });
        var availablePresets = LIST_ATTR_PRESETS.filter(function (p) {
            return usedKeys.indexOf(p.key) === -1;
        });

        if (availablePresets.length > 0) {
            var presetSection = document.createElement('div');
            presetSection.className = 'list-manage-section';

            var presetLabel = document.createElement('span');
            presetLabel.className = 'list-manage-section-label';
            presetLabel.textContent = t('list.addPreset');
            presetSection.appendChild(presetLabel);

            var presetGrid = document.createElement('div');
            presetGrid.className = 'list-preset-grid';

            availablePresets.forEach(function (preset) {
                var btn = document.createElement('button');
                btn.className = 'list-attr-preset-btn';
                var iconHtml = LIST_ICON_SVG[preset.icon] || '';
                btn.innerHTML = iconHtml + '<span>' + escapeHtml(t('list.' + preset.key)) + '</span>';
                btn.addEventListener('click', function () {
                    var defaultVal = typeof preset.defaultValue === 'object' && preset.defaultValue !== null
                        ? JSON.parse(JSON.stringify(preset.defaultValue))
                        : preset.defaultValue;
                    var newAttr = {
                        id: generateListId('attr'),
                        name: t('list.' + preset.key),
                        type: preset.type,
                        icon: preset.icon,
                        defaultValue: defaultVal,
                        pinned: false,
                        builtIn: true,
                        presetKey: preset.key
                    };
                    content.attributes.push(newAttr);
                    // Set default on all existing items
                    content.items.forEach(function (item) {
                        if (!item.values) item.values = {};
                        item.values[newAttr.id] = typeof newAttr.defaultValue === 'object' && newAttr.defaultValue !== null
                            ? JSON.parse(JSON.stringify(newAttr.defaultValue))
                            : newAttr.defaultValue;
                    });
                    console.log('[CV] Preset attribute added:', newAttr.name);
                    scheduleSave();
                    renderManagePanelContent(panel, moduleEl, data, content);
                });
                presetGrid.appendChild(btn);
            });

            presetSection.appendChild(presetGrid);
            body.appendChild(presetSection);
        }

        // ── Create Custom Button ──
        var customSection = document.createElement('div');
        customSection.className = 'list-manage-section';
        var customBtn = document.createElement('button');
        customBtn.className = 'list-custom-btn';
        customBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '<span>' + escapeHtml(t('list.createCustom')) + '</span>';
        customBtn.addEventListener('click', function () {
            console.log('[CV] Custom attribute wizard — not yet implemented');
        });
        customSection.appendChild(customBtn);
        body.appendChild(customSection);

        panel.appendChild(body);
    }

    window.openListManageAttrs = function (moduleEl, data) {
        openManageAttrsPanel(moduleEl, data);
    };

    // ── Module Type Registration ──
    registerModuleType('list', {
        label: 'type.list',

        renderBody(bodyEl, data, isPlayMode) {
            ensureContent(data);
            renderListBody(bodyEl, data, isPlayMode);
        },

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderListBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderListBody(bodyEl, data, false);
        },

        syncState(moduleEl, data) {
            const content = ensureContent(data);
            moduleEl.querySelectorAll('.list-item-row').forEach(row => {
                const item = content.items.find(i => i.id === row.dataset.itemId);
                if (!item) return;
                const nameInput = row.querySelector('.list-item-name-input');
                if (nameInput) item.name = nameInput.value;
            });
        }
    });

    console.log('[CV] List module registered');
})();
