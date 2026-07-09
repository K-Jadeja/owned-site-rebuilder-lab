// apps/rve-rebuild/src/components/AppShell.tsx
'use client';

import { useEffect } from 'react';
import { Topbar } from './Topbar';
import { MediaLibrary } from './MediaLibrary';
import { PreviewPlayer } from './PreviewPlayer';
import { Timeline } from './Timeline';
import { InspectorPanel } from './InspectorPanel';
import { ExportDialog } from './ExportDialog';
import { useUiStore, usePlaybackStore } from '@/state/editor-store';

export function AppShell() {
  const exportDialogOpen = useUiStore((s) => s.exportDialogOpen);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);

  // Space keypress toggles playback and writes advanced-timeline-store.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Avoid intercepting while typing in an input
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'd' || e.key === 'D') {
        toggleDark();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleDark]);

  return (
    <div className="flex flex-col h-screen w-screen" data-rve-shell="root">
      <Topbar />
      <main className="flex-1 flex min-h-0">
        <section
          aria-label="Media library"
          className="w-72 border-r border-rve-border flex flex-col"
          data-rve-region="media-library"
        >
          <MediaLibrary />
        </section>
        <section
          aria-label="Preview"
          className="flex-1 flex flex-col min-w-0"
          data-rve-region="preview"
        >
          <PreviewPlayer />
        </section>
        <aside
          aria-label="Inspector"
          className="w-72 border-l border-rve-border overflow-y-auto"
          data-rve-region="inspector"
        >
          <InspectorPanel />
        </aside>
      </main>
      <section
        aria-label="Timeline"
        className="h-80 border-t border-rve-border"
        data-rve-region="timeline"
      >
        <Timeline />
      </section>
      {exportDialogOpen && <ExportDialog />}
      {/* Is-playing indicator for tests */}
      <div data-rve-is-playing={isPlaying ? 'true' : 'false'} className="hidden" />
    </div>
  );
}
