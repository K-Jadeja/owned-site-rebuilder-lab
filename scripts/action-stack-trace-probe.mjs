// scripts/action-stack-trace-probe.mjs
//
// Stack-trace instrumentation: wraps the most common browser APIs
// the app uses (event listeners, localStorage, fetch, XHR, history,
// createObjectURL, media play/pause, canvas draw, console) so that
// every invocation records a stack trace and target descriptor.
//
// Each action is triggered via Playwright; the page-level rlog is
// drained per action and persisted into per-action JSON files.
//
// Outputs:
//   .rebuild/runtime/stack-traces/action-stack-events.json
//   .rebuild/runtime/stack-traces/action-storage-stacks.json
//   .rebuild/runtime/stack-traces/action-media-stacks.json
//   .rebuild/runtime/stack-traces/action-canvas-stacks.json
//   .rebuild/runtime/stack-traces/action-object-url-stacks.json
//   .rebuild/runtime/stack-traces/action-network-stacks.json
//   .rebuild/runtime/stack-traces/action-console-stacks.json
//   .rebuild/runtime/stack-traces/action-to-stack-frame-map.json
//   .rebuild/runtime/stack-traces/action-stack-summary.md

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const OUT = '.rebuild/runtime/stack-traces';
const FIXTURE = '.rebuild/tests/fixtures/sample.mp4';

const INIT = `
(() => {
  const w = window;
  const log = (kind, data) => {
    try {
      w.__rlog = w.__rlog || [];
      w.__rlog.push({ kind, data, t: Date.now() });
    } catch {}
  };
  const stack = (depth = 25) => {
    try {
      const s = (new Error()).stack || '';
      return s.split('\\n').slice(0, depth);
    } catch { return []; }
  };
  const truncate = (s, n) => { try { return String(s).slice(0, n); } catch { return ''; } };

  // EventTarget.addEventListener wrapper
  if (typeof EventTarget !== 'undefined' && EventTarget.prototype) {
    const origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      try {
        const target = this;
        const tgtDesc = (() => {
          try {
            if (target && target.tagName) {
              return {
                tag: target.tagName.toLowerCase(),
                role: target.getAttribute && target.getAttribute('role'),
                text: truncate(target.innerText || target.value || '', 80),
                aria: truncate(target.getAttribute && target.getAttribute('aria-label') || '', 80),
                id: target.id || null,
                className: typeof target.className === 'string' ? truncate(target.className, 80) : null,
              };
            }
            if (target && target.constructor && target.constructor.name) {
              return { constructor: target.constructor.name };
            }
            return null;
          } catch { return null; }
        })();
        const wrapped = function(ev) {
          try {
            log('event', {
              type,
              target: tgtDesc,
              url: location.href,
              stack: stack(20),
            });
          } catch {}
          return listener.apply(this, arguments);
        };
        wrapped.__wrapped_from = listener;
        try {
          listener.__rveMarker = true;
        } catch {}
        return origAdd.call(this, type, wrapped, options);
      } catch {
        return origAdd.apply(this, arguments);
      }
    };
  }

  // localStorage / sessionStorage setters
  try {
    const origSet = Storage.prototype.setItem;
    const origRem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function(k, v) {
      try {
        log('storage-set', {
          store: this === w.localStorage ? 'local' : 'session',
          key: k,
          valuePreview: truncate(v, 200),
          stack: stack(20),
          url: location.href,
        });
      } catch {}
      return origSet.apply(this, arguments);
    };
    Storage.prototype.removeItem = function(k) {
      try {
        log('storage-remove', {
          store: this === w.localStorage ? 'local' : 'session',
          key: k,
          stack: stack(20),
          url: location.href,
        });
      } catch {}
      return origRem.apply(this, arguments);
    };
  } catch {}

  // history.pushState / replaceState
  try {
    const wrap = (name) => {
      const orig = w.history[name];
      w.history[name] = function(state, title, url) {
        try {
          log('history', { op: name, url: url || null, stack: stack(15) });
        } catch {}
        return orig.apply(this, arguments);
      };
    };
    wrap('pushState');
    wrap('replaceState');
  } catch {}

  // fetch
  try {
    const origFetch = w.fetch;
    w.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || (input && input.method) || 'GET';
      try {
        log('fetch', { url: truncate(url, 200), method, stack: stack(15) });
      } catch {}
      return origFetch.apply(this, arguments);
    };
  } catch {}

  // XHR
  try {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__rmeta = { method, url: truncate(url, 200) };
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      try {
        log('xhr', { ...this.__rmeta, stack: stack(15), url: location.href });
      } catch {}
      return origSend.apply(this, arguments);
    };
  } catch {}

  // URL.createObjectURL
  try {
    const origCO = w.URL.createObjectURL;
    w.URL.createObjectURL = function(blob) {
      let info = {};
      try {
        info = {
          type: blob && blob.type,
          size: blob && blob.size,
          constructor: blob && blob.constructor && blob.constructor.name,
        };
      } catch {}
      try {
        log('createObjectURL', { ...info, stack: stack(20), url: location.href });
      } catch {}
      return origCO.apply(this, arguments);
    };
  } catch {}

  // HTMLMediaElement.play / pause
  try {
    const origPlay = HTMLMediaElement.prototype.play;
    const origPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function() {
      try {
        log('media-play', {
          tag: this.tagName,
          currentSrc: truncate(this.currentSrc || '', 200),
          duration: this.duration,
          currentTime: this.currentTime,
          paused: this.paused,
          stack: stack(15),
          url: location.href,
        });
      } catch {}
      return origPlay.apply(this, arguments);
    };
    HTMLMediaElement.prototype.pause = function() {
      try {
        log('media-pause', {
          tag: this.tagName,
          currentSrc: truncate(this.currentSrc || '', 200),
          currentTime: this.currentTime,
          stack: stack(15),
          url: location.href,
        });
      } catch {}
      return origPause.apply(this, arguments);
    };
  } catch {}

  // Canvas drawImage
  try {
    const origDraw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function() {
      try {
        log('canvas-drawImage', {
          args: arguments.length,
          canvasWidth: this.canvas && this.canvas.width,
          canvasHeight: this.canvas && this.canvas.height,
          stack: stack(15),
          url: location.href,
        });
      } catch {}
      return origDraw.apply(this, arguments);
    };
  } catch {}

  // canvas.toBlob / toDataURL
  try {
    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(cb) {
      try {
        log('canvas-toBlob', {
          width: this.width,
          height: this.height,
          stack: stack(15),
          url: location.href,
        });
      } catch {}
      return origToBlob.apply(this, arguments);
    };
  } catch {}

  // console.log/warn/error/info (preserving behavior)
  try {
    const wrap = (name) => {
      const orig = w.console[name];
      w.console[name] = function() {
        try {
          const args = Array.from(arguments).map((a) => {
            try { return typeof a === 'string' ? truncate(a, 400) : String(a).slice(0, 200); } catch { return ''; }
          });
          log('console', { level: name, args, stack: stack(10), url: location.href });
        } catch {}
        return orig.apply(this, arguments);
      };
    };
    wrap('log');
    wrap('warn');
    wrap('error');
    wrap('info');
  } catch {}

  // Mark the current action label on the page.
  w.__setAction = (label) => {
    w.__currentAction = label;
    log('action-start', { label });
  };
})();
`;

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await context.addInitScript(INIT);
  const page = await context.newPage();

  // Drain rlog.
  async function drain() {
    return await page.evaluate(() => {
      const out = window.__rlog || [];
      window.__rlog = [];
      return out;
    });
  }

  async function setAction(label) {
    await page.evaluate((l) => window.__setAction(l), label);
  }

  const allLogs = [];

  async function runAction(label, fn) {
    await setAction(label);
    let err = null;
    try { await fn(); } catch (e) { err = String(e.message || e); }
    await page.waitForTimeout(1500);
    const logs = await drain();
    logs.forEach((l) => { l.data = { ...(l.data || {}), action: label }; });
    allLogs.push({ action: label, err, count: logs.length });
    return logs;
  }

  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3000);

  const all = {};
  // boot
  all.boot = await runAction('boot', async () => { await page.waitForTimeout(1200); });

  // dark-toggle
  all['dark-toggle'] = await runAction('dark-toggle', async () => {
    try { await page.getByRole('button', { name: /^dark$/i }).first().click({ timeout: 2000 }); } catch {}
  });

  // export-dialog
  all['export-dialog'] = await runAction('export-dialog', async () => {
    try { await page.getByRole('button', { name: /export/i }).first().click({ timeout: 3000 }); } catch {}
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
  });

  // playback-space
  all['playback-space'] = await runAction('playback-space', async () => {
    await page.evaluate(() => window.focus());
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    await page.keyboard.press('Space');
  });

  // undo-redo
  all['undo-redo'] = await runAction('undo-redo', async () => {
    await page.evaluate(() => window.focus());
    await page.keyboard.press('Control+Z').catch(() => {});
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+Shift+Z').catch(() => {});
  });

  // zoom-in / out / reset
  all['zoom-in'] = await runAction('zoom-in', async () => {
    try { await page.getByRole('button', { name: /zoom in/i }).first().click({ timeout: 2000 }); } catch {}
  });
  all['zoom-out'] = await runAction('zoom-out', async () => {
    try { await page.getByRole('button', { name: /zoom out/i }).first().click({ timeout: 2000 }); } catch {}
  });
  all['zoom-reset'] = await runAction('zoom-reset', async () => {
    try { await page.getByRole('button', { name: /reset/i }).first().click({ timeout: 2000 }); } catch {}
  });

  // my-library
  all['my-library'] = await runAction('my-library', async () => {
    try { await page.getByRole('tab', { name: /my library/i }).first().click({ timeout: 2000 }); } catch {}
  });

  // single-file-import
  all['single-file-import'] = await runAction('single-file-import', async () => {
    const input = page.locator('input[type="file"]').first();
    if (await input.count() > 0) {
      try { await input.setInputFiles(FIXTURE); } catch {}
      await page.waitForTimeout(3500);
    }
  });

  // try-add-imported-media-to-timeline
  all['try-add-imported-media-to-timeline'] = await runAction('try-add-imported-media-to-timeline', async () => {
    const draggables = await page.locator('[draggable="true"]');
    const count = await draggables.count();
    if (count > 0) {
      const box = await draggables.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + 400, { steps: 8 });
        await page.mouse.move(box.x + 200, 720, { steps: 8 });
        await page.mouse.up();
      }
    }
    await page.waitForTimeout(1500);
  });

  // click-inspector-tabs (try clicking tabs that may exist)
  all['click-inspector-tabs'] = await runAction('click-inspector-tabs', async () => {
    const labels = ['Settings', 'Style', 'Position', 'AI'];
    for (const lbl of labels) {
      try { await page.getByRole('button', { name: new RegExp('^' + lbl + '$', 'i') }).first().click({ timeout: 1500 }); } catch {}
      await page.waitForTimeout(300);
    }
  });

  // click-animation-tabs
  all['click-animation-tabs'] = await runAction('click-animation-tabs', async () => {
    for (const lbl of ['Enter Animations', 'Exit Animations', '3D Layout Effects']) {
      try { await page.getByText(lbl, { exact: false }).first().click({ timeout: 1500 }); } catch {}
      await page.waitForTimeout(300);
    }
  });

  // manual-trim-split-key-probe
  all['manual-trim-split-key-probe'] = await runAction('manual-trim-split-key-probe', async () => {
    await page.evaluate(() => window.focus());
    for (const key of ['s', 'b', 'S', 'B', 't', 'T']) {
      try { await page.keyboard.press(key); } catch {}
      await page.waitForTimeout(150);
    }
    try { await page.keyboard.press('Control+B'); } catch {}
  });

  await context.close();
  await browser.close();

  // Partition by kind.
  const buckets = {
    event: [],
    'storage-set': [],
    'storage-remove': [],
    media_play: [],
    media_pause: [],
    canvas_drawImage: [],
    canvas_toBlob: [],
    createObjectURL: [],
    fetch: [],
    xhr: [],
    history: [],
    console: [],
    action_start: [],
  };
  for (const a of Object.keys(all)) {
    for (const l of all[a]) {
      if (l.kind === 'event') buckets.event.push(l);
      else if (l.kind === 'storage-set') buckets['storage-set'].push(l);
      else if (l.kind === 'storage-remove') buckets['storage-remove'].push(l);
      else if (l.kind === 'media-play') buckets.media_play.push(l);
      else if (l.kind === 'media-pause') buckets.media_pause.push(l);
      else if (l.kind === 'canvas-drawImage') buckets.canvas_drawImage.push(l);
      else if (l.kind === 'canvas-toBlob') buckets.canvas_toBlob.push(l);
      else if (l.kind === 'createObjectURL') buckets.createObjectURL.push(l);
      else if (l.kind === 'fetch') buckets.fetch.push(l);
      else if (l.kind === 'xhr') buckets.xhr.push(l);
      else if (l.kind === 'history') buckets.history.push(l);
      else if (l.kind === 'console') buckets.console.push(l);
      else if (l.kind === 'action-start') buckets.action_start.push(l);
    }
  }

  // Per-file dumps.
  await fs.writeFile(path.join(OUT, 'action-stack-events.json'), JSON.stringify(buckets.event, null, 2));
  await fs.writeFile(path.join(OUT, 'action-storage-stacks.json'), JSON.stringify({
    sets: buckets['storage-set'],
    removes: buckets['storage-remove'],
  }, null, 2));
  await fs.writeFile(path.join(OUT, 'action-media-stacks.json'), JSON.stringify({
    play: buckets.media_play,
    pause: buckets.media_pause,
  }, null, 2));
  await fs.writeFile(path.join(OUT, 'action-canvas-stacks.json'), JSON.stringify({
    drawImage: buckets.canvas_drawImage,
    toBlob: buckets.canvas_toBlob,
  }, null, 2));
  await fs.writeFile(path.join(OUT, 'action-object-url-stacks.json'), JSON.stringify(buckets.createObjectURL, null, 2));
  await fs.writeFile(path.join(OUT, 'action-network-stacks.json'), JSON.stringify({
    fetch: buckets.fetch,
    xhr: buckets.xhr,
    history: buckets.history,
  }, null, 2));
  await fs.writeFile(path.join(OUT, 'action-console-stacks.json'), JSON.stringify(buckets.console, null, 2));

  // Flat per-action stack frame map (top frames only, sanitized).
  const stackFrameMap = {};
  for (const a of Object.keys(all)) {
    stackFrameMap[a] = [];
    for (const l of all[a]) {
      const frames = (l.data && l.data.stack) || [];
      if (frames.length > 0) {
        stackFrameMap[a].push({
          kind: l.kind,
          frames: frames.slice(0, 6).map((f) => f.replace(/file:\/\/\//g, '').slice(0, 240)),
          target: l.data && l.data.target,
          url: l.data && l.data.url,
          key: l.data && (l.data.key || l.data.method || l.data.type || null),
          valuePreview: l.data && l.data.valuePreview,
        });
      }
    }
  }
  await fs.writeFile(path.join(OUT, 'action-to-stack-frame-map.json'), JSON.stringify(stackFrameMap, null, 2));

  // Markdown summary.
  const lines = [];
  lines.push('# Action Stack Trace Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${TARGET}`);
  lines.push('');
  lines.push('## Per-action capture counts');
  lines.push('');
  lines.push('| Action | Total events | Storage sets | Media play | Media pause | drawImage | createObjectURL | console |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const a of Object.keys(all)) {
    const ks = (k) => all[a].filter((l) => l.kind === k).length;
    lines.push(`| ${a} | ${all[a].length} | ${ks('storage-set')} | ${ks('media-play')} | ${ks('media-pause')} | ${ks('canvas-drawImage')} | ${ks('createObjectURL')} | ${ks('console')} |`);
  }
  lines.push('');
  lines.push('## Sample stack frames per action');
  lines.push('');
  for (const a of Object.keys(stackFrameMap)) {
    if (stackFrameMap[a].length === 0) continue;
    lines.push(`### ${a}`);
    for (const entry of stackFrameMap[a].slice(0, 3)) {
      lines.push(`- kind=${entry.kind} key=${entry.key || '–'}`);
      for (const f of entry.frames.slice(0, 4)) {
        lines.push(`  - \`${f}\``);
      }
    }
    lines.push('');
  }
  await fs.writeFile(path.join(OUT, 'action-stack-summary.md'), lines.join('\n'));

  console.log(`[probe:stacks] actions=${Object.keys(all).length} events=${buckets.event.length} storage=${buckets['storage-set'].length} mediaPlay=${buckets.media_play.length} console=${buckets.console.length}`);
}

main().catch((err) => {
  console.error('[probe:stacks] fatal', err);
  process.exit(1);
});