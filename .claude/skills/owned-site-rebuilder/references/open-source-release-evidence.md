# Open-Source Release Evidence

Reference for safely publishing the deep-decoupling evidence as part
of an open-source release.

The user owns or is authorized to analyze the target site. They
intend to open-source ReactVideoEditor and the reverse-engineering
lab. This document explains how to package the evidence safely.

## Goals of the public release

1. Show that Claude Code can reverse engineer observable product
   behavior from public browser-delivered assets.
2. Distinguish `surface_observed` from `hard_proof`.
3. Document the architecture well enough that an independent
   developer could reimplement the editor from scratch.
4. Avoid leaking private infrastructure, secrets, or third-party
   proprietary code.

## What is safe to publish

- Sanitized bundle URLs.
- SHA-256 fingerprints of public bundles.
- Bundle-string indexes (identifiers, keywords, embedded URLs).
- React component names.
- DOM landmarks and selectors.
- localStorage key names (not raw values from production data).
- IndexedDB database names (no records).
- Network request categories (document, static-js, …).
- Feature-level proofs and acceptance tests.
- The implementation plan for an independent rebuild.

## What must NOT be published

- ❌ Authorization headers, cookies, session tokens, API keys.
- ❌ Raw `localStorage` values that contain user-specific data.
- ❌ Raw IndexedDB record contents.
- ❌ Source maps if the upstream project has not released them.
- ❌ Third-party proprietary code (full bundles verbatim when they
  contain non-Apache / non-MIT / non-permissive licensed code).
- ❌ Anything that reconstructs a private backend the user does not
  own.

## Promotion rule (private → target-source)

A bundle may be promoted from `.rebuild/private/bundles/` to
`.rebuild/target-source/bundles/` only when **all** of these pass:

1. The bundle URL is on the user-owned origin or is otherwise
   publicly accessible without auth.
2. The SHA-256 is recorded in
   `.rebuild/target-source/manifests/public-bundle-manifest.json`.
3. The secrets scanner finds zero high-severity matches.
4. The license/provenance pass identifies major third-party
   libraries and produces a report at
   `.rebuild/target-source/reports/license-provenance-report.md`.
5. The commit-eligibility report marks the file as `eligible`.

## License attribution

The license report must call out, where identifiable:

- React (MIT)
- Next.js (MIT)
- Zustand (MIT)
- Radix UI (MIT)
- Tailwind (MIT)
- Supabase client (MIT)
- Pexels (CC0)
- Anything else detected by the bundle scanner

If a bundle contains code with no identifiable license header, the
report must say so and recommend `manual review`.

## Paper / evidence pack

A paper directory should be created at the top level of the repo:

```
paper/
  README.md
  outline.md
  method.md
  evidence-table.md
  limitations.md
  reproducibility.md
  figures.md
  appendix-bundle-analysis.md
  appendix-runtime-instrumentation.md
  appendix-feature-probes.md
```

The paper must:

- Not claim hidden backend recovery.
- Not claim pixel-perfect or feature-perfect parity.
- Distinguish `surface_observed` from `hard_proof` for every claim.
- Document known failures and known gaps.
- Provide a one-command reproducibility recipe.

## Reproducibility recipe (mandatory)

A reviewer should be able to run:

```bash
npm install
npx playwright install chromium
npm run capture
npm run probe
node scripts/deep-probe.mjs
npm run fetch:bundles
npm run analyze:deep-bundles
npm run instrument:runtime
npm run coverage:actions
npm run probe:single-import
npm run mine:selectors
npm run decode:state
npm run audit:proof
npm run scan:target
npm run reports
npm test
```

…and reproduce every claim in the paper within ~30 minutes on a
modern laptop.

## Failure disclosure

Any feature marked `blocked` or `not_found` must be disclosed in
`paper/limitations.md`. No silent omissions.