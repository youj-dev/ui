'use client'

import { createContext, useContext } from 'react'
import { createDataTableColumnHelper, type DataTableColumnDef } from '../../../components/ui/data-table'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { LEVELS, type LogsTableCopy, type LogsTableEvent, type LogsTableLevel } from './data'

const col = createDataTableColumnHelper<LogsTableEvent>()

/** The events that just streamed in (their time glows in the accent and settles back) and the one in the inspector (marked at the row's edge). */
export const StreamContext = createContext<{ fresh: ReadonlySet<string>; inspected: string | null }>({ fresh: new Set(), inspected: null })

// Color is kept for what needs attention: debug recedes, info reads as plain text, warnings and errors stand out.
const TONE: Record<LogsTableLevel, { bar: string; text: string }> = {
  debug: { bar: 'bg-line', text: 'text-fg-subtle' },
  info: { bar: 'bg-fg-subtle', text: 'text-fg-muted' },
  warn: { bar: 'bg-warning', text: 'text-warning-text' },
  error: { bar: 'bg-danger', text: 'text-danger-text' },
}
const RANK: Record<LogsTableLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

/** A level as the stream marks it: a short bar in its color and its name in small caps. */
export function LevelMark({ level, label, className }: { level: LogsTableLevel; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-ui-xs font-medium tracking-wide uppercase', TONE[level].text, className)}>
      <span aria-hidden className={cn('h-3.5 w-0.75 shrink-0 rounded-full', TONE[level].bar)} />
      {label}
    </span>
  )
}

function TimeCell({ id, text }: { id: string; text: string }) {
  const stream = useContext(StreamContext)
  const fresh = stream.fresh.has(id)
  return (
    <>
      {stream.inspected === id && <span aria-hidden data-slot="logs-inspected" className="absolute inset-y-1.5 start-0 w-0.5 rounded-e-full bg-accent" />}
      <span
        data-yj-fresh={fresh || undefined}
        className="group/time inline-flex items-center gap-1.5 font-mono text-ui-sm text-fg-muted transition-colors yj-duration-slow ease-standard data-yj-fresh:text-accent-text"
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent opacity-0 transition-opacity yj-duration-slow ease-standard group-data-yj-fresh/time:opacity-100" />
        {text}
      </span>
    </>
  )
}

/** The stream's columns: time to the millisecond, level, service and message; level and service filter, and the slow ones turn amber. */
export function logColumns({ copy, locale }: { copy: LogsTableCopy; locale: string }): DataTableColumnDef<LogsTableEvent>[] {
  const h = copy.columns
  const clock = dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23' })
  const count = numberFormat(locale)
  return col.columns([
    col.accessor('time', {
      header: h.time,
      size: 136,
      sortFn: 'datetime',
      sortDescFirst: true,
      cell: ({ row, getValue }) => <TimeCell id={row.id} text={clock.format(new Date(getValue()))} />,
      meta: { label: h.time, skeleton: 'short', exportValue: (value) => value },
    }),
    col.accessor('level', {
      header: h.level,
      size: 96,
      sortFn: (a, b) => RANK[a.original.level] - RANK[b.original.level],
      sortDescFirst: true,
      cell: ({ row }) => <LevelMark level={row.original.level} label={copy.levels[row.original.level]} />,
      meta: { label: h.level, skeleton: 'badge', filter: { type: 'select', options: LEVELS.map((level) => ({ value: level, label: copy.levels[level] })) } },
    }),
    col.accessor('service', {
      header: h.service,
      size: 112,
      cell: (info) => <span className="font-mono text-ui-sm">{info.getValue()}</span>,
      meta: { label: h.service, skeleton: 'short', filter: { type: 'select' } },
    }),
    col.accessor('message', {
      header: h.message,
      size: 420,
      enableSorting: false,
      cell: (info) => <span className="font-mono text-ui-sm">{info.getValue()}</span>,
      meta: { label: h.message, grow: true },
    }),
    col.accessor((event) => event.duration ?? null, {
      id: 'duration',
      header: h.duration,
      size: 116,
      sortDescFirst: true,
      cell: (info) => {
        const ms = info.getValue()
        return ms === null ? <span className="text-fg-subtle">–</span> : <span className={cn(ms >= 1000 && 'text-warning-text')}>{copy.ms(count.format(ms))}</span>
      },
      meta: { label: h.duration, numeric: true, skeleton: 'number' },
    }),
  ])
}
