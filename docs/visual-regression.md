# Visual Regression

How this harness treats screenshots and visual comparison.

## What is captured

Three viewports by default:

- desktop: `1440x900`
- laptop: `1280x800`
- mobile: `390x844`

For each viewport:

- `viewport.png` — what is currently visible.
- `full.png` — full-page screenshot, including scrolled-off content.
- `summary.json` — DOM tree summary.
- `styles.json` — computed styles for top-level regions.
- `css-vars.json` — sampled CSS variables.
- `palette.json` — top colors by usage.

After interactive probe runs:

- `parity-empty-<project>.png` — placeholder screenshots per feature
  surface test.

## What is NOT captured

- Fonts beyond CSS-declared `font-family`/weight.
- Cursor icons that only appear on hover.
- Animation states (we capture the resting state).

## Comparison

`scripts/visual-compare.mjs` produces `.rebuild/reports/visual-diff.md`.
Currently it lists reference vs rebuilt screenshots; the actual pixel
diff with `pixelmatch` is staged for after the rebuild exists.

Once a rebuilt app is producing screenshots in
`.rebuild/tests/visual/rebuilt/`, the comparison will:

1. Pair files by basename.
2. Use Playwright or pixelmatch to produce a diff image per pair.
3. Record per-region pass/fail.
4. Write a summary table to `visual-diff.md`.

## Limitations

- Anti-aliasing differs across browsers/GPUs; tolerances will need to be
  loose at first.
- Custom web fonts differ across machines; declare them in the rebuilt
  app's CSS, not in the harness.
- Resize events are not deterministic; tests should set viewport
  explicitly before screenshot.