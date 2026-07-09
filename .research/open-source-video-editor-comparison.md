# Open-Source Video Editor Comparison

This is a high-level comparison of open-source browser video editors that
could serve as **architectural references** for an independent rebuild.

> **Not yet inspected in detail.** Where a project has not been read,
> the row is marked "(not yet inspected)".

## Projects

| Project | Stack | Runs in browser? | License | Notes |
| --- | --- | --- | --- | --- |
| [FreeCut](https://github.com/walterlow/freecut) | React 19 + TS + Vite + Zustand + WebCodecs + WebGPU | Yes (primary) | MIT | Most directly relevant; we have a shallow clone at `.research/freecut/`. |
| [LosslessCut](https://github.com/mifi/lossless-cut) | Electron + FFmpeg | No (desktop) | MIT | Great reference for trim/split semantics and FFmpeg integration; not a browser app. |
| [Remotion](https://github.com/remotion-dev/remotion) | React + Puppeteer/headless Chrome | Yes (rendering via headless Chrome) | Commercial (free for individuals / small teams) | Programmatic video in React. Their frame conventions (`from` + `durationInFrames`) influenced FreeCut. |
| [Shotcut](https://github.com/mltframework/shotcut) | C++/Qt + FFmpeg | No (desktop) | GPL | Mature NLE; reference only. |
| [Kdenlive](https://invent.kde.org/multimedia/kdenlive) | C++/Qt + FFmpeg + MLT | No (desktop) | GPL | Mature NLE; reference only. |
| [OpenShot](https://github.com/OpenShot/openshot-qt) | Python + Qt + FFmpeg | No (desktop) | GPL | Cross-platform NLE; reference only. |

## FreeCut vs others (high-level)

| Dimension | FreeCut | LosslessCut | Remotion |
| --- | --- | --- | --- |
| Runs in browser | ✅ | ❌ (Electron) | ⚠️ (render via headless Chrome) |
| Frame-accurate timeline | ✅ (Remotion conventions) | ⚠️ (keyframe-based) | ✅ |
| WebCodecs export | ✅ | ❌ (FFmpeg) | ⚠️ (Chromium media APIs) |
| WebGPU effects | ✅ | ❌ | ❌ |
| Local-first storage | ✅ (workspace folder) | ✅ (files) | ⚠️ (assets in project) |
| Multi-track | ✅ | ⚠️ (limited) | ✅ (programmatic) |
| Undo/redo | ✅ (Zundo) | ✅ | ⚠️ (programmatic) |
| Free + open | ✅ MIT | ✅ MIT | ⚠️ Commercial |

## What to learn from each

- **FreeCut**: domain-store facade, action wrapper, frame-based timeline
  conventions, worker-based export, GPU effects pipeline, workspace
  folder persistence.
- **LosslessCut**: trim/split semantics, FFmpeg filter graph usage,
  per-clip metadata handling.
- **Remotion**: `from` + `durationInFrames` conventions, programmatic
  timeline composition, frame-based interpolation.
- **Shotcut / Kdenlive / OpenShot**: NLE feature scope (markers,
  ripple/rolling/slip/slide, audio mixing, scopes), keyboard-first UX.

## What NOT to copy

- Branding, names, and copy from any project.
- License-violating code (e.g., GPL snippets can't be lifted into a
  closed-source derivative).
- Patent-encumbered algorithms (rare; be aware).

## Recommended reading order for the rebuild

1. FreeCut `src/types/timeline.ts` (item model)
2. FreeCut `src/features/timeline/stores/actions/shared.ts` (`execute()`)
3. FreeCut `src/features/export/workers/export-render.worker.ts`
4. FreeCut `src/infrastructure/storage/workspace-fs/`
5. Remotion docs on frame conventions
6. LosslessCut trim/split UX (in their README and recordings)

## License obligations summary

| Project | License | Required actions for a rebuild |
| --- | --- | --- |
| FreeCut | MIT | Include MIT notice + copyright in any file that contains FreeCut-derived snippets. |
| LosslessCut | MIT | Same as above. |
| Remotion | Commercial | Read license; non-trivial for commercial use. Use only conventions, not code. |
| Shotcut / Kdenlive / OpenShot | GPL | Reference only; do not lift code into a closed rebuild. |

## Caveats

- "(not yet inspected)" rows above are placeholders. The harness marks
  them honestly rather than pretending to know their internals.
- A rebuild should pick **one** primary reference architecture (FreeCut
  fits the browser-editor target best) and use others for concept
  inspiration only.