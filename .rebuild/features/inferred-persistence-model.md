# Inferred Persistence Model

Generated: 2026-07-09T09:28:26.103Z

## Stores
### `idb_migration_v1_done`

- bytes: 13
- json parseable: true
- pattern: scalar (timestamp / flag / token-shape)

### `advanced-timeline-store`

- bytes: 48
- json parseable: true
- pattern: **Zustand persist** (has `state` + `version` keys)

## Migration signals
- `idb_migration_v1_done` (13 bytes) is a likely migration marker set once on first hydration.

## Hypothesis
The app likely uses:
- **Zustand with persist middleware** for runtime editor state (advanced-timeline-store).
- **IndexedDB** for thumbnail sprite caches (idb_migration_v1_done + lastCleanup_thumbnailCache).
- **localStorage** only for app-owned keys, not user content (the demo appears read-only).

## What we explicitly did not recover
- Auth tokens / session cookies (none observed).
- Raw project JSON files (none observed).
- Custom user data (none observed; the demo is read-only).