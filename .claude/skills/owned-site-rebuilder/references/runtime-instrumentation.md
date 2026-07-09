# Runtime Instrumentation

Reference for the **runtime instrumentation** step of the deep
bundle + runtime decoupling pass.

## Goal

Capture what the app actually does at runtime, without bypassing auth
or extracting secrets. We patch browser APIs the app uses, record
their behavior, and write evidence to `.rebuild/runtime/`.

## Patches installed before app code runs

`page.addInitScript()` must install every patch before any app code
executes. The standard patch list:

| API                          | What we capture                          |
| ---------------------------- | ---------------------------------------- |
| `window.fetch`               | URL (sanitized), method, body redacted, response status |
| `XMLHttpRequest.open/send`   | Same as fetch                            |
| `localStorage.setItem/removeItem/clear` | key + truncated value + timestamp |
| `sessionStorage.setItem/removeItem/clear` | same as localStorage          |
| `history.pushState/replaceState` | URL + state serializable summary  |
| `indexedDB.open/deleteDatabase` | name + version + object stores    |
| `console.*`                  | level + message (sanitized)              |
| `window.onerror / unhandledrejection` | message + stack (sanitized)     |
| `click` (capture)            | element selector + text                 |
| `pointerdown/up` (capture)   | selector + text                         |
| `keydown` (capture)          | key + modifier + active element         |
| `dragstart/dragover/drop`    | selector + dataTransfer type list       |
| `input`/`change`             | selector + value (truncated)            |

## Sanitization rules

- Strip `authorization`, `cookie`, `set-cookie`, `x-api-key`,
  `x-auth-token`, `x-csrf-token`, `x-amz-security-token`,
  `proxy-authorization` from any logged request headers.
- Redact URL query params matching `token|key|sig|signature|apikey|api_key|auth`.
- Truncate body strings to 2 KB.
- Truncate `localStorage` values to 400 chars.
- Truncate IndexedDB record reads to 0 (only names and object-store
  metadata).

## Action triggers

The instrumentation script drives the app through a fixed set of
non-destructive actions and records the resulting state:

| Action            | How we trigger it                          |
| ----------------- | ------------------------------------------ |
| App boot          | `page.goto(TARGET)`                       |
| Click Dark        | `getByRole('button', { name: /^dark$/i })` |
| Click Export Video | `getByRole('button', { name: /export/i })` then Escape |
| Press Space       | `page.keyboard.press('Space')`             |
| Ctrl+Z / Ctrl+Shift+Z | `page.keyboard.press(...)`              |
| Zoom in/out/reset | `getByRole('button', { name: /zoom/i })`   |
| My Library tab    | `[role="tab"][text=My Library]`            |

Each action records:

- before/after URL
- before/after localStorage keys
- before/after sessionStorage keys
- before/after DOM mutation count
- before/after network request count
- before/after screenshot path
- before/after `interactiveCount`
- before/after `bodyText` hash

## Action coverage (corollary)

Beyond instrumentation, the script also runs Playwright JS/CSS
coverage. For each action:

1. `await page.coverage.startJSCoverage()` and
   `await page.coverage.startCSSCoverage()`.
2. Perform the action.
3. Stop coverage.
4. For each entry, attach covered ranges to its source URL.
5. Match covered entries to feature keywords (see
   `deep-bundle-decoupling.md`).

The output is `action-to-bundle-map.json` plus
`action-coverage-summary.md`.

## DOM mutation tracking

We use a small `MutationObserver` on `document.body` that counts
mutations and snapshots a 200-char subtree hash. We do **not** record
the full DOM; we record deltas.

## What we record vs what we discard

- ✅ Record: API name, sanitized URL, key/value count, selector, text.
- ❌ Discard: request bodies > 2 KB, raw response bodies,
  `localStorage` values > 400 chars, IndexedDB record contents.

## Output files

```
.rebuild/runtime/
  fetch-log.json
  xhr-log.json
  storage-mutations.json
  indexeddb-observations.json
  history-log.json
  dom-mutations.json
  event-trace.json
  console-runtime.json
  runtime-actions.json
  runtime-summary.md
  coverage/
    boot.json
    dark-toggle.json
    export-dialog.json
    playback-space.json
    undo-redo.json
    zoom-in.json
    zoom-out.json
    zoom-reset.json
    my-library.json
    single-import.json
    action-coverage-summary.md
    action-to-bundle-map.json
```

## Safety constraints

- The instrumentation runs against `demo.reactvideoeditor.com` only,
  the user-owned target.
- It does not bypass authentication (no credentials are configured).
- It does not exfiltrate cookies or tokens.
- It does not attack any non-target endpoint.
- It does not write raw media to disk.