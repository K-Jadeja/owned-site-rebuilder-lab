# .rebuild/target-source/

This directory holds **audited** artifacts captured from the user-owned
target (`demo.reactvideoeditor.com`) that are eligible to be
committed to the public repo.

## Promotion rule

A raw public bundle graduates from `.rebuild/private/bundles/` to
here only when:

1. The bundle URL is on the user-owned origin (or otherwise public
   without auth).
2. SHA-256 is recorded in
   `manifests/public-bundle-manifest.json`.
3. The secrets scanner reports zero high-severity findings.
4. The license/provenance report identifies major third-party
   libraries.
5. `reports/commit-eligibility.md` marks the file as `eligible`.

## Layout

- `bundles/`     — audited JS bundles.
- `source-maps/` — audited `.map` files (if any).
- `manifests/`   — SHA-256 + URL manifest, public bundle fetch report.
- `reports/`     — secrets scan, license/provenance, commit eligibility.

## What must NEVER land here

- Cookies, localStorage values from production users.
- Authorization headers, tokens, API keys.
- Source maps if upstream has not released them.
- Third-party proprietary code under non-permissive licenses.