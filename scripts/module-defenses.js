// ── Defenses Module Type ──
(function () {
    'use strict';

    // ── Shared SVG Fragments ──

    var SVG_CLOSE = cvIcon('x', 12);
    var SVG_PLUS = cvIcon('plus', 14);

    function generateDefenseId() {
        return generateId('def');
    }
    function generateQDId() {
        return generateId('qd');
    }

    // ── Default Content Builder ──

    function buildDefensesDefaultContent(sys) {
        const content = { defenses: [], quickDefenses: [] };

        if (sys === 'pf2e') {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
            content.quickDefenses.push({
                id: generateQDId(),
                name: 'Raise Shield',
                icon: 'shield',
                modifier: 2,
                active: false,
            });
        } else if (sys === 'dnd3.5e') {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
            content.defenses.push({
                id: generateDefenseId(),
                name: 'Touch AC',
                value: 10,
                icon: 'crosshair',
                showSign: false,
            });
            content.defenses.push({
                id: generateDefenseId(),
                name: 'Flat-Footed AC',
                value: 10,
                icon: 'shield',
                showSign: false,
            });
        } else {
            content.defenses.push({ id: generateDefenseId(), name: 'AC', value: 10, icon: 'shield', showSign: false });
        }

        return content;
    }

    // ── Content Shape Guard ──

    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = buildDefensesDefaultContent(window.gameSystem || 'custom');
        }
        if (!Array.isArray(data.content.defenses)) data.content.defenses = [];
        if (!Array.isArray(data.content.quickDefenses)) data.content.quickDefenses = [];
        data.content.defenses.forEach(function (def) {
            if (def.showSign === undefined) def.showSign = false;
            if (def.icon === undefined) def.icon = null;
            delete def.notes;
        });
        data.content.quickDefenses.forEach(function (qd) {
            if (qd.active === undefined) qd.active = false;
            if (qd.modifier === undefined) qd.modifier = 0;
            if (qd.icon === undefined) qd.icon = null;
        });
        return data.content;
    }

    // ── Formatting Helpers ──

    function fmtDefValue(value, showSign) {
        if (!showSign) return String(value);
        return formatModifier(value);
    }

    // ── Computed Values ──

    function computeSpotlightValue(content) {
        if (!content.defenses.length) return 0;
        const base = content.defenses[0].value;
        const qdBonus = content.quickDefenses
            .filter(function (qd) {
                return qd.active;
            })
            .reduce(function (sum, qd) {
                return sum + (qd.modifier || 0);
            }, 0);
        return base + qdBonus;
    }

    function getActiveQDs(content) {
        return content.quickDefenses.filter(function (qd) {
            return qd.active;
        });
    }

    function isBuffed(content) {
        return getActiveQDs(content).length > 0;
    }

    // ── Icon Picker Popover ──

    function openDefenseIconPicker(btn, currentIcon, onSelect) {
        const existing = document.querySelector('.def-icon-picker');
        if (existing) existing.remove();

        const picker = document.createElement('div');
        picker.className = 'def-icon-picker';
        const rect = btn.getBoundingClientRect();
        picker.style.top = rect.bottom + 4 + 'px';
        picker.style.left = rect.left + 'px';

        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.title = t('def.noIcon');
        noneBtn.className = currentIcon === null ? 'selected' : '';
        noneBtn.innerHTML = '&mdash;';
        noneBtn.addEventListener('click', function () {
            onSelect(null);
            closePicker();
        });
        picker.appendChild(noneBtn);

        CV_ICON_KEYS.forEach(function (key) {
            const iconBtn = document.createElement('button');
            iconBtn.type = 'button';
            iconBtn.className = key === currentIcon ? 'selected' : '';
            iconBtn.title = key;
            iconBtn.innerHTML = cvIcon(key);
            iconBtn.addEventListener('click', function () {
                onSelect(key);
                closePicker();
            });
            picker.appendChild(iconBtn);
        });

        document.body.appendChild(picker);

        function closePicker() {
            picker.remove();
            document.removeEventListener('click', onOutsideClick, true);
            document.removeEventListener('keydown', onEscape);
        }
        function onOutsideClick(e) {
            if (!picker.contains(e.target) && e.target !== btn) closePicker();
        }
        function onEscape(e) {
            if (e.key === 'Escape') closePicker();
        }
        setTimeout(function () {
            document.addEventListener('click', onOutsideClick, true);
            document.addEventListener('keydown', onEscape);
        }, 0);
    }

    // ── Play Mode: Spotlight ──

    function refreshSpotlightState(spotlight, content) {
        const def = content.defenses[0];
        const activeQDs = getActiveQDs(content);
        const buffed = activeQDs.length > 0;

        const valueEl = spotlight.querySelector('.def-spotlight-value');
        if (valueEl) {
            valueEl.textContent = fmtDefValue(computeSpotlightValue(content), def.showSign);
            valueEl.classList.toggle('buffed', buffed);
        }

        const oldBase = spotlight.querySelector('.def-spotlight-base');
        const oldBadges = spotlight.querySelector('.def-spotlight-badges');
        if (oldBase) oldBase.remove();
        if (oldBadges) oldBadges.remove();

        if (buffed) {
            const baseEl = document.createElement('span');
            baseEl.className = 'def-spotlight-base';
            baseEl.textContent = t('def.base', { value: String(def.value) });
            spotlight.appendChild(baseEl);

            const badges = document.createElement('div');
            badges.className = 'def-spotlight-badges';
            activeQDs.forEach(function (qd) {
                const badge = document.createElement('span');
                badge.className = 'def-spotlight-badge';
                badge.textContent = qd.name + ' ' + formatModifier(qd.modifier);
                badges.appendChild(badge);
            });
            spotlight.appendChild(badges);
        }
    }

    function renderSpotlight(container, content, data, bodyEl) {
        if (!content.defenses.length) return;
        const def = content.defenses[0];

        const section = document.createElement('div');
        section.className = 'def-spotlight';

        if (def.icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'def-spotlight-icon';
            iconEl.innerHTML = cvIcon(def.icon);
            section.appendChild(iconEl);
        }

        const valueEl = document.createElement('span');
        valueEl.className = 'def-spotlight-value';
        valueEl.addEventListener('click', function (e) {
            if (!e.ctrlKey && !e.metaKey) return;
            e.stopPropagation();
            window.openEditPopover(valueEl, {
                label: def.name,
                value: def.value,
                type: 'number',
                relative: true,
                onSave(newVal) {
                    def.value = newVal;
                    scheduleSave();
                    MODULE_TYPES['defenses'].renderBody(bodyEl, data);
                },
            });
        });
        section.appendChild(valueEl);

        const labelEl = document.createElement('span');
        labelEl.className = 'def-spotlight-label';
        labelEl.textContent = def.name;
        section.appendChild(labelEl);

        refreshSpotlightState(section, content);

        container.appendChild(section);
    }

    // ── Play Mode: Secondary Rows ──

    function renderSecondaryRows(container, content, data, bodyEl) {
        if (content.defenses.length <= 1) return;

        const section = document.createElement('div');
        section.className = 'def-secondary';

        for (let i = 1; i < content.defenses.length; i++) {
            const def = content.defenses[i];
            const row = document.createElement('div');
            row.className = 'def-secondary-row';
            row.dataset.defId = def.id;

            if (def.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'def-secondary-icon';
                iconEl.innerHTML = cvIcon(def.icon);
                row.appendChild(iconEl);
            }

            const nameEl = document.createElement('span');
            nameEl.className = 'def-secondary-name';
            nameEl.textContent = def.name;
            row.appendChild(nameEl);

            const valueEl = document.createElement('span');
            valueEl.className = 'def-secondary-value';
            valueEl.textContent = fmtDefValue(def.value, def.showSign);
            valueEl.addEventListener('click', function (e) {
                if (!e.ctrlKey && !e.metaKey) return;
                e.stopPropagation();
                window.openEditPopover(valueEl, {
                    label: def.name,
                    value: def.value,
                    type: 'number',
                    relative: true,
                    onSave(newVal) {
                        def.value = newVal;
                        scheduleSave();
                        MODULE_TYPES['defenses'].renderBody(bodyEl, data);
                    },
                });
            });
            row.appendChild(valueEl);

            section.appendChild(row);
        }

        container.appendChild(section);
    }

    // ── Play Mode: Quick Defense Buttons ──

    function renderQDButtons(container, content, data, bodyEl) {
        if (!content.quickDefenses.length) return;

        const spotlightEl = container.querySelector('.def-spotlight');
        const strip = document.createElement('div');
        const colSpan = data.colSpan ?? 4;
        strip.className = 'def-qd-strip' + (colSpan <= 2 ? ' compact' : '');

        content.quickDefenses.forEach(function (qd) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'def-qd-btn' + (qd.active ? ' active' : '');
            btn.dataset.id = qd.id;

            if (qd.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'def-qd-icon';
                iconEl.innerHTML = cvIcon(qd.icon);
                btn.appendChild(iconEl);
            }

            if (colSpan > 1) {
                const labelEl = document.createElement('span');
                labelEl.className = 'def-qd-label';
                labelEl.textContent = qd.name;
                btn.appendChild(labelEl);

                const modEl = document.createElement('span');
                modEl.className = 'def-qd-mod';
                modEl.textContent = formatModifier(qd.modifier);
                btn.appendChild(modEl);
            } else {
                btn.title = qd.name + ' ' + formatModifier(qd.modifier);
            }

            const compactBadge = document.createElement('span');
            compactBadge.className = 'def-qd-compact-badge';
            compactBadge.textContent = formatModifier(qd.modifier);
            btn.appendChild(compactBadge);

            btn.addEventListener('click', function () {
                qd.active = !qd.active;
                btn.classList.toggle('active', qd.active);
                if (spotlightEl) refreshSpotlightState(spotlightEl, content);
                scheduleSave();
            });

            strip.appendChild(btn);
        });

        container.appendChild(strip);
    }

    // ── QD Settings Modal ──

    function renderQDModalRow(qd, content, data, listEl, moduleEl) {
        const row = document.createElement('div');
        row.className = 'def-qd-row';
        row.dataset.id = qd.id;

        // Drag handle
        const handle = document.createElement('span');
        handle.className = 'def-qd-drag-handle';
        handle.innerHTML = '&#x2807;';
        row.appendChild(handle);

        // Icon button
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'def-icon-btn';
        iconBtn.title = t('def.changeIcon');
        iconBtn.innerHTML = qd.icon ? cvIcon(qd.icon) : cvIcon('none');
        iconBtn.addEventListener('click', function () {
            openDefenseIconPicker(iconBtn, qd.icon, function (newIcon) {
                qd.icon = newIcon;
                scheduleSave();
                renderQDModalBody(listEl, content, data, moduleEl);
            });
        });
        row.appendChild(iconBtn);

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'def-qd-name-input';
        nameInput.value = qd.name;
        nameInput.addEventListener('input', function () {
            qd.name = nameInput.value;
            scheduleSave();
        });
        row.appendChild(nameInput);

        // Mod label
        const modLabel = document.createElement('span');
        modLabel.className = 'def-qd-mod-label';
        modLabel.textContent = t('def.modLabel');
        row.appendChild(modLabel);

        // Modifier input
        const modInput = document.createElement('input');
        modInput.type = 'number';
        modInput.className = 'def-qd-mod-input';
        modInput.value = qd.modifier;
        modInput.addEventListener('input', function () {
            qd.modifier = parseInt(modInput.value, 10) || 0;
            scheduleSave();
        });
        row.appendChild(modInput);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'def-qd-delete-btn';
        deleteBtn.title = t('def.deleteQD');
        deleteBtn.innerHTML = SVG_CLOSE;
        deleteBtn.addEventListener('click', function () {
            const idx = content.quickDefenses.findIndex(function (q) {
                return q.id === qd.id;
            });
            if (idx !== -1) content.quickDefenses.splice(idx, 1);
            scheduleSave();
            renderQDModalBody(listEl, content, data, moduleEl);
        });
        row.appendChild(deleteBtn);

        return row;
    }

    function renderQDModalBody(listEl, content, data, moduleEl) {
        listEl.innerHTML = '';

        if (content.quickDefenses.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'def-qd-empty';
            empty.innerHTML = escapeHtml(t('def.qdEmptyTitle')) + '<br>' + escapeHtml(t('def.qdEmptyHint'));
            listEl.appendChild(empty);
        } else {
            const rowContainer = document.createElement('div');
            rowContainer.className = 'def-qd-list';
            content.quickDefenses.forEach(function (qd) {
                rowContainer.appendChild(renderQDModalRow(qd, content, data, listEl, moduleEl));
            });
            listEl.appendChild(rowContainer);
            initQDSortable(rowContainer, content, data, listEl, moduleEl);
        }

        // Add QD row
        const addRow = document.createElement('div');
        addRow.className = 'def-qd-add-row';
        addRow.innerHTML = SVG_PLUS + '<span>' + escapeHtml(t('def.addQD')) + '</span>';
        addRow.addEventListener('click', function () {
            content.quickDefenses.push({
                id: generateQDId(),
                name: '',
                icon: null,
                modifier: 0,
                active: false,
            });
            scheduleSave();
            renderQDModalBody(listEl, content, data, moduleEl);
            const inputs = listEl.querySelectorAll('.def-qd-name-input');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        listEl.appendChild(addRow);
    }

    function initQDSortable(container, content, data, listEl, moduleEl) {
        if (container._sortable) container._sortable.destroy();
        container._sortable = new Sortable(container, {
            handle: '.def-qd-drag-handle',
            animation: 150,
            ghostClass: 'cv-drag-ghost',
            draggable: '.def-qd-row',
            onEnd: function () {
                const ids = Array.from(container.querySelectorAll('.def-qd-row')).map(function (el) {
                    return el.dataset.id;
                });
                const reordered = ids
                    .map(function (id) {
                        return content.quickDefenses.find(function (q) {
                            return q.id === id;
                        });
                    })
                    .filter(Boolean);
                content.quickDefenses = reordered;
                scheduleSave();
            },
        });
    }

    function openDefenseSettingsModal(moduleEl, data) {
        const content = ensureContent(data);

        const existing = document.querySelector('.def-settings-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay def-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('def.settingsTitle');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('def.close');
        closeXBtn.innerHTML = SVG_CLOSE;
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        function reRenderModuleBody() {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) MODULE_TYPES['defenses'].renderBody(bodyEl, data);
        }

        // ── Manage Defenses ──
        const manageLabel = document.createElement('div');
        manageLabel.className = 'cv-modal-label';
        manageLabel.textContent = t('def.manageDefenses');
        body.appendChild(manageLabel);

        const manageList = document.createElement('div');
        manageList.className = 'def-manage-list';

        function buildManageRow(def) {
            const row = document.createElement('div');
            row.className = 'def-manage-row';
            row.dataset.id = def.id;

            const drag = document.createElement('span');
            drag.className = 'def-manage-drag';
            drag.innerHTML = '&#x2807;';
            row.appendChild(drag);

            const iconBtn = document.createElement('button');
            iconBtn.type = 'button';
            iconBtn.className = 'def-icon-btn';
            iconBtn.title = t('def.changeIcon');
            iconBtn.innerHTML = def.icon ? cvIcon(def.icon) : cvIcon('none');
            iconBtn.addEventListener('click', function () {
                openDefenseIconPicker(iconBtn, def.icon, function (newIcon) {
                    def.icon = newIcon;
                    scheduleSave();
                    iconBtn.innerHTML = def.icon ? cvIcon(def.icon) : cvIcon('none');
                    reRenderModuleBody();
                });
            });
            row.appendChild(iconBtn);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'def-manage-name';
            nameInput.value = def.name;
            nameInput.addEventListener('input', function () {
                const oldName = def.name;
                def.name = nameInput.value;
                if (typeof window.propagateEntityRename === 'function') {
                    window.propagateEntityRename(data.id, 'defense', oldName, def.name);
                }
                scheduleSave();
                const bodyEl = moduleEl.querySelector('.module-body');
                if (bodyEl) {
                    const nameEl =
                        content.defenses[0] === def
                            ? bodyEl.querySelector('.def-spotlight-label')
                            : bodyEl.querySelector('.def-secondary-row[data-def-id="' + def.id + '"] .def-secondary-name');
                    if (nameEl) nameEl.textContent = def.name;
                }
            });
            row.appendChild(nameInput);

            const signBtn = document.createElement('button');
            signBtn.type = 'button';
            signBtn.className = 'def-manage-sign' + (def.showSign ? ' active' : '');
            signBtn.title = t('def.showSign');
            signBtn.textContent = '±';
            signBtn.addEventListener('click', function () {
                def.showSign = !def.showSign;
                signBtn.classList.toggle('active', def.showSign);
                scheduleSave();
                reRenderModuleBody();
            });
            row.appendChild(signBtn);

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.className = 'def-manage-value';
            valueInput.value = def.value;
            valueInput.addEventListener('input', function () {
                def.value = parseInt(valueInput.value, 10) || 0;
                scheduleSave();
                const bodyEl = moduleEl.querySelector('.module-body');
                if (bodyEl) {
                    if (content.defenses[0] === def) {
                        const spotlightEl = bodyEl.querySelector('.def-spotlight');
                        if (spotlightEl) refreshSpotlightState(spotlightEl, content);
                    } else {
                        const valueEl = bodyEl.querySelector(
                            '.def-secondary-row[data-def-id="' + def.id + '"] .def-secondary-value'
                        );
                        if (valueEl) valueEl.textContent = fmtDefValue(def.value, def.showSign);
                    }
                }
            });
            row.appendChild(valueInput);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'def-manage-delete';
            deleteBtn.title = t('def.deleteDefense');
            deleteBtn.innerHTML = SVG_CLOSE;
            deleteBtn.addEventListener('click', function () {
                showConfirm(t('def.confirmDelete', { name: def.name || t('def.unnamed') }), function () {
                    const idx = content.defenses.findIndex(function (d) {
                        return d.id === def.id;
                    });
                    if (idx !== -1) content.defenses.splice(idx, 1);
                    scheduleSave();
                    renderManageRows();
                    reRenderModuleBody();
                });
            });
            row.appendChild(deleteBtn);

            return row;
        }

        function renderManageRows() {
            manageList.innerHTML = '';
            content.defenses.forEach(function (def) {
                manageList.appendChild(buildManageRow(def));
            });

            if (manageList._sortable) manageList._sortable.destroy();
            if (content.defenses.length > 1) {
                manageList._sortable = new Sortable(manageList, {
                    handle: '.def-manage-drag',
                    animation: 150,
                    ghostClass: 'cv-drag-ghost',
                    draggable: '.def-manage-row',
                    onEnd: function () {
                        const ids = Array.from(manageList.querySelectorAll('.def-manage-row')).map(function (el) {
                            return el.dataset.id;
                        });
                        const reordered = ids
                            .map(function (id) {
                                return content.defenses.find(function (d) {
                                    return d.id === id;
                                });
                            })
                            .filter(Boolean);
                        content.defenses = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
        }

        renderManageRows();
        body.appendChild(manageList);

        const addDefenseBtn = document.createElement('button');
        addDefenseBtn.type = 'button';
        addDefenseBtn.className = 'btn-secondary sm';
        addDefenseBtn.innerHTML = SVG_PLUS + ' ' + escapeHtml(t('def.addDefense'));
        addDefenseBtn.addEventListener('click', function () {
            content.defenses.push({
                id: generateDefenseId(),
                name: '',
                value: 0,
                icon: null,
                showSign: false,
            });
            scheduleSave();
            renderManageRows();
            reRenderModuleBody();
            const inputs = manageList.querySelectorAll('.def-manage-name');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        body.appendChild(addDefenseBtn);

        // ── Manage Quick Defenses ──
        const qdLabel = document.createElement('div');
        qdLabel.className = 'cv-modal-label';
        qdLabel.textContent = t('def.manageQuickDefenses');
        body.appendChild(qdLabel);

        renderQDModalBody(body, content, data, moduleEl);
        buildCommonSettingsSection(body, moduleEl, data);
        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-secondary sm';
        closeBtn.textContent = t('def.close');
        footer.appendChild(closeBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
            reRenderModuleBody();
        }
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeModal();
            }
        };
        document.addEventListener('keydown', keyHandler);

        closeXBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        document.body.appendChild(overlay);
    }

    // ── Module Type Registration ──

    registerModuleType('defenses', {
        label: 'type.defenses',

        renderBody: function (bodyEl, data) {
            const content = ensureContent(data);
            bodyEl.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'def-container';
            const moduleEl = bodyEl.closest('.module');

            if (content.defenses.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'def-empty';
                empty.innerHTML =
                    '<div>' +
                    escapeHtml(t('def.emptyTitle')) +
                    '</div>' +
                    '<div>' +
                    escapeHtml(t('def.emptyHint')) +
                    '</div>';
                container.appendChild(empty);
            } else {
                renderSpotlight(container, content, data, bodyEl);
                renderSecondaryRows(container, content, data, bodyEl);
                renderQDButtons(container, content, data, bodyEl);
            }

            bodyEl.appendChild(container);
            if (typeof snapModuleHeight === 'function') snapModuleHeight(moduleEl, data);
        },

        overflowMenuItems: function (moduleEl, data) {
            return [
                {
                    onClick: function () {
                        openDefenseSettingsModal(moduleEl, data);
                    },
                    label: t('def.settingsTitle'),
                    icon: cvIcon('settings', 14),
                },
            ];
        },
    });

    // ── Window Exports ──

    window.ensureDefenseContent = ensureContent;
    window.generateDefenseId = generateDefenseId;
    window.generateQDId = generateQDId;
    window.buildDefensesDefaultContent = buildDefensesDefaultContent;
    window.computeSpotlightValue = computeSpotlightValue;
    window.openDefenseSettingsModal = openDefenseSettingsModal;

    console.log('[CV] Defenses module registered');
})();
