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
  const playbackRate = usePlaybackStore((s) => 1); // placeholder
  const setPlaybackRate = usePlaybackStore((s) => () => {});
  const aspectRatio = useUiStore((s) => ''); // placeholder
  const backgroundColor = useUiStore((s) => ''); // placeholder

  return (
    <header className="rve-topbar" data-rve-region="topbar">
      <span className="rve-topbar-title">React Video Editor</span>
      <button type="button" className="rve-button" data-testid="rve-button-toggle-sidebar" onClick={toggleSidebar}>
        Toggle Sidebar
      </button>
      <button type="button" className="rve-button" data-testid="rve-button-dark" onClick={toggleDark}>
        {dark ? 'Light' : 'Dark'}
      </button>
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--rve-muted)', fontSize: 11 }}>Aspect</span>
      <select
        style={{ background: 'var(--rve-panel)', color: 'var(--rve-text)', border: '1px solid var(--rve-border)', borderRadius: 4 }}
        data-testid="rve-topbar-aspect"
        defaultValue="16:9"
      >
        <option>16:9</option>
        <option>9:16</option>
        <option>1:1</option>
        <option>4:3</option>
      </select>
      <button type="button" className="rve-button" data-testid="rve-button-zoom-in" onClick={zoomIn}>
        Zoom in
      </button>
      <button type="button" className="rve-button" data-testid="rve-button-zoom-out" onClick={zoomOut}>
        Zoom out
      </button>
      <button type="button" className="rve-button" data-testid="rve-button-zoom-reset" onClick={zoomReset}>
        Reset zoom
      </button>
      <span style={{ color: 'var(--rve-muted)', fontSize: 11 }} data-testid="rve-zoom-display">
        {Math.round(zoom * 100)}%
      </span>
      <button type="button" className="rve-button-primary" data-testid="rve-button-export-video" onClick={openExport}>
        Export Video
      </button>
    </header>
  );
}
