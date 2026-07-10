// apps/rve-rebuild/src/types/editor.ts
//
// Type definitions for the RVE rebuild state model. Fields are kept
// close to the schema extracted from the live reference at
// `.rebuild/features/extracted-track-clip-schema.md`.

export type ItemType = 'video' | 'image' | 'text' | 'audio';

export interface ItemStyles {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  lineHeight?: string;
  textAlign?: string;
  opacity?: number;
  zIndex?: number;
  transform?: string;
  fontSizeScale?: number;
  letterSpacing?: string;
}

export interface TimelineItem {
  id: string;
  type: ItemType;
  // Geometry (left/top/width/height) and time (from + durationInFrames) match
  // the live reference schema. `from` is in frames at 30 fps.
  left: number;
  top: number;
  width: number;
  height: number;
  durationInFrames: number;
  from: number;
  rotation: number;
  content?: string;
  styles?: ItemStyles;
  // Video / audio source fields, observed in sweep.
  src?: string;
  mediaStartTime?: number;
  mediaSrcDuration?: number;
  trackId?: string;
  selected?: boolean;
}

export interface Track {
  id: string;
  name?: string;
  type?: 'video' | 'audio' | 'text' | 'overlay';
  items: TimelineItem[];
  magnetic: boolean;
  muted: boolean;
  visible: boolean;
  locked?: boolean;
  order?: number;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export interface EditorState {
  tracks: Track[];
  aspectRatio: AspectRatio;
  backgroundColor: string;
  playbackRate: number;
  savedAt?: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  kind: 'video' | 'image' | 'audio';
  objectUrl: string;
  size: number;
  importedAt: number;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailError?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  zoom: number; // 1 = fit
}

export interface UiState {
  activeLibraryTab: 'stock' | 'my-library';
  dark: boolean;
  exportDialogOpen: boolean;
  exportResolution: '720p' | '1080p' | '4K';
  sidebarCollapsed: boolean;
  inspectorTab: string;
  magnetic: boolean;
}
