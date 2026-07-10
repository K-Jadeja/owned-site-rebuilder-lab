// scripts/mark-stub.mjs
//
// Helper for the Milestone 1 rescue. Downgrades a feature's
// "implementation level" in rve-copy-progress.json to a stub score
// while preserving the reverse-engineering evidence level in a
// separate field.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const JSON_PATH = path.join(ROOT, '.rebuild/reports/rve-copy-progress.json');
const MD_PATH = path.join(ROOT, '.rebuild/reports/rve-copy-progress.md');
const MATRIX = path.join(ROOT, '.rebuild/features/feature-matrix.json');

// In the rescue, every Milestone 1 feature is a stub until explicitly
// promoted by the rescue tests. The features to downgrade are listed
// here so the script is reversible.
const STUB_IDS = [
  'F001', 'F002', 'F004', 'F007', 'F008', 'F010',
  'F012', 'F013', 'F019', 'F020', 'F022', 'F028', 'F031',
];

async function main() {
  const data = JSON.parse(await fs.readFile(JSON_PATH, 'utf8'));
  let changed = 0;
  for (const row of data.rows) {
    if (STUB_IDS.includes(row.id) && row.score >= 5 && row.score <= 7) {
      row.score = 4; // implemented_stub -> 4 in the 0-7 scale (we'll define 4.5 below)
      // For readability, we keep proofLevel pointing to the rebuild status;
      // a separate field tracks the rescue verdict.
      row.proofLevel = 'implemented_stub';
      row.implementationLevel = 'implemented_stub';
      row.reverseEvidenceLevel = row.reverseEvidenceLevel || (row.id in ({}));
      row.canBuildNow = false;
      row.risk = 'high';
      row.nextAction = 'await rescue pass';
      changed++;
    }
  }
  data.milestone1RescueStartedAt = new Date().toISOString();
  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2));

  // Update matrix too
  const matrix = JSON.parse(await fs.readFile(MATRIX, 'utf8'));
  for (const f of (matrix.features || [])) {
    if (STUB_IDS.includes(f.id)) {
      f.implementation_level = 'implemented_stub';
      f.rescue_status = 'pending';
    }
  }
  matrix.rescue = matrix.rescue || {};
  matrix.rescue.startedAt = new Date().toISOString();
  matrix.rescue.branch = 'rve-rebuild-m1-rescue';
  await fs.writeFile(MATRIX, JSON.stringify(matrix, null, 2));

  console.log(`[mark-stub] ${changed} features downgraded to implemented_stub`);
}

main().catch((err) => {
  console.error('[mark-stub] fatal', err);
  process.exit(1);
});
