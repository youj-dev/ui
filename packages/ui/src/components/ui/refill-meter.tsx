'use client'

import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { refillMeterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { clamp, cn, numberFormat } from '../../lib/utils'

/* A rate limit's token bucket, as cells you can count: each cell holds a
 * token (or a share of the capacity), lit while it's in the bucket. Requests
 * spend tokens from the edge; the bucket earns them back at the refill rate,
 * live, so the level keeps climbing between the updates you give it.
 * - The edge cell charges: it fills from its foot as the next token accrues,
 *   so you can watch the refill rate, then locks in and the next begins.
 * - A burst marker names the room a client should keep for its largest
 *   batch. Under it the lit cells turn to the warning tone; empty, the
 *   track tints danger and the bucket reads "Empty".
 * - Motion: a spend drains the cells from the edge inward at a constant
 *   rate (the deliberate token spread over the row), like a level falling;
 *   a jump up lights them outward the same way. A new value mid-drain
 *   carries on from where the edge is. The refill clock follows the time
 *   scale, stops while the bucket is full, off screen or in a hidden tab,
 *   and catches up when it's back.
 * - Reduced motion: the level still refills (it's data), a whole token at a
 *   time, with no charging cell and no drain; cells change in place.
 * - Semantics: a `meter` named by its label, spoken as "42 of 60 tokens,
 *   refilling 10 a second", plus the burst and empty states. The cells run
 *   from the inline start, so the bucket reads right to left in RTL. */

type BucketState = 'ok' | 'low' | 'empty'

interface RefillMeterProps extends Omit<MeterPrimitive.Root.Props, 'value' | 'min' | 'max' | 'format' | 'children'> {
  /** Tokens in the bucket when it was measured (at `updatedAt`). */
  value: number
  /** The bucket's size: the most tokens it holds, so the largest burst it lets through at once. */
  capacity: number
  /** Tokens earned back each second. Default 0: no refill. */
  refillRate?: number
  /** When `value` was measured, as a `Date.now()` time, so the refill counts from then. Default: when `value` last changed. */
  updatedAt?: number
  /** A marker at this many tokens: the burst a client should keep room for. Under it the lit cells turn to the warning tone. */
  burst?: number
  /** How many cells. Default: one per token, up to 60. */
  segments?: number
  /** The visible name on the start side. Default: the labels' "Tokens". */
  label?: ReactNode
  /** Default: the YoujProvider locale. */
  locale?: string
}

const OFF = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
const FILL: Record<BucketState, string> = { ok: 'bg-fg', low: 'bg-warning', empty: 'bg-danger' }
const now = () => (typeof performance === 'undefined' ? 0 : performance.now())

interface Snapshot {
  /** Whole cells lit. */
  lit: number
  /** Whole tokens in the bucket. */
  tokens: number
  /** Time to full, in tenths of a second (0 when full or not refilling). */
  eta: number
}

function snapshotOf(level: number, per: number, cells: number, capacity: number, rate: number): Snapshot {
  const lit = Math.min(cells, Math.floor(level / per + 1e-9))
  const eta = rate > 0 && level < capacity ? Math.ceil(((capacity - level) / rate) * 10) : 0
  return { lit, tokens: Math.floor(level + 1e-9), eta }
}

function RefillMeter({
  value,
  capacity,
  refillRate = 0,
  updatedAt,
  burst,
  segments,
  label,
  locale: localeProp,
  className,
  style,
  ...props
}: RefillMeterProps) {
  const k = useYouj()
  const labels = useComponentLabels(refillMeterLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)

  const cap = Math.max(1, capacity)
  const cells = Math.max(1, Math.round(segments ?? Math.min(cap, 60)))
  const per = cap / cells
  const start = clamp(value, 0, cap)
  const rate = Math.max(0, refillRate)
  const [snap, setSnap] = useState(() => snapshotOf(start, per, cells, cap, rate))

  // The bucket as last measured; the level at any moment is this plus the refill since.
  const model = useRef({ base: start, at: 0 })
  useLayoutEffect(() => {
    model.current = { base: start, at: updatedAt ?? Date.now() }
  }, [start, updatedAt])

  // The refill clock: the level from the model each frame, the charging cell's
  // fill written straight to a CSS variable, and a render only when a whole
  // cell, token or tenth of a second of the countdown changes.
  useEffect(() => {
    const root = ref.current
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let onScreen = true
    const speed = rate / Math.max(0.01, k.timeScale)
    const tick = () => {
      frame = 0
      timer = undefined
      const { base, at } = model.current
      const level = Math.min(cap, base + (speed * Math.max(0, Date.now() - at)) / 1000)
      const next = snapshotOf(level, per, cells, cap, speed)
      root?.style.setProperty('--bucket-charge', k.reduced || next.lit >= cells ? '0' : (level / per - next.lit).toFixed(3))
      setSnap((s) => (s.lit === next.lit && s.tokens === next.tokens && s.eta === next.eta ? s : next))
      if (level >= cap || speed <= 0 || !onScreen || document.hidden) return
      // Reduced motion refills a token at a time, so there's no need to paint every frame.
      if (k.reduced) timer = setTimeout(tick, 100)
      else frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      if (!frame && !timer) tick()
    }
    tick()
    const observer =
      typeof IntersectionObserver === 'undefined' || !root
        ? undefined
        : new IntersectionObserver(([entry]) => {
            onScreen = entry?.isIntersecting ?? true
            if (onScreen) resume()
          })
    if (root) observer?.observe(root)
    const onVisibility = () => !document.hidden && resume()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [start, updatedAt, rate, cap, per, cells, k.reduced, k.timeScale])

  // The drain and the fill run from where the edge is on screen: the last
  // sweep's start plus the cells it has crossed since (see SegmentedMeter).
  const lit = snap.lit
  const step = k.reduced ? 0 : k.ms('deliberate') / cells
  const sweep = useRef({ from: lit, to: lit, at: 0 })
  const { from: prevFrom, to: prevTo, at } = sweep.current
  const crossed = step && at ? Math.floor((now() - at) / step) : Infinity
  const edge = prevTo >= prevFrom ? Math.min(prevTo, prevFrom + crossed) : Math.max(prevTo, prevFrom - crossed)
  // A one-cell step is the refill locking a charged cell in: it lands at once.
  const from = lit === prevTo ? prevFrom : Math.abs(lit - edge) <= 1 ? lit : edge
  useLayoutEffect(() => {
    if (lit !== sweep.current.to) sweep.current = { from, to: lit, at: now() }
  })

  const number = useMemo(() => numberFormat(locale, { maximumFractionDigits: 1 }), [locale])
  const signed = useMemo(() => numberFormat(locale, { signDisplay: 'always', maximumFractionDigits: 1 }), [locale])
  const seconds = useMemo(() => numberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow', maximumFractionDigits: 1 }), [locale])
  const minutes = useMemo(() => numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 1 }), [locale])

  const reserve = burst != null && burst > 0 && burst < cap ? burst : undefined
  const state: BucketState = snap.tokens <= 0 ? 'empty' : reserve != null && snap.tokens < reserve ? 'low' : 'ok'
  const full = snap.tokens >= cap
  const eta = snap.eta / 10
  const valueText = [
    labels.bucketValueText(number.format(snap.tokens), number.format(cap), number.format(rate)),
    state === 'low' && reserve != null ? labels.bucketUnderBurst(number.format(reserve)) : null,
    state === 'empty' ? labels.bucketEmpty : null,
  ]
    .filter(Boolean)
    .join(', ')

  // The marker sits in the gap after the cell its value ends, and its flag turns inward near the ends.
  const at_ = reserve != null ? reserve / cap : 0
  const flagAlign = at_ > 0.8 ? 'end' : 'start'

  return (
    <MeterPrimitive.Root
      ref={ref}
      value={snap.tokens}
      min={0}
      max={cap}
      locale={locale}
      getAriaValueText={() => valueText}
      data-slot="refill-meter"
      data-state={state}
      data-full={full || undefined}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex w-full min-w-0 flex-col gap-2.5 [--bucket-gap:2px]', className)}
      style={style}
      {...props}
    >
      <div data-slot="refill-meter-header" className="own:flex items-baseline justify-between gap-3">
        <MeterPrimitive.Label data-slot="refill-meter-label" className={cn('min-w-0 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
          {label ?? labels.bucketTokens}
        </MeterPrimitive.Label>
        {/* Figures read left to right in every script, so the ratio keeps its order in RTL. */}
        <span data-slot="refill-meter-value" dir="ltr" className="shrink-0 own:font-mono own:text-ui-lg own:font-medium own:tabular-nums">
          <span className={cn('transition-colors yj-duration-fast ease-standard', state === 'empty' ? 'own:text-danger-text' : 'own:text-fg')}>
            {number.format(snap.tokens)}
          </span>
          <span data-slot="refill-meter-capacity" className="own:text-fg-muted">
            {' / '}
            {number.format(cap)}
          </span>
        </span>
      </div>

      <div data-slot="refill-meter-gauge" aria-hidden className="relative own:flex flex-col gap-1.5">
        {reserve != null && (
          <div data-slot="refill-meter-flags" className="relative h-4">
            <span
              data-slot="refill-meter-burst-flag"
              data-align={flagAlign}
              className={cn(
                'absolute bottom-0 own:flex items-baseline gap-1.5 own:text-ui-xs own:leading-none whitespace-nowrap own:text-warning-text',
                flagAlign === 'end' ? '-translate-x-full pe-2 rtl:translate-x-full' : 'ps-2',
              )}
              style={{ insetInlineStart: `calc(${at_} * (100% + var(--bucket-gap)) - var(--bucket-gap) / 2)` }}
            >
              <span className={VOICE}>{labels.bucketBurst}</span>
              <span className="own:font-mono own:tabular-nums">{number.format(reserve)}</span>
            </span>
          </div>
        )}
        <div data-slot="refill-meter-track" className="relative own:flex h-7 gap-(--bucket-gap)">
          {Array.from({ length: cells }, (_, i) => {
            const on = i < lit
            const charging = i === lit && !full && rate > 0 && !k.reduced
            // Draining runs from the old edge inward; filling runs outward from it.
            const delay = lit < from && i >= lit && i < from ? (from - 1 - i) * step : lit > from && i >= from && i < lit ? (i - from) * step : 0
            return (
              <span
                key={i}
                data-slot="refill-meter-cell"
                data-state={on ? 'on' : charging ? 'charging' : 'off'}
                className={cn(
                  'relative min-w-0 flex-1 overflow-hidden rounded-[min(var(--radius-xs),2px)] transition-[background-color] yj-duration-fast ease-standard',
                  state === 'empty' ? 'bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)]' : OFF,
                )}
              >
                <span
                  data-slot="refill-meter-fill"
                  className={cn(
                    'absolute inset-0 origin-bottom',
                    FILL[state],
                    charging
                      ? 'transition-[background-color] yj-duration-fast ease-standard'
                      : 'transition-[scale,background-color] yj-duration-fast ease-standard',
                  )}
                  style={{
                    scale: on ? '1 1' : charging ? '1 var(--bucket-charge, 0)' : '1 0',
                    ...(delay ? { transitionDelay: `${Math.round(delay)}ms` } : null),
                  }}
                />
              </span>
            )
          })}
          {reserve != null && (
            <span
              data-slot="refill-meter-burst"
              className="pointer-events-none absolute -top-5.5 -bottom-1.5 w-0.5 -translate-x-1/2 rounded-full bg-warning shadow-[0_0_0_2px_var(--color-surface)] rtl:translate-x-1/2"
              style={{ insetInlineStart: `calc(${at_} * (100% + var(--bucket-gap)) - var(--bucket-gap) / 2)` }}
            />
          )}
        </div>
        {reserve != null && (
          // The reserve: a rail under the cells a burst needs.
          <span
            data-slot="refill-meter-reserve"
            className="h-0.5 rounded-full bg-[color-mix(in_oklab,var(--color-warning)_45%,transparent)]"
            style={{ width: `calc(${at_} * (100% + var(--bucket-gap)) - var(--bucket-gap))` }}
          />
        )}
      </div>

      <div data-slot="refill-meter-footer" className="own:flex items-baseline justify-between gap-3 own:text-ui-sm">
        {/* A bucket that doesn't refill has no rate to state. */}
        {rate > 0 ? (
          <span data-slot="refill-meter-refill" className="own:flex items-baseline gap-2">
            <span data-slot="refill-meter-term" className={cn('own:text-fg-muted', VOICE)}>
              {labels.bucketRefill}
            </span>
            <span className="own:font-mono own:text-fg own:tabular-nums">
              <bdi>{signed.format(rate)}/s</bdi>
            </span>
          </span>
        ) : (
          <span />
        )}
        {/* Refilling, the countdown to full; full, a word; empty with no refill, the danger word. */}
        <span data-slot="refill-meter-eta" className="own:flex items-baseline gap-2">
          {full ? (
            <span data-slot="refill-meter-term" className={cn('own:text-fg-muted', VOICE)}>
              {labels.bucketFull}
            </span>
          ) : rate > 0 ? (
            <>
              <span data-slot="refill-meter-term" className={cn('own:text-fg-muted', VOICE)}>
                {labels.bucketFullIn}
              </span>
              <span className="own:font-mono own:text-fg own:tabular-nums">
                <bdi>{eta >= 60 ? minutes.format(eta / 60) : seconds.format(eta)}</bdi>
              </span>
            </>
          ) : state === 'empty' ? (
            <span className={cn('own:text-danger-text', VOICE)}>{labels.bucketEmpty}</span>
          ) : null}
        </span>
      </div>
    </MeterPrimitive.Root>
  )
}

export { RefillMeter, type RefillMeterProps }
