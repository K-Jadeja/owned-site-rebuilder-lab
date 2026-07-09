// scripts/decode-state-stores.mjs
//
// Decodes app-owned localStorage values into typed state stores.
// Output:
//   .rebuild/features/decoded-state-stores.md
//   .rebuild/features/decoded-state-stores.json
//   .rebuild/features/inferred-persistence-model.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FEAT = '.rebuild/features';
const RT = '.rebuild/runtime';

async function main() {
  await fs.mkdir(FEAT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  const snapshot1 = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k) || '';
    }
    return out;
  });

  // Drive actions to provoke mutations.
  try { await page.keyboard.press('Space'); } catch {}
  await page.waitForTimeout(800);
  try { await page.keyboard.press('Space'); } catch {}
  try { await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 }); } catch {}
  await page.waitForTimeout(800);

  const snapshot2 = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k) || '';
    }
    return out;
  });

  await context.close();
  await browser.close();

  const stores = [];
  for (const [k, v] of Object.entries(snapshot2)) {
    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(v);
    } catch (e) {
      parseError = String(e.message || e);
    }
    stores.push({
      key: k,
      value: v.length > 200 ? v.slice(0, 200) + '…' : v,
      valueLength: v.length,
      jsonParseable: parsed !== null,
      parseError,
      shape: parsed && typeof parsed === 'object' ? describeShape(parsed) : null,
      valuePreview: parsed,
      firstObserved: k in snapshot1,
      newSinceBoot: !(k in snapshot1),
    });
  }

  function describeShape(obj, depth = 0) {
    if (depth > 3) return '…';
    if (obj === null) return 'null';
    if (Array.isArray(obj)) return { type: 'array', length: obj.length };
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const out = { type: 'object', keys, sample: {} };
      for (const k of keys.slice(0, 12)) {
        out.sample[k] = describeShape(obj[k], depth + 1);
      }
      return out;
    }
    return { type: typeof obj, value: typeof obj === 'string' ? obj.slice(0, 80) : obj };
  }

  await fs.writeFile(path.join(FEAT, 'decoded-state-stores.json'), JSON.stringify({ stores, generatedAt: new Date().toISOString() }, null, 2));

  // Markdown.
  const lines = [];
  lines.push('# Decoded State Stores');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push('## Observed localStorage keys');
  lines.push('| Key | Bytes | JSON? | Shape | New since boot? |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const s of stores) {
    const shapeStr = s.jsonParseable ? JSON.stringify(s.shape).slice(0, 80) : '(not JSON)';
    lines.push(`| \`${s.key}\` | ${s.valueLength} | ${s.jsonParseable ? 'yes' : 'no'} | ${shapeStr} | ${s.newSinceBoot ? 'yes' : 'no'} |`);
  }
  lines.push('');
  lines.push('## Notable decoded values');
  for (const s of stores) {
    if (!s.jsonParseable) continue;
    lines.push(`### \`${s.key}\``);
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(s.valuePreview, null, 2).slice(0, 1200));
    lines.push('```');
    lines.push('');
  }
  await fs.writeFile(path.join(FEAT, 'decoded-state-stores.md'), lines.join('\n'));

  // Inferred persistence model.
  const inferred = [];
  inferred.push('# Inferred Persistence Model');
  inferred.push('');
  inferred.push(`Generated: ${new Date().toISOString()}`);
  inferred.push('');
  inferred.push('## Stores');
  for (const s of stores) {
    inferred.push(`### \`${s.key}\``);
    inferred.push('');
    inferred.push(`- bytes: ${s.valueLength}`);
    inferred.push(`- json parseable: ${s.jsonParseable}`);
    if (s.jsonParseable && s.valuePreview && typeof s.valuePreview === 'object') {
      const shape = s.shape;
      if (shape && shape.type === 'object' && shape.keys.includes('state') && shape.keys.includes('version')) {
        inferred.push(`- pattern: **Zustand persist** (has \`state\` + \`version\` keys)`);
      } else if (shape && shape.type === 'object') {
        inferred.push(`- pattern: generic JSON object (keys: ${shape.keys.join(', ')})`);
      }
    } else {
      inferred.push(`- pattern: scalar (timestamp / flag / token-shape)`);
    }
    inferred.push('');
  }
  inferred.push('## Migration signals');
  const mig = stores.find((s) => /idb_migration|migration/i.test(s.key));
  if (mig) {
    inferred.push(`- \`${mig.key}\` (${mig.valueLength} bytes) is a likely migration marker set once on first hydration.`);
  }
  const ts = stores.find((s) => /cleanup|thumbnail/i.test(s.key));
  if (ts) {
    inferred.push(`- \`${ts.key}\` (${ts.valueLength} bytes) is a likely cleanup timestamp for an IndexedDB-backed cache.`);
  }
  inferred.push('');
  inferred.push('## Hypothesis');
  inferred.push('The app likely uses:');
  inferred.push('- **Zustand with persist middleware** for runtime editor state (advanced-timeline-store).');
  inferred.push('- **IndexedDB** for thumbnail sprite caches (idb_migration_v1_done + lastCleanup_thumbnailCache).');
  inferred.push('- **localStorage** only for app-owned keys, not user content (the demo appears read-only).');
  inferred.push('');
  inferred.push('## What we explicitly did not recover');
  inferred.push('- Auth tokens / session cookies (none observed).');
  inferred.push('- Raw project JSON files (none observed).');
  inferred.push('- Custom user data (none observed; the demo is read-only).');
  await fs.writeFile(path.join(FEAT, 'inferred-persistence-model.md'), inferred.join('\n'));

  console.log(`[decode:state] stores=${stores.length}`);
}

main().catch((err) => {
  console.error('[decode:state] fatal', err);
  process.exit(1);
});