'use client'

import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '@youj/react/lib/utils'
import { Eyebrow } from '@youj/react/components/ui/typography'
import type { Breakdown, Driver } from '../data'
import { driverTone, KICKER, usd, whole } from '../format'
import { FigureHead } from './figure-head'

/* What's behind a driver, in place of the products when the page is turned
 * to one: its breakdown as bars on a shared scale (they grow in turn), the
 * facts, set like the week's figures, and what to do about it. */

const money = (n: number) => (n < 0 ? `−${usd.format(-n)}` : usd.format(n))

function Bars({ breakdown, tone }: { breakdown: Breakdown; tone: string }) {
  const k = useYouj()
  const max = Math.max(...breakdown.rows.map((r) => Math.abs(r.value)))
  return (
    <ul aria-label={breakdown.title} className="flex flex-col gap-4">
      {breakdown.rows.map((r, i) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2">
          <span className="truncate text-ui-lg text-fg">{r.label}</span>
          <span className="flex items-baseline gap-2.5 tabular-nums">
            {r.note && <span className="text-ui-sm text-fg-muted">{r.note}</span>}
            <span className="text-ui-lg font-semibold text-fg">{breakdown.unit === 'currency' ? money(r.value) : whole.format(r.value)}</span>
          </span>
          <span aria-hidden className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-well">
            <motion.span
              className={cn('block h-full origin-left rounded-full rtl:origin-right', r.value < 0 ? 'bg-danger' : tone)}
              style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}
              initial={k.reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={k.reduced ? { type: false } : { ...k.tween('slow', 'emphasized'), delay: k.duration('fast') + i * k.stagger('base') }}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DriverDetail({ driver }: { driver: Driver }) {
  return (
    <section aria-label={`Behind ${driver.short}`} className="grid gap-x-14 gap-y-10 pt-10 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <FigureHead number="Fig. 3" title={driver.breakdown.title} />
        <Bars breakdown={driver.breakdown} tone={driverTone(driver)} />
      </div>
      <div className="flex flex-col gap-8 lg:col-span-5">
        <dl className="flex flex-col">
          {driver.facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-2 border-b border-line py-2 first:border-t">
              <dt className="flex min-w-0 flex-1 items-baseline gap-2 text-ui-lg text-fg-muted">
                <span className="shrink-0">{fact.label}</span>
                <span aria-hidden className="min-w-4 flex-1 -translate-y-[0.3em] border-b border-dotted border-line-strong" />
              </dt>
              <dd className="text-ui-lg font-semibold text-fg tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2 border-s-2 border-accent ps-4">
          <Eyebrow render={<p />} className={KICKER}>What to do</Eyebrow>
          <p className="text-lg leading-relaxed text-pretty text-fg">{driver.next}</p>
        </div>
      </div>
    </section>
  )
}
