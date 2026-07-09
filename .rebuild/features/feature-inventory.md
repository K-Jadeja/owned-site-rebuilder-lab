# Feature Inventory

Generated: 2026-07-09T07:13:10.631Z
Target: https://demo.reactvideoeditor.com

This file is the master list of feature records. Each record follows the template at `.claude/skills/owned-site-rebuilder/templates/feature-record.md`.

Initial population from first probe. Update statuses as evidence accumulates.

## F001: App shell loads

- **Category**: app-shell
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "App shell loads".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "App shell loads".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F001 App shell loads
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F002: Topbar / toolbar

- **Category**: app-shell
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Topbar / toolbar".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Topbar / toolbar".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F002 Topbar / toolbar
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F003: Media library region

- **Category**: assets
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Media library region".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Media library region".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F003 Media library region
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F004: Preview / player region

- **Category**: preview
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Preview / player region".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Preview / player region".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F004 Preview / player region
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F005: Timeline region

- **Category**: timeline
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Timeline region".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Timeline region".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F005 Timeline region
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F006: Inspector region

- **Category**: inspector
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Inspector region".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Inspector region".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F006 Inspector region
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F007: Asset import / add media

- **Category**: assets
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Asset import / add media".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Asset import / add media".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F007 Asset import / add media
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F008: Export flow

- **Category**: export
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Export flow".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Export flow".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F008 Export flow
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F009: Undo / redo

- **Category**: shortcuts
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Undo / redo".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Undo / redo".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F009 Undo / redo
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.

## F010: Persistence / storage

- **Category**: persistence
- **Status**: partially_observed
- **Confidence**: medium

### Evidence
- screenshots:
  - `.rebuild/reference/screenshots/desktop/viewport.png`
  - `.rebuild/reference/screenshots/laptop/viewport.png`
  - `.rebuild/reference/screenshots/mobile/viewport.png`
- dom: `.rebuild/reference/dom/desktop/summary.json`
- network: `.rebuild/reference/network/requests.json`
- storage: `.rebuild/reference/storage/after-interaction.json`
- console: `.rebuild/reference/console/messages.json`
- bundle clues: `.rebuild/features/bundle-analysis.md`

### User flow
1. Open https://demo.reactvideoeditor.com.
2. Observe the region(s) relevant to "Persistence / storage".
3. If interactive, perform a non-destructive action.

### Before state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: https://demo.reactvideoeditor.com
- Storage: empty or initial app state.

### Action
- (probe-driven; see event-map)

### After state
- DOM: see `.rebuild/reference/dom/desktop/summary.json`
- URL: same or modal URL.
- Storage: `.rebuild/reference/storage/after-interaction.json`

### Acceptance criteria
- [ ] Region is present in the DOM with role/aria consistent with "Persistence / storage".
- [ ] (If interactive) Clicking opens a non-destructive dialog or toggles state.
- [ ] Persistence behavior is documented if the app uses storage.

### Suggested automated parity test
- file: `tests/feature-parity-plan.spec.mjs`
- describe: parity / F010 Persistence / storage
- type: playwright

### Known gaps / uncertainty
- Visual confirmation required after interactive probe.
