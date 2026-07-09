# Acceptance Tests

Per-feature manual + automated acceptance criteria. Generated alongside
the feature inventory.

> Acceptance criteria are observable and testable. Visual matching alone
> is not enough.

## F001 App shell loads

- Manual:
  - [ ] Open the target URL in a modern browser. App shell hydrates within 5s.
  - [ ] No fatal page errors in the browser console.
- Automated:
  - file: `tests/reference-capture.spec.mjs`
  - asserts: response status < 400; body exists.

## F002 Topbar / toolbar

- Manual:
  - [ ] Top of app shows a region with at least one clickable element.
- Automated:
  - file: `tests/feature-parity-plan.spec.mjs`
  - test: counts header/main/aside/footer/nav presence.

## F003 Media library region

- Manual:
  - [ ] Left or right sidebar shows media/library region.
- Automated:
  - heuristic: role/text search for "media", "library", "assets".

## F004 Preview / player region

- Manual:
  - [ ] Center area shows a video element or canvas.
- Automated:
  - heuristic: querySelector('video, canvas').

## F005 Timeline region

- Manual:
  - [ ] Bottom area shows timeline with tracks.
- Automated:
  - heuristic: search DOM for "timeline", "tracks", "ruler".

## F006 Inspector region

- Manual:
  - [ ] Right area shows inspector/properties panel.
- Automated:
  - heuristic: search DOM for "inspector", "properties".

## F007 Asset import / add media

- Manual:
  - [ ] Click "Add Media" — file picker opens.
  - [ ] Pick a video — it appears in library.
- Automated (skipped without fixture):
  - test.skip in `tests/feature-parity-plan.spec.mjs` until fixture
    media is added.
- Fixture plan:
  - Create `.rebuild/tests/fixtures/sample.mp4` and `sample.mp3`
    (tiny, ~1 MB each) using ffmpeg locally; if unavailable, document
    manual file path.

## F008 Export flow

- Manual:
  - [ ] Click "Export" — dialog opens with preset selector.
  - [ ] Choose preset, click "Render" — progress shown.
  - [ ] On completion, file downloads.
- Automated (skipped without project state):
  - test.skip.

## F009 Undo / redo

- Manual:
  - [ ] Make a change.
  - [ ] Press Ctrl/Cmd+Z — change reverts.
  - [ ] Press Ctrl/Cmd+Shift+Z — change reapplies.
- Automated:
  - file: `tests/feature-parity-plan.spec.mjs`
  - test: heuristic for undo/redo control presence.

## F010 Persistence / storage

- Manual:
  - [ ] Open DevTools → Application → Local Storage.
  - [ ] After interaction, at least one app key is written.
- Automated:
  - file: `tests/feature-parity-plan.spec.mjs`
  - test: writes and reads a probe key in localStorage.

## F011 Project create/load/save

- Manual:
  - [ ] "New Project" creates an empty timeline.
  - [ ] "Open" opens a project JSON (if supported).
  - [ ] "Save" persists to IndexedDB / localStorage / file.
- Automated:
  - heuristic: presence of new/open/save controls.

## F012 Media library search/sort

- Manual:
  - [ ] Type into search — list filters.
  - [ ] Sort dropdown — list reorders.
- Automated (skipped without media fixtures):
  - test.skip.

## F013 Drag/drop to timeline

- Manual:
  - [ ] Drag a media item to the timeline.
  - [ ] Drop — clip appears.
- Automated (skipped without media fixtures):
  - test.skip.

## F014 Track management

- Manual:
  - [ ] Add/remove track via context menu.
  - [ ] Mute/hide/lock toggles work.
- Automated:
  - heuristic: presence of track header controls.

## F015 Clip trimming

- Manual:
  - [ ] Drag clip left edge — in-trim changes.
  - [ ] Drag clip right edge — out-trim changes.
- Automated (skipped without media):
  - test.skip.

## F016 Clip splitting

- Manual:
  - [ ] Position playhead over a clip.
  - [ ] Press split shortcut — clip splits at playhead.
- Automated (skipped without media):
  - test.skip.

## F017 Clip movement

- Manual:
  - [ ] Drag clip horizontally — moves in time.
  - [ ] Drag clip vertically — moves between tracks.
- Automated (skipped without media):
  - test.skip.

## F018 Snapping

- Manual:
  - [ ] Toggle snap on/off.
  - [ ] Drag a clip near another — it snaps.
- Automated (skipped without media):
  - test.skip.

## F019 Timeline zoom

- Manual:
  - [ ] Ctrl + scroll wheel zooms.
  - [ ] Zoom buttons change the timeline scale.
- Automated:
  - heuristic: presence of zoom controls.

## F020 Playback

- Manual:
  - [ ] Press Play — preview plays.
  - [ ] Press Pause — preview pauses.
  - [ ] Press Space — toggles playback.
- Automated (skipped without media):
  - test.skip.

## F021 Scrubbing

- Manual:
  - [ ] Click timeline ruler — playhead moves.
  - [ ] Drag playhead — preview scrubs.
- Automated (skipped without media):
  - test.skip.

## F022 Inspector / properties

- Manual:
  - [ ] Select a clip — inspector populates with properties.
- Automated (skipped without media):
  - test.skip.

## F023 Text overlays

- Manual:
  - [ ] Click "Add Text" — text overlay appears on selected track.
- Automated:
  - heuristic: presence of "Add Text" control.

## F024 Transitions

- Manual:
  - [ ] Drag a transition between two clips — transition appears.
- Automated (skipped without media):
  - test.skip.

## F025 Effects

- Manual:
  - [ ] Drag an effect onto a clip — effect applies.
- Automated (skipped without media):
  - test.skip.

## F026 Keyframes

- Manual:
  - [ ] Toggle keyframe mode — keyframe markers appear on clip.
  - [ ] Drag a keyframe — value changes.
- Automated (skipped without media):
  - test.skip.

## F027 Audio waveform

- Manual:
  - [ ] Audio clip displays waveform.
- Automated (skipped without media):
  - test.skip.

## F028 Export settings

- Manual:
  - [ ] Open Export dialog.
  - [ ] Change preset, resolution, fps, format.
  - [ ] Click Render — progress shown.
- Automated (skipped without media):
  - test.skip.

## F029 Keyboard shortcuts

- Manual:
  - [ ] Open shortcuts panel.
  - [ ] Search for a shortcut.
- Automated:
  - heuristic: presence of shortcuts panel control.

## F030 Undo / redo

- (See F009.)

## F031 Persistence after reload

- Manual:
  - [ ] Make changes.
  - [ ] Reload page.
  - [ ] State restored.
- Automated:
  - test: write a marker to localStorage, reload, verify presence.

## F032 Error states

- Manual:
  - [ ] Try to import an unsupported media file.
  - [ ] App shows an error toast.
- Automated:
  - test.skip until fixture exists.

## F033 Empty states

- Manual:
  - [ ] On empty timeline, a placeholder is shown.
- Automated:
  - heuristic: query DOM for "no clips" / "add your first clip".

## F034 Unsupported media handling

- (See F032.)

## Fixture media plan

When automated tests for media-bearing features are needed:

```bash
# Create a 5-second test pattern video
ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=30 -c:v libx264 -pix_fmt yuv420p .rebuild/tests/fixtures/sample.mp4

# Create a 5-second test tone audio
ffmpeg -f lavfi -i sine=frequency=440:duration=5 -c:a libmp3lame .rebuild/tests/fixtures/sample.mp3

# Create a small test image
ffmpeg -f lavfi -i color=red:size=320x240:duration=1 -frames:v 1 .rebuild/tests/fixtures/sample.png
```

If `ffmpeg` is unavailable, document the manual fixture file path
required to enable each test.