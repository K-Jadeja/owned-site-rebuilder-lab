# Known Gaps

Honest list of what the rebuild does **not** do yet.

## In scope for Milestone 1 but not pixel-perfect

- Visual layout is functional-shell only. The exact pixel positions, fonts, and colors of the live reference are not matched.
- Topbar button order / labels follow the live reference's button discovery but are not visually identical.
- The single-file input accepts only `video/*` (matches the live reference).

## Out of scope for Milestone 1 (planned for later milestones)

| ID | Feature | Reason |
| --- | --- | --- |
| F011 | Project save/load | Auth required. |
| F015 | Clip trimming | No working shortcut identified in the live reference. |
| F016 | Clip splitting | Same as F015. |
| F018 | Snapping | Magnetic toggle exists, snapping algorithm is not implemented. |
| F021 | Scrubbing | Not implemented yet. |
| F023 | Text overlays | Inspector tab list only. |
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
- The drag-to-timeline test dispatches synthetic `DragEvent`s via `DataTransfer`. Some browsers / Playwright versions do not fully simulate real OS-level drag; the test asserts the resulting `TimelineItem` count and `advanced-timeline-store` write, which is enough for Milestone 1.

## Browser features intentionally not used

- No WebCodecs, MediaRecorder, or Mediabunny integration in Milestone 1. The library fingerprint from the live reference suggests these are used for export and thumbnail sprite generation, but Milestone 1 does not render anything heavy.
