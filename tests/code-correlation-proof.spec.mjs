// tests/code-correlation-proof.spec.mjs
// Hard-proof for the action → stack → bundle → feature correlation engine.

import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const P = (...p) => path.join(REPO, ...p);

test.describe('code-correlation-proof / F007 import code_correlated', () => {
  test('feature F007 is upgraded to code_correlated in feature-matrix.json', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/feature-matrix.json'), 'utf8'));
    const f = m.features.find((x) => x.id === 'F007');
    expect(f, 'F007 entry').toBeTruthy();
    expect(f.proof_level).toBe('code_correlated');
  });

  test('feature F020 is upgraded to code_correlated in feature-matrix.json', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/feature-matrix.json'), 'utf8'));
    const f = m.features.find((x) => x.id === 'F020');
    expect(f.proof_level).toBe('code_correlated');
  });

  test('feature F031 is upgraded to code_correlated in feature-matrix.json', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/feature-matrix.json'), 'utf8'));
    const f = m.features.find((x) => x.id === 'F031');
    expect(f.proof_level).toBe('code_correlated');
  });

  test('feature-code-correlation.json exists with at least 3 code_correlated features', async () => {
    const c = JSON.parse(await fs.readFile(P('.rebuild/features/feature-code-correlation.json'), 'utf8'));
    expect((c.upgradedToCodeCorrelated || []).length).toBeGreaterThanOrEqual(3);
  });
});

test.describe('code-correlation-proof / stack trace + bundle map', () => {
  test('action-stack-bundle-map.json exists with mapped frames', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/action-stack-bundle-map.json'), 'utf8'));
    expect(m.frameTable.length).toBeGreaterThan(0);
  });

  test('at least one storage-set frame maps into a target JS bundle', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/action-stack-bundle-map.json'), 'utf8'));
    const sets = m.perAction['storage-sets'] || [];
    const mappedAny = sets.some((s) => (s.frames || []).some((f) => f.mapped));
    expect(mappedAny, 'expected at least one mapped frame per action stack frame').toBeTruthy();
  });

  test('createObjectURL import flow frames map into a target JS bundle', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/features/action-stack-bundle-map.json'), 'utf8'));
    const co = m.perAction['createObjectURL'] || [];
    const importFlow = co.filter((c) => /import/i.test(c.action || ''));
    const mappedAny = importFlow.some((c) => (c.frames || []).some((f) => f.mapped && /URL\.createObjectURL|upload|videoSrc/.test(f.snippet || '')));
    expect(mappedAny, 'expected at least one mapped createObjectURL frame in the import flow').toBeTruthy();
  });
});

test.describe('code-correlation-proof / CDP coverage', () => {
  test('coverage-debug-summary.md exists and is not empty', async () => {
    expect(existsSync(P('.rebuild/runtime/coverage-debug/coverage-debug-summary.md'))).toBeTruthy();
    const md = await fs.readFile(P('.rebuild/runtime/coverage-debug/coverage-debug-summary.md'), 'utf8');
    expect(md).toContain('Coverage Debug Summary');
  });

  test('CDP preciseCoverage returned non-zero used bytes', async () => {
    const d = JSON.parse(await fs.readFile(P('.rebuild/runtime/coverage-debug/cdp-coverage-debug.json'), 'utf8'));
    expect(d.result).toBeTruthy();
    expect(d.result.usedBytes).toBeGreaterThan(0);
  });

  test('CDP per-action coverage produced positive deltas for export-dialog', async () => {
    const m = JSON.parse(await fs.readFile(P('.rebuild/runtime/coverage/action-to-bundle-map.json'), 'utf8'));
    const e = m['export-dialog'];
    expect(e, 'export-dialog entry must exist').toBeTruthy();
    expect(e.positiveDelta.length).toBeGreaterThan(0);
  });
});