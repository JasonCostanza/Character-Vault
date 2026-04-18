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
  loadScript('scripts/module-savingthrow.js');
});

describe('formatModifier', () => {
  it('prefixes positive numbers with +', () => {
    expect(window.formatModifier(3)).toBe('+3');
  });

  it('preserves the minus sign for negative numbers', () => {
    expect(window.formatModifier(-2)).toBe('-2');
  });

  it('returns +0 for zero', () => {
    expect(window.formatModifier(0)).toBe('+0');
  });

  it('returns +0 for non-numeric input', () => {
    expect(window.formatModifier('abc')).toBe('+0');
    expect(window.formatModifier(undefined)).toBe('+0');
  });
});

describe('applySavingThrowTemplate', () => {
  it('returns 6 saves for dnd5e', () => {
    const saves = window.applySavingThrowTemplate('dnd5e');
    expect(saves).toHaveLength(6);
  });

  it('returns 3 saves for pf2e', () => {
    const saves = window.applySavingThrowTemplate('pf2e');
    expect(saves).toHaveLength(3);
  });

  it('returns [] for unknown template key', () => {
    expect(window.applySavingThrowTemplate('unknown')).toEqual([]);
  });

  it('each save has the required shape', () => {
    const saves = window.applySavingThrowTemplate('dnd5e');
    saves.forEach((s) => {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(s.value).toBe(0);
      expect(s.proficiencyTier).toBeNull();
    });
  });

  it('generates unique IDs across all saves in a template', () => {
    const saves = window.applySavingThrowTemplate('dnd5e');
    const ids = saves.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('applyTierPreset', () => {
  it('returns 1 tier for dnd5e', () => {
    expect(window.applyTierPreset('dnd5e')).toHaveLength(1);
  });

  it('returns 5 tiers for pf2e', () => {
    expect(window.applyTierPreset('pf2e')).toHaveLength(5);
  });

  it('returns 4 tiers for simple', () => {
    expect(window.applyTierPreset('simple')).toHaveLength(4);
  });

  it('returns [] for unknown key', () => {
    expect(window.applyTierPreset('unknown')).toEqual([]);
  });

  it('each tier has name, letter, and color', () => {
    const tiers = window.applyTierPreset('simple');
    tiers.forEach((tier) => {
      expect(typeof tier.name).toBe('string');
      expect(typeof tier.letter).toBe('string');
      expect(typeof tier.color).toBe('string');
    });
  });
});

describe('ensureSaveContent', () => {
  it('initializes when content is null', () => {
    const data = { content: null };
    const content = window.ensureSaveContent(data);
    expect(Array.isArray(content.saves)).toBe(true);
    expect(typeof content.notes).toBe('string');
    expect(typeof content.tiersEnabled).toBe('boolean');
    expect(Array.isArray(content.tiers)).toBe(true);
  });

  it('initializes when content is a string', () => {
    const data = { content: 'old' };
    const content = window.ensureSaveContent(data);
    expect(Array.isArray(content.saves)).toBe(true);
  });

  it('fills in missing fields on partial object', () => {
    const data = {
      content: { saves: [{ id: 'a', name: 'STR', value: 2, proficiencyTier: null }] },
    };
    const content = window.ensureSaveContent(data);
    expect(content.saves).toHaveLength(1);
    expect(typeof content.notes).toBe('string');
    expect(typeof content.tiersEnabled).toBe('boolean');
  });

  it('migrates dnd5e: replaces "Not Proficient" proficiencyTier with null', () => {
    const data = {
      content: {
        saves: [{ id: 'a', name: 'STR', value: 0, proficiencyTier: 'Not Proficient' }],
        notes: '',
        tiersEnabled: false,
        tiers: [],
        tierPreset: 'dnd5e',
      },
    };
    window.ensureSaveContent(data);
    expect(data.content.saves[0].proficiencyTier).toBeNull();
  });

  it('migrates dnd5e: replaces tiers with the dnd5e preset', () => {
    const data = {
      content: {
        saves: [],
        notes: '',
        tiersEnabled: false,
        tiers: [{ name: 'Old Tier', letter: 'O', color: '#ffffff' }],
        tierPreset: 'dnd5e',
      },
    };
    window.ensureSaveContent(data);
    expect(data.content.tiers).toEqual(window.applyTierPreset('dnd5e'));
  });
});

describe('getTierForSave', () => {
  const tiers = [
    { name: 'Trained', letter: 'T', color: '#22aa44' },
    { name: 'Expert', letter: 'E', color: '#3388dd' },
  ];

  it('returns the matching tier when proficiencyTier is set', () => {
    const save = { proficiencyTier: 'Trained' };
    expect(window.getTierForSave(save, tiers)).toEqual(tiers[0]);
  });

  it('returns null when proficiencyTier is null', () => {
    const save = { proficiencyTier: null };
    expect(window.getTierForSave(save, tiers)).toBeNull();
  });

  it('returns null when no tier name matches', () => {
    const save = { proficiencyTier: 'Master' };
    expect(window.getTierForSave(save, tiers)).toBeNull();
  });
});

describe('saveNotesCheckboxProxy', () => {
  it('getter returns the current notes content', () => {
    const data = { content: { notes: 'My notes' } };
    const proxy = window.saveNotesCheckboxProxy(data);
    expect(proxy.content).toBe('My notes');
  });

  it('setter updates notes on the data object', () => {
    const data = { content: { notes: '' } };
    const proxy = window.saveNotesCheckboxProxy(data);
    proxy.content = 'Updated notes';
    expect(data.content.notes).toBe('Updated notes');
  });

  it('getter returns empty string when notes is null', () => {
    const data = { content: { notes: null } };
    const proxy = window.saveNotesCheckboxProxy(data);
    expect(proxy.content).toBe('');
  });
});
