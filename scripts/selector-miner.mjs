// scripts/selector-miner.mjs
//
// Mine candidate selectors for clips, tracks, playhead, ruler, handles.
// Output:
//   .rebuild/features/selector-map.json
//   .rebuild/features/selector-map.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FEAT = '.rebuild/features';

async function main() {
  await fs.mkdir(FEAT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    function box(el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }
    const all = Array.from(document.querySelectorAll('*')).slice(0, 6000);

    const candidates = [];
    for (const el of all) {
      const tag = el.tagName.toLowerCase();
      const rect = box(el);
      if (rect.h === 0 || rect.w === 0) continue;
      const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
      const clsLow = cls.toLowerCase();
      const text = (el.innerText || '').slice(0, 80);
      const attrs = {};
      for (const a of Array.from(el.attributes || []).slice(0, 20)) {
        if (/^(class|id|role|aria-label|title|data-testid|data-clip|data-item|data-track|data-rbd|data-drop|data-drag|draggable|tabindex)/i.test(a.name)) {
          attrs[a.name] = a.value.slice(0, 80);
        }
      }
      const role = el.getAttribute('role');
      const draggable = el.getAttribute('draggable') === 'true';
      const cs = el.ownerDocument && el.ownerDocument.defaultView ? el.ownerDocument.defaultView.getComputedStyle(el) : null;
      const transform = cs && cs.transform && cs.transform !== 'none' ? cs.transform : null;
      const cursor = cs && cs.cursor;
      const position = cs ? { position: cs.position, left: cs.left, top: cs.top, width: cs.width, height: cs.height } : null;
      const yLow = rect.y < 700;
      const isBottom = rect.y > 500;

      let kind = 'unknown';
      let confidence = 0;
      if (draggable && /clip|track|item|asset|handle/i.test(clsLow + ' ' + (attrs['aria-label'] || '') + ' ' + text)) { kind = 'clip|track|handle'; confidence += 3; }
      else if (draggable && isBottom) { kind = 'draggable-bottom'; confidence += 1; }
      if (transform && /matrix/.test(transform) && isBottom) { kind = kind === 'unknown' ? 'transformed-bottom' : kind; confidence += 2; }
      if (/ruler|playhead|scrub/i.test(clsLow + ' ' + text + ' ' + (attrs['aria-label'] || ''))) { kind = 'ruler|playhead'; confidence += 3; }
      if (/timeline|track|clip/i.test(clsLow) && isBottom) { kind = kind === 'unknown' ? 'timeline-region' : kind; confidence += 2; }
      if (/preview|canvas|video/i.test(clsLow)) { kind = kind === 'unknown' ? 'preview-region' : kind; confidence += 1; }
      if (cursor === 'pointer' && !draggable) { kind = kind === 'unknown' ? 'clickable' : kind; confidence += 1; }
      if (role === 'slider') { kind = 'slider'; confidence += 3; }
      if (role === 'listitem' || role === 'option') { kind = kind === 'unknown' ? 'listitem' : kind; confidence += 2; }

      if (confidence >= 2) {
        candidates.push({
          tag,
          kind,
          confidence,
          box: rect,
          classes: cls.slice(0, 200),
          attrs,
          text,
          cursor,
          transform,
          position,
          draggable,
        });
      }
    }

    return {
      totalScanned: all.length,
      candidatesCount: candidates.length,
      candidates: candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 200),
    };
  });

  await fs.writeFile(path.join(FEAT, 'selector-map.json'), JSON.stringify(data, null, 2));

  const lines = [];
  lines.push('# Selector Map');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push(`- elements scanned: ${data.totalScanned}`);
  lines.push(`- candidates: ${data.candidatesCount}`);
  lines.push('');
  lines.push('## Top candidates');
  lines.push('');
  lines.push('| Confidence | Kind | Tag | Class hint | Box | Text |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const c of data.candidates.slice(0, 50)) {
    const clsHint = (c.classes || '').slice(0, 40);
    lines.push(`| ${c.confidence} | ${c.kind} | ${c.tag} | ${clsHint} | ${c.box.x},${c.box.y} ${c.box.w}x${c.box.h} | ${(c.text || '').slice(0, 40)} |`);
  }
  lines.push('');
  lines.push('## Selector suggestions');
  lines.push('');
  // Build small CSS selector suggestions.
  const suggestions = new Set();
  for (const c of data.candidates) {
    if (c.attrs['data-testid']) suggestions.add(`[data-testid="${c.attrs['data-testid']}"]`);
    if (c.attrs['data-clip-id']) suggestions.add(`[data-clip-id]`);
    if (c.attrs['data-track-id']) suggestions.add(`[data-track-id]`);
    if (c.attrs['data-rbd-draggable-id']) suggestions.add(`[data-rbd-draggable-id]`);
    if (c.attrs['role']) suggestions.add(`[role="${c.attrs['role']}"]`);
    if (c.draggable) suggestions.add(`[draggable="true"]`);
  }
  for (const s of [...suggestions].slice(0, 40)) lines.push(`- ${s}`);
  await fs.writeFile(path.join(FEAT, 'selector-map.md'), lines.join('\n'));

  console.log(`[mine:selectors] candidates=${data.candidatesCount}`);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error('[mine:selectors] fatal', err);
  process.exit(1);
});