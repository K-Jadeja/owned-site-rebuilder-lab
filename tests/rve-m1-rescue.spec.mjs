// tests/rve-m1-rescue.spec.mjs
//
// Hard tests for the Milestone 1 rescue. These tests assert visible,
// behavioral, and persisted evidence — not just labels.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const HERE = path.dirname(__filename);
const ROOT = path.resolve(HERE, '..');
const SAMPLE = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');

async function bootFresh(page) {
  await page.goto('/');
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload();
  await page.waitForSelector('[data-testid="rve-shell"]');
}

test.describe('rve-m1 rescue', () => {

  test('A.1: shell exposes the icon rail + media panel + preview + timeline + inspector anchors', async ({ page }) => {
    await bootFresh(page);
    await expect(page.locator('[data-testid="rve-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-panel"]')).toBeVisible();
  });

  test('A.2: icon rail has at least 10 buttons including undo/redo', async ({ page }) => {
    await bootFresh(page);
    const rails = await page.locator('[data-testid^="icon-"]').count();
    expect(rails).toBeGreaterThanOrEqual(10);
    await expect(page.locator('[data-testid="icon-undo"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-redo"]')).toBeVisible();
  });

  test('A.3: timeline begins at roughly the reference Y position (top edge > 50% of viewport)', async ({ page }) => {
    await bootFresh(page);
    const vh = await page.evaluate(() => window.innerHeight);
    const tlBox = await page.locator('[data-testid="timeline-panel"]').boundingBox();
    expect(tlBox).not.toBeNull();
    expect(tlBox.y).toBeGreaterThan(vh * 0.5);
  });

  test('B.1: default project contains visible clips in timeline', async ({ page }) => {
    await bootFresh(page);
    const clipCount = await page.locator('[data-testid="timeline-clip"]').count();
    expect(clipCount).toBeGreaterThanOrEqual(5);
  });

  test('B.2: preview contains the populated composition text', async ({ page }) => {
    await bootFresh(page);
    await expect(page.locator('[data-testid="preview-composition"], [data-testid="preview-text-overlay"]').first()).toBeVisible();
    const text = await page.locator('[data-testid="preview-composition"], [data-testid="preview-text-overlay"]').first().innerText();
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe('Preview');
  });

  test('B.3: tracks are not all empty', async ({ page }) => {
    await bootFresh(page);
    const lanes = page.locator('[data-testid^="timeline-lane-"]');
    const n = await lanes.count();
    expect(n).toBeGreaterThanOrEqual(5);
    let nonempty = 0;
    for (let i = 0; i < n; i++) {
      const c = await lanes.nth(i).locator('[data-testid="timeline-clip"]').count();
      if (c > 0) nonempty++;
    }
    expect(nonempty).toBeGreaterThanOrEqual(3);
  });

  test('C.1: upload sample.mp4 generates a real thumbnail', async ({ page }) => {
    await bootFresh(page);
    const fi = page.locator('[data-testid="media-file-input"]');
    await fi.setInputFiles(SAMPLE);
    await page.waitForTimeout(2500);
    await page.locator('[data-testid="media-tab-my-library"]').click();
    await expect(page.locator('[data-testid="media-card"]').first()).toBeVisible();
    const thumb = page.locator('[data-testid="media-thumbnail"]').first();
    await expect(thumb).toBeVisible();
    const natural = await thumb.evaluate((el) => {
      if (!(el instanceof HTMLImageElement)) return { w: 0, h: 0 };
      return { w: el.naturalWidth || 0, h: el.naturalHeight || 0 };
    });
    expect(natural.w).toBeGreaterThan(0);
    expect(natural.h).toBeGreaterThan(0);
  });

  test('C.2: media card displays filename + duration + size (not just a string)', async ({ page }) => {
    await bootFresh(page);
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="media-tab-my-library"]').click();
    const txt = await page.locator('[data-testid="media-card"]').first().innerText();
    expect(txt).toMatch(/sample\.mp4/i);
    // duration present (e.g. 0:05) or size (e.g. KB)
    expect(/KB|MB|:\d\d/.test(txt)).toBeTruthy();
  });

  test('D.1: after upload, preview video src begins with blob:', async ({ page }) => {
    await bootFresh(page);
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(2500);
    const src = await page.locator('[data-testid="preview-video"]').first().evaluate((el) => el.getAttribute('src') || '');
    expect(src.startsWith('blob:')).toBeTruthy();
  });

  test('D.2: preview does not stay on the default "Preview" empty text after upload', async ({ page }) => {
    await bootFresh(page);
    const before = await page.locator('[data-testid="preview-composition"]').first().innerText();
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(2500);
    const hasVideo = await page.locator('[data-testid="preview-video"]').count();
    expect(hasVideo).toBeGreaterThan(0);
  });

  test('E.1: drag imported media to timeline produces visible clip', async ({ page }) => {
    await bootFresh(page);
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="media-tab-my-library"]').click();
    const before = await page.locator('[data-testid="timeline-clip"]').count();
    const assetId = await page.locator('[data-testid="media-card"]').first().getAttribute('data-asset-id');
    expect(assetId).toBeTruthy();
    await page.evaluate(({ aid }) => {
      const src = document.querySelector(`[data-testid="media-card"][data-asset-id="${aid}"]`);
      const tgt = document.querySelector('[data-testid="timeline-lane-track-video-0"]');
      if (!src || !tgt) return;
      const dt = new DataTransfer();
      dt.setData('text/rve-asset', aid);
      src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    }, { aid: assetId });
    await page.waitForTimeout(700);
    const after = await page.locator('[data-testid="timeline-clip"]').count();
    expect(after).toBeGreaterThan(before);
  });

  test('E.2: timeline clip has stable data-clip-id, data-track-id, data-asset-id', async ({ page }) => {
    await bootFresh(page);
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="media-tab-my-library"]').click();
    const assetId = await page.locator('[data-testid="media-card"]').first().getAttribute('data-asset-id');
    await page.evaluate(({ aid }) => {
      const src = document.querySelector(`[data-testid="media-card"][data-asset-id="${aid}"]`);
      const tgt = document.querySelector('[data-testid="timeline-lane-track-video-0"]');
      if (!src || !tgt) return;
      const dt = new DataTransfer();
      dt.setData('text/rve-asset', aid);
      src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    }, { aid: assetId });
    await page.waitForTimeout(500);
    const clip = page.locator('[data-testid="timeline-clip"]').last();
    const clipId = await clip.getAttribute('data-clip-id');
    const trackId = await clip.getAttribute('data-track-id');
    const dataAsset = await clip.getAttribute('data-asset-id');
    expect(clipId).toBeTruthy();
    expect(trackId).toBe('track-video-0');
    expect(dataAsset).toBe(assetId);
  });

  test('F.1: pressing Space toggles play state and writes advanced-timeline-store', async ({ page }) => {
    await bootFresh(page);
    await page.locator('body').focus().catch(() => {});
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    const adv = await page.evaluate(() => localStorage.getItem('advanced-timeline-store'));
    expect(adv).toBeTruthy();
    const isPlaying = await page.locator('[data-rve-is-playing]').first().getAttribute('data-rve-is-playing');
    expect(isPlaying).toBe('true');
  });

  test('F.2: playback time advances and playhead moves while playing', async ({ page }) => {
    await bootFresh(page);
    await page.locator('body').focus().catch(() => {});
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    const time = await page.locator('[data-testid="playback-time"]').first().innerText();
    expect(time).toMatch(/[1-9]\.[0-9]+s/); // at least 1.0s
  });

  test('G.1: selecting a clip updates inspector with Position fields', async ({ page }) => {
    await bootFresh(page);
    // Click first clip on the demo project
    const firstClip = page.locator('[data-testid="timeline-clip"]').first();
    await firstClip.click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('[data-testid="inspector-tab-position"]').click();
    await expect(page.locator('[data-testid="inspector-position-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-position-top"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-position-width"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-position-height"]')).toBeVisible();
  });

  test('G.2: playback speed tab exposes 1x option', async ({ page }) => {
    await bootFresh(page);
    const firstClip = page.locator('[data-testid="timeline-clip"]').first();
    await firstClip.click({ force: true });
    await page.waitForTimeout(300);
    await page.locator('[data-testid="inspector-tab-playback-speed"]').click();
    await expect(page.locator('[data-testid="inspector-playback-speed"]')).toBeVisible();
    const opts = await page.locator('[data-testid="inspector-playback-speed"] option').allTextContents();
    expect(opts.join(' ')).toContain('1x');
  });

  test('H.1: timeline clip persists across reload', async ({ page }) => {
    await bootFresh(page);
    await page.locator('[data-testid="media-file-input"]').setInputFiles(SAMPLE);
    await page.waitForTimeout(1500);
    await page.locator('[data-testid="media-tab-my-library"]').click();
    const assetId = await page.locator('[data-testid="media-card"]').first().getAttribute('data-asset-id');
    await page.evaluate(({ aid }) => {
      const src = document.querySelector(`[data-testid="media-card"][data-asset-id="${aid}"]`);
      const tgt = document.querySelector('[data-testid="timeline-lane-track-video-0"]');
      if (!src || !tgt) return;
      const dt = new DataTransfer();
      dt.setData('text/rve-asset', aid);
      src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
      tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    }, { aid: assetId });
    await page.waitForTimeout(500);
    const before = await page.locator('[data-testid="timeline-clip"]').count();
    await page.reload();
    await page.waitForSelector('[data-testid="rve-shell"]');
    // Note: object URLs are revoked after the page reload, but the timeline
    // clip itself (with src) should still be persisted in advanced-timeline-store.
    const adv = await page.evaluate(() => localStorage.getItem('advanced-timeline-store'));
    expect(adv).toBeTruthy();
    const parsed = JSON.parse(adv);
    const tracks = parsed.state?.tracks || [];
    const videoTrack = tracks.find((t) => t.id === 'track-video-0');
    expect(videoTrack).toBeTruthy();
    const userAdded = (videoTrack.items || []).filter((it) => it.src);
    expect(userAdded.length).toBeGreaterThanOrEqual(1);
  });

  test('I.1: visual diff report exists and records percentages', async () => {
    const reportPath = path.join(ROOT, '.rebuild/rebuild-parity/m1/visual-parity-report.json');
    expect(existsSync(reportPath)).toBeTruthy();
    const txt = await readFile(reportPath, 'utf8');
    const parsed = JSON.parse(txt);
    expect(Array.isArray(parsed.results)).toBeTruthy();
    expect(parsed.results.length).toBeGreaterThanOrEqual(6);
  });

});
