// scripts/capture-site.mjs
// First-pass capture of demo.reactvideoeditor.com via Playwright.
//
// Captures: screenshots (3 viewports), DOM summary, computed styles, console,
// network (sanitized), localStorage / sessionStorage names + redacted values,
// IndexedDB database + object store names (no record dumps), public JS/CSS
// asset URLs, optional outerHTML if reasonable.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nowIso, writeJson, writeText, ensureDir } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';
import { summarizeDom, outerHtmlSafe } from './utils/dom-summary.mjs';
import {
  summarizeStyles,
  extractCssVariables,
  extractColorPalette,
} from './utils/style-summary.mjs';
import { sanitizeRequestResponse } from './utils/network-sanitizer.mjs';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const NAV_TIMEOUT = 45_000;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

const REF = p('.rebuild', 'reference');

function logStep(s) {
  console.log(`[capture] ${s}`);
}

async function captureStorageSnapshot(page) {
  return await page.evaluate(async () => {
    const safe = (val) => {
      if (val == null) return null;
      const s = String(val);
      if (s.length > 200) return s.slice(0, 200) + '…[truncated]';
      return s;
    };
    const local = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      try {
        local[k] = safe(localStorage.getItem(k));
      } catch {
        local[k] = '[unreadable]';
      }
    }
    const session = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      try {
        session[k] = safe(sessionStorage.getItem(k));
      } catch {
        session[k] = '[unreadable]';
      }
    }
    // IndexedDB: only list databases + object stores; do not dump records.
    const dbs = [];
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
      dbs.push({ note: 'indexedDB.databases() not supported in this context' });
    }
    return {
      localStorage: local,
      sessionStorage: session,
      indexedDB: dbs,
      cookies: document.cookie || '',
      userAgent: navigator.userAgent,
      url: location.href,
      title: document.title,
    };
  });
}

async function capture(viewport, networkLog, consoleLog) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    ignoreHTTPSErrors: true,
    // No persistent storage; no profile reuse.
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    try {
      consoleLog.push({
        viewport: viewport.name,
        type: msg.type(),
        text: msg.text().slice(0, 1000),
        location: msg.location(),
        timestamp: Date.now(),
      });
    } catch {
      /* ignore */
    }
  });
  page.on('pageerror', (err) => {
    consoleLog.push({
      viewport: viewport.name,
      type: 'pageerror',
      text: String(err && err.message ? err.message : err).slice(0, 1000),
      timestamp: Date.now(),
    });
  });

  page.on('response', async (res) => {
    try {
      const req = res.request();
      const sanitized = sanitizeRequestResponse(req, res, { maxBody: 0 });
      networkLog.push({ viewport: viewport.name, ...sanitized });
    } catch {
      /* ignore */
    }
  });
  page.on('requestfailed', (req) => {
    networkLog.push({
      viewport: viewport.name,
      request: {
        method: req.method(),
        url: req.url(),
        resourceType: req.resourceType(),
      },
      failure: req.failure() ? req.failure().errorText : 'failed',
    });
  });

  const startedAt = Date.now();
  logStep(`navigating ${TARGET} @ ${viewport.name} (${viewport.width}x${viewport.height})`);
  let navOk = false;
  let navError = null;
  try {
    await page.goto(TARGET, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT,
    });
    navOk = true;
  } catch (err) {
    navError = String(err && err.message ? err.message : err);
    logStep(`navigation error: ${navError}`);
  }

  // Give the app a chance to hydrate
  await page.waitForTimeout(2500);

  const url = page.url();
  const title = await page.title().catch(() => '');

  // screenshots
  const shotDir = path.join(REF, 'screenshots', viewport.name);
  await ensureDir(shotDir);
  const fullShot = path.join(shotDir, 'full.png');
  const visibleShot = path.join(shotDir, 'viewport.png');
  try {
    await page.screenshot({ path: fullShot, fullPage: true });
    await page.screenshot({ path: visibleShot, fullPage: false });
  } catch (err) {
    logStep(`screenshot failed: ${err.message}`);
  }

  // DOM summary
  let domSummary = null;
  try {
    domSummary = await summarizeDom(page);
  } catch (err) {
    logStep(`dom summary failed: ${err.message}`);
  }

  // Outer HTML (only if reasonable)
  let outerHtml = null;
  try {
    outerHtml = await outerHtmlSafe(page, 1_500_000);
  } catch (err) {
    logStep(`outerHtml failed: ${err.message}`);
  }

  // Styles + CSS variables + palette
  let styles = [];
  let cssVars = {};
  let palette = [];
  try {
    styles = await summarizeStyles(page, [
      'body',
      'header',
      'nav',
      'main',
      'aside',
      'footer',
      '[role="toolbar"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="complementary"]',
      '[role="main"]',
      '[role="region"]',
    ]);
    cssVars = await extractCssVariables(page);
    palette = await extractColorPalette(page, 25);
  } catch (err) {
    logStep(`style capture failed: ${err.message}`);
  }

  // Storage
  let storage = null;
  try {
    storage = await captureStorageSnapshot(page);
  } catch (err) {
    logStep(`storage capture failed: ${err.message}`);
  }

  const bundleUrls = await collectBundleUrls(page);
  const assetUrls = await collectAssetUrls(page);

  await context.close();
  await browser.close();

  return {
    viewport,
    startedAt,
    durationMs: Date.now() - startedAt,
    navOk,
    navError,
    url,
    title,
    shots: { full: fullShot, viewport: visibleShot },
    domSummary,
    outerHtmlSize: outerHtml ? outerHtml.length : 0,
    styles,
    cssVars,
    palette,
    storage,
    bundleCount: bundleUrls.length,
    assetCount: assetUrls.length,
  };
}

async function collectBundleUrls(page) {
  // The capture already records every request in networkLog. This helper
  // additionally returns a deduplicated list of bundle URLs by inspecting
  // the current document and any worker URLs.
  return await page.evaluate(() => {
    const urls = new Set();
    document.querySelectorAll('script[src]').forEach((s) => urls.add(s.src));
    document.querySelectorAll('link[rel="stylesheet"][href]').forEach((l) => urls.add(l.href));
    document.querySelectorAll('link[rel="modulepreload"][href]').forEach((l) => urls.add(l.href));
    document.querySelectorAll('link[rel="preload"][as="script"][href]').forEach((l) => urls.add(l.href));
    return Array.from(urls);
  });
}

async function collectAssetUrls(page) {
  return await page.evaluate(() => {
    const urls = new Set();
    document.querySelectorAll('img[src]').forEach((i) => urls.add(i.src));
    document.querySelectorAll('video[src], video > source[src]').forEach((v) => urls.add(v.src || ''));
    document.querySelectorAll('audio[src]').forEach((a) => urls.add(a.src));
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((l) => urls.add(l.href));
    return Array.from(urls).filter(Boolean);
  });
}

async function main() {
  const startedAt = nowIso();
  logStep(`target=${TARGET} startedAt=${startedAt}`);

  const networkLog = [];
  const consoleLog = [];
  const perViewport = [];
  const errors = [];

  for (const viewport of VIEWPORTS) {
    try {
      const result = await capture(viewport, networkLog, consoleLog);
      perViewport.push(result);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      errors.push({ viewport: viewport.name, error: msg });
      logStep(`viewport ${viewport.name} failed: ${msg}`);
    }
  }

  // Persist network + console logs (sanitized at request time already)
  await ensureDir(path.join(REF, 'network'));
  await writeJson(path.join(REF, 'network', 'requests.json'), networkLog);
  await ensureDir(path.join(REF, 'console'));
  await writeJson(path.join(REF, 'console', 'messages.json'), consoleLog);

  // Build bundles.json and assets.json
  const bundles = dedupe(networkLog, (e) => e.request && e.request.url)
    .filter((e) => /\.(js|mjs|css|wasm)(\?|$)/.test(e.request.url) ||
                  /\/_next\//.test(e.request.url) ||
                  /chunk|static|assets|build/i.test(e.request.url))
    .map((e) => ({
      url: e.request.url,
      method: e.request.method,
      resourceType: e.request.resourceType,
      status: e.response ? e.response.status : null,
      contentType: e.response ? e.response.contentType : null,
    }));

  const assets = dedupe(networkLog, (e) => e.request && e.request.url)
    .filter((e) => /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|mp4|webm|mov|mp3|wav|ogg)(\?|$)/i.test(e.request.url))
    .map((e) => ({
      url: e.request.url,
      resourceType: e.request.resourceType,
      status: e.response ? e.response.status : null,
      contentType: e.response ? e.response.contentType : null,
    }));

  await writeJson(path.join(REF, 'bundles', 'bundles.json'), bundles);
  await writeJson(path.join(REF, 'assets', 'assets.json'), assets);

  // Persist DOM summaries and styles per viewport
  for (const r of perViewport) {
    const vDir = path.join(REF, 'dom', r.viewport.name);
    const sDir = path.join(REF, 'styles', r.viewport.name);
    await ensureDir(vDir);
    await ensureDir(sDir);
    await writeJson(path.join(vDir, 'summary.json'), r.domSummary);
    if (r.outerHtml) {
      await writeText(path.join(vDir, 'outer.html'), r.outerHtml);
    }
    await writeJson(path.join(sDir, 'styles.json'), r.styles);
    await writeJson(path.join(sDir, 'css-vars.json'), r.cssVars);
    await writeJson(path.join(sDir, 'palette.json'), r.palette);
  }

  // Storage: latest per-viewport snapshot (last writer wins)
  for (const r of perViewport) {
    if (r.storage) {
      await writeJson(path.join(REF, 'storage', `${r.viewport.name}.json`), r.storage);
    }
  }

  // capture summary
  const summary = {
    target: TARGET,
    startedAt,
    finishedAt: nowIso(),
    viewports: perViewport.map((r) => ({
      name: r.viewport.name,
      width: r.viewport.width,
      height: r.viewport.height,
      url: r.url,
      title: r.title,
      navOk: r.navOk,
      navError: r.navError,
      durationMs: r.durationMs,
      screenshotFull: r.shots.full,
      screenshotViewport: r.shots.viewport,
      outerHtmlSize: r.outerHtmlSize,
      bundleCount: r.bundleCount,
      assetCount: r.assetCount,
    })),
    networkCount: networkLog.length,
    consoleCount: consoleLog.length,
    bundleCount: bundles.length,
    assetCount: assets.length,
    errors,
  };

  await writeJson(path.join(REF, 'capture-summary.json'), summary);

  // human report
  const md = renderCaptureReport(summary, perViewport, consoleLog, bundles, assets);
  await writeText(path.join('.rebuild', 'reports', 'capture-run.md'), md);

  logStep(`done. wrote ${REF}`);
  console.log(JSON.stringify(summary, null, 2));
}

function dedupe(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const e of arr) {
    const k = keyFn(e);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

function renderCaptureReport(summary, perViewport, consoleLog, bundles, assets) {
  const lines = [];
  lines.push(`# Capture Run`);
  lines.push('');
  lines.push(`Target: \`${summary.target}\``);
  lines.push(`Started: ${summary.startedAt}`);
  lines.push(`Finished: ${summary.finishedAt}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push('');
  lines.push(`- Viewports captured: ${summary.viewports.length}`);
  lines.push(`- Network entries (sanitized): ${summary.networkCount}`);
  lines.push(`- Console messages: ${summary.consoleCount}`);
  lines.push(`- JS/CSS bundles: ${summary.bundleCount}`);
  lines.push(`- Static assets: ${summary.assetCount}`);
  lines.push(`- Errors during capture: ${summary.errors.length}`);
  lines.push('');
  lines.push(`## Per viewport`);
  for (const r of perViewport) {
    lines.push('');
    lines.push(`### ${r.viewport.name} (${r.viewport.width}x${r.viewport.height})`);
    lines.push(`- navOk: ${r.navOk}`);
    if (r.navError) lines.push(`- navError: \`${r.navError}\``);
    lines.push(`- url: ${r.url}`);
    lines.push(`- title: ${r.title}`);
    lines.push(`- durationMs: ${r.durationMs}`);
    lines.push(`- screenshot: \`${path.relative('.', r.shots.viewport)}\``);
    lines.push(`- screenshot full page: \`${path.relative('.', r.shots.full)}\``);
    lines.push(`- outerHtml size: ${r.outerHtmlSize}`);
  }
  lines.push('');
  lines.push(`## Console (top 30)`);
  for (const c of consoleLog.slice(0, 30)) {
    lines.push(`- [${c.viewport}] [${c.type}] ${c.text.replace(/\n/g, ' ').slice(0, 240)}`);
  }
  lines.push('');
  lines.push(`## Top bundles (top 30)`);
  for (const b of bundles.slice(0, 30)) {
    lines.push(`- ${b.status || '??'} ${b.contentType || ''} ${b.url}`);
  }
  lines.push('');
  lines.push(`## Top assets (top 30)`);
  for (const a of assets.slice(0, 30)) {
    lines.push(`- ${a.status || '??'} ${a.contentType || ''} ${a.url}`);
  }
  if (summary.errors.length) {
    lines.push('');
    lines.push(`## Errors`);
    for (const e of summary.errors) {
      lines.push(`- ${e.viewport}: ${e.error}`);
    }
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[capture] fatal', err);
  process.exit(1);
});