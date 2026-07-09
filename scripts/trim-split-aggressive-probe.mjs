// scripts/trim-split-aggressive-probe.mjs
//
// Aggressively probe trim / split behavior.
//
// Outputs:
//   .rebuild/features/trim-split-probe.json
//   .rebuild/features/trim-split-probe.md
//   .rebuild/features/trim-split-shortcut-map.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_DIR = path.join(ROOT, '.rebuild/deep-import/trim-split-screenshots');
const OUT_JSON = path.join(ROOT, '.rebuild/features/trim-split-probe.json');
const OUT_MD = path.join(ROOT, '.rebuild/features/trim-split-probe.md');
const OUT_SHORTCUTS = path.join(ROOT, '.rebuild/features/trim-split-shortcut-map.md');

const KEYS = [
  's', 'S', 'b', 'B', 't', 'T', 'c', 'C', 'x', 'X',
  'Control+k', 'Control+b', 'Control+s', 'Shift+s', 'Alt+s',
  'Delete', 'Backspace', ',', '.', '[', ']', '{', '}',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Shift+ArrowLeft', 'Shift+ArrowRight', 'Alt+ArrowLeft', 'Alt+ArrowRight',
  'Tab', 'Enter', 'Space', 'Escape',
];

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
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });
  await fs.mkdir(path.dirname(OUT_SHORTCUTS), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[trim-split] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Search for visible trim/split UI
  const uiHints = await page.evaluate(() => {
    const candidates = ['split', 'trim', 'cut', 'blade', 'scissors', 'crop', 'delete', 'duration', 'start', 'end', 'handle'];
    const results = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"], a, label, span, div').forEach((el) => {
      const t = (el.innerText || '').toLowerCase();
      if (!t || t.length > 60) return;
      for (const c of candidates) {
        if (t.includes(c)) {
          results.push({ tag: el.tagName, text: t.slice(0, 60), title: el.getAttribute('title') || '', aria: el.getAttribute('aria-label') || '' });
          break;
        }
      }
    });
    return results;
  });

  const shortcutsFound = [];
  const keyResults = [];

  // Upload sample + drag to timeline + select clip
  try {
    const fileInput = await page.$('input[type="file"][accept^="video"]');
    if (fileInput) {
      await fileInput.setInputFiles(SAMPLE);
      await page.waitForTimeout(1500);
    }
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

  // Move playhead by clicking timeline ruler (use the lower-third timeline area)
  try {
    const handles = await page.$$('[draggable="true"]');
    if (handles.length >= 1) {
      const b = await handles[0].boundingBox();
      if (b) {
        // pick a point 1/3 along
        await page.mouse.click(b.x + b.width * 0.5, b.y + b.height / 2);
        await page.waitForTimeout(300);
      }
    }
  } catch {}

  // Right-click clip for context menu
  try {
    const ptrs = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const lowerThirdY = vh * 0.66;
      const arr = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.y < lowerThirdY) return;
        const style = getComputedStyle(el);
        if (style.cursor === 'pointer' && r.height < 200) {
          arr.push({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
        }
      });
      return arr;
    });
    if (ptrs.length > 0) {
      const p = ptrs[0];
      await page.mouse.click(p.x, p.y, { button: 'right' });
      await page.waitForTimeout(500);
      shortcutsFound.push({ source: 'context-menu', evidence: 'right-click on lower-third pointer' });
      await page.keyboard.press('Escape');
    }
  } catch {}

  const storageBaseline = await storageSnapshot(page);
  const bodyBaseline = await page.evaluate(() => document.body.innerText.slice(0, 500));

  for (const k of KEYS) {
    try {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
      const s = await storageSnapshot(page);
      const b = await page.evaluate(() => document.body.innerText.slice(0, 500));
      const sameStorage = JSON.stringify(s) === JSON.stringify(storageBaseline);
      const sameBody = b === bodyBaseline;
      const evidence = { key: k, sameStorage, sameBody };
      keyResults.push(evidence);
      if (!sameStorage) shortcutsFound.push({ source: 'keyboard', key: k, evidence: 'storage mutation observed' });
      if (!sameBody) shortcutsFound.push({ source: 'keyboard', key: k, evidence: 'bodyText changed' });
    } catch (e) {
      keyResults.push({ key: k, error: e.message });
    }
  }

  await browser.close();

  const out = { uiHints, shortcutsFound, keyResults, baselineAt: new Date().toISOString() };

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2));

  // Markdown
  const md = [];
  md.push('# Trim / Split Probe');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`UI hints found: ${uiHints.length}`);
  md.push(`Shortcut evidence: ${shortcutsFound.length}`);
  md.push('');
  md.push('## UI hints');
  md.push('');
  md.push('| Tag | Text | Title | Aria |');
  md.push('| --- | --- | --- | --- |');
  for (const u of uiHints.slice(0, 20)) {
    md.push(`| ${u.tag} | ${(u.text || '').replace(/\|/g, '\\|')} | ${u.title || ''} | ${u.aria || ''} |`);
  }
  md.push('');
  md.push('## Key results');
  md.push('');
  md.push('| Key | Same storage | Same body |');
  md.push('| --- | --- | --- |');
  for (const k of keyResults) {
    md.push(`| ${k.key} | ${k.sameStorage ?? 'err'} | ${k.sameBody ?? 'err'} |`);
  }
  await fs.writeFile(OUT_MD, md.join('\n'));

  // Shortcut map
  const sm = [];
  sm.push('# Trim / Split Shortcut Map');
  sm.push('');
  sm.push(`Generated: ${new Date().toISOString()}`);
  sm.push('');
  sm.push(`## Evidence collected: ${shortcutsFound.length}`);
  sm.push('');
  for (const e of shortcutsFound) {
    sm.push(`- **${e.source}**: ${e.key || ''} — ${e.evidence}`);
  }
  if (shortcutsFound.length === 0) {
    sm.push('');
    sm.push('No working trim/split shortcut identified in the public demo.');
  }
  await fs.writeFile(OUT_SHORTCUTS, sm.join('\n'));

  console.log(`[trim-split] uiHints=${uiHints.length} shortcuts=${shortcutsFound.length}`);
}

main().catch((err) => {
  console.error('[trim-split] fatal', err);
  process.exit(1);
});
