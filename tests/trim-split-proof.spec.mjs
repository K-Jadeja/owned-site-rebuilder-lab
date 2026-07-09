// tests/trim-split-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const PROBE = path.join(ROOT, '.rebuild/features/trim-split-probe.json');
const SHORTCUTS = path.join(ROOT, '.rebuild/features/trim-split-shortcut-map.md');

test('trim-split probe exists', () => {
  expect(existsSync(PROBE)).toBeTruthy();
});

test('trim-split shortcut map exists', () => {
  expect(existsSync(SHORTCUTS)).toBeTruthy();
});

test('trim-split probe covers key list', async () => {
  const data = JSON.parse(await readFile(PROBE, 'utf8'));
  expect(Array.isArray(data.keyResults)).toBeTruthy();
  expect(data.keyResults.length).toBeGreaterThanOrEqual(20);
  const keys = data.keyResults.map((r) => r.key);
  expect(keys).toContain('s');
  expect(keys).toContain('Control+k');
  expect(keys).toContain('Delete');
});

test('trim-split probe recorded UI hint search', async () => {
  const data = JSON.parse(await readFile(PROBE, 'utf8'));
  expect(typeof data.uiHints.length).toBe('number');
});
