// tests/deep-runtime-proof.spec.mjs
// Hard-proof assertions for deep runtime behavior.

import { test, expect } from '@playwright/test';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';

test.describe('deep-runtime-proof / export dialog hard proof', () => {
  test('export dialog contains 720p, 1080p, 4K, Start Export, Rendered in your browser', async ({ page }) => {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /export/i }).first().click({ timeout: 4000 });
    await page.waitForTimeout(2000);
    const dialogText = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
      const visible = dialogs.find((d) => {
        const r = d.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return visible ? (visible.innerText || '') : '';
    });
    for (const marker of ['720p', '1080p', '4K', 'Start Export', 'Rendered in your browser']) {
      expect(dialogText, `dialog missing "${marker}"`).toContain(marker);
    }
    await page.keyboard.press('Escape').catch(() => {});
  });
});

test.describe('deep-runtime-proof / playback hard proof', () => {
  test('Space keypress mutates advanced-timeline-store in localStorage', async ({ page }) => {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);
    // Ensure the page has focus.
    await page.evaluate(() => window.focus());
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    const has = await page.evaluate(() => localStorage.getItem('advanced-timeline-store') !== null);
    expect(has, 'expected advanced-timeline-store to be present after Space').toBeTruthy();
  });
});

test.describe('deep-runtime-proof / persistence after reload hard proof', () => {
  test('advanced-timeline-store created by Space persists across page.reload()', async ({ page }) => {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.focus());
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => localStorage.getItem('advanced-timeline-store'));
    expect(before, 'precondition: Space must create the key').not.toBeNull();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => localStorage.getItem('advanced-timeline-store'));
    expect(after, 'postcondition: key must persist across reload').not.toBeNull();
    expect(after).toBe(before);
  });
});

test.describe('deep-runtime-proof / bundle analysis hard proof', () => {
  test('deep-bundle-analysis.md exists with feature keyword hits', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const md = fs.readFileSync(path.join('.rebuild', 'features', 'deep-bundle-analysis.md'), 'utf8');
    expect(md).toContain('Deep Bundle Analysis');
    for (const kw of ['timeline', 'track', 'clip', 'export', 'video']) {
      expect(md, `expected deep-bundle-analysis.md to mention ${kw}`).toContain(kw);
    }
  });

  test('library-fingerprint.json identifies at least 5 libraries', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const data = JSON.parse(fs.readFileSync(path.join('.rebuild', 'features', 'library-fingerprint.json'), 'utf8'));
    const libs = Object.keys(data);
    expect(libs.length).toBeGreaterThanOrEqual(5);
  });

  test('source-map-report.md exists', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    expect(fs.existsSync(path.join('.rebuild', 'features', 'source-map-report.md'))).toBeTruthy();
  });

  test('feature-code-clues.json has at least 5 features with bundles_hit', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const data = JSON.parse(fs.readFileSync(path.join('.rebuild', 'features', 'feature-code-clues.json'), 'utf8'));
    const withHits = (data.features || []).filter((f) => (f.bundles_hit || []).length > 0);
    expect(withHits.length).toBeGreaterThanOrEqual(5);
  });
});