# Milestone 1

## Goal

Move the following features from `hard_proof` / `code_correlated` to `implemented_in_rebuild`:

- F001 App shell
- F002 Topbar
- F004 Preview region
- F007 Asset import
- F008 / F028 Export dialog
- F010 / F031 Persistence
- F012 Media library tabs
- F013 Drag to timeline
- F019 Timeline zoom
- F020 Playback
- F022 Inspector / properties

## Acceptance

| Feature | Hard test |
| --- | --- |
| F001 | `tests/rve-rebuild-milestone1.spec.mjs > shell loads` |
| F002 | `topbar has Toggle Sidebar, Dark, Export Video buttons` |
| F004 | `shell loads with ... preview` |
| F007 | `single-file import: file input accepts video/* and adds a media card` |
| F008 / F028 | `export dialog opens with 720p / 1080p / 4K + Start Export` |
| F010 / F031 | `storage bootstrap: idb_migration_v1_done exists` + `persistence after reload` |
| F012 | implicit (Stock / My Library tabs are present and clickable) |
| F013 | `drag-to-timeline: drops a media card onto a track and adds an item` |
| F019 | `timeline zoom: zoom in / out / reset changes the display` |
| F020 | `playback: pressing Space toggles isPlaying and writes advanced-timeline-store` |
| F022 | `inspector: tab list visible, clicking 3 tabs changes active label` |

## Status (this run)

- 11 of 11 milestone-1 hard tests written.
- Build + dev server wiring complete (`playwright.config.mjs` + `package.json` scripts).
- Test result: **pending Phase 8 run** (npm install + dev server start + Playwright run).
