# Method

The work proceeds in five stages:

## Stage 1 — Surface capture

`scripts/capture-site.mjs` boots Playwright Chromium across 3 viewports
(desktop 1440×900, laptop 1280×800, mobile 390×844) and records:

- DOM semantic tree
- Computed styles + CSS variables
- Sanitized network requests
- Storage names (localStorage, sessionStorage, IndexedDB)
- Bundle URLs (CSS + JS + workers + WASM)
- Console messages
- Screenshots (per viewport)

This is the foundation layer. Every later stage builds on it.

## Stage 2 — Bundle fetch + index

`scripts/fetch-public-bundles.mjs` downloads the JS/CSS bundles the
browser already received. Each bundle is SHA-256 fingerprinted and
recorded in `manifest.json`.

`scripts/scan-target-artifacts.mjs` then runs a secrets scan + license
provenance pass. On pass, audited bundles are copied to
`.rebuild/target-source/bundles/` for commit eligibility.

`scripts/deep-bundle-analysis.mjs` parses each bundle with `acorn`,
extracts string literals, identifiers, object keys, embedded URLs,
and feature-keyword hits. Output: `bundle-symbol-index.json`,
`library-fingerprint.json`, `feature-code-clues.json`, etc.

## Stage 3 — Runtime instrumentation

`scripts/runtime-instrumentation.mjs` uses `page.addInitScript` to
patch `fetch`, `XMLHttpRequest`, `localStorage`, `sessionStorage`,
`history.pushState/replaceState`, `indexedDB.open/deleteDatabase`,
and a long list of DOM events. It then drives 10 safe actions and
captures before/after snapshots, storage deltas, network deltas,
event traces, and console messages.

`scripts/action-coverage-map.mjs` runs the same 10 actions with
Playwright JS + CSS coverage enabled and produces a per-action top-
bundle table.

`scripts/react-component-probe.mjs` extracts React component names
from the production build via `__reactFiber$...` element properties.

## Stage 4 — Feature probes

`scripts/deep-probe.mjs` runs 10 feature-level probes (import, drag/
drop, clip selection, clip move, trim/split, zoom, playback,
undo/redo, export, persistence-after-reload) with before/after
screenshots and JSON evidence.

`scripts/single-file-import-probe.mjs` uploads a SINGLE fixture
(sample.mp4) into the app's single-file input, the previous-run
bug being fixed.

`scripts/selector-miner.mjs` mines candidate clip/track/playhead
selectors from the live DOM.

`scripts/decode-state-stores.mjs` parses localStorage JSON values
and classifies them (Zustand persist, scalar, etc.).

## Stage 5 — Hard tests

`tests/feature-parity-plan.spec.mjs` is the surface-level spec.

`tests/deep-runtime-proof.spec.mjs`, `tests/single-import-proof.spec.mjs`,
and `tests/bundle-analysis-proof.spec.mjs` are the hard-proof
specs.

`scripts/audit-proof-quality.mjs` walks every test in the repo and
classifies it as `hard_proof` or `soft_probe` based on its assertion
shape.

The output is `.rebuild/reports/test-proof-audit.md`.