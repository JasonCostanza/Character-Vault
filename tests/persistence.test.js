import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
  setupMinimalDOM();

  // Mock the globals that persistence.js needs
  globalThis.modules = [];
  globalThis.moduleIdCounter = 0;
  globalThis.MODULE_TYPES = { text: { syncState: vi.fn() } };
  globalThis.renderModule = vi.fn();
  globalThis.updateEmptyState = vi.fn();
  globalThis.chkAutoSave = { checked: false };

  // Tab globals required by serializeCharacter / deserializeCharacter
  globalThis.tabs = [];
  globalThis.activeTabId = null;
  globalThis.getTabIdCounter = vi.fn().mockReturnValue(0);
  globalThis.setTabIdCounter = vi.fn();
  globalThis.renderTabBar = vi.fn();

  loadScript('scripts/persistence.js');
});

describe('migrateData', () => {
  it('passes through when no migrators match', () => {
    const blob = { version: 3, modules: [] };
    const result = migrateData(blob);
    expect(result.version).toBe(3);
    expect(result.modules).toEqual([]);
  });

  it('migrates v2 to v3 by doubling colSpan', () => {
    const blob = {
      version: 2,
      modules: [
        { id: 'm1', colSpan: 1 },
        { id: 'm2', colSpan: 2 },
        { id: 'm3', colSpan: 4 },
      ],
    };
    const result = migrateData(blob);
    expect(result.version).toBe(3);
    expect(result.modules[0].colSpan).toBe(2);
    expect(result.modules[1].colSpan).toBe(4);
    expect(result.modules[2].colSpan).toBe(8);
  });
});

describe('serializeCharacter / deserializeCharacter round-trip', () => {
  it('round-trips correctly', () => {
    // Set up a module in state
    globalThis.modules = [
      {
        id: 'module-001',
        type: 'text',
        title: 'My Notes',
        colSpan: 2,
        rowSpan: null,
        order: 0,
        theme: null,
        textLight: false,
        content: 'Hello world',
      },
    ];
    globalThis.moduleIdCounter = 1;

    const json = serializeCharacter();
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(3);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].id).toBe('module-001');
    expect(parsed.modules[0].content).toBe('Hello world');
    expect(parsed.moduleIdCounter).toBe(1);

    // Now deserialize
    globalThis.modules = [];
    globalThis.moduleIdCounter = 0;
    const ok = deserializeCharacter(json);
    expect(ok).toBe(true);
    expect(globalThis.modules).toHaveLength(1);
    expect(globalThis.modules[0].id).toBe('module-001');
    expect(globalThis.modules[0].content).toBe('Hello world');
    expect(renderModule).toHaveBeenCalled();
    expect(updateEmptyState).toHaveBeenCalled();
  });

  it('serializes empty character sheet', () => {
    globalThis.modules = [];
    globalThis.moduleIdCounter = 0;

    const json = serializeCharacter();
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(3);
    expect(parsed.modules).toEqual([]);
    expect(parsed.moduleIdCounter).toBe(0);
  });
});

describe('deserializeCharacter validation', () => {
  it('rejects invalid JSON', () => {
    const result = deserializeCharacter('not json at all');
    expect(result).toBe(false);
  });

  it('rejects missing version', () => {
    const result = deserializeCharacter(JSON.stringify({ modules: [] }));
    expect(result).toBe(false);
  });

  it('rejects non-array modules', () => {
    const result = deserializeCharacter(
      JSON.stringify({ version: 1, modules: 'not an array' })
    );
    expect(result).toBe(false);
  });

  it('skips unknown module types', () => {
    const json = JSON.stringify({
      version: 1,
      moduleIdCounter: 2,
      modules: [
        { id: 'module-001', type: 'text', order: 0, content: 'hi' },
        { id: 'module-002', type: 'unknown_type_xyz', order: 1, content: '' },
      ],
    });
    globalThis.modules = [];
    const ok = deserializeCharacter(json);
    expect(ok).toBe(true);
    // Only the 'text' module should be loaded
    expect(globalThis.modules).toHaveLength(1);
    expect(globalThis.modules[0].type).toBe('text');
  });

  it('sorts modules by order', () => {
    const json = JSON.stringify({
      version: 1,
      moduleIdCounter: 2,
      modules: [
        { id: 'module-002', type: 'text', order: 1, content: 'second' },
        { id: 'module-001', type: 'text', order: 0, content: 'first' },
      ],
    });
    globalThis.modules = [];
    deserializeCharacter(json);

    // renderModule should have been called with first (order 0) before second (order 1)
    const calls = renderModule.mock.calls;
    expect(calls[0][0].content).toBe('first');
    expect(calls[1][0].content).toBe('second');
  });

  it('defaults activityLog to empty array when missing', () => {
    const json = JSON.stringify({
      version: 1,
      modules: [{ id: 'module-001', type: 'text', order: 0, content: 'test' }],
    });
    globalThis.modules = [];
    const ok = deserializeCharacter(json);
    expect(ok).toBe(true);
    expect(globalThis.activityLog).toEqual([]);
  });
});

describe('scheduleSave', () => {
  it('does not schedule when chkAutoSave.checked is false', () => {
    globalThis.chkAutoSave = { checked: false };
    // reload persistence to pick up updated chkAutoSave reference
    loadScript('scripts/persistence.js');

    vi.useFakeTimers();
    scheduleSave();
    vi.advanceTimersByTime(3000);
    // saveCharacter calls TS.localStorage.campaign.setBlob — it should NOT have been called
    expect(TS.localStorage.campaign.setBlob).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('schedules a save when chkAutoSave.checked is true', () => {
    globalThis.chkAutoSave = { checked: true };
    loadScript('scripts/persistence.js');

    vi.useFakeTimers();
    scheduleSave();
    vi.advanceTimersByTime(2500);
    // saveCharacter is async and calls TS.localStorage.campaign.setBlob
    expect(TS.localStorage.campaign.setBlob).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('debounces multiple rapid calls into one save', () => {
    globalThis.chkAutoSave = { checked: true };
    loadScript('scripts/persistence.js');

    vi.useFakeTimers();
    TS.localStorage.campaign.setBlob.mockClear();
    scheduleSave();
    scheduleSave();
    scheduleSave();
    // All three calls happen immediately; only one setBlob should fire after debounce
    vi.advanceTimersByTime(2100); // Advance past 2s debounce window
    // Should be called once (debounced) not three times
    const callCount = TS.localStorage.campaign.setBlob.mock.calls.length;
    expect(callCount).toBeLessThanOrEqual(1);
    vi.useRealTimers();
  });
});
