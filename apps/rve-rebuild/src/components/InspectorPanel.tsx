// apps/rve-rebuild/src/components/InspectorPanel.tsx
'use client';

import { useEditorStore, useMediaStore, usePlaybackStore, useUiStore } from '@/state/editor-store';
import { useMemo } from 'react';

const TABS = [
  { id: 'change-video', label: 'Change Video' },
  { id: 'settings', label: 'Settings' },
  { id: 'style', label: 'Style' },
  { id: 'ai', label: 'AI' },
  { id: 'crop', label: 'Crop' },
  { id: 'position', label: 'Position' },
  { id: 'volume', label: 'Volume' },
  { id: 'mute', label: 'Mute' },
  { id: 'playback-speed', label: 'Playback Speed' },
  { id: 'enter-animations', label: 'Enter Animations (38)' },
  { id: 'exit-animations', label: 'Exit Animations (38)' },
  { id: '3d-layout', label: '3D Layout Effects (9)' },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rve-inspector-row" data-testid="inspector-field">
      <label>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function InspectorPanel() {
  const tab = useUiStore((s) => s.inspectorTab);
  const setTab = useUiStore((s) => s.setInspectorTab);
  const tracks = useEditorStore((s) => s.tracks);
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const setBackgroundColor = useEditorStore((s) => s.setBackgroundColor);
  const playbackRate = useEditorStore((s) => s.playbackRate);
  const setPlaybackRate = useEditorStore((s) => s.setPlaybackRate);
  const assets = useMediaStore((s) => s.assets);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    for (const t of tracks) {
      const it = t.items.find((x) => x.id === selectedItemId);
      if (it) return it;
    }
    return null;
  }, [selectedItemId, tracks]);
  const selectedTrack = useMemo(() => {
    if (!selectedItem) return null;
    return tracks.find((t) => t.id === selectedItem.trackId) || null;
  }, [selectedItem, tracks]);
  const selectedAsset = useMemo(() => {
    if (!selectedItem) return null;
    return assets.find((a) => a.objectUrl === selectedItem.src) || null;
  }, [selectedItem, assets]);

  const noSelection = !selectedItem;
  const isVideoOrAudio = !!selectedItem && (selectedItem.type === 'video' || selectedItem.type === 'audio');

  function PanelBody() {
    if (noSelection) {
      // Default panels show global project settings.
      if (tab === 'Change Video') {
        return (
          <div data-testid="inspector-panel-change-video-empty">
            <div className="rve-section-title">Change Video</div>
            <div className="rve-field-card">Select a clip to change its video.</div>
          </div>
        );
      }
      if (tab === 'Settings') {
        return (
          <div data-testid="inspector-panel-settings-empty">
            <div className="rve-section-title">Project Settings</div>
            <FieldRow label="Aspect">
              <select
                value={aspectRatio}
                data-testid="inspector-aspect-empty"
                onChange={(e) => setAspectRatio(e.target.value as any)}
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
              </select>
            </FieldRow>
            <FieldRow label="Background">
              <input
                type="color"
                value={backgroundColor}
                data-testid="inspector-background-empty"
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </FieldRow>
          </div>
        );
      }
      return (
        <div data-testid={`inspector-panel-${tab}-empty`}>
          <div className="rve-section-title">{tab}</div>
          <div className="rve-field-card">Select a clip to see options.</div>
        </div>
      );
    }

    // Selected clip paths
    if (tab === 'Change Video') {
      return (
        <div data-testid="inspector-panel-change-video">
          <div className="rve-section-title">Change Video</div>
          <FieldRow label="Filename">
            <input value={selectedItem!.content || ''} readOnly data-testid="inspector-clip-name" />
          </FieldRow>
          {selectedAsset ? (
            <>
              <FieldRow label="Asset">
                <input value={selectedAsset.name} readOnly />
              </FieldRow>
              <FieldRow label="Thumbnail">
                {selectedAsset.thumbnailUrl ? (
                  <img
                    src={selectedAsset.thumbnailUrl}
                    alt={selectedAsset.name}
                    style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 4 }}
                    data-testid="inspector-thumbnail"
                  />
                ) : (
                  <div className="rve-thumb-placeholder" style={{ width: 160, height: 90 }}>No thumbnail</div>
                )}
              </FieldRow>
            </>
          ) : selectedItem!.type === 'text' ? (
            <div className="rve-empty">Text item — no media attached.</div>
          ) : (
            <div className="rve-empty">Demo clip — no media attached.</div>
          )}
        </div>
      );
    }
    if (tab === 'Settings') {
      return (
        <div data-testid="inspector-panel-settings">
          <div className="rve-section-title">Clip Settings</div>
          <FieldRow label="Aspect">
            <select
              value={aspectRatio}
              data-testid="inspector-aspect"
              onChange={(e) => setAspectRatio(e.target.value as any)}
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
            </select>
          </FieldRow>
          <FieldRow label="Background">
            <input
              type="color"
              value={backgroundColor}
              data-testid="inspector-background"
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Playback Rate">
            <select
              value={String(playbackRate)}
              data-testid="inspector-rate"
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </FieldRow>
        </div>
      );
    }
    if (tab === 'Style' && selectedItem) {
      return (
        <div data-testid="inspector-panel-style">
          <div className="rve-section-title">Style</div>
          <FieldRow label="Opacity">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={selectedItem.styles?.opacity ?? 1}
              readOnly
            />
          </FieldRow>
          <FieldRow label="Type">
            <input value={selectedItem.type} readOnly />
          </FieldRow>
          <FieldRow label="Color">
            <input
              type="color"
              value={selectedItem.styles?.color || '#ffffff'}
              readOnly
            />
          </FieldRow>
        </div>
      );
    }
    if (tab === 'Crop' && selectedItem) {
      return (
        <div data-testid="inspector-panel-crop">
          <div className="rve-section-title">Crop</div>
          <FieldRow label="Aspect">
            <input value="Match source" readOnly />
          </FieldRow>
          <div className="rve-empty">Crop controls stub — Milestone 2</div>
        </div>
      );
    }
    if (tab === 'Position' && selectedItem) {
      return (
        <div data-testid="inspector-panel-position">
          <div className="rve-section-title">Position</div>
          <FieldRow label="Left"><input value={Math.round(selectedItem.left)} readOnly data-testid="inspector-position-left" /></FieldRow>
          <FieldRow label="Top"><input value={Math.round(selectedItem.top)} readOnly data-testid="inspector-position-top" /></FieldRow>
          <FieldRow label="Width"><input value={Math.round(selectedItem.width)} readOnly data-testid="inspector-position-width" /></FieldRow>
          <FieldRow label="Height"><input value={Math.round(selectedItem.height)} readOnly data-testid="inspector-position-height" /></FieldRow>
          <FieldRow label="Rotation"><input value={`${selectedItem.rotation}°`} readOnly /></FieldRow>
        </div>
      );
    }
    if (tab === 'Volume' && isVideoOrAudio) {
      return (
        <div data-testid="inspector-panel-volume">
          <div className="rve-section-title">Volume</div>
          <FieldRow label="Volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={1}
              data-testid="inspector-volume"
            />
          </FieldRow>
        </div>
      );
    }
    if (tab === 'Mute' && isVideoOrAudio) {
      return (
        <div data-testid="inspector-panel-mute">
          <div className="rve-section-title">Mute</div>
          <FieldRow label="Muted">
            <input type="checkbox" defaultChecked={false} data-testid="inspector-mute" />
          </FieldRow>
        </div>
      );
    }
    if (tab === 'Playback Speed') {
      return (
        <div data-testid="inspector-panel-playback-speed">
          <div className="rve-section-title">Playback Speed</div>
          <FieldRow label="Speed">
            <select
              value={String(playbackRate)}
              data-testid="inspector-playback-speed"
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </FieldRow>
        </div>
      );
    }
    if (tab === 'Enter Animations' || tab === 'Exit Animations' || tab === '3D Layout') {
      return (
        <div data-testid={`inspector-panel-${tab}`}>
          <div className="rve-section-title">{tab.replace(/\s\(\d+\)$/, '')}</div>
          <div className="rve-field-card">Library list — Milestone 2</div>
        </div>
      );
    }
    if (tab === 'AI') {
      return (
        <div data-testid="inspector-panel-ai">
          <div className="rve-section-title">AI</div>
          <div className="rve-field-card">AI suggestions — Milestone 2</div>
        </div>
      );
    }
    return null;
  }

  const collapsed = !selectedItemId;

  return (
    <aside
      className="rve-inspector"
      data-testid="inspector-panel"
      data-rve-region="inspector"
      data-rve-collapsed={collapsed ? 'true' : 'false'}
      aria-label="Inspector"
    >
      <ul className="rve-tabs" style={{ maxHeight: 220, overflowY: 'auto' }} data-testid="inspector-tabs">
        {TABS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="rve-tab"
              data-testid={`inspector-tab-${t.id}`}
              data-active={tab === t.label ? 'true' : 'false'}
              onClick={() => setTab(t.label)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="rve-inspector-body" data-testid="inspector-body">
        <PanelBody />
        <div className="rve-milestone2-note">Deep editing of this panel ships in Milestone 2.</div>
      </div>
    </aside>
  );
}
