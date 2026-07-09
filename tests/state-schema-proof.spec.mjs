// tests/state-schema-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const SCHEMA = path.join(ROOT, '.rebuild/features/extracted-track-clip-schema.json');
const MD = path.join(ROOT, '.rebuild/features/extracted-track-clip-schema.md');
const TIMELINE = path.join(ROOT, '.rebuild/features/timeline-state-evidence.md');

test('extracted-track-clip-schema.json exists', () => {
  expect(existsSync(SCHEMA)).toBeTruthy();
});

test('extracted-track-clip-schema.md exists', () => {
  expect(existsSync(MD)).toBeTruthy();
});

test('timeline-state-evidence.md exists', () => {
  expect(existsSync(TIMELINE)).toBeTruthy();
});

test('state schema has 3 sections', async () => {
  if (!existsSync(SCHEMA)) {
    test.skip(true, 'state schema missing');
    return;
  }
  const data = JSON.parse(await readFile(SCHEMA, 'utf8'));
  expect(data.project).toBeTruthy();
  expect(data.track).toBeTruthy();
  expect(data.clip).toBeTruthy();
});

test('state schema at least 1 total known field', async () => {
  if (!existsSync(SCHEMA)) {
    test.skip(true, 'state schema missing');
    return;
  }
  const data = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const total = Object.keys(data.project).length + Object.keys(data.track).length + Object.keys(data.clip).length;
  expect(total).toBeGreaterThanOrEqual(1);
});
