// scripts/capture-rebuild-only.mjs
//
// Quick screenshot capture for the rebuild only (skips reference).
// Saves into the existing rebuild/ folder of the rescue.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT = path.join(ROOT, '.rebuild/rebuild-parity/m1/manual-check/rebuild');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'mobile',  width: 390,  height: 844 },
];

async function shot(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false });
    return { ok: true, file };
  } catch {
    return { ok: false, file };
  }
}

async function captureOne(browser, name, baseDir) {
  const ctx = await browser.newContext({ viewport: { width: name.width, height: name.height } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4310/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="rve-shell"]');
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload();
  await page.waitForSelector('[data-testid="rve-shell"]');
  await page.waitForTimeout(1500);

  const captureResults = { captured: [], failed: [] };
  async function tryShot(name, fn) {
    try {
      const file = path.join(baseDir, `rebuild-${name.name}-${name.suffix}.png`);
      const r = await fn(file);
      (r.ok ? captureResults.captured : captureResults.failed).push(r);
    } catch (e) {
      captureResults.failed.push({ file: name.suffix, error: e.message });
    }
  }

  const tag = name.name;
  await tryShot({ name: tag, suffix: 'viewport' }, (f) => shot(page, f));

  // Full
  await tryShot({ name: tag, suffix: 'full' }, (f) => page.screenshot({ path: f, fullPage: true }).then(() => ({ ok: true, file: f })).catch(() => ({ ok: false, file: f })));

  // Export dialog
  try {
    await page.locator('[data-rve-button="export-video"]').click({ timeout: 5000 });
    await page.waitForTimeout(700);
    await tryShot({ name: tag, suffix: 'export-dialog' }, (f) => shot(page, f));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch (e) { captureResults.failed.push({ error: 'export: ' + e.message }); }

  // My Library
  try {
    const tab = page.locator('[data-rve-tab="my-library"]');
    await tab.click({ timeout: 5000 });
    await page.waitForTimeout(700);
    await tryShot({ name: tag, suffix: 'my-library' }, (f) => shot(page, f));
  } catch (e) { captureResults.failed.push({ error: 'my-library: ' + e.message }); }

  // Space
  await page.locator('body').click({ position: { x: 700, y: 100 } }).catch(() => {});
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  await tryShot({ name: tag, suffix: 'after-space' }, (f) => shot(page, f));
  await page.keyboard.press('Space');

  // After import
  try {
    const fi = page.locator('[data-rve-file-input]');
    await fi.setInputFiles(SAMPLE);
    await page.waitForTimeout(1500);
    await page.locator('[data-rve-tab="my-library"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await tryShot({ name: tag, suffix: 'after-import' }, (f) => shot(page, f));
  } catch (e) { captureResults.failed.push({ error: 'after-import: ' + e.message }); }

  await ctx.close();
  return captureResults;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let total = { captured: 0, failed: 0 };
  for (const name of VIEWPORTS) {
    console.log(`[rebuild-only] ${name.name}`);
    const r = await captureOne(browser, name, OUT);
    total.captured += r.captured.length;
    total.failed += r.failed.length;
    console.log(`  captured: ${r.captured.length}, failed: ${r.failed.length}`);
  }
  await browser.close();
  console.log(`[rebuild-only] total captured=${total.captured} failed=${total.failed}`);
}

main().catch((e) => { console.error('[rebuild-only] fatal', e); process.exit(1); });
