// ── Weapons Module ──
(function () {
    'use strict';

    var _warnedGameSystem = false;
    var CV_ICONS_KEYS_SORTED = null;

    // ── ID Generation ──
    function generateWeaponId() {
        return 'wpn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureWeaponsContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { weapons: [] };
        }
        if (!Array.isArray(data.content.weapons)) data.content.weapons = [];
        data.content.weapons.forEach(function (w) {
            if (!w.id) w.id = generateWeaponId();
            if (typeof w.name !== 'string') w.name = '';
            if (w.slot !== 'main' && w.slot !== 'off') w.slot = 'main';
            if (w.kind !== 'melee' && w.kind !== 'ranged' && w.kind !== 'shield') w.kind = 'melee';
            if (w.icon === undefined) w.icon = null;
            if (['str', 'dex', 'con', 'int', 'wis', 'cha'].indexOf(w.abilityMod) === -1) w.abilityMod = 'str';
            if (typeof w.proficient !== 'boolean') w.proficient = false;
            if (w.attackBonusOverride === undefined) w.attackBonusOverride = null;
            if (!Array.isArray(w.damageInstances)) w.damageInstances = [];
            if (w.range === undefined) w.range = null;
            if (w.ammoCount === undefined) w.ammoCount = null;
            if (!Array.isArray(w.traits)) w.traits = [];
            if (typeof w.notesMarkdown !== 'string') w.notesMarkdown = '';
            if (typeof w.twoHanded !== 'boolean') w.twoHanded = false;
            if (w.acBonus === undefined) w.acBonus = null;
            if (w.shieldHp === undefined) w.shieldHp = null;
            if (w.shieldHpMax === undefined) w.shieldHpMax = null;
        });
        return data.content;
    }

    // ── Attack Bonus Computation ──
    function weaponsComputeAttackBonus(weapon) {
        if (weapon.attackBonusOverride !== null && weapon.attackBonusOverride !== undefined) {
            return Number(weapon.attackBonusOverride);
        }
        var abilityMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
        var profBonus = weapon.proficient && typeof window.getProficiencyBonus === 'function' ? window.getProficiencyBonus() : 0;
        return abilityMod + profBonus;
    }

    // ── Damage Summary ──
    function weaponsFormatDamageSummary(weapon) {
        if (!weapon.damageInstances || !weapon.damageInstances.length) return '';
        var inst = weapon.damageInstances[0];
        var bonus = Number(inst.flatBonus) || 0;
        if (inst.modFromAbility) {
            bonus += typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
        }
        var dmg = inst.dice || '';
        if (bonus > 0) dmg += '+' + bonus;
        else if (bonus < 0) dmg += bonus;
        if (inst.damageType) dmg += ' ' + inst.damageType;
        return dmg.trim();
    }

    // ── Misc Helpers ──
    function formatBonus(n) {
        return n >= 0 ? '+' + n : String(n);
    }

    function buildField(labelText) {
        var field = document.createElement('div');
        field.className = 'weapon-edit-field';
        var lbl = document.createElement('label');
        lbl.className = 'weapon-edit-label';
        lbl.textContent = labelText;
        field.appendChild(lbl);
        return field;
    }

    // ── Weapon Card ──
    function buildWeaponCard(weapon, data, isPlayMode, moduleEl, bodyEl) {
        var card = document.createElement('div');
        card.className = 'weapon-card';
        card.dataset.id = weapon.id;

        if (!isPlayMode) {
            var handle = document.createElement('span');
            handle.className = 'weapon-drag-handle';
            handle.innerHTML = '&#x2807;';
            card.appendChild(handle);
        }

        if (weapon.icon && CV_ICONS[weapon.icon]) {
            var iconEl = document.createElement('span');
            iconEl.className = 'weapon-card-icon';
            iconEl.innerHTML = CV_ICONS[weapon.icon];
            card.appendChild(iconEl);
        }

        var info = document.createElement('div');
        info.className = 'weapon-card-info';

        var nameRow = document.createElement('div');
        nameRow.className = 'weapon-card-name-row';

        var nameEl = document.createElement('span');
        nameEl.className = 'weapon-name';
        nameEl.textContent = weapon.name || t('weapons.unnamed');
        nameRow.appendChild(nameEl);

        if (weapon.kind === 'shield') {
            if (weapon.acBonus !== null) {
                var acEl = document.createElement('span');
                acEl.className = 'weapon-bonus';
                acEl.textContent = 'AC ' + formatBonus(weapon.acBonus);
                nameRow.appendChild(acEl);
            }
        } else {
            var bonus = weaponsComputeAttackBonus(weapon);
            var bonusEl = document.createElement('span');
            bonusEl.className = 'weapon-bonus' + (weapon.attackBonusOverride !== null ? ' weapon-bonus-override' : '');
            bonusEl.textContent = formatBonus(bonus);
            if (weapon.attackBonusOverride !== null) {
                bonusEl.setAttribute('data-tooltip', t('weapons.overrideIndicator'));
            }
            nameRow.appendChild(bonusEl);
        }
        info.appendChild(nameRow);

        if (weapon.kind !== 'shield') {
            var dmg = weaponsFormatDamageSummary(weapon);
            if (dmg) {
                var dmgEl = document.createElement('div');
                dmgEl.className = 'weapon-damage-summary';
                dmgEl.textContent = dmg;
                info.appendChild(dmgEl);
            }
        }

        if (weapon.traits && weapon.traits.length) {
            var traitsEl = document.createElement('div');
            traitsEl.className = 'weapon-traits';
            weapon.traits.forEach(function (trait) {
                var chip = document.createElement('span');
                chip.className = 'weapon-trait-chip';
                chip.textContent = trait;
                traitsEl.appendChild(chip);
            });
            info.appendChild(traitsEl);
        }

        if (weapon.kind === 'ranged' && weapon.ammoCount !== null) {
            var ammoEl = document.createElement('div');
            ammoEl.className = 'weapon-ammo-pip';
            ammoEl.textContent = weapon.ammoCount;
            ammoEl.setAttribute('data-tooltip', t('weapons.ammo'));
            if (isPlayMode) {
                (function (el, w) {
                    el.addEventListener('click', function (e) {
                        if (e.ctrlKey) { e.stopPropagation(); enterQuickEditAmmo(el, w, data, bodyEl); }
                    });
                })(ammoEl, weapon);
            }
            info.appendChild(ammoEl);
        }

        if (weapon.kind === 'shield' && weapon.shieldHp !== null) {
            var hpEl = document.createElement('div');
            hpEl.className = 'weapon-shield-hp';
            hpEl.textContent = (weapon.shieldHp || 0) + ' / ' + (weapon.shieldHpMax || 0) + ' HP';
            if (isPlayMode) {
                (function (el, w) {
                    el.addEventListener('click', function (e) {
                        if (e.ctrlKey) { e.stopPropagation(); enterQuickEditShieldHp(el, w, data, bodyEl); }
                    });
                })(hpEl, weapon);
            }
            info.appendChild(hpEl);
        }

        card.appendChild(info);

        if (isPlayMode) {
            (function (w) {
                card.addEventListener('click', function (e) {
                    if (!e.ctrlKey) openWeaponActionModal(moduleEl, data, w);
                });
            })(weapon);
        } else {
            (function (w) {
                card.addEventListener('click', function () {
                    openWeaponEditModal(moduleEl, data, w, bodyEl);
                });
            })(weapon);
        }

        return card;
    }

    function buildPlaceholderCard() {
        var card = document.createElement('div');
        card.className = 'weapon-card weapon-placeholder';
        var lbl = document.createElement('span');
        lbl.className = 'weapon-name';
        lbl.textContent = t('weapons.twoHandedOccupied');
        card.appendChild(lbl);
        return card;
    }

    // ── Quick Edit ──
    function enterQuickEditAmmo(pipEl, weapon, data, bodyEl) {
        var committed = false;
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'weapon-quick-edit-input';
        input.value = weapon.ammoCount !== null ? weapon.ammoCount : 0;
        input.min = '0';
        pipEl.textContent = '';
        pipEl.appendChild(input);
        input.focus();
        input.select();

        function commit() {
            if (committed) return;
            committed = true;
            var val = parseInt(input.value, 10);
            if (isNaN(val) || val < 0) val = 0;
            weapon.ammoCount = val;
            scheduleSave();
            renderPlayBody(bodyEl, data);
        }
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') renderPlayBody(bodyEl, data);
        });
    }

    function enterQuickEditShieldHp(hpEl, weapon, data, bodyEl) {
        var committed = false;
        var oldHp = weapon.shieldHp !== null ? weapon.shieldHp : 0;
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'weapon-quick-edit-input';
        input.value = oldHp;
        input.min = '0';
        if (weapon.shieldHpMax !== null) input.max = String(weapon.shieldHpMax);
        hpEl.textContent = '';
        hpEl.appendChild(input);
        input.focus();
        input.select();

        function commit() {
            if (committed) return;
            committed = true;
            var val = parseInt(input.value, 10);
            if (isNaN(val) || val < 0) val = 0;
            if (weapon.shieldHpMax !== null && val > weapon.shieldHpMax) val = weapon.shieldHpMax;
            weapon.shieldHp = val;
            scheduleSave();
            if (val < oldHp && typeof window.logActivity === 'function') {
                window.logActivity({
                    type: 'weapons.event.shieldDamage',
                    message: t('weapons.log.shieldDamage', { name: weapon.name || t('weapons.unnamed'), amount: oldHp - val, from: oldHp, to: val }),
                    sourceModuleId: data.id,
                });
            }
            renderPlayBody(bodyEl, data);
        }
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') renderPlayBody(bodyEl, data);
        });
    }

    // ── Two-column Layout Helper ──
    function buildTwoColumnLayout(data, isPlayMode, moduleEl, bodyEl) {
        var content = data.content;
        var container = document.createElement('div');
        container.className = 'weapons-container';

        var mainCol = document.createElement('div');
        mainCol.className = 'weapons-column';
        mainCol.dataset.slot = 'main';

        var divider = document.createElement('div');
        divider.className = 'weapons-divider';

        var offCol = document.createElement('div');
        offCol.className = 'weapons-column';
        offCol.dataset.slot = 'off';

        var mainLabel = document.createElement('div');
        mainLabel.className = 'weapons-column-label';
        mainLabel.textContent = t('weapons.mainHand');
        mainCol.appendChild(mainLabel);

        var offLabel = document.createElement('div');
        offLabel.className = 'weapons-column-label';
        offLabel.textContent = t('weapons.offHand');
        offCol.appendChild(offLabel);

        var mainWeapons = [], offWeapons = [], mainTwoHanded = [], offTwoHanded = [];
        content.weapons.forEach(function (w) {
            if (w.slot === 'main') {
                mainWeapons.push(w);
                if (w.twoHanded) mainTwoHanded.push(w);
            } else {
                offWeapons.push(w);
                if (w.twoHanded) offTwoHanded.push(w);
            }
        });

        mainWeapons.forEach(function (w) { mainCol.appendChild(buildWeaponCard(w, data, isPlayMode, moduleEl, bodyEl)); });
        offTwoHanded.forEach(function () { mainCol.appendChild(buildPlaceholderCard()); });

        offWeapons.forEach(function (w) { offCol.appendChild(buildWeaponCard(w, data, isPlayMode, moduleEl, bodyEl)); });
        mainTwoHanded.forEach(function () { offCol.appendChild(buildPlaceholderCard()); });

        container.appendChild(mainCol);
        container.appendChild(divider);
        container.appendChild(offCol);

        return { container: container, mainCol: mainCol, offCol: offCol };
    }

    // ── Play Mode ──
    function renderPlayBody(bodyEl, data) {
        if (window.gameSystem && window.gameSystem !== 'dnd5e' && !_warnedGameSystem) {
            console.warn('[CV] Weapons: non-5e game system not yet supported, using 5e math');
            _warnedGameSystem = true;
        }
        var content = ensureWeaponsContent(data);
        var moduleEl = bodyEl.closest('.module');
        bodyEl.innerHTML = '';

        if (!content.weapons.length) {
            var empty = document.createElement('div');
            empty.className = 'weapons-empty-state';
            empty.textContent = t('weapons.noWeapons');
            bodyEl.appendChild(empty);
            return;
        }

        var layout = buildTwoColumnLayout(data, true, moduleEl, bodyEl);
        bodyEl.appendChild(layout.container);
    }

    // ── Edit Mode ──
    function renderEditBody(bodyEl, data) {
        if (window.gameSystem && window.gameSystem !== 'dnd5e' && !_warnedGameSystem) {
            console.warn('[CV] Weapons: non-5e game system not yet supported, using 5e math');
            _warnedGameSystem = true;
        }
        var content = ensureWeaponsContent(data);
        var moduleEl = bodyEl.closest('.module');
        bodyEl.innerHTML = '';

        var layout = buildTwoColumnLayout(data, false, moduleEl, bodyEl);
        var mainCol = layout.mainCol;
        var offCol = layout.offCol;

        function makeAddBtn(slot) {
            var btn = document.createElement('button');
            btn.className = 'weapon-add-btn';
            btn.textContent = t('weapons.addWeapon');
            btn.addEventListener('click', function () {
                var newWeapon = {
                    id: generateWeaponId(),
                    name: '',
                    slot: slot,
                    kind: 'melee',
                    icon: null,
                    abilityMod: 'str',
                    proficient: false,
                    attackBonusOverride: null,
                    damageInstances: [{ dice: '1d6', modFromAbility: true, flatBonus: 0, damageType: 'slashing' }],
                    range: null,
                    ammoCount: null,
                    traits: [],
                    notesMarkdown: '',
                    twoHanded: false,
                    acBonus: null,
                    shieldHp: null,
                    shieldHpMax: null,
                };
                openWeaponEditModal(moduleEl, data, newWeapon, bodyEl);
            });
            return btn;
        }

        mainCol.appendChild(makeAddBtn('main'));
        offCol.appendChild(makeAddBtn('off'));

        bodyEl.appendChild(layout.container);
        initWeaponsSortable(mainCol, offCol, data, bodyEl);
    }

    // ── SortableJS ──
    function initWeaponsSortable(mainCol, offCol, data, bodyEl) {
        var groupName = 'weapons-' + data.id;
        var opts = {
            group: { name: groupName, pull: true, put: true },
            animation: 150,
            handle: '.weapon-drag-handle',
            ghostClass: 'weapon-ghost',
            draggable: '.weapon-card:not(.weapon-placeholder)',
            filter: '.weapon-placeholder,.weapon-add-btn',
            onEnd: function (evt) {
                var toSlot = evt.to.dataset.slot;
                var movedId = evt.item.dataset.id;
                var movedWeapon = data.content.weapons.find(function (w) { return w.id === movedId; });
                if (movedWeapon) movedWeapon.slot = toSlot;

                var orderedIds = [];
                mainCol.querySelectorAll('.weapon-card:not(.weapon-placeholder)').forEach(function (el) { orderedIds.push(el.dataset.id); });
                offCol.querySelectorAll('.weapon-card:not(.weapon-placeholder)').forEach(function (el) { orderedIds.push(el.dataset.id); });
                data.content.weapons.sort(function (a, b) {
                    var ai = orderedIds.indexOf(a.id);
                    var bi = orderedIds.indexOf(b.id);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                });

                scheduleSave();
                renderEditBody(bodyEl, data);
            },
        };
        new Sortable(mainCol, opts);
        new Sortable(offCol, opts);
    }

    // ── Action Modal (Play Mode) ──
    function openWeaponActionModal(moduleEl, data, weapon) {
        var existing = document.querySelector('.weapon-action-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay weapon-action-overlay';

        var panel = document.createElement('div');
        panel.className = 'cv-modal-panel weapon-action-panel';

        var header = document.createElement('div');
        header.className = 'cv-modal-header';
        var titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = weapon.name || t('weapons.unnamed');
        header.appendChild(titleEl);
        var closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('weapons.close');
        closeBtn.innerHTML = CV_SVG_CLOSE;
        header.appendChild(closeBtn);

        var body = document.createElement('div');
        body.className = 'cv-modal-body weapon-action-body';

        var colWrap = document.createElement('div');
        colWrap.className = 'weapon-action-columns';

        if (weapon.kind !== 'shield') {
            var attackCol = document.createElement('div');
            attackCol.className = 'weapon-action-col';
            var attackColLabel = document.createElement('div');
            attackColLabel.className = 'weapon-action-col-label';
            attackColLabel.textContent = t('weapons.attack');
            attackCol.appendChild(attackColLabel);

            var bonus = weaponsComputeAttackBonus(weapon);
            var rollExpr = '1d20' + formatBonus(bonus);
            var attackBtn = document.createElement('button');
            attackBtn.className = 'btn-primary weapon-action-btn';
            attackBtn.textContent = t('weapons.attack') + ' (' + rollExpr + ')';
            attackBtn.addEventListener('click', function () {
                if (typeof TS === 'undefined') return;
                var rollPromise = TS.dice.putDiceInTray([{ name: (weapon.name || t('weapons.unnamed')) + ': ' + t('weapons.attack'), roll: rollExpr }]);
                if (typeof window.logActivity === 'function') {
                    var logEntryId = window.logActivity({
                        type: 'weapons.event.roll',
                        message: t('weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: rollExpr }),
                        sourceModuleId: data.id,
                    });
                    rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId: logEntryId }; });
                }
            });
            attackCol.appendChild(attackBtn);

            colWrap.appendChild(attackCol);
        }

        if (weapon.damageInstances && weapon.damageInstances.length) {
            var damageCol = document.createElement('div');
            damageCol.className = 'weapon-action-col';
            var dmgColLabel = document.createElement('div');
            dmgColLabel.className = 'weapon-action-col-label';
            dmgColLabel.textContent = t('weapons.damage');
            damageCol.appendChild(dmgColLabel);

            weapon.damageInstances.forEach(function (inst) {
                var instBonus = Number(inst.flatBonus) || 0;
                if (inst.modFromAbility) {
                    instBonus += typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
                }
                var diceExpr = (inst.dice || '1d4') + (instBonus !== 0 ? formatBonus(instBonus) : '');
                var typeLabel = inst.damageType || '';
                var btn = document.createElement('button');
                btn.className = 'btn-secondary weapon-action-btn';
                btn.textContent = diceExpr + (typeLabel ? ' ' + typeLabel : '');
                (function (expr, type) {
                    btn.addEventListener('click', function () {
                        if (typeof TS === 'undefined') return;
                        var rollPromise = TS.dice.putDiceInTray([{ name: (weapon.name || t('weapons.unnamed')) + ': ' + (type || t('weapons.damage')), roll: expr }]);
                        if (typeof window.logActivity === 'function') {
                            var logEntryId = window.logActivity({
                                type: 'weapons.event.damage',
                                message: t('weapons.log.damage', { name: weapon.name || t('weapons.unnamed'), roll: expr, type: type }),
                                sourceModuleId: data.id,
                            });
                            rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId: logEntryId }; });
                        }
                    });
                })(diceExpr, typeLabel);
                damageCol.appendChild(btn);
            });

            colWrap.appendChild(damageCol);
        }

        body.appendChild(colWrap);

        if (weapon.notesMarkdown && weapon.notesMarkdown.trim()) {
            var notesEl = document.createElement('div');
            notesEl.className = 'weapon-action-notes';
            notesEl.innerHTML = typeof window.renderMarkdown === 'function'
                ? window.renderMarkdown(weapon.notesMarkdown)
                : escapeHtml(weapon.notesMarkdown);
            body.appendChild(notesEl);
        }

        panel.appendChild(header);
        panel.appendChild(body);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        closeBtn.addEventListener('click', forceClose);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) forceClose(); });

        var keyHandler = function (e) { if (e.key === 'Escape') { e.stopPropagation(); forceClose(); } };
        document.addEventListener('keydown', keyHandler);
    }

    // ── Edit Modal ──
    function openWeaponEditModal(moduleEl, data, weapon, bodyEl) {
        var existing = document.querySelector('.weapon-edit-overlay');
        if (existing) existing.remove();

        var isExistingWeapon = !!data.content.weapons.find(function (w) { return w.id === weapon.id; });
        var workingWeapon = Object.assign({}, weapon);
        workingWeapon.damageInstances = weapon.damageInstances.map(function (inst) { return Object.assign({}, inst); });
        workingWeapon.traits = weapon.traits.slice();
        var dirty = false;

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay weapon-edit-overlay';

        var panel = document.createElement('div');
        panel.className = 'cv-modal-panel weapon-edit-panel';

        // ── Header ──
        var header = document.createElement('div');
        header.className = 'cv-modal-header';
        var titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = isExistingWeapon ? t('weapons.editWeapon') : t('weapons.newWeapon');
        header.appendChild(titleEl);
        var closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('weapons.close');
        closeBtn.innerHTML = CV_SVG_CLOSE;
        header.appendChild(closeBtn);

        // ── Body ──
        var modalBody = document.createElement('div');
        modalBody.className = 'cv-modal-body weapon-edit-body';

        // Name
        var nameField = buildField(t('weapons.name'));
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-input';
        nameInput.value = workingWeapon.name || '';
        nameInput.placeholder = t('weapons.unnamed');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', function () { workingWeapon.name = nameInput.value; dirty = true; });
        nameField.appendChild(nameInput);
        modalBody.appendChild(nameField);

        // Icon
        var iconField = buildField(t('weapons.icon'));
        var iconGrid = document.createElement('div');
        iconGrid.className = 'weapon-icon-grid';

        var noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.className = 'weapon-icon-btn' + (workingWeapon.icon === null ? ' selected' : '');
        noneBtn.textContent = t('weapons.iconNone');
        noneBtn.addEventListener('click', function () {
            workingWeapon.icon = null;
            dirty = true;
            iconGrid.querySelectorAll('.weapon-icon-btn').forEach(function (b) { b.classList.remove('selected'); });
            noneBtn.classList.add('selected');
        });
        iconGrid.appendChild(noneBtn);

        if (!CV_ICONS_KEYS_SORTED) CV_ICONS_KEYS_SORTED = Object.keys(CV_ICONS).sort();
        CV_ICONS_KEYS_SORTED.forEach(function (key) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'weapon-icon-btn' + (workingWeapon.icon === key ? ' selected' : '');
            btn.title = key;
            btn.innerHTML = CV_ICONS[key];
            btn.addEventListener('click', function () {
                workingWeapon.icon = key;
                dirty = true;
                iconGrid.querySelectorAll('.weapon-icon-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
            });
            iconGrid.appendChild(btn);
        });
        iconField.appendChild(iconGrid);
        modalBody.appendChild(iconField);

        // Slot + Kind
        var rowSlotKind = document.createElement('div');
        rowSlotKind.className = 'weapon-edit-row';

        var slotField = buildField(t('weapons.slot'));
        var slotSel = buildCvSelect(
            [{ value: 'main', label: t('weapons.mainHand') }, { value: 'off', label: t('weapons.offHand') }],
            workingWeapon.slot,
            function (v) { workingWeapon.slot = v; dirty = true; }
        );
        slotField.appendChild(slotSel.el);
        rowSlotKind.appendChild(slotField);

        var kindField = buildField(t('weapons.kind'));
        var kindSel = buildCvSelect(
            [{ value: 'melee', label: t('weapons.melee') }, { value: 'ranged', label: t('weapons.ranged') }, { value: 'shield', label: t('weapons.shield') }],
            workingWeapon.kind,
            function (v) { workingWeapon.kind = v; dirty = true; updateConditionalSections(); }
        );
        kindField.appendChild(kindSel.el);
        rowSlotKind.appendChild(kindField);
        modalBody.appendChild(rowSlotKind);

        // Ability + Proficient
        var rowAbility = document.createElement('div');
        rowAbility.className = 'weapon-edit-row';

        var abilityField = buildField(t('weapons.abilityMod'));
        var abilitySel = buildCvSelect(
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(function (k) { return { value: k, label: k.toUpperCase() }; }),
            workingWeapon.abilityMod,
            function (v) { workingWeapon.abilityMod = v; dirty = true; }
        );
        abilityField.appendChild(abilitySel.el);
        rowAbility.appendChild(abilityField);

        var profField = buildField(t('weapons.proficient'));
        var profLabel = document.createElement('label');
        profLabel.className = 'weapon-edit-check-label';
        var profCheck = document.createElement('input');
        profCheck.type = 'checkbox';
        profCheck.checked = workingWeapon.proficient;
        profCheck.addEventListener('change', function () { workingWeapon.proficient = profCheck.checked; dirty = true; });
        profLabel.appendChild(profCheck);
        profField.appendChild(profLabel);
        rowAbility.appendChild(profField);
        modalBody.appendChild(rowAbility);

        // Attack Bonus Override + Two-Handed
        var rowOverride = document.createElement('div');
        rowOverride.className = 'weapon-edit-row';

        var overrideField = buildField(t('weapons.attackBonusOverride'));
        var overrideInput = document.createElement('input');
        overrideInput.type = 'number';
        overrideInput.className = 'cv-input';
        overrideInput.value = workingWeapon.attackBonusOverride !== null ? workingWeapon.attackBonusOverride : '';
        overrideInput.placeholder = '—';
        overrideInput.addEventListener('input', function () {
            var val = overrideInput.value.trim();
            workingWeapon.attackBonusOverride = val === '' ? null : Number(val);
            dirty = true;
        });
        overrideField.appendChild(overrideInput);
        rowOverride.appendChild(overrideField);

        var twoHandedField = buildField(t('weapons.twoHanded'));
        var twoHandedLabel = document.createElement('label');
        twoHandedLabel.className = 'weapon-edit-check-label';
        var twoHandedCheck = document.createElement('input');
        twoHandedCheck.type = 'checkbox';
        twoHandedCheck.checked = workingWeapon.twoHanded;
        twoHandedCheck.addEventListener('change', function () { workingWeapon.twoHanded = twoHandedCheck.checked; dirty = true; });
        twoHandedLabel.appendChild(twoHandedCheck);
        twoHandedField.appendChild(twoHandedLabel);
        rowOverride.appendChild(twoHandedField);
        modalBody.appendChild(rowOverride);

        // ── Ranged Section ──
        var rangedSection = document.createElement('div');
        rangedSection.className = 'weapon-edit-section';
        var rangedRow = document.createElement('div');
        rangedRow.className = 'weapon-edit-row';

        var rangeField = buildField(t('weapons.range'));
        var rangeInput = document.createElement('input');
        rangeInput.type = 'text';
        rangeInput.className = 'cv-input';
        rangeInput.value = workingWeapon.range || '';
        rangeInput.placeholder = '80/320';
        rangeInput.spellcheck = false;
        rangeInput.addEventListener('input', function () { workingWeapon.range = rangeInput.value.trim() || null; dirty = true; });
        rangeField.appendChild(rangeInput);
        rangedRow.appendChild(rangeField);

        var ammoField = buildField(t('weapons.ammo'));
        var ammoInput = document.createElement('input');
        ammoInput.type = 'number';
        ammoInput.className = 'cv-input';
        ammoInput.value = workingWeapon.ammoCount !== null ? workingWeapon.ammoCount : '';
        ammoInput.min = '0';
        ammoInput.placeholder = '0';
        ammoInput.addEventListener('input', function () {
            var val = ammoInput.value.trim();
            workingWeapon.ammoCount = val === '' ? null : Math.max(0, parseInt(val, 10) || 0);
            dirty = true;
        });
        ammoField.appendChild(ammoInput);
        rangedRow.appendChild(ammoField);
        rangedSection.appendChild(rangedRow);

        // ── Shield Section ──
        var shieldSection = document.createElement('div');
        shieldSection.className = 'weapon-edit-section';
        var shieldRow = document.createElement('div');
        shieldRow.className = 'weapon-edit-row';

        var acBonusField = buildField(t('weapons.acBonus'));
        var acBonusInput = document.createElement('input');
        acBonusInput.type = 'number';
        acBonusInput.className = 'cv-input';
        acBonusInput.value = workingWeapon.acBonus !== null ? workingWeapon.acBonus : '';
        acBonusInput.placeholder = '0';
        acBonusInput.addEventListener('input', function () {
            var val = acBonusInput.value.trim();
            workingWeapon.acBonus = val === '' ? null : Number(val);
            dirty = true;
        });
        acBonusField.appendChild(acBonusInput);
        shieldRow.appendChild(acBonusField);

        var shieldHpField = buildField(t('weapons.shieldHp'));
        var shieldHpInput = document.createElement('input');
        shieldHpInput.type = 'number';
        shieldHpInput.className = 'cv-input';
        shieldHpInput.value = workingWeapon.shieldHp !== null ? workingWeapon.shieldHp : '';
        shieldHpInput.min = '0';
        shieldHpInput.addEventListener('input', function () {
            var val = shieldHpInput.value.trim();
            var n = val === '' ? null : Math.max(0, parseInt(val, 10) || 0);
            if (n !== null && workingWeapon.shieldHpMax !== null && n > workingWeapon.shieldHpMax) {
                n = workingWeapon.shieldHpMax;
                shieldHpInput.value = n;
            }
            workingWeapon.shieldHp = n;
            dirty = true;
        });
        shieldHpField.appendChild(shieldHpInput);
        shieldRow.appendChild(shieldHpField);

        var shieldHpMaxField = buildField(t('weapons.shieldHpMax'));
        var shieldHpMaxInput = document.createElement('input');
        shieldHpMaxInput.type = 'number';
        shieldHpMaxInput.className = 'cv-input';
        shieldHpMaxInput.value = workingWeapon.shieldHpMax !== null ? workingWeapon.shieldHpMax : '';
        shieldHpMaxInput.min = '0';
        shieldHpMaxInput.addEventListener('input', function () {
            var val = shieldHpMaxInput.value.trim();
            workingWeapon.shieldHpMax = val === '' ? null : Math.max(0, parseInt(val, 10) || 0);
            dirty = true;
        });
        shieldHpMaxField.appendChild(shieldHpMaxInput);
        shieldRow.appendChild(shieldHpMaxField);
        shieldSection.appendChild(shieldRow);

        // ── Damage Instances ──
        var damageSection = document.createElement('div');
        damageSection.className = 'weapon-edit-damage-section';
        var dmgSectionLabel = document.createElement('div');
        dmgSectionLabel.className = 'weapon-edit-section-label';
        dmgSectionLabel.textContent = t('weapons.damage');
        damageSection.appendChild(dmgSectionLabel);

        var damageList = document.createElement('div');
        damageList.className = 'weapon-damage-list';
        damageSection.appendChild(damageList);

        function renderDamageRows() {
            damageList.innerHTML = '';
            workingWeapon.damageInstances.forEach(function (inst, idx) {
                var row = document.createElement('div');
                row.className = 'weapon-damage-row';

                var diceInput = document.createElement('input');
                diceInput.type = 'text';
                diceInput.className = 'cv-input weapon-damage-dice';
                diceInput.value = inst.dice || '';
                diceInput.placeholder = t('weapons.dice');
                diceInput.spellcheck = false;
                (function (i) { diceInput.addEventListener('input', function () { workingWeapon.damageInstances[i].dice = diceInput.value.trim(); dirty = true; }); })(idx);
                row.appendChild(diceInput);

                var flatInput = document.createElement('input');
                flatInput.type = 'number';
                flatInput.className = 'cv-input weapon-damage-flat';
                flatInput.value = inst.flatBonus || 0;
                flatInput.placeholder = t('weapons.flatBonus');
                (function (i) { flatInput.addEventListener('input', function () { workingWeapon.damageInstances[i].flatBonus = Number(flatInput.value) || 0; dirty = true; }); })(idx);
                row.appendChild(flatInput);

                var typeInput = document.createElement('input');
                typeInput.type = 'text';
                typeInput.className = 'cv-input weapon-damage-type';
                typeInput.value = inst.damageType || '';
                typeInput.placeholder = t('weapons.damageType');
                typeInput.spellcheck = false;
                (function (i) { typeInput.addEventListener('input', function () { workingWeapon.damageInstances[i].damageType = typeInput.value.trim(); dirty = true; }); })(idx);
                row.appendChild(typeInput);

                var modLbl = document.createElement('label');
                modLbl.className = 'weapon-damage-mod-label';
                var modCheck = document.createElement('input');
                modCheck.type = 'checkbox';
                modCheck.checked = inst.modFromAbility;
                (function (i) { modCheck.addEventListener('change', function () { workingWeapon.damageInstances[i].modFromAbility = modCheck.checked; dirty = true; }); })(idx);
                modLbl.appendChild(modCheck);
                var modSpan = document.createElement('span');
                modSpan.textContent = t('weapons.modFromAbility');
                modLbl.appendChild(modSpan);
                row.appendChild(modLbl);

                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-secondary sm weapon-damage-remove';
                removeBtn.textContent = t('weapons.removeDamage');
                (function (i) {
                    removeBtn.addEventListener('click', function () {
                        workingWeapon.damageInstances.splice(i, 1);
                        dirty = true;
                        renderDamageRows();
                    });
                })(idx);
                row.appendChild(removeBtn);

                damageList.appendChild(row);
            });
        }
        renderDamageRows();

        var addDmgBtn = document.createElement('button');
        addDmgBtn.type = 'button';
        addDmgBtn.className = 'btn-secondary sm weapon-damage-add';
        addDmgBtn.textContent = t('weapons.addDamage');
        addDmgBtn.addEventListener('click', function () {
            workingWeapon.damageInstances.push({ dice: '1d6', modFromAbility: false, flatBonus: 0, damageType: '' });
            dirty = true;
            renderDamageRows();
        });
        damageSection.appendChild(addDmgBtn);

        // ── Traits ──
        var traitsField = buildField(t('weapons.traits'));
        var traitsInput = document.createElement('input');
        traitsInput.type = 'text';
        traitsInput.className = 'cv-input';
        traitsInput.value = workingWeapon.traits.join(', ');
        traitsInput.placeholder = t('weapons.traitsPlaceholder');
        traitsInput.spellcheck = false;
        traitsInput.addEventListener('input', function () {
            workingWeapon.traits = traitsInput.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            dirty = true;
        });
        traitsField.appendChild(traitsInput);

        // ── Notes ──
        var notesField = buildField(t('weapons.notes'));
        var notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'cv-input weapon-edit-notes';
        notesTextarea.value = workingWeapon.notesMarkdown || '';
        notesTextarea.rows = 3;
        notesTextarea.spellcheck = false;
        notesTextarea.addEventListener('input', function () { workingWeapon.notesMarkdown = notesTextarea.value; dirty = true; });
        notesField.appendChild(notesTextarea);

        // Append sections in order
        modalBody.appendChild(rangedSection);
        modalBody.appendChild(shieldSection);
        modalBody.appendChild(damageSection);
        modalBody.appendChild(traitsField);
        modalBody.appendChild(notesField);

        function updateConditionalSections() {
            rangedSection.style.display = workingWeapon.kind === 'ranged' ? '' : 'none';
            shieldSection.style.display = workingWeapon.kind === 'shield' ? '' : 'none';
        }
        updateConditionalSections();

        // ── Footer ──
        var footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        if (isExistingWeapon) {
            var deleteWrap = document.createElement('div');
            deleteWrap.className = 'cv-modal-footer-left';
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger sm';
            deleteBtn.textContent = t('weapons.deleteWeapon');
            deleteBtn.addEventListener('click', function () {
                if (!window.confirm(t('weapons.deleteConfirm'))) return;
                var idx = data.content.weapons.findIndex(function (w) { return w.id === weapon.id; });
                if (idx !== -1) data.content.weapons.splice(idx, 1);
                scheduleSave();
                forceClose();
                renderEditBody(bodyEl, data);
            });
            deleteWrap.appendChild(deleteBtn);
            footer.appendChild(deleteWrap);
        }

        var footerRight = document.createElement('div');
        footerRight.className = 'cv-modal-footer-right';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('weapons.cancel');
        cancelBtn.addEventListener('click', close);
        footerRight.appendChild(cancelBtn);

        var saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm solid';
        saveBtn.textContent = t('weapons.save');
        saveBtn.addEventListener('click', save);
        footerRight.appendChild(saveBtn);

        footer.appendChild(footerRight);

        panel.appendChild(header);
        panel.appendChild(modalBody);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function save() {
            if (!workingWeapon.name || !workingWeapon.name.trim()) {
                nameInput.focus();
                nameInput.classList.add('weapon-input-error');
                return;
            }
            nameInput.classList.remove('weapon-input-error');
            Object.assign(weapon, workingWeapon);
            if (!data.content.weapons.find(function (w) { return w.id === weapon.id; })) {
                data.content.weapons.push(weapon);
            }
            scheduleSave();
            forceClose();
            renderEditBody(bodyEl, data);
        }

        function close() {
            if (dirty && !window.confirm(t('weapons.discardChanges'))) return;
            forceClose();
            renderEditBody(bodyEl, data);
        }

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        var keyHandler = function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        document.addEventListener('keydown', keyHandler);

        nameInput.focus();
    }

    // ── Module Type Registration ──
    registerModuleType('weapons', {
        label: 'type.weapons',

        renderBody: function (bodyEl, data, isPlayMode) {
            if (isPlayMode) {
                renderPlayBody(bodyEl, data);
            } else {
                renderEditBody(bodyEl, data);
            }
        },

        onPlayMode: function (moduleEl, data) {
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode: function (moduleEl, data) {
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },

        syncState: function () {},
    });

    // ── Window Exports ──
    window.generateWeaponId = generateWeaponId;
    window.ensureWeaponsContent = ensureWeaponsContent;
    window.weaponsComputeAttackBonus = weaponsComputeAttackBonus;
    window.weaponsFormatDamageSummary = weaponsFormatDamageSummary;

    console.log('[CV] Weapons module registered');
})();
