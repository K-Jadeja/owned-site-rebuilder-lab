# Bundle Analysis

How to extract architecture clues from public JS/CSS without bypassing
access controls.

## What we read

- `.rebuild/reference/bundles/bundles.json` — list of every JS/CSS/worker
  URL the browser received.
- File names: `chunk-*.js`, `[name].[hash].js`, `[framework].js`.
- Visible globals: e.g., `__NEXT_DATA__`, `__remixContext__`, `__VITE__`.
- Source map references at the bottom of JS files (`//# sourceMappingURL=...`)
  — **only if publicly delivered**.

## What we DO NOT do

- We do not brute-force, scrape, or guess private source-map paths.
- We do not download closed-source private modules.
- We do not paste large minified bodies into reports.

## Clues → inferences

| Clue | Likely meaning |
| --- | --- |
| File name `chunk-*.js` + visible `__NEXT_DATA__` | Next.js App Router or Pages Router |
| File name `[a-z]-*.js` + `__remixContext__` | Remix |
| Worker URL `*.worker.js` | Web Worker; possibly media decode/render |
| `*.wasm` request | WASM module; possibly ffmpeg.wasm, mp4box, etc. |
| CSS file with `tailwind` in name or visible `@tailwind` directives | Tailwind CSS |
| Module `monaco-editor` or `codemirror` | Code editor (usually not relevant for video editor) |
| Module `wavesurfer.js` | Audio waveform rendering |
| Module `@ffmpeg/ffmpeg` + WASM | Browser-side transcode/export |
| Module `video.js`, `hls.js`, `shaka-player` | Streaming preview |
| Module `react`, `react-dom` chunks | React-based UI |

## Report

`.rebuild/features/bundle-analysis.md` lists:

- All JS bundles with size hints.
- All CSS bundles.
- All worker URLs.
- All WASM URLs.
- Detected framework(s).
- Detected feature libraries.
- Source map availability (yes/no, public URL if any).
- Caveats.