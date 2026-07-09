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