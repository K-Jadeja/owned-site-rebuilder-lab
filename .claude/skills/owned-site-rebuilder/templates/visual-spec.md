# Visual Spec Template

Use this structure for `.rebuild/spec/visual-spec.md`.

```markdown
# Visual Spec

Target: <url>
Generated: <ISO timestamp>

## Viewports

| name | width | height |
| --- | --- | --- |
| desktop | 1440 | 900 |
| laptop | 1280 | 800 |
| mobile | 390 | 844 |

## Layout regions

Top-level regions observed:

- AppShell
- Header / TopBar
- Sidebar (left)
- MediaLibrary
- PreviewPlayer
- Timeline
- Inspector (right)
- Footer / StatusBar

For each region:

- Bounding box (approx)
- Background color (var or hex)
- Padding / margin scale
- Border / divider style
- Typography
- Primary controls visible

## Typography

- font-family (primary)
- font-family (mono, if any)
- base font size
- scale: h1, h2, h3, body, caption

## Color palette

CSS variables (if any):

- `--color-bg`
- `--color-fg`
- ...

Computed colors of key regions:

- AppShell bg: #…
- Header bg: #…
- Sidebar bg: #…
- Timeline bg: #…
- Inspector bg: #…
- Primary accent: #…
- Text muted: #…

## Spacing scale

- xs: <px>
- sm: <px>
- md: <px>
- lg: <px>
- xl: <px>

## Component inventory

- Buttons (primary, secondary, icon-only)
- Inputs (text, number, file)
- Selects / dropdowns
- Toggles / switches
- Sliders
- Tabs
- Tooltips
- Modals / dialogs
- Toasts

## Icons / assets

List of asset URLs (sanitized) used for icons or images.

## Responsive behavior

What visibly changes between desktop, laptop, mobile.

## Visual unknowns

- Custom cursors
- Hover-only states
- Animation timings
- Anti-aliasing specifics
```