// scripts/import-timeline-hardening.mjs
//
// After importing sample.mp4, try every safe way to add it to the
// timeline and detect any concrete timeline mutation.
//
// Outputs:
//   .rebuild/deep-import/import-timeline-hardening.md
//   .rebuild/deep-import/import-timeline-hardening.json
//   .rebuild/deep-import/screenshots/

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FIXTURE = '.rebuild/tests/fixtures/sample.mp4';
const OUT = '.rebuild/deep-import';
const SHOTS = `${OUT}/screenshots`;

async function main() {
  await fs.mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const consoleLog = [];
  page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text().slice(0, 500), t: Date.now() }));
  page.on('pageerror', (e) => consoleLog.push({ type: 'pageerror', text: String(e.message || e).slice(0, 500), t: Date.now() }));

  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2500);

  // 1. Switch to My Library.
  try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS, '01-my-library.png') });

  // 2. Upload sample.mp4.
  const input = page.locator('input[type="file"]').first();
  if (await input.count() === 0) {
    await context.close(); await browser.close();
    console.error('no file input');
    return;
  }
  await input.setInputFiles(FIXTURE);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SHOTS, '02-after-upload.png') });

  // 3. Snapshot after upload.
  const afterUpload = await page.evaluate(() => {
    const local = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      local[k] = (localStorage.getItem(k) || '').slice(0, 200);
    }
    const videos = Array.from(document.querySelectorAll('video')).map((v) => ({ src: v.src ? v.src.slice(0, 80) : null, duration: v.duration }));
    const imgs = Array.from(document.querySelectorAll('img')).map((i) => ({ src: i.src ? i.src.slice(0, 80) : null }));
    return {
      url: location.href,
      storage: local,
      videoCount: videos.length,
      videoInfo: videos.slice(0, 5),
      imgCount: imgs.length,
      bodyText: (document.body.innerText || '').slice(0, 800),
      interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"]').length,
      draggables: Array.from(document.querySelectorAll('[draggable="true"]')).length,
      advancedTimelineStore: localStorage.getItem('advanced-timeline-store'),
    };
  });

  // 4. Try various add-to-timeline strategies.
  const attempts = [];

  async function snapAfter(label, action) {
    const before = await page.evaluate(() => ({
      advancedTimelineStore: localStorage.getItem('advanced-timeline-store'),
      bodyText: (document.body.innerText || '').slice(0, 800),
      videoCount: document.querySelectorAll('video').length,
      imgCount: document.querySelectorAll('img').length,
      draggables: document.querySelectorAll('[draggable="true"]').length,
      interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"]').length,
    }));
    let err = null;
    try { await action(); } catch (e) { err = String(e.message || e); }
    await page.waitForTimeout(2000);
    const after = await page.evaluate(() => ({
      advancedTimelineStore: localStorage.getItem('advanced-timeline-store'),
      bodyText: (document.body.innerText || '').slice(0, 800),
      videoCount: document.querySelectorAll('video').length,
      imgCount: document.querySelectorAll('img').length,
      draggables: document.querySelectorAll('[draggable="true"]').length,
      interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"]').length,
    }));
    await page.screenshot({ path: path.join(SHOTS, `${label}.png`) });
    const changed = {
      storage: before.advancedTimelineStore !== after.advancedTimelineStore,
      bodyText: before.bodyText !== after.bodyText,
      videoCount: before.videoCount !== after.videoCount,
      imgCount: before.imgCount !== after.imgCount,
      draggables: before.draggables !== after.draggables,
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    };
    attempts.push({ label, err, before, after, changed });
  }

  // Strategy A: try drag of first draggable to lower half of screen.
  await snapAfter('03-strategy-drag', async () => {
    const draggables = page.locator('[draggable="true"]');
    const count = await draggables.count();
    if (count === 0) throw new Error('no draggable elements');
    const box = await draggables.first().boundingBox();
    if (!box) throw new Error('no box for first draggable');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 200, { steps: 10 });
    await page.mouse.move(box.x + box.width / 2 + 100, 720, { steps: 10 });
    await page.mouse.up();
  });

  // Strategy B: try double-click on the first draggable.
  await snapAfter('04-strategy-dblclick', async () => {
    const draggables = page.locator('[draggable="true"]');
    const count = await draggables.count();
    if (count === 0) throw new Error('no draggable elements');
    await draggables.first().dblclick({ timeout: 2000 });
  });

  // Strategy C: try Enter on focused draggable.
  await snapAfter('05-strategy-enter', async () => {
    const draggables = page.locator('[draggable="true"]');
    const count = await draggables.count();
    if (count === 0) throw new Error('no draggable elements');
    await draggables.first().focus().catch(() => {});
    await page.keyboard.press('Enter');
  });

  // Strategy D: look for an "Add to timeline" or "Use" button near the media card.
  await snapAfter('06-strategy-button', async () => {
    const labels = ['Add to timeline', 'Add to Timeline', 'Use', 'Insert', 'Add', 'Add to project'];
    for (const lbl of labels) {
      try {
        const btn = page.getByRole('button', { name: new RegExp(lbl, 'i') }).first();
        if (await btn.count() > 0) {
          await btn.click({ timeout: 1500 });
          return;
        }
      } catch {}
    }
    throw new Error('no add-to-timeline button found');
  });

  // Strategy E: drag from a known media card location to the timeline ruler.
  await snapAfter('07-strategy-targeted-drag', async () => {
    // Find the timeline area (lower half) by selecting a clip-y region.
    const allDraggables = await page.locator('[draggable="true"]').all();
    if (allDraggables.length === 0) throw new Error('no draggable');
    const mediaCard = allDraggables[0];
    const mediaBox = await mediaCard.boundingBox();
    if (!mediaBox) throw new Error('no media box');
    // Find the timeline ruler area: any element whose class contains "ruler" or "timeline" or whose y > 500.
    let timelineBox = null;
    const cands = await page.evaluate(() => {
      const list = [];
      const all = document.querySelectorAll('[class*="ruler" i], [class*="timeline" i], [class*="track-area" i]');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.y > 400) {
          list.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: typeof el.className === 'string' ? el.className.slice(0, 80) : '' });
        }
      }
      return list;
    });
    if (cands.length > 0) {
      timelineBox = { x: cands[0].x + 50, y: cands[0].y + cands[0].h / 2, w: cands[0].w, h: cands[0].h };
    } else {
      timelineBox = { x: 400, y: 700, w: 100, h: 50 };
    }
    await page.mouse.move(mediaBox.x + mediaBox.width / 2, mediaBox.y + mediaBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(mediaBox.x + mediaBox.width / 2 + 50, mediaBox.y + mediaBox.height / 2 + 30, { steps: 10 });
    await page.mouse.move(timelineBox.x, timelineBox.y, { steps: 10 });
    await page.mouse.up();
  });

  // Final snapshot.
  await page.screenshot({ path: path.join(SHOTS, '08-final.png'), fullPage: false });
  const final = await page.evaluate(() => ({
    advancedTimelineStore: localStorage.getItem('advanced-timeline-store'),
    videoCount: document.querySelectorAll('video').length,
    bodyText: (document.body.innerText || '').slice(0, 600),
  }));

  await context.close();
  await browser.close();

  // Determine which attempt caused a mutation.
  let firstMutation = null;
  for (const a of attempts) {
    if (a.changed.storage || a.changed.videoCount || a.changed.imgCount || a.changed.interactiveCount) {
      firstMutation = a;
      break;
    }
  }

  const result = {
    target: TARGET,
    generatedAt: new Date().toISOString(),
    fixture: FIXTURE,
    afterUpload,
    attempts,
    final,
    firstMutation: firstMutation ? firstMutation.label : null,
    timelineAddProven: !!firstMutation && (firstMutation.changed.storage || firstMutation.changed.videoCount),
    consoleLogs: consoleLog.filter((c) => /TimelineCache|onSave|Editor state|sprite|timeline|video-/i.test(c.text || '')),
  };

  await fs.writeFile(path.join(OUT, 'import-timeline-hardening.json'), JSON.stringify(result, null, 2));

  const lines = [];
  lines.push('# Import → Timeline Hardening');
  lines.push('');
  lines.push(`Target: ${TARGET}`);
  lines.push(`Fixture: ${FIXTURE}`);
  lines.push('');
  lines.push(`## Result: timeline add **${result.timelineAddProven ? 'PROVEN' : 'not yet proven'}**`);
  if (firstMutation) lines.push(`- first mutation: ${firstMutation.label}`);
  lines.push('');
  lines.push('## After upload');
  lines.push('');
  lines.push(`- video elements: ${afterUpload.videoCount}`);
  lines.push(`- img elements: ${afterUpload.imgCount}`);
  lines.push(`- draggable elements: ${afterUpload.draggables}`);
  lines.push(`- interactive count: ${afterUpload.interactiveCount}`);
  lines.push(`- advanced-timeline-store: ${afterUpload.advancedTimelineStore ? 'present' : 'absent'}`);
  lines.push('');
  lines.push('## Strategy attempts');
  lines.push('');
  lines.push('| Strategy | Err | storage changed | bodyText changed | videoCount changed | imgCount changed | draggables changed |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const a of attempts) {
    lines.push(`| ${a.label} | ${a.err ? a.err.slice(0, 30) : 'ok'} | ${a.changed.storage} | ${a.changed.bodyText} | ${a.changed.videoCount} | ${a.changed.imgCount} | ${a.changed.draggables} |`);
  }
  lines.push('');
  lines.push('## Final');
  lines.push('');
  lines.push(`- video elements: ${final.videoCount}`);
  lines.push(`- advanced-timeline-store: ${final.advancedTimelineStore ? 'present' : 'absent'}`);
  if (result.consoleLogs && result.consoleLogs.length > 0) {
    lines.push('');
    lines.push('## Relevant console messages');
    for (const c of result.consoleLogs.slice(0, 20)) {
      lines.push(`- [${c.type}] ${(c.text || '').slice(0, 200)}`);
    }
  }
  await fs.writeFile(path.join(OUT, 'import-timeline-hardening.md'), lines.join('\n'));

  console.log(`[probe:import-timeline] attempts=${attempts.length} firstMutation=${firstMutation ? firstMutation.label : 'none'}`);
}

main().catch((err) => {
  console.error('[probe:import-timeline] fatal', err);
  process.exit(1);
});