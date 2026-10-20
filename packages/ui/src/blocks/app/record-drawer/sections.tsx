'use client'

import { useId, type ComponentType, type ElementType, type ReactNode } from 'react'
import { ActivityIcon, CalendarClockIcon, FileTextIcon, ListChecksIcon, VideoIcon } from '@youj/icons'
import { safeLink } from '../../../lib/safe-href'
import { cn } from '../../../lib/utils'
import type { RecordDrawerCopy, RecordDrawerDeal, RecordDrawerEntry, RecordDrawerMeeting, RecordDrawerSection } from './data'

const ICONS: Record<RecordDrawerSection, ComponentType<{ size?: number }>> = {
  meetings: CalendarClockIcon,
  progress: ListChecksIcon,
  notes: FileTextIcon,
  activity: ActivityIcon,
}

/** Writes a moment the way the drawer does: Today, Yesterday, or the date (with its time for notes and activity). */
export type When = (iso: string, withTime?: boolean) => string

/** One band of the drawer: a muted header with its icon, a link to everything on the right, then up to a few rows. */
function Section({
  section,
  copy,
  onViewAll,
  children,
  empty,
}: {
  section: RecordDrawerSection
  copy: RecordDrawerCopy
  onViewAll: () => void
  children: ReactNode
  empty: boolean
}) {
  const headingId = useId()
  const Icon = ICONS[section]
  return (
    <section aria-labelledby={headingId} data-section={section} className="flex flex-col gap-1 border-t border-line px-5 pt-3.5 pb-3">
      <div className="flex h-7 items-center justify-between gap-3">
        <h3 id={headingId} className="flex items-center gap-2 text-ui text-fg-muted">
          <Icon size={16} />
          {copy.sections[section]}
        </h3>
        <button
          type="button"
          aria-describedby={headingId}
          onClick={onViewAll}
          className="-me-1.5 rounded-sm px-1.5 py-0.5 text-ui-sm text-fg-muted transition-colors yj-duration-fast hover:text-fg focus-ring"
        >
          {copy.viewAll[section]}
        </button>
      </div>
      {empty ? <p className="py-1.5 text-ui-sm text-fg-muted">{copy.nothingYet(copy.sections[section])}</p> : <ul className="flex flex-col">{children}</ul>}
    </section>
  )
}

function MeetingRow({ meeting, when, copy, linkComponent: Link }: { meeting: RecordDrawerMeeting; when: When; copy: RecordDrawerCopy; linkComponent: ElementType }) {
  const body = (
    <>
      <span aria-hidden className="h-4 w-0.5 shrink-0 rounded-full bg-accent" />
      <span className="truncate text-fg">{meeting.title}</span>
      {meeting.video && (
        <span className="shrink-0 text-fg-muted" title={copy.videoCall}>
          <VideoIcon size={14} />
          <span className="sr-only">{copy.videoCall}</span>
        </span>
      )}
      <time dateTime={meeting.at} className="ms-auto shrink-0 ps-3 text-ui-sm text-fg-muted tabular-nums">
        {when(meeting.at)}
      </time>
    </>
  )
  const row = 'flex h-9 min-w-0 items-center gap-2.5 text-ui'
  const href = safeLink(meeting.href)
  return (
    <li>
      {href ? (
        <Link href={href} className={cn(row, '-mx-2 rounded-md px-2 transition-colors yj-duration-fast hover:bg-hover focus-ring')}>
          {body}
        </Link>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  )
}

function EntryRow({ entry, when }: { entry: RecordDrawerEntry; when: When }) {
  return (
    <li className="flex min-w-0 items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-ui text-fg">{entry.text}</span>
        <span className="truncate text-ui-sm text-fg-muted">{entry.author.name}</span>
      </div>
      <time dateTime={entry.at} className="shrink-0 text-ui-sm text-fg-muted tabular-nums">
        {when(entry.at, true)}
      </time>
    </li>
  )
}

/** Meetings, Progress, Notes and Activity for one deal, each with its header link. */
export function DealSections({
  deal,
  copy,
  when,
  onViewAll,
  linkComponent = 'a',
}: {
  deal: RecordDrawerDeal
  copy: RecordDrawerCopy
  when: When
  onViewAll: (section: RecordDrawerSection) => void
  linkComponent?: ElementType
}) {
  const entries = (section: Exclude<RecordDrawerSection, 'meetings'>, list: RecordDrawerEntry[]) => (
    <Section section={section} copy={copy} onViewAll={() => onViewAll(section)} empty={list.length === 0}>
      {list.map((entry) => (
        <EntryRow key={entry.id} entry={entry} when={when} />
      ))}
    </Section>
  )
  return (
    <>
      <Section section="meetings" copy={copy} onViewAll={() => onViewAll('meetings')} empty={deal.meetings.length === 0}>
        {deal.meetings.map((meeting) => (
          <MeetingRow key={meeting.id} meeting={meeting} when={when} copy={copy} linkComponent={linkComponent} />
        ))}
      </Section>
      {entries('progress', deal.progress)}
      {entries('notes', deal.notes)}
      {entries('activity', deal.activity)}
    </>
  )
}
