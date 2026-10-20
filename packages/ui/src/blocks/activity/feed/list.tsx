'use client'

import { useId, useRef, type ElementType, type KeyboardEvent, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowUpIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { byDay, type FeedRow } from './aggregate'
import type { ActivityFeedCopy, ActivityFeedType } from './data'
import { FeedRowView } from './row'

/* The feed itself: rows by day under headings that stick while their day
 * scrolls past, as WAI-ARIA feeds, one per day (PageDown and PageUp move between rows,
 * Ctrl+End leaves past the end, Ctrl+Home back before the start; busy while
 * older rows load). Arrivals held back for a reader wait behind a pill at
 * the top; pressing it lets them in and goes to the top. Rows drop in and
 * glide (PresenceList); reduced motion: in place. */

export function RowSkeletons({ count = 3, label }: { count?: number; label?: string }) {
  return (
    <div role={label ? 'status' : undefined} aria-label={label} className="flex flex-col">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3 px-3 py-2.5">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1.5">
            <Skeleton className={cn('h-3', i % 2 ? 'w-1/2' : 'w-3/4')} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface FeedListProps {
  rows: FeedRow[]
  types: Record<string, ActivityFeedType>
  fallbackType: ActivityFeedType
  copy: ActivityFeedCopy
  now: number | null
  titleId: string
  linkComponent: ElementType
  held: number
  onReveal: () => void
  canLoadMore: boolean
  loadingMore: boolean
  loadError: string | null
  onLoadMore: () => void
  /** Where Ctrl+Home goes: the control before the feed. */
  onLeaveStart: () => void
  onReading: (part: 'scrolled' | 'pointer' | 'focus', on: boolean) => void
  empty?: ReactNode
  /** The scroller's height: the region the rows scroll in. */
  className?: string
}

export function FeedList({
  rows,
  types,
  fallbackType,
  copy,
  now,
  titleId,
  linkComponent,
  held,
  onReveal,
  canLoadMore,
  loadingMore,
  loadError,
  onLoadMore,
  onLeaveStart,
  onReading,
  empty,
  className,
}: FeedListProps) {
  const k = useYouj()
  const id = useId()
  const scroller = useRef<HTMLDivElement>(null)
  const after = useRef<HTMLButtonElement>(null)
  const days = byDay(rows, now)
  const heading = dateTimeFormat(copy.locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: now === null ? 'UTC' : undefined })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const article = (event.target as HTMLElement).closest('article')
    if (!article) return
    const all = [...event.currentTarget.querySelectorAll<HTMLElement>('article[data-slot=feed-row]')]
    const at = all.indexOf(article)
    const mod = event.ctrlKey || event.metaKey
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault()
      const next = all[at + (event.key === 'PageDown' ? 1 : -1)]
      if (next) next.focus()
      else if (event.key === 'PageDown' && canLoadMore) onLoadMore()
    } else if (mod && event.key === 'End') {
      event.preventDefault()
      after.current?.focus()
    } else if (mod && event.key === 'Home') {
      event.preventDefault()
      onLeaveStart()
    }
  }

  const reveal = () => {
    onReveal()
    scroller.current?.scrollTo?.({ top: 0, behavior: k.reduced ? 'auto' : 'smooth' })
  }

  return (
    <div
      ref={scroller}
      data-slot="feed-scroller"
      onScroll={(event) => onReading('scrolled', event.currentTarget.scrollTop > 8)}
      onPointerEnter={() => onReading('pointer', true)}
      onPointerLeave={() => onReading('pointer', false)}
      onFocus={() => onReading('focus', true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget as Node | null) && onReading('focus', false)}
      className={cn('relative overflow-y-auto overscroll-contain yj-scrollbar', className)}
    >
      {held > 0 && (
        // No height of its own, so the rows under it don't move when it comes.
        <div className="pointer-events-none sticky top-2 z-20 flex h-0 justify-center">
          <MotionFeatures>
            <m.button
              type="button"
              data-yj-tone="inverse"
              data-slot="feed-new"
              aria-label={copy.showNew(held)}
              onClick={reveal}
              initial={k.reduced ? false : { y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={k.spring('snappy')}
              className="pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-full bg-inverse px-3 text-ui-sm font-medium text-fg shadow-md focus-ring"
            >
              <ArrowUpIcon size={13} strokeWidth={2.25} />
              <span aria-hidden className="tabular-nums">
                {copy.newItems(held)}
              </span>
            </m.button>
          </MotionFeatures>
        </div>
      )}
      {rows.length === 0 ? (
        // Nothing matches: the message sits in the middle of the rows' room.
        <div className="grid min-h-full place-items-center">{empty}</div>
      ) : (
        <div role="group" aria-labelledby={titleId} onKeyDown={onKeyDown} className="flex flex-col pb-1">
          {days.map((day, d) => (
            <div key={day.day}>
              <h3
                id={`${id}-${day.day}`}
                className="sticky top-0 z-10 border-b border-line-subtle bg-surface px-(--card-spacing) py-1.5 text-ui-xs font-medium tracking-wide text-fg-muted uppercase"
              >
                {day.label ? copy[day.label] : heading.format(day.day)}
              </h3>
              <PresenceList
                as="div"
                role="feed"
                aria-busy={loadingMore}
                aria-labelledby={`${titleId} ${id}-${day.day}`}
                className="flex flex-col px-[calc(var(--card-spacing)-var(--spacing)*3)] pt-1"
              >
                {day.rows.map((row, i) => {
                  return (
                    <PresenceItem key={row.key} as="div">
                      <FeedRowView
                        row={row}
                        type={types[row.type] ?? fallbackType}
                        copy={copy}
                        now={now}
                        last={i === day.rows.length - 1}
                        position={i + 1}
                        size={canLoadMore && d === days.length - 1 ? -1 : day.rows.length}
                        linkComponent={linkComponent}
                      />
                    </PresenceItem>
                  )
                })}
              </PresenceList>
            </div>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="flex flex-col items-center gap-2 border-t border-line-subtle px-3 py-3">
          {loadingMore && <RowSkeletons count={2} />}
          {loadError && (
            <p role="alert" className="text-ui-sm text-danger-text">
              {loadError}
            </p>
          )}
          {canLoadMore ? (
            <Button ref={after} variant="ghost" size="sm" loading={loadingMore} loadingLabel={copy.loadingMore} onClick={onLoadMore}>
              {copy.loadMore}
            </Button>
          ) : (
            <p className="text-ui-sm text-fg-muted">{copy.end}</p>
          )}
        </div>
      )}
    </div>
  )
}
