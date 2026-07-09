# Runtime Instrumentation Summary

Generated: 2026-07-09T09:27:17.426Z
Target: https://demo.reactvideoeditor.com

- fetch entries: 0
- xhr entries: 0
- storage mutations: 22
- IDB observations: 0
- history events: 0
- DOM mutations: 0
- event trace entries: 23
- console messages: 33
- page errors: 0

## Per-action table
| Action | URL before | URL after | Storage keys added | Storage keys removed | Net storage change | DOM mut | Event trace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| boot | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | lastCleanup_thumbnailCache | – | 1 | 0 | 0 |
| dark-toggle | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 3 |
| export-dialog | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 1 |
| playback-space | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | advanced-timeline-store, rve-extended-theme | – | 2 | 0 | 3 |
| undo-redo | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 5 |
| zoom-in | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 3 |
| zoom-out | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 3 |
| zoom-reset | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 3 |
| my-library | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 0 |
| single-import | https://demo.reactvideoeditor.com/ | https://demo.reactvideoeditor.com/ | – | – | 0 | 0 | 2 |

## Notable storage mutations
- [boot] set local:lastCleanup_thumbnailCache = 1783589214190
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:advanced-timeline-store = {"state":{"trackDensity":"default"},"version":0}
- [playback-space] set local:rve-extended-theme = light

## IDB observations

## Console messages (sample)
- [log] [useProjectStateFromUrl] No 'projectId' parameter found, using fallback tracks
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-ob4wt1-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1rfe6ip-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1udzx29-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1gqds2q-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-cr1ex8-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] firstTimestampSec: 0
- [log] [ThumbnailCache] Keyframe analysis - Video Duration: 9.08s, Keyframes: (count: 3, interval: 3.040s, rate: 0.33 keyframes/sec), intervalSec: 1s
- [log] [ThumbnailCache] Keyframe rate is much higher than the interval we want to use, falling back to interval-based sampling
- [log] [ThumbnailCache] Successfully cached sprite for key: video-thumbnail-1rfe6ip-1-40 firstTimestampSec: 0 dimensions: 284x120 size: 0.01MB tileHeight: 40px totalTiles: 10 interval: 1s
- [log] [ThumbnailCache] Completed sprite generation for key: video-thumbnail-1rfe6ip-1-40, tiles: 10, duration: 4015ms
- [log] [ThumbnailCache] firstTimestampSec: 0
- [log] [ThumbnailCache] Keyframe analysis - Video Duration: 14.44s, Keyframes: (count: 6, interval: 2.432s, rate: 0.41 keyframes/sec), intervalSec: 1s
- [log] [ThumbnailCache] Keyframe rate is much higher than the interval we want to use, falling back to interval-based sampling
- [log] [ThumbnailCache] Successfully cached sprite for key: video-thumbnail-1udzx29-1-40 firstTimestampSec: 0 dimensions: 284x160 size: 0.01MB tileHeight: 40px totalTiles: 15 interval: 1s
- [log] [ThumbnailCache] Completed sprite generation for key: video-thumbnail-1udzx29-1-40, tiles: 15, duration: 6689ms
- [log] [ThumbnailCache] firstTimestampSec: 0
- [log] [ThumbnailCache] Keyframe analysis - Video Duration: 15.02s, Keyframes: (count: 5, interval: 3.003s, rate: 0.33 keyframes/sec), intervalSec: 1s
- [log] [ThumbnailCache] Keyframe rate is much higher than the interval we want to use, falling back to interval-based sampling
- [log] [onSave] Editor state saved: {tracks: Array(6), aspectRatio: 16:9, backgroundColor: white, playbackRate: 1, savedAt: 1783589219734}