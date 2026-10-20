'use client'

import { useId, type CSSProperties } from 'react'
import { Hatch } from '../../../components/ui/hatched-bar'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { MonthForecastCopy, MonthForecastSeries } from './data'

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

/** Rows held by the skeleton while loading, and by the blank behind a message. */
const PLACEHOLDER_ROWS = 5

interface SeriesListProps {
  series: readonly MonthForecastSeries[]
  /** The scenario's id. */
  scenario: string
  copy: MonthForecastCopy
  money: (amount: number) => string
  /** Without data: skeleton rows while loading, or hidden rows that keep the list's size behind a message. */
  placeholder?: 'loading' | 'blank'
}

/**
 * Where the month-end lands, per series: spent so far solid, the rest of the
 * projection hatched after it (the chart's own language), on one scale. A
 * new scenario slides each bar's hatched end on the slow token.
 */
function SeriesList({ series, scenario, copy, money, placeholder }: SeriesListProps) {
  const headingId = useId()
  const top = Math.max(1, ...series.map((s) => Math.max(s.spent, s.projected[scenario] ?? s.spent)))
  const pct = (amount: number) => Math.round((Math.min(amount, top) / top) * 1000) / 10
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow render={<h3 id={headingId} />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {copy.breakdown}
        </Eyebrow>
        <div aria-hidden className="flex items-center gap-3 text-ui-sm text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] bg-fg-subtle" />
            {copy.spentKey}
          </span>
          <span className="flex items-center gap-1.5">
            <Hatch className="size-2.5" />
            {copy.projectedKey}
          </span>
        </div>
      </div>
      {placeholder ? (
        <ul aria-hidden className={cn('flex flex-col gap-3.5', placeholder === 'blank' && 'invisible')}>
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
            <li key={i} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 font-mono text-ui">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="h-2 rounded-xs bg-band" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {series.map((s) => {
            const projected = s.projected[scenario] ?? s.spent
            const tone = { '--series-tone': `var(--color-${s.tone})` } as CSSProperties
            return (
              <li key={s.id} className="flex flex-col gap-2" style={tone}>
                <span className="sr-only">{copy.seriesRow(s.name, money(s.spent), money(projected))}</span>
                <div aria-hidden className="flex items-baseline justify-between gap-3 font-mono text-ui">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-[2px] bg-(--series-tone)" />
                    <span className="truncate text-fg">{s.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="text-fg-muted">{money(s.spent)} / </span>
                    <span className="text-fg">{money(projected)}</span>
                  </span>
                </div>
                {/* No text inside, so the bar mirrors whole in RTL. */}
                <div aria-hidden data-slot="series-bar" className="relative h-2 overflow-hidden rounded-[3px] bg-band rtl:-scale-x-100">
                  <span
                    className="absolute inset-0 bg-(--series-tone) transition-[clip-path] yj-duration-slow ease-standard"
                    style={{ clipPath: `inset(0 ${100 - pct(s.spent)}% 0 0)` }}
                  />
                  <Hatch
                    tone={s.tone}
                    className="absolute inset-0 rounded-none transition-[clip-path] yj-duration-slow ease-standard"
                    style={{ clipPath: `inset(0 ${100 - pct(projected)}% 0 ${pct(s.spent)}%)` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export { SeriesList }
