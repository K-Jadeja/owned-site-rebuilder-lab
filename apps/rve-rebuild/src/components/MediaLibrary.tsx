// apps/rve-rebuild/src/components/MediaLibrary.tsx
'use client';

import { useUiStore, useMediaStore, useEditorStore } from '@/state/editor-store';
import { useRef, useState } from 'react';
import { generateVideoThumbnail, formatDuration, formatSize } from '@/lib/video-thumbnail';

export function MediaLibrary() {
  const tab = useUiStore((s) => s.activeLibraryTab);
  const setTab = useUiStore((s) => s.setLibraryTab);
  const assets = useMediaStore((s) => s.assets);
  const addAsset = useMediaStore((s) => s.addAsset);
  const setPreviewAssetId = useEditorStore((s) => s.setPreviewAssetId);
  const selectItem = useEditorStore((s) => s.selectItem);
  const selectedAsset = useEditorStore((s) => s.previewAssetId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function onImport(file: File) {
    setWorking(true);
    setError(null);
    try {
      const objectUrl = URL.createObjectURL(file);
      let thumbnailUrl: string | undefined;
      let duration = 0;
      let width = 0;
      let height = 0;
      let thumbnailError: string | undefined;
      if (file.type.startsWith('video/')) {
        const res = await generateVideoThumbnail(file);
        if (res.error) {
          thumbnailError = res.error;
        } else {
          thumbnailUrl = res.thumbnailDataUrl;
          duration = res.duration;
          width = res.width;
          height = res.height;
        }
      } else if (file.type.startsWith('image/')) {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('image-load-failed'));
          i.src = objectUrl;
        });
        width = img.naturalWidth;
        height = img.naturalHeight;
        duration = 0;
        thumbnailUrl = objectUrl;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      addAsset({
        id,
        name: file.name,
        kind: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : 'video',
        objectUrl,
        size: file.size,
        importedAt: Date.now(),
        thumbnailUrl,
        duration,
        width,
        height,
        thumbnailError,
      });
      if (file.type.startsWith('video/')) {
        setPreviewAssetId(id);
        selectItem(null);
      }
    } catch (e) {
      setError((e as Error).message || 'import-failed');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="media-panel">
      <div className="rve-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'stock'}
          onClick={() => setTab('stock')}
          className="rve-tab"
          data-rve-tab="stock"
          data-testid="media-tab-stock"
        >
          Stock
        </button>
        <button
          role="tab"
          aria-selected={tab === 'my-library'}
          onClick={() => setTab('my-library')}
          className="rve-tab"
          data-rve-tab="my-library"
          data-testid="media-tab-my-library"
        >
          My Library
        </button>
      </div>
      <div style={{ padding: 8, borderBottom: '1px solid var(--rve-border)' }}>
        <input
          type="search"
          placeholder="Search videos..."
          style={{ width: '100%', background: 'var(--rve-panel)', color: 'var(--rve-text)', border: '1px solid var(--rve-border)', borderRadius: 4, padding: '4px 6px' }}
          data-testid="media-search-input"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple={false}
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
          }}
          data-rve-file-input
          data-testid="media-file-input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rve-button-primary"
          style={{ width: '100%', marginTop: 6 }}
          disabled={working}
          data-rve-button="import-video"
          data-testid="media-button-import"
        >
          {working ? 'Importing…' : 'Import Video'}
        </button>
        {error && (
          <div className="rve-empty" data-testid="media-import-error" role="alert" style={{ color: 'var(--rve-danger)' }}>
            {error}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto" style={{ padding: 8 }} data-testid="media-list">
        {tab === 'my-library' ? (
          assets.length === 0 ? (
            <div className="rve-empty" data-rve-empty-library>
              No media yet. Import a video to begin.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} data-testid="media-list-items">
              {assets.map((a) => (
                <li
                  key={a.id}
                  className="rve-media-card"
                  data-testid="media-card"
                  data-asset-id={a.id}
                  data-rve-selected={selectedAsset === a.id ? 'true' : 'false'}
                  draggable
                  data-rve-drag-handle
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/rve-asset', a.id);
                  }}
                  onClick={() => {
                    setPreviewAssetId(a.id);
                    selectItem(null);
                  }}
                >
                  {a.thumbnailUrl ? (
                    <img className="rve-media-card-thumb" data-testid="media-thumbnail" src={a.thumbnailUrl} alt={a.name} />
                  ) : (
                    <div className="rve-media-card-thumb" data-testid="media-thumbnail-fallback">
                      <div className="rve-thumb-placeholder">No preview</div>
                    </div>
                  )}
                  <div className="rve-media-card-meta">
                    <div className="rve-media-card-name">{a.name}</div>
                    <div className="rve-media-card-info">
                      {a.duration ? formatDuration(a.duration) : '—'} · {formatSize(a.size)}
                    </div>
                    {a.width && a.height && (
                      <div className="rve-media-card-info">{a.width}×{a.height}</div>
                    )}
                    {a.thumbnailError && (
                      <div className="rve-media-card-info" style={{ color: 'var(--rve-danger)' }}>
                        Thumbnail: {a.thumbnailError}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="rve-empty">Stock placeholder — Milestone 2</div>
        )}
      </div>
    </div>
  );
}
