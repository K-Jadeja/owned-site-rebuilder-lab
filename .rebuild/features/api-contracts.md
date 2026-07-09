# API Contracts (runtime-derived)

Generated: 2026-07-09T09:30:00Z (deep bundle + runtime decoupling pass)

This file is populated from runtime instrumentation logs (`.rebuild/runtime/`)
plus the network logs from previous capture runs. Sensitive headers and
tokens are redacted at capture time.

## Request categories

The runtime instrumentation captured `fetch`, XHR, history, IndexedDB,
storage, and event calls during the safe-action sweep:

| Category | Count (deep run) | Examples |
| --- | --- | --- |
| document | 1 | `GET /` |
| static-js | 11 | `_next/static/chunks/*.js` |
| static-css | 2 | `_next/static/css/*.css` |
| font | 2 | `_next/static/media/*.woff2` |
| image | several | Pexels thumbnails, sprite thumbs |
| media | several | Pexels MP4s, Supabase MP3 |
| storage | 22 mutations | `advanced-timeline-store`, `lastCleanup_thumbnailCache` |
| API | 0 (deep) | none observed during public demo flows |
| analytics | 0 | none observed |
| unknown | 0 | n/a |

## Non-static requests observed

The deep runtime pass patched `fetch` and `XMLHttpRequest`. During the
probed public demo flows:

- No non-static backend API contract was observed.
- No authentication requests were triggered.
- No analytics pings were observed.
- IndexedDB `open` calls were not captured during the safe action sweep
  (the migration may have already happened by hydration time).

This does **not** prove the production app has no backend. It only
proves that the public demo URL we probed did not exercise a backend
during the actions we triggered.

## Embedded URLs found in bundles

The deep bundle analysis extracted embedded URLs from the public JS.
Notable ones:

| Origin | Type | Purpose (inferred) |
| --- | --- | --- |
| `rwxrdxvxndclnqvznxfj.supabase.co` | media | Public audio host (`sound-3.mp3`) |
| `videos.pexels.com` | media | Public stock video CDN |
| `images.pexels.com` | image | Public stock thumbnails |
| `demo.reactvideoeditor.com` | same-origin | App + chunks |

These are CDN endpoints, not application backend APIs.

## Sanitization policy

For every captured request we redact:
- `authorization`, `cookie`, `set-cookie`, `x-api-key`,
  `x-auth-token`, `x-csrf-token`, `x-amz-security-token`,
  `proxy-authorization`.
- URL query params matching `token|key|sig|signature|apikey|api_key|auth`.

## Conclusion

> During the probed public demo flows, no non-static backend API
> contract was observed. The app appears mostly client-side/static
> for these flows. This does **not** prove the production app has no
> backend.

For a full rebuild, see `.rebuild/spec/video-editor-architecture.md`
and `.rebuild/features/state-model.md`.