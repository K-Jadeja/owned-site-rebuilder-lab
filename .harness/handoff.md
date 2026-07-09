# Handoff

Generated: 2026-07-09T11:30:00Z (final reverse pass)

## Current goal

Reconstruct observable behavior of https://demo.reactvideoeditor.com
from public surface evidence (DOM, network, storage, public bundles)
into a spec, state model, acceptance tests, and rebuild plan.

This run was the **Final Reverse Pass — Clip / Trim / Export /
Effects / State Schema Proof** per the operating philosophy in
`.claude/skills/owned-site-rebuilder/SKILL.md`. No rebuild was built
in this run.

### What changed in this run

- Skill: Complete RVE Copy Evidence Mode + Rebuild Gate + Copy
  progress scale added.
- New scripts: console-object-capture, extract-editor-state-schema,
  clip-identity-probe, clip-action-proof, trim-split-aggressive-probe,
  export-end-to-end-probe, effects-transitions-keyframes-probe,
  waveform-audio-probe, extract-feature-modules,
  generate-copy-progress, build-readiness-report,
  build-rve-rebuild-prompt (12 new scripts).
- New tests: clip-identity-proof, trim-split-proof,
  export-end-to-end-proof, effects-inspector-proof,
  state-schema-proof, copy-readiness-proof (6 new spec files;
  24 new tests).
- **Major finding**: full editor state with tracks recovered from
  `[onSave]` console argument. 31 schema fields extracted across
  project / track / clip tiers.
- 11 / 34 features at hard_proof or higher.

### Next best action

Start `apps/rve-rebuild/` using `.harness/next-rebuild-prompt.md`.

**Carried-over previous handoff content:**

---

Generated: 2026-07-09T09:30:00Z (deep bundle + runtime decoupling pass)


## What this run produced

### Skill patch
- `.claude/skills/owned-site-rebuilder/SKILL.md` now has a `Deep
  Bundle + Runtime Decoupling Mode` section + 9-level proof-quality
  ladder + hard-test rule.
- 4 new references: `deep-bundle-decoupling.md`,
  `runtime-instrumentation.md`, `proof-quality.md`,
  `open-source-release-evidence.md`.
- `README.md` updated with a "Deep Bundle + Runtime Decoupling Mode"
  section.

### Raw bundle policy
- `.rebuild/target-source/{bundles,source-maps,manifests,reports}/`
  created.
- `.rebuild/private/{bundles,secrets-check}/` created (git-ignored).
- `.gitignore` updated.

### Scripts (10 new)
- `scripts/fetch-public-bundles.mjs`
- `scripts/deep-bundle-analysis.mjs`
- `scripts/scan-target-artifacts.mjs`
- `scripts/action-coverage-map.mjs`
- `scripts/runtime-instrumentation.mjs`
- `scripts/react-component-probe.mjs`
- `scripts/decode-state-stores.mjs`
- `scripts/single-file-import-probe.mjs`
- `scripts/selector-miner.mjs`
- `scripts/audit-proof-quality.mjs`

### Tests (3 new)
- `tests/deep-runtime-proof.spec.mjs` — export dialog, playback,
  persistence, bundle analysis hard proofs.
- `tests/single-import-proof.spec.mjs` — single-file upload proof.
- `tests/bundle-analysis-proof.spec.mjs` — bundle artifacts
  existence + content.

### Outputs

| Artifact | Path |
| --- | --- |
| Bundle manifest | `.rebuild/private/bundles/manifest.json` |
| Promoted bundles | `.rebuild/target-source/bundles/` (13 files) |
| Secrets scan | `.rebuild/target-source/reports/secrets-scan-report.md` |
| License report | `.rebuild/target-source/reports/license-provenance-report.md` |
| Commit eligibility | `.rebuild/target-source/reports/commit-eligibility.md` |
| Bundle index | `.rebuild/features/bundle-symbol-index.json` |
| Library fingerprint | `.rebuild/features/library-fingerprint.json` |
| Feature → bundle map | `.rebuild/features/feature-code-clues.json` |
| Decoded state stores | `.rebuild/features/decoded-state-stores.md` |
| Persistence model | `.rebuild/features/inferred-persistence-model.md` |
| Bundle summary | `.rebuild/features/deep-bundle-analysis.md` |
| API contracts | `.rebuild/features/api-contracts.md` |
| Feature parity | `.rebuild/reports/feature-parity.md` |
| Test proof audit | `.rebuild/reports/test-proof-audit.md` |
| Runtime summary | `.rebuild/runtime/runtime-summary.md` |
| Action coverage | `.rebuild/runtime/coverage/action-coverage-summary.md` |
| React tree | `.rebuild/runtime/react-component-tree.md` |
| Single-import | `.rebuild/deep-import/import-summary.md` |
| Selector map | `.rebuild/features/selector-map.md` |
| Paper | `paper/` (10 files) |

### Headline counts

- 13 bundles fetched (11 JS + 2 CSS).
- 0 source maps exposed publicly.
- 0 secrets findings.
- 12 libraries fingerprinted.
- 40+ feature keyword hits across bundles.
- 10 actions covered with JS + CSS coverage.
- 9 features at `hard_proof`, 6 at `behavior_observed`, 6 at
  `surface_observed`, 8 at `inferred_from_bundle`, 1 at
  `fixture_ready`, 4 at `not_found`.
- 33/33 desktop Playwright tests pass.

## Major discoveries

- **`advanced-timeline-store`** is a Zustand-persist JSON
  `{state: {trackDensity: "default"}, version: 0}`.
- **React fiber keys** are present in the production build. Radix
  UI primitives (`TooltipProvider`, `MenuProvider`, `Popper`,
  `DropdownMenu`) are extracted at runtime.
- **ThumbnailCache** generates sprite images (284x120, 40px tiles,
  10 tiles, 1s interval) during a single-file upload.
- **Space keypress** creates the `advanced-timeline-store` key —
  the strongest single observable playback behavior.
- **Export dialog** opens with `720p`, `1080p`, `4K`, `Start
  Export`, `Rendered in your browser`.
- **`lastCleanup_thumbnailCache`** is added on first user action
  (theme toggle / import).
- **12 libraries** fingerprinted in bundles: React, Next.js, Radix
  UI, Tailwind, Zustand, Immer, Supabase, Pexels, WebCodecs,
  MediaRecorder, Mediabunny, Remotion.

## What succeeded

- Bundle fetch + secrets + license + promotion pipeline.
- acorn-based bundle parsing (0 parse failures).
- Runtime instrumentation (22 storage mutations captured).
- React fiber extraction (918 elements, Radix primitives found).
- Single-file upload probe (upload succeeded, bodyText + storage
  changed).
- All 33 desktop Playwright tests pass.

## What failed

- No source maps exposed publicly → bundle analysis is regex/
  identifier based, not source-mapped.
- Clip drag selectors (`[data-clip-id]`, `[data-item-id]`,
  `[data-testid*="clip"]`) still not found. Selector miner produced
  82 candidates but no data attributes.
- Trim/split shortcut hint text not visible.

## Files that matter most

- `paper/README.md` — paper entry point
- `.rebuild/features/deep-bundle-analysis.md`
- `.rebuild/features/library-fingerprint.json`
- `.rebuild/features/bundle-symbol-index.json`
- `.rebuild/features/feature-code-clues.json`
- `.rebuild/features/decoded-state-stores.md`
- `.rebuild/runtime/runtime-summary.md`
- `.rebuild/runtime/coverage/action-coverage-summary.md`
- `.rebuild/deep-import/import-summary.md`
- `.rebuild/features/selector-map.md`
- `.rebuild/reports/test-proof-audit.md`
- `.rebuild/reports/feature-parity.md`

## Next best actions

1. **Build the actual rebuilt app** in a separate run — this run
   is observation only.
2. Intersect `feature-code-clues.json` hits with action coverage
   ranges to upgrade some features to `code_correlated`.
3. Probe additional clip selectors (role-based, text-based) for
   drag/drop parity.
4. Manual probe of trim/split shortcuts.
5. Add per-property inspector spec.

## Known blockers

- None blocking. The harness ran end-to-end on the demo URL.

## Verification status

See `.harness/verification.md` for the latest run results.