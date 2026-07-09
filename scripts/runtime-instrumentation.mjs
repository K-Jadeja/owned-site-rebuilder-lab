// scripts/runtime-instrumentation.mjs
//
// Patch fetch / XHR / localStorage / sessionStorage / history / IndexedDB
// inside the live app via page.addInitScript. Drive non-destructive
// actions. Capture storage mutations, fetch logs, console messages,
// DOM mutation counts, and event traces.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime';
const FIXTURE = '.rebuild/tests/fixtures/sample.mp4';

const INIT = `
(() => {
  const w = window;
  const log = (kind, data) => {
    try { w.__rlog = w.__rlog || []; w.__rlog.push({ kind, data, t: Date.now() }); } catch {}
  };
  const sanitizeHeaders = (h) => {
    const out = {};
    for (const k of Object.keys(h || {})) {
      if (/^(authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-amz-security-token|proxy-authorization)$/i.test(k)) {
        out[k] = '[REDACTED]';
      } else { out[k] = h[k]; }
    }
    return out;
  };
  const sanitizeUrl = (u) => String(u).replace(/([?&](token|key|sig|signature|apikey|api_key|auth|access_token|refresh_token|id_token|jwt)=)([^&#]+)/gi, '$1[REDACTED]');
  const truncate = (s, n) => { try { return String(s).slice(0, n); } catch { return ''; } };

  // fetch
  const origFetch = w.fetch;
  w.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = (init && init.method) || (input && input.method) || 'GET';
    log('fetch', { url: sanitizeUrl(url), method });
    return origFetch.apply(this, arguments).then(async (res) => {
      try {
        const clone = res.clone();
        const ct = clone.headers.get('content-type') || '';
        let body = '';
        if (/text|json|xml/.test(ct)) {
          try { body = truncate(await clone.text(), 2048); } catch {}
        }
        log('fetch-resp', { url: sanitizeUrl(url), status: res.status, contentType: ct, bodyPreview: truncate(body, 256) });
      } catch {}
      return res;
    }).catch((err) => {
      log('fetch-err', { url: sanitizeUrl(url), error: String(err && err.message || err) });
      throw err;
    });
  };

  // XHR
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__rmeta = { method, url: sanitizeUrl(url) };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (this.__rmeta) log('xhr', { ...this.__rmeta, bodyPreview: truncate(body, 256) });
    return origSend.apply(this, arguments);
  };

  // localStorage
  const origLSSet = Storage.prototype.setItem;
  const origLSRem = Storage.prototype.removeItem;
  const origLSClear = Storage.prototype.clear;
  Storage.prototype.setItem = function(k, v) {
    log('storage-set', { store: this === w.localStorage ? 'local' : 'session', key: k, valuePreview: truncate(v, 400) });
    return origLSSet.apply(this, arguments);
  };
  Storage.prototype.removeItem = function(k) {
    log('storage-remove', { store: this === w.localStorage ? 'local' : 'session', key: k });
    return origLSRem.apply(this, arguments);
  };
  Storage.prototype.clear = function() {
    log('storage-clear', { store: this === w.localStorage ? 'local' : 'session' });
    return origLSClear.apply(this, arguments);
  };

  // history
  const wrapHist = (name) => {
    const orig = w.history[name];
    w.history[name] = function(state, title, url) {
      log('history', { op: name, url: url ? sanitizeUrl(url) : null, title: title || null });
      return orig.apply(this, arguments);
    };
  };
  wrapHist('pushState');
  wrapHist('replaceState');

  // indexedDB
  if (w.indexedDB) {
    const origOpen = w.indexedDB.open;
    w.indexedDB.open = function(name, version) {
      log('idb-open', { name, version });
      const req = origOpen.apply(this, arguments);
      req.addEventListener && req.addEventListener('success', () => {
        try {
          const db = req.result;
          const stores = Array.from(db.objectStoreNames || []);
          log('idb-open-ok', { name: db.name, version: db.version, stores });
        } catch {}
      });
      return req;
    };
    const origDel = w.indexedDB.deleteDatabase;
    w.indexedDB.deleteDatabase = function(name) {
      log('idb-delete', { name });
      return origDel.apply(this, arguments);
    };
  }

  // DOM mutations
  try {
    const mo = new MutationObserver((muts) => {
      log('dom-mut', { count: muts.length });
    });
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: false });
  } catch {}

  // events
  const events = ['click','pointerdown','pointerup','keydown','dragstart','dragover','drop','input','change'];
  for (const ev of events) {
    document.addEventListener(ev, (e) => {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      const text = (t && (t.innerText || t.value || t.getAttribute && t.getAttribute('aria-label'))) || '';
      log('event', { type: ev, tag, textPreview: truncate(text, 80), key: e.key || null });
    }, true);
  }
})();
`;

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await context.addInitScript(INIT);
  const page = await context.newPage();

  const consoleLog = [];
  const errors = [];
  page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text().slice(0, 600), t: Date.now() }));
  page.on('pageerror', (e) => errors.push({ message: String(e.message || e), stack: String(e.stack || '').slice(0, 400) }));

  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  async function readLog() {
    return await page.evaluate(() => window.__rlog || []);
  }

  async function snapshot(label) {
    return await page.evaluate((label) => {
      const local = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        local[k] = (localStorage.getItem(k) || '').slice(0, 200);
      }
      const sess = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        sess[k] = (sessionStorage.getItem(k) || '').slice(0, 200);
      }
      return {
        label,
        url: location.href,
        title: document.title,
        localStorageKeys: Object.keys(local),
        sessionStorageKeys: Object.keys(sess),
        interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"], [role="menuitem"], [role="slider"]').length,
        visibleVideo: !!document.querySelector('video'),
        visibleCanvas: !!document.querySelector('canvas'),
        bodyText: (document.body.innerText || '').slice(0, 400),
      };
    }, label);
  }

  const actions = [];

  async function runAction(label, fn) {
    const before = await snapshot(label + '-before');
    const logBefore = (await readLog()).length;
    let err = null;
    try { await fn(); } catch (e) { err = String(e.message || e); }
    await page.waitForTimeout(1200);
    const after = await snapshot(label + '-after');
    const logAfter = await readLog();
    const newLogs = logAfter.slice(logBefore);
    actions.push({ label, err, before, after, newLogs: newLogs.slice(0, 200) });
  }

  await runAction('boot', async () => { await page.waitForTimeout(1500); });
  await runAction('dark-toggle', async () => {
    try { await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 }); } catch {}
  });
  await runAction('export-dialog', async () => {
    try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
  });
  await runAction('playback-space', async () => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    await page.keyboard.press('Space');
  });
  await runAction('undo-redo', async () => {
    await page.keyboard.press('Control+Z').catch(() => {});
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+Shift+Z').catch(() => {});
  });
  await runAction('zoom-in', async () => {
    try { await page.getByRole('button', { name: /zoom in/i }).first().click({ timeout: 2000 }); } catch {}
  });
  await runAction('zoom-out', async () => {
    try { await page.getByRole('button', { name: /zoom out/i }).first().click({ timeout: 2000 }); } catch {}
  });
  await runAction('zoom-reset', async () => {
    try { await page.getByRole('button', { name: /reset/i }).first().click({ timeout: 2000 }); } catch {}
  });
  await runAction('my-library', async () => {
    try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
  });
  await runAction('single-import', async () => {
    try {
      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles(FIXTURE);
    } catch {}
    await page.waitForTimeout(2500);
  });

  await context.close();
  await browser.close();

  const fullLog = await (async () => {
    // Re-open context and just collect final log dump via a separate eval — actually we already collected per-action logs above.
    return [];
  })();

  // Persist.
  await fs.writeFile(path.join(OUT, 'runtime-actions.json'), JSON.stringify({ actions, generatedAt: new Date().toISOString() }, null, 2));

  // Build summary files.
  const fetchLog = [];
  const xhrLog = [];
  const storageMutations = [];
  const idbObs = [];
  const historyLog = [];
  const domMutations = [];
  const eventTrace = [];
  for (const a of actions) {
    for (const l of a.newLogs) {
      const d = l.data || {};
      switch (l.kind) {
        case 'fetch': fetchLog.push({ action: a.label, t: l.t, ...d }); break;
        case 'fetch-resp': fetchLog.push({ action: a.label, t: l.t, ...d }); break;
        case 'fetch-err': fetchLog.push({ action: a.label, t: l.t, ...d }); break;
        case 'xhr': xhrLog.push({ action: a.label, t: l.t, ...d }); break;
        case 'storage-set': storageMutations.push({ action: a.label, t: l.t, op: 'set', ...d }); break;
        case 'storage-remove': storageMutations.push({ action: a.label, t: l.t, op: 'remove', ...d }); break;
        case 'storage-clear': storageMutations.push({ action: a.label, t: l.t, op: 'clear', ...d }); break;
        case 'idb-open':
        case 'idb-open-ok':
        case 'idb-delete': idbObs.push({ action: a.label, t: l.t, ...d }); break;
        case 'history': historyLog.push({ action: a.label, t: l.t, ...d }); break;
        case 'dom-mut': domMutations.push({ action: a.label, t: l.t, count: d.count || 0 }); break;
        case 'event': eventTrace.push({ action: a.label, t: l.t, ...d }); break;
      }
    }
  }

  await fs.writeFile(path.join(OUT, 'fetch-log.json'), JSON.stringify(fetchLog, null, 2));
  await fs.writeFile(path.join(OUT, 'xhr-log.json'), JSON.stringify(xhrLog, null, 2));
  await fs.writeFile(path.join(OUT, 'storage-mutations.json'), JSON.stringify(storageMutations, null, 2));
  await fs.writeFile(path.join(OUT, 'indexeddb-observations.json'), JSON.stringify(idbObs, null, 2));
  await fs.writeFile(path.join(OUT, 'history-log.json'), JSON.stringify(historyLog, null, 2));
  await fs.writeFile(path.join(OUT, 'dom-mutations.json'), JSON.stringify(domMutations, null, 2));
  await fs.writeFile(path.join(OUT, 'event-trace.json'), JSON.stringify(eventTrace, null, 2));
  await fs.writeFile(path.join(OUT, 'console-runtime.json'), JSON.stringify(consoleLog, null, 2));
  await fs.writeFile(path.join(OUT, 'errors.json'), JSON.stringify(errors, null, 2));

  // Markdown summary.
  const lines = [];
  lines.push('# Runtime Instrumentation Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push(`- fetch entries: ${fetchLog.length}`);
  lines.push(`- xhr entries: ${xhrLog.length}`);
  lines.push(`- storage mutations: ${storageMutations.length}`);
  lines.push(`- IDB observations: ${idbObs.length}`);
  lines.push(`- history events: ${historyLog.length}`);
  lines.push(`- DOM mutations: ${domMutations.length}`);
  lines.push(`- event trace entries: ${eventTrace.length}`);
  lines.push(`- console messages: ${consoleLog.length}`);
  lines.push(`- page errors: ${errors.length}`);
  lines.push('');
  lines.push('## Per-action table');
  lines.push('| Action | URL before | URL after | Storage keys added | Storage keys removed | Net storage change | DOM mut | Event trace |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const a of actions) {
    const beforeKeys = new Set(a.before.localStorageKeys);
    const afterKeys = new Set(a.after.localStorageKeys);
    const added = [...afterKeys].filter((k) => !beforeKeys.has(k));
    const removed = [...beforeKeys].filter((k) => !afterKeys.has(k));
    const domCount = a.newLogs.filter((l) => l.kind === 'dom-mut').reduce((s, l) => s + (l.data && l.data.count || 0), 0);
    const evCount = a.newLogs.filter((l) => l.kind === 'event').length;
    lines.push(`| ${a.label} | ${a.before.url.split('?')[0].slice(0, 40)} | ${a.after.url.split('?')[0].slice(0, 40)} | ${added.join(', ') || '–'} | ${removed.join(', ') || '–'} | ${added.length - removed.length} | ${domCount} | ${evCount} |`);
  }
  lines.push('');
  lines.push('## Notable storage mutations');
  for (const m of storageMutations.slice(0, 50)) {
    lines.push(`- [${m.action}] ${m.op} ${m.store}:${m.key} = ${(m.valuePreview || '').slice(0, 80)}`);
  }
  lines.push('');
  lines.push('## IDB observations');
  for (const o of idbObs.slice(0, 30)) {
    lines.push(`- [${o.action}] ${JSON.stringify(o).slice(0, 200)}`);
  }
  lines.push('');
  lines.push('## Console messages (sample)');
  for (const m of consoleLog.slice(0, 20)) {
    lines.push(`- [${m.type}] ${m.text.slice(0, 200)}`);
  }
  if (errors.length > 0) {
    lines.push('');
    lines.push('## Page errors');
    for (const e of errors) {
      lines.push(`- ${e.message}`);
    }
  }
  await fs.writeFile(path.join(OUT, 'runtime-summary.md'), lines.join('\n'));

  console.log(`[instrument:runtime] actions=${actions.length} fetch=${fetchLog.length} storage=${storageMutations.length} idb=${idbObs.length}`);
}

main().catch((err) => {
  console.error('[instrument:runtime] fatal', err);
  process.exit(1);
});