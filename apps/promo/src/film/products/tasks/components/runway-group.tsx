'use client'

import type { ReactNode } from 'react'
import { CheckIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '@youj/react/components/ui/avatar'
import { cn } from '@youj/react/lib/utils'
import type { Person } from '../data'
import type { Placed } from '../schedule'

/* One person's lane on the runway: their name, then a row per task, the
 * title beside the bar (above it on a phone). A row's title is a pointer
 * shortcut to the task; the bar is the control. */

export const GROUP_HEIGHT = 36
export const ROW_HEIGHT = 36
export const COMPACT_ROW_HEIGHT = 58

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

/** Where a task stands, as a glyph: an empty ring to do, a half-filled one in progress, a check when it's done. */
function Status({ placed: p }: { placed: Placed }) {
  if (p.task.status === 'done')
    return (
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-line-strong text-fg-muted">
        <CheckIcon size={10} strokeWidth={3} />
      </span>
    )
  return (
    <span
      className={cn('size-4 shrink-0 rounded-full border-[1.5px]', p.late ? 'border-warning' : 'border-accent', p.task.status === 'doing' && (p.late ? 'bg-[linear-gradient(90deg,var(--color-warning)_50%,transparent_50%)]' : 'bg-[linear-gradient(90deg,var(--color-accent)_50%,transparent_50%)]'))}
    />
  )
}

export function RunwayGroup({
  person,
  rows,
  compact,
  onOpen,
  bar,
}: {
  person: Person
  rows: Placed[]
  compact: boolean
  onOpen: (id: string) => void
  bar: (p: Placed) => ReactNode
}) {
  return (
    <section aria-label={`${person.name}, ${person.role}`}>
      <div className={cn('grid items-center border-t border-line', compact ? 'grid-cols-1 px-4' : 'grid-cols-[var(--label)_minmax(0,1fr)]')} style={{ height: GROUP_HEIGHT }}>
        <div className={cn('flex items-center gap-2', !compact && 'px-4')}>
          <Avatar size="sm" aria-hidden>
            <AvatarFallback className="bg-accent-subtle text-[0.625rem] text-accent-text">{initials(person.name)}</AvatarFallback>
          </Avatar>
          <span className="shrink-0 text-ui font-semibold whitespace-nowrap text-fg">{person.name}</span>
          <span className="min-w-0 truncate text-ui-sm text-fg-muted">{person.role}</span>
        </div>
      </div>
      {rows.map((p) => (
        <div
          key={p.task.id}
          className={cn('group/row grid transition-colors yj-duration-fast ease-standard hover:bg-hover', compact ? 'grid-cols-1 grid-rows-[1.5rem_1fr] px-4 pt-2' : 'grid-cols-[var(--label)_minmax(0,1fr)]')}
          style={{ height: compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT }}
        >
          {/* A pointer shortcut to the task; the bar beside it is the keyboard's. */}
          <div onClick={() => onOpen(p.task.id)} className={cn('flex min-w-0 cursor-pointer items-center gap-2', !compact && 'ps-6 pe-3')}>
            <Status placed={p} />
            <span className={cn('truncate text-ui', p.task.status === 'done' ? 'text-fg-muted' : 'text-fg')}>{p.task.title}</span>
            {p.late && <span className="shrink-0 rounded-sm bg-warning-subtle px-1 text-ui-xs font-medium text-warning-text">Late</span>}
          </div>
          <div className="relative">{bar(p)}</div>
        </div>
      ))}
    </section>
  )
}
