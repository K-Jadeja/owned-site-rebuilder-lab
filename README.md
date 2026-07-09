# owned-site-rebuilder-lab

A local research harness for reconstructing **observable product behavior** of
an owned or authorized browser-deployed video editor
([demo.reactvideoeditor.com](https://demo.reactvideoeditor.com)) and producing
a spec, state model, acceptance tests, and rebuild plan.

> **This is not a website copier.** It does not bypass authentication, extract
> secrets, attack infrastructure, scrape private user data, or recover hidden
> backend source code. It is a research workflow for the user's own app.

## What this proves

The claim this harness supports is:

> Claude Code can reconstruct an owned/authorized deployed app's **observable
> behavior and implementation architecture** from browser-delivered evidence
> (DOM, network, storage, public bundles), and then independently
> reimplement it with verification by automated tests.

It does **not** support the claim:

> Claude Code can recover exact hidden backend source code.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. (optional) install chromium for Playwright
npx playwright install chromium

# 3. Run capture (multi-viewport screenshots + DOM + network + storage)
npm run capture

# 4. Run interactive probing
npm run probe

# 5. Analyze bundles
npm run bundles

# 6. Inspect storage
npm run storage

# 7. Generate reports + handoff
npm run reports

# 8. Run all tests
npm test
```

## Deep Bundle + Runtime Decoupling Mode

For proof that goes beyond surface observation, this repo also supports
a deep-decoupling pass:

```bash
# Fetch public JS/CSS bundles that the browser already downloaded.
npm run fetch:bundles

# Run the deep bundle analysis (acorn + es-module-lexer + js-beautify).
npm run analyze:deep-bundles

# Patch fetch/XHR/localStorage/IndexedDB/history inside the live app.
npm run instrument:runtime

# Map user actions to executed bundle ranges via Playwright JS/CSS coverage.
npm run coverage:actions

# Upload a single fixture file and observe the result.
npm run probe:single-import

# Mine candidate selectors for clips/tracks/playhead from the live DOM.
npm run mine:selectors

# Decode app-owned localStorage JSON values into typed state stores.
npm run decode:state

# Audit every test for proof level (hard_proof / soft_probe / …).
npm run audit:proof

# Run secrets + license scan and decide commit eligibility.
npm run scan:target

# Run all of the above in one shot.
npm run deep
```

The deep mode produces:

- `.rebuild/features/deep-bundle-analysis.md` — bundle-body analysis
- `.rebuild/features/bundle-symbol-index.json` — keyword + identifier index
- `.rebuild/features/feature-code-clues.json` — feature → chunk map
- `.rebuild/features/decoded-state-stores.md` — decoded state stores
- `.rebuild/runtime/runtime-summary.md` — runtime action evidence
- `.rebuild/runtime/coverage/action-coverage-summary.md` — code-correlated actions
- `.rebuild/deep-import/import-summary.md` — single-file import result
- `.rebuild/features/selector-map.md` — candidate clip/track selectors
- `.rebuild/reports/test-proof-audit.md` — every test classified by proof level
- `paper/` — open-source evidence pack

See `.claude/skills/owned-site-rebuilder/SKILL.md` for the full
operating philosophy and proof-quality ladder.

If `npx playwright install` is blocked by your network, the scripts still
create files; capture will report a Playwright launch error in
`.rebuild/reports/gaps.md` and `.harness/verification.md`.

## Project layout

```
owned-site-rebuilder-lab/
├── .claude/skills/owned-site-rebuilder/   Project-local skill + references + templates
├── .harness/                              Long-run state (handoff, progress, decisions, verification, session-log)
├── .rebuild/                              Captured evidence + specs + reports
│   ├── reference/                         Raw capture (DOM, styles, network, storage, bundles, screenshots)
│   ├── spec/                              Visual / interaction / component / implementation specs
│   ├── features/                          Feature inventory, matrix, state model, event map, etc.
│   ├── tests/                             Visual and feature test scaffolding
│   └── reports/                           Capture, parity, gaps, progress, final summary
├── .research/                             FreeCut notes + open-source comparison
├── docs/                                  Long-form documentation
├── scripts/                               Capture, probe, bundle, storage, reports, visual-compare
├── tests/                                 Playwright specs
├── README.md
├── package.json
├── playwright.config.mjs
└── .gitignore
```

## What "observable feature parity" means

A feature is **reconstructed** when all of the following hold:

1. It has a written spec.
2. It has acceptance criteria.
3. It has at least one automated test or a manual verification checklist.
4. It has an independent implementation plan.
5. Known deviations are documented.

The harness **does not** aim for pixel-perfect visual cloning. It aims for
behavior parity that is independently re-implementable.

## What can be recovered

- Public, browser-delivered UI layout, regions, components, typography,
  colors, spacing.
- Interaction surface (buttons, menus, tabs, dialogs, drag/drop targets).
- Public network shapes (sanitized).
- Public localStorage / sessionStorage / IndexedDB names and redacted shapes.
- Public JS/CSS bundle layout and framework/library clues.
- Console messages (no source-map bypass).
- Open-source architectural references (e.g., FreeCut).

## What cannot be recovered

- Hidden backend implementation.
- Private API contracts not exercised by the public client.
- Closed-source modules not delivered to the browser.
- Server-side business logic, queue, payment, or auth flows beyond what the
  public client invokes.
- Pixel-perfect visual cloning of all states (e.g., all hover animations).
- Anything behind authentication we are not authorized to bypass.

See [`docs/what-can-and-cannot-be-recovered.md`](docs/what-can-and-cannot-be-recovered.md).

## How to read the outputs

After running capture + probe + reports:

- `.rebuild/reference/screenshots/<viewport>/viewport.png` — what the app
  looks like at the captured viewports.
- `.rebuild/reference/capture-summary.json` — one JSON with everything that
  ran.
- `.rebuild/features/feature-inventory.md` — the master feature records.
- `.rebuild/features/feature-matrix.json` — the machine-readable ledger.
- `.rebuild/features/state-model.md` — inferred state schema.
- `.rebuild/features/event-map.md` — observed interactive surface.
- `.rebuild/features/api-contracts.md` — sanitized network shapes.
- `.rebuild/features/bundle-analysis.md` — public bundle clues.
- `.rebuild/features/storage-model.md` — what the app writes.
- `.rebuild/spec/implementation-plan.md` — how to rebuild.
- `.rebuild/reports/feature-parity.md` — proof-of-reconstruction report.
- `.rebuild/reports/gaps.md` — what is still unknown.
- `.harness/handoff.md` — resume summary for the next Claude session.

## Extending into a rebuild

1. Read `.rebuild/spec/visual-spec.md`, `interaction-spec.md`,
   `component-map.md`, and `implementation-plan.md`.
2. Read `.rebuild/features/state-model.md` and `event-map.md`.
3. Implement a new React + TypeScript app following the stage order in
   `implementation-plan.md`.
4. Use `.rebuild/tests/visual/rebuilt/` as the destination for rebuilt
   screenshots; `npm run visual-compare` will diff against the reference.
5. Use `tests/feature-parity-plan.spec.mjs` (extended for the rebuilt app)
   to verify each feature.

## Safety

See [`docs/safety.md`](docs/safety.md) and
`.claude/skills/owned-site-rebuilder/references/safety.md`.

Allowed:

- Public, unauthenticated browsing.
- DOM, screenshots, computed styles, public JS/CSS/assets, public workers,
  public WASM.
- Storage **names** and redacted shapes.
- Open-source repositories as licensed references.

Not allowed:

- Authentication bypass.
- Secret extraction.
- Vulnerability exploitation.
- Copying third-party proprietary code from any site you don't own.
- Faking results.

## License

This harness itself is research scaffolding; reuse the structure with
attribution. Do not paste captured source from any site you don't own into
derivative works.