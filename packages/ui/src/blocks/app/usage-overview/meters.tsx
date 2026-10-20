'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Counter } from '@youj/motion'
import { Progress } from '../../../components/ui/progress'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { UsageOverviewCopy } from './copy'
import type { UsageMeter } from './data'

const noSubscribe = () => () => {}

/** True once the element has scrolled into view (at once where IntersectionObserver is missing). */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  const unsupported = useSyncExternalStore(
    noSubscribe,
    () => typeof IntersectionObserver === 'undefined',
    () => false,
  )
  useEffect(() => {
    const el = ref.current
    if (!el || unsupported) return
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [unsupported])
  return [ref, seen || unsupported] as const
}

function Meter({ meter, seen, copy, locale }: { meter: UsageMeter; seen: boolean; copy: UsageOverviewCopy; locale: string }) {
  const share = meter.included > 0 ? meter.used / meter.included : 0
  const hot = share >= meter.alert
  const Icon = meter.icon
  const alert = Math.round(meter.alert * 100)
  const fmt = (n: number) => numberFormat(locale, n >= 100_000 ? { notation: 'compact', maximumFractionDigits: 1 } : undefined).format(n)
  return (
    <div role="group" aria-label={meter.label} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <span aria-hidden className={cn('grid size-7 place-items-center rounded-md', hot ? 'bg-warning-subtle text-warning-text' : 'bg-band text-fg-muted')}>
            <Icon size={15} />
          </span>
        )}
        <span className="font-medium text-fg">{meter.label}</span>
        <span className={cn('ms-auto text-ui-sm tabular-nums', hot ? 'text-warning-text' : 'text-fg-muted')}>
          <Counter value={seen ? Math.round(share * 100) : 0} locale={locale} format={{ maximumFractionDigits: 0 }} inView={false} duration="slow" />%
        </span>
      </div>
      <div className="relative">
        <Progress
          value={seen ? Math.min(100, share * 100) : 0}
          aria-label={copy.meterLabel(meter.label, fmt(meter.used), fmt(meter.included), meter.unit)}
          className={cn('[&_[data-slot=progress-track]]:h-2', hot ? '[&_[data-slot=progress-indicator]]:bg-warning' : '[&_[data-slot=progress-indicator]]:bg-fg-subtle')}
        />
        <span
          aria-hidden
          title={copy.alertAt(alert)}
          className="absolute -inset-y-1 w-0.5 rounded-full bg-fg-subtle"
          style={{ insetInlineStart: `${meter.alert * 100}%` }}
        />
      </div>
      <p className="text-ui-sm text-fg-muted tabular-nums">
        <span className="text-fg">{fmt(meter.used)}</span> {copy.meterDetail(fmt(meter.included), meter.unit, alert)}
      </p>
    </div>
  )
}

interface MetersProps {
  copy: UsageOverviewCopy
  locale: string
  meters: UsageMeter[]
  loading?: boolean
}

function Meters({ copy, locale, meters, loading }: MetersProps) {
  const [ref, seen] = useSeen<HTMLDivElement>()
  return (
    <section aria-labelledby="meters-title" aria-busy={loading || undefined} className="@container/meters flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <Eyebrow render={<h2 id="meters-title" />} className="text-ui-lg font-semibold text-fg">
          {copy.included}
        </Eyebrow>
        <Eyebrow>{copy.overage}</Eyebrow>
      </div>
      {/* Two abreast; with 48rem of room, as many as fit at 11rem each (four in a wide column), rather than two stretched ones. */}
      <div ref={ref} className="grid gap-3 sm:grid-cols-2 @3xl/meters:grid-cols-[repeat(auto-fit,minmax(--spacing(44),1fr))]">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-30 rounded-lg" />)
          : meters.map((m) => <Meter key={m.id} meter={m} seen={seen} copy={copy} locale={locale} />)}
      </div>
    </section>
  )
}

export { Meters }
