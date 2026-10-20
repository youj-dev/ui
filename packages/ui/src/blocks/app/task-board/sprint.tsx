'use client'

import { AvatarStack } from '../../../components/ui/avatar-stack'
import { SegmentedMeter } from '../../../components/ui/segmented-meter'
import { ShareBar } from '../../../components/ui/share-bar'
import type { KanbanColumn } from '../../../components/ui/kanban'
import { cn } from '../../../lib/utils'
import type { BoardCopy, BoardSprint, BoardTask } from './data'

/* The sprint over the board: its name, dates and goal; the points done of
 * all the sprint's points as a meter of cells (one per point, filling as
 * cards reach Done); each column's share of the cards as a stacked bar with
 * its count; and the team on it as an Avatar Stack. Everything is counted
 * from the cards on the board, so it follows every move. */

interface SprintProps {
  sprint: BoardSprint
  columns: KanbanColumn[]
  tasks: BoardTask[]
  copy: BoardCopy
  className?: string
}

export function Sprint({ sprint, columns, tasks, copy, className }: SprintProps) {
  const total = tasks.reduce((sum, t) => sum + (t.points ?? 0), 0)
  const done = tasks.filter((t) => t.column === copy.doneColumn).reduce((sum, t) => sum + (t.points ?? 0), 0)
  const team = [...new Set(tasks.flatMap((t) => [t.assignee, ...(t.people ?? [])]).filter((p): p is string => Boolean(p)))]
  return (
    <section
      aria-label={sprint.name}
      className={cn(
        'grid grid-cols-1 gap-x-8 gap-y-4 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface p-4 shadow-xs @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @6xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] @6xl:items-center',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-ui font-semibold text-fg">
          {sprint.name} <span className="font-normal text-fg-muted tabular-nums">· {sprint.dates}</span>
        </p>
        {sprint.goal && <p className="truncate text-ui-sm text-fg-muted">{sprint.goal}</p>}
      </div>
      {total > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <div aria-hidden className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
            {copy.pointsDone}
            <span className="font-mono text-ui-lg font-medium text-fg tabular-nums">
              {done}
              <span className="text-ui-sm text-fg-muted">/{total}</span>
            </span>
          </div>
          <SegmentedMeter aria-label={copy.pointsDone} value={done} max={total} segments={Math.min(total, 48)} tone="success" format={{}} showValue={false} />
          {sprint.daysLeft !== undefined && <p className="text-ui-xs text-fg-muted tabular-nums">{copy.daysLeft(sprint.daysLeft)}</p>}
        </div>
      )}
      {tasks.length > 0 && (
        <ul className="flex min-w-0 flex-col gap-1.5">
          {columns.map((c) => {
            const count = tasks.filter((t) => t.column === c.id).length
            return (
              <li key={c.id} className="grid grid-cols-[--spacing(20)_minmax(0,1fr)_--spacing(5)] items-center gap-2 text-ui-xs text-fg-muted">
                <span className="truncate">{c.title}</span>
                <ShareBar value={count} max={tasks.length} tone={c.tone ?? 'neutral'} />
                <span className="text-end text-fg tabular-nums">{count}</span>
              </li>
            )
          })}
        </ul>
      )}
      {team.length > 0 && <AvatarStack users={team.map((name) => ({ id: name, name }))} max={5} label={copy.team} className="@6xl:justify-self-end" />}
    </section>
  )
}
