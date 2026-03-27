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

    // ── Manage Attributes (placeholder for Phase 4) ──
    window.openListManageAttrs = function (moduleEl, data) {
        console.log('[CV] Manage Attributes — not yet implemented');
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
