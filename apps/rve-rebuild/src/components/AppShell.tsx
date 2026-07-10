// apps/rve-rebuild/src/components/AppShell.tsx
'use client';

import { useEffect } from 'react';
import { Topbar } from './Topbar';
import { IconRail } from './IconRail';
import { MediaLibrary } from './MediaLibrary';
import { PreviewPlayer } from './PreviewPlayer';
import { Timeline } from './Timeline';
import { InspectorPanel } from './InspectorPanel';
import { ExportDialog } from './ExportDialog';
import { useUiStore, usePlaybackStore, useEditorStore } from '@/state/editor-store';

export function AppShell() {
  const exportDialogOpen = useUiStore((s) => s.exportDialogOpen);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const selectItem = useEditorStore((s) => s.selectItem);

  // Space keypress toggles playback and writes advanced-timeline-store.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'd' || e.key === 'D') {
        toggleDark();
      } else if (e.key === 'Escape') {
        selectItem(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleDark, selectItem]);

  return (
    <div
      className="rve-shell"
      data-testid="rve-shell"
      data-rve-shell="root"
      data-rve-no-selection={selectedItemId ? 'false' : 'true'}
    >
      <Topbar />
      <IconRail />
      <MediaLibrary />
      <PreviewPlayer />
      <InspectorPanel />
      <Timeline />
      {exportDialogOpen && <ExportDialog />}
      <div data-rve-is-playing={isPlaying ? 'true' : 'false'} className="hidden" />
    </div>
  );
}
