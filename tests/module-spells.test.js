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
        categories: [{ id: 'cat1', slotLevel: 1, spells: [], ...catOverrides }],
      },
    };
  }

  beforeEach(() => {
    window.MODULE_TYPES['spells'] = { renderBody: vi.fn() };
  });

  it('blocks cast and shows a toast when no slots remain and showSlotErrors is true', () => {
    const data = makeData({}, [{ level: 1, max: 2, spent: 2 }]);
    const onSuccess = vi.fn();
    castSpell(makeModuleEl(), data, {}, 'cat1', onSuccess);
    expect(showToast).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onSuccess and spends a slot when slots are available', () => {
    const data = makeData();
    const onSuccess = vi.fn();
    castSpell(makeModuleEl(), data, {}, 'cat1', onSuccess);
    expect(onSuccess).toHaveBeenCalled();
    expect(data.content.slotLevels[0].spent).toBe(1);
    expect(scheduleSave).toHaveBeenCalled();
  });

  it('calls onSuccess without spending a slot when autoSpendSlots is false', () => {
    const data = makeData();
    data.content.autoSpendSlots = false;
    const onSuccess = vi.fn();
    castSpell(makeModuleEl(), data, {}, 'cat1', onSuccess);
    expect(onSuccess).toHaveBeenCalled();
    expect(data.content.slotLevels[0].spent).toBe(0);
  });

  it('calls onSuccess when slotLevel is null — no slot cost', () => {
    const data = makeData({ slotLevel: null });
    const onSuccess = vi.fn();
    castSpell(makeModuleEl(), data, {}, 'cat1', onSuccess);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('is a no-op when the category does not exist', () => {
    const data = makeData();
    const onSuccess = vi.fn();
    castSpell(makeModuleEl(), data, {}, 'nonexistent', onSuccess);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(scheduleSave).not.toHaveBeenCalled();
  });
});
