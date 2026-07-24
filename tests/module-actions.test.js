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
    loadScript('scripts/module-actions.js');
});

// ── actionTrackerDefaultContent ──

describe('actionTrackerDefaultContent', () => {
    it('pre-populates dnd5e defaults', () => {
        globalThis.gameSystem = 'dnd5e';
        const content = window.actionTrackerDefaultContent();
        expect(content.layout).toBe('wrap');
        expect(content.actions.map((a) => a.name)).toEqual(['Action', 'Bonus Action', 'Reaction']);
        expect(content.actions.every((a) => a.used === false)).toBe(true);
    });

    it('pre-populates pf2e defaults with duplicate Action names', () => {
        globalThis.gameSystem = 'pf2e';
        const content = window.actionTrackerDefaultContent();
        expect(content.actions.map((a) => a.name)).toEqual(['Action', 'Action', 'Action', 'Reaction']);
    });

    it('pre-populates sr6 defaults with duplicate Minor Action names', () => {
        globalThis.gameSystem = 'sr6';
        const content = window.actionTrackerDefaultContent();
        expect(content.actions.map((a) => a.name)).toEqual(['Major Action', 'Minor Action', 'Minor Action']);
    });

    it('returns an empty actions array for custom', () => {
        globalThis.gameSystem = 'custom';
        const content = window.actionTrackerDefaultContent();
        expect(content.actions).toEqual([]);
    });

    it('assigns a unique id to every action', () => {
        globalThis.gameSystem = 'pf2e';
        const content = window.actionTrackerDefaultContent();
        const ids = new Set(content.actions.map((a) => a.id));
        expect(ids.size).toBe(content.actions.length);
    });
});

// ── ensureActionTrackerContent ──

describe('ensureActionTrackerContent', () => {
    it('initializes empty data with defaults', () => {
        const data = { content: null };
        const content = window.ensureActionTrackerContent(data);
        expect(content.layout).toBe('wrap');
        expect(content.actions).toEqual([]);
    });

    it('normalizes string content (legacy shape)', () => {
        const data = { content: '' };
        const content = window.ensureActionTrackerContent(data);
        expect(content.layout).toBe('wrap');
        expect(Array.isArray(content.actions)).toBe(true);
    });

    it('preserves existing valid content', () => {
        const data = {
            content: {
                layout: 'list',
                actions: [{ id: 'act_1', name: 'Action', used: true }],
            },
        };
        const content = window.ensureActionTrackerContent(data);
        expect(content.layout).toBe('list');
        expect(content.actions).toHaveLength(1);
        expect(content.actions[0].used).toBe(true);
    });

    it('fills in a missing layout field', () => {
        const data = { content: { actions: [] } };
        const content = window.ensureActionTrackerContent(data);
        expect(content.layout).toBe('wrap');
    });

    it('fills in a missing actions array', () => {
        const data = { content: { layout: 'list' } };
        const content = window.ensureActionTrackerContent(data);
        expect(content.actions).toEqual([]);
    });
});

// ── resetAllActions ──

describe('resetAllActions', () => {
    it('sets every action used flag to false', () => {
        const data = {
            id: 'module-001',
            content: {
                layout: 'wrap',
                actions: [
                    { id: 'act_1', name: 'Action', used: true },
                    { id: 'act_2', name: 'Bonus Action', used: true },
                ],
            },
        };
        globalThis.modules = [data];
        window.resetAllActions('module-001');
        expect(data.content.actions.every((a) => a.used === false)).toBe(true);
        expect(globalThis.scheduleSave).toHaveBeenCalled();
    });

    it('does nothing when the module id is not found', () => {
        globalThis.modules = [];
        expect(() => window.resetAllActions('missing')).not.toThrow();
    });
});
