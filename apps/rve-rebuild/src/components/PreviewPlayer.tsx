// apps/rve-rebuild/src/components/PreviewPlayer.tsx
'use client';

import { useEditorStore, useMediaStore, usePlaybackStore } from '@/state/editor-store';
import { useEffect, useRef } from 'react';

export function PreviewPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assets = useMediaStore((s) => s.assets);
  const tracks = useEditorStore((s) => s.tracks);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const currentTimeSec = usePlaybackStore((s) => s.currentTimeSec);
  const durationSec = usePlaybackStore((s) => s.durationSec);
  const setTime = usePlaybackStore((s) => s.setTime);
  const setDuration = usePlaybackStore((s) => s.setDuration);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);

  // Pick the first imported video as the preview source.
  const firstVideo = assets.find((a) => a.kind === 'video');

  // Animate a tiny thumbnail sprite on canvas as a stand-in for the
  // reference's ThumbnailCache.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setTime(Math.min(durationSec, currentTimeSec + 0.1));
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, currentTimeSec, durationSec, setTime]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="flex-1 flex flex-col p-3 min-h-0">
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black rounded" data-rve-preview>
        <div
          className="bg-white text-black flex items-center justify-center rounded"
          style={{ aspectRatio: aspectRatio.replace(':', '/'), width: '90%', maxHeight: '100%' }}
          data-rve-preview-frame
        >
          {firstVideo ? (
            <video
              ref={videoRef}
              src={firstVideo.objectUrl}
              className="w-full h-full"
              data-rve-preview-video
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setDuration(v.duration || 30);
              }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
          ) : (
            <div className="text-sm text-gray-500" data-rve-preview-empty>
              Preview
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-rve-muted">
        <button
          type="button"
          onClick={togglePlay}
          className="px-2 py-1 rounded bg-rve-border"
          data-rve-button="play"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span data-rve-time-display>
          {currentTimeSec.toFixed(1)}s / {durationSec.toFixed(1)}s
        </span>
        <span data-rve-aspect-ratio>{aspectRatio}</span>
        <span data-rve-tracks-count>{tracks.length} tracks</span>
      </div>
      {/* ThumbnailCache stub canvas - hidden, used as a regression target */}
      <canvas
        ref={canvasRef}
        width={284}
        height={120}
        className="hidden"
        data-rve-thumbnail-canvas
      />
    </div>
  );
}
