'use client'

import { useInView } from 'motion/react'
import { useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'

/* A waterfall told as a list: where a figure starts (the baseline), each
 * thing that moved it as a signed step (an icon, what it is, a line of why,
 * +n or −n), and where it lands (the total, highlighted). The total is the
 * baseline plus the steps, computed here, so the list always adds up.
 * - The mark: beside each value a thin track on one scale, from the lowest
 *   running total to the highest. The baseline and the total are a tick at
 *   their place; each step is a bar from where the figure was to where it
 *   went, in the good ink when it rises (the bad one when it falls; `invert`
 *   swaps them, for costs). Below 28rem of the list's width the marks hide.
 * - Motion: when the list scrolls into view each step's bar grows from where
 *   the figure was, one after another down the list, so the eye follows the
 *   running total. Reduced motion: drawn at once.
 * - Semantics: an ordered list, read top to bottom: the baseline, each step
 *   with its signed value, then the total. The marks are decorative. */

interface ContributionStep {
  /** What moved the figure: "Reservations". */
  label: ReactNode
  /** The signed change it made: 22, −3. */
  value: number
  /** One line of why: "86 booked, 22 more than usual". */
  detail?: ReactNode
  /** Drawn in a small tile before the label. */
  icon?: ReactNode
}

interface ContributionEnd {
  label: ReactNode
  detail?: ReactNode
}

interface ContributionListProps extends Omit<ComponentProps<'ol'>, 'children'> {
  /** Where the figure starts: its label and value. */
  baseline: ContributionEnd & { value: number }
  /** The steps, in the order they're applied. */
  items: readonly ContributionStep[]
  /** The landing row's label. Its value is the baseline plus every step. */
  total: ContributionEnd
  /** Intl.NumberFormat options for every figure; steps always show their sign. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** A fall is good news (costs, latency): falls take the good ink, rises the bad. */
  invert?: boolean
  /** The waterfall marks beside the values. Default true. */
  marks?: boolean
}

/** The running totals: the baseline, then after each step. The last one is the total. */
function runningTotals(baseline: number, items: readonly { value: number }[]) {
  const out = [baseline]
  for (const item of items) out.push(out[out.length - 1]! + item.value)
  return out
}

function ContributionList({
  baseline,
  items,
  total,
  format,
  locale: localeProp,
  invert = false,
  marks = true,
  className,
  ...props
}: ContributionListProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLOListElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const runs = runningTotals(baseline.value, items)
  const landing = runs[runs.length - 1]!
  const lo = Math.min(...runs)
  const span = Math.max(...runs) - lo
  const at = (v: number) => (span > 0 ? (v - lo) / span : 0.5)
  const figure = numberFormat(locale, format)
  const signed = numberFormat(locale, { ...format, signDisplay: 'exceptZero' })
  const step = k.reduced ? 0 : k.ms('fast') * 0.6

  const track = (children: ReactNode) =>
    marks && (
      <span aria-hidden data-slot="contribution-list-mark" className="relative own:h-1.5 own:w-24 shrink-0 own:rounded-full own:bg-band own:@max-md:hidden">
        {children}
      </span>
    )
  const tick = (v: number) => (
    <span className="absolute -inset-y-1 own:w-0.5 -translate-x-1/2 own:rounded-full own:bg-fg-muted rtl:translate-x-1/2" style={{ insetInlineStart: `${at(v) * 100}%` }} />
  )

  return (
    <ol ref={ref} data-slot="contribution-list" className={cn('@container own:flex min-w-0 flex-col', className)} {...props}>
      <li data-slot="contribution-list-baseline" className="own:flex min-w-0 items-center own:gap-3 own:px-3 own:py-2.5">
        <span className="own:flex min-w-0 flex-1 flex-col">
          <span className="truncate own:text-ui own:text-fg-muted">{baseline.label}</span>
          {baseline.detail != null && <span className="truncate own:text-ui-sm own:text-fg-subtle">{baseline.detail}</span>}
        </span>
        {track(tick(baseline.value))}
        <span data-slot="contribution-list-value" className="own:min-w-14 shrink-0 own:text-end own:font-mono own:text-ui own:font-medium own:text-fg own:tabular-nums">
          {figure.format(baseline.value)}
        </span>
      </li>
      {items.map((item, i) => {
        const from = runs[i]!
        const to = runs[i + 1]!
        const direction = item.value > 0 ? 'up' : item.value < 0 ? 'down' : 'flat'
        const good = direction === 'flat' ? undefined : (direction === 'up') !== invert
        const start = at(Math.min(from, to))
        const width = Math.abs(at(to) - at(from))
        return (
          <li
            key={i}
            data-slot="contribution-list-item"
            data-direction={direction}
            className="own:flex min-w-0 items-center own:gap-3 own:px-3 own:py-2.5 own:shadow-[inset_0_var(--yj-stroke-width,1px)_0_0_var(--color-line)]"
          >
            {item.icon != null && (
              <span aria-hidden data-slot="contribution-list-icon" className="own:flex size-8 shrink-0 items-center justify-center own:rounded-md own:border own:border-line own:bg-surface own:text-fg-muted [&_svg]:size-4">
                {item.icon}
              </span>
            )}
            <span className="own:flex min-w-0 flex-1 flex-col">
              <span data-slot="contribution-list-label" className="truncate own:text-ui own:font-medium own:text-fg">
                {item.label}
              </span>
              {item.detail != null && (
                <span data-slot="contribution-list-detail" className="truncate own:text-ui-sm own:text-fg-muted">
                  {item.detail}
                </span>
              )}
            </span>
            {track(
              width > 0 && (
                <span
                  data-slot="contribution-list-step"
                  className={cn(
                    'absolute inset-y-0 own:rounded-full',
                    !k.reduced && 'transition-[scale] yj-duration-slow ease-emphasized',
                    good ? 'own:bg-success' : 'own:bg-danger',
                    // Each bar grows from where the figure was.
                    direction === 'up' ? 'origin-left rtl:origin-right' : 'origin-right rtl:origin-left',
                  )}
                  style={
                    {
                      insetInlineStart: `${start * 100}%`,
                      width: `max(${width * 100}%, 2px)`,
                      scale: `${shown ? 1 : 0} 1`,
                      transitionDelay: step ? `${Math.round(i * step)}ms` : undefined,
                    } as CSSProperties
                  }
                />
              ),
            )}
            <span data-slot="contribution-list-value" className="own:min-w-14 shrink-0 own:text-end own:font-mono own:text-ui own:font-medium own:text-fg own:tabular-nums">
              {signed.format(item.value)}
            </span>
          </li>
        )
      })}
      <li data-slot="contribution-list-total" className="own:mt-1 own:flex min-w-0 items-center own:gap-3 own:rounded-lg own:bg-accent-subtle own:px-3 own:py-3 own:text-accent-text own:ring-1 own:ring-accent-line">
        <span className="own:flex min-w-0 flex-1 flex-col">
          <span className="truncate own:text-ui own:font-medium">{total.label}</span>
          {total.detail != null && <span className="truncate own:text-ui-sm">{total.detail}</span>}
        </span>
        {track(tick(landing))}
        <span data-slot="contribution-list-value" className="own:min-w-14 shrink-0 own:text-end own:font-mono own:text-ui own:font-semibold own:tabular-nums">
          {figure.format(landing)}
        </span>
      </li>
    </ol>
  )
}

export { ContributionList, runningTotals, type ContributionEnd, type ContributionListProps, type ContributionStep }
