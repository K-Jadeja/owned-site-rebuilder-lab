// scripts/rve-region-visual-diff.mjs
//
// Region-level visual diff using pixelmatch. Crops each normalized
// screenshot pair into 9 regions, computes per-region mismatch, then
// writes a JSON + Markdown report and per-region diff PNGs.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REF_DIR = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/reference');
const REB_DIR = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/rebuild');
const OUT_DIR = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/diff');
const REPORT_JSON = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/region-report.json');
const REPORT_MD = path.join(ROOT, '.rebuild/rebuild-parity/m1/normalized/region-report.md');

const STATES = [
  'initial',
  'my-library',
  'selected-default-video-clip',
  'selected-default-text-clip',
  'export-dialog',
  'after-single-file-import',
  'after-imported-video-on-timeline',
];

const VIEWPORTS = [{ name: 'desktop', w: 1440, h: 900 }];

// 9 regions as approximate percentage slices of the desktop viewport.
const REGIONS = [
  { id: 'topbar',         x_pct: 0,    y_pct: 0,    w_pct: 1,    h_pct: 0.062 },
  { id: 'icon-rail',       x_pct: 0,    y_pct: 0.062, w_pct: 0.039, h_pct: 0.694 },
  { id: 'media-panel',     x_pct: 0.039, y_pct: 0.062, w_pct: 0.222, h_pct: 0.694 },
  { id: 'preview',         x_pct: 0.261, y_pct: 0.062, w_pct: 0.516, h_pct: 0.694 },
  { id: 'inspector',       x_pct: 0.778, y_pct: 0.062, w_pct: 0.222, h_pct: 0.694 },
  { id: 'timeline-header', x_pct: 0,    y_pct: 0.756, w_pct: 1,    h_pct: 0.04 },
  { id: 'timeline-ruler',  x_pct: 0,    y_pct: 0.796, w_pct: 1,    h_pct: 0.034 },
  { id: 'timeline-tracks', x_pct: 0,    y_pct: 0.83,  w_pct: 1,    h_pct: 0.17 },
];

function blankResize(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 255;
  }
  try {
    PNG.bitblt(png, 0, 0, png.width, png.height, out, 0, 0);
  } catch {}
  return out;
}

async function diffPair(refPath, rebPath, outDir, label, region) {
  let refDecoded, rebDecoded;
  try { refDecoded = await readPng(refPath); } catch { return { region, label, error: 'ref-missing' }; }
  try { rebDecoded = await readPng(rebPath); } catch { return { region, label, error: 'reb-missing' }; }
  const w = Math.max(refDecoded.width, rebDecoded.width);
  const h = Math.max(refDecoded.height, rebDecoded.height);
  const refB = blankResize(refDecoded, w, h);
  const rebB = blankResize(rebDecoded, w, h);
  const rx = Math.floor(region.x_pct * w);
  const ry = Math.floor(region.y_pct * h);
  const rw = Math.floor(region.w_pct * w);
  const rh = Math.floor(region.h_pct * h);
  const diff = new PNG({ width: rw, height: rh });
  let mismatched = 0;
  try {
    mismatched = pixelmatch(
      refB.data, rebB.data, diff.data,
      w, h,
      { threshold: 0.1 }
    );
  } catch (e) {
    return { region: region.id, label, error: e.message };
  }
  // We don't actually need the cropped mismatched count — pixelmatch compares
  // the whole image. Recompute cropped mismatched by cropping diff visually
  // and counting non-zero pixels.
  let croppedMismatched = 0;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = ((y + ry) * w + (x + rx)) * 4;
      const r = diff.data[idx];
      const g = diff.data[idx + 1];
      const b = diff.data[idx + 2];
      if (r !== 0 || g !== 0 || b !== 0) croppedMismatched++;
    }
  }
  const diffPath = path.join(outDir, `${label}-${region.id}-diff.png`);
  // Build cropped diff PNG for readability
  const cropped = new PNG({ width: rw, height: rh });
  PNG.bitblt(diff, 0, 0, rw, rh, cropped, 0, 0);
  await fs.writeFile(diffPath, PNG.sync.write(cropped));
  const total = rw * rh;
  return {
    region: region.id,
    label,
    dimensions: { width: rw, height: rh },
    full_mismatched: mismatched,
    cropped_mismatched: croppedMismatched,
    cropped_total: total,
    percent: +(croppedMismatched / total * 100).toFixed(2),
    diffPath,
  };
}

async function readPng(p) {
  const buf = await fs.readFile(p);
  return PNG.sync.read(buf);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const results = [];
  for (const v of VIEWPORTS) {
    for (const state of STATES) {
      const refPath = path.join(REF_DIR, `${v.name}-${state}.png`);
      const rebPath = path.join(REB_DIR, `${v.name}-${state}.png`);
      // Whole-page diff
      try {
        const refDecoded = await readPng(refPath);
        const rebDecoded = await readPng(rebPath);
        const w = Math.max(refDecoded.width, rebDecoded.width);
        const h = Math.max(refDecoded.height, rebDecoded.height);
        const refB = blankResize(refDecoded, w, h);
        const rebB = blankResize(rebDecoded, w, h);
        const diff = new PNG({ width: w, height: h });
        let mismatched = 0;
        try {
          mismatched = pixelmatch(refB.data, rebB.data, diff.data, w, h, { threshold: 0.1 });
        } catch {}
        await fs.writeFile(path.join(OUT_DIR, `${v.name}-${state}-whole-diff.png`), PNG.sync.write(diff));
        const wholePercent = +(mismatched / (w * h) * 100).toFixed(2);
        results.push({ state, viewport: v.name, whole_percent: wholePercent, regions: [] });
        for (const region of REGIONS) {
          const label = `${state}-${region.id}`;
          const r = await diffPair(refPath, rebPath, OUT_DIR, label, region);
          results[results.length - 1].regions.push(r);
        }
      } catch (e) {
        results.push({ state, viewport: v.name, whole_percent: null, regions: [], error: e.message });
      }
    }
  }

  await fs.writeFile(REPORT_JSON, JSON.stringify(results, null, 2));

  // Markdown
  const md = [];
  md.push('# Region-Level Visual Parity Report');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  for (const r of results) {
    md.push(`## ${r.viewport}/${r.state}`);
    md.push('');
    md.push(`Whole-page mismatch: **${r.whole_percent ?? 'err'}%**`);
    md.push('');
    md.push('| Region | Width×Height | Mismatched px | % | Diff file |');
    md.push('| --- | --- | --- | --- | --- |');
    for (const region of r.regions) {
      const dim = region.dimensions
        ? `${region.dimensions.width}×${region.dimensions.height}`
        : '-';
      md.push(`| ${region.region} | ${dim} | ${region.cropped_mismatched ?? '-'} | ${region.percent ?? '-'}% | \`${path.relative(OUT_DIR, region.diffPath || '')}\` |`);
    }
    md.push('');
  }
  // Aggregate
  md.push('## Worst regions (by % mismatch)');
  md.push('');
  const all = results.flatMap((r) => (r.regions || []).map((g) => ({ ...g, state: r.state })));
  const sorted = [...all].filter((r) => typeof r.percent === 'number').sort((a, b) => b.percent - a.percent).slice(0, 12);
  for (const r of sorted) {
    md.push(`- **${r.region}** (state=${r.state}): ${r.percent}%`);
  }
  await fs.writeFile(REPORT_MD, md.join('\n'));
  console.log(`[region-diff] wrote ${REPORT_JSON} and ${REPORT_MD}`);
  console.log(`[region-diff] states=${results.length} worst region: ${sorted[0]?.region || 'n/a'} ${sorted[0]?.percent || ''}%`);
}

main().catch((err) => { console.error('[region-diff] fatal', err); process.exit(1); });
