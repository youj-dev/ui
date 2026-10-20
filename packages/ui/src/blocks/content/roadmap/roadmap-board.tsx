'use client'

import { useId } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowUpIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { useRoadmap } from './context'
import { STATUS, votesLabel, type RoadmapRequest, type Status } from './data'

/* The read-only roadmap: Planned, In progress and Shipped side by side
 * (stacked on phones), each a list of cards ordered by votes. A card opens the
 * same detail sheet as the list. Cards arrive through PresenceList each time
 * the view opens. Voting happens in the list and the sheet, not here. */

const COLUMNS: Status[] = ['planned', 'progress', 'shipped']

function Column({ status, requests, countOf, onOpen, heading: Heading }: { heading: 'h2' | 'h3'; status: Status; requests: RoadmapRequest[]; countOf: (r: RoadmapRequest) => number; onOpen: (r: RoadmapRequest) => void }) {
  const id = useId()
  const { copy, categories, locale } = useRoadmap()
  const { icon: Icon, ink } = STATUS[status]
  const label = copy.status[status]
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-transparent p-2.5">
      <Heading id={id} className="flex items-center gap-2 px-1.5 pt-1 text-ui font-semibold text-fg">
        <Icon trigger="none" size={15} aria-hidden className={ink} />
        {label}
        <span className="ms-auto text-ui-sm font-medium text-fg-muted tabular-nums">{requests.length}</span>
      </Heading>
      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-ui-sm text-fg-muted">{copy.boardEmpty[status]}</p>
      ) : (
        <PresenceList initial className="flex flex-col gap-2">
          {requests.map((r) => (
            <PresenceItem key={r.id} className="group/card relative flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-xs transition-colors yj-duration-fast ease-standard hover:border-line-subtle">
              <div className="text-ui font-medium text-fg">
                <button
                  type="button"
                  onClick={() => onOpen(r)}
                  className="text-start outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-focus"
                >
                  {r.title}
                </button>
              </div>
              <div className="flex items-center gap-2 text-ui-sm text-fg-muted">
                <span className="inline-flex items-center gap-1 font-medium text-fg tabular-nums">
                  <ArrowUpIcon trigger="none" size={13} strokeWidth={2.25} aria-hidden />
                  <span className="sr-only">{votesLabel(countOf(r), copy, locale)}</span>
                  <span aria-hidden>{countOf(r).toLocaleString(locale)}</span>
                </span>
                <span>{categories[r.category] ?? r.category}</span>
                {r.target && (
                  <span className={cn('ms-auto rounded-sm px-1.5 py-px text-ui-xs font-medium tabular-nums', status === 'shipped' ? 'bg-success-subtle text-success-text' : 'bg-hover text-fg-muted')}>
                    {r.target}
                  </span>
                )}
              </div>
            </PresenceItem>
          ))}
        </PresenceList>
      )}
    </section>
  )
}

export function RoadmapBoard({ requests, countOf, onOpen, heading }: { heading: 'h2' | 'h3'; requests: RoadmapRequest[]; countOf: (r: RoadmapRequest) => number; onOpen: (r: RoadmapRequest) => void }) {
  return (
    <div className="grid items-start gap-3 md:grid-cols-3">
      {COLUMNS.map((status) => (
        <Column
          key={status}
          status={status}
          heading={heading}
          requests={requests.filter((r) => r.status === status).sort((a, b) => countOf(b) - countOf(a))}
          countOf={countOf}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}
