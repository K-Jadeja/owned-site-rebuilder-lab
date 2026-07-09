// scripts/console-object-capture.mjs
//
// Capture full console objects via Playwright's `page.on('console')`,
// `msg.args()` and `arg.jsonValue()` to recover structured data
// (especially the `[onSave] Editor state saved` log which exposes
// the full tracks array).
//
// Outputs:
//   .rebuild/runtime/console-objects/console-object-log.json
//   .rebuild/runtime/console-objects/on-save-objects.json
//   .rebuild/runtime/console-objects/thumbnail-cache-objects.json
//   .rebuild/runtime/console-objects/console-object-summary.md
//
// Plus, if `[onSave]` data is recovered:
//   .rebuild/features/extracted-editor-state.json

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT = path.join(ROOT, '.rebuild/runtime/console-objects');

const SECRETS_RE = /(api[_-]?key|secret|token|cookie|authorization|set-cookie|password|bearer\s+[A-Za-z0-9_-]{8,})/i;

function redact(value, depth = 0) {
  if (depth > 6) return '<max-depth>';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 500) return value.slice(0, 500) + '...';
    if (SECRETS_RE.test(value)) return '<redacted>';
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).slice(0, 200)) {
      out[k] = redact(value[k], depth + 1);
    }
    return out;
  }
  return String(value);
}

function safeJson(v) {
  try {
    return JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'function' ? '<fn>' : val)));
  } catch {
    return '<unserializable>';
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(path.join(ROOT, '.rebuild/features'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const allMessages = [];
  const onSaveObjects = [];
  const thumbnailObjects = [];

  page.on('console', async (msg) => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      time: Date.now(),
      args: [],
    };
    try {
      const args = msg.args();
      for (let i = 0; i < Math.min(args.length, 10); i++) {
        const a = args[i];
        try {
          const jv = await a.jsonValue();
          entry.args.push(redact(jv));
        } catch {
          try {
            const v = await a.evaluate((x) => {
              try {
                return JSON.parse(JSON.stringify(x));
              } catch {
                return String(x);
              }
            });
            entry.args.push(redact(v));
          } catch {
            entry.args.push('<unserializable>');
          }
        }
      }
    } catch {}
    allMessages.push(entry);

    const t = entry.text || '';
    if (/\[onSave\]/i.test(t) || /editor state saved/i.test(t) || /tracks:/i.test(t)) {
      onSaveObjects.push(entry);
    }
    if (/thumbnail/i.test(t) || /ThumbnailCache/i.test(t)) {
      thumbnailObjects.push(entry);
    }
  });

  page.on('pageerror', (err) => {
    allMessages.push({ type: 'pageerror', text: err.message, time: Date.now(), args: [] });
  });

  console.log('[console-objects] navigating');
  await page.goto(TARGET, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // action 1: boot (already done)

  // action 2: single-file import
  try {
    const fileInput = await page.$('input[type="file"][accept^="video"]');
    if (fileInput) {
      await fileInput.setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('[console-objects] single-import failed', e.message);
  }

  // action 3: drag imported media to timeline
  try {
    const items = await page.$$('[draggable="true"]');
    if (items.length > 0) {
      const card = items[0];
      const cb = await card.boundingBox();
      if (cb) {
        const targets = await page.$$('[draggable="true"]');
        const tl = targets.find(async () => true);
        if (tl) {
          const tb = await tl.boundingBox();
          if (tb) {
            await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
            await page.mouse.down();
            await page.mouse.move(tb.x + 50, tb.y + tb.height / 2, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  } catch (e) {
    console.log('[console-objects] drag-failed', e.message);
  }

  // action 4: press space
  try {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
  } catch (e) {
    console.log('[console-objects] space-failed', e.message);
  }

  // action 5: zoom in/out/reset
  try {
    const zin = await page.$('button:has-text("Zoom in")');
    if (zin) await zin.click();
    await page.waitForTimeout(300);
    const zout = await page.$('button:has-text("Zoom out")');
    if (zout) await zout.click();
    await page.waitForTimeout(300);
    const zr = await page.$('button:has-text("Reset zoom")');
    if (zr) await zr.click();
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('[console-objects] zoom-failed', e.message);
  }

  // action 6: open Export dialog
  try {
    const eb = await page.$('button:has-text("Export Video")');
    if (eb) await eb.click();
    await page.waitForTimeout(700);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('[console-objects] export-failed', e.message);
  }

  // action 7: try trim/split shortcut keys
  for (const k of ['s', 'S', 'b', 'B', 't', 'T', 'c', 'C', 'x', 'X']) {
    try {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
    } catch {}
  }

  // action 8: click inspector tabs
  try {
    const labels = ['Settings', 'Style', 'AI', 'Crop', 'Position', 'Volume', 'Mute', 'Playback Speed'];
    for (const l of labels) {
      const t = await page.$(`button:has-text("${l}"), [role="tab"]:has-text("${l}")`);
      if (t) {
        try {
          await t.click();
          await page.waitForTimeout(250);
        } catch {}
      }
    }
  } catch {}

  // action 9: click animation/effect tabs
  try {
    const matches = await page.$$('button, [role="tab"]');
    for (const m of matches.slice(0, 50)) {
      const txt = (await m.innerText().catch(() => '')) || '';
      if (/Animations|Effects|Layout/i.test(txt)) {
        try {
          await m.click();
          await page.waitForTimeout(200);
        } catch {}
      }
    }
  } catch {}

  await page.waitForTimeout(500);

  await browser.close();

  // Write outputs
  await fs.writeFile(
    path.join(OUT, 'console-object-log.json'),
    JSON.stringify({ count: allMessages.length, messages: allMessages.slice(0, 5000) }, null, 2)
  );

  await fs.writeFile(
    path.join(OUT, 'on-save-objects.json'),
    JSON.stringify({ count: onSaveObjects.length, objects: onSaveObjects }, null, 2)
  );

  await fs.writeFile(
    path.join(OUT, 'thumbnail-cache-objects.json'),
    JSON.stringify({ count: thumbnailObjects.length, objects: thumbnailObjects }, null, 2)
  );

  // If we found [onSave] objects, try to extract the tracks array.
  let extracted = null;
  if (onSaveObjects.length > 0) {
    for (const o of onSaveObjects) {
      for (const arg of o.args) {
        if (arg && typeof arg === 'object' && (arg.tracks || arg.editorState)) {
          extracted = arg;
          break;
        }
      }
      if (extracted) break;
    }
  }

  if (extracted) {
    await fs.writeFile(
      path.join(ROOT, '.rebuild/features/extracted-editor-state.json'),
      JSON.stringify(extracted, null, 2)
    );
    console.log('[console-objects] extracted editor state with tracks');
  } else {
    console.log('[console-objects] no full onSave tracks array recovered from args');
  }

  // Summary
  const summary = [];
  summary.push('# Console Object Capture Summary');
  summary.push('');
  summary.push(`Generated: ${new Date().toISOString()}`);
  summary.push('');
  summary.push(`- Total console messages captured: ${allMessages.length}`);
  summary.push(`- onSave objects captured: ${onSaveObjects.length}`);
  summary.push(`- ThumbnailCache objects captured: ${thumbnailObjects.length}`);
  summary.push(`- Extracted editor state with tracks: ${extracted ? 'YES' : 'NO'}`);
  summary.push('');
  if (onSaveObjects.length > 0) {
    summary.push('## First 5 onSave messages (text only)');
    for (const o of onSaveObjects.slice(0, 5)) {
      summary.push(`- \`${(o.text || '').slice(0, 200)}\``);
    }
  }
  if (extracted) {
    summary.push('');
    summary.push('## Extracted keys');
    summary.push('```');
    summary.push(Object.keys(extracted).join(', '));
    summary.push('```');
  }
  await fs.writeFile(path.join(OUT, 'console-object-summary.md'), summary.join('\n'));

  console.log(`[console-objects] total=${allMessages.length} onSave=${onSaveObjects.length} thumbnail=${thumbnailObjects.length} extracted=${extracted ? 'yes' : 'no'}`);
}

main().catch((err) => {
  console.error('[console-objects] fatal', err);
  process.exit(1);
});
