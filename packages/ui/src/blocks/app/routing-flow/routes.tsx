'use client'

import { useId } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { ShareBar } from '../../../components/ui/share-bar'
import { Switch } from '../../../components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat, toneColor } from '../../../lib/utils'
import type { RoutingFlowCopy, RoutingFlowFallback, RoutingFlowFormats, RoutingFlowRoute } from './data'

/* The routes: a row per route with its share of the flow (a bar and the
 * percent), its typical / slow time, its cost and its failure rate, a rate
 * at `warnAt` or more in the warning ink. Pointing at a row lights its
 * lane in the flow above. Below, the fallback rule as a sentence: a switch,
 * then "if [route] fails, retry on [route]". On a narrow card the time
 * and failure columns fold into a line under the route's name. While loading,
 * or with nothing to show, the rows and the rule keep their room. */

interface RoutesProps {
  routes: readonly RoutingFlowRoute[]
  /** route id → share, normalized. */
  shares: Record<string, number>
  fallback: RoutingFlowFallback
  onFallbackChange: (next: RoutingFlowFallback) => void
  active: string | null
  onActiveChange: (id: string | null) => void
  copy: RoutingFlowCopy
  locale: string
  formats: Required<RoutingFlowFormats>
  warnAt: number
  /** `loading`: skeleton rows; `blank`: the rows hold a dash (an error or no routes). */
  status: 'ready' | 'loading' | 'blank'
  /** How many placeholder rows to draw when there are no routes. */
  rows: number
  heading: 'h3' | 'h2'
}

/** The width of each placeholder column's bar. */
const SKELETON_WIDTH = ['w-2/3', 'w-full', 'ms-auto w-3/4', 'ms-auto w-3/4', 'ms-auto w-3/4']

const dot = (tone: string) => <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: toneColor(tone) }} />

export function Routes({ routes, shares, fallback, onFallbackChange, active, onActiveChange, copy, locale, formats, warnAt, status, rows, heading: Heading }: RoutesProps) {
  const headingId = useId()
  const switchId = useId()
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const rate = numberFormat(locale, formats.rate)
  const time = numberFormat(locale, formats.time)
  const cost = numberFormat(locale, formats.cost)
  const options = routes.map((m) => ({ value: m.id, label: m.name }))
  const toneOf = (id: string) => routes.find((m) => m.id === id)?.tone ?? 'neutral'

  const picker = (value: string, label: string, onChange: (id: string) => void) => (
    <Select items={options} value={value} onValueChange={(next) => next && onChange(next as string)} disabled={!fallback.enabled}>
      <SelectTrigger size="sm" aria-label={label} className="min-w-0">
        {dot(toneOf(value))}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routes.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2">
              {dot(m.tone)}
              {m.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <section aria-labelledby={headingId} className="@container/routes flex flex-col gap-3">
      <Eyebrow id={headingId} render={<Heading />}>
        {copy.routes}
      </Eyebrow>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="ps-0">{copy.route}</TableHead>
            <TableHead className="w-28">{copy.share}</TableHead>
            <TableHead className="hidden w-24 text-end @md/routes:table-cell">{copy.time}</TableHead>
            <TableHead className="w-20 pe-0 text-end @md/routes:pe-3">{copy.cost}</TableHead>
            <TableHead className="hidden w-16 pe-0 text-end @md/routes:table-cell">{copy.failures}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody onPointerLeave={() => onActiveChange(null)}>
          {status !== 'ready'
            ? Array.from({ length: routes.length || rows }, (_, i) => (
                <TableRow key={i} aria-hidden className="hover:bg-transparent">
                  {[0, 1, 2, 3, 4].map((c) => (
                    <TableCell
                      key={c}
                      className={cn(c === 0 && 'ps-0', c === 3 && 'pe-0 @md/routes:pe-3', c === 4 && 'pe-0', (c === 2 || c === 4) && 'hidden @md/routes:table-cell')}
                    >
                      <span className="flex h-5 items-center text-ui-sm">
                        {status === 'loading' && <Skeleton className={cn('h-4', SKELETON_WIDTH[c])} />}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : routes.map((m) => {
                const share = shares[m.id] ?? 0
                const hot = m.failRate >= warnAt
                return (
                  <TableRow
                    key={m.id}
                    data-slot="routing-flow-route"
                    data-state={active === m.id ? 'selected' : undefined}
                    onPointerEnter={() => onActiveChange(m.id)}
                    className="data-[state=selected]:bg-hover"
                  >
                    <TableCell className="ps-0">
                      <span className="flex min-w-0 items-center gap-2">
                        {dot(m.tone)}
                        <span className="flex min-w-0 flex-col">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate text-fg">{m.name}</span>
                            {m.detail && <Eyebrow className="hidden truncate @sm/routes:inline">{m.detail}</Eyebrow>}
                          </span>
                          {/* Narrow: the columns that fold, as a line under the name. */}
                          <span className="font-mono text-ui-xs text-fg-muted tabular-nums @md/routes:hidden">
                            {time.format(m.time.slow)} {copy.timeUnit} · <span className={cn(hot && 'text-warning-text')}>{rate.format(m.failRate)}</span>
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <ShareBar value={share} tone={m.tone} className="w-10 min-w-10 shrink" />
                        <span className="w-9 text-end font-mono text-ui-sm text-fg tabular-nums">{percent.format(share)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-end font-mono text-ui-sm text-fg-muted tabular-nums @md/routes:table-cell">
                      {time.format(m.time.typical)} / {time.format(m.time.slow)}
                    </TableCell>
                    <TableCell className="pe-0 text-end font-mono text-ui-sm text-fg tabular-nums @md/routes:pe-3">{cost.format(m.cost)}</TableCell>
                    <TableCell className={cn('hidden pe-0 text-end font-mono text-ui-sm tabular-nums @md/routes:table-cell', hot ? 'text-warning-text' : 'text-fg-muted')}>
                      {rate.format(m.failRate)}
                    </TableCell>
                  </TableRow>
                )
              })}
        </TableBody>
      </Table>
      {status === 'ready' ? (
        <div data-slot="routing-flow-fallback" className="flex flex-wrap items-center gap-x-2 gap-y-2 text-ui text-fg-muted">
          <span className="flex items-center gap-2">
            <Switch id={switchId} size="sm" checked={fallback.enabled} onCheckedChange={(enabled) => onFallbackChange({ ...fallback, enabled })} />
            <label htmlFor={switchId} className="font-medium text-fg">
              {copy.fallback}
            </label>
          </span>
          <span>{copy.fallbackIf}</span>
          {picker(fallback.from, copy.fallbackFrom, (from) => onFallbackChange({ ...fallback, from }))}
          <span>{copy.fallbackThen}</span>
          {picker(fallback.to, copy.fallbackTo, (to) => onFallbackChange({ ...fallback, to }))}
        </div>
      ) : status === 'loading' ? (
        <Skeleton className="h-8 w-72 max-w-full" />
      ) : (
        <div aria-hidden className="h-8" />
      )}
    </section>
  )
}
