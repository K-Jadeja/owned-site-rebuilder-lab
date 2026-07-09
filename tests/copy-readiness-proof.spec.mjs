// tests/copy-readiness-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const PROGRESS = path.join(ROOT, '.rebuild/reports/rve-copy-progress.md');
const READINESS = path.join(ROOT, '.rebuild/reports/rebuild-readiness.md');
const NEXT = path.join(ROOT, '.harness/next-rebuild-prompt.md');

test('copy progress md exists', () => {
  expect(existsSync(PROGRESS)).toBeTruthy();
});

test('rebuild readiness md exists', () => {
  expect(existsSync(READINESS)).toBeTruthy();
});

test('next-rebuild-prompt md exists', () => {
  expect(existsSync(NEXT)).toBeTruthy();
});

test('copy progress covers F001..F034', async () => {
  if (!existsSync(PROGRESS)) {
    test.skip(true, 'progress md missing');
    return;
  }
  const txt = await readFile(PROGRESS, 'utf8');
  for (let i = 1; i <= 34; i++) {
    const id = `F${String(i).padStart(3, '0')}`;
    expect(txt).toContain(id);
  }
});
