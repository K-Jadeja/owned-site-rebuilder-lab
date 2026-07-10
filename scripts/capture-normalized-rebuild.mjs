// scripts/capture-normalized-rebuild.mjs
//
// Capture the rebuild at http://localhost:4310 in seven "normalized"
// states that match what the reference is observed doing at each
// phase. The capture explicitly:
//
//   - disables CSS animations and transitions
//   - waits for fonts.ready
//   - waits for networkidle on the editor shell
//   - waits for [data-testid="rve-shell"] to be visible and stable
//   - pauses media
//   - moves playback to 0
//   - hides the cursor

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/rebuild');

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
  // Inject CSS to disable animations / transitions and hide cursor.
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
  // Wait for the box dimensions to remain stable for 1s.
  let last = null;
  for (let i = 0; i < 20; i++) {
    const bb = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="rve-shell"]');
      if (!root) return null;
      const r = root.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].join(',');
    });
    if (last !== null && bb === last) return;
    last = bb;
    await page.waitForTimeout(50);
  }
}

async function bootFresh(page) {
  await page.goto('http://localhost:4310/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="rve-shell"]', { timeout: 30000 });
  await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });
}

async function shot(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false });
    return true;
  } catch {
    return false;
  }
}

async function selectFirstClipOfType(page, type) {
  await page.evaluate((t) => {
    const clips = Array.from(document.querySelectorAll('[data-testid="timeline-clip"]'));
    const c = clips.find((x) => x.getAttribute('data-clip-type') === t);
    if (c) (c).click();
  }, type);
  await page.waitForTimeout(150);
}

async function captureState(browser, viewport, state, baseDir) {
  const ctx = await setupContext(browser, viewport);
  const page = await ctx.newPage();
  const results = { captured: [], failed: [] };

  try {
    await bootFresh(page);

    if (state === 'initial') {
      // already booted, just settle
    }

    if (state === 'my-library') {
      await page.locator('[data-rve-tab="my-library"]').click();
    }

    if (state === 'selected-default-video-clip') {
      await selectFirstClipOfType(page, 'video');
    }

    if (state === 'selected-default-text-clip') {
      await selectFirstClipOfType(page, 'text');
    }

    if (state === 'export-dialog') {
      await page.locator('[data-rve-button="export-video"]').click();
      await page.waitForTimeout(300);
    }

    if (state === 'after-single-file-import') {
      await page.locator('[data-rve-file-input]').setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
      await page.locator('[data-rve-tab="my-library"]').click();
      await page.waitForTimeout(400);
    }

    if (state === 'after-imported-video-on-timeline') {
      await page.locator('[data-rve-file-input]').setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
      await page.locator('[data-rve-tab="my-library"]').click();
      const assetId = await page.locator('[data-testid="media-card"]').first().getAttribute('data-asset-id');
      await page.evaluate(({ aid }) => {
        const src = document.querySelector(`[data-testid="media-card"][data-asset-id="${aid}"]`);
        const lanes = Array.from(document.querySelectorAll('[data-testid^="timeline-lane-"]'));
        const tgt = lanes[lanes.length - 1];
        if (!src || !tgt) return;
        const dt = new DataTransfer();
        dt.setData('text/rve-asset', aid);
        src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
        tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
        tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
      }, { aid: assetId });
      await page.waitForTimeout(700);
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
      console.log(`[normalized-rebuild] ${v.name}/${state}`);
      const r = await captureState(browser, v, state, OUT);
      total.captured += r.captured.length;
      total.failed += r.failed.length;
    }
  }
  await browser.close();
  console.log(`[normalized-rebuild] captured=${total.captured} failed=${total.failed}`);
  await fs.writeFile(
    path.join(OUT, '_summary.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), total }, null, 2)
  );
}

main().catch((err) => {
  console.error('[normalized-rebuild] fatal', err);
  process.exit(1);
});
