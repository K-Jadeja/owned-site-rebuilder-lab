# Video Editor Architecture (rebuild plan)

This document is the **independent** architecture plan for a browser video
editor rebuild. It is informed by FreeCut's MIT-licensed architecture but
uses its own naming, structure, and abstractions. No FreeCut source is
copied.

## Layers

```
┌───────────────────────────────────────────────────────┐
│  UI components (React + TS + Vite + Tailwind + shadcn) │
├───────────────────────────────────────────────────────┤
│  Feature stores (Zustand domain stores + facade)      │
├───────────────────────────────────────────────────────┤
│  Action modules (mutations + undo/redo via wrapper)   │
├───────────────────────────────────────────────────────┤
│  Runtime (player, composition engine, scrub renderer) │
├───────────────────────────────────────────────────────┤
│  Infrastructure (storage, export worker, GPU effects, │
│                  media decode, analytics)             │
└───────────────────────────────────────────────────────┘
```

## State model

Use a **discriminated union** for `TimelineItem`:

```ts
type TimelineItem =
  | VideoItem
  | AudioItem
  | TextItem
  | ImageItem
  | ShapeItem
  | AdjustmentItem;
```

Each item carries:

- `id`, `trackId`, `label`
- `from`, `durationInFrames` (Remotion-style)
- `mediaId?` (for media-bound items)
- `trimStart`, `trimEnd`, `sourceStart`, `sourceEnd`,
  `sourceDuration`, `sourceFps`
- `speed`, `isReversed`
- `transform?`, `crop?`
- `volume?`, audio fades, EQ bands (for audio/video)
- `effects?`, `keyframes?`, `transitions?`

Tracks carry `type` (`video | audio | text`), `order` (lower = higher
visually), `muted`, `hidden`, `locked`, and optional group parent.

## State management

- Use **Zustand** with one domain store per concept
  (items, tracks, transitions, keyframes, markers, playback, selection,
  dialogs, project meta).
- Expose a `useTimelineStore` facade that picks from domain stores.
- Components use selectors; action code uses `domainStore.getState()`.
- All timeline mutations go through action modules
  (`features/timeline/actions/*`) and an `execute()` wrapper that
  pushes/pops commands for **undo/redo** (e.g., via Zundo).

## Runtime

- **Player**: a single clock driven by `requestAnimationFrame`.
- **Composition engine**: composes items per frame using a stack of
  renderers (video, audio, text, shape).
- **Scrub renderer**: pre-decodes frames around the playhead for
  responsive scrubbing (with Web Worker prewarm).
- **GPU effects / transitions** (optional for v1): WebGPU pipelines
  with Canvas 2D fallback.

## Export

Web Worker pipeline:

```
source media
  ↓
decode (Mediabunny / VideoDecoder)
  ↓
apply effects (WebGPU or Canvas 2D)
  ↓
encode (VideoEncoder / WebCodecs)
  ↓
mux (mp4-muxer / webm-muxer)
  ↓
download or persist
```

## Persistence

- **Project** as a JSON document.
- **Autosave** debounced to every 5 seconds.
- **Storage**:
  - `localStorage` for user preferences (theme, language, hotkeys).
  - **IndexedDB** for project state, thumbnails, and waveform data.
  - Optional: File System Access API workspace folder (Chromium-only).

## Keyboard shortcuts

- Declarative map in `src/config/hotkeys.ts`.
- Use a library like `react-hotkeys-hook`.
- Provide a Settings dialog that lists every shortcut.

## Project structure (rebuild)

```
src/
  app/                    bootstrap, error boundary
  features/
    editor/               shell + toolbar + panels
    timeline/             tracks/clips/actions/services
    preview/              canvas, scrub renderer, transport
    inspector/            per-clip properties + keyframes
    effects/              effect UI + registry
    transitions/          transition UI + renderers
    text/                 text overlay editor
    media-library/        import + metadata + thumbnails
    export/               export dialog + worker
    projects/             open/save/import/export
    settings/             hotkeys, theme, language
    shortcuts/            shortcut list UI
  runtime/
    player/               clock, source pools
    composition/          per-frame composition
  infrastructure/
    storage/              IndexedDB layer
    media/                decode, thumbnails, waveforms
    export/               worker
    gpu-effects/          (optional) WebGPU
    gpu-transitions/      (optional) WebGPU
  shared/
    state/                domain stores + facade
    types/                shared TS types
    ui/                   cn helper, property controls
    utils/                color, easing, async, workers
  components/             shadcn-style primitives
  config/                 hotkeys, layout config
  i18n/                   strings (start with English)
```

## Phased rollout

1. **v0.1 — App shell + static timeline + media library**:
   no real engine; just UI + state shape.
2. **v0.2 — Playback + trim/split + selection**:
   HTMLVideoElement per clip, no effects.
3. **v0.3 — Inspector + keyframes + basic text/effects**:
   CSS filter + transform for v1 effects.
4. **v0.4 — Export**:
   MediaRecorder + canvas for v1; WebCodecs later.
5. **v0.5 — Persistence**:
   localStorage + IndexedDB autosave.
6. **v0.6 — FreeCut-grade** (optional):
   WebGPU effects + workspace folder.

## Tradeoffs vs FreeCut

| Decision | FreeCut | Our rebuild (v1) |
| --- | --- | --- |
| Storage | Workspace folder (FS API) | IndexedDB (broader browser support) |
| Effects | WebGPU-only | Canvas 2D + CSS filters; WebGPU later |
| i18n | 9 languages | English only |
| Routing | TanStack Router | None (single-page editor) |
| i18n key strategy | partials + base | simple flat JSON |
| Render loop | scrub render with mutex | simple RAF |

## What we explicitly do NOT borrow from FreeCut

- File names, function signatures, exact field names.
- Their hotkey map.
- Their CSS variable names.
- Their Tailwind config.