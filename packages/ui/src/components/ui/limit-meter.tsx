'use client'

import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { useInView } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { limitMeterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'

/* A budget read like an instrument: what is left, large, with the spent and
 * the limit as a quiet readout under it, over a ruler of minor and major
 * ticks from zero to the limit.
 * An index caret under the ruler points up at the spend, with a hairline
 * across the ruler above it; named lines mark policies ("freeze"), their
 * names over the ruler.
 * - Color tells the story along the ruler: ticks already spent are lit in
 *   `tone`, each stretch still to go before a marker takes that marker's tone
 *   (the runway to it), and ticks past the last marker are dim. Spending past
 *   a marker turns those ticks to its tone.
 * - Motion: when it scrolls into view the spend sweeps up from zero at a
 *   constant rate, the caret riding the front and the ticks lighting as it
 *   passes; a new spend or limit sweeps on from where the caret is.
 * - Reduced motion: drawn at its value; changes jump.
 * - The ruler runs from the inline start, so it reads right to left in RTL.
 * - The marker names over the ruler are measured once laid out: each sits
 *   centered on its line, then close ones are pushed apart and all are kept
 *   over the ruler, so they never overlap or hang past its ends. */

type AllowanceTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface AllowanceMarker {
  value: number
  /** Shown over its line and spoken with the value: "freeze". */
  label: string
  /** Default `warning`. */
  tone?: AllowanceTone
}

interface LimitMeterProps extends Omit<MeterPrimitive.Root.Props, 'format' | 'children' | 'value' | 'min' | 'max'> {
  spent: number
  limit: number
  /** Named lines on the ruler, e.g. the amount at which a card freezes. */
  markers?: AllowanceMarker[]
  /** Intl.NumberFormat options for the amounts, e.g. `{ style: 'currency', currency: 'EUR' }`. Default: two decimals. */
  format?: Intl.NumberFormatOptions
  /** Writes every amount (and the scale) with your own function, for units Intl has none for ("12.5 TB"). Replaces `format`. */
  formatValue?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Minor intervals on the ruler. Default 50. */
  ticks?: number
  /** Every how many minor ticks a major one falls. Default 10. */
  majorEvery?: number
  /** The spent ticks' tone. Default `success`. */
  tone?: AllowanceTone
  /** Names the meter for assistive tech. Default: the visible "Remaining". */
  label?: string
}

const TEXT: Record<AllowanceTone, string> = {
  accent: 'own:text-accent',
  success: 'own:text-success',
  warning: 'own:text-warning',
  danger: 'own:text-danger',
  neutral: 'own:text-fg',
}
const LABEL_TEXT: Record<AllowanceTone, string> = {
  accent: 'own:text-accent-text',
  success: 'own:text-success-text',
  warning: 'own:text-warning-text',
  danger: 'own:text-danger-text',
  neutral: 'own:text-fg',
}
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
const now = () => (typeof performance === 'undefined' ? 0 : performance.now())
/** The least room between two labels over the ruler, in px. */
const FLAG_GAP = 8

/**
 * Where labels go over a ruler `width` px long: each centered on its line at
 * `x`, then pushed apart until `FLAG_GAP` separates neighbors, and kept
 * inside the ruler. Items are in order along it; positions run from the
 * inline start. Returns each label's start as an offset from its line.
 */
function spreadFlags(items: { x: number; w: number }[], width: number): number[] {
  const start = items.map(({ x, w }) => Math.min(Math.max(x - w / 2, 0), Math.max(0, width - w)))
  for (let i = 1; i < start.length; i++) start[i] = Math.max(start[i]!, start[i - 1]! + items[i - 1]!.w + FLAG_GAP)
  for (let i = start.length - 1; i >= 0; i--) {
    const next = i === start.length - 1 ? width + FLAG_GAP : start[i + 1]!
    start[i] = Math.max(0, Math.min(start[i]!, next - FLAG_GAP - items[i]!.w))
  }
  return start.map((at, i) => at - items[i]!.x)
}

function LimitMeter({
  spent,
  limit,
  markers,
  format,
  formatValue,
  locale: localeProp,
  ticks = 50,
  majorEvery = 10,
  tone = 'success',
  label,
  className,
  ...props
}: LimitMeterProps) {
  const k = useYouj()
  const labels = useComponentLabels(limitMeterLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const key = format && JSON.stringify(format)
  const money = useMemo(
    () =>
      formatValue
        ? { format: formatValue, formatToParts: (n: number): Intl.NumberFormatPart[] => [{ type: 'integer', value: formatValue(n) }] }
        : numberFormat(locale, format ?? { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale, key, formatValue],
  )
  const scale = useMemo(
    () => (formatValue ? { format: formatValue } : numberFormat(locale, { ...format, minimumFractionDigits: 0, maximumFractionDigits: 0 })),
    [locale, key, formatValue],
  )

  const max = limit > 0 ? limit : 1
  const at = (v: number) => Math.min(1, Math.max(0, v / max))
  const over = spent > limit
  const remaining = Math.abs(limit - spent)
  const lines = [...(markers ?? [])].sort((a, b) => a.value - b.value)
  const spentAt = k.reduced || inView ? at(spent) : 0

  // The sweep: ticks light at a constant rate from where the line is on screen.
  const rate = k.reduced ? 0 : k.ms('deliberate') * 1.2
  const sweep = useRef({ from: spentAt, to: spentAt, time: 0 })
  const prev = sweep.current
  const moved = rate && prev.time ? (now() - prev.time) / rate : Infinity
  const edge = prev.to >= prev.from ? Math.min(prev.to, prev.from + moved) : Math.max(prev.to, prev.from - moved)
  const from = spentAt === prev.to ? prev.from : edge
  useLayoutEffect(() => {
    if (spentAt !== sweep.current.to) sweep.current = { from, to: spentAt, time: now() }
  })
  const travel = Math.abs(spentAt - from) * rate

  const HeadLabel = label ? 'span' : MeterPrimitive.Label
  const parts = money.formatToParts(remaining)
  const cut = parts.findIndex((p) => p.type === 'decimal')
  const whole = (cut < 0 ? parts : parts.slice(0, cut)).map((p) => p.value).join('')
  const fraction = cut < 0 ? '' : parts.slice(cut).filter((p) => p.type === 'decimal' || p.type === 'fraction').map((p) => p.value).join('')
  const tail = cut < 0 ? '' : parts.slice(cut).filter((p) => p.type !== 'decimal' && p.type !== 'fraction').map((p) => p.value).join('')

  const valueText = [
    over ? labels.allowanceOverText(money.format(spent), money.format(limit), money.format(remaining)) : labels.allowanceValueText(money.format(spent), money.format(limit), money.format(remaining)),
    ...lines.map((line) => labels.allowanceMarkerAt(line.label, money.format(line.value))),
  ].join(', ')

  // The markers' names over the ruler (the spend has its caret under it).
  // Until they're measured (on the server, and in the first render): centered
  // on their line, pulled inside at the ends, and turned away from each other
  // when two sit close.
  const flags = lines
    .map((l, i) => ({ id: `m${i}`, at: at(l.value), text: l.label, tone: l.tone ?? 'warning' }))
    .sort((a, b) => a.at - b.at)
    .map((flag, i, all) => {
      const before = all[i - 1]
      const after = all[i + 1]
      const align = flag.at < 0.08 ? 'start' : flag.at > 0.92 ? 'end' : after && after.at - flag.at < 0.16 ? 'end' : before && flag.at - before.at < 0.16 ? 'start' : 'center'
      return { ...flag, align }
    })

  // Then measured: each label's offset from its line, in px, laid out by spreadFlags.
  const flagBox = useRef<HTMLDivElement>(null)
  const [offsets, setOffsets] = useState<Record<string, number> | null>(null)
  const layout = flags.map((f) => `${f.id}:${f.at}:${f.text}`).join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout names everything measure reads from flags
  useLayoutEffect(() => {
    const box = flagBox.current
    if (!box) return
    const measure = () => {
      // Fractional widths (a transform doesn't change them), so a label with
      // room to spare lands exactly where centering it by half its width would.
      const width = box.getBoundingClientRect().width
      const labels = [...box.querySelectorAll<HTMLElement>('[data-slot="limit-meter-flag"]')]
      if (!width || labels.length !== flags.length) return
      const spread = spreadFlags(
        flags.map((f, i) => ({ x: f.at * width, w: labels[i]!.getBoundingClientRect().width })),
        width,
      )
      const next = Object.fromEntries(flags.map((f, i) => [f.id, spread[i]!]))
      setOffsets((current) => (current && JSON.stringify(current) === JSON.stringify(next) ? current : next))
    }
    measure()
    // The ruler's width, and each label's once its face loads.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(box)
    box.querySelectorAll('[data-slot="limit-meter-flag"]').forEach((label) => observer?.observe(label))
    return () => observer?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layout names everything measure reads from flags
  }, [layout])

  return (
    <MeterPrimitive.Root
      ref={ref}
      value={Math.min(spent, max)}
      min={0}
      max={max}
      locale={locale}
      getAriaValueText={() => valueText}
      aria-label={label}
      data-slot="limit-meter"
      data-state={over ? 'over' : 'within'}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex w-full flex-col gap-5', className)}
      {...props}
    >
      <div data-slot="limit-meter-header" className="own:flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="own:flex min-w-0 flex-col gap-2.5">
          {/* It names the meter unless `label` does. */}
          <HeadLabel data-slot="limit-meter-label" className={cn('own:text-ui-sm own:text-fg-muted', VOICE)}>
            {over ? labels.allowanceOverLimit : labels.allowanceRemaining}
          </HeadLabel>
          <span
            data-slot="limit-meter-remaining"
            className={cn('own:font-mono own:text-[2.5rem] own:leading-none own:font-medium own:tracking-[-0.03em] own:tabular-nums', over ? 'own:text-danger' : 'own:text-fg')}
          >
            {whole}
            {fraction && <span data-slot="limit-meter-fraction" className="own:text-fg-muted">{fraction}</span>}
            {tail}
          </span>
          {/* A quiet readout under the headline: what's spent, and of what. */}
          <dl data-slot="limit-meter-summary" className="own:flex flex-wrap gap-x-4 gap-y-1 own:text-ui-sm">
            {[
              [labels.allowanceSpent, spent],
              [labels.allowanceLimit, limit],
            ].map(([term, amount]) => (
              <div key={term as string} data-slot="limit-meter-stat" className="own:flex items-baseline gap-1.5">
                <dt className={cn('own:text-ui-sm own:text-fg-muted', VOICE)}>{term}</dt>
                <dd className="own:font-mono own:text-fg own:tabular-nums">{money.format(amount as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Clipped across: the rails that carry the labels and the spend caret slide
       * by up to their own width, which would otherwise widen the page. */}
      <div data-slot="limit-meter-scale" aria-hidden className="own:flex flex-col gap-1.5 overflow-x-clip">
        <div ref={flagBox} data-slot="limit-meter-flags" className="relative own:mx-1.5 h-4">
          {flags.map((flag) => (
            // A full-width rail slid by the flag's position (transform only), carrying the label at its start.
            <span
              key={flag.id}
              className="absolute inset-0 translate-x-[calc(var(--at)*100%)] transition-[translate] yj-duration-base ease-standard rtl:translate-x-[calc(var(--at)*-100%)]"
              style={{ '--at': flag.at } as CSSProperties}
            >
              <span
                data-slot="limit-meter-flag"
                data-align={offsets ? undefined : flag.align}
                className={cn(
                  'absolute start-0 bottom-0 own:text-ui own:leading-none whitespace-nowrap transition-[translate] yj-duration-base ease-standard',
                  LABEL_TEXT[flag.tone],
                  offsets
                    ? 'translate-x-[calc(var(--offset)*1px)] rtl:translate-x-[calc(var(--offset)*-1px)]'
                    : [flag.align === 'center' && '-translate-x-1/2 rtl:translate-x-1/2', flag.align === 'end' && '-translate-x-full rtl:translate-x-full'],
                )}
                style={offsets ? ({ '--offset': offsets[flag.id] ?? 0 } as CSSProperties) : undefined}
              >
                {flag.text}
              </span>
            </span>
          ))}
        </div>
        <div
          data-slot="limit-meter-ruler"
          className="relative h-6 rounded-[3px] bg-[color-mix(in_oklab,var(--color-canvas)_calc(55%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_4%,transparent))]"
        >
          <div className="absolute inset-x-1.5 inset-y-0">
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const pos = i / ticks
              const value = pos * max
              const major = i % majorEvery === 0 || i === ticks
              const spentTick = pos <= spentAt + 1e-9 && spentAt > 0
              const ahead = lines.find((l) => l.value >= value && at(l.value) > spentAt)
              const tickTone: AllowanceTone = spentTick ? (lines.filter((l) => l.value <= value).at(-1)?.tone ?? tone) : (ahead?.tone ?? 'neutral')
              const idle = !spentTick && !ahead
              const lit = pos > Math.min(from, spentAt) && pos <= Math.max(from, spentAt)
              const delay = lit ? Math.abs(pos - from) * rate : 0
              return (
                <span
                  key={i}
                  data-slot="limit-meter-tick"
                  data-major={major || undefined}
                  data-zone={spentTick ? 'spent' : idle ? 'idle' : 'runway'}
                  className={cn(
                    'absolute top-1 w-px -translate-x-1/2 rounded-full bg-current transition-[color,opacity] yj-duration-fast ease-standard rtl:translate-x-1/2',
                    major ? 'h-4.5 w-0.5' : 'h-2.5',
                    TEXT[tickTone],
                    idle ? (major ? 'opacity-45' : 'opacity-25') : major ? 'opacity-100' : 'opacity-55',
                  )}
                  style={{ insetInlineStart: `${pos * 100}%`, ...(delay ? { transitionDelay: `${Math.round(delay)}ms` } : null) }}
                />
              )
            })}
            {lines.map((line, i) => (
              <span
                key={i}
                data-slot="limit-meter-marker"
                className={cn('absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-current rtl:translate-x-1/2', TEXT[line.tone ?? 'warning'])}
                style={{ insetInlineStart: `${at(line.value) * 100}%` }}
              />
            ))}
            {/* The spend: a hairline across the ruler and an index caret under it, pointing up, on one rail. */}
            <span
              className="absolute inset-0 translate-x-[calc(var(--at)*100%)] transition-[translate] ease-linear rtl:translate-x-[calc(var(--at)*-100%)]"
              style={{ '--at': spentAt, transitionDuration: `${Math.round(travel)}ms` } as CSSProperties}
            >
              <span
                data-slot="limit-meter-spent"
                className="absolute start-0 inset-y-0.5 w-px -translate-x-1/2 rounded-full bg-fg rtl:translate-x-1/2"
              />
              <span
                data-slot="limit-meter-caret"
                className="absolute start-0 top-[calc(100%+2px)] h-1.5 w-2.5 -translate-x-1/2 bg-fg [clip-path:polygon(50%_0,100%_100%,0_100%)] rtl:translate-x-1/2"
              />
            </span>
          </div>
        </div>
        <div data-slot="limit-meter-axis" className="mx-0.5 mt-2 own:grid grid-cols-3 own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">
          <span className="justify-self-start">{scale.format(0)}</span>
          <span className="justify-self-center">{scale.format(max / 2)}</span>
          <span className="justify-self-end">{scale.format(max)}</span>
        </div>
      </div>
    </MeterPrimitive.Root>
  )
}

export { LimitMeter, type LimitMeterProps, type AllowanceMarker }
