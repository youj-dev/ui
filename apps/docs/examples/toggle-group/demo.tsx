'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'
import { cn } from '@youj/core'
import { KanbanIcon, LayoutGridIcon, ListIcon } from '@youj/icons'

const DEPLOYS = [
  { branch: 'main', commit: 'Tighten cache headers', status: 'Ready' },
  { branch: 'feat/pricing', commit: 'New pricing page', status: 'Building' },
  { branch: 'fix/og-image', commit: 'OG image for blog posts', status: 'Ready' },
  { branch: 'chore/deps', commit: 'Bump the build image', status: 'Error' },
] as const

const STATUSES = ['Building', 'Ready', 'Error'] as const
const DOT = { Ready: 'bg-success', Building: 'bg-warning', Error: 'bg-danger' }

export default function ToggleGroupDemo() {
  const [view, setView] = useState(['list'])

  return (
    <div className="@container w-full max-w-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-ui font-medium text-fg">Deployments</p>
        {/* A view switcher always has a view: ignore the change that would empty it. */}
        <ToggleGroup variant="segmented" aria-label="View" value={view} onValueChange={(next) => next.length > 0 && setView(next)}>
          <ToggleGroupItem value="list">
            <ListIcon />
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="grid">
            <LayoutGridIcon />
            Grid
          </ToggleGroupItem>
          <ToggleGroupItem value="board">
            <KanbanIcon />
            Board
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {view[0] === 'board' ? (
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col gap-2 rounded-lg bg-band p-2">
              <p className="px-1 text-ui-xs font-medium text-fg-muted">{status}</p>
              {DEPLOYS.filter((d) => d.status === status).map((d) => (
                <Deploy key={d.branch} {...d} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-2', view[0] === 'grid' && 'grid-cols-2')}>
          {DEPLOYS.map((d) => (
            <Deploy key={d.branch} {...d} />
          ))}
        </div>
      )}
    </div>
  )
}

function Deploy({ branch, commit, status }: (typeof DEPLOYS)[number]) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className="flex items-center gap-2 text-ui font-medium text-fg">
        <span aria-label={status} role="img" className={cn('size-1.5 shrink-0 rounded-full', DOT[status])} />
        <span className="truncate">{commit}</span>
      </p>
      <p className="truncate font-mono text-ui-xs text-fg-muted">{branch}</p>
    </div>
  )
}
