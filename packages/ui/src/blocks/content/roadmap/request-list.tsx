'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { MessageIcon, TrendingUpIcon } from '@youj/icons'
import { useRoadmap } from './context'
import { shortDate, type RoadmapRequest, type Sort } from './data'
import { StatusTag } from './status-tag'
import { VoteButton } from './vote-button'

/* The requests, one row each: the vote on the start edge, then the title
 * (a button that opens the detail sheet, stretched over the row so the whole
 * row is a target) and a meta line: status, category, comments, date, and
 * under Trending how many votes it drew this week. Rows enter, leave and
 * re-sort through PresenceList. */

export function RequestList({
  requests,
  sort,
  voted,
  countOf,
  onVote,
  onOpen,
  fresh,
}: {
  requests: RoadmapRequest[]
  sort: Sort
  voted: ReadonlySet<string>
  countOf: (r: RoadmapRequest) => number
  onVote: (r: RoadmapRequest, voted: boolean) => void
  onOpen: (r: RoadmapRequest) => void
  /** A request just posted: its row carries a quiet accent edge. */
  fresh?: string
}) {
  const { copy, categories, locale, today } = useRoadmap()
  return (
    <PresenceList initial aria-label={copy.list} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {requests.map((r) => (
        <PresenceItem
          key={r.id}
          data-fresh={r.id === fresh || undefined}
          className="group/row relative flex items-start gap-3.5 border-b border-line bg-surface px-3.5 py-3.5 transition-colors yj-duration-fast ease-standard last:border-b-0 hover:bg-hover data-fresh:bg-accent-subtle sm:gap-4 sm:px-4"
        >
          <VoteButton title={r.title} count={countOf(r)} voted={voted.has(r.id)} onVote={(v) => onVote(r, v)} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
            <div className="min-w-0 text-ui font-semibold text-fg">
              <button
                type="button"
                onClick={() => onOpen(r)}
                className="rounded-sm text-start outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-none focus-visible:after:ring-2 focus-visible:after:ring-focus focus-visible:after:ring-inset hover:underline hover:decoration-line hover:underline-offset-4"
              >
                {r.title}
              </button>
            </div>
            <p className="line-clamp-2 text-ui-sm text-fg-muted sm:line-clamp-1">{r.body}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm text-fg-muted">
              <StatusTag status={r.status} />
              <span>{categories[r.category] ?? r.category}</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MessageIcon trigger="none" size={13} aria-hidden />
                {r.comments.length}
                <span className="sr-only">{copy.comments(r.comments.length)}</span>
              </span>
              <time dateTime={r.history[0]!.date} className="tabular-nums">
                {shortDate(r.history[0]!.date, locale, today)}
              </time>
              {sort === 'trending' && r.recent >= 15 && (
                <span className="inline-flex items-center gap-1 text-success-text tabular-nums">
                  <TrendingUpIcon trigger="none" size={13} aria-hidden />
                  {copy.thisWeek(r.recent)}
                </span>
              )}
            </div>
          </div>
        </PresenceItem>
      ))}
    </PresenceList>
  )
}
