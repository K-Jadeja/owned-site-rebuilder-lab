# Proof Quality

Reference for distinguishing *surface observation* from *feature proof*.

The owned-site-rebuilder skill must never claim feature parity on
surface evidence alone. Every claim is graded on a 9-level scale.

## Levels (strongest → weakest)

### `hard_proof`

Concrete before/after evidence plus a passing assertion that checks
a **feature-specific outcome**.

Examples:

- Export dialog opens and contains `720p`, `1080p`, `4K`,
  `Start Export`, and `Rendered in your browser`.
- Pressing Space adds the key `advanced-timeline-store` to
  `localStorage`.
- Single-file upload of `sample.mp4` increases the media library item
  count visible in the DOM.
- A localStorage key created before `page.reload()` survives it.

### `behavior_observed`

Before/after evidence exists, but the assertion is incomplete.

Examples:

- Pressing Space did not throw a page error.
- Clicking Export opens a dialog (no content check).
- Drag gestures are accepted by the page.

### `surface_observed`

The button, region, or control exists, but behavior is not proven.

Examples:

- `Reset zoom` button is in the DOM.
- `Undo last action` button is in the DOM.
- File input `<input type="file" accept="video/*">` is in the DOM.

### `code_correlated`

Runtime behavior is linked to bundle/source-map/code-coverage evidence.

Examples:

- Pressing Space executes bundle range X which contains the literal
  `advanced-timeline-store.setState`.
- Clicking Export executes bundle range Y which contains the literal
  `Rendered in your browser`.

### `inferred_from_bundle`

Code strings or modules suggest behavior, but runtime proof is missing.

Examples:

- Bundle contains `WaveSurfer.create()` but no waveform was
  rendered at runtime.
- Bundle mentions `keyframe` strings but no keyframe was observed.

### `inferred_from_architecture`

Based on general architecture or open-source reference only.

Examples:

- The app uses Zustand (inferred from `advanced-timeline-store` key
  pattern + persist naming).
- The app uses WebCodecs (inferred from `Rendered in your browser`
  copy and export options).

### `fixture_ready`

Fixture exists, but the feature has not been executed end-to-end.

Examples:

- `sample.mp3` exists but waveform was never rendered on it.
- `sample.mp4` exists but export was never run.

### `blocked`

Cannot be tested due to auth, fixture issue, selector issue,
environment, or missing manual step.

Examples:

- Clip drag selectors not yet found.
- Trim/split shortcut hint text not visible.
- Project save requires authenticated account.

### `not_found`

Searched but not found.

Examples:

- No source maps publicly exposed.
- No `deleteDatabase` calls observed.
- No `webgpu` strings observed.

## What is NOT proof

The following test shapes are explicitly **not** `hard_proof`:

```js
expect(true).toBeTruthy();
expect(typeof x === 'boolean').toBeTruthy();
expect(Array.isArray(x)).toBeTruthy();
expect(page).not.toBeNull();
expect(fileExists(fixture)).toBeTruthy();
```

These tests are allowed, but they must be labeled `soft_probe` in
the test audit. They may be a sanity check, not a parity claim.

## Upgrading a level

A feature's proof level can be upgraded only when a *new* concrete
assertion is added. For example:

- `surface_observed` → `behavior_observed`: add a before/after
  screenshot, add a real DOM mutation check.
- `behavior_observed` → `hard_proof`: add a concrete assertion on a
  feature-specific outcome (text, storage key, IndexedDB observation,
  network request, JS-coverage range).
- `hard_proof` → `code_correlated`: add a coverage map showing the
  feature-specific bundle range executed during the assertion.

## Audit output

The audit script produces `.rebuild/reports/test-proof-audit.md`
listing every test in the repo with:

- test name
- file path
- proof level
- reason
- what it proves
- what it does not prove

That file is the source of truth for any parity claim.