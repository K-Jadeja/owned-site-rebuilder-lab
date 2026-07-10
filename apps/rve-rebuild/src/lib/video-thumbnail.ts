// apps/rve-rebuild/src/lib/video-thumbnail.ts
//
// Generate a real thumbnail for an uploaded video file by:
//   1. creating a temporary object URL,
//   2. loading metadata (dimensions, duration),
//   3. seeking to a safe frame (min(1s, duration × 0.1)),
//   4. drawing that frame to a hidden canvas,
//   5. exporting as PNG data URL,
//   6. cleaning up the temporary video element.
//
// Returns:
//   { duration, width, height, thumbnailDataUrl, error? }

export interface VideoThumbnailResult {
  duration: number;
  width: number;
  height: number;
  thumbnailDataUrl: string;
  error?: string;
}

export async function generateVideoThumbnail(file: File): Promise<VideoThumbnailResult> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => resolve();
      const onError = () => reject(new Error('metadata-load-failed'));
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
      // Fallback timeout
      setTimeout(() => resolve(), 4000);
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 5;
    const width = video.videoWidth || 320;
    const height = video.videoHeight || 180;
    const seekTo = Math.min(1, Math.max(0.1, duration * 0.1));

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => resolve();
      const onError = () => reject(new Error('seek-failed'));
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      try {
        video.currentTime = seekTo;
      } catch (e) {
        reject(e);
      }
      // Fallback timeout
      setTimeout(() => resolve(), 4000);
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(width, 16);
    canvas.height = Math.max(height, 16);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-2d-unavailable');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumbnailDataUrl = canvas.toDataURL('image/png');

    return { duration, width, height, thumbnailDataUrl };
  } catch (e) {
    return {
      duration: 0,
      width: 0,
      height: 0,
      thumbnailDataUrl: '',
      error: (e as Error).message || 'unknown',
    };
  } finally {
    // Release the temporary object URL; the caller already holds the asset URL.
    URL.revokeObjectURL(url);
  }
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
