'use client'

import { useMemo } from 'react'
import { CalendarIcon, HourglassIcon, RouteIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '@youj/react/components/ui/avatar'
import { Kanban, type KanbanColumn } from '@youj/react/components/ui/kanban'
import { cn } from '@youj/react/lib/utils'
import { PERSON, type Status, type Task } from '../data'
import { rangeLabel } from '../days'
import type { Tandem } from '../use-tandem'

/* The same tasks by where they stand, on the library's Kanban: drag a card
 * (or Space, the arrows and Space again) to move it along; Enter opens it.
 * Each column keeps the runway's order, soonest first, and a card says what
 * the runway shows: how far it's got, whether it sets the launch date, what
 * it's waiting for and whether it lands late. Handing a card off to Done is
 * recorded, and can push the launch verdict over to ready. */

const COLUMNS: (KanbanColumn & { id: Status })[] = [
  { id: 'todo', title: 'To do', tone: 'neutral' },
  { id: 'doing', title: 'Doing', tone: 'accent', limit: 5 },
  { id: 'done', title: 'Done', tone: 'success' },
]

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

type Card = Task & { column: Status }

export function Board({ tandem }: { tandem: Tandem }) {
  const { project, placed, chain, today } = tandem
  const cards = useMemo<Card[]>(
    () =>
      project.tasks
        .map((t) => ({ ...t, column: t.status }))
        .sort((a, b) => placed.get(a.id)!.start - placed.get(b.id)!.start || placed.get(a.id)!.end - placed.get(b.id)!.end),
    [project.tasks, placed],
  )
  return (
    <Kanban
      aria-label={`${project.name} by stage`}
      columns={COLUMNS}
      cards={cards}
      fill
      renderCard={(card) => {
        const p = placed.get(card.id)!
        const done = card.status === 'done'
        const waiting = card.status === 'todo' ? card.after.map((id) => placed.get(id)?.task).filter((t): t is Task => !!t && t.status !== 'done') : []
        const critical = chain.has(card.id) && !done
        return (
          <div className="flex flex-col gap-2.5 px-(--card-spacing)">
            <div className="flex items-start gap-3">
              <p className={cn('min-w-0 flex-1 text-ui leading-snug font-medium text-balance', done ? 'text-fg-muted' : 'text-fg')}>{card.title}</p>
              <span className="sr-only">, {PERSON[card.owner].name}</span>
              <Avatar aria-hidden size="sm" className="-my-0.5">
                <AvatarFallback className="bg-accent-subtle text-[0.625rem] text-accent-text">{initials(PERSON[card.owner].name)}</AvatarFallback>
              </Avatar>
            </div>
            {card.status === 'doing' && (
              <div className="flex items-center gap-2">
                <span aria-hidden className="relative h-1 flex-1 overflow-hidden rounded-full bg-accent-subtle">
                  <span className="absolute inset-0 origin-left bg-accent rtl:origin-right" style={{ transform: `scaleX(${card.progress ?? 0})` }} />
                </span>
                <span className="text-ui-xs text-fg-muted tabular-nums">
                  {Math.round((card.progress ?? 0) * 100)}%<span className="sr-only"> done</span>
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm text-fg-muted">
              <span className="flex items-center gap-1.5">
                <CalendarIcon size={12} />
                <span className={cn('tabular-nums', p.late && 'font-medium text-warning-text')}>{rangeLabel(today, p.start, p.end)}</span>
              </span>
              {p.late && <span className="rounded-sm bg-warning-subtle px-1 text-ui-xs font-medium text-warning-text">Lands after launch</span>}
              {critical && !p.late && (
                <span className="flex items-center gap-1 text-accent-text">
                  <RouteIcon size={12} />
                  Critical path
                </span>
              )}
            </div>
            {waiting.length > 0 && (
              <p className="flex items-start gap-1.5 text-ui-sm text-fg-muted">
                <HourglassIcon size={12} className="mt-0.5 shrink-0" />
                <span>After {waiting.map((t) => t.title).join(' and ')}</span>
              </p>
            )}
          </div>
        )
      }}
      onMove={(move) => {
        if (move.from.column !== move.to.column) tandem.setStatus(move.card.id, move.to.column as Status)
      }}
      onCardAction={(card) => tandem.setOpenId(card.id)}
      className="min-h-0 flex-1 px-3 pb-4 md:px-5"
    />
  )
}
