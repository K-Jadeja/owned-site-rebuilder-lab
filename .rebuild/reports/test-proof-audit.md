# Test Proof Audit

Generated: 2026-07-09T09:46:36.805Z

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

## Totals
- hard_proof: 24
- soft_probe: 9