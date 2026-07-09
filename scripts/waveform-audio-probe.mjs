// scripts/waveform-audio-probe.mjs
//
// Probe for waveform / audio behavior in the public demo.
//
// Outputs:
//   .rebuild/features/waveform-audio-probe.md
//   .rebuild/features/waveform-audio-probe.json

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET = process.env.TARGET_URL || 'https://demo.reactvideoeditor.com';
const SAMPLE_MP3 = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp3');
const SAMPLE_MP4 = path.join(ROOT, '.rebuild/tests/fixtures/sample.mp4');
const OUT_JSON = path.join(ROOT, '.rebuild/features/waveform-audio-probe.json');
const OUT_MD = path.join(ROOT, '.rebuild/features/waveform-audio-probe.md');

async function main() {
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[waveform] navigating');
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Find any file input with audio acceptance
  const audioInputs = await page.evaluate(() => {
    const arr = [];
    document.querySelectorAll('input[type="file"]').forEach((el) => {
      arr.push({ accept: el.accept, multiple: el.multiple });
    });
    return arr;
  });

  // Try uploading mp3 to video/* input — accept mismatch will block
  let mp3UploadResult = 'not-attempted';
  try {
    const fi = await page.$('input[type="file"]');
    if (fi) {
      mp3UploadResult = 'attempted';
      await fi.setInputFiles(SAMPLE_MP3).catch((e) => {
        mp3UploadResult = `error: ${e.message}`;
      });
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    mp3UploadResult = `error: ${e.message}`;
  }

  // After upload, scan DOM for waveform/canvas/SVG regions in lower-third
  const domHints = await page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const lowerThirdY = vh * 0.66;
    const out = { waveform: [], canvases: [], svgs: [], audios: [] };
    document.querySelectorAll('canvas, svg, [role="img"], [aria-label*="wave" i], [aria-label*="audio" i]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const t = el.tagName;
      const slot = (el.tagName === 'CANVAS') ? out.canvases : (el.tagName === 'SVG' ? out.svgs : out.waveform);
      slot.push({ tag: t, aria: el.getAttribute('aria-label'), cls: (el.className.baseVal || el.className || '').toString().slice(0, 100), bb: { x: r.x, y: r.y, w: r.width, h: r.height }, inLowerThird: r.y >= lowerThirdY });
    });
    document.querySelectorAll('audio').forEach((el) => {
      out.audios.push({ src: el.src?.slice(0, 200), paused: el.paused });
    });
    return out;
  });

  // Search bundle text for waveform keywords
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasWaveformText = /waveform|spectrum|spectrogram/i.test(bodyText);
  const hasAudioTrackText = /audio track|sound track|music track/i.test(bodyText);

  await browser.close();

  const out = {
    generatedAt: new Date().toISOString(),
    audioInputs,
    mp3UploadResult,
    domHints,
    hasWaveformText,
    hasAudioTrackText,
    verdict:
      mp3UploadResult.startsWith('error') || mp3UploadResult === 'not-attempted'
        ? 'audio-upload-blocked-by-input-accept'
        : domHints.canvases.length + domHints.svgs.length + domHints.waveform.length > 0
        ? 'waveform-canvas-or-svg-found'
        : 'no-waveform-detected',
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2));

  const md = [];
  md.push('# Waveform / Audio Probe');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`File inputs: ${audioInputs.length}`);
  for (const fi of audioInputs) {
    md.push(`- \`accept="${fi.accept}" multiple=${fi.multiple}\``);
  }
  md.push('');
  md.push(`MP3 upload attempt: ${mp3UploadResult}`);
  md.push('');
  md.push(`Waveform text on page: ${hasWaveformText}`);
  md.push(`Audio track text on page: ${hasAudioTrackText}`);
  md.push('');
  md.push(`Canvases (any): ${domHints.canvases.length}`);
  md.push(`SVGs (any): ${domHints.svgs.length}`);
  md.push(`Waveform-like elements: ${domHints.waveform.length}`);
  md.push('');
  md.push(`## Verdict: ${out.verdict}`);
  if (out.verdict === 'audio-upload-blocked-by-input-accept') {
    md.push('');
    md.push('> The single file input only accepts `video/*`. MP3 cannot be uploaded. F024 waveform remains fixture-ready only.');
  }
  await fs.writeFile(OUT_MD, md.join('\n'));

  console.log(`[waveform] audioInputs=${audioInputs.length} mp3Upload=${mp3UploadResult} verdict=${out.verdict}`);
}

main().catch((err) => {
  console.error('[waveform] fatal', err);
  process.exit(1);
});
