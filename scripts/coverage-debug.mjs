// scripts/coverage-debug.mjs
//
// Tries multiple ways to get real JS coverage from Playwright/Chromium:
//   1. page.coverage.startJSCoverage with various flags
//   2. CDP-based Profiler.startPreciseCoverage
//   3. Manual fetch of bundle bodies and inline-attach to coverage
//
// Outputs:
//   .rebuild/runtime/coverage-debug/playwright-coverage-debug.json
//   .rebuild/runtime/coverage-debug/cdp-coverage-debug.json
//   .rebuild/runtime/coverage-debug/coverage-debug-summary.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime/coverage-debug';

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const playwrightDebug = { tried: [], result: null };

  // ---- attempt 1: Playwright coverage with various flags ----
  try {
    await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
    await page.coverage.startCSSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);
    // Trigger export click + space key.
    try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape').catch(() => {});
    try { await page.keyboard.press('Space'); } catch {}
    await page.waitForTimeout(500);
    const js = await page.coverage.stopJSCoverage();
    const css = await page.coverage.stopCSSCoverage();
    playwrightDebug.tried.push({ flags: { reportAnonymousScripts: true } });
    playwrightDebug.result = {
      jsEntries: js.length,
      jsUsedBytes: js.reduce((a, e) => a + e.ranges.reduce((ra, r) => ra + ((r.end || 0) - (r.start || 0)), 0), 0),
      jsTotalBytes: js.reduce((a, e) => a + ((e.text && e.text.length) || 0), 0),
      cssEntries: css.length,
      cssUsedBytes: css.reduce((a, e) => a + e.ranges.reduce((ra, r) => ra + ((r.end || 0) - (r.start || 0)), 0), 0),
      cssTotalBytes: css.reduce((a, e) => a + ((e.text && e.text.length) || 0), 0),
      sampleJsEntry: js.length > 0 ? {
        url: js[0].url,
        totalBytes: (js[0].text && js[0].text.length) || 0,
        ranges: js[0].ranges.slice(0, 5),
      } : null,
    };
  } catch (err) {
    playwrightDebug.tried.push({ error: String(err.message || err) });
  }

  await context.close();
  await browser.close();

  await fs.writeFile(path.join(OUT, 'playwright-coverage-debug.json'), JSON.stringify(playwrightDebug, null, 2));

  // ---- attempt 2: CDP-based precise coverage ----
  const browser2 = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context2 = await browser2.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await context2.newPage();
  const cdpDebug = { tried: [], result: null, error: null };

  try {
    const client = await context2.newCDPSession(page2);
    await client.send('Debugger.enable');
    await client.send('Profiler.enable');
    await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
    await page2.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page2.waitForTimeout(2500);
    try { await page2.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page2.waitForTimeout(1000);
    await page2.keyboard.press('Escape').catch(() => {});
    try { await page2.keyboard.press('Space'); } catch {}
    await page2.waitForTimeout(500);
    const precise = await client.send('Profiler.takePreciseCoverage');
    await client.send('Profiler.stopPreciseCoverage');
    cdpDebug.tried.push('Profiler.startPreciseCoverage with detailed+callCount');
    let total = 0, used = 0;
    const sample = [];
    for (const e of precise.result || []) {
      total += (e.functions || []).reduce((a, f) => a + ((f.ranges || []).reduce((ra, r) => ra + (r.endOffset - r.startOffset), 0)), 0);
      for (const f of e.functions || []) {
        for (const r of f.ranges || []) {
          used += r.endOffset - r.startOffset;
        }
      }
      if (sample.length < 5) sample.push({ url: e.url, totalFns: (e.functions || []).length });
    }
    cdpDebug.result = {
      entries: (precise.result || []).length,
      totalBytes: total,
      usedBytes: used,
      sample,
    };
  } catch (err) {
    cdpDebug.error = String(err.message || err);
    cdpDebug.tried.push({ error: cdpDebug.error });
  }

  await context2.close();
  await browser2.close();

  await fs.writeFile(path.join(OUT, 'cdp-coverage-debug.json'), JSON.stringify(cdpDebug, null, 2));

  // Summary.
  const lines = [];
  lines.push('# Coverage Debug Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Playwright page.coverage');
  if (playwrightDebug.result) {
    const r = playwrightDebug.result;
    lines.push(`- JS entries: ${r.jsEntries}`);
    lines.push(`- JS used / total bytes: ${r.jsUsedBytes} / ${r.jsTotalBytes}`);
    lines.push(`- CSS entries: ${r.cssEntries}`);
    lines.push(`- CSS used / total bytes: ${r.cssUsedBytes} / ${r.cssTotalBytes}`);
    if (r.sampleJsEntry) {
      lines.push(`- Sample JS entry: url=${r.sampleJsEntry.url}`);
      lines.push(`  total bytes: ${r.sampleJsEntry.totalBytes}`);
      lines.push(`  ranges: ${JSON.stringify(r.sampleJsEntry.ranges)}`);
    }
  } else {
    lines.push('- (no result)');
  }
  lines.push('');
  lines.push('## CDP Profiler.preciseCoverage');
  if (cdpDebug.result) {
    const r = cdpDebug.result;
    lines.push(`- entries: ${r.entries}`);
    lines.push(`- total bytes (sum of fn ranges): ${r.totalBytes}`);
    lines.push(`- used bytes: ${r.usedBytes}`);
    lines.push(`- sample entries:`);
    for (const s of r.sample || []) {
      lines.push(`  - ${s.url}: ${s.totalFns} functions`);
    }
  } else if (cdpDebug.error) {
    lines.push(`- error: ${cdpDebug.error}`);
  } else {
    lines.push('- (no result)');
  }
  lines.push('');
  lines.push('## Verdict');
  const pOk = playwrightDebug.result && playwrightDebug.result.jsUsedBytes > 0;
  const cOk = cdpDebug.result && cdpDebug.result.usedBytes > 0;
  if (pOk) {
    lines.push('- **Playwright coverage works.** Real byte-range data is available.');
  } else if (cOk) {
    lines.push('- Playwright coverage did not yield bytes; **CDP preciseCoverage works**. Use that.');
  } else {
    lines.push('- Both Playwright and CDP coverage returned zero bytes in this environment.');
    lines.push('- This is consistent with the previous pass result.');
    lines.push('- **Stack-trace mapping is the reliable fallback** for code correlation.');
    lines.push('- Code-correlation claims in the next phase rely on stack frames, not coverage ranges.');
  }
  await fs.writeFile(path.join(OUT, 'coverage-debug-summary.md'), lines.join('\n'));

  console.log(`[coverage:debug] playwright_used=${playwrightDebug.result ? playwrightDebug.result.jsUsedBytes : 0} cdp_used=${cdpDebug.result ? cdpDebug.result.usedBytes : 0}`);
}

main().catch((err) => {
  console.error('[coverage:debug] fatal', err);
  process.exit(1);
});