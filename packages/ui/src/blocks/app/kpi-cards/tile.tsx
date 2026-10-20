'use client'

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { InfoIcon } from '@youj/icons'
import { Stat, StatBars, StatDelta, StatValue } from '../../../components/ui/stat-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, numberFormat } from '../../../lib/utils'
import { headline, type Kpi, type KpiCardsCopy, type Variant } from './data'
import { Trend } from './trend'

/* One KPI: its label (with a tip for its definition), the figure and its
 * change, and in the `trend` and `bars` looks its period as a picture. The
 * picture is a slider: pointer, finger or arrow keys pick a bucket, and the
 * board puts the crosshair on that bucket in every tile, so each figure
 * reads the same day. The resting figures stay in place, hidden, while a
 * bucket is read, so letting go shows them again without a roll. */

const COLOR = (tone: Kpi['tone'], index: number) =>
  tone === 'neutral' ? 'var(--color-fg)' : `var(--color-${tone ?? `chart-${(index % 5) + 1}`})`

interface TileProps {
  kpi: Kpi
  index: number
  variant: Variant
  partial: boolean
  comparison: string
  /** The bucket under the board's crosshair. */
  active: number | null
  onActiveChange: (index: number | null) => void
  /** A bucket's date in full, and the first and last for the axis. */
  dateOf: (index: number) => string
  ends: [string, string]
  loading: boolean
  copy: KpiCardsCopy
}

function Tile({ kpi, index, variant, partial, comparison, active, onActiveChange, dateOf, ends, loading, copy }: TileProps) {
  const ref = useRef<HTMLDivElement>(null)
  const n = kpi.series.length
  const value = headline(kpi.series, kpi.aggregate, kpi.value)
  const before = kpi.previous ? headline(kpi.previous, kpi.aggregate, kpi.previousValue) : kpi.previousValue
  const change = before ? value / before - 1 : undefined
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const figure = numberFormat(copy.locale, kpi.format)
  const at = active !== null && active < n ? active : null
  const prior = at === null ? undefined : kpi.previous?.[at]
  const shift = at === null || !prior ? undefined : kpi.series[at]! / prior - 1
  const last = at === n - 1 && partial
  const color = COLOR(kpi.tone, index)

  const changeText = (c: number | undefined) => (c === undefined || Math.abs(c) < 0.0005 ? '' : (c > 0 ? copy.up : copy.down)(percent.format(Math.abs(c))))
  const valueText = (i: number) => {
    const p = kpi.previous?.[i]
    return copy.point(dateOf(i), figure.format(kpi.series[i] ?? 0), i === n - 1 && partial ? copy.soFar : p ? changeText(kpi.series[i]! / p - 1) : '')
  }

  /** The bucket nearest the pointer: by the bars' own centres, or along the line. */
  const indexAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || box.width <= 0 || n < 1) return null
    const bars = ref.current!.querySelectorAll('[data-slot=stat-bar]')
    if (bars.length === n) {
      let best = 0
      bars.forEach((bar, i) => {
        const r = bar.getBoundingClientRect()
        const b = bars[best]!.getBoundingClientRect()
        if (Math.abs(r.left + r.width / 2 - clientX) < Math.abs(b.left + b.width / 2 - clientX)) best = i
      })
      return best
    }
    return Math.round(Math.min(1, Math.max(0, (clientX - box.left) / box.width)) * (n - 1))
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && event.buttons === 0) return
    const i = indexAt(event.clientX)
    if (i !== null && i !== active) onActiveChange(i)
  }
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = at ?? n - 1
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowUp' ? Math.min(n - 1, from + 1)
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? Math.max(0, from - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? n - 1
      : undefined
    if (event.key === 'Escape' && at !== null) {
      event.preventDefault()
      onActiveChange(null)
    } else if (next !== undefined) {
      event.preventDefault()
      onActiveChange(next)
    }
  }

  const info = kpi.description ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={copy.about(kpi.label, kpi.description)}
            className="grid size-6 place-items-center rounded-sm text-fg-subtle outline-hidden transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring"
          />
        }
      >
        <InfoIcon size={14} />
      </TooltipTrigger>
      <TooltipContent className="max-w-56 font-normal">{kpi.description}</TooltipContent>
    </Tooltip>
  ) : undefined

  return (
    <Stat label={kpi.label} action={info} loading={loading} data-yj-kpi={kpi.id} className={cn('h-full', variant !== 'minimal' && 'own:gap-3')}>
      <div className="grid min-w-0">
        <div className={cn('col-start-1 row-start-1 flex min-w-0 flex-col gap-1', at !== null && 'invisible')}>
          <StatValue value={value} format={kpi.format} unit={kpi.unit} locale={copy.locale} />
          {change !== undefined && (
            <StatDelta value={change} invert={kpi.invert} locale={copy.locale}>
              {comparison}
            </StatDelta>
          )}
        </div>
        {at !== null && (
          // Keyed by the bucket, so each reading is set at once, in the same type as the figure it stands in for.
          <div aria-hidden data-slot="kpi-reading" className="col-start-1 row-start-1 flex min-w-0 flex-col gap-1">
            <StatValue key={at} value={kpi.series[at] ?? 0} from={kpi.series[at] ?? 0} format={kpi.format} unit={kpi.unit} locale={copy.locale} />
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-ui-sm">
              <span className="font-medium text-fg">{dateOf(at)}</span>
              {last ? <span className="text-fg-muted">{copy.soFar}</span> : shift !== undefined && <StatDelta key={at} value={shift} invert={kpi.invert} locale={copy.locale} />}
            </span>
          </div>
        )}
      </div>

      {variant !== 'minimal' && n > 0 && (
        <div className="flex flex-col gap-1.5">
          <div ref={ref} className="relative" style={{ '--stat-tone': color } as CSSProperties}>
            {variant === 'trend' ? (
              <Trend data={kpi.series} previous={kpi.previous} partial={partial} color={color} active={at} />
            ) : (
              <StatBars data={kpi.series} previous={kpi.previous} tone={kpi.tone ?? (`chart-${(index % 5) + 1}` as Kpi['tone'])} highlight={at ?? n - 1} className="own:mt-0 own:h-12" />
            )}
            <div
              role="slider"
              tabIndex={0}
              aria-label={copy.scrub(kpi.label)}
              aria-valuemin={0}
              aria-valuemax={n - 1}
              aria-valuenow={at ?? n - 1}
              aria-valuetext={valueText(at ?? n - 1)}
              data-slot="kpi-scrub"
              className="absolute -inset-y-1 inset-x-0 cursor-crosshair touch-pan-y rounded-sm outline-hidden focus-ring"
              onPointerDown={(event) => onActiveChange(indexAt(event.clientX))}
              onPointerMove={move}
              onPointerLeave={() => onActiveChange(null)}
              onPointerCancel={() => onActiveChange(null)}
              onFocus={() => at === null && onActiveChange(n - 1)}
              onBlur={() => onActiveChange(null)}
              onKeyDown={keys}
            />
          </div>
          <div aria-hidden dir="ltr" className="flex justify-between gap-2 text-ui-xs text-fg-subtle tabular-nums">
            <span>{ends[0]}</span>
            <span>{ends[1]}</span>
          </div>
        </div>
      )}
    </Stat>
  )
}

export { Tile }
