// ── Weapons Module ──
(function () {
    'use strict';

    var CV_ICONS_KEYS_SORTED = null;
    var _chipTooltipEl = null;

    function _getChipTooltipEl() {
        if (!_chipTooltipEl) {
            _chipTooltipEl = document.createElement('div');
            _chipTooltipEl.className = 'weapon-chip-tooltip';
            document.body.appendChild(_chipTooltipEl);
        }
        return _chipTooltipEl;
    }

    function showChipTooltip(chip, text) {
        if (!text) return;
        var el = _getChipTooltipEl();
        el.textContent = text;
        var rect = chip.getBoundingClientRect();
        var left = Math.max(4, Math.min(rect.left, window.innerWidth - 232));
        if (rect.top > 70) {
            el.style.top = 'auto';
            el.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
        } else {
            el.style.bottom = 'auto';
            el.style.top = (rect.bottom + 6) + 'px';
        }
        el.style.left = left + 'px';
        el.classList.add('is-visible');
    }

    function hideChipTooltip() {
        if (_chipTooltipEl) _chipTooltipEl.classList.remove('is-visible');
    }

    // ── Weapon Trait Definitions (D&D 5e 2014) ──
    var WEAPON_TRAITS_DND5E = [
        { key: 'dnd5e.ammunition', nameKey: 'weapons.trait.dnd5e.ammunition', descKey: 'weapons.trait.dnd5e.ammunitionDesc', takesValue: true  },
        { key: 'dnd5e.finesse',    nameKey: 'weapons.trait.dnd5e.finesse',    descKey: 'weapons.trait.dnd5e.finesseDesc',    takesValue: false },
        { key: 'dnd5e.heavy',      nameKey: 'weapons.trait.dnd5e.heavy',      descKey: 'weapons.trait.dnd5e.heavyDesc',      takesValue: false },
        { key: 'dnd5e.light',      nameKey: 'weapons.trait.dnd5e.light',      descKey: 'weapons.trait.dnd5e.lightDesc',      takesValue: false },
        { key: 'dnd5e.loading',    nameKey: 'weapons.trait.dnd5e.loading',    descKey: 'weapons.trait.dnd5e.loadingDesc',    takesValue: false },
        { key: 'dnd5e.reach',      nameKey: 'weapons.trait.dnd5e.reach',      descKey: 'weapons.trait.dnd5e.reachDesc',      takesValue: false },
        { key: 'dnd5e.special',    nameKey: 'weapons.trait.dnd5e.special',    descKey: 'weapons.trait.dnd5e.specialDesc',    takesValue: false },
        { key: 'dnd5e.thrown',     nameKey: 'weapons.trait.dnd5e.thrown',     descKey: 'weapons.trait.dnd5e.thrownDesc',     takesValue: true  },
        { key: 'dnd5e.twoHanded',  nameKey: 'weapons.trait.dnd5e.twoHanded',  descKey: 'weapons.trait.dnd5e.twoHandedDesc',  takesValue: false },
        { key: 'dnd5e.versatile',  nameKey: 'weapons.trait.dnd5e.versatile',  descKey: 'weapons.trait.dnd5e.versatileDesc',  takesValue: true  },
    ];

    var DND5E_TRAITS_BY_NORMALIZED_NAME = (function () {
        var map = new Map();
        var aliases = {
            'dnd5e.ammunition': ['ammunition'],
            'dnd5e.finesse':    ['finesse'],
            'dnd5e.heavy':      ['heavy'],
            'dnd5e.light':      ['light'],
            'dnd5e.loading':    ['loading'],
            'dnd5e.reach':      ['reach'],
            'dnd5e.special':    ['special'],
            'dnd5e.thrown':     ['thrown'],
            'dnd5e.twoHanded':  ['two-handed', 'two handed', 'twohanded'],
            'dnd5e.versatile':  ['versatile'],
        };
        WEAPON_TRAITS_DND5E.forEach(function (entry) {
            (aliases[entry.key] || []).forEach(function (alias) { map.set(alias, entry); });
        });
        return map;
    })();

    // ── Weapon Trait Definitions (Pathfinder 2e) ──
    var WEAPON_TRAITS_PF2E = [
        { key: 'pf2e.agile',      nameKey: 'weapons.trait.pf2e.agile',      descKey: 'weapons.trait.pf2e.agileDesc',      takesValue: false },
        { key: 'pf2e.deadly',     nameKey: 'weapons.trait.pf2e.deadly',     descKey: 'weapons.trait.pf2e.deadlyDesc',     takesValue: true  },
        { key: 'pf2e.fatal',      nameKey: 'weapons.trait.pf2e.fatal',      descKey: 'weapons.trait.pf2e.fatalDesc',      takesValue: true  },
        { key: 'pf2e.finesse',    nameKey: 'weapons.trait.pf2e.finesse',    descKey: 'weapons.trait.pf2e.finesseDesc',    takesValue: false },
        { key: 'pf2e.forceful',   nameKey: 'weapons.trait.pf2e.forceful',   descKey: 'weapons.trait.pf2e.forcefulDesc',   takesValue: false },
        { key: 'pf2e.propulsive', nameKey: 'weapons.trait.pf2e.propulsive', descKey: 'weapons.trait.pf2e.propulsiveDesc', takesValue: false },
        { key: 'pf2e.reach',      nameKey: 'weapons.trait.pf2e.reach',      descKey: 'weapons.trait.pf2e.reachDesc',      takesValue: false },
        { key: 'pf2e.sweep',      nameKey: 'weapons.trait.pf2e.sweep',      descKey: 'weapons.trait.pf2e.sweepDesc',      takesValue: false },
        { key: 'pf2e.thrown',     nameKey: 'weapons.trait.pf2e.thrown',     descKey: 'weapons.trait.pf2e.thrownDesc',     takesValue: true  },
        { key: 'pf2e.twoHand',    nameKey: 'weapons.trait.pf2e.twoHand',    descKey: 'weapons.trait.pf2e.twoHandDesc',    takesValue: true  },
        { key: 'pf2e.versatile',  nameKey: 'weapons.trait.pf2e.versatile',  descKey: 'weapons.trait.pf2e.versatileDesc',  takesValue: true  },
    ];

    var PF2E_TRAITS_BY_NORMALIZED_NAME = (function () {
        var map = new Map();
        var aliases = {
            'pf2e.agile':      ['agile'],
            'pf2e.deadly':     ['deadly'],
            'pf2e.fatal':      ['fatal'],
            'pf2e.finesse':    ['finesse'],
            'pf2e.forceful':   ['forceful'],
            'pf2e.propulsive': ['propulsive'],
            'pf2e.reach':      ['reach'],
            'pf2e.sweep':      ['sweep'],
            'pf2e.thrown':     ['thrown'],
            'pf2e.twoHand':    ['two-hand', 'two hand', 'twohand'],
            'pf2e.versatile':  ['versatile'],
        };
        WEAPON_TRAITS_PF2E.forEach(function (entry) {
            (aliases[entry.key] || []).forEach(function (alias) { map.set(alias, entry); });
        });
        return map;
    })();

    // ── Weapon Trait Definitions (Daggerheart) ──
    var WEAPON_TRAITS_DAGGERHEART = [
        { key: 'daggerheart.powerful',  nameKey: 'weapons.trait.daggerheart.powerful',  descKey: 'weapons.trait.daggerheart.powerfulDesc',  takesValue: false },
        { key: 'daggerheart.returning', nameKey: 'weapons.trait.daggerheart.returning', descKey: 'weapons.trait.daggerheart.returningDesc', takesValue: false },
    ];

    var DAGGERHEART_TRAITS_BY_NORMALIZED_NAME = (function () {
        var map = new Map();
        var aliases = {
            'daggerheart.powerful':  ['powerful'],
            'daggerheart.returning': ['returning'],
        };
        WEAPON_TRAITS_DAGGERHEART.forEach(function (entry) {
            (aliases[entry.key] || []).forEach(function (alias) { map.set(alias, entry); });
        });
        return map;
    })();

    function getSystemTraitCatalog() {
        var sys = window.gameSystem || 'custom';
        if (sys === 'pf2e') return WEAPON_TRAITS_PF2E;
        if (sys === 'daggerheart') return WEAPON_TRAITS_DAGGERHEART;
        if (sys === 'dnd5e' || sys === 'custom') return WEAPON_TRAITS_DND5E;
        return [];
    }

    function getNormalizedTraitMap() {
        var sys = window.gameSystem || 'custom';
        if (sys === 'pf2e') return PF2E_TRAITS_BY_NORMALIZED_NAME;
        if (sys === 'daggerheart') return DAGGERHEART_TRAITS_BY_NORMALIZED_NAME;
        return DND5E_TRAITS_BY_NORMALIZED_NAME;
    }

    // ── Weapon Trait Pure Helpers ──
    function generateCustomTraitKey(content) {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var existing = new Set((content.customWeaponTraits || []).map(function (ct) { return ct.key; }));
        var key;
        do {
            var suffix = '';
            for (var i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
            key = 'custom.wt_' + suffix;
        } while (existing.has(key));
        return key;
    }

    function findOrCreateCustomTrait(rawName, content) {
        if (!Array.isArray(content.customWeaponTraits)) content.customWeaponTraits = [];
        var normalized = rawName.trim().toLowerCase();
        var existing = content.customWeaponTraits.find(function (ct) { return ct.name.trim().toLowerCase() === normalized; });
        if (existing) return existing.key;
        var key = generateCustomTraitKey(content);
        content.customWeaponTraits.push({ key: key, name: rawName.trim(), description: '' });
        return key;
    }

    function normalizeWeaponTraits(traits, content) {
        if (!traits) return [];
        if (!Array.isArray(content.customWeaponTraits)) content.customWeaponTraits = [];
        var result = [];
        var seen = new Set();
        traits.forEach(function (entry) {
            var key;
            if (entry && typeof entry === 'object' && typeof entry.key === 'string') {
                key = entry.key;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push({ key: key, value: entry.value !== undefined ? entry.value : null });
                }
                return;
            }
            if (typeof entry === 'string') {
                var trimmed = entry.trim();
                if (!trimmed) return;
                var traitNormMap = getNormalizedTraitMap();
                var match = traitNormMap.get(trimmed.toLowerCase());
                key = match ? match.key : findOrCreateCustomTrait(trimmed, content);
                if (!seen.has(key)) { seen.add(key); result.push({ key: key, value: null }); }
            }
        });
        return result;
    }

    function resolveWeaponTrait(traitEntry, content) {
        var key = traitEntry && traitEntry.key;
        if (!key) return { key: '', name: '', description: '', takesValue: false, isCustom: false };
        if (key.indexOf('dnd5e.') === 0) {
            var dnd5eEntry = WEAPON_TRAITS_DND5E.find(function (e) { return e.key === key; });
            if (dnd5eEntry) {
                return { key: key, name: t(dnd5eEntry.nameKey), description: t(dnd5eEntry.descKey), takesValue: dnd5eEntry.takesValue, isCustom: false };
            }
        }
        if (key.indexOf('pf2e.') === 0) {
            var pf2eEntry = WEAPON_TRAITS_PF2E.find(function (e) { return e.key === key; });
            if (pf2eEntry) {
                return { key: key, name: t(pf2eEntry.nameKey), description: t(pf2eEntry.descKey), takesValue: pf2eEntry.takesValue, isCustom: false };
            }
        }
        if (key.indexOf('daggerheart.') === 0) {
            var dhEntry = WEAPON_TRAITS_DAGGERHEART.find(function (e) { return e.key === key; });
            if (dhEntry) {
                return { key: key, name: t(dhEntry.nameKey), description: t(dhEntry.descKey), takesValue: dhEntry.takesValue, isCustom: false };
            }
        }
        if (key.indexOf('custom.') === 0) {
            var customTraits = content && Array.isArray(content.customWeaponTraits) ? content.customWeaponTraits : [];
            var custom = customTraits.find(function (e) { return e.key === key; });
            if (custom) return { key: key, name: custom.name, description: custom.description || '', takesValue: false, isCustom: true };
        }
        return { key: key, name: key, description: '', takesValue: false, isCustom: false };
    }

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
        if (!Array.isArray(data.content.customWeaponTraits)) data.content.customWeaponTraits = [];
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
            w.traits = normalizeWeaponTraits(Array.isArray(w.traits) ? w.traits : [], data.content);
            if (typeof w.notesMarkdown !== 'string') w.notesMarkdown = '';
            if (typeof w.twoHanded !== 'boolean') w.twoHanded = false;
            if (w.acBonus === undefined) w.acBonus = null;
            if (w.shieldHp === undefined) w.shieldHp = null;
            if (w.shieldHpMax === undefined) w.shieldHpMax = null;
            // Phase 2 fields — null defaults, all optional
            if (w.proficiencyRank === undefined) w.proficiencyRank = null;
            if (w.skillName === undefined) w.skillName = null;
            if (w.skillValue === undefined) w.skillValue = null;
            if (w.poolAttribute === undefined) w.poolAttribute = null;
            if (w.poolSkill === undefined) w.poolSkill = null;
            if (w.poolSize === undefined) w.poolSize = null;
            if (w.weaponCategory === undefined) w.weaponCategory = null;
            if (w.cpredStat === undefined) w.cpredStat = null;
            if (w.cpredSkillValue === undefined) w.cpredSkillValue = null;
            if (w.governingTrait === undefined) w.governingTrait = null;
            if (w.baseDamageFlat === undefined) w.baseDamageFlat = null;
            if (w.damageCategory === undefined) w.damageCategory = null;
            if (w.firingModes === undefined) w.firingModes = null;
            if (w.impaling === undefined) w.impaling = null;
            if (w.armorSavePenalty === undefined) w.armorSavePenalty = null;
        });
        return data.content;
    }

    // ── Attack Bonus Computation ──
    function weaponsComputeAttackBonus(weapon) {
        if (weapon.attackBonusOverride !== null && weapon.attackBonusOverride !== undefined) {
            return Number(weapon.attackBonusOverride);
        }

        var sys = window.gameSystem || 'custom';

        if (sys === 'dnd5e' || sys === 'custom') {
            var abilityMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
            var profBonus = weapon.proficient && typeof window.getProficiencyBonus === 'function' ? window.getProficiencyBonus() : 0;
            return abilityMod + profBonus;
        }

        if (sys === 'pf2e') {
            var abilityMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.abilityMod) : 0;
            var charLevel = typeof window.getCharacterLevel === 'function' ? window.getCharacterLevel() : 1;
            var rankBonusMap = { untrained: 0, trained: 2, expert: 4, master: 6, legendary: 8 };
            var rankBonus = rankBonusMap[weapon.proficiencyRank] || 0;
            var profBonus = weapon.proficiencyRank && weapon.proficiencyRank !== 'untrained' ? rankBonus + charLevel : 0;
            return abilityMod + profBonus;
        }

        if (sys === 'daggerheart') {
            var traitMod = typeof window.getAbilityModifier === 'function' ? window.getAbilityModifier(weapon.governingTrait) : 0;
            return traitMod;
        }

        // Tracking tier systems — no auto-computation
        return null;
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
            if (bonus !== null) {
                bonusEl.textContent = formatBonus(bonus);
            } else {
                var cardSys = window.gameSystem || 'custom';
                if (cardSys === 'coc' || cardSys === 'mothership') {
                    bonusEl.textContent = (weapon.skillValue || 0) + '%';
                } else if (cardSys === 'vtm' || cardSys === 'sr6') {
                    bonusEl.textContent = (weapon.poolSize || 0) + 'd';
                } else if (cardSys === 'cpred') {
                    bonusEl.textContent = '+' + (weapon.cpredSkillValue || 0);
                }
            }
            if (weapon.attackBonusOverride !== null) {
                bonusEl.setAttribute('data-tooltip', t('weapons.overrideIndicator'));
            }
            nameRow.appendChild(bonusEl);
        }
        info.appendChild(nameRow);

        if (weapon.kind !== 'shield') {
            var dmgText = '';
            if ((window.gameSystem || 'custom') === 'sr6' && weapon.baseDamageFlat !== null && weapon.baseDamageFlat !== undefined) {
                dmgText = weapon.baseDamageFlat + (weapon.damageCategory === 'Stun' ? 'S' : 'P');
            } else {
                dmgText = weaponsFormatDamageSummary(weapon);
            }
            if (dmgText) {
                var dmgEl = document.createElement('div');
                dmgEl.className = 'weapon-damage-summary';
                dmgEl.textContent = dmgText;
                info.appendChild(dmgEl);
            }
        }

        if (weapon.traits && weapon.traits.length) {
            var traitsEl = document.createElement('div');
            traitsEl.className = 'weapon-traits';
            weapon.traits.forEach(function (entry) {
                var resolved = resolveWeaponTrait(entry, data.content);
                var chip = document.createElement('span');
                chip.className = 'weapon-trait-chip';
                chip.textContent = resolved.name;
                if (resolved.description) {
                    chip.addEventListener('mouseenter', function () { showChipTooltip(chip, resolved.description); });
                    chip.addEventListener('mouseleave', hideChipTooltip);
                }
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

    // ── System Edit Config ──
    var SYSTEM_EDIT_CONFIG = {
        dnd5e:       { abilityMod: true,  proficient: true,  profRank: false, skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        pf2e:        { abilityMod: true,  proficient: false, profRank: true,  skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        coc:         { abilityMod: false, proficient: false, profRank: false, skillField: true,  poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: true,  armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        vtm:         { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: true,  weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        cpred:       { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: false, weaponCat: true,  firingModes: true,  governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        mothership:  { abilityMod: false, proficient: false, profRank: false, skillField: true,  poolField: false, weaponCat: false, firingModes: false, governingTrait: false, attackOverride: false, damageInstances: true,  traits: false, impaling: false, armorSavePen: true,  baseDmgFlat: false, dmgCategory: false },
        sr6:         { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: true,  weaponCat: false, firingModes: true,  governingTrait: false, attackOverride: false, damageInstances: false, traits: false, impaling: false, armorSavePen: false, baseDmgFlat: true,  dmgCategory: true  },
        daggerheart: { abilityMod: false, proficient: false, profRank: false, skillField: false, poolField: false, weaponCat: false, firingModes: false, governingTrait: true,  attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
        custom:      { abilityMod: true,  proficient: true,  profRank: false, skillField: true,  poolField: true,  weaponCat: false, firingModes: false, governingTrait: false, attackOverride: true,  damageInstances: true,  traits: true,  impaling: false, armorSavePen: false, baseDmgFlat: false, dmgCategory: false },
    };

    // ── Edit Modal Section Builders ──
    function buildProficiencyRankSection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';
        var field = buildField(t('weapons.proficiencyRank'));
        var sel = buildCvSelect(
            [
                { value: 'untrained', label: t('weapons.rank.untrained') },
                { value: 'trained',   label: t('weapons.rank.trained')   },
                { value: 'expert',    label: t('weapons.rank.expert')    },
                { value: 'master',    label: t('weapons.rank.master')    },
                { value: 'legendary', label: t('weapons.rank.legendary') },
            ],
            workingWeapon.proficiencyRank || 'untrained',
            function (v) { workingWeapon.proficiencyRank = v; onDirty(); }
        );
        field.appendChild(sel.el);
        row.appendChild(field);
        section.appendChild(row);
        return section;
    }

    function buildSkillSection(workingWeapon, sys, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';

        var nameLabel = sys === 'mothership' ? t('weapons.combatStat') : t('weapons.skillName');
        var nameField = buildField(nameLabel);
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cv-input';
        nameInput.value = workingWeapon.skillName || '';
        nameInput.placeholder = nameLabel;
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', function () { workingWeapon.skillName = nameInput.value.trim() || null; onDirty(); });
        nameField.appendChild(nameInput);
        row.appendChild(nameField);

        var valField = buildField(t('weapons.skillValue'));
        var valInput = document.createElement('input');
        valInput.type = 'number';
        valInput.className = 'cv-input';
        valInput.min = '0';
        valInput.max = '100';
        valInput.value = workingWeapon.skillValue !== null ? workingWeapon.skillValue : '';
        valInput.placeholder = '0';
        valInput.addEventListener('input', function () {
            var v = parseInt(valInput.value, 10);
            workingWeapon.skillValue = isNaN(v) ? null : Math.min(100, Math.max(0, v));
            onDirty();
        });
        valField.appendChild(valInput);
        row.appendChild(valField);

        section.appendChild(row);
        return section;
    }

    function buildPoolSection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';

        var attrField = buildField(t('weapons.poolAttribute'));
        var attrInput = document.createElement('input');
        attrInput.type = 'text';
        attrInput.className = 'cv-input';
        attrInput.value = workingWeapon.poolAttribute || '';
        attrInput.placeholder = t('weapons.poolAttribute');
        attrInput.spellcheck = false;
        attrInput.autocomplete = 'off';
        attrInput.addEventListener('input', function () { workingWeapon.poolAttribute = attrInput.value.trim() || null; onDirty(); });
        attrField.appendChild(attrInput);
        row.appendChild(attrField);

        var skillField = buildField(t('weapons.poolSkill'));
        var skillInput = document.createElement('input');
        skillInput.type = 'text';
        skillInput.className = 'cv-input';
        skillInput.value = workingWeapon.poolSkill || '';
        skillInput.placeholder = t('weapons.poolSkill');
        skillInput.spellcheck = false;
        skillInput.autocomplete = 'off';
        skillInput.addEventListener('input', function () { workingWeapon.poolSkill = skillInput.value.trim() || null; onDirty(); });
        skillField.appendChild(skillInput);
        row.appendChild(skillField);

        var sizeField = buildField(t('weapons.poolSize'));
        var sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.className = 'cv-input';
        sizeInput.min = '0';
        sizeInput.value = workingWeapon.poolSize !== null ? workingWeapon.poolSize : '';
        sizeInput.placeholder = '0';
        sizeInput.addEventListener('input', function () {
            var v = parseInt(sizeInput.value, 10);
            workingWeapon.poolSize = isNaN(v) ? null : Math.max(0, v);
            onDirty();
        });
        sizeField.appendChild(sizeInput);
        row.appendChild(sizeField);

        section.appendChild(row);
        return section;
    }

    function buildWeaponCategorySection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';

        var catField = buildField(t('weapons.weaponCategory'));
        var catSel = buildCvSelect(
            [
                { value: 'handgun',      label: 'Handgun'       },
                { value: 'shoulderArms', label: 'Shoulder Arms' },
                { value: 'archery',      label: 'Archery'       },
                { value: 'heavyWeapons', label: 'Heavy Weapons' },
                { value: 'autofire',     label: 'Autofire'      },
                { value: 'martialArts',  label: 'Martial Arts'  },
            ],
            workingWeapon.weaponCategory || 'handgun',
            function (v) { workingWeapon.weaponCategory = v; onDirty(); }
        );
        catField.appendChild(catSel.el);
        row.appendChild(catField);

        var statField = buildField(t('weapons.cpredStat'));
        var statInput = document.createElement('input');
        statInput.type = 'text';
        statInput.className = 'cv-input';
        statInput.value = workingWeapon.cpredStat || '';
        statInput.placeholder = 'REF';
        statInput.spellcheck = false;
        statInput.autocomplete = 'off';
        statInput.addEventListener('input', function () { workingWeapon.cpredStat = statInput.value.trim() || null; onDirty(); });
        statField.appendChild(statInput);
        row.appendChild(statField);

        var skillField = buildField(t('weapons.cpredSkill'));
        var skillInput = document.createElement('input');
        skillInput.type = 'number';
        skillInput.className = 'cv-input';
        skillInput.min = '0';
        skillInput.max = '10';
        skillInput.value = workingWeapon.cpredSkillValue !== null ? workingWeapon.cpredSkillValue : '';
        skillInput.placeholder = '0';
        skillInput.addEventListener('input', function () {
            var v = parseInt(skillInput.value, 10);
            workingWeapon.cpredSkillValue = isNaN(v) ? null : Math.max(0, v);
            onDirty();
        });
        skillField.appendChild(skillInput);
        row.appendChild(skillField);

        section.appendChild(row);
        return section;
    }

    function buildGoverningTraitSection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';
        var field = buildField(t('weapons.governingTrait'));
        var sel = buildCvSelect(
            [
                { value: 'agility',   label: 'Agility'   },
                { value: 'strength',  label: 'Strength'  },
                { value: 'finesse',   label: 'Finesse'   },
                { value: 'instinct',  label: 'Instinct'  },
                { value: 'presence',  label: 'Presence'  },
                { value: 'knowledge', label: 'Knowledge' },
            ],
            workingWeapon.governingTrait || 'agility',
            function (v) { workingWeapon.governingTrait = v; onDirty(); }
        );
        field.appendChild(sel.el);
        row.appendChild(field);
        section.appendChild(row);
        return section;
    }

    function buildFiringModesSection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section weapon-firing-modes-section';

        var sectionLabel = document.createElement('div');
        sectionLabel.className = 'weapon-edit-section-label';
        sectionLabel.textContent = t('weapons.firingModes');
        section.appendChild(sectionLabel);

        if (!Array.isArray(workingWeapon.firingModes)) workingWeapon.firingModes = [];

        var modeList = document.createElement('div');
        modeList.className = 'weapon-firing-mode-list';
        section.appendChild(modeList);

        function renderModeRows() {
            modeList.innerHTML = '';
            workingWeapon.firingModes.forEach(function (mode, idx) {
                var row = document.createElement('div');
                row.className = 'weapon-firing-mode-row';

                var nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'cv-input weapon-mode-name';
                nameInput.value = mode.name || '';
                nameInput.placeholder = t('weapons.modeName');
                nameInput.spellcheck = false;
                (function (i) { nameInput.addEventListener('input', function () { workingWeapon.firingModes[i].name = nameInput.value.trim(); onDirty(); }); })(idx);
                row.appendChild(nameInput);

                var ammoCostInput = document.createElement('input');
                ammoCostInput.type = 'number';
                ammoCostInput.className = 'cv-input weapon-mode-ammo';
                ammoCostInput.value = mode.ammoCost !== undefined ? mode.ammoCost : 1;
                ammoCostInput.min = '0';
                ammoCostInput.placeholder = t('weapons.ammoCost');
                (function (i) { ammoCostInput.addEventListener('input', function () { workingWeapon.firingModes[i].ammoCost = parseInt(ammoCostInput.value, 10) || 0; onDirty(); }); })(idx);
                row.appendChild(ammoCostInput);

                var diceModInput = document.createElement('input');
                diceModInput.type = 'number';
                diceModInput.className = 'cv-input weapon-mode-dice';
                diceModInput.value = mode.diceModifier !== null && mode.diceModifier !== undefined ? mode.diceModifier : '';
                diceModInput.placeholder = t('weapons.diceModifier');
                (function (i) { diceModInput.addEventListener('input', function () {
                    var v = parseInt(diceModInput.value, 10);
                    workingWeapon.firingModes[i].diceModifier = isNaN(v) ? null : v;
                    onDirty();
                }); })(idx);
                row.appendChild(diceModInput);

                var dmgBonusInput = document.createElement('input');
                dmgBonusInput.type = 'number';
                dmgBonusInput.className = 'cv-input weapon-mode-dmg';
                dmgBonusInput.value = mode.damageBonus !== null && mode.damageBonus !== undefined ? mode.damageBonus : '';
                dmgBonusInput.placeholder = t('weapons.damageBonus');
                (function (i) { dmgBonusInput.addEventListener('input', function () {
                    var v = parseInt(dmgBonusInput.value, 10);
                    workingWeapon.firingModes[i].damageBonus = isNaN(v) ? null : v;
                    onDirty();
                }); })(idx);
                row.appendChild(dmgBonusInput);

                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-secondary sm weapon-mode-remove';
                removeBtn.textContent = t('weapons.removeDamage');
                (function (i) { removeBtn.addEventListener('click', function () { workingWeapon.firingModes.splice(i, 1); onDirty(); renderModeRows(); }); })(idx);
                row.appendChild(removeBtn);

                modeList.appendChild(row);
            });
        }
        renderModeRows();

        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-secondary sm weapon-mode-add';
        addBtn.textContent = t('weapons.addFiringMode');
        addBtn.addEventListener('click', function () {
            workingWeapon.firingModes.push({ name: '', ammoCost: 1, diceModifier: null, damageBonus: null });
            onDirty();
            renderModeRows();
        });
        section.appendChild(addBtn);
        return section;
    }

    function buildBaseDmgSection(workingWeapon, onDirty) {
        var section = document.createElement('div');
        section.className = 'weapon-edit-section';
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';

        var flatField = buildField(t('weapons.baseDamageFlat'));
        var flatInput = document.createElement('input');
        flatInput.type = 'number';
        flatInput.className = 'cv-input';
        flatInput.min = '0';
        flatInput.value = workingWeapon.baseDamageFlat !== null ? workingWeapon.baseDamageFlat : '';
        flatInput.placeholder = '0';
        flatInput.addEventListener('input', function () {
            var v = parseInt(flatInput.value, 10);
            workingWeapon.baseDamageFlat = isNaN(v) ? null : Math.max(0, v);
            onDirty();
        });
        flatField.appendChild(flatInput);
        row.appendChild(flatField);

        var catField = buildField(t('weapons.damageCategory'));
        var catSel = buildCvSelect(
            [
                { value: 'Physical', label: t('weapons.damagePhysical') },
                { value: 'Stun',     label: t('weapons.damageStun')     },
            ],
            workingWeapon.damageCategory || 'Physical',
            function (v) { workingWeapon.damageCategory = v; onDirty(); }
        );
        catField.appendChild(catSel.el);
        row.appendChild(catField);

        section.appendChild(row);
        return section;
    }

    function buildImpalingRow(workingWeapon, onDirty) {
        var row = document.createElement('div');
        row.className = 'weapon-edit-row weapon-edit-row--paired';
        var field = buildField(t('weapons.impaling'));
        var toggle = makeCvToggle(!!workingWeapon.impaling, function (checked) { workingWeapon.impaling = checked; onDirty(); });
        var lbl = document.createElement('span');
        lbl.className = 'cv-toggle-label';
        lbl.textContent = t('weapons.impaling');
        toggle.appendChild(lbl);
        field.appendChild(toggle);
        row.appendChild(field);
        return row;
    }

    function buildArmorSavePenRow(workingWeapon, onDirty) {
        var row = document.createElement('div');
        row.className = 'weapon-edit-row';
        var field = buildField(t('weapons.armorSavePenalty'));
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'cv-input';
        input.value = workingWeapon.armorSavePenalty !== null ? workingWeapon.armorSavePenalty : '';
        input.placeholder = '0';
        input.addEventListener('input', function () {
            var v = parseInt(input.value, 10);
            workingWeapon.armorSavePenalty = isNaN(v) ? null : v;
            onDirty();
        });
        field.appendChild(input);
        row.appendChild(field);
        return row;
    }

    function getAttackArchetype(sys) {
        if (sys === 'coc' || sys === 'mothership') return 'B';
        if (sys === 'vtm' || sys === 'sr6') return 'C';
        return 'A';
    }

    // ── Action Modal (Play Mode) ──
    function openWeaponActionModal(moduleEl, data, weapon) {
        var existing = document.querySelector('.weapon-action-overlay');
        if (existing) existing.remove();

        var sys = window.gameSystem || 'custom';
        var archetype = getAttackArchetype(sys);

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

        function makeRollBtn(label, rollExpr, eventType, logKey, logReplacements) {
            var btn = document.createElement('button');
            btn.className = 'btn-primary weapon-action-btn';
            btn.textContent = label;
            btn.addEventListener('click', function () {
                if (typeof TS === 'undefined') return;
                var rollPromise = TS.dice.putDiceInTray([{ name: weapon.name || t('weapons.unnamed'), roll: rollExpr }]);
                if (typeof window.logActivity === 'function') {
                    var logEntryId = window.logActivity({
                        type: eventType,
                        message: t(logKey, logReplacements),
                        sourceModuleId: data.id,
                    });
                    rollPromise.then(function (rollId) { if (rollId) window.pendingRolls[rollId] = { logEntryId: logEntryId }; });
                }
            });
            return btn;
        }

        function makeRefText(text) {
            var el = document.createElement('div');
            el.className = 'weapon-action-ref';
            el.textContent = text;
            return el;
        }

        if (weapon.kind !== 'shield') {
            var attackCol = document.createElement('div');
            attackCol.className = 'weapon-action-col';
            var attackColLabel = document.createElement('div');
            attackColLabel.className = 'weapon-action-col-label';
            attackColLabel.textContent = t('weapons.attack');
            attackCol.appendChild(attackColLabel);

            if (archetype === 'A') {
                var bonus = weaponsComputeAttackBonus(weapon);
                if (sys === 'pf2e') {
                    var isAgile = weapon.traits && weapon.traits.some(function (tr) { return tr.key === 'pf2e.agile'; });
                    var map2 = isAgile ? -4 : -5;
                    var map3 = isAgile ? -8 : -10;
                    var expr1 = '1d20' + formatBonus(bonus);
                    var expr2 = '1d20' + formatBonus(bonus + map2);
                    var expr3 = '1d20' + formatBonus(bonus + map3);
                    attackCol.appendChild(makeRollBtn(t('weapons.attackFirst') + ' (' + expr1 + ')', expr1, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: expr1 }));
                    attackCol.appendChild(makeRollBtn(t('weapons.attackSecond') + ' (' + expr2 + ')', expr2, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: expr2 }));
                    attackCol.appendChild(makeRollBtn(t('weapons.attackThird') + ' (' + expr3 + ')', expr3, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: expr3 }));
                } else if (sys === 'daggerheart') {
                    var rollExpr = '2d12' + formatBonus(bonus);
                    attackCol.appendChild(makeRollBtn(t('weapons.attack') + ' (' + rollExpr + ')', rollExpr, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: rollExpr }));
                } else if (sys === 'cpred') {
                    var cpredVal = Number(weapon.cpredSkillValue) || 0;
                    var cpredModes = Array.isArray(weapon.firingModes) && weapon.firingModes.length ? weapon.firingModes : null;
                    if (cpredModes) {
                        cpredModes.forEach(function (mode) {
                            var modeBonus = cpredVal + (Number(mode.diceModifier) || 0);
                            var modeExpr = '1d10' + formatBonus(modeBonus);
                            var modeLabel = (mode.name ? mode.name + ' ' : '') + '(' + modeExpr + ')';
                            attackCol.appendChild(makeRollBtn(modeLabel, modeExpr, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: modeExpr }));
                        });
                    } else {
                        var rollExpr = '1d10' + formatBonus(cpredVal);
                        attackCol.appendChild(makeRollBtn(t('weapons.rollAttack') + ' (' + rollExpr + ')', rollExpr, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: rollExpr }));
                    }
                    attackCol.appendChild(makeRefText(t('weapons.vsDV')));
                } else {
                    var rollExpr = '1d20' + formatBonus(bonus);
                    attackCol.appendChild(makeRollBtn(t('weapons.attack') + ' (' + rollExpr + ')', rollExpr, 'weapons.event.roll', 'weapons.log.attack', { name: weapon.name || t('weapons.unnamed'), roll: rollExpr }));
                }
            } else if (archetype === 'B') {
                var skillVal = Number(weapon.skillValue) || 0;
                var skillName = weapon.skillName || '';
                attackCol.appendChild(makeRollBtn(t('weapons.rollAttack') + ' (1d100)', '1d100', 'weapons.event.percentileRoll', 'weapons.log.percentileRoll', { name: weapon.name || t('weapons.unnamed'), roll: '1d100', skill: skillVal }));
                if (skillName || skillVal) {
                    attackCol.appendChild(makeRefText(skillName + ': ' + skillVal + '%'));
                }
                if (sys === 'coc') {
                    attackCol.appendChild(makeRefText(t('weapons.cocHard') + ': ' + Math.floor(skillVal / 2) + '% | ' + t('weapons.cocExtreme') + ': ' + Math.floor(skillVal / 5) + '%'));
                }
                if (sys === 'mothership' && weapon.armorSavePenalty) {
                    attackCol.appendChild(makeRefText(t('weapons.armorSavePenalty') + ': ' + weapon.armorSavePenalty));
                }
            } else if (archetype === 'C') {
                var poolSize = Number(weapon.poolSize) || 0;
                var dieType = sys === 'sr6' ? 'd6' : 'd10';
                var poolModes = sys === 'sr6' && Array.isArray(weapon.firingModes) && weapon.firingModes.length ? weapon.firingModes : null;
                if (poolModes) {
                    poolModes.forEach(function (mode) {
                        var modePool = poolSize + (Number(mode.diceModifier) || 0);
                        var modeExpr = modePool + dieType;
                        var modeLabel = (mode.name ? mode.name + ' ' : '') + '(' + modeExpr + ')';
                        attackCol.appendChild(makeRollBtn(modeLabel, modeExpr, 'weapons.event.poolRoll', 'weapons.log.poolRoll', { name: weapon.name || t('weapons.unnamed'), roll: modeExpr }));
                    });
                } else {
                    var poolExpr = poolSize + dieType;
                    attackCol.appendChild(makeRollBtn(t('weapons.rollPool') + ' (' + poolExpr + ')', poolExpr, 'weapons.event.poolRoll', 'weapons.log.poolRoll', { name: weapon.name || t('weapons.unnamed'), roll: poolExpr }));
                }
                if (weapon.poolAttribute || weapon.poolSkill) {
                    attackCol.appendChild(makeRefText((weapon.poolAttribute || '') + (weapon.poolAttribute && weapon.poolSkill ? ' + ' : '') + (weapon.poolSkill || '')));
                }
                attackCol.appendChild(makeRefText(sys === 'sr6' ? t('weapons.sr6HitOn') : t('weapons.vtmSuccessOn')));
            }

            colWrap.appendChild(attackCol);
        }

        if (sys === 'sr6') {
            var flatDmg = weapon.baseDamageFlat;
            var dmgCat = weapon.damageCategory === 'Stun' ? 'S' : 'P';
            if (flatDmg !== null && flatDmg !== undefined) {
                var damageCol = document.createElement('div');
                damageCol.className = 'weapon-action-col';
                var dmgColLabel = document.createElement('div');
                dmgColLabel.className = 'weapon-action-col-label';
                dmgColLabel.textContent = t('weapons.damage');
                damageCol.appendChild(dmgColLabel);
                var dmgFlatEl = document.createElement('div');
                dmgFlatEl.className = 'weapon-action-ref weapon-action-ref--large';
                dmgFlatEl.textContent = flatDmg + dmgCat;
                damageCol.appendChild(dmgFlatEl);
                colWrap.appendChild(damageCol);
            }
        } else if (weapon.damageInstances && weapon.damageInstances.length) {
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
        workingWeapon.traits = weapon.traits.map(function (tr) { return Object.assign({}, tr); });
        workingWeapon.firingModes = Array.isArray(weapon.firingModes) ? weapon.firingModes.map(function (m) { return Object.assign({}, m); }) : null;
        var dirty = false;
        var sys = window.gameSystem || 'custom';
        var cfg = SYSTEM_EDIT_CONFIG[sys] || SYSTEM_EDIT_CONFIG['custom'];

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
        rowAbility.className = 'weapon-edit-row weapon-edit-row--paired';

        var abilityField = buildField(t('weapons.abilityMod'));
        var abilitySel = buildCvSelect(
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(function (k) { return { value: k, label: k.toUpperCase() }; }),
            workingWeapon.abilityMod,
            function (v) { workingWeapon.abilityMod = v; dirty = true; }
        );
        abilityField.appendChild(abilitySel.el);
        rowAbility.appendChild(abilityField);

        var profField = buildField(t('weapons.proficient'));
        var profToggle = makeCvToggle(workingWeapon.proficient, function (checked) { workingWeapon.proficient = checked; dirty = true; });
        var profLabel = document.createElement('span');
        profLabel.className = 'cv-toggle-label';
        profLabel.textContent = t('weapons.proficient');
        profToggle.appendChild(profLabel);
        profField.appendChild(profToggle);
        rowAbility.appendChild(profField);
        modalBody.appendChild(rowAbility);

        // Attack Bonus Override + Two-Handed
        var rowOverride = document.createElement('div');
        rowOverride.className = 'weapon-edit-row weapon-edit-row--paired';

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
        var twoHandedToggle = makeCvToggle(workingWeapon.twoHanded, function (checked) { workingWeapon.twoHanded = checked; dirty = true; });
        var twoHandedLabel = document.createElement('span');
        twoHandedLabel.className = 'cv-toggle-label';
        twoHandedLabel.textContent = t('weapons.twoHanded');
        twoHandedToggle.appendChild(twoHandedLabel);
        twoHandedField.appendChild(twoHandedToggle);
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

                var modToggle = makeCvToggle(inst.modFromAbility, (function (i) { return function (checked) { workingWeapon.damageInstances[i].modFromAbility = checked; dirty = true; }; })(idx));
                var modSpan = document.createElement('span');
                modSpan.className = 'cv-toggle-label';
                modSpan.textContent = t('weapons.modFromAbility');
                modToggle.appendChild(modSpan);
                row.appendChild(modToggle);

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
        var traitsField = document.createElement('div');
        traitsField.className = 'weapon-traits-edit-row weapon-edit-field';

        var traitsLabel = document.createElement('label');
        traitsLabel.className = 'weapon-edit-label';
        traitsLabel.textContent = t('weapons.traits');
        traitsField.appendChild(traitsLabel);

        var traitsChipsWrapper = document.createElement('div');
        traitsChipsWrapper.className = 'weapon-traits-chips';
        traitsField.appendChild(traitsChipsWrapper);

        var traitAddBtn = document.createElement('button');
        traitAddBtn.type = 'button';
        traitAddBtn.className = 'weapon-trait-add-btn';
        traitAddBtn.textContent = t('weapons.traitPicker.addBtn');
        traitsField.appendChild(traitAddBtn);

        function renderWeaponTraitsChips() {
            traitsChipsWrapper.innerHTML = '';
            workingWeapon.traits.forEach(function (entry, idx) {
                var resolved = resolveWeaponTrait(entry, data.content);
                var chip = document.createElement('span');
                chip.className = 'weapon-trait-chip weapon-trait-chip--editable';
                if (resolved.description) {
                    chip.addEventListener('mouseenter', function () { showChipTooltip(chip, resolved.description); });
                    chip.addEventListener('mouseleave', hideChipTooltip);
                }
                var nameSpan = document.createElement('span');
                nameSpan.textContent = resolved.name;
                chip.appendChild(nameSpan);
                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'weapon-trait-chip-remove';
                removeBtn.setAttribute('aria-label', t('weapons.traitPicker.removeChipAria'));
                removeBtn.textContent = '\xd7';
                (function (i) {
                    removeBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        workingWeapon.traits.splice(i, 1);
                        dirty = true;
                        renderWeaponTraitsChips();
                    });
                })(idx);
                chip.appendChild(removeBtn);
                traitsChipsWrapper.appendChild(chip);
            });
        }
        renderWeaponTraitsChips();

        traitAddBtn.addEventListener('click', function () {
            openWeaponTraitPickerModal(workingWeapon, data.content, function () {
                dirty = true;
                renderWeaponTraitsChips();
            });
        });

        // ── Notes ──
        var notesField = buildField(t('weapons.notes'));
        var notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'cv-input weapon-edit-notes';
        notesTextarea.value = workingWeapon.notesMarkdown || '';
        notesTextarea.rows = 3;
        notesTextarea.spellcheck = false;
        notesTextarea.addEventListener('input', function () { workingWeapon.notesMarkdown = notesTextarea.value; dirty = true; });
        notesField.appendChild(notesTextarea);

        // ── System-specific sections ──
        var onDirty = function () { dirty = true; };
        var profRankSection     = buildProficiencyRankSection(workingWeapon, onDirty);
        var skillSection        = buildSkillSection(workingWeapon, sys, onDirty);
        var poolSection         = buildPoolSection(workingWeapon, onDirty);
        var weaponCatSection    = buildWeaponCategorySection(workingWeapon, onDirty);
        var governingTraitSection = buildGoverningTraitSection(workingWeapon, onDirty);
        var firingModesSection  = buildFiringModesSection(workingWeapon, onDirty);
        var baseDmgSection      = buildBaseDmgSection(workingWeapon, onDirty);
        var impalingRow         = buildImpalingRow(workingWeapon, onDirty);
        var armorSavePenRow     = buildArmorSavePenRow(workingWeapon, onDirty);

        // Append sections in order
        modalBody.appendChild(profRankSection);
        modalBody.appendChild(skillSection);
        modalBody.appendChild(poolSection);
        modalBody.appendChild(weaponCatSection);
        modalBody.appendChild(governingTraitSection);
        modalBody.appendChild(firingModesSection);
        modalBody.appendChild(baseDmgSection);
        modalBody.appendChild(impalingRow);
        modalBody.appendChild(armorSavePenRow);
        modalBody.appendChild(rangedSection);
        modalBody.appendChild(shieldSection);
        modalBody.appendChild(damageSection);
        modalBody.appendChild(traitsField);
        modalBody.appendChild(notesField);

        function updateConditionalSections() {
            var k = workingWeapon.kind;
            rangedSection.style.display    = k === 'ranged' ? '' : 'none';
            shieldSection.style.display    = k === 'shield' ? '' : 'none';
            rowAbility.style.display       = (cfg.abilityMod || cfg.proficient) ? '' : 'none';
            abilityField.style.display     = cfg.abilityMod ? '' : 'none';
            profField.style.display        = cfg.proficient ? '' : 'none';
            rowOverride.style.display      = cfg.attackOverride ? '' : 'none';
            profRankSection.style.display  = cfg.profRank ? '' : 'none';
            skillSection.style.display     = cfg.skillField ? '' : 'none';
            poolSection.style.display      = cfg.poolField ? '' : 'none';
            weaponCatSection.style.display = cfg.weaponCat ? '' : 'none';
            governingTraitSection.style.display = cfg.governingTrait ? '' : 'none';
            firingModesSection.style.display    = cfg.firingModes ? '' : 'none';
            baseDmgSection.style.display   = (cfg.baseDmgFlat || cfg.dmgCategory) ? '' : 'none';
            impalingRow.style.display      = cfg.impaling ? '' : 'none';
            armorSavePenRow.style.display  = cfg.armorSavePen ? '' : 'none';
            damageSection.style.display    = cfg.damageInstances ? '' : 'none';
            traitsField.style.display      = cfg.traits ? '' : 'none';
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

    // ── Weapon Trait Picker Modal ──
    function openWeaponTraitPickerModal(workingWeapon, content, onChange) {
        var existing = document.querySelector('.weapon-trait-picker-overlay');
        if (existing) existing.remove();

        var localTraits = workingWeapon.traits.map(function (tr) { return Object.assign({}, tr); });
        var dirty = false;

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay weapon-trait-picker-overlay';

        var dialog = document.createElement('div');
        dialog.className = 'cv-modal-panel weapon-trait-picker-dialog';

        var header = document.createElement('div');
        header.className = 'cv-modal-header';
        var titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('weapons.traitPicker.title');
        header.appendChild(titleEl);
        var closeBtn = document.createElement('button');
        closeBtn.className = 'cv-modal-close';
        closeBtn.title = t('weapons.close');
        closeBtn.innerHTML = CV_SVG_CLOSE;
        header.appendChild(closeBtn);

        var body = document.createElement('div');
        body.className = 'cv-modal-body weapon-trait-picker-body';

        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'cv-input weapon-trait-picker-search';
        searchInput.placeholder = t('weapons.traitPicker.searchPlaceholder');
        searchInput.spellcheck = false;
        body.appendChild(searchInput);

        var list = document.createElement('div');
        list.className = 'weapon-trait-picker-list';
        body.appendChild(list);

        var tooltipEl = document.createElement('div');
        tooltipEl.className = 'weapon-trait-picker-tooltip';

        var _parentRect = null;

        function showTooltip(infoBtn, text) {
            tooltipEl.textContent = text;
            var iconRect = infoBtn.getBoundingClientRect();
            var top;
            if (iconRect.top + iconRect.height / 2 < _parentRect.top + _parentRect.height / 2) {
                top = iconRect.bottom - _parentRect.top + 6;
            } else {
                top = iconRect.top - _parentRect.top - 66;
            }
            var left = iconRect.left - _parentRect.left - 8;
            tooltipEl.style.top = Math.max(4, top) + 'px';
            tooltipEl.style.left = Math.max(8, Math.min(left, _parentRect.width - 232)) + 'px';
            tooltipEl.classList.add('is-visible');
        }

        function hideTooltip() {
            tooltipEl.classList.remove('is-visible');
        }

        function createInfoButton(description) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'weapon-trait-picker-row-info';
            btn.setAttribute('aria-label', t('weapons.traitPicker.infoAria'));
            btn.textContent = '\u24d8';
            btn.addEventListener('mouseenter', function () { showTooltip(btn, description); });
            btn.addEventListener('mouseleave', hideTooltip);
            btn.addEventListener('click', function (e) { e.stopPropagation(); });
            return btn;
        }

        function isSelected(key) {
            return localTraits.some(function (tr) { return tr.key === key; });
        }

        function toggleTrait(key) {
            var idx = localTraits.findIndex(function (tr) { return tr.key === key; });
            if (idx !== -1) {
                localTraits.splice(idx, 1);
            } else {
                localTraits.push({ key: key, value: null });
            }
            dirty = true;
            renderList();
        }

        function openCustomTraitInlineForm(anchorEl, existingTrait, isNew) {
            var oldForm = list.querySelector('.weapon-trait-inline-form');
            if (oldForm) oldForm.remove();

            var form = document.createElement('div');
            form.className = 'weapon-trait-inline-form';

            var nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'cv-input weapon-trait-inline-name';
            nameInput.placeholder = t('weapons.traitPicker.customName');
            nameInput.value = existingTrait ? existingTrait.name : '';
            nameInput.spellcheck = false;
            nameInput.autocomplete = 'off';

            var descInput = document.createElement('textarea');
            descInput.className = 'cv-input weapon-trait-inline-desc';
            descInput.placeholder = t('weapons.traitPicker.customDescription');
            descInput.value = existingTrait ? (existingTrait.description || '') : '';
            descInput.rows = 2;
            descInput.spellcheck = false;

            var formActions = document.createElement('div');
            formActions.className = 'weapon-trait-inline-actions';

            var formCancelBtn = document.createElement('button');
            formCancelBtn.type = 'button';
            formCancelBtn.className = 'btn-secondary sm';
            formCancelBtn.textContent = t('weapons.cancel');

            var formSaveBtn = document.createElement('button');
            formSaveBtn.type = 'button';
            formSaveBtn.className = 'btn-primary sm solid';
            formSaveBtn.textContent = t('weapons.save');

            formActions.appendChild(formCancelBtn);
            formActions.appendChild(formSaveBtn);
            form.appendChild(nameInput);
            form.appendChild(descInput);
            form.appendChild(formActions);

            anchorEl.parentNode.insertBefore(form, anchorEl.nextSibling);
            nameInput.focus();

            formSaveBtn.addEventListener('click', function () {
                var name = nameInput.value.trim();
                if (!name) { nameInput.focus(); return; }
                if (isNew) {
                    if (!Array.isArray(content.customWeaponTraits)) content.customWeaponTraits = [];
                    var newKey = generateCustomTraitKey(content);
                    content.customWeaponTraits.push({ key: newKey, name: name, description: descInput.value.trim() });
                    localTraits.push({ key: newKey, value: null });
                    dirty = true;
                } else {
                    existingTrait.name = name;
                    existingTrait.description = descInput.value.trim();
                }
                scheduleSave();
                renderList();
            });

            formCancelBtn.addEventListener('click', function () { renderList(); });
        }

        function renderList() {
            list.innerHTML = '';
            var query = searchInput.value.trim().toLowerCase();

            getSystemTraitCatalog().forEach(function (entry) {
                var name = t(entry.nameKey);
                if (query && name.toLowerCase().indexOf(query) === -1) return;
                var row = document.createElement('button');
                row.type = 'button';
                row.className = 'weapon-trait-picker-row' + (isSelected(entry.key) ? ' is-selected' : '');
                row.dataset.key = entry.key;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'weapon-trait-picker-row-name';
                nameSpan.textContent = name;
                row.appendChild(nameSpan);

                var desc = t(entry.descKey);
                if (desc) row.appendChild(createInfoButton(desc));

                var check = document.createElement('span');
                check.className = 'weapon-trait-picker-row-check';
                check.textContent = '\u2713';
                row.appendChild(check);

                row.addEventListener('click', function () { toggleTrait(entry.key); });
                list.appendChild(row);
            });

            var customTraits = Array.isArray(content.customWeaponTraits) ? content.customWeaponTraits : [];
            var filteredCustom = customTraits.filter(function (ct) {
                return !query || ct.name.toLowerCase().indexOf(query) !== -1;
            });

            if (filteredCustom.length > 0 || !query) {
                var sectionHeader = document.createElement('div');
                sectionHeader.className = 'weapon-trait-picker-section-header';
                sectionHeader.textContent = t('weapons.traitPicker.customHeader');
                list.appendChild(sectionHeader);
            }

            filteredCustom.forEach(function (ct) {
                var row = document.createElement('div');
                row.className = 'weapon-trait-picker-row weapon-trait-picker-row--custom' + (isSelected(ct.key) ? ' is-selected' : '');
                row.dataset.key = ct.key;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'weapon-trait-picker-row-name';
                nameSpan.textContent = ct.name;

                var infoBtn = ct.description ? createInfoButton(ct.description) : null;

                var editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'weapon-trait-picker-row-edit';
                editBtn.setAttribute('aria-label', t('weapons.editWeapon'));
                editBtn.textContent = '\u270e';

                var deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'weapon-trait-picker-row-delete';
                deleteBtn.setAttribute('aria-label', t('weapons.delete'));
                deleteBtn.textContent = '\xd7';

                var check = document.createElement('span');
                check.className = 'weapon-trait-picker-row-check';
                check.textContent = '\u2713';

                nameSpan.addEventListener('click', function () { toggleTrait(ct.key); });
                check.addEventListener('click', function () { toggleTrait(ct.key); });

                editBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openCustomTraitInlineForm(row, ct, false);
                });

                (function (key) {
                    deleteBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        var cidx = content.customWeaponTraits.findIndex(function (x) { return x.key === key; });
                        if (cidx !== -1) content.customWeaponTraits.splice(cidx, 1);
                        if (Array.isArray(content.weapons)) {
                            content.weapons.forEach(function (w) {
                                w.traits = w.traits.filter(function (tr) { return tr.key !== key; });
                            });
                        }
                        var ltIdx = localTraits.findIndex(function (tr) { return tr.key === key; });
                        if (ltIdx !== -1) localTraits.splice(ltIdx, 1);
                        scheduleSave();
                        renderList();
                    });
                })(ct.key);

                row.appendChild(nameSpan);
                if (infoBtn) row.appendChild(infoBtn);
                row.appendChild(editBtn);
                row.appendChild(deleteBtn);
                row.appendChild(check);
                list.appendChild(row);
            });

            if (!query) {
                var createBtn = document.createElement('button');
                createBtn.type = 'button';
                createBtn.className = 'weapon-trait-picker-create';
                createBtn.textContent = t('weapons.traitPicker.createCustom');
                createBtn.addEventListener('click', function () { openCustomTraitInlineForm(createBtn, null, true); });
                list.appendChild(createBtn);
            }
        }

        renderList();
        searchInput.addEventListener('input', function () { renderList(); });

        var footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        var footerRight = document.createElement('div');
        footerRight.className = 'cv-modal-footer-right';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('weapons.traitPicker.cancel');
        footerRight.appendChild(cancelBtn);

        var doneBtn = document.createElement('button');
        doneBtn.className = 'btn-primary sm solid';
        doneBtn.textContent = t('weapons.traitPicker.done');
        footerRight.appendChild(doneBtn);

        footer.appendChild(footerRight);
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        dialog.appendChild(tooltipEl);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        _parentRect = tooltipEl.offsetParent ? tooltipEl.offsetParent.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

        function forceClose() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        function close() {
            if (dirty && !window.confirm(t('weapons.traitPicker.confirmDiscard'))) return;
            forceClose();
        }

        doneBtn.addEventListener('click', function () {
            workingWeapon.traits = localTraits;
            onChange();
            forceClose();
        });
        cancelBtn.addEventListener('click', close);
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        var keyHandler = function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        document.addEventListener('keydown', keyHandler);
        searchInput.focus();
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
    window.WEAPON_TRAITS_DND5E       = WEAPON_TRAITS_DND5E;
    window.WEAPON_TRAITS_PF2E        = WEAPON_TRAITS_PF2E;
    window.WEAPON_TRAITS_DAGGERHEART = WEAPON_TRAITS_DAGGERHEART;
    window.getSystemTraitCatalog     = getSystemTraitCatalog;
    window.resolveWeaponTrait        = resolveWeaponTrait;
    window.normalizeWeaponTraits     = normalizeWeaponTraits;
    window.findOrCreateCustomTrait   = findOrCreateCustomTrait;
    window.generateCustomTraitKey    = generateCustomTraitKey;

    console.log('[CV] Weapons module registered');
})();
