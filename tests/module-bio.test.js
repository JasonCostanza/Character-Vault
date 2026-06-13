import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
    setupMinimalDOM();

    window.modules = [];
    globalThis.scheduleSave = vi.fn();
    globalThis.MODULE_TYPES = {};
    globalThis.registerModuleType = vi.fn();
    globalThis.t = (key) => key;
    globalThis.renderMarkdown = vi.fn((s) => s);
    globalThis.attachCheckboxHandlers = vi.fn();
    globalThis.escapeHtml = (s) => s;
    globalThis.gameSystem = 'custom';

    loadScript('scripts/module-bio.js');
});

describe('buildBioDefaultContent', () => {
    it('returns overview as active tab', () => {
        const c = buildBioDefaultContent();
        expect(c.activeTab).toBe('overview');
    });

    it('portrait defaults to null', () => {
        const c = buildBioDefaultContent();
        expect(c.portrait).toBeNull();
    });

    it('showPersonality defaults to false', () => {
        const c = buildBioDefaultContent();
        expect(c.showPersonality).toBe(false);
    });

    it('all string fields default to empty string', () => {
        const c = buildBioDefaultContent();
        const stringFields = [
            'name', 'pronouns', 'race', 'alignment',
            'age', 'height', 'weight', 'eyes', 'hair', 'skin',
            'appearance', 'biography',
            'personalityTraits', 'ideals', 'bonds', 'flaws',
            'deity', 'birthplace', 'nationality', 'ethnicity', 'alias',
            'likesDislikes', 'alliesEnemies', 'organizations',
            'backgroundName', 'heritage', 'edicts', 'anathemas',
            'occupation', 'ideologyBeliefs', 'culturalOrigin',
            'community', 'lifestyle',
            'clan', 'generation', 'sire', 'predatorType', 'ambition', 'desire',
        ];
        stringFields.forEach((field) => {
            expect(c[field]).toBe('');
        });
    });
});

describe('getRaceLabel', () => {
    it('returns bio.species for dnd5e', () => {
        expect(getRaceLabel('dnd5e')).toBe('bio.species');
    });

    it('returns bio.ancestry for pf2e', () => {
        expect(getRaceLabel('pf2e')).toBe('bio.ancestry');
    });

    it('returns bio.ancestry for daggerheart', () => {
        expect(getRaceLabel('daggerheart')).toBe('bio.ancestry');
    });

    it('returns bio.metatype for sr6', () => {
        expect(getRaceLabel('sr6')).toBe('bio.metatype');
    });

    it('returns bio.race for coc', () => {
        expect(getRaceLabel('coc')).toBe('bio.race');
    });

    it('returns bio.race for custom', () => {
        expect(getRaceLabel('custom')).toBe('bio.race');
    });

    it('returns bio.race for unknown system', () => {
        expect(getRaceLabel('unknown_system')).toBe('bio.race');
    });
});

describe('getSystemFields', () => {
    it('returns background field for dnd5e', () => {
        const result = getSystemFields('dnd5e');
        expect(result).not.toBeNull();
        expect(result.fields).toContain('backgroundName');
    });

    it('returns background + heritage + edicts + anathemas for pf2e', () => {
        const result = getSystemFields('pf2e');
        expect(result.fields).toEqual(['backgroundName', 'heritage', 'edicts', 'anathemas']);
    });

    it('returns all VtM fields for vtm', () => {
        const result = getSystemFields('vtm');
        expect(result.fields).toEqual(['clan', 'generation', 'sire', 'predatorType', 'ambition', 'desire']);
    });

    it('returns null for custom system', () => {
        expect(getSystemFields('custom')).toBeNull();
    });

    it('returns null for unknown system', () => {
        expect(getSystemFields('not_a_system')).toBeNull();
    });

    it('includes correct display name for coc', () => {
        const result = getSystemFields('coc');
        expect(result.name).toBe('Call of Cthulhu');
    });
});

describe('shouldShowBioField', () => {
    it('returns false for empty string', () => {
        expect(shouldShowBioField('')).toBe(false);
    });

    it('returns false for null', () => {
        expect(shouldShowBioField(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(shouldShowBioField(undefined)).toBe(false);
    });

    it('returns true for non-empty string', () => {
        expect(shouldShowBioField('hello')).toBe(true);
    });

    it('returns true for whitespace-only string', () => {
        expect(shouldShowBioField('   ')).toBe(true);
    });

    it('returns true for zero string', () => {
        expect(shouldShowBioField('0')).toBe(true);
    });
});
