# Appendix — Feature Probes

This appendix expands on the per-feature probes.

## Inputs

- `.rebuild/tests/feature/` — per-feature before/after evidence.
- `.rebuild/deep-import/` — single-file import evidence.
- `.rebuild/features/selector-map.md` — candidate selectors.

## Scripts

- `scripts/deep-probe.mjs` — 10-feature sweep.
- `scripts/single-file-import-probe.mjs` — single-file upload.
- `scripts/selector-miner.mjs` — clip/track/playhead candidate mining.
- `scripts/decode-state-stores.mjs` — JSON store decoder.

## Probe matrix

| Probe | Selector strategy | Outcome |
| --- | --- | --- |
| Media import (F007) | My Library tab → `<input type="file">` → `setInputFiles` | upload succeeds, bodyText + storage mutate |
| Drag/drop (F013) | `[draggable="true"]` + computed position | track headers draggable=true observed |
| Clip selection (F015) | `[data-clip-id]`, `[data-item-id]` | none matched, refined candidates in selector-map |
| Clip move (F017) | mouse-down/up + coordinates | drag accepted, no assertion yet |
| Trim/split (F016) | key press `s`/`b`/`S`/`B` | no shortcut hint observed, status = inferred_from_bundle |
| Zoom (F019) | role=button with /zoom/ | click accepted, indicator changes |
| Playback (F020) | `page.keyboard.press('Space')` | advanced-timeline-store created |
| Undo/redo (F030) | `Control+Z` / `Control+Shift+Z` | no error, no observable side effect yet |
| Export dialog (F008) | role=button with /export/ | dialog opens with 720p/1080p/4K + Start Export |
| Persistence after reload (F031) | `page.reload()` after Space | advanced-timeline-store persists |

## Single-file import evidence

The single-file import probe fixes the previous bug (multiple files
into a single-file input). It now:

1. Boots the app.
2. Switches to My Library.
3. Locates the single `<input type="file">`.
4. Calls `setInputFiles(sample.mp4)` (one file).
5. Captures before/after body text, localStorage, IndexedDB, network.
6. Tries a drag-to-timeline gesture.
7. Captures after-timeline text, storage, etc.

Observed outcomes:

- `lastCleanup_thumbnailCache` added to `localStorage`.
- Console: `[ThumbnailCache] Generating new sprite for key: video-thumbnail-...`.
- Console: `[ThumbnailCache] Successfully cached sprite for key: video-thumbnail-... firstTimestampSec: 0 dimensions: 284x120 size: 0.01MB tileHeight: 40px totalTiles: 10 interval: 1s`.
- Body text changes.
- `advanced-timeline-store` added during the drag-to-timeline attempt.

## Selector mining

`scripts/selector-miner.mjs` scanned the live DOM for:

- elements with `draggable="true"`
- elements with `transform` styles
- elements with class containing timeline, clip, track, item, video, audio, rve
- elements with text matching media titles
- elements inside the bottom timeline area
- elements with role=listitem, option, gridcell, slider, button
- elements with pointer cursor
- canvas/video overlays

It produced 82 candidates sorted by confidence. The top suggestions
include:

- `[draggable="true"]` for track headers.
- `[role="slider"]` for zoom level control.
- `[role="tab"]` for the Stock / My Library tabs.
- `[role="dialog"]` for export dialog.

No `[data-clip-id]` or `[data-item-id]` was found. The app appears
to use implicit positioning rather than explicit clip data
attributes.