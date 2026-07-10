# Reference Design Tokens — Milestone 1 Rescue 2

Machine-readable: `.rebuild/spec/reference-design-tokens.json`.

These tokens were extracted by visual inspection of the live reference screenshots plus the styles that appear in `.rebuild/features/extracted-editor-state.json` (e.g. `fontFamily: "League Spartan"`).

## Color tokens

```
bg: #0b0b0c
panel: #0b0b0c
panel_alt: #131316
border: rgba(255,255,255,0.08)
text: #f5f5f5
muted: #9ca3af
accent: #3b82f6
accent_alt: #60a5fa
danger: #ef4444
```

## Typography

```
font_family_default: Inter, system-ui, sans-serif
font_family_hero:    League Spartan, Inter, sans-serif
font_weight_light:   100
font_weight_normal:  400
font_weight_medium:  500
font_size_xs:        0.75rem
font_size_sm:        0.85rem
font_size_lg:        1.5rem
line_height_normal:  1.1
```

League Spartan is referenced by the extracted styles in the live editor state. In absence of direct font availability during the rescue, the rebuild falls back to Inter. Use Google Fonts or a self-hosted woff2 in production.

## Layout (desktop 1440×900)

```
topbar height:      56 px
icon rail width:    56 px
media panel width:  320 px
inspector width:    320 px
timeline height:    300 px
  ↳ header height:  32 px
  ↳ ruler height:   28 px
  ↳ track row:     56 px
preview aspect:     16:9
preview background: #000000
```

## Track colors (cycled)

```
#1f6feb (blue)
#9333ea (purple)
#ea580c (orange)
#16a34a (green)
#db2777 (pink)
#0891b2 (cyan)
```

## Notes

These tokens are **inferred**, not measured from the live DOM. The public demo re-saves its state often, so exact color picks may shift between two visits. The token values here are conservative defaults that match a single captured frame of the live reference and the styles declared by the editor state itself.
