// apps/rve-rebuild/src/components/MediaLibrary.tsx
'use client';

import { useUiStore, useMediaStore } from '@/state/editor-store';
import { useRef, useState } from 'react';

export function MediaLibrary() {
  const tab = useUiStore((s) => s.activeLibraryTab);
  const setTab = useUiStore((s) => s.setLibraryTab);
  const assets = useMediaStore((s) => s.assets);
  const addAsset = useMediaStore((s) => s.addAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  async function onImport(file: File) {
    const objectUrl = URL.createObjectURL(file);
    // Build a tiny placeholder thumbnail canvas (the reference uses a
    // 40px-tile sprite; milestone 1 just paints a coloured rectangle).
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, 160, 90);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(8, 8, 144, 74);
      ctx.fillStyle = '#0a0a0a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(file.name, 12, 50);
    }
    const thumbnailDataUrl = canvas.toDataURL('image/png');
    addAsset({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : 'video',
      objectUrl,
      size: file.size,
      importedAt: Date.now(),
      thumbnailDataUrl,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div role="tablist" className="flex border-b border-rve-border">
        <button
          role="tab"
          aria-selected={tab === 'stock'}
          onClick={() => setTab('stock')}
          className={`flex-1 text-xs py-2 ${tab === 'stock' ? 'bg-rve-border' : ''}`}
          data-rve-tab="stock"
        >
          Stock
        </button>
        <button
          role="tab"
          aria-selected={tab === 'my-library'}
          onClick={() => setTab('my-library')}
          className={`flex-1 text-xs py-2 ${tab === 'my-library' ? 'bg-rve-border' : ''}`}
          data-rve-tab="my-library"
        >
          My Library
        </button>
      </div>
      <div className="p-2 border-b border-rve-border">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="w-full text-xs px-2 py-1 rounded bg-rve-bg border border-rve-border"
          data-rve-search-input
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple={false}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
          }}
          data-rve-file-input
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full text-xs py-1 rounded bg-rve-accent text-white"
          data-rve-button="import-video"
        >
          Import Video
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2" data-rve-library-list>
        {tab === 'my-library' ? (
          assets.length === 0 ? (
            <p className="text-xs text-rve-muted" data-rve-empty-library>
              Use the search to find videos.
            </p>
          ) : (
            <ul className="space-y-2">
              {assets.map((a) => (
                <li
                  key={a.id}
                  className="border border-rve-border rounded p-1 text-xs"
                  draggable
                  data-rve-asset-id={a.id}
                  data-rve-drag-handle
                  data-rve-asset-name={a.name}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/rve-asset', a.id);
                  }}
                >
                  {a.thumbnailDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnailDataUrl} alt={a.name} className="w-full rounded" />
                  ) : null}
                  <div className="truncate mt-1">{a.name}</div>
                  <div className="text-rve-muted">{Math.round(a.size / 1024)} KB</div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-xs text-rve-muted" data-rve-empty-library>
            Enter a search term above.
          </p>
        )}
      </div>
    </div>
  );
}
