# Component Map

Generated: 2026-07-09T07:13:38.657Z

This is an inferred component map for a browser video editor. Components are listed with their evidence pointer.

| Component | Category | Notes |
| --- | --- | --- |
| AppShell | app-shell | Top-level layout container |
| Header/TopBar | app-shell | Title, project name, menu, save indicator |
| Sidebar / MediaLibrary | assets | Tabs for media, text, templates, audio |
| PreviewPlayer | preview | Video element + transport controls |
| Timeline | timeline | Tracks, ruler, playhead, clips, scrubber |
| InspectorPanel | inspector | Per-clip properties, keyframes, effects |
| ExportDialog | export | Preset, resolution, codec, progress |
| SettingsDialog | app-shell | Theme, shortcuts, project settings |
| ToastNotifications | app-shell | Save state, errors |
| EmptyState | app-shell | No project / no clips placeholders |

## Evidence
- F001 App shell loads — observed
- F002 Toolbar / topbar visible — observed
- F003 Media library region visible — observed
- F004 Preview / player region visible — observed
- F005 Timeline region visible — partially_observed
- F006 Inspector region visible — partially_observed
- F007 Add media / import control — partially_observed
- F008 Export control — observed
- F009 Undo / redo controls — observed
- F010 Persistence / storage present — observed