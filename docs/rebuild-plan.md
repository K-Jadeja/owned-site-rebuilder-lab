# Rebuild Plan

Once capture, probe, bundle, and storage analysis are complete, follow
this order to rebuild the app independently. No source is copied from the
target.

## Stage 0 — review the spec

Read:

- `.rebuild/spec/visual-spec.md`
- `.rebuild/spec/interaction-spec.md`
- `.rebuild/spec/component-map.md`
- `.rebuild/features/state-model.md`
- `.rebuild/features/event-map.md`
- `.rebuild/features/bundle-analysis.md`
- `.rebuild/features/storage-model.md`

## Stage 1 — scaffold a new app

```bash
npm create vite@latest rebuilt-app -- --template react-ts
cd rebuilt-app
npm i zustand
```

Pick a router only if needed (most editors are single-page).

## Stage 2 — design tokens

Translate `.rebuild/spec/visual-spec.md` into CSS variables. Do not paste
any value verbatim if it came from a private design system; only use
values that were publicly delivered to the browser (CSS variables,
computed colors of regions).

## Stage 3 — UI shell

Build:

- `AppShell`
- `TopBar`
- `MediaLibrary`
- `Preview`
- `Timeline`
- `Inspector`
- `ExportDialog`

Each component gets a Playwright smoke test.

## Stage 4 — state model

Implement the schema from `.rebuild/features/state-model.md` using
Zustand. Include undo/redo.

## Stage 5 — timeline engine

Tracks, clips, playhead, zoom, scroll, selection, trim, split, snap.
This is the most work.

## Stage 6 — media asset system

File picker, drag-drop, URL. Decode metadata; render thumbnails.

## Stage 7 — preview

`<video>` + canvas overlay + Web Audio. Optional WebCodecs.

## Stage 8 — export

Web Worker + MediaRecorder or ffmpeg.wasm.

## Stage 9 — persistence

localStorage for prefs, IndexedDB for project state, autosave.

## Stage 10 — keyboard shortcuts

Declarative map. SettingsDialog lists them.

## Stage 11 — visual regression

Run `npm run test:visual` against the rebuilt app. Save screenshots to
`.rebuild/tests/visual/rebuilt/`.

Run `npm run visual-compare` to diff against `.rebuild/reference/screenshots/`.

## Stage 12 — feature parity tests

Extend `tests/feature-parity-plan.spec.mjs` so it runs against both the
target and the rebuilt app. Each spec asserts a behavior that is
verifiable on **both**.

## Definition of done (rebuild)

A rebuilt feature is "done" when:

- It matches the spec.
- Its Playwright test passes against the rebuilt app.
- Its manual checklist passes.
- A screenshot diff shows no major regressions.
- The state model field exists in the rebuilt store.
- Storage writes match the documented schema (or are explicitly different
  and the difference is documented).