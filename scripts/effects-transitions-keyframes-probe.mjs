// scripts/effects-transitions-keyframes-probe.mjs
//
// Probe inspector tabs (Settings, Style, AI, Crop, Position, Volume,
// Mute, Playback Speed, Animations, 3D Layout Effects).
//
// Outputs:
//   .rebuild/features/effects-transitions-keyframes-probe.json
//   .rebuild/features/effects-transitions-keyframes-probe.md
//   .rebuild/features/inspector-options-catalog.md
//   .rebuild/deep-import/effects-screenshots/

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_SHOTS = path.join(ROOT, '.rebuild/deep-import/effects-screenshots');
const OUT_JSON = path.join(ROOT, '.rebuild/features/effects-transitions-keyframes-probe.json');
const OUT_MD = path.join(ROOT, '.rebuild/features/effects-transitions-keyframes-probe.md');
const OUT_CATALOG = path.join(ROOT, '.rebuild/features/inspector-options-catalog.md');

const TABS = ['Settings', 'Style', 'AI', 'Crop', 'Position', 'Volume', 'Mute', 'Playback Speed', 'Animations', 'Effects', '3D Layout'];

async function storageSnapshot(page) {
  return page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || '').length;
    }
    return out;
  });
}

async function main() {
  await fs.mkdir(OUT_SHOTS, { recursive: true });
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });
  await fs.mkdir(path.dirname(OUT_CATALOG), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const tabResults = [];

  console.log('[effects] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Upload + drag
  try {
    const fi = await page.$('input[type="file"][accept^="video"]');
    if (fi) await fi.setInputFiles(SAMPLE);
    await page.waitForTimeout(1500);
  } catch {}
  try {
    const items = await page.$$('[draggable="true"]');
    if (items.length >= 2) {
      const from = await items[0].boundingBox();
      const to = await items[1].boundingBox();
      if (from && to) {
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + 60, to.y + to.height / 2, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(800);
      }
    }
  } catch {}

  // Click each inspector tab
  for (const tab of TABS) {
    const before = await storageSnapshot(page);
    const bodyBefore = await page.evaluate(() => document.body.innerText.slice(0, 500));
    let clicked = false;
    let error = null;
    let bodyAfter = '';
    let after = {};
    try {
      // Try a few selector variants
      const selectors = [
        `button:has-text("${tab}")`,
        `[role="tab"]:has-text("${tab}")`,
        `label:has-text("${tab}")`,
        `text=${tab}`,
      ];
      for (const sel of selectors) {
        const el = await page.$(sel);
        if (el) {
          await el.click().catch(() => {});
          clicked = true;
          break;
        }
      }
      await page.waitForTimeout(400);
      bodyAfter = await page.evaluate(() => document.body.innerText.slice(0, 800));
      after = await storageSnapshot(page);
    } catch (e) {
      error = e.message;
    }

    // capture screenshot
    try {
      await page.screenshot({ path: path.join(OUT_SHOTS, `${tab.replace(/\s+/g, '_')}.png`) });
    } catch {}

    tabResults.push({
      tab,
      clicked,
      error,
      bodyChanged: bodyBefore !== bodyAfter,
      storageChanged: JSON.stringify(before) !== JSON.stringify(after),
      bodyPreview: bodyAfter.slice(0, 400),
    });
  }

  await browser.close();

  await fs.writeFile(OUT_JSON, JSON.stringify({ tabResults, generatedAt: new Date().toISOString() }, null, 2));

  const md = [];
  md.push('# Effects / Transitions / Keyframes Probe');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`Tabs probed: ${TABS.length}`);
  md.push(`Clicked: ${tabResults.filter((r) => r.clicked).length}`);
  md.push(`Storage changed: ${tabResults.filter((r) => r.storageChanged).length}`);
  md.push(`Body changed: ${tabResults.filter((r) => r.bodyChanged).length}`);
  md.push('');
  md.push('## Per-tab');
  md.push('');
  md.push('| Tab | Clicked | Body changed | Storage changed |');
  md.push('| --- | --- | --- | --- |');
  for (const r of tabResults) {
    md.push(`| ${r.tab} | ${r.clicked ? 'YES' : 'NO'} | ${r.bodyChanged ? 'YES' : 'NO'} | ${r.storageChanged ? 'YES' : 'NO'} |`);
  }
  await fs.writeFile(OUT_MD, md.join('\n'));

  const catalog = [];
  catalog.push('# Inspector Options Catalog');
  catalog.push('');
  catalog.push(`Generated: ${new Date().toISOString()}`);
  catalog.push('');
  for (const r of tabResults) {
    catalog.push(`## ${r.tab}`);
    catalog.push('');
    catalog.push(`- Clicked: ${r.clicked}`);
    catalog.push(`- Body text preview: ${r.bodyPreview.replace(/\n/g, ' ').slice(0, 300)}`);
    catalog.push('');
  }
  await fs.writeFile(OUT_CATALOG, catalog.join('\n'));

  console.log(`[effects] tabs=${TABS.length} clicked=${tabResults.filter((r) => r.clicked).length}`);
}

main().catch((err) => {
  console.error('[effects] fatal', err);
  process.exit(1);
});
