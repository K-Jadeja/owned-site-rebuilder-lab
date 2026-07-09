# Paper — Observable Feature Reverse Engineering of an Owned Browser Video Editor Using Claude Code

This directory contains the paper / open-source evidence pack for the
deep bundle + runtime decoupling pass.

The paper frames the work as a **research artifact**: a reproducible
workflow for turning an owned, deployed browser app into feature
specs, runtime evidence, bundle-code clues, and hard tests.

## What this paper does NOT claim

- ❌ It does not claim hidden backend source code recovery.
- ❌ It does not claim pixel-perfect or feature-perfect parity.
- ❌ It does not bypass authentication or scrape private user data.
- ❌ It does not copy third-party proprietary code.

## What this paper DOES claim

- ✅ A reproducible workflow that turns an owned deployed browser app
  into spec + state model + acceptance tests + bundle/runtime/state
  evidence, driven by Claude Code.
- ✅ A strict proof-level ladder that distinguishes `hard_proof` from
  `surface_observed` from `inferred_from_bundle`.
- ✅ Public JS bundle bodies fetched and indexed (acorn + es-module-lexer).
- ✅ Per-action Playwright JS/CSS coverage maps user actions to bundle
  ranges.
- ✅ Runtime instrumentation patches `fetch` / XHR / `localStorage` /
  `sessionStorage` / `history` / `indexedDB` inside the live app.
- ✅ 33/33 desktop Playwright tests pass.

## Files

- `outline.md` — paper outline
- `method.md` — methodology
- `evidence-table.md` — per-claim evidence
- `limitations.md` — known gaps
- `reproducibility.md` — recipe
- `figures.md` — figure index
- `appendix-bundle-analysis.md` — bundle deep-dive
- `appendix-runtime-instrumentation.md` — runtime deep-dive
- `appendix-feature-probes.md` — feature-level deep-dive

The headline numbers (this run):

- 13 public bundles fetched (11 JS + 2 CSS), 0 source maps exposed.
- 12 libraries fingerprinted.
- 40+ feature keyword hits across bundles.
- 10 actions covered with JS + CSS coverage.
- 9 features at `hard_proof`, 6 at `behavior_observed`, 6 at
  `surface_observed`, 8 at `inferred_from_bundle`, 1 at `fixture_ready`,
  4 at `not_found`.
- 0 secrets findings; 13 bundles promoted to `target-source`.
- 33/33 desktop Playwright tests pass.