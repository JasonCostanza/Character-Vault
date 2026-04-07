import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
  setupMinimalDOM();
  // Reset language to English
  window.currentLang = 'en';
  localStorage.setItem('cv-language', 'en');
  loadScript('scripts/i18n.js');
});

describe('t()', () => {
  it('returns the English translation for a known key', () => {
    expect(t('menu.settings')).toBe('Settings');
  });

  it('returns Spanish when currentLang is es', () => {
    window.currentLang = 'es';
    expect(t('menu.settings')).toBe('Configuracion');
  });

  it('falls back to English for a key missing in current language', () => {
    window.currentLang = 'es';
    // 'greeting' only exists in en
    expect(t('greeting', { name: 'A', place: 'B' })).toBe('Hello A, welcome to B!');
  });

  it('returns the raw key when completely missing', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('replaces {placeholder} tokens', () => {
    expect(t('greeting', { name: 'Adrien', place: 'Fanta' })).toBe(
      'Hello Adrien, welcome to Fanta!'
    );
  });
});

describe('applyTranslations()', () => {
  it('sets textContent on [data-i18n] elements', () => {
    const el = document.querySelector('[data-i18n="settings.title"]');
    el.textContent = 'STALE';
    applyTranslations();
    expect(el.textContent).toBe('Settings');
  });

  it('sets title on [data-i18n-title] elements', () => {
    const el = document.querySelector('[data-i18n-title="menu.settings"]');
    el.setAttribute('title', 'STALE');
    applyTranslations();
    expect(el.getAttribute('title')).toBe('Settings');
  });

  it('sets placeholder on [data-i18n-placeholder] elements', () => {
    // Create a test element with data-i18n-placeholder
    const input = document.createElement('input');
    input.setAttribute('data-i18n-placeholder', 'menu.edit');
    document.body.appendChild(input);

    applyTranslations();
    expect(input.getAttribute('placeholder')).toBe('Edit');
  });

  it('sets data-tip on [data-i18n-tip] elements', () => {
    const el = document.querySelector('[data-i18n-tip]');
    expect(el).not.toBeNull();
    applyTranslations();
    // The tip value comes from t() — since we have 'settings.autoSaveTip' in en translations
    // it will return the key as fallback if not in our stub
    expect(el.getAttribute('data-tip')).toBeTruthy();
  });
});
