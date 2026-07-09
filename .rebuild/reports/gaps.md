# Gaps & Blockers

Generated: 2026-07-09T07:13:38.659Z


## Known unknowns
- Private backend behavior: cannot be recovered; only inferred from public network shapes.
- Hidden admin/editor surfaces behind auth: blocked if no public surface.
- Server-side rendering data: only public, browser-visible `__NEXT_DATA__`, `__remixContext__`, etc.
- Source maps: only recorded if publicly delivered by the server.