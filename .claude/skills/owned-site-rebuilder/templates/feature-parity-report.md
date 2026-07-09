# Feature Parity Report Template

Use this structure for `.rebuild/reports/feature-parity.md`.

```markdown
# Feature Parity Report

Target: <url>
Generated: <ISO timestamp>

## 1. Features fully observed

- F###: <name> — evidence: <paths>

## 2. Features partially inferred

- F###: <name> — what was observed, what was inferred.

## 3. Features requiring hidden backend behavior

- F###: <name> — why we cannot reconstruct it from observable evidence alone.

## 4. Features independently re-creatable

- F###: <name> — sufficient evidence + spec + acceptance criteria.

## 5. Features that benefit from FreeCut-style architecture

- F###: <name> — what was learned from FreeCut, with license notes.

## 6. Tests that prove parity

- `tests/feature-parity-plan.spec.mjs`
- `tests/visual-baseline.spec.mjs`
- `tests/reference-capture.spec.mjs`

## 7. Remaining uncertainty

- <list>

## 8. Required manual inputs / fixture media

- <list>

## 9. Claim assessment

Does the experiment support the claim that **Claude Code can reconstruct
observable product behavior from an owned/authorized deployed app, then
independently reimplement and verify parity with automated tests**?

Answer with evidence, not vibes:

- ✅ supports, because: <observation>
- ⚠️ partial, because: <gap>
- ❌ does not support, because: <observation>

## 10. Next best actions

- <list>
```