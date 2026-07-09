# Video Editor Features

The minimum surface area for a browser video editor. Use this list to seed
the feature inventory.

## Project / sequence

- New project / open project / save project / save-as / autosave
- Project metadata (name, resolution, fps, duration, aspect ratio)
- Recent projects

## Asset / media library

- Local file import (drag, file picker, paste)
- URL import
- Sample assets / demo assets
- Asset preview (thumbnail, scrub, waveform)
- Asset metadata (resolution, duration, codec, size)
- Search / sort / filter
- Asset grouping (folder, tag)
- Asset removal

## Timeline

- Tracks (add, remove, rename, reorder)
- Track types (video, audio, text, overlay)
- Track properties (mute, hide, lock, blend)
- Clip creation (drag from library, split, duplicate)
- Clip selection (single, multi, range, lasso)
- Clip trim (in/out handles, ripple, roll)
- Clip split (at playhead, at selection, hotkey)
- Clip movement (track swap, time shift, snap)
- Snapping (clip-to-clip, clip-to-playhead, threshold)
- Zoom (in, out, fit, scroll)
- Markers / chapters
- Minimap / overview

## Preview / playback

- Play / pause / stop
- Frame step (forward, backward)
- Loop / ping-pong
- Volume / mute
- Fullscreen
- Quality selector
- Render-on-demand

## Inspector / properties

- Per-clip properties
- Per-effect properties
- Keyframe editor (add, move, delete, ease)
- Text editor (font, size, color, alignment, stroke, shadow)

## Effects / transitions

- Filter / color
- Transform / crop
- Transition (fade, wipe, dip)
- Speed / time remap
- Audio effect (gain, fade, normalization)

## Export

- Preset (resolution, codec, bitrate, fps)
- Custom settings
- Render progress / cancel
- Download / save to cloud
- Background render (Web Worker)

## Persistence

- localStorage for prefs
- IndexedDB for project state / thumbnails
- Export / import `.json` project file
- Autosave indicator

## Misc

- Keyboard shortcuts panel
- Undo / redo
- Multi-language UI
- Theme (light, dark)
- Notifications / toasts
- Error states (codec unsupported, network drop)
- Empty states
- Tutorial / onboarding overlay