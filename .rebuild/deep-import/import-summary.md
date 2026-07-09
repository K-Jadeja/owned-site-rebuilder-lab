# Single-File Import Probe Summary

Target: https://demo.reactvideoeditor.com
Fixture: .rebuild/tests/fixtures/sample.mp4

## Result
Upload: **OK**
- accepted input: video/*
- multiple: false

## Diff (before vs after upload)
- storage added: lastCleanup_thumbnailCache
- storage removed: –
- storage changed: –
- interactiveCount changed: false
- mediaItemCount changed: false
- bodyText changed: true

## Diff (after upload vs after timeline attempt)
- storage added: advanced-timeline-store
- storage changed: –
- interactiveCount changed: false
- mediaItemCount changed: false
- bodyText changed: true

## Network
- entries: 26

## Console
- entries: 20

Sample:
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