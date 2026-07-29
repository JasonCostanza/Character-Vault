// ── Abilities Module Type ──
(function () {
    // ── Ability Templates ──
    const ABILITY_TEMPLATES = {
        dnd5e: [
            { name: 'Acrobatics', linkedStat: 'DEX' },
            { name: 'Animal Handling', linkedStat: 'WIS' },
            { name: 'Arcana', linkedStat: 'INT' },
            { name: 'Athletics', linkedStat: 'STR' },
            { name: 'Deception', linkedStat: 'CHA' },
            { name: 'History', linkedStat: 'INT' },
            { name: 'Insight', linkedStat: 'WIS' },
            { name: 'Intimidation', linkedStat: 'CHA' },
            { name: 'Investigation', linkedStat: 'INT' },
            { name: 'Medicine', linkedStat: 'WIS' },
            { name: 'Nature', linkedStat: 'INT' },
            { name: 'Perception', linkedStat: 'WIS' },
            { name: 'Performance', linkedStat: 'CHA' },
            { name: 'Persuasion', linkedStat: 'CHA' },
            { name: 'Religion', linkedStat: 'INT' },
            { name: 'Sleight of Hand', linkedStat: 'DEX' },
            { name: 'Stealth', linkedStat: 'DEX' },
            { name: 'Survival', linkedStat: 'WIS' },
        ],
        pf2e: [
            { name: 'Acrobatics', linkedStat: 'DEX' },
            { name: 'Arcana', linkedStat: 'INT' },
            { name: 'Athletics', linkedStat: 'STR' },
            { name: 'Crafting', linkedStat: 'INT' },
            { name: 'Deception', linkedStat: 'CHA' },
            { name: 'Diplomacy', linkedStat: 'CHA' },
            { name: 'Intimidation', linkedStat: 'CHA' },
            { name: 'Lore', linkedStat: 'INT' },
            { name: 'Medicine', linkedStat: 'WIS' },
            { name: 'Nature', linkedStat: 'WIS' },
            { name: 'Occultism', linkedStat: 'INT' },
            { name: 'Performance', linkedStat: 'CHA' },
            { name: 'Religion', linkedStat: 'WIS' },
            { name: 'Society', linkedStat: 'INT' },
            { name: 'Stealth', linkedStat: 'DEX' },
            { name: 'Survival', linkedStat: 'WIS' },
            { name: 'Thievery', linkedStat: 'DEX' },
        ],
        coc: [
            { name: 'Accounting', linkedStat: 'EDU' },
            { name: 'Anthropology', linkedStat: 'EDU' },
            { name: 'Appraise', linkedStat: 'INT' },
            { name: 'Archaeology', linkedStat: 'EDU' },
            { name: 'Charm', linkedStat: 'APP' },
            { name: 'Climb', linkedStat: 'STR' },
            { name: 'Credit Rating', linkedStat: null },
            { name: 'Cthulhu Mythos', linkedStat: null },
            { name: 'Dodge', linkedStat: 'DEX' },
            { name: 'Drive Auto', linkedStat: 'DEX' },
            { name: 'Fast Talk', linkedStat: 'APP' },
            { name: 'Fighting (Brawl)', linkedStat: 'STR' },
            { name: 'First Aid', linkedStat: 'DEX' },
            { name: 'History', linkedStat: 'EDU' },
            { name: 'Intimidate', linkedStat: 'STR' },
            { name: 'Library Use', linkedStat: 'EDU' },
            { name: 'Listen', linkedStat: 'INT' },
            { name: 'Locksmith', linkedStat: 'DEX' },
            { name: 'Mechanical Repair', linkedStat: 'DEX' },
            { name: 'Medicine', linkedStat: 'EDU' },
            { name: 'Natural World', linkedStat: 'INT' },
            { name: 'Navigate', linkedStat: 'INT' },
            { name: 'Occult', linkedStat: 'INT' },
            { name: 'Persuade', linkedStat: 'APP' },
            { name: 'Psychology', linkedStat: 'POW' },
            { name: 'Science', linkedStat: 'EDU' },
            { name: 'Sleight of Hand', linkedStat: 'DEX' },
            { name: 'Spot Hidden', linkedStat: 'INT' },
            { name: 'Stealth', linkedStat: 'DEX' },
            { name: 'Swim', linkedStat: 'STR' },
            { name: 'Throw', linkedStat: 'DEX' },
            { name: 'Track', linkedStat: 'INT' },
        ],
        vtm: [
            // Physical
            { name: 'Athletics', linkedStat: 'Strength' },
            { name: 'Brawl', linkedStat: 'Strength' },
            { name: 'Craft', linkedStat: 'Dexterity' },
            { name: 'Drive', linkedStat: 'Dexterity' },
            { name: 'Firearms', linkedStat: 'Dexterity' },
            { name: 'Larceny', linkedStat: 'Dexterity' },
            { name: 'Melee', linkedStat: 'Strength' },
            { name: 'Stealth', linkedStat: 'Dexterity' },
            { name: 'Survival', linkedStat: 'Stamina' },
            // Social
            { name: 'Animal Ken', linkedStat: 'Charisma' },
            { name: 'Etiquette', linkedStat: 'Charisma' },
            { name: 'Insight', linkedStat: 'Wits' },
            { name: 'Intimidation', linkedStat: 'Strength' },
            { name: 'Leadership', linkedStat: 'Charisma' },
            { name: 'Performance', linkedStat: 'Charisma' },
            { name: 'Persuasion', linkedStat: 'Charisma' },
            { name: 'Streetwise', linkedStat: 'Manipulation' },
            { name: 'Subterfuge', linkedStat: 'Manipulation' },
            // Mental
            { name: 'Academics', linkedStat: 'Intelligence' },
            { name: 'Awareness', linkedStat: 'Wits' },
            { name: 'Finance', linkedStat: 'Intelligence' },
            { name: 'Investigation', linkedStat: 'Intelligence' },
            { name: 'Medicine', linkedStat: 'Intelligence' },
            { name: 'Occult', linkedStat: 'Intelligence' },
            { name: 'Politics', linkedStat: 'Intelligence' },
            { name: 'Technology', linkedStat: 'Intelligence' },
        ],
        cpred: [
            // INT
            { name: 'Accounting', linkedStat: 'INT' },
            { name: 'Animal Handling', linkedStat: 'INT' },
            { name: 'Business', linkedStat: 'INT' },
            { name: 'Composition', linkedStat: 'INT' },
            { name: 'Criminology', linkedStat: 'INT' },
            { name: 'Cryptography', linkedStat: 'INT' },
            { name: 'Deduction', linkedStat: 'INT' },
            { name: 'Education', linkedStat: 'INT' },
            { name: 'Gamble', linkedStat: 'INT' },
            { name: 'Library Search', linkedStat: 'INT' },
            { name: 'Local Expert', linkedStat: 'INT' },
            { name: 'Science', linkedStat: 'INT' },
            { name: 'Tactics', linkedStat: 'INT' },
            { name: 'Trading', linkedStat: 'INT' },
            { name: 'Wilderness Survival', linkedStat: 'INT' },
            // REF
            { name: 'Autofire', linkedStat: 'REF' },
            { name: 'Handgun', linkedStat: 'REF' },
            { name: 'Heavy Weapons', linkedStat: 'REF' },
            { name: 'Melee Weapon', linkedStat: 'REF' },
            { name: 'Rifle', linkedStat: 'REF' },
            { name: 'Shoulder Arms', linkedStat: 'REF' },
            // DEX
            { name: 'Athletics', linkedStat: 'DEX' },
            { name: 'Brawling', linkedStat: 'DEX' },
            { name: 'Contortionist', linkedStat: 'DEX' },
            { name: 'Dance', linkedStat: 'DEX' },
            { name: 'Evasion', linkedStat: 'DEX' },
            { name: 'Martial Arts', linkedStat: 'DEX' },
            { name: 'Stealth', linkedStat: 'DEX' },
            // TECH
            { name: 'Basic Tech', linkedStat: 'TECH' },
            { name: 'Cybertech', linkedStat: 'TECH' },
            { name: 'Demolitions', linkedStat: 'TECH' },
            { name: 'Electronics/Sec Tech', linkedStat: 'TECH' },
            { name: 'First Aid', linkedStat: 'TECH' },
            { name: 'Forgery', linkedStat: 'TECH' },
            { name: 'Land Vehicle Tech', linkedStat: 'TECH' },
            { name: 'Paramedic', linkedStat: 'TECH' },
            { name: 'Pick Lock', linkedStat: 'TECH' },
            { name: 'Pick Pocket', linkedStat: 'DEX' },
            { name: 'Weaponstech', linkedStat: 'TECH' },
            // COOL
            { name: 'Acting', linkedStat: 'COOL' },
            { name: 'Interrogation', linkedStat: 'COOL' },
            { name: 'Personal Grooming', linkedStat: 'COOL' },
            { name: 'Persuasion', linkedStat: 'COOL' },
            { name: 'Streetwise', linkedStat: 'COOL' },
            { name: 'Wardrobe & Style', linkedStat: 'COOL' },
            // WILL
            { name: 'Concentration', linkedStat: 'WILL' },
            { name: 'Endurance', linkedStat: 'WILL' },
            { name: 'Resist Torture/Drugs', linkedStat: 'WILL' },
            // EMP
            { name: 'Bribery', linkedStat: 'EMP' },
            { name: 'Conversation', linkedStat: 'EMP' },
            { name: 'Human Perception', linkedStat: 'EMP' },
            { name: 'Interview', linkedStat: 'EMP' },
            { name: 'Lip Reading', linkedStat: 'EMP' },
            { name: 'Seduction', linkedStat: 'EMP' },
            { name: 'Social', linkedStat: 'EMP' },
            { name: 'Tracking', linkedStat: 'INT' },
        ],
        mothership: [
            { name: 'Archaeology', linkedStat: 'Intellect' },
            { name: 'Art', linkedStat: 'Intellect' },
            { name: 'Athletics', linkedStat: 'Speed' },
            { name: 'Botany', linkedStat: 'Intellect' },
            { name: 'Computers', linkedStat: 'Intellect' },
            { name: 'Engineering', linkedStat: 'Intellect' },
            { name: 'Firearms', linkedStat: 'Combat' },
            { name: 'First Aid', linkedStat: 'Intellect' },
            { name: 'Geology', linkedStat: 'Intellect' },
            { name: 'Gunnery', linkedStat: 'Combat' },
            { name: 'Hand-to-Hand', linkedStat: 'Combat' },
            { name: 'Mathematics', linkedStat: 'Intellect' },
            { name: 'Mechanical Repair', linkedStat: 'Intellect' },
            { name: 'Medicine', linkedStat: 'Intellect' },
            { name: 'Military Training', linkedStat: 'Combat' },
            { name: 'Mycology', linkedStat: 'Intellect' },
            { name: 'Pathology', linkedStat: 'Intellect' },
            { name: 'Pharmacology', linkedStat: 'Intellect' },
            { name: 'Physics', linkedStat: 'Intellect' },
            { name: 'Piloting', linkedStat: 'Intellect' },
            { name: 'Robotics', linkedStat: 'Intellect' },
            { name: 'Theology', linkedStat: 'Intellect' },
            { name: 'Thrown Weapons', linkedStat: 'Combat' },
            { name: 'Xenobiology', linkedStat: 'Intellect' },
            { name: 'Zero-G', linkedStat: 'Speed' },
        ],
        sr6: [
            { name: 'Astral', linkedStat: null },
            { name: 'Athletics', linkedStat: 'Agility' },
            { name: 'Biotech', linkedStat: 'Logic' },
            { name: 'Close Combat', linkedStat: 'Agility' },
            { name: 'Con', linkedStat: 'Charisma' },
            { name: 'Conjuring', linkedStat: null },
            { name: 'Cracking', linkedStat: 'Logic' },
            { name: 'Electronics', linkedStat: 'Logic' },
            { name: 'Engineering', linkedStat: 'Logic' },
            { name: 'Exotic Weapons', linkedStat: 'Agility' },
            { name: 'Firearms', linkedStat: 'Agility' },
            { name: 'Influence', linkedStat: 'Charisma' },
            { name: 'Outdoors', linkedStat: 'Intuition' },
            { name: 'Perception', linkedStat: 'Intuition' },
            { name: 'Piloting', linkedStat: 'Reaction' },
            { name: 'Sorcery', linkedStat: null },
            { name: 'Stealth', linkedStat: 'Agility' },
            { name: 'Tasking', linkedStat: null },
        ],
    };

    function applyAbilityTemplate(templateKey) {
        const template = ABILITY_TEMPLATES[templateKey];
        if (!template) return [];
        return template.map((t) => ({
            name: t.name,
            modifier: 0,
            proficiency: 'none',
            proficiencyRank: 'untrained',
            linkedStat: t.linkedStat || null,
        }));
    }

    // ── Ability Helpers ──
    function getAbilityBaseMod(ability, data) {
        if (data.content.linkedStatModuleId && ability.linkedStat) {
            var statMod = window.getAbilityModifierFrom(ability.linkedStat, data.content.linkedStatModuleId);
            return statMod + (ability.modifier || 0);
        }
        return ability.modifier || 0;
    }

    function getAbilityTotalMod(ability, data) {
        var base = getAbilityBaseMod(ability, data);
        var sys = window.gameSystem || 'custom';
        if (
            (sys === 'dnd5e' || sys === 'custom') &&
            typeof window.getProficiencyBonus === 'function'
        ) {
            if (ability.proficiency === 'expert') return base + window.getProficiencyBonus() * 2;
            if (ability.proficiency === 'proficient') return base + window.getProficiencyBonus();
        }
        if (sys === 'pf2e' && typeof window.computePf2eProficiencyBonus === 'function') {
            return base + window.computePf2eProficiencyBonus(ability.proficiencyRank || 'untrained');
        }
        return base;
    }

    function rollAbilityCheck(ability, data) {
        var sys = window.gameSystem || 'custom';
        var profBonus = 0;
        if (
            (sys === 'dnd5e' || sys === 'custom') &&
            typeof window.getProficiencyBonus === 'function'
        ) {
            if (ability.proficiency === 'expert') profBonus = window.getProficiencyBonus() * 2;
            else if (ability.proficiency === 'proficient') profBonus = window.getProficiencyBonus();
        } else if (sys === 'pf2e' && typeof window.computePf2eProficiencyBonus === 'function') {
            profBonus = window.computePf2eProficiencyBonus(ability.proficiencyRank || 'untrained');
        }
        var totalMod = getAbilityBaseMod(ability, data) + profBonus;
        const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
        if (sys === 'daggerheart') {
            window.rollDualityDice(
                ability.name + ' ' + t('abilities.check'),
                totalMod,
                'abilities.event.roll',
                'abilities.log.roll',
                { name: ability.name || t('abilities.unnamed'), modifier: '2d12' + modStr },
                data.id
            );
            return;
        }
        try {
            const rollPromise = TS.dice.putDiceInTray([
                { name: `${ability.name} ${t('abilities.check')}`, roll: `1d20${modStr}` },
            ]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({
                    type: 'abilities.event.roll',
                    message: t('abilities.log.roll', {
                        name: ability.name || t('abilities.unnamed'),
                        modifier: modStr,
                    }),
                    sourceModuleId: data.id,
                });
                rollPromise
                    .then(function (rollId) {
                        if (rollId) window.pendingRolls[rollId] = { logEntryId };
                    })
                    .catch(function (e) {
                        console.warn('[CV] Ability roll failed:', e);
                    });
            }
        } catch (e) {
            console.warn('[CV] Ability roll failed:', e);
        }
    }

    // ── Render Functions ──
    function renderAbilityRow(ability, index, data) {
        const abbrev = ability.linkedStat ? ability.linkedStat.substring(0, 3).toUpperCase() : ability.abbrev || '';
        const row = document.createElement('div');
        row.className = 'ability-row ability-rollable';
        row.dataset.index = index;
        row.title = t('abilities.rollCheck').replace('{name}', ability.name || t('abilities.unnamed'));

        var playSys = window.gameSystem || 'custom';
        var profHtml;
        if (playSys === 'pf2e') {
            var playRank = ability.proficiencyRank || 'untrained';
            if (playRank !== 'untrained') {
                profHtml =
                    '<span class="ability-rank-badge" title="' +
                    escapeHtml(t('rank.' + playRank)) +
                    '">' +
                    playRank.charAt(0).toUpperCase() +
                    '</span>';
            } else {
                profHtml = '<span class="ability-rank-badge untrained"></span>';
            }
        } else {
            var isExpert = ability.proficiency === 'expert';
            var isProf = ability.proficiency === 'proficient' || isExpert;
            var dotClass = 'ability-proficiency-dot' + (isProf ? ' active' : '') + (isExpert ? ' expert' : '');
            var dotTitle = isExpert ? t('abilities.expertise') : isProf ? t('abilities.proficiency') : t('abilities.notProficient');
            profHtml = '<span class="' + dotClass + '" title="' + escapeHtml(dotTitle) + '"></span>';
        }
        row.innerHTML =
            profHtml +
            (abbrev ? `<span class="ability-abbrev">${escapeHtml(abbrev)}</span>` : '') +
            `<span class="ability-name">${escapeHtml(ability.name || t('abilities.unnamed'))}</span>` +
            `<span class="ability-modifier">${escapeHtml(formatModifier(getAbilityTotalMod(ability, data)))}</span>`;

        const nameEl = row.querySelector('.ability-name');
        nameEl.addEventListener('click', (e) => {
            if (modKeys.ctrl) {
                e.stopPropagation();
                enterAbilityNameQuickEdit(row, nameEl, ability, index, data);
            }
        });

        row.addEventListener('click', (e) => {
            if (modKeys.ctrl) {
                e.stopPropagation();
                enterAbilityQuickEdit(row, ability, index, data);
                return;
            }
            rollAbilityCheck(ability, data);
        });
        return row;
    }

    // ── Quick Edit (Ctrl+Click) ──
    function enterAbilityQuickEdit(row, ability, index, data) {
        const modEl = row.querySelector('.ability-modifier');
        window.openEditPopover(modEl, {
            label: ability.name || t('abilities.unnamed'),
            value: ability.modifier,
            type: 'number',
            relative: true,
            onSave(newVal) {
                ability.modifier = newVal;
                scheduleSave();
                row.replaceWith(renderAbilityRow(ability, index, data));
            },
        });
    }

    function enterAbilityNameQuickEdit(row, nameEl, ability, index, data) {
        window.openEditPopover(nameEl, {
            label: t('abilities.nameLabel'),
            value: ability.name || '',
            type: 'text',
            onSave(newName) {
                const oldName = ability.name;
                ability.name = newName;
                if (typeof window.propagateEntityRename === 'function') {
                    window.propagateEntityRename(data.id, 'ability', oldName, ability.name);
                }
                scheduleSave();
                row.replaceWith(renderAbilityRow(ability, index, data));
            },
        });
    }

    // ── Settings Panel ──
    function openAbilitySettings(moduleEl, data) {
        const existing = document.querySelector('.ability-settings-overlay');
        if (existing) existing.remove();

        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay ability-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('abilities.settingsTitle');

        const closeBtnEl = document.createElement('button');
        closeBtnEl.className = 'cv-modal-close';
        closeBtnEl.title = t('abilities.close');
        closeBtnEl.innerHTML = cvIcon('x', 14);

        header.appendChild(titleEl);
        header.appendChild(closeBtnEl);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        function reRenderModuleBody() {
            const bodyEl = moduleEl.querySelector('.module-body');
            const typeDef = window.MODULE_TYPES?.['abilities'];
            if (typeDef && bodyEl) typeDef.renderBody(bodyEl, data);
        }

        // ── Manage Abilities ──
        const manageLabel = document.createElement('div');
        manageLabel.className = 'cv-modal-label';
        manageLabel.textContent = t('abilities.manageAbilities');
        body.appendChild(manageLabel);

        const manageList = document.createElement('div');
        manageList.className = 'ability-manage-list';

        function buildManageRow(ability, index) {
            const row = document.createElement('div');
            row.className = 'ability-manage-row';
            row.dataset.index = index;

            const drag = document.createElement('span');
            drag.className = 'ability-manage-drag';
            drag.innerHTML = '&#x2807;';
            row.appendChild(drag);

            const isLinked = !!(data.content.linkedStatModuleId && ability.linkedStat);
            const sys = window.gameSystem || 'custom';
            if (sys === 'pf2e') {
                const rankWrap = document.createElement('span');
                rankWrap.className = 'ability-rank-select-wrap';
                const rankSel = window.buildCvSelect(
                    window.buildPf2eRankOptions(),
                    ability.proficiencyRank || 'untrained',
                    function (v) {
                        ability.proficiencyRank = v;
                        scheduleSave();
                        reRenderModuleBody();
                    }
                );
                rankWrap.appendChild(rankSel.el);
                row.appendChild(rankWrap);
            } else {
                const profDot = document.createElement('span');
                var isExp = ability.proficiency === 'expert';
                var isPrf = ability.proficiency === 'proficient' || isExp;
                profDot.className = 'ability-proficiency-dot' + (isPrf ? ' active' : '') + (isExp ? ' expert' : '');
                profDot.title = isExp ? t('abilities.expertise') : isPrf ? t('abilities.proficiency') : t('abilities.notProficient');
                profDot.addEventListener('click', function () {
                    if (ability.proficiency === 'none' || !ability.proficiency) ability.proficiency = 'proficient';
                    else if (ability.proficiency === 'proficient') ability.proficiency = 'expert';
                    else ability.proficiency = 'none';
                    var e = ability.proficiency === 'expert';
                    var p = ability.proficiency === 'proficient' || e;
                    profDot.className = 'ability-proficiency-dot' + (p ? ' active' : '') + (e ? ' expert' : '');
                    profDot.title = e ? t('abilities.expertise') : p ? t('abilities.proficiency') : t('abilities.notProficient');
                    scheduleSave();
                    reRenderModuleBody();
                });
                row.appendChild(profDot);
            }

            const abbrev = ability.linkedStat ? ability.linkedStat.substring(0, 3).toUpperCase() : ability.abbrev || '';
            if (isLinked) {
                const abbrevEl = document.createElement('span');
                abbrevEl.className = 'ability-abbrev ability-abbrev--locked';
                abbrevEl.textContent = abbrev;
                row.appendChild(abbrevEl);
            } else {
                const abbrevInput = document.createElement('input');
                abbrevInput.type = 'text';
                abbrevInput.className = 'ability-abbrev-input';
                abbrevInput.maxLength = 3;
                abbrevInput.value = abbrev;
                abbrevInput.placeholder = '---';
                abbrevInput.title = t('abilities.abbrevLabel');
                abbrevInput.addEventListener('input', function () {
                    const val = abbrevInput.value.toUpperCase().substring(0, 3);
                    abbrevInput.value = val;
                    ability.abbrev = val || null;
                    scheduleSave();
                    reRenderModuleBody();
                });
                row.appendChild(abbrevInput);
            }

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'ability-manage-name';
            nameInput.value = ability.name;
            nameInput.placeholder = t('abilities.unnamed');
            nameInput.addEventListener('input', function () {
                const oldName = ability.name;
                ability.name = nameInput.value;
                if (typeof window.propagateEntityRename === 'function') {
                    window.propagateEntityRename(data.id, 'ability', oldName, ability.name);
                }
                scheduleSave();
                const bodyEl = moduleEl.querySelector('.module-body');
                const nameEl = bodyEl && bodyEl.querySelector('.ability-row[data-index="' + index + '"] .ability-name');
                if (nameEl) nameEl.textContent = ability.name || t('abilities.unnamed');
            });
            row.appendChild(nameInput);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'ability-manage-delete';
            deleteBtn.title = t('abilities.deleteAbility');
            deleteBtn.innerHTML = cvIcon('x', 12);
            deleteBtn.addEventListener('click', function () {
                const idx = data.content.abilities.indexOf(ability);
                if (idx !== -1) data.content.abilities.splice(idx, 1);
                scheduleSave();
                renderManageRows();
                reRenderModuleBody();
            });
            row.appendChild(deleteBtn);

            return row;
        }

        function renderManageRows() {
            manageList.innerHTML = '';
            data.content.abilities.forEach(function (ability, i) {
                manageList.appendChild(buildManageRow(ability, i));
            });
            if (manageList._sortable) manageList._sortable.destroy();
            if (data.content.abilities.length > 1) {
                manageList._sortable = new Sortable(manageList, {
                    handle: '.ability-manage-drag',
                    animation: 150,
                    ghostClass: 'ability-ghost',
                    draggable: '.ability-manage-row',
                    onEnd: function () {
                        const items = Array.from(manageList.querySelectorAll('.ability-manage-row'));
                        const reordered = items
                            .map((el) => data.content.abilities[parseInt(el.dataset.index, 10)])
                            .filter(Boolean);
                        data.content.abilities = reordered;
                        items.forEach(function (el, i) {
                            el.dataset.index = i;
                        });
                        scheduleSave();
                        reRenderModuleBody();
                    },
                });
            }
        }

        renderManageRows();
        body.appendChild(manageList);

        const addAbilityBtn = document.createElement('button');
        addAbilityBtn.type = 'button';
        addAbilityBtn.className = 'btn-secondary sm';
        addAbilityBtn.innerHTML = cvIcon('plus', 14) + ' ' + escapeHtml(t('abilities.addAbility'));
        addAbilityBtn.addEventListener('click', function () {
            data.content.abilities.push({
                name: '',
                modifier: 0,
                proficiency: 'none',
                proficiencyRank: 'untrained',
                linkedStat: null,
            });
            scheduleSave();
            renderManageRows();
            reRenderModuleBody();
            const inputs = manageList.querySelectorAll('.ability-manage-name');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });
        body.appendChild(addAbilityBtn);

        const fieldLabel = document.createElement('label');
        fieldLabel.className = 'cv-modal-label';
        fieldLabel.textContent = t('abilities.linkedStatModule');

        const statPicker = buildStatModulePicker(
            data.content.linkedStatModuleId,
            function () {
                dirty = true;
            },
            t('abilities.noLinkedModule')
        );

        body.appendChild(fieldLabel);
        body.appendChild(statPicker.el);
        buildCommonSettingsSection(body, moduleEl, data);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('abilities.cancel');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('abilities.save');

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
        }

        function save() {
            data.content.linkedStatModuleId = statPicker.getValue() || null;
            scheduleSave();
            reRenderModuleBody();
            updateAbilitiesChainIcon(moduleEl, data);
            close();
        }

        function tryClose() {
            if (dirty) {
                showConfirm(t('common.discardChanges'), close);
            } else {
                close();
            }
        }

        closeBtnEl.addEventListener('click', tryClose);
        cancelBtn.addEventListener('click', tryClose);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) tryClose();
        });

        function onKeydown(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                tryClose();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    // ── Chain Link Indicator ──
    function updateAbilitiesChainIcon(moduleEl, data) {
        window.updateChainLinkIndicator(moduleEl, 'abilities', 'abilities.linkedTo', data);
    }

    // ── Module Body Builder ──
    function buildAbilityBody(bodyEl, data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { linkedStatModuleId: null, abilities: [] };
        }
        if (!Array.isArray(data.content.abilities)) {
            data.content.abilities = [];
        }
        var abilityGuardSys = window.gameSystem || 'custom';
        data.content.abilities.forEach(function (ability) {
            if (typeof ability.proficiency === 'boolean') {
                ability.proficiency = ability.proficiency ? 'proficient' : 'none';
            }
            if (ability.proficiency !== 'none' && ability.proficiency !== 'proficient' && ability.proficiency !== 'expert') {
                ability.proficiency = 'none';
            }
            if (ability.proficiencyRank === undefined) {
                ability.proficiencyRank = abilityGuardSys === 'pf2e' && ability.proficiency === 'proficient' ? 'trained' : 'untrained';
            }
        });

        const container = document.createElement('div');
        container.className = 'ability-container';

        if (data.content.abilities.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ability-empty-state';
            empty.textContent = t('abilities.noAbilities');
            container.appendChild(empty);
        } else {
            data.content.abilities.forEach((ability, i) => {
                container.appendChild(renderAbilityRow(ability, i, data));
            });
        }

        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);

        const moduleEl = bodyEl.closest('.module');
        if (moduleEl) updateAbilitiesChainIcon(moduleEl, data);
    }

    // ── Module Type Registration ──
    registerModuleType('abilities', {
        label: 'type.abilities',
        hasStatLink: true,

        renderBody(bodyEl, data) {
            buildAbilityBody(bodyEl, data);
        },

        overflowMenuItems(moduleEl, data) {
            return [
                {
                    onClick: () => openAbilitySettings(moduleEl, data),
                    label: t('abilities.settings'),
                    icon: cvIcon('settings', 14),
                },
                {
                    onClick() {
                        data.content.abilities.push({ name: '', modifier: 0, proficiency: 'none', linkedStat: null });
                        const bodyEl = moduleEl.querySelector('.module-body');
                        buildAbilityBody(bodyEl, data);
                        snapModuleHeight(moduleEl, data);
                        scheduleSave();
                    },
                    label: t('abilities.addAbility'),
                    icon: cvIcon('plus', 14),
                },
            ];
        },
    });

    window.ABILITY_TEMPLATES = ABILITY_TEMPLATES;
    window.applyAbilityTemplate = applyAbilityTemplate;
    window.getAbilityTotalMod = getAbilityTotalMod;
    window.refreshLinkedAbilitiesChainIcons = function (statModuleId) {
        window.modules.forEach((mod) => {
            if (mod.type !== 'abilities') return;
            if (mod.content?.linkedStatModuleId !== statModuleId) return;
            const moduleEl = document.querySelector(`.module[data-id="${mod.id}"]`);
            if (moduleEl) updateAbilitiesChainIcon(moduleEl, mod);
        });
    };

    document.addEventListener('cv:stat-values-changed', function (e) {
        var changedId = e.detail && e.detail.moduleId;
        window.modules.forEach(function (mod) {
            if (mod.type !== 'abilities' || !mod.content) return;
            if (mod.content.linkedStatModuleId !== changedId) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) buildAbilityBody(bodyEl, mod);
        });
    });

    document.addEventListener('cv:level-changed', function () {
        window.modules.forEach(function (mod) {
            if (mod.type !== 'abilities' || !mod.content) return;
            var moduleEl = document.querySelector('.module[data-id="' + mod.id + '"]');
            if (!moduleEl) return;
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl) buildAbilityBody(bodyEl, mod);
        });
    });
})();
