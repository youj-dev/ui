'use client'

import { useInView } from 'motion/react'
import { useRef } from 'react'
import { useYouj } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { cn } from '../../../lib/utils'
import type { CheckGateCopy, CheckGateGroup } from './data'

interface GroupListProps {
  groups: CheckGateGroup[]
  threshold: number
  copy: CheckGateCopy
  /** The candidate the changes are measured from. */
  previous: string
  percent: (fraction: number) => string
  points: (delta: number) => string
}

/* One row per group, read as a bullet: its name and owner in mono,
 * its pass rate as a thin bar on a zoomed scale (so 88% and 99% look
 * different) with the bar's tick across it, the rate, and its change since
 * the candidate before. Under the bar, the fill and the rate turn amber. Rows
 * enter and leave through PresenceList when the filter changes, and the
 * fills grow from the start as the list scrolls into view. Reduced motion:
 * drawn in place. */
function GroupList({ groups, threshold, copy, previous, percent, points }: GroupListProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const rates = groups.map((s) => (s.total ? (100 * s.passed) / s.total : 0))
  const low = Math.max(0, Math.floor((Math.min(threshold, ...rates) - 5) / 10) * 10)
  const scale = (rate: number) => Math.min(1, Math.max(0, (rate - low) / (100 - low)))

  return (
    <div ref={ref}>
      {groups.length === 0 ? (
        <p className="py-3 text-ui text-fg-muted">{copy.noneBlocking}</p>
      ) : (
        <PresenceList className="flex flex-col">
          {groups.map((group, i) => {
            const rate = rates[i] ?? 0
            const cleared = rate >= threshold
            const failed = group.total - group.passed
            return (
              <PresenceItem key={group.id} data-cleared={cleared || undefined} className="border-t border-line-subtle first:border-t-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2.5 sm:grid-cols-[minmax(0,--spacing(48))_minmax(0,1fr)_--spacing(14)_--spacing(16)]">
                  <div className="order-1 flex min-w-0 flex-col gap-0.5 sm:order-none">
                    <span className="truncate text-ui font-medium text-fg">{group.id}</span>
                    <span className="truncate text-ui-sm text-fg-muted">
                      {group.owner}
                      {failed > 0 && <> · {copy.failed(failed)}</>}
                    </span>
                  </div>
                  <div aria-hidden className="relative order-3 h-1.5 rounded-full bg-well sm:order-none">
                    <div
                      className={cn(
                        'absolute inset-y-0 start-0 origin-left rounded-full transition-transform yj-duration-deliberate ease-enter rtl:origin-right',
                        k.reduced && 'transition-none',
                        cleared ? 'bg-fg' : 'bg-warning',
                      )}
                      style={{ width: `${scale(rate) * 100}%`, transform: `scaleX(${shown ? 1 : 0})`, transitionDelay: k.reduced ? undefined : `${i * k.stagger('base')}s` }}
                    />
                    <span className="absolute -inset-y-1 w-px bg-fg-subtle" style={{ insetInlineStart: `${scale(threshold) * 100}%` }} />
                  </div>
                  <span dir="auto" className={cn('order-2 text-end text-ui tabular-nums sm:order-none', cleared ? 'text-fg' : 'text-warning-text')}>
                    {percent(rate / 100)}
                  </span>
                  <span
                    dir="auto"
                    className={cn(
                      'order-4 text-end text-ui tabular-nums sm:order-none',
                      group.delta === null ? 'text-fg-muted' : group.delta > 0 ? 'text-success-text' : 'text-danger-text',
                    )}
                  >
                    {group.delta === null ? (
                      <>
                        <span aria-hidden>—</span>
                        <span className="sr-only">{copy.unchanged}</span>
                      </>
                    ) : (
                      points(group.delta)
                    )}
                    <span className="sr-only"> {copy.since(previous)}</span>
                  </span>
                </div>
              </PresenceItem>
            )
          })}
        </PresenceList>
      )}
    </div>
  )
}

export { GroupList }
