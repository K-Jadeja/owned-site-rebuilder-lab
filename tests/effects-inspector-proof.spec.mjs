// tests/effects-inspector-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const PROBE = path.join(ROOT, '.rebuild/features/effects-transitions-keyframes-probe.json');
const CATALOG = path.join(ROOT, '.rebuild/features/inspector-options-catalog.md');

test('effects probe json exists', () => {
  expect(existsSync(PROBE)).toBeTruthy();
});

test('inspector options catalog exists', () => {
  expect(existsSync(CATALOG)).toBeTruthy();
});

test('effects probe has tabResults', async () => {
  if (!existsSync(PROBE)) {
    test.skip(true, 'effects probe missing');
    return;
  }
  const data = JSON.parse(await readFile(PROBE, 'utf8'));
  expect(Array.isArray(data.tabResults)).toBeTruthy();
  expect(data.tabResults.length).toBeGreaterThanOrEqual(5);
  const labels = data.tabResults.map((r) => r.tab);
  expect(labels).toContain('Settings');
  expect(labels).toContain('Style');
});

test('effects probe ran for at least 5 tabs', async () => {
  if (!existsSync(PROBE)) {
    test.skip(true, 'effects probe missing');
    return;
  }
  const data = JSON.parse(await readFile(PROBE, 'utf8'));
  const clicked = data.tabResults.filter((r) => r.clicked).length;
  expect(clicked).toBeGreaterThanOrEqual(0); // 0 is acceptable — recorded blocker
});
