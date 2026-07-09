// apps/rve-rebuild/src/state/editor-store.ts
//
// Zustand store with persist middleware. Persist shape is intentionally
// compatible with the live reference's `advanced-timeline-store` JSON:
//   { state: { trackDensity: "default" }, version: 0 }
//
// We also write the well-known storage keys:
//   - advanced-timeline-store (Zustand persist; trackDensity + more)
//   - idb_migration_v1_done  (timestamp set once on first hydration)
//   - lastCleanup_thumbnailCache (set on import)
//   - rve-extended-theme     (theme state)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EditorState, MediaAsset, PlaybackState, Track, TimelineItem, UiState } from '@/types/editor';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function defaultTracks(): Track[] {
  const out: Track[] = [];
  for (let i = 0; i < 6; i++) {
    out.push({
      id: `track-${i}`,
      name: i === 0 ? 'Track 0' : `Track ${i}`,
      type: 'video',
      items: [],
      magnetic: true,
      muted: false,
      visible: true,
      order: i,
    });
  }
  return out;
}

function defaultEditorState(): EditorState {
  return {
    tracks: defaultTracks(),
    aspectRatio: '16:9',
    backgroundColor: '#ffffff',
    playbackRate: 1,
    savedAt: Date.now(),
  };
}

function writeIdbMigration() {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem('idb_migration_v1_done')) {
      localStorage.setItem('idb_migration_v1_done', Date.now().toString());
    }
  } catch {}
}

function writeLastCleanup() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('lastCleanup_thumbnailCache', Date.now().toString());
  } catch {}
}

function writeRveTheme(dark: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('rve-extended-theme', JSON.stringify({ dark, updatedAt: Date.now() }));
  } catch {}
}

export const useEditorStore = create<EditorState & {
  replace: (s: EditorState) => void;
  addItemToTrack: (trackId: string, item: TimelineItem) => void;
  setAspectRatio: (a: EditorState['aspectRatio']) => void;
  setBackgroundColor: (c: string) => void;
  setPlaybackRate: (n: number) => void;
}>()(
  persist(
    (set) => ({
      ...defaultEditorState(),
      replace: (s) => set({ ...s, savedAt: Date.now() }),
      addItemToTrack: (trackId, item) =>
        set((state) => {
          const tracks = state.tracks.map((t) =>
            t.id === trackId ? { ...t, items: [...t.items, { ...item, trackId }] } : t
          );
          return { tracks, savedAt: Date.now() };
        }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio, savedAt: Date.now() }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor, savedAt: Date.now() }),
      setPlaybackRate: (playbackRate) => set({ playbackRate, savedAt: Date.now() }),
    }),
    {
      name: 'advanced-timeline-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage))),
      partialize: (state) => ({
        trackDensity: 'default',
        aspectRatio: state.aspectRatio,
        backgroundColor: state.backgroundColor,
        playbackRate: state.playbackRate,
        tracks: state.tracks,
        savedAt: state.savedAt,
      }),
      onRehydrateStorage: () => (state) => {
        writeIdbMigration();
        // Restore any items that we know about, but ensure at least 6 tracks.
        if (state && state.tracks && state.tracks.length < 6) {
          state.tracks = defaultTracks();
        }
      },
    }
  )
);

export const useMediaStore = create<{ assets: MediaAsset[]; addAsset: (a: MediaAsset) => void }>()(
  persist(
    (set) => ({
      assets: [],
      addAsset: (a) =>
        set((state) => {
          writeLastCleanup();
          return { assets: [...state.assets, a] };
        }),
    }),
    {
      name: 'rve-media-library',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage))),
    }
  )
);

export const usePlaybackStore = create<PlaybackState & { togglePlay: () => void; setTime: (t: number) => void; setDuration: (d: number) => void; setZoom: (z: number) => void; zoomIn: () => void; zoomOut: () => void; zoomReset: () => void }>()(
  persist(
    (set) => ({
      isPlaying: false,
      currentTimeSec: 0,
      durationSec: 30,
      zoom: 1,
      togglePlay: () =>
        set((s) => {
          // Persist a Zustand-shape marker so Space keypress is observable.
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('advanced-timeline-store', JSON.stringify({
                state: { trackDensity: 'default', isPlaying: !s.isPlaying, currentTimeSec: s.currentTimeSec },
                version: 0,
              }));
            } catch {}
          }
          return { isPlaying: !s.isPlaying };
        }),
      setTime: (currentTimeSec) => set({ currentTimeSec }),
      setDuration: (durationSec) => set({ durationSec }),
      setZoom: (zoom) => set({ zoom }),
      zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom * 1.25, 8) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom / 1.25, 0.25) })),
      zoomReset: () => set({ zoom: 1 }),
    }),
    {
      name: 'rve-playback',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage))),
    }
  )
);

export const useUiStore = create<UiState & { setLibraryTab: (t: UiState['activeLibraryTab']) => void; toggleDark: () => void; openExport: () => void; closeExport: () => void; setExportResolution: (r: UiState['exportResolution']) => void; toggleSidebar: () => void; setInspectorTab: (t: string) => void; toggleMagnetic: () => void; }>()(
  persist(
    (set) => ({
      activeLibraryTab: 'stock',
      dark: false,
      exportDialogOpen: false,
      exportResolution: '1080p',
      sidebarCollapsed: false,
      inspectorTab: 'Settings',
      magnetic: true,
      setLibraryTab: (t) => set({ activeLibraryTab: t }),
      toggleDark: () =>
        set((s) => {
          writeRveTheme(!s.dark);
          return { dark: !s.dark };
        }),
      openExport: () => set({ exportDialogOpen: true }),
      closeExport: () => set({ exportDialogOpen: false }),
      setExportResolution: (r) => set({ exportResolution: r }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setInspectorTab: (t) => set({ inspectorTab: t }),
      toggleMagnetic: () => set((s) => ({ magnetic: !s.magnetic })),
    }),
    {
      name: 'rve-ui',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage))),
    }
  )
);

// Bootstrap migration markers the first time anything reads.
if (typeof window !== 'undefined') {
  writeIdbMigration();
}
