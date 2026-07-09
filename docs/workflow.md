# Workflow

End-to-end pipeline from a deployed owned/authorized app to a spec, parity
report, and rebuild plan.

## 1. Initialize

```bash
npm install
npx playwright install chromium
```

If either step fails, the harness still produces useful files; the failure
is recorded in `.harness/verification.md` and `.rebuild/reports/gaps.md`.

## 2. Capture (`npm run capture`)

Runs `scripts/capture-site.mjs` against
`https://demo.reactvideoeditor.com` at three viewports:

- desktop: `1440x900`
- laptop: `1280x800`
- mobile: `390x844`

For each viewport:

- Full-page screenshot + viewport screenshot.
- DOM summary (semantic, not raw HTML; truncated).
- Outer HTML only if reasonable size (< ~1.5 MB).
- Computed styles for top-level regions.
- CSS variables sample + top-color palette.
- Console messages.
- Sanitized network requests.
- localStorage / sessionStorage keys (truncated).
- IndexedDB database names + versions.
- Public JS/CSS asset URLs.

Outputs land in `.rebuild/reference/...`.

## 3. Probe (`npm run probe`)

Runs `scripts/probe-features.mjs` to:

- Identify interactive nodes (buttons, links, inputs, tabs, dialogs).
- Click non-destructive candidates that match safe text patterns
  ("demo", "sample", "add media", "export", etc.).
- Observe before/after URL, dialog visibility, storage deltas.
- Emit `.rebuild/features/event-map.md`, `feature-matrix.json`,
  `feature-inventory.md`, `user-flows.md`, `state-model.md`,
  `storage-model.md`, `api-contracts.md`.

Robust to selector changes — failures are logged, not fatal.

## 4. Bundle analysis (`npm run bundles`)

Reads `.rebuild/reference/bundles/bundles.json` and writes
`.rebuild/features/bundle-analysis.md` with:

- Counts (JS / CSS / WASM / Worker).
- Framework/library clues from URL patterns.
- Top bundle list.
- Source map presence (only if publicly delivered — no bypass).

## 5. Storage inspection (`npm run storage`)

Re-opens the app, snapshots storage, lists IndexedDB databases + versions.
Writes `.rebuild/features/storage-model.md` and
`.rebuild/reference/storage/storage-inspection.json`.

## 6. Reports (`npm run reports`)

Combines all artifacts into:

- `.rebuild/spec/visual-spec.md`
- `.rebuild/spec/interaction-spec.md`
- `.rebuild/spec/component-map.md`
- `.rebuild/spec/implementation-plan.md`
- `.rebuild/reports/gaps.md`
- `.rebuild/reports/final-research-summary.md`
- `.harness/handoff.md`

## 7. Tests (`npm test`)

Three Playwright specs:

- `tests/reference-capture.spec.mjs` — boots the target and records
  metadata.
- `tests/visual-baseline.spec.mjs` — captures baseline screenshots per
  viewport.
- `tests/feature-parity-plan.spec.mjs` — asserts surface discoverability
  (regions, controls, storage) without claiming parity.

## 8. Iterate

Each pass:

- Updates `.harness/progress.md`, `decisions.md`, `verification.md`,
  `handoff.md`, `features.json`.
- Appends to `.harness/session-log.jsonl`.

## Long-running support

If a session ends (context compaction, `/clear`), the next session reads
`.harness/handoff.md` first to pick up where the previous one stopped.

## What "done" means

This harness considers a feature **done** when:

1. Status in `.rebuild/features/feature-inventory.md` is `observed` or
   `inferred` (the latter only when explicitly justified).
2. At least one Playwright test or manual checklist covers it.
3. The implementation plan in `.rebuild/spec/implementation-plan.md`
   addresses it.

The overall project is **done** only when:

- Reference capture ran (or is clearly blocked and documented).
- Reports exist.
- Feature inventory exists.
- Gaps are documented.
- Handoff is updated.
- Verification status is recorded.