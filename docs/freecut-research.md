# FreeCut Research Plan

`github.com/walterlow/freecut` is an open-source browser video editor.
This document is a research checklist; populated notes live in
`.research/freecut-notes.md`.

## License obligations

Before reading the FreeCut source, check the project's `LICENSE` file.
Common obligations:

- Attribution.
- Share-alike (if GPL/AGPL).
- Source disclosure (if AGPL).

The harness must respect the license and never paste copyrighted FreeCut
code into the rebuild.

## What to study

1. **App stack** — framework, state management, build tool.
2. **Timeline model** — tracks, clips, playhead, zoom.
3. **Tracks/clips/assets model** — fields and relationships.
4. **Media import** — file picker, drag-drop, URL.
5. **Preview render loop** — `<video>` + canvas, requestAnimationFrame.
6. **Export pipeline** — MediaRecorder, ffmpeg.wasm, WebCodecs.
7. **Workers** — what runs off-main-thread.
8. **Browser APIs** — which ones are used (Web Audio, MediaSource, etc.).
9. **Storage** — localStorage / IndexedDB schema.
10. **State management** — Zustand / Redux / other.
11. **Component structure** — top-level directories.

## How to study

```bash
git clone https://github.com/walterlow/freecut.git .research/freecut
# shallow clone if disk is constrained
git clone --depth 1 https://github.com/walterlow/freecut.git .research/freecut
```

Then read:

- `README.md`
- `package.json`
- top-level source directory
- the largest/most relevant source files (track, clip, timeline,
  export)

## What to record

For each item above, write a short note in
`.research/freecut-notes.md`. Examples:

- "Stack: Vite + React + TypeScript + Zustand."
- "Timeline: tracks are an array of Track objects; clips live inside
  tracks."

## What NOT to do

- Don't paste FreeCut source into the rebuild.
- Don't copy FreeCut's exact API shapes verbatim; design the rebuild's
  own.
- Don't reuse FreeCut's branding.
- Don't claim FreeCut's code is the rebuild.

## Useful framing

The rebuild is to FreeCut as a translator's work is to the source
language: it preserves **meaning** (behavior) without reproducing
**form** (literal code).