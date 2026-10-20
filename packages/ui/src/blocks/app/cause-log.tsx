'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader } from '../../components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { CAUSES, DEFAULT_COPY, DEMO_NOW, ENTRIES, LONG_AFTER, type CauseLogCause, type CauseLogCopy, type CauseLogSort, type CauseLogEntry } from './cause-log/data'
import { EntriesTable } from './cause-log/entries-table'
import { Timeline } from './cause-log/timeline'

/* Recent events to read and to sort out (a plant's stops, escalated tickets,
 * delayed appointments). The table lists each entry (when, which source, its
 * cause, how long) and filters by cause or sorts by newest or longest; tick
 * rows and Assign cause files all of them under one cause. Under it, the last
 * 24 hours as a strip per source: a mark for every entry in its cause's color
 * and a line at now, with the ticked entries lit. Loading, an error with
 * Retry and an empty table take the table's room, and the strip's. The table
 * scrolls inside a region of one height, so filtering never resizes the card. Times are shown in `timeZone` (default: UTC). Wire `onAssign` to
 * save the cause; the block shows it at once. Reduced motion: marks change
 * in place.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface CauseLogProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CauseLogCopy>
  /** Formats its numbers and times (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The time zone times are shown in (an IANA name). Default 'UTC'. */
  timeZone?: string
  /** The entries, in any order: the sort places them. Their `duration` is in minutes. */
  entries?: CauseLogEntry[]
  /** The causes an entry can have, in the order the filter and the menu list them. */
  causes?: CauseLogCause[]
  /** The moment the last 24 hours end at (a date, a date-time string or a timestamp). Default: a fixed demo moment. */
  now?: Date | string | number
  /** Formats a duration (minutes) for the table, the strip and the foot. Default: the locale's number format, with the unit in `copy.durationHead` and `copy.duration`. */
  format?: (duration: number) => string
  /** Entries longer than this (minutes) have their duration in the warning tone. Default 45. */
  longAfter?: number
  /** Skeletons in place of the table and the strip while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the table when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Called by Assign cause with the ticked entries' ids and the chosen cause's id; the block files them under it. */
  onAssign?: (entryIds: string[], causeId: string) => void
  /** How it opens. Default 'newest'. */
  defaultSort?: CauseLogSort
  /** Called with the new sort after every change. */
  onSortChange?: (sort: CauseLogSort) => void
  /** Replaces the empty state shown when no entry matches the filter. */
  empty?: ReactNode
}

function CauseLog({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  timeZone = 'UTC',
  entries = ENTRIES,
  causes = CAUSES,
  now = DEMO_NOW,
  format: formatProp,
  longAfter = LONG_AFTER,
  loading = false,
  error,
  onRetry,
  defaultSort = 'newest',
  onAssign,
  onSortChange,
  empty,
  className,
  ...rest
}: CauseLogProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<CauseLogSort>(defaultSort)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [filed, setFiled] = useState<Record<string, string>>({})

  const filedEntries = useMemo(() => entries.map((e) => ({ ...e, cause: filed[e.id] ?? e.cause })), [entries, filed])
  const shown = useMemo(() => {
    const list = filedEntries.filter((e) => filter === 'all' || e.cause === filter)
    return list.sort(sort === 'longest' ? (a, b) => b.duration - a.duration : (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  }, [filedEntries, filter, sort])
  const picked = filedEntries.filter((e) => selected.has(e.id))
  const format = formatProp ?? numberFormat(locale).format
  const blocked = loading || !!error
  const reasons = [{ value: 'all', label: copy.allReasons }, ...causes.map((c) => ({ value: c.id, label: c.label }))]
  const sorts = [
    { value: 'newest', label: copy.sortNewest },
    { value: 'longest', label: copy.sortLongest },
  ]

  const assign = (cause: CauseLogCause) => {
    const ids = picked.map((e) => e.id)
    setFiled((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, cause.id])) }))
    setSelected(new Set())
    onAssign?.(ids, cause.id)
    announce(copy.assigned(ids.length, cause.label))
  }

  const card = (
    <Card data-slot="cause-log" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="pt-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className={cn('tabular-nums', error && 'text-fg-subtle')}>
          {loading ? <Skeleton className="h-5 w-32" /> : error ? '—' : copy.subtitle(entries.length, copy.window)}
        </CardDescription>
      </CardHeader>
      <div className="flex gap-2 px-(--ui--panel-x) pt-3 pb-(--ui--panel-y)">
        <Select items={reasons} value={filter} disabled={blocked} onValueChange={(value) => setFilter(value as string)}>
          <SelectTrigger size="sm" aria-label={copy.filterLabel} className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={sorts}
          disabled={blocked}
          value={sort}
          onValueChange={(value) => {
            setSort(value as CauseLogSort)
            onSortChange?.(value as CauseLogSort)
          }}
        >
          <SelectTrigger size="sm" aria-label={copy.sortLabel} className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* One height whatever the filter leaves: the table scrolls here. */}
      <div className="h-60 overflow-y-auto border-t border-line yj-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-3 px-(--ui--panel-x) py-3">
            <span className="sr-only">{copy.loadingLabel}</span>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="grid h-full place-items-center px-(--ui--panel-x)">
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
              {onRetry && (
                <AlertAction>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {copy.retry}
                  </Button>
                </AlertAction>
              )}
            </Alert>
          </div>
        ) : shown.length === 0 ? (
          (empty ?? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyDescription>{copy.empty}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        ) : (
          <EntriesTable entries={shown} causes={causes} selected={selected} onSelectedChange={setSelected} locale={locale} timeZone={timeZone} longAfter={longAfter} format={format} copy={copy} />
        )}
      </div>

      <div className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {blocked ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-ui-sm text-fg-muted">
              <span>{copy.lastDay}</span>
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="grid grid-cols-[--spacing(14)_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5">
              {[100, 70, 85, 50].map((w) => (
                <div key={w} className="contents">
                  <span aria-hidden className="invisible text-ui font-medium">
                    .
                  </span>
                  <Skeleton className="h-4" style={{ width: `${w}%` }} />
                </div>
              ))}
              <span aria-hidden />
              <div aria-hidden className="h-4" />
            </div>
          </div>
        ) : (
          <Timeline entries={filedEntries} causes={causes} selected={selected} now={new Date(now).getTime()} locale={locale} timeZone={timeZone} format={format} copy={copy} />
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <p className="text-ui text-fg-muted tabular-nums">{copy.selected(picked.length, copy.duration(format(picked.reduce((sum, e) => sum + e.duration, 0))))}</p>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button disabled={picked.length === 0} />}>{copy.assign}</DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {causes.map((cause) => (
              <DropdownMenuItem key={cause.id} onClick={() => assign(cause)}>
                <span aria-hidden className="size-2 rotate-45" style={{ background: toneColor(cause.tone) }} />
                {cause.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CauseLog, type CauseLogProps }
export type { CauseLogCause, CauseLogCopy, CauseLogEntry, CauseLogSort }
