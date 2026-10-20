'use client'

import { useInView } from 'motion/react'
import { useRef } from 'react'
import { useYouj } from '@youj/core'
import { cn, numberFormat } from '../../../lib/utils'
import type { CheckGateCandidate, CheckGateCopy } from './data'

interface CandidateHistoryProps {
  candidates: CheckGateCandidate[]
  threshold: number
  copy: CheckGateCopy
  percent: (fraction: number) => string
}

/* The last candidates as lollipops on a shared scale: a stem up to each pass
 * rate with a head on it, solid for those that cleared the bar and hollow
 * for those that fell under it, the candidate as an ink target (a dot in
 * a ring). The bar is a rule across, keyed in the caption. As the band scrolls into view the stems
 * grow from the baseline one after another, each head riding its stem's tip
 * (same duration and curve, so they never part). Reduced motion: drawn in
 * place. */
function CandidateHistory({ candidates, threshold, copy, percent }: CandidateHistoryProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const rates = candidates.map((c) => c.rate)
  const low = Math.floor(Math.min(threshold, ...rates) - 2)
  const scale = (rate: number) => Math.min(1, Math.max(0, (rate - low) / (100 - low)))
  const under = rates.filter((r) => r < threshold).length
  const last = candidates.length - 1
  const bar = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 }).format(threshold / 100)

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-ui-sm text-fg-muted">{copy.history(candidates.length)}</span>
        <span aria-hidden className="flex items-center gap-1.5 text-ui-xs text-fg-muted tabular-nums">
          <span className="h-px w-3 bg-line-strong" />
          {copy.bar(bar)}
        </span>
      </figcaption>
      <div
        ref={ref}
        role="img"
        aria-label={copy.chartLabel(candidates.length, under, bar, percent((rates[last] ?? 0) / 100))}
        className="relative h-28 border-b border-line"
      >
        <div aria-hidden className="absolute inset-x-0 border-t border-line-strong" style={{ bottom: `${scale(threshold) * 100}%` }} />
        <ol aria-hidden className="absolute inset-0 flex">
          {candidates.map((entry, i) => {
            const cleared = entry.rate >= threshold
            const candidate = i === last
            const height = `${scale(entry.rate) * 100}%`
            const timing = cn('yj-duration-deliberate ease-enter', k.reduced && 'transition-none')
            const delay = k.reduced ? undefined : `${i * k.stagger('tight')}s`
            return (
              <li key={entry.id} data-cleared={cleared || undefined} data-candidate={candidate || undefined} className="relative flex-1">
                <span
                  className={cn(
                    'absolute bottom-0 left-1/2 w-px -translate-x-1/2 origin-bottom transition-transform',
                    timing,
                    candidate ? 'bg-fg' : cleared ? 'bg-line-strong' : 'bg-well',
                  )}
                  style={{ height, transform: `scaleY(${shown ? 1 : 0})`, transitionDelay: delay }}
                />
                <span
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full transition-[bottom]',
                    timing,
                    candidate
                      ? 'size-2.5 bg-fg shadow-[0_0_0_3px_var(--color-surface),0_0_0_4.5px_var(--color-fg)]'
                      : cleared
                        ? 'size-2 bg-fg'
                        : 'size-2 border-[1.5px] border-line-strong bg-surface',
                  )}
                  style={{ bottom: shown ? height : '0%', transitionDelay: delay }}
                />
              </li>
            )
          })}
        </ol>
      </div>
      <div aria-hidden className="flex justify-between gap-3 text-ui-xs text-fg-muted tabular-nums">
        <span>{candidates[0]?.id}</span>
        <span className="text-fg">
          {candidates[last]?.id} · {copy.candidate}
        </span>
      </div>
    </figure>
  )
}

export { CandidateHistory }
