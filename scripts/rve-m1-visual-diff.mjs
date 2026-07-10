// scripts/rve-m1-visual-diff.mjs
//
// Compare reference vs rebuild screenshots using pixelmatch + pngjs.
// Produces per-pair diff PNGs plus a JSON + Markdown report.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REF = path.join(ROOT, '.rebuild/rebuild-parity/m1/manual-check/reference');
const REB = path.join(ROOT, '.rebuild/rebuild-parity/m1/manual-check/rebuild');
const DIFF = path.join(ROOT, '.rebuild/rebuild-parity/m1/diff');
const REPORT_JSON = path.join(ROOT, '.rebuild/rebuild-parity/m1/visual-parity-report.json');
const REPORT_MD = path.join(ROOT, '.rebuild/rebuild-parity/m1/visual-parity-report.md');

const STATES = ['viewport', 'full', 'export-dialog', 'my-library', 'after-space', 'after-import'];
const VIEWPORTS = [
  { id: 'desktop', w: 1440, h: 900 },
  { id: 'laptop', w: 1280, h: 800 },
  { id: 'mobile', w: 390, h: 844 },
];

async function readPng(path) {
  const buf = await fs.readFile(path);
  return PNG.sync.read(buf);
}

async function diffPair(refPath, rebPath, outPath) {
  let refDecoded, rebDecoded;
  try { refDecoded = await readPng(refPath); } catch { return { error: 'ref-missing', refPath, rebPath, dimensions: null, mismatched: null, percent: null, outPath: null }; }
  try { rebDecoded = await readPng(rebPath); } catch { return { error: 'reb-missing', refPath, rebPath, dimensions: null, mismatched: null, percent: null, outPath: null }; }
  const w = Math.max(refDecoded.width, rebDecoded.width);
  const h = Math.max(refDecoded.height, rebDecoded.height);
  // Guard against impossible dimensions from blankResize crash.
  if (w < 1 || h < 1) return { error: 'bad-dimensions', refPath, rebPath, dimensions: { width: w, height: h }, mismatched: null, percent: null, outPath: null };
  let refBlanked, rebBlanked;
  try {
    refBlanked = blankResize(refDecoded, w, h);
    rebBlanked = blankResize(rebDecoded, w, h);
  } catch (e) {
    return { error: `resize: ${e.message}`, refPath, rebPath, dimensions: { width: w, height: h }, mismatched: null, percent: null, outPath: null };
  }
  const diffDecoded = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(refBlanked.data, rebBlanked.data, diffDecoded.data, w, h, { threshold: 0.1 });
  const total = w * h;
  const outBuf = PNG.sync.write(diffDecoded);
  try { await fs.writeFile(outPath, outBuf); } catch {}
  return {
    refPath,
    rebPath,
    outPath,
    dimensions: { width: w, height: h },
    mismatched,
    percent: +(mismatched / total * 100).toFixed(2),
  };
}

function blankResize(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  // PNG bit-depth assumption: RGBA 8-bit.
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 0;
    out.data[i + 1] = 0;
    out.data[i + 2] = 0;
    out.data[i + 3] = 255;
  }
  PNG.bitblt(png, 0, 0, png.width, png.height, out, 0, 0);
  return out;
}

async function main() {
  await fs.mkdir(DIFF, { recursive: true });
  const results = [];
  for (const v of VIEWPORTS) {
    for (const state of STATES) {
      const refName = `reference-${v.id}-${state}.png`;
      const rebName = `rebuild-${v.id}-${state}.png`;
      const refPath = path.join(REF, refName);
      const rebPath = path.join(REB, rebName);
      const outName = `${v.id}-${state}-diff.png`;
      const outPath = path.join(DIFF, outName);
      const r = await diffPair(refPath, rebPath, outPath);
      results.push({ viewport: v.id, state, ...r });
      console.log(`[diff] ${v.id}/${state} mismatched=${r.mismatched ?? 'err'} ${r.percent ?? '-'}% -> ${r.outPath ? path.basename(r.outPath) : '-'}`);
    }
  }

  await fs.writeFile(REPORT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

  // Markdown
  const md = [];
  md.push('# Visual parity report (Milestone 1 rescue)');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('Pixel-level comparison between reference (`https://demo.reactvideoeditor.com`) and rebuild (`http://localhost:4310`).');
  md.push('');
  md.push('| Viewport | State | Mismatch px | % | Diff file | Status |');
  md.push('| --- | --- | --- | --- | --- | --- |');

  const assess = (state, r) => {
    if (r.percent == null) return 'MISSING';
    if (state === 'viewport' || state === 'full') {
      if (r.percent > 35) return 'CRITICAL — overall shell/colors mostly different';
      if (r.percent > 15) return 'MAJOR — significant layout drift';
      return 'OK';
    }
    if (state === 'export-dialog') {
      if (r.percent > 25) return 'MAJOR — dialog layout differs';
      return 'OK';
    }
    if (state === 'after-import') {
      if (r.percent > 40) return 'CRITICAL — imported video, library card, or preview still wrong';
      if (r.percent > 20) return 'MAJOR — imported-video path still off';
      return 'OK';
    }
    if (r.percent > 25) return 'MAJOR — visible behavior differs';
    return 'OK';
  };

  for (const r of results) {
    const pct = r.percent != null ? `${r.percent}%` : 'err';
    const diffFile = r.outPath ? path.relative(path.join(ROOT), r.outPath).replace(/\\/g, '/') : '-';
    md.push(`| ${r.viewport} | ${r.state} | ${r.mismatched ?? '-'} | ${pct} | \`${diffFile}\` | ${assess(r.state, r)} |`);
  }

  md.push('');
  md.push('## Region assessments');
  md.push('');
  for (const r of results) {
    if (r.percent == null) {
      md.push(`- **${r.viewport}/${r.state}**: missing image pair (re-capture required).`);
      continue;
    }
    md.push(`- **${r.viewport}/${r.state}** (${r.percent}%): ${assess(r.state, r)}`);
  }

  // Aggregate
  const total = results.filter((r) => r.percent != null);
  const sorted = [...total].sort((a, b) => b.percent - a.percent);
  md.push('');
  md.push('## Worst mismatches (top 5)');
  md.push('');
  for (const r of sorted.slice(0, 5)) {
    md.push(`- ${r.viewport}/${r.state}: ${r.percent}%`);
  }

  await fs.writeFile(REPORT_MD, md.join('\n'));
  console.log(`[diff] wrote ${REPORT_JSON} and ${REPORT_MD}`);
}

main().catch((err) => {
  console.error('[diff] fatal', err);
  process.exit(1);
});
