import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '../..');

export function loadScript(relativePath) {
  const code = readFileSync(resolve(ROOT, relativePath), 'utf-8');
  const fn = new Function(code);
  fn();
}
