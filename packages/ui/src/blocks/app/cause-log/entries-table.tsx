'use client'

import { Checkbox } from '../../../components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { cn, dateTimeFormat, toneColor } from '../../../lib/utils'
import { type CauseLogCause, type CauseLogCopy, type CauseLogEntry } from './data'

/* The entries as a table: a tick per row (and one for all), when it started and
 * from which source, its reason with the cause's marker, and how long. A
 * ticked row is tinted; an entry over `longAfter` has its figure in the
 * warning tone, and the unit stays in the header so figures stay bare. */

interface EntriesTableProps {
  entries: CauseLogEntry[]
  causes: CauseLogCause[]
  selected: ReadonlySet<string>
  onSelectedChange: (next: Set<string>) => void
  locale: string
  timeZone?: string
  longAfter: number
  format: (duration: number) => string
  copy: CauseLogCopy
}

export function EntriesTable({ entries, causes, selected, onSelectedChange, locale, timeZone, longAfter, format, copy }: EntriesTableProps) {
  const when = dateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone })
  const all = entries.length > 0 && entries.every((s) => selected.has(s.id))
  const some = !all && entries.some((s) => selected.has(s.id))
  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected)
    if (on) next.add(id)
    else next.delete(id)
    onSelectedChange(next)
  }

  return (
    // The heads keep the page's quiet sentence-case voice, not the theme's capital label.
    <Table aria-label={copy.tableLabel} className="[--yj-label-case:none] [--yj-label-font:var(--font-sans)] [--yj-label-tracking:normal]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 ps-(--ui--panel-x)">
            <Checkbox
              aria-label={copy.selectAll}
              checked={all}
              indeterminate={some}
              onCheckedChange={(on) => onSelectedChange(on ? new Set([...selected, ...entries.map((s) => s.id)]) : new Set([...selected].filter((id) => !entries.some((s) => s.id === id))))}
            />
          </TableHead>
          <TableHead>{copy.started}</TableHead>
          <TableHead>{copy.reason}</TableHead>
          <TableHead className="pe-(--ui--panel-x) text-end">{copy.durationHead}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const cause = causes.find((c) => c.id === entry.cause)
          const started = when.format(new Date(entry.startedAt))
          return (
            <TableRow key={entry.id} data-state={selected.has(entry.id) ? 'selected' : undefined}>
              <TableCell className="w-10 ps-(--ui--panel-x)">
                <Checkbox aria-label={copy.selectRow(entry.source, started)} checked={selected.has(entry.id)} onCheckedChange={(on) => toggle(entry.id, on)} />
              </TableCell>
              <TableCell>
                <span className="block tabular-nums">{started}</span>
                <span className="block text-ui-sm text-fg-muted">{entry.source}</span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="size-2 rotate-45" style={{ background: toneColor(cause?.tone ?? 'neutral') }} />
                  {cause?.label ?? entry.cause}
                </span>
              </TableCell>
              <TableCell className={cn('pe-(--ui--panel-x) text-end font-medium tabular-nums', entry.duration > longAfter && 'text-warning-text')}>{format(entry.duration)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
