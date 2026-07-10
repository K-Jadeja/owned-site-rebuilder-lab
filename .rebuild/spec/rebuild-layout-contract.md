# Rebuild Layout Contract — Milestone 1

This contract is the authoritative source of truth for region dimensions, colors, and structure for the RVE rebuild until Milestone 2.

Source: `.rebuild/spec/rebuild-layout-contract.json` (machine-readable).

## Region layout (desktop 1440x900)

```
+------------------------------------------------------------+
| Topbar (h=48)                                              |
+--------+--------------------+--------------------+--------+
| Icon   |   Media panel      |  Preview (16:9)   | Inspector (320)
| rail   |   (w=280)          |  flex-1            | contextual
| (w=56) |   Stock / My Lib   |                    | collapsed
|        |   tabs + search    |                    | when no
|        |   media cards      |                    | selection
|        +--------------------+--------------------+--------+
|        Timeline panel (h≈280)                              |
|        header (32) + ruler (28) + tracks (6 × 56)         |
+------------------------------------------------------------+
```

## Required `data-testid` anchors

| Region | Selector |
| --- | --- |
| Shell | `[data-testid="rve-shell"]` |
| Icon rail | `[data-testid="icon-rail"]` |
| Media panel | `[data-testid="media-panel"]` |
| Preview workspace | `[data-testid="preview-workspace"]` |
| Inspector panel | `[data-testid="inspector-panel"]` |
| Timeline panel | `[data-testid="timeline-panel"]` |
| Preview video | `[data-testid="preview-video"]` |
| Preview canvas | `[data-testid="preview-canvas"]` |
| Preview composition | `[data-testid="preview-composition"]` |
| Playback time | `[data-testid="playback-time"]` |
| Timeline playhead | `[data-testid="timeline-playhead"]` |
| Media card | `[data-testid="media-card"]` + `data-asset-id="<id>"` |
| Media thumbnail | `[data-testid="media-thumbnail"]` |
| Timeline clip | `[data-testid="timeline-clip"]` + `data-clip-id` + `data-track-id` + `data-asset-id` |

## Color tokens

```
bg: #0a0a0a
panel: #161616
panelAlt: #1f1f1f
border: #262626
text: #f5f5f5
muted: #9ca3af
accent: #3b82f6
accentAlt: #60a5fa
danger: #ef4444
```

## Mobile (390x844)

- Icon rail collapses to 48px wide.
- Media panel becomes a drawer (toggled from the icon rail).
- Inspector panel becomes a drawer.
- Timeline horizontal scroll with track row height 44.

## Important rule

No region may be added, removed, or resized without updating this contract.
