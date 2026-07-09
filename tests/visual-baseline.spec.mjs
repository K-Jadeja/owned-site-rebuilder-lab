// tests/visual-baseline.spec.mjs
// Captures per-viewport screenshots for the reference app and lays the
// groundwork for later visual comparison against a rebuilt app.

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT_DIR = path.join('.rebuild', 'tests', 'visual');

test.beforeAll(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });
});

test('reference baseline screenshot', async ({ page }, testInfo) => {
  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(response).not.toBeNull();
  await page.waitForTimeout(2500);

  const outFile = path.join(OUT_DIR, `reference-${testInfo.project.name}.png`);
  await page.screenshot({ path: outFile, fullPage: false });

  const fullFile = path.join(OUT_DIR, `reference-${testInfo.project.name}-full.png`);
  await page.screenshot({ path: fullFile, fullPage: true });

  // Persist minimal metadata for diff pairing
  const meta = {
    target: TARGET,
    project: testInfo.project.name,
    viewport: testInfo.project.use.viewport || null,
    shot: path.relative('.', outFile),
    fullShot: path.relative('.', fullFile),
    timestamp: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(OUT_DIR, `reference-${testInfo.project.name}.json`),
    JSON.stringify(meta, null, 2),
    'utf8',
  );

  // Sanity: there should be a body
  const bodyExists = await page.evaluate(() => !!document.body);
  expect(bodyExists).toBeTruthy();
});