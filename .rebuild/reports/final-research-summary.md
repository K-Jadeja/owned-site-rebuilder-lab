# Final Research Summary

Generated: 2026-07-09T07:13:38.661Z
Target: https://demo.reactvideoeditor.com

## What this harness proves

This harness demonstrates whether Claude Code can reconstruct the **observable behavior** of an owned/authorized browser video editor from public surface evidence (UI, DOM, network, storage, public bundles), and produce a spec + tests sufficient to drive an independent rebuild.

It does **not** claim that private backend source code was recovered.

## Evidence collected
- Viewports captured: 3
- Network entries (sanitized): 71
- Console messages: 18
- JS/CSS bundles: 15
- Static assets: 8

## Feature coverage
- observed: 7
- partially_observed: 3

## How to extend
1. Re-run `npm run capture` after any target update.
2. Re-run `npm run probe` to refresh the event map.
3. Update feature statuses in `.rebuild/features/feature-inventory.md`.
4. Add new Playwright specs as features stabilize.
5. Track unknowns in `.rebuild/reports/gaps.md`.