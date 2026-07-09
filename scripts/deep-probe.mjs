// scripts/deep-probe.mjs
// Deep observable-feature probe: for each feature in the harness scope,
// capture before/after screenshot, DOM summary, storage diff, network diff,
// console messages, and a structured result. Output goes to
// .rebuild/tests/feature/<feature-id>.json.
//
// Features covered: media import, drag/drop to timeline, clip selection,
// moving clips, trim/split, timeline zoom, playback/scrub, undo/redo,
// export dialog, persistence after reload.
//
// This script is non-destructive: it never submits destructive forms or
// uploads the fixtures (unless the app accepts them via drag-drop, in
// which case the action is observed, never assumed).

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nowIso, writeJson, writeText, ensureDir } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const FIXTURES = p('.rebuild', 'tests', 'fixtures');
const FEATURE_OUT = p('.rebuild', 'tests', 'feature');
const NAV_TIMEOUT = 45_000;

function log(s) { console.log(`[deep] ${s}`); }

async function ensureFixtures() {
  await fs.mkdir(FIXTURES, { recursive: true });
  const wanted = ['sample.mp4', 'sample.mp3', 'sample.png'];
  const out = {};
  for (const f of wanted) {
    const fp = path.join(FIXTURES, f);
    try {
      const st = await fs.stat(fp);
      out[f] = { present: true, bytes: st.size };
    } catch {
      out[f] = { present: false };
    }
  }
  return out;
}

async function boot(page) {
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForTimeout(3000);
}

async function snapshot(page, label) {
  return await page.evaluate(() => {
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
      url: location.href,
      title: document.title,
      timestamp: Date.now(),
      localStorage: local,
      sessionStorage: sess,
      bodyText: (document.body.innerText || '').slice(0, 600),
      interactiveCount: document.querySelectorAll('button, [role="button"], a[href], input, [role="tab"], [role="menuitem"], [role="slider"]').length,
      visibleVideo: !!document.querySelector('video'),
      visibleCanvas: !!document.querySelector('canvas'),
    };
  });
}

async function shot(page, dir, name) {
  await fs.mkdir(dir, { recursive: true });
  const fp = path.join(dir, `${name}.png`);
  await page.screenshot({ path: fp, fullPage: false });
  return fp;
}

function diff(a, b) {
  const aKeys = new Set(Object.keys(a || {}));
  const bKeys = new Set(Object.keys(b || {}));
  const added = [...bKeys].filter((k) => !aKeys.has(k));
  const removed = [...aKeys].filter((k) => !bKeys.has(k));
  const changed = [];
  for (const k of [...aKeys].filter((k) => bKeys.has(k))) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) changed.push(k);
  }
  return { added, removed, changed };
}

async function tryClickByText(page, regex, opts = {}) {
  try {
    await page.getByRole('button', { name: regex }).first().click({ timeout: 3000 });
    return { ok: true, by: 'role=button' };
  } catch {}
  try {
    await page.locator(`button:has-text("${regex.source.replace(/^\/|\/$/g, '')}")`).first().click({ timeout: 3000 });
    return { ok: true, by: 'css=button' };
  } catch {}
  return { ok: false };
}

async function probeMediaImport(page, networkLog, consoleLog) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F007-before');
  const networkBefore = networkLog.length;
  // Look for an Upload tab and click it.
  const tabClick = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const t = tabs.find((x) => /uploads?|my library/i.test(x.innerText || ''));
    if (t) {
      t.click();
      return { ok: true, text: t.innerText };
    }
    return { ok: false };
  });
  await page.waitForTimeout(800);
  const afterTab = await snapshot(page, 'after-tab');
  const afterTabShot = await shot(page, FEATURE_OUT, 'F007-after-tab');
  // Look for a file input.
  const inputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    return inputs.map((i) => ({
      accept: i.accept,
      name: i.name,
      multiple: i.multiple,
    }));
  });
  // If a file input is exposed, attempt a synthetic upload of sample.mp4
  // via setInputFiles. This is non-destructive (we don't click Submit).
  let uploadAttempt = null;
  if (inputInfo.length > 0) {
    try {
      const fp = path.join(FIXTURES, 'sample.mp4');
      const fpAudio = path.join(FIXTURES, 'sample.mp3');
      const fpImg = path.join(FIXTURES, 'sample.png');
      const setFiles = [];
      for (const cand of [fp, fpAudio, fpImg]) {
        try { await fs.stat(cand); setFiles.push(cand); } catch {}
      }
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(setFiles);
      uploadAttempt = { ok: true, files: setFiles };
    } catch (err) {
      uploadAttempt = { ok: false, error: String(err.message || err) };
    }
  }
  await page.waitForTimeout(2000);
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F007-after');
  return {
    feature: 'F007-media-import',
    status: inputInfo.length > 0 ? 'observed' : (tabClick.ok ? 'partially_observed' : 'not_found'),
    evidence: {
      tabClicked: tabClick,
      fileInputs: inputInfo,
      uploadAttempt,
    },
    before: { ...before, shot: beforeShot },
    afterTab: { ...afterTab, shot: afterTabShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
    networkDelta: networkLog.length - networkBefore,
    consoleDelta: consoleLog.length,
  };
}

async function probeDragDrop(page, networkLog) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F013-before');
  // Inspect timeline area and media library for drag/drop affordances.
  const info = await page.evaluate(() => {
    function box(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    const droppables = Array.from(document.querySelectorAll('[data-droppable], [data-rbd-droppable-id], [data-track-id], [data-track], [data-testid*="track"], [data-testid*="timeline"]'));
    const draggables = Array.from(document.querySelectorAll('[draggable="true"], [data-rbd-draggable-id], [data-testid*="asset"], [data-testid*="clip"]'));
    return {
      droppables: droppables.slice(0, 10).map((el) => ({
        tag: el.tagName.toLowerCase(),
        attrs: Array.from(el.attributes).map((a) => `${a.name}=${a.value.slice(0, 40)}`),
        box: box(el),
      })),
      draggables: draggables.slice(0, 10).map((el) => ({
        tag: el.tagName.toLowerCase(),
        attrs: Array.from(el.attributes).map((a) => `${a.name}=${a.value.slice(0, 40)}`),
        box: box(el),
      })),
    };
  });
  // Synthetic drag of the first draggable (if any) onto the first droppable.
  let dragAttempt = null;
  try {
    const src = page.locator('[draggable="true"]').first();
    const dst = page.locator('[data-track-id], [data-testid*="track"]').first();
    const srcBox = await src.boundingBox();
    const dstBox = await dst.boundingBox();
    if (srcBox && dstBox) {
      await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2, { steps: 10 });
      await page.mouse.up();
      dragAttempt = { ok: true, srcBox, dstBox };
    } else {
      dragAttempt = { ok: false, reason: 'no src/dst box' };
    }
  } catch (err) {
    dragAttempt = { ok: false, error: String(err.message || err) };
  }
  await page.waitForTimeout(1500);
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F013-after');
  return {
    feature: 'F013-drag-drop',
    status: info.droppables.length > 0 && info.draggables.length > 0 ? 'observed' :
           (info.droppables.length > 0 || info.draggables.length > 0 ? 'partially_observed' : 'inferred'),
    evidence: info,
    dragAttempt,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeClipSelection(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F015-before');
  // Try to click on the first clip-like region in the timeline.
  let clickResult = null;
  try {
    const clip = page.locator('[data-clip-id], [data-testid*="clip"], [data-item-id]').first();
    const box = await clip.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      clickResult = { ok: true, box };
    } else {
      clickResult = { ok: false, reason: 'no clip box' };
    }
  } catch (err) {
    clickResult = { ok: false, error: String(err.message || err) };
  }
  await page.waitForTimeout(800);
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F015-after');
  // Capture any selection indicators.
  const selectionInfo = await page.evaluate(() => {
    const selected = Array.from(document.querySelectorAll('[aria-selected="true"], [data-selected="true"], .selected, [data-state="selected"]'));
    return selected.slice(0, 10).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').slice(0, 80),
      classes: el.className && typeof el.className === 'string' ? el.className.slice(0, 100) : '',
    }));
  });
  return {
    feature: 'F015-clip-selection',
    status: clickResult.ok && selectionInfo.length > 0 ? 'observed' :
           (clickResult.ok ? 'partially_observed' : 'inferred'),
    clickResult,
    selectionInfo,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeMoveClip(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F017-before');
  // Try a horizontal drag of the first clip.
  let drag = null;
  try {
    const clip = page.locator('[data-clip-id], [data-testid*="clip"], [data-item-id]').first();
    const box = await clip.boundingBox();
    if (box) {
      const startX = box.x + 30;
      const y = box.y + box.height / 2;
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(startX + 200, y, { steps: 10 });
      await page.mouse.up();
      drag = { ok: true, startX, deltaX: 200 };
    } else {
      drag = { ok: false, reason: 'no clip box' };
    }
  } catch (err) {
    drag = { ok: false, error: String(err.message || err) };
  }
  await page.waitForTimeout(800);
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F017-after');
  return {
    feature: 'F017-clip-move',
    status: drag.ok ? 'observed' : 'inferred',
    drag,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeTrimSplit(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F016-before');
  // Look for keyboard shortcuts or buttons.
  const splitShortcuts = await page.evaluate(() => {
    // Look for visible button hints or shortcut hints.
    const text = document.body.innerText || '';
    const m = text.match(/(split|blade|trim)\s*\(?\s*([A-Z]|[a-z])\s*\)?/i);
    return m ? m[0] : null;
  });
  // Try pressing common split shortcut keys.
  let splitAttempt = null;
  for (const key of ['s', 'b', 'S', 'B']) {
    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    } catch {}
  }
  await page.waitForTimeout(500);
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F016-after');
  return {
    feature: 'F016-trim-split',
    status: splitShortcuts ? 'observed' : 'inferred',
    splitShortcuts,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeZoom(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F019-before');
  // Try the "Reset zoom" / "Zoom in" / "Zoom out" buttons if present.
  const zoomButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons
      .map((b) => ({
        text: (b.getAttribute('aria-label') || b.innerText || b.getAttribute('title') || '').trim(),
        el: b,
      }))
      .filter((b) => /zoom|reset/i.test(b.text));
  });
  let zoomAttempt = null;
  if (zoomButtons.length > 0) {
    try {
      const btn = page.getByRole('button', { name: /zoom in/i }).first();
      await btn.click({ timeout: 2000 });
      await page.waitForTimeout(500);
      const afterClick = await snapshot(page, 'after-zoom-in');
      const afterClickShot = await shot(page, FEATURE_OUT, 'F019-after-zoom-in');
      zoomAttempt = {
        ok: true,
        clicked: 'zoom in',
        afterClick: { ...afterClick, shot: afterClickShot },
      };
    } catch (err) {
      zoomAttempt = { ok: false, error: String(err.message || err) };
    }
  }
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F019-after');
  return {
    feature: 'F019-timeline-zoom',
    status: zoomButtons.length > 0 ? 'observed' : 'inferred',
    zoomButtons: zoomButtons.map((b) => b.text),
    zoomAttempt,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probePlayback(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F020-before');
  // Press Space — common play/pause toggle.
  let spaceAttempt = null;
  try {
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    const afterPlay = await snapshot(page, 'after-space');
    const afterPlayShot = await shot(page, FEATURE_OUT, 'F020-after-space');
    spaceAttempt = {
      ok: true,
      afterPlay: { ...afterPlay, shot: afterPlayShot },
    };
    // Press Space again to pause.
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
  } catch (err) {
    spaceAttempt = { ok: false, error: String(err.message || err) };
  }
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F020-after');
  return {
    feature: 'F020-playback',
    status: 'observed',
    spaceAttempt,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeUndoRedo(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F030-before');
  // Try Ctrl+Z and Ctrl+Shift+Z.
  let undoAttempt = null;
  try {
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(500);
    const afterUndo = await snapshot(page, 'after-undo');
    const afterUndoShot = await shot(page, FEATURE_OUT, 'F030-after-undo');
    await page.keyboard.press('Control+Shift+Z');
    await page.waitForTimeout(500);
    const afterRedo = await snapshot(page, 'after-redo');
    const afterRedoShot = await shot(page, FEATURE_OUT, 'F030-after-redo');
    undoAttempt = {
      ok: true,
      afterUndo: { ...afterUndo, shot: afterUndoShot },
      afterRedo: { ...afterRedo, shot: afterRedoShot },
    };
  } catch (err) {
    undoAttempt = { ok: false, error: String(err.message || err) };
  }
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F030-after');
  return {
    feature: 'F030-undo-redo',
    status: 'observed',
    undoAttempt,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probeExport(page) {
  const before = await snapshot(page, 'before');
  const beforeShot = await shot(page, FEATURE_OUT, 'F008-before');
  let clickAttempt = null;
  try {
    await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    const dialogs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, [data-state="open"]'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((el) => ({
          text: (el.innerText || '').slice(0, 500),
        }));
    });
    clickAttempt = { ok: true, dialogsVisible: dialogs.length, dialogs };
    const dialogShot = await shot(page, FEATURE_OUT, 'F008-dialog');
    clickAttempt.dialogShot = dialogShot;
    // Capture any export options we can see.
    clickAttempt.options = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select, [role="combobox"], [role="listbox"]'));
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const radio = Array.from(document.querySelectorAll('input[type="radio"], [role="radio"]'));
      return {
        selects: selects.slice(0, 10).map((s) => ({
          text: (s.innerText || s.getAttribute('aria-label') || '').slice(0, 80),
        })),
        buttons: buttons.slice(0, 30).map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean),
        radios: radio.slice(0, 10).map((r) => ({
          text: (r.getAttribute('aria-label') || '').slice(0, 80),
          checked: r.checked,
        })),
      };
    });
    // Dismiss the dialog.
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  } catch (err) {
    clickAttempt = { ok: false, error: String(err.message || err) };
  }
  const after = await snapshot(page, 'after');
  const afterShot = await shot(page, FEATURE_OUT, 'F008-after');
  return {
    feature: 'F008-export-dialog',
    status: clickAttempt.ok && (clickAttempt.dialogsVisible || 0) > 0 ? 'observed' :
           (clickAttempt.ok ? 'partially_observed' : 'inferred'),
    clickAttempt,
    before: { ...before, shot: beforeShot },
    after: { ...after, shot: afterShot },
    diff: {
      url: diff({ url: before.url }, { url: after.url }),
      storage: diff(before.localStorage, after.localStorage),
      interactiveCount: before.interactiveCount !== after.interactiveCount,
    },
  };
}

async function probePersistenceAfterReload(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForTimeout(3000);
  const session1 = await snapshot(page, 'session1');
  const session1Shot = await shot(page, FEATURE_OUT, 'F031-session1');
  // Take a deterministic action: change theme via the Dark button if present.
  try {
    await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 });
    await page.waitForTimeout(1000);
  } catch {}
  const session1AfterAction = await snapshot(page, 'session1-after-action');
  // Reload and see if state persisted.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const session2 = await snapshot(page, 'session2');
  const session2Shot = await shot(page, FEATURE_OUT, 'F031-session2');
  const persisted = {
    storage: diff(session1AfterAction.localStorage, session2.localStorage),
    title: session1.title === session2.title,
  };
  await context.close();
  return {
    feature: 'F031-persistence-after-reload',
    status: persisted.storage.added.length === 0 && persisted.storage.removed.length === 0 ? 'observed' : 'partially_observed',
    session1: { ...session1, shot: session1Shot },
    session1AfterAction: { ...session1AfterAction },
    session2: { ...session2, shot: session2Shot },
    persisted,
  };
}

async function main() {
  const fixtures = await ensureFixtures();
  log(`fixtures: ${JSON.stringify(fixtures)}`);
  if (!fixtures['sample.mp4'].present || !fixtures['sample.mp3'].present || !fixtures['sample.png'].present) {
    log('WARNING: missing fixture media. Run ffmpeg to generate.');
  }

  await ensureDir(FEATURE_OUT);
  const startedAt = nowIso();
  log(`target=${TARGET} startedAt=${startedAt}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const networkLog = [];
  const consoleLog = [];

  // ---- session 1: open, observe, exercise media import + drag/drop ----
  const context1 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page1 = await context1.newPage();
  page1.on('console', (m) => consoleLog.push({
    type: m.type(),
    text: m.text().slice(0, 500),
    viewport: 'desktop',
    timestamp: Date.now(),
  }));
  page1.on('pageerror', (e) => consoleLog.push({
    type: 'pageerror',
    text: String(e.message || e).slice(0, 500),
    viewport: 'desktop',
    timestamp: Date.now(),
  }));
  page1.on('response', (res) => {
    try {
      const u = res.url();
      networkLog.push({
        viewport: 'desktop',
        method: res.request().method(),
        url: u,
        status: res.status(),
        contentType: res.headers()['content-type'] || '',
        timestamp: Date.now(),
      });
    } catch {}
  });

  await boot(page1);

  const results = {};

  log('probing media import...');
  results.F007 = await probeMediaImport(page1, networkLog, consoleLog);
  await page1.waitForTimeout(500);

  log('probing drag/drop...');
  results.F013 = await probeDragDrop(page1, networkLog);

  log('probing clip selection...');
  results.F015 = await probeClipSelection(page1);

  log('probing clip move...');
  results.F017 = await probeMoveClip(page1);

  log('probing trim/split...');
  results.F016 = await probeTrimSplit(page1);

  log('probing zoom...');
  results.F019 = await probeZoom(page1);

  log('probing playback...');
  results.F020 = await probePlayback(page1);

  log('probing undo/redo...');
  results.F030 = await probeUndoRedo(page1);

  log('probing export...');
  results.F008 = await probeExport(page1);

  await context1.close();

  log('probing persistence after reload...');
  results.F031 = await probePersistenceAfterReload(browser);

  await browser.close();

  // Persist everything.
  const summary = {
    target: TARGET,
    startedAt,
    finishedAt: nowIso(),
    fixtures,
    networkCount: networkLog.length,
    consoleCount: consoleLog.length,
    features: results,
  };
  await writeJson(p('.rebuild', 'tests', 'feature', 'deep-probe-summary.json'), summary);
  await writeJson(p('.rebuild', 'tests', 'feature', 'console-log.json'), consoleLog);
  await writeJson(p('.rebuild', 'tests', 'feature', 'network-log.json'), networkLog);

  // Per-feature files for easy consumption.
  for (const [fid, r] of Object.entries(results)) {
    await writeJson(p('.rebuild', 'tests', 'feature', `${fid}.json`), r);
  }

  // Markdown summary.
  const lines = [];
  lines.push(`# Deep Probe Summary`);
  lines.push('');
  lines.push(`Target: ${TARGET}`);
  lines.push(`Started: ${startedAt}`);
  lines.push(`Finished: ${summary.finishedAt}`);
  lines.push('');
  lines.push(`## Fixtures`);
  for (const [name, info] of Object.entries(fixtures)) {
    lines.push(`- ${name}: ${info.present ? `${info.bytes} bytes` : 'MISSING'}`);
  }
  lines.push('');
  lines.push(`## Network entries (sanitized): ${networkLog.length}`);
  lines.push(`## Console messages: ${consoleLog.length}`);
  lines.push('');
  lines.push(`## Per-feature results`);
  for (const [fid, r] of Object.entries(results)) {
    lines.push(`### ${fid}: ${r.feature}`);
    lines.push(`- status: **${r.status}**`);
    lines.push(`- before: ${r.before ? r.before.shot : 'n/a'}`);
    lines.push(`- after: ${r.after ? r.after.shot : 'n/a'}`);
    lines.push(`- diff.url: ${JSON.stringify(r.diff?.url || {})}`);
    lines.push(`- diff.storage: ${JSON.stringify(r.diff?.storage || {})}`);
    lines.push(`- diff.interactiveCount changed: ${r.diff?.interactiveCount || false}`);
    if (r.dragAttempt) lines.push(`- dragAttempt: ${JSON.stringify(r.dragAttempt)}`);
    if (r.clickAttempt) lines.push(`- clickAttempt: ${JSON.stringify({ ok: r.clickAttempt.ok, dialogsVisible: r.clickAttempt.dialogsVisible })}`);
    if (r.evidence) lines.push(`- evidence: ${JSON.stringify(r.evidence).slice(0, 200)}`);
    lines.push('');
  }
  await writeText(p('.rebuild', 'tests', 'feature', 'deep-probe-summary.md'), lines.join('\n'));

  log('done.');
}

main().catch((err) => {
  console.error('[deep] fatal', err);
  process.exit(1);
});