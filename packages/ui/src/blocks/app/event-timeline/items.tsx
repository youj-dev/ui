'use client'

import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import { type EventTimelineCopy, type EventTimelineItem, type EventTimelineStatus } from './data'

const DOT = {
  danger: 'bg-danger shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-danger)_22%,transparent)]',
  warning: 'bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-warning)_22%,transparent)]',
  success: 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_22%,transparent)]',
} as const
const INK = { danger: 'text-danger-text', warning: 'text-warning-text', success: 'text-fg-muted' } as const

interface AffectedItemsProps {
  items: EventTimelineItem[]
  /** The phase id whose rates are shown. */
  phase: string
  /** Worst first: an item is in the first status whose `from` its rate reaches. */
  statuses: EventTimelineStatus[]
  /** The rate at which a bar is full. */
  scale: number
  /** Writes a rate. Default: a percentage with one decimal. */
  formatRate?: (rate: number) => string
  copy: EventTimelineCopy
  locale: string
  /** The section's heading element, one level under the block's title. */
  heading: 'h2' | 'h3' | 'h4'
  id: string
}

/** Each item the event touches: its status, and its rate as a run of cells up to `scale`. */
function AffectedItems({ items, phase, statuses, scale, formatRate, copy, locale, heading: Heading, id }: AffectedItemsProps) {
  const percent = formatRate ? { format: formatRate } : numberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const rateOf = (item: EventTimelineItem) => item.rates[phase] ?? 0
  // The first status the rate reaches; the last one catches the rest.
  const statusOf = (rate: number) => statuses.find((st) => rate >= (st.from ?? 0)) ?? statuses[statuses.length - 1]!
  const hit = items.filter((item) => statusOf(rateOf(item)) !== statuses[statuses.length - 1]).length
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow id={id} render={<Heading />}>
          {copy.affected}
        </Eyebrow>
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
          {hit}/{items.length}
        </span>
      </div>
      {items.length === 0 && <p className="text-ui text-fg-muted">{copy.noItems}</p>}
      <ul className="flex flex-col empty:hidden">
        {items.map((item) => {
          const rate = rateOf(item)
          const status = statusOf(rate)
          return (
            <li
              key={item.id}
              data-status={status.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-line py-2.5 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_--spacing(32)_--spacing(16)]"
            >
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full transition-[background-color,box-shadow] yj-duration-base ease-standard', DOT[status.tone])} />
              <span className="flex min-w-0 items-baseline gap-2.5">
                <span className="truncate font-mono text-ui-lg text-fg">{item.name}</span>
                <span className={cn('text-ui transition-[color] yj-duration-base ease-standard', INK[status.tone])}>{status.label}</span>
              </span>
              <ShareBar
                value={Math.min(rate, scale)}
                max={scale}
                segments={16}
                tone={status.tone}
                className="order-last col-span-3 w-full sm:order-none sm:col-span-1"
              />
              <span className="text-end font-mono text-ui-sm text-fg-muted tabular-nums">
                <span aria-hidden>{percent.format(rate)}</span>
                <span className="sr-only">{copy.rate(percent.format(rate))}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export { AffectedItems }
