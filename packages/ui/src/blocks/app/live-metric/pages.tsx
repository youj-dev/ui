'use client'

import type { CSSProperties } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import type { LiveMetricCopy, Page } from './data'

/* The pages people are on, largest first, each over a bar as long as its
 * share of the largest. When the order changes the rows glide to their new
 * places (motion's PresenceList); a page that drops out of the top fades
 * and one that climbs in rises. The figures change in place, in tabular
 * digits, so nothing shifts as they tick. Reduced motion: rows jump. */

interface PagesProps {
  pages: Page[]
  copy: LiveMetricCopy
  number: (value: number) => string
}

function Pages({ pages, copy, number }: PagesProps) {
  const top = Math.max(1, ...pages.map((p) => p.value))
  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="flex justify-between gap-3 text-ui-xs font-medium text-fg-muted">
        <span>{copy.pages}</span>
        <span>{copy.pagePeople}</span>
      </div>
      <PresenceList aria-label={copy.pages} data-slot="live-pages" className="-mx-2 flex flex-col gap-0.5">
        {pages.map((page) => (
          <PresenceItem key={page.id} aria-label={copy.page(page.label, number(page.value))} className="relative flex items-center justify-between gap-3 rounded-md px-2 py-1 text-ui-sm" style={{ '--share': page.value / top } as CSSProperties}>
            <span aria-hidden className="absolute inset-y-0 start-0 w-full origin-left scale-x-(--share) rounded-md bg-[color-mix(in_oklab,var(--color-chart-1)_10%,var(--color-surface))] transition-[scale] yj-duration-slow ease-standard rtl:origin-right" />
            <span aria-hidden className="relative truncate font-mono text-ui-xs text-fg">
              {page.label}
            </span>
            <span aria-hidden className="relative font-medium text-fg tabular-nums">
              {number(page.value)}
            </span>
          </PresenceItem>
        ))}
      </PresenceList>
    </div>
  )
}

export { Pages }
