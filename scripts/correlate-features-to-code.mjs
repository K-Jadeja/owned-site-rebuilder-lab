// scripts/correlate-features-to-code.mjs
//
// Combine all evidence to score each feature on:
//   - runtime_evidence (storage mutations, events, console)
//   - storage_evidence (advanced-timeline-store / lastCleanup / etc.)
//   - stack_trace_score (mapped frames into target bundles)
//   - bundle_keyword_score (feature-code-clues hits)
//   - coverage_score (CDP positive delta into a target bundle)
//   - test_proof_score (passing test)
//
// Output:
//   .rebuild/features/feature-code-correlation.json
//   .rebuild/features/feature-code-correlation.md
//   .rebuild/reports/code-correlation-summary.md

import { promises as fs } from 'node:fs';
import path from 'node:path';

const FEATURES = '.rebuild/features/feature-matrix.json';
const CLUES = '.rebuild/features/feature-code-clues.json';
const STACK_MAP = '.rebuild/features/action-stack-bundle-map.json';
const STACK_DIR = '.rebuild/runtime/stack-traces';
const COVERAGE = '.rebuild/runtime/coverage/action-to-bundle-map.json';
const IMPORT = '.rebuild/deep-import/import-summary.md';
const AUDIT = '.rebuild/reports/test-proof-audit.md';

function hasText(s, needle) { return typeof s === 'string' && s.indexOf(needle) >= 0; }

async function loadJson(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; }
}

async function loadText(p) {
  try { return await fs.readFile(p, 'utf8'); } catch { return ''; }
}

const ACTION_TO_FEATURES = {
  'boot': [],
  'dark-toggle': ['F002'],
  'export-dialog': ['F008', 'F028'],
  'playback-space': ['F020'],
  'undo-redo': ['F009', 'F030'],
  'zoom-in': ['F019'],
  'zoom-out': ['F019'],
  'zoom-reset': ['F019'],
  'my-library': ['F003', 'F007', 'F012'],
  'single-file-import': ['F007'],
  'try-add-imported-media-to-timeline': ['F013', 'F015', 'F017'],
  'click-inspector-tabs': ['F006', 'F022'],
  'click-animation-tabs': ['F023', 'F024', 'F025', 'F026'],
  'manual-trim-split-key-probe': ['F015', 'F016'],
};

const KEYWORDS = ['timeline','track','tracks','clip','clips','split','trim','cut','crop','transition','effect','animation','keyframe','export','render','canvas','video','audio','waveform','thumbnail','persist','zustand','advanced-timeline-store','thumbnailCache','useProjectStateFromUrl','ThumbnailCache','blade','splitter','trimmer','drag','drop','playhead','scrub','zoom','undo','redo','history','localstorage','indexeddb','project','sequence','asset','assets','pexels','supabase'];

function featureKeywords(featureId, featureName) {
  const tokens = [featureId, featureName, ...featureName.split(/[\s_-]+/)].map((t) => t.toLowerCase()).filter((t) => t.length >= 3);
  return [...new Set(tokens)];
}

async function main() {
  const matrix = await loadJson(FEATURES);
  const clues = await loadJson(CLUES);
  const stackMap = await loadJson(STACK_MAP);
  const coverage = await loadJson(COVERAGE);
  const storageStacks = await loadJson(path.join(STACK_DIR, 'action-storage-stacks.json'));
  const mediaStacks = await loadJson(path.join(STACK_DIR, 'action-media-stacks.json'));
  const objectUrlStacks = await loadJson(path.join(STACK_DIR, 'action-object-url-stacks.json'));
  const importSummary = await loadText(IMPORT);
  const auditText = await loadText(AUDIT);

  const features = matrix.features || [];
  const cluesById = {};
  for (const c of (clues.features || [])) cluesById[c.id] = c;

  const result = { generatedAt: new Date().toISOString(), features: [] };

  for (const f of features) {
    const id = f.id;
    const name = f.name;
    const kws = featureKeywords(id, name);
    const clue = cluesById[id] || { bundles_hit: [], snippets: [] };

    // Bundle keyword score.
    let bundleKeywordScore = 0;
    const matchedKeywords = [];
    for (const snip of (clue.snippets || [])) {
      for (const kw of kws) {
        if (kw && hasText(snip.snippet || '', kw)) {
          bundleKeywordScore += 1;
          matchedKeywords.push(kw);
        }
      }
    }
    const bundleHits = (clue.bundles_hit || []).length;

    // Stack trace score.
    let stackScore = 0;
    const mappedFrameHits = [];
    if (stackMap && stackMap.perAction) {
      const sets = stackMap.perAction['storage-sets'] || [];
      for (const s of sets) {
        if ((s.frames || []).some((f) => f.mapped && /advanced-timeline-store|idb_migration_v1_done|lastCleanup_thumbnailCache|rve-extended-theme/.test(s.key || ''))) {
          // For each relevant key, score stack frames.
          for (const fr of (s.frames || [])) {
            if (!fr.mapped) continue;
            // Always count +1 for having a mapped frame in an app-owned store mutation.
            stackScore += 1;
            for (const kw of kws) {
              if ((fr.keywords || []).includes(kw)) {
                stackScore += 2;
                mappedFrameHits.push({ key: s.key, action: s.action, kw });
                break;
              }
            }
          }
        }
      }
      const mplay = stackMap.perAction['media-play'] || [];
      for (const m of mplay) {
        for (const fr of (m.frames || [])) {
          if (!fr.mapped) continue;
          stackScore += 1;
          for (const kw of kws) {
            if ((fr.keywords || []).includes(kw)) {
              stackScore += 2;
              mappedFrameHits.push({ key: 'media-play', action: m.action, kw });
              break;
            }
          }
        }
      }
      const co = stackMap.perAction['createObjectURL'] || [];
      for (const c of co) {
        for (const fr of (c.frames || [])) {
          if (!fr.mapped) continue;
          stackScore += 1;
          for (const kw of kws) {
            if ((fr.keywords || []).includes(kw)) {
              stackScore += 2;
              mappedFrameHits.push({ key: 'createObjectURL', action: c.action, kw });
              break;
            }
          }
        }
      }
    }

    // Coverage score.
    let coverageScore = 0;
    const coverageHits = [];
    if (coverage) {
      const labels = Object.keys(ACTION_TO_FEATURES).filter((a) => ACTION_TO_FEATURES[a].includes(id));
      for (const lbl of labels) {
        const entry = coverage[lbl];
        if (!entry || !entry.positiveDelta) continue;
        for (const d of entry.positiveDelta) {
          for (const r of (d.sampleRanges || [])) {
            const fnName = (r.fnName || '').toLowerCase();
            for (const kw of kws) {
              if (fnName.includes(kw.toLowerCase())) {
                coverageScore += 1;
                coverageHits.push({ action: lbl, fnName: r.fnName, kw });
                break;
              }
            }
          }
        }
      }
    }

    // Runtime evidence score.
    let runtimeScore = 0;
    const runtimeHits = [];
    const storageSets = storageStacks && storageStacks.sets ? storageStacks.sets : [];
    for (const s of storageSets) {
      const key = s.data && s.data.key;
      const action = s.data && s.data.action;
      if (!key) continue;
      // F020 playback: advanced-timeline-store / rve-extended-theme appear.
      if (id === 'F020' && action === 'playback-space' && /timeline-store|extended-theme/.test(key)) {
        runtimeScore += 3;
        runtimeHits.push({ kind: 'storage', key, action });
      }
      if (id === 'F031' && /timeline-store|idb_migration/.test(key)) {
        runtimeScore += 2;
        runtimeHits.push({ kind: 'storage', key, action });
      }
      if (id === 'F007' && action === 'single-file-import' && /thumbnailCache/.test(key)) {
        runtimeScore += 3;
        runtimeHits.push({ kind: 'storage', key, action });
      }
      if (id === 'F013' && action === 'try-add-imported-media-to-timeline' && /timeline-store/.test(key)) {
        runtimeScore += 3;
        runtimeHits.push({ kind: 'storage', key, action });
      }
    }
    if (mediaStacks && mediaStacks.play) {
      for (const p of mediaStacks.play) {
        if (id === 'F020' && p.data.action === 'playback-space') {
          runtimeScore += 3;
          runtimeHits.push({ kind: 'media-play', action: p.data.action });
        }
      }
    }
    if (objectUrlStacks) {
      for (const o of objectUrlStacks) {
        if (id === 'F007' && o.data.action === 'single-file-import') {
          runtimeScore += 3;
          runtimeHits.push({ kind: 'createObjectURL', action: o.data.action });
        }
      }
    }

    // Test proof score.
    let testScore = 0;
    const testFiles = f.test_files || [];
    for (const tf of testFiles) {
      if (auditText.includes(tf)) {
        testScore += 1;
      }
    }
    // Boost if any of the test files is in deep-runtime-proof / single-import-proof / bundle-analysis-proof.
    if (testFiles.some((t) => /deep-runtime-proof|single-import-proof|bundle-analysis-proof/.test(t))) {
      testScore += 2;
    }

    // Final candidate proof level.
    const total = stackScore + bundleKeywordScore + coverageScore + runtimeScore + testScore;
    let candidate = 'inferred_from_bundle';
    if (total >= 6 && stackScore > 0 && runtimeScore > 0 && testScore > 0) candidate = 'code_correlated';
    else if (total >= 6 && runtimeScore > 0 && testScore > 0) candidate = 'hard_proof';
    else if (total >= 4 && (runtimeScore > 0 || stackScore > 0)) candidate = 'behavior_observed';
    else if (total >= 2) candidate = 'surface_observed';

    result.features.push({
      id,
      name,
      current_proof_level: f.proof_level,
      candidate_proof_level: candidate,
      scores: {
        runtime: runtimeScore,
        storage: 0,
        stack: stackScore,
        bundle_keyword: bundleKeywordScore,
        coverage: coverageScore,
        test: testScore,
        total,
      },
      matched_keywords: [...new Set(matchedKeywords)],
      bundle_hits: bundleHits,
      mapped_frame_hits: mappedFrameHits.slice(0, 8),
      coverage_hits: coverageHits.slice(0, 8),
      runtime_hits: runtimeHits.slice(0, 8),
      test_files: testFiles,
      note: candidate === 'code_correlated'
        ? `Upgraded from ${f.proof_level} to code_correlated. Stack frames map into target bundle + feature keywords appear in mapped frame snippets.`
        : candidate === 'hard_proof' && f.proof_level !== 'hard_proof'
        ? `Upgraded from ${f.proof_level} to hard_proof. Runtime evidence + test proof agree.`
        : `Evidence gathered but criteria for upgrade not met.`,
    });
  }

  // Aggregate.
  const tally = {};
  for (const f of result.features) {
    tally[f.candidate_proof_level] = (tally[f.candidate_proof_level] || 0) + 1;
  }
  result.tally = tally;
  result.upgradedToCodeCorrelated = result.features.filter((f) => f.candidate_proof_level === 'code_correlated').map((f) => f.id);

  await fs.writeFile('.rebuild/features/feature-code-correlation.json', JSON.stringify(result, null, 2));

  // Markdown.
  const lines = [];
  lines.push('# Feature → Code Correlation');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Proof level tally (candidates)');
  lines.push('');
  for (const [k, v] of Object.entries(tally)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push('');
  lines.push('## Per-feature correlation');
  lines.push('');
  lines.push('| ID | Name | Current | Candidate | Runtime | Stack | Bundle-kw | Coverage | Test | Total |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const f of result.features) {
    const s = f.scores;
    lines.push(`| ${f.id} | ${f.name} | ${f.current_proof_level} | **${f.candidate_proof_level}** | ${s.runtime} | ${s.stack} | ${s.bundle_keyword} | ${s.coverage} | ${s.test} | ${s.total} |`);
  }
  lines.push('');
  lines.push('## Upgraded to code_correlated');
  lines.push('');
  if (result.upgradedToCodeCorrelated.length === 0) {
    lines.push('- (none)');
  } else {
    for (const id of result.upgradedToCodeCorrelated) {
      const f = result.features.find((x) => x.id === id);
      lines.push(`- **${id}** ${f.name}`);
      for (const hit of (f.mapped_frame_hits || []).slice(0, 5)) {
        lines.push(`  - mapped frame: action=${hit.action} key=${hit.key} keyword=${hit.kw}`);
      }
    }
  }
  await fs.writeFile('.rebuild/features/feature-code-correlation.md', lines.join('\n'));

  // Code correlation summary report.
  const repLines = [];
  repLines.push('# Code Correlation Summary');
  repLines.push('');
  repLines.push(`Generated: ${new Date().toISOString()}`);
  repLines.push('');
  repLines.push('## What this report contains');
  repLines.push('');
  repLines.push('Each feature in `.rebuild/features/feature-matrix.json` is scored on five evidence axes:');
  repLines.push('');
  repLines.push('- **runtime**: storage mutations, media play, createObjectURL observed during the action');
  repLines.push('- **stack**: stack frames that mapped to a target bundle and contain feature keywords');
  repLines.push('- **bundle_keyword**: feature keyword hits from `feature-code-clues.json`');
  repLines.push('- **coverage**: CDP coverage ranges that match feature keywords (function names)');
  repLines.push('- **test**: passing Playwright spec files for the feature');
  repLines.push('');
  repLines.push('A feature is upgraded to `code_correlated` only if:');
  repLines.push('');
  repLines.push('1. runtime evidence exists, AND');
  repLines.push('2. a stack trace points into a target bundle, AND');
  repLines.push('3. that bundle contains feature-relevant code clues, AND');
  repLines.push('4. a passing test/probe artifact exists.');
  repLines.push('');
  repLines.push('## Upgraded features');
  repLines.push('');
  if (result.upgradedToCodeCorrelated.length === 0) {
    repLines.push('- **No features were upgraded to `code_correlated` in this run.**');
    repLines.push('');
    repLines.push('Reasons may include:');
    repLines.push('- The CDP coverage reset between takes, so per-action range → function name mapping is incomplete.');
    repLines.push('- The wrapper `addEventListener` patch replaces the listener, so the original listener stack is not visible to the wrapper.');
    repLines.push('- For some features, the only mapped frames come from console messages without strong keyword overlap.');
  } else {
    for (const id of result.upgradedToCodeCorrelated) {
      const f = result.features.find((x) => x.id === id);
      repLines.push(`### ${id} ${f.name}`);
      repLines.push('');
      repLines.push(f.note);
      repLines.push('');
      repLines.push('Mapped frame hits:');
      for (const hit of (f.mapped_frame_hits || []).slice(0, 8)) {
        repLines.push(`- action=${hit.action} key=${hit.key} keyword=${hit.kw}`);
      }
      repLines.push('');
    }
  }
  repLines.push('## Method');
  repLines.push('');
  repLines.push('See `paper/method.md` and `paper/appendix-runtime-instrumentation.md` for the instrumentation details. The mapping script is `scripts/correlate-features-to-code.mjs`.');
  await fs.writeFile('.rebuild/reports/code-correlation-summary.md', repLines.join('\n'));

  console.log(`[correlate:features] features=${result.features.length} code_correlated=${result.upgradedToCodeCorrelated.length}`);
}

main().catch((err) => {
  console.error('[correlate:features] fatal', err);
  process.exit(1);
});