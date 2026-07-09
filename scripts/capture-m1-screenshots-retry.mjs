// scripts/capture-m1-screenshots-retry.mjs
//
// Retry only the failed captures from capture-m1-screenshots.mjs.
// Differences:
// - Close the export dialog before clicking the next tab (it intercepts
//   pointer events).
// - Use page.focus('body') + keyboard.down for Space instead of
//   body.click().
// - For the reference, click the visible My Library tab with force:true.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT = path.join(ROOT, '.rebuild/rebuild-parity/m1/manual-check');
const OUT_REF = path.join(OUT, 'reference');
const OUT_REB = path.join(OUT, 'rebuild');

const REFERENCE = 'https://demo.reactvideoeditor.com';
const REBUILD = 'http://localhost:4310';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'mobile',  width: 390,  height: 844 },
];

async function safeShot(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false });
    return { ok: true, file };
  } catch (e) {
    return { ok: false, file, error: e.message };
  }
}

async function closeExportDialog(page) {
  // Click Cancel button if present
  try {
    const cancel = await page.$('[data-rve-button="export-cancel"]');
    if (cancel) { await cancel.click(); return; }
  } catch {}
  try {
    const cancelText = await page.$('button:has-text("Cancel")');
    if (cancelText) { await cancelText.click({ force: true }); return; }
  } catch {}
  // Press Escape
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
}

async function captureOne(browser, target, name, baseDir) {
  const ctx = await browser.newContext({ viewport: { width: name.width, height: name.height } });
  const page = await ctx.newPage();
  const out = { captured: [], failures: [] };

  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);

    // 1. My Library tab (rebuild has data-rve-tab; reference uses [role="tab"]:has-text)
    try {
      // Close any open dialog first
      await closeExportDialog(page);
      const sel = target === REBUILD
        ? '[data-rve-tab="my-library"]'
        : 'button:has-text("My Library"), [role="tab"]:has-text("My Library")';
      const tab = await page.$(sel);
      if (tab) {
        await tab.click({ force: true, timeout: 5000 });
        await page.waitForTimeout(700);
        const file = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-my-library.png`);
        const r = await safeShot(page, file);
        (r.ok ? out.captured : out.failures).push(r);
      } else {
        out.failures.push(`my-library ${target}: tab not found`);
      }
    } catch (e) {
      out.failures.push(`my-library ${target}: ${e.message}`);
    }

    // 2. After Space (use page.focus on body + keyboard.press, no click)
    try {
      await page.focus('body').catch(() => {});
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      const file = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-after-space.png`);
      const r = await safeShot(page, file);
      (r.ok ? out.captured : out.failures).push(r);
      // Toggle off so subsequent captures start clean
      await page.keyboard.press('Space').catch(() => {});
    } catch (e) {
      out.failures.push(`space ${target}: ${e.message}`);
    }

    // 3. After import (rebuild only — reference has its own import flow)
    if (target === REBUILD) {
      try {
        await closeExportDialog(page);
        // Make sure we're on My Library
        const tab = await page.$('[data-rve-tab="my-library"]');
        if (tab) await tab.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
        const fi = await page.$('[data-rve-file-input]');
        if (fi) {
          try { await fs.access(SAMPLE); } catch { throw new Error('sample.mp4 missing'); }
          await fi.setInputFiles(SAMPLE);
          await page.waitForTimeout(1500);
          const tab2 = await page.$('[data-rve-tab="my-library"]');
          if (tab2) await tab2.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
          const file = path.join(baseDir, `rebuild-${name.name}-after-import.png`);
          const r = await safeShot(page, file);
          (r.ok ? out.captured : out.failures).push(r);
        }
      } catch (e) {
        out.failures.push(`after-import ${target}: ${e.message}`);
      }
    } else {
      // Reference after-import: open the file picker via the visible import
      // button if it exists; otherwise just upload via the file input
      try {
        await closeExportDialog(page);
        // Try clicking an Import button first
        const importBtn = await page.$('button:has-text("Import"), button:has-text("Upload")');
        if (importBtn) {
          await importBtn.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
        }
        const fi = await page.$('input[type="file"][accept^="video"]');
        if (fi) {
          try { await fs.access(SAMPLE); } catch { throw new Error('sample.mp4 missing'); }
          await fi.setInputFiles(SAMPLE);
          await page.waitForTimeout(2500);
          const file = path.join(baseDir, `reference-${name.name}-after-import.png`);
          const r = await safeShot(page, file);
          (r.ok ? out.captured : out.failures).push(r);
        }
      } catch (e) {
        out.failures.push(`after-import ${target}: ${e.message}`);
      }
    }
  } finally {
    await ctx.close();
  }
  return out;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const name of VIEWPORTS) {
    console.log(`[retry] reference / ${name.name}`);
    const r1 = await captureOne(browser, REFERENCE, name, OUT_REF);
    results.push({ viewport: name.name, target: REFERENCE, ...r1 });
    console.log(`[retry] rebuild / ${name.name}`);
    const r2 = await captureOne(browser, REBUILD, name, OUT_REB);
    results.push({ viewport: name.name, target: REBUILD, ...r2 });
  }

  await browser.close();
  await fs.writeFile(
    path.join(OUT, 'capture-retry-summary.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
  );
  const total = results.reduce((a, r) => a + r.captured.length, 0);
  const fails = results.reduce((a, r) => a + r.failures.length, 0);
  console.log(`[retry] captured=${total} failed=${fails}`);
  if (fails > 0) process.exit(2);
}

main().catch((err) => {
  console.error('[retry] fatal', err);
  process.exit(1);
});
