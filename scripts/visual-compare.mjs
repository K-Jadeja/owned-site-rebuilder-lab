// scripts/visual-compare.mjs
// Compare rebuilt-app screenshots against the captured reference screenshots.
// Until a rebuild exists, this script reports "no baseline yet".

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nowIso, writeText, fileExists } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

function log(s) {
  console.log(`[visual-compare] ${s}`);
}

const REBUILT_DIR = p('.rebuild', 'tests', 'visual', 'rebuilt');

async function main() {
  const refDir = p('.rebuild', 'reference', 'screenshots');
  if (!(await fileExists(refDir))) {
    log('no reference screenshots — run `npm run capture` first.');
    return;
  }
  const lines = [];
  lines.push(`# Visual Diff`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');

  const refFiles = await listPngs(refDir);
  lines.push(`## Reference screenshots: ${refFiles.length}`);
  for (const f of refFiles) {
    lines.push(`- \`${path.relative('.', f)}\``);
  }

  if (!(await fileExists(REBUILT_DIR))) {
    lines.push('');
    lines.push(`## Rebuilt screenshots`);
    lines.push(`- (none — rebuilt app not yet available at \`${path.relative('.', REBUILT_DIR)}\`)`);
    lines.push('');
    lines.push(`## Status: NO BASELINE YET`);
    lines.push(`Once a rebuild produces screenshots in \`${path.relative('.', REBUILT_DIR)}\`, this script will compare them against the reference set using pixelmatch.`);
    await writeText(p('.rebuild', 'reports', 'visual-diff.md'), lines.join('\n'));
    return;
  }

  const rebuiltFiles = await listPngs(REBUILT_DIR);
  lines.push('');
  lines.push(`## Rebuilt screenshots: ${rebuiltFiles.length}`);
  for (const f of rebuiltFiles) {
    lines.push(`- \`${path.relative('.', f)}\``);
  }
  lines.push('');
  lines.push(`## Status: PENDING pixelmatch run`);
  lines.push(`Pair matching by basename. Mismatched sizes or names will be listed below.`);

  await writeText(p('.rebuild', 'reports', 'visual-diff.md'), lines.join('\n'));
  log('done (no rebuild yet — placeholder diff written).');
}

async function listPngs(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!e.name.toLowerCase().endsWith('.png')) continue;
      const full = path.join(dir, e.name);
      if ((await fs.stat(full)).isFile()) out.push(full);
    }
    return out;
  } catch {
    return [];
  }
}

main().catch((err) => {
  console.error('[visual-compare] fatal', err);
  process.exit(1);
});