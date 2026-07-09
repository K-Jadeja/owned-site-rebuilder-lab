# Evidence Table

Every claim is graded by proof level. The "file" column points to the
specific evidence file in the repo.

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