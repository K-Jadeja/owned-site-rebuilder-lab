// tests/reference-capture.spec.mjs
// Loads the target, verifies it responds, takes a reference screenshot,
// and persists basic metadata into .rebuild/reference/tests-metadata/.

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const META_DIR = path.join('.rebuild', 'reference', 'tests-metadata');

test.beforeAll(async () => {
  await fs.mkdir(META_DIR, { recursive: true });
});

test('app shell responds and renders', async ({ page }, testInfo) => {
  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(response, 'no response from target').not.toBeNull();
  const status = response.status();
  expect(status, `expected 2xx/3xx, got ${status}`).toBeLessThan(400);

  // Wait briefly for hydration.
  await page.waitForTimeout(2500);

  const title = await page.title();
  const url = page.url();

  // Persist basic metadata
  const meta = {
    project: 'owned-site-rebuilder-lab',
    target: TARGET,
    projectName: testInfo.project.name,
    title,
    finalUrl: url,
    status,
    timestamp: new Date().toISOString(),
    viewport: testInfo.project.use.viewport || null,
  };
  await fs.writeFile(
    path.join(META_DIR, `reference-${testInfo.project.name}.json`),
    JSON.stringify(meta, null, 2),
    'utf8',
  );

  // Reference screenshot at this project's viewport.
  const shot = path.join(META_DIR, `reference-${testInfo.project.name}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  // Smoke assertions
  await expect(page).toHaveURL(/./); // some URL is loaded
  // Title may be empty for SPAs; tolerate either.
  expect(typeof title).toBe('string');
});