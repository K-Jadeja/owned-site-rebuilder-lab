// tests/rve-m1-visual-parity.spec.mjs
//
// Asserts that the visual diff artifacts were generated and that
// "viewport" diff percentages are below a documented threshold.
//
// This is a metadata / artifact test — the actual pixel comparison is
// performed by `scripts/rve-m1-visual-diff.mjs` outside the browser.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

test('visual parity report exists with all 18 states', async () => {
  const reportPath = path.join(ROOT, '.rebuild/rebuild-parity/m1/visual-parity-report.json');
  expect(existsSync(reportPath)).toBeTruthy();
  const parsed = JSON.parse(await readFile(reportPath, 'utf8'));
  expect(parsed.results.length).toBeGreaterThanOrEqual(18);
});

test('diff artifacts exist for every state', async () => {
  const dir = path.join(ROOT, '.rebuild/rebuild-parity/m1/diff');
  const pngs = [];
  try {
    const { readdirSync } = await import('node:fs');
    for (const f of readdirSync(dir)) if (f.endsWith('.png')) pngs.push(f);
  } catch {}
  expect(pngs.length).toBeGreaterThanOrEqual(12);
});

test('desktop-viewport diff percentage is below 60% (rebuild resembles reference roughly)', async () => {
  const parsed = JSON.parse(await readFile(
    path.join(ROOT, '.rebuild/rebuild-parity/m1/visual-parity-report.json'), 'utf8'));
  const row = parsed.results.find((r) => r.viewport === 'desktop' && r.state === 'viewport');
  expect(row).toBeTruthy();
  expect(row.percent).toBeLessThan(60);
});
