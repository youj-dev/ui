'use client'

import { useId, type ElementType, type ReactNode } from 'react'
import { AlarmClockIcon, CheckIcon, CircleAlertIcon, MailIcon, MailOpenIcon, ReplyIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, dateTimeFormat, initials, listFormat } from '../../../lib/utils'
import { Composer } from '../comment-thread/composer'
import { CommentBody, type PeopleByHandle } from '../comment-thread/markdown'
import { ago } from '../comment-thread/time'
import type { ActivityInboxCopy, ActivityInboxKind, ActivityInboxPerson } from './data'
import type { Inbox, InboxItem } from './use-inbox'

/* One notification: who did what to what, where it lives and when, the
 * latest words, and what you can do about it in place (an action's buttons,
 * a reply under it). Its own tools (read, snooze, done) sit at its end on
 * hover or focus, always on touch. The row is one tab stop of the list;
 * the list's keys reach these too. */

const TONE = {
  neutral: 'text-fg-muted',
  accent: 'text-accent-text',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
} as const

/** Later today (6 PM, or an hour on), tomorrow at 9 and next Monday at 9, from `now`. */
export function snoozeTimes(now: number) {
  const at = (days: number, hour: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + days)
    d.setHours(hour, 0, 0, 0)
    return d.getTime()
  }
  const evening = at(0, 18)
  const later = evening - now > 60 * 60_000 ? evening : now + 60 * 60_000 - (now % (60 * 60_000))
  const monday = (8 - new Date(now).getDay()) % 7 || 7
  return { later, tomorrow: at(1, 9), nextWeek: at(monday, 9) }
}

/** "Mara Okafor"; "Mara Okafor and Theo Lindqvist"; "Mara Okafor, Theo Lindqvist and 2 others". */
const names = (actors: ActivityInboxPerson[], copy: ActivityInboxCopy) =>
  listFormat(copy.locale, { type: 'conjunction' }).format(
    actors.length > 3 ? [actors[0]!.name, actors[1]!.name, copy.others(actors.length - 2)] : actors.map((a) => a.name),
  )

function Tool({
  label,
  onClick,
  keys,
  tabbable,
  children,
}: {
  label: string
  onClick: () => void
  keys: string
  tabbable: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-xs" aria-label={label} aria-keyshortcuts={keys} onClick={onClick} tabIndex={tabbable ? undefined : -1} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export interface InboxRowProps {
  item: InboxItem
  kind: ActivityInboxKind
  copy: ActivityInboxCopy
  now: number | null
  people: readonly ActivityInboxPerson[]
  byHandle: PeopleByHandle
  me: string
  inbox: Inbox
  focusable: boolean
  replying: boolean
  snoozing: boolean
  linkComponent: ElementType
  onReplying: (on: boolean) => void
  onSnoozing: (on: boolean) => void
  onSnooze: (until: number | null) => void
  onDone: () => void
  onOpen: () => void
}

export function InboxRow({
  item,
  kind,
  copy,
  now,
  people,
  byHandle,
  me,
  inbox,
  focusable,
  replying,
  snoozing,
  linkComponent: Link,
  onReplying,
  onSnoozing,
  onSnooze,
  onDone,
  onOpen,
}: InboxRowProps) {
  const id = useId()
  const Icon = kind.icon
  const actor = item.actors[0]
  const time = +new Date(item.time)
  const utc = now === null
  const when = (t: number) =>
    dateTimeFormat(copy.locale, { weekday: 'short', hour: 'numeric', minute: '2-digit', ...(utc && { timeZone: 'UTC' }) }).format(t)
  const times = now === null ? null : snoozeTimes(now)
  const snoozed = item.snoozedUntil != null && now !== null && item.snoozedUntil > now
  return (
    <article
      tabIndex={focusable ? 0 : -1}
      aria-labelledby={`${id}-line`}
      aria-describedby={`${id}-meta`}
      data-slot="inbox-row"
      data-yj-unread={item.read ? undefined : ''}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest('button, a, textarea, [role=menu]')) onOpen()
      }}
      className={cn(
        'group/row relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 rounded-lg py-3 ps-4 pe-2 outline-none',
        'transition-colors yj-duration-fast ease-standard hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute start-1.5 top-5.5 size-1.5 rounded-full bg-accent transition-[opacity,scale] yj-duration-base ease-standard',
          item.read && 'scale-50 opacity-0',
        )}
      />
      {actor ? (
        <Avatar aria-hidden className="mt-px">
          {actor.avatar && <AvatarImage src={actor.avatar} alt="" />}
          <AvatarFallback className="text-ui-xs font-medium">{initials(actor.name)}</AvatarFallback>
          <AvatarBadge className={cn('-end-1 -bottom-1 size-4! border border-line bg-surface ring-0', TONE[kind.tone ?? 'neutral'])}>
            <Icon size={10} strokeWidth={2.25} />
          </AvatarBadge>
        </Avatar>
      ) : (
        <span
          aria-hidden
          className={cn('mt-px grid size-8 shrink-0 place-items-center rounded-full border border-line bg-well', TONE[kind.tone ?? 'neutral'])}
        >
          <Icon size={15} />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p id={`${id}-line`} className="text-ui leading-snug text-pretty">
          {/* Spaces as their own text, so every reader keeps them between the parts. */}
          {!item.read && <span className="sr-only">{copy.unreadPrefix}</span>}{' '}
          {item.actors.length > 0 && <span className="font-medium text-fg">{names(item.actors, copy)}</span>}{' '}
          <span className="text-fg-muted">{item.action}</span>{' '}
          {item.subject.href ? (
            <Link href={item.subject.href} className="rounded-xs font-medium text-fg underline-offset-4 hover:underline focus-ring">
              {item.subject.label}
            </Link>
          ) : (
            <span className="font-medium text-fg">{item.subject.label}</span>
          )}
          {(item.count ?? 0) > 1 && !item.read && ' '}
          {(item.count ?? 0) > 1 && !item.read && (
            <Badge variant="secondary" className="ms-1.5 align-[0.1em] tabular-nums">
              {copy.fresh(item.count!)}
            </Badge>
          )}
        </p>
        <p id={`${id}-meta`} className="flex flex-wrap items-center gap-x-1.5 text-ui-sm text-fg-muted">
          {item.subject.context && <span className="truncate">{item.subject.context}</span>}
          {item.subject.context && <span aria-hidden>·</span>}
          <time dateTime={new Date(time).toISOString()}>{ago(time, now, copy.locale, copy.justNow)}</time>
          {snoozed && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-warning-text">
                <AlarmClockIcon aria-hidden size={12} />
                {copy.until(when(item.snoozedUntil!))}
              </span>
            </>
          )}
        </p>
        {item.preview && !item.replied && <CommentBody source={item.preview} people={byHandle} me={me} clamp className="text-ui-sm text-fg-muted" />}
        {item.result ? (
          <p className="flex items-center gap-1.5 text-ui-sm text-success-text">
            <CheckIcon aria-hidden size={13} strokeWidth={2.5} />
            {item.result}
          </p>
        ) : (
          item.actions && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.actions.map((action) => (
                <AsyncButton key={action.id} size="xs" variant={action.variant ?? 'default'} onAction={() => inbox.act(item, action)}>
                  {action.label}
                </AsyncButton>
              ))}
            </div>
          )
        )}
        {item.replied && (
          <p className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <ReplyIcon aria-hidden size={13} className="rtl:-scale-x-100" />
            {copy.replied}
          </p>
        )}
        {replying && (
          <Composer
            people={people}
            copy={copy}
            label={copy.replyIn(item.subject.label)}
            placeholder={copy.replyPlaceholder}
            submitLabel={copy.sendReply}
            autoFocus
            onSubmit={(body, mentions) => {
              onReplying(false)
              void inbox.reply(item, body, mentions)
            }}
            onCancel={() => onReplying(false)}
            className="mt-1.5"
          />
        )}
        {item.error && (
          <p role="alert" className="flex items-center gap-1.5 text-ui-sm text-danger-text">
            <CircleAlertIcon aria-hidden size={13} />
            {item.error}
          </p>
        )}
      </div>
      <div
        className={cn(
          // A small bar floating over the row's top end, so the words get the row's whole width.
          'absolute end-2 top-2 z-10 flex h-fit items-center gap-px rounded-md border border-line bg-overlay p-px shadow-xs transition-opacity yj-duration-fast ease-standard',
          'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 has-[[aria-expanded=true]]:opacity-100',
          // Touch has no hover: there it sits in the row's last column, always shown.
          'touch:static touch:-my-1 touch:border-0 touch:bg-transparent touch:p-0 touch:opacity-100 touch:shadow-none',
        )}
      >
        {item.replyable && !replying && (
          <Tool label={copy.reply} keys="R" tabbable={focusable} onClick={() => onReplying(true)}>
            <ReplyIcon size={14} className="rtl:-scale-x-100" />
          </Tool>
        )}
        <Tool label={item.read ? copy.markUnread : copy.markRead} keys="U" tabbable={focusable} onClick={() => void inbox.setRead(item, !item.read)}>
          {item.read ? <MailIcon size={14} /> : <MailOpenIcon size={14} />}
        </Tool>
        <DropdownMenu open={snoozing} onOpenChange={onSnoozing}>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label={copy.snooze} aria-keyshortcuts="S" tabIndex={focusable ? undefined : -1} />}
          >
            <AlarmClockIcon size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            {snoozed && <DropdownMenuItem onClick={() => onSnooze(null)}>{copy.unsnooze}</DropdownMenuItem>}
            {times &&
              (
                [
                  [copy.laterToday, times.later],
                  [copy.tomorrow, times.tomorrow],
                  [copy.nextWeek, times.nextWeek],
                ] as const
              ).map(([label, at]) => (
                <DropdownMenuItem key={label} onClick={() => onSnooze(at)}>
                  {label}
                  <DropdownMenuShortcut>{when(at)}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Tool label={copy.done} keys="E" tabbable={focusable} onClick={onDone}>
          <CheckIcon size={14} />
        </Tool>
      </div>
    </article>
  )
}
