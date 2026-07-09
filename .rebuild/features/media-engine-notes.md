# Media Engine Notes

Notes on the media engine: decode, thumbnail, waveform, effects, export.

## Goals

- Decode arbitrary web-playable media in the browser.
- Generate thumbnails for the media library and timeline filmstrip.
- Generate audio waveforms for the timeline.
- Apply effects (CSS filter / WebGPU shader) during preview and export.
- Export the composition to a downloadable MP4 or WebM.

## Decode

- Use `HTMLVideoElement` for preview decoding. Free, fast, works
  everywhere.
- Use **WebCodecs `VideoDecoder`** when frame-accurate access is needed
  (export, scrubbing prewarm).
- Fall back to `requestVideoFrameCallback` for scrubbing.

## Thumbnails

- Use a `<video>` + offscreen `<canvas>` to draw 64×64 frames.
- Sample at evenly spaced intervals across the source.
- Store as blob URLs or PNG blobs in IndexedDB.

## Waveforms

- Decode audio to PCM with `AudioContext` + `OfflineAudioContext` or
  WebCodecs `AudioDecoder`.
- Downsample to N peaks (e.g., 1000) per clip.
- Cache peaks in IndexedDB.
- Render as `<canvas>` paths or SVG.

## Effects (v1)

- CSS `filter` (blur, brightness, contrast, etc.).
- CSS `transform` (translate, scale, rotate).
- Opacity.
- Color via mix-blend-mode.

## Effects (v2+)

- WebGPU shader pipelines.
- LUTs (3D color cubes).
- Custom transitions (crossfade, wipe, dip).

## Export pipeline (v1 — simple)

```
MediaRecorder on <canvas> + Web Audio destination
  → MP4/WebM blob
  → download
```

Limitations:

- Codecs depend on browser support.
- Real-time only; not faster than playback.

## Export pipeline (v2 — WebCodecs)

```
Web Worker:
  for each clip:
    VideoDecoder.decode() → VideoFrame
    apply effects → VideoFrame
    VideoEncoder.encode() → EncodedVideoChunk
  mux with mp4-muxer / webm-muxer
  → ArrayBuffer
  → postMessage to main
  → download
```

This is significantly faster than real-time and supports more codecs.

## Library candidates

- **Mediabunny** (used by FreeCut): unified decode + encode + mux.
- **mp4-muxer** / **webm-muxer**: minimal muxer libs.
- **@ffmpeg/ffmpeg** (WASM): full FFmpeg in browser; slow but flexible.
- **Kokoro** / **@huggingface/transformers**: for TTS / captioning
  (out of scope for v1).

## Open questions for the rebuild

- Do we need multi-track audio mixing for v1, or stereo per track is OK?
- Do we need sample-accurate timing, or is video-frame-accurate enough?
- Do we need GPU effects, or is Canvas 2D sufficient for the first
  rebuild?

These are deferred to v1 planning; the harness records the questions.