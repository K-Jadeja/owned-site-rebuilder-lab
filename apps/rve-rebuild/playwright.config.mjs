// apps/rve-rebuild/playwright.config.mjs
//
// Playwright config for the RVE rebuild milestone 1 tests.
// Targets http://localhost:4310 (apps/rve-rebuild dev server).

import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..', '..');

const REBUILD_BASE = process.env.RVE_BASE_URL || 'http://localhost:4310';

export default defineConfig({
  testDir: path.resolve(ROOT, 'tests'),
  testMatch: /rve-rebuild-.*\.spec\.mjs$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: REBUILD_BASE,
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'rve-rebuild',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: HERE,
    url: REBUILD_BASE,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
