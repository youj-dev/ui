'use client'

import { CodePanel } from './code-panel'
import type { ViewerEntry, ViewerFile } from './viewer-entry'

/* An item's source, the viewer's Code view: in the stage's place, as the
 * site's code modal shows it (the install command over a file per tab, each
 * with its copy button), its files as `youj add` writes them (a block's)
 * template's), or the example on show (a component's story), each fetched
 * when it's first shown. A chunk of its own, fetched once the viewer is open. */

export function ViewerCode({ entry, files, open }: { entry: ViewerEntry; files: ViewerFile[]; open: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 md:p-3">
      {entry.import && (
        <p className="px-1 text-[12.5px] text-fg-muted">
          The example on show. The component itself comes from the package: <code className="code-inline">{entry.import}</code>
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-canvas">
        <CodePanel
          idBase={`viewer-code-${entry.slug}`}
          files={files}
          install={entry.install ? { command: entry.install, deps: [] } : undefined}
          download={entry.slug}
          height="100%"
          open={open}
        />
      </div>
    </div>
  )
}
