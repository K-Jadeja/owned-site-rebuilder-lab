// apps/rve-rebuild/src/components/Timeline.tsx
'use client';

import { useEditorStore, useUiStore, useMediaStore, usePlaybackStore } from '@/state/editor-store';
import { useMemo, useRef, useState } from 'react';
import type { TimelineItem } from '@/types/editor';

const PIXELS_PER_SECOND_BASE = 50;
const RULER_LABELS = ['0s', '5s', '10s', '15s', '20s', '25s', '30s'];

export function Timeline() {
  const tracks = useEditorStore((s) => s.tracks);
  const addItemToTrack = useEditorStore((s) => s.addItemToTrack);
  const removeItem = useEditorStore((s) => s.removeItem);
  const selectItem = useEditorStore((s) => s.selectItem);
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const assets = useMediaStore((s) => s.assets);
  const magnetic = useUiStore((s) => s.magnetic);
  const toggleMagnetic = useUiStore((s) => s.toggleMagnetic);
  const zoom = usePlaybackStore((s) => s.zoom);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const currentTimeSec = usePlaybackStore((s) => s.currentTimeSec);

  const px = PIXELS_PER_SECOND_BASE * zoom;
  const totalSec = useMemo(() => {
    let max = 30;
    for (const t of tracks) for (const it of t.items) {
      const end = (it.from + it.durationInFrames) / 30;
      if (end > max) max = end;
    }
    return Math.ceil(max + 5);
  }, [tracks]);

  const assetIdBySrc = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) map.set(a.objectUrl, a.id);
    return map;
  }, [assets]);

  const [dragOver, setDragOver] = useState<string | null>(null);
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function framesAtX(trackId: string, clientX: number): number {
    const lane = laneRefs.current[trackId];
    if (!lane) return 0;
    const rect = lane.getBoundingClientRect();
    const x = Math.max(0, clientX - rect.left);
    const seconds = x / px;
    const frame = Math.round(seconds * 30);
    if (magnetic) return Math.round(frame / 6) * 6;
    return frame;
  }

  function onDropToTrack(trackId: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const assetId = e.dataTransfer.getData('text/rve-asset');
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    const startFrame = framesAtX(trackId, e.clientX);
    const durFrames = Math.round((asset.duration || 5) * 30);
    const item: TimelineItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: asset.kind === 'audio' ? 'audio' : 'video',
      left: 0,
      top: 0,
      width: 200,
      height: 60,
      durationInFrames: Math.max(30, durFrames || 150),
      from: startFrame,
      rotation: 0,
      content: asset.name,
      src: asset.objectUrl,
      mediaStartTime: 0,
      mediaSrcDuration: asset.duration || 5,
    };
    addItemToTrack(trackId, item);
  }

  return (
    <section className="rve-timeline" data-rve-region="timeline" data-testid="timeline-panel">
      <div className="rve-timeline-header">
        <span style={{ color: 'var(--rve-text)', fontWeight: 600 }}>Timeline</span>
        <button
          type="button"
          onClick={toggleMagnetic}
          className="rve-button"
          data-rve-magnetic={magnetic ? 'on' : 'off'}
          data-testid="timeline-magnetic"
        >
          {magnetic ? 'Magnetic: on' : 'Magnetic: off'}
        </button>
        <span data-testid="timeline-zoom">{Math.round(zoom * 100)}%</span>
        <span data-testid="timeline-clip-count">Clips: {tracks.reduce((a, t) => a + t.items.length, 0)}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10 }}>{totalSec}s</span>
      </div>
      <div style={{ overflow: 'auto', flex: 1 }} data-testid="timeline-scroll">
        <div style={{ minWidth: 132 + totalSec * px }}>
          <div className="rve-timeline-ruler" data-testid="timeline-ruler">
            {RULER_LABELS.map((l, i) => (
              <div
                key={l}
                className="rve-timeline-ruler-tick"
                data-rve-ruler-label={l}
                style={{ width: 5 * px }}
              >
                {l}
              </div>
            ))}
            <div
              className="rve-playhead"
              data-testid="timeline-playhead"
              style={{ left: 132 + currentTimeSec * px }}
            />
          </div>
          {tracks.map((t, tIdx) => (
            <div key={t.id} className="rve-timeline-track" data-rve-track-id={t.id} data-testid={`timeline-track-${t.id}`}>
              <div className="rve-timeline-track-header">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  <div style={{ color: 'var(--rve-muted)', fontSize: 10 }}>{t.items.length} item{t.items.length === 1 ? '' : 's'}</div>
                </div>
                <div className="rve-track-controls">
                  <button
                    type="button"
                    title="Mute"
                    data-testid={`track-mute-${t.id}`}
                    data-active={t.muted ? 'on' : 'off'}
                    data-rve-muted={t.muted ? 'true' : 'false'}
                    onClick={() => useEditorStore.setState((s) => ({
                      tracks: s.tracks.map((x) => x.id === t.id ? { ...x, muted: !x.muted } : x),
                    }))}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    title="Visible"
                    data-testid={`track-visible-${t.id}`}
                    data-active={t.visible ? 'on' : 'off'}
                    data-rve-visible={t.visible ? 'true' : 'false'}
                    onClick={() => useEditorStore.setState((s) => ({
                      tracks: s.tracks.map((x) => x.id === t.id ? { ...x, visible: !x.visible } : x),
                    }))}
                  >
                    V
                  </button>
                  <button
                    type="button"
                    title="Delete track"
                    data-testid={`track-delete-${t.id}`}
                    data-kind="danger"
                    onClick={() => useEditorStore.setState((s) => ({
                      tracks: s.tracks.filter((x) => x.id !== t.id),
                    }))}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div
                className="rve-timeline-track-lane"
                data-rve-track-lane={t.id}
                data-testid={`timeline-lane-${t.id}`}
                data-rve-drag-over={dragOver === t.id ? 'true' : 'false'}
                ref={(el) => { laneRefs.current[t.id] = el; }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(t.id); }}
                onDragLeave={() => setDragOver((cur) => cur === t.id ? null : cur)}
                onDrop={(e) => onDropToTrack(t.id, e)}
                onClick={(e) => {
                  // Clicking on empty lane deselects
                  if (e.target === e.currentTarget) selectItem(null);
                }}
              >
                {t.items.map((it) => {
                  const left = (it.from / 30) * px;
                  const width = Math.max(20, (it.durationInFrames / 30) * px);
                  const colors = ['#1f6feb', '#9333ea', '#ea580c', '#16a34a', '#db2777', '#0891b2'];
                  const color = colors[tIdx % colors.length];
                  return (
                    <div
                      key={it.id}
                      className="rve-clip"
                      data-testid="timeline-clip"
                      data-clip-id={it.id}
                      data-track-id={t.id}
                      data-asset-id={assetIdBySrc.get(it.src || '') || ''}
                      data-clip-type={it.type}
                      data-clip-content={it.content}
                      data-selected={selectedItemId === it.id ? 'true' : 'false'}
                      style={{ left, width, background: color }}
                      onClick={(e) => { e.stopPropagation(); selectItem(it.id); }}
                      onDoubleClick={(e) => { e.stopPropagation(); removeItem(it.id); }}
                      title={it.content}
                    >
                      {it.content}
                    </div>
                  );
                })}
                <div
                  className="rve-playhead"
                  data-testid="timeline-playhead-lane"
                  style={{ left: currentTimeSec * px, top: 0 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
