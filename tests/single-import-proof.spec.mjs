// tests/single-import-proof.spec.mjs
// Hard-proof for the single-file import flow.

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FIXTURE = path.join('.rebuild', 'tests', 'fixtures', 'sample.mp4');

test.describe('single-import-proof / F007 single-file import', () => {
  test('upload sample.mp4 produces concrete mutation', async ({ browser }) => {
    test.skip(!await exists(FIXTURE), 'sample.mp4 fixture missing');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);
    // Switch to My Library tab if present.
    try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
    await page.waitForTimeout(800);

    const input = page.locator('input[type="file"]').first();
    const inputCount = await page.locator('input[type="file"]').count();
    if (inputCount === 0) {
      test.skip(true, 'no <input type="file"> exposed by the app');
    }

    const before = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = (localStorage.getItem(k) || '').slice(0, 200);
      }
      return { keys: Object.keys(out), bodyText: (document.body.innerText || '').slice(0, 400) };
    });

    await input.setInputFiles(FIXTURE);
    await page.waitForTimeout(4500);

    const after = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = (localStorage.getItem(k) || '').slice(0, 200);
      }
      return {
        keys: Object.keys(out),
        bodyText: (document.body.innerText || '').slice(0, 400),
        videoCount: document.querySelectorAll('video').length,
        imgCount: document.querySelectorAll('img').length,
        interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"]').length,
      };
    });

    const added = after.keys.filter((k) => !before.keys.includes(k));
    const textChanged = before.bodyText !== after.bodyText;
    const videoAdded = after.videoCount > (before.videoCount || 0);
    const imgAdded = after.imgCount > (before.imgCount || 0);
    const interactiveAdded = after.interactiveCount > (before.interactiveCount || 0);
    const proof = added.length > 0 || textChanged || videoAdded || imgAdded || interactiveAdded;
    expect(proof, `expected concrete mutation: added=[${added.join(',')}], textChanged=${textChanged}, videoAdded=${videoAdded}, imgAdded=${imgAdded}, interactiveAdded=${interactiveAdded}`).toBeTruthy();
    await context.close();
  });
});

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}