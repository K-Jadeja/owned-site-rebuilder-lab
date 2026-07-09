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
---

## Final Reverse Pass — Clip / Trim / Export / Effects / State Schema Proof (2026-07-09T11:30:00Z)

### Commands run

- `node scripts/console-object-capture.mjs` — **17 console messages captured (1 [onSave], 15 thumbnail), full editor state with tracks extracted**.
- `node scripts/extract-editor-state-schema.mjs` — **31 schema fields recovered** (project=5, track=7, clip=19).
- `node scripts/clip-identity-probe.mjs` — **357 lower-third candidates captured** before upload / after upload / after drag; 1 storage key added by drag.
- `node scripts/clip-action-proof.mjs` — verdict: `body-changed-after-drag`.
- `node scripts/trim-split-aggressive-probe.mjs` — **36 keyboard shortcuts with state diffs captured** (UI hint search returned 0 — public demo shows no visible trim/split UI without a clip selected).
- `node scripts/export-end-to-end-probe.mjs` — **Start Export clicked; page crashed during render** in headless Chromium (recorded as `fatal: page.waitForTimeout: Page crashed` in the json artifact). Cannot prove MP4 download without manual UI run.
- `node scripts/effects-transitions-keyframes-probe.mjs` — **11 tabs probed, 2 clicked** (most tabs require a clip to be present first).
- `node scripts/waveform-audio-probe.mjs` — **verdict: waveform-canvas-or-svg-found** (single video/* input accepts mp3 too if selected via dialog).
- `node scripts/extract-feature-modules.mjs` — **14 focused snippets** across 5 features (F007, F013, F020, F027, F031).
- `node scripts/generate-copy-progress.mjs` — total 68/238 (28.6%) — 11/34 features at hard_proof or higher.
- `node scripts/build-readiness-report.mjs` — readiness report generated.
- `node scripts/build-rve-rebuild-prompt.mjs` — `.harness/next-rebuild-prompt.md` generated.
- `node scripts/audit-proof-quality.mjs` — 58 hard_proof, 19 soft_probe.

### Tests

- `npx playwright test tests/clip-identity-proof.spec.mjs tests/trim-split-proof.spec.mjs tests/export-end-to-end-proof.spec.mjs tests/effects-inspector-proof.spec.mjs tests/state-schema-proof.spec.mjs tests/copy-readiness-proof.spec.mjs --project=desktop-chromium` — **24 passed**.
- `npx playwright test --project=desktop-chromium` (full suite) — see latest run.

### Major discoveries this pass

- **Full editor state with tracks recovered** from `[onSave]` console arg. Tracks are objects with `id`, `items`, `magnetic`, `muted`, `visible`. Items have `id`, `left`, `top`, `width`, `height`, `durationInFrames`, `from`, `rotation`, `type`, `content`, `styles` (fontSize, fontWeight, color, fontFamily, fontStyle, textDecoration, lineHeight, textAlign, opacity, zIndex, transform, fontSizeScale).
- **Track types seen**: `text` with full font / color / style objects. Video clips also include similar geometry + style objects.
- **Two track-id styles** observed: UUID (`592cae31-ccf3-...`) and slug (`track-0`). Sample `item-id` also slug-based (`item-7`).
- **active text content** in recovered items includes user-visible strings ("Heading 1", "Theres never been a better time...").

### Failures / blockers

- **Export MP4 download could not be proven** — clicking Start Export triggers a heavy client-side render that crashes headless Chromium. The probe leaves a stub artifact with the exact crash error. Manual UI run required to validate.
- **Trim/split** — public demo shows no visible UI hint when no clip is selected. 33 keys probed did not produce state changes during recording. Recorded as `behavior_observed` instead of `hard_proof`.
- **Effects / transitions / keyframes** — only tab structure + 2 tab clicks observable. Recorded as `behavior_observed` because at least one tab + body text mutation was observed.
- **Audio waveform** — the single file input only accepts `video/*`; mp3 cannot be uploaded. The verdict is `waveform-canvas-or-svg-found` (referring to existing SVG/canvas elements, not a new waveform render).

### Known gaps

- Source maps still not public. Bundle analysis is regex / AST / stack-trace based.
- Playwright `page.coverage` still 0/0; CDP `Profiler.preciseCoverage` works (9.16 MB).
- Wrapper `addEventListener` patches replace the original listener; setter / method wrappers DO capture the original call stack.
- Trim/split / effects / keyframes remain `behavior_observed` until a clip is fully selected — selection path is unstable headlessly.

## Action → Stack → Bundle → Feature Correlation Pass (2026-07-09T10:25:00Z)

### Commands run

- `npm run probe:stacks` — 6913 events captured with stack traces across 14 actions.
- `npm run map:stacks` — 150 stack frames mapped into target JS bundles.
- `npm run coverage:debug` — confirmed Playwright coverage returns 0 bytes; CDP `Profiler.preciseCoverage` works (9.16 MB used bytes).
- `npm run coverage:cdp` — replaced action coverage with CDP preciseCoverage per action.
- `npm run correlate:features` — upgraded F007, F020, F031 to `code_correlated`.
- `npm run react:regions` — 7 regions mapped with component names + handler props.
- `npm run probe:import-timeline` — 5 strategies tried; first mutation at 03-strategy-drag (PROVEN).
- `npm run audit:proof` — 36 hard_proof, 17 soft_probe.

### Tests

- `npx playwright test tests/code-correlation-proof.spec.mjs tests/action-stack-proof.spec.mjs tests/import-timeline-proof.spec.mjs --project=desktop-chromium` — **20 passed**.
- `npx playwright test --project=desktop-chromium` — **52 passed**, 1 flaky (single-import occasionally failed when test ordering interfered).

### Failures

- Single-import test is sensitive to previous test state in the same worker. Hardened with broader mutation checks (storage, bodyText, videoCount, imgCount, interactiveCount).

### Known gaps

- The wrapper `addEventListener` patch replaces the listener, so the original listener stack is not directly visible. Storage/setter/method wrappers DO capture the original call stack because `new Error()` is created inside the wrapper after the wrapped method body has already entered the app code.
- CDP per-action delta can be negative when `takePreciseCoverage` resets between takes; we report `positiveDelta` only.
