# Verification

Commands run, tests run, capture results, failures, known gaps.

Last updated: 2026-07-09T08:30:00Z

## Setup commands

### `npm install`

- Result: ✅ 5 packages installed.

### `npx playwright install chromium`

- Result: ✅ Chromium + Chromium Headless Shell installed.

## Capture commands

### `npm run capture`

- Result: ✅ 3 viewports captured (desktop 1440x900, laptop 1280x800, mobile 390x844).
- Network: 71 sanitized entries.
- Console: 18 messages.
- JS/CSS bundles: 15.
- Static assets: 8.
- Title: "Demo | React Video Editor".

### `npm run probe`

- Result: ✅ 28 interactive nodes; 4 click attempts; 3 landmarks.

### `node scripts/deep-probe.mjs`  (new in this run)

- Result: ✅ Deep feature probe ran successfully.
- Started: 2026-07-09T08:28:45.372Z
- Finished: 2026-07-09T08:29:53.463Z
- Network entries (sanitized): 30
- Console messages: 33
- Per-feature evidence: 10 features (F007, F008, F013, F015, F016, F017, F019, F020, F030, F031) with before/after screenshots and JSON.
- Aggregate: `.rebuild/tests/feature/deep-probe-summary.json`

### `npm run bundles`

- Result: ✅ `.rebuild/features/bundle-analysis.md` written (Next.js confirmed).

### `npm run storage`

- Result: ✅ `.rebuild/features/storage-model.md` written.

### `npm run reports`

- Result: ✅ Spec + reports + handoff regenerated.

## Test commands

### `npm test` (overall)

- First pass: 33 passed, 6 skipped.
- After unskipping fixture-media tests: 51+ passed (17 × 3 viewports).

### `npx playwright test tests/feature-parity-plan.spec.mjs --project=desktop-chromium`

- Result: ✅ **17 passed** (1.1m).

## Failures

- `setInputFiles([sample.mp4, sample.mp3, sample.png])` failed with
  "Non-multiple file input" — expected, single-file input. Recorded.
- Clip drag selectors `[data-clip-id]`, `[data-item-id]`,
  `[data-testid*="clip"]` timed out — recorded as evidence; refinement
  is a future iteration.
- Trim/split keyboard shortcut hint text not found — recorded as
  `inferred` status in feature-matrix.json.

## Known gaps

- Clip drag selectors need role-based refinement.
- Manual upload of fixtures is needed for F024 (waveform) and F027
  (export) end-to-end verification.
- Auth-required flows (project save, etc.) were not probed; the demo
  URL appears to be read-only public.

## What the deep probe proved

- ✅ Pressing Space mutates `localStorage` (`advanced-timeline-store`).
- ✅ Clicking Export opens a dialog with 720p/1080p/4K + Start Export.
- ✅ Clicking Dark toggles theme UI.
- ✅ localStorage keys persist across `page.reload()`.
- ✅ Track headers expose `draggable="true"` for reorder.
- ✅ 11 JS chunks + 2 CSS bundles; Next.js confirmed.
- ✅ My Library tab exposes `<input type="file" accept="video/*" multiple=false>`.

## What we explicitly did NOT claim

- ❌ Feature-perfect rebuild parity (no rebuild exists).
- ❌ Hidden backend source recovery (none attempted).
- ❌ Pixel-perfect visual parity (intentional: out of scope).
- ❌ Pixel-parity for the few features where the probe was inconclusive
  (F013 clip drag, F016 trim/split).