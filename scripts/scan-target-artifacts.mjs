// scripts/scan-target-artifacts.mjs
//
// Scans .rebuild/private/bundles/ for secrets + license clues.
// Outputs:
//   .rebuild/target-source/reports/secrets-scan-report.md
//   .rebuild/target-source/reports/license-provenance-report.md
//   .rebuild/target-source/reports/commit-eligibility.md
//
// On pass, copies audited raw bundles from .rebuild/private/bundles/
// to .rebuild/target-source/bundles/.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PRIVATE_DIR = '.rebuild/private/bundles';
const TARGET_DIR = '.rebuild/target-source';
const SECRETS_OUT = `${TARGET_DIR}/reports/secrets-scan-report.md`;
const LICENSE_OUT = `${TARGET_DIR}/reports/license-provenance-report.md`;
const ELIG_OUT = `${TARGET_DIR}/reports/commit-eligibility.md`;
const FETCH_REPORT = `${TARGET_DIR}/manifests/public-bundle-manifest.json`;

const SECRET_PATTERNS = [
  { name: 'authorization-header', re: /authorization\s*[:=]\s*["']?(?:bearer\s+)?[A-Za-z0-9._\-+/=]{12,}/gi, severity: 'high' },
  { name: 'bearer-token', re: /\bbearer\s+[A-Za-z0-9._\-+/=]{20,}/gi, severity: 'high' },
  { name: 'access_token', re: /access_token\s*=\s*[A-Za-z0-9._\-+/=]{12,}/gi, severity: 'high' },
  { name: 'refresh_token', re: /refresh_token\s*=\s*[A-Za-z0-9._\-+/=]{12,}/gi, severity: 'high' },
  { name: 'api_key', re: /(?:api[_-]?key|x-api-key|apikey)\s*[:=]\s*["']?[A-Za-z0-9._\-+/=]{12,}/gi, severity: 'high' },
  { name: 'password', re: /\bpassword\s*[:=]\s*["'][^"'\s]{6,}["']/gi, severity: 'medium' },
  { name: 'private_key', re: /\bprivate[_-]?key\s*[:=]\s*["'][A-Za-z0-9._\-+/=]{16,}["']/gi, severity: 'high' },
  { name: 'supabase-service-role', re: /service_role[_-]?key\s*[:=]\s*["'][A-Za-z0-9._\-]{20,}["']/gi, severity: 'high' },
  { name: 'jwt-eyj', re: /eyJ[A-Za-z0-9_-]{40,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, severity: 'high' },
  { name: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/g, severity: 'high' },
  { name: 'stripe-secret-key', re: /sk_(?:live|test)_[A-Za-z0-9]{16,}/g, severity: 'high' },
  { name: 'openai-key', re: /sk-[A-Za-z0-9]{20,}/g, severity: 'high' },
  { name: 'anthropic-key', re: /sk-ant-[A-Za-z0-9_\-]{20,}/g, severity: 'high' },
  { name: 'database-url', re: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^\s'"<>]{12,}/gi, severity: 'medium' },
  { name: 'session-cookie', re: /\b(?:session|sid|connect\.sid)\s*=\s*[A-Za-z0-9._\-]{16,}/gi, severity: 'medium' },
];

const LIBRARY_CLUES = [
  { lib: 'React', re: /react/i },
  { lib: 'Next.js', re: /next\.?\/?static\/chunks|__next|_next\/static|\/\_next\//i },
  { lib: 'Radix UI', re: /radix-?ui|@radix-ui/i },
  { lib: 'Tailwind', re: /tailwind|tw-/i },
  { lib: 'Zustand', re: /zustand/i },
  { lib: 'Immer', re: /immer/i },
  { lib: 'TanStack', re: /@tanstack|tanstack/i },
  { lib: 'Supabase', re: /supabase/i },
  { lib: 'Pexels', re: /pexels/i },
  { lib: 'WebCodecs', re: /VideoEncoder|VideoDecoder|AudioEncoder|AudioDecoder|webcodecs/i },
  { lib: 'MediaRecorder', re: /MediaRecorder/i },
  { lib: 'Mediabunny', re: /mediabunny/i },
  { lib: 'ffmpeg.wasm', re: /ffmpeg/i },
  { lib: 'Remotion', re: /remotion/i },
  { lib: 'Framer Motion', re: /framer-motion|@motionone/i },
  { lib: 'DND kit', re: /@dnd-kit|dnd-kit/i },
  { lib: 'React DnD', re: /react-dnd|reactDnd/i },
  { lib: 'Konva', re: /konva/i },
  { lib: 'Three.js', re: /three\.js|three\./i },
  { lib: 'PixiJS', re: /pixi|PIXI/i },
  { lib: 'Wavesurfer', re: /wavesurfer/i },
  { lib: 'Lucide', re: /lucide/i },
  { lib: 'Sonner', re: /sonner/i },
  { lib: 'Shadcn', re: /shadcn|shadcn-ui/i },
];

function redactMatch(s, maxLen = 32) {
  if (s.length <= 12) return s;
  return s.slice(0, 8) + '…[REDACTED]…' + s.slice(-4);
}

async function walk(dir) {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function detectLicense(text) {
  const m = text.match(/@license[^\n]{0,200}/i);
  if (m) return m[0].slice(0, 200);
  const m2 = text.match(/Copyright[^\n]{0,200}/i);
  if (m2) return m2[0].slice(0, 200);
  return null;
}

async function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function main() {
  await fs.mkdir(`${TARGET_DIR}/reports`, { recursive: true });

  const allFiles = await walk(PRIVATE_DIR);
  const bundleFiles = allFiles.filter((p) => p.endsWith('.js') || p.endsWith('.css'));

  const findings = [];
  const libHits = new Map();
  const licenseHits = new Map();
  const fileHashes = new Map();

  for (const f of bundleFiles) {
    const text = await fs.readFile(f, 'utf8');
    const buf = Buffer.from(text, 'utf8');
    fileHashes.set(f, await sha256(buf));
    for (const pat of SECRET_PATTERNS) {
      pat.re.lastIndex = 0;
      let m;
      let count = 0;
      while ((m = pat.re.exec(text)) !== null) {
        if (count > 5) break;
        findings.push({
          file: f,
          pattern: pat.name,
          severity: pat.severity,
          offset: m.index,
          preview: redactMatch(m[0]),
        });
        count++;
      }
    }
    for (const lib of LIBRARY_CLUES) {
      lib.re.lastIndex = 0;
      if (lib.re.test(text)) {
        libHits.set(lib.lib, (libHits.get(lib.lib) || 0) + 1);
      }
      lib.re.lastIndex = 0;
    }
    const lic = detectLicense(text);
    if (lic) licenseHits.set(f, lic);
  }

  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const secretsPassed = highCount === 0;

  // ----- secrets report -----
  const secLines = [];
  secLines.push('# Secrets Scan Report');
  secLines.push('');
  secLines.push(`Scanned files: ${bundleFiles.length}`);
  secLines.push(`High severity findings: ${highCount}`);
  secLines.push(`Medium severity findings: ${mediumCount}`);
  secLines.push(`Verdict: ${secretsPassed ? 'PASS' : 'FAIL — do not promote'}`);
  secLines.push('');
  if (findings.length === 0) {
    secLines.push('No findings.');
  } else {
    secLines.push('| File | Pattern | Severity | Offset | Preview |');
    secLines.push('| --- | --- | --- | --- | --- |');
    for (const f of findings) {
      secLines.push(`| ${f.file} | ${f.pattern} | ${f.severity} | ${f.offset} | \`${f.preview}\` |`);
    }
  }
  await fs.writeFile(SECRETS_OUT, secLines.join('\n'));

  // ----- license report -----
  const licLines = [];
  licLines.push('# License / Provenance Report');
  licLines.push('');
  licLines.push('Identified third-party libraries:');
  licLines.push('');
  licLines.push('| Library | Hits across bundles |');
  licLines.push('| --- | --- |');
  for (const [lib, count] of [...libHits.entries()].sort((a, b) => b[1] - a[1])) {
    licLines.push(`| ${lib} | ${count} |`);
  }
  licLines.push('');
  licLines.push('License / copyright comments found:');
  if (licenseHits.size === 0) {
    licLines.push('- (none detected — license headers stripped in production minified output; recommend manual review)');
  } else {
    for (const [f, l] of licenseHits.entries()) {
      licLines.push(`- ${f}: \`${l}\``);
    }
  }
  licLines.push('');
  licLines.push('## Review checklist before publishing');
  licLines.push('- [ ] Each identified library has a compatible license for public release.');
  licLines.push('- [ ] If any bundle is verbatim third-party source, prefer linking rather than committing.');
  licLines.push('- [ ] Pexels public media is CC0; no issue.');
  licLines.push('- [ ] Supabase / Vercel public URLs are public endpoints; no credentials stored.');
  await fs.writeFile(LICENSE_OUT, licLines.join('\n'));

  // ----- eligibility + promotion -----
  let fetchReport = null;
  try {
    fetchReport = JSON.parse(await fs.readFile(FETCH_REPORT, 'utf8'));
  } catch {}

  const eligible = [];
  const ineligible = [];
  for (const f of bundleFiles) {
    const fileFindings = findings.filter((x) => x.file === f && x.severity === 'high');
    const ok = fileFindings.length === 0;
    const rel = path.relative(PRIVATE_DIR, f);
    const targetPath = path.join(TARGET_DIR, 'bundles', rel);
    if (ok) eligible.push({ src: f, dst: targetPath, sha256: fileHashes.get(f) });
    else ineligible.push({ src: f, dst: targetPath, reason: 'has high-severity finding', fileFindings: fileFindings.length });
  }

  if (secretsPassed) {
    for (const e of eligible) {
      await fs.mkdir(path.dirname(e.dst), { recursive: true });
      await fs.copyFile(e.src, e.dst);
    }
  }

  const elLines = [];
  elLines.push('# Commit Eligibility');
  elLines.push('');
  elLines.push(`Secrets scan verdict: **${secretsPassed ? 'PASS' : 'FAIL'}**`);
  elLines.push('');
  elLines.push(`Eligible files copied to .rebuild/target-source/bundles/: ${eligible.length}`);
  for (const e of eligible) {
    elLines.push(`- ${e.dst} (sha256 ${e.sha256.slice(0, 16)}…)`);
  }
  if (ineligible.length > 0) {
    elLines.push('');
    elLines.push(`Ineligible (kept private): ${ineligible.length}`);
    for (const i of ineligible) {
      elLines.push(`- ${i.src}: ${i.reason} (${i.fileFindings} high-severity hits)`);
    }
  }
  await fs.writeFile(ELIG_OUT, elLines.join('\n'));

  console.log(`[scan:target] scanned=${bundleFiles.length} high=${highCount} medium=${mediumCount} verdict=${secretsPassed ? 'PASS' : 'FAIL'} promoted=${eligible.length}`);
  if (!secretsPassed) process.exitCode = 2;
}

main().catch((err) => {
  console.error('[scan:target] fatal', err);
  process.exit(1);
});