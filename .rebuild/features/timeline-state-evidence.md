# Timeline State Evidence

What we know about the timeline state model from observable evidence.

## Source artifacts

| Source | Used for |
| --- | --- |
| `extracted-editor-state.json` (if produced) | full tracks array from console args |
| `on-save-objects.json` | text tokens from `[onSave] Editor state saved` |
| `decoded-state-stores.md` | Zustand persist shape |
| `action-storage-stacks.json` | advanced-timeline-store mutation stacks |
| `import-timeline-hardening.json` | first proven add strategy |
| `bundle-symbol-index.json` | clip/track identifier hints |
| `action-stack-bundle-map.json` | tracked flows in 180476bc bundle |

## Observed

1. `advanced-timeline-store` is a Zustand persist shape `{"state":{"trackDensity":"default"},"version":0}`.
2. The `drag-to-timeline` mutation first succeeds when using strategy `03-strategy-drag`.
3. Many clip/track keywords (`track`, `drag`, `drop`, `clip`) co-occur with `localStorage` in 180476bc.

## Unknown

- Full track list (only text hint `Array(6)` recovered so far).
- Clip identities (no `[data-clip-id]` markers).
- Effect / transition / keyframe structures.
- Waveform structures.