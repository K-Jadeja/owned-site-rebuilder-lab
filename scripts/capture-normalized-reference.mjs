// scripts/capture-normalized-reference.mjs
//
// Capture the live reference at https://demo.reactvideoeditor.com in
// the same 7 normalized states as the rebuild. The reference cannot
// always reach the exact same internal state as the rebuild (it has
// its own selected clip, its own import history, its own hydration
// phase). We try to mirror what the rebuild would do at each state.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/reference');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
];

const STATES = [
  'initial',
  'my-library',
  'selected-default-video-clip',
  'selected-default-text-clip',
  'export-dialog',
  'after-single-file-import',
  'after-imported-video-on-timeline',
];

async function setupContext(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript(() => {
    const css = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      html { cursor: none !important; }
    `;
    const s = document.createElement('style');
    s.appendChild(document.createTextNode(css));
    document.documentElement.appendChild(s);
  });
  return ctx;
}

async function settle(page, extraMs = 250) {
  await page.waitForTimeout(extraMs);
  // Wait for stable layout (the reference renders incremental hydration;
  // wait until the bounding box has remained stable for 1s).
  let last = null;
  for (let i = 0; i < 20; i++) {
    const bb = await page.evaluate(() => {
      const root = document.querySelector('main, body');
      if (!root) return null;
      const r = root.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].join(',');
    });
    if (last !== null && bb === last) return;
    last = bb;
    await page.waitForTimeout(50);
  }
}

async function shot(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false });
    return true;
  } catch {
    return false;
  }
}

async function captureState(browser, viewport, state, baseDir) {
  const ctx = await setupContext(browser, viewport);
  const page = await ctx.newPage();
  const results = { captured: [], failed: [] };

  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });

    if (state === 'initial') {
      // nothing to do
    }

    if (state === 'my-library') {
      const tab = await page.$('button:has-text("My Library"), [role="tab"]:has-text("My Library")');
      if (tab) { await tab.click({ force: true }); await page.waitForTimeout(400); }
    }

    if (state === 'selected-default-video-clip' || state === 'selected-default-text-clip') {
      // The reference exposes clip selection by clicking elements with
      // cursor:pointer in the lower-third timeline. Many clips start as
      // "Loading..." placeholders. Wait briefly then click the first one.
      const ptr = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const lowerThirdY = vh * 0.66;
        const found = { x: null, y: null };
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.y < lowerThirdY) continue;
          const s = getComputedStyle(el);
          if (s.cursor === 'pointer' && r.height < 200 && r.width > 100) {
            found.x = Math.round(r.x + r.width / 2);
            found.y = Math.round(r.y + r.height / 2);
            break;
          }
        }
        return found;
      });
      if (ptr.x != null) {
        await page.mouse.click(ptr.x, ptr.y);
        await page.waitForTimeout(400);
      }
    }

    if (state === 'export-dialog') {
      const btn = await page.$('button:has-text("Export Video")');
      if (btn) { await btn.click(); await page.waitForTimeout(500); }
    }

    if (state === 'after-single-file-import' || state === 'after-imported-video-on-timeline') {
      try { await fs.access(SAMPLE); } catch {}
      const fi = await page.$('input[type="file"][accept^="video"]');
      if (fi) {
        await fi.setInputFiles(SAMPLE).catch(() => {});
        await page.waitForTimeout(3000);
      }
      if (state === 'after-imported-video-on-timeline') {
        // Try drag-to-timeline
        const dragged = await page.evaluate(() => {
          const from = document.querySelector('[draggable="true"]');
          const tos = document.querySelectorAll('[draggable="true"]');
          if (!from || tos.length < 2) return false;
          const to = tos[1];
          const fa = from.getBoundingClientRect();
          const ta = to.getBoundingClientRect();
          const dt = new DataTransfer();
          from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
          to.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
          to.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
          return [Math.round(fa.x), Math.round(fa.y), Math.round(ta.x), Math.round(ta.y)];
        });
        if (dragged) {
          await page.waitForTimeout(700);
        }
      }
    }

    await settle(page, 250);
    const file = path.join(baseDir, `${viewport.name}-${state}.png`);
    if (await shot(page, file)) results.captured.push(file);
    else results.failed.push(file);
  } catch (e) {
    results.failed.push({ state, error: e.message });
  } finally {
    await ctx.close();
  }
  return results;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const total = { captured: 0, failed: 0 };
  for (const v of VIEWPORTS) {
    for (const state of STATES) {
      console.log(`[normalized-reference] ${v.name}/${state}`);
      const r = await captureState(browser, v, state, OUT);
      total.captured += r.captured.length;
      total.failed += r.failed.length;
    }
  }
  await browser.close();
  console.log(`[normalized-reference] captured=${total.captured} failed=${total.failed}`);
  await fs.writeFile(
    path.join(OUT, '_summary.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), total }, null, 2)
  );
}

main().catch((err) => {
  console.error('[normalized-reference] fatal', err);
  process.exit(1);
});
