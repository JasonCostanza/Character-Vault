// ── Global mocks — set BEFORE any script loads ──

// Node 22+ ships a built-in localStorage stub that requires --localstorage-file.
// Without that flag, getItem/setItem are undefined — a broken shim that shadows
// jsdom's fully-functional implementation. We need a working localStorage for both
// test code (ESM module scope) and IIFE scripts (new Function / globalThis scope).
// Solution: build a simple in-memory Storage implementation and force it everywhere.
function createStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    get length() { return store.size; },
    key(index) { return [...store.keys()][index] ?? null; },
  };
}

const _localStorage = createStorage();
const _sessionStorage = createStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: _localStorage, writable: true, configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: _sessionStorage, writable: true, configurable: true,
});

// TaleSpire API
globalThis.TS = {
  localStorage: {
    campaign: {
      setBlob: vi.fn().mockResolvedValue(undefined),
      getBlob: vi.fn().mockResolvedValue(null),
    },
  },
  dice: {
    putDiceInTray: vi.fn(),
  },
  creatures: {
    getSelectedCreatures: vi.fn().mockResolvedValue([]),
    getMoreInfo: vi.fn().mockResolvedValue({}),
  },
};

// Marked (markdown parser)
class MockRenderer {}
globalThis.marked = {
  Renderer: MockRenderer,
  setOptions: vi.fn(),
  parse: vi.fn((input) => input || ''),
};

// DOMPurify
globalThis.DOMPurify = {
  sanitize: vi.fn((html) => html),
};

// Sortable — used as `new Sortable(el, opts)` constructor in module-core.js
globalThis.Sortable = vi.fn().mockImplementation(() => ({ option: vi.fn() }));
globalThis.Sortable.create = vi.fn(() => ({ option: vi.fn() }));

// requestAnimationFrame
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// ResizeObserver — not in jsdom
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Translations stub (minimal en/es for i18n tests)
globalThis.CV_TRANSLATIONS = {
  en: {
    'menu.settings': 'Settings',
    'menu.newModule': 'New Module',
    'menu.edit': 'Edit',
    'menu.play': 'Play',
    'settings.title': 'Settings',
    'toast.saveSuccess': 'Character saved!',
    'greeting': 'Hello {name}, welcome to {place}!',
  },
  es: {
    'menu.settings': 'Configuracion',
    'menu.newModule': 'Nuevo Modulo',
    'menu.edit': 'Editar',
    'menu.play': 'Jugar',
    'settings.title': 'Configuracion',
  },
};

// CV_ICONS stub
globalThis.CV_ICONS = {};
