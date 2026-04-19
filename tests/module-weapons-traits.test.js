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
  globalThis.logActivity = vi.fn();
  globalThis.pendingRolls = {};

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

  // Override t to echo keys so tests are independent of translation values.
  globalThis.t = vi.fn((key) => key);
});

describe('normalizeWeaponTraits', () => {
  it('leaves already-normalized entries untouched', () => {
    const content = { customWeaponTraits: [] };
    const input = [{ key: 'dnd5e.finesse', value: null }];
    const result = window.normalizeWeaponTraits(input, content);
    expect(result).toEqual([{ key: 'dnd5e.finesse', value: null }]);
  });

  it('converts legacy string array into keyed objects', () => {
    const content = { customWeaponTraits: [] };
    const result = window.normalizeWeaponTraits(['Finesse', 'Light'], content);
    expect(result).toEqual([
      { key: 'dnd5e.finesse', value: null },
      { key: 'dnd5e.light', value: null },
    ]);
  });

  it('matches canonical names case-insensitively and trims whitespace', () => {
    const content = { customWeaponTraits: [] };
    const result = window.normalizeWeaponTraits(['  FINESSE  ', 'REACH'], content);
    expect(result[0].key).toBe('dnd5e.finesse');
    expect(result[1].key).toBe('dnd5e.reach');
  });

  it('matches "Two-Handed", "two handed", "TWO-HANDED" to dnd5e.twoHanded', () => {
    const content = { customWeaponTraits: [] };
    expect(window.normalizeWeaponTraits(['Two-Handed'], content)[0].key).toBe('dnd5e.twoHanded');
    expect(window.normalizeWeaponTraits(['two handed'], content)[0].key).toBe('dnd5e.twoHanded');
    expect(window.normalizeWeaponTraits(['TWO-HANDED'], content)[0].key).toBe('dnd5e.twoHanded');
  });

  it('creates a custom trait for unknown strings and references by key', () => {
    const content = { customWeaponTraits: [] };
    const result = window.normalizeWeaponTraits(['Homebrew Bleed'], content);
    expect(result).toHaveLength(1);
    expect(result[0].key).toMatch(/^custom\./);
    expect(content.customWeaponTraits).toHaveLength(1);
    expect(content.customWeaponTraits[0].name).toBe('Homebrew Bleed');
  });

  it('reuses an existing custom trait when the same name is migrated twice', () => {
    const content = { customWeaponTraits: [] };
    const r1 = window.normalizeWeaponTraits(['Homebrew Bleed'], content);
    const r2 = window.normalizeWeaponTraits(['Homebrew Bleed'], content);
    expect(r1[0].key).toBe(r2[0].key);
    expect(content.customWeaponTraits).toHaveLength(1);
  });

  it('dedupes traits by key (first occurrence wins)', () => {
    const content = { customWeaponTraits: [] };
    const result = window.normalizeWeaponTraits(
      [{ key: 'dnd5e.finesse', value: null }, { key: 'dnd5e.finesse', value: null }],
      content
    );
    expect(result).toHaveLength(1);
  });

  it('returns an empty array when given null or undefined', () => {
    const content = { customWeaponTraits: [] };
    expect(window.normalizeWeaponTraits(null, content)).toEqual([]);
    expect(window.normalizeWeaponTraits(undefined, content)).toEqual([]);
  });
});

describe('resolveWeaponTrait', () => {
  it('resolves a canonical dnd5e.* key to name + description via t()', () => {
    const content = { customWeaponTraits: [] };
    const result = window.resolveWeaponTrait({ key: 'dnd5e.finesse', value: null }, content);
    expect(result.key).toBe('dnd5e.finesse');
    expect(result.isCustom).toBe(false);
    expect(result.takesValue).toBe(false);
    expect(globalThis.t).toHaveBeenCalledWith('weapons.trait.dnd5e.finesse');
    expect(globalThis.t).toHaveBeenCalledWith('weapons.trait.dnd5e.finesseDesc');
  });

  it('resolves a custom.* key via content.customWeaponTraits', () => {
    const content = {
      customWeaponTraits: [{ key: 'custom.wt_abc123', name: 'Homebrew Bleed', description: 'Deals bleed damage.' }],
    };
    const result = window.resolveWeaponTrait({ key: 'custom.wt_abc123', value: null }, content);
    expect(result.key).toBe('custom.wt_abc123');
    expect(result.name).toBe('Homebrew Bleed');
    expect(result.description).toBe('Deals bleed damage.');
    expect(result.isCustom).toBe(true);
    expect(result.takesValue).toBe(false);
  });

  it('returns a safe fallback shape for unknown keys', () => {
    const content = { customWeaponTraits: [] };
    const result = window.resolveWeaponTrait({ key: 'stale.oldkey', value: null }, content);
    expect(result.key).toBe('stale.oldkey');
    expect(result.name).toBe('stale.oldkey');
    expect(result.description).toBe('');
    expect(result.isCustom).toBe(false);
  });

  it('exposes takesValue correctly per canonical entry', () => {
    const content = { customWeaponTraits: [] };
    expect(window.resolveWeaponTrait({ key: 'dnd5e.versatile', value: null }, content).takesValue).toBe(true);
    expect(window.resolveWeaponTrait({ key: 'dnd5e.ammunition', value: null }, content).takesValue).toBe(true);
    expect(window.resolveWeaponTrait({ key: 'dnd5e.heavy', value: null }, content).takesValue).toBe(false);
  });
});

describe('findOrCreateCustomTrait', () => {
  it('returns the existing key when a matching name already exists', () => {
    const content = { customWeaponTraits: [{ key: 'custom.wt_xyz', name: 'Poison', description: '' }] };
    const key = window.findOrCreateCustomTrait('Poison', content);
    expect(key).toBe('custom.wt_xyz');
    expect(content.customWeaponTraits).toHaveLength(1);
  });

  it('creates a new entry with a custom.* key when no match', () => {
    const content = { customWeaponTraits: [] };
    const key = window.findOrCreateCustomTrait('Poison', content);
    expect(key).toMatch(/^custom\./);
    expect(content.customWeaponTraits).toHaveLength(1);
    expect(content.customWeaponTraits[0].name).toBe('Poison');
  });

  it('normalizes whitespace and case when deduping', () => {
    const content = { customWeaponTraits: [{ key: 'custom.wt_xyz', name: 'Poison', description: '' }] };
    expect(window.findOrCreateCustomTrait('  POISON  ', content)).toBe('custom.wt_xyz');
    expect(content.customWeaponTraits).toHaveLength(1);
  });
});

describe('generateCustomTraitKey', () => {
  it('produces keys prefixed with custom.wt_', () => {
    const content = { customWeaponTraits: [] };
    const key = window.generateCustomTraitKey(content);
    expect(key).toMatch(/^custom\.wt_/);
  });

  it('never collides with existing entries in content.customWeaponTraits', () => {
    const keys = new Set();
    const content = { customWeaponTraits: [] };
    for (let i = 0; i < 20; i++) {
      const k = window.generateCustomTraitKey(content);
      expect(keys.has(k)).toBe(false);
      keys.add(k);
      content.customWeaponTraits.push({ key: k, name: 'trait ' + i, description: '' });
    }
  });
});
