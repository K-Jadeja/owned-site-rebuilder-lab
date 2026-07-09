// scripts/build-rve-rebuild-prompt.mjs
//
// Build .harness/next-rebuild-prompt.md from current copy progress,
// schema, and feature-matrix.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const COPY_JSON = path.join(ROOT, '.rebuild/reports/rve-copy-progress.json');
const SCHEMA_JSON = path.join(ROOT, '.rebuild/features/extracted-track-clip-schema.json');
const MATRIX = path.join(ROOT, '.rebuild/features/feature-matrix.json');
const OUT = path.join(ROOT, '.harness/next-rebuild-prompt.md');

async function readIfExists(p) {
  try { return await fs.readFile(p, 'utf8'); } catch { return null; }
}

async function main() {
  const copy = JSON.parse((await readIfExists(COPY_JSON) || '{}'));
  const schema = JSON.parse((await readIfExists(SCHEMA_JSON) || '{}'));
  const matrix = JSON.parse((await readIfExists(MATRIX) || '{}'));

  const ready = (copy.rows || []).filter((r) => r.score >= 3);
  const observed = (copy.rows || []).filter((r) => r.score === 2);
  const blocked = (copy.rows || []).filter((r) => r.score <= 1);

  const md = [];
  md.push('# Next: Build apps/rve-rebuild/');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('## Pre-flight');
  md.push('');
  md.push('This is a prompt for the NEXT Claude session. The previous session ended with the FINAL RVE REVERSE PASS — CLIP / TRIM / EXPORT / EFFECTS / STATE SCHEMA PROOF.');
  md.push('');
  md.push('## Files to read first');
  md.push('');
  md.push('- `.harness/handoff.md`');
  md.push('- `.harness/verification.md`');
  md.push('- `.harness/progress.md`');
  md.push('- `.rebuild/reports/rve-copy-progress.md`');
  md.push('- `.rebuild/reports/rebuild-readiness.md`');
  md.push('- `.rebuild/reports/feature-parity.md`');
  md.push('- `.rebuild/reports/code-correlation-summary.md`');
  md.push('- `.rebuild/features/extracted-track-clip-schema.md`');
  md.push('- `.rebuild/features/feature-matrix.json`');
  md.push('- `.rebuild/features/feature-inventory.md`');
  md.push('- `.rebuild/spec/video-editor-architecture.md`');
  md.push('');
  md.push('## Authority');
  md.push('');
  md.push('- Target: https://demo.reactvideoeditor.com (owned or authorized).');
  md.push('- Use only public browser-delivered evidence (DOM, network, storage, public bundles).');
  md.push('- Do not bypass auth, do not extract secrets, do not claim hidden backend source recovery.');
  md.push('- Public JS/CSS bundles MAY be referenced for stack offsets, identifiers, and string literals — but do NOT copy source code into the rebuild.');
  md.push('');
  md.push('## Stack recommendation');
  md.push('');
  md.push('- Framework: Next.js + React + Zustand (Zustand `persist` confirmed by decoded `advanced-timeline-store`).');
  md.push('- UI primitives: Radix UI (confirmed by fiber extraction).');
  md.push('- Styling: Tailwind.');
  md.push('- Persistence: localStorage + IndexedDB (confirmed by `idb_migration_v1_done`).');
  md.push('- Render: `URL.createObjectURL` + `<video>` + `<canvas>` (thumbnail sprite pattern observed).');
  md.push('- Export: WebCodecs / MediaRecorder / Mediabunny (libraries fingerprinted in bundles).');
  md.push('');
  md.push('## Milestone 1 (visual shell + import + export dialog)');
  md.push('');
  md.push('Ready (hard_proof or code_correlated):');
  for (const r of ready) md.push(`- ${r.id} — ${r.title} (score ${r.score})`);
  md.push('');
  md.push('Behavior-observed features (acceptable for milestone 1 if missing proof is non-central):');
  for (const r of observed) md.push(`- ${r.id} — ${r.title} (score ${r.score})`);
  md.push('');
  md.push('Blocked (do not include in milestone 1):');
  for (const r of blocked) md.push(`- ${r.id} — ${r.title} (score ${r.score})`);
  md.push('');
  md.push('## Track / clip state schema (partial)');
  md.push('');
  md.push('See `.rebuild/features/extracted-track-clip-schema.md` and `.json`.');
  md.push('');
  md.push('## What to build first');
  md.push('');
  md.push('1. `apps/rve-rebuild/` with Next.js + React + Zustand.');
  md.push('2. Topbar with all buttons (Hard, Export Video, Zoom in/out/reset, Lock, Undo, Redo).');
  md.push('3. Stock / My Library tabs.');
  md.push('4. Single-file import + ThumbnailCache sprite canvas.');
  md.push('5. Preview region (video + canvas).');
  md.push('6. Timeline tracks with draggable headers and the `trackDensity:"default"` density placeholder.');
  md.push('7. Playback Space (Space keypress → `advanced-timeline-store` mutation).');
  md.push('8. Export dialog (720p/1080p/4K + Start Export + Rendered in your browser) — download may be stubbed.');
  md.push('9. Persistence after reload (`advanced-timeline-store`, `idb_migration_v1_done`, `lastCleanup_thumbnailCache`).');
  md.push('10. Inspector panel layout (tab list only; deep interactions in milestone 2).');
  md.push('');
  md.push('## What NOT to build in milestone 1');
  md.push('');
  md.push('- Trim / split (no working shortcut identified).');
  md.push('- Effects / transitions / keyframes (only bundle hints, no runtime proof).');
  md.push('- Waveform render on uploaded audio (input only accepts video/*).');
  md.push('- Actual MP4 export render (download or timeout — confirm before claiming).');
  md.push('');
  md.push('## Acceptance for milestone 1');
  md.push('');
  md.push('- Boot the rebuilt app, snapshot topbar / tabs / timeline, compare basic landmark regions.');
  md.push('- Press Space: see `advanced-timeline-store` mutation.');
  md.push('- Single-file import: see `lastCleanup_thumbnailCache` mutation + a thumbnail canvas.');
  md.push('- Reload: keys still present.');
  md.push('- Open Export dialog: see 720p / 1080p / 4K + Start Export.');
  md.push('');
  md.push('Once these pass, increment copy-progress scores for `implemented_in_rebuild` and re-run the visual parity test.');
  md.push('');

  await fs.writeFile(OUT, md.join('\n'));
  console.log(`[next-rebuild-prompt] wrote ${OUT}`);
}

main().catch((err) => {
  console.error('[next-rebuild-prompt] fatal', err);
  process.exit(1);
});
