// scripts/action-coverage-cdp.mjs
//
// CDP-based precise coverage per action. Outputs:
//   .rebuild/runtime/coverage/<action>.json
//   .rebuild/runtime/coverage/action-coverage-summary.md
//   .rebuild/runtime/coverage/action-to-bundle-map.json
//
// Overwrites the Playwright-coverage outputs from action-coverage-map.mjs.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime/coverage';

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Profiler.enable');
  await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  async function safeAction(label, fn) {
    const before = await client.send('Profiler.takePreciseCoverage');
    let err = null;
    try { await fn(); } catch (e) { err = String(e.message || e); }
    await page.waitForTimeout(800);
    const after = await client.send('Profiler.takePreciseCoverage');
    // Compute deltas: how many new covered bytes per URL.
    const beforeBytes = new Map();
    for (const e of before.result || []) {
      let s = 0;
      for (const f of e.functions || []) for (const r of f.ranges || []) s += r.endOffset - r.startOffset;
      beforeBytes.set(e.url, s);
    }
    const delta = [];
    for (const e of after.result || []) {
      let s = 0;
      const ranges = [];
      for (const f of e.functions || []) {
        for (const r of f.ranges || []) {
          s += r.endOffset - r.startOffset;
          ranges.push({ fnName: f.functionName || null, startOffset: r.startOffset, endOffset: r.endOffset, count: r.count });
        }
      }
      const beforeS = beforeBytes.get(e.url) || 0;
      delta.push({
        url: e.url,
        usedBytes: s - beforeS,
        totalUsedBytes: s,
        fnCount: (e.functions || []).length,
        sampleRanges: ranges.slice(0, 6),
      });
    }
    delta.sort((a, b) => b.usedBytes - a.usedBytes);
    return { label, err, delta };
  }

  const actions = [];
  actions.push(await safeAction('boot', async () => { await page.waitForTimeout(1200); }));
  actions.push(await safeAction('dark-toggle', async () => {
    try { await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 }); } catch {}
  }));
  actions.push(await safeAction('export-dialog', async () => {
    try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
  }));
  actions.push(await safeAction('playback-space', async () => {
    await page.evaluate(() => window.focus());
    await page.keyboard.press('Space');
    await page.waitForTimeout(700);
    await page.keyboard.press('Space');
  }));
  actions.push(await safeAction('undo-redo', async () => {
    await page.evaluate(() => window.focus());
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

  await client.send('Profiler.stopPreciseCoverage');
  await context.close();
  await browser.close();

  // Persist per-action files.
  for (const a of actions) {
    await fs.writeFile(path.join(OUT, `${a.label}.json`), JSON.stringify(a, null, 2));
  }

  // Summary table.
  const map = {};
  for (const a of actions) {
    const positive = a.delta.filter((d) => d.usedBytes > 0);
    map[a.label] = {
      err: a.err,
      positiveDelta: positive.slice(0, 10).map((d) => ({ url: d.url, usedBytes: d.usedBytes, fnCount: d.fnCount, sampleRanges: d.sampleRanges.slice(0, 3) })),
      topUrl: positive[0] ? positive[0].url : (a.delta[0] ? a.delta[0].url : null),
      totalUsedDelta: positive.reduce((s, d) => s + d.usedBytes, 0),
    };
  }
  await fs.writeFile(path.join(OUT, 'action-to-bundle-map.json'), JSON.stringify(map, null, 2));

  const lines = [];
  lines.push('# Action Coverage Summary (CDP preciseCoverage)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push('Coverage was collected via CDP `Profiler.startPreciseCoverage` with `detailed: true, callCount: true`.');
  lines.push('For each action we report the bytes newly covered (delta from previous take) summed across all scripts.');
  lines.push('');
  lines.push('| Action | Err | New covered bytes (positive) | Top script URL |');
  lines.push('| --- | --- | --- | --- |');
  for (const a of actions) {
    const positive = a.delta.filter((d) => d.usedBytes > 0);
    let topName = '–';
    if (positive[0] && positive[0].url) {
      try { topName = path.basename(new URL(positive[0].url).pathname); } catch { topName = positive[0].url; }
    }
    lines.push(`| ${a.label} | ${a.err ? a.err.slice(0, 40) : 'ok'} | ${positive.reduce((s, d) => s + d.usedBytes, 0)} | ${topName} |`);
  }
  lines.push('');
  lines.push('## Per-action top scripts (positive deltas)');
  lines.push('');
  for (const a of actions) {
    lines.push(`### ${a.label}`);
    const positive = a.delta.filter((d) => d.usedBytes > 0);
    if (positive.length === 0) {
      lines.push('- (no positive delta — script coverage reset between takes)');
    } else {
      for (const d of positive.slice(0, 8)) {
        let fn = '(inline)';
        if (d.url) { try { fn = path.basename(new URL(d.url).pathname); } catch { fn = d.url; } }
        lines.push(`- ${fn}: +${d.usedBytes} bytes (${d.fnCount} functions)`);
        for (const r of d.sampleRanges.slice(0, 3)) {
          lines.push(`  - ${r.fnName || '(anon)'} @ ${r.startOffset}-${r.endOffset} called ${r.count}x`);
        }
      }
    }
    lines.push('');
  }
  await fs.writeFile(path.join(OUT, 'action-coverage-summary.md'), lines.join('\n'));

  console.log(`[coverage:cdp] actions=${actions.length} totalDelta=${actions.reduce((s, a) => s + a.delta.reduce((x, d) => x + d.usedBytes, 0), 0)}`);
}

main().catch((err) => {
  console.error('[coverage:cdp] fatal', err);
  process.exit(1);
});