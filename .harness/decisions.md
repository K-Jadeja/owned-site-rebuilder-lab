# Decisions

Important decisions, tradeoffs, assumptions, and rationale.

## D1 — Playwright for capture and tests

- **Decision**: Use Playwright (Chromium) for both browser capture and
  the test runner.
- **Why**: Single dependency, headless, supports `page.evaluate`,
  `page.accessibility.snapshot`, multi-viewport, and `expect`-based
  assertions.
- **Tradeoff**: Headless Chromium may render slightly differently than
  the user's browser; visual diffs need tolerance.

## D2 — Shallow clone FreeCut for reference

- **Decision**: `git clone --depth 1 https://github.com/walterlow/freecut`
  into `.research/freecut/`.
- **Why**: FreeCut is the closest open-source analogue to a modern
  browser video editor and is MIT-licensed.
- **Tradeoff**: Even a shallow clone is ~thousands of files; we read
  only the architecture overview and key types, not the source.

## D3 — No copy-paste from FreeCut

- **Decision**: Use FreeCut's architecture as inspiration only; do not
  lift source code, function signatures, or design tokens.
- **Why**: License cleanliness, integrity of the rebuild, and explicit
  "no source recovery" claim.
- **Tradeoff**: More design work for the rebuild; we have to design our
  own conventions.

## D4 — JSON-only evidence

- **Decision**: Persist all evidence as JSON or text. No binary media
  contents stored.
- **Why**: Privacy, repo size, and easy diffability.

## D5 — Specs before rebuild

- **Decision**: The rebuild is staged: visual spec → component map →
  state model → timeline engine → media → preview → export. Each stage
  has its own acceptance check.
- **Why**: Reduces risk; lets us validate each layer before the next.
- **Tradeoff**: Slower to reach a working editor; better long-term
  stability.

## D6 — Feature parity, not pixel parity

- **Decision**: Aim for behavior parity + visual sanity, not pixel-perfect
  cloning.
- **Why**: Anti-aliasing, font rendering, and platform-specific UI
  differences make pixel-parity fragile and not the right success
  metric.
- **Tradeoff**: A visual diff will not be 0% — that's expected.

## D7 — Owner-asserted authorization

- **Decision**: Trust the user-stated authorization for the target. The
  harness does not enforce this.
- **Why**: The user said the target is owned/authorized. We do not have
  a way to verify ownership programmatically.
- **Tradeoff**: A bad-faith operator could misuse the harness. The
  `safety.md` doc and the skill's `safety.md` reference make the rules
  clear.

## D8 — Ephemeral browser context

- **Decision**: Each capture / probe / storage script uses a fresh
  ephemeral browser context.
- **Why**: No profile reuse, no cookies carried over, no accidental
  authenticated state.
- **Tradeoff**: Some apps behave differently for fresh users vs
  returning users; we accept that.

## D9 — Skip media-bearing tests without fixtures

- **Decision**: Tests that need real media (drag/drop, trimming,
  playback) are `test.skip` until fixture media exists.
- **Why**: Avoid flakiness and unrecoverable failures.
- **Tradeoff**: Some features are not exercised by automated tests until
  fixtures are added; manual checklists cover them in the meantime.