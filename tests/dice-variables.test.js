import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

globalThis.scheduleSave = vi.fn();
globalThis.modules = [];
globalThis.gameSystem = 'dnd5e';
globalThis.isPlayMode = false;

beforeEach(() => {
    setupMinimalDOM();
    globalThis.modules = [];
    vi.clearAllMocks();

    loadScript('scripts/translations-en.js');
    loadScript('scripts/shared.js');
    loadScript('scripts/i18n.js');
    loadScript('scripts/dice-variables.js');

    // shared.js overwrites window.showToast — re-mock after scripts load
    globalThis.showToast = vi.fn();
});

// ── _parseDiceVarToken ──

describe('_parseDiceVarToken', () => {
    it('parses 3-segment token', () => {
        expect(window._parseDiceVarToken('stat-mod.STR.module-001')).toEqual({
            type: 'stat-mod', name: 'STR', moduleId: 'module-001',
        });
    });

    it('parses 3-segment token with dots in name', () => {
        expect(window._parseDiceVarToken('stat-mod.Dr. Strange.module-001')).toEqual({
            type: 'stat-mod', name: 'Dr. Strange', moduleId: 'module-001',
        });
    });

    it('parses 2-segment token', () => {
        expect(window._parseDiceVarToken('level.module-001')).toEqual({
            type: 'level', name: null, moduleId: 'module-001',
        });
    });

    it('parses 1-segment token', () => {
        expect(window._parseDiceVarToken('prof')).toEqual({
            type: 'prof', name: null, moduleId: null,
        });
    });
});

// ── hasDiceVariables ──

describe('hasDiceVariables', () => {
    it('returns true for expression with token', () => {
        expect(window.hasDiceVariables('1d20+${stat-mod.STR.m1}')).toBe(true);
    });

    it('returns false for plain dice', () => {
        expect(window.hasDiceVariables('2d6+3')).toBe(false);
    });

    it('returns false for null', () => {
        expect(window.hasDiceVariables(null)).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(window.hasDiceVariables('')).toBe(false);
    });
});

// ── resolveToken ──

describe('resolveToken', () => {
    it('resolves stat-mod via getAbilityModifierFrom', () => {
        window.getAbilityModifierFrom = vi.fn().mockReturnValue(3);
        expect(window.resolveToken('stat-mod.STR.module-001')).toBe(3);
        expect(window.getAbilityModifierFrom).toHaveBeenCalledWith('STR', 'module-001');
    });

    it('resolves stat-val via getStatValue', () => {
        window.getStatValue = vi.fn().mockReturnValue(16);
        expect(window.resolveToken('stat-val.STR.module-001')).toBe(16);
    });

    it('resolves prof via getProficiencyBonus', () => {
        window.getProficiencyBonus = vi.fn().mockReturnValue(3);
        expect(window.resolveToken('prof')).toBe(3);
    });

    it('resolves counter from module data', () => {
        window.modules = [{
            id: 'mod-c', type: 'counters',
            content: { counters: [{ name: 'Rage', value: 3 }] },
        }];
        expect(window.resolveToken('counter.Rage.mod-c')).toBe(3);
    });

    it('resolves defense from module data', () => {
        window.modules = [{
            id: 'mod-d', type: 'defenses',
            content: { defenses: [{ name: 'AC', value: 18 }] },
        }];
        expect(window.resolveToken('defense.AC.mod-d')).toBe(18);
    });

    it('resolves level from module data', () => {
        window.getCharacterLevel = vi.fn().mockReturnValue(5);
        expect(window.resolveToken('level.mod-l')).toBe(5);
    });

    it('resolves hp-cur from module data', () => {
        window.modules = [{
            id: 'mod-h', type: 'health',
            content: { currentHP: 24, maxHP: 30, maxHPModifier: 2 },
        }];
        expect(window.resolveToken('hp-cur.mod-h')).toBe(24);
    });

    it('resolves hp-max from module data (maxHP + maxHPModifier)', () => {
        window.modules = [{
            id: 'mod-h', type: 'health',
            content: { currentHP: 24, maxHP: 30, maxHPModifier: 2 },
        }];
        expect(window.resolveToken('hp-max.mod-h')).toBe(32);
    });

    it('returns null for unknown type', () => {
        expect(window.resolveToken('bogus.x.y')).toBeNull();
    });

    it('returns null for missing module', () => {
        window.modules = [];
        expect(window.resolveToken('counter.Rage.nonexistent')).toBeNull();
    });
});

// ── resolveDiceExpression ──

describe('resolveDiceExpression', () => {
    it('resolves tokens inline', () => {
        window.getProficiencyBonus = vi.fn().mockReturnValue(3);
        window.getAbilityModifierFrom = vi.fn().mockReturnValue(2);
        expect(window.resolveDiceExpression('1d20+${stat-mod.STR.m1}+${prof}'))
            .toBe('1d20+2+3');
    });

    it('resolves broken token to 0 with warning', () => {
        window.modules = [];
        const result = window.resolveDiceExpression('1d6+${counter.Rage.missing}');
        // normalizeOperators strips trailing +0, so 1d6+0 → 1d6
        expect(result).toBe('1d6');
        expect(window.showToast).toHaveBeenCalled();
    });

    it('normalizes +- when token resolves negative', () => {
        window.getAbilityModifierFrom = vi.fn().mockReturnValue(-2);
        expect(window.resolveDiceExpression('1d20+${stat-mod.STR.m1}'))
            .toBe('1d20-2');
    });

    it('passes through plain expressions unchanged', () => {
        expect(window.resolveDiceExpression('2d6+3')).toBe('2d6+3');
    });
});

// ── _normalizeOperators ──

describe('_normalizeOperators', () => {
    it('collapses +-', () => {
        expect(window._normalizeOperators('1d20+-3')).toBe('1d20-3');
    });

    it('collapses --', () => {
        expect(window._normalizeOperators('1d20--3')).toBe('1d20+3');
    });

    it('collapses ++', () => {
        expect(window._normalizeOperators('1d20++3')).toBe('1d20+3');
    });

    it('strips trailing +0', () => {
        expect(window._normalizeOperators('1d20+0')).toBe('1d20');
    });

    it('strips trailing -0', () => {
        expect(window._normalizeOperators('1d20-0')).toBe('1d20');
    });
});

// ── getAllDiceVariables ──

describe('getAllDiceVariables', () => {
    it('catalogs stat-mod and stat-val entries', () => {
        window.modules = [{
            id: 'mod-s', type: 'stat', title: 'Stats',
            content: { stats: [{ name: 'STR', value: 16, modifier: 3 }] },
        }];
        const vars = window.getAllDiceVariables();
        const tokens = vars.map((v) => v.token);
        expect(tokens).toContain('stat-mod.STR.mod-s');
        expect(tokens).toContain('stat-val.STR.mod-s');
    });

    it('catalogs proficiency as global', () => {
        window.getProficiencyBonus = vi.fn().mockReturnValue(2);
        window.modules = [];
        const vars = window.getAllDiceVariables();
        expect(vars.find((v) => v.token === 'prof')).toBeTruthy();
    });

    it('skips proficiency stats', () => {
        window.modules = [{
            id: 'mod-s', type: 'stat', title: 'Stats',
            content: { stats: [{ name: 'Proficiency', isProficiencyStat: true, value: 2, modifier: 0 }] },
        }];
        const vars = window.getAllDiceVariables();
        expect(vars.filter((v) => v.token.includes('Proficiency'))).toHaveLength(0);
    });
});

// ── propagateDiceVariableRename ──

describe('propagateDiceVariableRename', () => {
    it('renames tokens in weapon damage instances', () => {
        window.modules = [{
            id: 'mod-w', type: 'weapons',
            content: {
                weapons: [{
                    damageInstances: [{ dice: '1d6+${stat-mod.STR.mod-s}' }],
                }],
            },
        }];
        window.propagateDiceVariableRename('mod-s', 'stat-mod', 'STR', 'Strength');
        expect(window.modules[0].content.weapons[0].damageInstances[0].dice)
            .toBe('1d6+${stat-mod.Strength.mod-s}');
    });

    it('renames tokens in spell values', () => {
        window.modules = [{
            id: 'mod-sp', type: 'spells',
            content: {
                categories: [{
                    spells: [{
                        values: { a1: '${stat-mod.STR.mod-s}' },
                    }],
                }],
            },
        }];
        window.propagateDiceVariableRename('mod-s', 'stat-mod', 'STR', 'Strength');
        expect(window.modules[0].content.categories[0].spells[0].values.a1)
            .toBe('${stat-mod.Strength.mod-s}');
    });

    it('does nothing when no match', () => {
        window.modules = [{
            id: 'mod-w', type: 'weapons',
            content: { weapons: [{ damageInstances: [{ dice: '2d6+3' }] }] },
        }];
        window.propagateDiceVariableRename('mod-s', 'stat-mod', 'STR', 'Strength');
        expect(window.modules[0].content.weapons[0].damageInstances[0].dice).toBe('2d6+3');
    });
});

// ── propagateEntityRename ──

describe('propagateEntityRename', () => {
    it('renames all stat token types (stat-mod and stat-val) in one call', () => {
        window.modules = [{
            id: 'mod-w', type: 'weapons',
            content: {
                weapons: [{
                    damageInstances: [
                        { dice: '1d8+${stat-mod.STR.mod-s}' },
                        { dice: '${stat-val.STR.mod-s}' },
                    ],
                }],
            },
        }];
        window.propagateEntityRename('mod-s', 'stat', 'STR', 'Strength');
        const instances = window.modules[0].content.weapons[0].damageInstances;
        expect(instances[0].dice).toBe('1d8+${stat-mod.Strength.mod-s}');
        expect(instances[1].dice).toBe('${stat-val.Strength.mod-s}');
    });

    it('renames counter tokens via entityKind=counter', () => {
        window.modules = [{
            id: 'mod-sp', type: 'spells',
            content: {
                categories: [{
                    spells: [{ values: { a1: '${counter.Rage.mod-c}' } }],
                }],
            },
        }];
        window.propagateEntityRename('mod-c', 'counter', 'Rage', 'Fury');
        expect(window.modules[0].content.categories[0].spells[0].values.a1)
            .toBe('${counter.Fury.mod-c}');
    });

    it('does nothing when oldName equals newName', () => {
        window.modules = [{
            id: 'mod-w', type: 'weapons',
            content: { weapons: [{ damageInstances: [{ dice: '1d6+${stat-mod.STR.mod-s}' }] }] },
        }];
        window.propagateEntityRename('mod-s', 'stat', 'STR', 'STR');
        expect(window.modules[0].content.weapons[0].damageInstances[0].dice)
            .toBe('1d6+${stat-mod.STR.mod-s}');
    });

    it('does nothing for unknown entityKind', () => {
        window.modules = [{
            id: 'mod-w', type: 'weapons',
            content: { weapons: [{ damageInstances: [{ dice: '1d6+${bogus.X.mod-s}' }] }] },
        }];
        window.propagateEntityRename('mod-s', 'bogus', 'X', 'Y');
        expect(window.modules[0].content.weapons[0].damageInstances[0].dice)
            .toBe('1d6+${bogus.X.mod-s}');
    });
});
