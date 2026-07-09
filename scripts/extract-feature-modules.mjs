// scripts/extract-feature-modules.mjs
//
// For important stack offsets identified by the correlation pass,
// extract focused snippets from the local bundles under
// `.rebuild/target-source/bundles/`. Avoid dumping huge minified
// bundles into the report — keep snippets small.
//
// Outputs:
//   .rebuild/target-source/extracted-modules/F007-import-module.md
//   .rebuild/target-source/extracted-modules/F013-drag-timeline-module.md
//   .rebuild/target-source/extracted-modules/F020-playback-module.md
//   .rebuild/target-source/extracted-modules/F027-export-module.md
//   .rebuild/target-source/extracted-modules/F031-persistence-module.md
//   .rebuild/features/extracted-feature-modules.md

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BUNDLE_DIR = path.join(ROOT, '.rebuild/target-source/bundles');
const STACK_MAP = path.join(ROOT, '.rebuild/features/action-stack-bundle-map.json');
const OUT_DIR = path.join(ROOT, '.rebuild/target-source/extracted-modules');
const OUT_INDEX = path.join(ROOT, '.rebuild/features/extracted-feature-modules.md');

const SNIPPET_RADIUS = 200;

async function readIf(p) {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

function safeSlice(s, center, radius = SNIPPET_RADIUS) {
  const start = Math.max(0, center - radius);
  const end = Math.min(s.length, center + radius);
  return s.slice(start, end);
}

async function findBundle(filename) {
  // Filenames like ___next__static__chunks__180476bc-91ccc8fcb48478c4.js
  // local files look like 180476bc-91ccc8fcb48478c4.js
  const base = filename.split('__').pop();
  return path.join(BUNDLE_DIR, base);
}

async function extractOne({ feature, snippetTitle, frameFilter, outputFile, summary }) {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const map = JSON.parse(await fs.readFile(STACK_MAP, 'utf8'));
  const frames = (map.frameTable || []).filter(frameFilter);
  const extracted = [];
  for (const f of frames.slice(0, 4)) {
    if (!f.bundle) continue;
    const bundlePath = await findBundle(f.bundle);
    const body = await readIf(bundlePath);
    if (!body) {
      extracted.push({ file: f.bundle, col: f.col, error: 'bundle-not-found' });
      continue;
    }
    const offset = Number(f.col) || 0;
    const snippet = safeSlice(body, offset);
    extracted.push({
      file: f.bundle,
      col: f.col,
      snippet,
      keywords: f.keywords || [],
    });
  }

  const md = [];
  md.push(`# ${feature} — ${snippetTitle}`);
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(summary);
  md.push('');
  md.push(`Frames considered: ${frames.length}`);
  md.push('');
  for (let i = 0; i < extracted.length; i++) {
    const e = extracted[i];
    md.push(`## Snippet ${i + 1} (${e.file} @ col ${e.col})`);
    md.push('');
    if (e.error) {
      md.push(`> ${e.error}`);
    } else {
      md.push('```js');
      md.push((e.snippet || '').slice(0, 1200));
      md.push('```');
      md.push('');
      md.push(`Keywords: ${(e.keywords || []).join(', ')}`);
    }
    md.push('');
  }
  await fs.writeFile(path.join(OUT_DIR, outputFile), md.join('\n'));
  return extracted.length;
}

async function main() {
  let total = 0;
  total += await extractOne({
    feature: 'F007 Asset import',
    snippetTitle: 'Import flow',
    outputFile: 'F007-import-module.md',
    frameFilter: (f) => f.kind === 'createObjectURL' || f.kind === 'storage-set',
    summary: 'URL.createObjectURL for sample.mp4 + lastCleanup_thumbnailCache storage mutation.',
  });
  total += await extractOne({
    feature: 'F013 Drag-to-timeline',
    snippetTitle: 'Drag timeline flow',
    outputFile: 'F013-drag-timeline-module.md',
    frameFilter: (f) => /drag|drop|track|timeline/i.test((f.keywords || []).join(' ')) || f.kind === 'storage-set',
    summary: 'advanced-timeline-store mutation with track / drag / drop keywords.',
  });
  total += await extractOne({
    feature: 'F020 Playback',
    snippetTitle: 'Playback flow',
    outputFile: 'F020-playback-module.md',
    frameFilter: (f) => f.kind === 'media-play' || /play|pause|attempting to play|media/i.test((f.keywords || []).join(' ')),
    summary: 'HTMLMediaElement.play and storage mutation rve-extended-theme.',
  });
  total += await extractOne({
    feature: 'F027 Export',
    snippetTitle: 'Export flow',
    outputFile: 'F027-export-module.md',
    frameFilter: (f) => /export|render|download/i.test((f.keywords || []).join(' ')) || /export|render/i.test(f.snippet || ''),
    summary: 'Export dialog / render / download flows.',
  });
  total += await extractOne({
    feature: 'F031 Persistence',
    snippetTitle: 'Persistence flow',
    outputFile: 'F031-persistence-module.md',
    frameFilter: (f) => f.kind === 'storage-set' || /persist|localstorage|idb|indexeddb/i.test((f.keywords || []).join(' ')),
    summary: 'app-owned store setters (idb_migration_v1_done, lastCleanup_thumbnailCache, advanced-timeline-store).',
  });

  const idx = [];
  idx.push('# Extracted Feature Modules');
  idx.push('');
  idx.push(`Generated: ${new Date().toISOString()}`);
  idx.push('');
  idx.push('Per-feature focused snippets from local target bundles. Snippets are kept short.');
  idx.push('');
  idx.push('## Files');
  idx.push('');
  for (const f of ['F007-import-module.md', 'F013-drag-timeline-module.md', 'F020-playback-module.md', 'F027-export-module.md', 'F031-persistence-module.md']) {
    idx.push(`- [${f}](${path.join(OUT_DIR, f).split(path.sep).join('/')})`);
  }
  await fs.writeFile(OUT_INDEX, idx.join('\n'));
  console.log(`[extract:modules] total snippets=${total}`);
}

main().catch((err) => {
  console.error('[extract:modules] fatal', err);
  process.exit(1);
});
