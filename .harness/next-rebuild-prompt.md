# Next: Build apps/rve-rebuild/

Generated: 2026-07-09T12:18:14.829Z

## Pre-flight

This is a prompt for the NEXT Claude session. The previous session ended with the FINAL RVE REVERSE PASS — CLIP / TRIM / EXPORT / EFFECTS / STATE SCHEMA PROOF.

## Files to read first

- `.harness/handoff.md`
- `.harness/verification.md`
- `.harness/progress.md`
- `.rebuild/reports/rve-copy-progress.md`
- `.rebuild/reports/rebuild-readiness.md`
- `.rebuild/reports/feature-parity.md`
- `.rebuild/reports/code-correlation-summary.md`
- `.rebuild/features/extracted-track-clip-schema.md`
- `.rebuild/features/feature-matrix.json`
- `.rebuild/features/feature-inventory.md`
- `.rebuild/spec/video-editor-architecture.md`

## Authority

- Target: https://demo.reactvideoeditor.com (owned or authorized).
- Use only public browser-delivered evidence (DOM, network, storage, public bundles).
- Do not bypass auth, do not extract secrets, do not claim hidden backend source recovery.
- Public JS/CSS bundles MAY be referenced for stack offsets, identifiers, and string literals — but do NOT copy source code into the rebuild.

## Stack recommendation

- Framework: Next.js + React + Zustand (Zustand `persist` confirmed by decoded `advanced-timeline-store`).
- UI primitives: Radix UI (confirmed by fiber extraction).
- Styling: Tailwind.
- Persistence: localStorage + IndexedDB (confirmed by `idb_migration_v1_done`).
- Render: `URL.createObjectURL` + `<video>` + `<canvas>` (thumbnail sprite pattern observed).
- Export: WebCodecs / MediaRecorder / Mediabunny (libraries fingerprinted in bundles).

## Milestone 1 (visual shell + import + export dialog)

Ready (hard_proof or code_correlated):
- F001 — F001 (score 3)
- F004 — F004 (score 3)
- F007 — F007 (score 4)
- F008 — F008 (score 3)
- F010 — F010 (score 3)
- F013 — F013 (score 3)
- F019 — F019 (score 3)
- F020 — F020 (score 4)
- F022 — F022 (score 3)
- F028 — F028 (score 3)
- F031 — F031 (score 4)

Behavior-observed features (acceptable for milestone 1 if missing proof is non-central):
- F006 — F006 (score 2)
- F015 — F015 (score 2)
- F016 — F016 (score 2)
- F017 — F017 (score 2)
- F018 — F018 (score 2)
- F021 — F021 (score 2)
- F023 — F023 (score 2)
- F024 — F024 (score 2)
- F025 — F025 (score 2)
- F026 — F026 (score 2)
- F027 — F027 (score 2)
- F029 — F029 (score 2)
- F030 — F030 (score 2)

Blocked (do not include in milestone 1):
- F002 — F002 (score 1)
- F003 — F003 (score 1)
- F005 — F005 (score 1)
- F009 — F009 (score 1)
- F011 — F011 (score 0)
- F012 — F012 (score 1)
- F014 — F014 (score 1)
- F032 — F032 (score 0)
- F033 — F033 (score 0)
- F034 — F034 (score 0)

## Track / clip state schema (partial)

See `.rebuild/features/extracted-track-clip-schema.md` and `.json`.

## What to build first

1. `apps/rve-rebuild/` with Next.js + React + Zustand.
2. Topbar with all buttons (Hard, Export Video, Zoom in/out/reset, Lock, Undo, Redo).
3. Stock / My Library tabs.
4. Single-file import + ThumbnailCache sprite canvas.
5. Preview region (video + canvas).
6. Timeline tracks with draggable headers and the `trackDensity:"default"` density placeholder.
7. Playback Space (Space keypress → `advanced-timeline-store` mutation).
8. Export dialog (720p/1080p/4K + Start Export + Rendered in your browser) — download may be stubbed.
9. Persistence after reload (`advanced-timeline-store`, `idb_migration_v1_done`, `lastCleanup_thumbnailCache`).
10. Inspector panel layout (tab list only; deep interactions in milestone 2).

## What NOT to build in milestone 1

- Trim / split (no working shortcut identified).
- Effects / transitions / keyframes (only bundle hints, no runtime proof).
- Waveform render on uploaded audio (input only accepts video/*).
- Actual MP4 export render (download or timeout — confirm before claiming).

## Acceptance for milestone 1

- Boot the rebuilt app, snapshot topbar / tabs / timeline, compare basic landmark regions.
- Press Space: see `advanced-timeline-store` mutation.
- Single-file import: see `lastCleanup_thumbnailCache` mutation + a thumbnail canvas.
- Reload: keys still present.
- Open Export dialog: see 720p / 1080p / 4K + Start Export.

Once these pass, increment copy-progress scores for `implemented_in_rebuild` and re-run the visual parity test.
