# Appendix — Runtime Instrumentation

This appendix expands on the runtime instrumentation + action coverage
stages.

## Inputs

- `demo.reactvideoeditor.com` (user-owned target).
- `.rebuild/runtime/` — runtime artifacts.

## Scripts

- `scripts/runtime-instrumentation.mjs` — patches fetch / XHR /
  localStorage / sessionStorage / history / IndexedDB / DOM events.
- `scripts/action-coverage-map.mjs` — Playwright JS + CSS coverage.
- `scripts/react-component-probe.mjs` — React fiber extraction.

## What is patched

`page.addInitScript()` installs every patch before any app code
executes:

- `window.fetch`
- `XMLHttpRequest.prototype.open / send`
- `localStorage.setItem / removeItem / clear`
- `sessionStorage.setItem / removeItem / clear`
- `history.pushState / replaceState`
- `indexedDB.open / deleteDatabase`
- DOM `MutationObserver` for body subtree
- `click / pointerdown / pointerup / keydown / dragstart / dragover /
  drop / input / change` events (capture phase)
- `console.*`, `window.onerror`, `unhandledrejection`

## Stack-trace capture (this pass)

`scripts/action-stack-trace-probe.mjs` adds deeper wraps:

- `EventTarget.prototype.addEventListener` — wraps every listener so
  on invocation, the target descriptor + URL + `new Error().stack`
  are recorded before calling the original listener.
- `Storage.prototype.setItem / removeItem` — records the key, value
  preview, URL, and stack.
- `history.pushState / replaceState` — records the URL and stack.
- `URL.createObjectURL` — records the blob type, size, constructor,
  and stack.
- `HTMLMediaElement.play / pause` — records the currentSrc,
  currentTime, duration, paused, and stack.
- `CanvasRenderingContext2D.prototype.drawImage` — records the
  canvas dimensions and stack.
- `HTMLCanvasElement.prototype.toBlob` — records the canvas dimensions
  and stack.
- `console.log / warn / error / info` — wraps each so the original
  behavior is preserved, and a stack frame is captured.

## Stack-frame → bundle mapping

`scripts/map-stack-frames-to-bundles.mjs` reads each captured stack
frame, parses the URL, resolves it to a local bundle filename under
`.rebuild/target-source/bundles/`, extracts a snippet around the
line:col, and lists nearby feature keywords.

In this run, 150 frames mapped successfully across 14 actions. The
most strongly correlated bundle is `180476bc-91ccc8fcb48478c4.js`,
which contains every `advanced-timeline-store` setter, every
`lastCleanup_thumbnailCache` setter, every `URL.createObjectURL` for
the ThumbnailCache sprite flow, and the `classifyFileType` /
`urlCache.set` calls for single-file upload.

## Actions driven

| Action | Trigger |
| --- | --- |
| boot | `page.goto(TARGET)` + 1.5 s wait |
| dark-toggle | `getByRole('button', { name: /^dark$/i }).click()` |
| export-dialog | `getByRole('button', { name: /export/i }).click()` + Escape |
| playback-space | `page.keyboard.press('Space')` twice |
| undo-redo | `Control+Z` then `Control+Shift+Z` |
| zoom-in | `getByRole('button', { name: /zoom in/i }).click()` |
| zoom-out | `getByRole('button', { name: /zoom out/i }).click()` |
| zoom-reset | `getByRole('button', { name: /reset/i }).click()` |
| my-library | `[role="tab"]` text matches /my library/i |
| single-import | `setInputFiles(sample.mp4)` on first `input[type="file"]` |

## Counts (this run)

- 10 actions × before/after snapshots.
- 22 storage mutations observed.
- 0 fetch entries captured during this run (the public demo serves
  static assets only; see `.rebuild/features/api-contracts.md`).
- React fiber keys present; 12 component names tally.

## Notable decoded values

`advanced-timeline-store`:

```json
{
  "state": { "trackDensity": "default" },
  "version": 0
}
```

This is the canonical Zustand `persist` middleware shape.

`idb_migration_v1_done`:

```
1783589301227
```

A numeric timestamp set once after the IndexedDB migration runs.

## Coverage summary

For each action, the JS + CSS coverage produced a top-bundle table
that lists which bundles executed during the action. See
`.rebuild/runtime/coverage/action-coverage-summary.md` for the
full per-action table.

The coverage map is **byte-level**, not statement-level. A high
"used bytes" count does not imply full branch coverage; it just
shows that the bundle was touched during the action.

## React component tree

The probe found 918 elements with `__reactFiber$...` keys. The
top component names tally:

- `div`, `path`, `svg`, `line`, `button`, `circle`, `span` — DOM
  primitive tags.
- `TooltipProvider`, `Presence`, `MenuProvider`, `Popper`,
  `PopperProvider`, `TooltipProviderProvider`, `Tooltip`, `xo`,
  `Menu`, `MenuPortal`, `MenuPortalProvider`, `DropdownMenu`,
  `DropdownMenuProvider`, `TooltipPortal`, `TooltipPortalProvider`
  — Radix UI primitives.
- `fz`, `f3`, `f9`, `f6`, `f7` — likely minified production
  component names.

The presence of Radix UI primitives confirms the inferred Radix
library detection from the bundle string index.