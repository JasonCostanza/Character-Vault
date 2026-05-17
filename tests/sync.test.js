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

// ── compactForTransfer — weapons ──

describe('compactForTransfer (weapons)', () => {
    const baseWeapon = {
        id: 'wpn_001', name: 'Longsword', slot: 'main', kind: 'melee',
        icon: null, abilityMod: 'str', proficient: true, attackBonusOverride: null,
        damageInstances: [{ dice: '1d8', modFromAbility: true, flatBonus: 0, damageType: 'slashing' }],
        traits: [{ key: 'dnd5e.versatile', value: '1d10' }],
        notesMarkdown: 'A fine blade.', twoHanded: false, range: null, ammoCount: null,
        acBonus: null, shieldHp: null, shieldHpMax: null, proficiencyRank: null,
        skillName: null, skillValue: null, poolAttribute: null, poolSkill: null,
        poolSize: null, weaponCategory: null, cpredStat: null, cpredSkillValue: null,
        governingTrait: null, baseDamageFlat: null, damageCategory: null,
        firingModes: null, impaling: null, armorSavePenalty: null,
        attachedEnhancements: null, poolAdjustment: null, poolAutoCompute: false,
        accuracy: null, linkedStatModuleId: null
    };

    it('round-trip: compact then expand preserves core fields', () => {
        const compact = compactForTransfer(baseWeapon, 'weapons', {});
        const expanded = expandReceived(compact, 'weapons');
        expect(expanded.name).toBe('Longsword');
        expect(expanded.slot).toBe('main');
        expect(expanded.kind).toBe('melee');
        expect(expanded.abilityMod).toBe('str');
        expect(expanded.proficient).toBe(true);
        expect(expanded.damageInstances[0].dice).toBe('1d8');
        expect(expanded.traits[0].key).toBe('dnd5e.versatile');
        expect(expanded.traits[0].value).toBe('1d10');
    });

    it('omits the id field', () => {
        const compact = compactForTransfer(baseWeapon, 'weapons', {});
        expect(compact.id).toBeUndefined();
    });

    it('strips null/falsy optional fields', () => {
        const compact = compactForTransfer(baseWeapon, 'weapons', {});
        expect(compact.icon).toBeUndefined();
        expect(compact.attackBonusOverride).toBeUndefined();
        expect(compact.range).toBeUndefined();
        expect(compact.ammoCount).toBeUndefined();
    });

    it('strips empty arrays', () => {
        const weapon = Object.assign({}, baseWeapon, { damageInstances: [], traits: [], attachedEnhancements: null });
        const compact = compactForTransfer(weapon, 'weapons', {});
        expect(compact.damageInstances).toBeUndefined();
        expect(compact.traits).toBeUndefined();
        expect(compact.attachedEnhancements).toBeUndefined();
    });

    it('always includes slot and kind even when default', () => {
        const weapon = Object.assign({}, baseWeapon, { slot: 'main', kind: 'melee', notesMarkdown: '', abilityMod: null, proficient: false, damageInstances: [], traits: [] });
        const compact = compactForTransfer(weapon, 'weapons', {});
        expect(compact.slot).toBe('main');
        expect(compact.kind).toBe('melee');
    });
});

// ── expandReceived — weapons ──

describe('expandReceived (weapons)', () => {
    it('generates a new id on each call', () => {
        const compact = { name: 'Sword', slot: 'main', kind: 'melee' };
        const a = expandReceived(compact, 'weapons');
        const b = expandReceived(compact, 'weapons');
        expect(a.id).toBeTruthy();
        expect(b.id).toBeTruthy();
        expect(a.id).not.toBe(b.id);
    });

    it('restores null defaults for omitted fields', () => {
        const compact = { name: 'Sword', slot: 'main', kind: 'melee' };
        const expanded = expandReceived(compact, 'weapons');
        expect(expanded.icon).toBeNull();
        expect(expanded.abilityMod).toBeNull();
        expect(expanded.proficient).toBe(false);
        expect(expanded.damageInstances).toEqual([]);
        expect(expanded.traits).toEqual([]);
        expect(expanded.linkedStatModuleId).toBeNull();
    });

    it('preserves all compact fields', () => {
        const compact = { name: 'Axe', slot: 'off', kind: 'melee', proficient: true, notesMarkdown: 'notes' };
        const expanded = expandReceived(compact, 'weapons');
        expect(expanded.slot).toBe('off');
        expect(expanded.proficient).toBe(true);
        expect(expanded.notesMarkdown).toBe('notes');
    });
});

// ── truncateWeaponPayload ──

describe('truncateWeaponPayload', () => {
    it('does not truncate when payload is small', () => {
        const compact = { name: 'Dagger', slot: 'main', kind: 'melee', notesMarkdown: 'Short' };
        const meta = { customTraits: [], enhancements: [] };
        truncateWeaponPayload(compact, meta);
        expect(compact.truncated).toBeUndefined();
        expect(compact.notesMarkdown).toBe('Short');
    });

    it('truncates notesMarkdown when payload is large', () => {
        const compact = { name: 'Sword', slot: 'main', kind: 'melee', notesMarkdown: 'x'.repeat(500) };
        const meta = { customTraits: [], enhancements: [] };
        truncateWeaponPayload(compact, meta);
        expect(compact.truncated).toBe(true);
        expect(compact.notesMarkdown.length).toBeLessThan(500);
        expect(compact.notesMarkdown.endsWith('...')).toBe(true);
    });

    it('caps traits at 5 when payload is large', () => {
        const traits = [1, 2, 3, 4, 5, 6].map(function (i) { return { key: 'dnd5e.trait' + i, value: null }; });
        const compact = { name: 'Sword', slot: 'main', kind: 'melee', traits: traits, notesMarkdown: 'x'.repeat(300) };
        const meta = { customTraits: [], enhancements: [] };
        truncateWeaponPayload(compact, meta);
        expect(compact.traits.length).toBeLessThanOrEqual(5);
    });

    it('caps enhancements at 3 and prunes attachedEnhancements accordingly', () => {
        const enhancements = [1, 2, 3, 4].map(function (i) { return { key: 'enh_' + i, name: 'Enh ' + i }; });
        const compact = {
            name: 'Sword', slot: 'main', kind: 'melee',
            attachedEnhancements: ['enh_1', 'enh_2', 'enh_3', 'enh_4'],
            notesMarkdown: 'x'.repeat(300)
        };
        const meta = { customTraits: [], enhancements: enhancements };
        truncateWeaponPayload(compact, meta);
        expect(meta.enhancements.length).toBeLessThanOrEqual(3);
        expect(compact.attachedEnhancements.length).toBeLessThanOrEqual(3);
    });
});

// ── insertWeapon ──

describe('insertWeapon', () => {
    let mod;

    beforeEach(() => {
        mod = {
            id: 'mod_wpn_001',
            type: 'weapons',
            content: { weapons: [], customWeaponTraits: [], enhancementCatalog: [] }
        };
        globalThis.modules = [mod];
        globalThis.MODULE_TYPES = {};
    });

    it('adds weapon to module weapons array', () => {
        const weapon = expandReceived({ name: 'Longsword', slot: 'main', kind: 'melee' }, 'weapons');
        insertWeapon('mod_wpn_001', weapon, {});
        expect(mod.content.weapons).toHaveLength(1);
        expect(mod.content.weapons[0].name).toBe('Longsword');
    });

    it('merges incoming custom traits without duplicates (case-insensitive)', () => {
        mod.content.customWeaponTraits.push({ key: 'custom.wt_abc', name: 'Silvered', description: '' });
        const incomingTrait = { key: 'custom.wt_xyz', name: 'silvered', description: '' };
        const weapon = expandReceived({ name: 'Sword', slot: 'main', kind: 'melee', traits: [{ key: 'custom.wt_xyz', value: null }] }, 'weapons');
        insertWeapon('mod_wpn_001', weapon, { customTraits: [incomingTrait] });
        expect(mod.content.customWeaponTraits).toHaveLength(1);
        expect(mod.content.weapons[0].traits[0].key).toBe('custom.wt_abc');
    });

    it('adds new custom traits not already in catalog', () => {
        const incomingTrait = { key: 'custom.wt_new', name: 'Adamantine', description: 'Hard metal.' };
        const weapon = expandReceived({ name: 'Hammer', slot: 'main', kind: 'melee', traits: [{ key: 'custom.wt_new', value: null }] }, 'weapons');
        insertWeapon('mod_wpn_001', weapon, { customTraits: [incomingTrait] });
        expect(mod.content.customWeaponTraits).toHaveLength(1);
        expect(mod.content.customWeaponTraits[0].name).toBe('Adamantine');
    });

    it('merges enhancements without duplicates (case-insensitive)', () => {
        mod.content.enhancementCatalog.push({ key: 'enh_abc', system: 'pf2e', name: '+1 Striking', damageDiceBonus: 1 });
        const incomingEnh = { key: 'enh_xyz', system: 'pf2e', name: '+1 striking', damageDiceBonus: 1 };
        const weapon = expandReceived({ name: 'Sword', slot: 'main', kind: 'melee', attachedEnhancements: ['enh_xyz'] }, 'weapons');
        insertWeapon('mod_wpn_001', weapon, { enhancements: [incomingEnh] });
        expect(mod.content.enhancementCatalog).toHaveLength(1);
        expect(mod.content.weapons[0].attachedEnhancements[0]).toBe('enh_abc');
    });

    it('adds new enhancements not already in catalog', () => {
        const incomingEnh = { key: 'enh_new', system: 'sr6', name: 'Smartlink', poolBonus: 2 };
        const weapon = expandReceived({ name: 'Pistol', slot: 'main', kind: 'ranged', attachedEnhancements: ['enh_new'] }, 'weapons');
        insertWeapon('mod_wpn_001', weapon, { enhancements: [incomingEnh] });
        expect(mod.content.enhancementCatalog).toHaveLength(1);
        expect(mod.content.enhancementCatalog[0].name).toBe('Smartlink');
    });

    it('round-trip: compact + expand + insert preserves weapon data', () => {
        const weapon = {
            id: 'wpn_999', name: 'Rapier', slot: 'main', kind: 'melee', abilityMod: 'dex',
            proficient: true, attackBonusOverride: null, twoHanded: false, range: null,
            ammoCount: null, notesMarkdown: 'Elegant.', acBonus: null, shieldHp: null,
            shieldHpMax: null, icon: null, proficiencyRank: null, skillName: null,
            skillValue: null, poolAttribute: null, poolSkill: null, poolSize: null,
            weaponCategory: null, cpredStat: null, cpredSkillValue: null, governingTrait: null,
            baseDamageFlat: null, damageCategory: null, firingModes: null, impaling: null,
            armorSavePenalty: null, attachedEnhancements: null, poolAdjustment: null,
            poolAutoCompute: false, accuracy: null, linkedStatModuleId: null,
            damageInstances: [{ dice: '1d6', modFromAbility: true, flatBonus: 0, damageType: 'piercing' }],
            traits: [{ key: 'dnd5e.finesse', value: null }]
        };
        const compact = compactForTransfer(weapon, 'weapons', {});
        const expanded = expandReceived(compact, 'weapons');
        insertWeapon('mod_wpn_001', expanded, {});
        const inserted = mod.content.weapons[0];
        expect(inserted.name).toBe('Rapier');
        expect(inserted.abilityMod).toBe('dex');
        expect(inserted.damageInstances[0].dice).toBe('1d6');
        expect(inserted.traits[0].key).toBe('dnd5e.finesse');
        expect(inserted.notesMarkdown).toBe('Elegant.');
    });
});
