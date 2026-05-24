import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
  setupMinimalDOM();

  window.modules = [];
  window.moduleIdCounter = 0;

  globalThis.scheduleSave = vi.fn();
  globalThis.MODULE_TYPES = {};
  globalThis.renderModule = vi.fn();
  globalThis.updateEmptyState = vi.fn();

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });

  loadScript('scripts/shared.js');
  loadScript('scripts/i18n.js');
  loadScript('scripts/theme.js');
  loadScript('scripts/settings.js');
  loadScript('scripts/persistence.js');
  loadScript('scripts/module-core.js');
  loadScript('scripts/module-spells.js');

  // persistence.js defines the real scheduleSave — re-mock it so tests can spy on it
  globalThis.scheduleSave = vi.fn();
  // Override showToast after shared.js defines the real one
  globalThis.showToast = vi.fn();
});

describe('isDiceNotation', () => {
  it('accepts standard notation like 2d6', () => {
    expect(isDiceNotation('2d6')).toBe(true);
  });

  it('accepts notation with positive modifier like 1d20+5', () => {
    expect(isDiceNotation('1d20+5')).toBe(true);
  });

  it('accepts notation with negative modifier like 1d8-1', () => {
    expect(isDiceNotation('1d8-1')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isDiceNotation('hello')).toBe(false);
  });

  it('rejects plain numbers without die notation', () => {
    expect(isDiceNotation('10')).toBe(false);
  });

  it('rejects partial notation without die size like "2d"', () => {
    expect(isDiceNotation('2d')).toBe(false);
  });

  it('rejects partial notation without die count like "d6"', () => {
    expect(isDiceNotation('d6')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isDiceNotation('2D6')).toBe(true);
  });
});

describe('extractDiceRoll', () => {
  it('extracts dice notation embedded in prose', () => {
    expect(extractDiceRoll('deals 2d6 fire damage')).toBe('2d6');
  });

  it('returns the first match when there are multiple', () => {
    expect(extractDiceRoll('1d4 or 2d8')).toBe('1d4');
  });

  it('returns null when no dice notation is found', () => {
    expect(extractDiceRoll('no dice here')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractDiceRoll('')).toBeNull();
  });
});

describe('spellsDefaultContent', () => {
  it('returns an object with the expected shape', () => {
    const c = spellsDefaultContent();
    expect(Array.isArray(c.resourcePools)).toBe(true);
    expect(Array.isArray(c.categories)).toBe(true);
    expect(typeof c.autoSpendSlots).toBe('boolean');
    expect(typeof c.showSlotErrors).toBe('boolean');
    expect(c.casterType).toBeNull();
  });

  it('returns a fresh object each call — not a shared reference', () => {
    const a = spellsDefaultContent();
    const b = spellsDefaultContent();
    a.categories.push({ id: 'x' });
    expect(b.categories).toHaveLength(0);
  });
});

describe('resolveSlotCost', () => {
  it('returns 1 when slotCost is null', () => {
    expect(resolveSlotCost({ slotCost: null })).toBe(1);
  });

  it('returns 1 when slotCost is undefined', () => {
    expect(resolveSlotCost({})).toBe(1);
  });

  it('returns 0 when slotCost is 0', () => {
    expect(resolveSlotCost({ slotCost: 0 })).toBe(0);
  });

  it('returns N when slotCost is a positive number', () => {
    expect(resolveSlotCost({ slotCost: 2 })).toBe(2);
  });

  it('clamps negative values to 0', () => {
    expect(resolveSlotCost({ slotCost: -3 })).toBe(0);
  });

  it('clamps non-numeric strings to 0', () => {
    expect(resolveSlotCost({ slotCost: 'abc' })).toBe(0);
  });

  it('returns 1 when slotCost is empty string', () => {
    expect(resolveSlotCost({ slotCost: '' })).toBe(1);
  });
});

describe('getPoolLabel', () => {
  it('returns "?" for null/undefined', () => {
    expect(getPoolLabel(null)).toBe('?');
    expect(getPoolLabel(undefined)).toBe('?');
  });

  it('formats spell-slot pools with level', () => {
    expect(getPoolLabel({ type: 'spell-slot', level: 3, name: null })).toBe('Lvl 3');
  });

  it('returns pool name for focus type with a name', () => {
    expect(getPoolLabel({ type: 'focus', level: null, name: 'Ki Points' })).toBe('Ki Points');
  });

  it('falls back to customPool label for focus type with no name', () => {
    expect(getPoolLabel({ type: 'focus', level: null, name: '' })).toBe('Custom Pool');
  });

  it('returns pool name for custom type with a name', () => {
    expect(getPoolLabel({ type: 'custom', level: null, name: 'Luck' })).toBe('Luck');
  });

  it('falls back to customPool label for custom type with null name', () => {
    expect(getPoolLabel({ type: 'custom', level: null, name: null })).toBe('Custom Pool');
  });
});

describe('getAvailableSlots', () => {
  function makeData(resourcePools) {
    return { content: { resourcePools } };
  }

  it('returns remaining slots for a known pool', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 4, spent: 1 }]);
    expect(getAvailableSlots(data, 'rp1')).toBe(3);
  });

  it('returns 0 when all slots are spent', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 3, spent: 3 }]);
    expect(getAvailableSlots(data, 'rp1')).toBe(0);
  });

  it('clamps to 0 when spent exceeds max', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 2, spent: 5 }]);
    expect(getAvailableSlots(data, 'rp1')).toBe(0);
  });

  it('returns 0 for a pool id that does not exist', () => {
    const data = makeData([]);
    expect(getAvailableSlots(data, 'rp_missing')).toBe(0);
  });
});

describe('spendSlot', () => {
  function makeData(resourcePools) {
    return { content: { resourcePools } };
  }

  it('spends 1 by default', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 4, spent: 0 }]);
    spendSlot(data, 'rp1');
    expect(data.content.resourcePools[0].spent).toBe(1);
  });

  it('spends the given cost', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 4, spent: 0 }]);
    spendSlot(data, 'rp1', 2);
    expect(data.content.resourcePools[0].spent).toBe(2);
  });

  it('clamps spent to max', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 2, spent: 1 }]);
    spendSlot(data, 'rp1', 10);
    expect(data.content.resourcePools[0].spent).toBe(2);
  });

  it('is a no-op when cost is 0', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 4, spent: 1 }]);
    spendSlot(data, 'rp1', 0);
    expect(data.content.resourcePools[0].spent).toBe(1);
  });

  it('is a no-op for a missing pool id', () => {
    const data = makeData([{ id: 'rp1', type: 'spell-slot', level: 2, name: null, max: 3, spent: 0 }]);
    spendSlot(data, 'rp_missing');
    expect(data.content.resourcePools[0].spent).toBe(0);
  });
});

describe('migrateSpellContent', () => {
  function makeOldContent(spellsByCategory) {
    return {
      autoSpendSlots: true,
      showSlotErrors: true,
      slotLevels: [],
      categories: spellsByCategory.map((spells, i) => ({
        id: 'cat' + i,
        name: 'Cat ' + i,
        slotLevel: null,
        collapsed: false,
        spells,
      })),
    };
  }

  it('promotes shared attribute keys to content.attributes', () => {
    const content = makeOldContent([
      [{ id: 'sp1', name: 'Bolt', attributes: [{ key: 'Damage', value: '2d6' }] }],
    ]);
    migrateSpellContent(content);
    expect(content.attributes).toHaveLength(1);
    expect(content.attributes[0].name).toBe('Damage');
    expect(content.attributes[0].type).toBe('text');
  });

  it('deduplicates the same key across spells in different categories', () => {
    const content = makeOldContent([
      [{ id: 'sp1', name: 'A', attributes: [{ key: 'Damage', value: '1d4' }] }],
      [{ id: 'sp2', name: 'B', attributes: [{ key: 'Damage', value: '2d8' }] }],
    ]);
    migrateSpellContent(content);
    expect(content.attributes).toHaveLength(1);
  });

  it('converts spell.attributes array to spell.values object', () => {
    const content = makeOldContent([
      [{ id: 'sp1', name: 'Bolt', attributes: [{ key: 'Damage', value: '3d6' }] }],
    ]);
    migrateSpellContent(content);
    const spell = content.categories[0].spells[0];
    expect(spell.attributes).toBeUndefined();
    expect(typeof spell.values).toBe('object');
    const attrId = content.attributes[0].id;
    expect(spell.values[attrId]).toBe('3d6');
  });

  it('assigns order and expanded fields if missing', () => {
    const content = makeOldContent([
      [
        { id: 'sp1', name: 'A', attributes: [] },
        { id: 'sp2', name: 'B', attributes: [] },
      ],
    ]);
    migrateSpellContent(content);
    expect(content.categories[0].spells[0].order).toBe(0);
    expect(content.categories[0].spells[1].order).toBe(1);
    expect(content.categories[0].spells[0].expanded).toBe(false);
  });

  it('sets sortBy and sortDir if missing', () => {
    const content = makeOldContent([]);
    migrateSpellContent(content);
    expect(content.sortBy).toBeNull();
    expect(content.sortDir).toBe('asc');
  });

  it('is a no-op for spells with no attributes key', () => {
    const content = makeOldContent([
      [{ id: 'sp1', name: 'A', attributes: [] }],
    ]);
    migrateSpellContent(content);
    expect(content.attributes).toHaveLength(0);
    expect(content.categories[0].spells[0].values).toEqual({});
  });
});

describe('ensureSpellContent', () => {
  it('replaces null content with defaultContent shape', () => {
    const data = { content: null };
    ensureSpellContent(data);
    expect(Array.isArray(data.content.resourcePools)).toBe(true);
    expect(Array.isArray(data.content.attributes)).toBe(true);
    expect(data.content.sortBy).toBeNull();
    expect(data.content.casterType).toBeNull();
  });

  it('migrates legacy slotLevels to resourcePools', () => {
    const data = { content: { slotLevels: [{ id: 'sl1', level: 1, max: 4, spent: 1 }], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.slotLevels).toBeUndefined();
    expect(data.content.resourcePools).toHaveLength(1);
    expect(data.content.resourcePools[0]).toMatchObject({ id: 'sl1', type: 'spell-slot', level: 1, max: 4, spent: 1 });
  });

  it('migrates category slotLevel to resourcePoolId', () => {
    const data = { content: { slotLevels: [{ id: 'sl1', level: 1, max: 4, spent: 0 }], categories: [{ id: 'cat1', name: 'C', slotLevel: 1, collapsed: false, spells: [] }], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.categories[0].slotLevel).toBeUndefined();
    expect(data.content.categories[0].resourcePoolId).toBe('sl1');
  });

  it('fills in missing boolean fields', () => {
    const data = { content: { resourcePools: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.autoSpendSlots).toBe(true);
    expect(data.content.showSlotErrors).toBe(true);
  });

  it('runs migration when a spell has legacy attributes array', () => {
    const data = {
      content: {
        autoSpendSlots: true,
        showSlotErrors: true,
        resourcePools: [],
        categories: [
          { id: 'cat1', name: 'C', resourcePoolId: null, collapsed: false,
            spells: [{ id: 'sp1', name: 'A', attributes: [{ key: 'Dmg', value: '1d6' }] }] },
        ],
      },
    };
    ensureSpellContent(data);
    expect(Array.isArray(data.content.attributes)).toBe(true);
    expect(data.content.attributes).toHaveLength(1);
    expect(data.content.categories[0].spells[0].values).toBeDefined();
    expect(data.content.categories[0].spells[0].attributes).toBeUndefined();
  });

  it('adds new spell fields to existing spells', () => {
    const data = {
      content: {
        autoSpendSlots: true, showSlotErrors: true,
        resourcePools: [], categories: [
          { id: 'cat1', name: 'C', resourcePoolId: null, collapsed: false,
            spells: [{ id: 'sp1', name: 'A', values: {} }] },
        ], attributes: [], sortBy: null, sortDir: 'asc',
      },
    };
    ensureSpellContent(data);
    const spell = data.content.categories[0].spells[0];
    expect(spell.slotCost).toBeNull();
    expect(spell.canUpcast).toBe(false);
    expect(spell.preparedCount).toBe(0);
    expect(spell.castsUsed).toBe(0);
  });

  it('does not overwrite valid sortBy when content is already migrated', () => {
    const data = {
      content: {
        autoSpendSlots: true, showSlotErrors: true,
        resourcePools: [], categories: [], attributes: [],
        sortBy: '__name__', sortDir: 'desc',
      },
    };
    ensureSpellContent(data);
    expect(data.content.sortBy).toBe('__name__');
    expect(data.content.sortDir).toBe('desc');
  });
});

describe('getSortedSpells', () => {
  const attrId = 'attr_dmg';
  function makeContent(sortBy = null, sortDir = 'asc') {
    return {
      sortBy,
      sortDir,
      attributes: [{ id: attrId, name: 'Damage', type: 'text', defaultValue: '' }],
    };
  }

  const spells = [
    { id: 'sp1', name: 'Zap',   order: 2, values: { [attrId]: 'c' } },
    { id: 'sp2', name: 'Arrow', order: 0, values: { [attrId]: 'a' } },
    { id: 'sp3', name: 'Bolt',  order: 1, values: { [attrId]: 'b' } },
  ];

  it('sorts by manual order when sortBy is null', () => {
    const result = getSortedSpells(makeContent(null), spells);
    expect(result.map(s => s.id)).toEqual(['sp2', 'sp3', 'sp1']);
  });

  it('sorts by name ascending', () => {
    const result = getSortedSpells(makeContent('__name__', 'asc'), spells);
    expect(result.map(s => s.name)).toEqual(['Arrow', 'Bolt', 'Zap']);
  });

  it('sorts by name descending', () => {
    const result = getSortedSpells(makeContent('__name__', 'desc'), spells);
    expect(result.map(s => s.name)).toEqual(['Zap', 'Bolt', 'Arrow']);
  });

  it('sorts by text attribute ascending', () => {
    const result = getSortedSpells(makeContent(attrId, 'asc'), spells);
    expect(result.map(s => s.values[attrId])).toEqual(['a', 'b', 'c']);
  });

  it('sorts by text attribute descending', () => {
    const result = getSortedSpells(makeContent(attrId, 'desc'), spells);
    expect(result.map(s => s.values[attrId])).toEqual(['c', 'b', 'a']);
  });

  it('sorts by number attribute type numerically', () => {
    const numContent = {
      sortBy: attrId, sortDir: 'asc',
      attributes: [{ id: attrId, name: 'AC', type: 'number', defaultValue: '0' }],
    };
    const numSpells = [
      { id: 'a', name: 'A', order: 0, values: { [attrId]: '10' } },
      { id: 'b', name: 'B', order: 1, values: { [attrId]: '2'  } },
      { id: 'c', name: 'C', order: 2, values: { [attrId]: '20' } },
    ];
    const result = getSortedSpells(numContent, numSpells);
    expect(result.map(s => s.values[attrId])).toEqual(['2', '10', '20']);
  });

  it('does not mutate the original array', () => {
    const orig = spells.slice();
    getSortedSpells(makeContent('__name__'), spells);
    expect(spells).toEqual(orig);
  });

  it('uses defaultValue for spells missing the attribute', () => {
    const result = getSortedSpells(makeContent(attrId, 'asc'), [
      { id: 'x', name: 'X', order: 0, values: {} },
      { id: 'y', name: 'Y', order: 1, values: { [attrId]: 'z' } },
    ]);
    expect(result[0].id).toBe('x');
  });
});

describe('spellsIsSupported', () => {
  it.each(['dnd5e', 'pf2e', 'custom'])('returns true for %s', (sys) => {
    expect(spellsIsSupported(sys)).toBe(true);
  });

  it.each(['coc', 'vtm', 'sr6', 'cpred', 'mothership', 'daggerheart'])('returns false for %s', (sys) => {
    expect(spellsIsSupported(sys)).toBe(false);
  });
});

describe('spellsComputeAttackBonus', () => {
  beforeEach(() => {
    window.getAbilityModifierFrom = vi.fn().mockReturnValue(3);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    window.computePf2eProficiencyBonus = vi.fn().mockReturnValue(4);
    window.gameSystem = 'dnd5e';
  });

  it('returns the override directly when set', () => {
    expect(spellsComputeAttackBonus({ spellAttackOverride: 7, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: null, spellProficiencyRank: 'untrained' })).toBe(7);
  });

  it('computes 5e formula: ability mod + prof bonus', () => {
    window.gameSystem = 'dnd5e';
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(5); // 3 + 2
    expect(window.getAbilityModifierFrom).toHaveBeenCalledWith('Wisdom', 'mod1');
  });

  it('computes pf2e formula: ability mod + pf2e prof bonus', () => {
    window.gameSystem = 'pf2e';
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Intelligence', linkedStatModuleId: 'mod1', spellProficiencyRank: 'expert' };
    expect(spellsComputeAttackBonus(content)).toBe(7); // 3 + 4
    expect(window.computePf2eProficiencyBonus).toHaveBeenCalledWith('expert');
  });

  it('returns null for unsupported systems', () => {
    window.gameSystem = 'vtm';
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wits', linkedStatModuleId: null, spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBeNull();
  });

  it('uses 0 for ability mod when no casting ability is set', () => {
    window.gameSystem = 'dnd5e';
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: null, linkedStatModuleId: null, spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(2); // 0 + 2
  });

  it('uses 0 for ability mod when getAbilityModifierFrom returns null', () => {
    window.gameSystem = 'dnd5e';
    window.getAbilityModifierFrom = vi.fn().mockReturnValue(null);
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(2); // 0 + 2
  });

  it('falls through to computed when spellAttackOverride is empty string', () => {
    window.gameSystem = 'dnd5e';
    const content = { spellAttackOverride: '', spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(5); // computes 3+2, not Number('')=0
  });

  it('uses fallback proficiency 2 when getProficiencyBonus is not a function', () => {
    window.gameSystem = 'dnd5e';
    window.getProficiencyBonus = undefined;
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: null, linkedStatModuleId: null, spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(2); // 0 + 2 fallback
  });

  it('uses fallback 0 when getAbilityModifierFrom is not a function', () => {
    window.gameSystem = 'dnd5e';
    window.getAbilityModifierFrom = undefined;
    const content = { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained' };
    expect(spellsComputeAttackBonus(content)).toBe(2); // 0 ability + 2 prof
  });
});

describe('spellsComputeSpellDC', () => {
  beforeEach(() => {
    window.getAbilityModifierFrom = vi.fn().mockReturnValue(3);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    window.computePf2eProficiencyBonus = vi.fn().mockReturnValue(4);
    window.gameSystem = 'dnd5e';
  });

  function baseContent(overrides = {}) {
    return { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained', ...overrides };
  }

  it('uses base 8 for 5e: 8 + attack (3+2=5) = 13', () => {
    window.gameSystem = 'dnd5e';
    expect(spellsComputeSpellDC(baseContent())).toBe(13);
  });

  it('uses base 10 for pf2e: 10 + attack (3+4=7) = 17', () => {
    window.gameSystem = 'pf2e';
    expect(spellsComputeSpellDC(baseContent({ spellProficiencyRank: 'expert' }))).toBe(17);
  });

  it('returns the DC override directly when set', () => {
    expect(spellsComputeSpellDC(baseContent({ spellDCOverride: 20 }))).toBe(20);
  });

  it('returns null for unsupported systems', () => {
    window.gameSystem = 'coc';
    expect(spellsComputeSpellDC(baseContent())).toBeNull();
  });

  it('falls through to computed when spellDCOverride is empty string', () => {
    window.gameSystem = 'dnd5e';
    expect(spellsComputeSpellDC(baseContent({ spellDCOverride: '' }))).toBe(13); // 8 + 5
  });
});

describe('spellsFormatAttackBonus and spellsFormatDC', () => {
  beforeEach(() => {
    window.getAbilityModifierFrom = vi.fn().mockReturnValue(3);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    window.computePf2eProficiencyBonus = vi.fn().mockReturnValue(0);
    window.gameSystem = 'dnd5e';
  });

  function baseContent(overrides = {}) {
    return { spellAttackOverride: null, spellDCOverride: null, spellcastingAbility: 'Wisdom', linkedStatModuleId: 'mod1', spellProficiencyRank: 'untrained', ...overrides };
  }

  it('formats positive attack bonus with leading +', () => {
    expect(spellsFormatAttackBonus(baseContent())).toBe('+5');
  });

  it('formats negative attack bonus without leading +', () => {
    window.getAbilityModifierFrom = vi.fn().mockReturnValue(-4);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    expect(spellsFormatAttackBonus(baseContent())).toBe('-2');
  });

  it('formats DC as plain number string', () => {
    expect(spellsFormatDC(baseContent())).toBe('13');
  });

  it('returns -- for unsupported system', () => {
    window.gameSystem = 'vtm';
    expect(spellsFormatAttackBonus(baseContent())).toBe('--');
    expect(spellsFormatDC(baseContent())).toBe('--');
  });
});

describe('ensureSpellContent — new Phase 1 fields', () => {
  it('migrates missing linkedStatModuleId to null', () => {
    const data = { content: { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.linkedStatModuleId).toBeNull();
  });

  it('migrates missing spellcastingAbility to null', () => {
    const data = { content: { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.spellcastingAbility).toBeNull();
  });

  it('migrates missing spellProficiencyRank to untrained', () => {
    const data = { content: { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.spellProficiencyRank).toBe('untrained');
  });

  it('migrates missing overrides to null', () => {
    const data = { content: { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.spellAttackOverride).toBeNull();
    expect(data.content.spellDCOverride).toBeNull();
  });

  it('preserves existing override values', () => {
    const data = { content: { autoSpendSlots: true, showSlotErrors: true, slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc', spellAttackOverride: 9, spellDCOverride: 18, spellProficiencyRank: 'master', spellcastingAbility: 'Intelligence', linkedStatModuleId: 'abc' } };
    ensureSpellContent(data);
    expect(data.content.spellAttackOverride).toBe(9);
    expect(data.content.spellDCOverride).toBe(18);
    expect(data.content.spellProficiencyRank).toBe('master');
    expect(data.content.spellcastingAbility).toBe('Intelligence');
    expect(data.content.linkedStatModuleId).toBe('abc');
  });
});

describe('castSpell', () => {
  function makeModuleEl() {
    const el = document.createElement('div');
    el.className = 'module';
    const body = document.createElement('div');
    body.className = 'module-body';
    el.appendChild(body);
    return el;
  }

  function makeData(catOverrides = {}, resourcePools = [{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 3, spent: 0 }]) {
    return {
      id: 'mod1',
      content: {
        autoSpendSlots: true,
        showSlotErrors: true,
        resourcePools,
        attributes: [],
        categories: [{ id: 'cat1', resourcePoolId: 'rp1', spells: [], ...catOverrides }],
      },
    };
  }

  beforeEach(() => {
    window.MODULE_TYPES['spells'] = { renderBody: vi.fn() };
    window.pendingRolls = {};
    window.logActivity = vi.fn().mockReturnValue('logId123');
  });

  it('blocks cast and shows a toast when no slots remain and showSlotErrors is true', () => {
    const data = makeData({}, [{ id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 2, spent: 2 }]);
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {}, slotCost: null }, 'cat1');
    expect(showToast).toHaveBeenCalled();
    expect(window.logActivity).not.toHaveBeenCalled();
  });

  it('spends a slot immediately when there are no dice rolls (no-dice fix)', () => {
    const data = makeData();
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Cantrip', values: {}, slotCost: null }, 'cat1');
    expect(data.content.resourcePools[0].spent).toBe(1);
    expect(window.logActivity).toHaveBeenCalled();
    expect(scheduleSave).toHaveBeenCalled();
  });

  it('logs activity when autoSpendSlots is false', () => {
    const data = makeData();
    data.content.autoSpendSlots = false;
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {}, slotCost: null }, 'cat1');
    expect(window.logActivity).toHaveBeenCalled();
    expect(data.content.resourcePools[0].spent).toBe(0);
  });

  it('logs activity for cantrips (resourcePoolId null) without slot pre-check', () => {
    const data = makeData({ resourcePoolId: null }, []);
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Light', values: {}, slotCost: null }, 'cat1');
    expect(window.logActivity).toHaveBeenCalled();
  });

  it('is a no-op when the category does not exist', () => {
    const data = makeData();
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {} }, 'nonexistent');
    expect(window.logActivity).not.toHaveBeenCalled();
    expect(scheduleSave).not.toHaveBeenCalled();
  });

  it('spends from overridePoolId pool, ignoring cat.resourcePoolId', () => {
    const data = makeData(
      {},
      [
        { id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 3, spent: 0 },
        { id: 'rp2', type: 'spell-slot', level: 2, name: null, max: 2, spent: 0 },
      ]
    );
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {}, slotCost: null }, 'cat1', 'rp2');
    expect(data.content.resourcePools[0].spent).toBe(0);
    expect(data.content.resourcePools[1].spent).toBe(1);
  });

  it('blocks cast when overridePoolId pool is depleted', () => {
    const data = makeData(
      {},
      [
        { id: 'rp1', type: 'spell-slot', level: 1, name: null, max: 3, spent: 0 },
        { id: 'rp2', type: 'spell-slot', level: 2, name: null, max: 2, spent: 2 },
      ]
    );
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {}, slotCost: null }, 'cat1', 'rp2');
    expect(showToast).toHaveBeenCalled();
    expect(window.logActivity).not.toHaveBeenCalled();
  });

  it('blocks cast for prepared caster when preparedCount is 0', () => {
    const data = makeData();
    data.content.casterType = 'prepared';
    const spell = { id: 's1', name: 'Fireball', values: {}, slotCost: null, preparedCount: 0, castsUsed: 0, canUpcast: false };
    castSpell(makeModuleEl(), data, spell, 'cat1');
    expect(showToast).toHaveBeenCalledWith('This spell is not prepared.', 'error');
    expect(window.logActivity).not.toHaveBeenCalled();
  });

  it('blocks cast for prepared caster when castsUsed >= preparedCount', () => {
    const data = makeData();
    data.content.casterType = 'prepared';
    const spell = { id: 's1', name: 'Fireball', values: {}, slotCost: null, preparedCount: 2, castsUsed: 2, canUpcast: false };
    castSpell(makeModuleEl(), data, spell, 'cat1');
    expect(showToast).toHaveBeenCalledWith('No prepared uses remaining.', 'error');
    expect(window.logActivity).not.toHaveBeenCalled();
  });

  it('allows cast for prepared caster when castsUsed < preparedCount', () => {
    const data = makeData();
    data.content.casterType = 'prepared';
    const spell = { id: 's1', name: 'Fireball', values: {}, slotCost: null, preparedCount: 3, castsUsed: 1, canUpcast: false };
    castSpell(makeModuleEl(), data, spell, 'cat1');
    expect(window.logActivity).toHaveBeenCalled();
  });

  it('increments castsUsed on no-dice cast for prepared caster', () => {
    const data = makeData();
    data.content.casterType = 'prepared';
    const spell = { id: 's1', name: 'Cantrip', values: {}, slotCost: null, preparedCount: 2, castsUsed: 0, canUpcast: false };
    castSpell(makeModuleEl(), data, spell, 'cat1');
    expect(spell.castsUsed).toBe(1);
    expect(scheduleSave).toHaveBeenCalled();
  });

  it('increments castsUsed even for free-category spells (no pool) in prepared mode', () => {
    const data = makeData({ resourcePoolId: null }, []);
    data.content.casterType = 'prepared';
    const spell = { id: 's1', name: 'Cantrip', values: {}, slotCost: null, preparedCount: 1, castsUsed: 0, canUpcast: false };
    castSpell(makeModuleEl(), data, spell, 'cat1');
    expect(spell.castsUsed).toBe(1);
  });
});

describe('findSpellInModule', () => {
  function makeModuleData(spells = []) {
    return {
      content: {
        categories: [{ id: 'cat1', spells }],
      },
    };
  }

  it('returns the spell when found', () => {
    const spell = { id: 'sp1', name: 'Fireball' };
    const data = makeModuleData([spell]);
    expect(findSpellInModule(data, 'cat1', 'sp1')).toBe(spell);
  });

  it('returns null for missing category', () => {
    const data = makeModuleData([{ id: 'sp1', name: 'Fireball' }]);
    expect(findSpellInModule(data, 'bad-cat', 'sp1')).toBeNull();
  });

  it('returns null for missing spell', () => {
    const data = makeModuleData([{ id: 'sp1', name: 'Fireball' }]);
    expect(findSpellInModule(data, 'cat1', 'bad-spell')).toBeNull();
  });
});
