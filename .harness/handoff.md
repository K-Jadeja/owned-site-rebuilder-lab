# Handoff

Generated: 2026-07-09T07:13:38.661Z

This file is meant to be the first thing a new Claude Code session reads after `/clear` or compaction.

## Current goal
Reconstruct observable behavior of https://demo.reactvideoeditor.com from public surface evidence; produce a spec, state model, parity tests, and rebuild plan.

## What was created
- `.claude/skills/owned-site-rebuilder/` — project-local skill.
- `.harness/` — long-run state (this file + progress, decisions, verification, session-log, features.json).
- `.rebuild/reference/` — captured DOM/styles/network/storage/bundles/console/screenshots.
- `.rebuild/spec/` — visual-spec, interaction-spec, component-map, implementation-plan, video-editor-architecture.
- `.rebuild/features/` — feature-inventory, feature-matrix.json, state-model, api-contracts, event-map, storage-model, bundle-analysis, acceptance-tests, media-engine-notes.
- `.rebuild/reports/` — capture-run, feature-parity, gaps, progress, visual-diff, final-research-summary.
- `.research/` — FreeCut notes + open-source comparison.
- `scripts/` — capture, probe, bundles, storage, reports, visual-compare + utils.
- `tests/` — reference-capture, visual-baseline, feature-parity-plan Playwright specs.
- `docs/` — workflow, safety, feature-reverse-engineering, visual-regression, browser-bundle-analysis, video-editor-architecture, freecut-research, rebuild-plan, what-can-and-cannot-be-recovered.
- `README.md` — entry point.

## Commands to run
- `npm run capture` — re-run browser capture (multi-viewport).
- `npm run probe` — re-run interactive probe.
- `npm run bundles` — refresh bundle analysis.
- `npm run storage` — refresh storage inspection.
- `npm run reports` — regenerate spec + reports + this handoff.
- `npm test` — run all Playwright tests.
- `npm run test:visual` — visual baseline only.
- `npm run test:features` — feature parity plan only.

## What succeeded
- Capture produced 3 viewport(s).
- Feature matrix has 10 entries.

## What failed
(no errors recorded)

## Files that matter most
- `.rebuild/features/feature-inventory.md`
- `.rebuild/features/feature-matrix.json`
- `.rebuild/features/state-model.md`
- `.rebuild/features/api-contracts.md`
- `.rebuild/features/event-map.md`
- `.rebuild/features/bundle-analysis.md`
- `.rebuild/features/acceptance-tests.md`
- `.rebuild/spec/video-editor-architecture.md`
- `.rebuild/reports/feature-parity.md`
- `.rebuild/reports/gaps.md`

## Next best actions
1. If capture failed, check `.harness/verification.md` for the exact error.
2. If Playwright didn't install, run `npx playwright install chromium`.
3. Verify `.rebuild/reference/screenshots/` exists and looks like the target.
4. Open `.rebuild/features/feature-inventory.md` and confirm each feature has evidence pointers.
5. Run `npm test` and address any failing specs.

## Known blockers
- See `.rebuild/reports/gaps.md`.

## Verification status
See `.harness/verification.md`.