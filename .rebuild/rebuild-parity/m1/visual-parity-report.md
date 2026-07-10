# Visual parity report (Milestone 1 rescue)

Generated: 2026-07-10T03:30:35.865Z

Pixel-level comparison between reference (`https://demo.reactvideoeditor.com`) and rebuild (`http://localhost:4310`).

| Viewport | State | Mismatch px | % | Diff file | Status |
| --- | --- | --- | --- | --- | --- |
| desktop | viewport | 748916 | 57.79% | `.rebuild/rebuild-parity/m1/diff/desktop-viewport-diff.png` | CRITICAL — overall shell/colors mostly different |
| desktop | full | - | err | `-` | MISSING |
| desktop | export-dialog | 124392 | 9.6% | `.rebuild/rebuild-parity/m1/diff/desktop-export-dialog-diff.png` | OK |
| desktop | my-library | 746744 | 57.62% | `.rebuild/rebuild-parity/m1/diff/desktop-my-library-diff.png` | MAJOR — visible behavior differs |
| desktop | after-space | 753061 | 58.11% | `.rebuild/rebuild-parity/m1/diff/desktop-after-space-diff.png` | MAJOR — visible behavior differs |
| desktop | after-import | 748655 | 57.77% | `.rebuild/rebuild-parity/m1/diff/desktop-after-import-diff.png` | CRITICAL — imported video, library card, or preview still wrong |
| laptop | viewport | 546438 | 53.36% | `.rebuild/rebuild-parity/m1/diff/laptop-viewport-diff.png` | CRITICAL — overall shell/colors mostly different |
| laptop | full | - | err | `-` | MISSING |
| laptop | export-dialog | 194002 | 18.95% | `.rebuild/rebuild-parity/m1/diff/laptop-export-dialog-diff.png` | OK |
| laptop | my-library | 544466 | 53.17% | `.rebuild/rebuild-parity/m1/diff/laptop-my-library-diff.png` | MAJOR — visible behavior differs |
| laptop | after-space | 549162 | 53.63% | `.rebuild/rebuild-parity/m1/diff/laptop-after-space-diff.png` | MAJOR — visible behavior differs |
| laptop | after-import | 547318 | 53.45% | `.rebuild/rebuild-parity/m1/diff/laptop-after-import-diff.png` | CRITICAL — imported video, library card, or preview still wrong |
| mobile | viewport | 44960 | 13.66% | `.rebuild/rebuild-parity/m1/diff/mobile-viewport-diff.png` | OK |
| mobile | full | - | err | `-` | MISSING |
| mobile | export-dialog | - | err | `-` | MISSING |
| mobile | my-library | - | err | `-` | MISSING |
| mobile | after-space | 43499 | 13.22% | `.rebuild/rebuild-parity/m1/diff/mobile-after-space-diff.png` | OK |
| mobile | after-import | - | err | `-` | MISSING |

## Region assessments

- **desktop/viewport** (57.79%): CRITICAL — overall shell/colors mostly different
- **desktop/full**: missing image pair (re-capture required).
- **desktop/export-dialog** (9.6%): OK
- **desktop/my-library** (57.62%): MAJOR — visible behavior differs
- **desktop/after-space** (58.11%): MAJOR — visible behavior differs
- **desktop/after-import** (57.77%): CRITICAL — imported video, library card, or preview still wrong
- **laptop/viewport** (53.36%): CRITICAL — overall shell/colors mostly different
- **laptop/full**: missing image pair (re-capture required).
- **laptop/export-dialog** (18.95%): OK
- **laptop/my-library** (53.17%): MAJOR — visible behavior differs
- **laptop/after-space** (53.63%): MAJOR — visible behavior differs
- **laptop/after-import** (53.45%): CRITICAL — imported video, library card, or preview still wrong
- **mobile/viewport** (13.66%): OK
- **mobile/full**: missing image pair (re-capture required).
- **mobile/export-dialog**: missing image pair (re-capture required).
- **mobile/my-library**: missing image pair (re-capture required).
- **mobile/after-space** (13.22%): OK
- **mobile/after-import**: missing image pair (re-capture required).

## Worst mismatches (top 5)

- desktop/after-space: 58.11%
- desktop/viewport: 57.79%
- desktop/after-import: 57.77%
- desktop/my-library: 57.62%
- laptop/after-space: 53.63%