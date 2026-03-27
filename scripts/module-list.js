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

    // ── Sortable Reorder ──
    function initListSortable(container, content) {
        if (container._sortable) container._sortable.destroy();
        container._sortable = new Sortable(container, {
            handle: '.list-item-drag-handle',
            animation: 150,
            ghostClass: 'list-item-ghost',
            draggable: '.list-item-row',
            onEnd(evt) {
                const rows = Array.from(container.querySelectorAll('.list-item-row'));
                const reordered = rows
                    .map(el => content.items.find(i => i.id === el.dataset.itemId))
                    .filter(Boolean);
                content.items = reordered;
                scheduleSave();
            }
        });
    }

    // ── Render List Body ──
    function renderListBody(bodyEl, data, isPlayMode) {
        const content = ensureContent(data);
        bodyEl.innerHTML = '';

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

            if (isPlayMode) {
                row.innerHTML = `
                    <span class="list-item-name">${escapeHtml(item.name || t('list.itemName'))}</span>
                    <button class="list-item-expand-btn" title="${escapeHtml(t('list.inspect'))}">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                `;
            } else {
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
            }

            container.appendChild(row);
        });

        bodyEl.appendChild(container);

        // Initialize SortableJS reorder in edit mode
        if (!isPlayMode && content.items.length > 1) {
            initListSortable(container, content);
        }
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
