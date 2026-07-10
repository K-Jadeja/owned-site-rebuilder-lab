// apps/rve-rebuild/src/components/IconRail.tsx
'use client';

import { useUiStore } from '@/state/editor-store';

const ICONS: Array<{ id: string; label: string; glyph: string; }> = [
  { id: 'cursor', label: 'Select', glyph: '↖' },
  { id: 'text', label: 'Text', glyph: 'T' },
  { id: 'media', label: 'Media', glyph: '◧' },
  { id: 'audio', label: 'Audio', glyph: '♪' },
  { id: 'shape', label: 'Shapes', glyph: '◆' },
  { id: 'transitions', label: 'Transitions', glyph: '⤳' },
  { id: 'effects', label: 'Effects', glyph: '✦' },
  { id: 'captions', label: 'Captions', glyph: 'Cc' },
  { id: 'undo', label: 'Undo', glyph: '↺' },
  { id: 'redo', label: 'Redo', glyph: '↻' },
  { id: 'project', label: 'Project', glyph: '☰' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
];

export function IconRail() {
  const active = useUiStore((s) => s.activeLibraryTab);
  const setTab = useUiStore((s) => s.setLibraryTab);
  return (
    <aside
      className="rve-icon-rail"
      data-testid="icon-rail"
      aria-label="Icon navigation rail"
    >
      {ICONS.map((icon) => {
        const isActive = icon.id === 'media' && active === 'stock';
        return (
          <button
            key={icon.id}
            type="button"
            className="rve-icon-btn"
            data-testid={`icon-${icon.id}`}
            data-active={isActive ? 'true' : 'false'}
            title={icon.label}
            aria-label={icon.label}
            onClick={() => {
              if (icon.id === 'media') setTab('stock');
            }}
          >
            {icon.glyph}
          </button>
        );
      })}
    </aside>
  );
}
