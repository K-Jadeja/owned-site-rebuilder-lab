# RVE Rebuild

A clean-room rebuild of [https://demo.reactvideoeditor.com](https://demo.reactvideoeditor.com) driven entirely by observable evidence captured in the parent lab (`owned-site-rebuilder-lab`).

This is **Milestone 1 only**. It is a visual shell + import + preview + timeline + export dialog + persistence + inspector.

It is **not** a full RVE. Trim / split, effects / keyframes, waveform, real MP4 export render, and auth-backed project save are intentionally excluded until later milestones.

## Evidence that drove the implementation

- `.rebuild/features/extracted-track-clip-schema.md` — partial state schema.
- `.rebuild/features/extracted-editor-state.json` — live onSave tracks array.
- `.rebuild/features/feature-matrix.json` — proof levels per feature.
- `.rebuild/features/decoded-state-stores.md` — Zustand persist shape.
- `.rebuild/deep-import/import-timeline-hardening.md` — proven drag strategy.
- `.rebuild/reports/feature-parity.md` — feature parity report.

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Zustand 4 (with `persist` middleware)
- Tailwind CSS

No real backend, no auth, no third-party proprietary code.

## Run

```bash
# from the repo root
cd apps/rve-rebuild
npm install
npm run dev
# open http://localhost:4310
```

## Test

```bash
# from the repo root
npm run dev:rve   # starts the dev server in the background
npm run test:rve  # runs the milestone-1 hard tests
```

The test config in `apps/rve-rebuild/playwright.config.mjs` uses a Playwright `webServer` block to start the dev server automatically.

## What is implemented

- App shell (F001)
- Topbar (F002)
- Preview region (F004) — `<video>` and a hidden canvas stand-in for the reference's ThumbnailCache
- Asset import (F007) — single-file input, `URL.createObjectURL`, `lastCleanup_thumbnailCache` write
- Export dialog (F008/F028) — 720p / 1080p / 4K + Start Export + Rendered in your browser
- Persistence (F010/F031) — `advanced-timeline-store`, `idb_migration_v1_done`, `lastCleanup_thumbnailCache`, `rve-extended-theme`
- Media library tabs (F012) — Stock / My Library
- Drag to timeline (F013) — drops a media card onto a track and adds a `TimelineItem`
- Timeline zoom (F019) — in / out / reset
- Playback (F020) — Space keypress toggles and writes `advanced-timeline-store`
- Inspector panel (F022) — tab list + active label

## What is intentionally stubbed

- Start Export closes the dialog but does not render a real MP4.
- Trim / split, effects, keyframes, animations: not present in the UI.
- Waveform render on uploaded audio: input only accepts `video/*`.
- Inspector deep editing: tab list only.
- Project save / load: in-memory + localStorage only.

## What is excluded until Milestone 2

- Trim / split (F015, F016) — no working shortcut identified in the public demo.
- Effects / transitions / keyframes (F024, F025, F026) — only bundle hints, no runtime proof.
- Waveform on uploaded audio (F027) — input mismatch.
- Real MP4 export render (F027) — would crash headless Chromium.
- Error / empty / unsupported media states (F032, F033, F034).
- Auth-backed project save (F011).
- Snapping (F018), scrubbing (F021), text overlays (F023).

## See also

- `docs/state-model.md`
- `docs/milestone-1.md`
- `docs/known-gaps.md`
