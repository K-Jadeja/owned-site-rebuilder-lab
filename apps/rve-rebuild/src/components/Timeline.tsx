// apps/rve-rebuild/src/components/Timeline.tsx
'use client';

import { useEditorStore, useUiStore, useMediaStore, usePlaybackStore } from '@/state/editor-store';
import { useState } from 'react';
import type { TimelineItem } from '@/types/editor';

const RULER_LABELS = ['0s', '5s', '10s', '15s', '20s', '25s', '30s'];

export function Timeline() {
  const tracks = useEditorStore((s) => s.tracks);
  const addItemToTrack = useEditorStore((s) => s.addItemToTrack);
  const assets = useMediaStore((s) => s.assets);
  const magnetic = useUiStore((s) => s.magnetic);
  const toggleMagnetic = useUiStore((s) => s.toggleMagnetic);
  const zoom = usePlaybackStore((s) => s.zoom);
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null);

  function onDropToTrack(trackId: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOverTrack(null);
    const assetId = e.dataTransfer.getData('text/rve-asset');
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    const item: TimelineItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: asset.kind === 'audio' ? 'audio' : 'video',
      left: 0,
      top: 0,
      width: 200,
      height: 60,
      durationInFrames: 150, // 5s at 30 fps
      from: 0,
      rotation: 0,
      content: asset.name,
      src: asset.objectUrl,
      mediaStartTime: 0,
      mediaSrcDuration: 5,
      trackId,
    };
    addItemToTrack(trackId, item);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-8 flex items-center gap-2 px-2 border-b border-rve-border text-xs">
        <span className="text-rve-muted">Timeline</span>
        <button
          type="button"
          onClick={toggleMagnetic}
          className={`px-2 py-0.5 rounded ${magnetic ? 'bg-rve-accent text-white' : 'bg-rve-border'}`}
          data-rve-button="magnetic"
        >
          {magnetic ? 'Disable magnetic' : 'Enable magnetic'}
        </button>
        <span className="text-rve-muted">Zoom {Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto" data-rve-timeline-ruler>
        {/* Ruler */}
        <div className="h-6 flex items-end border-b border-rve-border px-1 text-[10px] text-rve-muted">
          {RULER_LABELS.map((l, i) => (
            <div
              key={l}
              className="flex-1 border-l border-rve-border pl-1"
              data-rve-ruler-label={l}
            >
              {l}
            </div>
          ))}
        </div>
        {tracks.map((t) => (
          <div
            key={t.id}
            className={`flex h-12 border-b border-rve-border ${dragOverTrack === t.id ? 'bg-rve-accent/30' : ''}`}
            data-rve-track-id={t.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverTrack(t.id);
            }}
            onDragLeave={() => setDragOverTrack((cur) => (cur === t.id ? null : cur))}
            onDrop={(e) => onDropToTrack(t.id, e)}
          >
            <div
              className="w-32 px-2 py-1 text-xs border-r border-rve-border flex items-center justify-between"
              draggable
              data-rve-track-header
              data-rve-drag-handle
              data-rve-track-name={t.name || t.id}
            >
              <span>{t.name || t.id}</span>
              <span className="text-rve-muted">{t.items.length}</span>
            </div>
            <div className="flex-1 relative">
              {t.items.map((it) => (
                <div
                  key={it.id}
                  className="absolute top-1 left-1 h-10 rounded bg-rve-accent text-white text-[10px] px-1"
                  style={{ left: 4 + (it.from / 30) * 50, width: Math.max(20, (it.durationInFrames / 30) * 50) }}
                  data-rve-item-id={it.id}
                  data-rve-item-name={it.content || it.id}
                >
                  {it.content}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
