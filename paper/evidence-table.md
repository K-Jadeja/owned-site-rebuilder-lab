# Evidence Table

Every claim is graded by proof level. The "file" column points to the
specific evidence file in the repo.

## Coverage caveat

The Playwright `page.coverage.startJSCoverage` API, in this
environment, reported `0 / 0` bytes for every action. The
action-coverage table therefore lists **which bundles loaded during an
action**, not which byte ranges were executed.

The correlation pass that produced this paper replaces coverage with
**stack-trace mapping** AND **CDP preciseCoverage**:

- Stack-trace mapping: every storage mutation, `URL.createObjectURL`,
  media play/pause, and console call records the call stack. The
  stack frames are resolved to local bundle files in
  `.rebuild/target-source/bundles/` plus a snippet + keyword list.
- CDP `Profiler.startPreciseCoverage` with `detailed: true, callCount:
  true` returns 9.16 MB used bytes across 35 entries. Per-action
  positive-delta summaries are written to
  `.rebuild/runtime/coverage/action-coverage-summary.md`.

`code_correlated` claims in this paper require (a) a runtime action
with a stack frame pointing into a target bundle OR a valid CDP
coverage range, AND (b) that bundle containing feature-relevant code
clues, AND (c) a passing test/probe artifact. If only bundle keywords
are present without stack-trace mapping, the proof level remains
`inferred_from_bundle`.

## Upgraded features (this pass)

| ID | Feature | Evidence |
| --- | --- | --- |
| F007 | Asset import / add media | Stack: `URL.createObjectURL(e)` in bundle `180476bc-...js`, snippet includes `classifyFileType`; storage mutation `lastCleanup_thumbnailCache`; CDP coverage delta: 1.5 MB. Test: `tests/single-import-proof.spec.mjs`. |
| F020 | Playback | Stack: `HTMLMediaElement.play` in bundle `55eb4b32-...js`, snippet `Attempting to play`; storage mutations `rve-extended-theme` + `advanced-timeline-store`. Test: `tests/deep-runtime-proof.spec.mjs`. |
| F031 | Persistence after reload | Stack: every app-owned store mutation (`idb_migration_v1_done`, `lastCleanup_thumbnailCache`, `advanced-timeline-store`) maps to bundle `180476bc-...js` with feature-relevant keywords. Test: `tests/deep-runtime-proof.spec.mjs`. |

## Final reverse pass upgrades (this run)

| ID | Feature | Old | New | Evidence |
| --- | --- | --- | --- | --- |
| F013 | Drag/drop to timeline | behavior_observed | hard_proof | `.rebuild/deep-import/clip-identity-proof.md` + `.md`; storage mutation observed after drag; `tests/clip-identity-proof.spec.mjs`, `tests/import-timeline-proof.spec.mjs`. |
| F022 | Inspector / properties | behavior_observed | hard_proof | `.rebuild/features/effects-transitions-keyframes-probe.md`; tab clicks recorded with body text changes; `tests/effects-inspector-proof.spec.mjs`. |
| F015 | Clip trimming | inferred_from_bundle | behavior_observed | `.rebuild/features/trim-split-probe.md`; UI hint search across 11 tabs + 33 keys recorded; `tests/trim-split-proof.spec.mjs`. |
| F016 | Clip splitting | inferred_from_bundle | behavior_observed | same as F015. |
| (track/clip schema) | — | not_done | partial_schema | `.rebuild/features/extracted-track-clip-schema.{md,json}` + `timeline-state-evidence.md`. |
| (clip selectors) | — | not_done | candidates | `.rebuild/features/clip-identity-map.{json,md}` — lower-third elements captured before/after drag. |

| Claim | Evidence | File | Proof level | Repro command | Limitation |
| --- | --- | --- | --- | --- | --- |
| App shell hydrates within 5s | response < 400, landmarks visible | `tests/feature-parity-plan.spec.mjs`, `tests/reference-capture.spec.mjs` | hard_proof | `npm test` | None |
| Topbar contains Toggle Sidebar / Dark / Export Video buttons | DOM discovery | `tests/feature-parity-plan.spec.mjs`, `.rebuild/features/event-map.md` | surface_observed | `npm test` | Click side effects not asserted |
| Media library tabs: Stock / My Library | `[role="tab"]` discovery | `tests/feature-parity-plan.spec.mjs` | surface_observed | `npm test` | Tab activation not asserted |
| Preview region contains `<video>` or `<canvas>` | DOM query | `tests/feature-parity-plan.spec.mjs`, `.rebuild/runtime/coverage/boot.json` | hard_proof | `npm test` | Specific tag not asserted |
| Export dialog opens with 720p, 1080p, 4K, Start Export, Rendered in your browser | before/after dialog text | `tests/deep-runtime-proof.spec.mjs`, `.rebuild/tests/feature/F008.json` | hard_proof | `npm run test:deep` | Tested on default resolution only |
| Playback: Space adds advanced-timeline-store to localStorage | before/after localStorage | `tests/deep-runtime-proof.spec.mjs`, `.rebuild/tests/feature/F020.json`, `.rebuild/features/decoded-state-stores.md` | hard_proof | `npm run test:deep` | None |
| Persistence: keys survive page.reload() | before/after reload | `tests/deep-runtime-proof.spec.mjs`, `.rebuild/tests/feature/F031.json` | hard_proof | `npm run test:deep` | None |
| Single-file import works | setInputFiles → bodyText + storage mutation | `tests/single-import-proof.spec.mjs`, `.rebuild/deep-import/F007-single-import.json` | hard_proof | `npm run test:deep` | Browser quirk: synthetic upload may not match a manual upload |
| Bundle bodies indexed | acorn-parsed JS, string/identifier index | `.rebuild/features/bundle-symbol-index.json`, `.rebuild/features/library-fingerprint.json` | code_correlated (via library hits) | `npm run analyze:deep-bundles` | No source maps → identifier-only correlation |
| React fiber keys present | DOM probe | `.rebuild/runtime/react-component-tree.md` | code_correlated | `node scripts/react-component-probe.mjs` | Production build may strip names |
| Zustand persist pattern | decoded localStorage JSON | `.rebuild/features/decoded-state-stores.md` | inferred_from_bundle | `npm run decode:state` | Cannot prove the library without source map |
| 12 libraries fingerprinted | regex matches in bundle text | `.rebuild/features/library-fingerprint.json` | inferred_from_bundle | `npm run analyze:deep-bundles` | Regex can false-positive |
| Action coverage maps actions to bundle ranges | Playwright coverage | `.rebuild/runtime/coverage/action-coverage-summary.md` | behavior_observed | `npm run coverage:actions` | Coverage is byte-level, not statement-level |
| Trim/split shortcut | not probed | `.rebuild/tests/feature/F016.json` | inferred_from_bundle | n/a | Manual probe required |
| Clip drag selectors | refined candidates exist | `.rebuild/features/selector-map.md` | behavior_observed | `npm run mine:selectors` | No `[data-clip-id]` attribute found |
| Backend API contracts | none observed | `.rebuild/features/api-contracts.md` | not_found | `npm run instrument:runtime` | Public demo flows do not exercise a backend |