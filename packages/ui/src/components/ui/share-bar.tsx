'use client'

import { useRef, type ComponentProps, type CSSProperties } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, cssVars, listFormat, numberFormat, toneColor } from '../../lib/utils'

/* A word-sized share of a whole, for a table cell or a list row: a solid bar,
 * or a run of cells for the dense, counted look. The fill is the tone over a
 * neutral track.
 * - Motion: the fill's edge travels on the smooth spring (a clip, so the
 *   bar's shape and cells never stretch). It fills from empty when it scrolls
 *   into view, and a new value retargets the spring from where the edge is,
 *   so a burst of updates glides instead of restarting.
 * - Ticks: `mark="tick"` draws each segment as a hairline on a taller bar,
 *   the counted look of a status strip.
 * - Segmented: the value rounds to whole cells, and any share above zero
 *   keeps at least one lit while only a full share lights them all.
 * - Parts: with `parts` the fill is a whole split into its parts, each in its
 *   own tone (the chart colors in order by default), from the inline start; in
 *   cells, each part gets whole cells by largest remainder and any part above
 *   zero keeps one. `active` lights one part and quiets the rest, so a legend
 *   or a BreakdownList beside it can point at its part on hover and focus.
 * - Semantics: with `label` it is a `meter`; without, it is decorative
 *   (aria-hidden), for when the number sits beside it and says it better.
 * - Reduced motion: drawn at its value; changes jump. */

type ShareBarTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ShareBarPart {
  value: number
  /** Default: the chart colors in order. */
  tone?: ShareBarTone
  /** The part's name, spoken with its share when the bar is a meter. */
  label?: string
}

interface ShareBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The share, 0–1. With `max`, a value out of `max`. With `parts`, default their sum. */
  value?: number
  /** What `value` is out of. Default 1, or the parts' sum. */
  max?: number
  /** Split the fill into parts, each in its tone, from the inline start. */
  parts?: readonly ShareBarPart[]
  /** With `parts`: the part to light; the others quiet. `null` or undefined lights all. */
  active?: number | null
  /** Draw this many cells instead of one solid bar. */
  segments?: number
  /** With `segments`: how each is drawn, a `cell` (default) or a thin `tick` on a taller bar, for a count-like run. */
  mark?: 'cell' | 'tick'
  /** The fill's color: the accent, a chart color, a status or neutral. Default 'accent'. */
  tone?: ShareBarTone
  /** Accessible name. With it the bar is a `meter`; without, it is hidden from assistive technology. */
  label?: string
  /** The value as spoken. Default: the share as a percentage, in the provider's locale. */
  valueText?: string
}


/** Lit cells for a fraction: whole cells, at least one for any share, all only when full. */
function litCells(fraction: number, cells: number) {
  if (fraction <= 0) return 0
  if (fraction >= 1) return cells
  return Math.min(cells - 1, Math.max(1, Math.round(fraction * cells)))
}

/** Whole cells for each part out of `cells`, by largest remainder; any part above zero keeps one while there are cells to give. */
function partCells(values: readonly number[], cells: number) {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0)
  if (total <= 0 || cells <= 0) return values.map(() => 0)
  const exact = values.map((v) => (Math.max(0, v) / total) * cells)
  const out = exact.map((e, i) => (values[i]! > 0 ? Math.max(1, Math.floor(e)) : 0))
  const order = exact.map((e, i) => [e - Math.floor(e), i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i)
  let left = cells - out.reduce((a, b) => a + b, 0)
  for (let j = 0; left > 0; j++, left--) out[order[j % order.length]!]!++
  while (left < 0) {
    const i = out.indexOf(Math.max(...out))
    if (out[i]! <= 1) break
    out[i]!--
    left++
  }
  return out
}

function ShareBar({ value, max, parts, active, segments, mark = 'cell', tone = 'accent', label, valueText, className, style, ...props }: ShareBarProps) {
  const k = useYouj()
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const sum = parts?.reduce((total, p) => total + Math.max(0, p.value), 0) ?? 0
  const amount = value ?? sum
  const whole = max ?? (parts ? sum : 1)
  const fraction = whole > 0 ? Math.min(1, Math.max(0, amount / whole)) : 0
  const cells = segments && segments > 0 ? Math.round(segments) : 0
  const ticks = cells > 0 && mark === 'tick'
  const lit = cells ? litCells(fraction, cells) : 0
  const filled = cells ? lit / cells : fraction
  const target = k.reduced || inView ? filled : 0
  const meter = label !== undefined || props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
  const named = parts?.length && parts.every((p) => p.label)
  const spoken =
    valueText ??
    (named && whole > 0 ? listFormat(locale, { type: 'unit' }).format(parts.map((p) => `${p.label} ${percent.format(Math.max(0, p.value) / whole)}`)) : percent.format(fraction))
  const colors = parts?.map((p, i) => toneColor(p.tone ?? `chart-${(i % 5) + 1}`))
  // Each lit cell's part; the cells past the fill take the last part's color (the clip hides them).
  const cellPart = parts && cells ? partCells(parts.map((p) => p.value), lit).flatMap((n, i) => Array.from({ length: n }, () => i)) : []
  const partState = (i: number) => (active == null ? undefined : active === i ? 'active' : 'inactive')

  const partClass = 'transition-opacity yj-duration-fast ease-standard data-[state=inactive]:opacity-25'
  const row = (slot: string, fill: boolean) =>
    cells ? (
      Array.from({ length: cells }, (_, i) => {
        const part = fill && parts ? (cellPart[i] ?? parts.length - 1) : undefined
        return (
          <span
            key={i}
            data-slot="share-bar-segment"
            data-index={part}
            data-state={part !== undefined ? partState(part) : undefined}
            className={cn('min-w-0 flex-1', ticks ? 'own:flex justify-center' : 'rounded-[1px] bg-current', part !== undefined && partClass)}
            style={part !== undefined ? { color: colors![part] } : undefined}
          >
            {/* A tick is a hairline centered in its cell, so the clip's edge still falls between cells. */}
            {ticks && <span className="own:w-[1.5px] own:rounded-full bg-current" />}
          </span>
        )
      })
    ) : fill && parts ? (
      <>
        {parts.map((p, i) =>
          p.value > 0 ? (
            <span
              key={i}
              data-slot="share-bar-part"
              data-index={i}
              data-state={partState(i)}
              className={cn('min-w-0 rounded-xs bg-current', partClass)}
              style={{ color: colors![i], flex: `${p.value} 1 0%` }}
            />
          ) : null,
        )}
        {whole > sum && <span aria-hidden style={{ flex: `${whole - sum} 1 0%` }} />}
      </>
    ) : (
      <span data-slot={`${slot}-bar`} className="flex-1 rounded-xs bg-current" />
    )

  return (
    <MotionFeatures>
      <m.div
        ref={ref}
        data-slot="share-bar"
        data-tone={tone}
        data-variant={ticks ? 'ticks' : cells ? 'segmented' : 'solid'}
        role={meter ? 'meter' : undefined}
        aria-label={label}
        aria-valuenow={meter ? amount : undefined}
        aria-valuemin={meter ? 0 : undefined}
        aria-valuemax={meter ? whole : undefined}
        aria-valuetext={meter ? spoken : undefined}
        aria-hidden={meter ? undefined : true}
        className={cn('relative own:flex w-full min-w-12', ticks ? 'h-6' : cells ? 'h-3' : 'h-1.5', className)}
        style={
          {
            '--share-bar-fill': toneColor(tone),
            '--share-bar-gap': cells && !ticks ? '2px' : '0px',
            ...style,
          } as CSSProperties
        }
        initial={cssVars({ '--share-bar-value': k.reduced ? filled : 0 })}
        animate={cssVars({ '--share-bar-value': target })}
        transition={k.reduced ? { type: false } : k.spring('smooth')}
        {...(props as object)}
      >
        <span data-slot="share-bar-track" className={cn('own:flex flex-1 gap-(--share-bar-gap)', ticks ? 'own:text-line-strong' : 'own:text-well')}>
          {row('share-bar-track', false)}
        </span>
        <span
          data-slot="share-bar-fill"
          className={cn(
            'absolute inset-0 own:flex gap-(--share-bar-gap) own:text-(--share-bar-fill)',
            // Solid parts sit apart on a hairline gap of their own.
            parts && !cells && 'gap-0.5',
            // The edge sits in the gap after the last lit cell (a solid bar has
            // no gap): value × (width + gap) − gap / 2, from the inline start.
            // A solid bar's clip keeps its rounded end.
            '[--share-bar-edge:calc(100%_-_var(--share-bar-value)_*_(100%_+_var(--share-bar-gap))_+_var(--share-bar-gap)_/_2)]',
            cells ? '[--share-bar-round:0px]' : '[--share-bar-round:var(--radius-xs)]',
            '[clip-path:inset(0_var(--share-bar-edge)_0_0_round_var(--share-bar-round))]',
            'rtl:[clip-path:inset(0_0_0_var(--share-bar-edge)_round_var(--share-bar-round))]',
          )}
        >
          {row('share-bar-fill', true)}
        </span>
      </m.div>
    </MotionFeatures>
  )
}

export { ShareBar, type ShareBarPart, type ShareBarProps, type ShareBarTone }
