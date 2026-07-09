# Method

The work proceeds in six stages:

## Stage 1 — Surface capture

`scripts/capture-site.mjs` boots Playwright Chromium across 3 viewports
(desktop 1440×900, laptop 1280×800, mobile 390×844) and records DOM,
styles, network, storage names, bundle URLs, console, and screenshots.

## Stage 2 — Bundle fetch + index

`scripts/fetch-public-bundles.mjs` downloads the public JS/CSS
bundles. `scripts/scan-target-artifacts.mjs` runs a secrets scan +
license provenance pass and promotes audited bundles to
`.rebuild/target-source/bundles/`. `scripts/deep-bundle-analysis.mjs`
parses each bundle with `acorn` and extracts strings, identifiers,
URLs, and feature-keyword hits.

## Stage 3 — Runtime instrumentation

`scripts/runtime-instrumentation.mjs` patches `fetch`, `XHR`,
`localStorage`, `sessionStorage`, `history`, `IndexedDB`, and DOM
events. It captures storage mutations, fetch logs, console messages,
DOM mutation counts, and event traces.

## Stage 4 — Stack-trace instrumentation

`scripts/action-stack-trace-probe.mjs` installs `page.addInitScript`
wrappers that capture the call stack at every event handler
invocation, storage mutation, `URL.createObjectURL`, media play/
pause, canvas draw, and console call.

`scripts/map-stack-frames-to-bundles.mjs` resolves every captured
stack frame to a local bundle file under `.rebuild/target-source/
bundles/`, finds a snippet near the line:col, and extracts nearby
keywords.

`scripts/coverage-debug.mjs` + `scripts/action-coverage-cdp.mjs`
attempt Playwright `page.coverage` and fall back to CDP
`Profiler.startPreciseCoverage` with `detailed: true, callCount:
true`. In this environment Playwright coverage returns 0 bytes but
CDP coverage returns 9.16 MB used bytes across 35 entries.

## Stage 5 — Feature probes

`scripts/deep-probe.mjs` runs 10 feature-level probes (import, drag,
clip selection, etc.) with before/after screenshots. `scripts/
single-file-import-probe.mjs` uploads a single fixture. `scripts/
import-timeline-hardening.mjs` tries 5 strategies to add the imported
media to the timeline. `scripts/react-region-map.mjs` extracts
React component names + handler props per region.

## Stage 6 — Correlation engine + hard tests

`scripts/correlate-features-to-code.mjs` scores every feature on
runtime / stack / bundle-keyword / coverage / test evidence axes and
upgrades features to `code_correlated` only when all four criteria
agree.

`tests/code-correlation-proof.spec.mjs`, `tests/action-stack-proof.spec.mjs`,
`tests/import-timeline-proof.spec.mjs` are the new hard-proof specs.

## Summary

The pipeline is **action → stack → bundle → feature**. We wrap the
app's APIs, capture stack traces, map those traces to real bundle
snippets, and decide whether each feature is genuinely
`code_correlated` rather than just `surface_observed`.