import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    loadScript('scripts/shared.js');
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

// ── compactForTransfer — spells ──

describe('compactForTransfer (spells)', () => {
    const moduleData = {
        attrs: [
            { id: 'attr_s01', name: 'Damage', type: 'text' },
            { id: 'attr_s02', name: 'Save DC', type: 'number' }
        ]
    };

    it('round-trip: compact then expand preserves name and description', () => {
        const spell = { id: 'sp_001', name: 'Magic Missile', description: 'Three darts.', order: 0, expanded: false, values: {} };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        const expanded = expandReceived(compact, 'spells');
        expect(expanded.name).toBe('Magic Missile');
        expect(expanded.description).toBe('Three darts.');
    });

    it('round-trip: remaps attribute IDs to names and back', () => {
        const spell = { id: 'sp_002', name: 'Fireball', description: '', order: 0, expanded: false, values: { attr_s01: '8d6', attr_s02: 14 } };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        expect(compact.values['Damage']).toBe('8d6');
        expect(compact.values['Save DC']).toBe(14);
        expect(compact.values['attr_s01']).toBeUndefined();
    });

    it('strips empty and falsy attribute values', () => {
        const spell = { id: 'sp_003', name: 'Shield', description: '', order: 0, expanded: false, values: { attr_s01: '', attr_s02: 0 } };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        expect(compact.values).toBeUndefined();
    });

    it('omits the id field', () => {
        const spell = { id: 'sp_004', name: 'Blink', description: '', order: 0, expanded: false, values: {} };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        expect(compact.id).toBeUndefined();
    });

    it('omits description when empty', () => {
        const spell = { id: 'sp_005', name: 'Light', description: '', order: 0, expanded: false, values: {} };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        expect(compact.description).toBeUndefined();
    });
});

// ── expandReceived — spells ──

describe('expandReceived (spells)', () => {
    it('generates a new id on each call', () => {
        const compact = { name: 'Cure Wounds', description: 'Heals.' };
        const a = expandReceived(compact, 'spells');
        const b = expandReceived(compact, 'spells');
        expect(a.id).toBeTruthy();
        expect(b.id).toBeTruthy();
        expect(a.id).not.toBe(b.id);
    });

    it('sets expanded to false and order to 0', () => {
        const compact = { name: 'Sleep', description: '' };
        const expanded = expandReceived(compact, 'spells');
        expect(expanded.expanded).toBe(false);
        expect(expanded.order).toBe(0);
    });

    it('defaults to empty values when missing', () => {
        const compact = { name: 'Mage Hand' };
        expect(expandReceived(compact, 'spells').values).toEqual({});
    });
});

// ── insertSpell ──

describe('insertSpell', () => {
    let mod;

    beforeEach(() => {
        mod = {
            id: 'mod_sp_001',
            type: 'spells',
            content: {
                autoSpendSlots: true,
                showSlotErrors: true,
                slotLevels: [],
                categories: [{ id: 'cat_001', name: 'Level 1 Spells', slotLevel: 1, collapsed: false, spells: [] }],
                attributes: [{ id: 'attr_s01', name: 'Damage', type: 'text', defaultValue: '', pinned: true, builtIn: false }],
                sortBy: null,
                sortDir: 'asc'
            }
        };
        globalThis.modules = [mod];
        globalThis.MODULE_TYPES = {};
        globalThis.ensureSpellContent = () => {};
    });

    it('inserts spell into matching category by name', () => {
        const expanded = expandReceived({ name: 'Magic Missile', description: '' }, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [], categoryName: 'Level 1 Spells', slotLevel: null });
        expect(mod.content.categories[0].spells).toHaveLength(1);
        expect(mod.content.categories[0].spells[0].name).toBe('Magic Missile');
    });

    it('inserts spell into matching category by slotLevel when name fails', () => {
        const expanded = expandReceived({ name: 'Burning Hands', description: '' }, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [], categoryName: 'Nonexistent', slotLevel: 1 });
        expect(mod.content.categories[0].spells).toHaveLength(1);
    });

    it('creates a new category when no match found', () => {
        const expanded = expandReceived({ name: 'Cantrip X', description: '' }, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [], categoryName: 'Cantrips', slotLevel: null });
        expect(mod.content.categories).toHaveLength(2);
        expect(mod.content.categories[1].name).toBe('Cantrips');
        expect(mod.content.categories[1].spells[0].name).toBe('Cantrip X');
    });

    it('category name matching is case-insensitive', () => {
        const expanded = expandReceived({ name: 'Fog Cloud', description: '' }, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [], categoryName: 'level 1 spells', slotLevel: null });
        expect(mod.content.categories).toHaveLength(1);
        expect(mod.content.categories[0].spells).toHaveLength(1);
    });

    it('auto-creates missing attributes', () => {
        const expanded = expandReceived({ name: 'Ice Storm', description: '', values: { 'Radius': '20ft' } }, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [{ name: 'Radius', type: 'text' }], categoryName: 'Level 1 Spells', slotLevel: null });
        const newAttr = mod.content.attributes.find((a) => a.name === 'Radius');
        expect(newAttr).toBeTruthy();
    });

    it('round-trip: compact + expand + insert preserves spell data', () => {
        const spell = { id: 'sp_999', name: 'Hold Person', description: 'Paralyzes a target.', order: 0, expanded: false, values: { attr_s01: '—' } };
        const moduleData = { attrs: mod.content.attributes };
        const compact = compactForTransfer(spell, 'spells', moduleData);
        const expanded = expandReceived(compact, 'spells');
        insertSpell('mod_sp_001', expanded, { attrs: [{ name: 'Damage', type: 'text' }], categoryName: 'Level 1 Spells', slotLevel: null });
        const inserted = mod.content.categories[0].spells[0];
        expect(inserted.name).toBe('Hold Person');
        expect(inserted.description).toBe('Paralyzes a target.');
        expect(inserted.values['attr_s01']).toBe('—');
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

// ── splitIntoChunks ──

describe('splitIntoChunks', () => {
    it('splits a string into chunks of the specified size', () => {
        expect(splitIntoChunks('abcdefghij', 3)).toEqual(['abc', 'def', 'ghi', 'j']);
    });

    it('returns a single chunk when string fits within size', () => {
        expect(splitIntoChunks('hello', 100)).toEqual(['hello']);
    });

    it('produces the correct number of chunks for a large payload', () => {
        const str = 'x'.repeat(900);
        const chunks = splitIntoChunks(str, 430);
        expect(chunks).toHaveLength(Math.ceil(900 / 430));
        expect(chunks[0]).toHaveLength(430);
        expect(chunks[chunks.length - 1]).toHaveLength(900 % 430 || 430);
    });

    it('returns empty array for empty string', () => {
        expect(splitIntoChunks('', 100)).toEqual([]);
    });
});

// ── splitIntoChunksByEncodedLen ──

describe('splitIntoChunksByEncodedLen', () => {
    it('returns empty array for empty string', () => {
        expect(splitIntoChunksByEncodedLen('', 50)).toEqual([]);
    });

    it('returns single chunk when string encodes within budget', () => {
        const str = 'hello';
        const chunks = splitIntoChunksByEncodedLen(str, 100);
        expect(chunks).toEqual(['hello']);
    });

    it('each chunk JSON.stringify length stays within budget for plain ASCII', () => {
        const str = 'x'.repeat(200);
        const budget = 50; // JSON.stringify('x'.repeat(48)) = 50 chars (48 + 2 quotes)
        const chunks = splitIntoChunksByEncodedLen(str, budget);
        chunks.forEach(chunk => {
            expect(JSON.stringify(chunk).length).toBeLessThanOrEqual(budget);
        });
        expect(chunks.join('')).toBe(str);
    });

    it('each chunk stays within budget for strings with many double-quotes', () => {
        // JSON.stringify expands " → \" so encoded length > raw length
        const str = ('"key":"value",').repeat(20); // dense with quotes and colons
        const budget = 50;
        const chunks = splitIntoChunksByEncodedLen(str, budget);
        chunks.forEach(chunk => {
            expect(JSON.stringify(chunk).length).toBeLessThanOrEqual(budget);
        });
        expect(chunks.join('')).toBe(str);
    });

    it('round-trips correctly with joinChunks', () => {
        const original = '{"v":1,"t":"offer","from":"Player","items":[{"name":"Sword","desc":"A long description here"}]}';
        const budget = 30;
        const chunks = splitIntoChunksByEncodedLen(original, budget);
        const parts = {};
        chunks.forEach((chunk, i) => { parts[i] = chunk; });
        expect(joinChunks(parts, chunks.length)).toBe(original);
    });

    it('produces chunks whose full wire envelope stays under 500 chars', () => {
        // Simulate a realistic offer JSON with many special chars
        const txnId = 'txn_1779032951762_abc';
        const offerJson = JSON.stringify({
            v: 1, t: 'offer', from: 'Player', txn: txnId,
            items: [{ name: 'Sword of Fire', desc: '"A blade that burns." Special chars: \\ and more \\' }]
        });
        const probe = JSON.stringify({ v: 1, t: 'chunk', txn: txnId, i: 99, n: 99, d: '' });
        const dBudget = 502 - probe.length;
        const chunks = splitIntoChunksByEncodedLen(offerJson, dBudget);
        chunks.forEach((slice, idx) => {
            const wire = JSON.stringify({ v: 1, t: 'chunk', txn: txnId, i: idx, n: chunks.length, d: slice });
            expect(wire.length).toBeLessThanOrEqual(500);
        });
    });
});

// ── joinChunks ──

describe('joinChunks', () => {
    it('reassembles chunks in order', () => {
        const original = 'hello world, this is a test message';
        const chunks = splitIntoChunks(original, 10);
        const parts = {};
        chunks.forEach(function (chunk, i) { parts[i] = chunk; });
        expect(joinChunks(parts, chunks.length)).toBe(original);
    });

    it('reassembles out-of-order parts correctly', () => {
        const parts = { 2: 'ghi', 0: 'abc', 3: 'j', 1: 'def' };
        expect(joinChunks(parts, 4)).toBe('abcdefghij');
    });

    it('is idempotent when the same part index is overwritten', () => {
        const parts = { 0: 'hello ', 1: 'world' };
        parts[1] = 'world'; // duplicate assignment — same value
        expect(joinChunks(parts, 2)).toBe('hello world');
    });
});

// ── handleChunk (integration) ──

describe('handleChunk', () => {
    beforeEach(() => {
        globalThis.TS = { sync: { send: () => Promise.resolve() } };
        globalThis.showToast = () => {};
    });

    it('does not fire offer handler until all chunks arrive', () => {
        const calls = [];
        globalThis.showToast = (msg) => calls.push(msg);

        const fullMsg = JSON.stringify({ v: 1, t: 'offer', txn: 'txn_hc_001', mode: 'move', src: 'list', from: 'Alice', data: { name: 'Torch' }, meta: { attrs: [] } });
        const chunks = splitIntoChunks(fullMsg, 30);

        for (let i = 0; i < chunks.length - 1; i++) {
            handleChunk({ txn: 'txn_hc_001', i: i, n: chunks.length, d: chunks[i] }, 'client_a');
        }
        expect(calls).toHaveLength(0);

        handleChunk({ txn: 'txn_hc_001', i: chunks.length - 1, n: chunks.length, d: chunks[chunks.length - 1] }, 'client_a');
        expect(calls).toHaveLength(1);
    });

    it('handles out-of-order chunk arrival', () => {
        const calls = [];
        globalThis.showToast = (msg) => calls.push(msg);

        const fullMsg = JSON.stringify({ v: 1, t: 'offer', txn: 'txn_hc_002', mode: 'move', src: 'list', from: 'Bob', data: { name: 'Arrow' }, meta: { attrs: [] } });
        const chunks = splitIntoChunks(fullMsg, 30);

        for (let i = chunks.length - 1; i >= 0; i--) {
            handleChunk({ txn: 'txn_hc_002', i: i, n: chunks.length, d: chunks[i] }, 'client_b');
        }
        expect(calls).toHaveLength(1);
    });

    it('handles duplicate chunks idempotently — fires offer exactly once', () => {
        const calls = [];
        globalThis.showToast = (msg) => calls.push(msg);

        const fullMsg = JSON.stringify({ v: 1, t: 'offer', txn: 'txn_hc_003', mode: 'move', src: 'list', from: 'Carol', data: { name: 'Rope' }, meta: { attrs: [] } });
        const chunks = splitIntoChunks(fullMsg, 30);

        handleChunk({ txn: 'txn_hc_003', i: 0, n: chunks.length, d: chunks[0] }, 'client_c');
        handleChunk({ txn: 'txn_hc_003', i: 0, n: chunks.length, d: chunks[0] }, 'client_c'); // duplicate
        for (let i = 1; i < chunks.length; i++) {
            handleChunk({ txn: 'txn_hc_003', i: i, n: chunks.length, d: chunks[i] }, 'client_c');
        }
        expect(calls).toHaveLength(1);
    });

    it('discards buffer after 15s timeout — remaining chunks do not reassemble', () => {
        vi.useFakeTimers();
        const calls = [];
        globalThis.showToast = (msg) => calls.push(msg);

        const fullMsg = JSON.stringify({ v: 1, t: 'offer', txn: 'txn_hc_004', mode: 'move', src: 'list', from: 'Dave', data: { name: 'Gem' }, meta: { attrs: [] } });
        const chunks = splitIntoChunks(fullMsg, 30);

        // Send only the first chunk, then let the buffer expire
        handleChunk({ txn: 'txn_hc_004', i: 0, n: chunks.length, d: chunks[0] }, 'client_d');
        expect(calls).toHaveLength(0);

        vi.advanceTimersByTime(16000);

        // Remaining chunks arrive after expiry — new buffer starts from chunk 1, missing chunk 0
        for (let i = 1; i < chunks.length; i++) {
            handleChunk({ txn: 'txn_hc_004', i: i, n: chunks.length, d: chunks[i] }, 'client_d');
        }
        expect(calls).toHaveLength(0); // offer never reassembled without chunk 0

        vi.useRealTimers();
    });
});
