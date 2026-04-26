import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
  setupMinimalDOM();

  window.modules = [];
  window.moduleIdCounter = 0;
  window.activityLog = [];
  window.pendingRolls = {};
  window.isPlayMode = false;

  globalThis.scheduleSave = vi.fn();
  globalThis.MODULE_TYPES = {};
  globalThis.renderModule = vi.fn();
  globalThis.updateEmptyState = vi.fn();
  globalThis.logActivity = vi.fn();

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
  loadScript('scripts/module-stat.js');
  loadScript('scripts/module-weapons.js');
  loadScript('scripts/module-activity.js');
});

// ── getStatValue ──
describe('getStatValue', () => {
  it('returns null when no modules', () => {
    window.modules = [];
    expect(window.getStatValue('STR')).toBeNull();
  });

  it('returns null for empty name', () => {
    expect(window.getStatValue('')).toBeNull();
    expect(window.getStatValue(null)).toBeNull();
  });

  it('finds a stat by name (case-insensitive)', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'STR', value: 16, modifier: 3 }] },
    }];
    expect(window.getStatValue('STR')).toBe(16);
    expect(window.getStatValue('str')).toBe(16);
    expect(window.getStatValue('Str')).toBe(16);
  });

  it('returns null when stat exists but value is not a number', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'STR', value: 'high' }] },
    }];
    expect(window.getStatValue('STR')).toBeNull();
  });

  it('returns null for a stat that does not exist', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'STR', value: 10 }] },
    }];
    expect(window.getStatValue('DEX')).toBeNull();
  });

  it('returns value 0 correctly (not treated as null)', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'DEX', value: 0 }] },
    }];
    expect(window.getStatValue('DEX')).toBe(0);
  });

  it('searches across multiple stat modules', () => {
    window.modules = [
      { id: 'm1', type: 'stat', content: { stats: [{ name: 'STR', value: 10 }] } },
      { id: 'm2', type: 'stat', content: { stats: [{ name: 'Firearms', value: 4 }] } },
    ];
    expect(window.getStatValue('Firearms')).toBe(4);
  });

  it('ignores non-stat modules', () => {
    window.modules = [
      { id: 'm1', type: 'health', content: { stats: [{ name: 'STR', value: 99 }] } },
    ];
    expect(window.getStatValue('STR')).toBeNull();
  });
});

// ── getAllStatNames ──
describe('getAllStatNames', () => {
  it('returns empty array when no modules', () => {
    window.modules = [];
    expect(window.getAllStatNames()).toEqual([]);
  });

  it('returns sorted stat names', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [
        { name: 'Strength', value: 10 },
        { name: 'Agility', value: 8 },
      ]},
    }];
    expect(window.getAllStatNames()).toEqual(['Agility', 'Strength']);
  });

  it('deduplicates names across modules', () => {
    window.modules = [
      { id: 'm1', type: 'stat', content: { stats: [{ name: 'STR', value: 10 }] } },
      { id: 'm2', type: 'stat', content: { stats: [{ name: 'STR', value: 12 }] } },
    ];
    expect(window.getAllStatNames()).toEqual(['STR']);
  });

  it('excludes proficiency stats', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [
        { name: 'STR', value: 10 },
        { name: 'Proficiency', value: 3, isProficiencyStat: true },
      ]},
    }];
    expect(window.getAllStatNames()).toEqual(['STR']);
  });

  it('ignores non-stat modules', () => {
    window.modules = [
      { id: 'm1', type: 'weapons', content: { stats: [{ name: 'STR', value: 10 }] } },
    ];
    expect(window.getAllStatNames()).toEqual([]);
  });
});

// ── weaponsComputeEffectivePool ──
describe('weaponsComputeEffectivePool', () => {
  it('returns poolSize when poolAutoCompute is false', () => {
    const weapon = { poolAutoCompute: false, poolSize: 7, poolAttribute: 'STR', poolSkill: 'Firearms', poolAdjustment: null, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(7);
  });

  it('returns 0 for null poolSize when poolAutoCompute is false', () => {
    const weapon = { poolAutoCompute: false, poolSize: null, poolAttribute: null, poolSkill: null, poolAdjustment: null, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(0);
  });

  it('falls back to poolSize when both stats are null', () => {
    window.modules = [];
    const weapon = { poolAutoCompute: true, poolSize: 5, poolAttribute: 'Missing', poolSkill: 'AlsoMissing', poolAdjustment: null, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(5);
  });

  it('computes base from attribute + skill values', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [
        { name: 'Agility', value: 5 },
        { name: 'Firearms', value: 4 },
      ]},
    }];
    const weapon = { poolAutoCompute: true, poolSize: 0, poolAttribute: 'Agility', poolSkill: 'Firearms', poolAdjustment: null, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(9);
  });

  it('applies poolAdjustment when auto-computing', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [
        { name: 'Agility', value: 5 },
        { name: 'Firearms', value: 3 },
      ]},
    }];
    const weapon = { poolAutoCompute: true, poolSize: 0, poolAttribute: 'Agility', poolSkill: 'Firearms', poolAdjustment: -2, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(6);
  });

  it('clamps result to 0 minimum', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'Agility', value: 1 }] },
    }];
    const weapon = { poolAutoCompute: true, poolSize: 0, poolAttribute: 'Agility', poolSkill: null, poolAdjustment: -10, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(0);
  });

  it('handles only one stat being valid', () => {
    window.modules = [{
      id: 'm1', type: 'stat',
      content: { stats: [{ name: 'Agility', value: 5 }] },
    }];
    const weapon = { poolAutoCompute: true, poolSize: 0, poolAttribute: 'Agility', poolSkill: 'MissingSkill', poolAdjustment: null, attachedEnhancements: null };
    expect(window.weaponsComputeEffectivePool(weapon, null)).toBe(5);
  });
});

// ── extractDieFaces ──
describe('extractDieFaces', () => {
  it('returns empty array for null', () => {
    expect(window.extractDieFaces(null)).toEqual([]);
  });

  it('returns empty array for non-object', () => {
    expect(window.extractDieFaces(42)).toEqual([]);
    expect(window.extractDieFaces('abc')).toEqual([]);
  });

  it('extracts results from a rollResult node', () => {
    const node = { kind: 'd10', results: [6, 9, 3, 10] };
    expect(window.extractDieFaces(node)).toEqual([6, 9, 3, 10]);
  });

  it('walks operands tree recursively', () => {
    const node = {
      operands: [
        { kind: 'd6', results: [4, 5] },
        { kind: 'd6', results: [1, 6] },
      ],
    };
    expect(window.extractDieFaces(node)).toEqual([4, 5, 1, 6]);
  });

  it('handles nested operands', () => {
    const node = {
      operands: [
        {
          operands: [
            { kind: 'd10', results: [8] },
          ],
        },
        { kind: 'd10', results: [2] },
      ],
    };
    expect(window.extractDieFaces(node)).toEqual([8, 2]);
  });

  it('returns a copy, not the original array', () => {
    const original = [5, 7];
    const node = { kind: 'd10', results: original };
    const result = window.extractDieFaces(node);
    result.push(99);
    expect(original).toEqual([5, 7]);
  });
});
