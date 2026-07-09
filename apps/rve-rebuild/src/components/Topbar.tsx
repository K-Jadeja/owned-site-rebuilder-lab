// apps/rve-rebuild/src/components/Topbar.tsx
'use client';

import { useUiStore, usePlaybackStore } from '@/state/editor-store';

export function Topbar() {
  const dark = useUiStore((s) => s.dark);
  const toggleDark = useUiStore((s) => s.toggleDark);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const openExport = useUiStore((s) => s.openExport);
  const zoomIn = usePlaybackStore((s) => s.zoomIn);
  const zoomOut = usePlaybackStore((s) => s.zoomOut);
  const zoomReset = usePlaybackStore((s) => s.zoomReset);
  const zoom = usePlaybackStore((s) => s.zoom);

  return (
    <header
      className="h-12 border-b border-rve-border flex items-center gap-2 px-3 bg-rve-panel"
      data-rve-region="topbar"
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="text-xs px-2 py-1 rounded hover:bg-rve-border"
        data-rve-button="toggle-sidebar"
      >
        Toggle Sidebar
      </button>
      <button
        type="button"
        onClick={toggleDark}
        className="text-xs px-2 py-1 rounded hover:bg-rve-border"
        data-rve-button="dark"
        data-rve-dark={dark ? 'on' : 'off'}
      >
        {dark ? 'Light' : 'Dark'}
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={zoomIn}
        className="text-xs px-2 py-1 rounded hover:bg-rve-border"
        data-rve-button="zoom-in"
      >
        Zoom in
      </button>
      <button
        type="button"
        onClick={zoomOut}
        className="text-xs px-2 py-1 rounded hover:bg-rve-border"
        data-rve-button="zoom-out"
      >
        Zoom out
      </button>
      <button
        type="button"
        onClick={zoomReset}
        className="text-xs px-2 py-1 rounded hover:bg-rve-border"
        data-rve-button="reset-zoom"
        data-rve-zoom={String(zoom)}
      >
        Reset zoom
      </button>
      <span className="text-xs text-rve-muted" data-rve-zoom-display>{Math.round(zoom * 100)}%</span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={openExport}
        className="text-xs px-3 py-1 rounded bg-rve-accent text-white hover:opacity-90"
        data-rve-button="export-video"
      >
        Export Video
      </button>
    </header>
  );
}
