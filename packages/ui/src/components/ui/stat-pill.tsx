'use client'

import { useMemo, useRef, type ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { statPillLabels, useComponentLabels } from '@youj/core/labels'
import { useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'
import { Capsule, CapsuleLabel, type CapsuleProps } from './capsule'
import { Sparkline } from './sparkline'

/* One live figure you read at a glance, sized to sit in a toolbar or over a
 * canvas: an icon in a recessed disc, the figure's name as a mono eyebrow,
 * the value in mono with its unit small and muted, then how it's moving: a
 * delta (a small arrow and the change, tinted good or bad by `better`) or a
 * word-sized trend whose dot sits on the latest reading, or both.
 * Motion: a new value counts to itself from wherever it is (Counter, on the
 * deliberate token), and the trend morphs point by point with its dot gliding
 * to the new reading; the first render is still. Reduced motion: values and
 * the trend land at once. The delta's direction is spoken ("Up 4.2"), not
 * left to the arrow's color. */

interface StatPillProps extends Omit<CapsuleProps, 'children'> {
  /** What the figure is: the eyebrow before it. Keep it short ("CPU", "Tempo"). */
  label: string
  value: number
  /** Intl.NumberFormat options for the value: compact notation, fraction digits, percent. Default: the value’s own decimals, so a count never passes through fractions. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Set small and muted after the value: "ms", "fps", "GB". */
  unit?: ReactNode
  /** A decorative icon in a disc at the start. */
  icon?: ReactNode
  /** The change since the last reading, signed, in the value's terms: 4.2 reads "▲ 4.2". */
  delta?: number
  /** Intl.NumberFormat options for the delta. Default: up to one decimal. */
  deltaFormat?: Intl.NumberFormatOptions
  /** Which way is good: `up` (default, a rise is tinted success), `down` (latency, errors: a fall is), or `none` (loudness, temperature: a change is only news, and stays neutral). */
  better?: 'up' | 'down' | 'none'
  /** Recent readings, oldest first: a word-sized trend with a dot on the latest. */
  trend?: readonly number[]
}

function StatPill({ label, value, format, locale: localeProp, unit, icon, delta, deltaFormat, better = 'up', trend, className, ...props }: StatPillProps) {
  const labels = useComponentLabels(statPillLabels)
  const locale = useLocale(localeProp)
  // The first reading is shown as it is; only later changes count.
  const first = useRef(value)
  const decimals = Math.min(2, (String(value).split('.')[1] ?? '').length)
  const valueFormat = format ?? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  const deltaText = useMemo(
    () => (delta === undefined ? '' : numberFormat(locale, deltaFormat ?? { maximumFractionDigits: 1 }).format(Math.abs(delta))),
    [delta, deltaFormat, locale],
  )
  const direction = delta === undefined ? undefined : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const tone = direction === undefined || direction === 'flat' || better === 'none' ? 'neutral' : direction === better ? 'good' : 'bad'

  return (
    <Capsule data-slot="stat-pill" className={cn('gap-0 pe-3', !icon && 'ps-1.5', className)} {...props}>
      {icon && (
        <span aria-hidden data-slot="stat-pill-icon" className="own:grid aspect-square h-full shrink-0 place-items-center own:rounded-xl own:bg-band own:text-fg-muted [&_svg]:size-4">
          {icon}
        </span>
      )}
      <CapsuleLabel>{label}</CapsuleLabel>
      <span data-slot="stat-pill-value" dir="ltr" className="own:inline-flex items-baseline gap-1 own:text-ui-lg own:font-medium own:text-fg own:tabular-nums">
        <Counter value={value} from={first.current} format={valueFormat} locale={locale} inView={false} className="own:font-mono" />
        {unit !== undefined && (
          <span data-slot="capsule-unit" className="own:text-ui-sm own:font-normal own:text-fg-muted">
            {unit}
          </span>
        )}
      </span>
      {trend && trend.length > 1 && <Sparkline data={trend} area={false} className="own:ms-3 h-4 w-10 shrink-0" />}
      {direction && (
        <span
          data-slot="stat-pill-delta"
          data-direction={direction}
          data-tone={tone}
          className={cn(
            'own:ms-2.5 own:inline-flex shrink-0 items-center gap-1 own:font-mono own:text-ui-sm own:tabular-nums',
            tone === 'good' ? 'own:text-success' : tone === 'bad' ? 'own:text-danger' : 'own:text-fg-muted',
          )}
        >
          {direction !== 'flat' && (
            <svg aria-hidden viewBox="0 0 8 8" className={cn('size-2 fill-current', direction === 'down' && 'rotate-180')}>
              <path d="M4 1 7.5 7h-7z" />
            </svg>
          )}
          <span className="sr-only">{direction === 'up' ? labels.trendUp : direction === 'down' ? labels.trendDown : labels.trendFlat} </span>
          {direction !== 'flat' && <bdi dir="ltr">{deltaText}</bdi>}
        </span>
      )}
    </Capsule>
  )
}

export { StatPill, type StatPillProps }
