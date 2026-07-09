// scripts/generate-reports.mjs
// Combine captured artifacts into spec files and parity reports.
// Designed to produce useful output even if capture was partial.

import { nowIso, writeText, writeJson, readJson, fileExists } from './utils/safe-json.mjs';
import { p } from './utils/file-utils.mjs';

function log(s) {
  console.log(`[reports] ${s}`);
}

async function tryRead(file) {
  return await readJson(file);
}

async function main() {
  const capture = await tryRead(p('.rebuild', 'reference', 'capture-summary.json'));
  const bundles = await tryRead(p('.rebuild', 'reference', 'bundles', 'bundles.json'));
  const featureMatrix = await tryRead(p('.rebuild', 'features', 'feature-matrix.json'));
  const storage = await tryRead(p('.rebuild', 'reference', 'storage', 'storage-inspection.json'));
  const stylesDesktop = await tryRead(p('.rebuild', 'reference', 'styles', 'desktop', 'styles.json'));
  const cssVarsDesktop = await tryRead(p('.rebuild', 'reference', 'styles', 'desktop', 'css-vars.json'));
  const paletteDesktop = await tryRead(p('.rebuild', 'reference', 'styles', 'desktop', 'palette.json'));

  await renderVisualSpec({ capture, stylesDesktop, cssVarsDesktop, paletteDesktop });
  await renderInteractionSpec({ featureMatrix });
  await renderComponentMap({ featureMatrix, capture });
  await renderImplementationPlan({ capture, featureMatrix });
  await renderGaps({ capture, featureMatrix });
  await renderFinalSummary({ capture, featureMatrix });
  await renderHandoff({ capture, featureMatrix });

  log('done.');
}

async function renderVisualSpec({ capture, stylesDesktop, cssVarsDesktop, paletteDesktop }) {
  const lines = [];
  lines.push(`# Visual Spec`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Target: ${capture ? capture.target : '(no capture)'}`);
  lines.push('');
  lines.push(`## Viewports captured`);
  if (capture) {
    lines.push(`| name | width | height | screenshot |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const v of capture.viewports || []) {
      lines.push(`| ${v.name} | ${v.width} | ${v.height} | \`${v.screenshotViewport || v.screenshotFull}\` |`);
    }
  } else {
    lines.push(`No capture yet.`);
  }
  lines.push('');
  lines.push(`## CSS variables (sample)`);
  if (cssVarsDesktop && Object.keys(cssVarsDesktop).length) {
    for (const [k, v] of Object.entries(cssVarsDesktop)) {
      lines.push(`- \`${k}\`: \`${v}\``);
    }
  } else {
    lines.push(`(none observed)`);
  }
  lines.push('');
  lines.push(`## Top colors`);
  if (paletteDesktop && paletteDesktop.length) {
    for (const c of paletteDesktop.slice(0, 20)) {
      lines.push(`- \`${c.color}\` (${c.count} usages)`);
    }
  } else {
    lines.push(`(none observed)`);
  }
  lines.push('');
  lines.push(`## Region typography & layout (sample)`);
  if (stylesDesktop && stylesDesktop.length) {
    for (const s of stylesDesktop.filter((x) => x.found)) {
      lines.push(`- \`${s.selector}\`: font=${s.font.family}/${s.font.size}/${s.font.weight}, color=${s.font.color}, bg=${s.bg}, display=${s.layout.display}`);
    }
  } else {
    lines.push(`(none observed)`);
  }
  lines.push('');
  lines.push(`## Visual unknowns`);
  lines.push(`- Custom cursors`);
  lines.push(`- Hover-only states`);
  lines.push(`- Animation timings`);

  await writeText(p('.rebuild', 'spec', 'visual-spec.md'), lines.join('\n'));
}

async function renderInteractionSpec({ featureMatrix }) {
  const lines = [];
  lines.push(`# Interaction Spec`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`See \`.rebuild/features/event-map.md\` and \`.rebuild/features/feature-matrix.json\` for the canonical interaction surface.`);
  lines.push('');
  if (featureMatrix && featureMatrix.features) {
    lines.push(`## Features known so far (${featureMatrix.features.length})`);
    for (const f of featureMatrix.features) {
      lines.push(`- **${f.id} ${f.name}** — ${f.status} — \`${f.parity_test.file}\``);
    }
  } else {
    lines.push(`(no feature matrix yet)`);
  }
  await writeText(p('.rebuild', 'spec', 'interaction-spec.md'), lines.join('\n'));
}

async function renderComponentMap({ featureMatrix, capture }) {
  const lines = [];
  lines.push(`# Component Map`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`This is an inferred component map for a browser video editor. Components are listed with their evidence pointer.`);
  lines.push('');
  const components = [
    ['AppShell', 'app-shell', 'Top-level layout container'],
    ['Header/TopBar', 'app-shell', 'Title, project name, menu, save indicator'],
    ['Sidebar / MediaLibrary', 'assets', 'Tabs for media, text, templates, audio'],
    ['PreviewPlayer', 'preview', 'Video element + transport controls'],
    ['Timeline', 'timeline', 'Tracks, ruler, playhead, clips, scrubber'],
    ['InspectorPanel', 'inspector', 'Per-clip properties, keyframes, effects'],
    ['ExportDialog', 'export', 'Preset, resolution, codec, progress'],
    ['SettingsDialog', 'app-shell', 'Theme, shortcuts, project settings'],
    ['ToastNotifications', 'app-shell', 'Save state, errors'],
    ['EmptyState', 'app-shell', 'No project / no clips placeholders'],
  ];
  lines.push(`| Component | Category | Notes |`);
  lines.push(`| --- | --- | --- |`);
  for (const [name, cat, notes] of components) {
    lines.push(`| ${name} | ${cat} | ${notes} |`);
  }
  lines.push('');
  lines.push(`## Evidence`);
  if (featureMatrix && featureMatrix.features) {
    for (const f of featureMatrix.features) {
      lines.push(`- ${f.id} ${f.name} — ${f.status}`);
    }
  }
  await writeText(p('.rebuild', 'spec', 'component-map.md'), lines.join('\n'));
}

async function renderImplementationPlan({ capture, featureMatrix }) {
  const lines = [];
  lines.push(`# Implementation Plan`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`Independent rebuild plan for a React + TypeScript browser video editor. No source from the target is copied; only behavior is reconstructed.`);
  lines.push('');
  const stages = [
    ['1. App shell + routing', 'React + TS + Vite. Routes for editor, settings, export modal.'],
    ['2. Design tokens', 'CSS variables from `.rebuild/spec/visual-spec.md`.'],
    ['3. UI components', 'Build AppShell, TopBar, Sidebar, Preview, Timeline, Inspector, ExportDialog.'],
    ['4. Editor state model', 'Zustand or Redux Toolkit with the schema in `.rebuild/features/state-model.md`.'],
    ['5. Timeline engine', 'Tracks/clips/playhead; zoom & scroll; selection; snapping; trim/split.'],
    ['6. Media asset system', 'File import, URL import, sample assets, metadata extraction.'],
    ['7. Preview renderer', 'HTMLVideoElement + Canvas overlay. Optional WebCodecs for performance.'],
    ['8. Export pipeline', 'Web Worker with FFmpeg.wasm or MediaRecorder for MP4/WebM.'],
    ['9. Persistence layer', 'localStorage for prefs; IndexedDB for project state + thumbnails.'],
    ['10. Keyboard shortcuts', 'Declarative map; visible in SettingsDialog.'],
    ['11. Undo/redo', 'Command pattern with past/future stacks.'],
    ['12. Visual regression tests', 'Playwright screenshots compared against `.rebuild/reference/screenshots/`.'],
    ['13. Feature parity tests', 'Playwright + manual checklists in `.rebuild/features/acceptance-tests.md`.'],
  ];
  lines.push(`## Stages`);
  for (const [s, d] of stages) {
    lines.push(`- **${s}** — ${d}`);
  }
  lines.push('');
  lines.push(`## Order of attack`);
  lines.push(`1. Visual spec + component map first.`);
  lines.push(`2. Static app shell with the regions from the spec.`);
  lines.push(`3. Timeline engine next, since most other features depend on it.`);
  lines.push(`4. Media asset + preview.`);
  lines.push(`5. Inspector + effects + keyframes.`);
  lines.push(`6. Export pipeline (last because it needs every other piece stable).`);

  await writeText(p('.rebuild', 'spec', 'implementation-plan.md'), lines.join('\n'));
}

async function renderGaps({ capture, featureMatrix }) {
  const lines = [];
  lines.push(`# Gaps & Blockers`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  if (!capture) {
    lines.push(`- ⚠️ No capture ran successfully. Run \`npm run capture\` first.`);
  } else {
    if (capture.errors && capture.errors.length) {
      lines.push(`## Capture errors`);
      for (const e of capture.errors) {
        lines.push(`- ${e.viewport}: ${e.error}`);
      }
    }
    const failed = (capture.viewports || []).filter((v) => !v.navOk);
    if (failed.length) {
      lines.push(`## Navigation failures`);
      for (const v of failed) {
        lines.push(`- ${v.name}: ${v.navError || 'unknown error'}`);
      }
    }
  }
  lines.push('');
  lines.push(`## Known unknowns`);
  lines.push(`- Private backend behavior: cannot be recovered; only inferred from public network shapes.`);
  lines.push(`- Hidden admin/editor surfaces behind auth: blocked if no public surface.`);
  lines.push(`- Server-side rendering data: only public, browser-visible \`__NEXT_DATA__\`, \`__remixContext__\`, etc.`);
  lines.push(`- Source maps: only recorded if publicly delivered by the server.`);

  await writeText(p('.rebuild', 'reports', 'gaps.md'), lines.join('\n'));
}

async function renderFinalSummary({ capture, featureMatrix }) {
  const lines = [];
  lines.push(`# Final Research Summary`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Target: ${capture ? capture.target : '(no capture)'}`);
  lines.push('');
  lines.push(`## What this harness proves`);
  lines.push('');
  lines.push(`This harness demonstrates whether Claude Code can reconstruct the **observable behavior** of an owned/authorized browser video editor from public surface evidence (UI, DOM, network, storage, public bundles), and produce a spec + tests sufficient to drive an independent rebuild.`);
  lines.push('');
  lines.push(`It does **not** claim that private backend source code was recovered.`);
  lines.push('');
  lines.push(`## Evidence collected`);
  if (capture) {
    lines.push(`- Viewports captured: ${(capture.viewports || []).length}`);
    lines.push(`- Network entries (sanitized): ${capture.networkCount}`);
    lines.push(`- Console messages: ${capture.consoleCount}`);
    lines.push(`- JS/CSS bundles: ${capture.bundleCount}`);
    lines.push(`- Static assets: ${capture.assetCount}`);
  } else {
    lines.push(`(no capture data)`);
  }
  lines.push('');
  lines.push(`## Feature coverage`);
  if (featureMatrix && featureMatrix.features) {
    const counts = {};
    for (const f of featureMatrix.features) {
      counts[f.status] = (counts[f.status] || 0) + 1;
    }
    for (const [k, v] of Object.entries(counts)) {
      lines.push(`- ${k}: ${v}`);
    }
  } else {
    lines.push(`(no feature matrix yet)`);
  }
  lines.push('');
  lines.push(`## How to extend`);
  lines.push(`1. Re-run \`npm run capture\` after any target update.`);
  lines.push(`2. Re-run \`npm run probe\` to refresh the event map.`);
  lines.push(`3. Update feature statuses in \`.rebuild/features/feature-inventory.md\`.`);
  lines.push(`4. Add new Playwright specs as features stabilize.`);
  lines.push(`5. Track unknowns in \`.rebuild/reports/gaps.md\`.`);

  await writeText(p('.rebuild', 'reports', 'final-research-summary.md'), lines.join('\n'));
}

async function renderHandoff({ capture, featureMatrix }) {
  const lines = [];
  lines.push(`# Handoff`);
  lines.push('');
  lines.push(`Generated: ${nowIso()}`);
  lines.push('');
  lines.push(`This file is meant to be the first thing a new Claude Code session reads after \`/clear\` or compaction.`);
  lines.push('');
  lines.push(`## Current goal`);
  lines.push(`Reconstruct observable behavior of ${capture ? capture.target : 'https://demo.reactvideoeditor.com'} from public surface evidence; produce a spec, state model, parity tests, and rebuild plan.`);
  lines.push('');
  lines.push(`## What was created`);
  lines.push(`- \`.claude/skills/owned-site-rebuilder/\` — project-local skill.`);
  lines.push(`- \`.harness/\` — long-run state (this file + progress, decisions, verification, session-log, features.json).`);
  lines.push(`- \`.rebuild/reference/\` — captured DOM/styles/network/storage/bundles/console/screenshots.`);
  lines.push(`- \`.rebuild/spec/\` — visual-spec, interaction-spec, component-map, implementation-plan, video-editor-architecture.`);
  lines.push(`- \`.rebuild/features/\` — feature-inventory, feature-matrix.json, state-model, api-contracts, event-map, storage-model, bundle-analysis, acceptance-tests, media-engine-notes.`);
  lines.push(`- \`.rebuild/reports/\` — capture-run, feature-parity, gaps, progress, visual-diff, final-research-summary.`);
  lines.push(`- \`.research/\` — FreeCut notes + open-source comparison.`);
  lines.push(`- \`scripts/\` — capture, probe, bundles, storage, reports, visual-compare + utils.`);
  lines.push(`- \`tests/\` — reference-capture, visual-baseline, feature-parity-plan Playwright specs.`);
  lines.push(`- \`docs/\` — workflow, safety, feature-reverse-engineering, visual-regression, browser-bundle-analysis, video-editor-architecture, freecut-research, rebuild-plan, what-can-and-cannot-be-recovered.`);
  lines.push(`- \`README.md\` — entry point.`);
  lines.push('');
  lines.push(`## Commands to run`);
  lines.push(`- \`npm run capture\` — re-run browser capture (multi-viewport).`);
  lines.push(`- \`npm run probe\` — re-run interactive probe.`);
  lines.push(`- \`npm run bundles\` — refresh bundle analysis.`);
  lines.push(`- \`npm run storage\` — refresh storage inspection.`);
  lines.push(`- \`npm run reports\` — regenerate spec + reports + this handoff.`);
  lines.push(`- \`npm test\` — run all Playwright tests.`);
  lines.push(`- \`npm run test:visual\` — visual baseline only.`);
  lines.push(`- \`npm run test:features\` — feature parity plan only.`);
  lines.push('');
  lines.push(`## What succeeded`);
  lines.push(capture ? `- Capture produced ${(capture.viewports || []).length} viewport(s).` : `- No capture data yet.`);
  lines.push(featureMatrix ? `- Feature matrix has ${featureMatrix.features.length} entries.` : `- No feature matrix yet.`);
  lines.push('');
  lines.push(`## What failed`);
  if (capture && capture.errors && capture.errors.length) {
    for (const e of capture.errors) {
      lines.push(`- ${e.viewport}: ${e.error}`);
    }
  } else {
    lines.push(`(no errors recorded)`);
  }
  lines.push('');
  lines.push(`## Files that matter most`);
  lines.push(`- \`.rebuild/features/feature-inventory.md\``);
  lines.push(`- \`.rebuild/features/feature-matrix.json\``);
  lines.push(`- \`.rebuild/features/state-model.md\``);
  lines.push(`- \`.rebuild/features/api-contracts.md\``);
  lines.push(`- \`.rebuild/features/event-map.md\``);
  lines.push(`- \`.rebuild/features/bundle-analysis.md\``);
  lines.push(`- \`.rebuild/features/acceptance-tests.md\``);
  lines.push(`- \`.rebuild/spec/video-editor-architecture.md\``);
  lines.push(`- \`.rebuild/reports/feature-parity.md\``);
  lines.push(`- \`.rebuild/reports/gaps.md\``);
  lines.push(``);
  lines.push(`## Next best actions`);
  lines.push(`1. If capture failed, check \`.harness/verification.md\` for the exact error.`);
  lines.push(`2. If Playwright didn't install, run \`npx playwright install chromium\`.`);
  lines.push(`3. Verify \`.rebuild/reference/screenshots/\` exists and looks like the target.`);
  lines.push(`4. Open \`.rebuild/features/feature-inventory.md\` and confirm each feature has evidence pointers.`);
  lines.push(`5. Run \`npm test\` and address any failing specs.`);
  lines.push('');
  lines.push(`## Known blockers`);
  lines.push(`- See \`.rebuild/reports/gaps.md\`.`);
  lines.push('');
  lines.push(`## Verification status`);
  lines.push(`See \`.harness/verification.md\`.`);

  await writeText(p('.harness', 'handoff.md'), lines.join('\n'));
  // mirror into .rebuild/spec for easy discovery
  await writeText(p('.rebuild', 'spec', 'handoff.md'), lines.join('\n'));
}

main().catch((err) => {
  console.error('[reports] fatal', err);
  process.exit(1);
});