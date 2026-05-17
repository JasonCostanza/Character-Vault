import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers/load-script.js';

// Mock globals that sync.js reads at call time
globalThis.modules = [];
globalThis.scheduleSave = () => {};
globalThis.showToast = () => {};
globalThis.t = (key) => key;
globalThis.escapeHtml = (str) =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

beforeEach(() => {
    loadScript('scripts/sync.js');
});

// ── compactForTransfer — list items ──

describe('compactForTransfer (list)', () => {
    const moduleData = {
        attrs: [
            { id: 'attr_001', name: 'Healing', type: 'dice' },
            { id: 'attr_002', name: 'Weight', type: 'number' },
            { id: 'attr_003', name: 'Cost', type: 'text' }
        ]
    };

    it('round-trip: compact then expand preserves name and values', () => {
        const item = {
            id: 'item_001',
            name: 'Potion of Healing',
            values: { attr_001: '2d4+2', attr_002: '0.5' }
        };
        const compact = compactForTransfer(item, 'list', moduleData);
        const expanded = expandReceived(compact, 'list');
        expect(expanded.name).toBe('Potion of Healing');
        expect(expanded.values['Healing']).toBe('2d4+2');
        expect(expanded.values['Weight']).toBe('0.5');
    });

    it('strips null values', () => {
        const item = { id: 'item_002', name: 'Empty', values: { attr_001: null } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values).toBeUndefined();
    });

    it('strips zero values', () => {
        const item = { id: 'item_003', name: 'Empty', values: { attr_001: 0 } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values).toBeUndefined();
    });

    it('strips empty string values', () => {
        const item = { id: 'item_004', name: 'Empty', values: { attr_001: '' } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values).toBeUndefined();
    });

    it('strips false values', () => {
        const item = { id: 'item_005', name: 'Empty', values: { attr_001: false } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values).toBeUndefined();
    });

    it('remaps attribute IDs to names', () => {
        const item = { id: 'item_006', name: 'Sword', values: { attr_001: '1d8', attr_002: '3' } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values['Healing']).toBe('1d8');
        expect(compact.values['Weight']).toBe('3');
        expect(compact.values['attr_001']).toBeUndefined();
        expect(compact.values['attr_002']).toBeUndefined();
    });

    it('omits the id field', () => {
        const item = { id: 'item_007', name: 'Sword', values: {} };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.id).toBeUndefined();
    });

    it('keeps non-empty string values', () => {
        const item = { id: 'item_008', name: 'Arrow', values: { attr_003: '5 gp' } };
        const compact = compactForTransfer(item, 'list', moduleData);
        expect(compact.values['Cost']).toBe('5 gp');
    });
});

// ── expandReceived — list items ──

describe('expandReceived (list)', () => {
    it('generates a new id on each call', () => {
        const compact = { name: 'Rope', values: { Length: '50 ft' } };
        const a = expandReceived(compact, 'list');
        const b = expandReceived(compact, 'list');
        expect(a.id).toBeTruthy();
        expect(b.id).toBeTruthy();
        expect(a.id).not.toBe(b.id);
    });

    it('preserves name', () => {
        const compact = { name: 'Key', values: {} };
        expect(expandReceived(compact, 'list').name).toBe('Key');
    });

    it('preserves values object', () => {
        const compact = { name: 'Arrow', values: { Count: '20', Weight: '0.1' } };
        const expanded = expandReceived(compact, 'list');
        expect(expanded.values['Count']).toBe('20');
        expect(expanded.values['Weight']).toBe('0.1');
    });

    it('defaults to empty values when missing', () => {
        const compact = { name: 'Token' };
        expect(expandReceived(compact, 'list').values).toEqual({});
    });

    it('defaults name to empty string when missing', () => {
        const compact = { values: { Count: '1' } };
        expect(expandReceived(compact, 'list').name).toBe('');
    });
});

// ── validateIncoming ──

describe('validateIncoming', () => {
    it('accepts a valid minimal envelope', () => {
        expect(validateIncoming({ v: 1, t: 'offer', txn: 'txn_001' })).toBe(true);
    });

    it('rejects null', () => {
        expect(validateIncoming(null)).toBe(false);
    });

    it('rejects non-object', () => {
        expect(validateIncoming('string')).toBe(false);
    });

    it('rejects missing v field', () => {
        expect(validateIncoming({ t: 'offer', txn: 'txn_001' })).toBe(false);
    });

    it('rejects null v field', () => {
        expect(validateIncoming({ v: null, t: 'offer', txn: 'txn_001' })).toBe(false);
    });

    it('rejects missing t field', () => {
        expect(validateIncoming({ v: 1, txn: 'txn_001' })).toBe(false);
    });

    it('rejects non-string t field', () => {
        expect(validateIncoming({ v: 1, t: 42, txn: 'txn_001' })).toBe(false);
    });

    it('rejects missing txn field', () => {
        expect(validateIncoming({ v: 1, t: 'offer' })).toBe(false);
    });

    it('escapes HTML in the from field', () => {
        const msg = { v: 1, t: 'offer', txn: 'txn_001', from: '<script>xss</script>' };
        expect(validateIncoming(msg)).toBe(true);
        expect(msg.from).not.toContain('<script>');
        expect(msg.from).toContain('&lt;');
    });

    it('escapes HTML in nested data string fields', () => {
        const msg = {
            v: 1, t: 'offer', txn: 'txn_001',
            data: { name: '<b>Evil Name</b>' }
        };
        expect(validateIncoming(msg)).toBe(true);
        expect(msg.data.name).not.toContain('<b>');
    });

    it('passes clean messages through unchanged', () => {
        const msg = { v: 1, t: 'accept', txn: 'txn_002', from: 'Alice' };
        expect(validateIncoming(msg)).toBe(true);
        expect(msg.from).toBe('Alice');
    });
});

// ── insertListItem ──

describe('insertListItem', () => {
    let mod;

    beforeEach(() => {
        mod = {
            id: 'mod_001',
            type: 'list',
            content: {
                attributes: [
                    { id: 'attr_001', name: 'Weight', type: 'number', defaultValue: 0 }
                ],
                items: []
            }
        };
        globalThis.modules = [mod];
        globalThis.MODULE_TYPES = {}; // no DOM re-render in tests
    });

    it('adds item to module items array', () => {
        insertListItem('mod_001', { id: 'item_001', name: 'Torch', notes: '', values: {} }, []);
        expect(mod.content.items).toHaveLength(1);
        expect(mod.content.items[0].name).toBe('Torch');
    });

    it('assigns increasing order values', () => {
        mod.content.items.push({ id: 'item_pre', name: 'Pre', order: 2, values: {} });
        insertListItem('mod_001', { id: 'item_002', name: 'Arrow', notes: '', values: {} }, []);
        expect(mod.content.items[1].order).toBe(3);
    });

    it('auto-creates missing attributes', () => {
        insertListItem('mod_001', { id: 'item_003', name: 'Arrow', notes: '', values: { Damage: '1d6' } }, [{ name: 'Damage', type: 'text' }]);
        const newAttr = mod.content.attributes.find((a) => a.name === 'Damage');
        expect(newAttr).toBeTruthy();
        expect(newAttr.type).toBe('text');
    });

    it('does not duplicate existing attributes (case-insensitive)', () => {
        insertListItem('mod_001', { id: 'item_004', name: 'Stone', notes: '', values: {} }, [{ name: 'weight', type: 'number' }]);
        expect(mod.content.attributes.filter((a) => a.name.toLowerCase() === 'weight')).toHaveLength(1);
    });

    it('gives existing items the default value for auto-created attributes', () => {
        mod.content.items.push({ id: 'item_pre', name: 'Pre', order: 0, values: {} });
        insertListItem('mod_001', { id: 'item_005', name: 'Key', notes: '', values: { Damage: '1d4' } }, [{ name: 'Damage', type: 'text' }]);
        const newAttr = mod.content.attributes.find((a) => a.name === 'Damage');
        expect(mod.content.items[0].values[newAttr.id]).toBe(''); // default for type 'text'
    });

    it('remaps name-based values to attribute IDs', () => {
        insertListItem('mod_001', { id: 'item_006', name: 'Sword', notes: '', values: { Weight: 3 } }, []);
        expect(mod.content.items[0].values['attr_001']).toBe(3);
        expect(mod.content.items[0].values['Weight']).toBeUndefined();
    });

    it('round-trip: expandReceived then insertListItem preserves data', () => {
        const compact = { name: 'Shield', notes: 'Sturdy shield', values: { Weight: 5 } };
        const expanded = expandReceived(compact, 'list');
        insertListItem('mod_001', expanded, [{ name: 'Weight', type: 'number' }]);
        const inserted = mod.content.items[0];
        expect(inserted.name).toBe('Shield');
        expect(inserted.notes).toBe('Sturdy shield');
        expect(inserted.values['attr_001']).toBe(5);
    });
});

// ── generateTxnId ──

describe('generateTxnId', () => {
    it('matches expected format txn_<timestamp>_<3chars>', () => {
        expect(generateTxnId()).toMatch(/^txn_\d+_[a-z0-9]{3}$/);
    });

    it('produces unique IDs across rapid calls', () => {
        const ids = new Set();
        for (let i = 0; i < 30; i++) ids.add(generateTxnId());
        expect(ids.size).toBe(30);
    });
});
