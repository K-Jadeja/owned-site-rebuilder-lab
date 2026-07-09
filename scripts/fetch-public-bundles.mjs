// scripts/fetch-public-bundles.mjs
//
// Fetch public JS/CSS bundles that the browser already received.
// Source of truth: .rebuild/reference/bundles/bundles.json
// Outputs:
//   .rebuild/private/bundles/manifest.json
//   .rebuild/private/bundles/js/*.js
//   .rebuild/private/bundles/css/*.css
//   .rebuild/private/bundles/maps/*.map (if available)
//   .rebuild/target-source/manifests/public-bundle-fetch-report.md
//   .rebuild/target-source/manifests/public-bundle-manifest.json
//
// Rules:
// - Only fetch URLs observed in bundles.json (user-owned origin).
// - Public GET only, no cookies/auth.
// - Redact query tokens in reports.
// - Compute SHA-256 for every download.
// - Attempt source map discovery only via the JS sourceMappingURL
//   comment or a sibling .map URL, never via arbitrary paths.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const INPUT = '.rebuild/reference/bundles/bundles.json';
const PRIVATE_DIR = '.rebuild/private/bundles';
const PRIVATE_JS = `${PRIVATE_DIR}/js`;
const PRIVATE_CSS = `${PRIVATE_DIR}/css`;
const PRIVATE_MAPS = `${PRIVATE_DIR}/maps`;
const PRIVATE_MANIFEST = `${PRIVATE_DIR}/manifest.json`;
const REPORT_MD = '.rebuild/target-source/manifests/public-bundle-fetch-report.md';
const REPORT_JSON = '.rebuild/target-source/manifests/public-bundle-manifest.json';

const TOKEN_REGEX = /([?&])(token|key|sig|signature|apikey|api_key|auth|access_token|refresh_token|id_token|jwt)=([^&#]+)/gi;

function redactUrl(u) {
  try {
    const url = new URL(u);
    const sp = url.searchParams;
    for (const k of [...sp.keys()]) {
      if (/(token|key|sig|signature|apikey|api_key|auth|access_token|refresh_token|id_token|jwt)/i.test(k)) {
        sp.set(k, '[REDACTED]');
      }
    }
    return url.toString();
  } catch {
    return u.replace(TOKEN_REGEX, (_, p1, p2) => `${p1}${p2}=[REDACTED]`);
  }
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function urlToLocalName(u) {
  // Use only the path, drop query.
  let p = u;
  try {
    p = new URL(u).pathname;
  } catch {
    p = u.split('?')[0];
  }
  // Replace _next/static/chunks / css / media with safe tokens.
  const safe = p
    .replace(/[\\/]+/g, '__')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+/, '');
  return safe.slice(0, 180);
}

function findSourceMapUrl(jsText) {
  // Look for the standard footer comment.
  const m = jsText.match(/\/\*#\s*sourceMappingURL=([^*\s]+)\s*\*\/\s*$/m);
  if (m) return m[1].trim();
  const m2 = jsText.match(/\/\/[#@]\s*sourceMappingURL=([^\s]+)\s*$/m);
  if (m2) return m2[1].trim();
  return null;
}

async function fetchOnce(url) {
  const r = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'owned-site-rebuilder-lab/bundle-fetch' },
  });
  return r;
}

async function main() {
  for (const d of [PRIVATE_DIR, PRIVATE_JS, PRIVATE_CSS, PRIVATE_MAPS]) {
    await fs.mkdir(d, { recursive: true });
  }
  await fs.mkdir(path.dirname(REPORT_MD), { recursive: true });

  const raw = await fs.readFile(INPUT, 'utf8');
  const items = JSON.parse(raw);

  const manifest = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    inputFile: INPUT,
    targetCount: items.length,
    fetched: [],
    skipped: [],
    failures: [],
    sourceMaps: [],
    bytesTotal: 0,
  };

  // Filter only JS/CSS bundles from the user-owned origin.
  const wanted = items.filter((it) => {
    const url = it.url || '';
    if (!url) return false;
    if (!/^https:\/\/demo\.reactvideoeditor\.com\//.test(url)) return false;
    if (!/(_next\/static\/(chunks|css)\/|\.js(\?|$)|\.css(\?|$))/i.test(url)) return false;
    return true;
  });

  for (const it of wanted) {
    const u = it.url;
    const localName = urlToLocalName(u);
    const isCss = /\.css(\?|$)/i.test(u);
    const subdir = isCss ? 'css' : 'js';
    const localPath = path.join(PRIVATE_DIR, subdir, localName);

    try {
      const r = await fetchOnce(u);
      const ab = await r.arrayBuffer();
      const buf = Buffer.from(ab);
      const hash = sha256(buf);
      const ct = r.headers.get('content-type') || '';
      await fs.writeFile(localPath, buf);
      const entry = {
        url: u,
        redactedUrl: redactUrl(u),
        status: r.status,
        ok: r.ok,
        bytes: buf.length,
        sha256: hash,
        contentType: ct,
        localPath,
        isCss,
        sourceMappingURL: null,
        sourceMapLocalPath: null,
      };

      // Try source map if JS.
      if (!isCss) {
        const text = buf.toString('utf8');
        const smRef = findSourceMapUrl(text);
        if (smRef) {
          let smUrl;
          try {
            // Treat as absolute, or relative to script URL.
            smUrl = new URL(smRef, u).toString();
          } catch {
            smUrl = new URL(smRef, u).toString();
          }
          // Only follow if same origin.
          if (/^https:\/\/demo\.reactvideoeditor\.com\//.test(smUrl)) {
            const smName = urlToLocalName(smUrl);
            const smLocal = path.join(PRIVATE_MAPS, smName);
            try {
              const smr = await fetchOnce(smUrl);
              if (smr.ok) {
                const smab = await smr.arrayBuffer();
                await fs.writeFile(smLocal, Buffer.from(smab));
                entry.sourceMappingURL = smRef;
                entry.sourceMapLocalPath = smLocal;
                manifest.sourceMaps.push({
                  bundleUrl: u,
                  mapUrl: redactUrl(smUrl),
                  bytes: smab.byteLength,
                  sha256: sha256(Buffer.from(smab)),
                });
              }
            } catch (err) {
              // map fetch failure is non-fatal.
              manifest.sourceMaps.push({
                bundleUrl: u,
                mapUrl: redactUrl(smUrl),
                error: String(err.message || err),
              });
            }
          } else {
            entry.sourceMappingURL = smRef;
            entry.sourceMapLocalPath = null;
          }
        }
      }

      manifest.fetched.push(entry);
      manifest.bytesTotal += buf.length;
    } catch (err) {
      manifest.failures.push({ url: u, error: String(err.message || err) });
    }
  }

  for (const it of items) {
    if (!wanted.includes(it)) manifest.skipped.push({ url: it.url, reason: 'not-js/css or off-origin' });
  }

  manifest.finishedAt = new Date().toISOString();

  await fs.writeFile(PRIVATE_MANIFEST, JSON.stringify(manifest, null, 2));
  await fs.writeFile(REPORT_JSON, JSON.stringify(manifest, null, 2));

  // Markdown report.
  const lines = [];
  lines.push('# Public Bundle Fetch Report');
  lines.push('');
  lines.push(`Started: ${manifest.startedAt}`);
  lines.push(`Finished: ${manifest.finishedAt}`);
  lines.push('');
  lines.push('## Counts');
  lines.push(`- total input: ${manifest.targetCount}`);
  lines.push(`- fetched: ${manifest.fetched.length}`);
  lines.push(`- failed: ${manifest.failures.length}`);
  lines.push(`- skipped: ${manifest.skipped.length}`);
  lines.push(`- total bytes: ${manifest.bytesTotal}`);
  lines.push('');
  lines.push('## Source map discoveries');
  lines.push(`- sourceMapRefs: ${manifest.fetched.filter((e) => e.sourceMappingURL).length}`);
  lines.push(`- map files saved: ${manifest.sourceMaps.filter((m) => !m.error).length}`);
  if (manifest.sourceMaps.length > 0) {
    lines.push('');
    lines.push('| Bundle | Map URL (redacted) | Bytes | Status |');
    lines.push('| --- | --- | --- | --- |');
    for (const m of manifest.sourceMaps) {
      lines.push(`| ${m.bundleUrl.split('?')[0]} | ${m.mapUrl} | ${m.bytes || 'n/a'} | ${m.error ? 'error: ' + m.error : 'ok'} |`);
    }
  }
  lines.push('');
  lines.push('## Failures');
  if (manifest.failures.length === 0) {
    lines.push('- (none)');
  } else {
    for (const f of manifest.failures) {
      lines.push(`- ${f.url}: ${f.error}`);
    }
  }
  lines.push('');
  lines.push('## Fetched files');
  lines.push('| URL | Status | Bytes | SHA-256 | Map |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const e of manifest.fetched) {
    lines.push(`| ${e.redactedUrl.split('?')[0]} | ${e.status} | ${e.bytes} | ${e.sha256.slice(0, 16)}… | ${e.sourceMapLocalPath ? 'yes' : (e.sourceMappingURL ? 'ref only' : 'no')} |`);
  }
  await fs.writeFile(REPORT_MD, lines.join('\n'));

  console.log(`[fetch:bundles] fetched ${manifest.fetched.length}, failed ${manifest.failures.length}, maps ${manifest.sourceMaps.length}, bytes ${manifest.bytesTotal}`);
  if (manifest.failures.length > 0) process.exitCode = 0; // not fatal
}

main().catch((err) => {
  console.error('[fetch:bundles] fatal', err);
  process.exit(1);
});