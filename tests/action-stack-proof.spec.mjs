// tests/action-stack-proof.spec.mjs
// Hard-proof for stack-trace instrumentation outputs.

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const P = (...p) => path.join(REPO, ...p);

test.describe('action-stack-proof / storage mutation stack', () => {
  test('advanced-timeline-store set was captured with a stack trace', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/stack-traces/action-storage-stacks.json'), 'utf8'));
    const sets = d.sets || [];
    const timeline = sets.filter((s) => /advanced-timeline-store/.test(s.data.key || ''));
    expect(timeline.length).toBeGreaterThan(0);
    for (const s of timeline) {
      const frames = s.data.stack || [];
      expect(frames.length).toBeGreaterThan(0);
      const mapped = frames.some((f) => /\.js\?dpl=/.test(f) || /\.js/.test(f));
      expect(mapped, 'expected at least one frame to be a JS bundle URL').toBeTruthy();
    }
  });

  test('idb_migration_v1_done set was captured with a stack trace', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/stack-traces/action-storage-stacks.json'), 'utf8'));
    const sets = d.sets || [];
    const idb = sets.filter((s) => /idb_migration_v1_done/.test(s.data.key || ''));
    expect(idb.length).toBeGreaterThan(0);
  });

  test('lastCleanup_thumbnailCache set was captured with a stack trace', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/stack-traces/action-storage-stacks.json'), 'utf8'));
    const sets = d.sets || [];
    const th = sets.filter((s) => /lastCleanup_thumbnailCache/.test(s.data.key || ''));
    expect(th.length).toBeGreaterThan(0);
  });
});

test.describe('action-stack-proof / media play', () => {
  test('media play was captured during playback-space', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/stack-traces/action-media-stacks.json'), 'utf8'));
    const play = d.play || [];
    const pb = play.filter((p) => p.data.action === 'playback-space');
    expect(pb.length).toBeGreaterThan(0);
  });
});

test.describe('action-stack-proof / createObjectURL during import', () => {
  test('createObjectURL was captured during single-file-import', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/stack-traces/action-object-url-stacks.json'), 'utf8'));
    const events = d || [];
    const importEvents = events.filter((e) => e.data.action === 'single-file-import');
    expect(importEvents.length).toBeGreaterThan(0);
    const mp4 = importEvents.filter((e) => /video/i.test(e.data.type || ''));
    expect(mp4.length, 'expected a video/* createObjectURL call during single-file-import').toBeGreaterThan(0);
  });
});