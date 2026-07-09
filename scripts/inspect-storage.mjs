// scripts/inspect-storage.mjs
// Re-open the app, snapshot storage, list IndexedDB databases + object stores.

import { chromium } from 'playwright';
import path from 'node:path';
import { nowIso, writeJson, writeText, ensureDir } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const NAV_TIMEOUT = 45_000;

function log(s) {
  console.log(`[storage] ${s}`);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  let navOk = false;
  let navError = null;
  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    navOk = true;
  } catch (err) {
    navError = String(err && err.message ? err.message : err);
  }
  await page.waitForTimeout(2500);

  const snapshot = await page.evaluate(async () => {
    const safe = (v) => {
      if (v == null) return null;
      const s = String(v);
      return s.length > 400 ? s.slice(0, 400) + '…' : s;
    };
    const local = {}; const session = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      try { local[k] = safe(localStorage.getItem(k)); } catch { local[k] = '[unreadable]'; }
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      try { session[k] = safe(sessionStorage.getItem(k)); } catch { session[k] = '[unreadable]'; }
    }
    let dbs = [];
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      try {
        const list = await indexedDB.databases();
        for (const d of list) {
          dbs.push({ name: d.name, version: d.version });
        }
      } catch {
        dbs.push({ error: 'indexedDB.databases() unavailable' });
      }
    } else {
      dbs.push({ note: 'indexedDB.databases() not supported' });
    }
    return {
      url: location.href,
      title: document.title,
      localStorage: local,
      sessionStorage: session,
      indexedDB: dbs,
    };
  });

  await context.close();
  await browser.close();

  await ensureDir(p('.rebuild', 'reference', 'storage'));
  await writeJson(p('.rebuild', 'reference', 'storage', 'storage-inspection.json'), snapshot);

  const lines = [];
  lines.push(`# Storage Model (live inspection)`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push(`Navigation OK: ${navOk}`);
  if (navError) lines.push(`Navigation error: \`${navError}\``);
  lines.push('');
  lines.push(`## localStorage keys (${Object.keys(snapshot.localStorage).length})`);
  for (const k of Object.keys(snapshot.localStorage)) {
    lines.push(`- \`${k}\` = ${snapshot.localStorage[k]}`);
  }
  lines.push('');
  lines.push(`## sessionStorage keys (${Object.keys(snapshot.sessionStorage).length})`);
  for (const k of Object.keys(snapshot.sessionStorage)) {
    lines.push(`- \`${k}\` = ${snapshot.sessionStorage[k]}`);
  }
  lines.push('');
  lines.push(`## IndexedDB`);
  if (!snapshot.indexedDB.length) lines.push(`- (none observed)`);
  for (const d of snapshot.indexedDB) {
    if (d.name) lines.push(`- database: \`${d.name}\` v${d.version}`);
    else if (d.error) lines.push(`- error: ${d.error}`);
    else if (d.note) lines.push(`- ${d.note}`);
  }
  lines.push('');
  lines.push(`## Privacy notes`);
  lines.push(`- Values are truncated to 400 chars.`);
  lines.push(`- No record contents are read from IndexedDB; only database + version metadata.`);
  lines.push(`- This is a structural inspection, not a record dump.`);

  await writeText(p('.rebuild', 'features', 'storage-model.md'), lines.join('\n'));
  log('done.');
}

main().catch((err) => {
  console.error('[storage] fatal', err);
  process.exit(1);
});