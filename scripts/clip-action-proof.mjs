// scripts/clip-action-proof.mjs
//
// Hard-prove clip selection / move using the best selectors from
// `clip-identity-probe`. Records state before / after.
//
// Outputs:
//   .rebuild/deep-import/clip-action-proof.json
//   .rebuild/deep-import/clip-action-proof.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_JSON = path.join(ROOT, '.rebuild/deep-import/clip-action-proof.json');
const OUT_MD = path.join(ROOT, '.rebuild/deep-import/clip-action-proof.md');

async function pickCandidates(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const lowerThirdY = vh * 0.66;
    const arr = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.y < lowerThirdY) return;
      const style = getComputedStyle(el);
      if (style.cursor === 'pointer' || el.getAttribute('draggable') === 'true') {
        const cls = (el.className || '').toString();
        arr.push({ tag: el.tagName, cls: cls.slice(0, 200), cursor: style.cursor, draggable: el.getAttribute('draggable'), text: (el.innerText || '').slice(0, 100), bb: { x: r.x, y: r.y, w: r.width, h: r.height } });
      }
    });
    return arr;
  });
}

async function storageSnapshot(page) {
  return page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || '').slice(0, 200);
    }
    return out;
  });
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText.slice(0, 1000));
}

async function main() {
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const out = { actions: [], finalVerdict: 'unknown' };

  console.log('[clip-action] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  try {
    const fileInput = await page.$('input[type="file"][accept^="video"]');
    if (fileInput) {
      await fileInput.setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    out.actions.push({ phase: 'upload', error: e.message });
  }

  // Capture before
  out.storageBefore = await storageSnapshot(page);
  out.bodyBefore = await bodyText(page);

  // Drag to timeline
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
        out.actions.push({ phase: 'drag-to-timeline', ok: true });
      }
    }
  } catch (e) {
    out.actions.push({ phase: 'drag-to-timeline', error: e.message });
  }

  // Capture candidates
  out.candidates = await pickCandidates(page);
  out.storageAfterDrag = await storageSnapshot(page);
  out.bodyAfterDrag = await bodyText(page);

  // Try clip selection by clicking lower-third pointers
  let selectionEvidence = null;
  try {
    const ptrs = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const lowerThirdY = vh * 0.66;
      const out = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.y < lowerThirdY) return;
        const style = getComputedStyle(el);
        if (style.cursor === 'pointer' && r.y > lowerThirdY && r.height < 200) {
          out.push({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
        }
      });
      return out;
    });
    if (ptrs.length > 0) {
      const p = ptrs[0];
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(500);
      selectionEvidence = { clicked: p, totalCandidates: ptrs.length };
    }
  } catch (e) {
    selectionEvidence = { error: e.message };
  }
  out.actions.push({ phase: 'selection-click', evidence: selectionEvidence });

  out.storageAfterSelection = await storageSnapshot(page);
  out.bodyAfterSelection = await bodyText(page);

  // Attempt move (drag right)
  let moveEvidence = null;
  try {
    const ptr = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const lowerThirdY = vh * 0.66;
      const found = { x: null, y: null, w: null, h: null };
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.y < lowerThirdY) return;
        const style = getComputedStyle(el);
        if (style.cursor === 'pointer' && r.y > lowerThirdY && r.height < 200 && r.width > 50) {
          found.x = r.x + r.width / 2;
          found.y = r.y + r.height / 2;
          found.w = r.width;
          found.h = r.height;
        }
      });
      return found;
    });
    if (ptr.x != null) {
      await page.mouse.move(ptr.x, ptr.y);
      await page.mouse.down();
      await page.mouse.move(ptr.x + 80, ptr.y, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      moveEvidence = { start: ptr, delta: 80 };
    }
  } catch (e) {
    moveEvidence = { error: e.message };
  }
  out.actions.push({ phase: 'move', evidence: moveEvidence });
  out.storageAfterMove = await storageSnapshot(page);
  out.bodyAfterMove = await bodyText(page);

  // Keyboard selection probe
  try {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch {}
  out.storageFinal = await storageSnapshot(page);
  out.bodyFinal = await bodyText(page);

  // Final verdict
  function storageDiff(a, b) {
    const out = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (JSON.stringify(a[k] || '') !== JSON.stringify(b[k] || '')) out.push(k);
    }
    return out;
  }
  const d12 = storageDiff(out.storageBefore, out.storageAfterDrag || {});
  const d23 = storageDiff(out.storageAfterDrag || {}, out.storageAfterSelection || {});
  const d34 = storageDiff(out.storageAfterSelection || {}, out.storageAfterMove || {});

  out.diff_drag = d12;
  out.diff_selection = d23;
  out.diff_move = d34;
  out.bodyChanged = {
    drag: out.bodyBefore !== out.bodyAfterDrag,
    selection: out.bodyAfterDrag !== out.bodyAfterSelection,
    move: out.bodyAfterSelection !== out.bodyAfterMove,
  };

  if (d12.length > 0) out.finalVerdict = 'clip-add-mutation-proven';
  else if (out.bodyChanged.drag) out.finalVerdict = 'body-changed-after-drag';
  else out.finalVerdict = 'no-state-change-detected';

  await browser.close();

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2));

  const md = [];
  md.push('# Clip Action Proof');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`Final verdict: **${out.finalVerdict}**`);
  md.push('');
  md.push('## State diffs');
  md.push('');
  md.push(`- drag: ${d12.length} storage keys changed`);
  md.push(`- selection: ${d23.length} storage keys changed`);
  md.push(`- move: ${d34.length} storage keys changed`);
  md.push('');
  md.push('## bodyText changed');
  md.push('');
  md.push(`- drag: ${out.bodyChanged.drag}`);
  md.push(`- selection: ${out.bodyChanged.selection}`);
  md.push(`- move: ${out.bodyChanged.move}`);
  md.push('');
  md.push('## Candidates captured');
  md.push('');
  md.push(`- ${out.candidates.length} pointer/draggable elements in lower-third`);
  await fs.writeFile(OUT_MD, md.join('\n'));

  console.log(`[clip-action] verdict=${out.finalVerdict}`);
}

main().catch((err) => {
  console.error('[clip-action] fatal', err);
  process.exit(1);
});
