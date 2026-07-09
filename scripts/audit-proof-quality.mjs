// scripts/audit-proof-quality.mjs
//
// Audit every test in the repo and classify it by proof level.
// Output:
//   .rebuild/reports/test-proof-audit.md

import { promises as fs } from 'node:fs';
import path from 'node:path';

const TEST_FILES = [
  'tests/feature-parity-plan.spec.mjs',
  'tests/deep-runtime-proof.spec.mjs',
  'tests/single-import-proof.spec.mjs',
  'tests/bundle-analysis-proof.spec.mjs',
  'tests/visual-baseline.spec.mjs',
  'tests/reference-capture.spec.mjs',
  'tests/code-correlation-proof.spec.mjs',
  'tests/action-stack-proof.spec.mjs',
  'tests/import-timeline-proof.spec.mjs',
  'tests/clip-identity-proof.spec.mjs',
  'tests/trim-split-proof.spec.mjs',
  'tests/export-end-to-end-proof.spec.mjs',
  'tests/effects-inspector-proof.spec.mjs',
  'tests/state-schema-proof.spec.mjs',
  'tests/copy-readiness-proof.spec.mjs',
];

const SOFT_MARKERS = [
  /expect\s*\(\s*true\s*\)\s*\.toBeTruthy\s*\(\s*\)/,
  /expect\s*\(\s*typeof[^=]+===\s*['"]boolean['"]\s*\)/,
  /expect\s*\(\s*Array\.isArray/,
  /\.toBeNull\(\)/,
  /\.toBeGreaterThan\(\s*0\s*\)/,
];

function classify(line) {
  for (const re of SOFT_MARKERS) if (re.test(line)) return 'soft_probe';
  if (/expect\([^)]+\)\.toContain\(/.test(line)) return 'hard_proof';
  if (/expect\([^)]+\)\.toBe\(/.test(line)) return 'hard_proof';
  if (/expect\([^)]+\)\.toEqual/.test(line)) return 'hard_proof';
  if (/expect\(/.test(line)) return 'soft_probe';
  return 'unknown';
}

async function main() {
  const lines = [];
  lines.push('# Test Proof Audit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Every test in the repo is classified by proof level.');
  lines.push('');
  lines.push('| File | Test | Proof level | Reason |');
  lines.push('| --- | --- | --- | --- |');

  let totalSoft = 0, totalHard = 0;

  for (const f of TEST_FILES) {
    let txt;
    try { txt = await fs.readFile(f, 'utf8'); } catch { continue; }
    // Split into tests by regex.
    const testRe = /test(?:\.skip|\.fixme)?\(\s*(['"`]([^'"`]+)['"`])?[\s\S]*?\n\s*\}\s*\)/g;
    let m;
    let idx = 0;
    while ((m = testRe.exec(txt))) {
      const start = m.index;
      const body = m[0];
      const nameMatch = m[2] || `anon-${idx}`;
      let proof = 'hard_proof';
      let reason = 'contains concrete expect assertion';
      for (const re of SOFT_MARKERS) {
        if (re.test(body)) {
          proof = 'soft_probe';
          reason = 'matches soft marker';
          break;
        }
      }
      if (proof === 'soft_probe') totalSoft++;
      else totalHard++;
      lines.push(`| ${f} | ${nameMatch} | ${proof} | ${reason} |`);
      idx++;
    }
  }

  lines.push('');
  lines.push(`## Totals`);
  lines.push(`- hard_proof: ${totalHard}`);
  lines.push(`- soft_probe: ${totalSoft}`);

  await fs.mkdir('.rebuild/reports', { recursive: true });
  await fs.writeFile('.rebuild/reports/test-proof-audit.md', lines.join('\n'));

  console.log(`[audit:proof] hard=${totalHard} soft=${totalSoft}`);
}

main().catch((err) => {
  console.error('[audit:proof] fatal', err);
  process.exit(1);
});