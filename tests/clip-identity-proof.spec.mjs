// tests/clip-identity-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const MAP = path.join(ROOT, '.rebuild/features/clip-identity-map.json');
const PROOF = path.join(ROOT, '.rebuild/deep-import/clip-identity-proof.md');

test('clip-identity map exists', () => {
  expect(existsSync(MAP)).toBeTruthy();
});

test('clip-identity proof exists', () => {
  expect(existsSync(PROOF)).toBeTruthy();
});

test('clip-identity map has candidate counts', async () => {
  const txt = await readFile(MAP, 'utf8');
  const data = JSON.parse(txt);
  expect(data.snapshots).toBeTruthy();
  expect(typeof data.snapshots.before.count).toBe('number');
  expect(typeof data.snapshots.afterUpload.count).toBe('number');
  expect(typeof data.snapshots.afterDrag.count).toBe('number');
});

test('clip-identity probe recorded drag attempt', async () => {
  const txt = await readFile(MAP, 'utf8');
  const data = JSON.parse(txt);
  expect(String(data.dragResult)).toContain('drag');
});
