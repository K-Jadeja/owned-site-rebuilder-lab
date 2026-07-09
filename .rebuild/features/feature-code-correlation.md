# Feature → Code Correlation

Generated: 2026-07-09T10:22:48.670Z

## Proof level tally (candidates)

- **behavior_observed**: 31
- **code_correlated**: 3

## Per-feature correlation

| ID | Name | Current | Candidate | Runtime | Stack | Bundle-kw | Coverage | Test | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F001 | App shell loads | hard_proof | **behavior_observed** | 0 | 48 | 5 | 0 | 2 | 55 |
| F002 | Topbar / toolbar | surface_observed | **behavior_observed** | 0 | 48 | 2 | 0 | 1 | 51 |
| F003 | Media library region | surface_observed | **behavior_observed** | 0 | 48 | 5 | 0 | 1 | 54 |
| F004 | Preview / player region | hard_proof | **behavior_observed** | 0 | 48 | 7 | 0 | 1 | 56 |
| F005 | Timeline region | surface_observed | **behavior_observed** | 0 | 62 | 1 | 0 | 1 | 64 |
| F006 | Inspector region | behavior_observed | **behavior_observed** | 0 | 48 | 1 | 0 | 0 | 49 |
| F007 | Asset import / add media | hard_proof | **code_correlated** | 6 | 48 | 6 | 0 | 4 | 64 |
| F008 | Export dialog | hard_proof | **behavior_observed** | 0 | 48 | 5 | 0 | 4 | 57 |
| F009 | Undo / redo button | surface_observed | **behavior_observed** | 0 | 48 | 1 | 0 | 1 | 50 |
| F010 | Persistence / storage | hard_proof | **behavior_observed** | 0 | 48 | 2 | 0 | 1 | 51 |
| F011 | Project create/load/save | not_found | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F012 | Media library tabs | surface_observed | **behavior_observed** | 0 | 48 | 5 | 0 | 1 | 54 |
| F013 | Drag/drop to timeline | behavior_observed | **behavior_observed** | 15 | 62 | 0 | 0 | 0 | 77 |
| F014 | Track management | surface_observed | **behavior_observed** | 0 | 50 | 5 | 0 | 1 | 56 |
| F015 | Clip trimming | inferred_from_bundle | **behavior_observed** | 0 | 50 | 3 | 0 | 0 | 53 |
| F016 | Clip splitting | inferred_from_bundle | **behavior_observed** | 0 | 50 | 0 | 0 | 0 | 50 |
| F017 | Clip movement | behavior_observed | **behavior_observed** | 0 | 50 | 3 | 0 | 0 | 53 |
| F018 | Snapping | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F019 | Timeline zoom | hard_proof | **behavior_observed** | 0 | 62 | 2 | 0 | 1 | 65 |
| F020 | Playback | hard_proof | **code_correlated** | 6 | 48 | 4 | 0 | 3 | 61 |
| F021 | Scrubbing | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F022 | Inspector / properties | behavior_observed | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F023 | Text overlays | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F024 | Transitions | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F025 | Effects | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F026 | Keyframes | inferred_from_bundle | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F027 | Audio waveform | fixture_ready | **behavior_observed** | 0 | 48 | 1 | 0 | 1 | 50 |
| F028 | Export settings | hard_proof | **behavior_observed** | 0 | 48 | 0 | 0 | 3 | 51 |
| F029 | Keyboard shortcuts | behavior_observed | **behavior_observed** | 0 | 48 | 0 | 0 | 1 | 49 |
| F030 | Undo / redo (deep) | behavior_observed | **behavior_observed** | 0 | 48 | 0 | 0 | 1 | 49 |
| F031 | Persistence after reload | hard_proof | **code_correlated** | 12 | 48 | 6 | 0 | 4 | 70 |
| F032 | Error states | not_found | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F033 | Empty states | not_found | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |
| F034 | Unsupported media handling | not_found | **behavior_observed** | 0 | 48 | 0 | 0 | 0 | 48 |

## Upgraded to code_correlated

- **F007** Asset import / add media
- **F020** Playback
- **F031** Persistence after reload