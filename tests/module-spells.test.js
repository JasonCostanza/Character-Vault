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
    expect(Array.isArray(c.slotLevels)).toBe(true);
    expect(Array.isArray(c.categories)).toBe(true);
    expect(typeof c.autoSpendSlots).toBe('boolean');
    expect(typeof c.showSlotErrors).toBe('boolean');
  });

  it('returns a fresh object each call — not a shared reference', () => {
    const a = spellsDefaultContent();
    const b = spellsDefaultContent();
    a.categories.push({ id: 'x' });
    expect(b.categories).toHaveLength(0);
  });
});

describe('getAvailableSlots', () => {
  function makeData(slotLevels) {
    return { content: { slotLevels } };
  }

  it('returns remaining slots for a normal level', () => {
    const data = makeData([{ level: 1, max: 4, spent: 1 }]);
    expect(getAvailableSlots(data, 1)).toBe(3);
  });

  it('returns 0 when all slots are spent', () => {
    const data = makeData([{ level: 1, max: 3, spent: 3 }]);
    expect(getAvailableSlots(data, 1)).toBe(0);
  });

  it('clamps to 0 when spent exceeds max', () => {
    const data = makeData([{ level: 1, max: 2, spent: 5 }]);
    expect(getAvailableSlots(data, 1)).toBe(0);
  });

  it('returns 0 for a level that does not exist', () => {
    const data = makeData([]);
    expect(getAvailableSlots(data, 3)).toBe(0);
  });
});

describe('spendSlot', () => {
  function makeData(slotLevels) {
    return { content: { slotLevels } };
  }

  it('increments the spent count', () => {
    const data = makeData([{ level: 1, max: 4, spent: 0 }]);
    spendSlot(data, 1);
    expect(data.content.slotLevels[0].spent).toBe(1);
  });

  it('does not increment beyond max', () => {
    const data = makeData([{ level: 1, max: 2, spent: 2 }]);
    spendSlot(data, 1);
    expect(data.content.slotLevels[0].spent).toBe(2);
  });

  it('is a no-op for a missing slot level', () => {
    const data = makeData([{ level: 2, max: 3, spent: 0 }]);
    spendSlot(data, 99);
    expect(data.content.slotLevels[0].spent).toBe(0);
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
    expect(Array.isArray(data.content.slotLevels)).toBe(true);
    expect(Array.isArray(data.content.attributes)).toBe(true);
    expect(data.content.sortBy).toBeNull();
  });

  it('fills in missing boolean fields', () => {
    const data = { content: { slotLevels: [], categories: [], attributes: [], sortBy: null, sortDir: 'asc' } };
    ensureSpellContent(data);
    expect(data.content.autoSpendSlots).toBe(true);
    expect(data.content.showSlotErrors).toBe(true);
  });

  it('runs migration when a spell has legacy attributes array', () => {
    const data = {
      content: {
        autoSpendSlots: true,
        showSlotErrors: true,
        slotLevels: [],
        categories: [
          { id: 'cat1', name: 'C', slotLevel: null, collapsed: false,
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

  it('does not overwrite valid sortBy when content is already migrated', () => {
    const data = {
      content: {
        autoSpendSlots: true, showSlotErrors: true,
        slotLevels: [], categories: [], attributes: [],
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

describe('castSpell', () => {
  function makeModuleEl() {
    const el = document.createElement('div');
    el.className = 'module';
    const body = document.createElement('div');
    body.className = 'module-body';
    el.appendChild(body);
    return el;
  }

  function makeData(catOverrides = {}, slotLevels = [{ level: 1, max: 3, spent: 0 }]) {
    return {
      id: 'mod1',
      content: {
        autoSpendSlots: true,
        showSlotErrors: true,
        slotLevels,
        attributes: [],
        categories: [{ id: 'cat1', slotLevel: 1, spells: [], ...catOverrides }],
      },
    };
  }

  beforeEach(() => {
    window.MODULE_TYPES['spells'] = { renderBody: vi.fn() };
    window.pendingRolls = {};
    window.logActivity = vi.fn().mockReturnValue('logId123');
  });

  it('blocks cast and shows a toast when no slots remain and showSlotErrors is true', () => {
    const data = makeData({}, [{ level: 1, max: 2, spent: 2 }]);
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {} }, 'cat1');
    expect(showToast).toHaveBeenCalled();
    expect(window.logActivity).not.toHaveBeenCalled();
  });

  it('does not spend a slot immediately — defers to roll resolution', () => {
    const data = makeData();
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {} }, 'cat1');
    expect(data.content.slotLevels[0].spent).toBe(0);
    expect(window.logActivity).toHaveBeenCalled();
    expect(scheduleSave).not.toHaveBeenCalled();
  });

  it('logs activity when autoSpendSlots is false', () => {
    const data = makeData();
    data.content.autoSpendSlots = false;
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {} }, 'cat1');
    expect(window.logActivity).toHaveBeenCalled();
    expect(data.content.slotLevels[0].spent).toBe(0);
  });

  it('logs activity for cantrips (slotLevel null) without slot pre-check', () => {
    const data = makeData({ slotLevel: null }, []);
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Light', values: {} }, 'cat1');
    expect(window.logActivity).toHaveBeenCalled();
  });

  it('is a no-op when the category does not exist', () => {
    const data = makeData();
    castSpell(makeModuleEl(), data, { id: 's1', name: 'Fireball', values: {} }, 'nonexistent');
    expect(window.logActivity).not.toHaveBeenCalled();
    expect(scheduleSave).not.toHaveBeenCalled();
  });
});
