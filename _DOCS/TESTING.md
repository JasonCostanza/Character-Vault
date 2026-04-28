# Testing Guide

Reference for writing and running Vitest unit tests in Character Vault.

---

## Running Tests

```bash
npx vitest run       # single pass, exits with result
npx vitest           # watch mode, re-runs on file changes
npx vitest run --reporter=verbose  # verbose output
```

Tests live in `tests/`. There is no test runner config to set up — vitest picks them up automatically.

---

## What Can Be Tested

### Testable (unit tests)
- Pure functions: data transforms, shape guards, math, notation parsing, template application
- Functions exposed on `window.*` from inside module IIFEs
- Serialization / migration logic

### Not Testable Here
- DOM rendering (`renderBody`, `buildPlayLayer`, etc.)
- Event wiring (click handlers, keyboard handlers)
- TaleSpire API calls (`TS.dice.*`, `TS.localStorage.*`)
- Anything that requires a real TaleSpire environment

For untestable code, test in TaleSpire directly. Don't mock DOM or TaleSpire calls deeply — that way lies false confidence.

---

## Test Infrastructure

### `tests/helpers/load-script.js`

Loads a script file from the project root into the current test scope using `new Function()`. This simulates the browser's `<script src>` tag — it runs the IIFE and populates `window.*` globals.

```js
import { loadScript } from './helpers/load-script.js';

loadScript('scripts/module-savingthrow.js');
// → window.applyTierPreset and window.applySavingThrowTemplate are now available
```

### `tests/helpers/setup.js`

Global setup file loaded automatically before every test file (configured in `vitest.config.*`). Sets up:

- **`localStorage` / `sessionStorage`** — in-memory Map-backed implementation (Node's built-in shim is broken without `--localstorage-file`)
- **`TS` global** — mocked TaleSpire API:
  ```js
  globalThis.TS = {
    localStorage: {
      campaign: {
        setBlob: vi.fn().mockResolvedValue(undefined),
        getBlob: vi.fn().mockResolvedValue(null),
      }
    },
    dice: { putDiceInTray: vi.fn() },
    creatures: {
      getSelectedCreatures: vi.fn().mockResolvedValue([]),
      getMoreInfo: vi.fn().mockResolvedValue({}),
    }
  };
  ```
- **`marked`** — mock markdown parser
- **`DOMPurify`** — mock sanitizer (passes through)
- **`Sortable`** — mock SortableJS constructor
- **`requestAnimationFrame`** — `setTimeout(cb, 0)`
- **`ResizeObserver`** — mock (jsdom doesn't include it)
- **`CV_TRANSLATIONS`** — minimal English stub (add keys your test needs)
- **`CV_ICONS`** — empty object

### `tests/helpers/minimal-dom.js`

`setupMinimalDOM()` sets up a minimal `document.body` structure (menu bar, module grid) needed by some scripts that call `document.getElementById()` on load. Call this in `beforeEach` if loading module scripts.

---

## The Pattern: How to Write a Test File

### Step 1 — Import what you need

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';
```

### Step 2 — Stub any globals needed BEFORE loading the script

Module IIFEs run immediately when loaded. If they call `scheduleSave()` or other globals during load, stub those first:

```js
globalThis.scheduleSave = vi.fn();
globalThis.modules = [];
globalThis.gameSystem = 'dnd5e';
globalThis.isPlayMode = false;
```

### Step 3 — Load the script dependency chain

Load scripts in dependency order. Later scripts assume earlier ones have run. You don't need to load the whole chain — only what's needed for the functions under test.

```js
beforeEach(() => {
  setupMinimalDOM();
  loadScript('scripts/translations.js');   // CV_TRANSLATIONS
  loadScript('scripts/shared.js');          // escapeHtml, buildCvSelect, inferTierPreset
  loadScript('scripts/i18n.js');            // window.t, applyTranslations
  loadScript('scripts/module-savingthrow.js'); // window.applyTierPreset, etc.
});
```

Minimal chains:
- To test `shared.js` functions: just load `shared.js` (requires `CV_TRANSLATIONS` global, mocked in setup.js)
- To test stat module functions: load `translations.js` → `shared.js` → `i18n.js` → `module-stat.js`
- To test weapons: load `translations.js` → `shared.js` → `i18n.js` → `module-weapons.js`

### Step 4 — Call functions via `window.*`

Functions exposed at the bottom of each module IIFE are on `window`:

```js
it('returns pf2e tiers', () => {
  const tiers = window.applyTierPreset('pf2e');
  expect(tiers).toHaveLength(5);
});
```

Functions that are private to the IIFE are not reachable in tests — and that's intentional. Only pure, testable logic should be exported via `window`.

### Step 5 — Reset state between tests

Scripts run in the same global scope. State mutations persist between tests unless you reset:

```js
beforeEach(() => {
  window.modules = [];
  window.activityLog = [];
  window.pendingRolls = {};
  vi.clearAllMocks();
  // Reload scripts that need fresh state
  loadScript('scripts/module-stat.js');
});
```

---

## Minimal Test File Template

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

// Stub globals needed BEFORE the IIFE runs
globalThis.scheduleSave = vi.fn();
globalThis.modules = [];
globalThis.gameSystem = 'custom';

beforeEach(() => {
  setupMinimalDOM();
  globalThis.modules = [];
  globalThis.scheduleSave.mockClear();

  // Load only what's needed for this module's pure functions
  loadScript('scripts/translations.js');
  loadScript('scripts/shared.js');
  loadScript('scripts/i18n.js');
  loadScript('scripts/module-YOURMODULE.js');
});

describe('yourFunction', () => {
  it('returns expected value', () => {
    const result = window.yourFunction('input');
    expect(result).toBe('expected');
  });

  it('handles edge case', () => {
    expect(window.yourFunction(null)).toBeNull();
  });
});
```

---

## Existing Tests — Quick Reference

| File | What It Tests |
|---|---|
| `shared.test.js` | `escapeHtml`, `renderMarkdown`, `toggleCheckboxInMarkdown`, `inferTierPreset`, `getGameSystemDisplayName` |
| `i18n.test.js` | `t()` lookup, fallback to English, replacement interpolation |
| `persistence.test.js` | `serializeCharacter`, `deserializeCharacter`, `migrateData`, `scheduleSave` debounce |
| `module-core.test.js` | `generateModuleId`, `registerModuleType` basics |
| `module-savingthrow.test.js` | `applyTierPreset`, `applySavingThrowTemplate`, `formatModifier` |
| `module-spells.test.js` | `isDiceNotation`, `extractDiceRoll`, `defaultContent`, `getAvailableSlots`, `spendSlot` |
| `module-resistance.test.js` | Shape guards, resistance type helpers |
| `module-weapons.test.js` | `weaponsComputeAttackBonus`, `weaponsFormatDamageSummary`, `getAttackArchetype` |
| `module-weapons-traits.test.js` | `getSystemTraitCatalog`, `resolveWeaponTrait`, `normalizeWeaponTraits` |
| `module-weapons-enhancements.test.js` | `weaponsGenerateEnhancementKey`, `weaponsFindEnhancement`, `weaponsComputeEnhancementPoolBonus` |
| `dice-pool-improvements.test.js` | Pool dice roll setup, success counting for VtM/SR6 |

---

## Common Pitfalls

**Script loads once per `loadScript` call.** If you re-call it in `beforeEach`, it re-runs the IIFE and re-registers everything. This is intentional and ensures fresh state.

**`CV_TRANSLATIONS` in setup.js is a minimal stub.** If your code calls `t('some.missing.key')`, it returns the key itself as a string. Add needed keys to `setup.js` or override in your `beforeEach`.

**Don't test DOM output.** If you find yourself doing `document.querySelector('.stat-block')` in a test, you're testing the renderer, not the logic. Extract the pure logic into a `window.*`-exported function and test that instead.

**`vi.fn()` mocks persist across tests.** Call `vi.clearAllMocks()` or `.mockClear()` per mock in `beforeEach` if call counts matter to your assertions.

**Script load order still matters.** Loading `module-abilities.js` before `i18n.js` will throw because `t()` doesn't exist yet. Match the production load order from `ARCHITECTURE.md § Script Load Order`.
