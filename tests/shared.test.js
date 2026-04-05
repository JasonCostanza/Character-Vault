import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

// scheduleSave is called by toggleCheckboxInMarkdown — must exist before shared.js loads
globalThis.scheduleSave = vi.fn();

beforeEach(() => {
  setupMinimalDOM();
  // Reset marked/DOMPurify mocks
  globalThis.marked.parse.mockImplementation((input) => input || '');
  globalThis.DOMPurify.sanitize.mockImplementation((html) => html);
  globalThis.scheduleSave.mockClear();
  loadScript('scripts/shared.js');
});

describe('escapeHtml', () => {
  it('escapes <script> tags', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through clean strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('renderMarkdown', () => {
  it('calls marked.parse then DOMPurify.sanitize', () => {
    const result = renderMarkdown('**bold**');
    expect(marked.parse).toHaveBeenCalledWith('**bold**');
    expect(DOMPurify.sanitize).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('handles null input', () => {
    const result = renderMarkdown(null);
    expect(marked.parse).toHaveBeenCalledWith('');
    expect(result).toBe('');
  });

  it('handles undefined input', () => {
    const result = renderMarkdown(undefined);
    expect(marked.parse).toHaveBeenCalledWith('');
    expect(result).toBe('');
  });
});

describe('toggleCheckboxInMarkdown', () => {
  it('checks a checkbox at the specified index', () => {
    const data = { content: '- [ ] first\n- [ ] second' };
    const moduleEl = document.createElement('div');
    toggleCheckboxInMarkdown(data, moduleEl, 0, true);
    expect(data.content).toBe('- [x] first\n- [ ] second');
  });

  it('unchecks a checkbox at the specified index', () => {
    const data = { content: '- [x] first\n- [x] second' };
    const moduleEl = document.createElement('div');
    toggleCheckboxInMarkdown(data, moduleEl, 1, false);
    expect(data.content).toBe('- [x] first\n- [ ] second');
  });

  it('handles multiple checkboxes correctly', () => {
    const data = { content: '- [ ] a\n- [ ] b\n- [ ] c' };
    const moduleEl = document.createElement('div');
    toggleCheckboxInMarkdown(data, moduleEl, 2, true);
    expect(data.content).toBe('- [ ] a\n- [ ] b\n- [x] c');
  });

  it('handles uppercase [X] as checked', () => {
    const data = { content: '- [X] first\n- [ ] second' };
    const moduleEl = document.createElement('div');
    toggleCheckboxInMarkdown(data, moduleEl, 0, false);
    expect(data.content).toBe('- [ ] first\n- [ ] second');
  });

  it('calls scheduleSave after toggling', () => {
    const data = { content: '- [ ] first' };
    const moduleEl = document.createElement('div');
    toggleCheckboxInMarkdown(data, moduleEl, 0, true);
    expect(scheduleSave).toHaveBeenCalled();
  });
});

describe('showToast', () => {
  it('creates a toast element in #toast-container', () => {
    showToast('Saved!', 'success');
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Saved!');
  });

  it('applies the correct type class', () => {
    showToast('Error!', 'error');
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast-error');
    expect(toast).not.toBeNull();
  });

  it('defaults to success type', () => {
    showToast('OK');
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast-success');
    expect(toast).not.toBeNull();
  });
});
