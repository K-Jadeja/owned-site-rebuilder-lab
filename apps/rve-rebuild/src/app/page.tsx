// apps/rve-rebuild/src/app/page.tsx
'use client';

import { AppShell } from '@/components/AppShell';
import { useEffect } from 'react';
import { useEditorStore } from '@/state/editor-store';

export default function HomePage() {
  // Force the idb_migration_v1_done key on first paint.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem('idb_migration_v1_done')) {
        localStorage.setItem('idb_migration_v1_done', Date.now().toString());
      }
    } catch {}
  }, []);

  // Touch the editor store so it hydrates even on first paint.
  useEditorStore((s) => s.tracks);

  return <AppShell />;
}
