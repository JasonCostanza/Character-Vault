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
            proficiency: false,
            linkedStat: t.linkedStat || null,
        }));
    }

    // ── Ability Helpers ──
    function formatModifier(mod) {
        const n = parseInt(mod, 10) || 0;
        return n >= 0 ? `+${n}` : `${n}`;
    }

    function getProficiencyState(ability, data) {
        if (!data.content.linkedStatModuleId || !ability.linkedStat) {
            return ability.proficiency;
        }
        const linkedModule = window.modules.find((m) => m.id === data.content.linkedStatModuleId);
        if (!linkedModule) return ability.proficiency;
        const stat = linkedModule.content?.stats?.find((s) => s.name === ability.linkedStat);
        return stat ? stat.proficient : ability.proficiency;
    }

    function rollAbilityCheck(ability, data) {
        var sys = window.gameSystem || 'custom';
        var profBonus = 0;
        if ((sys === 'dnd5e' || sys === 'custom') && getProficiencyState(ability, data) && typeof window.getProficiencyBonus === 'function') {
            profBonus = window.getProficiencyBonus();
        }
        var totalMod = ability.modifier + profBonus;
        const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
        try {
            const rollPromise = TS.dice.putDiceInTray([{ name: `${ability.name} ${t('abilities.check')}`, roll: `1d20${modStr}` }]);
            if (typeof window.logActivity === 'function') {
                const logEntryId = window.logActivity({ type: 'abilities.event.roll', message: t('abilities.log.roll', { name: ability.name || t('abilities.unnamed'), modifier: modStr }), sourceModuleId: data.id });
                rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId }; });
            }
        } catch (e) {
            console.warn('[CV] Ability roll failed:', e);
        }
    }

    // ── Render Functions ──
    function renderAbilityRow(ability, index, data) {
        const proficient = getProficiencyState(ability, data);
        const abbrev = ability.linkedStat ? ability.linkedStat.substring(0, 3).toUpperCase() : ability.abbrev || '';
        const row = document.createElement('div');
        row.className = 'ability-row ability-rollable';
        row.dataset.index = index;
        row.title = t('abilities.rollCheck').replace('{name}', ability.name || t('abilities.unnamed'));

        row.innerHTML =
            `<span class="ability-proficiency-dot${proficient ? ' active' : ''}"></span>` +
            (abbrev ? `<span class="ability-abbrev">${escapeHtml(abbrev)}</span>` : '') +
            `<span class="ability-name">${escapeHtml(ability.name || t('abilities.unnamed'))}</span>` +
            `<span class="ability-modifier">${escapeHtml(formatModifier(ability.modifier))}</span>`;

        row.addEventListener('click', () => rollAbilityCheck(ability, data));
        return row;
    }

    function renderAbilityRowEdit(ability, index, data) {
        const row = document.createElement('div');
        row.className = 'ability-edit-row';
        row.dataset.index = index;

        const proficient = getProficiencyState(ability, data);
        const isLinked = !!(data.content.linkedStatModuleId && ability.linkedStat);
        const abbrev = ability.linkedStat ? ability.linkedStat.substring(0, 3).toUpperCase() : ability.abbrev || '';
        row.innerHTML =
            `<span class="ability-drag-handle">&#x2807;</span>` +
            `<span class="ability-proficiency-dot${proficient ? ' active' : ''}${isLinked ? ' linked' : ''}" title="${t('abilities.proficiency')}"></span>` +
            (isLinked
                ? `<span class="ability-abbrev ability-abbrev--locked">${escapeHtml(abbrev)}</span>`
                : `<input class="ability-abbrev-input" type="text" maxlength="3" value="${escapeHtml(abbrev)}" placeholder="---" title="${t('abilities.abbrevLabel')}">`) +
            `<input class="ability-edit-name" type="text" value="${escapeHtml(ability.name)}" placeholder="${t('abilities.unnamed')}">` +
            `<input class="ability-edit-modifier" type="number" value="${ability.modifier}">` +
            `<button class="ability-edit-delete" title="${t('abilities.deleteAbility')}">` +
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
            `</button>`;

        const nameInput = row.querySelector('.ability-edit-name');
        const modInput = row.querySelector('.ability-edit-modifier');
        const abbrevInput = row.querySelector('.ability-abbrev-input');
        const profDot = row.querySelector('.ability-proficiency-dot');
        const deleteBtn = row.querySelector('.ability-edit-delete');

        nameInput.addEventListener('input', () => {
            ability.name = nameInput.value;
            scheduleSave();
        });
        modInput.addEventListener('input', () => {
            ability.modifier = parseInt(modInput.value, 10) || 0;
            scheduleSave();
        });
        if (abbrevInput) {
            abbrevInput.addEventListener('input', () => {
                const val = abbrevInput.value.toUpperCase().substring(0, 3);
                abbrevInput.value = val;
                ability.abbrev = val || null;
                scheduleSave();
            });
        }
        profDot.addEventListener('click', () => {
            if (isLinked) return;
            ability.proficiency = !ability.proficiency;
            profDot.classList.toggle('active', ability.proficiency);
            scheduleSave();
        });

        [nameInput, modInput, abbrevInput].filter(Boolean).forEach((inp) => {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') inp.blur();
            });
        });

        deleteBtn.addEventListener('click', () => {
            data.content.abilities.splice(index, 1);
            const container = row.closest('.ability-container');
            reRenderAbilityEdits(container, data);
            scheduleSave();
        });

        return row;
    }

    function reRenderAbilityEdits(container, data) {
        container.querySelectorAll('.ability-edit-row').forEach((el) => el.remove());
        data.content.abilities.forEach((ability, i) => {
            container.appendChild(renderAbilityRowEdit(ability, i, data));
        });
        if (container._sortable) container._sortable.destroy();
        initAbilitySortable(container, data);
    }

    function initAbilitySortable(container, data) {
        container._sortable = new Sortable(container, {
            handle: '.ability-drag-handle',
            animation: 150,
            ghostClass: 'ability-ghost',
            draggable: '.ability-edit-row',
            onEnd() {
                const items = Array.from(container.querySelectorAll('.ability-edit-row'));
                const reordered = items
                    .map((el) => data.content.abilities[parseInt(el.dataset.index, 10)])
                    .filter(Boolean);
                data.content.abilities = reordered;
                items.forEach((el, i) => (el.dataset.index = i));
                scheduleSave();
            },
        });
    }

    // ── Settings Panel ──
    function openAbilitySettings(moduleEl, data) {
        const existing = document.querySelector('.ability-settings-overlay');
        if (existing) existing.remove();

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
        closeBtnEl.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

        header.appendChild(titleEl);
        header.appendChild(closeBtnEl);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        const fieldLabel = document.createElement('label');
        fieldLabel.className = 'cv-modal-label';
        fieldLabel.textContent = t('abilities.linkedStatModule');

        const select = document.createElement('select');
        select.className = 'ability-settings-select';

        const noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = t('abilities.noLinkedModule');
        select.appendChild(noneOpt);

        window.modules
            .filter((m) => m.type === 'stat')
            .forEach((m) => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.title || t('type.stat');
                select.appendChild(opt);
            });

        select.value = data.content.linkedStatModuleId || '';

        body.appendChild(fieldLabel);
        body.appendChild(select);

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
            data.content.linkedStatModuleId = select.value || null;
            scheduleSave();
            const bodyEl = moduleEl.querySelector('.module-body');
            const isPlay = isPlayMode;
            buildAbilityBody(bodyEl, data, isPlay);
            updateAbilitiesChainIcon(moduleEl, data);
            close();
        }

        closeBtnEl.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        function onKeydown(e) {
            if (e.key === 'Escape') close();
        }
        document.addEventListener('keydown', onKeydown);
    }

    // ── Chain Link Indicator ──
    function updateAbilitiesChainIcon(moduleEl, data) {
        const indicator = moduleEl.querySelector('.module-abilities-link-indicator');
        if (!indicator) return;
        const linkedId = data.content.linkedStatModuleId;
        if (!linkedId) {
            indicator.style.display = 'none';
            indicator.title = '';
            return;
        }
        const linkedModule = window.modules.find((m) => m.id === linkedId);
        const name = linkedModule ? (linkedModule.title || t('type.stat')) : '?';
        indicator.title = t('abilities.linkedTo', { name });
        indicator.style.display = '';
    }

    // ── Module Body Builder ──
    function buildAbilityBody(bodyEl, data, isPlayMode) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { linkedStatModuleId: null, abilities: [] };
        }
        if (!Array.isArray(data.content.abilities)) {
            data.content.abilities = [];
        }

        const container = document.createElement('div');
        container.className = 'ability-container';

        if (data.content.abilities.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ability-empty-state';
            empty.textContent = t('abilities.noAbilities');
            container.appendChild(empty);
        } else if (isPlayMode) {
            data.content.abilities.forEach((ability, i) => {
                container.appendChild(renderAbilityRow(ability, i, data));
            });
        } else {
            data.content.abilities.forEach((ability, i) => {
                container.appendChild(renderAbilityRowEdit(ability, i, data));
            });
            initAbilitySortable(container, data);
        }

        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);

        const moduleEl = bodyEl.closest('.module');
        if (moduleEl) updateAbilitiesChainIcon(moduleEl, data);
    }

    // ── Module Type Registration ──
    registerModuleType('abilities', {
        label: 'type.abilities',

        renderBody(bodyEl, data, isPlayMode) {
            buildAbilityBody(bodyEl, data, isPlayMode);
        },

        onPlayMode(moduleEl, data) {
            buildAbilityBody(moduleEl.querySelector('.module-body'), data, true);
        },

        onLayoutMode(moduleEl, data) {
            buildAbilityBody(moduleEl.querySelector('.module-body'), data, false);
        },

        syncState(moduleEl, data) {
            moduleEl.querySelectorAll('.ability-edit-row').forEach((row, i) => {
                const ability = data.content.abilities[i];
                if (!ability) return;
                const nameInput = row.querySelector('.ability-edit-name');
                const modInput = row.querySelector('.ability-edit-modifier');
                const abbrevInput = row.querySelector('.ability-abbrev-input');
                if (nameInput) ability.name = nameInput.value;
                if (modInput) ability.modifier = parseInt(modInput.value, 10) || 0;
                if (abbrevInput) ability.abbrev = abbrevInput.value.toUpperCase().substring(0, 3) || null;
            });
        },
    });

    // ── Live Dot Sync ──
    function refreshLinkedDots() {
        if (isPlayMode) return;
        document.querySelectorAll('.module[data-type="abilities"]').forEach((moduleEl) => {
            const data = window.modules.find((m) => m.id === moduleEl.dataset.id);
            if (!data?.content?.abilities) return;
            moduleEl.querySelectorAll('.ability-edit-row').forEach((row, i) => {
                const ability = data.content.abilities[i];
                if (!ability) return;
                const dot = row.querySelector('.ability-proficiency-dot');
                if (!dot) return;
                dot.classList.toggle('active', getProficiencyState(ability, data));
            });
        });
    }

    const _origScheduleSave = window.scheduleSave;
    window.scheduleSave = function () {
        _origScheduleSave();
        refreshLinkedDots();
    };

    window.ABILITY_TEMPLATES = ABILITY_TEMPLATES;
    window.applyAbilityTemplate = applyAbilityTemplate;
    window.openAbilitySettings = function (moduleEl, data) {
        openAbilitySettings(moduleEl, data);
    };
    window.refreshLinkedAbilitiesChainIcons = function (statModuleId) {
        window.modules.forEach((mod) => {
            if (mod.type !== 'abilities') return;
            if (mod.content?.linkedStatModuleId !== statModuleId) return;
            const moduleEl = document.querySelector(`.module[data-id="${mod.id}"]`);
            if (moduleEl) updateAbilitiesChainIcon(moduleEl, mod);
        });
    };
})();
