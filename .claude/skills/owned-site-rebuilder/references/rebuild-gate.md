# Rebuild Gate

Six items **must** be checked before starting `apps/rve-rebuild/`.

## Gate checks

- [ ] **Copy progress dashboard** exists at
      `.rebuild/reports/rve-copy-progress.md` AND
      `.rebuild/reports/rve-copy-progress.json`.
      Every feature F001-F034 must have a score 0-7.
- [ ] **Rebuild readiness report** exists at
      `.rebuild/reports/rebuild-readiness.md`.
      It must answer all 10 readiness questions, including milestone
      scope.
- [ ] **At least one feature in each milestone-1 category** is
      `hard_proof` OR `code_correlated`.
- [ ] **Track/clip schema** is at least partially extracted at
      `.rebuild/features/extracted-track-clip-schema.{json,md}`.
- [ ] **Console-object capture** has been attempted at
      `.rebuild/runtime/console-objects/` and either recovered the
      onSave `tracks` array OR recorded an exact blocker.
- [ ] **Import → timeline mutation** is `hard_proof` (or
      `code_correlated`).

## Outcome

- **5-6/6 → ready to begin milestone 1.**
- **3-4/6 → one more reverse-evidence pass first.**
- **≤2/6 → insufficient evidence, do not start rebuilding.**

## What milestone 1 should NOT contain

Milestone 1 is the **visual shell + import + export dialog** only.
Do not include in milestone 1:

- full timeline rendering proof (clip selectors + state schema
  can be incremented in milestone 2)
- trim/split (still has no proven shortcut)
- effects/transitions/keyframes/animations
- waveform render on uploaded audio
- visual parity for inspector deep tabs
- actual MP4 export render (download or timeout)

## Milestone 1 scope (recommended)

- Topbar (Toggle Sidebar, Dark, Export Video, Zoom, Reset, Lock, Undo, Redo)
- Stock / My Library tabs
- Single-file import (video) — `lastCleanup_thumbnailCache` + thumbnail
  sprite
- Preview region (`<video>` or `<canvas>`)
- Timeline tracks (visual placeholders, draggable headers, density)
- Playback Space (advanced-timeline-store)
- Export dialog (720p / 1080p / 4K / Rendered in your browser)
- persistence after reload (localStorage keys)
- Inspector panel layout (tab list) — no deep interactions

## What to write to `.harness/next-rebuild-prompt.md`

```markdown
# Next: build apps/rve-rebuild/

You are starting a NEW Claude session. Read:
- `.harness/handoff.md`
- `.harness/verification.md`
- `.rebuild/reports/rebuild-readiness.md`
- `.rebuild/reports/rve-copy-progress.md`
- `.rebuild/features/extracted-track-clip-schema.md`
- `.rebuild/features/feature-matrix.json`
- `.rebuild/spec/video-editor-architecture.md`

This run builds `apps/rve-rebuild/`. It is a from-scratch rebuild.
Do NOT copy source code. Do NOT repackage the public bundles.
Use the proven features, the extracted state schema, and the bundle
clues to write a clean-room implementation.

The first milestone is: <list from rebuild-readiness.md>.
```
