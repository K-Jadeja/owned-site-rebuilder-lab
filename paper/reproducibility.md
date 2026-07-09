# Reproducibility

A reviewer should be able to reproduce every claim in this paper in
about 30 minutes on a modern laptop with Node 18+ and a Chromium
binary.

## Prerequisites

```bash
node --version    # v18 or later
npm --version     # v9 or later
```

## One-shot recipe

```bash
git clone https://github.com/K-Jadeja/owned-site-rebuilder-lab.git
cd owned-site-rebuilder-lab
npm install
npx playwright install chromium

# Surface capture (writes to .rebuild/reference/)
npm run capture

# Interactive probing
npm run probe

# Deep feature probe (writes to .rebuild/tests/feature/)
node scripts/deep-probe.mjs

# ---- Deep Bundle + Runtime Decoupling pass ----

# 1. Fetch public bundles (writes to .rebuild/private/, then promotes
#    audited bundles to .rebuild/target-source/).
npm run fetch:bundles
npm run scan:target

# 2. Index bundles (writes to .rebuild/features/).
npm run analyze:deep-bundles

# 3. Runtime instrumentation (writes to .rebuild/runtime/).
npm run instrument:runtime

# 4. Action-level JS/CSS coverage (writes to .rebuild/runtime/coverage/).
npm run coverage:actions

# 5. Single-file import (writes to .rebuild/deep-import/).
npm run probe:single-import

# 6. Selector mining (writes to .rebuild/features/selector-map.md).
npm run mine:selectors

# 7. Decode state stores (writes to .rebuild/features/decoded-state-stores.md).
npm run decode:state

# 8. Audit proof quality (writes to .rebuild/reports/test-proof-audit.md).
npm run audit:proof

# 9. Regenerate reports + handoff.
npm run reports

# 10. Run all tests.
npm test
```

## Headline outputs

| Claim | File |
| --- | --- |
| Bundle index | `.rebuild/features/bundle-symbol-index.json` |
| Library fingerprint | `.rebuild/features/library-fingerprint.json` |
| Feature → bundle map | `.rebuild/features/feature-code-clues.json` |
| Decoded state stores | `.rebuild/features/decoded-state-stores.md` |
| Runtime summary | `.rebuild/runtime/runtime-summary.md` |
| Action coverage | `.rebuild/runtime/coverage/action-coverage-summary.md` |
| React components | `.rebuild/runtime/react-component-tree.md` |
| Single-import result | `.rebuild/deep-import/import-summary.md` |
| Selector map | `.rebuild/features/selector-map.md` |
| Test proof audit | `.rebuild/reports/test-proof-audit.md` |
| Feature parity | `.rebuild/reports/feature-parity.md` |

## Idempotency

All scripts are idempotent. Re-running them overwrites the same
artifact paths with fresh data.

## Network safety

- All fetch operations are public GET against the user-owned target.
- No cookies, authorization, or tokens are sent.
- All response bodies are sanitized at capture time.
- Raw bundle bodies live under `.rebuild/private/bundles/` (git-
  ignored). Only audited bundles (post secrets scan + license pass)
  are copied to `.rebuild/target-source/bundles/` for commit
  eligibility.