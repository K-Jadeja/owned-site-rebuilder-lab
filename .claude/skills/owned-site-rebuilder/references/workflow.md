# Workflow — owned-site rebuilder

A linear pipeline with explicit evidence at each step. Capture before inference.

## Stages

1. **Scope**
   - Confirm target URL and authorization.
   - Read `.harness/handoff.md` for previous-session state.
   - Update `.harness/harness.json` if `target_url`, tool versions, or
     verification commands change.

2. **Static capture** (`scripts/capture-site.mjs`)
   - Visit target with Playwright Chromium at multiple viewports.
   - Screenshot each viewport.
   - Snapshot DOM (semantic summary + role/aria/landmark tree).
   - Snapshot computed styles for top-level regions and visible controls.
   - Capture all network requests (sanitized).
   - Capture console messages.
   - List public JS/CSS/asset URLs.
   - Snapshot localStorage / sessionStorage keys (sanitized).
   - List IndexedDB databases and object stores (no record dumps).
   - Write `.rebuild/reference/capture-summary.json` and
     `.rebuild/reports/capture-run.md`.

3. **Interactive probing** (`scripts/probe-features.mjs`)
   - Identify buttons, inputs, menus, toolbar controls, dialogs, tabs.
   - Click non-destructive controls; observe before/after DOM, URL, storage,
     network deltas.
   - Emit `.rebuild/features/event-map.md`, `.rebuild/features/feature-matrix.json`,
     `.rebuild/features/feature-inventory.md`, `.rebuild/features/user-flows.md`,
     `.rebuild/features/state-model.md`, `.rebuild/features/storage-model.md`,
     `.rebuild/features/api-contracts.md`.

4. **Bundle analysis** (`scripts/analyze-bundles.mjs`)
   - Read `.rebuild/reference/bundles/bundles.json`.
   - Identify JS/CSS/worker/WASM asset URLs.
   - Check whether source maps are publicly linked (do not bypass access
     controls; only record presence).
   - Infer framework clues from file names, chunk names, and visible globals.
   - Write `.rebuild/features/bundle-analysis.md`.

5. **Storage inspection** (`scripts/inspect-storage.mjs`)
   - Re-load the app and snapshot storage after one normal interaction cycle.
   - Compare pre/post snapshots to identify what the app writes.
   - Write `.rebuild/features/storage-model.md` and
     `.rebuild/reference/storage/storage-inspection.json`.

6. **Reports** (`scripts/generate-reports.mjs`)
   - Combine capture + probe + bundles + storage into:
     - `.rebuild/spec/visual-spec.md`
     - `.rebuild/spec/interaction-spec.md`
     - `.rebuild/spec/component-map.md`
     - `.rebuild/spec/implementation-plan.md`
     - `.rebuild/reports/gaps.md`
     - `.rebuild/reports/final-research-summary.md`
     - `.harness/handoff.md`

7. **Test execution** (`npm test`)
   - Run `tests/reference-capture.spec.mjs`,
     `tests/visual-baseline.spec.mjs`,
     `tests/feature-parity-plan.spec.mjs`.
   - Tests must run without login. If a test requires auth, mark it `skipped`
     and document why.

8. **Harness refresh**
   - Update `.harness/progress.md`, `decisions.md`, `verification.md`,
     `handoff.md`, `features.json`.
   - Append `.harness/session-log.jsonl`.

## When to stop and document gaps

Stop and write to `.rebuild/reports/gaps.md` if:

- The site requires login and no public surface is available.
- The site uses heavy anti-bot and Playwright is blocked.
- Network capture is empty (probably an error page or offline).
- The browser fails to launch (run `npx playwright install chromium`).

Never claim success when capture is empty. The harness is honest about
partial coverage; downstream rebuilders should know what is and is not
recoverable.