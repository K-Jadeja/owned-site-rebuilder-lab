// scripts/action-coverage-map.mjs
//
// Use Playwright JS + CSS coverage to map user actions to executed
// bundle ranges. Outputs:
//   .rebuild/runtime/coverage/<action>.json
//   .rebuild/runtime/coverage/action-coverage-summary.md
//   .rebuild/runtime/coverage/action-to-bundle-map.json

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime/coverage';
const FIXTURE = '.rebuild/tests/fixtures/sample.mp4';

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  async function boot() {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(3000);
  }

  function usedBytes(entries) {
    if (!Array.isArray(entries)) return 0;
    return entries.reduce((a, e) => {
      const ranges = e.ranges || [];
      return a + ranges.reduce((ra, r) => ra + ((r.end || 0) - (r.start || 0)), 0);
    }, 0);
  }

  async function safeAction(label, fn) {
    let js = [];
    let css = [];
    let err = null;
    try {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await page.coverage.startCSSCoverage({ resetOnNavigation: false });
    } catch (e) { /* coverage may fail to start; capture and continue */ }
    try { await fn(); } catch (e) { err = String(e.message || e); }
    await page.waitForTimeout(800);
    try { js = await page.coverage.stopJSCoverage(); } catch (e) { js = []; }
    try { css = await page.coverage.stopCSSCoverage(); } catch (e) { css = []; }

    const jsUsed = usedBytes(js);
    const cssUsed = usedBytes(css);
    const jsTotal = js.reduce((a, e) => a + ((e.text && e.text.length) || 0), 0);
    const cssTotal = css.reduce((a, e) => a + ((e.text && e.text.length) || 0), 0);

    return {
      label,
      err,
      jsEntries: js.length,
      jsUsedBytes: jsUsed,
      jsTotalBytes: jsTotal,
      cssEntries: css.length,
      cssUsedBytes: cssUsed,
      cssTotalBytes: cssTotal,
      js: js.map((e) => ({
        url: e.url || '',
        usedBytes: (e.ranges || []).reduce((a, r) => a + ((r.end || 0) - (r.start || 0)), 0),
        totalBytes: (e.text && e.text.length) || 0,
      })),
      css: css.map((e) => ({
        url: e.url || '',
        usedBytes: (e.ranges || []).reduce((a, r) => a + ((r.end || 0) - (r.start || 0)), 0),
        totalBytes: (e.text && e.text.length) || 0,
      })),
    };
  }

  await boot();

  const actions = [];
  actions.push(await safeAction('boot', async () => {
    await page.waitForTimeout(1500);
  }));
  actions.push(await safeAction('dark-toggle', async () => {
    try { await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 }); } catch {}
  }));
  actions.push(await safeAction('export-dialog', async () => {
    try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
  }));
  actions.push(await safeAction('playback-space', async () => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    await page.keyboard.press('Space');
  }));
  actions.push(await safeAction('undo-redo', async () => {
    await page.keyboard.press('Control+Z').catch(() => {});
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+Shift+Z').catch(() => {});
  }));
  actions.push(await safeAction('zoom-in', async () => {
    try { await page.getByRole('button', { name: /zoom in/i }).first().click({ timeout: 2000 }); } catch {}
  }));
  actions.push(await safeAction('zoom-out', async () => {
    try { await page.getByRole('button', { name: /zoom out/i }).first().click({ timeout: 2000 }); } catch {}
  }));
  actions.push(await safeAction('zoom-reset', async () => {
    try { await page.getByRole('button', { name: /reset/i }).first().click({ timeout: 2000 }); } catch {}
  }));
  actions.push(await safeAction('my-library', async () => {
    try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
  }));

  // Single import attempt.
  actions.push(await safeAction('single-import', async () => {
    try {
      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles(FIXTURE);
    } catch (e) { /* expected to fail if input missing */ }
    await page.waitForTimeout(2000);
  }));

  await context.close();
  await browser.close();

  const map = {};
  for (const a of actions) {
    await fs.writeFile(path.join(OUT, `${a.label}.json`), JSON.stringify(a, null, 2));
    map[a.label] = {
      err: a.err,
      jsEntries: a.jsEntries,
      jsUsedBytes: a.jsUsedBytes,
      jsTotalBytes: a.jsTotalBytes,
      cssEntries: a.cssEntries,
      cssUsedBytes: a.cssUsedBytes,
      cssTotalBytes: a.cssTotalBytes,
      topJsUrls: a.js.sort((x, y) => y.usedBytes - x.usedBytes).slice(0, 8).map((e) => ({ url: e.url, usedBytes: e.usedBytes })),
      topCssUrls: a.css.sort((x, y) => y.usedBytes - x.usedBytes).slice(0, 6).map((e) => ({ url: e.url, usedBytes: e.usedBytes })),
    };
  }
  await fs.writeFile(path.join(OUT, 'action-to-bundle-map.json'), JSON.stringify(map, null, 2));

  // Markdown summary.
  const lines = [];
  lines.push('# Action Coverage Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push('Coverage was collected via Playwright `page.coverage` for JS + CSS.');
  lines.push('For each action we record the bytes used, distinct entries, and the top URL.');
  lines.push('');
  lines.push('| Action | Err | JS entries | JS used / total | CSS entries | CSS used / total | Top JS bundle |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const a of actions) {
    const top = a.js.slice().sort((x, y) => y.usedBytes - x.usedBytes)[0];
    let topName = '(none)';
    if (top && top.url) {
      try { topName = path.basename(new URL(top.url).pathname); } catch { topName = top.url; }
    }
    lines.push(`| ${a.label} | ${a.err ? a.err.slice(0, 30) : 'ok'} | ${a.jsEntries} | ${a.jsUsedBytes} / ${a.jsTotalBytes} | ${a.cssEntries} | ${a.cssUsedBytes} / ${a.cssTotalBytes} | ${topName} |`);
  }
  lines.push('');
  lines.push('## Per-action top JS bundles');
  lines.push('');
  for (const a of actions) {
    lines.push(`### ${a.label}`);
    const top = a.js.slice().sort((x, y) => y.usedBytes - x.usedBytes).slice(0, 5);
    if (top.length === 0) {
      lines.push('- (no JS coverage data)');
    } else {
      for (const e of top) {
        let fn = '(inline)';
        if (e.url) {
          try { fn = path.basename(new URL(e.url).pathname); } catch { fn = e.url; }
        }
        lines.push(`- ${fn}: used ${e.usedBytes} of ${e.totalBytes} bytes`);
      }
    }
    lines.push('');
  }
  await fs.writeFile(path.join(OUT, 'action-coverage-summary.md'), lines.join('\n'));

  console.log(`[coverage:actions] wrote ${actions.length} action coverage files to ${OUT}`);
}

main().catch((err) => {
  console.error('[coverage:actions] fatal', err);
  process.exit(1);
});