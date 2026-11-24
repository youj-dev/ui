---
'@youj/core': patch
'@youj/react': patch
---

New component: JSON Viewer (`JsonViewer` from `@youj/react`, experimental), a JSON value as a tree that opens and closes, for logs inspectors, webhook deliveries and API responses. Keys and typed values take the code palette, objects and arrays show how much they hold (`{4}`, `[12]`), strings longer than `collapseStringsAfter` (80) are cut short until opened onto their whole text, and arrays of more than a hundred items open a hundred at a time, read from the value only as rows show. Hovering or focusing a row shows buttons that copy its value or its path (`request.headers["content-type"]`), Ctrl/⌘+C copies a focused row's value, and the header copies the whole value or opens and closes everything; `onCopyText` hears each copy. It moves like Tree view and uses its keys. Core adds its strings (`jsonViewer`, `jsonViewerKeys`, `jsonViewerItems`, `jsonViewerRange`, `jsonViewerCharacters`, `jsonViewerCircular`, `jsonViewerCopyValue`, `jsonViewerCopyPath`, `jsonViewerCopyAll`, `jsonViewerExpandAll`, `jsonViewerCollapseAll`) in English and in the 14 language packs.
