# Handoff

Generated: 2026-07-09T07:13:38.661Z (last updated 2026-07-09T08:30:00Z after deep probe)

This file is the first thing a new Claude Code session should read
after `/clear` or compaction.

## Current goal

Reconstruct observable behavior of https://demo.reactvideoeditor.com
from public surface evidence (DOM, network, storage, public bundles)
into a spec, state model, acceptance tests, and rebuild plan. Then
demonstrate that Claude Code can independently reimplement the
observable product and verify parity with automated tests.

**This run was deep-feature observation only.** No rebuild was built.
The harness now produces per-feature before/after evidence JSON +
screenshots, plus a richer feature inventory and state model driven
by the deep probe.

## What was created

- `.claude/skills/owned-site-rebuilder/` — project-local skill.
- `.harness/` — long-run state.
- `.rebuild/reference/` — captured DOM/styles/network/storage/bundles/console/screenshots.
- `.rebuild/spec/` — visual-spec, interaction-spec, component-map,
  implementation-plan, video-editor-architecture.
- `.rebuild/features/` — feature-inventory, feature-matrix.json,
  state-model, api-contracts, event-map, storage-model, bundle-analysis,
  acceptance-tests, media-engine-notes.
- `.rebuild/reports/` — capture-run, feature-parity, gaps, progress,
  visual-diff, final-research-summary.
- `.rebuild/tests/fixtures/` — sample.mp4, sample.mp3, sample.png
  (ffmpeg-generated, ffprobe-verified).
- `.rebuild/tests/feature/` — per-feature JSON evidence + before/after
  screenshots from `scripts/deep-probe.mjs`.
- `.research/` — FreeCut notes + open-source comparison.
- `scripts/` — capture-site, probe-features, deep-probe, analyze-bundles,
  inspect-storage, generate-reports, visual-compare + utils.
- `tests/` — reference-capture, visual-baseline, feature-parity-plan
  Playwright specs.
- `docs/` — 9 documentation files.
- `README.md`, `package.json`, `playwright.config.mjs`, `.gitignore`.

## Commands to run

- `npm install` — install npm deps.
- `npx playwright install chromium` — install browser binary.
- `npm run capture` — multi-viewport capture.
- `npm run probe` — interactive probing.
- `node scripts/deep-probe.mjs` — **deep feature probe** (new in this run).
- `npm run bundles` — bundle analysis.
- `npm run storage` — storage inspection.
- `npm run reports` — regenerate spec + reports + this handoff.
- `npm test` — run all Playwright tests.
- `npm run test:visual` — visual baseline only.
- `npm run test:features` — feature parity plan only.

## What succeeded

### Setup (Phase 0–9)

- Project scaffold, skill, scripts, tests, docs, FreeCut clone.
- Feature inventory seeded with 34 entries.

### First capture (Phase 19–21)

- 3 viewports captured, 71 network entries, 18 console msgs.
- 28 interactive nodes discovered.
- 33 Playwright tests passing (6 fixture-skipped at the time).

### Deep feature probe (this run)

- 3 fixture files generated (mp4 71 KB, mp3 40 KB, png 886 B).
- Fixture-media tests unskipped; **all 17 desktop tests pass**.
- Per-feature evidence for F007, F008, F013, F015, F016, F017, F019,
  F020, F030, F031 captured with before/after screenshots, storage
  diffs, network deltas, and console messages.
- Discovery: pressing **Space** adds `advanced-timeline-store` to
  `localStorage` (the strongest single observable behavior so far).
- Discovery: clicking **Export Video** opens a dialog with 720p/1080p/4K
  + Start Export.
- Discovery: track headers have `draggable="true"` with title
  "Reorder track".
- Discovery: localStorage keys persist across `page.reload()`.

## What failed

- `setInputFiles([sample.mp4, sample.mp3, sample.png])` failed with
  "Non-multiple file input" — the field accepts one file at a time.
  Logged; manual single-file upload recommended for F024/F027.
- Clip drag selectors `[data-clip-id]`, `[data-item-id]`,
  `[data-testid*="clip"]` timed out. Selector refinement is a future
  iteration; this run records the timeout as evidence.
- Trim/split keyboard shortcut hint text not found on the page.

## Files that matter most

- `.rebuild/features/feature-inventory.md` — 34 records + Deep Probe Evidence section.
- `.rebuild/features/feature-matrix.json` — machine-readable companion.
- `.rebuild/features/state-model.md` — inferred + Observed State section.
- `.rebuild/features/event-map.md` — interactive surface + verified events.
- `.rebuild/features/bundle-analysis.md` — Next.js confirmed.
- `.rebuild/features/acceptance-tests.md` — manual + automated + deep-probe results.
- `.rebuild/spec/video-editor-architecture.md` — independent rebuild architecture.
- `.rebuild/reports/feature-parity.md` — proof-of-reconstruction report.
- `.rebuild/reports/gaps.md` — known gaps.
- `.rebuild/tests/feature/*.json` — per-feature before/after evidence.
- `.harness/handoff.md` — this file.

## Next best actions

1. **Refine clip-drag selectors** with role/text heuristics; capture before/after.
2. **Manually upload a fixture** to the app and capture F024 waveform render evidence.
3. **Manually run an export** and capture F027 mp4 download evidence.
4. **Begin a separate rebuild run** — this harness run is observation only.
5. **Add per-feature parity specs** that target a future rebuilt app.

## Known blockers

- None blocking. The harness ran end-to-end on the demo URL.

## Verification status

See `.harness/verification.md` for the latest run results.