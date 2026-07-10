// apps/rve-rebuild/src/components/PreviewPlayer.tsx
'use client';

import { useEditorStore, useMediaStore, usePlaybackStore } from '@/state/editor-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TimelineItem } from '@/types/editor';

const FRAME_RATE = 30;

function currentItemAt(tracks: ReturnType<typeof useEditorStore.getState>['tracks'], frame: number): TimelineItem | null {
  for (const t of tracks) {
    if (!t.visible) continue;
    for (const it of t.items) {
      if (frame >= it.from && frame < it.from + it.durationInFrames) return it;
    }
  }
  return null;
}

export function PreviewPlayer() {
  const tracks = useEditorStore((s) => s.tracks);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const previewAssetId = useEditorStore((s) => s.previewAssetId);
  const assets = useMediaStore((s) => s.assets);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const currentTimeSec = usePlaybackStore((s) => s.currentTimeSec);
  const durationSec = usePlaybackStore((s) => s.durationSec);
  const setTime = usePlaybackStore((s) => s.setTime);
  const setDuration = usePlaybackStore((s) => s.setDuration);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);

  const currentFrame = Math.round(currentTimeSec * FRAME_RATE);
  const activeItem = useMemo(() => currentItemAt(tracks, currentFrame), [tracks, currentFrame]);

  // Determine preview source: prefer selected uploaded media, then current
  // timeline video item, then nothing.
  const previewAsset = assets.find((a) => a.id === previewAssetId);
  const previewSource = previewAsset?.objectUrl
    ?? (activeItem && activeItem.type === 'video' ? activeItem.src : null);

  const [error, setError] = useState<string | null>(null);

  // Tick playback time
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const next = currentTimeSec + 0.1;
      const total = Math.max(durationSec, totalDuration(tracks));
      if (next >= total) {
        setTime(0);
      } else {
        setTime(next);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, currentTimeSec, durationSec, setTime, tracks]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (previewSource) {
      if (el.src !== previewSource) {
        el.src = previewSource;
        setError(null);
      }
    } else {
      el.removeAttribute('src');
      el.load();
    }
  }, [previewSource]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && previewSource) v.play().catch(() => {});
    else v.pause();
  }, [isPlaying, previewSource]);

  const totalDur = Math.max(durationSec, totalDuration(tracks));
  const textColor: string = activeItem?.styles?.color || '#ffffff';
  const fontSize: string = activeItem?.styles?.fontSize || '4rem';
  const fontWeight: string = activeItem?.styles?.fontWeight || '400';
  const fontFamily: string = activeItem?.styles?.fontFamily || 'Inter, sans-serif';
  const textAlign: React.CSSProperties['textAlign'] = (activeItem?.styles?.textAlign as React.CSSProperties['textAlign']) || 'center';

  return (
    <section
      className="rve-preview"
      data-rve-region="preview"
      data-testid="preview-workspace"
      aria-label="Preview workspace"
    >
      <div
        className="rve-preview-frame"
        style={{ aspectRatio: aspectRatio.replace(':', '/') }}
        data-testid="preview-frame"
      >
        {previewSource ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            data-testid="preview-video"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (Number.isFinite(v.duration)) setDuration(v.duration);
              setError(null);
            }}
            onError={() => setError('video-load-failed')}
          />
        ) : null}
        {activeItem && activeItem.type === 'text' && previewSource ? null : (
          <div
            className="rve-preview-composition"
            data-testid="preview-composition"
            style={{
              color: textColor,
              fontFamily,
              fontSize,
              fontWeight,
              textAlign,
              padding: '24px',
            }}
          >
            <div>{activeItem?.content || ' '}</div>
          </div>
        )}
        {activeItem && activeItem.type === 'text' ? (
          <div
            className="rve-preview-composition"
            data-testid="preview-text-overlay"
            style={{
              color: textColor,
              fontFamily,
              fontSize,
              fontWeight,
              textAlign,
              padding: '24px',
              whiteSpace: 'pre-wrap',
            }}
          >
            <div>{activeItem.content}</div>
          </div>
        ) : null}
        {error && (
          <div className="rve-preview-error" data-testid="preview-error" role="alert">
            <strong>Preview could not render</strong>
            <span>{error}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--rve-muted)' }}>
        <button
          type="button"
          onClick={togglePlay}
          className="rve-button"
          data-testid="preview-play-button"
          data-rve-is-playing={isPlaying ? 'true' : 'false'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span data-testid="playback-time">
          {currentTimeSec.toFixed(1)}s / {totalDur.toFixed(1)}s
        </span>
        <span data-testid="preview-tracks">{tracks.length} tracks</span>
        <span data-testid="preview-aspect">{aspectRatio}</span>
      </div>
    </section>
  );
}

function totalDuration(tracks: ReturnType<typeof useEditorStore.getState>['tracks']): number {
  let max = 0;
  for (const t of tracks) {
    for (const it of t.items) {
      const end = (it.from + it.durationInFrames) / 30;
      if (end > max) max = end;
    }
  }
  return max;
}
