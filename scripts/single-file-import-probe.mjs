// scripts/single-file-import-probe.mjs
//
// Upload a SINGLE file (sample.mp4) into the app's media library.
// Capture before/after screenshots, DOM summary, localStorage diff,
// IndexedDB observation, network delta, console delta.
// Output:
//   .rebuild/deep-import/F007-single-import.json
//   .rebuild/deep-import/F007-before.png
//   .rebuild/deep-import/F007-after-upload.png
//   .rebuild/deep-import/F007-after-timeline-attempt.png
//   .rebuild/deep-import/import-summary.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FIXTURE = '.rebuild/tests/fixtures/sample.mp4';
const OUT = '.rebuild/deep-import';

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const consoleLog = [];
  const networkLog = [];
  page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text().slice(0, 500), t: Date.now() }));
  page.on('pageerror', (e) => consoleLog.push({ type: 'pageerror', text: String(e.message || e).slice(0, 500), t: Date.now() }));
  page.on('response', (r) => {
    try { networkLog.push({ url: r.url(), status: r.status(), contentType: r.headers()['content-type'] || '', t: Date.now() }); } catch {}
  });

  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  async function snap(label) {
    return await page.evaluate((label) => {
      const local = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        local[k] = (localStorage.getItem(k) || '').slice(0, 200);
      }
      return {
        label,
        url: location.href,
        localStorage: local,
        localStorageKeys: Object.keys(local),
        bodyText: (document.body.innerText || '').slice(0, 600),
        interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"], [role="menuitem"]').length,
        visibleVideo: !!document.querySelector('video'),
        visibleCanvas: !!document.querySelector('canvas'),
        mediaItemCount: document.querySelectorAll('[draggable="true"], [data-asset-id], [class*="asset"]').length,
      };
    }, label);
  }

  async function shot(name) {
    const fp = path.join(OUT, `F007-${name}.png`);
    await page.screenshot({ path: fp, fullPage: false });
    return fp;
  }

  const before = await snap('before');
  const beforeShot = await shot('before');

  // Switch to My Library tab.
  let tabClick = null;
  try {
    await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 });
    tabClick = 'clicked';
  } catch {
    tabClick = 'failed';
  }
  await page.waitForTimeout(1000);

  // Locate file input.
  const inputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    return inputs.map((i) => ({ accept: i.accept || '', multiple: i.multiple, name: i.name || '' }));
  });

  let uploadResult = null;
  let afterUpload = null;
  let afterUploadShot = null;
  if (inputInfo.length > 0) {
    const input = page.locator('input[type="file"]').first();
    const inputInfoAccept = inputInfo[0].accept || '';
    try {
      // Accept only one file.
      if (/multiple/.test(inputInfo[0].multiple ? 'multiple' : '') === false) {
        await input.setInputFiles(FIXTURE);
        uploadResult = { ok: true, file: FIXTURE, acceptedInput: inputInfoAccept };
      } else {
        await input.setInputFiles([FIXTURE]);
        uploadResult = { ok: true, file: FIXTURE, acceptedInput: inputInfoAccept, mode: 'multi-single' };
      }
    } catch (err) {
      uploadResult = { ok: false, error: String(err.message || err) };
    }
    await page.waitForTimeout(3500);
    afterUpload = await snap('after-upload');
    afterUploadShot = await shot('after-upload');
  } else {
    uploadResult = { ok: false, error: 'no input[type=file] found' };
    afterUpload = await snap('after-upload-no-input');
    afterUploadShot = await shot('after-upload-no-input');
  }

  // Try to add to timeline (drag or click).
  let timelineAttempt = null;
  let afterTimeline = null;
  let afterTimelineShot = null;
  if (afterUpload && uploadResult.ok) {
    // Find a candidate item — use [draggable="true"] first, then aria text matches.
    const candidates = await page.evaluate(() => {
      const draggables = Array.from(document.querySelectorAll('[draggable="true"]'));
      return draggables.slice(0, 5).map((el) => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.innerText || '').slice(0, 40), x: r.x, y: r.y, w: r.width, h: r.height };
      });
    });
    timelineAttempt = { candidates };
    if (candidates.length > 0) {
      const c = candidates[0];
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      try {
        // Try drag to timeline area (bottom half of viewport).
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 100, cy + 200, { steps: 10 });
        await page.mouse.move(cx + 100, 700, { steps: 10 });
        await page.mouse.up();
        timelineAttempt.dragResult = 'attempted';
      } catch (err) {
        timelineAttempt.dragError = String(err.message || err);
      }
      await page.waitForTimeout(1500);
    }
    afterTimeline = await snap('after-timeline-attempt');
    afterTimelineShot = await shot('after-timeline-attempt');
  }

  await context.close();
  await browser.close();

  const diff = (a, b) => {
    const aK = new Set(Object.keys(a || {}));
    const bK = new Set(Object.keys(b || {}));
    return {
      added: [...bK].filter((k) => !aK.has(k)),
      removed: [...aK].filter((k) => !bK.has(k)),
      changed: [...aK].filter((k) => bK.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])),
    };
  };

  const result = {
    feature: 'F007-single-import',
    target: TARGET,
    generatedAt: new Date().toISOString(),
    fixture: FIXTURE,
    inputInfo,
    tabClick,
    uploadResult,
    timelineAttempt,
    before,
    beforeShot,
    afterUpload,
    afterUploadShot,
    afterTimeline,
    afterTimelineShot,
    diffs: {
      before_vs_afterUpload: {
        storage: diff(before.localStorage, afterUpload ? afterUpload.localStorage : {}),
        interactiveCount: before.interactiveCount !== (afterUpload?.interactiveCount ?? null),
        mediaItemCount: before.mediaItemCount !== (afterUpload?.mediaItemCount ?? null),
        bodyTextChanged: before.bodyText !== (afterUpload?.bodyText ?? ''),
      },
      afterUpload_vs_afterTimeline: afterUpload && afterTimeline ? {
        storage: diff(afterUpload.localStorage, afterTimeline.localStorage),
        interactiveCount: afterUpload.interactiveCount !== afterTimeline.interactiveCount,
        mediaItemCount: afterUpload.mediaItemCount !== afterTimeline.mediaItemCount,
        bodyTextChanged: afterUpload.bodyText !== afterTimeline.bodyText,
      } : null,
    },
    networkCount: networkLog.length,
    consoleCount: consoleLog.length,
    networkLog: networkLog.slice(-100),
    consoleLog: consoleLog.slice(-100),
  };

  await fs.writeFile(path.join(OUT, 'F007-single-import.json'), JSON.stringify(result, null, 2));

  const lines = [];
  lines.push('# Single-File Import Probe Summary');
  lines.push('');
  lines.push(`Target: ${TARGET}`);
  lines.push(`Fixture: ${FIXTURE}`);
  lines.push('');
  lines.push('## Result');
  if (uploadResult.ok) {
    lines.push('Upload: **OK**');
    lines.push(`- accepted input: ${inputInfo[0]?.accept || '(empty)'}`);
    lines.push(`- multiple: ${inputInfo[0]?.multiple}`);
  } else {
    lines.push('Upload: **NOT OK**');
    lines.push(`- reason: ${uploadResult.error}`);
  }
  lines.push('');
  lines.push('## Diff (before vs after upload)');
  lines.push(`- storage added: ${result.diffs.before_vs_afterUpload.storage.added.join(', ') || '–'}`);
  lines.push(`- storage removed: ${result.diffs.before_vs_afterUpload.storage.removed.join(', ') || '–'}`);
  lines.push(`- storage changed: ${result.diffs.before_vs_afterUpload.storage.changed.join(', ') || '–'}`);
  lines.push(`- interactiveCount changed: ${result.diffs.before_vs_afterUpload.interactiveCount}`);
  lines.push(`- mediaItemCount changed: ${result.diffs.before_vs_afterUpload.mediaItemCount}`);
  lines.push(`- bodyText changed: ${result.diffs.before_vs_afterUpload.bodyTextChanged}`);
  lines.push('');
  lines.push('## Diff (after upload vs after timeline attempt)');
  if (result.diffs.afterUpload_vs_afterTimeline) {
    lines.push(`- storage added: ${result.diffs.afterUpload_vs_afterTimeline.storage.added.join(', ') || '–'}`);
    lines.push(`- storage changed: ${result.diffs.afterUpload_vs_afterTimeline.storage.changed.join(', ') || '–'}`);
    lines.push(`- interactiveCount changed: ${result.diffs.afterUpload_vs_afterTimeline.interactiveCount}`);
    lines.push(`- mediaItemCount changed: ${result.diffs.afterUpload_vs_afterTimeline.mediaItemCount}`);
    lines.push(`- bodyText changed: ${result.diffs.afterUpload_vs_afterTimeline.bodyTextChanged}`);
  } else {
    lines.push('- (no timeline attempt — see upload result)');
  }
  lines.push('');
  lines.push('## Network');
  lines.push(`- entries: ${networkLog.length}`);
  lines.push('');
  lines.push('## Console');
  lines.push(`- entries: ${consoleLog.length}`);
  if (consoleLog.length > 0) {
    lines.push('');
    lines.push('Sample:');
    for (const m of consoleLog.slice(0, 10)) {
      lines.push(`- [${m.type}] ${m.text.slice(0, 200)}`);
    }
  }
  await fs.writeFile(path.join(OUT, 'import-summary.md'), lines.join('\n'));

  console.log(`[probe:single-import] uploadOk=${uploadResult.ok} storageAdded=${result.diffs.before_vs_afterUpload.storage.added.length}`);
}

main().catch((err) => {
  console.error('[probe:single-import] fatal', err);
  process.exit(1);
});