// scripts/analyze-bundles.mjs
// Read captured bundle list, summarize architecture clues, and write
// .rebuild/features/bundle-analysis.md.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nowIso, writeJson, writeText, readJson, fileExists } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

const BUNDLES = p('.rebuild', 'reference', 'bundles', 'bundles.json');
const OUT_MD = p('.rebuild', 'features', 'bundle-analysis.md');

function log(s) {
  console.log(`[bundles] ${s}`);
}

function classifyUrl(url) {
  if (!url) return 'other';
  const u = url.toLowerCase();
  if (/\.js(\?|$)/.test(u)) return 'js';
  if (/\.mjs(\?|$)/.test(u)) return 'js';
  if (/\.css(\?|$)/.test(u)) return 'css';
  if (/\.wasm(\?|$)/.test(u)) return 'wasm';
  if (/worker/.test(u)) return 'worker';
  if (/\.(png|jpg|jpeg|webp|gif|svg|ico)(\?|$)/.test(u)) return 'image';
  if (/\.(woff2?|ttf|otf)(\?|$)/.test(u)) return 'font';
  return 'other';
}

function frameworkClues(url) {
  const u = url.toLowerCase();
  const out = [];
  if (/_next\//.test(u)) out.push('Next.js chunk path');
  if (/__next_data__/.test(u)) out.push('Next.js data');
  if (/__remix/.test(u)) out.push('Remix chunk');
  if (/__nuxt/.test(u)) out.push('Nuxt chunk');
  if (/webpack-runtime/.test(u)) out.push('Webpack runtime');
  if (/vite/.test(u)) out.push('Vite asset');
  if (/\/chunk-[a-z0-9]+\.js/.test(u)) out.push('Webpack-style chunk');
  if (/tailwind/.test(u)) out.push('Tailwind CSS bundle');
  if (/@ffmpeg\/ffmpeg/.test(u)) out.push('ffmpeg.wasm candidate');
  if (/wavesurfer/.test(u)) out.push('wavesurfer.js candidate');
  if (/video\.js|videojs/.test(u)) out.push('video.js candidate');
  if (/hls\.js/.test(u)) out.push('hls.js candidate');
  if (/shaka-player/.test(u)) out.push('shaka-player candidate');
  return out;
}

async function main() {
  if (!(await fileExists(BUNDLES))) {
    log('no bundles.json — running capture first.');
    log('note: cannot auto-run capture from here; please run npm run capture first.');
    await writeText(OUT_MD, `# Bundle Analysis\n\nNo \`.rebuild/reference/bundles/bundles.json\` found. Run \`npm run capture\` first.\n`);
    return;
  }

  const bundles = await readJson(BUNDLES);
  if (!Array.isArray(bundles)) {
    await writeText(OUT_MD, `# Bundle Analysis\n\nbundles.json was unreadable.\n`);
    return;
  }

  const js = bundles.filter((b) => classifyUrl(b.url) === 'js');
  const css = bundles.filter((b) => classifyUrl(b.url) === 'css');
  const wasm = bundles.filter((b) => classifyUrl(b.url) === 'wasm');
  const worker = bundles.filter((b) => classifyUrl(b.url) === 'worker');

  const lines = [];
  lines.push(`# Bundle Analysis`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`Source: \`.rebuild/reference/bundles/bundles.json\``);
  lines.push('');
  lines.push(`## Counts`);
  lines.push(`- JS bundles: ${js.length}`);
  lines.push(`- CSS bundles: ${css.length}`);
  lines.push(`- WASM modules: ${wasm.length}`);
  lines.push(`- Worker URLs: ${worker.length}`);
  lines.push('');

  // Framework clues across all bundles
  const clues = new Map();
  for (const b of bundles) {
    for (const c of frameworkClues(b.url)) {
      clues.set(c, (clues.get(c) || 0) + 1);
    }
  }
  lines.push(`## Framework / library clues`);
  if (clues.size === 0) {
    lines.push(`- (no strong framework signal from URLs alone)`);
  } else {
    for (const [k, v] of [...clues.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${k}: ${v} match(es)`);
    }
  }
  lines.push('');

  lines.push(`## JS bundles (top 40)`);
  for (const b of js.slice(0, 40)) {
    lines.push(`- ${b.status || '??'} [${b.contentType || ''}] ${b.url}`);
  }
  lines.push('');
  lines.push(`## CSS bundles (top 20)`);
  for (const b of css.slice(0, 20)) {
    lines.push(`- ${b.status || '??'} [${b.contentType || ''}] ${b.url}`);
  }
  lines.push('');
  if (wasm.length) {
    lines.push(`## WASM modules`);
    for (const b of wasm) {
      lines.push(`- ${b.status || '??'} [${b.contentType || ''}] ${b.url}`);
    }
    lines.push('');
  }
  if (worker.length) {
    lines.push(`## Worker URLs`);
    for (const b of worker) {
      lines.push(`- ${b.status || '??'} [${b.contentType || ''}] ${b.url}`);
    }
    lines.push('');
  }

  lines.push(`## Source maps`);
  lines.push(`Source maps are only recorded if the server delivers them publicly. We do not bypass access controls.`);
  const sourcemapHint = bundles.filter((b) => /\.map(\?|$)/.test(b.url));
  if (sourcemapHint.length) {
    lines.push(`Found ${sourcemapHint.length} source map URL(s) in the captured request log.`);
    for (const b of sourcemapHint.slice(0, 20)) {
      lines.push(`- ${b.url}`);
    }
  } else {
    lines.push(`No \`.map\` URLs observed in the captured requests.`);
  }
  lines.push('');
  lines.push(`## Caveats`);
  lines.push(`- This analysis is based on URL patterns, file names, and chunk layout only.`);
  lines.push(`- It does not paste minified bundle code into this report.`);
  lines.push(`- It does not claim hidden backend source code was recovered.`);

  await writeText(OUT_MD, lines.join('\n'));
  log(`wrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error('[bundles] fatal', err);
  process.exit(1);
});