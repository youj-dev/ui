'use client'

import type { ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { portfolioLabels, useComponentLabels } from '@youj/core/labels'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn, numberFormat } from '../../../lib/utils'
import type { PortfolioCopy, PortfolioHolding } from './data'

const PERCENT = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 } as const

/** A return as an arrow glyph and a figure that counts to it. The direction is text twice over (the glyph, and "Up"/"Down" spoken), never color alone. */
function Change({ value, locale, className, children }: { value: number; locale: string; className?: string; children?: ReactNode }) {
  const labels = useComponentLabels(portfolioLabels)
  const direction = Math.abs(value) < 0.0005 ? 'flat' : value > 0 ? 'up' : 'down'
  const spoken = numberFormat(locale, PERCENT).format(Math.abs(value))
  return (
    <span
      data-direction={direction}
      className={cn(
        'inline-flex items-baseline gap-1 font-medium tabular-nums',
        direction === 'up' && 'text-success-text',
        direction === 'down' && 'text-danger-text',
        direction === 'flat' && 'text-fg-muted',
        className,
      )}
    >
      <span className="sr-only">
        {direction === 'up' ? labels.portfolioUp(spoken) : direction === 'down' ? labels.portfolioDown(spoken) : labels.portfolioFlat(spoken)}
      </span>
      <span aria-hidden className="inline-flex items-baseline gap-1">
        <span className="text-[0.85em]">{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–'}</span>
        <Counter value={Math.abs(value)} format={PERCENT} locale={locale} inView={false} duration="slow" />
        {children}
      </span>
    </span>
  )
}

interface HoldingsProps {
  holdings: readonly PortfolioHolding[]
  /** The `id` of the period shown. */
  period: string
  /** How the amounts are written. */
  format: Intl.NumberFormatOptions
  /** The portfolio's return over the period. */
  change: number
  copy: PortfolioCopy
  /** `ready` shows the rows; `loading` Skeletons in their shape; `blank` (failed or empty) keeps their room and shows dashes. */
  status?: 'ready' | 'loading' | 'blank'
  /** How many rows the room holds while not ready. */
  rows?: number
  /** The panel title's tag: one level under the card's title. */
  heading: 'h2' | 'h3'
}

/** The investments panel: the total and its return, then a row per asset class. */
function Holdings({ holdings, period, format, change, copy, status = 'ready', rows = holdings.length, heading: Heading }: HoldingsProps) {
  const total = holdings.reduce((sum, h) => sum + h.value, 0)
  return (
    <section aria-label={copy.investments} data-slot="portfolio-holdings" className="flex flex-col gap-1 rounded-xl bg-well p-3">
      <header className={cn('flex justify-between gap-3 px-1 pb-1', status === 'ready' ? 'items-baseline' : 'items-center')}>
        <Heading className="text-ui-sm font-medium text-fg-muted">{copy.investments}</Heading>
        <span className="flex items-baseline gap-2">
          {status === 'ready' ? (
            <>
              <Counter value={total} format={format} locale={copy.locale} inView={false} duration="slow" className="font-mono text-ui font-medium" />
              <Change value={change} locale={copy.locale} className="text-ui-sm" />
            </>
          ) : status === 'loading' ? (
            <span className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-28" />
            </span>
          ) : (
            <span className="flex h-5 items-center text-ui text-fg-subtle">—</span>
          )}
        </span>
      </header>
      {status !== 'ready' ? (
        <div aria-busy={status === 'loading' || undefined} className="flex flex-col">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-13.25 items-center gap-3 px-1">
              {status === 'loading' && (
                <>
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <span className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </span>
                  <span className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-10" />
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {holdings.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-fg-muted shadow-xs">
                {h.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui font-medium">{h.name}</span>
                <span className="text-ui-xs text-fg-muted">{copy.holdings(h.count)}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className="font-mono text-ui font-medium tabular-nums">{numberFormat(copy.locale, format).format(h.value)}</span>
                <Change value={h.change[period] ?? 0} locale={copy.locale} className="text-ui-xs" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export { Change, Holdings }
