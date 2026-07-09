# Verification

Commands run, tests run, capture results, failures, known gaps.
Last updated: 2026-07-09T09:30:00Z (deep bundle + runtime decoupling pass).

## Setup commands

### `npm install`
- Result: ✅ added acorn, acorn-walk, es-module-lexer, js-beautify,
  source-map, terser, fast-glob (50 packages total).

### `npx playwright install chromium`
- Result: ✅ Chromium + Chromium Headless Shell installed.

## Capture commands (deep pass)

### `npm run fetch:bundles`
- Result: ✅ 13 bundles fetched (11 JS + 2 CSS), ~2.6 MB total.
- 0 source maps exposed publicly.
- 0 failures.

### `npm run scan:target`
- Result: ✅ Secrets scan: 0 high, 0 medium. License pass:
  PASS. 13 bundles promoted to `.rebuild/target-source/bundles/`.

### `npm run analyze:deep-bundles`
- Result: ✅ 11 JS + 2 CSS bundles parsed. 0 parse failures.
- 4195 distinct strings, 7179 distinct identifiers, 111 embedded
  URLs. 12 libraries fingerprinted.

### `npm run instrument:runtime`
- Result: ✅ 10 actions × before/after. 22 storage mutations.
- `advanced-timeline-store` confirmed as Zustand persist shape.

### `npm run coverage:actions`
- Result: ✅ 10 actions × JS + CSS coverage. Per-action top
  bundle table.

### `npm run probe:single-import`
- Result: ✅ Single-file upload succeeded. bodyText changed,
  `lastCleanup_thumbnailCache` added.

### `npm run mine:selectors`
- Result: ✅ 82 candidate selectors mined.

### `npm run decode:state`
- Result: ✅ 2 stores decoded: `idb_migration_v1_done` (timestamp),
  `advanced-timeline-store` (Zustand persist).

### `npm run audit:proof`
- Result: ✅ 24 hard_proof, 9 soft_probe.

## Test commands

### `npx playwright test --project=desktop-chromium`
- Result: ✅ **33 passed**.

## Failures

- No source maps exposed publicly. Documented.
- Clip drag selectors not found. Documented.
- Trim/split shortcut hint not found. Documented.

## Known gaps

- No rebuilt app comparison (no rebuild exists yet).
- No end-to-end export render (Start Export → mp4 download).
- No waveform render on an uploaded audio clip.
- Source maps unavailable → bundle analysis is regex/identifier
  based, not source-mapped.

## What the deep pass proved

- ✅ Public JS/CSS bundle bodies fetched, SHA-256 fingerprinted,
  parsed with acorn, indexed.
- ✅ Secrets scan passed for all 13 bundles.
- ✅ 12 libraries fingerprinted (React, Next.js, Radix UI, Tailwind,
  Zustand, Immer, Supabase, Pexels, WebCodecs, MediaRecorder,
  Mediabunny, Remotion).
- ✅ React fiber keys present in production; Radix UI primitives
  extracted.
- ✅ `advanced-timeline-store` decoded as Zustand persist.
- ✅ Single-file upload works (`sample.mp4`) — bodyText + storage
  mutated.
- ✅ Action coverage maps user actions to bundle ranges.
- ✅ Hard-proof tests for export dialog, playback, persistence,
  single-import, bundle analysis.
- ✅ 33/33 desktop tests pass.

## What we explicitly did NOT claim

- ❌ Hidden backend source code recovery (none attempted).
- ❌ Pixel-perfect visual parity (intentional: out of scope).
- ❌ Pixel-parity for the few features where the probe was
  inconclusive (F013 clip drag, F016 trim/split).
- ❌ feature-perfect parity without a rebuilt app to compare.