'use client'

import { timelineLabels } from '@youj/core/labels'
import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import { useLocale, type YoujLabels } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import {
  AlertTriangleIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  MessageIcon,
  RocketIcon,
  type IconProps,
} from '@youj/icons'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, relativeTimeFormat } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import { CollapsibleChevron } from './collapsible'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './empty'

/* An activity feed: events grouped by day, newest first, each with a typed
 * mark on a rail (commit, comment, deploy, alert…), who did it, when, and
 * optional details that open in place.
 * - Motion: an event that arrives while the feed is on screen takes its slot
 *   at the top (motion's PresenceList: it fades down a few px while the
 *   events below glide to make room) and its mark plays once; "Load more"
 *   appends older events the same way. Details open with motion's Collapse.
 *   Marks play on hover. Reduced motion: events appear in place, details
 *   open instantly, marks stay still.
 * - Time: each event shows a relative time ("5 min ago", then the clock time
 *   on older days) that re-renders every minute (or counts from a pinned
 *   `now`), with the full date in a <time> element for assistive tech and on
 *   hover.
 * - Access: a heading and a list per day; arrivals are announced in a polite
 *   live region; the details toggles are real disclosure buttons. */

type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

interface TimelineEventType {
  icon: ComponentType<IconProps>
  tone?: TimelineTone
  /** Spoken before the title, e.g. "Deploy". */
  label: string
}

interface TimelineEvent {
  id: string
  /** A key of `types`: commit, comment, deploy, alert, merge, pull-request, or your own. */
  type: string
  /** What happened. Keep the actor out of it: they are shown before it. */
  title: ReactNode
  /** Plain-text title for the arrival announcement when `title` is not a string. */
  summary?: string
  actor?: { name: string; avatar?: string }
  time: Date | string | number
  /** Opens under the event with a Details toggle. */
  details?: ReactNode
  /** A trailing slot on the event's line: a badge, a link. */
  meta?: ReactNode
}

const defaultTypes = (labels: Pick<YoujLabels, keyof typeof timelineLabels>): Record<string, TimelineEventType> => ({
  commit: { icon: GitCommitIcon, label: labels.timelineCommit },
  comment: { icon: MessageIcon, label: labels.timelineComment },
  deploy: { icon: RocketIcon, tone: 'accent', label: labels.timelineDeploy },
  alert: { icon: AlertTriangleIcon, tone: 'warning', label: labels.timelineAlert },
  merge: { icon: GitMergeIcon, tone: 'accent', label: labels.timelineMerge },
  'pull-request': { icon: GitPullRequestIcon, label: labels.timelinePullRequest },
})

const toneClass: Record<TimelineTone, string> = {
  neutral: 'bg-surface own:text-fg-muted border-line',
  accent: 'bg-accent-subtle own:text-accent border-accent-line',
  success: 'bg-success-subtle own:text-success-text border-success-line',
  warning: 'bg-warning-subtle own:text-warning-text border-warning-line',
  danger: 'bg-danger-subtle own:text-danger-text border-danger-line',
}

interface TimelineProps extends Omit<ComponentProps<'div'>, 'children'> {
  events: readonly TimelineEvent[]
  /** Extra or replacement event types. */
  types?: Record<string, TimelineEventType>
  /** Loads older events. Shows a Load more button while `hasMore`. */
  onLoadMore?: () => Promise<unknown> | void
  hasMore?: boolean
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Shown when there are no events. */
  empty?: ReactNode
  /** The moment "Today" and relative times count from, pinned (a demo's clock, a test). Default: the clock, read every minute once the page is live. */
  now?: Date | number
}

const DAY = 86_400_000

/* Until the browser knows now (server and hydration renders, see useNow),
 * days and times are UTC: the one zone both renders agree on. */
function startOfDay(date: Date, utc = false) {
  const d = new Date(date)
  if (utc) d.setUTCHours(0, 0, 0, 0)
  else d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function Timeline({ events, types, onLoadMore, hasMore = false, locale: localeProp, empty, now: nowProp, className, ...props }: TimelineProps) {
  // Re-renders every minute so relative times stay true. A pinned `now` takes over once the page is
  // live; until then (server and hydration renders) days and times stay in UTC, as they do without it.
  const clock = useNow(nowProp === undefined ? 60_000 : 0)
  const now = clock === null ? null : nowProp === undefined ? clock : +nowProp
  const locale = useLocale(localeProp)
  const labels = useComponentLabels(timelineLabels)
  const kinds = useMemo(() => ({ ...defaultTypes(labels), ...types }), [types, labels])
  const [loadingMore, setLoadingMore] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Ids present on first render, and every one seen since: an id not in the
  // set arrived live, so its mark plays and it is announced.
  const seen = useRef<Set<string> | null>(null)
  const latest = useRef(-Infinity)
  if (seen.current === null) {
    seen.current = new Set(events.map((e) => e.id))
    latest.current = Math.max(-Infinity, ...events.map((e) => +new Date(e.time)))
  }
  const fresh = events.filter((e) => !seen.current!.has(e.id))
  useEffect(() => {
    if (fresh.length === 0) return
    // News is what lands above everything seen so far; loaded older events are not.
    const news = fresh.filter((e) => +new Date(e.time) >= latest.current).sort((a, b) => +new Date(b.time) - +new Date(a.time))
    const newest = news[0]
    const title = newest && (newest.summary ?? (typeof newest.title === 'string' ? newest.title : undefined))
    if (newest && title) {
      const who = newest.actor ? `${newest.actor.name} ` : ''
      setAnnouncement(`${kinds[newest.type]?.label ?? labels.timelineActivity}: ${who}${title}`)
    }
    for (const e of fresh) {
      seen.current!.add(e.id)
      latest.current = Math.max(latest.current, +new Date(e.time))
    }
  })

  const groups = useMemo(() => {
    const utc = now === null
    const today = utc ? null : startOfDay(new Date(now))
    const heading = dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: utc ? 'UTC' : undefined })
    const out: { key: string; label: string; events: TimelineEvent[] }[] = []
    for (const event of [...events].sort((a, b) => +new Date(b.time) - +new Date(a.time))) {
      const day = startOfDay(new Date(event.time), utc)
      const key = String(day)
      const label = day === today ? labels.today : today !== null && day === today - DAY ? labels.yesterday : heading.format(day)
      const group = out[out.length - 1]
      if (group?.key === key) group.events.push(event)
      else out.push({ key, label, events: [event] })
    }
    return out
  }, [events, now, locale, labels])

  const loadMore = async () => {
    if (!onLoadMore || loadingMore) return
    setLoadingMore(true)
    try {
      await onLoadMore()
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div data-slot="timeline" className={cn('own:flex flex-col gap-5', className)} {...props}>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {events.length === 0
        ? (empty ?? (
            <Empty className="own:py-10">
              <EmptyHeader>
                <EmptyTitle>{labels.timelineEmptyTitle}</EmptyTitle>
                <EmptyDescription>{labels.timelineEmptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        : groups.map((group) => (
            <TimelineGroup
              key={group.key}
              label={group.label}
              events={group.events}
              kinds={kinds}
              now={now}
              locale={locale}
              fresh={fresh}
            />
          ))}
      {events.length > 0 && onLoadMore && (
        <div className="own:flex justify-center">
          {hasMore ? (
            <Button variant="outline" size="sm" loading={loadingMore} loadingLabel={labels.timelineLoadingOlder} onClick={loadMore}>
              {labels.timelineLoadMore}
            </Button>
          ) : (
            <p className="own:text-ui-sm own:text-fg-muted">{labels.timelineEnd}</p>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineGroup({
  label,
  events,
  kinds,
  now,
  locale,
  fresh,
}: {
  label: string
  events: TimelineEvent[]
  kinds: Record<string, TimelineEventType>
  now: number | null
  locale: string
  fresh: TimelineEvent[]
}) {
  const id = useId()
  const labels = useComponentLabels(timelineLabels)
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="own:text-ui-sm own:font-medium text-fg-muted">
        {label}
      </h3>
      <PresenceList as="ol" className="own:flex flex-col">
        {events.map((event, index) => (
          <PresenceItem key={event.id} data-slot="timeline-item" data-type={event.type} className="relative">
            <TimelineRow
              event={event}
              kind={kinds[event.type] ?? { icon: MessageIcon, label: labels.timelineActivity }}
              now={now}
              locale={locale}
              last={index === events.length - 1}
              fresh={fresh.includes(event)}
            />
          </PresenceItem>
        ))}
      </PresenceList>
    </section>
  )
}

function TimelineRow({
  event,
  kind,
  now,
  locale,
  last,
  fresh,
}: {
  event: TimelineEvent
  kind: TimelineEventType
  now: number | null
  locale: string
  last: boolean
  fresh: boolean
}) {
  const labels = useComponentLabels(timelineLabels)
  const [open, setOpen] = useState(false)
  // Captured on mount: a row that arrived live keeps its mount trigger, so the
  // mark's first play is never cut short by switching to hover.
  const [arrived] = useState(fresh)
  const detailsId = useId()
  const date = new Date(event.time)
  const Icon = kind.icon
  return (
    // The row is the icon's hover group: its mark plays while the row is hovered.
    <div data-yj-trigger="" className={cn('group/row relative own:flex gap-3', last ? 'pb-1' : 'pb-4')}>
      {/* The rail runs from under this mark to the next event in the day. */}
      {!last && <span aria-hidden className="absolute start-[13.5px] top-8 -bottom-0.5 w-px bg-line" />}
      <div className="own:flex flex-col items-center">
        <span
          aria-hidden
          className={cn('relative z-1 own:grid size-7 shrink-0 place-items-center rounded-full border', toneClass[kind.tone ?? 'neutral'])}
        >
          <Icon trigger={arrived ? 'mount' : 'hover'} size={14} strokeWidth={2} />
        </span>
      </div>
      <div className="own:flex min-w-0 flex-1 flex-col gap-1 pt-1">
        <div className="own:flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {/* Never narrower than 14rem: on a phone the badge and time drop to their own line instead. */}
          <p className="min-w-0 flex-[1_1_14rem] own:text-ui own:text-fg">
            <span className="sr-only">{kind.label}: </span>
            {event.actor && (
              <span className="own:me-1.5 own:inline-flex items-baseline gap-1.5 own:font-medium">
                <Avatar aria-hidden size="sm" className="size-5 self-center">
                  {event.actor.avatar && <AvatarImage src={event.actor.avatar} alt="" />}
                  <AvatarFallback className="own:text-ui-xs">{event.actor.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                {event.actor.name}
              </span>
            )}
            <span className="own:text-fg-muted [&_a]:text-fg [&_a]:underline-offset-4 [&_a:hover]:underline [&_code]:font-mono [&_code]:text-ui-sm [&_code]:text-fg [&_strong]:font-medium [&_strong]:text-fg">
              {event.title}
            </span>
          </p>
          <div className="own:flex shrink-0 items-center gap-2">
            {event.meta}
            <time
              dateTime={date.toISOString()}
              title={now === null ? undefined : date.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
              className="own:text-ui-sm whitespace-nowrap own:text-fg-muted own:tabular-nums"
            >
              {relativeTime(date, now, locale, labels.justNow)}
            </time>
          </div>
        </div>
        {event.details && (
          <>
            <Button
              variant="ghost"
              size="xs"
              className="-ms-2 self-start own:text-fg-muted"
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? labels.timelineHideDetails : labels.timelineDetails}
              <CollapsibleChevron size={12} />
            </Button>
            <Collapse id={detailsId} open={open}>
              <div className="pt-1 pb-1 own:text-ui-sm text-fg-muted">{event.details}</div>
            </Collapse>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * "just now", "12 min ago", "3 hr ago" today; the clock time on older days.
 * Without a now (server and hydration renders), the UTC clock time.
 * `justNow` is the text for under a minute (the `justNow` label).
 */
function relativeTime(date: Date, now: number | null, locale: string, justNow = timelineLabels.justNow) {
  if (now === null) return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
  const diff = now - date.getTime()
  if (startOfDay(date) !== startOfDay(new Date(now))) {
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  }
  const rtf = relativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return justNow
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  return rtf.format(-Math.round(minutes / 60), 'hour')
}

export { Timeline, relativeTime, type TimelineEvent, type TimelineEventType, type TimelineProps, type TimelineTone }
