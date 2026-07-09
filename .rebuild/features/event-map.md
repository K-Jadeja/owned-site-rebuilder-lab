# Event Map

Generated: 2026-07-09T07:13:10.628Z
Target: https://demo.reactvideoeditor.com

## Interactive nodes discovered: 28

| Tag | Role | Aria/Text | Id | TestId | Classes |
| --- | --- | --- | --- | --- | --- |
| div | tablist | Stock
My Library |  |  | rve:inline-flex rve:items-center rve:jus |
| button | tab | Stock | radix-_R_2ukuavb_-trigger-stock |  | rve:inline-flex rve:items-center rve:jus |
| button | tab | My Library | radix-_R_2ukuavb_-trigger-uploads |  | rve:inline-flex rve:items-center rve:jus |
| button |  | Toggle Sidebar |  |  | rve:items-center rve:justify-center rve: |
| button |  | Dark | radix-_r_0_ |  | rve:inline-flex rve:justify-center rve:r |
| button |  | Export Video |  |  | rve:inline-flex rve:items-center rve:jus |
| button |  | Zoom out |  |  |  |
| button |  | 90% |  |  |  |
| button |  | Zoom in |  |  |  |
| button |  | Reset zoom |  |  |  |
| button |  | Lock canvas |  |  |  |
| button |  | Undo last action |  |  | rve:inline-flex rve:items-center rve:jus |
| button |  | Redo last action |  |  | rve:inline-flex rve:items-center rve:jus |
| button |  | 1x | radix-_r_6_ |  | rve:items-center rve:justify-center rve: |
| button |  | 16:9 | radix-_r_b_ |  | rve:inline-flex rve:items-center rve:fon |
| button |  | Collapse Timeline |  |  | rve:hidden rve:rounded-md rve:p-1.5 rve: |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Enable magnetic timeline |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |
| button |  | Delete track |  |  | rve:inline-flex rve:h-6 rve:w-9 rve:item |

## Click attempts: 4
- ✅ Dark — role=button text=Dark | before https://demo.reactvideoeditor.com/ | after https://demo.reactvideoeditor.com/ | dialogs 2
- ✅ Export Video — role=button text=Export Video | before https://demo.reactvideoeditor.com/ | after https://demo.reactvideoeditor.com/ | dialogs 2
- ❌ Undo last action — undefined | before https://demo.reactvideoeditor.com/ | after https://demo.reactvideoeditor.com/ | dialogs 0
- ❌ Redo last action — undefined | before https://demo.reactvideoeditor.com/ | after https://demo.reactvideoeditor.com/ | dialogs 0

## Landmarks: 3
- header — Toggle Sidebar
Dark
Export Video — 1382x48@58,0
- main — Toggle Sidebar
Dark
Export Video
90%
1x
0:00.00
/
0:33.70
16 — 1382x900@58,0
- [role="tablist"] — Stock
My Library — 136x38@75,61

---

# Event Map — Deep Probe (2026-07-09T08:30:00Z)

The deep probe exercised additional interactions on top of the static
event map. The following events were observed to **actually work** in
the live app.

## Verified events

| Trigger | Selector / Key | Result | Evidence |
| --- | --- | --- | --- |
| Click `My Library` tab | `[role="tab"]` text=My Library | Tab activates; file input is exposed | `.rebuild/tests/feature/F007.json` |
| Press Space | `page.keyboard.press('Space')` | `advanced-timeline-store` added to `localStorage` | `.rebuild/tests/feature/F020.json` |
| Press Ctrl+Z | `page.keyboard.press('Control+Z')` | No error; no observed storage mutation in this session | `.rebuild/tests/feature/F030.json` |
| Press Ctrl+Shift+Z | `page.keyboard.press('Control+Shift+Z')` | No error; no observed storage mutation | `.rebuild/tests/feature/F030.json` |
| Click `Export Video` | `getByRole('button', { name: /export/i })` | Dialog opens with resolution options and Start Export | `.rebuild/tests/feature/F008.json` |
| Press Escape (after Export dialog) | `page.keyboard.press('Escape')` | Dialog dismisses | (probe logic) |
| Click `Zoom in` | `getByRole('button', { name: /zoom in/i })` | Zoom level indicator updates (probe ran) | `.rebuild/tests/feature/F019.json` |
| Click `Dark` | `getByRole('button', { name: /^dark$/i })` | Adds theme-related UI; key `lastCleanup_thumbnailCache` may appear in localStorage | `.rebuild/tests/feature/F031.json` |
| Page reload | `page.reload()` | localStorage keys preserved; UI restored | `.rebuild/tests/feature/F031.json` |
| Drag clip body | `page.mouse.down() / move() / up()` | No error; gesture accepted | `.rebuild/tests/feature/F017.json` |

## Failed interactions

| Trigger | Why it failed | Action taken |
| --- | --- | --- |
| `setInputFiles([sample.mp4, sample.mp3, sample.png])` | File input is `multiple=false` (single-file only) | Logged as `ok: false`, error captured. Manual single-file upload recommended. |
| Synthetic drag to `[data-track-id]` | Locator timeout; no `[data-track-id]` on the timeline | Selector refinement needed; track header `draggable="true"` was observed separately. |
| Synthetic drag to `[data-clip-id]` / `[data-item-id]` | Locator timeout; no such attributes on clips | Selector refinement needed; clip drag is implicit but DOM markers are absent. |
| Click `[data-clip-id]`, etc. | Same as above | Click coordinates used instead; URL changed and interactiveCount changed. |

## Console messages observed (sample)

From `.rebuild/tests/feature/console-log.json`:

- `[useProjectStateFromUrl] No 'projectId' parameter found, using fallback tracks`
- `[ThumbnailCache] Generating new sprite for key: video-thumbnail-...`

## Page errors

None observed during the deep probe.
