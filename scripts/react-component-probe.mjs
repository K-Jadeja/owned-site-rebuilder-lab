// scripts/react-component-probe.mjs
//
// Try to extract React component names from the live DOM via
// __reactFiber$... / __reactProps$... element properties.
// Output:
//   .rebuild/runtime/react-component-tree.json
//   .rebuild/runtime/react-component-tree.md

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

  // Trigger some interactions so more components mount.
  try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
  await page.waitForTimeout(500);
  try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 2000 }); } catch {}
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape').catch(() => {});

  const tree = await page.evaluate(() => {
    function boxOf(el) {
      try {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      } catch { return null; }
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
    function walkFiber(fiber, depth, acc) {
      if (!fiber || depth > 40) return;
      let name = null;
      try {
        if (fiber.type && typeof fiber.type === 'function') name = fiber.type.displayName || fiber.type.name || null;
        else if (fiber.type && typeof fiber.type === 'string') name = fiber.type;
      } catch {}
      if (name) acc.push({ name, depth });
      if (fiber.child) walkFiber(fiber.child, depth + 1, acc);
      if (fiber.sibling) walkFiber(fiber.sibling, depth, acc);
    }

    const componentsByRegion = {
      app_shell: [], preview: [], media_library: [], timeline: [], inspector: [], export_dialog: [], other: [],
    };

    // Walk all elements and find a sample of components near each region.
    const all = Array.from(document.querySelectorAll('*')).slice(0, 4000);
    let sawFiberKey = false;
    for (const el of all) {
      const fk = findFiberKey(el);
      if (!fk) continue;
      sawFiberKey = true;
      const fiber = el[fk];
      if (!fiber) continue;
      const acc = [];
      walkFiber(fiber, 0, acc);
      if (acc.length === 0) continue;
      const region =
        el.closest('[role="dialog"]') ? 'export_dialog' :
        el.closest('main, [role="main"]') && el.closest('[class*="timeline"], [class*="track"]') ? 'timeline' :
        el.closest('aside, [role="complementary"]') ? 'media_library' :
        el.closest('main, [role="main"]') && el.closest('video, canvas') ? 'preview' :
        el.closest('main, [role="main"]') ? 'preview' :
        el.closest('header') ? 'app_shell' :
        'other';
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || '').slice(0, 60);
      const seen = new Set();
      for (const c of acc) {
        if (!c.name || seen.has(c.name + ':' + c.depth)) continue;
        seen.add(c.name + ':' + c.depth);
        componentsByRegion[region].push({ name: c.name, depth: c.depth, tag, text, box: boxOf(el) });
      }
    }

    // Tally names.
    const tally = {};
    for (const region of Object.keys(componentsByRegion)) {
      for (const c of componentsByRegion[region]) {
        tally[c.name] = (tally[c.name] || 0) + 1;
      }
    }
    const sortedNames = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return {
      sawFiberKey,
      totalElements: all.length,
      regionCounts: Object.fromEntries(Object.entries(componentsByRegion).map(([k, v]) => [k, v.length])),
      componentTally: sortedNames.slice(0, 80),
      componentsByRegion,
    };
  });

  await fs.writeFile(path.join(OUT, 'react-component-tree.json'), JSON.stringify(tree, null, 2));

  const lines = [];
  lines.push('# React Component Probe');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  if (!tree.sawFiberKey) {
    lines.push('## Result: **no React fiber keys found**');
    lines.push('');
    lines.push('Either React is not used, or the production build has stripped `__reactFiber$...` keys.');
    lines.push('The component tree could not be extracted at runtime.');
  } else {
    lines.push(`## Result: React fiber keys present (${tree.totalElements} elements scanned)`);
    lines.push('');
    lines.push('### Region counts');
    lines.push('| Region | Component instances |');
    lines.push('| --- | --- |');
    for (const [r, c] of Object.entries(tree.regionCounts)) {
      lines.push(`| ${r} | ${c} |`);
    }
    lines.push('');
    lines.push('### Top component names');
    lines.push('| Name | Instances |');
    lines.push('| --- | --- |');
    for (const [name, count] of tree.componentTally.slice(0, 40)) {
      lines.push(`| ${name} | ${count} |`);
    }
  }
  await fs.writeFile(path.join(OUT, 'react-component-tree.md'), lines.join('\n'));

  console.log(`[react-component-probe] sawFiberKey=${tree.sawFiberKey} regions=${JSON.stringify(tree.regionCounts)}`);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error('[react-component-probe] fatal', err);
  process.exit(1);
});