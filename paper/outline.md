# Paper Outline

## 1. Introduction
- Why observable feature parity matters.
- The owned-app authorization context.

## 2. Target
- `demo.reactvideoeditor.com` — Next.js + Vercel + Pexels + Supabase.
- Public read-only demo URL.

## 3. Method
- Browser instrumentation.
- Public bundle fetch + parse + index.
- Runtime API patches (fetch / XHR / localStorage / sessionStorage /
  history / IndexedDB).
- Action-level Playwright JS/CSS coverage.
- Single-file upload probe.
- React fiber component extraction.
- State-store decoding.
- Hard-test rule.

## 4. Proof-quality ladder
- `hard_proof`, `behavior_observed`, `surface_observed`,
  `code_correlated`, `inferred_from_bundle`,
  `inferred_from_architecture`, `fixture_ready`, `blocked`, `not_found`.

## 5. Per-feature evidence
- See `evidence-table.md`.

## 6. Bundle analysis
- See `appendix-bundle-analysis.md`.

## 7. Runtime instrumentation
- See `appendix-runtime-instrumentation.md`.

## 8. Feature probes
- See `appendix-feature-probes.md`.

## 9. Limitations
- See `limitations.md`.

## 10. Reproducibility
- See `reproducibility.md`.

## 11. Conclusion
- The lab demonstrates that Claude Code can recover observable
  product behavior end-to-end without bypassing auth or extracting
  private code.
- It does not demonstrate hidden backend recovery.