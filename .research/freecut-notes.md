# FreeCut Research Notes

Reference: [github.com/walterlow/freecut](https://github.com/walterlow/freecut)

> FreeCut is being studied **only as a licensed MIT architecture reference**.
> No FreeCut source is being copied into the rebuild. License and attribution
> obligations are noted below.

## License

**MIT License**, Copyright (c) 2025 FreeCut.

Obligations:

- Include the MIT copyright + permission notice in derivative works.
- Do not remove the copyright.
- Software is provided "AS IS"; no warranty.

Practical implication for this harness:

- We may quote short snippets for documentation purposes under MIT terms.
- We do not paste FreeCut source into the rebuild.
- We do not reuse FreeCut's branding, copy, or design tokens.
- We credit FreeCut in the rebuild's docs/README.

## Stack

- **React 19** + **TypeScript** (strict).
- **Vite** + **vite-plus** (the dev/build/test/lint/format wrapper).
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives).
- **TanStack Router** (file-based routes).
- **Zustand** + **Zundo** for state + undo/redo.
- **react-hook-form** + **zod** for forms and validation.
- **sonner** for toasts.
- **motion** for animations.
- **i18next** for i18n (9 languages).
- **lucide-react** for icons.

## Architecture (from FreeCut's CLAUDE.md)

```
src/
├── features/              # User-facing UI modules
│   ├── editor/            # Editor shell, toolbar, panels, stores
│   ├── timeline/          # Multi-track timeline, actions, services
│   ├── preview/           # Preview canvas, transform gizmo, scrub renderer
│   ├── export/            # WebCodecs export pipeline (Web Worker)
│   ├── effects/           # GPU effect UI panels and registry
│   ├── keyframes/         # Keyframe animation, Bezier editor, easing
│   ├── media-library/     # Media import, metadata, OPFS proxies, transcription
│   ├── project-bundle/    # Project ZIP export/import
│   ├── projects/          # Project management
│   ├── scene-browser/     # Caption and scene search UI
│   ├── settings/          # App settings
│   └── workspace-gate/    # Workspace picker / permission gate
├── runtime/               # Playback and rendering engines
│   ├── composition-runtime/
│   └── player/            # Clock, video source pools, composition playback
├── infrastructure/        # Platform adapters
│   ├── gpu-effects/, gpu-transitions/, gpu-compositor/, gpu-masks/, gpu-media/,
│   ├── gpu-scopes/, gpu-shapes/, gpu-text/, gpu-shared/
│   ├── analysis/          # Scene detection, captioning, embeddings, optical flow
│   ├── audio/             # SoundTouch-based time-stretch
│   ├── browser/           # Blob URLs, OPFS, mediabunny adapter
│   ├── storage/           # Workspace FS persistence + legacy IDB migration
│   └── thumbnails/        # GPU thumbnail renderer + sampling strategy
├── shared/                # Framework-agnostic primitives + cross-feature state
│   ├── timeline/          # Transition engine/registry/renderers
│   ├── projects/          # Schema migrations and normalization
│   ├── state/             # Zustand stores
│   ├── marquee/           # Marquee-selection hook + overlay
│   ├── logging/
│   ├── ui/                # cn helper, property controls
│   ├── typography/        # Font loading, text style presets
│   ├── graphics/          # Shape generators and path helpers
│   └── utils/             # Managed workers, color/curve math, easing, async
├── components/            # shadcn/ui components + brand assets
├── app/                   # Bootstrap, error boundary, PWA prompt, debug
├── config/                # Hotkeys + editor layout config
├── i18n/                  # i18next setup
├── routes/                # TanStack Router (file-based, auto-generated)
└── types/                 # Shared TypeScript types
```

## State management

- **Zustand** stores split by domain.
- Timeline store is a **facade** over multiple domain stores
  (`items-store`, `transitions-store`, `keyframes-store`,
  `markers-store`, `timeline-settings-store`, `timeline-command-store`).
- Components use the facade with selectors; action code uses
  `domainStore.getState()` directly.
- Timeline mutations go through **action modules** in
  `features/timeline/stores/actions/*.ts` and use an `execute()` wrapper
  that integrates with undo/redo via **Zundo**.
- Never mutate timeline stores directly — go through actions.

## Timeline model

- Discriminated union: `TimelineItem.type` ∈ `video | audio | text | image | shape | adjustment | composition`.
- GIFs use `image` type.
- Item positioning follows **Remotion** convention: `from` (start frame in
  project FPS) + `durationInFrames`.
- Trim: `trimStart`, `trimEnd`, `sourceStart`, `sourceEnd`,
  `sourceDuration`, `sourceFps` — all in **source-native FPS frames**, not
  project FPS.
- Speed: `speed` (0.1..10.0), `isReversed`.
- Transform: `transform?: TransformProperties`.
- Audio: `volume` (dB), `audioFadeIn/Out`, EQ bands (low-cut, low shelf,
  low-mid, mid, high-mid, high shelf, outer band1/6), pitch shift.
- Markers (`ProjectMarker[]`), transitions, keyframes are sibling
  collections at the timeline level.

## Tracks

- `TimelineTrack` with `isGroup` flag (group tracks are headers only —
  never place items on them).
- `order` convention: lower value = visually higher. New tracks go at
  `minOrder - 1`.
- Group gate behavior (mute/visible/locked) propagates via
  `resolveEffectiveTrackStates()`.
- Pre-compositions: 1-level nesting only, dedicated
  `compositions-store` and `composition-navigation-store`.

## Preview / playback

- Player runtime in `runtime/player/` provides clock, video source pools,
  composition playback.
- Preview feature in `features/preview/` provides canvas, transform gizmo,
  scrub renderer.
- Effects and transitions are **GPU-only** (WebGPU shaders).
- 13 transition types: fade, wipe, slide, flip, clockWipe, iris,
  dissolve, sparkles, glitch, lightLeak, pixelate, chromatic, radialBlur.

## Export pipeline

- WebCodecs-based export in a **Web Worker**
  (`features/export/workers/export-render.worker.ts`).
- `render-queue-store.ts` manages the queue.
- Mediabunny for decode, WebCodecs for encode.

## Storage

- **Workspace folder** is the source of truth (File System Access API).
- Projects, media metadata, thumbnails, waveforms, gif frames, decoded
  audio, transcripts all live as plain files in the chosen directory.
- IndexedDB only for a tiny handle registry
  (`freecut-handles-db` v1) for `FileSystem*Handle` references.
- Legacy `video-editor-db` is read only by a one-time migration path.

## Media processing

- **Mediabunny** for decode.
- **WebCodecs** for export.
- **WebGPU** for effects and transitions.
- **ONNX Runtime Web** (dev build) for ML features
  (transcription, scene detection, embeddings).
- **Kokoro** + HuggingFace Transformers for TTS.
- **SoundTouch** for time-stretch.

## Keyboard shortcuts

- `react-hotkeys-hook` library.
- `HOTKEY_OPTIONS.preventDefault: true` consumes keys before callback.
- `src/config/` holds the hotkey map.

## What is useful for the rebuild

The following patterns translate cleanly to our target's observable
behavior (we don't copy code; we adopt concepts):

1. **Discriminated-union TimelineItem** — robust for typing different
   item kinds.
2. **Remotion-style frame conventions** (`from` + `durationInFrames`) for
   the timeline — frame-accurate and well-tested.
3. **Domain stores + facade** — keeps Zustand stores from becoming
   monoliths.
4. **Action modules + `execute()` wrapper** for undo/redo — clean
   separation from state mutation.
5. **Web Worker export** — keep encode off the main thread.
6. **Plain-file workspace storage** — but the target likely uses
   IndexedDB or localStorage, so this is a reference, not a directive.
7. **CSS variables for design tokens** (combined with Tailwind 4).
8. **ARIA-first component structure** — Radix primitives give us
   keyboard/role behaviors for free.

## What should NOT be copied

- FreeCut's exact hotkey map.
- FreeCut's exact type field names (use our own).
- FreeCut's component file structure verbatim.
- FreeCut's design tokens / Tailwind config.
- FreeCut's branding (logo, copy).

## Caveats for an independent rebuild

- **WebGPU** is required for the FreeCut-style GPU pipeline. A rebuild
  may need a Canvas 2D fallback for browsers without WebGPU.
- **File System Access API** requires user gesture and is Chromium-only
  in practice. Fallback to IndexedDB or `localStorage` is needed.
- **Mediabunny** and **WebCodecs** are modern; older browsers degrade to
  `<video>` only.
- **i18n with 9 languages** is overkill for a v1 rebuild; start with
  English.

## Reading list (for next session)

- `src/types/timeline.ts` — full timeline type definitions.
- `src/features/timeline/stores/actions/shared.ts` — `execute()` wrapper.
- `src/features/export/workers/export-render.worker.ts` — export pipeline.
- `src/runtime/player/` — playback engine.
- `src/infrastructure/storage/workspace-fs/` — workspace persistence.
- `src/infrastructure/gpu-effects/effects/` — effect registry.
- `src/shared/timeline/transitions/renderers/` — transition renderers.
- `src/config/` — hotkey map.