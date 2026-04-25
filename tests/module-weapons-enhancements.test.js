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
});

// ── weaponsGenerateEnhancementKey ──
describe('weaponsGenerateEnhancementKey', () => {
  it('returns a key with enh_ prefix', () => {
    const key = window.weaponsGenerateEnhancementKey([]);
    expect(key.startsWith('enh_')).toBe(true);
  });

  it('avoids collision with existing keys', () => {
    const catalog = [];
    for (let i = 0; i < 20; i++) {
      const key = window.weaponsGenerateEnhancementKey(catalog);
      expect(catalog.find(e => e.key === key)).toBeUndefined();
      catalog.push({ key });
    }
  });

  it('handles empty catalog', () => {
    const key = window.weaponsGenerateEnhancementKey([]);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(4);
  });
});

// ── weaponsFindEnhancement ──
describe('weaponsFindEnhancement', () => {
  it('returns the entry when found', () => {
    const entry = { key: 'enh_abc123', system: 'pf2e', name: 'Striking' };
    const content = { enhancementCatalog: [entry] };
    expect(window.weaponsFindEnhancement(content, 'enh_abc123')).toBe(entry);
  });

  it('returns undefined when key not found', () => {
    const content = { enhancementCatalog: [{ key: 'enh_abc123' }] };
    expect(window.weaponsFindEnhancement(content, 'enh_xxxxxx')).toBeUndefined();
  });

  it('handles empty catalog', () => {
    const content = { enhancementCatalog: [] };
    expect(window.weaponsFindEnhancement(content, 'enh_abc')).toBeUndefined();
  });

  it('handles missing enhancementCatalog', () => {
    const content = {};
    expect(window.weaponsFindEnhancement(content, 'enh_abc')).toBeUndefined();
  });
});

// ── weaponsGetAttachedEnhancements ──
describe('weaponsGetAttachedEnhancements', () => {
  const catalog = [
    { key: 'enh_aaa', system: 'pf2e', name: 'Striking' },
    { key: 'enh_bbb', system: 'pf2e', name: 'Flaming' },
  ];
  const content = { enhancementCatalog: catalog };

  it('returns resolved entries for attached keys', () => {
    const weapon = { attachedEnhancements: ['enh_aaa', 'enh_bbb'] };
    const result = window.weaponsGetAttachedEnhancements(weapon, content);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Striking');
    expect(result[1].name).toBe('Flaming');
  });

  it('returns empty array when attachedEnhancements is null', () => {
    const weapon = { attachedEnhancements: null };
    expect(window.weaponsGetAttachedEnhancements(weapon, content)).toEqual([]);
  });

  it('returns empty array when attachedEnhancements is empty', () => {
    const weapon = { attachedEnhancements: [] };
    expect(window.weaponsGetAttachedEnhancements(weapon, content)).toEqual([]);
  });

  it('skips orphan keys not in catalog', () => {
    const weapon = { attachedEnhancements: ['enh_aaa', 'enh_orphan'] };
    const result = window.weaponsGetAttachedEnhancements(weapon, content);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('enh_aaa');
  });

  it('returns empty array when catalog is empty', () => {
    const weapon = { attachedEnhancements: ['enh_aaa'] };
    expect(window.weaponsGetAttachedEnhancements(weapon, { enhancementCatalog: [] })).toEqual([]);
  });
});

// ── weaponsGetAvailableEnhancements ──
describe('weaponsGetAvailableEnhancements', () => {
  const catalog = [
    { key: 'enh_aaa', system: 'pf2e', name: 'Striking' },
    { key: 'enh_bbb', system: 'pf2e', name: 'Flaming' },
    { key: 'enh_ccc', system: 'sr6',  name: 'Smartlink' },
  ];
  const content = { enhancementCatalog: catalog };

  it('returns catalog entries not attached to any weapon, filtered by system', () => {
    const weapons = [{ attachedEnhancements: ['enh_aaa'] }];
    const result = window.weaponsGetAvailableEnhancements(content, weapons, 'pf2e');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('enh_bbb');
  });

  it('returns all system entries when no weapons have attachments', () => {
    const result = window.weaponsGetAvailableEnhancements(content, [], 'pf2e');
    expect(result).toHaveLength(2);
  });

  it('filters by system correctly', () => {
    const result = window.weaponsGetAvailableEnhancements(content, [], 'sr6');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('enh_ccc');
  });

  it('returns empty array when all are attached', () => {
    const weapons = [{ attachedEnhancements: ['enh_aaa', 'enh_bbb'] }];
    const result = window.weaponsGetAvailableEnhancements(content, weapons, 'pf2e');
    expect(result).toEqual([]);
  });

  it('handles no weapons', () => {
    const result = window.weaponsGetAvailableEnhancements(content, null, 'pf2e');
    expect(result).toHaveLength(2);
  });

  it('handles empty catalog', () => {
    const result = window.weaponsGetAvailableEnhancements({ enhancementCatalog: [] }, [], 'pf2e');
    expect(result).toEqual([]);
  });
});

// ── weaponsApplyStrikingBonus ──
describe('weaponsApplyStrikingBonus', () => {
  it('adds bonus dice to standard dice string', () => {
    expect(window.weaponsApplyStrikingBonus('1d8', 1)).toBe('2d8');
  });

  it('adds 2 for Greater Striking', () => {
    expect(window.weaponsApplyStrikingBonus('1d8', 2)).toBe('3d8');
  });

  it('works with multi-die starting point', () => {
    expect(window.weaponsApplyStrikingBonus('2d6', 2)).toBe('4d6');
  });

  it('returns unchanged when bonus is 0', () => {
    expect(window.weaponsApplyStrikingBonus('1d8', 0)).toBe('1d8');
  });

  it('returns empty string for falsy diceStr', () => {
    expect(window.weaponsApplyStrikingBonus('', 1)).toBe('');
    expect(window.weaponsApplyStrikingBonus(null, 1)).toBe('');
  });

  it('returns diceStr unchanged for non-matching format', () => {
    expect(window.weaponsApplyStrikingBonus('1d4+2', 1)).toBe('1d4+2');
    expect(window.weaponsApplyStrikingBonus('special', 1)).toBe('special');
  });
});

// ── weaponsComputeEnhancementPoolBonus ──
describe('weaponsComputeEnhancementPoolBonus', () => {
  it('sums poolBonus from attached sr6 accessories', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'sr6', poolBonus: 1 },
        { key: 'enh_b', system: 'sr6', poolBonus: 2 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementPoolBonus(weapon, content)).toBe(3);
  });

  it('ignores entries with null poolBonus', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'sr6', poolBonus: null },
        { key: 'enh_b', system: 'sr6', poolBonus: 1 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementPoolBonus(weapon, content)).toBe(1);
  });

  it('ignores non-sr6 entries', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'pf2e', damageDiceBonus: 2 },
        { key: 'enh_b', system: 'sr6',  poolBonus: 1 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementPoolBonus(weapon, content)).toBe(1);
  });

  it('returns 0 when no enhancements attached', () => {
    const content = { enhancementCatalog: [{ key: 'enh_a', system: 'sr6', poolBonus: 2 }] };
    const weapon = { attachedEnhancements: null };
    expect(window.weaponsComputeEnhancementPoolBonus(weapon, content)).toBe(0);
  });
});

// ── weaponsComputeEnhancementAttackBonus ──
describe('weaponsComputeEnhancementAttackBonus', () => {
  it('sums attackBonus from attached cpred mods', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'cpred', attackBonus: 1 },
        { key: 'enh_b', system: 'cpred', attackBonus: 2 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementAttackBonus(weapon, content)).toBe(3);
  });

  it('ignores entries with null attackBonus', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'cpred', attackBonus: null },
        { key: 'enh_b', system: 'cpred', attackBonus: 2 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementAttackBonus(weapon, content)).toBe(2);
  });

  it('ignores non-cpred entries', () => {
    const content = {
      enhancementCatalog: [
        { key: 'enh_a', system: 'sr6',   poolBonus: 1 },
        { key: 'enh_b', system: 'cpred', attackBonus: 3 },
      ],
    };
    const weapon = { attachedEnhancements: ['enh_a', 'enh_b'] };
    expect(window.weaponsComputeEnhancementAttackBonus(weapon, content)).toBe(3);
  });

  it('returns 0 when no enhancements attached', () => {
    const content = { enhancementCatalog: [{ key: 'enh_a', system: 'cpred', attackBonus: 2 }] };
    const weapon = { attachedEnhancements: null };
    expect(window.weaponsComputeEnhancementAttackBonus(weapon, content)).toBe(0);
  });
});

// ── ensureWeaponsContent — Phase 3 fields ──
describe('ensureWeaponsContent — Phase 3 fields', () => {
  it('initializes enhancementCatalog when missing', () => {
    const data = { content: {} };
    window.ensureWeaponsContent(data);
    expect(Array.isArray(data.content.enhancementCatalog)).toBe(true);
    expect(data.content.enhancementCatalog).toHaveLength(0);
  });

  it('preserves existing enhancementCatalog', () => {
    const entry = { key: 'enh_abc', system: 'pf2e', name: 'Striking' };
    const data = { content: { enhancementCatalog: [entry] } };
    window.ensureWeaponsContent(data);
    expect(data.content.enhancementCatalog).toHaveLength(1);
  });

  it('initializes attachedEnhancements to null on each weapon', () => {
    const data = { content: { weapons: [{ id: 'wpn_x', name: 'Rapier' }] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons[0].attachedEnhancements).toBeNull();
  });

  it('preserves existing attachedEnhancements', () => {
    const data = { content: { weapons: [{ id: 'wpn_x', name: 'Rapier', attachedEnhancements: ['enh_abc'] }] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons[0].attachedEnhancements).toEqual(['enh_abc']);
  });
});
