# Visual Capture

How screenshots are captured and later compared.

## Viewports

Default:

- desktop: `1440x900`
- laptop: `1280x800`
- mobile: `390x844` (Pixel 5 in Playwright config)

Add new viewports by extending `VIEWPORTS` in `scripts/capture-site.mjs`.

## What is captured

- Full viewport screenshot (PNG) at each viewport per route.
- After interaction, an "after" screenshot for each tested control.

## What is NOT captured

- Pixel-perfect diff baseline against an external image (no such image
  exists for an owned but private source).
- Fonts that require licensing beyond the standard system fonts. Only
  `font-family` declarations and visible weights/styles are recorded.
- Dynamic content that requires user data (we use empty state).

## Visual spec

`.rebuild/spec/visual-spec.md` records:

- viewports captured
- layout regions (header, sidebar, media library, preview, timeline, inspector)
- typography (font-family, sizes, weights)
- color palette (CSS variables + computed colors of key regions)
- spacing scale (observed paddings/margins for primary regions)
- component inventory (visible buttons, inputs, toolbars)
- icons/assets list
- responsive behavior (anything that visibly changes between viewports)
- visual unknowns (anti-aliasing, custom cursors, hover-only states)

## Visual comparison (later)

Once a rebuild exists, `scripts/visual-compare.mjs` will compare screenshots
of the rebuilt app against `.rebuild/reference/screenshots/`.

The comparison:

- Aligns viewport sizes.
- Uses pixelmatch (or Playwright's `toHaveScreenshot`) to produce a diff image.
- Records per-region pass/fail.
- Writes `.rebuild/reports/visual-diff.md`.

Until the rebuild exists, this script will produce a "no baseline yet"
report. That is expected and not a failure.