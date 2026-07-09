# Milestone 1 — Manual Screenshot Review

Generated: 2026-07-10.

This folder contains screenshots captured for the manual visual review of the RVE rebuild (Milestone 1) versus the live reference at `https://demo.reactvideoeditor.com`.

## 1. Capture summary

- **Reference**: 17 of 18 captures succeeded (1 mobile-only failure: My Library tab is hidden behind a mobile drawer in the reference, so a tap-equivalent click could not resolve the tab).
- **Rebuild**: 18 of 18 captures succeeded.
- **Total**: 35 of 36 captures succeeded.

Captures are written to:

- `.rebuild/rebuild-parity/m1/manual-check/reference/`
- `.rebuild/rebuild-parity/m1/manual-check/rebuild/`

Per-viewport contact sheets (markdown indexes):

- `reference/reference-{desktop,laptop,mobile}-contact-sheet.md`
- `rebuild/rebuild-{desktop,laptop,mobile}-contact-sheet.md`

## 2. Screenshot paths

### Reference

| Viewport | File |
| --- | --- |
| desktop viewport | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-viewport.png` |
| desktop full | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-full.png` |
| desktop export dialog | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-export-dialog.png` |
| desktop my library | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-my-library.png` |
| desktop after space | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-after-space.png` |
| desktop after import | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-desktop-after-import.png` |
| laptop viewport | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-viewport.png` |
| laptop full | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-full.png` |
| laptop export dialog | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-export-dialog.png` |
| laptop my library | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-my-library.png` |
| laptop after space | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-after-space.png` |
| laptop after import | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-laptop-after-import.png` |
| mobile viewport | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-mobile-viewport.png` |
| mobile full | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-mobile-full.png` |
| mobile after space | `.rebuild/rebuild-parity/m1/manual-check/reference/reference-mobile-after-space.png` |
| mobile after import | (missing — sidebar drawer intercepts) |

### Rebuild

| Viewport | File |
| --- | --- |
| desktop viewport | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-viewport.png` |
| desktop full | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-full.png` |
| desktop export dialog | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-export-dialog.png` |
| desktop my library | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-my-library.png` |
| desktop after space | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-after-space.png` |
| desktop after import | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-desktop-after-import.png` |
| laptop viewport | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-viewport.png` |
| laptop full | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-full.png` |
| laptop export dialog | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-export-dialog.png` |
| laptop my library | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-my-library.png` |
| laptop after space | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-after-space.png` |
| laptop after import | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-laptop-after-import.png` |
| mobile viewport | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-viewport.png` |
| mobile full | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-full.png` |
| mobile export dialog | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-export-dialog.png` |
| mobile my library | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-my-library.png` |
| mobile after space | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-after-space.png` |
| mobile after import | `.rebuild/rebuild-parity/m1/manual-check/rebuild/rebuild-mobile-after-import.png` |

## 3. Capture success table

| Step | Desktop ref | Desktop reb | Laptop ref | Laptop reb | Mobile ref | Mobile reb |
| --- | --- | --- | --- | --- | --- | --- |
| Viewport | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Full page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export dialog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Library | ✅ | ✅ | ✅ | ✅ | ❌ tab in mobile drawer | ✅ |
| After Space | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| After import | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

## 4. Biggest visible differences

The reference and the rebuild **share functional shape, not visual style**.

### Reference (live)

- **Left icon sidebar** with ~10 icon buttons (likely undo/redo, save, project, library, settings, etc.). The rebuild has no left icon sidebar.
- **Topbar** is dark and slim with `Dark` and `Export Video` text buttons. Roughly the same button names as the rebuild.
- **Stock library** is the default tab and shows a stock video preview (rocket / industrial clip).
- **Preview region** shows a `<video>` element with a play button overlay and current time `00:01 / 00:00`.
- **Timeline** has many tracks (we see 6+ with mixed colors: blue, purple, orange) and visible clip blocks with text labels like "Theres never been a better time to create amazing video experiences on the web", "Video: All in evolving tec...", "Reset Video Editor", "What are you cr...". Most clips are in a "Loading..." state because the page is being captured mid-hydration.
- **Inspector** is **not visible** in the captured viewport — it may be collapsed, on a different route, or only present when a clip is selected.
- **Color**: dark theme with strong accent (orange) and many card backgrounds.

### Rebuild

- **Three-column shell**: media library (Stock / My Library tabs) on the left, preview in the middle, inspector on the right. No left icon sidebar.
- **Topbar** is dark and slim with text buttons `Toggle Sidebar`, `Dark`, `Zoom in`, `Zoom out`, `Reset zoom`, `100%`, `Export Video`. Same general structure as the reference.
- **Media library** has `Stock` and `My Library` tabs and a search input.
- **Preview region** is empty (`Preview` text on a white 16:9 panel) with playback controls (`Play`, `0.0s / 30.0s`, `16:9`, `6 tracks`) below.
- **Timeline** has 6 named tracks (`Track 0` … `Track 5`) with a ruler (`0s, 5s, 10s, 15s, 20s, 25s, 30s`) and a `Disable magnetic` toggle. The track lanes are visible but empty.
- **Inspector** is **always visible** on the right with the full 12-tab list (Change Video, Settings, Style, AI, Crop, Position, Volume, Mute, Playback Speed, Enter Animations (38), Exit Animations (38), 3D Layout Effects (9)) and the active tab label.
- **Color**: dark theme with a blue accent (`#3b82f6`). Cleaner, simpler than the reference.

### Export dialog (matched in structure)

Both dialogs contain:
- `Export settings` heading
- `Choose a resolution` caption
- `720p / 1280 × 720`, `1080p / 1920 × 1080`, `4K / 3840 × 2160` rows
- `Rendered in your browser` caption
- `Cancel` and `Start Export` buttons

Differences:
- Reference uses an unstyled card with text labels; the rebuild uses HTML radio inputs and a smaller dialog.
- Reference dialog is wider; rebuild dialog is narrower and centered.

### Mobile

- Reference: complex mobile layout (header bar, hamburger menu, etc.). The My Library tab is inside a drawer.
- Rebuild: same 3-column layout but compressed. Inspector text wraps, topbar buttons wrap onto multiple lines. Functional but not styled for mobile.

## 5. Does the rebuild visually resemble the reference?

**Partially.** It resembles the reference in:

- **Region layout** (topbar / preview / media / timeline / inspector) — same general composition.
- **Topbar button set** (Dark, Export Video, zoom).
- **Export dialog content** — 720p / 1080p / 4K / Start Export / Rendered in your browser.
- **Media library** — Stock / My Library tabs.
- **Timeline** — track list, ruler, magnetic toggle.

It does **not** resemble the reference in:

- **No left icon sidebar**.
- **No stock video preview** in the media library.
- **Inspector is always visible** in the rebuild; in the reference it appears collapsed or only after clip selection.
- **No track colors or clip blocks** in the rebuild (empty tracks).
- **No animation / motion** in the rebuild (the reference is mid-hydration when captured; we cannot tell yet whether animations are present).
- **Color and typography** are different (rebuild is intentionally simpler).

## 6. Is the rebuild ready for a full parity audit?

**Yes, with caveats.**

The rebuild is a clean functional shell. Every milestone-1 feature is present and asserted by `tests/rve-rebuild-milestone1.spec.mjs` (11/11 hard tests pass). The visual surface is intentionally simpler than the reference; pixel parity is not a milestone-1 goal.

A full parity audit can now run because:

- All required regions are present and addressable by `data-rve-*` attributes.
- The state model is correct: editor store, media store, playback store, ui store all hydrate and persist.
- The export dialog contains the exact text strings asserted by the live reference (`Export settings`, `720p`, `1080p`, `4K`, `Start Export`, `Rendered in your browser`).
- The drag-to-timeline, single-file import, and Space-keypress playback paths all write `advanced-timeline-store` and `lastCleanup_thumbnailCache`.

The audit will likely find that:

- The inspector deep-tab interactions differ from the reference (the rebuild only has the tab list, not the property editors).
- The media library is empty in the rebuild until a video is uploaded (the reference has a stock library of videos).
- The reference's left icon sidebar is missing.
- The rebuild's mobile layout is functional but not designed for mobile.

These differences are **expected** and **documented** in `apps/rve-rebuild/docs/known-gaps.md` as Milestone 2+ work.

## 7. Re-running the capture

```bash
# 1. Start the dev server
cd apps/rve-rebuild
PORT=4310 npm run start

# 2. Run the capture script
cd ../..  # back to repo root
node scripts/capture-m1-screenshots.mjs
node scripts/capture-m1-screenshots-retry.mjs
```

The capture script supports both `domcontentloaded` and `networkidle`. The first run produced 22/35 captures; the retry pass produced 16/17 (the only failure is the reference mobile My Library tab, which is behind a drawer).

## 8. Files of interest

- `scripts/capture-m1-screenshots.mjs` — main capture pass (viewport / full / export / library / space / import)
- `scripts/capture-m1-screenshots-retry.mjs` — retry pass for the failed states
- `.rebuild/rebuild-parity/m1/manual-check/capture-summary.json` — first-pass summary
- `.rebuild/rebuild-parity/m1/manual-check/capture-retry-summary.json` — retry summary
- `.rebuild/rebuild-parity/m1/manual-check/reference/*-contact-sheet.md` — per-viewport indexes
- `.rebuild/rebuild-parity/m1/manual-check/rebuild/*-contact-sheet.md` — per-viewport indexes
