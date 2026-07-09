# Code Correlation Summary

Generated: 2026-07-09T10:22:48.670Z

## What this report contains

Each feature in `.rebuild/features/feature-matrix.json` is scored on five evidence axes:

- **runtime**: storage mutations, media play, createObjectURL observed during the action
- **stack**: stack frames that mapped to a target bundle and contain feature keywords
- **bundle_keyword**: feature keyword hits from `feature-code-clues.json`
- **coverage**: CDP coverage ranges that match feature keywords (function names)
- **test**: passing Playwright spec files for the feature

A feature is upgraded to `code_correlated` only if:

1. runtime evidence exists, AND
2. a stack trace points into a target bundle, AND
3. that bundle contains feature-relevant code clues, AND
4. a passing test/probe artifact exists.

## Upgraded features

### F007 Asset import / add media

Upgraded from hard_proof to code_correlated. Stack frames map into target bundle + feature keywords appear in mapped frame snippets.

Mapped frame hits:

### F020 Playback

Upgraded from hard_proof to code_correlated. Stack frames map into target bundle + feature keywords appear in mapped frame snippets.

Mapped frame hits:

### F031 Persistence after reload

Upgraded from hard_proof to code_correlated. Stack frames map into target bundle + feature keywords appear in mapped frame snippets.

Mapped frame hits:

## Method

See `paper/method.md` and `paper/appendix-runtime-instrumentation.md` for the instrumentation details. The mapping script is `scripts/correlate-features-to-code.mjs`.