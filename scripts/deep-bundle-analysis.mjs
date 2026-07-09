// scripts/deep-bundle-analysis.mjs
//
// Loads every local public JS/CSS bundle from .rebuild/private/bundles/,
// beautifies and parses it, extracts:
//   - string literals
//   - identifiers / property names
//   - object keys
//   - module IDs and webpack-style module wrappers
//   - Next.js route/chunk hints
//   - short snippets around feature keywords
//   - CSS class names (especially rve:*)
//   - embedded URLs / endpoint-looking strings
//   - library fingerprints
//   - feature-keyword hits
//
// Outputs:
//   .rebuild/features/deep-bundle-analysis.md
//   .rebuild/features/bundle-symbol-index.json
//   .rebuild/features/library-fingerprint.json
//   .rebuild/features/embedded-endpoints.json
//   .rebuild/features/possible-state-stores.json
//   .rebuild/features/feature-code-clues.json
//   .rebuild/features/css-class-index.json
//   .rebuild/features/source-map-report.md
//   .rebuild/features/webpack-module-map.json
//   .rebuild/features/nextjs-route-map.json

import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
import jsBeautifyPkg from 'js-beautify';
const beautify = jsBeautifyPkg.js || jsBeautifyPkg.js_beautify;
import * as lexer from 'es-module-lexer';

const PRIVATE_DIR = '.rebuild/private/bundles';
const FEATURES_DIR = '.rebuild/features';
const MANIFEST = `${PRIVATE_DIR}/manifest.json`;
const TARGET_MANIFEST = '.rebuild/target-source/manifests/public-bundle-manifest.json';

const FEATURE_KEYWORDS = [
  'timeline','track','tracks','clip','clips','item','items','split','trim',
  'cut','crop','transition','effect','effects','animation','keyframe',
  'keyframes','export','render','renderer','download','canvas','video',
  'audio','waveform','thumbnail','sprite','ffmpeg','webcodecs','mediabunny',
  'mediarecorder','webgpu','worker','indexeddb','idb','localstorage',
  'zustand','persist','history','undo','redo','drag','drop','resize','zoom',
  'playhead','scrub','duration','durationMs','startTime','endTime','asset',
  'assets','project','sequence','supabase','api','upload','download',
  'pexels','thumbnailCache','advanced-timeline-store','useProjectStateFromUrl',
  'ThumbnailCache','handle','blade','splitter','trimmer','waveform',
  'volume','mute','pitch','speed','rotation','crop','position','transform',
  'color','saturation','brightness','contrast','hue','filter','blur',
  'opacity','visibility','locked','hidden','selected','focused','active',
  'spritesheet','snapshot','poster','spriteSheet','playbackRate','fps',
  'rve:', 'rve-',
];

const LIBRARY_PATTERNS = [
  { lib: 'React', re: /react/i },
  { lib: 'Next.js', re: /next\.?\/static|\/_next\//i },
  { lib: 'Radix UI', re: /radix-?ui|@radix-ui/i },
  { lib: 'Tailwind', re: /tailwind|tw-/i },
  { lib: 'Zustand', re: /zustand/i },
  { lib: 'Immer', re: /immer/i },
  { lib: 'TanStack', re: /@tanstack|tanstack/i },
  { lib: 'Supabase', re: /supabase/i },
  { lib: 'Pexels', re: /pexels/i },
  { lib: 'WebCodecs', re: /VideoEncoder|VideoDecoder|AudioEncoder|AudioDecoder/i },
  { lib: 'MediaRecorder', re: /MediaRecorder/i },
  { lib: 'Mediabunny', re: /mediabunny/i },
  { lib: 'ffmpeg', re: /ffmpeg/i },
  { lib: 'Remotion', re: /remotion/i },
  { lib: 'Framer Motion', re: /framer-motion|framer\/motion/i },
  { lib: 'DND kit', re: /dnd-kit|@dnd-kit/i },
  { lib: 'React DnD', re: /react-dnd/i },
  { lib: 'Konva', re: /konva/i },
  { lib: 'Three.js', re: /three\.|three\.js/i },
  { lib: 'PixiJS', re: /pixi|PIXI/i },
  { lib: 'Wavesurfer', re: /wavesurfer/i },
  { lib: 'Lucide', re: /lucide/i },
  { lib: 'Sonner', re: /sonner/i },
  { lib: 'Shadcn', re: /shadcn/i },
];

async function walk(dir) {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile() && (p.endsWith('.js') || p.endsWith('.css'))) out.push(p);
  }
  return out;
}

function extractStringLiterals(ast) {
  const out = new Set();
  acornWalk.simple(ast, {
    Literal(n) { if (typeof n.value === 'string' && n.value.length > 0 && n.value.length < 200) out.add(n.value); },
    TemplateElement(n) { if (n.value && n.value.raw && n.value.raw.length < 200) out.add(n.value.cooked || n.value.raw); },
  });
  return [...out];
}

function extractIdentifiers(ast) {
  const out = new Set();
  acornWalk.simple(ast, {
    Identifier(n) { if (n.name && n.name.length < 80) out.add(n.name); },
    MemberExpression(n) {
      if (n.property && !n.computed && n.property.name) out.add(n.property.name);
    },
  });
  return [...out];
}

function extractObjectKeys(ast) {
  const out = new Set();
  acornWalk.simple(ast, {
    Property(n) {
      if (n.key) {
        if (n.key.type === 'Identifier' && n.key.name) out.add(n.key.name);
        else if (n.key.type === 'Literal' && typeof n.key.value === 'string') out.add(n.key.value);
      }
    },
  });
  return [...out];
}

function extractModuleIds(text) {
  // webpack-style: {./node_modules/foo.js: (module) => {...}}
  const ids = new Set();
  const re = /["'](\.{1,2}\/[^"']{1,200}|node_modules\/[^"']{1,200})["']/g;
  let m;
  while ((m = re.exec(text))) ids.add(m[1]);
  return [...ids];
}

function extractWebpackChunks(text) {
  // Next.js / webpack chunk naming.
  const re = /["'](\d+|[a-z0-9]{4,})["']\s*:\s*\(?function/g;
  const ids = new Set();
  let m;
  while ((m = re.exec(text))) ids.add(m[1]);
  return [...ids].slice(0, 200);
}

function extractCssClasses(text) {
  const out = new Set();
  const re = /([\.][a-zA-Z_][a-zA-Z0-9_:-]*)/g;
  let m;
  while ((m = re.exec(text))) out.add(m[1]);
  return [...out].slice(0, 2000);
}

function extractUrls(text) {
  const out = new Set();
  const re = /https?:\/\/[^\s'"<>\\)]+/g;
  let m;
  while ((m = re.exec(text))) {
    const u = m[0].replace(/[)\].,;]+$/, '');
    if (u.length < 300) out.add(u);
  }
  return [...out];
}

function findSnippet(text, keyword, maxLen = 200) {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, idx + keyword.length + 80);
  return text.slice(start, end).replace(/\s+/g, ' ').slice(0, maxLen);
}

function extractCssCustomProps(text) {
  const out = new Set();
  const re = /--[a-zA-Z0-9_-]+\s*:/g;
  let m;
  while ((m = re.exec(text))) out.add(m[0].replace(':', '').trim());
  return [...out];
}

async function main() {
  await fs.mkdir(FEATURES_DIR, { recursive: true });
  let manifest = null;
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  } catch {}
  try {
    if (!manifest) manifest = JSON.parse(await fs.readFile(TARGET_MANIFEST, 'utf8'));
  } catch {}

  const files = await walk(PRIVATE_DIR);
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));

  const symbolIndex = {
    strings: {},
    identifiers: {},
    objectKeys: {},
    moduleIds: {},
    webpackChunks: {},
    urls: {},
    cssClasses: {},
    cssCustomProps: {},
    parseFailures: [],
  };
  const libraryHits = new Map();
  const endpoints = new Set();
  const stateStoreClues = new Set();
  const featureClues = {};

  for (const f of jsFiles) {
    const text = await fs.readFile(f, 'utf8');
    let ast = null;
    try {
      ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, allowImportExportEverywhere: true });
    } catch (e1) {
      try {
        ast = acorn.parse(text, { ecmaVersion: 2022, sourceType: 'script', allowReturnOutsideFunction: true });
      } catch (e2) {
        symbolIndex.parseFailures.push({ file: f, error1: String(e1.message || e1).slice(0, 200), error2: String(e2.message || e2).slice(0, 200) });
      }
    }

    let strings = [];
    let identifiers = [];
    let objectKeys = [];
    if (ast) {
      strings = extractStringLiterals(ast);
      identifiers = extractIdentifiers(ast);
      objectKeys = extractObjectKeys(ast);
    }

    symbolIndex.strings[f] = strings.slice(0, 800);
    symbolIndex.identifiers[f] = identifiers.slice(0, 1500);
    symbolIndex.objectKeys[f] = objectKeys.slice(0, 1500);
    symbolIndex.moduleIds[f] = extractModuleIds(text);
    symbolIndex.webpackChunks[f] = extractWebpackChunks(text);

    const urls = extractUrls(text);
    symbolIndex.urls[f] = urls.slice(0, 200);
    for (const u of urls) {
      if (/supabase|pexels|vercel|cloudfront|gstatic/i.test(u)) endpoints.add(u);
    }

    for (const lib of LIBRARY_PATTERNS) {
      lib.re.lastIndex = 0;
      if (lib.re.test(text)) libraryHits.set(lib.lib, (libraryHits.get(lib.lib) || []).concat(f));
    }

    for (const kw of FEATURE_KEYWORDS) {
      if (text.includes(kw)) {
        if (!featureClues[kw]) featureClues[kw] = [];
        featureClues[kw].push({ file: f, snippet: findSnippet(text, kw) });
        if (/(store|persist|state)/i.test(kw)) stateStoreClues.add(kw);
      }
    }
  }

  for (const f of cssFiles) {
    const text = await fs.readFile(f, 'utf8');
    symbolIndex.cssClasses[f] = extractCssClasses(text);
    symbolIndex.cssCustomProps[f] = extractCssCustomProps(text);
    const urls = extractUrls(text);
    symbolIndex.urls[f] = urls.slice(0, 100);
    for (const lib of LIBRARY_PATTERNS) {
      lib.re.lastIndex = 0;
      if (lib.re.test(text)) libraryHits.set(lib.lib, (libraryHits.get(lib.lib) || []).concat(f));
    }
  }

  await fs.writeFile(`${FEATURES_DIR}/bundle-symbol-index.json`, JSON.stringify(symbolIndex, null, 2));

  const libraryFingerprint = {};
  for (const [lib, files] of libraryHits.entries()) {
    libraryFingerprint[lib] = [...new Set(files)];
  }
  await fs.writeFile(`${FEATURES_DIR}/library-fingerprint.json`, JSON.stringify(libraryFingerprint, null, 2));

  const endpointList = [...endpoints].map((u) => {
    try {
      const url = new URL(u);
      return { url: u, origin: url.origin, pathname: url.pathname };
    } catch { return { url: u }; }
  });
  await fs.writeFile(`${FEATURES_DIR}/embedded-endpoints.json`, JSON.stringify(endpointList, null, 2));

  const stateStores = [...stateStoreClues].map((kw) => ({ keyword: kw, files: featureClues[kw] ? featureClues[kw].map((x) => x.file) : [] }));
  await fs.writeFile(`${FEATURES_DIR}/possible-state-stores.json`, JSON.stringify(stateStores, null, 2));

  // Build css class index (rve:* focus).
  const cssClassIndex = {};
  for (const f of cssFiles) {
    const all = symbolIndex.cssClasses[f] || [];
    const rve = all.filter((c) => /^\.rve[:_-]/.test(c));
    const other = all.filter((c) => !/^\.rve[:_-]/.test(c) && /^\.[a-z][a-z0-9_-]+$/i.test(c));
    cssClassIndex[f] = { rveCount: rve.length, rve: [...new Set(rve)].slice(0, 500), otherSample: [...new Set(other)].slice(0, 200) };
  }
  await fs.writeFile(`${FEATURES_DIR}/css-class-index.json`, JSON.stringify(cssClassIndex, null, 2));

  // Webpack module map.
  const webpackModuleMap = {};
  for (const f of jsFiles) {
    webpackModuleMap[path.basename(f)] = (symbolIndex.moduleIds[f] || []).slice(0, 200);
  }
  await fs.writeFile(`${FEATURES_DIR}/webpack-module-map.json`, JSON.stringify(webpackModuleMap, null, 2));

  // Next.js route map.
  const nextRouteMap = {};
  for (const f of jsFiles) {
    const strings = symbolIndex.strings[f] || [];
    const routeLike = strings.filter((s) => /^\/[a-z0-9_\-/{}:$*]+$/i.test(s));
    if (routeLike.length > 0) nextRouteMap[path.basename(f)] = [...new Set(routeLike)].slice(0, 60);
  }
  await fs.writeFile(`${FEATURES_DIR}/nextjs-route-map.json`, JSON.stringify(nextRouteMap, null, 2));

  // Feature code clues — map features to bundle hits.
  const featureMatrixPath = `${FEATURES_DIR}/feature-matrix.json`;
  let features = [];
  try {
    const fm = JSON.parse(await fs.readFile(featureMatrixPath, 'utf8'));
    features = fm.features || [];
  } catch {}

  const featureCodeClues = { generatedAt: new Date().toISOString(), features: [] };
  for (const feat of features) {
    const id = feat.id;
    const name = feat.name || '';
    // Use keywords derived from feature name + id-derived lowercased tokens.
    const tokens = [id, name, ...name.split(/[\s_-]+/)].map((t) => t.toLowerCase()).filter(Boolean);
    const keywords = [...new Set(tokens)];
    const hits = [];
    for (const f of jsFiles) {
      const text = await fs.readFile(f, 'utf8');
      for (const kw of keywords) {
        if (kw.length < 3) continue;
        if (text.toLowerCase().includes(kw.toLowerCase())) {
          hits.push({ keyword: kw, file: path.basename(f), snippet: findSnippet(text, kw) });
        }
      }
    }
    featureCodeClues.features.push({
      id,
      name,
      keywords_used: keywords,
      bundles_hit: [...new Set(hits.map((h) => h.file))],
      snippets: hits.slice(0, 8),
      confidence: hits.length > 0 ? 'inferred_from_bundle' : 'not_found',
      runtime_confirmation_needed: hits.length > 0,
    });
  }
  await fs.writeFile(`${FEATURES_DIR}/feature-code-clues.json`, JSON.stringify(featureCodeClues, null, 2));

  // Source-map report.
  const smLines = [];
  smLines.push('# Source Map Report');
  smLines.push('');
  let sm = [];
  try { sm = JSON.parse(await fs.readFile(TARGET_MANIFEST, 'utf8')); } catch {}
  const smRefs = (sm.fetched || []).filter((e) => e.sourceMappingURL);
  if (smRefs.length === 0) {
    smLines.push('- No sourceMappingURL references found in the public bundles.');
    smLines.push('- This is expected for production Next.js builds without a public /_next/static source map exposure.');
  } else {
    smLines.push('Source map references:');
    for (const e of smRefs) {
      smLines.push(`- ${e.url.split('?')[0]} → ${e.sourceMappingURL}`);
    }
  }
  await fs.writeFile(`${FEATURES_DIR}/source-map-report.md`, smLines.join('\n'));

  // Deep analysis markdown.
  const lines = [];
  lines.push('# Deep Bundle Analysis');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Source: .rebuild/private/bundles/`);
  lines.push('');
  lines.push(`## Counts`);
  lines.push(`- JS bundles analyzed: ${jsFiles.length}`);
  lines.push(`- CSS bundles analyzed: ${cssFiles.length}`);
  lines.push(`- Parse failures: ${symbolIndex.parseFailures.length}`);
  lines.push(`- Distinct strings: ${Object.values(symbolIndex.strings).reduce((a, s) => a + s.length, 0)}`);
  lines.push(`- Distinct identifiers: ${Object.values(symbolIndex.identifiers).reduce((a, s) => a + s.length, 0)}`);
  lines.push(`- Distinct CSS classes: ${Object.values(symbolIndex.cssClasses).reduce((a, s) => a + s.length, 0)}`);
  lines.push(`- Embedded URLs: ${Object.values(symbolIndex.urls).reduce((a, s) => a + s.length, 0)}`);
  lines.push('');
  lines.push('## Top libraries fingerprinted');
  for (const [lib, files] of [...libraryHits.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`- **${lib}**: ${files.length} bundle(s)`);
  }
  lines.push('');
  lines.push('## Feature keyword hits');
  lines.push('| Keyword | Hits | Files |');
  lines.push('| --- | --- | --- |');
  for (const [kw, hits] of Object.entries(featureClues)) {
    const files = [...new Set(hits.map((h) => path.basename(h.file)))];
    lines.push(`| ${kw} | ${hits.length} | ${files.slice(0, 4).join(', ')} |`);
  }
  lines.push('');
  lines.push('## Sample snippets');
  lines.push('');
  let snipCount = 0;
  for (const [kw, hits] of Object.entries(featureClues)) {
    for (const h of hits.slice(0, 1)) {
      if (snipCount > 25) break;
      if (h.snippet) {
        lines.push(`- \`${kw}\` in ${path.basename(h.file)}: \`${h.snippet.slice(0, 180)}\``);
        snipCount++;
      }
    }
  }
  lines.push('');
  lines.push('## CSS class landscape');
  for (const f of cssFiles) {
    const cls = symbolIndex.cssClasses[f] || [];
    const rve = cls.filter((c) => /^\.rve[:_-]/.test(c));
    lines.push(`- ${path.basename(f)}: ${cls.length} classes total, ${rve.length} \`rve:*\``);
  }
  lines.push('');
  lines.push('## Parse failures');
  if (symbolIndex.parseFailures.length === 0) {
    lines.push('- (none — every JS bundle parsed cleanly with acorn)');
  } else {
    for (const p of symbolIndex.parseFailures) {
      lines.push(`- ${p.file}: ${p.error1}`);
    }
  }
  await fs.writeFile(`${FEATURES_DIR}/deep-bundle-analysis.md`, lines.join('\n'));

  console.log(`[analyze:deep-bundles] js=${jsFiles.length} css=${cssFiles.length} libs=${libraryHits.size} parseFailures=${symbolIndex.parseFailures.length}`);
}

main().catch((err) => {
  console.error('[analyze:deep-bundles] fatal', err);
  process.exit(1);
});