# Complete RVE Copy Evidence Mode

Operating procedure for the **final reverse-evidence pass** before
rebuilding `apps/rve-rebuild/` from observable browser evidence at
`https://demo.reactvideoeditor.com` (user-owned target).

## Goal

Drive every feature from `surface_observed` / `behavior_observed` /
`inferred_from_bundle` to either:

- `code_correlated` — runtime mapped to bundle code, OR
- `hard_proof` — concrete before/after assertion, OR
- `blocked` — explicit blocker recorded with exact missing proof.

## Allowed

- Capture full console objects via `page.on('console')` + `msg.args()` +
  `arg.jsonValue()` to recover the onSave tracks array.
- Probe DOM, React fibers, storage mutations, console logs, network, and
  bundle stacks for clip/timeline/editor state.
- Drive export flow (`Start Export`) and capture Playwright `download`
  events, object URLs, blob URLs, and MediaRecorder / WebCodecs / Mediabunny
  traces.
- Probe inspector tabs (Settings, Style, AI, Crop, Position, Volume, Mute,
  Playback Speed, Enter Animations, Exit Animations, 3D Layout Effects).
- Save downloaded media to `.rebuild/export-proof/output/` for ffprobe.
- Run ffprobe, filesize, codec check, duration on the captured file.
- Build extracted modules around stack offsets without dumping full bundles.

## Not allowed

- Bypass auth.
- Attack infrastructure.
- Extract cookies/tokens/secrets.
- Commit secrets.
- Claim hidden backend source recovery.
- Copy third-party proprietary code.
- Start `apps/rve-rebuild/` in this pass (only on the explicit request).

## Output files

- `.rebuild/reports/rve-copy-progress.md`
- `.rebuild/reports/rve-copy-progress.json`
- `.rebuild/reports/rebuild-readiness.md`
- `.harness/next-rebuild-prompt.md`
- `.rebuild/features/extracted-track-clip-schema.md`
- `.rebuild/features/extracted-track-clip-schema.json`
- `.rebuild/features/timeline-state-evidence.md`
- `.rebuild/features/extracted-editor-state.json`
- `.rebuild/features/clip-identity-map.md`
- `.rebuild/features/clip-identity-map.json`
- `.rebuild/features/trim-split-probe.md`
- `.rebuild/features/trim-split-shortcut-map.md`
- `.rebuild/features/effects-transitions-keyframes-probe.md`
- `.rebuild/features/inspector-options-catalog.md`
- `.rebuild/features/waveform-audio-probe.md`
- `.rebuild/features/extracted-feature-modules.md`
- `.rebuild/export-proof/export-end-to-end.md`
- `.rebuild/export-proof/export-end-to-end.json`

## Required tests

- `tests/clip-identity-proof.spec.mjs`
- `tests/trim-split-proof.spec.mjs`
- `tests/export-end-to-end-proof.spec.mjs`
- `tests/effects-inspector-proof.spec.mjs`
- `tests/state-schema-proof.spec.mjs`
- `tests/copy-readiness-proof.spec.mjs`

## Decision logic

After the run, ask:

1. Are 5+ features `code_correlated`?
2. Are 10+ features `hard_proof`?
3. Is the track/clip schema at least partially extracted?
4. Did export click Start Export with a downloaded file or clear timeout?
5. Did import → timeline mutation persist?
6. Are clip selectors stable enough to drive interactively?

If 5/6 yes → ready to begin milestone 1 of the rebuild.
If 3-4/6 → one more reverse-evidence pass.
If ≤2/6 → insufficient evidence.

## Honesty

- "Ready to begin rebuild" does NOT mean "RVE is fully copied".
- Implementation is still near 0% until `apps/rve-rebuild/` exists.
- Visual parity is 0% until rebuilt app is rendered.
