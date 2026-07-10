// tests/probe.spec.mjs
import { test, expect } from '@playwright/test';

test('probe shell', async ({ page }) => {
  await page.goto('http://localhost:4310/');
  await page.waitForSelector('[data-testid="rve-shell"]', { timeout: 30000 });
  await expect(page.locator('[data-testid="rve-shell"]')).toBeVisible();
});
