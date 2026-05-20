// ── Tab System ──
(function () {

    // ── Tab State ──
    window.tabs = [];
    window.activeTabId = null;

    let tabIdCounter = 0;
    window.getTabIdCounter = function () { return tabIdCounter; };
    window.setTabIdCounter = function (n) { tabIdCounter = n; };

    window.generateTabId = function () {
        return 'tab-' + (++tabIdCounter);
    };

    window.getActiveTab = function () {
        return window.tabs.find(function (t) { return t.id === window.activeTabId; });
    };

    window.getNextTabName = function () {
        const existing = new Set(window.tabs.map(function (t) { return t.name; }));
        let n = 1;
        let candidate;
        do { candidate = t('tabs.defaultName', { n: n++ }); } while (existing.has(candidate));
        return candidate;
    };

    window.createTab = function (name, color) {
        const tab = {
            id: window.generateTabId(),
            name: name || window.getNextTabName(),
            order: window.tabs.length,
            color: color ?? null,
        };
        window.tabs.push(tab);
        return tab;
    };

    // ── Tab Switching ──
    window.switchToTab = function (tabId) {
        window.activeTabId = tabId;

        const grid = document.getElementById('module-grid');
        if (grid) {
            Array.from(grid.querySelectorAll('.module')).forEach(function (el) { el.remove(); });
        }

        const tabModules = window.modules
            .filter(function (m) { return m.tabId === tabId; })
            .sort(function (a, b) { return a.order - b.order; });
        if (window.setLayoutBatchMode) window.setLayoutBatchMode(true);
        tabModules.forEach(function (data) { window.renderModule(data); });
        if (window.setLayoutBatchMode) window.setLayoutBatchMode(false);

        if (window.isPlayMode) {
            window.applyPlayMode();
        } else {
            window.applyLayoutMode();
        }

        document.querySelectorAll('.tab-item').forEach(function (el) {
            el.classList.toggle('active', el.dataset.tabId === tabId);
        });

        window.updateEmptyState();
        window.scheduleSave();
    };

    // ── Shared Tab Action ──
    function createAndSwitchTab() {
        const newTab = window.createTab();
        window.renderTabBar();
        window.switchToTab(newTab.id);
    }

    // ── Tab Sortable ──
    let tabSortable = null;

    // ── Context Menu ──
    let activeContextMenu = null;

    function closeContextMenu() {
        if (activeContextMenu) {
            activeContextMenu.remove();
            activeContextMenu = null;
        }
    }

    function showTabContextMenu(x, y, items) {
        closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'tab-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        items.forEach(function (item) {
            const el = document.createElement('div');
            el.className = 'tab-context-item' + (item.danger ? ' tab-context-item--danger' : '');
            el.textContent = item.label;
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                closeContextMenu();
                item.action();
            });
            menu.appendChild(el);
        });

        document.body.appendChild(menu);
        activeContextMenu = menu;

        // Clamp to viewport
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';

        function onClickOutside(e) {
            if (!menu.contains(e.target)) {
                closeContextMenu();
                document.removeEventListener('click', onClickOutside);
                document.removeEventListener('keydown', onEscape);
            }
        }

        function onEscape(e) {
            if (e.key === 'Escape') {
                closeContextMenu();
                document.removeEventListener('click', onClickOutside);
                document.removeEventListener('keydown', onEscape);
            }
        }

        requestAnimationFrame(function () {
            document.addEventListener('click', onClickOutside);
            document.addEventListener('keydown', onEscape);
        });
    }

    // ── Tab Settings Modal ──

    // Single source of truth for preset swatches — TAB_PRESET_COLORS derived from this
    const TAB_SWATCH_DEFS = [
        { color: null, cls: 'wizard-swatch-default', label: t('tabs.colorDefault') },
        { color: '#8B2020', cls: '', label: 'Crimson' },
        { color: '#2D5A3D', cls: '', label: 'Forest' },
        { color: '#1E3A5F', cls: '', label: 'Navy' },
        { color: '#4A2D6B', cls: '', label: 'Royal' },
        { color: '#5C3A1E', cls: '', label: 'Leather' },
        { color: '#3A3A3A', cls: '', label: 'Slate' },
        { color: 'custom', cls: 'wizard-swatch-custom', label: 'Custom Color' },
    ];

    const TAB_PRESET_COLORS = TAB_SWATCH_DEFS
        .filter(function (d) { return d.color !== null && d.color !== 'custom'; })
        .map(function (d) { return d.color; });

    // Holds the active Escape/backdrop handlers so closeTabSettings can always clean them up
    let settingsEscapeHandler = null;
    let settingsBackdropHandler = null;

    function closeTabSettings() {
        const overlay = document.getElementById('tab-settings-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        if (settingsEscapeHandler) {
            document.removeEventListener('keydown', settingsEscapeHandler);
            settingsEscapeHandler = null;
        }
        if (settingsBackdropHandler) {
            overlay.removeEventListener('click', settingsBackdropHandler);
            settingsBackdropHandler = null;
        }
    }

    window.openTabSettings = function (tabId) {
        const tab = window.tabs.find(function (tb) { return tb.id === tabId; });
        if (!tab) return;

        const overlay = document.getElementById('tab-settings-overlay');
        const panel = document.getElementById('tab-settings-panel');
        if (!overlay || !panel) return;

        let selectedColor = tab.color ?? null;

        panel.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        header.innerHTML =
            '<h2 class="cv-modal-title">' + escapeHtml(t('tabs.settingsTitle')) + '</h2>' +
            '<button type="button" class="cv-modal-close" title="' + escapeHtml(t('wizard.close')) + '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // Rename
        const renameSection = document.createElement('div');
        renameSection.className = 'tab-settings-section';
        const renameLabel = document.createElement('label');
        renameLabel.className = 'cv-modal-label';
        renameLabel.textContent = t('tabs.rename');
        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.className = 'cv-modal-input tab-settings-rename';
        renameInput.value = tab.name;
        renameSection.appendChild(renameLabel);
        renameSection.appendChild(renameInput);
        body.appendChild(renameSection);

        // Color
        const colorSection = document.createElement('div');
        colorSection.className = 'tab-settings-section';
        const colorLabel = document.createElement('label');
        colorLabel.className = 'cv-modal-label';
        colorLabel.textContent = t('tabs.changeColor');
        colorSection.appendChild(colorLabel);

        const swatchRow = document.createElement('div');
        swatchRow.className = 'wizard-color-row';

        const hexRow = document.createElement('div');
        hexRow.className = 'wizard-hex-row';
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'wizard-custom-hex tab-settings-hex';
        hexInput.placeholder = '#000000';
        hexInput.maxLength = 7;
        hexInput.spellcheck = false;
        hexRow.appendChild(hexInput);

        const isCustomColor = selectedColor !== null && !TAB_PRESET_COLORS.includes(selectedColor);
        if (isCustomColor) {
            hexInput.value = selectedColor;
            hexInput.classList.add('visible');
        }

        function updateSwatchSelection(activeColor) {
            swatchRow.querySelectorAll('.wizard-swatch').forEach(function (s) {
                s.classList.remove('selected');
            });
            let matched = false;
            TAB_SWATCH_DEFS.forEach(function (def, i) {
                const btn = swatchRow.children[i];
                if (!btn) return;
                if (def.color === null && activeColor === null) {
                    btn.classList.add('selected');
                    matched = true;
                } else if (def.color !== null && def.color !== 'custom' && def.color === activeColor) {
                    btn.classList.add('selected');
                    matched = true;
                }
            });
            if (!matched && activeColor !== null) {
                // Custom swatch is always the last entry
                const customBtn = swatchRow.children[TAB_SWATCH_DEFS.length - 1];
                if (customBtn) customBtn.classList.add('selected');
            }
        }

        TAB_SWATCH_DEFS.forEach(function (def) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'wizard-swatch ' + def.cls;
            btn.setAttribute('title', def.label);
            if (def.color !== null && def.color !== 'custom') {
                btn.style.backgroundColor = def.color;
            }

            btn.addEventListener('click', function () {
                if (def.color === 'custom') {
                    hexInput.classList.add('visible');
                    selectedColor = hexInput.value || null;
                } else {
                    hexInput.classList.remove('visible');
                    selectedColor = def.color;
                }
                updateSwatchSelection(selectedColor);
            });

            swatchRow.appendChild(btn);
        });

        hexInput.addEventListener('input', function () {
            selectedColor = hexInput.value || null;
        });

        colorSection.appendChild(swatchRow);
        colorSection.appendChild(hexRow);
        body.appendChild(colorSection);

        // Danger zone
        const dangerSection = document.createElement('div');
        dangerSection.className = 'tab-settings-danger';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger tab-settings-delete';
        deleteBtn.textContent = t('tabs.deleteBtn');
        deleteBtn.addEventListener('click', function () {
            closeTabSettings();
            window.openTabDeleteConfirm(tabId);
        });
        dangerSection.appendChild(deleteBtn);
        body.appendChild(dangerSection);

        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('wizard.cancel');
        cancelBtn.addEventListener('click', closeTabSettings);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary';
        saveBtn.textContent = t('settings.save');
        saveBtn.addEventListener('click', function () {
            const newName = renameInput.value.trim();

            if (!newName) {
                renameInput.value = window.getNextTabName();
                window.showToast(t('tabs.nameEmpty'), 'error');
                return;
            }

            const isDuplicate = window.tabs.some(function (existingTab) {
                return existingTab.id !== tabId && existingTab.name === newName;
            });
            if (isDuplicate) {
                window.showToast(t('tabs.nameDuplicate'), 'error');
                return;
            }

            tab.name = newName;
            tab.color = selectedColor;
            window.renderTabBar();
            closeTabSettings();
            window.scheduleSave();
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        header.querySelector('.cv-modal-close').addEventListener('click', closeTabSettings);

        settingsBackdropHandler = function (e) {
            if (e.target === overlay) closeTabSettings();
        };
        overlay.addEventListener('click', settingsBackdropHandler);

        settingsEscapeHandler = function (e) {
            if (e.key === 'Escape') closeTabSettings();
        };
        document.addEventListener('keydown', settingsEscapeHandler);

        overlay.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () {
            overlay.classList.add('open');
            renameInput.focus();
            renameInput.select();
        });

        updateSwatchSelection(selectedColor);
    };

    // ── Tab Delete Confirmation ──

    let deleteEscapeHandler = null;
    let deleteBackdropHandler = null;

    function closeTabDeleteConfirm() {
        const overlay = document.getElementById('tab-delete-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        if (deleteEscapeHandler) {
            document.removeEventListener('keydown', deleteEscapeHandler);
            deleteEscapeHandler = null;
        }
        if (deleteBackdropHandler) {
            overlay.removeEventListener('click', deleteBackdropHandler);
            deleteBackdropHandler = null;
        }
    }

    window.deleteTab = function (tabId, action, destinationTabId) {
        const tab = window.tabs.find(function (t) { return t.id === tabId; });
        if (!tab) return;

        if (action === 'delete') {
            if (tabId === window.activeTabId) {
                document.querySelectorAll('.module').forEach(function (el) { el.remove(); });
            }
            for (let i = window.modules.length - 1; i >= 0; i--) {
                if (window.modules[i].tabId === tabId) window.modules.splice(i, 1);
            }
        } else if (action === 'move') {
            const destModules = window.modules.filter(function (m) { return m.tabId === destinationTabId; });
            let nextOrder = destModules.reduce(function (max, m) { return Math.max(max, m.order); }, -1) + 1;
            window.modules.forEach(function (m) {
                if (m.tabId === tabId) { m.tabId = destinationTabId; m.order = nextOrder++; }
            });
        }

        const sortedBefore = window.tabs.slice().sort(function (a, b) { return a.order - b.order; });
        const deletedVisualIndex = sortedBefore.findIndex(function (t) { return t.id === tabId; });

        window.tabs.splice(window.tabs.indexOf(tab), 1);
        window.tabs.forEach(function (t, i) { t.order = i; });

        const wasActive = tabId === window.activeTabId;
        if (wasActive) {
            if (window.tabs.length === 0) {
                const fresh = window.createTab();
                window.renderTabBar();
                window.switchToTab(fresh.id);
            } else {
                const nextTabId = deletedVisualIndex > 0
                    ? sortedBefore[deletedVisualIndex - 1].id
                    : sortedBefore[1].id;
                window.renderTabBar();
                window.switchToTab(nextTabId);
            }
        } else {
            window.renderTabBar();
            window.scheduleSave();
        }
    };

    window.openTabDeleteConfirm = function (tabId) {
        const tab = window.tabs.find(function (t) { return t.id === tabId; });
        if (!tab) return;

        const tabModules = window.modules.filter(function (m) { return m.tabId === tabId; });
        if (tabModules.length === 0) {
            window.deleteTab(tabId, 'delete');
            return;
        }

        const otherTabs = window.tabs
            .filter(function (t) { return t.id !== tabId; })
            .sort(function (a, b) { return a.order - b.order; });

        const overlay = document.getElementById('tab-delete-overlay');
        const panel = document.getElementById('tab-delete-panel');
        if (!overlay || !panel) return;

        panel.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        header.innerHTML =
            '<h2 class="cv-modal-title">' + escapeHtml(t('tabs.deleteConfirmTitle')) + '</h2>' +
            '<button type="button" class="cv-modal-close" title="' + escapeHtml(t('wizard.close')) + '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';
        header.querySelector('.cv-modal-close').addEventListener('click', closeTabDeleteConfirm);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const msg = document.createElement('p');
        msg.className = 'tab-delete-message';
        msg.textContent = t('tabs.deleteConfirmMessage');
        body.appendChild(msg);

        const radioGroup = document.createElement('div');
        radioGroup.className = 'tab-delete-radio-group';

        let selectedAction = 'delete';
        let selectedDestId = otherTabs.length > 0 ? otherTabs[0].id : null;

        function buildRadioOption(value, labelContent, disabled) {
            const lbl = document.createElement('label');
            lbl.className = 'tab-delete-radio-option' + (disabled ? ' tab-delete-radio-option--disabled' : '') + (value === selectedAction ? ' selected' : '');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'tab-delete-action';
            radio.value = value;
            radio.checked = value === selectedAction;
            radio.disabled = disabled;

            const circle = document.createElement('span');
            circle.className = 'tab-delete-radio-btn';

            lbl.appendChild(radio);
            lbl.appendChild(circle);
            lbl.appendChild(labelContent);
            return { el: lbl, radio: radio };
        }

        const deleteText = document.createElement('span');
        deleteText.className = 'tab-delete-radio-label';
        deleteText.textContent = t('tabs.deleteModules');
        const deleteOpt = buildRadioOption('delete', deleteText, false);
        radioGroup.appendChild(deleteOpt.el);

        const hasDestinations = otherTabs.length > 0;
        const moveRow = document.createElement('span');
        moveRow.className = 'tab-delete-move-row';
        const moveText = document.createElement('span');
        moveText.className = 'tab-delete-radio-label';
        moveText.textContent = t('tabs.moveModules');
        moveRow.appendChild(moveText);

        if (hasDestinations) {
            const selectOpts = otherTabs.map(function (ot) { return { value: ot.id, label: ot.name }; });
            const selectWidget = window.buildCvSelect(selectOpts, otherTabs[0].id, function (val) { selectedDestId = val; });
            selectWidget.el.classList.add('tab-delete-select');
            moveRow.appendChild(selectWidget.el);
        }

        const moveOpt = buildRadioOption('move', moveRow, !hasDestinations);
        radioGroup.appendChild(moveOpt.el);

        [deleteOpt, moveOpt].forEach(function (opt) {
            opt.radio.addEventListener('change', function () {
                selectedAction = opt.radio.value;
                deleteOpt.el.classList.toggle('selected', selectedAction === 'delete');
                moveOpt.el.classList.toggle('selected', selectedAction === 'move');
            });
        });

        body.appendChild(radioGroup);
        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = t('wizard.cancel');
        cancelBtn.addEventListener('click', closeTabDeleteConfirm);

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn-danger';
        confirmBtn.textContent = t('tabs.deleteConfirm');
        confirmBtn.addEventListener('click', function () {
            closeTabDeleteConfirm();
            if (selectedAction === 'move' && selectedDestId) {
                window.deleteTab(tabId, 'move', selectedDestId);
            } else {
                window.deleteTab(tabId, 'delete');
            }
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        panel.appendChild(footer);

        deleteBackdropHandler = function (e) {
            if (e.target === overlay) closeTabDeleteConfirm();
        };
        overlay.addEventListener('click', deleteBackdropHandler);

        deleteEscapeHandler = function (e) {
            if (e.key === 'Escape') closeTabDeleteConfirm();
        };
        document.addEventListener('keydown', deleteEscapeHandler);

        overlay.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () { overlay.classList.add('open'); });
    };

    // ── Tab Bar Rendering ──
    window.renderTabBar = function () {
        const scrollArea = document.getElementById('tab-scroll-area');
        if (!scrollArea) return;

        if (tabSortable) {
            tabSortable.destroy();
            tabSortable = null;
        }

        scrollArea.innerHTML = '';

        const sorted = window.tabs.slice().sort(function (a, b) { return a.order - b.order; });
        sorted.forEach(function (tab) {
            const el = document.createElement('div');
            el.className = 'tab-item' + (tab.id === window.activeTabId ? ' active' : '');
            el.dataset.tabId = tab.id;
            el.setAttribute('title', tab.name);
            if (tab.color) {
                el.style.backgroundColor = tab.color;
            }

            const handle = document.createElement('div');
            handle.className = 'tab-drag-handle';
            handle.setAttribute('aria-hidden', 'true');
            handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="12" viewBox="0 0 8 12" fill="currentColor"><circle cx="2" cy="2.5" r="1.1"/><circle cx="6" cy="2.5" r="1.1"/><circle cx="2" cy="6" r="1.1"/><circle cx="6" cy="6" r="1.1"/><circle cx="2" cy="9.5" r="1.1"/><circle cx="6" cy="9.5" r="1.1"/></svg>';
            el.appendChild(handle);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'tab-name';
            nameSpan.textContent = tab.name;
            el.appendChild(nameSpan);

            el.addEventListener('click', function (e) {
                if (e.target.closest('.tab-drag-handle')) return;
                if (tab.id !== window.activeTabId) {
                    window.switchToTab(tab.id);
                }
            });

            el.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                e.stopPropagation();
                showTabContextMenu(e.clientX, e.clientY, [
                    { label: t('tabs.createNew'), action: createAndSwitchTab },
                    { label: t('tabs.openSettings'), action: function () { window.openTabSettings(tab.id); } },
                    { label: t('tabs.delete'), danger: true, action: function () { window.openTabDeleteConfirm(tab.id); } },
                ]);
            });

            scrollArea.appendChild(el);
        });

        tabSortable = new Sortable(scrollArea, {
            handle: '.tab-drag-handle',
            animation: 150,
            ghostClass: 'tab-ghost',
            draggable: '.tab-item',
            direction: 'horizontal',
            onEnd: function () {
                Array.from(scrollArea.querySelectorAll('.tab-item')).forEach(function (el, i) {
                    const tab = window.tabs.find(function (t) { return t.id === el.dataset.tabId; });
                    if (tab) tab.order = i;
                });
                window.scheduleSave();
            },
        });
    };

    // ── Right-click on tab bar empty area ──
    const tabBar = document.getElementById('tab-bar');
    if (tabBar) {
        tabBar.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.tab-item')) return;
            e.preventDefault();
            showTabContextMenu(e.clientX, e.clientY, [
                { label: t('tabs.createNew'), action: createAndSwitchTab },
            ]);
        });
    }

    // ── Add Tab Button ──
    const btnAddTab = document.getElementById('btn-add-tab');
    if (btnAddTab) {
        btnAddTab.addEventListener('click', createAndSwitchTab);
    }

})();
