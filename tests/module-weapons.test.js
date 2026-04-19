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

describe('generateWeaponId', () => {
  it('returns a string starting with wpn_', () => {
    const id = window.generateWeaponId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('wpn_')).toBe(true);
  });

  it('returns unique IDs on successive calls', () => {
    const a = window.generateWeaponId();
    const b = window.generateWeaponId();
    expect(a).not.toBe(b);
  });
});

describe('ensureWeaponsContent', () => {
  it('initializes when content is null', () => {
    const data = { content: null };
    const content = window.ensureWeaponsContent(data);
    expect(Array.isArray(content.weapons)).toBe(true);
    expect(content.weapons).toHaveLength(0);
  });

  it('initializes when content is a string (legacy data)', () => {
    const data = { content: 'old string' };
    const content = window.ensureWeaponsContent(data);
    expect(Array.isArray(content.weapons)).toBe(true);
  });

  it('initializes when weapons array is missing', () => {
    const data = { content: {} };
    const content = window.ensureWeaponsContent(data);
    expect(Array.isArray(content.weapons)).toBe(true);
  });

  it('preserves valid existing weapons', () => {
    const weapon = {
      id: 'wpn_abc',
      name: 'Longsword',
      slot: 'main',
      kind: 'melee',
      icon: null,
      abilityMod: 'str',
      proficient: true,
      attackBonusOverride: null,
      damageInstances: [],
      range: null,
      ammoCount: null,
      traits: [],
      notesMarkdown: '',
      twoHanded: false,
      acBonus: null,
      shieldHp: null,
      shieldHpMax: null,
    };
    const data = { content: { weapons: [weapon] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons).toHaveLength(1);
    expect(data.content.weapons[0].name).toBe('Longsword');
  });

  it('fills in missing fields on a partial weapon', () => {
    const data = { content: { weapons: [{ id: 'wpn_x', name: 'Dagger' }] } };
    window.ensureWeaponsContent(data);
    const w = data.content.weapons[0];
    expect(w.slot).toBe('main');
    expect(w.kind).toBe('melee');
    expect(w.proficient).toBe(false);
    expect(w.twoHanded).toBe(false);
    expect(w.attackBonusOverride).toBeNull();
    expect(Array.isArray(w.damageInstances)).toBe(true);
    expect(Array.isArray(w.traits)).toBe(true);
    expect(w.notesMarkdown).toBe('');
    expect(w.acBonus).toBeNull();
    expect(w.shieldHp).toBeNull();
    expect(w.shieldHpMax).toBeNull();
  });

  it('assigns a generated id if id is missing', () => {
    const data = { content: { weapons: [{ name: 'Axe' }] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons[0].id).toMatch(/^wpn_/);
  });

  it('resets invalid slot to main', () => {
    const data = { content: { weapons: [{ id: 'wpn_1', slot: 'bad' }] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons[0].slot).toBe('main');
  });

  it('resets invalid kind to melee', () => {
    const data = { content: { weapons: [{ id: 'wpn_1', kind: 'magic' }] } };
    window.ensureWeaponsContent(data);
    expect(data.content.weapons[0].kind).toBe('melee');
  });
});

describe('weaponsComputeAttackBonus', () => {
  it('returns the override value when attackBonusOverride is set', () => {
    const weapon = { attackBonusOverride: 7, abilityMod: 'str', proficient: true };
    expect(window.weaponsComputeAttackBonus(weapon)).toBe(7);
  });

  it('returns 0 override when attackBonusOverride is 0', () => {
    const weapon = { attackBonusOverride: 0, abilityMod: 'str', proficient: true };
    expect(window.weaponsComputeAttackBonus(weapon)).toBe(0);
  });

  it('computes ability mod + proficiency when no override', () => {
    window.getAbilityModifier = vi.fn().mockReturnValue(3);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    const weapon = { attackBonusOverride: null, abilityMod: 'str', proficient: true };
    expect(window.weaponsComputeAttackBonus(weapon)).toBe(5);
    expect(window.getAbilityModifier).toHaveBeenCalledWith('str');
    expect(window.getProficiencyBonus).toHaveBeenCalled();
  });

  it('excludes proficiency when proficient is false', () => {
    window.getAbilityModifier = vi.fn().mockReturnValue(3);
    window.getProficiencyBonus = vi.fn().mockReturnValue(2);
    const weapon = { attackBonusOverride: null, abilityMod: 'dex', proficient: false };
    expect(window.weaponsComputeAttackBonus(weapon)).toBe(3);
    expect(window.getProficiencyBonus).not.toHaveBeenCalled();
  });

  it('returns 0 when helpers are not available', () => {
    window.getAbilityModifier = undefined;
    window.getProficiencyBonus = undefined;
    const weapon = { attackBonusOverride: null, abilityMod: 'str', proficient: true };
    expect(window.weaponsComputeAttackBonus(weapon)).toBe(0);
  });
});

describe('weaponsFormatDamageSummary', () => {
  it('returns empty string when there are no damage instances', () => {
    const weapon = { damageInstances: [], abilityMod: 'str' };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('');
  });

  it('returns dice string only when no bonus and no type', () => {
    const weapon = {
      damageInstances: [{ dice: '1d8', modFromAbility: false, flatBonus: 0, damageType: '' }],
      abilityMod: 'str',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('1d8');
  });

  it('appends flat bonus positively', () => {
    const weapon = {
      damageInstances: [{ dice: '1d6', modFromAbility: false, flatBonus: 3, damageType: 'slashing' }],
      abilityMod: 'str',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('1d6+3 slashing');
  });

  it('appends negative flat bonus correctly', () => {
    const weapon = {
      damageInstances: [{ dice: '1d4', modFromAbility: false, flatBonus: -1, damageType: 'piercing' }],
      abilityMod: 'str',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('1d4-1 piercing');
  });

  it('adds ability modifier when modFromAbility is true', () => {
    window.getAbilityModifier = vi.fn().mockReturnValue(4);
    const weapon = {
      damageInstances: [{ dice: '1d8', modFromAbility: true, flatBonus: 0, damageType: 'slashing' }],
      abilityMod: 'str',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('1d8+4 slashing');
    expect(window.getAbilityModifier).toHaveBeenCalledWith('str');
  });

  it('combines ability modifier and flat bonus', () => {
    window.getAbilityModifier = vi.fn().mockReturnValue(2);
    const weapon = {
      damageInstances: [{ dice: '2d6', modFromAbility: true, flatBonus: 1, damageType: 'fire' }],
      abilityMod: 'dex',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('2d6+3 fire');
  });

  it('uses only the first damage instance for the summary', () => {
    const weapon = {
      damageInstances: [
        { dice: '1d6', modFromAbility: false, flatBonus: 0, damageType: 'slashing' },
        { dice: '1d4', modFromAbility: false, flatBonus: 0, damageType: 'fire' },
      ],
      abilityMod: 'str',
    };
    expect(window.weaponsFormatDamageSummary(weapon)).toBe('1d6 slashing');
  });
});
