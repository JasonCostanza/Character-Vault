import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers/load-script.js';
import { setupMinimalDOM } from './helpers/minimal-dom.js';

beforeEach(() => {
  setupMinimalDOM();
  loadScript('scripts/popover-edit.js');
});

describe('resolveMathExpression', () => {
  it('resolves a plain number', () => {
    expect(window.resolveMathExpression('12', 0, false)).toBe(12);
  });

  it('resolves a full expression', () => {
    expect(window.resolveMathExpression('9+2', 0, false)).toBe(11);
    expect(window.resolveMathExpression('4*2', 0, false)).toBe(8);
    expect(window.resolveMathExpression('9-3', 0, false)).toBe(6);
  });

  it('applies leading operators against the current value when relative', () => {
    expect(window.resolveMathExpression('+2', 9, true)).toBe(11);
    expect(window.resolveMathExpression('-3', 9, true)).toBe(6);
    expect(window.resolveMathExpression('*2', 9, true)).toBe(18);
  });

  it('treats a leading minus as a literal negative when not relative', () => {
    expect(window.resolveMathExpression('-3', 9, false)).toBe(-3);
  });

  it('handles a non-numeric current value in relative mode', () => {
    expect(window.resolveMathExpression('+2', null, true)).toBe(2);
    expect(window.resolveMathExpression('+2', 'abc', true)).toBe(2);
  });

  it('floors fractional results', () => {
    expect(window.resolveMathExpression('9/2', 0, false)).toBe(4);
    expect(window.resolveMathExpression('2.7', 0, false)).toBe(2);
  });

  it('tolerates whitespace and parentheses', () => {
    expect(window.resolveMathExpression(' 10 + 1 ', 0, false)).toBe(11);
    expect(window.resolveMathExpression('(4+2)*2', 0, false)).toBe(12);
  });

  it('returns null for empty or nullish input', () => {
    expect(window.resolveMathExpression('', 5, false)).toBeNull();
    expect(window.resolveMathExpression('   ', 5, false)).toBeNull();
    expect(window.resolveMathExpression(null, 5, false)).toBeNull();
    expect(window.resolveMathExpression(undefined, 5, false)).toBeNull();
  });

  it('returns null for disallowed characters', () => {
    expect(window.resolveMathExpression('abc', 5, false)).toBeNull();
    expect(window.resolveMathExpression('9;2', 5, false)).toBeNull();
    expect(window.resolveMathExpression('window.x', 5, false)).toBeNull();
  });

  it('returns null for non-finite results', () => {
    expect(window.resolveMathExpression('9/0', 5, false)).toBeNull();
  });

  it('returns null for malformed expressions', () => {
    expect(window.resolveMathExpression('9++*2', 5, false)).toBeNull();
    expect(window.resolveMathExpression('(9', 5, false)).toBeNull();
  });
});
