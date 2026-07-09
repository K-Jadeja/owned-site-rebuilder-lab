# Safety

This skill is for **owned or authorized targets only**.

## Allowed

- Public, unauthenticated browsing of the target app as a normal user would.
- Capturing screenshots, DOM, computed styles, public JS/CSS, public assets,
  web workers, WASM files delivered publicly.
- Inspecting `localStorage`, `sessionStorage`, and IndexedDB **names** and
  redacted shapes.
- Reading public source maps if and only if the server delivers them as a
  normal browser response.
- Reading open-source repositories (e.g., FreeCut) as licensed architecture
  references.

## NOT allowed

- Bypassing authentication of any kind.
- Credential stuffing, password guessing, OAuth flow abuse.
- Extracting secrets, tokens, cookies, API keys, credentials, or private
  session values.
- Attacking infrastructure (DDoS, fuzzing, injection, source-map
  exfiltration).
- Scraping private user data.
- Attempting vulnerability exploitation.
- Claiming hidden backend source code was recovered.
- Copying third-party proprietary code from any site the user does not own.
- Faking results — if capture is partial, mark it partial.

## Data handling rules

- Strip `authorization`, `cookie`, `set-cookie`, `x-api-key` from every
  captured header.
- Strip query-string tokens that look like `token=`, `key=`, `sig=`.
- Truncate response bodies over ~2 KB.
- Do not store binary media contents (video, audio, image files) — only
  record their URLs and content-types.
- Do not save cookies set by the target; use ephemeral browser contexts.
- Hash or omit any value that looks like a UUID combined with private
  identifiers.

## When in doubt

If a request seems to require authentication, **stop** and write a clear
blocker in `.rebuild/reports/gaps.md`. Continue with public surfaces only.