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

  globalThis.Sortable = vi.fn().mockImplementation(() => ({ destroy: vi.fn() }));
  globalThis.isPlayMode = false;
  globalThis.gameSystem = 'dnd5e';
  globalThis.getProficiencyBonus = vi.fn(() => 2);
  globalThis.computePf2eProficiencyBonus = vi.fn(() => 0);
  globalThis.getAbilityModifierFrom = vi.fn(() => 0);
  globalThis.buildCvSelect = vi.fn(() => ({ el: document.createElement('span') }));
  globalThis.buildPf2eRankOptions = vi.fn(() => []);
  globalThis.buildStatModulePicker = vi.fn(() => document.createElement('div'));
  globalThis.buildCommonSettingsSection = vi.fn(() => document.createElement('div'));
  globalThis.updateChainLinkIndicator = vi.fn();
  globalThis.showConfirm = vi.fn();
  globalThis.propagateEntityRename = vi.fn();
  globalThis.logActivity = vi.fn();
  globalThis.pendingRolls = {};

  loadScript('scripts/icons.js');
  loadScript('scripts/shared.js');
  loadScript('scripts/i18n.js');
  loadScript('scripts/theme.js');
  loadScript('scripts/settings.js');
  loadScript('scripts/persistence.js');
  loadScript('scripts/module-core.js');
  loadScript('scripts/module-abilities.js');
});

describe('applyAbilityTemplate', () => {
  it('returns 18 abilities for dnd5e', () => {
    expect(window.applyAbilityTemplate('dnd5e')).toHaveLength(18);
  });

  it('returns 17 abilities for pf2e', () => {
    expect(window.applyAbilityTemplate('pf2e')).toHaveLength(17);
  });

  it('returns [] for unknown template key', () => {
    expect(window.applyAbilityTemplate('unknown')).toEqual([]);
  });

  it('each ability defaults to proficiency: false and proficiencyRank: untrained', () => {
    ['dnd5e', 'pf2e', 'coc', 'vtm', 'cpred', 'sr6'].forEach((key) => {
      window.applyAbilityTemplate(key).forEach((a) => {
        expect(a.proficiency).toBe(false);
        expect(a.proficiencyRank).toBe('untrained');
      });
    });
  });

  it('each ability from dnd5e has a linkedStat string', () => {
    window.applyAbilityTemplate('dnd5e').forEach((a) => {
      expect(typeof a.linkedStat).toBe('string');
    });
  });

  it('each ability has name and modifier: 0', () => {
    const abilities = window.applyAbilityTemplate('dnd5e');
    abilities.forEach((a) => {
      expect(typeof a.name).toBe('string');
      expect(a.modifier).toBe(0);
    });
  });
});
