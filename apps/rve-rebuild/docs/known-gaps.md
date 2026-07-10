# Known Gaps

Honest list of what the rebuild does **not** do yet.

## Rescue scope (2026-07-10)

The Milestone 1 implementation in commit `1d34283` passed 11/11 functional tests but was visually and behaviorally a wireframe:

- The preview is mostly black with white vertical blocks.
- Uploaded video appears as a crude blue placeholder card.
- The uploaded video is not visibly rendered in the preview.
- Drag-to-timeline produced an `advanced-timeline-store` mutation but the timeline stayed visually empty.
- Timeline tracks are empty and generic.
- The inspector is permanently a plain-text tab list, not a contextual panel editor.
- The left icon navigation rail from the reference is missing.
- The reference's populated, colored, labeled timeline clips do not exist in the rebuild.

All 13 milestone-1 features in `.rebuild/reports/rve-copy-progress.json` were downgraded from score 5 (`implemented_in_rebuild`) to score 4 (`implemented_stub`) by `scripts/mark-stub.mjs` so the reports reflect what the rebuild actually does.

This document tracks the **remaining** gaps after the rescue pass.

## Milestone 1 (after rescue)

- **Implemented** when a feature has a real DOM element, a real state mutation, **and** a meaningful visual change in the rebuilt app at the relevant viewport (verified by `tests/rve-m1-rescue.spec.mjs`).
- **Stub** when the feature is wired but the visible behavior is missing (defaulted state, generic layout, empty timeline track, etc.).

## Out of scope for Milestone 1 (planned for later milestones)

| ID | Feature | Reason |
| --- | --- | --- |
| F011 | Project save/load | Auth required. |
| F015 | Clip trimming | No working shortcut identified in the live reference. |
| F016 | Clip splitting | Same as F015. |
| F018 | Snapping | Magnetic toggle exists, snapping algorithm is not implemented. |
| F021 | Scrubbing | Not implemented yet. |
| F023 | Text overlays | Inspector panels exist; deep text editing remains Milestone 2. |
| F024 | Transitions | Tab list only. |
| F025 | Effects | Tab list only. |
| F026 | Keyframes | Tab list only. |
| F027 | Audio waveform | File input only accepts `video/*`. |
| F027 | Real MP4 export render | Start Export closes the dialog but does not render a real MP4. |
| F032 | Error states | Not implemented. |
| F033 | Empty states | Partially: empty library message exists. |
| F034 | Unsupported media handling | Not implemented. |

## Tooling gaps

- No source maps for the live reference, so bundle analysis remains identifier/AST/stack-trace based.
- Playwright `page.coverage` returns 0 bytes in this environment; CDP preciseCoverage works but is not used by the rebuild tests.
- The drag-to-timeline test dispatches synthetic `DragEvent`s via `DataTransfer`. Some browsers / Playwright versions do not fully simulate real OS-level drag; the rescue tests assert the resulting visible `TimelineItem`, the persisted store, and the inspector update.

## Browser features intentionally not used

- No WebCodecs, MediaRecorder, or Mediabunny integration in Milestone 1. The library fingerprint from the live reference suggests these are used for export and thumbnail sprite generation, but Milestone 1 does not render anything heavy.

