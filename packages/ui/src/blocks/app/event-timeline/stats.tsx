'use client'

import type { CSSProperties } from 'react'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { EventTimelineCopy } from './data'

interface StatsProps {
  stats: { id: string; label: string; name: string; at: number | undefined }[]
  /** When the event began, in ms: each figure is how long after it the phase was reached. */
  start: number
  copy: EventTimelineCopy
  locale: string
}

/** The time each phase took to reach, one cell per phase after the first. */
function Stats({ stats, start, copy, locale }: StatsProps) {
  const duration = new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' })
  const unit = (value: number, u: 'hour' | 'minute' | 'second') => numberFormat(locale, { style: 'unit', unit: u, unitDisplay: 'narrow' }).format(value)
  const span = (ms: number) => {
    const s = Math.round(ms / 1000)
    const m = Math.floor(s / 60)
    return m >= 60 ? duration.format([unit(Math.floor(m / 60), 'hour'), unit(m % 60, 'minute')]) : duration.format([unit(m, 'minute'), unit(s % 60, 'second')])
  }
  return (
    <dl className="grid sm:grid-cols-(--stats)" style={{ '--stats': `repeat(${Math.max(1, stats.length)}, minmax(0, 1fr))` } as CSSProperties}>
      {stats.map((stat, i) => (
        <div
          key={stat.id}
          className={cn(
            'flex items-baseline justify-between gap-3 px-(--card-spacing) py-[calc(var(--ui--panel-y)/2)]',
            i > 0 && 'border-t border-line sm:border-t-0 sm:border-s',
          )}
        >
          <dt>
            <Eyebrow aria-hidden>{stat.label}</Eyebrow>
            <span className="sr-only">{stat.name}</span>
          </dt>
          <dd className={cn('font-mono text-ui-lg tabular-nums', stat.at ? 'text-fg' : 'text-fg-subtle')}>
            {stat.at ? (
              span(stat.at - start)
            ) : (
              <>
                <span aria-hidden>—</span>
                <span className="sr-only">{copy.notYet}</span>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export { Stats }
