'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { Counter } from '@youj/motion'
import { distributionStripLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, cssVars, numberFormat } from '../../lib/utils'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { Hatch } from './hatched-bar'

/* How sampled requests spread across latency. Every sample is a dot on a
 * log-scaled strip, stacked into rows where they crowd (a swarm, fattest
 * where most requests land), with the chosen percentiles as hairlines
 * flagged above it and the objective as a dashed line: past it the strip is
 * hatched, and the dots there turn to the warning tone.
 * - Reading: the header gives the share within the objective; each flag
 *   gives a percentile and its latency, the highest in the strongest ink (in
 *   the warning ink once it's past the objective). Flags that would collide
 *   are spread apart and kept inside the strip.
 * - Motion: when it scrolls into view the dots rise from the baseline in a
 *   quick wave along the axis and the markers glide in from the start on the
 *   smooth spring. New samples morph the swarm: the dots are matched by rank,
 *   so each quantile slides to where it now falls, in the same wave, and the
 *   markers retarget from where they are. The share counts to its new value.
 * - Semantics: a figure named by its label and described by a text summary
 *   (the percentiles, and the share within the objective); the dots, ruler
 *   and hatch are decorative, the flags are text.
 * - Reduced motion: drawn in place; new samples land at once.
 * - The axis runs from the inline start, so it reads right to left in RTL. */

interface DistributionStripProps extends Omit<ComponentProps<'figure'>, 'children'> {
  /** Sampled request latencies, in milliseconds. */
  samples: readonly number[]
  /** The latency objective, in milliseconds: a dashed line, the strip past it hatched, and the share of samples within it in the header. */
  slo?: number
  /** The percentiles to mark, 0–100. Default [50, 90, 99]; the highest is drawn strongest. */
  percentiles?: readonly number[]
  /** The axis's ends, in milliseconds. Default: the whole decades around the samples. */
  domain?: readonly [number, number]
  /** How many rows the dots stack into where they crowd; an even number gets one more, so the swarm has a middle. Default 11. */
  rows?: number
  /** Formats a latency for the flags, the ruler, the objective and the summary. Default: milliseconds, and seconds from 1 s, in the locale. */
  format?: (ms: number) => string
  /** The visible name over the strip, which also names the figure. Default: the labels' "Latency distribution". */
  label?: string
}

const DEFAULT_PERCENTILES = [50, 90, 99]
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }
/** A dot's diameter and the row pitch, in px. */
const DOT = 4
const PITCH = 5
/** Room above the swarm, and below it: more when the objective's flag sits there. */
const PAD = 6
const SLO_LANE = 20
/** Before the strip is measured (and on the server) it lays out for this width. */
const FALLBACK_WIDTH = 560
/** The advance of one character of a flag (mono at the ui-xs size), and the least space between two flags, in px. */
const FLAG_CHAR = 6.7
const FLAG_GAP = 10
/** Rails slide by their own width, so they're clipped a few px outside the plot (and positioned, so the clip reaches them). */
const CLIP = 'pointer-events-none absolute -inset-x-2 inset-y-0 overflow-hidden'

/** The p-th percentile of ascending values, interpolated between the nearest ranks. */
function quantile(sorted: readonly number[], p: number) {
  if (!sorted.length) return Number.NaN
  const h = ((sorted.length - 1) * Math.min(100, Math.max(0, p))) / 100
  const lo = Math.floor(h)
  const hi = Math.min(sorted.length - 1, lo + 1)
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!)
}

/** The p-th percentile (0–100) of `samples`, interpolated between the nearest ranks; NaN when there are none. */
function percentileOf(samples: readonly number[], p: number) {
  return quantile(
    [...samples].sort((a, b) => a - b),
    p,
  )
}

/** The whole decades around ascending values: 38–2,400 ms → 10–10,000 ms. */
function decades(sorted: readonly number[]): [number, number] {
  const positive = sorted.filter((v) => v > 0)
  if (!positive.length) return [1, 1000]
  const lo = 10 ** Math.floor(Math.log10(positive[0]!))
  const hi = 10 ** Math.ceil(Math.log10(positive.at(-1)!))
  return [lo, hi > lo ? hi : lo * 10]
}

/** A log ruler: every 1–9 step of each decade in the domain, the decades major. */
function rulerTicks(lo: number, hi: number) {
  const ticks: { value: number; major: boolean }[] = []
  for (let d = Math.floor(Math.log10(lo)); d <= Math.ceil(Math.log10(hi)); d++) {
    for (let n = 1; n <= 9; n++) {
      const value = n * 10 ** d
      if (value >= lo * 0.9999 && value <= hi * 1.0001) ticks.push({ value, major: n === 1 })
    }
  }
  return ticks
}

/** Rows for dots in ascending order: each takes the middle-most row it doesn't overlap, else the one it overlaps least. */
function packRows(px: readonly number[], rows: number) {
  const middle = (rows - 1) / 2
  const order = Array.from({ length: rows }, (_, i) => (i % 2 ? middle - (i + 1) / 2 : middle + i / 2))
  const last = new Array<number>(rows).fill(-Infinity)
  return px.map((x) => {
    let row = -1
    let roomiest = order[0]!
    for (const r of order) {
      if (x - last[r]! >= DOT) {
        row = r
        break
      }
      if (last[r]! < last[roomiest]!) roomiest = r
    }
    const chosen = row < 0 ? roomiest : row
    last[chosen] = x
    return chosen
  })
}

/** Start edges for flags in ascending order: centered on their lines, pushed apart where they'd touch, kept inside the width. */
function spread(flags: readonly { x: number; w: number }[], width: number) {
  const start = flags.map((f) => Math.min(Math.max(0, f.x - f.w / 2), Math.max(0, width - f.w)))
  for (let i = 1; i < start.length; i++) start[i] = Math.max(start[i]!, start[i - 1]! + flags[i - 1]!.w + FLAG_GAP)
  for (let i = start.length - 1; i >= 0; i--) {
    const limit = i === start.length - 1 ? width - flags[i]!.w : start[i + 1]! - FLAG_GAP - flags[i]!.w
    start[i] = Math.max(0, Math.min(start[i]!, limit))
  }
  return start
}

function latencyFormat(locale: string, unitDisplay: 'short' | 'narrow') {
  const fine = numberFormat(locale, { style: 'unit', unit: 'millisecond', unitDisplay, maximumFractionDigits: 1 })
  const ms = numberFormat(locale, { style: 'unit', unit: 'millisecond', unitDisplay, maximumFractionDigits: 0 })
  const s = numberFormat(locale, { style: 'unit', unit: 'second', unitDisplay, maximumSignificantDigits: 3 })
  return (v: number) => (v >= 1000 ? s.format(v / 1000) : v < 10 ? fine.format(v) : ms.format(v))
}

function DistributionStrip({
  samples,
  slo,
  percentiles = DEFAULT_PERCENTILES,
  domain,
  rows: rowsProp = 11,
  format,
  label,
  className,
  ...props
}: DistributionStripProps) {
  const k = useYouj()
  const labels = useComponentLabels(distributionStripLabels)
  const locale = useLocale()
  const labelId = useId()
  const summaryId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const [width, setWidth] = useState(0)

  useResizeMeasure(chartRef, (el) => setWidth((w) => (Math.abs(w - el.clientWidth) < 0.5 ? w : el.clientWidth)), [samples.length > 0])

  const fmt = useMemo(() => format ?? latencyFormat(locale, 'short'), [format, locale])
  const tick = useMemo(() => format ?? latencyFormat(locale, 'narrow'), [format, locale])
  const pName = useMemo(() => {
    const n = numberFormat(locale, { maximumFractionDigits: 1 })
    return (p: number) => `p${n.format(p)}`
  }, [locale])

  const sorted = useMemo(() => samples.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b), [samples])
  const [lo, hi] = domain ?? decades(sorted)
  const decadesSpan = Math.log10(hi) - Math.log10(lo) || 1
  const at = (v: number) => Math.min(1, Math.max(0, (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / decadesSpan))
  const rows = Math.max(1, Math.round(rowsProp)) | 1
  const w = width || FALLBACK_WIDTH

  const dots = useMemo(() => {
    const scale = (v: number) => Math.min(1, Math.max(0, (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / decadesSpan))
    const xs = sorted.map(scale)
    const packed = packRows(
      xs.map((x) => x * w),
      rows,
    )
    return xs.map((x, i) => ({ x, row: packed[i]!, over: slo !== undefined && sorted[i]! > slo }))
  }, [sorted, lo, decadesSpan, w, rows, slo])

  const marks = [...percentiles]
    .sort((a, b) => a - b)
    .map((p) => {
      const value = quantile(sorted, p)
      return { p, value, at: at(value), name: pName(p), text: fmt(value) }
    })
  const top = marks.at(-1)?.p
  const starts = spread(
    marks.map((mark) => ({ x: mark.at * w, w: (mark.name.length + 1 + mark.text.length) * FLAG_CHAR })),
    w,
  )
  const within = slo !== undefined && sorted.length ? sorted.filter((v) => v <= slo).length / sorted.length : undefined
  const sloAt = slo !== undefined ? at(slo) : undefined
  const sloText = slo !== undefined ? labels.latencySloAt(fmt(slo)) : ''
  // The objective's flag reads after its line, or before it when the room past the line is too short.
  const sloBefore = sloAt !== undefined && (1 - sloAt) * w < sloText.length * FLAG_CHAR + 12
  const ticks = rulerTicks(lo, hi)
  const labelled = (value: number, major: boolean) => major || value === lo || value === hi || (decadesSpan <= 2 && /^[25]/.test(String(value)))

  const plotHeight = PAD + rows * PITCH + (sloAt !== undefined ? SLO_LANE : PAD)
  // The wave: each dot waits for its place along the axis, so the rise sweeps from the start.
  const wave = k.reduced ? 0 : k.ms('base')
  const pct = numberFormat(locale, PERCENT)
  const summary = [
    labels.latencySummary(sorted.length, marks.map((mark) => `${mark.name} ${mark.text}`).join(', ')),
    slo !== undefined ? labels.latencyWithin(pct.format(within ?? 0), fmt(slo)) : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <MotionFeatures>
      <figure
        ref={rootRef}
        aria-labelledby={labelId}
        aria-describedby={sorted.length ? summaryId : undefined}
        data-slot="distribution-strip"
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:m-0 own:flex w-full min-w-0 flex-col [--ps-dir:1] rtl:[--ps-dir:-1]', className)}
        {...props}
      >
        <div data-slot="distribution-strip-header" className="own:flex min-w-0 items-baseline justify-between gap-3">
          <span id={labelId} data-slot="distribution-strip-label" className={cn('min-w-0 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
            {label ?? labels.latencyDistribution}
          </span>
          {within !== undefined && (
            <span data-slot="distribution-strip-within" className="own:flex shrink-0 items-baseline gap-2.5">
              <span data-slot="distribution-strip-within-label" className={cn('own:text-ui-sm own:text-fg-muted', VOICE)}>
                {labels.latencyWithinSlo}
              </span>
              <span data-slot="distribution-strip-value" className="own:font-mono own:text-ui-lg own:font-medium own:text-fg own:tabular-nums">
                <Counter value={within} format={PERCENT} locale={locale} duration="deliberate" />
              </span>
            </span>
          )}
        </div>

        {sorted.length === 0 ? (
          <div
            data-slot="distribution-strip-empty"
            className="own:mt-3 own:grid h-20 place-items-center rounded-[min(var(--radius-md),6px)] border border-dashed border-line own:text-ui own:text-fg-muted"
          >
            {labels.noData}
          </div>
        ) : (
          <>
            <div ref={chartRef} data-slot="distribution-strip-chart" className="relative own:mt-2">
              {/* The flags' lane. */}
              <div className="h-5" />
              <div data-slot="distribution-strip-plot" aria-hidden className="relative" style={{ height: plotHeight }}>
                {sloAt !== undefined && sloAt < 1 && (
                  <Hatch
                    tone="warning"
                    data-slot="distribution-strip-over"
                    className="absolute inset-y-0 end-0 rounded-none rounded-e-[min(var(--radius-xs),3px)] opacity-[calc(0.55-0.25*var(--yj-dark))]"
                    style={{ insetInlineStart: `${sloAt * 100}%` }}
                  />
                )}
                {/* Each dot rides a full-width rail slid along the axis (transforms only). The clip, a few px wider than
                    the plot, keeps the rails from widening the page while the dots at the very ends still show whole. */}
                <div className={CLIP}>
                  <div className="absolute inset-x-2" style={{ top: PAD }}>
                    {dots.map((dot, i) => (
                      <span
                        key={i}
                        data-slot="distribution-strip-dot"
                        data-over={dot.over || undefined}
                        className={cn(
                          'absolute start-0 top-0 w-full transition-[translate,opacity] yj-duration-slow ease-enter starting:opacity-0',
                          'before:absolute before:start-0 before:top-0 before:size-[4px] before:-translate-x-1/2 before:rounded-full before:bg-current rtl:before:translate-x-1/2',
                          dot.over ? 'own:text-warning' : slo !== undefined ? 'own:text-success-text' : 'own:text-fg-muted',
                        )}
                        style={
                          {
                            height: DOT,
                            translate: `calc(var(--ps-dir) * ${dot.x} * 100%) ${dot.row * PITCH + (shown ? 0 : 8)}px`,
                            opacity: shown ? 1 : 0,
                            transitionDelay: wave ? `${Math.round(dot.x * wave)}ms` : undefined,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                </div>
                {sloAt !== undefined && (
                  <span
                    data-slot="distribution-strip-slo"
                    className="absolute inset-y-0 w-0 -translate-x-px border-s border-dashed border-warning rtl:translate-x-px"
                    style={{ insetInlineStart: `${sloAt * 100}%` }}
                  />
                )}
              </div>
              {slo !== undefined && sloAt !== undefined && (
                <span
                  data-slot="distribution-strip-slo-flag"
                  className={cn(
                    'absolute bottom-1 own:font-mono own:text-ui-xs own:leading-4 whitespace-nowrap own:text-warning-text',
                    sloBefore ? '-translate-x-full pe-2 rtl:translate-x-full' : 'ps-2',
                  )}
                  style={{ insetInlineStart: `${sloAt * 100}%` }}
                >
                  {sloText}
                </span>
              )}
              <div className={CLIP}>
                <div className="absolute inset-x-2 inset-y-0">
                  {marks.map((mark, i) => {
                    const strongest = mark.p === top
                    const over = slo !== undefined && mark.value > slo
                    return (
                      <m.div
                        key={mark.p}
                        data-slot="distribution-strip-marker"
                        data-percentile={mark.p}
                        className="pointer-events-none absolute inset-0 [translate:calc(var(--ps-dir)*var(--ps-at)*100%)_0]"
                        initial={cssVars({ '--ps-at': k.reduced ? mark.at : 0 })}
                        animate={cssVars({ '--ps-at': shown ? mark.at : 0 })}
                        transition={k.reduced ? { type: false } : k.spring('smooth')}
                      >
                        {/* The objective's lane below the swarm is its flag's alone, so the lines stop above it. */}
                        <span
                          aria-hidden
                          data-slot="distribution-strip-line"
                          className={cn('absolute start-0 top-4.5 w-px -translate-x-1/2 rtl:translate-x-1/2', strongest ? 'bg-fg' : 'bg-line-strong')}
                          style={{ bottom: sloAt !== undefined ? SLO_LANE + 2 : 0 }}
                        />
                        <span
                          data-slot="distribution-strip-flag"
                          className="absolute start-0 top-0 own:flex h-4 items-baseline gap-[0.4em] own:font-mono own:text-ui-xs own:leading-4 whitespace-nowrap transition-[translate] yj-duration-base ease-standard"
                          style={{ translate: `calc(var(--ps-dir) * ${Math.round((starts[i]! - mark.at * w) * 10) / 10}px) 0` }}
                        >
                          <span className="own:text-fg-muted">{mark.name}</span>
                          <span className={cn(over ? 'own:text-warning-text' : 'own:text-fg', strongest && 'own:font-medium')}>{mark.text}</span>
                        </span>
                      </m.div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div data-slot="distribution-strip-axis" aria-hidden className="relative h-7">
              <span className="absolute inset-x-0 top-0 h-px bg-line" />
              {ticks.map((t) => (
                <span
                  key={t.value}
                  data-slot="distribution-strip-tick"
                  data-major={t.major || undefined}
                  className={cn('absolute top-0 w-px -translate-x-1/2 rtl:translate-x-1/2', t.major ? 'h-2 bg-fg-subtle' : 'h-1 bg-line-strong')}
                  style={{ insetInlineStart: `${at(t.value) * 100}%` }}
                />
              ))}
              {ticks
                .filter((t) => labelled(t.value, t.major))
                .map((t) => {
                  const x = at(t.value)
                  return (
                    <span
                      key={t.value}
                      data-slot="distribution-strip-tick-label"
                      className={cn(
                        'absolute top-2.5 own:font-mono own:text-ui-xs own:leading-4 whitespace-nowrap own:text-fg-muted own:tabular-nums',
                        x >= 0.999 ? '-translate-x-full rtl:translate-x-full' : x > 0.001 && '-translate-x-1/2 rtl:translate-x-1/2',
                      )}
                      style={{ insetInlineStart: `${x * 100}%` }}
                    >
                      <bdi>{tick(t.value)}</bdi>
                    </span>
                  )
                })}
            </div>
            <p id={summaryId} data-slot="distribution-strip-summary" className="sr-only">
              {summary}
            </p>
          </>
        )}
      </figure>
    </MotionFeatures>
  )
}

export { DistributionStrip, percentileOf, type DistributionStripProps }
