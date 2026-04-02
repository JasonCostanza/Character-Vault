// ── Resistance Module ──
// Damage type resistances, immunities, and weaknesses with drag-to-assign staging area.
(function () {
    'use strict';

    // ── ID Generation ──
    function generateResId() {
        return 'res_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureResContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { layout: 'columns', immunities: [], resistances: [], weaknesses: [], customTypes: [] };
        }
        if (!data.content.layout) data.content.layout = 'columns';
        if (!Array.isArray(data.content.immunities)) data.content.immunities = [];
        if (!Array.isArray(data.content.resistances)) data.content.resistances = [];
        if (!Array.isArray(data.content.weaknesses)) data.content.weaknesses = [];
        if (!Array.isArray(data.content.customTypes)) data.content.customTypes = [];
        return data.content;
    }

    // ── Pre-defined Resistance Types ──
    var PREDEFINED_RESISTANCE_TYPES = [
        { key: 'acid',        nameKey: 'res.typeAcid' },
        { key: 'bludgeoning', nameKey: 'res.typeBludgeoning' },
        { key: 'cold',        nameKey: 'res.typeCold' },
        { key: 'fire',        nameKey: 'res.typeFire' },
        { key: 'force',       nameKey: 'res.typeForce' },
        { key: 'lightning',   nameKey: 'res.typeLightning' },
        { key: 'necrotic',    nameKey: 'res.typeNecrotic' },
        { key: 'piercing',    nameKey: 'res.typePiercing' },
        { key: 'poison',      nameKey: 'res.typePoison' },
        { key: 'psychic',     nameKey: 'res.typePsychic' },
        { key: 'radiant',     nameKey: 'res.typeRadiant' },
        { key: 'slashing',    nameKey: 'res.typeSlashing' },
        { key: 'thunder',     nameKey: 'res.typeThunder' }
    ];

    // ── Resistance Icon SVGs ──
    // ── Resistance Icon Library — references shared CV_ICONS ──
    var RESISTANCE_ICON_SVG = CV_ICONS;

    // ── Helpers ──

    function getResName(item, content) {
        var predef = PREDEFINED_RESISTANCE_TYPES.find(function (p) { return p.key === item.typeKey; });
        if (predef) return t(predef.nameKey);
        var custom = (content.customTypes || []).find(function (c) { return c.key === item.typeKey; });
        if (custom) return custom.name;
        return item.typeKey || '?';
    }

    function getResIconSvg(item, content) {
        // Pre-defined types use their key as icon key
        if (RESISTANCE_ICON_SVG[item.typeKey]) return RESISTANCE_ICON_SVG[item.typeKey];
        // Custom types store an icon key
        var custom = (content.customTypes || []).find(function (c) { return c.key === item.typeKey; });
        if (custom && custom.icon && RESISTANCE_ICON_SVG[custom.icon]) {
            return RESISTANCE_ICON_SVG[custom.icon];
        }
        return '';
    }

    function getAssignedKeys(content) {
        var keys = [];
        ['immunities', 'resistances', 'weaknesses'].forEach(function (col) {
            (content[col] || []).forEach(function (item) { keys.push(item.typeKey); });
        });
        return keys;
    }

    function getAvailableTypes(content) {
        var assigned = getAssignedKeys(content);
        var available = [];
        PREDEFINED_RESISTANCE_TYPES.forEach(function (p) {
            if (assigned.indexOf(p.key) === -1) {
                available.push({ key: p.key, name: t(p.nameKey), icon: p.key, isCustom: false });
            }
        });
        (content.customTypes || []).forEach(function (c) {
            if (assigned.indexOf(c.key) === -1) {
                available.push({ key: c.key, name: c.name, icon: c.icon, isCustom: true });
            }
        });
        available.sort(function (a, b) { return a.name.localeCompare(b.name); });
        return available;
    }

    function sortColumnAlpha(arr, content) {
        arr.sort(function (a, b) { return getResName(a, content).localeCompare(getResName(b, content)); });
    }

    var COLUMN_KEYS = ['immunities', 'resistances', 'weaknesses'];
    var COLUMN_LABEL_KEYS = { immunities: 'res.immunities', resistances: 'res.resistances', weaknesses: 'res.weaknesses' };

    // ── Value Prompt ──

    function showValuePrompt(parentEl, defaultValue, onConfirm, onCancel) {
        var existing = parentEl.querySelector('.res-value-prompt');
        if (existing) existing.remove();

        var prompt = document.createElement('div');
        prompt.className = 'res-value-prompt';

        prompt.innerHTML =
            '<div class="res-value-prompt-header">' +
                '<span class="res-value-prompt-title">' + escapeHtml(t('res.valuePrompt')) + '</span>' +
            '</div>' +
            '<input type="text" class="res-value-input" placeholder="' + escapeHtml(t('res.valuePlaceholder')) + '" spellcheck="false" autocomplete="off">' +
            '<div class="res-value-prompt-actions">' +
                '<button class="res-value-cancel btn-secondary sm">' + escapeHtml(t('res.cancel')) + '</button>' +
                '<button class="res-value-ok">' + escapeHtml(t('res.ok')) + '</button>' +
            '</div>';

        var input = prompt.querySelector('.res-value-input');
        var okBtn = prompt.querySelector('.res-value-ok');
        var cancelBtn = prompt.querySelector('.res-value-cancel');

        if (defaultValue) input.value = defaultValue;

        function confirm() {
            var val = input.value.trim() || '0';
            prompt.remove();
            onConfirm(val);
        }

        function cancel() {
            prompt.remove();
            if (onCancel) onCancel();
        }

        okBtn.addEventListener('click', confirm);
        cancelBtn.addEventListener('click', cancel);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });

        parentEl.appendChild(prompt);
        input.focus();
        input.select();
    }

    // ── Play Mode Rendering ──

    function renderPlayBody(bodyEl, data) {
        var content = ensureResContent(data);
        bodyEl.innerHTML = '';

        var hasAny = content.immunities.length || content.resistances.length || content.weaknesses.length;

        if (!hasAny) {
            var empty = document.createElement('div');
            empty.className = 'res-empty-state';
            empty.textContent = t('res.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        var container = document.createElement('div');
        container.className = 'res-play-container ' + (content.layout === 'rows' ? 'res-layout-rows' : 'res-layout-columns');

        COLUMN_KEYS.forEach(function (colKey) {
            var items = content[colKey];
            if (!items.length) return;

            sortColumnAlpha(items, content);

            var col = document.createElement('div');
            col.className = 'res-play-section';

            var label = document.createElement('div');
            label.className = 'res-play-section-label';
            label.textContent = t(COLUMN_LABEL_KEYS[colKey]);
            col.appendChild(label);

            var itemsWrap = document.createElement('div');
            itemsWrap.className = 'res-play-items';

            items.forEach(function (item) {
                var el = document.createElement('div');
                el.className = 'res-play-item';
                if (item.active === false) el.classList.add('inactive');
                el.dataset.id = item.id;

                var name = getResName(item, content);
                var valueText = colKey === 'immunities' ? t('res.immune') : (item.value || '');
                var tooltipText = name + (valueText ? ' \u2014 ' + valueText : '');
                if (item.active === false) tooltipText += ' (' + t('res.inactive') + ')';
                el.setAttribute('data-tooltip', tooltipText);

                var iconSvg = getResIconSvg(item, content);
                if (iconSvg) {
                    var iconSpan = document.createElement('span');
                    iconSpan.className = 'res-play-icon';
                    iconSpan.innerHTML = iconSvg;
                    el.appendChild(iconSpan);
                }

                var nameSpan = document.createElement('span');
                nameSpan.className = 'res-play-name';
                nameSpan.textContent = name;
                el.appendChild(nameSpan);

                if (valueText && colKey !== 'immunities') {
                    var valSpan = document.createElement('span');
                    valSpan.className = 'res-play-value';
                    valSpan.textContent = valueText;
                    el.appendChild(valSpan);
                }

                // Toggle active/inactive on click
                (function (el, item, colKey) {
                    el.addEventListener('click', function () {
                        item.active = !item.active;
                        el.classList.toggle('inactive');

                        var updatedName = getResName(item, content);
                        var updatedValue = colKey === 'immunities' ? t('res.immune') : (item.value || '');
                        var updatedTooltip = updatedName + (updatedValue ? ' \u2014 ' + updatedValue : '');
                        if (item.active === false) updatedTooltip += ' (' + t('res.inactive') + ')';
                        el.setAttribute('data-tooltip', updatedTooltip);

                        scheduleSave();
                    });
                })(el, item, colKey);

                itemsWrap.appendChild(el);
            });

            col.appendChild(itemsWrap);
            container.appendChild(col);
        });

        bodyEl.appendChild(container);
    }

    // ── Edit Mode Rendering ──

    function renderEditBody(bodyEl, data) {
        var content = ensureResContent(data);
        bodyEl.innerHTML = '';

        var hasAny = content.immunities.length || content.resistances.length || content.weaknesses.length;

        if (!hasAny) {
            var empty = document.createElement('div');
            empty.className = 'res-empty-state';
            empty.textContent = t('res.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        var container = document.createElement('div');
        container.className = 'res-edit-container ' + (content.layout === 'rows' ? 'res-layout-rows' : 'res-layout-columns');

        COLUMN_KEYS.forEach(function (colKey) {
            var items = content[colKey];
            if (!items.length) return;

            sortColumnAlpha(items, content);

            var col = document.createElement('div');
            col.className = 'res-edit-section';

            var label = document.createElement('div');
            label.className = 'res-edit-section-label';
            label.textContent = t(COLUMN_LABEL_KEYS[colKey]);
            col.appendChild(label);

            var itemsWrap = document.createElement('div');
            itemsWrap.className = 'res-edit-items';

            items.forEach(function (item) {
                var el = document.createElement('div');
                el.className = 'res-edit-item';

                var iconSvg = getResIconSvg(item, content);
                if (iconSvg) {
                    var iconSpan = document.createElement('span');
                    iconSpan.className = 'res-edit-icon';
                    iconSpan.innerHTML = iconSvg;
                    el.appendChild(iconSpan);
                }

                var nameSpan = document.createElement('span');
                nameSpan.className = 'res-edit-name';
                nameSpan.textContent = getResName(item, content);
                el.appendChild(nameSpan);

                if (colKey !== 'immunities') {
                    var valSpan = document.createElement('span');
                    valSpan.className = 'res-edit-value';
                    valSpan.textContent = item.value || '';
                    el.appendChild(valSpan);
                } else {
                    var immuneSpan = document.createElement('span');
                    immuneSpan.className = 'res-edit-value res-edit-immune';
                    immuneSpan.textContent = t('res.immune');
                    el.appendChild(immuneSpan);
                }

                itemsWrap.appendChild(el);
            });

            col.appendChild(itemsWrap);
            container.appendChild(col);
        });

        bodyEl.appendChild(container);
    }

    // ── Settings Panel ──

    function closeResSettingsPanel(moduleEl, data) {
        var overlay = document.querySelector('.res-settings-overlay');
        if (!overlay) return;
        // Destroy any SortableJS instances
        overlay.querySelectorAll('.res-column-list, .res-staging-grid').forEach(function (el) {
            if (el._sortable) { el._sortable.destroy(); el._sortable = null; }
        });
        overlay.remove();
        // Re-render edit body
        var bodyEl = moduleEl.querySelector('.module-body');
        renderEditBody(bodyEl, data);
        snapModuleHeight(moduleEl, data);
    }

    function openResSettingsPanel(moduleEl, data) {
        closeResSettingsPanel(moduleEl, data);
        var content = ensureResContent(data);

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay res-settings-overlay';

        var panel = document.createElement('div');
        panel.className = 'cv-modal-panel res-settings-modal';

        renderSettingsPanelContent(panel, moduleEl, data, content);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Close on overlay background click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeResSettingsPanel(moduleEl, data);
        });

        // Close on Escape
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeResSettingsPanel(moduleEl, data);
        });
        overlay.setAttribute('tabindex', '-1');
        overlay.focus();
    }

    function renderSettingsPanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // ── Header ──
        var header = document.createElement('div');
        header.className = 'cv-modal-header';

        var title = document.createElement('span');
        title.className = 'cv-modal-title';
        title.textContent = t('res.moduleSettings');
        header.appendChild(title);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('res.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', function () {
            closeResSettingsPanel(moduleEl, data);
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // ── Body ──
        var body = document.createElement('div');
        body.className = 'cv-modal-body res-settings-body';

        // ── Columns (drop zones) ──
        var columnsRow = document.createElement('div');
        columnsRow.className = 'res-settings-columns';

        COLUMN_KEYS.forEach(function (colKey) {
            var colWrap = document.createElement('div');
            colWrap.className = 'res-column';
            colWrap.dataset.column = colKey;

            var colHeader = document.createElement('div');
            colHeader.className = 'res-column-header';
            colHeader.textContent = t(COLUMN_LABEL_KEYS[colKey]);
            colWrap.appendChild(colHeader);

            var colList = document.createElement('div');
            colList.className = 'res-column-list';
            colList.dataset.column = colKey;

            sortColumnAlpha(content[colKey], content);

            content[colKey].forEach(function (item) {
                var itemEl = createAssignedItemEl(item, content, colKey, data);
                colList.appendChild(itemEl);
            });

            colWrap.appendChild(colList);
            columnsRow.appendChild(colWrap);
        });

        body.appendChild(columnsRow);

        // ── Staging Area ──
        var stagingSection = document.createElement('div');
        stagingSection.className = 'res-staging-section';

        var stagingLabel = document.createElement('div');
        stagingLabel.className = 'res-staging-label';
        stagingLabel.textContent = t('res.availableTypes');
        stagingSection.appendChild(stagingLabel);

        var stagingGrid = document.createElement('div');
        stagingGrid.className = 'res-staging-grid';

        var available = getAvailableTypes(content);
        available.forEach(function (type) {
            var itemEl = document.createElement('div');
            itemEl.className = 'res-staging-item';
            itemEl.dataset.typeKey = type.key;

            var iconSvg = RESISTANCE_ICON_SVG[type.icon] || '';
            if (iconSvg) {
                var iconSpan = document.createElement('span');
                iconSpan.className = 'res-staging-icon';
                iconSpan.innerHTML = iconSvg;
                itemEl.appendChild(iconSpan);
            }

            var nameSpan = document.createElement('span');
            nameSpan.className = 'res-staging-name';
            nameSpan.textContent = type.name;
            itemEl.appendChild(nameSpan);

            stagingGrid.appendChild(itemEl);
        });

        stagingSection.appendChild(stagingGrid);

        // Create Custom button
        var createBtn = document.createElement('button');
        createBtn.className = 'res-create-custom-btn';
        createBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '<span>' + escapeHtml(t('res.createCustom')) + '</span>';
        createBtn.addEventListener('click', function () {
            openResWizard(moduleEl, data, panel);
        });
        stagingSection.appendChild(createBtn);

        body.appendChild(stagingSection);
        panel.appendChild(body);

        // ── Init SortableJS ──
        initSettingsSortables(panel, moduleEl, data, content);
    }

    function createAssignedItemEl(item, content, colKey, data) {
        var el = document.createElement('div');
        el.className = 'res-assigned-item';
        el.dataset.id = item.id;
        el.dataset.typeKey = item.typeKey;

        var iconSvg = getResIconSvg(item, content);
        if (iconSvg) {
            var iconSpan = document.createElement('span');
            iconSpan.className = 'res-assigned-icon';
            iconSpan.innerHTML = iconSvg;
            el.appendChild(iconSpan);
        }

        var nameSpan = document.createElement('span');
        nameSpan.className = 'res-assigned-name';
        nameSpan.textContent = getResName(item, content);
        el.appendChild(nameSpan);

        if (colKey !== 'immunities') {
            var valSpan = document.createElement('span');
            valSpan.className = 'res-assigned-value';
            valSpan.textContent = item.value || '';

            // Click to edit value
            valSpan.addEventListener('click', function (e) {
                e.stopPropagation();
                var settingsBody = el.closest('.cv-modal-body');
                if (!settingsBody) return;

                showValuePrompt(settingsBody, item.value, function (newVal) {
                    item.value = newVal;
                    valSpan.textContent = newVal;
                    scheduleSave();
                });
            });
            el.appendChild(valSpan);
        }

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'res-assigned-delete';
        deleteBtn.title = t('res.remove');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Remove from data
            var idx = content[colKey].findIndex(function (r) { return r.id === item.id; });
            if (idx !== -1) content[colKey].splice(idx, 1);
            scheduleSave();
            // Re-render panel
            var panel = el.closest('.cv-modal-panel');
            var moduleEl = el.closest('.module') || document.querySelector('.module[data-id="' + data.id + '"]');
            if (panel) {
                renderSettingsPanelContent(panel, moduleEl, data, content);
            }
        });
        el.appendChild(deleteBtn);

        return el;
    }

    // ── SortableJS Setup ──

    function initSettingsSortables(panel, moduleEl, data, content) {
        var stagingGrid = panel.querySelector('.res-staging-grid');
        var columnLists = panel.querySelectorAll('.res-column-list');

        // Staging area — source only
        if (stagingGrid) {
            stagingGrid._sortable = new Sortable(stagingGrid, {
                group: { name: 'res-assign', pull: 'clone', put: false },
                sort: false,
                animation: 150,
                ghostClass: 'res-ghost',
                draggable: '.res-staging-item'
            });
        }

        // Column drop zones
        columnLists.forEach(function (colList) {
            colList._sortable = new Sortable(colList, {
                group: { name: 'res-assign', pull: true, put: true },
                sort: false,
                animation: 150,
                ghostClass: 'res-ghost',
                draggable: '.res-assigned-item',
                onAdd: function (evt) {
                    var toColumn = colList.dataset.column;
                    var fromColumn = evt.from.dataset.column || null;
                    var isFromStaging = evt.from.classList.contains('res-staging-grid');
                    var typeKey = evt.item.dataset.typeKey;

                    if (isFromStaging) {
                        // Remove the cloned DOM element immediately
                        evt.item.remove();

                        // Check if already assigned (shouldn't happen but guard)
                        if (getAssignedKeys(content).indexOf(typeKey) !== -1) return;

                        if (toColumn === 'immunities') {
                            // Auto-assign as Immune
                            addResistanceToColumn(content, typeKey, toColumn, t('res.immune'));
                            scheduleSave();
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                        } else {
                            // Prompt for value
                            showValuePrompt(panel.querySelector('.cv-modal-body'), '', function (val) {
                                addResistanceToColumn(content, typeKey, toColumn, val);
                                scheduleSave();
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            }, function () {
                                // Cancelled — just re-render (item stays in staging)
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            });
                        }
                    } else if (fromColumn && fromColumn !== toColumn) {
                        // Moving between columns
                        evt.item.remove();
                        var itemId = evt.item.dataset.id;

                        // Find and remove from source column
                        var movedItem = null;
                        var srcIdx = content[fromColumn].findIndex(function (r) { return r.id === itemId; });
                        if (srcIdx !== -1) {
                            movedItem = content[fromColumn].splice(srcIdx, 1)[0];
                        }

                        if (!movedItem) {
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                            return;
                        }

                        if (toColumn === 'immunities') {
                            movedItem.value = t('res.immune');
                            content[toColumn].push(movedItem);
                            scheduleSave();
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                        } else {
                            showValuePrompt(panel.querySelector('.cv-modal-body'), movedItem.value, function (val) {
                                movedItem.value = val;
                                content[toColumn].push(movedItem);
                                scheduleSave();
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            }, function () {
                                // Cancelled — put back in source column
                                content[fromColumn].push(movedItem);
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            });
                        }
                    }
                    // Same-column reorder: do nothing special (spec says no changes)
                }
            });
        });
    }

    function addResistanceToColumn(content, typeKey, column, value) {
        content[column].push({
            id: generateResId(),
            typeKey: typeKey,
            value: value,
            active: true
        });
    }

    // ── Resistance Creation Wizard ──

    function openResWizard(moduleEl, data, settingsPanel) {
        var content = ensureResContent(data);

        var overlay = document.createElement('div');
        overlay.className = 'res-wizard-overlay';

        var wizPanel = document.createElement('div');
        wizPanel.className = 'res-wizard-panel';

        // State
        var selectedIcon = null;
        var wizardName = '';

        // ── Header ──
        var header = document.createElement('div');
        header.className = 'res-wizard-header';

        var title = document.createElement('span');
        title.className = 'res-wizard-title';
        title.textContent = t('res.wizardTitle');
        header.appendChild(title);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'res-wizard-close';
        closeBtn.title = t('res.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', function () { overlay.remove(); });
        header.appendChild(closeBtn);
        wizPanel.appendChild(header);

        // ── Body ──
        var body = document.createElement('div');
        body.className = 'res-wizard-body';

        // Icon section
        var iconSection = document.createElement('div');
        iconSection.className = 'res-wizard-section';

        var iconLabel = document.createElement('label');
        iconLabel.className = 'res-wizard-label';
        iconLabel.textContent = t('res.wizardIcon');
        iconSection.appendChild(iconLabel);

        var iconGrid = document.createElement('div');
        iconGrid.className = 'res-wizard-icon-grid';

        // Sort icon keys alphabetically
        var iconKeys = Object.keys(RESISTANCE_ICON_SVG).sort();
        iconKeys.forEach(function (key) {
            var btn = document.createElement('button');
            btn.className = 'res-wizard-icon-btn';
            btn.dataset.iconKey = key;
            btn.innerHTML = RESISTANCE_ICON_SVG[key];
            var iconLabel = key.charAt(0).toUpperCase() + key.slice(1);
            var _tip = null;
            btn.addEventListener('mouseenter', function () {
                _tip = document.createElement('div');
                _tip.className = 'res-wizard-icon-tooltip';
                _tip.textContent = iconLabel;
                document.body.appendChild(_tip);
                var rect = btn.getBoundingClientRect();
                var tw = _tip.offsetWidth;
                var th = _tip.offsetHeight;
                var left = rect.left + rect.width / 2 - tw / 2;
                var top = rect.top - th - 6;
                left = Math.max(4, Math.min(left, window.innerWidth - tw - 4));
                _tip.style.left = left + 'px';
                _tip.style.top = top + 'px';
                _tip.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', function () {
                if (_tip) { _tip.remove(); _tip = null; }
            });

            btn.addEventListener('click', function () {
                iconGrid.querySelectorAll('.res-wizard-icon-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                selectedIcon = key;
            });

            iconGrid.appendChild(btn);
        });

        iconSection.appendChild(iconGrid);
        body.appendChild(iconSection);

        // Name section
        var nameSection = document.createElement('div');
        nameSection.className = 'res-wizard-section res-wizard-section-last';

        var nameLabel = document.createElement('label');
        nameLabel.className = 'res-wizard-label';
        nameLabel.textContent = t('res.wizardName');
        nameSection.appendChild(nameLabel);

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'res-wizard-name-input';
        nameInput.placeholder = t('res.wizardNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', function () {
            wizardName = nameInput.value.trim();
            createBtn.disabled = !wizardName;
        });
        nameSection.appendChild(nameInput);
        body.appendChild(nameSection);

        wizPanel.appendChild(body);

        // ── Footer ──
        var footer = document.createElement('div');
        footer.className = 'res-wizard-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'res-wizard-btn-cancel btn-secondary';
        cancelBtn.textContent = t('res.wizardCancel');
        cancelBtn.addEventListener('click', function () { overlay.remove(); });
        footer.appendChild(cancelBtn);

        var createBtn = document.createElement('button');
        createBtn.className = 'res-wizard-btn-create btn-primary solid';
        createBtn.textContent = t('res.wizardCreate');
        createBtn.disabled = true;
        createBtn.addEventListener('click', function () {
            if (!wizardName) return;
            var customKey = 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            content.customTypes.push({
                key: customKey,
                name: wizardName,
                icon: selectedIcon
            });
            scheduleSave();
            overlay.remove();
            // Re-render settings panel
            if (settingsPanel) {
                renderSettingsPanelContent(settingsPanel, moduleEl, data, content);
            }
            console.log('[CV] Custom resistance created: ' + wizardName);
        });
        footer.appendChild(createBtn);
        wizPanel.appendChild(footer);

        // ── Escape key ──
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') overlay.remove();
        });

        overlay.appendChild(wizPanel);
        document.body.appendChild(overlay);
        nameInput.focus();
    }

    // ── Module Type Registration ──

    registerModuleType('resistance', {
        label: 'type.resistance',

        renderBody: function (bodyEl, data, isPlayMode) {
            ensureResContent(data);
            if (isPlayMode) {
                renderPlayBody(bodyEl, data);
            } else {
                renderEditBody(bodyEl, data);
            }
        },

        onPlayMode: function (moduleEl, data) {
            closeResSettingsPanel(moduleEl, data);
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode: function (moduleEl, data) {
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },

        syncState: function (moduleEl, data) {
            // Data is mutated directly via event handlers; no form sync needed
        }
    });

    // Expose for module-core.js
    window.openResSettings = function (moduleEl, data) {
        openResSettingsPanel(moduleEl, data);
    };

    console.log('[CV] Resistance module registered');
})();
