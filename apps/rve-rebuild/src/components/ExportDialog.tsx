// apps/rve-rebuild/src/components/ExportDialog.tsx
'use client';

import { useUiStore } from '@/state/editor-store';

const RESOLUTIONS = [
  { id: '720p', label: '720p', size: '1280 × 720' },
  { id: '1080p', label: '1080p', size: '1920 × 1080' },
  { id: '4K', label: '4K', size: '3840 × 2160' },
] as const;

export function ExportDialog() {
  const open = useUiStore((s) => s.exportDialogOpen);
  const close = useUiStore((s) => s.closeExport);
  const resolution = useUiStore((s) => s.exportResolution);
  const setResolution = useUiStore((s) => s.setExportResolution);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="Export settings"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      data-rve-export-dialog
    >
      <div className="bg-rve-panel border border-rve-border rounded p-4 w-[480px]">
        <h2 className="text-sm font-semibold mb-2">Export settings</h2>
        <p className="text-xs text-rve-muted mb-3">Choose a resolution</p>
        <ul className="space-y-2 mb-3" data-rve-export-resolutions>
          {RESOLUTIONS.map((r) => (
            <li key={r.id}>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="export-resolution"
                  value={r.id}
                  checked={resolution === r.id}
                  onChange={() => setResolution(r.id)}
                  data-rve-export-resolution={r.id}
                />
                <span>{r.label} / {r.size}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-xs text-rve-muted mb-3" data-rve-rendered-in-browser>
          Rendered in your browser
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="text-xs px-3 py-1 rounded bg-rve-border"
            data-rve-button="export-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={close}
            className="text-xs px-3 py-1 rounded bg-rve-accent text-white"
            data-rve-button="start-export"
          >
            Start Export
          </button>
        </div>
      </div>
    </div>
  );
}
