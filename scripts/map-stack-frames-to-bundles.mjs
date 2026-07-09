// scripts/map-stack-frames-to-bundles.mjs
//
// Reads the per-action stack-frame map and the storage/event stacks,
// and resolves each frame to a local bundle file (under
// .rebuild/target-source/bundles/) plus a snippet around the line:col.
//
// Outputs:
//   .rebuild/features/action-stack-bundle-map.json
//   .rebuild/features/action-stack-bundle-map.md

import { promises as fs } from 'node:fs';
import path from 'node:path';

const STACK_DIR = '.rebuild/runtime/stack-traces';
const TARGET_DIR = '.rebuild/target-source/bundles';
const OUT_JSON = '.rebuild/features/action-stack-bundle-map.json';
const OUT_MD = '.rebuild/features/action-stack-bundle-map.md';

function safeNameFromUrl(u) {
  let p = u;
  try { p = new URL(u).pathname; } catch { p = u.split('?')[0]; }
  return p.replace(/[\\/]+/g, '__').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+/, '').slice(0, 180);
}

function parseFrame(line) {
  // Strip leading whitespace.
  line = line.replace(/^\s+/, '');
  // Various stack formats:
  //   "at fn (url:line:col)"
  //   "at url:line:col"
  //   "at fn (url)"  (no line/col)
  //   "fn@url:line:col" (V8 short form)
  //   "Error"
  if (!line || line === 'Error') return null;
  let m = line.match(/^at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)\s*$/);
  if (m) return { fn: m[1], url: m[2], line: parseInt(m[3], 10), col: parseInt(m[4], 10) };
  m = line.match(/^at\s+(.+?):(\d+):(\d+)\s*$/);
  if (m) return { fn: null, url: m[1], line: parseInt(m[2], 10), col: parseInt(m[3], 10) };
  m = line.match(/^(.+?)@(.+?):(\d+):(\d+)\s*$/);
  if (m) return { fn: m[1], url: m[2], line: parseInt(m[3], 10), col: parseInt(m[4], 10) };
  m = line.match(/^at\s+(.+?)\s+\((.+?)\)\s*$/);
  if (m) return { fn: m[1], url: m[2], line: null, col: null };
  return { raw: line, url: null };
}

async function readBundleMap() {
  const map = new Map();
  async function walk(dir, prefix = '') {
    const ents = await fs.readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p, prefix + e.name + '/');
      else if (e.isFile() && (p.endsWith('.js') || p.endsWith('.css'))) {
        map.set(prefix + e.name, p);
      }
    }
  }
  await walk(TARGET_DIR);
  return map;
}

function snippetFor(text, line, col, window = 200) {
  // Approximate: use the minified text length vs line:col. Most minified
  // bundles are 1-3 lines. We search for the substring closest to
  // line:col proportionally.
  const lines = text.split('\n');
  if (line === null || line < 1) return null;
  if (line - 1 < lines.length) {
    const ln = lines[line - 1];
    if (col !== null && col >= 0 && col < ln.length) {
      const start = Math.max(0, col - Math.floor(window / 2));
      const end = Math.min(ln.length, col + Math.ceil(window / 2));
      return ln.slice(start, end).replace(/\s+/g, ' ').slice(0, window);
    }
    return ln.slice(0, window).replace(/\s+/g, ' ');
  }
  // Fallback: just return the first window of the file.
  return text.slice(0, window).replace(/\s+/g, ' ');
}

const KEYWORDS = ['timeline','track','tracks','clip','clips','split','trim','cut','crop','transition','effect','animation','keyframe','export','render','renderer','download','canvas','video','audio','waveform','thumbnail','sprite','ffmpeg','webcodecs','mediabunny','mediarecorder','webgpu','worker','indexeddb','idb','localstorage','zustand','persist','history','undo','redo','drag','drop','resize','zoom','playhead','scrub','duration','durationMs','startTime','endTime','asset','assets','project','sequence','supabase','pexels','thumbnailCache','advanced-timeline-store','useProjectStateFromUrl','ThumbnailCache','blade','splitter','trimmer'];

function findKeywords(text) {
  const found = [];
  const lower = text.toLowerCase();
  for (const kw of KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) found.push(kw);
  }
  return found;
}

async function main() {
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  const bundleMap = await readBundleMap();
  console.log('[map:stacks] bundleMap size:', bundleMap.size, 'sample key:', [...bundleMap.keys()][0]);

  // Load all stack-trace files.
  const files = await fs.readdir(STACK_DIR);
  const loaded = {};
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const txt = await fs.readFile(path.join(STACK_DIR, f), 'utf8');
      loaded[f] = JSON.parse(txt);
    } catch (e) { /* skip */ }
  }

  // Walk through every frame in every bucket.
  const out = {
    generatedAt: new Date().toISOString(),
    bundleUrlToLocal: {},
    perAction: {},
    frameTable: [],
  };

  // Build URL→local mapping table for downstream consumers.
  for (const fname of bundleMap.keys()) {
    // File name format: ___next__static__chunks__<name>.js
    // Split on '__' and join with '/' to recover the URL path.
    const stem = fname.replace(/^js\//, '').replace(/^css\//, '');
    const parts = stem.split('__').filter((p) => p.length > 0);
    if (parts.length >= 4) {
      // parts: [_next, static, chunks|css, <name>.js|css]
      const urlPath = '/' + parts.join('/');
      const url = `https://demo.reactvideoeditor.com${urlPath}`;
      out.bundleUrlToLocal[url] = bundleMap.get(fname);
      // Also strip query string variants (dpl=...) by recording just the path.
      out.bundleUrlToLocal[url.split('?')[0]] = bundleMap.get(fname);
    } else {
      console.log('[map:stacks] skip', fname, 'parts=', parts.length);
    }
  }
  console.log('[map:stacks] bundle map entries:', Object.keys(out.bundleUrlToLocal).length, Object.keys(out.bundleUrlToLocal).slice(0, 2));

  async function resolveFrame(rawFrame) {
    const f = parseFrame(rawFrame);
    if (!f) return { raw: rawFrame, mapped: false };
    let local = null;
    let key = null;
    if (f.url) {
      // Strip ?query string before lookup.
      let urlNoQ = f.url;
      const qIdx = urlNoQ.indexOf('?');
      if (qIdx > 0) urlNoQ = urlNoQ.slice(0, qIdx);
      try {
        const u = new URL(urlNoQ);
        key = u.origin + u.pathname;
      } catch {
        key = urlNoQ;
      }
      local = out.bundleUrlToLocal[key] || out.bundleUrlToLocal[urlNoQ] || null;
      if (!local) {
        // Try matching by basename or path tail.
        const tail = '/' + key.split('/').pop();
        for (const k of Object.keys(out.bundleUrlToLocal)) {
          if (k.endsWith(tail)) { local = out.bundleUrlToLocal[k]; break; }
        }
      }
    }
    let snippet = null;
    let keywords = [];
    if (local) {
      try {
        const text = await fs.readFile(local, 'utf8');
        snippet = snippetFor(text, f.line, f.col);
        if (snippet) keywords = findKeywords(snippet);
      } catch {}
    }
    return {
      fn: f.fn || null,
      url: f.url || null,
      local: local,
      line: f.line,
      col: f.col,
      mapped: !!local,
      snippet: snippet ? snippet.slice(0, 220) : null,
      keywords,
    };
  }

  // Process storage stacks.
  if (loaded['action-storage-stacks.json']) {
    const sets = loaded['action-storage-stacks.json'].sets || [];
    const removes = loaded['action-storage-stacks.json'].removes || [];
    out.perAction['storage-sets'] = [];
    for (const e of sets) {
      const frames = (e.data && e.data.stack) || [];
      const resolved = [];
      for (const fr of frames) {
        resolved.push(await resolveFrame(fr));
      }
      out.perAction['storage-sets'].push({
        action: e.data.action,
        store: e.data.store,
        key: e.data.key,
        valuePreview: e.data.valuePreview,
        frames: resolved.slice(0, 8),
      });
      for (const r of resolved.slice(0, 4)) {
        if (r.mapped) {
          out.frameTable.push({
            action: e.data.action,
            kind: 'storage-set',
            key: e.data.key,
            bundle: r.local ? path.basename(r.local) : null,
            line: r.line,
            col: r.col,
            keywords: r.keywords,
            snippet: r.snippet,
            confidence: r.local && (r.keywords.length > 0 || /zustand|persist|store/i.test(r.snippet || '')) ? 'high' : 'medium',
          });
        }
      }
    }
  }

  // Process media stacks.
  if (loaded['action-media-stacks.json']) {
    const plays = loaded['action-media-stacks.json'].play || [];
    out.perAction['media-play'] = [];
    for (const e of plays) {
      const frames = (e.data && e.data.stack) || [];
      const resolved = [];
      for (const fr of frames) resolved.push(await resolveFrame(fr));
      out.perAction['media-play'].push({
        action: e.data.action,
        currentSrc: e.data.currentSrc,
        currentTime: e.data.currentTime,
        duration: e.data.duration,
        frames: resolved.slice(0, 8),
      });
      for (const r of resolved.slice(0, 4)) {
        if (r.mapped) {
          out.frameTable.push({
            action: e.data.action,
            kind: 'media-play',
            bundle: r.local ? path.basename(r.local) : null,
            line: r.line,
            col: r.col,
            keywords: r.keywords,
            snippet: r.snippet,
            confidence: r.keywords.includes('play') || r.keywords.includes('video') || r.keywords.includes('audio') || r.keywords.includes('canvas') ? 'high' : 'medium',
          });
        }
      }
    }
  }

  // Process createObjectURL stacks (import flow).
  if (loaded['action-object-url-stacks.json']) {
    const events = loaded['action-object-url-stacks.json'] || [];
    out.perAction['createObjectURL'] = [];
    for (const e of events) {
      const frames = (e.data && e.data.stack) || [];
      const resolved = [];
      for (const fr of frames) resolved.push(await resolveFrame(fr));
      out.perAction['createObjectURL'].push({
        action: e.data.action,
        type: e.data.type,
        size: e.data.size,
        constructor: e.data.constructor,
        frames: resolved.slice(0, 8),
      });
      for (const r of resolved.slice(0, 4)) {
        if (r.mapped) {
          out.frameTable.push({
            action: e.data.action,
            kind: 'createObjectURL',
            bundle: r.local ? path.basename(r.local) : null,
            line: r.line,
            col: r.col,
            keywords: r.keywords,
            snippet: r.snippet,
            confidence: 'medium',
          });
        }
      }
    }
  }

  // Process event stacks (only those with mapped frames).
  if (loaded['action-stack-events.json']) {
    const events = loaded['action-stack-events.json'] || [];
    out.perAction['events-sampled'] = [];
    let eventFrameCount = 0;
    for (const e of events) {
      const frames = (e.data && e.data.stack) || [];
      const resolved = [];
      let hasMapped = false;
      for (const fr of frames) {
        const r = await resolveFrame(fr);
        resolved.push(r);
        if (r.mapped) hasMapped = true;
      }
      if (hasMapped && eventFrameCount < 200) {
        out.perAction['events-sampled'].push({
          action: e.data.action,
          type: e.data.type,
          target: e.data.target,
          frames: resolved.slice(0, 6),
        });
        for (const r of resolved.slice(0, 4)) {
          if (r.mapped) {
            out.frameTable.push({
              action: e.data.action,
              kind: 'event:' + (e.data.type || ''),
              bundle: r.local ? path.basename(r.local) : null,
              line: r.line,
              col: r.col,
              keywords: r.keywords,
              snippet: r.snippet,
              confidence: 'low',
            });
            eventFrameCount++;
          }
        }
      }
    }
  }

  // Process console stacks (correlate ThumbnailCache / useProjectStateFromUrl messages to bundles).
  if (loaded['action-console-stacks.json']) {
    const events = loaded['action-console-stacks.json'] || [];
    out.perAction['console-with-stack'] = [];
    let consoleFrameCount = 0;
    for (const e of events) {
      const frames = (e.data && e.data.stack) || [];
      const r2 = [];
      let hasMapped = false;
      for (const fr of frames) {
        const r = await resolveFrame(fr);
        r2.push(r);
        if (r.mapped) hasMapped = true;
      }
      if (hasMapped && consoleFrameCount < 50) {
        out.perAction['console-with-stack'].push({
          action: e.data.action,
          args: e.data.args,
          frames: r2.slice(0, 6),
        });
        for (const r of r2.slice(0, 4)) {
          if (r.mapped) {
            out.frameTable.push({
              action: e.data.action,
              kind: 'console',
              bundle: r.local ? path.basename(r.local) : null,
              line: r.line,
              col: r.col,
              keywords: r.keywords,
              snippet: r.snippet,
              confidence: r.keywords.length > 0 ? 'medium' : 'low',
            });
            consoleFrameCount++;
          }
        }
      }
    }
  }

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2));

  // Markdown summary.
  const lines = [];
  lines.push('# Action Stack Frame → Bundle Map');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Mapped frame totals');
  lines.push(`- storage-set frames mapped: ${out.perAction['storage-sets'] ? out.perAction['storage-sets'].reduce((s, e) => s + e.frames.filter((f) => f.mapped).length, 0) : 0}`);
  lines.push(`- media-play frames mapped: ${out.perAction['media-play'] ? out.perAction['media-play'].reduce((s, e) => s + e.frames.filter((f) => f.mapped).length, 0) : 0}`);
  lines.push(`- createObjectURL frames mapped: ${out.perAction['createObjectURL'] ? out.perAction['createObjectURL'].reduce((s, e) => s + e.frames.filter((f) => f.mapped).length, 0) : 0}`);
  lines.push(`- total mapped frames: ${out.frameTable.length}`);
  lines.push('');
  lines.push('## Storage sets with mapped frames');
  lines.push('');
  lines.push('| Action | Store | Key | Mapped frames | Top bundle | Keywords |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  if (out.perAction['storage-sets']) {
    for (const e of out.perAction['storage-sets']) {
      const mapped = e.frames.filter((f) => f.mapped);
      if (mapped.length === 0) continue;
      const top = mapped[0];
      const kwSet = [...new Set(mapped.flatMap((f) => f.keywords || []))];
      lines.push(`| ${e.action} | ${e.store} | \`${e.key}\` | ${mapped.length} | ${top.local ? path.basename(top.local) : '–'} | ${kwSet.slice(0, 4).join(', ') || '–'} |`);
    }
  }
  lines.push('');
  lines.push('## Media play frames');
  lines.push('');
  if (out.perAction['media-play']) {
    for (const e of out.perAction['media-play']) {
      const mapped = e.frames.filter((f) => f.mapped);
      if (mapped.length === 0) continue;
      const top = mapped[0];
      lines.push(`- action=${e.action} currentSrc=${(e.currentSrc || '').slice(0, 60)} bundle=${top.local ? path.basename(top.local) : '–'} line=${top.line}:${top.col}`);
      if (top.snippet) lines.push(`  - snippet: \`${top.snippet.slice(0, 160)}\``);
    }
  }
  lines.push('');
  lines.push('## createObjectURL frames (import flow)');
  lines.push('');
  if (out.perAction['createObjectURL']) {
    for (const e of out.perAction['createObjectURL']) {
      const mapped = e.frames.filter((f) => f.mapped);
      if (mapped.length === 0) continue;
      const top = mapped[0];
      lines.push(`- action=${e.action} type=${e.type} size=${e.size} constructor=${e.constructor} bundle=${top.local ? path.basename(top.local) : '–'} line=${top.line}:${top.col}`);
      if (top.snippet) lines.push(`  - snippet: \`${top.snippet.slice(0, 160)}\``);
    }
  }
  lines.push('');
  lines.push('## Per-bundle mapped frame counts');
  lines.push('');
  const bundleCount = new Map();
  for (const f of out.frameTable) {
    if (!f.bundle) continue;
    bundleCount.set(f.bundle, (bundleCount.get(f.bundle) || 0) + 1);
  }
  for (const [b, c] of [...bundleCount.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${b}: ${c} mapped frames`);
  }

  await fs.writeFile(OUT_MD, lines.join('\n'));

  console.log(`[map:stacks] frameTable=${out.frameTable.length} storage-sets=${out.perAction['storage-sets'] ? out.perAction['storage-sets'].length : 0} media-play=${out.perAction['media-play'] ? out.perAction['media-play'].length : 0}`);
}

main().catch((err) => {
  console.error('[map:stacks] fatal', err);
  process.exit(1);
});