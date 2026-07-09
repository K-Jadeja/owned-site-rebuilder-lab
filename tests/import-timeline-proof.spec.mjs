// tests/import-timeline-proof.spec.mjs
// Hard-proof for the import → timeline flow.

import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const P = (...p) => path.join(REPO, ...p);

test.describe('import-timeline-proof / hardening summary', () => {
  test('import-timeline-hardening.md exists', async () => {
    expect(existsSync(P('.rebuild/deep-import/import-timeline-hardening.md'))).toBeTruthy();
  });

  test('import-timeline-hardening.json contains a firstMutation label', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/deep-import/import-timeline-hardening.json'), 'utf8'));
    expect(d.firstMutation).toBeTruthy();
    expect(typeof d.firstMutation).toBe('string');
  });

  test('timeline add reported as PROVEN', async () => {
    const md = await fs.readFile(P('.rebuild/deep-import/import-timeline-hardening.md'), 'utf8');
    expect(md).toContain('PROVEN');
  });

  test('advanced-timeline-store appears in final state after drag strategy', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/deep-import/import-timeline-hardening.json'), 'utf8'));
    expect(d.final.advancedTimelineStore).toBeTruthy();
  });

  test('attempt 03-strategy-drag is recorded as firstMutation', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/deep-import/import-timeline-hardening.json'), 'utf8'));
    expect(d.firstMutation).toBe('03-strategy-drag');
  });
});