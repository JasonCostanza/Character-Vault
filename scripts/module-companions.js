// ── Companions Module ──
(function () {
    'use strict';

    // ── ID Generation ──

    function generateCompanionId() {
        return 'comp_' + Math.random().toString(36).slice(2, 11);
    }

    function generateAttrId() {
        return 'attr_' + Math.random().toString(36).slice(2, 11);
    }

    // ── Default Content ──

    function buildCompanionsDefaultContent(sys) {
        const attrs = [];

        function mkAttr(id, name, type, defaultValue) {
            return { id, name, type, defaultValue, pinned: true, builtIn: true };
        }

        if (sys === 'daggerheart') {
            attrs.push(mkAttr('attr_damage', 'Damage', 'text', ''));
            attrs.push(mkAttr('attr_range', 'Range', 'text', ''));
            attrs.push(mkAttr('attr_evasion', 'Evasion', 'number', 10));
            attrs.push(mkAttr('attr_stress', 'Stress', 'number-pair', { current: 0, max: 0 }));
        } else {
            attrs.push(mkAttr('attr_hp', 'HP', 'number-pair', { current: 0, max: 0 }));
            attrs.push(mkAttr('attr_ac', 'AC', 'number', 0));
            attrs.push(mkAttr('attr_run', 'Run Speed', 'number', 0));
            attrs.push(mkAttr('attr_fly', 'Fly Speed', 'number', 0));
        }

        return { companions: [], attributes: attrs, sortBy: null, sortDir: 'asc' };
    }

    // ── Content Shape Guard ──

    function ensureContent(data) {
        if (!data.content || typeof data.content !== 'object') {
            data.content = buildCompanionsDefaultContent(window.gameSystem || 'custom');
        }
        const c = data.content;
        if (!Array.isArray(c.companions)) c.companions = [];
        if (!Array.isArray(c.attributes)) c.attributes = [];
        if (c.sortBy === undefined) c.sortBy = null;
        if (!c.sortDir) c.sortDir = 'asc';
        // Ensure all companions have required fields
        c.companions.forEach((comp, i) => {
            if (!comp.id) comp.id = generateCompanionId();
            if (comp.name === undefined) comp.name = '';
            if (comp.notes === undefined) comp.notes = '';
            if (comp.active === undefined) comp.active = true;
            if (comp.expanded === undefined) comp.expanded = false;
            if (comp.order === undefined) comp.order = i;
            if (!comp.values || typeof comp.values !== 'object') comp.values = {};
        });
        return c;
    }

    // ── Arithmetic Expression Evaluation ──

    function evaluateExpression(str) {
        str = String(str).trim();
        if (!str) return null;
        if (!/^[\d+\-*/.()\s]+$/.test(str)) return null;
        try {
            const result = Function('"use strict"; return (' + str + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return null;
            return Math.floor(result);
        } catch (e) {
            return null;
        }
    }

    // ── Custom Confirm Dialog ──

    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = (typeof options === 'object' && options.title) || t('companion.deleteTitle');

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
            setTimeout(() => overlay.remove(), 200);
        }

        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', () => { onConfirm(); close(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        requestAnimationFrame(() => {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    // ── Sort Helpers ──

    function getSortedCompanions(content) {
        const companions = content.companions.slice();
        if (content.sortBy === null) {
            companions.sort((a, b) => (a.order || 0) - (b.order || 0));
            return companions;
        }
        const dir = content.sortDir === 'desc' ? -1 : 1;
        if (content.sortBy === '__name__') {
            companions.sort((a, b) => {
                const an = (a.name || '').toLowerCase();
                const bn = (b.name || '').toLowerCase();
                if (an < bn) return -dir;
                if (an > bn) return dir;
                return 0;
            });
            return companions;
        }
        const attr = content.attributes.find(a => a.id === content.sortBy);
        companions.sort((a, b) => {
            const av = (a.values && a.values[content.sortBy] != null) ? a.values[content.sortBy] : (attr ? attr.defaultValue : 0);
            const bv = (b.values && b.values[content.sortBy] != null) ? b.values[content.sortBy] : (attr ? attr.defaultValue : 0);
            if (attr && attr.type === 'number-pair') {
                return ((av.current || 0) - (bv.current || 0)) * dir;
            }
            if (attr && attr.type === 'number') {
                return ((av || 0) - (bv || 0)) * dir;
            }
            const as = String(av || '').toLowerCase();
            const bs = String(bv || '').toLowerCase();
            if (as < bs) return -dir;
            if (as > bs) return dir;
            return 0;
        });
        return companions;
    }

    // ── Value Display Helpers ──

    function getDisplayValue(attr, value) {
        if (value == null) value = attr.defaultValue;
        if (attr.type === 'number-pair') {
            const cur = (value && value.current != null) ? value.current : 0;
            const max = (value && value.max != null) ? value.max : 0;
            return cur + ' / ' + max;
        }
        if (attr.type === 'toggle') {
            return value ? '✓' : '—';
        }
        if (attr.type === 'number') {
            return value != null ? String(value) : '0';
        }
        return value != null ? String(value) : '';
    }

    function isHpAttr(attr) {
        return attr.builtIn === true &&
            attr.type === 'number-pair' &&
            attr.name.toLowerCase().includes('hp');
    }

    // ── Inline Edit for Value Cells ──

    function makeValueCell(companion, attr, content, data, bodyEl) {
        const value = companion.values[attr.id] != null ? companion.values[attr.id] : attr.defaultValue;
        const cell = document.createElement('td');
        cell.className = 'companion-cell';

        function renderSpan() {
            cell.innerHTML = '';
            const span = document.createElement('span');
            span.className = 'companion-attr-display';
            span.textContent = getDisplayValue(attr, companion.values[attr.id] != null ? companion.values[attr.id] : attr.defaultValue);

            if (attr.type === 'toggle') {
                span.style.cursor = 'pointer';
                span.addEventListener('click', () => {
                    const cur = companion.values[attr.id] != null ? companion.values[attr.id] : attr.defaultValue;
                    companion.values[attr.id] = !cur;
                    scheduleSave();
                    renderSpan();
                });
            } else {
                span.addEventListener('click', () => startEdit());
            }
            cell.appendChild(span);
        }

        function startEdit() {
            if (attr.type === 'number-pair') {
                startEditPair();
                return;
            }
            cell.innerHTML = '';
            const curVal = companion.values[attr.id] != null ? companion.values[attr.id] : attr.defaultValue;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'companion-inline-input';
            input.value = String(curVal != null ? curVal : '');

            function commit() {
                let newVal = input.value.trim();
                if (attr.type === 'number') {
                    const evaluated = evaluateExpression(newVal);
                    if (evaluated !== null) {
                        newVal = evaluated;
                    } else {
                        newVal = curVal;
                    }
                }
                companion.values[attr.id] = newVal;
                scheduleSave();
                renderSpan();
            }

            input.addEventListener('blur', commit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { input.blur(); }
                if (e.key === 'Escape') {
                    companion.values[attr.id] = curVal;
                    renderSpan();
                }
            });

            cell.appendChild(input);
            input.focus();
            input.select();
        }

        function startEditPair() {
            cell.innerHTML = '';
            const curPair = companion.values[attr.id] || { current: 0, max: 0 };
            const oldCurrent = curPair.current != null ? curPair.current : 0;
            const oldMax = curPair.max != null ? curPair.max : 0;

            const wrap = document.createElement('span');
            wrap.style.display = 'flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '2px';

            const curInput = document.createElement('input');
            curInput.type = 'text';
            curInput.className = 'companion-inline-input';
            curInput.value = String(oldCurrent);
            curInput.style.width = '36px';

            const sep = document.createElement('span');
            sep.textContent = '/';
            sep.style.color = 'var(--cv-text-muted)';
            sep.style.userSelect = 'none';

            const maxInput = document.createElement('input');
            maxInput.type = 'text';
            maxInput.className = 'companion-inline-input';
            maxInput.value = String(oldMax);
            maxInput.style.width = '36px';

            function commitPair() {
                const evalCur = evaluateExpression(curInput.value);
                const evalMax = evaluateExpression(maxInput.value);
                const newCur = evalCur !== null ? evalCur : oldCurrent;
                const newMax = evalMax !== null ? evalMax : oldMax;

                const oldVal = { current: oldCurrent, max: oldMax };
                companion.values[attr.id] = { current: newCur, max: newMax };

                // Log HP changes
                if (isHpAttr(attr) && newCur !== oldCurrent) {
                    const diff = newCur - oldCurrent;
                    if (diff < 0) {
                        if (typeof window.logActivity === 'function') {
                            window.logActivity({
                                type: 'companion.event.damage',
                                message: t('companion.log.damage', {
                                    name: companion.name || '?',
                                    amount: String(Math.abs(diff)),
                                    old: String(oldCurrent),
                                    new: String(newCur),
                                }),
                                sourceModuleId: data.id,
                            });
                        }
                    } else {
                        if (typeof window.logActivity === 'function') {
                            window.logActivity({
                                type: 'companion.event.heal',
                                message: t('companion.log.heal', {
                                    name: companion.name || '?',
                                    amount: String(diff),
                                    old: String(oldCurrent),
                                    new: String(newCur),
                                }),
                                sourceModuleId: data.id,
                            });
                        }
                    }
                }

                scheduleSave();
                renderSpan();
            }

            function handleBlur() {
                // Small delay so clicking the other input doesn't trigger premature commit
                setTimeout(() => {
                    if (document.activeElement !== curInput && document.activeElement !== maxInput) {
                        commitPair();
                    }
                }, 80);
            }

            curInput.addEventListener('blur', handleBlur);
            maxInput.addEventListener('blur', handleBlur);

            function handleKeydown(e) {
                if (e.key === 'Enter') {
                    curInput.blur();
                    maxInput.blur();
                    commitPair();
                }
                if (e.key === 'Escape') {
                    companion.values[attr.id] = { current: oldCurrent, max: oldMax };
                    renderSpan();
                }
            }

            curInput.addEventListener('keydown', handleKeydown);
            maxInput.addEventListener('keydown', handleKeydown);

            wrap.appendChild(curInput);
            wrap.appendChild(sep);
            wrap.appendChild(maxInput);
            cell.appendChild(wrap);
            curInput.focus();
            curInput.select();
        }

        renderSpan();
        return cell;
    }

    // ── Render a Single Companion Row ──

    function renderCompanionRow(companion, content, data, tableBody, bodyEl, isLayoutMode) {
        const pinnedAttrs = content.attributes.filter(a => a.pinned);

        // Main row
        const tr = document.createElement('tr');
        tr.className = 'companion-row' + (companion.active ? '' : ' is-inactive');
        tr.dataset.companionId = companion.id;

        // Drag handle cell
        const dragTd = document.createElement('td');
        dragTd.className = 'companion-cell';
        const dragHandle = document.createElement('span');
        dragHandle.className = 'companion-drag-handle';
        dragHandle.innerHTML = '&#x2807;';
        dragHandle.title = '';
        if (!isLayoutMode || content.sortBy !== null) {
            dragHandle.style.visibility = 'hidden';
        }
        dragTd.appendChild(dragHandle);
        tr.appendChild(dragTd);

        // Chevron cell
        const chevTd = document.createElement('td');
        chevTd.className = 'companion-cell';
        const chevBtn = document.createElement('button');
        chevBtn.className = 'companion-chevron-btn' + (companion.expanded ? ' expanded' : '');
        chevBtn.title = companion.expanded ? t('companion.collapse') : t('companion.expand');
        chevBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        chevTd.appendChild(chevBtn);
        tr.appendChild(chevTd);

        // Active toggle cell
        const activeTd = document.createElement('td');
        activeTd.className = 'companion-cell companion-active-cell';
        const activeBtn = document.createElement('button');
        activeBtn.className = 'companion-active-btn' + (companion.active ? ' is-active' : '');
        activeBtn.title = t('companion.toggleActive');
        activeBtn.innerHTML = companion.active
            ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
            : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
        activeBtn.addEventListener('click', () => {
            const wasActive = companion.active;
            companion.active = !wasActive;
            scheduleSave();
            if (typeof window.logActivity === 'function') {
                if (companion.active) {
                    window.logActivity({
                        type: 'companion.event.summon',
                        message: t('companion.log.summon', { name: companion.name || '?' }),
                        sourceModuleId: data.id,
                    });
                } else {
                    window.logActivity({
                        type: 'companion.event.dismiss',
                        message: t('companion.log.dismiss', { name: companion.name || '?' }),
                        sourceModuleId: data.id,
                    });
                }
            }
            renderCompanionsBody(bodyEl, data, isLayoutMode);
        });
        activeTd.appendChild(activeBtn);
        tr.appendChild(activeTd);

        // Name cell
        const nameTd = document.createElement('td');
        nameTd.className = 'companion-cell';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'companion-name-display';
        nameSpan.textContent = companion.name || '';
        nameSpan.addEventListener('click', () => {
            nameTd.innerHTML = '';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'companion-inline-input';
            input.value = companion.name || '';

            function commit() {
                companion.name = input.value.trim();
                scheduleSave();
                nameTd.innerHTML = '';
                const newSpan = document.createElement('span');
                newSpan.className = 'companion-name-display';
                newSpan.textContent = companion.name || '';
                newSpan.addEventListener('click', () => nameSpan.click.call(newSpan));
                nameTd.appendChild(newSpan);
                // Re-attach event on new span
                newSpan.addEventListener('click', () => {
                    nameTd.innerHTML = '';
                    input.value = companion.name || '';
                    nameTd.appendChild(input);
                    input.focus();
                    input.select();
                });
            }

            input.addEventListener('blur', commit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
                if (e.key === 'Escape') {
                    input.value = companion.name || '';
                    input.blur();
                }
            });

            nameTd.appendChild(input);
            input.focus();
            input.select();
        });
        nameTd.appendChild(nameSpan);
        tr.appendChild(nameTd);

        // Attribute value cells
        pinnedAttrs.forEach((attr) => {
            const cell = makeValueCell(companion, attr, content, data, bodyEl);
            tr.appendChild(cell);
        });

        // Drawer row
        const drawerTr = document.createElement('tr');
        drawerTr.dataset.companionDrawer = companion.id;
        if (!companion.expanded) drawerTr.style.display = 'none';

        const drawerTd = document.createElement('td');
        // +2 for drag + chevron + active columns, then name, then pinned attrs
        drawerTd.colSpan = 3 + 1 + pinnedAttrs.length;
        drawerTd.className = 'companion-drawer';

        const notesLabel = document.createElement('span');
        notesLabel.className = 'companion-notes-label';
        notesLabel.textContent = t('companion.notes');

        const notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'companion-notes-textarea';
        notesTextarea.placeholder = t('companion.notesPlaceholder');
        notesTextarea.value = companion.notes || '';

        notesTextarea.addEventListener('blur', () => {
            companion.notes = notesTextarea.value;
            scheduleSave();
        });

        drawerTd.appendChild(notesLabel);
        drawerTd.appendChild(notesTextarea);
        drawerTr.appendChild(drawerTd);

        // Chevron toggle
        chevBtn.addEventListener('click', () => {
            companion.expanded = !companion.expanded;
            chevBtn.title = companion.expanded ? t('companion.collapse') : t('companion.expand');
            chevBtn.classList.toggle('expanded', companion.expanded);
            drawerTr.style.display = companion.expanded ? '' : 'none';
            scheduleSave();
        });

        tableBody.appendChild(tr);
        tableBody.appendChild(drawerTr);
    }

    // ── Render Full Module Body ──

    function renderCompanionsBody(bodyEl, data, isLayoutMode) {
        const content = ensureContent(data);
        const pinnedAttrs = content.attributes.filter(a => a.pinned);

        bodyEl.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'companion-container';

        if (content.companions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'companion-empty-state';
            empty.textContent = t('companion.emptyState');
            container.appendChild(empty);
            bodyEl.appendChild(container);
            return;
        }

        const table = document.createElement('table');
        table.className = 'companion-table';

        // Header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Drag handle col header (empty)
        const dragTh = document.createElement('th');
        dragTh.style.width = '20px';
        headerRow.appendChild(dragTh);

        // Chevron col header (empty)
        const chevTh = document.createElement('th');
        chevTh.style.width = '20px';
        headerRow.appendChild(chevTh);

        // Active col header (empty)
        const activeTh = document.createElement('th');
        activeTh.style.width = '24px';
        headerRow.appendChild(activeTh);

        // Name col header
        const nameTh = document.createElement('th');
        nameTh.className = 'companion-col-header' + (content.sortBy === '__name__' ? ' active-sort' : '');
        nameTh.style.textAlign = 'left';
        const nameHeaderText = document.createElement('span');
        nameHeaderText.textContent = t('companion.attrName');
        nameTh.appendChild(nameHeaderText);
        if (content.sortBy === '__name__') {
            const sortInd = document.createElement('span');
            sortInd.className = 'companion-sort-indicator';
            sortInd.textContent = content.sortDir === 'asc' ? ' ▲' : ' ▼';
            nameTh.appendChild(sortInd);
        }
        nameTh.addEventListener('click', () => {
            if (content.sortBy !== '__name__') {
                content.sortBy = '__name__';
                content.sortDir = 'asc';
            } else if (content.sortDir === 'asc') {
                content.sortDir = 'desc';
            } else {
                content.sortBy = null;
                content.sortDir = 'asc';
            }
            scheduleSave();
            renderCompanionsBody(bodyEl, data, isLayoutMode);
        });
        headerRow.appendChild(nameTh);

        // Attribute col headers
        pinnedAttrs.forEach((attr) => {
            const th = document.createElement('th');
            th.className = 'companion-col-header' + (content.sortBy === attr.id ? ' active-sort' : '');
            const attrHeaderText = document.createElement('span');
            attrHeaderText.textContent = attr.name;
            th.appendChild(attrHeaderText);
            if (content.sortBy === attr.id) {
                const sortInd = document.createElement('span');
                sortInd.className = 'companion-sort-indicator';
                sortInd.textContent = content.sortDir === 'asc' ? ' ▲' : ' ▼';
                th.appendChild(sortInd);
            }
            th.addEventListener('click', () => {
                if (content.sortBy !== attr.id) {
                    content.sortBy = attr.id;
                    content.sortDir = 'asc';
                } else if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
                scheduleSave();
                renderCompanionsBody(bodyEl, data, isLayoutMode);
            });
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const sorted = getSortedCompanions(content);
        sorted.forEach((companion) => {
            renderCompanionRow(companion, content, data, tbody, bodyEl, isLayoutMode);
        });
        table.appendChild(tbody);

        container.appendChild(table);
        bodyEl.appendChild(container);

        // Init SortableJS for companion rows when in manual sort mode and layout mode
        if (isLayoutMode && content.sortBy === null) {
            if (tbody._sortable) tbody._sortable.destroy();
            tbody._sortable = new Sortable(tbody, {
                handle: '.companion-drag-handle',
                animation: 150,
                ghostClass: 'companion-row-ghost',
                draggable: '.companion-row',
                onEnd() {
                    const rows = Array.from(tbody.querySelectorAll('.companion-row'));
                    const reordered = rows
                        .map(r => content.companions.find(c => c.id === r.dataset.companionId))
                        .filter(Boolean);
                    content.companions = reordered;
                    // Re-add any companions not in rows (shouldn't happen but safety net)
                    content.companions.forEach((c, i) => { c.order = i; });
                    scheduleSave();
                },
            });
        }
    }

    // ── Settings Modal ──

    function openCompanionSettings(moduleEl, data) {
        const content = ensureContent(data);

        const existing = document.querySelector('.companion-settings-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay companion-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.width = '460px';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('companion.settingsTitle');

        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('companion.close');
        closeXBtn.innerHTML = CV_SVG_CLOSE;

        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // ── Add Companion Section ──
        const addLabel = document.createElement('label');
        addLabel.className = 'cv-modal-label';
        addLabel.textContent = t('companion.addCompanion');

        const addRow = document.createElement('div');
        addRow.className = 'companion-add-name-row';

        const addInput = document.createElement('input');
        addInput.type = 'text';
        addInput.className = 'cv-modal-input';
        addInput.style.flex = '1';
        addInput.style.minWidth = '0';
        addInput.placeholder = t('companion.namePlaceholder');

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary';
        addBtn.textContent = t('companion.addCompanion');
        addBtn.style.whiteSpace = 'nowrap';

        addBtn.addEventListener('click', () => {
            const name = addInput.value.trim();
            if (!name) return;

            const newComp = {
                id: generateCompanionId(),
                name,
                notes: '',
                active: true,
                expanded: false,
                order: content.companions.length,
                values: {},
            };

            content.attributes.forEach((attr) => {
                if (attr.type === 'number-pair') {
                    newComp.values[attr.id] = { current: 0, max: 0 };
                } else if (attr.type === 'number') {
                    newComp.values[attr.id] = attr.defaultValue != null ? attr.defaultValue : 0;
                } else if (attr.type === 'toggle') {
                    newComp.values[attr.id] = false;
                } else {
                    newComp.values[attr.id] = '';
                }
            });

            content.companions.push(newComp);
            addInput.value = '';
            scheduleSave();
            refreshCompanionList();

            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) {
                const isLayoutMode = document.body.classList.contains('mode-edit');
                renderCompanionsBody(bodyEl, data, isLayoutMode);
            }
        });

        addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });

        addRow.appendChild(addInput);
        addRow.appendChild(addBtn);
        body.appendChild(addLabel);
        body.appendChild(addRow);

        // ── Companion List Section ──
        const companionListEl = document.createElement('div');
        companionListEl.className = 'companion-settings-companion-list';

        body.appendChild(companionListEl);

        function refreshCompanionList() {
            companionListEl.innerHTML = '';
            const sorted = getSortedCompanions(content);
            sorted.forEach((companion) => {
                const row = document.createElement('div');
                row.className = 'companion-settings-companion-row';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'cv-modal-input';
                nameInput.style.flex = '1';
                nameInput.style.minWidth = '0';
                nameInput.value = companion.name || '';
                nameInput.placeholder = t('companion.namePlaceholder');

                nameInput.addEventListener('blur', () => {
                    companion.name = nameInput.value.trim();
                    scheduleSave();
                    const bodyEl = moduleEl.querySelector('.module-body');
                    if (bodyEl) {
                        const isLayoutMode = document.body.classList.contains('mode-edit');
                        renderCompanionsBody(bodyEl, data, isLayoutMode);
                    }
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'companion-settings-delete-btn';
                deleteBtn.title = t('companion.delete');
                deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

                deleteBtn.addEventListener('click', () => {
                    showConfirm(
                        {
                            title: t('companion.deleteTitle'),
                            message: t('companion.deleteMsg', { name: companion.name || '?' }),
                        },
                        () => {
                            content.companions = content.companions.filter(c => c.id !== companion.id);
                            content.companions.forEach((c, i) => { c.order = i; });
                            scheduleSave();
                            refreshCompanionList();
                            const bodyEl = moduleEl.querySelector('.module-body');
                            if (bodyEl) {
                                const isLayoutMode = document.body.classList.contains('mode-edit');
                                renderCompanionsBody(bodyEl, data, isLayoutMode);
                            }
                        }
                    );
                });

                row.appendChild(nameInput);
                row.appendChild(deleteBtn);
                companionListEl.appendChild(row);
            });

            if (content.companions.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'companion-empty-state';
                empty.style.padding = '8px 0';
                empty.textContent = t('companion.emptyState');
                companionListEl.appendChild(empty);
            }
        }

        refreshCompanionList();

        // ── Attributes Section ──
        const attrLabel = document.createElement('label');
        attrLabel.className = 'cv-modal-label';
        attrLabel.textContent = t('companion.attrName');
        attrLabel.style.marginTop = '16px';

        const attrListEl = document.createElement('div');
        attrListEl.className = 'companion-attr-list';

        body.appendChild(attrLabel);
        body.appendChild(attrListEl);

        function reRenderModuleBody() {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) {
                const isLayoutMode = document.body.classList.contains('mode-edit');
                renderCompanionsBody(bodyEl, data, isLayoutMode);
            }
        }

        function refreshAttrList() {
            if (attrListEl._sortable) { attrListEl._sortable.destroy(); attrListEl._sortable = null; }
            attrListEl.innerHTML = '';
            content.attributes.forEach((attr) => {
                const row = document.createElement('div');
                row.className = 'companion-attr-row';
                row.dataset.attrId = attr.id;

                const dragHandle = document.createElement('span');
                dragHandle.className = 'companion-attr-drag-handle';
                dragHandle.innerHTML = '&#x2807;';
                row.appendChild(dragHandle);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'companion-attr-row-name';
                nameSpan.textContent = attr.name;

                const typeSpan = document.createElement('span');
                typeSpan.className = 'companion-attr-row-type';
                typeSpan.textContent = getAttrTypeLabel(attr.type);

                const pinBtn = document.createElement('button');
                pinBtn.className = 'companion-attr-pin-btn' + (attr.pinned ? ' pinned' : '');
                pinBtn.title = t('companion.pinned');
                pinBtn.innerHTML = attr.pinned
                    ? '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>'
                    : '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>';
                pinBtn.addEventListener('click', () => {
                    attr.pinned = !attr.pinned;
                    scheduleSave();
                    refreshAttrList();
                    reRenderModuleBody();
                });

                row.appendChild(nameSpan);
                row.appendChild(typeSpan);
                row.appendChild(pinBtn);

                if (!attr.builtIn) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'companion-attr-delete-btn';
                    deleteBtn.title = t('companion.delete');
                    deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
                    deleteBtn.addEventListener('click', () => {
                        showConfirm(
                            {
                                title: t('companion.deleteTitle'),
                                message: t('companion.deleteMsg', { name: attr.name }),
                            },
                            () => {
                                content.attributes = content.attributes.filter(a => a.id !== attr.id);
                                content.companions.forEach(c => { delete c.values[attr.id]; });
                                scheduleSave();
                                refreshAttrList();
                                reRenderModuleBody();
                            }
                        );
                    });
                    row.appendChild(deleteBtn);
                }

                attrListEl.appendChild(row);
            });

            if (content.attributes.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'companion-empty-state';
                empty.style.padding = '8px 0';
                empty.textContent = t('companion.noAttrs');
                attrListEl.appendChild(empty);
            }

            if (typeof Sortable !== 'undefined' && content.attributes.length > 1) {
                attrListEl._sortable = new Sortable(attrListEl, {
                    handle: '.companion-attr-drag-handle',
                    animation: 150,
                    ghostClass: 'companion-attr-ghost',
                    draggable: '.companion-attr-row',
                    onEnd: function () {
                        var rows = Array.from(attrListEl.querySelectorAll('.companion-attr-row'));
                        var reordered = rows
                            .map(function (r) { return content.attributes.find(function (a) { return a.id === r.dataset.attrId; }); })
                            .filter(Boolean);
                        content.attributes = reordered;
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
        }

        refreshAttrList();

        // Add attribute row
        const addAttrRow = document.createElement('div');
        addAttrRow.className = 'companion-add-attr-row';

        const newAttrInput = document.createElement('input');
        newAttrInput.type = 'text';
        newAttrInput.className = 'cv-modal-input';
        newAttrInput.style.flex = '1';
        newAttrInput.style.minWidth = '100px';
        newAttrInput.placeholder = t('companion.attrName') + '...';

        const typeOptions = [
            { value: 'number', label: t('companion.attrTypeNumber') },
            { value: 'number-pair', label: t('companion.attrTypeNumberPair') },
            { value: 'text', label: t('companion.attrTypeText') },
            { value: 'toggle', label: t('companion.attrTypeToggle') },
        ];
        const typeSelectWidget = buildCvSelect(typeOptions, 'number', function () {});

        const addAttrBtn = document.createElement('button');
        addAttrBtn.className = 'btn-primary';
        addAttrBtn.textContent = t('companion.addAttr');
        addAttrBtn.style.whiteSpace = 'nowrap';

        addAttrBtn.addEventListener('click', () => {
            const name = newAttrInput.value.trim();
            if (!name) return;
            const type = typeSelectWidget.getValue();
            let defaultValue;
            if (type === 'number-pair') defaultValue = { current: 0, max: 0 };
            else if (type === 'number') defaultValue = 0;
            else if (type === 'toggle') defaultValue = false;
            else defaultValue = '';

            const newAttr = {
                id: generateAttrId(),
                name,
                type,
                defaultValue,
                pinned: true,
                builtIn: false,
            };
            content.attributes.push(newAttr);

            content.companions.forEach((c) => {
                if (type === 'number-pair') c.values[newAttr.id] = { current: 0, max: 0 };
                else if (type === 'number') c.values[newAttr.id] = 0;
                else if (type === 'toggle') c.values[newAttr.id] = false;
                else c.values[newAttr.id] = '';
            });

            newAttrInput.value = '';
            scheduleSave();
            refreshAttrList();
            reRenderModuleBody();
        });

        newAttrInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addAttrBtn.click();
        });

        addAttrRow.appendChild(newAttrInput);
        addAttrRow.appendChild(typeSelectWidget.el);
        addAttrRow.appendChild(addAttrBtn);
        body.appendChild(addAttrRow);

        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const closeFooterBtn = document.createElement('button');
        closeFooterBtn.type = 'button';
        closeFooterBtn.className = 'btn-secondary sm';
        closeFooterBtn.textContent = t('companion.close');
        closeFooterBtn.addEventListener('click', closeModal);

        footer.appendChild(closeFooterBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeModal() { overlay.remove(); }
        closeXBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        requestAnimationFrame(() => { addInput.focus(); });
    }

    function getAttrTypeLabel(type) {
        switch (type) {
            case 'number': return t('companion.attrTypeNumber');
            case 'number-pair': return t('companion.attrTypeNumberPair');
            case 'text': return t('companion.attrTypeText');
            case 'toggle': return t('companion.attrTypeToggle');
            default: return type;
        }
    }

    // ── Module Type Registration ──

    registerModuleType('companions', {
        label: 'type.companions',

        renderBody(bodyEl, data, isPlayMode) {
            const isLayoutMode = !isPlayMode;
            renderCompanionsBody(bodyEl, data, isLayoutMode);
        },

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) renderCompanionsBody(bodyEl, data, false);
        },

        onLayoutMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) renderCompanionsBody(bodyEl, data, true);
        },

        syncState(data) {
            ensureContent(data);
        },
    });

    // ── Window Exports ──
    window.buildCompanionsDefaultContent = buildCompanionsDefaultContent;
    window.openCompanionSettings = function (moduleEl, data) { openCompanionSettings(moduleEl, data); };

    console.log('[CV] Companions module registered');
})();
