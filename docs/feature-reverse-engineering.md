# Feature Reverse Engineering

How this harness turns evidence into a feature record.

## The pipeline

```
Browser capture (DOM, screenshots, network, storage, bundles, console)
   ↓
DOM / event / network / storage correlation across clicks
   ↓
Feature candidates with status: observed | partially_observed | inferred | blocked | not_found
   ↓
Spec per feature (state model, network behavior, storage behavior, acceptance criteria)
   ↓
Playwright test scaffold (or manual checklist)
   ↓
Acceptance criterion: visible, testable, evidence-backed
```

## Feature record template

See `.claude/skills/owned-site-rebuilder/templates/feature-record.md`.

Each record has:

- Status (`observed` | `partially_observed` | `inferred` | `blocked` | `not_found`)
- Confidence (`high` | `medium` | `low`)
- Evidence pointers to screenshots, DOM, network, storage, console, bundle files
- User flow (numbered steps)
- Before state / Action / After state
- Observable UI behavior
- Observable data/state behavior
- Network behavior
- Storage behavior
- Inferred implementation model
- Acceptance criteria (observable + testable)
- Suggested automated parity test
- Known gaps / uncertainty

## Status semantics

- **`observed`** — direct evidence in capture artifacts. High confidence.
- **`partially_observed`** — some direct evidence, some inferred.
- **`inferred`** — no direct evidence; reasonable from architecture. Must
  be explicitly justified.
- **`blocked`** — cannot observe due to auth, anti-bot, environment.
- **`not_found`** — explicitly searched, no surface present.

## What is not feature evidence

- **Screenshots alone** do not prove behavior. They are evidence of layout
  and color, not state transitions.
- **Source code reading** is not feature reverse engineering — that's
  reading source.
- **Visual similarity** to a rebuild does not prove parity. Behavior parity
  does.

## Video editor categories

See `.claude/skills/owned-site-rebuilder/references/video-editor-features.md`
for the full list. The minimum surface area:

- Project (load/save, metadata)
- Assets (import, library)
- Timeline (tracks, clips, trim, split, move, snap, zoom)
- Preview (play, pause, scrub)
- Inspector (properties, keyframes, effects)
- Text overlays
- Transitions
- Effects
- Audio waveform
- Export (preset, progress, download)
- Shortcuts
- Undo/redo
- Persistence
- Errors, empty states, unsupported media