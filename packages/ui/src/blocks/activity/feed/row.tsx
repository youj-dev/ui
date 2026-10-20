'use client'

import { useId, useState, type ElementType } from 'react'
import { Collapse } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { cn, initials, listFormat } from '../../../lib/utils'
import { ago, fullDate } from './time'
import type { FeedRow } from './aggregate'
import type { ActivityFeedCopy, ActivityFeedPerson, ActivityFeedTone, ActivityFeedType } from './data'

/* One row of the feed: the type's mark on the day's rail, then who, what and
 * when as one sentence (that's the row's name), and what it carried under
 * it: a comment's words, a change as from → to, labels, a deploy's outcome,
 * or the commits, the first three shown. */

const MARK: Record<ActivityFeedTone, string> = {
  neutral: 'border-line bg-surface text-fg-muted',
  accent: 'border-accent-line bg-accent-subtle text-accent-text',
  success: 'border-success-line bg-success-subtle text-success-text',
  warning: 'border-warning-line bg-warning-subtle text-warning-text',
  danger: 'border-danger-line bg-danger-subtle text-danger-text',
}
const BADGE = { neutral: 'secondary', accent: 'default', success: 'success', warning: 'warning', danger: 'danger' } as const

function Face({ person, className }: { person: ActivityFeedPerson; className?: string }) {
  return (
    <Avatar size="sm" className={cn('size-5', className)}>
      {person.avatar && <AvatarImage src={person.avatar} alt="" />}
      <AvatarFallback className="text-ui-xs">{initials(person.name)}</AvatarFallback>
    </Avatar>
  )
}

/** "Mara Okafor"; "Mara Okafor and Theo Lindqvist"; "Mara Okafor, Theo Lindqvist and 3 others". */
export function names(actors: readonly ActivityFeedPerson[], copy: ActivityFeedCopy) {
  const shown = actors.length > 3 ? [actors[0]!.name, actors[1]!.name, copy.others(actors.length - 2)] : actors.map((a) => a.name)
  return listFormat(copy.locale, { type: 'conjunction' }).format(shown)
}

export function FeedRowView({
  row,
  type,
  copy,
  now,
  last,
  position,
  size,
  linkComponent: Link,
}: {
  row: FeedRow
  type: ActivityFeedType
  copy: ActivityFeedCopy
  now: number | null
  /** Last of its day: its mark ends the rail. */
  last: boolean
  position: number
  /** The feed's length, or -1 while older events can still load. */
  size: number
  linkComponent: ElementType
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const event = row.events[0]!
  const Icon = type.icon
  const folded = row.events.length
  const many = row.items.length > 3
  const items = many ? row.items.slice(0, 3) : row.items
  const rest = row.items.slice(3)
  const target = event.target
  return (
    <article
      tabIndex={0}
      aria-posinset={position}
      aria-setsize={size}
      aria-labelledby={`${id}-line`}
      aria-describedby={`${id}-time`}
      data-slot="feed-row"
      data-type={row.type}
      className="group/row relative flex gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors yj-duration-fast ease-standard hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset"
    >
      {!last && <span aria-hidden className="absolute start-6.5 top-10 -bottom-2.5 w-px bg-line-subtle" />}
      <span aria-hidden className={cn('relative grid size-7 shrink-0 place-items-center rounded-full border', MARK[type.tone ?? 'neutral'])}>
        <Icon size={13} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p id={`${id}-line`} className="min-w-0 flex-[1_1_calc(var(--spacing)*64)] text-ui leading-snug text-fg-muted">
            <span className="sr-only">{type.label}:</span>{' '}
            {/* Faces when there are photos to show: initials would only repeat the names beside them. */}
            {row.actors.every((actor) => actor.avatar) && (
              <span aria-hidden className="me-1.5 inline-flex -space-x-1.5 align-[-0.3em]">
                {row.actors.slice(0, 3).map((actor) => (
                  <Face key={actor.id} person={actor} className="ring-2 ring-surface" />
                ))}
              </span>
            )}
            <span className="font-medium text-fg">{names(row.actors, copy)}</span>{' '}
            {type.verb(type.fold === 'items' ? Math.max(folded, row.items.length) : folded)}{' '}
            {target &&
              (target.href ? (
                <Link href={target.href} className="font-medium text-fg underline-offset-4 hover:underline focus-ring rounded-xs">
                  {target.label}
                </Link>
              ) : (
                <span className="font-medium text-fg">{target.label}</span>
              ))}
          </p>
          <time
            id={`${id}-time`}
            dateTime={new Date(row.time).toISOString()}
            title={fullDate(row.time, copy.locale, now === null)}
            className="shrink-0 text-ui-sm whitespace-nowrap text-fg-muted tabular-nums"
          >
            {ago(row.time, now, copy.locale, copy.justNow)}
          </time>
        </div>
        {event.excerpt && <p className="line-clamp-2 border-s-2 border-line ps-2.5 text-ui-sm text-pretty text-fg-muted">{event.excerpt}</p>}
        {event.change && (
          <p className="flex flex-wrap items-center gap-1.5">
            {event.change.from && (
              <>
                <Badge variant="outline">{event.change.from}</Badge>
                <ArrowRightIcon aria-hidden size={12} className="text-fg-subtle rtl:-scale-x-100" />
              </>
            )}
            <Badge variant="secondary" className="text-fg">
              {event.change.to}
            </Badge>
          </p>
        )}
        {event.labels && (
          <p className="flex flex-wrap gap-1.5">
            {event.labels.map((label) => (
              <Badge key={label} variant="outline">
                <BadgeDot />
                {label}
              </Badge>
            ))}
          </p>
        )}
        {event.status && (
          <p>
            <Badge variant={BADGE[event.status.tone]}>
              <BadgeDot />
              {event.status.label}
            </Badge>
          </p>
        )}
        {row.items.length > 0 && (
          <div className="flex flex-col">
            <ItemList items={items} />
            {many && (
              <>
                <Collapse id={`${id}-more`} open={open}>
                  <ItemList items={rest} />
                </Collapse>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-expanded={open}
                  aria-controls={`${id}-more`}
                  onClick={() => setOpen((v) => !v)}
                  className="-ms-2 self-start text-fg-muted"
                >
                  {open ? copy.hideItems : copy.showItems(row.items.length)}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function ItemList({ items }: { items: FeedRow['items'] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 items-baseline gap-2 text-ui-sm">
          <code className="shrink-0 font-mono text-fg-subtle">{item.id.slice(0, 7)}</code>
          <span className="truncate text-fg">{item.label}</span>
          {item.meta && <span className="ms-auto shrink-0 text-fg-muted">{item.meta}</span>}
        </li>
      ))}
    </ul>
  )
}
