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
  loadScript('scripts/module-resistance.js');
});

describe('ensureResContent', () => {
  it('initializes when content is null', () => {
    const data = { content: null };
    const content = ensureResContent(data);
    expect(content.immunities).toEqual([]);
    expect(content.resistances).toEqual([]);
    expect(content.weaknesses).toEqual([]);
    expect(content.customTypes).toEqual([]);
    expect(content.layout).toBe('columns');
  });

  it('initializes when content is a string', () => {
    const data = { content: 'old string' };
    const content = ensureResContent(data);
    expect(Array.isArray(content.immunities)).toBe(true);
  });

  it('fills in missing arrays on partial content', () => {
    const data = { content: { layout: 'rows', immunities: [{ id: 'x', typeKey: 'fire' }] } };
    const content = ensureResContent(data);
    expect(content.immunities).toHaveLength(1);
    expect(content.resistances).toEqual([]);
    expect(content.weaknesses).toEqual([]);
    expect(content.customTypes).toEqual([]);
    expect(content.layout).toBe('rows');
  });

  it('preserves existing arrays', () => {
    const data = {
      content: {
        layout: 'columns',
        immunities: [{ id: 'a', typeKey: 'fire' }],
        resistances: [{ id: 'b', typeKey: 'cold' }],
        weaknesses: [],
        customTypes: [],
      },
    };
    const content = ensureResContent(data);
    expect(content.immunities).toHaveLength(1);
    expect(content.resistances).toHaveLength(1);
  });
});

describe('getResName', () => {
  const baseContent = { customTypes: [] };

  it('returns translated name for predefined type', () => {
    const item = { typeKey: 'fire' };
    const name = getResName(item, baseContent);
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  it('returns custom type name for custom type', () => {
    const content = { customTypes: [{ key: 'my_custom', name: 'Shadow Damage' }] };
    const item = { typeKey: 'my_custom' };
    expect(getResName(item, content)).toBe('Shadow Damage');
  });

  it('returns typeKey as raw fallback when not predefined or custom', () => {
    const item = { typeKey: 'unknown_type' };
    expect(getResName(item, baseContent)).toBe('unknown_type');
  });

  it('returns "?" when typeKey is falsy', () => {
    const item = { typeKey: '' };
    expect(getResName(item, baseContent)).toBe('?');
  });
});

describe('getAssignedKeys', () => {
  it('returns empty array when all columns are empty', () => {
    const content = { immunities: [], resistances: [], weaknesses: [] };
    expect(getAssignedKeys(content)).toEqual([]);
  });

  it('flattens all three columns into a single array of typeKeys', () => {
    const content = {
      immunities: [{ typeKey: 'fire' }],
      resistances: [{ typeKey: 'cold' }],
      weaknesses: [{ typeKey: 'acid' }],
    };
    const keys = getAssignedKeys(content);
    expect(keys).toContain('fire');
    expect(keys).toContain('cold');
    expect(keys).toContain('acid');
    expect(keys).toHaveLength(3);
  });

  it('handles multiple items per column', () => {
    const content = {
      immunities: [{ typeKey: 'fire' }, { typeKey: 'cold' }],
      resistances: [],
      weaknesses: [],
    };
    expect(getAssignedKeys(content)).toHaveLength(2);
  });
});

describe('getAvailableTypes', () => {
  it('excludes already-assigned predefined types', () => {
    const content = {
      immunities: [{ typeKey: 'fire' }],
      resistances: [],
      weaknesses: [],
      customTypes: [],
    };
    const available = getAvailableTypes(content);
    expect(available.find((t) => t.key === 'fire')).toBeUndefined();
  });

  it('includes unassigned predefined types', () => {
    const content = { immunities: [], resistances: [], weaknesses: [], customTypes: [] };
    const available = getAvailableTypes(content);
    expect(available.find((t) => t.key === 'acid')).toBeDefined();
    expect(available.find((t) => t.key === 'fire')).toBeDefined();
  });

  it('includes unassigned custom types', () => {
    const content = {
      immunities: [],
      resistances: [],
      weaknesses: [],
      customTypes: [{ key: 'my_custom', name: 'Shadow', icon: null }],
    };
    const available = getAvailableTypes(content);
    expect(available.find((t) => t.key === 'my_custom')).toBeDefined();
  });

  it('excludes assigned custom types', () => {
    const content = {
      immunities: [{ typeKey: 'my_custom' }],
      resistances: [],
      weaknesses: [],
      customTypes: [{ key: 'my_custom', name: 'Shadow', icon: null }],
    };
    const available = getAvailableTypes(content);
    expect(available.find((t) => t.key === 'my_custom')).toBeUndefined();
  });

  it('returns items sorted alphabetically by name', () => {
    const content = { immunities: [], resistances: [], weaknesses: [], customTypes: [] };
    const available = getAvailableTypes(content);
    const names = available.map((t) => t.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});

describe('sortColumnAlpha', () => {
  it('sorts items in-place by resolved custom name', () => {
    const content = {
      customTypes: [
        { key: 'my_b', name: 'Bzzz' },
        { key: 'my_a', name: 'Ayyy' },
      ],
    };
    const arr = [{ typeKey: 'my_b' }, { typeKey: 'my_a' }];
    sortColumnAlpha(arr, content);
    expect(arr[0].typeKey).toBe('my_a');
    expect(arr[1].typeKey).toBe('my_b');
  });

  it('sorts predefined types by translated key name', () => {
    const content = { customTypes: [] };
    const arr = [{ typeKey: 'thunder' }, { typeKey: 'acid' }];
    sortColumnAlpha(arr, content);
    // t() returns the i18n key itself: 'res.typeAcid' < 'res.typeThunder'
    expect(arr[0].typeKey).toBe('acid');
  });
});

describe('addResistanceToColumn', () => {
  it('adds an item with correct shape', () => {
    const content = { immunities: [], resistances: [], weaknesses: [] };
    addResistanceToColumn(content, 'fire', 'immunities', 'Immune');
    expect(content.immunities).toHaveLength(1);
    const item = content.immunities[0];
    expect(item.typeKey).toBe('fire');
    expect(item.value).toBe('Immune');
    expect(item.active).toBe(true);
    expect(typeof item.id).toBe('string');
    expect(item.id.startsWith('res_')).toBe(true);
  });

  it('generates distinct IDs on successive calls', () => {
    const content = { resistances: [] };
    addResistanceToColumn(content, 'fire', 'resistances', '50%');
    addResistanceToColumn(content, 'cold', 'resistances', '25%');
    expect(content.resistances[0].id).not.toBe(content.resistances[1].id);
  });
});

describe('generateResId', () => {
  it('returns a string with res_ prefix', () => {
    const id = generateResId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('res_')).toBe(true);
  });

  it('returns distinct values on successive calls', () => {
    const id1 = generateResId();
    const id2 = generateResId();
    expect(id1).not.toBe(id2);
  });
});
