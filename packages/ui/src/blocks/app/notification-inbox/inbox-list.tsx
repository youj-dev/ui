'use client'

import type { ComponentType } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArchiveIcon, AtSignIcon, BellIcon, CreditCardIcon, MailIcon, MailOpenIcon, MessageIcon, RocketIcon, ShieldAlertIcon, type IconProps } from '@youj/icons'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import { isToday, when, type InboxNotification, type NotificationsCopy } from './data'

export const KIND_ICON: Record<string, ComponentType<IconProps>> = {
  mention: AtSignIcon,
  comment: MessageIcon,
  deploy: RocketIcon,
  billing: CreditCardIcon,
  security: ShieldAlertIcon,
}

const TONE = { danger: 'text-danger-text', success: 'text-success-text', warning: 'text-warning-text' } as const
/** The system's notices wear their outcome; people's wear their face. */
const toneOf = (item: InboxNotification): keyof typeof TONE | undefined =>
  item.kind === 'security' ? 'warning' : item.kind === 'deploy' ? (/fail/i.test(item.action) ? 'danger' : 'success') : undefined

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

function Media({ item, kindIcons }: { item: InboxNotification; kindIcons: Record<string, ComponentType<IconProps>> }) {
  const Icon = kindIcons[item.kind] ?? BellIcon
  if (item.actor) {
    return (
      <Avatar aria-hidden className="mt-px">
        {item.actor.src && <AvatarImage src={item.actor.src} alt="" />}
        <AvatarFallback className="text-ui-xs font-medium">{initials(item.actor.name)}</AvatarFallback>
        {/* What kind of note it is, on the avatar's corner. */}
        <AvatarBadge className="-end-1 -bottom-1 size-4! border border-line bg-surface text-fg-muted ring-0">
          <Icon size={10} strokeWidth={2.25} />
        </AvatarBadge>
      </Avatar>
    )
  }
  const tone = toneOf(item)
  return (
    <span aria-hidden className={cn('mt-px grid size-8 shrink-0 place-items-center rounded-full border border-line bg-well', tone ? TONE[tone] : 'text-fg-muted')}>
      <Icon size={15} />
    </span>
  )
}

function RowAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Row({
  item,
  now,
  copy,
  kindIcons,
  onOpen,
  onToggleRead,
  onArchive,
}: {
  item: InboxNotification
  now: number
  copy: NotificationsCopy
  kindIcons: Record<string, ComponentType<IconProps>>
  onOpen: (item: InboxNotification) => void
  onToggleRead: (item: InboxNotification) => void
  onArchive: (item: InboxNotification) => void
}) {
  const date = new Date(item.time)
  return (
    <div
      className={cn(
        'group/row relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg py-3 ps-4 pe-2',
        'transition-colors yj-duration-fast ease-standard hover:bg-hover has-[:focus-visible]:bg-hover',
      )}
    >
      {/* The unread dot, in the gutter at the inline start. */}
      <span
        aria-hidden
        data-slot="unread-dot"
        className={cn(
          'absolute start-1.5 top-[calc(var(--spacing)*5.2)] size-1.5 rounded-full bg-accent transition-[opacity,scale] yj-duration-base ease-standard',
          item.read && 'scale-50 opacity-0',
        )}
      />
      <Media item={item} kindIcons={kindIcons} />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-ui leading-snug text-pretty">
          {/* One target for the whole row; the actions sit above it. */}
          <button
            type="button"
            data-slot="inbox-open"
            onClick={() => onOpen(item)}
            className={cn(
              'cursor-pointer text-start outline-none after:absolute after:inset-0 after:rounded-lg',
              'focus-visible:after:outline-(length:--ui--focus-width) focus-visible:after:outline-offset-(--ui--focus-offset) focus-visible:after:outline-focus focus-visible:after:outline-solid',
            )}
          >
            {/* Spaces as their own text, so every reader keeps them between the parts. */}
            {!item.read && <span className="sr-only">{copy.unreadPrefix}</span>}{' '}
            {item.actor && <span className="font-medium text-fg">{item.actor.name}</span>}{' '}
            <span className={item.actor ? 'text-fg-muted' : 'font-medium text-fg'}>{item.action}</span>{' '}
            <span className={item.actor ? 'font-medium text-fg' : 'text-fg-muted'}>{item.subject}</span>
          </button>
        </p>
        {item.body && <p className={cn('line-clamp-2 text-ui-sm text-pretty', item.read ? 'text-fg-muted' : 'text-fg-muted')}>{item.body}</p>}
        <time dateTime={date.toISOString()} className="text-ui-xs text-fg-muted tabular-nums">
          {when(date, now, copy.locale, copy.justNow)}
        </time>
      </div>
      <div
        className={cn(
          'relative z-10 -my-1 flex items-center transition-opacity yj-duration-fast ease-standard',
          'opacity-0 group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100 pointer-coarse:opacity-100',
        )}
      >
        <RowAction label={item.read ? copy.markUnread : copy.markRead} onClick={() => onToggleRead(item)}>
          {item.read ? <MailIcon size={15} /> : <MailOpenIcon size={15} />}
        </RowAction>
        <RowAction label={copy.archive} onClick={() => onArchive(item)}>
          <ArchiveIcon size={15} />
        </RowAction>
      </div>
    </div>
  )
}

/** Notifications grouped into Today and Earlier. Arrivals and departures glide (PresenceList). */
export function InboxList({
  items,
  now,
  copy,
  kindIcons,
  onOpen,
  onToggleRead,
  onArchive,
}: {
  items: InboxNotification[]
  now: number
  copy: NotificationsCopy
  kindIcons: Record<string, ComponentType<IconProps>>
  onOpen: (item: InboxNotification) => void
  onToggleRead: (item: InboxNotification) => void
  onArchive: (item: InboxNotification) => void
}) {
  const sorted = [...items].sort((a, b) => +new Date(b.time) - +new Date(a.time))
  // Both groups stay mounted while there's anything to show, so a group's last item can still glide out.
  const groups = [
    { id: 'today', label: copy.today, items: sorted.filter((item) => isToday(item.time, now)) },
    { id: 'earlier', label: copy.earlier, items: sorted.filter((item) => !isToday(item.time, now)) },
  ]
  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <section key={group.id} aria-label={group.label} hidden={group.items.length === 0 || undefined} className="flex flex-col">
          <h3 className="px-4 pt-2 pb-1 text-ui-xs font-medium text-fg-muted">{group.label}</h3>
          <PresenceList className="flex flex-col">
            {group.items.map((item) => (
              <PresenceItem key={item.id} data-slot="inbox-item" data-read={item.read || undefined}>
                <Row item={item} now={now} copy={copy} kindIcons={kindIcons} onOpen={onOpen} onToggleRead={onToggleRead} onArchive={onArchive} />
              </PresenceItem>
            ))}
          </PresenceList>
        </section>
      ))}
    </div>
  )
}

/** Before the browser's clock is known (server render, hydration): rows' shapes, not their times. */
export function InboxSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-1 px-4 py-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className={cn('h-3', i % 2 ? 'w-2/3' : 'w-4/5')} />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
