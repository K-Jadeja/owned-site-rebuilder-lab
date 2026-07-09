// scripts/capture-m1-screenshots.mjs
//
// Capture Milestone 1 rebuild screenshots for manual review.
//   - reference: https://demo.reactvideoeditor.com
//   - rebuild:   http://localhost:4310
//   - 3 viewports: desktop (1440x900), laptop (1280x800), mobile (390x844)
//
// For each viewport / target capture:
//   - <name>-viewport.png     (initial viewport)
//   - <name>-full.png         (full page)
//   - <name>-export-dialog.png (after clicking Export Video / similar)
//   - <name>-my-library.png   (My Library tab)
//   - <name>-after-space.png  (after pressing Space)
//   - <name>-after-import.png (after importing sample.mp4 if possible)
//
// Then build a contact sheet per viewport combining the 4 most
// important captures into one PNG using a simple SVG -> PNG via the
// `sharp` package if installed, otherwise an HTML file.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REFERENCE = 'https://demo.reactvideoeditor.com';
const REBUILD = 'http://localhost:4310';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');

const OUT = path.join(ROOT, '.rebuild/rebuild-parity/m1/manual-check');
const OUT_REF = path.join(OUT, 'reference');
const OUT_REB = path.join(OUT, 'rebuild');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'mobile',  width: 390,  height: 844 },
];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function safeScreenshot(page, file, opts = {}) {
  try {
    await page.screenshot({ path: file, fullPage: opts.full ?? false });
    return true;
  } catch (e) {
    try { await fs.writeFile(file + '.error.txt', String(e.message || e)); } catch {}
    return false;
  }
}

async function captureOne(browser, target, name, baseDir) {
  const ctx = await browser.newContext({ viewport: { width: name.width, height: name.height } });
  const page = await ctx.newPage();
  const result = { viewport: name.name, target: target, captured: [], failures: [] };

  try {
    // Boot
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);

    // Viewport screenshot
    const v = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-viewport.png`);
    if (await safeScreenshot(page, v)) result.captured.push(v); else result.failures.push(v);

    // Full page screenshot
    const f = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-full.png`);
    if (await safeScreenshot(page, f, { full: true })) result.captured.push(f); else result.failures.push(f);

    // Export dialog
    try {
      const btn = await page.$('button:has-text("Export Video")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(800);
        const e = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-export-dialog.png`);
        if (await safeScreenshot(page, e)) result.captured.push(e); else result.failures.push(e);
        // Close
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
      } else {
        result.failures.push(`${target}: no Export Video button`);
      }
    } catch (e) {
      result.failures.push(`export dialog ${target}: ${e.message}`);
    }

    // My Library tab
    try {
      const tab = await page.$('[data-rve-tab="my-library"], button:has-text("My Library"), [role="tab"]:has-text("My Library")');
      if (tab) {
        await tab.click();
        await page.waitForTimeout(500);
        const m = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-my-library.png`);
        if (await safeScreenshot(page, m)) result.captured.push(m); else result.failures.push(m);
      } else {
        result.failures.push(`${target}: no My Library tab`);
      }
    } catch (e) {
      result.failures.push(`my-library ${target}: ${e.message}`);
    }

    // After Space
    try {
      await page.locator('body').click({ position: { x: Math.min(700, name.width - 100), y: 100 } });
      await page.keyboard.press('Space');
      await page.waitForTimeout(400);
      const s = path.join(baseDir, `${target === REFERENCE ? 'reference' : 'rebuild'}-${name.name}-after-space.png`);
      if (await safeScreenshot(page, s)) result.captured.push(s); else result.failures.push(s);
      await page.keyboard.press('Space').catch(() => {});
    } catch (e) {
      result.failures.push(`space ${target}: ${e.message}`);
    }

    // After import (rebuild only, since reference has its own import flow)
    if (target === REBUILD) {
      try {
        const fi = await page.$('[data-rve-file-input]');
        if (fi) {
          try { await fs.access(SAMPLE); } catch { result.failures.push('sample.mp4 missing'); throw new Error('no sample'); }
          await fi.setInputFiles(SAMPLE);
          await page.waitForTimeout(1500);
          // Switch to My Library tab if not already
          const tab = await page.$('[data-rve-tab="my-library"]');
          if (tab) { await tab.click(); await page.waitForTimeout(400); }
          const a = path.join(baseDir, `rebuild-${name.name}-after-import.png`);
          if (await safeScreenshot(page, a)) result.captured.push(a); else result.failures.push(a);
        }
      } catch (e) {
        result.failures.push(`after-import ${target}: ${e.message}`);
      }
    } else {
      // For reference, try the same pattern but tolerant of failure
      try {
        const fi = await page.$('input[type="file"][accept^="video"]');
        if (fi) {
          try { await fs.access(SAMPLE); } catch { result.failures.push('sample.mp4 missing'); throw new Error('no sample'); }
          await fi.setInputFiles(SAMPLE);
          await page.waitForTimeout(2000);
          const a = path.join(baseDir, `reference-${name.name}-after-import.png`);
          if (await safeScreenshot(page, a)) result.captured.push(a); else result.failures.push(a);
        }
      } catch (e) {
        result.failures.push(`after-import ${target}: ${e.message}`);
      }
    }
  } finally {
    await ctx.close();
  }
  return result;
}

async function buildContactSheet(baseDir, name, kind) {
  // Compose a simple horizontal strip using HTML -> not great without sharp.
  // We just emit a markdown index file pointing to each capture.
  const idx = path.join(baseDir, `${kind}-${name.name}-contact-sheet.md`);
  const tag = kind === 'reference' ? 'reference' : 'rebuild';
  const files = [
    `${tag}-${name.name}-viewport.png`,
    `${tag}-${name.name}-full.png`,
    `${tag}-${name.name}-export-dialog.png`,
    `${tag}-${name.name}-my-library.png`,
    `${tag}-${name.name}-after-space.png`,
    `${tag}-${name.name}-after-import.png`,
  ];
  const lines = [];
  lines.push(`# ${kind} ${name.name} contact sheet`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| File | Exists |');
  lines.push('| --- | --- |');
  for (const f of files) {
    const p = path.join(baseDir, f);
    let exists = false;
    try { await fs.access(p); exists = true; } catch {}
    lines.push(`| \`${f}\` | ${exists ? 'YES' : 'NO'} |`);
  }
  await fs.writeFile(idx, lines.join('\n'));
  return idx;
}

async function main() {
  await ensureDir(OUT_REF);
  await ensureDir(OUT_REB);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const name of VIEWPORTS) {
    console.log(`[capture] reference / ${name.name}`);
    const r1 = await captureOne(browser, REFERENCE, name, OUT_REF);
    results.push(r1);
    console.log(`[capture] rebuild / ${name.name}`);
    const r2 = await captureOne(browser, REBUILD, name, OUT_REB);
    results.push(r2);
    await buildContactSheet(OUT_REF, name, 'reference');
    await buildContactSheet(OUT_REB, name, 'rebuild');
  }

  await browser.close();

  const ok = results.every((r) => r.failures.length === 0);
  console.log(`[capture] ok=${ok} captures=${results.reduce((a, r) => a + r.captured.length, 0)} failures=${results.reduce((a, r) => a + r.failures.length, 0)}`);
  // Write a summary
  await fs.writeFile(path.join(OUT, 'capture-summary.json'), JSON.stringify({ ok, results, generatedAt: new Date().toISOString() }, null, 2));
  if (!ok) process.exit(2);
}

main().catch((err) => {
  console.error('[capture] fatal', err);
  process.exit(1);
});
