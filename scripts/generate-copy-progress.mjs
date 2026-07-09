// scripts/generate-copy-progress.mjs
//
// Score every feature F001-F034 on the 7-point scale.
//
// Outputs:
//   .rebuild/reports/rve-copy-progress.md
//   .rebuild/reports/rve-copy-progress.json
//
// Sources of truth (priority order):
//   - .rebuild/features/feature-matrix.json (proof_level)
//   - .rebuild/features/feature-inventory.md / .md (proofLevel)

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MATRIX = path.join(ROOT, '.rebuild/features/feature-matrix.json');
const INVENTORY = path.join(ROOT, '.rebuild/features/feature-inventory.md');
const COPY_JSON = path.join(ROOT, '.rebuild/reports/rve-copy-progress.json');
const COPY_MD = path.join(ROOT, '.rebuild/reports/rve-copy-progress.md');

const PROOF_TO_SCORE = {
  not_found: 0,
  surface_observed: 1,
  behavior_observed: 2,
  inferred_from_bundle: 2,
  inferred_from_architecture: 2,
  fixture_ready: 2,
  hard_proof: 3,
  code_correlated: 4,
  implemented_in_rebuild: 5,
  visual_parity_passes: 6,
  feature_parity_passes: 7,
};

const FEATURES = Array.from({ length: 34 }, (_, i) => `F${String(i + 1).padStart(3, '0')}`);

async function main() {
  const matrix = JSON.parse((await fs.readFile(MATRIX, 'utf8').catch(() => '{}')) || '{}');
  const inventory = (await fs.readFile(INVENTORY, 'utf8').catch(() => '')) || '';
  const features = (matrix.features && Array.isArray(matrix.features)) ? matrix.features : [];

  // fallback: parse inventory markdown
  const invMap = {};
  for (const line of inventory.split('\n')) {
    const m = line.match(/^####?\s+(F\d{3})\s+(.+)$/);
    if (m) invMap[m[1]] = { title: m[2].trim(), proofLevel: null };
  }

  for (const f of features) {
    invMap[f.id] = invMap[f.id] || { title: f.title || f.id, proofLevel: f.proof_level || f.proofLevel || null };
  }

  const rows = [];
  for (const id of FEATURES) {
    const f = invMap[id] || { title: 'unknown', proofLevel: null };
    const score = PROOF_TO_SCORE[f.proofLevel || 'not_found'] ?? 0;
    rows.push({
      id,
      title: f.title,
      score,
      proofLevel: f.proofLevel || 'not_found',
      canBuildNow: score >= 3,
      risk: score === 0 ? 'high' : score <= 2 ? 'medium' : 'low',
      nextAction:
        score === 0 ? 'probe + reverse' :
        score <= 2 ? 'harden with stack trace or behavior assertion' :
        score === 3 ? 'correlate to bundle code' :
        score === 4 ? 'implement in rebuild' :
        score === 5 ? 'compare visual parity' :
        score === 6 ? 'compare feature parity' :
        'mark complete',
    });
  }

  const totalScore = rows.reduce((acc, r) => acc + r.score, 0);
  const maxScore = FEATURES.length * 7;
  const researchProgress = rows.filter((r) => r.score >= 3).length / FEATURES.length * 100;
  const implementationProgress = 0; // no rebuild yet
  const parityProgress = 0; // no rebuild yet
  const totalCopyProgress = totalScore / maxScore * 100;

  const out = {
    generatedAt: new Date().toISOString(),
    rows,
    totals: {
      totalScore,
      maxScore,
      researchProgress: Math.round(researchProgress * 10) / 10,
      implementationProgress,
      parityProgress,
      totalCopyProgress: Math.round(totalCopyProgress * 10) / 10,
    },
  };

  await fs.writeFile(COPY_JSON, JSON.stringify(out, null, 2));

  const md = [];
  md.push('# RVE Copy Progress Dashboard');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('## Overall copy progress');
  md.push('');
  md.push(`- Research progress: **${out.totals.researchProgress}%** (features at hard_proof or higher)`);
  md.push(`- Implementation progress: **${out.totals.implementationProgress}%** (no rebuild yet)`);
  md.push(`- Parity progress: **${out.totals.parityProgress}%** (no rebuilt app to compare)`);
  md.push(`- Total copy progress: **${out.totals.totalCopyProgress}%**`);
  md.push('');
  md.push('## Copy progress scale');
  md.push('');
  md.push('| Score | Meaning |');
  md.push('| --- | --- |');
  md.push('| 0 | not_found |');
  md.push('| 1 | surface_observed |');
  md.push('| 2 | behavior_observed |');
  md.push('| 3 | hard_proof |');
  md.push('| 4 | code_correlated |');
  md.push('| 5 | implemented_in_rebuild |');
  md.push('| 6 | visual_parity_passes |');
  md.push('| 7 | feature_parity_passes |');
  md.push('');
  md.push('## Per-feature progress');
  md.push('');
  md.push('| Feature | Title | Score | Proof | Can build | Risk | Next action |');
  md.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    md.push(`| ${r.id} | ${r.title.replace(/\|/g, '\\|')} | ${r.score} | ${r.proofLevel} | ${r.canBuildNow ? 'YES' : 'no'} | ${r.risk} | ${r.nextAction} |`);
  }
  await fs.writeFile(COPY_MD, md.join('\n'));

  console.log(`[copy-progress] total=${totalScore}/${maxScore} (${out.totals.totalCopyProgress}%) hardProofOrBetter=${rows.filter((r) => r.score >= 3).length}/${FEATURES.length}`);
}

main().catch((err) => {
  console.error('[copy-progress] fatal', err);
  process.exit(1);
});
