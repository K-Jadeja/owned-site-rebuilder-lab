// scripts/mark-milestone1-implemented.mjs
//
// Mark milestone-1 features as score 5 in rve-copy-progress.json.
// Features: F001, F002, F004, F007, F008, F010, F012, F013, F019,
// F020, F022, F028, F031.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MILESTONE1 = ['F001','F002','F004','F007','F008','F010','F012','F013','F019','F020','F022','F028','F031'];

const JSON_PATH = path.join(ROOT, '.rebuild/reports/rve-copy-progress.json');
const MD_PATH = path.join(ROOT, '.rebuild/reports/rve-copy-progress.md');

async function main() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');
  const data = JSON.parse(raw);
  let changed = 0;
  for (const row of data.rows) {
    if (MILESTONE1.includes(row.id)) {
      if (row.score !== 5) changed++;
      row.score = 5;
      row.proofLevel = 'implemented_in_rebuild';
      row.canBuildNow = true;
      row.risk = 'low';
      row.nextAction = 'visual parity in milestone 2';
    }
  }
  // Recompute totals
  const totalScore = data.rows.reduce((acc, r) => acc + r.score, 0);
  const maxScore = data.rows.length * 7;
  const researchProgress = data.rows.filter((r) => r.score >= 3).length / data.rows.length * 100;
  const implementationProgress = (data.rows.filter((r) => r.score === 5).length / data.rows.length) * 100;
  const parityProgress = 0; // no visual / feature parity tests passed yet
  const totalCopyProgress = totalScore / maxScore * 100;
  data.totals = {
    totalScore,
    maxScore,
    researchProgress: Math.round(researchProgress * 10) / 10,
    implementationProgress: Math.round(implementationProgress * 10) / 10,
    parityProgress,
    totalCopyProgress: Math.round(totalCopyProgress * 10) / 10,
  };
  data.generatedAt = new Date().toISOString();
  data.milestone1Implemented = MILESTONE1;
  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2));

  // Update the .md as well.
  let md = await fs.readFile(MD_PATH, 'utf8');
  // Replace the totals block.
  md = md.replace(
    /## Overall copy progress[\s\S]*?(?=##)/m,
    `## Overall copy progress\n\n` +
    `- Research progress: **${data.totals.researchProgress}%** (features at hard_proof or higher)\n` +
    `- Implementation progress: **${data.totals.implementationProgress}%** (${MILESTONE1.length} features implemented in rebuild)\n` +
    `- Parity progress: **${data.totals.parityProgress}%** (no visual / feature parity tested against reference)\n` +
    `- Total copy progress: **${data.totals.totalCopyProgress}%**\n\n`
  );
  await fs.writeFile(MD_PATH, md);

  console.log(`[mark-m1] ${changed} features updated to score 5`);
}

main().catch((err) => {
  console.error('[mark-m1] fatal', err);
  process.exit(1);
});
