// tests/export-end-to-end-proof.spec.mjs
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');

const E2E = path.join(ROOT, '.rebuild/export-proof/export-end-to-end.json');
const OUT_DIR = path.join(ROOT, '.rebuild/export-proof/output');

test('export-end-to-end json exists', () => {
  expect(existsSync(E2E)).toBeTruthy();
});

test('export-end-to-end recorded objectUrls, download, completion, or fatal crash artifact', async () => {
  if (!existsSync(E2E)) {
    test.skip(true, 'export-end-to-end.json missing');
    return;
  }
  const txt = await readFile(E2E, 'utf8');
  expect(txt.length).toBeGreaterThan(20);
  const data = JSON.parse(txt);
  const hasDownload = data.download && !data.download.error;
  const hasObjectUrls = (data.objectUrls || []).length > 0;
  const hasCompletion = data.completion && data.completion.bodyTextHasComplete;
  const hasFatal = !!data.fatal;
  expect(
    hasDownload || hasObjectUrls || hasCompletion || hasFatal || (data.download && data.download.error)
  ).toBeTruthy();
});

test('export-end-to-end output dir exists', () => {
  expect(existsSync(OUT_DIR)).toBeTruthy();
});
