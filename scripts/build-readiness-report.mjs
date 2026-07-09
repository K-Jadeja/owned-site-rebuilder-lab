// scripts/build-readiness-report.mjs
//
// Build .rebuild/reports/rebuild-readiness.md based on the copy
// progress dashboard.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const COPY_JSON = path.join(ROOT, '.rebuild/reports/rve-copy-progress.json');
const MATRIX = path.join(ROOT, '.rebuild/features/feature-matrix.json');
const OUT = path.join(ROOT, '.rebuild/reports/rebuild-readiness.md');

async function readIf(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; }
}

async function main() {
  const copy = await readIf(COPY_JSON);
  const matrix = await readIf(MATRIX);
  if (!copy) {
    await fs.writeFile(OUT, '# Rebuild Readiness\n\n(copy-progress missing — run `npm run report:copy-progress` first)\n');
    return;
  }

  const ready = copy.rows.filter((r) => r.score >= 3);
  const codeCorrelated = copy.rows.filter((r) => r.proofLevel === 'code_correlated');
  const hardProof = copy.rows.filter((r) => r.proofLevel === 'hard_proof');
  const observed = copy.rows.filter((r) => r.score === 2);
  const blocked = copy.rows.filter((r) => r.score <= 1);

  const totalReady = ready.length;
  const totalCC = codeCorrelated.length;
  const totalHP = hardProof.length;
  const totalObserved = observed.length;

  const readyToStart = totalReady >= 5 && totalCC >= 3;

  const md = [];
  md.push('# RVE Rebuild Readiness Report');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('## Verdict');
  md.push('');
  md.push(readyToStart ? '**Ready to start milestone 1 of rebuild.**' : '**Not yet ready. One more reverse-evidence pass first.**');
  md.push('');
  md.push('## 10 readiness answers');
  md.push('');
  md.push(`1. **Features ready to implement immediately (hard_proof or code_correlated): ${totalReady}**`);
  for (const r of ready) md.push(`   - ${r.id} — ${r.title} (${r.proofLevel})`);
  md.push('');
  md.push(`2. **Features that can be implemented from hard_proof: ${totalHP}**`);
  for (const r of hardProof) md.push(`   - ${r.id} — ${r.title}`);
  md.push('');
  md.push(`3. **Features that are code_correlated: ${totalCC}**`);
  for (const r of codeCorrelated) md.push(`   - ${r.id} — ${r.title}`);
  md.push('');
  md.push(`4. **Features still inferred_from_bundle: ${copy.rows.filter((r) => r.proofLevel === 'inferred_from_bundle').length}**`);
  md.push('');
  md.push(`5. **Features blocked or not_found: ${blocked.length}**`);
  for (const r of blocked) md.push(`   - ${r.id} — ${r.title}`);
  md.push('');
  md.push('6. **State schema** — partial schema extracted at `.rebuild/features/extracted-track-clip-schema.md` and `.json`. Some fields are inferred only.');
  md.push('');
  md.push('7. **Stack recommendation** — Next.js + React + Zustand (persist) + Radix UI + Tailwind + WebCodecs / MediaRecorder / Mediabunny for export.');
  md.push('');
  md.push('8. **Milestone 1 features:**');
  md.push('   - F001 App shell');
  md.push('   - F002 Topbar');
  md.push('   - F004 Preview region');
  md.push('   - F007 Asset import');
  md.push('   - F008 Export dialog');
  md.push('   - F010 Persistence');
  md.push('   - F012 Media library tabs');
  md.push('   - F013 Drag/drop to timeline');
  md.push('   - F019 Timeline zoom');
  md.push('   - F020 Playback');
  md.push('   - F022 Inspector / properties');
  md.push('   - F031 Persistence after reload');
  md.push('');
  md.push('9. **Exclude from milestone 1:** trim/split (F015, F016), effects/keyframes (F024, F025, F026), waveform render (F027, F024 input mismatch), actual MP4 export render, error/empty/unsupported (F032, F033, F034).');
  md.push('');
  md.push('10. **Start building?** ' + (readyToStart ? 'YES — milestone 1' : 'NO — another reverse pass'));
  md.push('');
  md.push('## Honest copy progress');
  md.push('');
  md.push(`- Research progress: ${copy.totals.researchProgress}%`);
  md.push(`- Implementation progress: ${copy.totals.implementationProgress}% (no rebuild yet)`);
  md.push(`- Parity progress: ${copy.totals.parityProgress}% (no rebuild yet)`);
  md.push(`- Total copy progress: ${copy.totals.totalCopyProgress}%`);
  md.push('');
  md.push('## How to start the rebuild');
  md.push('');
  md.push('See `.harness/next-rebuild-prompt.md` for the full ready-to-paste prompt.');
  md.push('');

  await fs.writeFile(OUT, md.join('\n'));
  console.log(`[rebuild-readiness] ${md.length} lines`);
}

main().catch((err) => {
  console.error('[rebuild-readiness] fatal', err);
  process.exit(1);
});
