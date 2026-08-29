// ── List Module ──
// Flexible, attribute-extensible item lists for inventory, equipment, consumables, etc.
(function () {
    'use strict';

    const DEFAULT_COL_WIDTH = 68;
    const MIN_COL_WIDTH = 40;

    const pendingAddEntries = new Map();
    let activeColumnPicker = null;

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

    // ── Log Helpers ──
    function formatAttrValueForLog(attr, val) {
        if (attr.type === 'number-pair') {
            const cur = val && val.current != null ? val.current : 0;
            const max = val && val.max != null ? val.max : 0;
            return cur + '/' + max;
        }
        if (val === null || val === undefined) return '';
        return String(val);
    }

    function buildAttrOnLog(item, attr, data) {
        return function (action, newVal) {
            if (typeof window.logActivity !== 'function') return;
            const itemName = item.name || t('list.itemName');
            const listName = data.title || t('type.list');
            const message =
                action === 'toggle'
                    ? t(newVal ? 'list.log.attrToggleOn' : 'list.log.attrToggleOff', {
                          item: itemName,
                          attr: attr.name,
                          listName,
                      })
                    : t('list.log.attrChange', {
                          item: itemName,
                          attr: attr.name,
                          value: formatAttrValueForLog(attr, newVal),
                          listName,
                      });
            window.logActivity({ type: 'list.event.attrChange', message, sourceModuleId: data.id });
        };
    }

    // Update the pending "item added" log entry with the item's first name, or
    // log a rename for an already-named item.
    function logItemRename(item, oldName, newName, data) {
        const listName = data.title || t('type.list');
        if (pendingAddEntries.has(item.id)) {
            if (newName) {
                const entryId = pendingAddEntries.get(item.id);
                const entry = (window.activityLog || []).find((e) => e.id === entryId);
                if (entry) {
                    entry.message = t('list.log.addNamed', { name: newName, listName });
                    scheduleSave();
                    if (typeof window.refreshActivityLog === 'function') window.refreshActivityLog();
                }
            }
            pendingAddEntries.delete(item.id);
        } else if (newName && newName !== oldName && oldName && typeof window.logActivity === 'function') {
            window.logActivity({
                type: 'list.event.rename',
                message: t('list.log.rename', { oldName, newName, listName }),
                sourceModuleId: data.id,
            });
        }
    }

    // ── Attribute Value Cell ──
    // asDisplay: true → compact interactive display (module body rows);
    // false → full form inputs (item inspect modal).
    function renderAttrValue(attr, value, asDisplay, item, onUpdate, onLog) {
        const cell = document.createElement('div');
        cell.className = 'list-attr-cell list-attr-' + attr.type;

        if (attr.type === 'toggle') {
            const toggleIconSvg = attr.icon ? cvIcon(attr.icon) : cvIcon('circle', 16);
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'list-attr-toggle-btn' + (value ? ' is-on' : ' is-off');
            toggleBtn.innerHTML = toggleIconSvg;
            toggleBtn.addEventListener('click', function () {
                const newVal = toggleBtn.classList.contains('is-off');
                toggleBtn.classList.toggle('is-on', newVal);
                toggleBtn.classList.toggle('is-off', !newVal);
                onUpdate(newVal);
                if (onLog) onLog('toggle', newVal);
            });
            cell.appendChild(toggleBtn);
            return cell;
        }

        if (attr.type === 'quantity') {
            let val = parseInt(value) || 0;
            if (asDisplay) {
                const qtySpan = document.createElement('span');
                qtySpan.className = 'list-attr-quantity-display';
                qtySpan.textContent = val;
                qtySpan.title = t('list.attrTypeQuantityDesc');
                qtySpan.addEventListener('click', function (e) {
                    val++;
                    qtySpan.textContent = val;
                    onUpdate(val);
                    if (onLog) onLog('change', val);
                });
                qtySpan.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    val--;
                    qtySpan.textContent = val;
                    onUpdate(val);
                    if (onLog) onLog('change', val);
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
                let qtyFocusVal = val;
                qtyInput.addEventListener('focus', function () {
                    qtyFocusVal = parseInt(qtyInput.value) || 0;
                });
                qtyInput.addEventListener('blur', function () {
                    const newQty = parseInt(qtyInput.value) || 0;
                    if (newQty !== qtyFocusVal && onLog) onLog('change', newQty);
                });
                cell.appendChild(qtyInput);
            }
            return cell;
        }

        if (attr.type === 'number') {
            if (asDisplay) {
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
                let numFocusVal = value != null ? value : 0;
                numInput.addEventListener('focus', function () {
                    numFocusVal = parseFloat(numInput.value) || 0;
                });
                numInput.addEventListener('blur', function () {
                    const newNum = parseFloat(numInput.value) || 0;
                    if (newNum !== numFocusVal && onLog) onLog('change', newNum);
                });
                cell.appendChild(numInput);
            }
            return cell;
        }

        if (attr.type === 'number-pair') {
            const pairCur = value && value.current != null ? value.current : 0;
            const pairMax = value && value.max != null ? value.max : 0;
            if (asDisplay) {
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
                let pairFocusStr = JSON.stringify({ current: pairCur, max: pairMax });
                const snapPairFocus = function () {
                    pairFocusStr = JSON.stringify({
                        current: parseFloat(curInput.value) || 0,
                        max: parseFloat(maxInput.value) || 0,
                    });
                };
                const logPairBlur = function () {
                    const current = parseFloat(curInput.value) || 0;
                    const max = parseFloat(maxInput.value) || 0;
                    const newStr = JSON.stringify({ current, max });
                    if (newStr !== pairFocusStr && onLog) {
                        pairFocusStr = newStr;
                        onLog('change', { current, max });
                    }
                };
                curInput.addEventListener('focus', snapPairFocus);
                maxInput.addEventListener('focus', snapPairFocus);
                curInput.addEventListener('blur', logPairBlur);
                maxInput.addEventListener('blur', logPairBlur);
                cell.appendChild(curInput);
                cell.appendChild(pairSep);
                cell.appendChild(maxInput);
            }
            return cell;
        }

        if (attr.type === 'dropdown') {
            const opts = attr.options || [];
            if (asDisplay) {
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
                    if (onLog) onLog('change', sel.value);
                });
                cell.appendChild(sel);
            }
            return cell;
        }

        // text
        if (asDisplay) {
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
            let textFocusVal = value != null ? value : '';
            txtInput.addEventListener('focus', function () {
                textFocusVal = txtInput.value;
            });
            txtInput.addEventListener('blur', function () {
                if (txtInput.value !== textFocusVal && onLog) onLog('change', txtInput.value);
            });
            cell.appendChild(txtInput);
        }
        return cell;
    }

    // ── Column Picker ──

    function handleColumnPickerOutsideClick(e) {
        if (!activeColumnPicker) return;
        if (activeColumnPicker.popover.contains(e.target)) return;
        if (activeColumnPicker.anchorEl === e.target || activeColumnPicker.anchorEl.contains(e.target)) return;
        closeColumnPicker();
    }

    function closeColumnPicker(skipRender) {
        if (!activeColumnPicker) return;
        const { popover, bodyEl, data, onKeyDown } = activeColumnPicker;
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('click', handleColumnPickerOutsideClick);
        popover.remove();
        activeColumnPicker = null;
        if (!skipRender) {
            renderListBody(bodyEl, data);
            snapModuleHeight(bodyEl.closest('.module'), data);
        }
    }

    function openColumnPicker(anchorEl, content, bodyEl, data) {
        if (activeColumnPicker) closeColumnPicker();

        const popover = document.createElement('div');
        popover.className = 'list-col-picker-popover';

        const pickerHeader = document.createElement('div');
        pickerHeader.className = 'list-col-picker-header';
        pickerHeader.textContent = t('list.columns');
        popover.appendChild(pickerHeader);

        const list = document.createElement('div');
        list.className = 'list-col-picker-list cv-scroll';

        if (content.attributes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'list-col-picker-empty';
            empty.textContent = t('list.noAttrs');
            list.appendChild(empty);
        } else {
            content.attributes.forEach(function (attr) {
                const row = document.createElement('div');
                row.className = 'list-col-picker-row';

                const iconEl = document.createElement('span');
                iconEl.className = 'list-col-picker-icon';
                if (attr.icon) {
                    iconEl.innerHTML = cvIcon(attr.icon);
                }
                row.appendChild(iconEl);

                const nameEl = document.createElement('span');
                nameEl.className = 'list-col-picker-name';
                nameEl.textContent = attr.name;
                row.appendChild(nameEl);

                const visBtn = document.createElement('button');
                visBtn.className = 'list-attr-visibility-btn' + (attr.pinned ? ' visible' : '');
                visBtn.title = escapeHtml(t('list.columnVisible'));
                visBtn.innerHTML = attr.pinned ? cvIcon('eye', 14) : cvIcon('eye-off', 14);
                visBtn.addEventListener('click', function () {
                    attr.pinned = !attr.pinned;
                    visBtn.classList.toggle('visible', attr.pinned);
                    visBtn.innerHTML = attr.pinned ? cvIcon('eye', 14) : cvIcon('eye-off', 14);
                    scheduleSave();
                });
                row.appendChild(visBtn);

                list.appendChild(row);
            });
        }

        popover.appendChild(list);
        document.body.appendChild(popover);

        // Position below anchor, right-aligned, clamped to viewport
        const rect = anchorEl.getBoundingClientRect();
        const popW = popover.getBoundingClientRect().width || 200;
        let top = rect.bottom + 4;
        let left = rect.right - popW;
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        if (left < 4) left = 4;
        if (left + popW > vpW - 4) left = vpW - popW - 4;
        if (top + 280 > vpH - 4) top = rect.top - 4 - Math.min(280, vpH - 8);
        if (top < 4) top = 4;
        popover.style.top = top + 'px';
        popover.style.left = left + 'px';

        const onKeyDown = function (e) {
            if (e.key === 'Escape') closeColumnPicker();
        };
        document.addEventListener('keydown', onKeyDown);
        activeColumnPicker = { popover, bodyEl, data, onKeyDown, anchorEl };

        requestAnimationFrame(function () {
            document.addEventListener('click', handleColumnPickerOutsideClick);
        });
    }

    // ── Column Width Helpers ──
    function applyColWidth(el, width) {
        const w = (width || DEFAULT_COL_WIDTH) + 'px';
        el.style.flex = '0 0 ' + w;
        el.style.width = w;
    }

    function applyAttrWidthEverywhere(colHeader, attr, bodyEl) {
        const w = attr.width || DEFAULT_COL_WIDTH;
        applyColWidth(colHeader, w);
        const cells = bodyEl.querySelectorAll('.list-attr-cell[data-attr-id="' + attr.id + '"]');
        cells.forEach(function (cell) {
            applyColWidth(cell, w);
        });
    }

    function initColResizeHandle(colHeader, attr, bodyEl, data) {
        const handle = document.createElement('div');
        handle.className = 'list-col-resize-handle';
        colHeader.appendChild(handle);

        const moduleEl = bodyEl.closest('.module');

        handle.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            e.preventDefault();
            delete attr.width;
            applyAttrWidthEverywhere(colHeader, attr, bodyEl);
            if (moduleEl) snapModuleHeight(moduleEl, data);
            scheduleSave();
        });

        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startWidth = attr.width || DEFAULT_COL_WIDTH;
            const cells = Array.from(bodyEl.querySelectorAll('.list-attr-cell[data-attr-id="' + attr.id + '"]'));

            handle.classList.add('resizing');
            const container = bodyEl.querySelector('.list-container');
            if (container) container.classList.add('col-resizing');

            let _raf = 0;

            function applyWidth() {
                const w = attr.width || DEFAULT_COL_WIDTH;
                applyColWidth(colHeader, w);
                cells.forEach(function (cell) {
                    applyColWidth(cell, w);
                });
            }

            function onMouseMove(ev) {
                const delta = ev.clientX - startX;
                const newWidth = Math.max(MIN_COL_WIDTH, Math.round(startWidth + delta));
                if (newWidth !== (attr.width || DEFAULT_COL_WIDTH)) {
                    attr.width = newWidth;
                    if (!_raf) {
                        _raf = requestAnimationFrame(function () {
                            _raf = 0;
                            applyWidth();
                        });
                    }
                }
            }

            function onMouseUp() {
                handle.classList.remove('resizing');
                if (container) container.classList.remove('col-resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                cancelAnimationFrame(_raf);
                applyWidth();
                if (moduleEl) snapModuleHeight(moduleEl, data);
                scheduleSave();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // ── Column Headers ──
    function renderColumnHeaders(content, bodyEl, data, isSorted) {
        const pinnedAttrs = content.attributes.filter(function (a) {
            return a.pinned;
        });

        const headerRow = document.createElement('div');
        headerRow.className = 'list-header-row';

        // Handle spacer — matches drag handle width when handles are visible
        if (!isSorted) {
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
            nameIndicator.innerHTML = content.sortDir === 'asc' ? cvIcon('chevron-up', 10) : cvIcon('chevron-down', 10);
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
            renderListBody(bodyEl, data);
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
                indicator.innerHTML = content.sortDir === 'asc' ? cvIcon('chevron-up', 10) : cvIcon('chevron-down', 10);
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
                renderListBody(bodyEl, data);
            });

            applyColWidth(colHeader, attr.width);
            initColResizeHandle(colHeader, attr, bodyEl, data);

            headerRow.appendChild(colHeader);
        });

        // Column picker button (when attributes exist) or plain actions spacer
        if (content.attributes.length > 0) {
            const pickerBtn = document.createElement('button');
            pickerBtn.className = 'list-col-picker-btn';
            pickerBtn.title = escapeHtml(t('list.columns'));
            pickerBtn.innerHTML = cvIcon('columns', 14);
            pickerBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (activeColumnPicker && activeColumnPicker.anchorEl === pickerBtn) {
                    closeColumnPicker();
                } else {
                    openColumnPicker(pickerBtn, content, bodyEl, data);
                }
            });
            headerRow.appendChild(pickerBtn);
        } else {
            const actionsSpacer = document.createElement('div');
            actionsSpacer.className = 'list-col-header list-col-actions';
            headerRow.appendChild(actionsSpacer);
        }

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

    // ── Sortable (manual reorder + cross-list transfer) ──
    function initListSortable(container, data) {
        if (container._sortable) container._sortable.destroy();
        const content = ensureContent(data);
        container._sortable = new Sortable(container, {
            group: 'list-transfer',
            handle: '.list-item-drag-handle',
            animation: 150,
            ghostClass: 'list-item-ghost',
            chosenClass: 'cv-drag-chosen',
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
                    renderListBody(srcBody, sourceData);
                    snapModuleHeight(sourceModuleEl, sourceData);
                }
                if (targetModuleEl) {
                    const tgtBody = targetModuleEl.querySelector('.module-body');
                    renderListBody(tgtBody, targetData);
                    snapModuleHeight(targetModuleEl, targetData);
                }

                scheduleSave();
            },
        });
    }

    // ── Render List Body ──
    function renderListBody(bodyEl, data) {
        const content = ensureContent(data);
        if (activeColumnPicker && activeColumnPicker.bodyEl === bodyEl) {
            document.removeEventListener('keydown', activeColumnPicker.onKeyDown);
            document.removeEventListener('click', handleColumnPickerOutsideClick);
            activeColumnPicker.popover.remove();
            activeColumnPicker = null;
        }
        const moduleEl = bodyEl.closest('.module');
        // Destroy any existing SortableJS before clearing, so orphaned instances
        // don't linger in the group registry and interfere with future transfers
        const oldContainer = bodyEl.querySelector('.list-container');
        if (oldContainer && oldContainer._sortable) {
            oldContainer._sortable.destroy();
        }
        bodyEl.innerHTML = '';

        const pinnedAttrs = content.attributes.filter((a) => a.pinned);
        const isSorted = content.sortBy !== null;
        const sortedItems = getSortedItems(content);
        const hasItems = content.items.length > 0;
        // Show header row whenever there are items so the Name column is always sortable
        const showHeader = hasItems;

        // Always create container (even if empty) so it can be a cross-list drop target
        const container = document.createElement('div');
        container.className = 'list-container';

        // Column headers — always shown when there are items
        if (showHeader) {
            const headerRow = renderColumnHeaders(content, bodyEl, data, isSorted);
            if (headerRow) {
                container.appendChild(headerRow);
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

                // Drag handle — only when not sorted (manual order active)
                if (!isSorted) {
                    const handle = document.createElement('span');
                    handle.className = 'list-item-drag-handle';
                    handle.innerHTML = '&#x2807;';
                    row.appendChild(handle);
                }

                // Name — Ctrl+Click edits
                const nameSpan = document.createElement('span');
                nameSpan.className = 'list-item-name';
                nameSpan.textContent = item.name || t('list.itemName');
                nameSpan.addEventListener('click', (e) => {
                    if (!modKeys.ctrl) return;
                    e.stopPropagation();
                    window.openEditPopover(nameSpan, {
                        label: t('list.colName'),
                        value: item.name || '',
                        type: 'text',
                        onSave(newName) {
                            const oldName = item.name;
                            item.name = newName;
                            logItemRename(item, oldName, newName, data);
                            scheduleSave();
                            renderListBody(bodyEl, data);
                        },
                    });
                });
                row.appendChild(nameSpan);

                // Pinned attribute value cells
                pinnedAttrs.forEach((attr) => {
                    const val = item.values && item.values[attr.id] != null ? item.values[attr.id] : attr.defaultValue;
                    const attrCell = renderAttrValue(
                        attr,
                        val,
                        true,
                        item,
                        function (newVal) {
                            if (!item.values) item.values = {};
                            item.values[attr.id] = newVal;
                            scheduleSave();
                        },
                        buildAttrOnLog(item, attr, data)
                    );
                    attrCell.dataset.attrId = attr.id;
                    applyColWidth(attrCell, attr.width);
                    row.appendChild(attrCell);
                });

                // Expand button
                const expandBtn = document.createElement('button');
                expandBtn.className = 'list-item-expand-btn';
                expandBtn.title = escapeHtml(t('list.inspectTitle'));
                expandBtn.innerHTML = cvIcon('maximize-2', 14);
                expandBtn.addEventListener('click', function () {
                    openItemInspect(moduleEl, data, item.id);
                });
                row.appendChild(expandBtn);

                container.appendChild(row);
            });
        }

        bodyEl.appendChild(container);

        // Manual reorder / cross-list transfer — only when not sorted
        if (!isSorted) {
            initListSortable(container, data);
        }
    }

    // ── Add Item ──
    function addListItem(moduleEl, data) {
        const content = ensureContent(data);
        const values = {};
        content.attributes.forEach((attr) => {
            values[attr.id] = attr.defaultValue;
        });
        const newItem = {
            id: generateId('item'),
            name: '',
            notes: '',
            order: content.items.length,
            values: values,
        };
        content.items.push(newItem);
        const bodyEl = moduleEl.querySelector('.module-body');
        renderListBody(bodyEl, data);
        snapModuleHeight(moduleEl, data);
        scheduleSave();
        if (typeof window.logActivity === 'function') {
            const logEntryId = window.logActivity({
                type: 'list.event.add',
                message: t('list.log.add', { listName: data.title || t('type.list') }),
                sourceModuleId: data.id,
            });
            if (logEntryId) pendingAddEntries.set(newItem.id, logEntryId);
        }
        // Open the inspect modal so the new item can be named immediately
        openItemInspect(moduleEl, data, newItem.id);
    }

    // ── Manage Attributes Panel ──

    function closeManageAttrsPanel(moduleEl, data) {
        closeColumnPicker(true);
        const overlay = document.querySelector('.list-manage-overlay');
        if (!overlay) return;
        if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
        const attrList = overlay.querySelector('.list-attr-manage-list');
        if (attrList && attrList._sortable) attrList._sortable.destroy();
        overlay.remove();
        const bodyEl = moduleEl.querySelector('.module-body');
        renderListBody(bodyEl, data);
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

        const keyHandler = function (e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeManageAttrsPanel(moduleEl, data);
            }
        };
        overlay._keyHandler = keyHandler;
        document.addEventListener('keydown', keyHandler);
    }

    function renderManagePanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('list.manageAttrs');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('list.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        closeXBtn.addEventListener('click', function () {
            closeManageAttrsPanel(moduleEl, data);
        });
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // ── Body (scrollable) ──
        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll list-manage-body';

        // ── Current Attributes Section ──
        if (content.attributes.length === 0) {
            const noAttrs = document.createElement('div');
            noAttrs.className = 'list-manage-no-attrs';
            noAttrs.textContent = t('list.noAttrs');
            body.appendChild(noAttrs);
        } else {
            const attrList = document.createElement('div');
            attrList.className = 'list-attr-manage-list';

            content.attributes.forEach(function (attr) {
                const row = document.createElement('div');
                row.className = 'list-attr-row';
                row.dataset.attrId = attr.id;

                // Drag handle — reordering attributes reorders their columns
                const dragHandle = document.createElement('span');
                dragHandle.className = 'list-attr-drag-handle';
                dragHandle.innerHTML = '&#x2807;';
                row.appendChild(dragHandle);

                // Icon
                const iconSpan = document.createElement('span');
                iconSpan.className = 'list-attr-icon';
                if (attr.icon) {
                    iconSpan.innerHTML = cvIcon(attr.icon);
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

                // Column visibility toggle
                const visBtn = document.createElement('button');
                visBtn.className = 'list-attr-visibility-btn' + (attr.pinned ? ' visible' : '');
                visBtn.title = escapeHtml(t('list.columnVisible'));
                visBtn.innerHTML = attr.pinned ? cvIcon('eye', 14) : cvIcon('eye-off', 14);
                visBtn.addEventListener('click', function () {
                    attr.pinned = !attr.pinned;
                    scheduleSave();
                    renderManagePanelContent(panel, moduleEl, data, content);
                });
                row.appendChild(visBtn);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'list-attr-delete-btn';
                deleteBtn.title = escapeHtml(t('list.deleteItem'));
                deleteBtn.innerHTML = cvIcon('x', 12);
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

                attrList.appendChild(row);
            });

            initManageListSortable(attrList, {
                handleSelector: '.list-attr-drag-handle',
                ghostClass: 'list-attr-ghost',
                rowSelector: '.list-attr-row',
                onEnd: function () {
                    const orderedIds = Array.from(attrList.querySelectorAll('.list-attr-row')).map(function (el) {
                        return el.dataset.attrId;
                    });
                    content.attributes.sort(function (a, b) {
                        return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
                    });
                    scheduleSave();
                },
            });

            body.appendChild(attrList);
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
                const iconHtml = preset.icon ? cvIcon(preset.icon) : '';
                btn.innerHTML = iconHtml + '<span>' + escapeHtml(t('list.' + preset.key)) + '</span>';
                btn.addEventListener('click', function () {
                    const defaultVal =
                        typeof preset.defaultValue === 'object' && preset.defaultValue !== null
                            ? JSON.parse(JSON.stringify(preset.defaultValue))
                            : preset.defaultValue;
                    const newAttr = {
                        id: generateId('attr'),
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
        customBtn.innerHTML = cvIcon('plus', 14) + '<span>' + escapeHtml(t('list.createCustom')) + '</span>';
        customBtn.addEventListener('click', function () {
            openAttrWizard(moduleEl, data, content, panel);
        });
        customSection.appendChild(customBtn);
        body.appendChild(customSection);

        buildCommonSettingsSection(body, moduleEl, data);
        panel.appendChild(body);

        // ── Footer ──
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeFooterBtn = document.createElement('button');
        closeFooterBtn.type = 'button';
        closeFooterBtn.className = 'btn-secondary sm';
        closeFooterBtn.textContent = t('list.close');
        closeFooterBtn.addEventListener('click', function () {
            closeManageAttrsPanel(moduleEl, data);
        });
        footer.appendChild(closeFooterBtn);
        panel.appendChild(footer);
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
        closeBtn.innerHTML = cvIcon('x', 16);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'attr-wizard-body cv-scroll';

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
                btn.innerHTML = cvIcon(ic.key);
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
                id: generateId('attr'),
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

    // ── Inspect Overlay ──
    let activeInspectContext = null;

    function closeItemInspect(isDiscard) {
        if (!activeInspectContext) return;

        const ctx = activeInspectContext;
        const overlay = document.getElementById('list-inspect-overlay');

        if (isDiscard) {
            // Check dirty state — window.confirm() is blocked in TaleSpire's
            // embedded Chromium, so route through the custom showConfirm dialog
            const currentItemJson = JSON.stringify(ctx.itemOriginal);
            const editedItemJson = JSON.stringify(ctx.itemProxy);

            if (currentItemJson !== editedItemJson) {
                showConfirm(t('list.discardPrompt'), function () {
                    document.removeEventListener('keydown', ctx.onKeyDown);
                    overlay.classList.remove('open');
                    overlay.setAttribute('aria-hidden', 'true');
                    activeInspectContext = null;
                });
                return;
            }
        } else {
            // Save: update original object
            const content = ensureContent(ctx.data);
            const realItemIdx = content.items.findIndex((i) => i.id === ctx.itemProxy.id);
            if (realItemIdx !== -1) {
                const oldName = ctx.itemOriginal.name;
                const newName = ctx.itemProxy.name;
                const listName = ctx.data.title || t('type.list');
                const itemName = newName || t('list.itemName');

                // Capture attribute diffs before overwriting
                const attrDiffs = [];
                content.attributes.forEach(function (attr) {
                    const oldVal =
                        ctx.itemOriginal.values && ctx.itemOriginal.values[attr.id] != null
                            ? ctx.itemOriginal.values[attr.id]
                            : attr.defaultValue;
                    const newVal =
                        ctx.itemProxy.values && ctx.itemProxy.values[attr.id] != null
                            ? ctx.itemProxy.values[attr.id]
                            : attr.defaultValue;
                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        attrDiffs.push({ attr, newVal });
                    }
                });

                content.items[realItemIdx] = JSON.parse(JSON.stringify(ctx.itemProxy));
                scheduleSave();

                // Log rename or coalesce add entry
                if (newName !== oldName) {
                    if (pendingAddEntries.has(ctx.itemProxy.id)) {
                        if (newName) {
                            const entryId = pendingAddEntries.get(ctx.itemProxy.id);
                            const entry = (window.activityLog || []).find((e) => e.id === entryId);
                            if (entry) {
                                entry.message = t('list.log.addNamed', { name: newName, listName });
                                scheduleSave();
                                if (typeof window.refreshActivityLog === 'function') window.refreshActivityLog();
                            }
                        }
                        pendingAddEntries.delete(ctx.itemProxy.id);
                    } else if (oldName && newName && typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'list.event.rename',
                            message: t('list.log.rename', { oldName, newName, listName }),
                            sourceModuleId: ctx.data.id,
                        });
                    }
                } else {
                    pendingAddEntries.delete(ctx.itemProxy.id);
                }

                // Log changed attributes
                if (typeof window.logActivity === 'function') {
                    attrDiffs.forEach(function ({ attr, newVal }) {
                        const message =
                            attr.type === 'toggle'
                                ? t(newVal ? 'list.log.attrToggleOn' : 'list.log.attrToggleOff', {
                                      item: itemName,
                                      attr: attr.name,
                                      listName,
                                  })
                                : t('list.log.attrChange', {
                                      item: itemName,
                                      attr: attr.name,
                                      value: formatAttrValueForLog(attr, newVal),
                                      listName,
                                  });
                        window.logActivity({ type: 'list.event.attrChange', message, sourceModuleId: ctx.data.id });
                    });
                }

                // Re-render
                const bodyEl = ctx.moduleEl.querySelector('.module-body');
                if (bodyEl) {
                    renderListBody(bodyEl, ctx.data);
                    snapModuleHeight(ctx.moduleEl, ctx.data);
                    if (typeof window.reapplyPendingStates === 'function') window.reapplyPendingStates();
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
        closeXBtn.innerHTML = cvIcon('x', 16);
        closeXBtn.title = t('list.close');
        closeXBtn.addEventListener('click', function () {
            closeItemInspect(true);
        });

        header.appendChild(title);
        header.appendChild(closeXBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'list-inspect-body cv-scroll';

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
        notesInput.className = 'list-inspect-notes-input cv-scroll';
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

                if (attr.icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.innerHTML = cvIcon(attr.icon);
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
                    const itemName = itemProxy.name || t('list.itemName');
                    pendingAddEntries.delete(itemProxy.id);
                    content.items.splice(idx, 1);
                    scheduleSave();
                    if (typeof window.logActivity === 'function') {
                        window.logActivity({
                            type: 'list.event.remove',
                            message: t('list.log.remove', { name: itemName, listName: data.title || t('type.list') }),
                            sourceModuleId: data.id,
                        });
                    }
                    const bEl = moduleEl.querySelector('.module-body');
                    if (bEl) {
                        renderListBody(bEl, data);
                        snapModuleHeight(moduleEl, data);
                        if (typeof window.reapplyPendingStates === 'function') window.reapplyPendingStates();
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

        const sendPlayerBtn = document.createElement('button');
        sendPlayerBtn.className = 'list-inspect-btn-send';
        sendPlayerBtn.title = escapeHtml(t('transfer.sendToPlayer'));
        sendPlayerBtn.innerHTML = cvIcon('send', 14) + ' ' + escapeHtml(t('transfer.sendToPlayer'));
        sendPlayerBtn.addEventListener('click', function () {
            window.openSendToPlayerModal(itemProxy, 'list', { attrs: content.attributes }, data.id, itemProxy.id);
        });
        actions.appendChild(sendPlayerBtn);

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

    // Exposed for reuse by other modules that share the list attribute-type system
    // (text/number/number-pair/toggle) in their own inspect surfaces, e.g. module-spells.js.
    window.renderAttrValue = renderAttrValue;

    // ── Module Type Registration ──
    registerModuleType('list', {
        label: 'type.list',

        renderBody(bodyEl, data) {
            ensureContent(data);
            renderListBody(bodyEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => addListItem(moduleEl, data),
                    label: t('list.addItem'),
                    icon: cvIcon('plus', 14),
                },
                {
                    onClick: () => openManageAttrsPanel(moduleEl, data),
                    label: t('list.moduleSettings'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    console.log('[CV] List module registered');
})();
