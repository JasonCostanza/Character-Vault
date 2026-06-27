// ── Dice Variables ──
(function () {
    'use strict';

    var TOKEN_REGEX = /\$\{([^}]+)\}/g;
    var TOKEN_TEST = /\$\{[^}]+\}/;

    var TYPES = {
        'stat-mod':    1,
        'stat-val':    1,
        'ability-mod': 1,
        'save-mod':    1,
        'counter':     1,
        'defense':     1,
        'level':       1,
        'hp-cur':      1,
        'hp-max':      1,
        'prof':        1,
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

    function computeAbilityMod(ability, mod) {
        if (mod.content.linkedStatModuleId && ability.linkedStat) {
            var statMod = typeof window.getAbilityModifierFrom === 'function'
                ? window.getAbilityModifierFrom(ability.linkedStat, mod.content.linkedStatModuleId) : 0;
            return statMod + (ability.modifier || 0);
        }
        return ability.modifier || 0;
    }

    function findAbilityMod(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'abilities'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.abilities)) return null;
        var target = name.toLowerCase();
        var ability = mod.content.abilities.find(function (a) { return (a.name || '').toLowerCase() === target; });
        return ability ? computeAbilityMod(ability, mod) : null;
    }

    function computeSaveMod(save, mod) {
        if (mod.content.linkedStatModuleId && save.linkedStatName) {
            var statMod = typeof window.getAbilityModifierFrom === 'function'
                ? window.getAbilityModifierFrom(save.linkedStatName, mod.content.linkedStatModuleId) : 0;
            return statMod + (save.value || 0);
        }
        return save.value || 0;
    }

    function findSaveMod(name, moduleId) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === 'savingthrow'; });
        if (!mod || !mod.content || !Array.isArray(mod.content.saves)) return null;
        var target = name.toLowerCase();
        var save = mod.content.saves.find(function (s) { return (s.name || '').toLowerCase() === target; });
        return save ? computeSaveMod(save, mod) : null;
    }

    function findNamedItemValue(moduleId, modType, arrayKey, name) {
        var mod = (window.modules || []).find(function (m) { return m.id === moduleId && m.type === modType; });
        if (!mod || !mod.content || !Array.isArray(mod.content[arrayKey])) return null;
        var target = name.toLowerCase();
        var item = mod.content[arrayKey].find(function (i) { return (i.name || '').toLowerCase() === target; });
        return item ? (item.value || 0) : null;
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
                return findNamedItemValue(parsed.moduleId, 'counters', 'counters', parsed.name);
            }
            case 'defense': {
                if (!parsed.name || !parsed.moduleId) return null;
                return findNamedItemValue(parsed.moduleId, 'defenses', 'defenses', parsed.name);
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

    function applyTokens(expr, fallback, onMissing) {
        if (!expr || typeof expr !== 'string') return expr;
        var result = expr.replace(TOKEN_REGEX, function (match, inner) {
            var val = resolveToken(inner);
            if (val === null || val === undefined) {
                if (onMissing) onMissing(inner);
                return fallback;
            }
            return String(val);
        });
        return normalizeOperators(result);
    }

    function resolveDiceExpression(expr) {
        if (!hasDiceVariables(expr)) return expr;
        return applyTokens(expr, '0', showBrokenRefWarning);
    }

    function formatDiceExpressionDisplay(expr) {
        return applyTokens(expr, '??', null);
    }

    function getAllDiceVariables() {
        var items = [];
        var modules = window.modules || [];

        modules.forEach(function (m) {
            var moduleTitle = m.title || t('type.' + m.type);

            if (m.type === 'stat' && m.content && Array.isArray(m.content.stats)) {
                m.content.stats.forEach(function (stat) {
                    if (stat.isProficiencyStat) return;
                    var lc = stat.name.toLowerCase();
                    items.push({
                        token: 'stat-mod.' + stat.name + '.' + m.id,
                        display: stat.name + ' mod',
                        group: moduleTitle,
                        value: stat.modifier || 0,
                        searchText: lc,
                    });
                    items.push({
                        token: 'stat-val.' + stat.name + '.' + m.id,
                        display: stat.name,
                        group: moduleTitle,
                        value: stat.value || 0,
                        searchText: lc,
                    });
                });
            }

            if (m.type === 'abilities' && m.content && Array.isArray(m.content.abilities)) {
                m.content.abilities.forEach(function (ability) {
                    items.push({
                        token: 'ability-mod.' + ability.name + '.' + m.id,
                        display: ability.name,
                        group: moduleTitle,
                        value: computeAbilityMod(ability, m) || 0,
                        searchText: ability.name.toLowerCase(),
                    });
                });
            }

            if (m.type === 'savingthrow' && m.content && Array.isArray(m.content.saves)) {
                m.content.saves.forEach(function (save) {
                    items.push({
                        token: 'save-mod.' + save.name + '.' + m.id,
                        display: save.name + ' save',
                        group: moduleTitle,
                        value: computeSaveMod(save, m) || 0,
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

    // ── Autocomplete Picker ──

    var pickerEl = null;
    var activeInput = null;
    var pickerItems = [];
    var highlightIndex = -1;

    function getPickerEl() {
        if (pickerEl) return pickerEl;
        pickerEl = document.createElement('div');
        pickerEl.className = 'cv-var-picker';
        pickerEl.setAttribute('role', 'listbox');
        pickerEl.style.display = 'none';
        document.body.appendChild(pickerEl);
        pickerEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
        });
        return pickerEl;
    }

    function positionPicker(input) {
        var picker = getPickerEl();
        var rect = input.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.top = (rect.bottom + 2) + 'px';
        picker.style.left = rect.left + 'px';
        picker.style.minWidth = Math.max(rect.width, 200) + 'px';
        picker.style.maxWidth = '320px';
    }

    function closePicker() {
        var picker = getPickerEl();
        picker.style.display = 'none';
        picker.innerHTML = '';
        activeInput = null;
        pickerItems = [];
        highlightIndex = -1;
    }

    function isPickerOpen() {
        return pickerEl && pickerEl.style.display !== 'none';
    }

    function openPicker(input, filterText) {
        var picker = getPickerEl();
        var allVars = getAllDiceVariables();
        activeInput = input;

        var filter = (filterText || '').toLowerCase();
        var filtered = filter
            ? allVars.filter(function (v) { return v.searchText.indexOf(filter) !== -1 || v.display.toLowerCase().indexOf(filter) !== -1; })
            : allVars;

        picker.innerHTML = '';
        pickerItems = [];
        highlightIndex = 0;

        if (!filtered.length) {
            var empty = document.createElement('div');
            empty.className = 'cv-var-picker-empty';
            empty.textContent = allVars.length ? t('diceVar.pickerNoMatch') : t('diceVar.pickerEmpty');
            picker.appendChild(empty);
            picker.style.display = 'block';
            positionPicker(input);
            return;
        }

        // Group by module
        var groups = {};
        var groupOrder = [];
        filtered.forEach(function (v) {
            if (!groups[v.group]) {
                groups[v.group] = [];
                groupOrder.push(v.group);
            }
            groups[v.group].push(v);
        });

        groupOrder.forEach(function (groupName) {
            var header = document.createElement('div');
            header.className = 'cv-var-picker-group';
            header.textContent = groupName;
            picker.appendChild(header);

            groups[groupName].forEach(function (v) {
                var item = document.createElement('div');
                item.className = 'cv-var-picker-item';
                item.setAttribute('role', 'option');
                item.dataset.token = v.token;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'cv-var-picker-name';
                nameSpan.textContent = v.display;

                var valueSpan = document.createElement('span');
                valueSpan.className = 'cv-var-picker-value';
                valueSpan.textContent = v.value;

                item.appendChild(nameSpan);
                item.appendChild(valueSpan);

                item.addEventListener('click', function () {
                    insertToken(v.token);
                    closePicker();
                });

                picker.appendChild(item);
                pickerItems.push({ el: item, token: v.token });
            });
        });

        if (pickerItems.length) {
            pickerItems[0].el.classList.add('highlighted');
            highlightIndex = 0;
        }

        picker.style.display = 'block';
        positionPicker(input);
    }

    function insertToken(token) {
        if (!activeInput) return;
        var val = activeInput.value;
        var cursorPos = activeInput.selectionStart;

        // Find the `${` that triggered this picker
        var before = val.slice(0, cursorPos);
        var triggerIdx = before.lastIndexOf('${');
        if (triggerIdx === -1) return;

        var after = val.slice(cursorPos);
        var fullToken = '${' + token + '}';
        activeInput.value = val.slice(0, triggerIdx) + fullToken + after;

        var newCursor = triggerIdx + fullToken.length;
        activeInput.setSelectionRange(newCursor, newCursor);

        // Fire input event to trigger save handlers
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function moveHighlight(delta) {
        if (!pickerItems.length) return;
        if (highlightIndex >= 0 && highlightIndex < pickerItems.length) {
            pickerItems[highlightIndex].el.classList.remove('highlighted');
        }
        highlightIndex = (highlightIndex + delta + pickerItems.length) % pickerItems.length;
        pickerItems[highlightIndex].el.classList.add('highlighted');
        pickerItems[highlightIndex].el.scrollIntoView({ block: 'nearest' });
    }

    function handlePickerKeydown(e) {
        if (!isPickerOpen()) return false;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveHighlight(1);
            return true;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveHighlight(-1);
            return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            if (highlightIndex >= 0 && highlightIndex < pickerItems.length) {
                e.preventDefault();
                insertToken(pickerItems[highlightIndex].token);
                closePicker();
                return true;
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closePicker();
            return true;
        }
        return false;
    }

    function attachDiceVariablePicker(inputEl) {
        if (!inputEl || inputEl._cvVarPickerAttached) return;
        inputEl._cvVarPickerAttached = true;

        inputEl.addEventListener('input', function () {
            var val = inputEl.value;
            var cursorPos = inputEl.selectionStart;
            var before = val.slice(0, cursorPos);

            // Look for unclosed ${ before cursor
            var triggerIdx = before.lastIndexOf('${');
            if (triggerIdx === -1) {
                if (isPickerOpen()) closePicker();
                return;
            }

            // Check there's no } between trigger and cursor
            var segment = before.slice(triggerIdx + 2);
            if (segment.indexOf('}') !== -1) {
                if (isPickerOpen()) closePicker();
                return;
            }

            openPicker(inputEl, segment);
        });

        inputEl.addEventListener('keydown', function (e) {
            handlePickerKeydown(e);
        });

        inputEl.addEventListener('blur', function () {
            setTimeout(function () { closePicker(); }, 150);
        });
    }

    // ── Window Exports (pure/testable functions) ──
    window.hasDiceVariables = hasDiceVariables;
    window.resolveDiceExpression = resolveDiceExpression;
    window.resolveToken = resolveToken;
    window.formatDiceExpressionDisplay = formatDiceExpressionDisplay;
    window.getAllDiceVariables = getAllDiceVariables;
    window.propagateDiceVariableRename = propagateDiceVariableRename;
    window.attachDiceVariablePicker = attachDiceVariablePicker;
    // exported for tests only
    window._parseDiceVarToken = parseToken;
    window._normalizeOperators = normalizeOperators;
})();
