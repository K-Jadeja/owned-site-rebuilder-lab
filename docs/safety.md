# Safety

This project exists to study the user's own app. It is not a tool for
cloning competitors, stealing code, or bypassing controls.

## Allowed

- Public, unauthenticated browsing of the target as a normal user.
- Screenshots, DOM, computed styles.
- Public JS/CSS, public assets, public workers, public WASM.
- `localStorage` / `sessionStorage` keys and redacted values.
- IndexedDB **database + object store names** (no record dumps).
- Open-source repositories as licensed architecture references.

## Not allowed

- Bypassing authentication (no login forms unless the user logs in
  themselves in their own browser).
- Extracting secrets, tokens, cookies, API keys, credentials.
- Attacking infrastructure.
- Scraping private user data.
- Vulnerability exploitation.
- Claiming hidden backend source code was recovered.
- Copying third-party proprietary code from sites the user does not own.
- Faking results.

## Data handling

The capture scripts always:

- Strip `authorization`, `cookie`, `set-cookie`, `x-api-key`,
  `x-auth-token`, `x-csrf-token`, `proxy-authorization` from headers.
- Redact query-string keys that look like `token`, `key`, `sig`,
  `signature`, `apikey`, `api_key`, `auth`.
- Truncate response bodies to ≤ 2 KB.
- Never store binary media contents (video, audio, image files) — only
  their URLs and content-types.
- Never store cookies; the harness uses ephemeral browser contexts.

## When to stop

If the target requires login that you don't have, write a blocker in
`.rebuild/reports/gaps.md` and continue with whatever public surface is
visible. Don't fake coverage.

## Authorization

Before running this harness against any target, confirm:

1. You own the target, OR
2. You have explicit written authorization to analyze it.

If neither is true, do not run the harness. The scripts themselves do not
enforce this; the operator (you) does.