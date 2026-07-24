import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

globalThis.scheduleSave = vi.fn();
globalThis.modules = [];
globalThis.gameSystem = 'custom';

beforeEach(() => {
    setupMinimalDOM();
    globalThis.modules = [];
    globalThis.scheduleSave.mockClear();
    globalThis.gameSystem = 'custom';

    loadScript('scripts/translations-en.js');
    loadScript('scripts/icons.js');
    loadScript('scripts/shared.js');
    loadScript('scripts/i18n.js');
    loadScript('scripts/module-core.js');
    loadScript('scripts/module-defenses.js');
});

// ── generateDefenseId ──

describe('generateDefenseId', () => {
    it('returns a string starting with def_', () => {
        const id = window.generateDefenseId();
        expect(id).toMatch(/^def_/);
    });

    it('generates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 50; i++) ids.add(window.generateDefenseId());
        expect(ids.size).toBe(50);
    });
});

// ── generateQDId ──

describe('generateQDId', () => {
    it('returns a string starting with qd_', () => {
        const id = window.generateQDId();
        expect(id).toMatch(/^qd_/);
    });

    it('generates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 50; i++) ids.add(window.generateQDId());
        expect(ids.size).toBe(50);
    });
});

// ── ensureDefenseContent ──

describe('ensureDefenseContent', () => {
    it('initializes empty data with defaults', () => {
        const data = { content: null };
        const content = window.ensureDefenseContent(data);
        expect(Array.isArray(content.defenses)).toBe(true);
        expect(Array.isArray(content.quickDefenses)).toBe(true);
        expect(content.defenses.length).toBeGreaterThan(0);
    });

    it('preserves existing valid content', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_test', name: 'AC', value: 15, icon: 'shield', showSign: false }],
                quickDefenses: [{ id: 'qd_test', name: 'Shield', icon: null, modifier: 2, active: true }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].value).toBe(15);
        expect(content.quickDefenses).toHaveLength(1);
        expect(content.quickDefenses[0].active).toBe(true);
    });

    it('adds missing quickDefenses array', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10, icon: null, showSign: false }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(Array.isArray(content.quickDefenses)).toBe(true);
    });

    it('strips notes field from old-format defenses', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10, icon: null, showSign: false, notes: 'old notes' }],
                quickDefenses: [],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses[0].notes).toBeUndefined();
    });

    it('fills missing defense fields with defaults', () => {
        const data = {
            content: {
                defenses: [{ id: 'def_1', name: 'AC', value: 10 }],
                quickDefenses: [],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.defenses[0].showSign).toBe(false);
        expect(content.defenses[0].icon).toBeNull();
    });

    it('fills missing QD fields with defaults', () => {
        const data = {
            content: {
                defenses: [],
                quickDefenses: [{ id: 'qd_1', name: 'Test', modifier: 1 }],
            },
        };
        const content = window.ensureDefenseContent(data);
        expect(content.quickDefenses[0].active).toBe(false);
        expect(content.quickDefenses[0].icon).toBeNull();
    });
});

// ── buildDefensesDefaultContent ──

describe('buildDefensesDefaultContent', () => {
    it('returns AC for dnd5e', () => {
        const content = window.buildDefensesDefaultContent('dnd5e');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.defenses[0].value).toBe(10);
        expect(content.defenses[0].icon).toBe('shield');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC for custom', () => {
        const content = window.buildDefensesDefaultContent('custom');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC + Raise Shield QD for pf2e', () => {
        const content = window.buildDefensesDefaultContent('pf2e');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.quickDefenses).toHaveLength(1);
        expect(content.quickDefenses[0].name).toBe('Raise Shield');
        expect(content.quickDefenses[0].modifier).toBe(2);
    });

    it('returns 3 defenses for dnd3.5e', () => {
        const content = window.buildDefensesDefaultContent('dnd3.5e');
        expect(content.defenses).toHaveLength(3);
        expect(content.defenses[0].name).toBe('AC');
        expect(content.defenses[1].name).toBe('Touch AC');
        expect(content.defenses[2].name).toBe('Flat-Footed AC');
        expect(content.quickDefenses).toHaveLength(0);
    });

    it('returns AC for unknown systems', () => {
        const content = window.buildDefensesDefaultContent('vtm');
        expect(content.defenses).toHaveLength(1);
        expect(content.defenses[0].name).toBe('AC');
    });
});

// ── computeSpotlightValue ──

describe('computeSpotlightValue', () => {
    it('returns base value when no QDs active', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [{ id: 'qd_1', name: 'Shield', modifier: 2, active: false }],
        };
        expect(window.computeSpotlightValue(content)).toBe(15);
    });

    it('adds active QD modifiers to base', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [
                { id: 'qd_1', name: 'Shield', modifier: 2, active: true },
                { id: 'qd_2', name: 'Cover', modifier: 2, active: true },
            ],
        };
        expect(window.computeSpotlightValue(content)).toBe(19);
    });

    it('handles negative modifiers', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [{ id: 'qd_1', name: 'Debuff', modifier: -3, active: true }],
        };
        expect(window.computeSpotlightValue(content)).toBe(12);
    });

    it('ignores inactive QDs', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 15, icon: null, showSign: false }],
            quickDefenses: [
                { id: 'qd_1', name: 'Shield', modifier: 2, active: false },
                { id: 'qd_2', name: 'Cover', modifier: 5, active: true },
            ],
        };
        expect(window.computeSpotlightValue(content)).toBe(20);
    });

    it('returns 0 when no defenses exist', () => {
        const content = { defenses: [], quickDefenses: [] };
        expect(window.computeSpotlightValue(content)).toBe(0);
    });

    it('handles empty QD array', () => {
        const content = {
            defenses: [{ id: 'def_1', name: 'AC', value: 18, icon: null, showSign: false }],
            quickDefenses: [],
        };
        expect(window.computeSpotlightValue(content)).toBe(18);
    });
});
