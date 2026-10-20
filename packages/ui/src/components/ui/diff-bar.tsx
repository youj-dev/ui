'use client'

import { useInView } from 'motion/react'
import { useRef, type ComponentProps, type ReactNode } from 'react'
import { diffBarLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'
import { Eyebrow } from './typography'

/* Two values of one measure, A against B, as a diverging bar: each side
 * grows out from a shared center toward its own end (A to the inline start,
 * B to the inline end), in cells you can count, with each value in mono at
 * its outer end. The better side (higher or lower, as the measure says) is
 * lit in the tone and its value in ink; the other side stays neutral. For
 * any A/B comparison: two models, two runs, this month against last.
 * - Motion: when it scrolls into view both sides light outward from the
 *   center at one constant rate, so the longer side takes longer; a new
 *   value relights in place. Reduced motion: drawn at once.
 * - Stacked: `layout="stacked"` draws the two as rows on one scale, each from
 *   the inline start with its name before it: an allowance against a quote,
 *   a budget against the spend. Both are lit up to the smaller value; past
 *   it, the worse side's excess turns danger (the overage), the better
 *   side's stays in the tone.
 * - Screen readers: the values read in order, then the verdict ("B is better
 *   by 22%", or "Even"). */

type DiffBarTone = 'accent' | 'success' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
type DiffWinner = 'a' | 'b' | 'even'

interface DiffBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The start side's value. */
  a: number
  /** The end side's value. */
  b: number
  /** Each side's full length. Default: the larger of the two. */
  max?: number
  /** Which way is better. Default `higher`. */
  better?: 'higher' | 'lower'
  /** The measure, shown above the bar: "Accuracy". */
  label?: ReactNode
  /** The sides' names for the verdict. Default `['A', 'B']`. */
  names?: [string, string]
  /** Intl.NumberFormat options for the values. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Cells per side. Default 14; 0 draws solid bars. */
  segments?: number
  /** The better side's tone. Default `accent`. */
  tone?: DiffBarTone
  /** A difference under this share of the larger value is even. Default 0.005. */
  tolerance?: number
  /** The margin as spoken in the verdict. Default: the relative difference, as a percentage. */
  by?: string
  /** Show the values at the ends, each in a column `--diff-bar-value` wide (4.5rem), so stacked bars share one center. Default true. */
  showValues?: boolean
  /** `diverging` (default): the sides grow out from a shared center. `stacked`: two rows on one scale, named by `names`, the worse side's excess in danger. */
  layout?: 'diverging' | 'stacked'
}

const LIT: Record<DiffBarTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}
const OFF = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'

/** Which side is better: `a`, `b`, or `even` when they're within `tolerance` of the larger value. */
function diffWinner(a: number, b: number, better: 'higher' | 'lower' = 'higher', tolerance = 0.005): DiffWinner {
  if (Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b))) return 'even'
  return a > b === (better === 'higher') ? 'a' : 'b'
}

function DiffBar({
  a,
  b,
  max,
  better = 'higher',
  label,
  names = ['A', 'B'],
  format,
  locale: localeProp,
  segments = 14,
  tone = 'accent',
  tolerance = 0.005,
  by,
  showValues = true,
  layout = 'diverging',
  className,
  ...props
}: DiffBarProps) {
  const k = useYouj()
  const labels = useComponentLabels(diffBarLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const winner = diffWinner(a, b, better, tolerance)
  const full = max ?? Math.max(Math.abs(a), Math.abs(b), Number.EPSILON)
  const value = numberFormat(locale, format)
  const worse = winner === 'a' ? b : a
  const margin =
    by ?? numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Math.abs(a - b) / Math.max(Math.abs(worse), Number.EPSILON))
  const verdict = winner === 'even' ? labels.diffEven : labels.diffBetter(names[winner === 'a' ? 0 : 1], margin)
  const shown = k.reduced || inView
  const cells = Math.max(0, Math.round(segments))
  const step = k.reduced ? 0 : k.ms('deliberate') / Math.max(cells, 1)
  const litOf = (share: number) => (share <= 0 ? 0 : share >= 1 ? cells : Math.min(cells - 1, Math.max(1, Math.round(share * cells))))
  const shareOf = (v: number) => Math.min(1, Math.max(0, Math.abs(v) / full))
  const common = Math.min(shareOf(a), shareOf(b))

  // Stacked: one row per side from the inline start; up to the smaller value both are lit, past it the worse side's excess is danger.
  const row = (which: 'a' | 'b', v: number) => {
    const share = shareOf(v)
    const over = winner !== 'even' && winner !== which
    const rest = over ? 'bg-danger' : LIT[tone]
    const lit = litOf(share)
    const shared = Math.min(lit, litOf(common))
    return (
      <span data-slot="diff-bar-track" data-side={which} aria-hidden className="own:flex h-3 min-w-0 gap-0.5">
        {cells ? (
          Array.from({ length: cells }, (_, i) => {
            const on = shown && i < lit
            return (
              <span
                key={i}
                data-slot="diff-bar-cell"
                data-state={on ? 'on' : 'off'}
                className={cn(
                  'min-w-0 flex-1 rounded-[2px] transition-[background-color] yj-duration-fast ease-standard',
                  on ? (i < shared ? LIT[tone] : rest) : OFF,
                )}
                style={step ? { transitionDelay: `${Math.round(i * step)}ms` } : undefined}
              />
            )
          })
        ) : (
          <span data-slot="diff-bar-bar" className={cn('relative flex-1 overflow-hidden rounded-[2px]', OFF)}>
            {[
              { from: 0, to: Math.min(share, common), fill: LIT[tone] },
              { from: common, to: share, fill: rest },
            ].map((part, i) =>
              part.to > part.from ? (
                <span
                  key={i}
                  className="absolute inset-y-0"
                  style={{ insetInlineStart: `${part.from * 100}%`, width: `${(part.to - part.from) * 100}%` }}
                >
                  <span
                    data-slot="diff-bar-fill"
                    data-part={i ? 'excess' : 'shared'}
                    className={cn(
                      'absolute inset-0 origin-left transition-[scale] yj-duration-slow ease-emphasized reduced:transition-none rtl:origin-right',
                      part.fill,
                    )}
                    style={{ scale: `${shown ? 1 : 0} 1`, transitionDelay: i && !k.reduced ? `${k.ms('slow')}ms` : undefined }}
                  />
                </span>
              ) : null,
            )}
          </span>
        )}
      </span>
    )
  }

  const side = (which: 'a' | 'b', v: number) => {
    const share = Math.min(1, Math.max(0, Math.abs(v) / full))
    const wins = winner === which
    const fill = wins ? LIT[tone] : 'bg-line-strong'
    return (
      <span
        data-slot="diff-bar-track"
        data-side={which}
        aria-hidden
        className={cn('own:flex h-3 min-w-0 gap-0.5', which === 'a' && 'flex-row-reverse')}
      >
        {cells ? (
          Array.from({ length: cells }, (_, i) => {
            // Any value lights at least one cell; only a full one lights them all.
            const lit = share <= 0 ? 0 : share >= 1 ? cells : Math.min(cells - 1, Math.max(1, Math.round(share * cells)))
            const on = shown && i < lit
            return (
              <span
                key={i}
                data-slot="diff-bar-cell"
                data-state={on ? 'on' : 'off'}
                className={cn('min-w-0 flex-1 rounded-[2px] transition-[background-color] yj-duration-fast ease-standard', on ? fill : OFF)}
                style={step ? { transitionDelay: `${Math.round(i * step)}ms` } : undefined}
              />
            )
          })
        ) : (
          <span data-slot="diff-bar-bar" className={cn('relative flex-1 overflow-hidden rounded-[2px]', OFF)}>
            <span
              data-slot="diff-bar-fill"
              className={cn(
                'absolute inset-0 transition-[scale] yj-duration-slow ease-emphasized reduced:transition-none',
                fill,
                which === 'a' ? 'origin-right rtl:origin-left' : 'origin-left rtl:origin-right',
              )}
              style={{ scale: `${shown ? share : 0} 1` }}
            />
          </span>
        )}
      </span>
    )
  }

  const valueClass = (which: 'a' | 'b') =>
    winner === 'even' || winner === which ? 'own:text-fg' : shareOf(which === 'a' ? a : b) > common ? 'own:text-danger-text' : 'own:text-fg-muted'
  const stackedRow = (
    <div data-slot="diff-bar-row" className="own:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center own:gap-x-3 own:gap-y-2.5">
      {(['a', 'b'] as const).map((which, i) => (
        <div key={which} className="own:contents">
          <span data-slot="diff-bar-name" data-side={which} className="own:text-ui-sm own:text-fg-muted">
            {names[i]}
          </span>
          {row(which, which === 'a' ? a : b)}
          {showValues ? (
            <span
              data-slot="diff-bar-value"
              data-side={which}
              className={cn('w-(--diff-bar-value) truncate own:text-end own:font-mono own:text-ui own:tabular-nums', valueClass(which))}
            >
              {value.format(which === 'a' ? a : b)}
            </span>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div
      ref={ref}
      data-slot="diff-bar"
      data-variant={layout}
      data-winner={winner}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex w-full min-w-0 flex-col gap-2 [--diff-bar-value:4.5rem]', className)}
      {...props}
    >
      {label != null && <Eyebrow data-slot="diff-bar-label">{label}</Eyebrow>}
      {layout === 'stacked' ? (
        stackedRow
      ) : (
        <div data-slot="diff-bar-row" className="own:grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
          {showValues ? (
            <span
              data-slot="diff-bar-value"
              data-side="a"
              className={cn(
                'w-(--diff-bar-value) truncate own:font-mono own:text-ui own:tabular-nums',
                winner === 'a' ? 'own:text-fg' : 'own:text-fg-muted',
              )}
            >
              {value.format(a)}
            </span>
          ) : (
            <span />
          )}
          {side('a', a)}
          <span data-slot="diff-bar-center" aria-hidden className="h-5 w-0.5 rounded-full bg-fg-subtle" />
          {side('b', b)}
          {showValues ? (
            <span
              data-slot="diff-bar-value"
              data-side="b"
              className={cn(
                'w-(--diff-bar-value) truncate own:text-end own:font-mono own:text-ui own:tabular-nums',
                winner === 'b' ? 'own:text-fg' : 'own:text-fg-muted',
              )}
            >
              {value.format(b)}
            </span>
          ) : (
            <span />
          )}
        </div>
      )}
      <span data-slot="diff-bar-verdict" className="sr-only">
        {verdict}
      </span>
    </div>
  )
}

export { DiffBar, diffWinner, type DiffBarProps, type DiffBarTone, type DiffWinner }
