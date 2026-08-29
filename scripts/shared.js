// ── Shared Utilities ──
(function () {
    const CV_VERSION = '0.2';

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Markdown Rendering ──
    const mdRenderer = new marked.Renderer();
    mdRenderer.link = function ({ href, title, text }) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;
    };
    marked.setOptions({ renderer: mdRenderer, breaks: true });

    function renderMarkdown(raw) {
        const html = marked.parse(raw || '');
        return DOMPurify.sanitize(html, {
            ADD_TAGS: ['input'],
            ADD_ATTR: ['type', 'checked', 'disabled'],
        });
    }

    function attachCheckboxHandlers(displayEl, data, moduleEl) {
        const checkboxes = displayEl.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((cb, index) => {
            cb.removeAttribute('disabled');
            cb.addEventListener('change', () => {
                toggleCheckboxInMarkdown(data, moduleEl, index, cb.checked);
            });
        });
    }

    // ── Toast Notifications ──
    function showToast(message, type = 'success', action) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        if (action) {
            toast.classList.add('toast-interactive');
            const msgSpan = document.createElement('span');
            msgSpan.textContent = message;
            const actionBtn = document.createElement('button');
            actionBtn.className = 'toast-action';
            actionBtn.textContent = action.label;
            actionBtn.addEventListener('click', () => {
                action.onClick();
                toast.classList.remove('toast-visible');
                toast.addEventListener('transitionend', () => toast.remove());
            });
            toast.appendChild(msgSpan);
            toast.appendChild(actionBtn);
        } else {
            toast.textContent = message;
        }

        container.appendChild(toast);

        // Trigger enter animation
        requestAnimationFrame(() => toast.classList.add('toast-visible'));

        setTimeout(
            () => {
                if (!document.body.contains(toast)) return;
                toast.classList.remove('toast-visible');
                toast.addEventListener('transitionend', () => toast.remove());
            },
            action ? 8000 : 2500
        );
    }

    function toggleCheckboxInMarkdown(data, moduleEl, index, checked) {
        const pattern = /- \[([ xX])\]/g;
        let count = 0;
        data.content = data.content.replace(pattern, (match) => {
            if (count++ === index) {
                return checked ? '- [x]' : '- [ ]';
            }
            return match;
        });
        const textarea = moduleEl.querySelector('.module-textarea');
        if (textarea) textarea.value = data.content;
        scheduleSave();
    }

    // ── Game System Helpers ──
    function inferTierPreset(systemKey) {
        if (systemKey === 'dnd5e') return 'dnd5e';
        if (systemKey === 'pf2e') return 'pf2e';
        return 'simple';
    }

    function getGameSystemDisplayName(systemKey) {
        const names = {
            dnd5e: 'D&D 5e',
            pf2e: 'Pathfinder 2e',
            coc: 'Call of Cthulhu',
            vtm: 'Vampire: The Masquerade',
            cpred: 'Cyberpunk Red',
            mothership: 'Mothership',
            sr6: 'Shadowrun 6e',
            daggerheart: 'Daggerheart',
            custom: null,
        };
        return names[systemKey] ?? null;
    }

    // ── Custom Select Builder ──
    // Builds a themed cv-select widget (trigger + dropdown menu).
    // Returns { el, getValue(), setValue(v) } where el is the .cv-select root div.
    function buildCvSelect(options, currentValue, onChange) {
        const chevronSvg = cvIcon('chevron-down', 12).replace('class="icon"', 'class="icon cv-select-chevron"');

        let selected = currentValue;

        const wrapper = document.createElement('div');
        wrapper.className = 'cv-select';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cv-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.style.userSelect = 'none';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'cv-select-value';
        const initialOpt = options.find(function (o) {
            return o.value === currentValue;
        });
        valueSpan.textContent = initialOpt ? initialOpt.label : '';

        const widestLabel = options.reduce(function (a, b) {
            return b.label.length > a.label.length ? b : a;
        }, options[0]).label;
        const sizer = document.createElement('span');
        sizer.className = 'cv-select-sizer';
        sizer.setAttribute('aria-hidden', 'true');
        sizer.textContent = widestLabel;

        trigger.appendChild(valueSpan);
        trigger.appendChild(sizer);
        trigger.insertAdjacentHTML('beforeend', chevronSvg);

        const menu = document.createElement('ul');
        menu.className = 'cv-select-menu cv-scroll';
        menu.setAttribute('role', 'listbox');

        options.forEach(function (opt) {
            const li = document.createElement('li');
            li.className = 'cv-select-option' + (opt.value === selected ? ' selected' : '');
            li.dataset.value = String(opt.value);
            li.setAttribute('role', 'option');
            li.style.userSelect = 'none';
            li.textContent = opt.label;
            li.addEventListener('click', function () {
                selected = opt.value;
                menu.querySelectorAll('.cv-select-option').forEach(function (o) {
                    o.classList.toggle('selected', o.dataset.value === String(selected));
                });
                valueSpan.textContent = opt.label;
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.minWidth = '';
                onChange(opt.value);
            });
            menu.appendChild(li);
        });

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = wrapper.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen);
            if (isOpen) {
                const rect = trigger.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = rect.bottom + 4 + 'px';
                menu.style.left = rect.left + 'px';
                menu.style.minWidth = rect.width + 'px';
            } else {
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.minWidth = '';
            }
        });

        document.addEventListener('click', function () {
            if (wrapper.classList.contains('open')) {
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.minWidth = '';
            }
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);

        return {
            el: wrapper,
            getValue: function () {
                return selected;
            },
            setValue: function (v) {
                selected = v;
                const match = options.find(function (o) {
                    return o.value === v;
                });
                if (match) valueSpan.textContent = match.label;
                menu.querySelectorAll('.cv-select-option').forEach(function (o) {
                    o.classList.toggle('selected', o.dataset.value === String(v));
                });
            },
        };
    }

    function makeCvToggle(checked, onChange) {
        const label = document.createElement('label');
        label.className = 'cv-toggle';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;

        const track = document.createElement('span');
        track.className = 'cv-toggle-track';

        label.appendChild(checkbox);
        label.appendChild(track);

        if (onChange) {
            checkbox.addEventListener('change', function () {
                onChange(checkbox.checked);
            });
        }

        return label;
    }

    // ── Close All Gameplay Modals ──
    function closeAllModals() {
        document.querySelectorAll('.cv-modal-overlay:not(.cv-tab-overlay)').forEach(function (el) {
            if (el.id) return;
            if (el._keyHandler) {
                document.removeEventListener('keydown', el._keyHandler);
            }
            el.remove();
        });
    }

    // ── ID Generation ──
    function generateId(prefix) {
        return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Format Modifier ──
    function formatModifier(mod) {
        const n = parseInt(mod, 10) || 0;
        return n >= 0 ? '+' + n : '' + n;
    }

    // ── Confirmation Dialog ──
    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = (typeof options === 'object' && options.title) || t('confirm.title');

        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        const title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = titleText;

        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = (typeof options === 'object' && options.cancelText) || t('delete.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = (typeof options === 'object' && options.confirmText) || t('delete.confirm');

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
            setTimeout(function () {
                overlay.remove();
            }, 200);
        }

        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', function () {
            onConfirm();
            close();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        requestAnimationFrame(function () {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    function normalizeHexInput(input) {
        var val = input.value;
        if (/^[0-9A-Fa-f]{6}$/.test(val)) {
            val = '#' + val;
            input.value = val;
        }
        return /^#[0-9A-Fa-f]{6}$/.test(val) ? val : null;
    }

    window.normalizeHexInput = normalizeHexInput;
    window.generateId = generateId;
    window.formatModifier = formatModifier;
    window.showConfirm = showConfirm;
    window.closeAllModals = closeAllModals;
    window.escapeHtml = escapeHtml;
    window.renderMarkdown = renderMarkdown;
    window.attachCheckboxHandlers = attachCheckboxHandlers;
    window.showToast = showToast;
    window.toggleCheckboxInMarkdown = toggleCheckboxInMarkdown;
    window.makeCvToggle = makeCvToggle;
    window.inferTierPreset = inferTierPreset;
    window.getGameSystemDisplayName = getGameSystemDisplayName;
    window.buildCvSelect = buildCvSelect;

    // ── Stat Module Linking Helpers ──
    function buildStatModulePicker(selectedId, onChange, noneLabel) {
        var opts = [{ value: '', label: noneLabel || t('common.noLinkedModule') }];
        (window.modules || [])
            .filter(function (m) {
                return m.type === 'stat';
            })
            .forEach(function (m) {
                opts.push({ value: m.id, label: m.title || t('type.stat') });
            });
        return buildCvSelect(opts, selectedId || '', onChange || function () {});
    }

    function getLinkedStatNames(moduleId) {
        if (!moduleId) return [];
        var linkedMod = (window.modules || []).find(function (m) {
            return m.id === moduleId;
        });
        if (!linkedMod || !linkedMod.content || !Array.isArray(linkedMod.content.stats)) return [];
        return linkedMod.content.stats
            .filter(function (s) {
                return s.name && !s.isProficiencyStat;
            })
            .map(function (s) {
                return s.name;
            });
    }

    window.buildStatModulePicker = buildStatModulePicker;
    window.getLinkedStatNames = getLinkedStatNames;

    // ── PF2e Proficiency Rank Helpers ──
    var PF2E_RANK_BONUS_MAP = { untrained: 0, trained: 2, expert: 4, master: 6, legendary: 8 };

    function computePf2eProficiencyBonus(rank) {
        if (!rank || rank === 'untrained') return 0;
        var rankBonus = PF2E_RANK_BONUS_MAP[rank] || 0;
        var charLevel = typeof window.getCharacterLevel === 'function' ? window.getCharacterLevel() : 0;
        return rankBonus + (charLevel || 0);
    }

    function buildPf2eRankOptions() {
        return [
            { value: 'untrained', label: t('rank.untrained') },
            { value: 'trained', label: t('rank.trained') },
            { value: 'expert', label: t('rank.expert') },
            { value: 'master', label: t('rank.master') },
            { value: 'legendary', label: t('rank.legendary') },
        ];
    }

    window.PF2E_RANK_BONUS_MAP = PF2E_RANK_BONUS_MAP;
    window.computePf2eProficiencyBonus = computePf2eProficiencyBonus;
    window.buildPf2eRankOptions = buildPf2eRankOptions;

    // ── D&D 5e Proficiency Bonus ──
    function getTotalCharacterLevel() {
        var total = 0;
        var found = false;
        for (var i = 0; i < (window.modules || []).length; i++) {
            var m = window.modules[i];
            if (m.type !== 'level' || !m.content) continue;
            total += m.content.level || 0;
            found = true;
        }
        return found ? total : null;
    }

    function computeDnd5eProficiencyBonus(totalLevel) {
        if (typeof totalLevel !== 'number' || totalLevel < 1) return 2;
        return Math.floor((totalLevel - 1) / 4) + 2;
    }

    window.getTotalCharacterLevel = getTotalCharacterLevel;
    window.computeDnd5eProficiencyBonus = computeDnd5eProficiencyBonus;

    // ── Daggerheart Duality Dice ──
    function rollDualityDice(label, modifier, eventType, logKey, logReplacements, sourceModuleId) {
        if (typeof TS === 'undefined') return;
        var groups = [
            { name: label + ' (' + t('dice.hope') + ')', roll: '1d12' },
            { name: label + ' (' + t('dice.fear') + ')', roll: '1d12' },
        ];
        var rollPromise = TS.dice.putDiceInTray(groups, true);
        if (typeof window.logActivity === 'function') {
            var logEntryId = window.logActivity({
                type: eventType,
                message: t(logKey, logReplacements),
                sourceModuleId: sourceModuleId,
            });
            rollPromise
                .then(function (rollId) {
                    if (rollId)
                        window.pendingRolls[rollId] = {
                            logEntryId: logEntryId,
                            dualityRoll: true,
                            modifier: modifier,
                            label: label,
                        };
                })
                .catch(function (e) {
                    console.warn('[CV] Duality dice roll failed:', e);
                });
        }
    }

    window.rollDualityDice = rollDualityDice;

    // ── CoC / Mothership Percentile Dice ──
    function rollPercentileDice(label, eventType, logKey, logReplacements, sourceModuleId) {
        if (typeof TS === 'undefined') return;
        var rollPromise = TS.dice.putDiceInTray([{ name: label, roll: '1d100' }]);
        if (typeof window.logActivity === 'function') {
            var logEntryId = window.logActivity({
                type: eventType,
                message: t(logKey, logReplacements),
                sourceModuleId: sourceModuleId,
            });
            rollPromise
                .then(function (rollId) {
                    if (rollId) window.pendingRolls[rollId] = { logEntryId: logEntryId };
                })
                .catch(function (e) {
                    console.warn('[CV] Percentile dice roll failed:', e);
                });
        }
    }

    window.rollPercentileDice = rollPercentileDice;

    // ── Clipboard ──
    async function copyTextToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // fall through to legacy approach
            }
        }
        const el = document.createElement('input');
        el.type = 'text';
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try {
            return document.execCommand('copy');
        } catch {
            return false;
        } finally {
            document.body.removeChild(el);
        }
    }

    window.copyTextToClipboard = copyTextToClipboard;
    window.CV_VERSION = CV_VERSION;

    // ── Common Settings Section ──
    // Appends theme + move-to-tab controls to any module settings modal body.
    function buildCommonSettingsSection(container, moduleEl, data) {
        window.buildSwatchPanel(container, moduleEl, data, null);

        // Move to Tab
        const moveBtn = document.createElement('button');
        moveBtn.type = 'button';
        moveBtn.className = 'cv-settings-move-tab-btn';
        moveBtn.textContent = t('module.moveToTab');
        moveBtn.addEventListener('click', function () {
            window.openMoveToTabModal(moduleEl, data);
        });
        container.appendChild(moveBtn);
    }

    function openMoveToTabModal(moduleEl, data) {
        const existing = document.querySelector('.cv-movetab-overlay');
        if (existing) {
            existing.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay cv-movetab-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('module.moveToTab');
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body cv-scroll';

        const otherTabs = (window.tabs || [])
            .filter(function (tab) {
                return tab.id !== data.tabId;
            })
            .sort(function (a, b) {
                return a.order - b.order;
            });

        if (otherTabs.length === 0) {
            const noTabsMsg = document.createElement('div');
            noTabsMsg.className = 'cv-settings-no-tabs';
            noTabsMsg.textContent = t('module.moveToTabNoOtherTabs');
            body.appendChild(noTabsMsg);
        } else {
            const tabList = document.createElement('div');
            tabList.className = 'cv-movetab-list';
            otherTabs.forEach(function (tab) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cv-movetab-row';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'cv-movetab-name';
                nameSpan.textContent = tab.name;
                const arrow = document.createElement('span');
                arrow.className = 'cv-movetab-arrow';
                arrow.textContent = '›';
                btn.appendChild(nameSpan);
                btn.appendChild(arrow);
                btn.addEventListener('click', function () {
                    window.performModuleMove(moduleEl, data, tab);
                });
                tabList.appendChild(btn);
            });
            body.appendChild(tabList);
        }

        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('module.cancel');
        cancelBtn.addEventListener('click', closeModal);
        footer.appendChild(cancelBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() {
            overlay.remove();
        }
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });
    }

    function updateChainLinkIndicator(moduleEl, type, i18nKey, data) {
        const indicator = moduleEl.querySelector(`.module-${type}-link-indicator`);
        if (!indicator) return;
        const linkedId = data.content && data.content.linkedStatModuleId;
        if (!linkedId) {
            indicator.style.display = 'none';
            indicator.title = '';
            return;
        }
        const linked = (window.modules || []).find((m) => m.id === linkedId);
        indicator.title = t(i18nKey, { name: linked ? linked.title || t('type.stat') : '?' });
        indicator.style.display = '';
    }

    // ── Manage-List Sortable Helper ──
    function initManageListSortable(container, options) {
        if (container._sortable) {
            container._sortable.destroy();
        }
        container._sortable = new Sortable(container, {
            handle: options.handleSelector,
            animation: 150,
            ghostClass: options.ghostClass,
            chosenClass: options.chosenClass ?? 'cv-drag-chosen',
            draggable: options.rowSelector,
            onEnd: options.onEnd,
        });
        return container._sortable;
    }

    window.buildCommonSettingsSection = buildCommonSettingsSection;
    window.openMoveToTabModal = openMoveToTabModal;
    window.updateChainLinkIndicator = updateChainLinkIndicator;
    window.initManageListSortable = initManageListSortable;
})();
