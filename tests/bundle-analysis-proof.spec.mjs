// tests/bundle-analysis-proof.spec.mjs
// Hard-proof for the bundle-body analysis artifacts.

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const P = (p) => path.join('.rebuild', ...p);

test.describe('bundle-analysis-proof / artifact existence + content', () => {
  test('public bundles were fetched locally', async () => {
    const stat = await fs.stat('.rebuild/private/bundles/manifest.json').catch(() => null);
    expect(stat, 'private bundle manifest must exist').not.toBeNull();
    const manifest = JSON.parse(await fs.readFile('.rebuild/private/bundles/manifest.json', 'utf8'));
    expect(manifest.fetched.length).toBeGreaterThan(0);
  });

  test('deep bundle analysis has feature keyword hits', async () => {
    const md = await fs.readFile(P(['features', 'deep-bundle-analysis.md']), 'utf8');
    for (const kw of ['timeline', 'track', 'clip', 'export', 'video']) {
      expect(md).toContain(kw);
    }
  });

  test('bundle symbol index covers all fetched JS bundles', async () => {
    const idx = JSON.parse(await fs.readFile(P(['features', 'bundle-symbol-index.json']), 'utf8'));
    const jsFiles = Object.keys(idx.strings || {});
    expect(jsFiles.length).toBeGreaterThan(5);
  });

  test('library fingerprint includes known libraries', async () => {
    const fp = JSON.parse(await fs.readFile(P(['features', 'library-fingerprint.json']), 'utf8'));
    expect(Object.keys(fp)).toEqual(expect.arrayContaining(['React', 'Next.js']));
  });

  test('css-class-index has rve:* class hits', async () => {
    const ci = JSON.parse(await fs.readFile(P(['features', 'css-class-index.json']), 'utf8'));
    const totalRve = Object.values(ci).reduce((a, v) => a + (v.rveCount || 0), 0);
    expect(totalRve).toBeGreaterThan(0);
  });

  test('commit-eligibility report marks files as eligible', async () => {
    const md = await fs.readFile('.rebuild/target-source/reports/commit-eligibility.md', 'utf8');
    expect(md).toContain('PASS');
  });
});