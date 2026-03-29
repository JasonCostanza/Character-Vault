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
        scale:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="4 7 12 3 20 7"/><line x1="4" y1="7" x2="4" y2="13"/><line x1="20" y1="7" x2="20" y2="13"/><path d="M4 13a4 4 0 0 0 8 0"/><path d="M12 13a4 4 0 0 0 8 0"/></svg>',
        power:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        apple:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1-1 3-1.5 4 0"/><path d="M17 6c2 2 3 5 2.5 9s-2.5 6-5.5 7c-1 .3-1.7.3-2 0-3-1-5-3-5.5-7S7 8 9 6c1-1 3-1 4 0s2-.5 4 0z"/></svg>',
        bread:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c0-5 2-9 8-9s8 4 8 9l-1 2H5l-1-2z"/><line x1="8" y1="12" x2="8" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="12" x2="16" y2="17"/></svg>',
        bottle:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4v3l1.5 2.5V20a1 1 0 01-1 1H9.5a1 1 0 01-1-1V8.5L10 6V3z"/><line x1="9.5" y1="13" x2="14.5" y2="13"/></svg>',
        magnify: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>',
        torch:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="4" height="7" rx="1"/><path d="M12 14c-3-4-1-9 0-11 1 2 3 7 0 11z"/></svg>',
        flash:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="10" rx="1"/><path d="M8 9L6 5h12l-2 4"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>',
        armour:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/></svg>',
        helmet:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C7 2 3 6 3 11v3h2v-1a7 7 0 0 1 14 0v1h2v-3c0-5-4-9-9-9z"/><rect x="3" y="14" width="18" height="4" rx="1"/></svg>',
        boots:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v13l-3 4h12v-3l-3-3V3H8z"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        gloves:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V8a1.5 1.5 0 013 0v5"/><path d="M12 11V7a1.5 1.5 0 013 0v4"/><path d="M15 11V8.5a1.5 1.5 0 013 0V17a5 5 0 01-10 0v-2.5a1.5 1.5 0 013 0"/></svg>',
        shirt:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 4 9.5 7 12 4 14.5 7 17 4 21 8 18 10 18 20 6 20 6 10 3 8"/></svg>',
        pants:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-2 10h-4l-2 6-2-6H6L4 4z"/></svg>',
        shoes:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16l1-6h5l2 3h10v3H3z"/><line x1="4" y1="13" x2="6" y2="13"/></svg>',
        gun:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h10v4l4 1v2h-5v-2H4v-5z"/><line x1="14" y1="10" x2="17" y2="8"/><rect x="5" y="14" width="2" height="4" rx="1"/></svg>',
        sword:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="2" x2="7" y2="18"/><line x1="21" y1="6" x2="12" y2="6"/><path d="M5 20l2-2"/><path d="M3 22l2-2"/></svg>',
        dagger:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="17"/><line x1="8" y1="8" x2="16" y2="8"/><path d="M10 17 Q12 21 14 17"/></svg>',
        wand:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="16" y2="8"/><polyline points="16 8 19 5 21 7 18 10 16 8"/><line x1="20" y1="3" x2="22" y2="5"/><line x1="18" y1="2" x2="18" y2="4"/><line x1="22" y1="6" x2="20" y2="6"/></svg>',
        staff:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M9 6Q12 3 15 6"/><circle cx="12" cy="10" r="2"/><path d="M9 18Q12 21 15 18"/></svg>',
        coin:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M9 9h3.5a2 2 0 010 4H9m0 0h4a2 2 0 010 4H9"/></svg>',
        potion:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v3l4 7A6 6 0 015 13l4-7V3z"/><line x1="8" y1="9" x2="16" y2="9"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="16" r="1" fill="currentColor" stroke="none"/></svg>',
        key:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="5"/><line x1="13" y1="9" x2="21" y2="9"/><line x1="17" y1="9" x2="17" y2="12"/><line x1="20" y1="9" x2="20" y2="11"/></svg>',
        gem:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l3 5-10 13L2 9l3-5z"/><line x1="2" y1="9" x2="22" y2="9"/></svg>',
        bow:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4 Q1 12 5 20"/><line x1="5" y1="4" x2="5" y2="20"/><line x1="5" y1="12" x2="20" y2="12"/><polyline points="16 9 20 12 16 15"/></svg>',
        axe:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="15" y2="9"/><path d="M15 9 Q15 3 21 3 Q21 9 15 9"/></svg>',
        shield:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
        hash:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>'
    };

    // ── Attribute Wizard Icon Library ──
    var ATTR_WIZARD_ICONS = [
        { key: null,      label: 'None' },
        { key: 'apple',   label: 'Apple' },
        { key: 'armour',  label: 'Armour' },
        { key: 'axe',     label: 'Axe' },
        { key: 'scale',   label: 'Balance Scale' },
        { key: 'boots',   label: 'Boots' },
        { key: 'bottle',  label: 'Bottle of Water' },
        { key: 'bow',     label: 'Bow' },
        { key: 'bread',   label: 'Bread' },
        { key: 'coin',    label: 'Coin' },
        { key: 'dagger',  label: 'Dagger' },
        { key: 'flash',   label: 'Flashlight' },
        { key: 'gem',     label: 'Gem' },
        { key: 'gloves',  label: 'Gloves' },
        { key: 'gun',     label: 'Gun' },
        { key: 'hash',    label: 'Hash' },
        { key: 'helmet',  label: 'Helmet' },
        { key: 'key',     label: 'Key' },
        { key: 'magnify', label: 'Magnifying Glass' },
        { key: 'pants',   label: 'Pants' },
        { key: 'potion',  label: 'Potion' },
        { key: 'power',   label: 'Power Button' },
        { key: 'shield',  label: 'Shield' },
        { key: 'shirt',   label: 'T-Shirt' },
        { key: 'shoes',   label: 'Shoes' },
        { key: 'staff',   label: 'Staff' },
        { key: 'sword',   label: 'Sword' },
        { key: 'torch',   label: 'Torch' },
        { key: 'wand',    label: 'Wand' }
    ];

    // ── Built-in Attribute Presets ──
    var LIST_ATTR_PRESETS = [
        { key: 'presetWeight',      type: 'number',      icon: 'scale',  defaultValue: 0 },
        { key: 'presetQuantity',    type: 'quantity',    icon: 'hash',   defaultValue: 1 },
        { key: 'presetDurability',   type: 'number-pair', icon: 'armour', defaultValue: { current: 0, max: 0 } },
        { key: 'presetEquipped',     type: 'toggle',      icon: 'helmet', defaultValue: false },
        { key: 'presetActive',       type: 'toggle',      icon: 'power',  defaultValue: false },
        { key: 'presetBroken',       type: 'toggle',      icon: 'sword',  defaultValue: false },
        { key: 'presetConsumable',   type: 'toggle',      icon: 'apple',  defaultValue: false },
        { key: 'presetDamage',       type: 'text',        icon: 'sword',  defaultValue: '' },
        { key: 'presetBulk',         type: 'dropdown',    icon: 'shirt',  defaultValue: 'XS', options: ['XS', 'S', 'M', 'L', 'XL'] }
    ];

    // ── Attribute Delete Confirmation ──
    function showAttrDeleteConfirm(attrName, onConfirm) {
        var overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        var panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        var title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = t('list.removeAttrTitle');

        var msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = t('list.removeAttrConfirm', { name: attrName });

        var actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel';
        cancelBtn.textContent = t('delete.cancel');

        var confirmBtn = document.createElement('button');
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
            setTimeout(function () { overlay.remove(); }, 200);
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
        var items = content.items.slice();
        if (content.sortBy === null) {
            items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            return items;
        }
        if (content.sortBy === '__name__') {
            var dir = content.sortDir === 'desc' ? -1 : 1;
            items.sort(function (a, b) {
                var an = (a.name || '').toLowerCase();
                var bn = (b.name || '').toLowerCase();
                return (an < bn ? -1 : an > bn ? 1 : 0) * dir;
            });
            return items;
        }
        var attrId = content.sortBy;
        var dir = content.sortDir === 'desc' ? -1 : 1;
        var attr = content.attributes.find(function (a) { return a.id === attrId; });
        var attrType = attr ? attr.type : 'text';
        items.sort(function (a, b) {
            var av = a.values ? a.values[attrId] : null;
            var bv = b.values ? b.values[attrId] : null;
            var result = 0;
            switch (attrType) {
                case 'toggle':
                    result = (av ? 1 : 0) - (bv ? 1 : 0);
                    break;
                case 'quantity':
                case 'number':
                    result = (parseFloat(av) || 0) - (parseFloat(bv) || 0);
                    break;
                case 'number-pair':
                    result = ((av && av.current != null) ? parseFloat(av.current) || 0 : 0) -
                             ((bv && bv.current != null) ? parseFloat(bv.current) || 0 : 0);
                    break;
                case 'dropdown': {
                    var opts = attr.options || [];
                    var ai = opts.indexOf(av != null ? av : '');
                    var bi = opts.indexOf(bv != null ? bv : '');
                    result = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                    break;
                }
                default: {
                    var aStr = (av || '').toString().toLowerCase();
                    var bStr = (bv || '').toString().toLowerCase();
                    result = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                }
            }
            return result * dir;
        });
        return items;
    }

    // ── Attribute Value Cell ──
    function renderAttrValue(attr, value, isPlayMode, item, onUpdate) {
        var cell = document.createElement('div');
        cell.className = 'list-attr-cell list-attr-' + attr.type;

        if (attr.type === 'toggle') {
            var toggleIconSvg = (attr.icon && LIST_ICON_SVG[attr.icon])
                ? LIST_ICON_SVG[attr.icon]
                : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/></svg>';
            var toggleBtn = document.createElement('button');
            toggleBtn.className = 'list-attr-toggle-btn' + (value ? ' is-on' : ' is-off');
            toggleBtn.innerHTML = toggleIconSvg;
            toggleBtn.addEventListener('click', function () {
                var newVal = toggleBtn.classList.contains('is-off');
                toggleBtn.classList.toggle('is-on', newVal);
                toggleBtn.classList.toggle('is-off', !newVal);
                onUpdate(newVal);
            });
            cell.appendChild(toggleBtn);
            return cell;
        }

        if (attr.type === 'quantity') {
            var val = parseInt(value) || 0;
            if (isPlayMode) {
                var qtySpan = document.createElement('span');
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
                var qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.className = 'list-attr-number-input';
                qtyInput.value = val;
                qtyInput.addEventListener('input', function () { onUpdate(parseInt(qtyInput.value) || 0); });
                qtyInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === 'Escape') qtyInput.blur(); });
                cell.appendChild(qtyInput);
            }
            return cell;
        }

        if (attr.type === 'number') {
            if (isPlayMode) {
                var numSpan = document.createElement('span');
                numSpan.className = 'list-attr-number-display';
                numSpan.textContent = value != null ? value : 0;
                cell.appendChild(numSpan);
            } else {
                var numInput = document.createElement('input');
                numInput.type = 'number';
                numInput.className = 'list-attr-number-input';
                numInput.value = value != null ? value : 0;
                numInput.addEventListener('input', function () { onUpdate(parseFloat(numInput.value) || 0); });
                numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === 'Escape') numInput.blur(); });
                cell.appendChild(numInput);
            }
            return cell;
        }

        if (attr.type === 'number-pair') {
            var pairCur = value && value.current != null ? value.current : 0;
            var pairMax = value && value.max != null ? value.max : 0;
            if (isPlayMode) {
                var pairSpan = document.createElement('span');
                pairSpan.className = 'list-attr-pair-display';
                pairSpan.textContent = pairCur + ' / ' + pairMax;
                cell.appendChild(pairSpan);
            } else {
                var curInput = document.createElement('input');
                curInput.type = 'number';
                curInput.className = 'list-attr-pair-input';
                curInput.value = pairCur;
                var pairSep = document.createElement('span');
                pairSep.className = 'list-attr-pair-sep';
                pairSep.textContent = '/';
                var maxInput = document.createElement('input');
                maxInput.type = 'number';
                maxInput.className = 'list-attr-pair-input';
                maxInput.value = pairMax;
                var updatePair = function () {
                    onUpdate({ current: parseFloat(curInput.value) || 0, max: parseFloat(maxInput.value) || 0 });
                };
                curInput.addEventListener('input', updatePair);
                maxInput.addEventListener('input', updatePair);
                curInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === 'Escape') curInput.blur(); });
                maxInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === 'Escape') maxInput.blur(); });
                cell.appendChild(curInput);
                cell.appendChild(pairSep);
                cell.appendChild(maxInput);
            }
            return cell;
        }

        if (attr.type === 'dropdown') {
            var opts = attr.options || [];
            if (isPlayMode) {
                var dropSpan = document.createElement('span');
                dropSpan.className = 'list-attr-dropdown-display';
                dropSpan.textContent = value != null ? value : (opts[0] || '');
                cell.appendChild(dropSpan);
            } else {
                var sel = document.createElement('select');
                sel.className = 'list-attr-dropdown-select';
                opts.forEach(function (opt) {
                    var option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === value) option.selected = true;
                    sel.appendChild(option);
                });
                sel.addEventListener('change', function () { onUpdate(sel.value); });
                cell.appendChild(sel);
            }
            return cell;
        }

        // text
        if (isPlayMode) {
            var txtSpan = document.createElement('span');
            txtSpan.className = 'list-attr-text-display';
            txtSpan.textContent = value != null ? value : '';
            cell.appendChild(txtSpan);
        } else {
            var txtInput = document.createElement('input');
            txtInput.type = 'text';
            txtInput.className = 'list-attr-text-input';
            txtInput.value = value != null ? value : '';
            txtInput.addEventListener('input', function () { onUpdate(txtInput.value); });
            txtInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === 'Escape') txtInput.blur(); });
            cell.appendChild(txtInput);
        }
        return cell;
    }

    // ── Column Headers ──
    function renderColumnHeaders(content, bodyEl, data, isPlayMode, isSorted) {
        var pinnedAttrs = content.attributes.filter(function (a) { return a.pinned; });

        var headerRow = document.createElement('div');
        headerRow.className = 'list-header-row' + (!isPlayMode && !isSorted ? ' cols-draggable' : '');

        // Handle spacer — matches drag handle width when handles are visible
        if (!isPlayMode && !isSorted) {
            var handleSpacer = document.createElement('div');
            handleSpacer.className = 'list-col-handle-spacer';
            headerRow.appendChild(handleSpacer);
        }

        // Name column header — sortable (alphabetical)
        var nameIsActive = content.sortBy === '__name__';
        var nameHeader = document.createElement('div');
        nameHeader.className = 'list-col-header list-col-name' + (nameIsActive ? ' active-sort' : '');
        nameHeader.title = escapeHtml(nameIsActive
            ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual'))
            : t('list.sortAsc'));

        var nameLabel = document.createElement('span');
        nameLabel.className = 'list-col-header-label';
        nameLabel.textContent = t('list.colName');
        nameHeader.appendChild(nameLabel);

        if (nameIsActive) {
            var nameIndicator = document.createElement('span');
            nameIndicator.className = 'list-sort-indicator';
            nameIndicator.innerHTML = content.sortDir === 'asc'
                ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
                : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
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
            var isActive = content.sortBy === attr.id;
            var colHeader = document.createElement('div');
            colHeader.className = 'list-col-header list-col-attr' + (isActive ? ' active-sort' : '');
            colHeader.dataset.attrId = attr.id;
            colHeader.title = escapeHtml(isActive
                ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual'))
                : t('list.sortAsc'));

            var label = document.createElement('span');
            label.className = 'list-col-header-label';
            label.textContent = attr.name;
            colHeader.appendChild(label);

            if (isActive) {
                var indicator = document.createElement('span');
                indicator.className = 'list-sort-indicator';
                indicator.innerHTML = content.sortDir === 'asc'
                    ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
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
        var actionsSpacer = document.createElement('div');
        actionsSpacer.className = 'list-col-header list-col-actions';
        headerRow.appendChild(actionsSpacer);

        return headerRow;
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

        // Track ID mapping from source attr -> target attr
        const attrMapping = {};

        // Merge attributes: Match by name + type
        srcContent.attributes.forEach(srcAttr => {
            const exists = tgtContent.attributes.find(a => a.name === srcAttr.name && a.type === srcAttr.type);
            
            if (exists) {
                // Feature exists, map source ID to existing target ID
                attrMapping[srcAttr.id] = exists.id;
            } else {
                // Feature doesn't exist, bring it over
                const clonedAttr = JSON.parse(JSON.stringify(srcAttr));
                tgtContent.attributes.push(clonedAttr);
                attrMapping[srcAttr.id] = clonedAttr.id;
                
                // Give existing target items the default value for this new attribute
                tgtContent.items.forEach(tgtItem => {
                    if (!tgtItem.values) tgtItem.values = {};
                    tgtItem.values[clonedAttr.id] = clonedAttr.defaultValue;
                });
            }
        });

        // Re-key the transferred item's values to use target attribute IDs
        const newValues = {};
        if (item.values) {
            Object.keys(item.values).forEach(oldId => {
                if (attrMapping[oldId]) {
                    newValues[attrMapping[oldId]] = item.values[oldId];
                }
            });
        }
        item.values = newValues;

        // Fill any target attributes the item is missing
        tgtContent.attributes.forEach(tgtAttr => {
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

    // ── Column Header Sortable (Edit Mode — reorder columns) ──
    function initColumnSortable(headerRow, content, bodyEl, data) {
        if (!headerRow) return;
        headerRow._colSortable = new Sortable(headerRow, {
            draggable: '.list-col-attr',
            animation: 150,
            ghostClass: 'list-col-ghost',
            onEnd: function () {
                var newPinnedIds = Array.from(headerRow.querySelectorAll('.list-col-attr'))
                    .map(function (el) { return el.dataset.attrId; });
                var pinnedInNewOrder = newPinnedIds
                    .map(function (id) { return content.attributes.find(function (a) { return a.id === id; }); })
                    .filter(Boolean);
                var pinnedIdx = 0;
                content.attributes = content.attributes.map(function (a) {
                    return a.pinned ? pinnedInNewOrder[pinnedIdx++] : a;
                });
                scheduleSave();
                renderListBody(bodyEl, data, false);
            }
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

        const pinnedAttrs = content.attributes.filter(a => a.pinned);
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
            sortedItems.forEach(item => {
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
                    pinnedAttrs.forEach(attr => {
                        const val = (item.values && item.values[attr.id] != null) ? item.values[attr.id] : attr.defaultValue;
                        row.appendChild(renderAttrValue(attr, val, true, item, function () {}));
                    });

                    // Expand button
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'list-item-expand-btn';
                    expandBtn.title = escapeHtml(t('list.inspectTitle'));
                    expandBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
                    expandBtn.addEventListener('click', function() {
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
                    pinnedAttrs.forEach(attr => {
                        const val = (item.values && item.values[attr.id] != null) ? item.values[attr.id] : attr.defaultValue;
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
                    deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                    deleteBtn.addEventListener('click', () => {
                        const idx = content.items.findIndex(i => i.id === item.id);
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
                    showAttrDeleteConfirm(attr.name, function () {
                        var idx = content.attributes.indexOf(attr);
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

            availablePresets.sort(function (a, b) {
                return t('list.' + a.key).localeCompare(t('list.' + b.key));
            });

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
                    if (preset.options) newAttr.options = preset.options.slice();
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
            openAttrWizard(moduleEl, data, content, panel);
        });
        customSection.appendChild(customBtn);
        body.appendChild(customSection);

        panel.appendChild(body);
    }

    // ── Attribute Wizard ──
    function openAttrWizard(moduleEl, data, content, panel) {
        var overlay = document.createElement('div');
        overlay.className = 'attr-wizard-overlay';

        var wizPanel = document.createElement('div');
        wizPanel.className = 'attr-wizard-panel';

        // Header
        var header = document.createElement('div');
        header.className = 'attr-wizard-header';

        var titleEl = document.createElement('span');
        titleEl.className = 'attr-wizard-title';
        titleEl.textContent = t('list.attrWizardTitle');

        var closeBtn = document.createElement('button');
        closeBtn.className = 'attr-wizard-close';
        closeBtn.title = escapeHtml(t('list.close'));
        closeBtn.innerHTML = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        var body = document.createElement('div');
        body.className = 'attr-wizard-body';

        // -- Name section --
        var nameSection = document.createElement('div');
        nameSection.className = 'attr-wizard-section';

        var nameLabel = document.createElement('label');
        nameLabel.className = 'attr-wizard-label';
        nameLabel.setAttribute('for', 'attr-wizard-name-input');
        nameLabel.textContent = t('list.attrName');

        var nameInput = document.createElement('input');
        nameInput.id = 'attr-wizard-name-input';
        nameInput.className = 'attr-wizard-name-input';
        nameInput.type = 'text';
        nameInput.placeholder = t('list.attrNamePlaceholder');
        nameInput.autocomplete = 'off';

        nameSection.appendChild(nameLabel);
        nameSection.appendChild(nameInput);

        // -- Type section --
        var typeSection = document.createElement('div');
        typeSection.className = 'attr-wizard-section';

        var typeLabel = document.createElement('span');
        typeLabel.className = 'attr-wizard-label';
        typeLabel.textContent = t('list.attrType');
        typeSection.appendChild(typeLabel);

        var typeGrid = document.createElement('div');
        typeGrid.className = 'attr-wizard-type-grid';

        var TYPES = [
            {
                key: 'toggle',
                glyphHtml: '<svg class="icon" width="22" height="13" viewBox="0 0 36 22" stroke-width="2.5"><rect x="1" y="1" width="34" height="20" rx="10"/><circle cx="26" cy="11" r="7" fill="currentColor" stroke="none"/></svg>',
                nameKey: 'list.attrTypeToggle',
                descKey: 'list.attrTypeToggleDesc'
            },
            {
                key: 'number',
                glyphHtml: '<span style="font-size:15px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;">42</span>',
                nameKey: 'list.attrTypeNumber',
                descKey: 'list.attrTypeNumberDesc'
            },
            {
                key: 'number-pair',
                glyphHtml: '<span style="font-size:12px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;letter-spacing:-0.02em;">8 / 10</span>',
                nameKey: 'list.attrTypeNumberPair',
                descKey: 'list.attrTypeNumberPairDesc'
            },
            {
                key: 'text',
                glyphHtml: '<span style="font-size:15px;font-weight:700;font-family:Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;font-style:italic;">Aa</span>',
                nameKey: 'list.attrTypeText',
                descKey: 'list.attrTypeTextDesc'
            },
            {
                key: 'quantity',
                glyphHtml: '<span style="font-size:16px;font-weight:800;color:var(--cv-accent);">#</span>',
                nameKey: 'list.attrTypeQuantity',
                descKey: 'list.attrTypeQuantityDesc'
            }
        ];

        var selectedType = 'toggle';

        TYPES.forEach(function (typeObj) {
            var card = document.createElement('button');
            card.className = 'attr-wizard-type-card' + (typeObj.key === 'toggle' ? ' selected' : '');
            card.dataset.type = typeObj.key;

            var glyph = document.createElement('div');
            glyph.className = 'attr-wizard-type-glyph';
            glyph.innerHTML = typeObj.glyphHtml;

            var typeName = document.createElement('span');
            typeName.className = 'attr-wizard-type-name';
            typeName.textContent = t(typeObj.nameKey);

            var typeDesc = document.createElement('span');
            typeDesc.className = 'attr-wizard-type-desc';
            typeDesc.textContent = t(typeObj.descKey);

            card.appendChild(glyph);
            card.appendChild(typeName);
            card.appendChild(typeDesc);

            card.addEventListener('click', function () {
                typeGrid.querySelectorAll('.attr-wizard-type-card').forEach(function (c) { c.classList.remove('selected'); });
                card.classList.add('selected');
                selectedType = typeObj.key;
            });

            typeGrid.appendChild(card);
        });

        typeSection.appendChild(typeGrid);

        // -- Icon section --
        var iconSection = document.createElement('div');
        iconSection.className = 'attr-wizard-section';

        var iconLabel = document.createElement('span');
        iconLabel.className = 'attr-wizard-label';
        iconLabel.innerHTML = escapeHtml(t('list.attrIcon')) + ' <span class="attr-wizard-label-note">— ' + escapeHtml(t('list.attrIconOptional')) + '</span>';
        iconSection.appendChild(iconLabel);

        var iconGrid = document.createElement('div');
        iconGrid.className = 'attr-wizard-icon-grid';

        var selectedIcon = null;

        ATTR_WIZARD_ICONS.forEach(function (ic) {
            var btn = document.createElement('button');
            btn.className = 'attr-wizard-icon-btn' + (ic.key === null ? ' selected' : '');
            btn.dataset.iconKey = ic.key || '';
            btn.title = ic.label;
            if (ic.key === null) {
                btn.textContent = '—';
            } else {
                btn.innerHTML = LIST_ICON_SVG[ic.key] || '';
            }
            btn.addEventListener('click', function () {
                iconGrid.querySelectorAll('.attr-wizard-icon-btn').forEach(function (b) { b.classList.remove('selected'); });
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
        var footer = document.createElement('div');
        footer.className = 'attr-wizard-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'attr-wizard-btn-cancel';
        cancelBtn.textContent = t('delete.cancel');

        var createBtn = document.createElement('button');
        createBtn.className = 'attr-wizard-btn-create';
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
            var name = nameInput.value.trim();
            if (!name) return;

            var defaultValue;
            switch (selectedType) {
                case 'toggle':      defaultValue = false; break;
                case 'number':      defaultValue = 0; break;
                case 'quantity':    defaultValue = 1; break;
                case 'number-pair': defaultValue = { current: 0, max: 0 }; break;
                case 'text':        defaultValue = ''; break;
                default:            defaultValue = null;
            }

            var newAttr = {
                id: generateListId('attr'),
                name: name,
                type: selectedType,
                icon: selectedIcon,
                defaultValue: defaultValue,
                pinned: false,
                builtIn: false
            };

            content.attributes.push(newAttr);
            content.items.forEach(function (item) {
                if (!item.values) item.values = {};
                item.values[newAttr.id] = typeof defaultValue === 'object' && defaultValue !== null
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
            const realItemIdx = content.items.findIndex(i => i.id === ctx.itemProxy.id);
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
        const itemOriginal = content.items.find(i => i.id === itemId);
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
            }
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
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeXBtn.title = t('list.close');
        closeXBtn.addEventListener('click', function() { closeItemInspect(true); });

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
        nameInput.addEventListener('input', function() { itemProxy.name = nameInput.value; });
        
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
        notesInput.addEventListener('input', function() { itemProxy.notes = notesInput.value; });
        
        notesField.appendChild(notesLabel);
        notesField.appendChild(notesInput);
        body.appendChild(notesField);

        // Attributes grid
        if (content.attributes.length > 0) {
            const attrGrid = document.createElement('div');
            attrGrid.className = 'list-inspect-attr-grid';
            
            content.attributes.forEach(attr => {
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

                const val = (itemProxy.values && itemProxy.values[attr.id] != null) ? itemProxy.values[attr.id] : attr.defaultValue;
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
        delBtn.addEventListener('click', function() {
            showAttrDeleteConfirm(itemProxy.name || t('list.itemName'), function() {
                // Remove item from real payload
                const idx = content.items.findIndex(i => i.id === itemProxy.id);
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
        closeBtn.addEventListener('click', function() { closeItemInspect(true); });
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'list-inspect-btn-save';
        saveBtn.textContent = t('list.save');
        saveBtn.addEventListener('click', function() { closeItemInspect(false); });
        
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
