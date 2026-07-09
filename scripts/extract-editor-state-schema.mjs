// scripts/extract-editor-state-schema.mjs
//
// Build a partial track/clip state schema from observable evidence.
//
// Inputs:
//   .rebuild/runtime/console-objects/on-save-objects.json
//   .rebuild/features/extracted-editor-state.json (optional)
//   .rebuild/features/decoded-state-stores.md/json
//   .rebuild/runtime/stack-traces/action-storage-stacks.json
//   .rebuild/deep-import/import-timeline-hardening.json
//   .rebuild/features/bundle-symbol-index.json
//   .rebuild/features/action-stack-bundle-map.json
//
// Outputs:
//   .rebuild/features/extracted-track-clip-schema.json
//   .rebuild/features/extracted-track-clip-schema.md
//   .rebuild/features/timeline-state-evidence.md

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function readIfExists(p) {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

async function readJsonIfExists(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

function merge(set, key, value, sourceFile, proof, confidence) {
  if (!set[key]) {
    set[key] = {
      observed: [],
      sources: new Set(),
      proof,
      confidence,
    };
  }
  set[key].observed.push(value);
  set[key].sources.add(sourceFile);
}

function setToArr(setObj) {
  const out = {};
  for (const [k, v] of Object.entries(setObj)) {
    out[k] = {
      observed: v.observed,
      sources: [...v.sources],
      proof: v.proof,
      confidence: v.confidence,
    };
  }
  return out;
}

async function main() {
  const projectFields = {};
  const trackFields = {};
  const clipFields = {};

  // 1. Try to extract from extracted-editor-state.json if present.
  const editorState = await readJsonIfExists(path.join(ROOT, '.rebuild/features/extracted-editor-state.json'));
  if (editorState && typeof editorState === 'object') {
    for (const k of Object.keys(editorState).slice(0, 200)) {
      const v = editorState[k];
      if (k === 'tracks' && Array.isArray(v)) {
        merge(projectFields, 'tracks', `Array(${v.length})`, 'extracted-editor-state.json', 'code_correlated', 'high');
        // Inspect first track
        if (v[0] && typeof v[0] === 'object') {
          for (const tk of Object.keys(v[0])) {
            merge(trackFields, tk, typeof v[0][tk], 'extracted-editor-state.json', 'code_correlated', 'high');
          }
        }
        // Walk every track to collect union of all keys
        const trackKeys = new Set();
        const itemKeys = new Set();
        for (const t of v.slice(0, 20)) {
          if (t && typeof t === 'object') {
            for (const tk of Object.keys(t)) trackKeys.add(tk);
            for (const it of (t.items || t.clips || [])) {
              for (const ik of Object.keys(it || {})) itemKeys.add(ik);
            }
          }
        }
        for (const tk of trackKeys) {
          if (!trackFields[tk]) merge(trackFields, tk, 'observed across tracks', 'extracted-editor-state.json (sweep)', 'code_correlated', 'high');
        }
        for (const ik of itemKeys) {
          if (!clipFields[ik]) merge(clipFields, ik, 'observed across items', 'extracted-editor-state.json (sweep)', 'code_correlated', 'high');
        }
        if (v[0] && (v[0].items || v[0].clips)) {
          const inner = v[0].items || v[0].clips;
          if (Array.isArray(inner) && inner[0]) {
            for (const ck of Object.keys(inner[0])) {
              merge(clipFields, ck, typeof inner[0][ck], 'extracted-editor-state.json', 'code_correlated', 'high');
            }
          }
        }
      } else {
        merge(projectFields, k, JSON.stringify(v).slice(0, 100), 'extracted-editor-state.json', 'code_correlated', 'high');
      }
    }
  }

  // 2. Inspect on-save-objects.json for textual hints
  const onSave = await readJsonIfExists(path.join(ROOT, '.rebuild/runtime/console-objects/on-save-objects.json'));
  if (onSave && Array.isArray(onSave.objects)) {
    for (const o of onSave.objects) {
      const t = o.text || '';
      // tokens like `aspectRatio: 16:9`
      const m = t.match(/(\w+):\s*([^,}\s]+(?:[^,}]*?))(?=,|})/g);
      if (m) {
        for (const tok of m) {
          const mm = tok.match(/^(\w+):\s*(.+)$/);
          if (mm) {
            const [, k, val] = mm;
            if (/aspectRatio|backgroundColor|playbackRate|savedAt|tracks|track|clip|item|duration|start|end|id/i.test(k)) {
              merge(projectFields, k, val, 'on-save-objects.json', 'code_correlated', 'medium');
            }
          }
        }
      }
    }
  }

  // 3. Decode advanced-timeline-store (Zustand persist)
  const at = await readJsonIfExists(path.join(ROOT, '.rebuild/runtime/stack-traces/action-storage-stacks.json'));
  if (at && Array.isArray(at.events)) {
    const adv = at.events.find((e) => /advanced-timeline-store/i.test(e.key || e.storageKey || ''));
    if (adv && adv.valuePreview) {
      merge(trackFields, 'trackDensity', adv.valuePreview.match(/trackDensity[^,}]*/i)?.[0] || 'unknown', 'action-storage-stacks.json', 'hard_proof', 'high');
    }
  }

  // 4. Import-timeline-hardening.json — first mutation strategy
  const ith = await readJsonIfExists(path.join(ROOT, '.rebuild/deep-import/import-timeline-hardening.json'));
  if (ith) {
    if (ith.firstMutation) {
      merge(trackFields, 'addStrategy', ith.firstMutation, 'import-timeline-hardening.json', 'hard_proof', 'high');
    }
    if (ith.firstMutationStrategy) {
      merge(trackFields, 'addStrategy', ith.firstMutationStrategy, 'import-timeline-hardening.json', 'hard_proof', 'high');
    }
  }

  // 5. Bundle-symbol-index.json — track / clip symbols
  const bsi = await readJsonIfExists(path.join(ROOT, '.rebuild/features/bundle-symbol-index.json'));
  if (bsi) {
    const allTokens = [];
    if (bsi.strings && typeof bsi.strings === 'object') {
      for (const arr of Object.values(bsi.strings)) {
        if (Array.isArray(arr)) allTokens.push(...arr);
      }
    }
    if (Array.isArray(bsi.identifiers)) allTokens.push(...bsi.identifiers);
    const tokens = allTokens;
    const candidateTrackProps = ['trackId', 'trackIndex', 'trackType', 'muted', 'locked', 'visible', 'trackHeight'];
    const candidateClipProps = ['clipId', 'itemId', 'assetId', 'sourceId', 'startTime', 'endTime', 'duration', 'trimStart', 'trimEnd', 'left', 'width', 'volume', 'effects'];
    for (const tk of candidateTrackProps) {
      if (tokens.some((t) => typeof t === 'string' && t.includes(tk))) {
        merge(trackFields, tk, 'seen in bundle text', 'bundle-symbol-index.json', 'inferred_from_bundle', 'low');
      }
    }
    for (const ck of candidateClipProps) {
      if (tokens.some((t) => typeof t === 'string' && t.includes(ck))) {
        merge(clipFields, ck, 'seen in bundle text', 'bundle-symbol-index.json', 'inferred_from_bundle', 'low');
      }
    }
  }

  // 6. action-stack-bundle-map.json — verified clip/track keywords
  const asbm = await readJsonIfExists(path.join(ROOT, '.rebuild/features/action-stack-bundle-map.json'));
  if (asbm && Array.isArray(asbm.frames)) {
    let trackFrames = 0;
    let clipFrames = 0;
    for (const f of asbm.frames) {
      const kw = (f.keywords || []).join(' ');
      if (/track/i.test(kw)) trackFrames++;
      if (/clip|item|segment/i.test(kw)) clipFrames++;
    }
    if (trackFrames > 0) {
      merge(trackFields, 'flow', `${trackFrames} stack frames with track keywords`, 'action-stack-bundle-map.json', 'code_correlated', 'medium');
    }
    if (clipFrames > 0) {
      merge(clipFields, 'flow', `${clipFrames} stack frames with clip keywords`, 'action-stack-bundle-map.json', 'code_correlated', 'medium');
    }
  }

  const schema = {
    project: projectFields,
    track: trackFields,
    clip: clipFields,
  };

  await fs.writeFile(
    path.join(ROOT, '.rebuild/features/extracted-track-clip-schema.json'),
    JSON.stringify(setToArr({ ...projectFields, ...trackFields, ...clipFields }) ? schema : schema, null, 2)
  );

  // Markdown
  const md = [];
  md.push('# Extracted Track / Clip State Schema');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('A **partial** schema. Many fields remain inferred-only.');
  md.push('');
  md.push('## Project-level fields');
  md.push('');
  md.push('| Field | Proof | Confidence | Observed | Sources |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const [k, v] of Object.entries(projectFields)) {
    md.push(`| \`${k}\` | ${v.proof} | ${v.confidence} | ${(v.observed[0] + '').slice(0, 60)} | ${[...v.sources].join(', ')} |`);
  }
  md.push('');
  md.push('## Track-level fields');
  md.push('');
  md.push('| Field | Proof | Confidence | Observed | Sources |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const [k, v] of Object.entries(trackFields)) {
    md.push(`| \`${k}\` | ${v.proof} | ${v.confidence} | ${(v.observed[0] + '').slice(0, 60)} | ${[...v.sources].join(', ')} |`);
  }
  md.push('');
  md.push('## Clip-level fields');
  md.push('');
  md.push('| Field | Proof | Confidence | Observed | Sources |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const [k, v] of Object.entries(clipFields)) {
    md.push(`| \`${k}\` | ${v.proof} | ${v.confidence} | ${(v.observed[0] + '').slice(0, 60)} | ${[...v.sources].join(', ')} |`);
  }
  md.push('');
  md.push('## Missing fields');
  md.push('');
  md.push('- Track: order, magnetic, snap, density mode (only partial).');
  md.push('- Clip: position, transform, keyframes (none observed).');
  md.push('- Effects / transitions: not in console args or onSave.');
  md.push('');
  md.push('See `.rebuild/features/timeline-state-evidence.md` for source evidence breakdown.');

  await fs.writeFile(path.join(ROOT, '.rebuild/features/extracted-track-clip-schema.md'), md.join('\n'));

  // Timeline state evidence
  const tev = [];
  tev.push('# Timeline State Evidence');
  tev.push('');
  tev.push('What we know about the timeline state model from observable evidence.');
  tev.push('');
  tev.push('## Source artifacts');
  tev.push('');
  tev.push('| Source | Used for |');
  tev.push('| --- | --- |');
  tev.push('| `extracted-editor-state.json` (if produced) | full tracks array from console args |');
  tev.push('| `on-save-objects.json` | text tokens from `[onSave] Editor state saved` |');
  tev.push('| `decoded-state-stores.md` | Zustand persist shape |');
  tev.push('| `action-storage-stacks.json` | advanced-timeline-store mutation stacks |');
  tev.push('| `import-timeline-hardening.json` | first proven add strategy |');
  tev.push('| `bundle-symbol-index.json` | clip/track identifier hints |');
  tev.push('| `action-stack-bundle-map.json` | tracked flows in 180476bc bundle |');
  tev.push('');
  tev.push('## Observed');
  tev.push('');
  tev.push('1. `advanced-timeline-store` is a Zustand persist shape `{"state":{"trackDensity":"default"},"version":0}`.');
  tev.push('2. The `drag-to-timeline` mutation first succeeds when using strategy `03-strategy-drag`.');
  tev.push('3. Many clip/track keywords (`track`, `drag`, `drop`, `clip`) co-occur with `localStorage` in 180476bc.');
  tev.push('');
  tev.push('## Unknown');
  tev.push('');
  tev.push('- Full track list (only text hint `Array(6)` recovered so far).');
  tev.push('- Clip identities (no `[data-clip-id]` markers).');
  tev.push('- Effect / transition / keyframe structures.');
  tev.push('- Waveform structures.');

  await fs.writeFile(path.join(ROOT, '.rebuild/features/timeline-state-evidence.md'), tev.join('\n'));

  const totalKnown = Object.keys(projectFields).length + Object.keys(trackFields).length + Object.keys(clipFields).length;
  console.log(`[extract:state-schema] total fields: ${totalKnown} (project=${Object.keys(projectFields).length} track=${Object.keys(trackFields).length} clip=${Object.keys(clipFields).length})`);
}

main().catch((err) => {
  console.error('[extract:state-schema] fatal', err);
  process.exit(1);
});
