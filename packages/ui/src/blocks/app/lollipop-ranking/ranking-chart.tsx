'use client'

import { useId } from 'react'
import { LollipopChart } from '../../../components/ui/lollipop-chart'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import { statusOf, type LollipopRankingCopy, type LollipopRankingItem, type LollipopRankingStatus, type LollipopRankingTone } from './data'

/* The index: every item shown as a dot on a stem from zero, sorted from the
 * lowest to the highest, in its status ink, so the whole set reads as one
 * curve. The picked item is named over the chart with its value, target,
 * period and owner, and picking a dot picks its row. A key under it counts
 * each status. */

interface RankingChartProps {
  items: LollipopRankingItem[]
  statuses: readonly LollipopRankingStatus[]
  domain: readonly [number, number]
  selected: string | null
  onSelect: (id: string) => void
  copy: LollipopRankingCopy
  locale: string
  heading: 'h2' | 'h3'
}

/** The status colors as literal classes for Tailwind. */
const TEXT: Record<LollipopRankingTone, string> = {
  accent: 'text-accent-text',
  neutral: 'text-fg-muted',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
}
const DOT: Record<LollipopRankingTone, string> = {
  accent: 'bg-accent',
  neutral: 'bg-fg-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function RankingChart({ items, statuses, domain, selected, onSelect, copy, locale, heading: Heading }: RankingChartProps) {
  const headingId = useId()
  const signed = numberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' })
  const tick = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' })
  const target = numberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  const count = numberFormat(locale)
  const at = items.find((item) => item.id === selected)
  const toneOf = (item: LollipopRankingItem) => statusOf(item, statuses)?.tone ?? 'neutral'
  const [low, high] = domain
  const ticks = [low, (low + 0) / 2, 0, (high + 0) / 2, high]

  return (
    <section aria-labelledby={headingId} className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Eyebrow id={headingId} render={<Heading />}>
          {copy.index}
        </Eyebrow>
        <p className="min-h-5 truncate text-ui-sm text-fg-muted tabular-nums" aria-live="polite">
          {at && (
            <>
              <span className="text-fg">{at.name}</span> · <span className={cn('font-mono', TEXT[toneOf(at)])}>{signed.format(at.value)}</span> ·{' '}
              {target.format(at.target)} · {copy.period(at.period)} · {at.owner.name}
            </>
          )}
        </p>
      </div>
      <LollipopChart
        data={items.map((item) => ({ id: item.id, label: item.name, value: item.value, tone: toneOf(item) }))}
        sort="ascending"
        domain={domain}
        ticks={ticks}
        value={selected}
        onValueChange={(id) => id && onSelect(id)}
        formatValue={(v) => signed.format(v)}
        formatTick={(v) => tick.format(v)}
        locale={locale}
        label={copy.indexLabel}
        className="h-auto min-h-56 flex-1"
      />
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
        {[...statuses].reverse().map((status) => (
          <li key={status.id} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-full', DOT[status.tone])} />
            {status.label}
            <span className="font-mono text-fg tabular-nums">
              {count.format(items.filter((item) => statusOf(item, statuses)?.id === status.id).length)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
