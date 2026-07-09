// apps/rve-rebuild/src/components/InspectorPanel.tsx
'use client';

import { useUiStore } from '@/state/editor-store';

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

export function InspectorPanel() {
  const tab = useUiStore((s) => s.inspectorTab);
  const setTab = useUiStore((s) => s.setInspectorTab);
  const active = TABS.find((t) => t.label === tab) || TABS[1];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold px-2 py-1 border-b border-rve-border">Inspector</h2>
      <ul className="text-xs" data-rve-inspector-tabs>
        {TABS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setTab(t.label)}
              className={`w-full text-left px-2 py-1 ${t.label === tab ? 'bg-rve-border' : ''}`}
              data-rve-inspector-tab={t.label}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-1 p-2 text-xs" data-rve-inspector-panel>
        <p className="text-rve-muted">Active tab:</p>
        <p className="font-semibold" data-rve-inspector-active>{active.label}</p>
        <p className="mt-2 text-rve-muted">
          Deep editing of this tab is scheduled for Milestone 2.
        </p>
      </div>
    </div>
  );
}
