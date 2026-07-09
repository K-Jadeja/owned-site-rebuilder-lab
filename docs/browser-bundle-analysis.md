# Browser Bundle Analysis

How to extract architecture clues from public JS/CSS without bypassing
access controls.

## What we read

- `.rebuild/reference/bundles/bundles.json` — list of every JS/CSS/worker
  URL the browser received.
- URL patterns: `_next/`, `__remix`, `__nuxt`, `chunk-*.js`,
  `webpack-runtime`, `vite/`.
- Source map references (`*.map`) only if the server delivers them
  publicly.

## What we DO NOT do

- We do not brute-force, scrape, or guess private source-map paths.
- We do not download closed-source private modules.
- We do not paste large minified bodies into reports.

## Clues → inferences

| Clue | Likely meaning |
| --- | --- |
| `_next/static/chunks/...` | Next.js |
| `__remixContext` | Remix |
| `__nuxt` | Nuxt |
| `webpack-runtime` | Webpack |
| `@vite/client` | Vite |
| `chunk-<name>.js` with content-hash | Webpack code-splitting |
| `tailwind.css` or `@tailwind` directives | Tailwind CSS |
| `ffmpeg/ffmpeg` + `*.wasm` | ffmpeg.wasm (likely for transcode/export) |
| `wavesurfer` | Audio waveform rendering |
| `video.js`, `hls.js`, `shaka-player` | Streaming preview |
| `react-dom` chunk | React UI |

See `.rebuild/features/bundle-analysis.md` for the populated table after
running `npm run bundles`.

## How to verify a clue

1. Read the URL pattern from the captured network log.
2. Optionally fetch the asset directly (it's already public — the browser
   did) and look for top-level identifiers (e.g., `__NEXT_DATA__`,
   `__remixContext`).
3. If a source map is publicly delivered (`.map` URL is in the network
   log), inspect the source list — but never bypass access controls.

## Reporting

The bundle analysis is summarized in
`.rebuild/features/bundle-analysis.md`. The report:

- Lists JS/CSS/WASM/Worker counts.
- Lists framework/library clues.
- Lists top bundles (URL, status, content-type).
- Records source map presence (or absence) without bypassing anything.