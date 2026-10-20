'use client'

import { useEffect, useRef, useState } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { BellIcon, HistoryIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Sparkline } from '../../../components/ui/sparkline'
import { cn } from '../../../lib/utils'

/* The explorer's pictures, one per feature. Each is decorative (the panel's
 * text says what it shows) and plays once when its panel opens; the log
 * stream keeps streaming while it's shown. Reduced motion: drawn in place. */

const LOG_POOL = [
  { level: 'info', path: 'GET /checkout', status: 200, ms: 38, region: 'fra1' },
  { level: 'info', path: 'POST /api/cart', status: 201, ms: 64, region: 'iad1' },
  { level: 'warn', path: 'GET /api/search?q=tote', status: 429, ms: 12, region: 'sfo1' },
  { level: 'info', path: 'GET /products/linen-tote', status: 200, ms: 41, region: 'hnd1' },
  { level: 'error', path: 'POST /api/checkout', status: 502, ms: 812, region: 'iad1' },
  { level: 'info', path: 'GET /', status: 200, ms: 22, region: 'gru1' },
  { level: 'info', path: 'GET /api/session', status: 200, ms: 9, region: 'fra1' },
] as const

const TONE = { info: 'secondary', warn: 'warning', error: 'danger' } as const

export function LogsVisual({ status = 'Live · all regions · production' }: { status?: string }) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const [head, setHead] = useState(0)
  useEffect(() => {
    if (k.reduced || !inView) return
    const id = setInterval(() => setHead((h) => h + 1), 1200 * k.timeScale)
    return () => clearInterval(id)
  }, [k.reduced, inView, k.timeScale])
  const lines = Array.from({ length: 7 }, (_, i) => {
    const n = head + 6 - i
    return { n, ...LOG_POOL[n % LOG_POOL.length]! }
  })
  return (
    <MotionFeatures features="max">
      <div ref={ref} className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-canvas font-mono text-ui-xs">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 font-sans text-ui-sm text-fg-muted">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full bg-success" />
          </span>
          {status}
        </div>
        <ul className="flex flex-col">
          {lines.map((line) => (
            <m.li
              key={line.n}
              layout="position"
              initial={k.reduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={k.spring('smooth')}
              className="flex items-center gap-3 border-b border-line-subtle px-3 py-2 last:border-b-0"
            >
              <span className="w-14 shrink-0 text-fg-muted tabular-nums">12:04:{String(10 + (line.n % 50)).padStart(2, '0')}</span>
              <Badge variant={TONE[line.level]} className="w-12 justify-center font-mono uppercase">
                {line.level}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-fg">{line.path}</span>
              <span
                className={cn(
                  'tabular-nums max-sm:hidden',
                  line.status >= 500 ? 'text-danger-text' : line.status >= 400 ? 'text-warning-text' : 'text-fg-muted',
                )}
              >
                {line.status}
              </span>
              <span className="w-12 text-end text-fg-muted tabular-nums">{line.ms} ms</span>
            </m.li>
          ))}
        </ul>
      </div>
    </MotionFeatures>
  )
}

const SPANS = [
  { name: 'POST /api/checkout', start: 0, width: 100, ms: 812, depth: 0 },
  { name: 'auth.verify', start: 1, width: 4, ms: 31, depth: 1 },
  { name: 'db.query orders', start: 6, width: 12, ms: 96, depth: 1 },
  { name: 'payments.charge', start: 19, width: 74, ms: 604, depth: 1, slow: true },
  { name: 'retry #1', start: 48, width: 44, ms: 356, depth: 2, slow: true },
  { name: 'render receipt', start: 94, width: 5, ms: 38, depth: 1 },
]

export function TracesVisual() {
  const k = useYouj()
  return (
    <MotionFeatures>
      <div className="flex h-full flex-col gap-1 rounded-lg border border-line bg-canvas p-3">
        <div className="mb-1 grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 text-ui-xs text-fg-muted tabular-nums max-sm:grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)]">
          <span>Span</span>
          <span className="flex justify-between">
            <span>0 ms</span>
            <span>406 ms</span>
            <span>812 ms</span>
          </span>
        </div>
        {SPANS.map((span, i) => (
          <div key={span.name} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)]">
            <span className="truncate text-ui-xs text-fg" style={{ paddingInlineStart: `${span.depth * 0.75}rem` }}>
              {span.name}
            </span>
            <span className="relative h-7">
              <m.span
                className={cn(
                  'absolute inset-y-0 flex items-center rounded-sm px-1.5 text-ui-xs whitespace-nowrap tabular-nums ltr:origin-left rtl:origin-right',
                  span.slow ? 'bg-warning-line text-warning-text' : 'bg-accent-subtle text-accent-text',
                )}
                style={{ insetInlineStart: `${span.start}%`, width: `${span.width}%` }}
                initial={k.reduced ? false : { scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ ...k.tween('slow', 'enter'), delay: i * k.stagger('loose') }}
              >
                {span.width > 10 && `${span.ms} ms`}
              </m.span>
            </span>
          </div>
        ))}
        <p className="mt-auto flex items-center gap-2 px-1 pt-2 text-ui-xs text-fg-muted">
          <span className="size-2 rounded-full bg-warning" />
          payments.charge retried once: 604 ms of 812 ms
        </p>
      </div>
    </MotionFeatures>
  )
}

const VITALS = [
  { name: 'LCP', label: 'Largest contentful paint', value: 1.2, unit: 's', at: 24, digits: 1 },
  { name: 'INP', label: 'Interaction to next paint', value: 84, unit: 'ms', at: 17, digits: 0 },
  { name: 'CLS', label: 'Cumulative layout shift', value: 0.02, unit: '', at: 8, digits: 2 },
]

export function VitalsVisual() {
  const k = useYouj()
  return (
    <MotionFeatures>
      <div className="flex h-full flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {VITALS.map((v, i) => (
            <div key={v.name} className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-canvas p-2.5 sm:p-3">
              <div className="flex items-center justify-between">
                <span className="text-ui-sm font-medium text-fg">{v.name}</span>
                <Badge variant="success" className="max-sm:hidden">
                  Good
                </Badge>
              </div>
              <p className="flex items-baseline gap-1">
                <span className="text-xl font-semibold sm:text-2xl tracking-tight text-fg tabular-nums">
                  <Counter value={v.value} inView={false} format={{ minimumFractionDigits: v.digits, maximumFractionDigits: v.digits }} />
                </span>
                <span className="text-ui-sm text-fg-muted">{v.unit}</span>
              </p>
              <span className="relative flex h-1.5 gap-0.5 overflow-visible">
                <span className="h-full flex-[5] rounded-s-full bg-success-line" />
                <span className="h-full flex-[3] bg-warning-line" />
                <span className="h-full flex-[2] rounded-e-full bg-danger-line" />
                <m.span
                  className="absolute -top-1 h-3.5 w-1 rounded-full bg-fg ring-2 ring-canvas"
                  style={{ insetInlineStart: `${v.at}%` }}
                  initial={k.reduced ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...k.spring('settle'), delay: k.duration('slow') + i * k.stagger('loose') }}
                />
              </span>
              <span className="truncate text-ui-xs text-fg-muted max-sm:hidden">{v.label}, p75</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
          <span className="flex items-center justify-between text-ui-xs text-fg-muted">
            <span>LCP by deploy, /checkout</span>
            <span className="text-success-text">−0.6 s since dpl_31aa</span>
          </span>
          <Sparkline data={[2.1, 2.0, 1.9, 2.2, 1.8, 1.6, 1.7, 1.5, 1.4, 1.3, 1.2]} className="h-16 w-full flex-1" />
        </div>
      </div>
    </MotionFeatures>
  )
}

const ERRORS = [0.4, 0.5, 0.3, 0.6, 0.5, 0.4, 0.7, 1.1, 1.9, 2.8, 3.4]

export function AlertsVisual() {
  const k = useYouj()
  return (
    <MotionFeatures>
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
          <span className="flex items-center justify-between gap-2 text-ui-xs text-fg-muted">
            <span className="truncate">Error rate, api · alert above 2%</span>
            <Badge variant="danger" className="tabular-nums">
              3.4%
            </Badge>
          </span>
          <span className="relative block min-h-24 flex-1">
            <Sparkline data={ERRORS} domain={[0, 4]} color="var(--color-danger)" className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-danger-line" />
          </span>
        </div>
        <m.div
          className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 shadow-md"
          initial={k.reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...k.spring('settle'), delay: k.duration('deliberate') }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-danger-subtle text-danger-text">
            <BellIcon size={16} trigger={k.reduced ? 'none' : 'mount'} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-ui-sm font-medium text-fg">Error rate 3.4% on api</span>
            <span className="truncate text-ui-xs text-fg-muted">Since dpl_8c1e · paged Mara Okafor · #incidents</span>
            <span className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-ui-xs font-medium text-on-accent">
                <HistoryIcon size={13} /> Roll back to dpl_5b90
              </span>
              <span className="inline-flex h-7 items-center rounded-md border border-line px-2.5 text-ui-xs text-fg">Acknowledge</span>
            </span>
          </span>
        </m.div>
      </div>
    </MotionFeatures>
  )
}
