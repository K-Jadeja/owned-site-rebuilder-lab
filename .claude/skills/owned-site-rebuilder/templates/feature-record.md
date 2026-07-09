# Feature Record Template

Copy this block for each candidate feature in `.rebuild/features/feature-inventory.md`.

```markdown
## F###: <Feature name>

- **Category**: <project | assets | timeline | preview | inspector | effects | export | persistence | shortcuts | error | empty | media>
- **Status**: observed | partially_observed | inferred | blocked | not_found
- **Confidence**: high | medium | low

### Evidence

- screenshots:
  - `.rebuild/reference/screenshots/<file>.png` — <what it shows>
- dom:
  - `.rebuild/reference/dom/<file>.json` — <landmarks/selectors seen>
- network:
  - `.rebuild/reference/network/<file>.jsonl` — <method path status, request ids>
- storage:
  - `.rebuild/reference/storage/<file>.json` — <key, redacted value>
- console:
  - `.rebuild/reference/console/<file>.txt` — <errors/warnings seen>
- bundle clues:
  - <file name, module hint>

### User flow

1. <step>
2. <step>
3. <step>

### Before state

- DOM: <selector snapshot>
- URL: <url>
- Storage: <key state>

### Action

- <selector / role / text / shortcut>

### After state

- DOM: <selector snapshot>
- URL: <url>
- Storage: <key state>
- Network: <method path status>

### Observable UI behavior

<description>

### Observable data/state behavior

<description>

### Network behavior

<description>

### Storage behavior

<description>

### Inferred implementation model

<description — independent design, not copied from captured source>

### Acceptance criteria

- [ ] AC1 — <observable and testable>
- [ ] AC2 — <observable and testable>
- [ ] AC3 — <observable and testable>

### Suggested automated parity test

- file: `tests/feature-parity-plan.spec.mjs`
- describe / test name: <…>
- type: playwright | manual

### Known gaps / uncertainty

- <gap>
- <uncertainty>
```