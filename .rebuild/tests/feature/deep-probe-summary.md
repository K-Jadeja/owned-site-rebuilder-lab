# Deep Probe Summary

Target: https://demo.reactvideoeditor.com
Started: 2026-07-09T08:28:45.372Z
Finished: 2026-07-09T08:29:53.463Z

## Fixtures
- sample.mp4: 71178 bytes
- sample.mp3: 40585 bytes
- sample.png: 886 bytes

## Network entries (sanitized): 30
## Console messages: 33

## Per-feature results
### F007: F007-media-import
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F007-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F007-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false
- evidence: {"tabClicked":{"ok":true,"text":"My Library"},"fileInputs":[{"accept":"video/*","name":"","multiple":false}],"uploadAttempt":{"ok":false,"error":"locator.setInputFiles: Error: Non-multiple file input 

### F013: F013-drag-drop
- status: **partially_observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F013-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F013-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false
- dragAttempt: {"ok":false,"error":"locator.boundingBox: Timeout 30000ms exceeded.\nCall log:\n\u001b[2m  - waiting for locator('[data-track-id], [data-testid*=\"track\"]').first()\u001b[22m\n"}
- evidence: {"droppables":[],"draggables":[{"tag":"div","attrs":["class=rve:flex rve:h-6 rve:w-9 rve:items-cente","draggable=true","title=Reorder track"],"box":{"x":70.59375,"y":615,"w":20,"h":24}},{"tag":"div","

### F015: F015-clip-selection
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F015-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F015-after.png
- diff.url: {"added":[],"removed":[],"changed":["url"]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: true

### F017: F017-clip-move
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F017-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F017-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false

### F016: F016-trim-split
- status: **inferred**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F016-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F016-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false

### F019: F019-timeline-zoom
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F019-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F019-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false

### F020: F020-playback
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F020-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F020-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":["advanced-timeline-store"],"removed":[],"changed":[]}
- diff.interactiveCount changed: false

### F030: F030-undo-redo
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F030-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F030-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: false

### F008: F008-export-dialog
- status: **observed**
- before: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F008-before.png
- after: D:\Workspace\Github-Projects\reverse engineering\.rebuild\tests\feature\F008-after.png
- diff.url: {"added":[],"removed":[],"changed":[]}
- diff.storage: {"added":[],"removed":[],"changed":[]}
- diff.interactiveCount changed: true
- clickAttempt: {"ok":true,"dialogsVisible":2}

### F031: F031-persistence-after-reload
- status: **observed**
- before: n/a
- after: n/a
- diff.url: {}
- diff.storage: {}
- diff.interactiveCount changed: false
