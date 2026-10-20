'use client'

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { Counter } from '@youj/motion'
import type { Size } from '@youj/core'
import { shareRingLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'

/* A whole split into its parts, as a dial of cells: protein, carbs and fat
 * of a dish's calories, a budget's categories, a day's hours. The cells run
 * clockwise from twelve o'clock, each lit in the tone of the part it falls
 * in, and the parts take whole cells by the largest remainder, so they
 * always add up to the ring. With `max` above the total, the rest of the
 * ring stays dark (1,240 of a 2,000 kcal day). The total sits in the bowl in
 * big figures that count to each new value, with its unit under it; the
 * legend gives every part its amount and its share, and the shares always
 * sum to 100%. Pointing at a part (on the dial or in the legend) dims the
 * others and puts its amount and share in the bowl.
 * - Motion: on first view the cells light one after another round the dial
 *   (the deliberate token over the whole ring), like an instrument settling;
 *   later changes recolor in place on the fast token, and the total counts.
 * - Reduced motion: drawn lit; the total jumps.
 * - A dial turns clockwise in every script, so the ring keeps its direction
 *   under RTL; the bowl and the legend follow the page. */

type MacroTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface ShareRingSegment {
  id: string
  /** Its name in the legend: "Protein". */
  label: string
  /** Its size on the ring: the share of the total it takes. */
  value: number
  /** What the legend shows for it, formatted by `amountFormat`: the protein's grams while `value` is its calories. Default: `value`. */
  amount?: number
  /** Default: the chart colors in turn. */
  tone?: MacroTone
}

interface ShareRingProps extends Omit<ComponentProps<'div'>, 'children'> {
  segments: readonly ShareRingSegment[]
  /** The ring's full scale. Default: the segments' total, so the ring is full; above it, the rest stays dark. */
  max?: number
  /** The figure in the bowl. Default: the segments' total. */
  value?: number
  /** A word under the figure: "kcal". */
  unit?: string
  /** Intl.NumberFormat options for the figure in the bowl. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** Intl.NumberFormat options for each part's amount in the legend, such as `{ style: 'unit', unit: 'gram' }`. Default: whole numbers. */
  amountFormat?: Intl.NumberFormatOptions
  /** The ring's size: `xs`, `sm`, `default` or `lg`. */
  size?: Extract<Size, 'xs' | 'sm' | 'default' | 'lg'>
  /** How many cells round the dial. Default 60 (48 at `sm`, 12 at `xs`). */
  cells?: number
  /** Where the legend sits: `side` puts it beside the dial when the ring has room and under it when not, `below` always under. Default `side`; `false` leaves it out (the parts are still spoken). */
  legend?: 'side' | 'below' | false
  /** A part to single out (controlled). Default: whichever part the pointer is on. */
  highlight?: string | null
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Content for the bowl instead of the figure and unit. */
  children?: ReactNode
}

const TONES: MacroTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const toneVar = (tone: MacroTone) => toneColor(tone, 'color-mix(in oklab, var(--color-fg) 75%, transparent)')
/** An unlit cell: recessed into the page in dark, a faint ink in light, like SegmentedMeter's. */
const OFF = 'color-mix(in oklab, var(--color-canvas) calc(100% * var(--yj-dark)), color-mix(in oklab, var(--color-fg) 9%, transparent))'
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

const SIZE = {
  xs: { root: 'size-7', value: '', unit: '', cells: 12, thick: 34, width: 0.74, hub: 0 },
  sm: { root: 'size-32', value: 'own:text-xl', unit: 'own:text-ui-xs', cells: 48, thick: 18, width: 0.56, hub: 72 },
  default: { root: 'size-48', value: 'own:text-[1.875rem]', unit: 'own:text-ui-xs', cells: 60, thick: 16, width: 0.56, hub: 76 },
  lg: { root: 'size-60', value: 'own:text-[2.5rem]', unit: 'own:text-ui-sm', cells: 60, thick: 15, width: 0.56, hub: 78 },
}

/* Geometry in viewBox units, centered on the hub. */
const R = 100
const VIEW = 104
const f = (n: number) => Math.round(n * 100) / 100

/** Whole parts of `n` in proportion to `weights`, by the largest remainder, so they add up to exactly `n`. */
function apportion(weights: readonly number[], n: number) {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0 || n <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (w / total) * n)
  const whole = exact.map(Math.floor)
  let left = n - whole.reduce((a, b) => a + b, 0)
  const order = exact.map((e, i) => [e - whole[i]!, i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (left <= 0) break
    whole[i]!++
    left--
  }
  return whole
}

function ShareRing({
  segments,
  max,
  value,
  unit,
  format,
  amountFormat,
  size = 'default',
  cells: cellsProp,
  legend = 'side',
  highlight: highlightProp,
  locale: localeProp,
  children,
  className,
  style,
  ...props
}: ShareRingProps) {
  const k = useYouj()
  const labels = useComponentLabels(shareRingLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const [pointed, setPointed] = useState<string | null>(null)
  const highlight = highlightProp !== undefined ? highlightProp : pointed

  // The first pass lights the ring in order; after it, cells recolor together.
  const [intro, setIntro] = useState(!k.reduced)
  useEffect(() => {
    if (!inView || !intro) return
    const timer = setTimeout(() => setIntro(false), k.ms('deliberate') + k.ms('fast'))
    return () => clearTimeout(timer)
  }, [inView, intro, k])

  const s = SIZE[size]
  const count = cellsProp ?? s.cells
  const weights = segments.map((seg) => Math.max(0, seg.value))
  const total = weights.reduce((a, b) => a + b, 0)
  const scale = Math.max(max ?? total, total)
  const litCells = scale > 0 ? Math.round((total / scale) * count) : 0
  const perSegment = apportion(weights, litCells)
  const shares = apportion(weights, 100)
  const tones = segments.map((seg, i) => seg.tone ?? TONES[i % TONES.length]!)
  // Which segment each cell belongs to, clockwise from the top; -1 is unlit.
  const owner: number[] = []
  perSegment.forEach((n, i) => owner.push(...Array<number>(n).fill(i)))
  while (owner.length < count) owner.push(-1)

  const number = numberFormat(locale, format ?? { maximumFractionDigits: 0 })
  const amount = numberFormat(locale, amountFormat ?? { maximumFractionDigits: 0 })
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const figure = value ?? total
  const spokenTotal = unit ? `${number.format(figure)} ${unit}` : number.format(figure)
  const summary =
    total > 0
      ? labels.shareRingSummary(
          spokenTotal,
          segments.map((seg, i) => labels.shareRingPart(seg.label, percent.format(shares[i]! / 100))),
        )
      : `${spokenTotal}, ${labels.noData}`
  const picked = segments.findIndex((seg) => seg.id === highlight)
  const focus = picked >= 0 ? segments[picked] : undefined

  const mid = R - s.thick / 2
  const cellWidth = ((2 * Math.PI * mid) / count) * s.width
  const step = k.reduced ? 0 : k.ms('deliberate') / count
  const point = (id: string | null) => () => setPointed(id)

  const dial = (
    <div
      role="img"
      aria-label={summary}
      data-slot="share-ring-dial"
      className={cn('relative own:grid shrink-0 place-items-center', s.root)}
      onPointerLeave={point(null)}
    >
      <svg aria-hidden viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="absolute inset-0 size-full overflow-visible">
        {/* A hairline rule inside the cells frames the bowl, like a dial's chapter ring. */}
        {s.hub > 0 && <circle data-slot="share-ring-rule" r={s.hub} fill="none" strokeWidth={1} className="stroke-line" vectorEffect="non-scaling-stroke" />}
        {owner.map((i, c) => {
          const on = shown && i >= 0
          const dim = on && picked >= 0 && i !== picked
          return (
            <rect
              key={c}
              data-slot="share-ring-cell"
              data-state={on ? 'on' : 'off'}
              data-segment={i >= 0 ? segments[i]!.id : undefined}
              x={f(-cellWidth / 2)}
              y={-R}
              width={f(cellWidth)}
              height={s.thick}
              rx={size === 'xs' ? 2.5 : 1.75}
              transform={`rotate(${f(((c + 0.5) / count) * 360)})`}
              className="transition-[fill,opacity] yj-duration-fast ease-standard"
              style={{
                fill: on ? toneVar(tones[i]!) : OFF,
                opacity: dim ? 0.24 : 1,
                transitionDelay: intro && on ? `${Math.round(c * step)}ms` : undefined,
              }}
              onPointerEnter={i >= 0 ? point(segments[i]!.id) : undefined}
            />
          )
        })}
      </svg>
      {size !== 'xs' && (
        <div data-slot="share-ring-center" className="pointer-events-none relative own:grid place-items-center own:text-center">
          {children ?? (
            <>
              {/* Two faces in one cell of a grid: the total, and the part being pointed at; they cross-fade. */}
              <span
                className={cn(
                  'col-start-1 row-start-1 own:flex flex-col items-center gap-2.5 transition-[opacity,translate] yj-duration-fast ease-standard',
                  focus && 'translate-y-1 opacity-0 reduced:translate-y-0',
                )}
              >
                <Counter
                  value={figure}
                  format={format ?? { maximumFractionDigits: 0 }}
                  locale={locale}
                  data-slot="share-ring-value"
                  className={cn('block leading-none font-semibold own:tracking-[-0.03em] text-fg', s.value)}
                />
                {unit && (
                  <span data-slot="share-ring-unit" className={cn('own:leading-none own:text-fg-muted', VOICE, s.unit)}>
                    {unit}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={cn(
                  'col-start-1 row-start-1 own:flex flex-col items-center gap-2.5 transition-[opacity,translate] yj-duration-fast ease-standard',
                  !focus && '-translate-y-1 opacity-0 reduced:translate-y-0',
                )}
              >
                <span dir="auto" data-slot="share-ring-focus-value" className={cn('own:block own:leading-none own:font-semibold own:tracking-[-0.03em] own:text-fg own:tabular-nums', s.value)}>
                  {focus ? <Parts parts={amount.formatToParts(focus.amount ?? focus.value)} /> : ' '}
                </span>
                <span data-slot="share-ring-unit" className={cn('own:leading-none own:text-fg-muted', VOICE, s.unit)}>
                  {focus ? `${focus.label} · ${percent.format(shares[picked]! / 100)}` : ' '}
                </span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )

  if (!legend)
    return (
      <div
        ref={ref}
        data-slot="share-ring"
        data-size={size}
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:inline-flex', className)}
        style={style}
        {...props}
      >
        {dial}
      </div>
    )

  // The legend sits beside the dial when the ring has the room (a container query on its own width), else under it.
  return (
    <div
      ref={ref}
      data-slot="share-ring"
      data-size={size}
      data-legend={legend}
      data-reduced-motion={k.reduced || undefined}
      className={cn('@container/share-ring w-full min-w-0', className)}
      style={style}
      {...props}
    >
      <div className={cn('own:flex flex-col items-center gap-5', legend === 'side' && '@[28rem]/share-ring:flex-row @[28rem]/share-ring:gap-8')}>
      {dial}
        <ul data-slot="share-ring-legend" className="own:flex w-full max-w-80 min-w-0 flex-1 flex-col" onPointerLeave={point(null)}>
          {segments.map((seg, i) => (
            <li
              key={seg.id}
              data-slot="share-ring-item"
              data-highlighted={seg.id === highlight || undefined}
              className={cn(
                'flex min-h-10 min-w-0 items-center gap-3 border-t border-line py-2 transition-opacity yj-duration-fast ease-standard first:border-t-0',
                picked >= 0 && picked !== i && 'opacity-45',
              )}
              style={{ '--macro-tone': toneVar(tones[i]!) } as CSSProperties}
              onPointerEnter={point(seg.id)}
            >
              <span aria-hidden data-slot="share-ring-swatch" className="h-3.5 w-1.5 shrink-0 own:rounded-[2px] bg-(--macro-tone)" />
              <span data-slot="share-ring-label" className={cn('min-w-0 flex-1 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
                {seg.label}
              </span>
              <span dir="auto" data-slot="share-ring-amount" className="shrink-0 own:text-ui-lg own:font-medium own:text-fg own:tabular-nums">
                <Parts parts={amount.formatToParts(seg.amount ?? seg.value)} />
              </span>
              <span dir="auto" data-slot="share-ring-share" className="w-10 shrink-0 own:text-end own:text-ui-sm own:text-fg-muted own:tabular-nums">
                {percent.format(shares[i]! / 100)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** A formatted number with its unit set small and muted. */
function Parts({ parts }: { parts: Intl.NumberFormatPart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'unit' || part.type === 'percentSign' ? (
          <span key={i} data-part="unit" className="own:text-[0.72em] own:text-fg-muted">
            {part.value}
          </span>
        ) : (
          part.value
        ),
      )}
    </>
  )
}

export { ShareRing, type ShareRingProps, type ShareRingSegment, type MacroTone }
