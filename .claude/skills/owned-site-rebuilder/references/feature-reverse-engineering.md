# Feature Reverse Engineering

How to turn observed evidence into a feature record.

## The feature record template

For each candidate feature, use the structure in
`.claude/skills/owned-site-rebuilder/templates/feature-record.md`:

- **Status**: `observed` | `partially_observed` | `inferred` | `blocked` | `not_found`
- **Evidence**: pointers to screenshots, DOM files, network entries, storage
  files, console logs, bundle clues. Always cite paths.
- **User flow**: ordered steps a real user would take.
- **Before state / Action / After state**: the transition.
- **Observable UI behavior**: what changed on screen.
- **Observable data/state behavior**: what changed in storage, URL, network.
- **Network behavior**: which requests fire, with what shapes.
- **Storage behavior**: what keys are written, what shape.
- **Inferred implementation model**: a plausible independent design.
- **Acceptance criteria**: a testable list.
- **Suggested automated parity test**: file path + Playwright skeleton.
- **Known gaps / uncertainty**: what we still don't know.

## Status semantics

- `observed` — direct evidence in capture artifacts.
- `partially_observed` — some evidence; some is inferred from context.
- `inferred` — no direct evidence; reasonable from architecture.
- `blocked` — cannot observe due to auth, anti-bot, or environment.
- `not_found` — explicitly searched, no surface present.

## How to gather evidence

1. **Visual** — screenshot before, click, screenshot after. Diff in head.
2. **DOM** — `page.locator('...').describe()` snapshots before/after. Use
   `page.accessibility.snapshot()` for the role tree.
3. **Network** — log all requests with method, path, status, resource type.
   Correlate by tab/url change.
4. **Storage** — read localStorage, sessionStorage, IndexedDB names before
   and after the interaction.
5. **Console** — capture errors and warnings; sometimes reveals lifecycle
   hooks (e.g., `Editor mounted`).
6. **Bundle clues** — visible `__NEXT_DATA__`, `__remixContext__`,
   `window.__APP_STATE__`, `chunk-*.js` names.

## How to write acceptance criteria

Each criterion must be **observable** and **testable**:

- ✅ "Clicking 'Add Text' inserts a text overlay on track V1 at the playhead."
- ❌ "The text overlay system works." (too vague)

Tie criteria to evidence pointers whenever possible.

## Parity test scaffolding

Each feature gets at least one of:

- Playwright `test(...)` block in `tests/feature-parity-plan.spec.mjs`.
- Manual verification checklist in
  `.rebuild/features/acceptance-tests.md`.

If a feature needs fixture media (sample video, sample audio), document the
fixture requirement in `acceptance-tests.md` and skip the auto-test with a
clear `test.skip` and message.