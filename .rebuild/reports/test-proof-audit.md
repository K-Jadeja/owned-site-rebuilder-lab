# Test Proof Audit

Generated: 2026-07-09T10:37:08.287Z

Every test in the repo is classified by proof level.

| File | Test | Proof level | Reason |
| --- | --- | --- | --- |
| tests/feature-parity-plan.spec.mjs | F001 app shell loads | soft_probe | matches soft marker |
| tests/feature-parity-plan.spec.mjs | F002 top-level regions discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F007 import / add media control discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F012 media library tabs discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F005 timeline region discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F014 track management controls discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F019 timeline zoom controls discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F004 preview/video element discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F020 playback controls discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F009 undo/redo control discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F030 keyboard undo/redo via Ctrl+Z triggers behavior | soft_probe | matches soft marker |
| tests/feature-parity-plan.spec.mjs | F008 export control discoverable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F008b export button click is non-destructive | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F010 storage is reachable | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F031 storage has app keys after load | hard_proof | contains concrete expect assertion |
| tests/feature-parity-plan.spec.mjs | F024 audio waveform render (sample.mp3 fixture) | soft_probe | matches soft marker |
| tests/feature-parity-plan.spec.mjs | F027 export to mp4 (sample.mp4 fixture) | soft_probe | matches soft marker |
| tests/deep-runtime-proof.spec.mjs | export dialog contains 720p, 1080p, 4K, Start Export, Rendered in your browser | hard_proof | contains concrete expect assertion |
| tests/deep-runtime-proof.spec.mjs | Space keypress mutates advanced-timeline-store in localStorage | hard_proof | contains concrete expect assertion |
| tests/deep-runtime-proof.spec.mjs | advanced-timeline-store created by Space persists across page.reload() | soft_probe | matches soft marker |
| tests/deep-runtime-proof.spec.mjs | deep-bundle-analysis.md exists with feature keyword hits | hard_proof | contains concrete expect assertion |
| tests/deep-runtime-proof.spec.mjs | library-fingerprint.json identifies at least 5 libraries | hard_proof | contains concrete expect assertion |
| tests/deep-runtime-proof.spec.mjs | source-map-report.md exists | hard_proof | contains concrete expect assertion |
| tests/deep-runtime-proof.spec.mjs | feature-code-clues.json has at least 5 features with bundles_hit | hard_proof | contains concrete expect assertion |
| tests/single-import-proof.spec.mjs | upload sample.mp4 produces concrete mutation | hard_proof | contains concrete expect assertion |
| tests/bundle-analysis-proof.spec.mjs | public bundles were fetched locally | soft_probe | matches soft marker |
| tests/bundle-analysis-proof.spec.mjs | deep bundle analysis has feature keyword hits | hard_proof | contains concrete expect assertion |
| tests/bundle-analysis-proof.spec.mjs | bundle symbol index covers all fetched JS bundles | hard_proof | contains concrete expect assertion |
| tests/bundle-analysis-proof.spec.mjs | library fingerprint includes known libraries | hard_proof | contains concrete expect assertion |
| tests/bundle-analysis-proof.spec.mjs | css-class-index has rve:* class hits | soft_probe | matches soft marker |
| tests/bundle-analysis-proof.spec.mjs | commit-eligibility report marks files as eligible | hard_proof | contains concrete expect assertion |
| tests/visual-baseline.spec.mjs | reference baseline screenshot | soft_probe | matches soft marker |
| tests/reference-capture.spec.mjs | app shell responds and renders | soft_probe | matches soft marker |
| tests/code-correlation-proof.spec.mjs | feature F007 is upgraded to code_correlated in feature-matrix.json | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | feature F020 is upgraded to code_correlated in feature-matrix.json | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | feature F031 is upgraded to code_correlated in feature-matrix.json | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | feature-code-correlation.json exists with at least 3 code_correlated features | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | action-stack-bundle-map.json exists with mapped frames | soft_probe | matches soft marker |
| tests/code-correlation-proof.spec.mjs | at least one storage-set frame maps into a target JS bundle | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | createObjectURL import flow frames map into a target JS bundle | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | coverage-debug-summary.md exists and is not empty | hard_proof | contains concrete expect assertion |
| tests/code-correlation-proof.spec.mjs | CDP preciseCoverage returned non-zero used bytes | soft_probe | matches soft marker |
| tests/code-correlation-proof.spec.mjs | CDP per-action coverage produced positive deltas for export-dialog | soft_probe | matches soft marker |
| tests/action-stack-proof.spec.mjs | advanced-timeline-store set was captured with a stack trace | soft_probe | matches soft marker |
| tests/action-stack-proof.spec.mjs | idb_migration_v1_done set was captured with a stack trace | soft_probe | matches soft marker |
| tests/action-stack-proof.spec.mjs | lastCleanup_thumbnailCache set was captured with a stack trace | soft_probe | matches soft marker |
| tests/action-stack-proof.spec.mjs | media play was captured during playback-space | soft_probe | matches soft marker |
| tests/action-stack-proof.spec.mjs | createObjectURL was captured during single-file-import | soft_probe | matches soft marker |
| tests/import-timeline-proof.spec.mjs | import-timeline-hardening.md exists | hard_proof | contains concrete expect assertion |
| tests/import-timeline-proof.spec.mjs | import-timeline-hardening.json contains a firstMutation label | hard_proof | contains concrete expect assertion |
| tests/import-timeline-proof.spec.mjs | timeline add reported as PROVEN | hard_proof | contains concrete expect assertion |
| tests/import-timeline-proof.spec.mjs | advanced-timeline-store appears in final state after drag strategy | hard_proof | contains concrete expect assertion |
| tests/import-timeline-proof.spec.mjs | attempt 03-strategy-drag is recorded as firstMutation | hard_proof | contains concrete expect assertion |

## Totals
- hard_proof: 36
- soft_probe: 17