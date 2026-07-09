# Video Editor Architecture (general)

This is the architectural shape of a typical browser video editor. Use it
as a reference for the rebuild. None of it is specific to the target.

## Top-level layout

```
+-------------------------------------------------+
| TopBar: logo, project name, save state, export  |
+--------+--------------------+-------------------+
|        |                    |                   |
| Media  |     Preview        |    Inspector      |
| Library|     Player         |    (Properties)   |
|        |                    |                   |
+--------+--------------------+-------------------+
|                                                 |
|                  Timeline                       |
|  [ruler/playhead][tracks][clips]                |
+-------------------------------------------------+
```

## Layers

1. **State store** (Zustand, Redux, Jotai, etc.)
   - Project, sequence, tracks, clips, assets.
   - Selection, playback state.
   - Undo/redo history.
2. **UI components** (React/Svelte/Vue)
   - AppShell, TopBar, MediaLibrary, Preview, Timeline, Inspector,
     ExportDialog.
3. **Media engine** (Web Worker)
   - Decode, thumbnail, waveform, metadata extraction.
   - Optional: transcode via ffmpeg.wasm.
4. **Renderer**
   - HTMLVideoElement for preview.
   - Canvas overlay for compositing effects/text.
   - WebCodecs for hardware-accelerated decode/encode (newer browsers).
5. **Persistence**
   - `localStorage` for prefs.
   - IndexedDB for project state, thumbnails, autosaves.
   - Project JSON file export/import.
6. **Keyboard shortcuts**
   - Declarative map with platform-aware modifiers.

## Timeline model

A timeline is a list of tracks; each track is a list of clips. Each clip
references an asset and a start/in/out in source time. Selection is a
set of clip IDs.

State mutations:

- Add/remove track.
- Add/move/trim/split clip.
- Set selection.
- Update clip properties (effect, transition, keyframe).

## Preview rendering

The simplest approach:

- One `<video>` element per visible video clip.
- A canvas overlay for text/effects.
- A Web Audio graph for audio.

A more performant approach:

- One `<video>` per track, layered via z-index.
- `<canvas>` for effects.
- WebCodecs `VideoDecoder` + `VideoEncoder` for export.

## Export pipeline

Common approaches:

- **MediaRecorder** on a `<canvas>` + `<audio>` graph. Simple, but codec
  choices are limited.
- **ffmpeg.wasm** in a Web Worker. Slower, but flexible.
- **WebCodecs + mp4-muxer / webm-muxer** in a Worker. Modern, fastest.

## Persistence model

- Project state is JSON.
- Thumbnails are blobs in IndexedDB.
- Autosave debounced to every N seconds.

## Open-source reference projects

- **FreeCut** (`github.com/walterlow/freecut`) — see
  `.research/freecut-notes.md`.
- **LosslessCut** — desktop FFmpeg wrapper, not browser-based, but a
  great reference for trim/split semantics.
- **Remotion** — React-based programmatic video.
- **Shotcut / Kdenlive / OpenShot** — desktop NLEs. Reference only.

(For the actual comparison, see
`.research/open-source-video-editor-comparison.md`.)