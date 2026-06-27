// ── Dice Variables ──
(function () {
    'use strict';

    var TOKEN_REGEX = /\$\{([^}]+)\}/g;
    var TOKEN_TEST = /\$\{[^}]+\}/;

    var TYPES = {
        'stat-mod':    { segments: 3 },
        'stat-val':    { segments: 3 },
        'ability-mod': { segments: 3 },
        'save-mod':    { segments: 3 },
        'counter':     { segments: 3 },
        'defense':     { segments: 3 },
        'level':       { segments: 2 },
        'hp-cur':      { segments: 2 },
        'hp-max':      { segments: 2 },
        'prof':        { segments: 1 },
    };

    function parseToken(inner) {
        var firstDot = inner.indexOf('.');
        if (firstDot === -1) {
            return { type: inner, name: null, moduleId: null };
        }
        var lastDot = inner.lastIndexOf('.');
        if (firstDot === lastDot) {
            return { type: inner.slice(0, firstDot), name: null, moduleId: inner.slice(firstDot + 1) };
        }
        return {
            type: inner.slice(0, firstDot),
            name: inner.slice(firstDot + 1, lastDot),
            moduleId: inner.slice(lastDot + 1),
        };
    }

    // ── Module-data lookup helpers ──

    function findAbilityMod(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'abilities'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.abilities)) return null;
        var target = name.toLowerCase();
        var ability = mod.content.abilities.find(function (a) { return (a.name || '').toLowerCase() === target; });
        if (!ability) return null;
        var baseMod = 0;
        if (mod.content.linkedStatModuleId && ability.linkedStat) {
            var statMod = typeof window.getAbilityModifierFrom === 'function'
                ? window.getAbilityModifierFrom(ability.linkedStat, mod.content.linkedStatModuleId) : 0;
            baseMod = statMod + (ability.modifier || 0);
        } else {
            baseMod = ability.modifier || 0;
        }
        return baseMod;
    }

    function findSaveMod(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'savingthrow'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.saves)) return null;
        var target = name.toLowerCase();
        var save = mod.content.saves.find(function (s) { return (s.name || '').toLowerCase() === target; });
        if (!save) return null;
        var baseMod = 0;
        if (mod.content.linkedStatModuleId && save.linkedStatName) {
            var statMod = typeof window.getAbilityModifierFrom === 'function'
                ? window.getAbilityModifierFrom(save.linkedStatName, mod.content.linkedStatModuleId) : 0;
            baseMod = statMod + (save.value || 0);
        } else {
            baseMod = save.value || 0;
        }
        return baseMod;
    }

    function findCounterValue(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'counters'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.counters)) return null;
        var target = name.toLowerCase();
        var counter = mod.content.counters.find(function (c) { return (c.name || '').toLowerCase() === target; });
        return counter ? (counter.value || 0) : null;
    }

    function findDefenseValue(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'defenses'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.defenses)) return null;
        var target = name.toLowerCase();
        var def = mod.content.defenses.find(function (d) { return (d.name || '').toLowerCase() === target; });
        return def ? (def.value || 0) : null;
    }

    function findHPValue(moduleId, which) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'health'; });
        if (!mod || !mod.content) return null;
        if (which === 'current') return mod.content.currentHP || 0;
        if (which === 'max') return (mod.content.maxHP || 0) + (mod.content.maxHPModifier || 0);
        return null;
    }

    // ── Resolution engine ──

    function resolveToken(inner) {
        var parsed = parseToken(inner);
        if (!TYPES[parsed.type]) return null;

        switch (parsed.type) {
            case 'stat-mod': {
                if (!parsed.name || !parsed.moduleId) return null;
                return typeof window.getAbilityModifierFrom === 'function'
                    ? window.getAbilityModifierFrom(parsed.name, parsed.moduleId)
                    : null;
            }
            case 'stat-val': {
                if (!parsed.name) return null;
                return typeof window.getStatValue === 'function'
                    ? window.getStatValue(parsed.name)
                    : null;
            }
            case 'ability-mod': {
                if (!parsed.name || !parsed.moduleId) return null;
                return findAbilityMod(parsed.name, parsed.moduleId);
            }
            case 'save-mod': {
                if (!parsed.name || !parsed.moduleId) return null;
                return findSaveMod(parsed.name, parsed.moduleId);
            }
            case 'counter': {
                if (!parsed.name || !parsed.moduleId) return null;
                return findCounterValue(parsed.name, parsed.moduleId);
            }
            case 'defense': {
                if (!parsed.name || !parsed.moduleId) return null;
                return findDefenseValue(parsed.name, parsed.moduleId);
            }
            case 'level': {
                if (!parsed.moduleId) return null;
                return typeof window.getCharacterLevel === 'function'
                    ? window.getCharacterLevel(parsed.moduleId)
                    : null;
            }
            case 'hp-cur': {
                if (!parsed.moduleId) return null;
                return findHPValue(parsed.moduleId, 'current');
            }
            case 'hp-max': {
                if (!parsed.moduleId) return null;
                return findHPValue(parsed.moduleId, 'max');
            }
            case 'prof': {
                return typeof window.getProficiencyBonus === 'function'
                    ? window.getProficiencyBonus()
                    : null;
            }
            default:
                return null;
        }
    }

    function hasDiceVariables(expr) {
        if (!expr || typeof expr !== 'string') return false;
        return TOKEN_TEST.test(expr);
    }

    function normalizeOperators(expr) {
        return expr
            .replace(/\+\-/g, '-')
            .replace(/\-\-/g, '+')
            .replace(/\+\+/g, '+')
            .replace(/[+\-]0$/, '');
    }

    function showBrokenRefWarning(inner) {
        if (typeof window.showToast === 'function') {
            var parsed = parseToken(inner);
            var name = parsed.name || parsed.type;
            window.showToast(t('diceVar.brokenRef', { name: name }), 'warning');
        }
    }

    function resolveDiceExpression(expr) {
        if (!expr || typeof expr !== 'string') return expr;
        var result = expr.replace(TOKEN_REGEX, function (match, inner) {
            var val = resolveToken(inner);
            if (val === null || val === undefined) {
                showBrokenRefWarning(inner);
                return '0';
            }
            return String(val);
        });
        TOKEN_REGEX.lastIndex = 0;
        return normalizeOperators(result);
    }

    function formatDiceExpressionDisplay(expr) {
        if (!expr || typeof expr !== 'string') return expr;
        var result = expr.replace(TOKEN_REGEX, function (match, inner) {
            var val = resolveToken(inner);
            if (val === null || val === undefined) return '??';
            return String(val);
        });
        TOKEN_REGEX.lastIndex = 0;
        return normalizeOperators(result);
    }

    function getAllDiceVariables() {
        var items = [];
        var modules = window.modules || [];

        modules.forEach(function (m) {
            var moduleTitle = m.title || t('type.' + m.type);

            if (m.type === 'stat' && m.content && Array.isArray(m.content.stats)) {
                m.content.stats.forEach(function (stat) {
                    if (stat.isProficiencyStat) return;
                    items.push({
                        token: 'stat-mod.' + stat.name + '.' + m.id,
                        display: stat.name + ' mod',
                        group: moduleTitle,
                        value: stat.modifier || 0,
                        searchText: stat.name.toLowerCase(),
                    });
                    items.push({
                        token: 'stat-val.' + stat.name + '.' + m.id,
                        display: stat.name,
                        group: moduleTitle,
                        value: stat.value || 0,
                        searchText: stat.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'abilities' && m.content && Array.isArray(m.content.abilities)) {
                m.content.abilities.forEach(function (ability) {
                    var mod = findAbilityMod(ability.name, m.id);
                    items.push({
                        token: 'ability-mod.' + ability.name + '.' + m.id,
                        display: ability.name,
                        group: moduleTitle,
                        value: mod || 0,
                        searchText: ability.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'savingthrow' && m.content && Array.isArray(m.content.saves)) {
                m.content.saves.forEach(function (save) {
                    var mod = findSaveMod(save.name, m.id);
                    items.push({
                        token: 'save-mod.' + save.name + '.' + m.id,
                        display: save.name + ' save',
                        group: moduleTitle,
                        value: mod || 0,
                        searchText: save.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'counters' && m.content && Array.isArray(m.content.counters)) {
                m.content.counters.forEach(function (counter) {
                    items.push({
                        token: 'counter.' + counter.name + '.' + m.id,
                        display: counter.name,
                        group: moduleTitle,
                        value: counter.value || 0,
                        searchText: counter.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'defenses' && m.content && Array.isArray(m.content.defenses)) {
                m.content.defenses.forEach(function (def) {
                    items.push({
                        token: 'defense.' + def.name + '.' + m.id,
                        display: def.name,
                        group: moduleTitle,
                        value: def.value || 0,
                        searchText: def.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'level' && m.content) {
                items.push({
                    token: 'level.' + m.id,
                    display: t('diceVar.level'),
                    group: moduleTitle,
                    value: m.content.level || 1,
                    searchText: 'level',
                });
            }

            if (m.type === 'health' && m.content) {
                items.push({
                    token: 'hp-cur.' + m.id,
                    display: t('diceVar.currentHP'),
                    group: moduleTitle,
                    value: m.content.currentHP || 0,
                    searchText: 'current hp',
                });
                items.push({
                    token: 'hp-max.' + m.id,
                    display: t('diceVar.maxHP'),
                    group: moduleTitle,
                    value: (m.content.maxHP || 0) + (m.content.maxHPModifier || 0),
                    searchText: 'max hp',
                });
            }
        });

        if (typeof window.getProficiencyBonus === 'function') {
            items.push({
                token: 'prof',
                display: t('diceVar.prof'),
                group: t('diceVar.groupGlobal'),
                value: window.getProficiencyBonus(),
                searchText: 'proficiency prof',
            });
        }

        return items;
    }

    function propagateDiceVariableRename(moduleId, type, oldName, newName) {
        var oldToken = '${' + type + '.' + oldName + '.' + moduleId + '}';
        var newToken = '${' + type + '.' + newName + '.' + moduleId + '}';
        var modules = window.modules || [];

        modules.forEach(function (m) {
            if (m.type === 'weapons' && m.content && Array.isArray(m.content.weapons)) {
                m.content.weapons.forEach(function (weapon) {
                    if (weapon.damageInstances && Array.isArray(weapon.damageInstances)) {
                        weapon.damageInstances.forEach(function (inst) {
                            if (inst.dice && inst.dice.indexOf(oldToken) !== -1) {
                                inst.dice = inst.dice.split(oldToken).join(newToken);
                            }
                        });
                    }
                });
            }
            if (m.type === 'spells' && m.content && Array.isArray(m.content.categories)) {
                m.content.categories.forEach(function (cat) {
                    (cat.spells || []).forEach(function (spell) {
                        if (spell.values) {
                            Object.keys(spell.values).forEach(function (key) {
                                var val = spell.values[key];
                                if (typeof val === 'string' && val.indexOf(oldToken) !== -1) {
                                    spell.values[key] = val.split(oldToken).join(newToken);
                                }
                            });
                        }
                    });
                });
            }
        });
    }

    // ── Window Exports (pure/testable functions) ──
    window.hasDiceVariables = hasDiceVariables;
    window.resolveDiceExpression = resolveDiceExpression;
    window.resolveToken = resolveToken;
    window.formatDiceExpressionDisplay = formatDiceExpressionDisplay;
    window.getAllDiceVariables = getAllDiceVariables;
    window.propagateDiceVariableRename = propagateDiceVariableRename;
    // exported for tests only
    window._parseDiceVarToken = parseToken;
    window._normalizeOperators = normalizeOperators;
})();
