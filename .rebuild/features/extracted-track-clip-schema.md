# Extracted Track / Clip State Schema

Generated: 2026-07-09T12:11:46.428Z

A **partial** schema. Many fields remain inferred-only.

## Project-level fields

| Field | Proof | Confidence | Observed | Sources |
| --- | --- | --- | --- | --- |
| `tracks` | code_correlated | high | Array(8) | extracted-editor-state.json |
| `aspectRatio` | code_correlated | high | "16:9" | extracted-editor-state.json, on-save-objects.json |
| `backgroundColor` | code_correlated | high | "white" | extracted-editor-state.json, on-save-objects.json |
| `playbackRate` | code_correlated | high | 1 | extracted-editor-state.json, on-save-objects.json |
| `savedAt` | code_correlated | high | 1783599020679 | extracted-editor-state.json, on-save-objects.json |

## Track-level fields

| Field | Proof | Confidence | Observed | Sources |
| --- | --- | --- | --- | --- |
| `id` | code_correlated | high | string | extracted-editor-state.json |
| `items` | code_correlated | high | object | extracted-editor-state.json |
| `magnetic` | code_correlated | high | boolean | extracted-editor-state.json |
| `muted` | code_correlated | high | boolean | extracted-editor-state.json, bundle-symbol-index.json |
| `visible` | code_correlated | high | boolean | extracted-editor-state.json, bundle-symbol-index.json |
| `addStrategy` | hard_proof | high | 03-strategy-drag | import-timeline-hardening.json |
| `locked` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |

## Clip-level fields

| Field | Proof | Confidence | Observed | Sources |
| --- | --- | --- | --- | --- |
| `left` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json, bundle-symbol-index.json |
| `top` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `width` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json, bundle-symbol-index.json |
| `height` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `durationInFrames` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `from` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `rotation` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `type` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `content` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `styles` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `id` | code_correlated | high | observed across items | extracted-editor-state.json (sweep), extracted-editor-state.json |
| `src` | code_correlated | high | observed across items | extracted-editor-state.json (sweep) |
| `mediaStartTime` | code_correlated | high | observed across items | extracted-editor-state.json (sweep) |
| `mediaSrcDuration` | code_correlated | high | observed across items | extracted-editor-state.json (sweep) |
| `duration` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |
| `trimStart` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |
| `trimEnd` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |
| `volume` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |
| `effects` | inferred_from_bundle | low | seen in bundle text | bundle-symbol-index.json |

## Missing fields

- Track: order, magnetic, snap, density mode (only partial).
- Clip: position, transform, keyframes (none observed).
- Effects / transitions: not in console args or onSave.

See `.rebuild/features/timeline-state-evidence.md` for source evidence breakdown.