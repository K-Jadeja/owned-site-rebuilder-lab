# State Model

The RVE rebuild state is split across three Zustand stores:

## `useEditorStore` — `advanced-timeline-store`

Persisted under the localStorage key `advanced-timeline-store` with the canonical Zustand persist shape:

```json
{ "state": { "trackDensity": "default" }, "version": 0 }
```

Holds:

- `tracks: Track[]` — 6 default tracks with `id`, `items`, `magnetic`, `muted`, `visible`.
- `aspectRatio: '16:9'`
- `backgroundColor: '#ffffff'`
- `playbackRate: 1`
- `savedAt: number`

`Track`:

```ts
{
  id: string;          // 'track-0' or UUID
  name?: string;
  type?: 'video' | 'audio' | 'text' | 'overlay';
  items: TimelineItem[];
  magnetic: boolean;
  muted: boolean;
  visible: boolean;
  locked?: boolean;
  order?: number;
}
```

`TimelineItem`:

```ts
{
  id: string;
  type: 'video' | 'image' | 'text' | 'audio';
  left, top, width, height: number;       // px in frame
  durationInFrames: number;                // 30 fps
  from: number;                            // start frame
  rotation: number;
  content?: string;
  styles?: ItemStyles;
  src?: string;                            // object URL for media
  mediaStartTime?: number;
  mediaSrcDuration?: number;
  trackId?: string;
  selected?: boolean;
}
```

## `useMediaStore` — `rve-media-library`

```ts
{
  assets: MediaAsset[];
  addAsset(a: MediaAsset): void;
}
```

`MediaAsset`:

```ts
{
  id: string;
  name: string;
  kind: 'video' | 'image' | 'audio';
  objectUrl: string;
  size: number;
  importedAt: number;
  thumbnailDataUrl?: string;  // 160×90 PNG placeholder
}
```

## `usePlaybackStore` — `rve-playback`

```ts
{
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  zoom: number;
  togglePlay(), setTime(), setDuration(), setZoom(), zoomIn(), zoomOut(), zoomReset()
}
```

`togglePlay()` writes a `advanced-timeline-store` snapshot that includes `isPlaying` and `currentTimeSec`. This is the Space keypress mutation observed in the live reference.

## `useUiStore` — `rve-ui`

```ts
{
  activeLibraryTab: 'stock' | 'my-library';
  dark: boolean;
  exportDialogOpen: boolean;
  exportResolution: '720p' | '1080p' | '4K';
  sidebarCollapsed: boolean;
  inspectorTab: string;
  magnetic: boolean;
}
```

## Auxiliary localStorage keys

- `idb_migration_v1_done` — timestamp set once on first paint.
- `lastCleanup_thumbnailCache` — set on each import.
- `rve-extended-theme` — written when the Dark button is pressed.

These match the keys observed in the live reference's runtime instrumentation.
