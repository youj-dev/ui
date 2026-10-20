'use client'

import type { ReactNode } from 'react'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { CircleAlertIcon } from '@youj/icons/components/youj/icons/circle-alert'
import { InboxIcon } from '@youj/icons/components/youj/icons/inbox'
import { RotateCwIcon } from '@youj/icons/components/youj/icons/rotate-cw'
import { SearchXIcon } from '@youj/icons/components/youj/icons/search-x'
import { useLocale } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { useCopy } from './copy'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/ui/button'
import { paginationRange } from '../../../components/ui/pagination'

/** What the grid shows with no rows at all. */
export interface DataGridEmpty {
  title?: string
  description?: ReactNode
  /** An illustration or an icon above the words. Default: an inbox. */
  illustration?: ReactNode
  /** The next step: "Add a customer". */
  action?: ReactNode
}

/** No rows, no matches, or an error: a mark, the words (live), and the way out. */
export function StatePanel({
  tone,
  title,
  description,
  media,
  action,
  onRetry,
  onClear,
}: {
  tone: 'empty' | 'filtered' | 'error'
  title: string
  description?: ReactNode
  media?: ReactNode
  action?: ReactNode
  onRetry?: () => void
  onClear?: () => void
}) {
  const labels = useCopy()
  const icon = tone === 'error' ? <CircleAlertIcon trigger="none" /> : tone === 'filtered' ? <SearchXIcon /> : <InboxIcon />
  return (
    <div data-yj-trigger="" className="own:flex flex-col items-center gap-4 px-6 py-16 text-center">
      {media ?? (
        <span
          aria-hidden
          className={cn(
            'relative own:grid size-11 place-items-center rounded-xl border border-line bg-(--dg-band) own:text-fg-muted shadow-xs [&_svg]:size-5',
            tone === 'error' && 'border-danger-line bg-danger-subtle own:text-danger-text',
          )}
        >
          {icon}
        </span>
      )}
      {/* Only the words are live: the action isn't part of the message. */}
      <div role={tone === 'error' ? 'alert' : 'status'} className="own:flex max-w-sm flex-col gap-1">
        <p className="own:text-ui-lg own:font-medium own:text-fg">{title}</p>
        {description && <p className="own:text-ui own:text-fg-muted">{description}</p>}
      </div>
      {tone === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon />
          {labels.tryAgain}
        </Button>
      )}
      {tone === 'filtered' && onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {labels.clearFilters}
        </Button>
      )}
      {tone === 'empty' && action}
    </div>
  )
}

/**
 * The footer: the range in view and the pages. The current page is a raised
 * key that glides between numbers (SlidingIndicator, the smooth spring); the
 * step buttons stay focusable at the ends (disabled, not removed).
 */
export function Pager({
  page,
  pageCount,
  pageSize,
  total,
  noun,
  onPageChange,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  noun: string
  onPageChange: (page: number) => void
}) {
  const labels = useCopy()
  const locale = useLocale()
  const first = total === 0 ? 0 : page * pageSize + 1
  const last = Math.min(total, (page + 1) * pageSize)
  const format = (n: number) => n.toLocaleString(locale)
  return (
    <nav
      aria-label={labels.pagination}
      data-slot="data-grid-pager"
      className="own:flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-(--dg-line) own:px-4 own:py-2.5 own:text-ui-sm own:text-fg-muted"
    >
      <p className="own:tabular-nums">{labels.rangeOf(`${format(first)}–${format(last)}`, format(total), noun)}</p>
      {pageCount > 1 && (
        <div className="own:flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={labels.previousPage} disabled={page === 0} focusableWhenDisabled onClick={() => onPageChange(page - 1)}>
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </Button>
          <span className="relative isolate own:flex items-center gap-0.5">
            {paginationRange(page + 1, pageCount).map((item) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  aria-current={item === page + 1 ? 'page' : undefined}
                  aria-label={labels.pageOf(format(item), format(pageCount))}
                  onClick={() => onPageChange(item - 1)}
                  className={cn(
                    'relative h-control-sm min-w-control-sm touch:yj-hit rounded-md px-1.5 own:font-mono own:text-ui-sm own:tabular-nums focus-ring',
                    'transition-colors yj-duration-fast ease-standard hover:text-fg aria-[current=page]:text-fg',
                  )}
                >
                  {format(item)}
                </button>
              ) : (
                <span key={item} aria-hidden className="min-w-control-sm text-center">
                  …
                </span>
              ),
            )}
            <SlidingIndicator className="own:rounded-md own:bg-band own:shadow-xs" />
          </span>
          <Button variant="ghost" size="icon-sm" aria-label={labels.nextPage} disabled={page >= pageCount - 1} focusableWhenDisabled onClick={() => onPageChange(page + 1)}>
            <ChevronRightIcon className="rtl:-scale-x-100" />
          </Button>
        </div>
      )}
    </nav>
  )
}
