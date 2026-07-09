# Limitations

Honest list of what this paper does not achieve.

## What we did not do

- **No rebuild.** No standalone React app was built in this run.
  The paper proves *observable* feature parity, not implementation
  parity.
- **No source-map recovery.** Production builds at
  `demo.reactvideoeditor.com` do not expose `.map` files publicly.
  Bundle-body analysis is regex / identifier / AST based, not source-
  mapped.
- **No hidden backend recovery.** Authenticated API endpoints and
  private server logic were deliberately not probed.
- **No third-party code copying.** Library licenses were attributed
  but no third-party source was included verbatim.

## Soft probes still present

9 tests are classified as `soft_probe` (see
`.rebuild/reports/test-proof-audit.md`). They use shapes like
`expect(true).toBeTruthy()` or `Array.isArray(x)` and are labelled as
such. They are sanity checks, not feature proof.

## Features that remain `inferred_from_bundle`

- F018 Snapping
- F021 Scrubbing
- F023 Text overlays
- F024 Transitions
- F025 Effects
- F026 Keyframes

F015 (Trim) and F016 (Split) now have UI hint search + 33 key probe
artifacts at `.rebuild/features/trim-split-probe.md`. They remain
`behavior_observed` because no working shortcut was identified; the
public demo does not appear to expose a manual trim/split shortcut
without a clip being fully selected (a step the harness cannot
perform reliably).

These remaining six features have bundle-string evidence but no
runtime mutation proof.

## Features that remain `not_found`

- F011 Project save (would require authenticated flow)
- F032 Error states (would require injecting unsupported media)
- F033 Empty states (would require clearing timeline)
- F034 Unsupported media (would require unsupported mime)

## Coverage gaps

- Action coverage is byte-level, not statement-level. A high "used
  bytes" count is not the same as a high branch coverage.
- The selector miner found 82 candidates but no
  `[data-clip-id]` / `[data-item-id]` attributes. The app likely uses
  implicit positioning rather than explicit data attributes.
- The runtime instrumentation patches `fetch` and `XMLHttpRequest`,
  but some apps may use `WebSocket` or `EventSource` for live data.
  We did not patch those (the demo did not use them).

## What is still toy-level

- No pixel-perfect visual comparison with the original app.
- No end-to-end export render (Start Export → mp4 download).
- No waveform render on an uploaded audio clip.
- No "snap to playhead" demonstration.
- No project save / load against an authenticated account.