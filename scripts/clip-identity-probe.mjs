// scripts/clip-identity-probe.mjs
//
// Hard probe for stable clip / track selectors AFTER import → timeline.
//
// Outputs:
//   .rebuild/features/clip-identity-map.json
//   .rebuild/features/clip-identity-map.md
//   .rebuild/deep-import/clip-identity-proof.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_DIR = path.join(ROOT, '.rebuild/deep-import/screenshots');
const OUT_JSON = path.join(ROOT, '.rebuild/features/clip-identity-map.json');
const OUT_MD = path.join(ROOT, '.rebuild/features/clip-identity-map.md');
const OUT_PROOF = path.join(ROOT, '.rebuild/deep-import/clip-identity-proof.md');

function bb(el, page) {
  return el.boundingBox().catch(() => null);
}

async function candidateSnapshot(page, handle, region) {
  return page.evaluate(
    ({ idx, region }) => {
      const el = window.__clipCandidates && window.__clipCandidates[idx];
      if (!el) return null;
      const style = getComputedStyle(el);
      const bb = el.getBoundingClientRect();
      const fiberKey = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
      let componentName = null;
      let propKeys = [];
      if (fiberKey) {
        let fiber = el[fiberKey];
        while (fiber) {
          if (fiber.elementType && typeof fiber.elementType === 'function') {
            componentName = fiber.elementType.displayName || fiber.elementType.name || 'fn';
            try {
              const props = fiber.memoizedProps || fiber.pendingProps || {};
              propKeys = Object.keys(props || {}).slice(0, 30);
            } catch {}
            break;
          }
          fiber = fiber.return;
        }
      }
      return {
        region,
        tag: el.tagName,
        role: el.getAttribute('role'),
        aria: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        className: (el.className || '').toString().slice(0, 200),
        text: (el.innerText || '').slice(0, 200),
        dataAttrs: [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `${a.name}=${a.value}`),
        draggable: el.getAttribute('draggable'),
        cursor: style.cursor,
        position: style.position,
        left: style.left,
        width: style.width,
        transform: style.transform,
        bb: { x: bb.x, y: bb.y, w: bb.width, h: bb.height },
        componentName,
        propKeys,
      };
    },
    { idx: Number(handle), region }
  );
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });
  await fs.mkdir(path.dirname(OUT_PROOF), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const snapshots = { before: null, afterUpload: null, afterDrag: null };
  const candidates = { before: [], afterUpload: [], afterDrag: [] };

  async function captureSnapshot(page, tag) {
    const data = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const lowerThirdY = vh * 0.66;
      const result = { vw, vh, candidates: [], count: 0 };
      // Lower-third candidates: y > lowerThirdY
      const all = document.querySelectorAll('*');
      all.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        // timeline usually lower-third
        if (r.y < lowerThirdY) return;
        const style = getComputedStyle(el);
        const cursor = style.cursor;
        const isInteractive = cursor === 'pointer' || cursor === 'grab' || cursor === 'ew-resize';
        const hasVideo = el.querySelector && el.querySelector('video, canvas, img');
        const isDraggable = el.getAttribute && el.getAttribute('draggable') === 'true';
        const inLower = r.y >= lowerThirdY && r.y < vh;
        const looksLikeClip =
          isInteractive ||
          isDraggable ||
          (hasVideo && inLower) ||
          (inLower && r.width > 30 && r.width < 800 && r.height < 200);
        if (!looksLikeClip) return;
        const cls = (el.className || '').toString();
        const fiberKey = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
        let componentName = null;
        if (fiberKey) {
          let fiber = el[fiberKey];
          while (fiber) {
            if (fiber.elementType && typeof fiber.elementType === 'function') {
              componentName = fiber.elementType.displayName || fiber.elementType.name || 'fn';
              break;
            }
            fiber = fiber.return;
          }
        }
        result.candidates.push({
          tag: el.tagName,
          role: el.getAttribute && el.getAttribute('role'),
          aria: el.getAttribute && el.getAttribute('aria-label'),
          title: el.getAttribute && el.getAttribute('title'),
          className: cls.slice(0, 200),
          text: (el.innerText || '').slice(0, 100),
          dataAttrs: [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `${a.name}=${a.value}`),
          draggable: el.getAttribute && el.getAttribute('draggable'),
          cursor,
          position: style.position,
          left: style.left,
          width: style.width,
          bb: { x: r.x, y: r.y, w: r.width, h: r.height },
          componentName,
        });
      });
      result.count = result.candidates.length;
      // Store them globally for later use
      window.__clipCandidates = result.candidates;
      return result;
    });
    snapshots[tag] = { vw: data.vw, vh: data.vh, count: data.count };
    candidates[tag] = data.candidates;
  }

  console.log('[clip-identity] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  await captureSnapshot(page, 'before');

  // Upload sample.mp4
  try {
    const fileInput = await page.$('input[type="file"][accept^="video"]');
    if (fileInput) {
      await fileInput.setInputFiles(SAMPLE);
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.log('[clip-identity] upload failed', e.message);
  }
  await captureSnapshot(page, 'afterUpload');

  // Capture storage + bodyText before drag
  const storageBefore = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || '').slice(0, 100);
    }
    return out;
  });
  const bodyTextBefore = (await page.evaluate(() => document.body.innerText)).slice(0, 500);

  // Drag strategy 03 — drag a draggable to another draggable
  let dragResult = 'no-drag-attempted';
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
        await page.waitForTimeout(1000);
        dragResult = 'drag-executed';
      }
    }
  } catch (e) {
    dragResult = `error: ${e.message}`;
  }

  await captureSnapshot(page, 'afterDrag');

  const storageAfter = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || '').slice(0, 100);
    }
    return out;
  });
  const bodyTextAfter = (await page.evaluate(() => document.body.innerText)).slice(0, 500);

  await browser.close();

  // Persist
  await fs.writeFile(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        snapshots,
        candidates,
        storage: { before: storageBefore, after: storageAfter },
        bodyText: { before: bodyTextBefore, after: bodyTextAfter, changed: bodyTextBefore !== bodyTextAfter },
        dragResult,
      },
      null,
      2
    )
  );

  // Markdown summary
  const md = [];
  md.push('# Clip Identity Map');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('Snapshot counts (lower-third candidates):');
  md.push('');
  md.push(`- before: ${snapshots.before.count}`);
  md.push(`- afterUpload: ${snapshots.afterUpload.count}`);
  md.push(`- afterDrag: ${snapshots.afterDrag.count}`);
  md.push('');
  md.push(`Storage keys added by drag:`);
  md.push('');
  const beforeKeys = new Set(Object.keys(storageBefore));
  for (const k of Object.keys(storageAfter)) {
    if (!beforeKeys.has(k)) md.push(`- \`${k}\``);
  }
  md.push('');
  md.push('Top candidate types in afterDrag snapshot:');
  md.push('');
  // Count by tag
  const tags = {};
  for (const c of candidates.afterDrag) {
    tags[c.tag] = (tags[c.tag] || 0) + 1;
  }
  for (const [t, n] of Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    md.push(`- ${t}: ${n}`);
  }
  md.push('');
  md.push('## First 10 strongest candidates (afterDrag)');
  md.push('');
  md.push('| Tag | Role | Draggable | Cursor | Text | Class | Component |');
  md.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const c of candidates.afterDrag.slice(0, 10)) {
    md.push(`| ${c.tag} | ${c.role || ''} | ${c.draggable || ''} | ${c.cursor || ''} | ${(c.text || '').slice(0, 40).replace(/\|/g, '\\|')} | ${(c.className || '').slice(0, 30).replace(/\|/g, '\\|')} | ${c.componentName || ''} |`);
  }
  await fs.writeFile(OUT_MD, md.join('\n'));

  // Proof
  const proof = [];
  proof.push('# Clip Identity Proof');
  proof.push('');
  proof.push(`Generated: ${new Date().toISOString()}`);
  proof.push('');
  proof.push(`Drag attempt: \`${dragResult}\``);
  proof.push(`Storage keys added: ${Object.keys(storageAfter).filter((k) => !beforeKeys.has(k)).length}`);
  proof.push(`bodyText changed: ${bodyTextBefore !== bodyTextAfter}`);
  proof.push('');
  if (dragResult === 'drag-executed' && Object.keys(storageAfter).some((k) => !beforeKeys.has(k))) {
    proof.push('Verdict: probable clip element exists in timeline lower-third.');
  } else if (dragResult === 'drag-executed') {
    proof.push('Verdict: drag executed but no storage mutation observed in localStorage. Inspect bundle stack trace.');
  } else {
    proof.push(`Verdict: drag could not be executed (\`${dragResult}\`).`);
  }
  await fs.writeFile(OUT_PROOF, proof.join('\n'));

  console.log(`[clip-identity] before=${snapshots.before.count} afterUpload=${snapshots.afterUpload.count} afterDrag=${snapshots.afterDrag.count} storageAdded=${Object.keys(storageAfter).filter((k) => !beforeKeys.has(k)).length}`);
}

main().catch((err) => {
  console.error('[clip-identity] fatal', err);
  process.exit(1);
});
