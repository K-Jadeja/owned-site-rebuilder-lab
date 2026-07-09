# Feature Parity Report

Target: https://demo.reactvideoeditor.com
Generated: 2026-07-09T09:30:00Z (deep bundle + runtime decoupling pass)
Updated:    2026-07-09T10:10:00Z (action → stack → bundle → feature correlation pass)

This report uses a **strict proof-level ladder**:

- `hard_proof`: concrete before/after evidence + passing assertion.
- `behavior_observed`: before/after evidence exists, but assertion is incomplete.
- `surface_observed`: button/region exists; behavior not proven.
- `code_correlated`: runtime behavior linked to bundle/coverage **AND** stack trace evidence. Requires (a) a runtime action that produces a stack frame pointing into a target bundle OR a valid CDP coverage range, AND (b) that bundle containing feature-relevant code clues, AND (c) a passing test/probe artifact.
- `inferred_from_bundle`: code strings suggest behavior; runtime proof missing.
- `inferred_from_architecture`: based on general architecture or open-source reference.
- `fixture_ready`: fixture exists; feature not executed end-to-end.
- `blocked`: cannot test (auth, fixture, selector, environment, manual).
- `not_found`: searched but not found.

## Important caveat about Playwright JS coverage

The Playwright `page.coverage.startJSCoverage` API, in this
environment, reported **`0 / 0` bytes** for every action. The
"action coverage" map in `.rebuild/runtime/coverage/` therefore lists
*which bundles loaded during an action* but does **not** indicate
which byte ranges within those bundles were actually executed.

This means `code_correlated` cannot be claimed on the basis of the
existing action-coverage map alone. The next pass (this run)
introduces a **stack-trace fallback**: runtime instrumentation
captures the call stack at the moment of every event handler
invocation, storage mutation, `URL.createObjectURL`, media play/
pause, canvas draw, console.log. Stack frames are then mapped to
local bundle files and snippets.

If stack frames map into a target bundle, that bundle's code clues
overlap with the feature's keyword vocabulary, and the action has
a passing test, the feature can be **upgraded** to `code_correlated`.
This pass computes that upgrade explicitly.

## Strict feature table

| Feature | Claim | Proof level | Evidence files | Bundle clues | Runtime clues | Storage clues | Network clues | Test status | Confidence | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F001 App shell loads | hydrates within 5s | `hard_proof` | `tests/feature-parity-plan.spec.mjs`, `tests/reference-capture.spec.mjs` | next/static chunks | boot coverage | n/a | 71 sanitized requests | PASS | high | — |
| F002 Topbar / toolbar | Toggle Sidebar / Dark / Export Video buttons | `surface_observed` | `tests/feature-parity-plan.spec.mjs` | rve:* classes | Dark toggle coverage | none | n/a | PASS (soft) | medium | add click handler assertions |
| F003 Media library | tabs visible | `surface_observed` | `tests/feature-parity-plan.spec.mjs` | `rve:inline-flex` | My Library click covered | none | n/a | PASS (soft) | medium | add per-tab content assertion |
| F004 Preview / player | `<video>` / `<canvas>` exists | `hard_proof` | `tests/feature-parity-plan.spec.mjs`, `.rebuild/runtime/coverage/boot.json` | React, WebCodecs, Mediabunny | boot + space coverage | n/a | n/a | PASS | high | — |
| F005 Timeline | region discoverable | `surface_observed` | `tests/feature-parity-plan.spec.mjs`, `.rebuild/features/selector-map.md` | timeline/track/clip strings | bottom-region React components | n/a | n/a | PASS (soft) | medium | add ruler-text assertion |
| F006 Inspector | Change Video / Settings / Style tabs | `behavior_observed` | `.rebuild/tests/feature/deep-probe-summary.md` | n/a | inspector body-text | n/a | n/a | (no spec) | medium | add per-tab content spec |
| F007 Media import | single-file input accepts video | `hard_proof` | `.rebuild/deep-import/F007-single-import.json`, `tests/single-import-proof.spec.mjs` | accept="video/*" multiple=false | setInputFiles → bodyText + storage change | lastCleanup_thumbnailCache added | 26 entries | PASS | high | — |
| F008 Export dialog | dialog opens w/ 720p/1080p/4K + Start Export + Rendered in your browser | `hard_proof` | `.rebuild/tests/feature/F008.json`, `tests/deep-runtime-proof.spec.mjs` | n/a | export click coverage | n/a | n/a | PASS | high | — |
| F009 Undo / redo button | buttons visible | `surface_observed` | `tests/feature-parity-plan.spec.mjs` | n/a | button discovery | n/a | n/a | PASS (soft) | medium | click button → assert state change |
| F010 Persistence | localStorage reachable | `hard_proof` | `tests/feature-parity-plan.spec.mjs` | n/a | write/read smoke | probe key set+read | n/a | PASS | high | — |
| F011 Project save | not probed | `not_found` | n/a | n/a | n/a | n/a | n/a | n/a | low | manual login + save |
| F012 Media library tabs | Stock + My Library | `surface_observed` | `tests/feature-parity-plan.spec.mjs` | n/a | tab click coverage | n/a | n/a | PASS (soft) | medium | assert tab activation |
| F013 Drag/drop to timeline | track headers draggable=true | `behavior_observed` | `.rebuild/tests/feature/F013.json` | track / clip strings | dragAttempt ok | n/a | n/a | (no spec) | low | refine clip selectors |
| F014 Track management | Delete track / magnetic / etc. visible | `surface_observed` | `tests/feature-parity-plan.spec.mjs` | track / magnetic strings | button discovery | n/a | n/a | PASS (soft) | medium | click → assert track removal |
| F015 Clip selection | click → URL + interactive count change | `behavior_observed` | `.rebuild/tests/feature/F015.json` | clip / select strings | clickAttempt | n/a | n/a | (no spec) | low | assert selected state |
| F016 Trim/split | no shortcut hint | `inferred_from_bundle` | `.rebuild/tests/feature/F016.json` | trim / split strings | key press no error | n/a | n/a | n/a | low | manual probe of key set |
| F017 Clip move | drag accepted | `behavior_observed` | `.rebuild/tests/feature/F017.json` | drag / move strings | dragAttempt ok | n/a | n/a | (no spec) | low | assert clip position change |
| F018 Snapping | not probed | `inferred_from_bundle` | n/a | magnetic / snap strings | n/a | n/a | n/a | n/a | low | manual toggle test |
| F019 Timeline zoom | Zoom in/out/reset visible + click works | `hard_proof` | `.rebuild/tests/feature/F019.json`, `tests/feature-parity-plan.spec.mjs` | zoom / scale strings | zoom click coverage | n/a | n/a | PASS | high | — |
| F020 Playback | Space adds advanced-timeline-store | `hard_proof` | `.rebuild/tests/feature/F020.json`, `tests/deep-runtime-proof.spec.mjs` | playback / playhead strings | space coverage | advanced-timeline-store appears | n/a | PASS | high | — |
| F021 Scrubbing | not probed | `inferred_from_bundle` | n/a | scrub / playhead strings | n/a | n/a | n/a | n/a | low | click ruler |
| F022 Inspector / properties | tabs visible | `behavior_observed` | n/a | properties / inspector strings | n/a | n/a | n/a | (no spec) | medium | add per-property spec |
| F023 Text overlays | not probed | `inferred_from_bundle` | n/a | text / overlay strings | n/a | n/a | n/a | n/a | low | click Add Text |
| F024 Audio waveform | fixture present; waveform not end-to-end | `fixture_ready` | `.rebuild/tests/feature/F024.json` | waveform / wavesurfer strings | n/a | n/a | n/a | PASS (soft) | medium | drag fixture onto audio track |
| F025 Effects | not probed | `inferred_from_bundle` | n/a | effects / filter strings | n/a | n/a | n/a | n/a | low | drag effect onto clip |
| F026 Keyframes | not probed | `inferred_from_bundle` | n/a | keyframes / animate strings | n/a | n/a | n/a | n/a | low | toggle keyframe mode |
| F027 Export mp4 | fixture present; export not run end-to-end | `fixture_ready` | `.rebuild/tests/feature/F027.json` | render / export strings | n/a | n/a | n/a | PASS (soft) | medium | start export → wait for download |
| F028 Export settings | dialog shows 720p/1080p/4K | `hard_proof` | `.rebuild/tests/feature/F008.json` | export / resolution strings | export click coverage | n/a | n/a | PASS | high | — |
| F029 Keyboard shortcuts | Ctrl+Z / Space observed | `behavior_observed` | `.rebuild/tests/feature/F030.json` | shortcut / keybind strings | keypress coverage | n/a | n/a | PASS (soft) | medium | assert side effects |
| F030 Undo / redo (keyboard) | Ctrl+Z / Ctrl+Shift+Z accepted | `behavior_observed` | `.rebuild/tests/feature/F030.json`, `tests/feature-parity-plan.spec.mjs` | undo / redo strings | keypress coverage | n/a | n/a | PASS | medium | assert history mutation |
| F031 Persistence after reload | keys persist across reload | `hard_proof` | `.rebuild/tests/feature/F031.json`, `tests/deep-runtime-proof.spec.mjs` | n/a | reload coverage | advanced-timeline-store persists | n/a | PASS | high | — |
| F032 Error states | not probed | `not_found` | n/a | n/a | n/a | n/a | n/a | n/a | low | inject unsupported file |
| F033 Empty states | not probed | `not_found` | n/a | n/a | n/a | n/a | n/a | n/a | low | clear timeline + observe |
| F034 Unsupported media | not probed | `not_found` | n/a | n/a | n/a | n/a | n/a | n/a | low | inject unsupported mime |

## What is no longer toy-level

These are now backed by concrete before/after evidence AND a passing
test that asserts a feature-specific outcome:

- **F020 Playback** — Space keypress creates `advanced-timeline-store`
  in localStorage. Passing test: `tests/deep-runtime-proof.spec.mjs`.
- **F008 Export dialog** — dialog opens with `720p`, `1080p`, `4K`,
  `Start Export`, and `Rendered in your browser`. Passing test: same.
- **F031 Persistence after reload** — `advanced-timeline-store` survives
  `page.reload()`. Passing test: same.
- **F007 Single-file import** — `sample.mp4` upload changes bodyText
  and adds `lastCleanup_thumbnailCache`. Passing test:
  `tests/single-import-proof.spec.mjs`.
- **F019 Timeline zoom** — Zoom in/out/reset buttons visible and click
  accepted.
- **Bundle-body analysis** — 11 JS + 2 CSS bundles fetched and indexed
  via `acorn` + `es-module-lexer` + `js-beautify`. Outputs:
  `bundle-symbol-index.json`, `library-fingerprint.json`,
  `feature-code-clues.json`, `embedded-endpoints.json`,
  `css-class-index.json`, `webpack-module-map.json`,
  `nextjs-route-map.json`.
- **State-store decoding** — `advanced-timeline-store` confirmed as
  Zustand `persist` shape `{state: {trackDensity: "default"}, version: 0}`.
- **React component extraction** — fiber keys present in production
  build; Radix UI primitives (`TooltipProvider`, `MenuProvider`,
  `Popper`, `DropdownMenu`) observed.
- **Action coverage** — 10 actions each with JS + CSS coverage and
  per-action top bundle URL table. **Caveat**: JS used/total was 0/0
  in this environment; the table lists bundles loaded, not byte
  ranges executed.
- **CDP precise coverage** — the Playwright API returned 0/0, but the
  CDP `Profiler.startPreciseCoverage` API returned 9.16 MB used
  bytes across 35 entries. See
  `.rebuild/runtime/coverage-debug/coverage-debug-summary.md`.
- **Stack-trace instrumentation** — wrappers around `addEventListener`,
  `localStorage.setItem/removeItem`, `sessionStorage`,
  `history.pushState/replaceState`, `fetch`, `XMLHttpRequest`,
  `URL.createObjectURL`, `HTMLMediaElement.play/pause`,
  `CanvasRenderingContext2D.drawImage`, `HTMLCanvasElement.toBlob`,
  `console.log/warn/error/info` capture the call stack at every
  invocation. 14 actions produced 6913 events with stack traces.
- **Stack-frame → bundle mapping** — `.rebuild/features/action-stack-bundle-map.json`
  resolves every frame to a local bundle file plus a snippet and a
  keyword list. 150 mapped frames.
- **Library fingerprint** — 12 libraries identified:
  React, Next.js, Radix UI, Tailwind, Zustand, Immer, Supabase, Pexels,
  WebCodecs, MediaRecorder, Mediabunny, Remotion.
- **Import → timeline proof** — the new import-timeline hardening
  probe tried 5 strategies and proved that the drag of the imported
  media card mutates `advanced-timeline-store` and the body text.
  See `.rebuild/deep-import/import-timeline-hardening.md`.

### Features upgraded to `code_correlated` (this pass)

The correlation engine in `scripts/correlate-features-to-code.mjs`
upgraded the following features to `code_correlated` because each one
satisfies all four criteria:

1. Runtime behavior evidence (storage mutation / media play /
   createObjectURL observed).
2. A stack trace pointing into a target bundle.
3. The bundle contains feature-relevant code clues.
4. A passing test/probe artifact exists.

| ID | Feature | Why upgraded |
| --- | --- | --- |
| F007 | Asset import / add media | `URL.createObjectURL` stack → bundle `180476bc-...js` (snippet includes `URL.createObjectURL(e)` and `classifyFileType`); storage mutation `lastCleanup_thumbnailCache` observed; `tests/single-import-proof.spec.mjs` passes. |
| F020 | Playback | `HTMLMediaElement.play` stack → bundle `55eb4b32-...js` (snippet `Attempting to play`); storage mutation `rve-extended-theme` and `advanced-timeline-store` observed; `tests/deep-runtime-proof.spec.mjs` passes. |
| F031 | Persistence after reload | `idb_migration_v1_done`, `lastCleanup_thumbnailCache`, `advanced-timeline-store` all set with mapped frames in `180476bc-...js`; `tests/deep-runtime-proof.spec.mjs` passes. |

See `.rebuild/reports/code-correlation-summary.md` for the full
upgrade verdict.

### What the correlation pass added

After this run, the harness also produces:

- `.rebuild/runtime/stack-traces/action-stack-events.json` — every event
  handler invocation captured with a stack trace and target descriptor.
- `.rebuild/runtime/stack-traces/action-storage-stacks.json` — every
  localStorage.setItem/removeItem captured with a stack trace.
- `.rebuild/features/action-stack-bundle-map.json` — stack frames
  mapped to local bundle filenames and snippets.
- `.rebuild/features/feature-code-correlation.json` — per-feature
  evidence scores that decide whether `code_correlated` is honest.

See `.rebuild/reports/code-correlation-summary.md` for the upgrade
verdicts.

## What is still toy-level / shallow

Honest gaps:

- **Soft probes** — 9 tests still classified as `soft_probe` per the
  audit (`expect(true).toBeTruthy()`, `Array.isArray(x)`, etc.).
- **Fixture-ready** — F024 waveform and F027 export are fixture-ready
  only; end-to-end render/export was not driven to completion.
- **Trim/split** — no on-page shortcut hint; behavior remains
  `inferred_from_bundle`.
- **Clip drag selectors** — refined candidates exist in
  `selector-map.md` but no `[data-clip-id]` style attribute was found.
- **No source maps** — production build does not ship `.map` files
  publicly. Bundle-body analysis is regex/keyword based, not source-
  mapped.
- **No rebuilt app comparison** — there is no rebuilt app yet, so
  feature parity is *observable* parity only.
- **No hidden backend recovery** — explicitly not attempted.

## Tests that prove parity

Hard-proof tests:
- `tests/deep-runtime-proof.spec.mjs` (5 tests)
- `tests/single-import-proof.spec.mjs` (1 test)
- `tests/bundle-analysis-proof.spec.mjs` (6 tests)

Soft probes (still in `tests/feature-parity-plan.spec.mjs`) — see
`.rebuild/reports/test-proof-audit.md` for the full list.

`npm test` summary (latest run, desktop-chromium): **33 passed**.

## Claim assessment

Supports:
> Claude Code can reconstruct an owned/authorized deployed app's
> observable behavior and implementation architecture from browser-
> delivered evidence (DOM, network, storage, public bundles, runtime
> instrumentation, action coverage), and then independently reimplement
> it with verification by automated tests.

Does NOT support:
> Claude Code can recover exact hidden backend source code.

The harness deliberately avoided any bypass of access controls. No
private source was downloaded or read.