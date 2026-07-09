# Import → Timeline Hardening

Target: https://demo.reactvideoeditor.com
Fixture: .rebuild/tests/fixtures/sample.mp4

## Result: timeline add **PROVEN**
- first mutation: 03-strategy-drag

## After upload

- video elements: 1
- img elements: 2
- draggable elements: 6
- interactive count: 57
- advanced-timeline-store: absent

## Strategy attempts

| Strategy | Err | storage changed | bodyText changed | videoCount changed | imgCount changed | draggables changed |
| --- | --- | --- | --- | --- | --- | --- |
| 03-strategy-drag | ok | true | true | false | false | false |
| 04-strategy-dblclick | ok | false | true | false | false | false |
| 05-strategy-enter | ok | false | false | false | false | false |
| 06-strategy-button | no add-to-timeline button foun | false | false | false | false | false |
| 07-strategy-targeted-drag | ok | false | true | false | false | false |

## Final

- video elements: 1
- advanced-timeline-store: present

## Relevant console messages
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-ob4wt1-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1rfe6ip-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1udzx29-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-1gqds2q-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Generating new sprite for key: video-thumbnail-cr1ex8-1-40, interval: 1s, height: 40px
- [log] [ThumbnailCache] Successfully cached sprite for key: video-thumbnail-1rfe6ip-1-40 firstTimestampSec: 0 dimensions: 284x120 size: 0.01MB tileHeight: 40px totalTiles: 10 interval: 1s
- [log] [ThumbnailCache] Completed sprite generation for key: video-thumbnail-1rfe6ip-1-40, tiles: 10, duration: 3531ms
- [log] [onSave] Editor state saved: {tracks: Array(6), aspectRatio: 16:9, backgroundColor: white, playbackRate: 1, savedAt: 1783592813533}
- [log] [onSave] Editor state saved: {tracks: Array(6), aspectRatio: 16:9, backgroundColor: white, playbackRate: 1, savedAt: 1783592823526}