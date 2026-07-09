# Implementation Plan

Generated: 2026-07-09T07:13:38.658Z

Independent rebuild plan for a React + TypeScript browser video editor. No source from the target is copied; only behavior is reconstructed.

## Stages
- **1. App shell + routing** — React + TS + Vite. Routes for editor, settings, export modal.
- **2. Design tokens** — CSS variables from `.rebuild/spec/visual-spec.md`.
- **3. UI components** — Build AppShell, TopBar, Sidebar, Preview, Timeline, Inspector, ExportDialog.
- **4. Editor state model** — Zustand or Redux Toolkit with the schema in `.rebuild/features/state-model.md`.
- **5. Timeline engine** — Tracks/clips/playhead; zoom & scroll; selection; snapping; trim/split.
- **6. Media asset system** — File import, URL import, sample assets, metadata extraction.
- **7. Preview renderer** — HTMLVideoElement + Canvas overlay. Optional WebCodecs for performance.
- **8. Export pipeline** — Web Worker with FFmpeg.wasm or MediaRecorder for MP4/WebM.
- **9. Persistence layer** — localStorage for prefs; IndexedDB for project state + thumbnails.
- **10. Keyboard shortcuts** — Declarative map; visible in SettingsDialog.
- **11. Undo/redo** — Command pattern with past/future stacks.
- **12. Visual regression tests** — Playwright screenshots compared against `.rebuild/reference/screenshots/`.
- **13. Feature parity tests** — Playwright + manual checklists in `.rebuild/features/acceptance-tests.md`.

## Order of attack
1. Visual spec + component map first.
2. Static app shell with the regions from the spec.
3. Timeline engine next, since most other features depend on it.
4. Media asset + preview.
5. Inspector + effects + keyframes.
6. Export pipeline (last because it needs every other piece stable).