// scripts/react-region-map.mjs
//
// Walk React fibers and group by region (header / media library /
// preview / timeline / inspector / export dialog / other). For each
// region list the top component names, prop-handler names, and the
// top 5 DOM nodes with their bounding box.
//
// Output:
//   .rebuild/runtime/react-region-map.json
//   .rebuild/runtime/react-region-map.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime';

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  // Open export dialog so its region is mounted.
  try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 2000 }); } catch {}
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    function boxOf(el) {
      try { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; } catch { return null; }
    }
    function findFiberKey(el) {
      for (const k of Object.keys(el)) {
        if (/^__reactFiber\$/.test(k)) return k;
      }
      return null;
    }
    function findPropsKey(el) {
      for (const k of Object.keys(el)) {
        if (/^__reactProps\$/.test(k)) return k;
      }
      return null;
    }
    function walkFiber(f, depth, acc) {
      if (!f || depth > 40) return;
      let name = null;
      try {
        if (f.type && typeof f.type === 'function') name = f.type.displayName || f.type.name || null;
        else if (f.type && typeof f.type === 'string') name = f.type;
      } catch {}
      if (name) acc.push({ name, depth });
      if (f.child) walkFiber(f.child, depth + 1, acc);
      if (f.sibling) walkFiber(f.sibling, depth, acc);
    }
    function regionFor(el) {
      if (el.closest('[role="dialog"]')) return 'export_dialog';
      if (el.closest('header, [role="banner"]')) return 'header';
      if (el.closest('[class*="timeline" i], [class*="track" i], [class*="ruler" i]') && el.closest('main, [role="main"]')) return 'timeline';
      if (el.closest('aside, [role="complementary"]')) return 'media_library';
      if (el.closest('main, [role="main"]') && el.closest('video, canvas')) return 'preview';
      if (el.closest('main, [role="main"]')) return 'preview';
      return 'other';
    }

    const regions = {
      header: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      media_library: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      preview: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      timeline: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      inspector: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      export_dialog: { components: new Map(), handlerProps: new Map(), domNodes: [] },
      other: { components: new Map(), handlerProps: new Map(), domNodes: [] },
    };

    const all = Array.from(document.querySelectorAll('*')).slice(0, 5000);
    for (const el of all) {
      const fk = findFiberKey(el);
      if (!fk) continue;
      const fiber = el[fk];
      if (!fiber) continue;
      const acc = [];
      walkFiber(fiber, 0, acc);
      const region = regionFor(el);
      const r = regions[region];
      const propsKey = findPropsKey(el);
      const handlerNames = [];
      if (propsKey) {
        const props = el[propsKey];
        if (props && typeof props === 'object') {
          for (const k of Object.keys(props)) {
            if (typeof props[k] === 'function') handlerNames.push(k);
          }
        }
      }
      const seen = new Set();
      for (const c of acc) {
        const key = c.name + ':' + c.depth;
        if (seen.has(key)) continue;
        seen.add(key);
        r.components.set(c.name, (r.components.get(c.name) || 0) + 1);
      }
      for (const h of handlerNames) {
        r.handlerProps.set(h, (r.handlerProps.get(h) || 0) + 1);
      }
      if (r.domNodes.length < 8) {
        r.domNodes.push({
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
          text: (el.innerText || '').slice(0, 60),
          box: boxOf(el),
        });
      }
    }

    const out = {};
    for (const k of Object.keys(regions)) {
      const r = regions[k];
      const compTally = [...r.components.entries()].sort((a, b) => b[1] - a[1]);
      const handlerTally = [...r.handlerProps.entries()].sort((a, b) => b[1] - a[1]);
      out[k] = {
        topComponents: compTally.slice(0, 25),
        topHandlerProps: handlerTally.slice(0, 25),
        domNodes: r.domNodes,
      };
    }
    return out;
  });

  await fs.writeFile(path.join(OUT, 'react-region-map.json'), JSON.stringify(data, null, 2));

  const lines = [];
  lines.push('# React Region Map');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  for (const r of ['header', 'media_library', 'preview', 'timeline', 'inspector', 'export_dialog', 'other']) {
    lines.push(`## ${r}`);
    lines.push('');
    lines.push('### Top components');
    lines.push('');
    lines.push('| Component | Instances |');
    lines.push('| --- | --- |');
    for (const [name, count] of (data[r].topComponents || []).slice(0, 20)) {
      lines.push(`| ${name} | ${count} |`);
    }
    lines.push('');
    lines.push('### Top handler props (event handlers)');
    lines.push('');
    lines.push('| Handler | Count |');
    lines.push('| --- | --- |');
    for (const [name, count] of (data[r].topHandlerProps || []).slice(0, 20)) {
      lines.push(`| ${name} | ${count} |`);
    }
    lines.push('');
    lines.push('### Sample DOM nodes');
    lines.push('');
    lines.push('| Tag | Class | Box | Text |');
    lines.push('| --- | --- | --- | --- |');
    for (const n of (data[r].domNodes || []).slice(0, 8)) {
      lines.push(`| ${n.tag} | ${(n.className || '').slice(0, 60)} | ${n.box.x},${n.box.y} ${n.box.w}x${n.box.h} | ${(n.text || '').slice(0, 40)} |`);
    }
    lines.push('');
  }
  await fs.writeFile(path.join(OUT, 'react-region-map.md'), lines.join('\n'));

  console.log(`[react:regions] regions=${Object.keys(data).length}`);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error('[react:regions] fatal', err);
  process.exit(1);
});