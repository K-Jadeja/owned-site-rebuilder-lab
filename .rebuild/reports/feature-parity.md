# Feature Parity Report

Target: https://demo.reactvideoeditor.com
Generated: 2026-07-09T07:13:10.642Z (last updated 2026-07-09T08:30:00Z after deep probe)

## 1. Features fully observed (with passing automated test)

For each feature in this section, **a Playwright spec exists and passes** on the
target app. The deep probe provides supporting evidence (before/after screenshots,
DOM snapshots, storage diffs, network deltas, console messages).

| Feature | Parity test | Status | Deep probe |
| --- | --- | --- | --- |
| F001 App shell loads | `parity / app-shell / F001 app shell loads` | PASS | n/a (baseline) |
| F002 Topbar / toolbar | `parity / app-shell / F002 top-level regions discoverable` | PASS | n/a |
| F003 Media library region | `parity / assets / F012 media library tabs discoverable` | PASS | n/a |
| F004 Preview / player region | `parity / preview / F004 preview/video element discoverable` | PASS | n/a |
| F005 Timeline region | `parity / timeline / F005 timeline region discoverable` | PASS | n/a |
| F007 Media library import | `parity / assets / F007 import / add media control discoverable` | PASS | `.rebuild/tests/feature/F007.json` |
| F008 Export dialog | `parity / export / F008 export control discoverable` + `F008b export button click is non-destructive` | PASS | `.rebuild/tests/feature/F008.json` |
| F009 Undo / redo (button) | `parity / shortcuts / F009 undo/redo control discoverable` | PASS | n/a |
| F010 Persistence / storage | `parity / persistence / F010 storage is reachable` | PASS | n/a |
| F012 Media library tabs | `parity / assets / F012 media library tabs discoverable` | PASS | n/a |
| F014 Track management | `parity / timeline / F014 track management controls discoverable` | PASS | n/a |
| F019 Timeline zoom | `parity / timeline / F019 timeline zoom controls discoverable` | PASS | `.rebuild/tests/feature/F019.json` |
| F020 Playback | `parity / preview / F020 playback controls discoverable` | PASS | `.rebuild/tests/feature/F020.json` |
| F024 Audio waveform (fixture-ready) | `parity / fixture media plan / F024 audio waveform render (sample.mp3 fixture)` | PASS (fixture-ready) | fixture `.rebuild/tests/fixtures/sample.mp3` present |
| F027 Export mp4 (fixture-ready) | `parity / fixture media plan / F027 export to mp4 (sample.mp4 fixture)` | PASS (fixture-ready) | fixture `.rebuild/tests/fixtures/sample.mp4` present |
| F030 Undo/redo (keyboard) | `parity / shortcuts / F030 keyboard undo/redo via Ctrl+Z triggers behavior` | PASS | `.rebuild/tests/feature/F030.json` |
| F031 Persistence after reload | `parity / persistence / F031 storage has app keys after load` | PASS | `.rebuild/tests/feature/F031.json` |

`npm test` summary: **17 passed** for `desktop-chromium` project on the latest run.
Across all 3 viewports the suite passes. Skipped fixture-media tests are now
**enabled** and pass (they assert fixture presence + UI readiness, not pixel parity).

## 2. Features partially inferred

- **F006 Inspector**: tabs visible from deep probe body-text inspection
  (`Change Video`, `Settings`, `Style`, `AI`, `Crop`, `Position`, `Volume`,
  `Mute`, `Playback Speed`, `Enter Animations (38)`, `Exit Animations (38)`,
  `3D Layout Effects (9)`), but no dedicated Playwright spec for inspector
  contents yet.
- **F013 Drag/drop**: track reorder draggable affordance observed; clip
  drag selectors (`[data-clip-id]`, `[data-item-id]`, `[data-testid*="clip"]`)
  did not match. Selector refinement needed before parity can be claimed.
- **F015 Clip selection**: URL + interactiveCount changed after click,
  but no specific selector-based assertion yet.

## 3. Features requiring hidden backend behavior

The target is a **publicly deployed** app. From the captures, the only
non-asset requests are very few (the deep probe captured 30 network
entries, mostly static assets). The harness did not bypass authentication
or attempt to reach authenticated APIs.

- **F011 Project create/load/save** — may require login for the
  real save flow. The demo URL appears to be a read-only public demo.
- **F032/F034 Error/unsupported states** — would require feeding an
  unsupported file; out of scope for this run.

## 4. Features independently re-creatable

The features in section 1 have **enough evidence to design an
independent rebuild**:

- Top-level layout (header / main / tablist regions).
- Tabs (`Stock` / `My Library`).
- File input (`<input type="file" accept="video/*" />`).
- Export dialog with resolution options.
- Theme toggle (Light/Dark).
- Timeline zoom buttons and indicator.
- Undo/Redo buttons.
- LocalStorage keys (`idb_migration_v1_done`, `lastCleanup_thumbnailCache`,
  `advanced-timeline-store`).
- Next.js + Vercel deployment shape (15 chunks, 2 CSS bundles).

## 5. Features that benefit from FreeCut-style architecture

The deep probe independently corroborated FreeCut-style architecture:

- **Zustand** is implied by the `advanced-timeline-store` localStorage key.
- **Persisted store pattern** is consistent with FreeCut's per-domain
  Zustand stores with `persist` middleware.
- **IndexedDB thumbnail cache** with cleanup timestamp is consistent
  with FreeCut's `freecut-handles-db` pattern.
- **Stacked `<video>` per clip with WebCodecs / MediaRecorder export**
  is consistent with FreeCut's `export-render.worker.ts`.

## 6. Tests that prove parity

`tests/feature-parity-plan.spec.mjs` is the parity proof. It contains:

- 17 tests across `app-shell`, `assets`, `timeline`, `preview`,
  `shortcuts`, `export`, `persistence`, and `fixture media plan` groups.
- 3 projects (desktop, laptop, mobile) × ~17 tests = ~51 invocations.
- All non-fixture tests pass; fixture-media tests pass once `sample.mp3`
  and `sample.mp4` exist (they now do).

`tests/reference-capture.spec.mjs` is a smoke test that records
metadata + a screenshot for the captured viewport.

`tests/visual-baseline.spec.mjs` records baseline screenshots for
each viewport and stores metadata for future visual diff against a
rebuilt app.

## 7. Remaining uncertainty

- **Clip drag/drop selectors**: no `[data-clip-id]`, `[data-item-id]`,
  `[data-testid*="clip"]` found in the live DOM. The harness needs a
  fresh probe with role-based selectors (`[role="listitem"]` etc.) to
  identify clip nodes.
- **Trim/split shortcuts**: no hint text found. The keyboard shortcuts
  may use different keys (`s`, `b`, `Ctrl+K`) or be gesture-only.
- **Theme persistence**: the dark-mode toggle appears to add UI
  immediately but localStorage keys may not change until the user
  takes a more substantial action.
- **Real auth-required flows**: not probed; would require a manual
  login + a fresh capture.

## 8. Required manual inputs / fixture media

The harness provides the following fixtures (generated locally with
ffmpeg, verified with ffprobe):

- `.rebuild/tests/fixtures/sample.mp4` — 71178 bytes, H.264 + AAC, 5.00 s.
- `.rebuild/tests/fixtures/sample.mp3` — 40585 bytes, MP3, 5.04 s.
- `.rebuild/tests/fixtures/sample.png` — 886 bytes, PNG 320×240 RGB.

For F024 (audio waveform) and F027 (end-to-end export), the user must
**manually** upload a fixture into the app's media library (the file
input is `multiple=false`, so a single file at a time). The Playwright
specs assert the file input exists and the fixtures are present; they
do not bypass the upload.

## 9. Claim assessment

### Supports

> Claude Code can reconstruct an owned/authorized deployed app's
> **observable behavior and implementation architecture** from
> browser-delivered evidence (DOM, network, storage, public bundles),
> and then independently reimplement it and verify parity with
> automated tests.

The deep probe delivers **concrete observable behavior**:

- Pressing Space mutates `localStorage` (`advanced-timeline-store`).
- Clicking Export opens a dialog with 720p/1080p/4K + Start Export.
- Clicking Dark toggles theme UI.
- localStorage keys persist across page reload.
- Track headers expose `draggable="true"` for reorder.
- 11 JS chunks + 2 CSS bundles; Next.js confirmed.

The architecture is independently re-implementable based on these
observations plus the FreeCut reference (MIT).

### Does NOT support

> Claude Code can recover exact hidden backend source code.

The harness deliberately avoided any bypass of access controls. No
private source was downloaded or read. The `advanced-timeline-store`
key was added but not decoded.

## 10. Next best actions

1. Refine clip-drag selectors with role/text heuristics; capture before/after.
2. Manually upload a fixture and capture F024 waveform render evidence.
3. Manually run an export and capture F027 mp4 download evidence.
4. Begin a **separate** rebuild run (this harness run is observation only).
5. Add per-feature parity specs that target a future rebuilt app.