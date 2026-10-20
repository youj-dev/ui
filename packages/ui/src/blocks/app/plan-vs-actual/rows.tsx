'use client'

import { useId } from 'react'
import { CellBar, type CellBarCell, type CellBarTone } from '../../../components/ui/cell-bar'
import { Hatch } from '../../../components/ui/hatched-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { PlanVsActualCopy } from './data'

/* The year by agent: a row each for the biggest spenders and one for the
 * rest together, each a CellBar of its months on one shared scale (settled
 * solid, forecast hatched) with its plan as a dashed tick, so a bar that runs
 * past its tick is over plan. A money ruler under the bars reads the scale.
 * Below, the team's year by quarter against the plan. On a narrow card each
 * bar takes the row's full width under its name and total. */

export interface PlanVsActualLine {
  id: string
  name: string
  /** 1, 2, 3 for the biggest spenders; none for the rest together. */
  rank?: number
  cells: CellBarCell[]
  total: number
  /** The year's plan, on the bars' scale. */
  plan: number
  tone: CellBarTone
}

interface RowsProps {
  rows: PlanVsActualLine[]
  /** The bars' shared scale. */
  scale: number
  quarters: CellBarCell[]
  planYear: number
  /** The first and last month's names, for the head. */
  span: [string, string]
  money: (value: number) => string
  compact: (value: number) => string
  copy: PlanVsActualCopy
  locale: string
  heading: 'h2' | 'h3'
}

const TICKS = [0, 0.25, 0.5, 0.75, 1]

export function Rows({ rows, scale, quarters, planYear, span, money, compact, copy, locale, heading: Heading }: RowsProps) {
  const headingId = useId()
  const quartersId = useId()
  return (
    <div className="@container/rows flex min-w-0 flex-1 flex-col gap-5">
      <section aria-labelledby={headingId} className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <Eyebrow id={headingId} render={<Heading />}>
            {copy.monthly(span[0], span[1])}
          </Eyebrow>
          <ul aria-hidden className="flex items-center gap-3 text-ui-sm text-fg-muted">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-fg-muted" />
              {copy.actual}
            </li>
            <li className="flex items-center gap-1.5">
              <Hatch className="size-2.5" />
              {copy.projected}
            </li>
          </ul>
        </div>
        <ol
          aria-label={copy.rows}
          className="grid flex-1 content-between gap-y-3 @lg/rows:grid-cols-[calc(var(--spacing)*3)_minmax(0,calc(var(--spacing)*36))_minmax(0,1fr)_auto] @lg/rows:gap-x-3 @lg/rows:gap-y-3.5"
        >
          {rows.map((row) => (
            <li
              key={row.id}
              data-slot="plan-vs-actual-row"
              className="grid grid-cols-[calc(var(--spacing)*3)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 @lg/rows:col-span-4 @lg/rows:grid-cols-subgrid"
            >
              <span aria-hidden className="col-start-1 row-start-1 text-end font-mono text-ui-xs text-fg-subtle tabular-nums">
                {row.rank ?? ''}
              </span>
              <span className={cn('col-start-2 row-start-1 truncate font-mono text-ui', row.rank ? 'text-fg' : 'text-fg-muted')}>{row.name}</span>
              <CellBar
                cells={row.cells}
                max={scale}
                target={row.plan}
                tone={row.tone}
                formatValue={money}
                locale={locale}
                label={copy.spendOf(row.name)}
                className="col-span-3 row-start-2 @lg/rows:col-span-1 @lg/rows:col-start-3 @lg/rows:row-start-1"
              />
              <span className="col-start-3 row-start-1 text-end font-mono text-ui text-fg tabular-nums @lg/rows:col-start-4">{money(row.total)}</span>
            </li>
          ))}
          <li
            aria-hidden
            data-slot="plan-vs-actual-scale"
            className="grid grid-cols-[calc(var(--spacing)*3)_minmax(0,1fr)_auto] @lg/rows:col-span-4 @lg/rows:grid-cols-subgrid"
          >
            <span className="relative col-span-3 h-4 @lg/rows:col-span-1 @lg/rows:col-start-3">
              {TICKS.map((t) => (
                <span
                  key={t}
                  className={cn(
                    'absolute top-0 flex flex-col gap-0.5 font-mono text-ui-xs whitespace-nowrap text-fg-muted tabular-nums',
                    t <= 0
                      ? 'items-start'
                      : t >= 1
                        ? '-translate-x-full items-end rtl:translate-x-full'
                        : '-translate-x-1/2 items-center rtl:translate-x-1/2',
                  )}
                  style={{ insetInlineStart: `${t * 100}%` }}
                >
                  {compact(t * scale)}
                </span>
              ))}
            </span>
          </li>
        </ol>
      </section>
      <section aria-labelledby={quartersId} className="flex flex-col gap-2 border-t border-line pt-4">
        <Eyebrow id={quartersId} render={<Heading />}>
          {copy.byQuarter}
        </Eyebrow>
        <CellBar
          cells={quarters}
          max={Math.max(
            planYear,
            quarters.reduce((sum, q) => sum + q.value, 0),
          )}
          target={planYear}
          targetLabel={`${copy.plan} ${compact(planYear)}`}
          tone="neutral"
          captions
          formatValue={money}
          locale={locale}
          label={copy.quarters}
        />
      </section>
    </div>
  )
}
