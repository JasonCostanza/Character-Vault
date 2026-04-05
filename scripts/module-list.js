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
    // ── List Icon Library — references shared CV_ICONS ──
    const LIST_ICON_SVG = CV_ICONS;

    // ── Attribute Wizard Icon Library ──
    const ATTR_WIZARD_ICONS = [
        { key: null, label: 'None' },
        { key: 'apple', label: 'Apple' },
        { key: 'armour', label: 'Armour' },
        { key: 'axe', label: 'Axe' },
        { key: 'scale', label: 'Balance Scale' },
        { key: 'boots', label: 'Boots' },
        { key: 'bottle', label: 'Bottle of Water' },
        { key: 'bow', label: 'Bow' },
        { key: 'bread', label: 'Bread' },
        { key: 'coin', label: 'Coin' },
        { key: 'dagger', label: 'Dagger' },
        { key: 'flash', label: 'Flashlight' },
        { key: 'gem', label: 'Gem' },
        { key: 'gloves', label: 'Gloves' },
        { key: 'gun', label: 'Gun' },
        { key: 'hash', label: 'Hash' },
        { key: 'helmet', label: 'Helmet' },
        { key: 'key', label: 'Key' },
        { key: 'magnify', label: 'Magnifying Glass' },
        { key: 'pants', label: 'Pants' },
        { key: 'potion', label: 'Potion' },
        { key: 'power', label: 'Power Button' },
        { key: 'crosshair', label: 'Crosshair' },
        { key: 'shirt', label: 'T-Shirt' },
        { key: 'shoes', label: 'Shoes' },
        { key: 'staff', label: 'Staff' },
        { key: 'sword', label: 'Sword' },
        { key: 'torch', label: 'Torch' },
        { key: 'wand', label: 'Wand' },
    ];

    // ── Built-in Attribute Presets ──
    const LIST_ATTR_PRESETS = [
        { key: 'presetWeight', type: 'number', icon: 'scale', defaultValue: 0 },
        { key: 'presetQuantity', type: 'quantity', icon: 'hash', defaultValue: 1 },
        { key: 'presetDurability', type: 'number-pair', icon: 'armour', defaultValue: { current: 0, max: 0 } },
        { key: 'presetEquipped', type: 'toggle', icon: 'helmet', defaultValue: false },
        { key: 'presetActive', type: 'toggle', icon: 'power', defaultValue: false },
        { key: 'presetBroken', type: 'toggle', icon: 'sword', defaultValue: false },
        { key: 'presetConsumable', type: 'toggle', icon: 'apple', defaultValue: false },
        { key: 'presetDamage', type: 'text', icon: 'sword', defaultValue: '' },
        {
            key: 'presetBulk',
            type: 'dropdown',
            icon: 'shirt',
            defaultValue: 'XS',
            options: ['XS', 'S', 'M', 'L', 'XL'],
        },
    ];

    // ── Attribute Delete Confirmation ──
    function showAttrDeleteConfirm(attrName, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        const title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = t('list.removeAttrTitle');

        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = t('list.removeAttrConfirm', { name: attrName });

        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = t('delete.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = t('delete.confirm');

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
            document.removeEventListener('keydown', onKeyDown);
            setTimeout(function () {
                overlay.remove();
            }, 200);
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') close();
        }

        document.addEventListener('keydown', onKeyDown);
        cancelBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        confirmBtn.addEventListener('click', function () {
            close();
            onConfirm();
        });

        // Trigger open on next frame for CSS transition
        requestAnimationFrame(function () {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    // ── Render Empty State ──
    function renderEmptyState(container) {
        container.innerHTML = `<div class="list-empty-state">${escapeHtml(t('list.emptyState'))}</div>`;
    }

    // ── Sorted Items ──
    function getSortedItems(content) {
        const items = content.items.slice();
        if (content.sortBy === null) {
            items.sort(function (a, b) {
                return (a.order || 0) - (b.order || 0);
            });
            return items;
        }
        if (content.sortBy === '__name__') {
            const dir = content.sortDir === 'desc' ? -1 : 1;
            items.sort(function (a, b) {
                const an = (a.name || '').toLowerCase();
                const bn = (b.name || '').toLowerCase();
                return (an < bn ? -1 : an > bn ? 1 : 0) * dir;
            });
            return items;
        }
        const attrId = content.sortBy;
        const dir = content.sortDir === 'desc' ? -1 : 1;
        const attr = content.attributes.find(function (a) {
            return a.id === attrId;
        });
        const attrType = attr ? attr.type : 'text';
        items.sort(function (a, b) {
            const av = a.values ? a.values[attrId] : null;
            const bv = b.values ? b.values[attrId] : null;
            let result = 0;
            switch (attrType) {
                case 'toggle':
                    result = (av ? 1 : 0) - (bv ? 1 : 0);
                    break;
                case 'quantity':
                case 'number':
                    result = (parseFloat(av) || 0) - (parseFloat(bv) || 0);
                    break;
                case 'number-pair':
                    result =
                        (av && av.current != null ? parseFloat(av.current) || 0 : 0) -
                        (bv && bv.current != null ? parseFloat(bv.current) || 0 : 0);
                    break;
                case 'dropdown': {
                    const opts = attr.options || [];
                    const ai = opts.indexOf(av != null ? av : '');
                    const bi = opts.indexOf(bv != null ? bv : '');
                    result = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                    break;
                }
                default: {
                    const aStr = (av || '').toString().toLowerCase();
                    const bStr = (bv || '').toString().toLowerCase();
                    result = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                }
            }
            return result * dir;
        });
        return items;
    }

    // ── Attribute Value Cell ──
    function renderAttrValue(attr, value, isPlayMode, item, onUpdate) {
        const cell = document.createElement('div');
        cell.className = 'list-attr-cell list-attr-' + attr.type;

        if (attr.type === 'toggle') {
            const toggleIconSvg =
                attr.icon && LIST_ICON_SVG[attr.icon]
                    ? LIST_ICON_SVG[attr.icon]
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/></svg>';
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'list-attr-toggle-btn' + (value ? ' is-on' : ' is-off');
            toggleBtn.innerHTML = toggleIconSvg;
            toggleBtn.addEventListener('click', function () {
                const newVal = toggleBtn.classList.contains('is-off');
                toggleBtn.classList.toggle('is-on', newVal);
                toggleBtn.classList.toggle('is-off', !newVal);
                onUpdate(newVal);
            });
            cell.appendChild(toggleBtn);
            return cell;
        }

        if (attr.type === 'quantity') {
            let val = parseInt(value) || 0;
            if (isPlayMode) {
                const qtySpan = document.createElement('span');
                qtySpan.className = 'list-attr-quantity-display';
                qtySpan.textContent = val;
                qtySpan.title = t('list.attrTypeQuantityDesc');
                qtySpan.addEventListener('click', function (e) {
                    val++;
                    qtySpan.textContent = val;
                    onUpdate(val);
                });
                qtySpan.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    val--;
                    qtySpan.textContent = val;
                    onUpdate(val);
                });
                cell.appendChild(qtySpan);
            } else {
                const qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.className = 'list-attr-number-input';
                qtyInput.value = val;
                qtyInput.addEventListener('input', function () {
                    onUpdate(parseInt(qtyInput.value) || 0);
                });
                qtyInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === 'Escape') qtyInput.blur();
                });
                cell.appendChild(qtyInput);
            }
            return cell;
        }

        if (attr.type === 'number') {
            if (isPlayMode) {
                const numSpan = document.createElement('span');
                numSpan.className = 'list-attr-number-display';
                numSpan.textContent = value != null ? value : 0;
                cell.appendChild(numSpan);
            } else {
                const numInput = document.createElement('input');
                numInput.type = 'number';
                numInput.className = 'list-attr-number-input';
                numInput.value = value != null ? value : 0;
                numInput.addEventListener('input', function () {
                    onUpdate(parseFloat(numInput.value) || 0);
                });
                numInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === 'Escape') numInput.blur();
                });
                cell.appendChild(numInput);
            }
            return cell;
        }

        if (attr.type === 'number-pair') {
            const pairCur = value && value.current != null ? value.current : 0;
            const pairMax = value && value.max != null ? value.max : 0;
            if (isPlayMode) {
                const pairSpan = document.createElement('span');
                pairSpan.className = 'list-attr-pair-display';
                pairSpan.textContent = pairCur + ' / ' + pairMax;
                cell.appendChild(pairSpan);
            } else {
                const curInput = document.createElement('input');
                curInput.type = 'number';
                curInput.className = 'list-attr-pair-input';
                curInput.value = pairCur;
                const pairSep = document.createElement('span');
                pairSep.className = 'list-attr-pair-sep';
                pairSep.textContent = '/';
                const maxInput = document.createElement('input');
                maxInput.type = 'number';
                maxInput.className = 'list-attr-pair-input';
                maxInput.value = pairMax;
                const updatePair = function () {
                    onUpdate({ current: parseFloat(curInput.value) || 0, max: parseFloat(maxInput.value) || 0 });
                };
                curInput.addEventListener('input', updatePair);
                maxInput.addEventListener('input', updatePair);
                curInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === 'Escape') curInput.blur();
                });
                maxInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === 'Escape') maxInput.blur();
                });
                cell.appendChild(curInput);
                cell.appendChild(pairSep);
                cell.appendChild(maxInput);
            }
            return cell;
        }

        if (attr.type === 'dropdown') {
            const opts = attr.options || [];
            if (isPlayMode) {
                const dropSpan = document.createElement('span');
                dropSpan.className = 'list-attr-dropdown-display';
                dropSpan.textContent = value != null ? value : opts[0] || '';
                cell.appendChild(dropSpan);
            } else {
                const sel = document.createElement('select');
                sel.className = 'list-attr-dropdown-select';
                opts.forEach(function (opt) {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === value) option.selected = true;
                    sel.appendChild(option);
                });
                sel.addEventListener('change', function () {
                    onUpdate(sel.value);
                });
                cell.appendChild(sel);
            }
            return cell;
        }

        // text
        if (isPlayMode) {
            const txtSpan = document.createElement('span');
            txtSpan.className = 'list-attr-text-display';
            txtSpan.textContent = value != null ? value : '';
            cell.appendChild(txtSpan);
        } else {
            const txtInput = document.createElement('input');
            txtInput.type = 'text';
            txtInput.className = 'list-attr-text-input';
            txtInput.value = value != null ? value : '';
            txtInput.addEventListener('input', function () {
                onUpdate(txtInput.value);
            });
            txtInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === 'Escape') txtInput.blur();
            });
            cell.appendChild(txtInput);
        }
        return cell;
    }

    // ── Column Headers ──
    function renderColumnHeaders(content, bodyEl, data, isPlayMode, isSorted) {
        const pinnedAttrs = content.attributes.filter(function (a) {
            return a.pinned;
        });

        const headerRow = document.createElement('div');
        headerRow.className = 'list-header-row' + (!isPlayMode && !isSorted ? ' cols-draggable' : '');

        // Handle spacer — matches drag handle width when handles are visible
        if (!isPlayMode && !isSorted) {
            const handleSpacer = document.createElement('div');
            handleSpacer.className = 'list-col-handle-spacer';
            headerRow.appendChild(handleSpacer);
        }

        // Name column header — sortable (alphabetical)
        const nameIsActive = content.sortBy === '__name__';
        const nameHeader = document.createElement('div');
        nameHeader.className = 'list-col-header list-col-name' + (nameIsActive ? ' active-sort' : '');
        nameHeader.title = escapeHtml(
            nameIsActive ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual')) : t('list.sortAsc')
        );

        const nameLabel = document.createElement('span');
        nameLabel.className = 'list-col-header-label';
        nameLabel.textContent = t('list.colName');
        nameHeader.appendChild(nameLabel);

        if (nameIsActive) {
            const nameIndicator = document.createElement('span');
            nameIndicator.className = 'list-sort-indicator';
            nameIndicator.innerHTML = content.sortDir === 'asc' ? CV_SVG_SORT_UP : CV_SVG_SORT_DOWN;
            nameHeader.appendChild(nameIndicator);
        }

        nameHeader.addEventListener('click', function () {
            if (content.sortBy === '__name__') {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = '__name__';
                content.sortDir = 'asc';
            }
            scheduleSave();
            renderListBody(bodyEl, data, isPlayMode);
        });

        headerRow.appendChild(nameHeader);

        // One column per pinned attribute
        pinnedAttrs.forEach(function (attr) {
            const isActive = content.sortBy === attr.id;
            const colHeader = document.createElement('div');
            colHeader.className = 'list-col-header list-col-attr' + (isActive ? ' active-sort' : '');
            colHeader.dataset.attrId = attr.id;
            colHeader.title = escapeHtml(
                isActive ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual')) : t('list.sortAsc')
            );

            const label = document.createElement('span');
            label.className = 'list-col-header-label';
            label.textContent = attr.name;
            colHeader.appendChild(label);

            if (isActive) {
                const indicator = document.createElement('span');
                indicator.className = 'list-sort-indicator';
                indicator.innerHTML = content.sortDir === 'asc' ? CV_SVG_SORT_UP : CV_SVG_SORT_DOWN;
                colHeader.appendChild(indicator);
            }

            colHeader.addEventListener('click', function () {
                if (content.sortBy === attr.id) {
                    if (content.sortDir === 'asc') {
                        content.sortDir = 'desc';
                    } else {
                        content.sortBy = null;
                        content.sortDir = 'asc';
                    }
                } else {
                    content.sortBy = attr.id;
                    content.sortDir = 'asc';
                }
                scheduleSave();
                renderListBody(bodyEl, data, isPlayMode);
            });

            headerRow.appendChild(colHeader);
        });

        // Actions spacer — matches delete/expand button width
        const actionsSpacer = document.createElement('div');
        actionsSpacer.className = 'list-col-header list-col-actions';
        headerRow.appendChild(actionsSpacer);

        return headerRow;
    }

    // ── Cross-List Item Transfer ──

    function getModuleDataFromContainer(container) {
        const moduleEl = container.closest('.module');
        if (!moduleEl) return null;
        return window.modules.find((m) => m.id === moduleEl.dataset.id) || null;
    }

    function transferItem(itemId, sourceData, targetData) {
        const srcContent = ensureContent(sourceData);
        const tgtContent = ensureContent(targetData);

        // Find and remove item from source
        const itemIdx = srcContent.items.findIndex((i) => i.id === itemId);
        if (itemIdx === -1) return false;
        const item = srcContent.items.splice(itemIdx, 1)[0];

        // Track ID mapping from source attr -> target attr
        const attrMapping = {};

        // Merge attributes: Match by name + type
        srcContent.attributes.forEach((srcAttr) => {
            const exists = tgtContent.attributes.find((a) => a.name === srcAttr.name && a.type === srcAttr.type);

            if (exists) {
                // Feature exists, map source ID to existing target ID
                attrMapping[srcAttr.id] = exists.id;
            } else {
                // Feature doesn't exist, bring it over
                const clonedAttr = JSON.parse(JSON.stringify(srcAttr));
                tgtContent.attributes.push(clonedAttr);
                attrMapping[srcAttr.id] = clonedAttr.id;

                // Give existing target items the default value for this new attribute
                tgtContent.items.forEach((tgtItem) => {
                    if (!tgtItem.values) tgtItem.values = {};
                    tgtItem.values[clonedAttr.id] = clonedAttr.defaultValue;
                });
            }
        });

        // Re-key the transferred item's values to use target attribute IDs
        const newValues = {};
        if (item.values) {
            Object.keys(item.values).forEach((oldId) => {
                if (attrMapping[oldId]) {
                    newValues[attrMapping[oldId]] = item.values[oldId];
                }
            });
        }
        item.values = newValues;

        // Fill any target attributes the item is missing
        tgtContent.attributes.forEach((tgtAttr) => {
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
                document.querySelectorAll('.module[data-type="list"]').forEach((mod) => {
                    if (!mod.contains(evt.from)) {
                        mod.classList.add('list-drop-target');
                    }
                });
            },

            onEnd(evt) {
                // Remove all drop-target highlights
                document.querySelectorAll('.module.list-drop-target').forEach((mod) => {
                    mod.classList.remove('list-drop-target');
                });

                // If item stayed in the same list, update reorder
                if (evt.from === evt.to) {
                    const rows = Array.from(container.querySelectorAll('.list-item-row'));
                    const reordered = rows
                        .map((el) => content.items.find((i) => i.id === el.dataset.itemId))
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
            },
        });
    }

    // ── Column Header Sortable (Edit Mode — reorder columns) ──
    function initColumnSortable(headerRow, content, bodyEl, data) {
        if (!headerRow) return;
        headerRow._colSortable = new Sortable(headerRow, {
            draggable: '.list-col-attr',
            animation: 150,
            ghostClass: 'list-col-ghost',
            onEnd: function () {
                const newPinnedIds = Array.from(headerRow.querySelectorAll('.list-col-attr')).map(function (el) {
                    return el.dataset.attrId;
                });
                const pinnedInNewOrder = newPinnedIds
                    .map(function (id) {
                        return content.attributes.find(function (a) {
                            return a.id === id;
                        });
                    })
                    .filter(Boolean);
                let pinnedIdx = 0;
                content.attributes = content.attributes.map(function (a) {
                    return a.pinned ? pinnedInNewOrder[pinnedIdx++] : a;
                });
                scheduleSave();
                renderListBody(bodyEl, data, false);
            },
        });
    }

    // ── Render List Body ──
    function renderListBody(bodyEl, data, isPlayMode) {
        const content = ensureContent(data);
        const moduleEl = bodyEl.closest('.module');
        // Destroy any existing SortableJS before clearing, so orphaned instances
        // don't linger in the group registry and interfere with future transfers
        const oldContainer = bodyEl.querySelector('.list-container');
        if (oldContainer && oldContainer._sortable) {
            oldContainer._sortable.destroy();
        }
        const oldHeaderRow = bodyEl.querySelector('.list-header-row');
        if (oldHeaderRow && oldHeaderRow._colSortable) {
            oldHeaderRow._colSortable.destroy();
        }
        bodyEl.innerHTML = '';

        // Play mode with no items: just show empty state
        if (isPlayMode && content.items.length === 0) {
            renderEmptyState(bodyEl);
            return;
        }

        const pinnedAttrs = content.attributes.filter((a) => a.pinned);
        const isSorted = content.sortBy !== null;
        const sortedItems = getSortedItems(content);
        const hasItems = content.items.length > 0;
        const hasColumns = pinnedAttrs.length > 0;
        // Show header row whenever there are items so the Name column is always sortable
        const showHeader = hasItems;

        // Always create container (even if empty) so it can be a drop target in edit mode
        const container = document.createElement('div');
        container.className = 'list-container';

        // Column headers — always shown when there are items
        if (showHeader) {
            const headerRow = renderColumnHeaders(content, bodyEl, data, isPlayMode, isSorted);
            if (headerRow) {
                container.appendChild(headerRow);
                if (!isPlayMode && !isSorted) {
                    initColumnSortable(headerRow, content, bodyEl, data);
                }
            }
        }

        if (!hasItems) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'list-empty-state';
            emptyDiv.textContent = t('list.emptyState');
            container.appendChild(emptyDiv);
        } else {
            sortedItems.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'list-item-row' + (showHeader ? ' has-columns' : '');
                row.dataset.itemId = item.id;
                if (moduleEl) row.dataset.moduleId = moduleEl.dataset.id;

                if (isPlayMode) {
                    // Name
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'list-item-name';
                    nameSpan.textContent = item.name || t('list.itemName');
                    row.appendChild(nameSpan);

                    // Pinned attribute value cells
                    pinnedAttrs.forEach((attr) => {
                        const val =
                            item.values && item.values[attr.id] != null ? item.values[attr.id] : attr.defaultValue;
                        row.appendChild(renderAttrValue(attr, val, true, item, function () {}));
                    });

                    // Expand button
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'list-item-expand-btn';
                    expandBtn.title = escapeHtml(t('list.inspectTitle'));
                    expandBtn.innerHTML =
                        '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
                    expandBtn.addEventListener('click', function () {
                        openItemInspect(moduleEl, data, item.id);
                    });
                    row.appendChild(expandBtn);
                } else {
                    // Drag handle — only when not sorted
                    if (!isSorted) {
                        const handle = document.createElement('span');
                        handle.className = 'list-item-drag-handle';
                        handle.innerHTML = '&#x2807;';
                        row.appendChild(handle);
                    }

                    // Name input
                    const nameInput = document.createElement('input');
                    nameInput.className = 'list-item-name-input';
                    nameInput.type = 'text';
                    nameInput.value = item.name;
                    nameInput.placeholder = t('list.itemName');
                    nameInput.addEventListener('input', () => {
                        item.name = nameInput.value;
                        scheduleSave();
                    });
                    nameInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') nameInput.blur();
                    });
                    row.appendChild(nameInput);

                    // Pinned attribute value cells
                    pinnedAttrs.forEach((attr) => {
                        const val =
                            item.values && item.values[attr.id] != null ? item.values[attr.id] : attr.defaultValue;
                        const attrCell = renderAttrValue(attr, val, false, item, function (newVal) {
                            if (!item.values) item.values = {};
                            item.values[attr.id] = newVal;
                            scheduleSave();
                        });
                        row.appendChild(attrCell);
                    });

                    // Delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'list-item-delete-btn';
                    deleteBtn.title = escapeHtml(t('list.deleteItem'));
                    deleteBtn.innerHTML =
                        '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                    deleteBtn.addEventListener('click', () => {
                        const idx = content.items.findIndex((i) => i.id === item.id);
                        if (idx !== -1) {
                            content.items.splice(idx, 1);
                            renderListBody(bodyEl, data, false);
                            snapModuleHeight(bodyEl.closest('.module'), data);
                            scheduleSave();
                        }
                    });
                    row.appendChild(deleteBtn);
                }

                container.appendChild(row);
            });
        }

        bodyEl.appendChild(container);

        // Initialize SortableJS only in edit mode and only when not sorted
        if (!isPlayMode && !isSorted) {
            initListSortable(container, data);
        }
    }

    // ── Add Item ──
    // Called from module-core.js toolbar button handler
    window.addListItem = function (moduleEl, data) {
        const content = ensureContent(data);
        const values = {};
        content.attributes.forEach((attr) => {
            values[attr.id] = attr.defaultValue;
        });
        content.items.push({
            id: generateListId('item'),
            name: '',
            notes: '',
            order: content.items.length,
            values: values,
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
        const overlay = document.querySelector('.list-manage-overlay');
        if (!overlay) return;
        overlay.remove();
        // Re-render list body in edit mode
        const bodyEl = moduleEl.querySelector('.module-body');
        renderListBody(bodyEl, data, false);
        snapModuleHeight(moduleEl, data);
    }

    function openManageAttrsPanel(moduleEl, data) {
        closeManageAttrsPanel(moduleEl, data);
        const content = ensureContent(data);

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay list-manage-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel list-manage-modal';

        renderManagePanelContent(panel, moduleEl, data, content);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Close on overlay background click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeManageAttrsPanel(moduleEl, data);
        });

        // Close on Escape
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeManageAttrsPanel(moduleEl, data);
        });
        overlay.setAttribute('tabindex', '-1');
        overlay.focus();
    }

    function renderManagePanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        header.innerHTML =
            '<span class="cv-modal-title">' +
            escapeHtml(t('list.manageAttrs')) +
            '</span>' +
            '<button class="cv-modal-close" title="' +
            escapeHtml(t('list.close')) +
            '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        header.querySelector('.cv-modal-close').addEventListener('click', function () {
            closeManageAttrsPanel(moduleEl, data);
        });
        panel.appendChild(header);

        // ── Body (scrollable) ──
        const body = document.createElement('div');
        body.className = 'cv-modal-body list-manage-body';

        // ── Current Attributes Section ──
        if (content.attributes.length === 0) {
            const noAttrs = document.createElement('div');
            noAttrs.className = 'list-manage-no-attrs';
            noAttrs.textContent = t('list.noAttrs');
            body.appendChild(noAttrs);
        } else {
            content.attributes.forEach(function (attr) {
                const row = document.createElement('div');
                row.className = 'list-attr-row';

                // Icon
                const iconSpan = document.createElement('span');
                iconSpan.className = 'list-attr-icon';
                if (attr.icon && LIST_ICON_SVG[attr.icon]) {
                    iconSpan.innerHTML = LIST_ICON_SVG[attr.icon];
                }
                row.appendChild(iconSpan);

                // Name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'list-attr-name';
                nameSpan.textContent = attr.name;
                row.appendChild(nameSpan);

                // Type badge
                const typeBadge = document.createElement('span');
                typeBadge.className = 'list-attr-type-badge';
                typeBadge.textContent = t(
                    'list.attrType' +
                        attr.type.charAt(0).toUpperCase() +
                        attr.type.slice(1).replace(/-([a-z])/g, function (m, c) {
                            return c.toUpperCase();
                        })
                );
                row.appendChild(typeBadge);

                // Pin toggle
                const pinBtn = document.createElement('button');
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
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'list-attr-delete-btn';
                deleteBtn.title = escapeHtml(t('list.deleteItem'));
                deleteBtn.innerHTML =
                    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                deleteBtn.addEventListener('click', function () {
                    showAttrDeleteConfirm(attr.name, function () {
                        const idx = content.attributes.indexOf(attr);
                        if (idx !== -1) content.attributes.splice(idx, 1);
                        // Reset sort if the removed attribute was the active sort column
                        if (content.sortBy === attr.id) {
                            content.sortBy = null;
                            content.sortDir = 'asc';
                        }
                        // Remove from all items
                        content.items.forEach(function (item) {
                            if (item.values) delete item.values[attr.id];
                        });
                        scheduleSave();
                        renderManagePanelContent(panel, moduleEl, data, content);
                    });
                });
                row.appendChild(deleteBtn);

                body.appendChild(row);
            });
        }

        // ── Add Preset Section ──
        const usedKeys = content.attributes
            .filter(function (a) {
                return a.builtIn;
            })
            .map(function (a) {
                return a.presetKey;
            });
        const availablePresets = LIST_ATTR_PRESETS.filter(function (p) {
            return usedKeys.indexOf(p.key) === -1;
        });

        if (availablePresets.length > 0) {
            const presetSection = document.createElement('div');
            presetSection.className = 'list-manage-section';

            const presetLabel = document.createElement('span');
            presetLabel.className = 'list-manage-section-label';
            presetLabel.textContent = t('list.addPreset');
            presetSection.appendChild(presetLabel);

            const presetGrid = document.createElement('div');
            presetGrid.className = 'list-preset-grid';

            availablePresets.sort(function (a, b) {
                return t('list.' + a.key).localeCompare(t('list.' + b.key));
            });

            availablePresets.forEach(function (preset) {
                const btn = document.createElement('button');
                btn.className = 'list-attr-preset-btn';
                const iconHtml = LIST_ICON_SVG[preset.icon] || '';
                btn.innerHTML = iconHtml + '<span>' + escapeHtml(t('list.' + preset.key)) + '</span>';
                btn.addEventListener('click', function () {
                    const defaultVal =
                        typeof preset.defaultValue === 'object' && preset.defaultValue !== null
                            ? JSON.parse(JSON.stringify(preset.defaultValue))
                            : preset.defaultValue;
                    const newAttr = {
                        id: generateListId('attr'),
                        name: t('list.' + preset.key),
                        type: preset.type,
                        icon: preset.icon,
                        defaultValue: defaultVal,
                        pinned: false,
                        builtIn: true,
                        presetKey: preset.key,
                    };
                    if (preset.options) newAttr.options = preset.options.slice();
                    content.attributes.push(newAttr);
                    // Set default on all existing items
                    content.items.forEach(function (item) {
                        if (!item.values) item.values = {};
                        item.values[newAttr.id] =
                            typeof newAttr.defaultValue === 'object' && newAttr.defaultValue !== null
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
        const customSection = document.createElement('div');
        customSection.className = 'list-manage-section';
        const customBtn = document.createElement('button');
        customBtn.className = 'list-custom-btn';
        customBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '<span>' +
            escapeHtml(t('list.createCustom')) +
            '</span>';
        customBtn.addEventListener('click', function () {
            openAttrWizard(moduleEl, data, content, panel);
        });
        customSection.appendChild(customBtn);
        body.appendChild(customSection);

        panel.appendChild(body);
    }

    // ── Attribute Wizard ──
    function openAttrWizard(moduleEl, data, content, panel) {
        const overlay = document.createElement('div');
        overlay.className = 'attr-wizard-overlay';

        const wizPanel = document.createElement('div');
        wizPanel.className = 'attr-wizard-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'attr-wizard-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'attr-wizard-title';
        titleEl.textContent = t('list.attrWizardTitle');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'attr-wizard-close';
        closeBtn.title = escapeHtml(t('list.close'));
        closeBtn.innerHTML =
            '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'attr-wizard-body';

        // -- Name section --
        const nameSection = document.createElement('div');
        nameSection.className = 'attr-wizard-section';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'attr-wizard-label';
        nameLabel.setAttribute('for', 'attr-wizard-name-input');
        nameLabel.textContent = t('list.attrName');

        const nameInput = document.createElement('input');
        nameInput.id = 'attr-wizard-name-input';
        nameInput.className = 'attr-wizard-name-input';
        nameInput.type = 'text';
        nameInput.placeholder = t('list.attrNamePlaceholder');
        nameInput.autocomplete = 'off';

        nameSection.appendChild(nameLabel);
        nameSection.appendChild(nameInput);

        // -- Type section --
        const typeSection = document.createElement('div');
        typeSection.className = 'attr-wizard-section';

        const typeLabel = document.createElement('span');
        typeLabel.className = 'attr-wizard-label';
        typeLabel.textContent = t('list.attrType');
        typeSection.appendChild(typeLabel);

        const typeGrid = document.createElement('div');
        typeGrid.className = 'attr-wizard-type-grid';

        const TYPES = [
            {
                key: 'toggle',
                glyphHtml:
                    '<svg class="icon" width="22" height="13" viewBox="0 0 36 22" stroke-width="2.5"><rect x="1" y="1" width="34" height="20" rx="10"/><circle cx="26" cy="11" r="7" fill="currentColor" stroke="none"/></svg>',
                nameKey: 'list.attrTypeToggle',
                descKey: 'list.attrTypeToggleDesc',
            },
            {
                key: 'number',
                glyphHtml:
                    '<span style="font-size:15px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;">42</span>',
                nameKey: 'list.attrTypeNumber',
                descKey: 'list.attrTypeNumberDesc',
            },
            {
                key: 'number-pair',
                glyphHtml:
                    '<span style="font-size:12px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;letter-spacing:-0.02em;">8 / 10</span>',
                nameKey: 'list.attrTypeNumberPair',
                descKey: 'list.attrTypeNumberPairDesc',
            },
            {
                key: 'text',
                glyphHtml:
                    '<span style="font-size:15px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;font-style:italic;">Aa</span>',
                nameKey: 'list.attrTypeText',
                descKey: 'list.attrTypeTextDesc',
            },
            {
                key: 'quantity',
                glyphHtml: '<span style="font-size:16px;font-weight:800;color:var(--cv-accent);">#</span>',
                nameKey: 'list.attrTypeQuantity',
                descKey: 'list.attrTypeQuantityDesc',
            },
        ];

        let selectedType = 'toggle';

        TYPES.forEach(function (typeObj) {
            const card = document.createElement('button');
            card.className = 'attr-wizard-type-card' + (typeObj.key === 'toggle' ? ' selected' : '');
            card.dataset.type = typeObj.key;

            const glyph = document.createElement('div');
            glyph.className = 'attr-wizard-type-glyph';
            glyph.innerHTML = typeObj.glyphHtml;

            const typeName = document.createElement('span');
            typeName.className = 'attr-wizard-type-name';
            typeName.textContent = t(typeObj.nameKey);

            const typeDesc = document.createElement('span');
            typeDesc.className = 'attr-wizard-type-desc';
            typeDesc.textContent = t(typeObj.descKey);

            card.appendChild(glyph);
            card.appendChild(typeName);
            card.appendChild(typeDesc);

            card.addEventListener('click', function () {
                typeGrid.querySelectorAll('.attr-wizard-type-card').forEach(function (c) {
                    c.classList.remove('selected');
                });
                card.classList.add('selected');
                selectedType = typeObj.key;
            });

            typeGrid.appendChild(card);
        });

        typeSection.appendChild(typeGrid);

        // -- Icon section --
        const iconSection = document.createElement('div');
        iconSection.className = 'attr-wizard-section';

        const iconLabel = document.createElement('span');
        iconLabel.className = 'attr-wizard-label';
        iconLabel.innerHTML =
            escapeHtml(t('list.attrIcon')) +
            ' <span class="attr-wizard-label-note">— ' +
            escapeHtml(t('list.attrIconOptional')) +
            '</span>';
        iconSection.appendChild(iconLabel);

        const iconGrid = document.createElement('div');
        iconGrid.className = 'attr-wizard-icon-grid';

        let selectedIcon = null;

        ATTR_WIZARD_ICONS.forEach(function (ic) {
            const btn = document.createElement('button');
            btn.className = 'attr-wizard-icon-btn' + (ic.key === null ? ' selected' : '');
            btn.dataset.iconKey = ic.key || '';
            btn.title = ic.label;
            if (ic.key === null) {
                btn.textContent = '—';
            } else {
                btn.innerHTML = LIST_ICON_SVG[ic.key] || '';
            }
            btn.addEventListener('click', function () {
                iconGrid.querySelectorAll('.attr-wizard-icon-btn').forEach(function (b) {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                selectedIcon = ic.key;
            });
            iconGrid.appendChild(btn);
        });

        iconSection.appendChild(iconGrid);

        body.appendChild(nameSection);
        body.appendChild(typeSection);
        body.appendChild(iconSection);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'attr-wizard-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'attr-wizard-btn-cancel btn-secondary';
        cancelBtn.textContent = t('delete.cancel');

        const createBtn = document.createElement('button');
        createBtn.className = 'attr-wizard-btn-create btn-primary solid';
        createBtn.textContent = t('list.attrWizardCreate');
        createBtn.disabled = true;

        footer.appendChild(cancelBtn);
        footer.appendChild(createBtn);

        wizPanel.appendChild(header);
        wizPanel.appendChild(body);
        wizPanel.appendChild(footer);
        overlay.appendChild(wizPanel);
        document.body.appendChild(overlay);

        function close() {
            document.removeEventListener('keydown', onKeyDown);
            overlay.remove();
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') close();
        }

        nameInput.addEventListener('input', function () {
            createBtn.disabled = nameInput.value.trim().length === 0;
        });

        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        document.addEventListener('keydown', onKeyDown);

        createBtn.addEventListener('click', function () {
            const name = nameInput.value.trim();
            if (!name) return;

            let defaultValue;
            switch (selectedType) {
                case 'toggle':
                    defaultValue = false;
                    break;
                case 'number':
                    defaultValue = 0;
                    break;
                case 'quantity':
                    defaultValue = 1;
                    break;
                case 'number-pair':
                    defaultValue = { current: 0, max: 0 };
                    break;
                case 'text':
                    defaultValue = '';
                    break;
                default:
                    defaultValue = null;
            }

            const newAttr = {
                id: generateListId('attr'),
                name: name,
                type: selectedType,
                icon: selectedIcon,
                defaultValue: defaultValue,
                pinned: false,
                builtIn: false,
            };

            content.attributes.push(newAttr);
            content.items.forEach(function (item) {
                if (!item.values) item.values = {};
                item.values[newAttr.id] =
                    typeof defaultValue === 'object' && defaultValue !== null
                        ? JSON.parse(JSON.stringify(defaultValue))
                        : defaultValue;
            });

            console.log('[CV] Custom attribute created:', newAttr.name);
            scheduleSave();
            close();
            renderManagePanelContent(panel, moduleEl, data, content);
        });
    }

    window.openListManageAttrs = function (moduleEl, data) {
        openManageAttrsPanel(moduleEl, data);
    };

    // ── Inspect Overlay ──
    let activeInspectContext = null;

    function closeItemInspect(isDiscard) {
        if (!activeInspectContext) return;

        const ctx = activeInspectContext;
        const overlay = document.getElementById('list-inspect-overlay');

        if (isDiscard) {
            // Check dirty state
            const currentItemJson = JSON.stringify(ctx.itemOriginal);
            const editedItemJson = JSON.stringify(ctx.itemProxy);

            if (currentItemJson !== editedItemJson) {
                if (!confirm(t('list.discardPrompt'))) return;
            }
        } else {
            // Save: update original object
            const content = ensureContent(ctx.data);
            const realItemIdx = content.items.findIndex((i) => i.id === ctx.itemProxy.id);
            if (realItemIdx !== -1) {
                content.items[realItemIdx] = JSON.parse(JSON.stringify(ctx.itemProxy));
                scheduleSave();

                // Re-render
                const bodyEl = ctx.moduleEl.querySelector('.module-body');
                if (bodyEl) {
                    renderListBody(bodyEl, ctx.data, true);
                    snapModuleHeight(ctx.moduleEl, ctx.data);
                }
            }
        }

        // Close animation
        document.removeEventListener('keydown', ctx.onKeyDown);
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        activeInspectContext = null;
    }

    function openItemInspect(moduleEl, data, itemId) {
        const content = ensureContent(data);
        const itemOriginal = content.items.find((i) => i.id === itemId);
        if (!itemOriginal) return;

        // Clone for edit
        const itemProxy = JSON.parse(JSON.stringify(itemOriginal));

        activeInspectContext = {
            moduleEl: moduleEl,
            data: data,
            itemOriginal: itemOriginal,
            itemProxy: itemProxy,
            onKeyDown: function (e) {
                if (e.key === 'Escape') closeItemInspect(true);
            },
        };

        const overlay = document.getElementById('list-inspect-overlay');
        const panel = document.getElementById('list-inspect-panel');
        panel.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'list-inspect-header';

        const title = document.createElement('span');
        title.className = 'list-inspect-title';
        title.textContent = t('list.inspectTitle');

        const closeXBtn = document.createElement('button');
        closeXBtn.className = 'list-inspect-close-x';
        closeXBtn.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeXBtn.title = t('list.close');
        closeXBtn.addEventListener('click', function () {
            closeItemInspect(true);
        });

        header.appendChild(title);
        header.appendChild(closeXBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'list-inspect-body';

        // Name field
        const nameField = document.createElement('div');
        nameField.className = 'list-inspect-field';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'list-inspect-label';
        nameLabel.textContent = t('list.colName');

        const nameInput = document.createElement('input');
        nameInput.className = 'list-inspect-name-input';
        nameInput.type = 'text';
        nameInput.value = itemProxy.name || '';
        nameInput.placeholder = t('list.itemName');
        nameInput.addEventListener('input', function () {
            itemProxy.name = nameInput.value;
        });

        nameField.appendChild(nameLabel);
        nameField.appendChild(nameInput);
        body.appendChild(nameField);

        // Notes field
        const notesField = document.createElement('div');
        notesField.className = 'list-inspect-field';

        const notesLabel = document.createElement('label');
        notesLabel.className = 'list-inspect-label';
        notesLabel.textContent = t('list.notesTitle');

        const notesInput = document.createElement('textarea');
        notesInput.className = 'list-inspect-notes-input';
        notesInput.value = itemProxy.notes || '';
        notesInput.placeholder = t('list.notesPlaceholder');
        notesInput.addEventListener('input', function () {
            itemProxy.notes = notesInput.value;
        });

        notesField.appendChild(notesLabel);
        notesField.appendChild(notesInput);
        body.appendChild(notesField);

        // Attributes grid
        if (content.attributes.length > 0) {
            const attrGrid = document.createElement('div');
            attrGrid.className = 'list-inspect-attr-grid';

            content.attributes.forEach((attr) => {
                const attrItem = document.createElement('div');
                attrItem.className = 'list-inspect-attr-item';

                const attrLabel = document.createElement('div');
                attrLabel.className = 'list-inspect-attr-label';

                if (attr.icon && LIST_ICON_SVG[attr.icon]) {
                    const iconSpan = document.createElement('span');
                    iconSpan.innerHTML = LIST_ICON_SVG[attr.icon];
                    attrLabel.appendChild(iconSpan.firstChild);
                }

                const attrNameSpan = document.createElement('span');
                attrNameSpan.textContent = attr.name;
                attrLabel.appendChild(attrNameSpan);

                attrItem.appendChild(attrLabel);

                const val =
                    itemProxy.values && itemProxy.values[attr.id] != null
                        ? itemProxy.values[attr.id]
                        : attr.defaultValue;
                const attrCell = renderAttrValue(attr, val, false, itemProxy, function (newVal) {
                    if (!itemProxy.values) itemProxy.values = {};
                    itemProxy.values[attr.id] = newVal;
                });
                attrItem.appendChild(attrCell);

                attrGrid.appendChild(attrItem);
            });
            body.appendChild(attrGrid);
        }

        // Actions (Footer)
        const actions = document.createElement('div');
        actions.className = 'list-inspect-actions';

        const delBtn = document.createElement('button');
        delBtn.className = 'list-inspect-btn-delete';
        delBtn.textContent = t('list.delete');
        delBtn.addEventListener('click', function () {
            showAttrDeleteConfirm(itemProxy.name || t('list.itemName'), function () {
                // Remove item from real payload
                const idx = content.items.findIndex((i) => i.id === itemProxy.id);
                if (idx !== -1) {
                    content.items.splice(idx, 1);
                    scheduleSave();
                    const bEl = moduleEl.querySelector('.module-body');
                    if (bEl) {
                        renderListBody(bEl, data, true);
                        snapModuleHeight(moduleEl, data);
                    }
                }
                // Skip the dirty check internally so we don't get the discard prompt
                activeInspectContext = null;
                overlay.classList.remove('open');
                overlay.setAttribute('aria-hidden', 'true');
            });
        });

        const closeBtn = document.createElement('button');
        closeBtn.className = 'list-inspect-btn-close';
        closeBtn.textContent = t('list.close');
        closeBtn.addEventListener('click', function () {
            closeItemInspect(true);
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'list-inspect-btn-save';
        saveBtn.textContent = t('list.save');
        saveBtn.addEventListener('click', function () {
            closeItemInspect(false);
        });

        actions.appendChild(delBtn);
        actions.appendChild(closeBtn);
        actions.appendChild(saveBtn);

        // Put it all together
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(actions);

        // Go
        document.addEventListener('keydown', activeInspectContext.onKeyDown);
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');

        // Focus name
        setTimeout(() => nameInput.focus(), 100);
    }

    // ── Module Type Registration ──
    registerModuleType('list', {
        label: 'type.list',

        renderBody(bodyEl, data, isPlayMode) {
            ensureContent(data);
            renderListBody(bodyEl, data, isPlayMode);
        },

        onPlayMode(moduleEl, data) {
            closeManageAttrsPanel(moduleEl, data);
            const bodyEl = moduleEl.querySelector('.module-body');
            renderListBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderListBody(bodyEl, data, false);
        },

        syncState(moduleEl, data) {
            const content = ensureContent(data);
            moduleEl.querySelectorAll('.list-item-row').forEach((row) => {
                const item = content.items.find((i) => i.id === row.dataset.itemId);
                if (!item) return;
                const nameInput = row.querySelector('.list-item-name-input');
                if (nameInput) item.name = nameInput.value;
            });
        },
    });

    console.log('[CV] List module registered');
})();
