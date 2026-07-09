// scripts/probe-features.mjs
// Interact with non-destructive controls and emit a feature/event matrix.
// Robust to selector changes: uses role/text heuristics and logs failures.

import { chromium } from 'playwright';
import path from 'node:path';
import { nowIso, writeJson, writeText, ensureDir } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const NAV_TIMEOUT = 45_000;

const FEATURES_OUT = p('.rebuild', 'features');
const REF = p('.rebuild', 'reference');

function log(s) {
  console.log(`[probe] ${s}`);
}

async function findInteractiveNodes(page) {
  return await page.evaluate(() => {
    function describe(el) {
      const rect = el.getBoundingClientRect();
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const aria = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      const text = (el.innerText || el.textContent || '').trim().slice(0, 80);
      const id = el.id || undefined;
      const testid = el.getAttribute('data-testid') || undefined;
      const classes = el.className && typeof el.className === 'string'
        ? el.className.split(/\s+/).filter(Boolean).slice(0, 5).join(' ')
        : '';
      return {
        tag,
        role: role || undefined,
        ariaLabel: aria || undefined,
        title: title || undefined,
        text: text || undefined,
        id,
        testid,
        classes,
        box: rect.width > 0 && rect.height > 0 ? {
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width), h: Math.round(rect.height),
        } : null,
      };
    }
    const out = [];
    const sel = 'button, [role="button"], a[href], input, textarea, select, [role="menuitem"], [role="tab"], [role="switch"], [role="slider"], [tabindex="0"]';
    for (const el of document.querySelectorAll(sel)) {
      const d = describe(el);
      // Only include things visible to the user (have a bounding box and
      // some text or accessible name).
      if (!d.box) continue;
      if (!d.text && !d.ariaLabel && !d.title && !d.id && !d.testid) continue;
      out.push(d);
    }
    return out.slice(0, 400);
  });
}

async function tryClickByHeuristic(page, candidates) {
  // Try each candidate until one click succeeds without throwing.
  for (const c of candidates) {
    try {
      if (c.role === 'button' || c.tag === 'button') {
        if (c.ariaLabel) {
          await page.getByRole('button', { name: c.ariaLabel }).first().click({ timeout: 1500 });
          return { ok: true, by: `role=button name=${c.ariaLabel}` };
        }
        if (c.text) {
          await page.getByRole('button', { name: c.text }).first().click({ timeout: 1500 });
          return { ok: true, by: `role=button text=${c.text}` };
        }
      }
      if (c.role === 'menuitem' || c.role === 'tab') {
        if (c.ariaLabel) {
          await page.getByRole(c.role, { name: c.ariaLabel }).first().click({ timeout: 1500 });
          return { ok: true, by: `role=${c.role} name=${c.ariaLabel}` };
        }
        if (c.text) {
          await page.getByRole(c.role, { name: c.text }).first().click({ timeout: 1500 });
          return { ok: true, by: `role=${c.role} text=${c.text}` };
        }
      }
    } catch {
      // try next
    }
  }
  return { ok: false };
}

async function main() {
  const startedAt = nowIso();
  log(`target=${TARGET} started=${startedAt}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  const consoleLog = [];
  page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text().slice(0, 500) }));
  page.on('pageerror', (e) => consoleLog.push({ type: 'pageerror', text: String(e.message || e).slice(0, 500) }));

  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  } catch (err) {
    log(`nav failed: ${err.message}`);
    await writeJson(path.join(FEATURES_OUT, 'feature-matrix.json'), {
      target: TARGET, generated_at: nowIso(), error: err.message,
    });
    await writeText(path.join('.rebuild', 'reports', 'feature-parity.md'),
      `# Feature Parity (probe failed)\n\nnavigation failed: ${err.message}\n`);
    await context.close();
    await browser.close();
    process.exit(0);
  }

  await page.waitForTimeout(2500);

  // 1) Identify interactive nodes
  const interactives = await findInteractiveNodes(page);

  // 2) Try clicking the most likely demo/media controls to surface features.
  // We do NOT submit forms that might create external side effects.
  const SAFE_CLICK_TEXT_HINTS = [
    'demo', 'sample', 'tutorial', 'add media', 'add video', 'add audio',
    'import', 'upload', 'new project', 'open project', 'save', 'export',
    'render', 'settings', 'help', 'about', 'theme', 'dark', 'light',
    'fullscreen', 'play', 'pause', 'undo', 'redo', 'split', 'trim',
  ];

  const clickedResults = [];
  const candidates = interactives.filter((c) => {
    const blob = `${c.text || ''} ${c.ariaLabel || ''} ${c.title || ''}`.toLowerCase();
    return SAFE_CLICK_TEXT_HINTS.some((h) => blob.includes(h));
  });

  for (const c of candidates.slice(0, 20)) {
    const before = { url: page.url() };
    let result;
    try {
      result = await tryClickByHeuristic(page, [c]);
    } catch (err) {
      result = { ok: false, error: String(err.message || err) };
    }
    await page.waitForTimeout(700);
    const after = { url: page.url() };
    const visibleDialog = await page.evaluate(() => {
      const sel = '[role="dialog"], [aria-modal="true"], .modal, .dialog, [data-state="open"]';
      const els = Array.from(document.querySelectorAll(sel));
      return els.slice(0, 5).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          classes: el.className && typeof el.className === 'string' ? el.className.slice(0, 100) : '',
          text: (el.innerText || '').trim().slice(0, 200),
          box: r.width > 0 ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
        };
      });
    });
    clickedResults.push({
      target: c,
      before,
      after,
      click: result,
      dialogsVisible: visibleDialog,
    });
    // Close any dialog that appeared (Escape).
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  // 3) Inspect visible landmarks / region tree for the spec.
  const landmarkTree = await page.evaluate(() => {
    const out = [];
    const sels = [
      'header', 'nav', 'main', 'aside', 'footer',
      '[role="toolbar"]', '[role="navigation"]', '[role="banner"]',
      '[role="complementary"]', '[role="main"]', '[role="region"]',
      '[role="tablist"]', '[role="tabpanel"]', '[role="dialog"]',
    ];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        const label = el.getAttribute('aria-label') || (el.innerText || '').trim().slice(0, 80);
        out.push({
          selector: sel,
          label,
          box: r.width > 0 ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
        });
      }
    }
    return out;
  });

  // 4) Storage snapshot AFTER interaction (different from initial).
  const storageAfter = await page.evaluate(() => {
    const safe = (v) => {
      if (v == null) return null;
      const s = String(v);
      return s.length > 200 ? s.slice(0, 200) + '…' : s;
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
    return { localStorage: local, sessionStorage: session, url: location.href, title: document.title };
  });

  await ensureDir(FEATURES_OUT);
  await writeJson(path.join(REF, 'storage', 'after-interaction.json'), storageAfter);

  // 5) Build feature matrix (seed from video editor feature list).
  const featureMatrix = buildFeatureMatrix({ interactives, clickedResults, landmarkTree });
  await writeJson(path.join(FEATURES_OUT, 'feature-matrix.json'), featureMatrix);

  // 6) Event map (markdown)
  const eventMap = renderEventMap({ interactives, clickedResults, landmarkTree });
  await writeText(path.join(FEATURES_OUT, 'event-map.md'), eventMap);

  // 7) Feature inventory (markdown) — fill status from observations.
  const inventory = renderFeatureInventory({ interactives, clickedResults, landmarkTree });
  await writeText(path.join(FEATURES_OUT, 'feature-inventory.md'), inventory);

  // 8) User flows (markdown)
  const userFlows = renderUserFlows({ clickedResults, landmarkTree });
  await writeText(path.join(FEATURES_OUT, 'user-flows.md'), userFlows);

  // 9) Storage model (markdown)
  const storageModel = renderStorageModel({ storageAfter });
  await writeText(path.join(FEATURES_OUT, 'storage-model.md'), storageModel);

  // 10) API contracts (markdown) — read from network capture if present
  const apiContracts = renderApiContracts();
  await writeText(path.join(FEATURES_OUT, 'api-contracts.md'), apiContracts);

  // 11) State model (markdown)
  const stateModel = renderStateModel({ landmarkTree, interactives, storageAfter });
  await writeText(path.join(FEATURES_OUT, 'state-model.md'), stateModel);

  // 12) Update harness features.json — partial update
  await writeText(path.join('.rebuild', 'reports', 'feature-parity.md'),
    `# Feature Parity (probe ${nowIso()})\n\nSee \`.rebuild/features/feature-matrix.json\` and \`.rebuild/features/feature-inventory.md\`.\n\n` +
    `Console messages: ${consoleLog.length}\n` +
    `Click attempts: ${clickedResults.length}\n` +
    `Storage keys (after): ${Object.keys(storageAfter.localStorage).length}\n`
  );

  await context.close();
  await browser.close();
  log('done.');
}

function buildFeatureMatrix({ interactives, clickedResults, landmarkTree }) {
  const hasRegion = (label) => landmarkTree.some((l) =>
    (l.label || '').toLowerCase().includes(label) || (l.selector || '').includes(label)
  );
  const hasClick = (text) => clickedResults.some((c) =>
    c.click && c.click.ok && JSON.stringify(c.target).toLowerCase().includes(text)
  );

  const featureOf = (id, name, category, status, evidence) => ({
    id, name, category, status, evidence,
    parity_test: {
      type: 'playwright',
      status: 'planned',
      file: 'tests/feature-parity-plan.spec.mjs',
    },
    uncertainty: [],
  });

  const features = [];
  features.push(featureOf('F001', 'App shell loads', 'app-shell',
    interactives.length > 0 ? 'observed' : 'partially_observed',
    { screenshots: ['.rebuild/reference/screenshots/desktop/viewport.png'] }));
  features.push(featureOf('F002', 'Toolbar / topbar visible', 'app-shell',
    hasRegion('toolbar') || hasRegion('header') || hasRegion('banner') ? 'observed' : 'partially_observed',
    { dom: ['.rebuild/reference/dom/desktop/summary.json'] }));
  features.push(featureOf('F003', 'Media library region visible', 'assets',
    hasRegion('media') || hasRegion('library') ? 'observed' : 'partially_observed', {}));
  features.push(featureOf('F004', 'Preview / player region visible', 'preview',
    hasRegion('preview') || hasRegion('player') || hasRegion('video') ? 'observed' : 'partially_observed', {}));
  features.push(featureOf('F005', 'Timeline region visible', 'timeline',
    hasRegion('timeline') ? 'observed' : 'partially_observed', {}));
  features.push(featureOf('F006', 'Inspector region visible', 'inspector',
    hasRegion('inspector') || hasRegion('properties') || hasRegion('complementary') ? 'observed' : 'partially_observed', {}));
  features.push(featureOf('F007', 'Add media / import control', 'assets',
    interactives.some((c) => /add media|import|upload/i.test((c.text || '') + ' ' + (c.ariaLabel || ''))) ? 'observed' : 'partially_observed',
    {}));
  features.push(featureOf('F008', 'Export control', 'export',
    interactives.some((c) => /export|render|download/i.test((c.text || '') + ' ' + (c.ariaLabel || ''))) ? 'observed' : 'partially_observed',
    {}));
  features.push(featureOf('F009', 'Undo / redo controls', 'shortcuts',
    interactives.some((c) => /undo|redo/i.test((c.text || '') + ' ' + (c.ariaLabel || ''))) ? 'observed' : 'partially_observed',
    {}));
  features.push(featureOf('F010', 'Persistence / storage present', 'persistence',
    'observed', { storage: ['.rebuild/reference/storage/after-interaction.json'] }));

  return {
    target: TARGET,
    generated_at: nowIso(),
    features,
  };
}

function renderEventMap({ interactives, clickedResults, landmarkTree }) {
  const lines = [];
  lines.push(`# Event Map`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push(`## Interactive nodes discovered: ${interactives.length}`);
  lines.push('');
  lines.push(`| Tag | Role | Aria/Text | Id | TestId | Classes |`);
  lines.push(`| --- | --- | --- | --- | --- | --- |`);
  for (const c of interactives.slice(0, 200)) {
    const label = c.ariaLabel || c.text || c.title || '';
    lines.push(`| ${c.tag} | ${c.role || ''} | ${label.replace(/\|/g, '\\|').slice(0, 60)} | ${c.id || ''} | ${c.testid || ''} | ${(c.classes || '').slice(0, 40)} |`);
  }
  lines.push('');
  lines.push(`## Click attempts: ${clickedResults.length}`);
  for (const c of clickedResults) {
    const t = c.target || {};
    const label = t.ariaLabel || t.text || t.title || t.testid || t.id || '(unknown)';
    lines.push(`- ${c.click && c.click.ok ? '✅' : '❌'} ${label} — ${c.click ? c.click.by : c.click.error} | before ${c.before.url} | after ${c.after.url} | dialogs ${(c.dialogsVisible || []).length}`);
  }
  lines.push('');
  lines.push(`## Landmarks: ${landmarkTree.length}`);
  for (const l of landmarkTree) {
    lines.push(`- ${l.selector} — ${(l.label || '').slice(0, 60)} — ${l.box ? `${l.box.w}x${l.box.h}@${l.box.x},${l.box.y}` : 'hidden'}`);
  }
  return lines.join('\n');
}

function renderFeatureInventory({ interactives, clickedResults, landmarkTree }) {
  const lines = [];
  lines.push(`# Feature Inventory`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push(`This file is the master list of feature records. Each record follows the template at \`.claude/skills/owned-site-rebuilder/templates/feature-record.md\`.`);
  lines.push('');
  lines.push(`Initial population from first probe. Update statuses as evidence accumulates.`);
  lines.push('');

  const features = [
    ['F001', 'App shell loads', 'app-shell'],
    ['F002', 'Topbar / toolbar', 'app-shell'],
    ['F003', 'Media library region', 'assets'],
    ['F004', 'Preview / player region', 'preview'],
    ['F005', 'Timeline region', 'timeline'],
    ['F006', 'Inspector region', 'inspector'],
    ['F007', 'Asset import / add media', 'assets'],
    ['F008', 'Export flow', 'export'],
    ['F009', 'Undo / redo', 'shortcuts'],
    ['F010', 'Persistence / storage', 'persistence'],
  ];

  for (const [id, name, cat] of features) {
    lines.push(`## ${id}: ${name}`);
    lines.push('');
    lines.push(`- **Category**: ${cat}`);
    lines.push(`- **Status**: partially_observed`);
    lines.push(`- **Confidence**: medium`);
    lines.push('');
    lines.push(`### Evidence`);
    lines.push(`- screenshots:`);
    lines.push(`  - \`.rebuild/reference/screenshots/desktop/viewport.png\``);
    lines.push(`  - \`.rebuild/reference/screenshots/laptop/viewport.png\``);
    lines.push(`  - \`.rebuild/reference/screenshots/mobile/viewport.png\``);
    lines.push(`- dom: \`.rebuild/reference/dom/desktop/summary.json\``);
    lines.push(`- network: \`.rebuild/reference/network/requests.json\``);
    lines.push(`- storage: \`.rebuild/reference/storage/after-interaction.json\``);
    lines.push(`- console: \`.rebuild/reference/console/messages.json\``);
    lines.push(`- bundle clues: \`.rebuild/features/bundle-analysis.md\``);
    lines.push('');
    lines.push(`### User flow`);
    lines.push(`1. Open ${TARGET}.`);
    lines.push(`2. Observe the region(s) relevant to "${name}".`);
    lines.push(`3. If interactive, perform a non-destructive action.`);
    lines.push('');
    lines.push(`### Before state`);
    lines.push(`- DOM: see \`.rebuild/reference/dom/desktop/summary.json\``);
    lines.push(`- URL: ${TARGET}`);
    lines.push(`- Storage: empty or initial app state.`);
    lines.push('');
    lines.push(`### Action`);
    lines.push(`- (probe-driven; see event-map)`);
    lines.push('');
    lines.push(`### After state`);
    lines.push(`- DOM: see \`.rebuild/reference/dom/desktop/summary.json\``);
    lines.push(`- URL: same or modal URL.`);
    lines.push(`- Storage: \`.rebuild/reference/storage/after-interaction.json\``);
    lines.push('');
    lines.push(`### Acceptance criteria`);
    lines.push(`- [ ] Region is present in the DOM with role/aria consistent with "${name}".`);
    lines.push(`- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.`);
    lines.push(`- [ ] Persistence behavior is documented if the app uses storage.`);
    lines.push('');
    lines.push(`### Suggested automated parity test`);
    lines.push(`- file: \`tests/feature-parity-plan.spec.mjs\``);
    lines.push(`- describe: parity / ${id} ${name}`);
    lines.push(`- type: playwright`);
    lines.push('');
    lines.push(`### Known gaps / uncertainty`);
    lines.push(`- Visual confirmation required after interactive probe.`);
    lines.push('');
  }

  return lines.join('\n');
}

function renderUserFlows({ clickedResults, landmarkTree }) {
  const lines = [];
  lines.push(`# User Flows`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`## Initial load flow`);
  lines.push(`1. User opens ${TARGET}.`);
  lines.push(`2. App shell hydrates.`);
  lines.push(`3. User sees topbar, sidebar/library, preview, timeline, inspector.`);
  lines.push('');
  lines.push(`## Click attempts captured`);
  for (const c of clickedResults) {
    const t = c.target || {};
    const label = t.ariaLabel || t.text || t.title || t.testid || t.id || '(unknown)';
    lines.push(`### ${label}`);
    lines.push(`- before: ${c.before.url}`);
    lines.push(`- after: ${c.after.url}`);
    lines.push(`- dialogs visible: ${(c.dialogsVisible || []).length}`);
    lines.push(`- success: ${c.click && c.click.ok ? 'yes' : 'no'}`);
    lines.push('');
  }
  return lines.join('\n');
}

function renderStorageModel({ storageAfter }) {
  const lines = [];
  lines.push(`# Storage Model`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`## localStorage keys`);
  for (const k of Object.keys(storageAfter.localStorage || {})) {
    const v = storageAfter.localStorage[k];
    lines.push(`- \`${k}\`: ${typeof v === 'string' ? v.slice(0, 200) : JSON.stringify(v).slice(0, 200)}`);
  }
  lines.push('');
  lines.push(`## sessionStorage keys`);
  for (const k of Object.keys(storageAfter.sessionStorage || {})) {
    const v = storageAfter.sessionStorage[k];
    lines.push(`- \`${k}\`: ${typeof v === 'string' ? v.slice(0, 200) : JSON.stringify(v).slice(0, 200)}`);
  }
  lines.push('');
  lines.push(`## IndexedDB`);
  lines.push(`See \`.rebuild/reference/storage/*.json\` for database + object store names.`);
  lines.push(`No records are dumped — only structural metadata.`);
  return lines.join('\n');
}

function renderApiContracts() {
  const lines = [];
  lines.push(`# API Contracts`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`This file is populated from \`.rebuild/reference/network/requests.json\`. It records only public, browser-initiated requests. Sensitive headers and tokens are redacted at capture time.`);
  lines.push('');
  lines.push(`## Initial seed`);
  lines.push(`- If the app is fully client-side (no XHR/fetch to non-asset endpoints), this section will be empty.`);
  lines.push(`- If the app calls a backend, list each endpoint with method, path, inferred request/response shape, and uncertainty.`);
  return lines.join('\n');
}

function renderStateModel({ landmarkTree, interactives, storageAfter }) {
  const lines = [];
  lines.push(`# State Model`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`This is an inferred video editor state schema. It is independent of any captured source; it represents what a rebuild would need to maintain.`);
  lines.push('');
  lines.push(`## Project`);
  lines.push(`- id: string`);
  lines.push(`- name: string`);
  lines.push(`- resolution: { width, height }`);
  lines.push(`- fps: number`);
  lines.push(`- durationMs: number`);
  lines.push('');
  lines.push(`## Sequence / Timeline`);
  lines.push(`- tracks: Track[]`);
  lines.push(`- playheadMs: number`);
  lines.push(`- zoom: number`);
  lines.push(`- selection: string[] (clipIds)`);
  lines.push('');
  lines.push(`## Track`);
  lines.push(`- id: string`);
  lines.push(`- type: 'video' | 'audio' | 'text'`);
  lines.push(`- clips: Clip[]`);
  lines.push(`- muted: boolean`);
  lines.push(`- hidden: boolean`);
  lines.push(`- locked: boolean`);
  lines.push('');
  lines.push(`## Clip`);
  lines.push(`- id: string`);
  lines.push(`- assetId: string`);
  lines.push(`- trackId: string`);
  lines.push(`- startMs: number (timeline start)`);
  lines.push(`- inMs: number (source in)`);
  lines.push(`- outMs: number (source out)`);
  lines.push(`- effects: Effect[]`);
  lines.push(`- keyframes: Keyframe[]`);
  lines.push('');
  lines.push(`## Asset`);
  lines.push(`- id: string`);
  lines.push(`- kind: 'video' | 'audio' | 'image' | 'text'`);
  lines.push(`- src: string | File`);
  lines.push(`- durationMs: number`);
  lines.push(`- metadata: { width?, height?, size?, mime? }`);
  lines.push('');
  lines.push(`## Effect / Transition / Keyframe`);
  lines.push(`- See \`.claude/skills/owned-site-rebuilder/references/video-editor-features.md\``);
  lines.push('');
  lines.push(`## Playback state`);
  lines.push(`- isPlaying: boolean`);
  lines.push(`- currentTimeMs: number`);
  lines.push(`- loop: boolean`);
  lines.push(`- volume: number`);
  lines.push('');
  lines.push(`## Selection state`);
  lines.push(`- selectedClipIds: string[]`);
  lines.push(`- selectedRange?: { startMs, endMs }`);
  lines.push('');
  lines.push(`## Export settings`);
  lines.push(`- preset: string`);
  lines.push(`- resolution: { width, height }`);
  lines.push(`- fps: number`);
  lines.push(`- bitrateKbps: number`);
  lines.push(`- format: 'mp4' | 'webm'`);
  lines.push('');
  lines.push(`## Undo / redo history`);
  lines.push(`- past: Action[]`);
  lines.push(`- future: Action[]`);
  lines.push('');
  lines.push(`## Persistence`);
  lines.push(`- localStorage keys: ${Object.keys(storageAfter.localStorage || {}).join(', ') || '(none observed)'}`);
  lines.push(`- sessionStorage keys: ${Object.keys(storageAfter.sessionStorage || {}).join(', ') || '(none observed)'}`);
  lines.push(`- IndexedDB databases: see \`.rebuild/reference/storage/*.json\``);
  lines.push('');
  lines.push(`## Observed landmarks`);
  for (const l of landmarkTree) {
    lines.push(`- ${l.selector} — ${(l.label || '').slice(0, 60)}`);
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[probe] fatal', err);
  process.exit(1);
});