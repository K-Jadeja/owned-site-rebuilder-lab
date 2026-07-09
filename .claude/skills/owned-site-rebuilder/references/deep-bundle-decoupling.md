# Deep Bundle Decoupling

Reference for the **Deep Bundle + Runtime Decoupling Mode** of the
owned-site-rebuilder skill.

## Why this exists

Surface capture (DOM, network headers, screenshot names) only proves
what the user *sees*. To prove what the app *does*, you must connect:

1. The JS/CSS bytes the browser downloaded.
2. The strings, identifiers, and module IDs inside those bytes.
3. The runtime events triggered by user actions.
4. The state stores that get mutated.
5. The DOM regions those mutations affect.

This document describes how to do that without bypassing auth,
extracting secrets, or claiming private source recovery.

## The decoupling chain

```
public bundles (fetch)
    → beautify / tokenize
        → keyword + identifier index
            → feature → chunk map
                → runtime action coverage
                    → state-store decode
                        → feature proof level
```

Each step produces evidence. Each step feeds the next.

## Raw bundle policy

| Location        | Purpose                                | Git-tracked |
| --------------- | -------------------------------------- | ----------- |
| `.rebuild/private/bundles/` | Local-only scratch for raw bodies | NO |
| `.rebuild/target-source/bundles/`     | Audited bundles eligible to commit | YES (after scan) |
| `.rebuild/target-source/source-maps/` | Audited source maps eligible to commit | YES (after scan) |
| `.rebuild/target-source/manifests/`   | SHA-256 + URL manifest              | YES |
| `.rebuild/target-source/reports/`     | Secrets + license + commit eligibility | YES |
| `.rebuild/private/secrets-check/`     | Local-only secret finding scratch | NO |

A bundle only graduates from `private/` to `target-source/` after:

1. SHA-256 fingerprint is recorded.
2. A secrets scan finds no high-severity matches.
3. A license/provenance pass identifies major third-party libraries.
4. A commit-eligibility report marks the file as safe.

## Forbidden patterns in the secrets scan

The scanner must reject these (file, offset, pattern class only —
never the matched string itself):

- `authorization:`
- `bearer `
- `access_token=`
- `refresh_token=`
- `api_key=`, `apikey=`, `x-api-key`
- `secret`, `password`
- `private_key`
- `service_role` (Supabase)
- JWT-looking strings (`eyJ...` over 100 chars)
- AWS keys (`AKIA[0-9A-Z]{16}`)
- Stripe keys (`sk_live_`, `pk_live_`)
- OpenAI keys (`sk-...`)
- Anthropic keys (`sk-ant-...`)
- database URLs (`postgres://`, `postgresql://`)
- session cookies (`session=`, `sid=`)

## Feature-keyword vocabulary

For video editors we search bundles for at minimum:

```
timeline, track, tracks, clip, clips, item, items, split, trim,
cut, crop, transition, effect, effects, animation, keyframe,
keyframes, export, render, renderer, download, canvas, video,
audio, waveform, thumbnail, sprite, ffmpeg, webcodecs, mediabunny,
mediarecorder, webgpu, worker, indexeddb, idb, localstorage,
zustand, persist, history, undo, redo, drag, drop, resize, zoom,
playhead, scrub, duration, durationMs, startTime, endTime, asset,
assets, project, sequence, supabase, api, upload, download,
pexels, thumbnailCache, advanced-timeline-store,
useProjectStateFromUrl, ThumbnailCache
```

For library detection we search for:

```
React, Next.js, Radix UI, Tailwind, Zustand, Immer, TanStack,
Supabase, Pexels, WebCodecs, MediaRecorder, Mediabunny, ffmpeg,
Remotion, Framer Motion, DND kit, React DnD, Konva, Fabric,
Three, Pixi, Wavesurfer, Lucide, Sonner, Shadcn
```

## What counts as `code_correlated`

A feature is `code_correlated` only when:

1. A runtime action is observed (e.g., pressing Space).
2. JS coverage during that action shows execution of specific bundle
   ranges.
3. Those bundle ranges contain identifiers or strings that match the
   feature (e.g., `advanced-timeline-store`, `setPlayhead`,
   `playbackState`).
4. A storage mutation or DOM mutation is observed at the same time.

Without step 4 the proof degrades to `inferred_from_bundle`.

## What does NOT count as proof

- Reading a chunk name like `app/page-...js` and guessing the route.
- Seeing `useState` and assuming Zustand.
- Seeing `localStorage.setItem` and assuming a particular key.
- Seeing `idb` and assuming IndexedDB usage.

These are all `inferred_from_bundle` at best.

## Tools you should use

- `acorn` / `acorn-walk` — JS AST parsing.
- `es-module-lexer` — fast ESM tokenization.
- `js-beautify` — reformat minified JS for human review.
- `source-map` — decode source maps if available.
- `terser` — re-minify or analyze minified code.
- `fast-glob` — file pattern matching for local artifacts.
- `playwright.startJSCoverage` / `startCSSCoverage` — runtime coverage.

## Operating rhythm

1. Fetch all bundle URLs to `private/`.
2. SHA-256 everything.
3. Run secrets + license scans.
4. Promote audited bundles to `target-source/`.
5. Beautify + parse + index each bundle.
6. Build the feature → chunk map.
7. Run action coverage to find executed ranges per action.
8. Cross-reference: keyword hits ∩ executed ranges = `code_correlated`.
9. Decode state stores.
10. Write `feature-code-clues.json` and
    `feature-parity.md` with proof levels.