# State Model

Generated: 2026-07-09T07:13:10.643Z

This is an inferred video editor state schema. It is independent of any captured source; it represents what a rebuild would need to maintain.

## Project
- id: string
- name: string
- resolution: { width, height }
- fps: number
- durationMs: number

## Sequence / Timeline
- tracks: Track[]
- playheadMs: number
- zoom: number
- selection: string[] (clipIds)

## Track
- id: string
- type: 'video' | 'audio' | 'text'
- clips: Clip[]
- muted: boolean
- hidden: boolean
- locked: boolean

## Clip
- id: string
- assetId: string
- trackId: string
- startMs: number (timeline start)
- inMs: number (source in)
- outMs: number (source out)
- effects: Effect[]
- keyframes: Keyframe[]

## Asset
- id: string
- kind: 'video' | 'audio' | 'image' | 'text'
- src: string | File
- durationMs: number
- metadata: { width?, height?, size?, mime? }

## Effect / Transition / Keyframe
- See `.claude/skills/owned-site-rebuilder/references/video-editor-features.md`

## Playback state
- isPlaying: boolean
- currentTimeMs: number
- loop: boolean
- volume: number

## Selection state
- selectedClipIds: string[]
- selectedRange?: { startMs, endMs }

## Export settings
- preset: string
- resolution: { width, height }
- fps: number
- bitrateKbps: number
- format: 'mp4' | 'webm'

## Undo / redo history
- past: Action[]
- future: Action[]

## Persistence
- localStorage keys: idb_migration_v1_done, lastCleanup_thumbnailCache
- sessionStorage keys: (none observed)
- IndexedDB databases: see `.rebuild/reference/storage/*.json`

## Observed landmarks
- header — Toggle Sidebar
Dark
Export Video
- main — Toggle Sidebar
Dark
Export Video
90%
1x
0:00.00
/
0:33.70
16
- [role="tablist"] — Stock
My Library

---

# Observed State (Deep Probe, 2026-07-09T08:30:00Z)

This section records concrete storage and runtime state observed during
the deep probe. It **supersedes** the inferred schema above for the
items it covers.

## localStorage keys observed

| Key | Type hint | When it appears |
| --- | --- | --- |
| `idb_migration_v1_done` | numeric timestamp (string) | After first hydration |
| `lastCleanup_thumbnailCache` | numeric timestamp (string) | After first user action (e.g., theme toggle) |
| `advanced-timeline-store` | (not inspected; populated by Zustand persist) | Added on Space key press (F020 deep probe) |

## IndexedDB databases

(Listed in `.rebuild/reference/storage/storage-inspection.json`; only
database names and versions are recorded, no record contents.)

## Runtime DOM landmarks observed

- `header` — width 1382, height 48 at offset (58, 0). Contains the
  global toolbar with Toggle Sidebar, Dark/Light, Export Video.
- `main` — width 1382, height 900 at offset (58, 0). Contains the
  editor canvas + timeline area.
- `[role="tablist"]` — width 136, height 38 at offset (75, 61). Contains
  the `Stock` / `My Library` tabs.

## Interactive controls observed (partial list)

- `Toggle Sidebar`, `Dark`, `Export Video`, `Zoom out`, `Zoom in`,
  `Reset zoom`, `Lock canvas`, `Undo last action`, `Redo last action`,
  `1x`, `16:9`, `Collapse Timeline`, `Enable magnetic timeline`,
  `Delete track`.
- Inspector tabs (when a clip is selected): `Change Video`, `Settings`,
  `Style`, `AI`, `Crop`, `Position`, `Volume`, `Mute`, `Playback Speed`,
  `Enter Animations` (with count 38), `Exit Animations` (with count 38),
  `3D Layout Effects` (with count 9).

## Export dialog content observed

When the user clicks `Export Video`:

- Title: `Export settings`.
- Notice: `Rendered in your browser`.
- Resolution options: `720p (1280×720)`, `1080p (1920×1080)`, `4K (3840×2160)`.
- Actions: `Cancel`, `Start Export`, `Close`.
- Style buttons: `Back`, `Change Video`, `Settings`, `Style`, `AI`,
  `Position`, `Mute`, `1x (Normal)`.

## Confirmed runtime behaviors

- **Space** toggle: pressing Space adds a `advanced-timeline-store` key
  to `localStorage`. This is observable state mutation, indicating that
  Space is bound to a playback-toggle action that consults a Zustand
  store with persistence.
- **Reload persistence**: after `page.reload()`, the previously written
  localStorage keys are preserved (timestamps may be refreshed by
  hydration).
- **Theme toggle**: clicking `Dark` adds theme-related UI (the page body
  text after the toggle shows `Light`, `Dark`, `RVE` controls).

## Internal module names exposed via console

The following identifiers appeared in console messages and may be used
as architectural clues (these are *publicly observable*, not secrets):

- `useProjectStateFromUrl`
- `ThumbnailCache`

## Confirmed stack

- **Next.js** (deployed on Vercel; deployment ID
  `dpl_CbxPWwv1AJmKnN3bPt6e7nA5tBDz` visible in request URLs).
- 11 JS chunks + 2 CSS bundles.
- Fonts: at least 2 woff2 files.
- Public stock media: Pexels-hosted MP4s (5 of them).
- Public audio: Supabase-hosted MP3 at
  `rwxrdxvxndclnqvznxfj.supabase.co/storage/v1/object/public/sounds/sound-3.mp3`.

## Rebuild implications

For a clean rebuild to match the observed surface:

1. Use **Next.js** (App Router or Pages Router — both work).
2. Use **Zustand** for state (the `advanced-timeline-store` name and the
   `localStorage`-backed persistence pattern are a strong indicator).
3. Use **IndexedDB** for project state (the `idb_migration_v1_done`
   timestamp + thumbnail cache cleanup pattern are consistent with a
   file-backed cache).
4. Use **HTMLVideoElement** for preview.
5. Use **MediaRecorder** or **WebCodecs** for export (since the dialog
   says "Rendered in your browser").
6. Use **CSS variables** + computed-style design tokens (observed in
   `.rebuild/reference/styles/desktop/css-vars.json`).
7. The 16:9 / 1x selectors and zoom-level label suggest a project-meta
   store that exposes `aspectRatio` and `playbackRate`.
