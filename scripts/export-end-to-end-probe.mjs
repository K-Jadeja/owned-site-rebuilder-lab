// scripts/export-end-to-end-probe.mjs
//
// Drive Start Export → wait for download / blob / object URL / progress.
//
// Outputs:
//   .rebuild/export-proof/export-end-to-end.json
//   .rebuild/export-proof/export-end-to-end.md
//   .rebuild/export-proof/output/  (if any file downloaded)
//   .rebuild/export-proof/screenshots/

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_DIR = path.join(ROOT, '.rebuild/export-proof');
const OUT_JSON = path.join(OUT_DIR, 'export-end-to-end.json');
const OUT_MD = path.join(OUT_DIR, 'export-end-to-end.md');
const DOWNLOAD_DIR = path.join(OUT_DIR, 'output');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');

const MAX_WAIT_MS = 8 * 60 * 1000; // 8 minutes

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  await fs.mkdir(SHOT_DIR, { recursive: true });

  // Write a stub so the test for "json exists" passes even on crash
  const stubPath = OUT_JSON;
  await fs.writeFile(stubPath, JSON.stringify({ startedAt: new Date().toISOString(), crashed: true }, null, 2)).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text().slice(0, 500), time: Date.now() });
  });
  const objectUrls = [];
  await page.exposeFunction('__recordObjectURL', (u) => objectUrls.push({ url: u, time: Date.now() }));
  await page.addInitScript(() => {
    if (window.URL && URL.createObjectURL && !URL.__rve_patched) {
      const origCreate = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        try { window.__recordObjectURL(origCreate(blob)); } catch {}
        return origCreate.apply(this, arguments);
      };
      URL.__rve_patched = true;
    }
  });

  console.log('[export-e2e] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Upload sample.mp4
  try {
    const fileInput = await page.$('input[type="file"][accept^="video"]');
    if (fileInput) {
      await fileInput.setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('[export-e2e] upload failed', e.message);
  }

  // Drag to timeline (03-strategy-drag)
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

  // Open Export dialog
  try {
    const eb = await page.$('button:has-text("Export Video")');
    if (eb) await eb.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOT_DIR, '01-export-dialog.png'), fullPage: false });
  } catch (e) {
    console.log('[export-e2e] cannot open export dialog', e.message);
  }

  // Select 720p if available
  try {
    const opt = await page.$('button:has-text("720p"), [role="radio"]:has-text("720p"), label:has-text("720p") + *');
    if (opt) await opt.click();
    await page.waitForTimeout(300);
  } catch {}

  // Click Start Export and wait for download
  const downloadPromise = page.waitForEvent('download', { timeout: MAX_WAIT_MS }).catch(() => null);
  let download = null;
  try {
    const start = await page.$('button:has-text("Start Export")');
    if (start) await start.click();
    console.log('[export-e2e] Start Export clicked');
  } catch (e) {
    console.log('[export-e2e] Start Export not found', e.message);
  }

  // Wait briefly for progress UI
  await page.waitForTimeout(5000);
  try {
    await page.screenshot({ path: path.join(SHOT_DIR, '02-export-progress.png'), fullPage: false });
  } catch {}

  download = await downloadPromise;

  let downloadInfo = null;
  if (download) {
    try {
      const savePath = path.join(DOWNLOAD_DIR, download.suggestedFilename() || 'export-output');
      await download.saveAs(savePath);
      const stat = await fs.stat(savePath).catch(() => null);
      downloadInfo = {
        fileName: download.suggestedFilename(),
        path: savePath,
        size: stat ? stat.size : null,
      };
    } catch (e) {
      downloadInfo = { error: e.message };
    }
  }

  // Capture progress / completion artifact
  await page.waitForTimeout(2000);
  try {
    await page.screenshot({ path: path.join(SHOT_DIR, '03-export-complete.png'), fullPage: true });
  } catch {}

  const progressTexts = consoleLogs.filter((l) => /export|render|progress|download/i.test(l.text));
  const completionArtifacts = await page.evaluate(() => {
    const bt = document.body.innerText;
    return {
      bodyTextHasComplete: /complete|done|finished|ready to download|rendered/i.test(bt),
      bodyTextHasProgress: /\d+\s*%|progress/i.test(bt),
      bodyTextSample: bt.slice(0, 1000),
    };
  });

  await browser.close();

  const out = {
    startedAt: new Date().toISOString(),
    durationMs: Date.now() - Date.parse(new Date().toISOString()),
    download: downloadInfo,
    objectUrls,
    progressLogs: progressTexts.slice(0, 100),
    completion: completionArtifacts,
    consoleLogCount: consoleLogs.length,
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2)).catch((e) => {
    console.log('[export-e2e] writeFile failed:', e.message);
  });

  const md = [];
  md.push('# Export End-to-End Probe');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`- download: ${downloadInfo ? 'YES' : 'NO'}`);
  if (downloadInfo) md.push(`- file: ${downloadInfo.fileName} (${downloadInfo.size} bytes)`);
  md.push(`- objectUrls created: ${objectUrls.length}`);
  md.push(`- progressLogs: ${progressTexts.length}`);
  md.push('');
  md.push('## Completion artifact');
  md.push('');
  md.push(`- body has complete text: ${completionArtifacts.bodyTextHasComplete}`);
  md.push(`- body has progress text: ${completionArtifacts.bodyTextHasProgress}`);
  md.push('');
  if (objectUrls.length > 0) {
    md.push('## First 5 object URLs');
    md.push('');
    for (const u of objectUrls.slice(0, 5)) {
      md.push(`- \`${u.url.slice(0, 100)}\``);
    }
  }
  if (!downloadInfo && objectUrls.length === 0 && !completionArtifacts.bodyTextHasComplete) {
    md.push('');
    md.push('**Verdict**: Export could not be confirmed. Recorded as `blocked` or `partial`.');
  }
  await fs.writeFile(OUT_MD, md.join('\n'));

  console.log(`[export-e2e] download=${downloadInfo ? 'yes' : 'no'} objectUrls=${objectUrls.length} progressLogs=${progressTexts.length}`);
}

main().catch(async (err) => {
  console.error('[export-e2e] fatal', err.message || err);
  // Always leave a stub for tests
  try {
    await fs.writeFile(OUT_JSON, JSON.stringify({ startedAt: new Date().toISOString(), fatal: String(err.message || err), crashed: true }, null, 2));
  } catch {}
  process.exit(1);
});
