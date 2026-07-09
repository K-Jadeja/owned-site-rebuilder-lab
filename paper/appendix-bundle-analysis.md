# Appendix — Bundle Analysis

This appendix expands on the bundle-fetch and bundle-index stages.

## Inputs

- `.rebuild/reference/bundles/bundles.json` — URL list captured from
  the live app.
- `.rebuild/private/bundles/` — raw bundles (git-ignored).
- `.rebuild/target-source/bundles/` — audited, commit-eligible bundles.
- `.rebuild/private/bundles/manifest.json` — SHA-256 + URL manifest.

## Scripts

- `scripts/fetch-public-bundles.mjs` — fetches JS/CSS/map URLs.
- `scripts/scan-target-artifacts.mjs` — secrets + license + commit eligibility.
- `scripts/deep-bundle-analysis.mjs` — parses and indexes every bundle.

## Outputs

| File | Purpose |
| --- | --- |
| `.rebuild/features/deep-bundle-analysis.md` | Human summary |
| `.rebuild/features/bundle-symbol-index.json` | Strings + identifiers + URLs per file |
| `.rebuild/features/library-fingerprint.json` | Detected libraries per file |
| `.rebuild/features/feature-code-clues.json` | Per-feature bundle hit map |
| `.rebuild/features/embedded-endpoints.json` | External URLs found in bundles |
| `.rebuild/features/possible-state-stores.json` | State-store keyword hits |
| `.rebuild/features/css-class-index.json` | CSS class hits, including `rve:*` |
| `.rebuild/features/webpack-module-map.json` | Module IDs in each bundle |
| `.rebuild/features/nextjs-route-map.json` | Next.js route-like strings |
| `.rebuild/features/source-map-report.md` | sourceMappingURL discovery |
| `.rebuild/target-source/manifests/public-bundle-manifest.json` | SHA-256 + URL manifest |
| `.rebuild/target-source/manifests/public-bundle-fetch-report.md` | Fetch report |
| `.rebuild/target-source/reports/secrets-scan-report.md` | Secrets scan |
| `.rebuild/target-source/reports/license-provenance-report.md` | Library attribution |
| `.rebuild/target-source/reports/commit-eligibility.md` | Eligibility verdict |

## Counts (this run)

- 13 bundles fetched (11 JS + 2 CSS).
- 13 bundles promoted to `target-source` (secrets scan = PASS, 0 high
  severity findings).
- 0 source maps exposed publicly.
- 0 parse failures (acorn).

## Top libraries

| Library | Bundles |
| --- | --- |
| React | 7 |
| Remotion | 5 |
| Mediabunny | 4 |
| Supabase | 2 |
| Pexels | 2 |
| WebCodecs | 2 |
| Lucide | 2 |
| Next.js | 2 |
| Tailwind | 2 |
| Zustand | 1 |
| MediaRecorder | 1 |
| Radix UI | 1 |

## Notable feature keyword hits

| Keyword | Hits | Bundles |
| --- | --- | --- |
| timeline | 3 | 3 |
| track | 8 | 4 |
| tracks | 5 | 4 |
| clip | 5 | 4 |
| trim | 7 | 4 |
| split | 6 | 4 |
| export | many | many |
| render | many | many |
| canvas | many | many |
| audio | many | many |
| video | many | many |
| mediabunny | 2 | 2 |

## CSS class landscape

`.rve:*` class prefix is used throughout. The CSS bundles contain
20 distinct class names, including `rve:inline-flex`, `rve:items-center`,
`rve:justify-center`, `rve:rounded-md`, `rve:p-1.5`.

## How the bundle index maps to runtime evidence

The `feature-code-clues.json` file lists, per feature in
`feature-matrix.json`:

- `keywords_used` — the words searched.
- `bundles_hit` — which bundles contained the keywords.
- `snippets` — short snippets near each hit.
- `confidence` — `inferred_from_bundle` (since the deep run did not
  match bundles against JS-coverage ranges per feature; see
  Limitations).

To upgrade to `code_correlated`, the future run would need to
intersect the bundle-hits map with the action-coverage ranges. The
current coverage map is per-action, not per-feature, so the
intersection is not yet computed.