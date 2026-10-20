'use client'

import { notificationCenterLabels } from '@youj/core/labels'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useLocale, type YoujLabels } from '@youj/core'
import { Counter, PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { BellIcon, CheckIcon, InboxIcon, type IconProps } from '@youj/icons'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useIsMobile } from '../../hooks/use-mobile'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from './popover'
import { ScrollArea } from './scroll-area'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { relativeTime } from './timeline'
import { toast } from './toast'

/* A bell with an unread count that opens your notifications: a Popover on
 * desktop, a bottom Sheet on small screens. Inside, Tabs filter All /
 * Unread / Mentions; items are grouped into Today and Earlier, each with who,
 * what, when, an unread dot and optional actions; "Mark all as read" clears
 * the lot.
 * - Motion: when a notification arrives the bell swings (youj's BellIcon,
 *   once), the count rolls to its new number and the badge pops in from
 *   nothing on the first unread. Open, arrivals take their slot at the top
 *   (motion's PresenceList) and items marked read leave the Unread tab the same
 *   way. Reduced motion: no swing or pop; the count and the list change in
 *   place.
 * - Access: the bell's name carries the count ("Notifications, 3 unread"),
 *   arrivals are announced politely, each item's actions (and "Mark as
 *   read") are real buttons, and every tab has an empty state.
 * - Toasts: useNotificationToasts shows a toast for each arrival while the
 *   center is closed, so it pairs with <Toaster />. */

interface NotificationItem {
  id: string
  title: ReactNode
  /** Plain text for announcements and toasts when `title` is not a string. */
  summary?: string
  body?: ReactNode
  time: Date | string | number
  read?: boolean
  /** Shows under Mentions. */
  mention?: boolean
  actor?: { name: string; src?: string }
  /** Shown instead of an avatar when there is no actor. */
  icon?: ComponentType<IconProps>
  actions?: { label: string; onClick: () => void; variant?: 'default' | 'outline' }[]
}

interface NotificationCenterProps {
  notifications: readonly NotificationItem[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The moment Today and relative times count from, pinned (a demo's clock, a test). Default: the clock when the list opens. */
  now?: Date | number
  className?: string
}

const plain = (item: NotificationItem) => item.summary ?? (typeof item.title === 'string' ? item.title : undefined)

/** Ids of notifications that were not there on the last render (arrivals). Seeded with the first render's ids. */
function useArrivals(items: readonly NotificationItem[]) {
  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(items.map((item) => item.id))
  const arrivals = items.filter((item) => !seen.current!.has(item.id))
  useEffect(() => {
    for (const item of arrivals) seen.current!.add(item.id)
  })
  return arrivals
}

/**
 * Shows a toast for each notification that arrives while `enabled` (e.g.
 * while the center is closed). Render one <Toaster /> in the app.
 */
function useNotificationToasts(items: readonly NotificationItem[], { enabled = true }: { enabled?: boolean } = {}) {
  const arrivals = useArrivals(items)
  useEffect(() => {
    if (!enabled) return
    for (const item of arrivals) {
      const action = item.actions?.[0]
      const title = item.actor ? (
        <>
          <span className="own:font-semibold">{item.actor.name}</span> {item.title}
        </>
      ) : (
        item.title
      )
      toast(title, {
        id: `notification-${item.id}`,
        description: item.body,
        action: action && { label: action.label, onClick: action.onClick },
      })
    }
  })
}

function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, open: openProp, onOpenChange, locale: localeProp, now, className }: NotificationCenterProps) {
  const k = useYouj()
  const labels = useComponentLabels(notificationCenterLabels)
  const locale = useLocale(localeProp)
  const mobile = useIsMobile()
  const [innerOpen, setInnerOpen] = useState(false)
  const open = openProp ?? innerOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }
  const unread = notifications.filter((item) => !item.read).length
  const arrivals = useArrivals(notifications)
  const [ringing, setRinging] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const ringTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(ringTimer.current), [])

  // A new unread notification rings the bell once and is announced. A second
  // arrival mid-swing extends the ring rather than stacking another.
  useEffect(() => {
    const fresh = arrivals.filter((item) => !item.read)
    if (fresh.length === 0) return
    const text = plain(fresh[0]!)
    setAnnouncement(text ? labels.notificationNew(text) : labels.notificationsNew(fresh.length))
    if (k.reduced) return
    setRinging(true)
    clearTimeout(ringTimer.current)
    ringTimer.current = setTimeout(() => setRinging(false), k.ms('deliberate') * 1.2)
  })

  const label = unread > 0 ? labels.notificationsUnread(unread) : labels.notifications
  const trigger = (
    <Button variant="ghost" size="icon" aria-label={label} data-slot="notification-trigger" className={cn('relative', className)}>
      {/* Controlled only while ringing, so the bell also plays on hover. */}
      <BellIcon active={ringing || undefined} trigger="hover" size={16} />
      <UnreadBadge count={unread} />
    </Button>
  )
  const panel = (
    <NotificationPanel
      notifications={notifications}
      unread={unread}
      onMarkRead={onMarkRead}
      onMarkAllRead={onMarkAllRead}
      locale={locale}
      now={now}
      Title={mobile ? SheetTitle : PopoverTitle}
    />
  )

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {mobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={trigger} />
          {/* shape: a bottom sheet rounds only its top edge, with the overlay's large corner token */}
          <SheetContent side="bottom" className="own:rounded-t-overlay-lg">
            {panel}
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={trigger} />
          <PopoverContent align="end" className="w-95 gap-0 overflow-hidden own:p-0">
            {panel}
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}

/** The count on the bell: rolls between numbers, pops in on the first unread, 99+ past that. */
function UnreadBadge({ count }: { count: number }) {
  const k = useYouj()
  if (count === 0) return null
  return (
    <span
      aria-hidden
      data-slot="notification-count"
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'pointer-events-none absolute -end-0.5 -top-0.5 own:flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1',
        'own:text-ui-xs own:leading-none own:font-semibold own:text-on-accent own:tabular-nums ring-2 ring-canvas',
        'transition-[scale] yj-duration-base ease-enter starting:scale-0',
      )}
    >
      {count > 99 ? '99+' : <Counter value={count} mode="roll" inView={false} duration="slow" ease="standard" />}
    </span>
  )
}

type Filter = 'all' | 'unread' | 'mentions'

function NotificationPanel({
  notifications,
  unread,
  onMarkRead,
  onMarkAllRead,
  locale,
  now,
  Title,
}: {
  notifications: readonly NotificationItem[]
  unread: number
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  locale: string
  now?: Date | number
  Title: typeof PopoverTitle | typeof SheetTitle
}) {
  const labels = useComponentLabels(notificationCenterLabels)
  const [filter, setFilter] = useState<Filter>('all')
  const filtered: Record<Filter, NotificationItem[]> = {
    all: [...notifications],
    unread: notifications.filter((item) => !item.read),
    mentions: notifications.filter((item) => item.mention),
  }
  return (
    <div data-slot="notification-panel" className="own:flex own:min-h-0 flex-col">
      <div className="own:flex items-center justify-between gap-3 px-4 pt-3.5 pb-1">
        <Title className="own:text-ui-lg own:font-semibold">{labels.notifications}</Title>
        {onMarkAllRead && (
          <Button variant="ghost" size="xs" className="-me-1.5" disabled={unread === 0} onClick={onMarkAllRead}>
            <CheckIcon size={14} />
            {labels.notificationsMarkAllRead}
          </Button>
        )}
      </div>
      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="own:min-h-0 own:gap-0">
        {/* A full-bleed row on the title's inset: the labels (or Bezel's track) start where the title does. */}
        <TabsList inset className="[--tabs-inset:--spacing(4)]">
          <TabsTrigger value="all">{labels.notificationsAll}</TabsTrigger>
          <TabsTrigger value="unread">
            {labels.notificationsUnreadTab}
            {unread > 0 && <span className="rounded-full bg-accent-subtle px-1.5 own:text-ui-xs own:text-accent-text own:tabular-nums">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="mentions">{labels.notificationsMentions}</TabsTrigger>
        </TabsList>
        {(['all', 'unread', 'mentions'] as const).map((key) => (
          <TabsContent key={key} value={key} className="own:min-h-0 own:rounded-none">
            <NotificationList items={filtered[key]} filter={key} onMarkRead={onMarkRead} locale={locale} pinned={now} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

const emptyCopy = (labels: Pick<YoujLabels, keyof typeof notificationCenterLabels>): Record<Filter, { title: string; description: string }> => ({
  all: { title: labels.notificationsEmptyTitle, description: labels.notificationsEmptyDescription },
  unread: { title: labels.notificationsCaughtUpTitle, description: labels.notificationsCaughtUpDescription },
  mentions: { title: labels.notificationsNoMentionsTitle, description: labels.notificationsNoMentionsDescription },
})

function NotificationList({
  items,
  filter,
  onMarkRead,
  locale,
  pinned,
}: {
  items: NotificationItem[]
  filter: Filter
  onMarkRead?: (id: string) => void
  locale: string
  pinned?: Date | number
}) {
  // Times are as of when the list opened; it is short-lived. A pinned now takes over once the page is live.
  const clock = useNow(0)
  const now = clock === null ? null : pinned === undefined ? clock : +pinned
  const labels = useComponentLabels(notificationCenterLabels)
  if (items.length === 0) {
    return (
      <Empty className="own:py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyCopy(labels)[filter].title}</EmptyTitle>
          <EmptyDescription>{emptyCopy(labels)[filter].description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  const sorted = [...items].sort((a, b) => +new Date(b.time) - +new Date(a.time))
  // Server and hydration renders don't know the browser's today (see useNow).
  const today = now === null ? null : new Date(now).setHours(0, 0, 0, 0)
  const groups = (
    today === null
      ? [{ label: labels.notificationsRecent, items: sorted }]
      : [
          { label: labels.today, items: sorted.filter((item) => +new Date(item.time) >= today) },
          { label: labels.notificationsEarlier, items: sorted.filter((item) => +new Date(item.time) < today) },
        ]
  ).filter((group) => group.items.length > 0)

  return (
    <ScrollArea className="own:max-h-[min(var(--spacing)*105,60dvh)]" viewportClassName="own:max-h-[min(var(--spacing)*105,60dvh)]">
      <div className="own:flex flex-col gap-1 py-2">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h3 className="px-4 pt-1 pb-1 own:text-ui-xs own:font-medium own:text-fg-muted">{group.label}</h3>
            <PresenceList className="own:flex flex-col own:px-1.5">
              {group.items.map((item) => (
                <PresenceItem key={item.id} data-slot="notification-item" data-read={item.read || undefined}>
                  <NotificationRow item={item} now={now} onMarkRead={onMarkRead} locale={locale} />
                </PresenceItem>
              ))}
            </PresenceList>
          </section>
        ))}
      </div>
    </ScrollArea>
  )
}

function NotificationRow({ item, now, onMarkRead, locale }: { item: NotificationItem; now: number | null; onMarkRead?: (id: string) => void; locale: string }) {
  const labels = useComponentLabels(notificationCenterLabels)
  const date = new Date(item.time)
  const Icon = item.icon ?? BellIcon
  return (
    <div
      data-yj-trigger=""
      className={cn(
        'group/item relative own:flex gap-3 rounded-lg px-2.5 py-2.5 transition-colors yj-duration-fast ease-standard hover:bg-hover',
        'focus-within:bg-hover',
      )}
    >
      {/* The unread dot sits in the gutter at the inline start. */}
      <span
        aria-hidden
        className={cn(
          'absolute start-0.5 top-4 size-1.5 rounded-full bg-accent transition-[opacity,scale] yj-duration-base ease-standard',
          item.read && 'scale-50 opacity-0',
        )}
      />
      {item.actor ? (
        <Avatar size="sm" aria-hidden className="mt-0.5">
          {item.actor.src && <AvatarImage src={item.actor.src} alt="" />}
          <AvatarFallback>{item.actor.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      ) : (
        <span aria-hidden className="own:mt-0.5 own:grid size-6 shrink-0 place-items-center rounded-full border border-line bg-surface own:text-fg-muted">
          <Icon size={12} strokeWidth={2} />
        </span>
      )}
      <div className="own:flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn('own:text-ui', item.read ? 'own:text-fg-muted' : 'own:text-fg')}>
          <span className="sr-only">{item.read ? '' : labels.notificationUnreadPrefix}</span>
          {item.actor && <span className="own:font-medium own:text-fg">{item.actor.name} </span>}
          {item.title}
        </p>
        {item.body && <p className="own:line-clamp-2 own:text-ui-sm own:text-fg-muted">{item.body}</p>}
        <time dateTime={date.toISOString()} className="own:text-ui-xs own:text-fg-muted own:tabular-nums">
          {relativeTime(date, now, locale, labels.justNow)}
        </time>
        {item.actions && item.actions.length > 0 && (
          <div className="mt-1.5 own:flex flex-wrap gap-1.5">
            {item.actions.map((action) => (
              <Button key={action.label} size="xs" variant={action.variant ?? 'outline'} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {!item.read && onMarkRead && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={labels.notificationsMarkRead}
          onClick={() => onMarkRead(item.id)}
          className="-me-1 opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100 focus-visible:opacity-100 touch:opacity-100"
        >
          <CheckIcon size={14} />
        </Button>
      )}
    </div>
  )
}

export { NotificationCenter, useNotificationToasts, type NotificationCenterProps, type NotificationItem }
