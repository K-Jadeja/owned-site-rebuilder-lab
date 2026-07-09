---
name: owned-site-rebuilder
description: Reverse-engineer an owned or authorized browser app from observable evidence — UI, DOM, network, storage, public bundles — into a spec, state model, acceptance tests, and a rebuild plan. Use only for sites the user owns or is explicitly authorized to analyze. Not for stealing code, bypassing auth, or extracting secrets.
---

# Owned-Site Rebuilder Skill

A local research workflow for turning an owned/authorized browser-deployed app
into a spec, a state model, an event map, API/storage contracts, and a rebuild
plan — backed by Playwright capture and structured feature records.

## Operating philosophy

- **Use only for sites the user owns or is explicitly authorized to analyze.**
  Do not invoke for competitors, random SaaS, or any site without proof of
  authorization.
- **Observable feature parity is the goal** — not pixel-perfect cloning, not
  private backend recovery.
- **Capture evidence before guessing.** DOM, screenshots, network, storage,
  public bundles, console — all of it.
- **Do not bypass authentication.** No credential stuffing, no token theft,
  no session replay, no auth-header smuggling.
- **Do not extract secrets, tokens, cookies, API keys, or private session
  values.** Sanitize network captures before writing them to disk.
- **Do not claim hidden backend source code was recovered.** The skill
  produces observable behavior reconstruction, not source recovery.
- **Do not copy third-party proprietary code** from any site the user does
  not own.
- **Do not fake results.** If capture is partial, mark features as
  `partially_observed` or `blocked`. Do not invent acceptance criteria.
- **Record uncertainty.** Every feature record carries an `uncertainty` list.
- **Tests prove parity, not screenshots alone.** Every feature must have at
  least one Playwright or manual acceptance check.

## Feature Reverse Engineering Mode

For an owned or authorized app, reconstruct features by combining:

1. UI exploration (role/text-based selectors, screenshots at multiple viewports)
2. DOM inspection (semantic structure, ARIA, landmarks, regions)
3. Event tracing (what happens on click, drag, key, hover, submit)
4. Network capture (sanitized request/response shapes — method, path, status,
   resource type, timing)
5. Storage inspection (localStorage, sessionStorage, IndexedDB **names** —
   never raw user data)
6. Downloaded bundle analysis (only what the browser received publicly;
   no source-map bypass)
7. Worker / WASM / public asset inspection (declared, not exfiltrated)
8. State transition logging (URL, storage, network correlation across flows)
9. Acceptance test generation (Playwright `expect` + manual checklists)
10. Independent reimplementation planning (no copy/paste of captured source)

## Feature parity definition

A feature is **considered reconstructed** only when:

1. It has a written spec (in `.rebuild/spec/` or `.rebuild/features/`).
2. It has acceptance criteria.
3. It has at least one automated test or a manual verification checklist.
4. It has an independent implementation plan.
5. Known deviations and uncertainties are documented.

## Video editor feature categories

When the target is a video editor (default for this lab), cover at minimum:

- project creation / loading / saving
- asset import (local file, URL, library, sample)
- media library behavior (sort, search, drag-out)
- drag/drop to timeline
- timeline tracks (add, remove, mute, hide, lock, reorder)
- clip trimming (in/out handles)
- clip splitting (at playhead, at selection)
- clip movement (between tracks, along time)
- snapping (clip-to-clip, clip-to-playhead, threshold)
- timeline zooming (in, out, fit)
- playback (play, pause, frame step, loop)
- scrubbing (drag playhead, click on ruler)
- preview rendering (canvas, video element, webcodecs)
- selection state (single, multi, range)
- inspector / properties panel
- text overlays (inline, file)
- transitions (between clips, fade in/out)
- effects (filter, color, transform)
- keyframes (parameter animation over time)
- audio waveform behavior
- export / render workflow (preset, progress, download)
- keyboard shortcuts
- undo / redo
- persistence model (localStorage, IndexedDB, project file)
- error states (codec unsupported, large file, network drop)
- empty states (no project, no clips, no assets)
- unsupported media handling

## Workflow

1. **Initialize** — verify the target is owned/authorized; load
   `.harness/handoff.md` if present.
2. **Capture** — run `npm run capture` to snapshot DOM, styles, network,
   storage, bundles, console, and screenshots across viewports.
3. **Probe** — run `npm run probe` to interact with non-destructive controls
   and emit event/state transition logs.
4. **Analyze bundles** — run `npm run bundles` to summarize framework clues
   from public JS/CSS asset names and chunk layout (no source-map bypass).
5. **Inspect storage** — run `npm run storage` to list storage **names** and
   redacted shapes.
6. **Generate reports** — run `npm run reports` to combine everything into
   spec files and parity reports.
7. **Test** — run `npm test` to execute the parity-plan spec.
8. **Research** — read `.research/freecut-notes.md` and the comparison file
   for open-source architecture ideas (license-aware).
9. **Update harness** — refresh `.harness/progress.md`, `decisions.md`,
   `verification.md`, `handoff.md`, and append `.harness/session-log.jsonl`.

## Outputs to keep fresh

- `.rebuild/features/feature-inventory.md` — the master feature record
- `.rebuild/features/feature-matrix.json` — machine-readable ledger
- `.rebuild/features/state-model.md` — inferred state schema
- `.rebuild/features/api-contracts.md` — sanitized network shapes
- `.rebuild/features/event-map.md` — interaction surface
- `.rebuild/features/bundle-analysis.md` — public bundle clues
- `.rebuild/features/acceptance-tests.md` — verification plan
- `.rebuild/spec/video-editor-architecture.md` — architecture plan
- `.rebuild/reports/feature-parity.md` — proof-of-reconstruction report
- `.rebuild/reports/gaps.md` — known gaps and blockers
- `.harness/handoff.md` — resume summary for the next session

## Safety reminders

- Redact `authorization`, `cookie`, `set-cookie`, `x-api-key`, query tokens.
- Truncate large response bodies.
- Do not save binary media contents.
- Do not paste huge minified bundle code into reports — summarize clues.
- If the app requires login or a manual step, write a clear blocker in
  `.rebuild/reports/gaps.md` and continue with public surfaces.

## References

See `.claude/skills/owned-site-rebuilder/references/` for:

- `workflow.md`
- `feature-reverse-engineering.md`
- `visual-capture.md`
- `bundle-analysis.md`
- `video-editor-features.md`
- `safety.md`
- `deep-bundle-decoupling.md`
- `runtime-instrumentation.md`
- `proof-quality.md`
- `open-source-release-evidence.md`

## Deep Bundle + Runtime Decoupling Mode

Use this mode when the user wants proof that Claude Code can reverse
engineer observable product features, not just UI.

The goal is to **correlate**:

- public JS/CSS bundle bodies
- public source maps if available
- webpack/Next.js module IDs and chunks
- code string/symbol clues
- DOM structure
- runtime events
- localStorage/sessionStorage
- IndexedDB names and safe metadata
- visible network calls
- feature probes
- screenshots
- acceptance tests

### Allowed

- Fetch public JS/CSS bundles that the browser already downloaded.
- Store raw bundle bodies locally under `.rebuild/private/bundles/`.
- Commit raw public target bundles to `.rebuild/target-source/` only
  after a secrets scan and license/provenance report passes.
- Beautify and parse browser-delivered JS.
- Build derived indexes from strings, identifiers, property names,
  module IDs, source maps, code coverage, and feature keywords.
- Use Playwright runtime instrumentation (fetch/XHR/IndexedDB/storage/
  history/event patches) to capture app-owned behavior.
- Inspect IndexedDB database names and object store names.
- Decode app-owned localStorage values such as
  `advanced-timeline-store`.
- Use browser JS coverage to map user actions to bundle ranges.
- Extract React component names from public runtime/fiber metadata if
  available.
- Create hard feature tests with concrete assertions.

### Not allowed

- Bypass auth.
- Attack infrastructure.
- Extract cookies/tokens/secrets.
- Commit secrets.
- Claim private backend source recovery.
- Copy third-party proprietary source.
- Treat soft discovery tests as feature proof.

## Proof quality levels

Every feature claim, test, and audit line is classified with one of
these proof levels:

- **`hard_proof`** — concrete before/after evidence plus a passing
  assertion that checks a feature-specific outcome (e.g., dialog
  contains 720p/1080p/4K, storage mutation occurs, upload changes
  library text).
- **`behavior_observed`** — before/after evidence exists, but the test
  assertion is incomplete (e.g., page did not crash).
- **`surface_observed`** — the button/region/control exists, but
  behavior is not proven.
- **`code_correlated`** — runtime behavior is linked to bundle/source-
  map/code-coverage evidence (e.g., action X executed bundle ranges
  Y which contain identifier Z).
- **`inferred_from_bundle`** — code strings or modules suggest
  behavior, but runtime proof is missing.
- **`inferred_from_architecture`** — based on general architecture or
  open-source reference only.
- **`fixture_ready`** — fixture exists, but the feature has not been
  executed end-to-end.
- **`blocked`** — cannot be tested due to auth, fixture issue, selector
  issue, environment, or missing manual step.
- **`not_found`** — searched but not found.

## Hard-test rule

A Playwright test does **not** count as feature proof if it only asserts:

- `expect(true).toBeTruthy()`
- `typeof x === "boolean"`
- `Array.isArray(x)`
- the page did not crash
- a fixture file exists
- a selector query returned an array but without required contents

Those tests are allowed, but they must be labeled `soft_probe`, not
`hard_proof`.

A **hard proof** must assert a concrete outcome, such as:

- export dialog contains 720p, 1080p, 4K, Start Export, and
  "Rendered in your browser"
- pressing Space changes time display or creates a specific storage
  mutation (`advanced-timeline-store` appears)
- single-file upload changes DOM/storage/network in a feature-specific
  way (library item count increases, IndexedDB observation changes)
- localStorage key persists after reload
- bundle analysis finds a specific feature keyword or state-store
  clue in a specific chunk
- runtime coverage maps an action to specific bundle ranges

## Templates

See `.claude/skills/owned-site-rebuilder/templates/` for:

- `feature-record.md`
- `visual-spec.md`
- `feature-parity-report.md`