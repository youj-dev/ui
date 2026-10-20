'use client'

import { useId } from 'react'
import { Badge, ScrollArea } from '@youj/react'

const RELEASES = [
  { version: '2.4.0', date: 'Sep 24', title: 'Preview comments', note: 'Reviewers pin feedback to any element of a preview.' },
  { version: '2.3.2', date: 'Sep 17', title: 'Faster cold starts', note: 'Functions boot 38% faster in every region.' },
  { version: '2.3.1', date: 'Sep 11', title: 'Spend limits', note: 'Pause overage before it happens, per project.' },
  { version: '2.3.0', date: 'Sep 3', title: 'Monorepo caching', note: 'Unchanged packages skip the build entirely.' },
  { version: '2.2.4', date: 'Aug 27', title: 'Audit log export', note: 'Stream team events to your own storage.' },
  { version: '2.2.3', date: 'Aug 20', title: 'Custom 404 pages', note: 'Serve your own page for missing routes.' },
  { version: '2.2.0', date: 'Aug 12', title: 'Edge config', note: 'Read feature flags in under a millisecond.' },
  { version: '2.1.0', date: 'Jul 30', title: 'Branch protection', note: 'Require checks before a branch can deploy.' },
  { version: '2.0.0', date: 'Jul 15', title: 'The new dashboard', note: 'Every project, deployment and log in one place.' },
]

export default function ScrollAreaDemo() {
  const titleId = useId()

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p id={titleId} className="text-ui font-medium text-fg">
          Changelog
        </p>
        <Badge variant="secondary">{RELEASES.length} releases</Badge>
      </div>
      {/* Scroll it: the top edge starts to fade as you leave the start, the bottom one clears at the end. */}
      <ScrollArea aria-labelledby={titleId} className="h-72 rounded-b-xl">
        <ol className="flex flex-col py-1">
          {RELEASES.map((release) => (
            <li key={release.version} className="grid grid-cols-[4.5rem_1fr] gap-x-3 px-4 py-2.5">
              <span className="font-mono text-ui-sm leading-5 text-fg-muted">v{release.version}</span>
              <span className="text-ui leading-5 font-medium text-fg">{release.title}</span>
              <span className="text-ui-sm text-fg-muted">{release.date}</span>
              <span className="text-ui-sm text-fg-muted">{release.note}</span>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}
