'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { AtSignIcon, BellIcon, CheckCheckIcon, InboxIcon, type IconProps } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { NotificationCenter, type NotificationItem } from '../../components/ui/notification-center'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Toggle } from '../../components/ui/toggle'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEFAULT_PREFERENCES,
  DEMO_ARRIVALS,
  demoNotifications,
  LOCKED,
  matches,
  SYSTEM_KINDS,
  type Arrival,
  type Channel,
  type Filter,
  type InboxNotification,
  type Kind,
  type NotificationsCopy,
  type Preferences,
} from './notification-inbox/data'
import { InboxList, InboxSkeleton, KIND_ICON } from './notification-inbox/inbox-list'
import { PreferencesCard } from './notification-inbox/preferences'

/* A notification center as a page: the inbox beside where it reaches you.
 * Notifications are grouped into Today and Earlier and filtered by Tabs (All,
 * Mentions, System) and an Unread only Toggle. Opening a row marks it read
 * (its dot shrinks away); each row can also be marked unread or archived, and
 * Mark all as read clears the lot. While the page is open new ones arrive at
 * the top of Today (motion's PresenceList: they drop in and the rest glide
 * down; archived ones fade and the gap closes), and the bell in the top bar,
 * a NotificationCenter on the same list, rings and rolls its count. Beside
 * the inbox, switches choose each kind's channels (in-app, email, push);
 * turning in-app off stops that kind landing here, and Do not disturb dims
 * email and push. An emptied inbox shows an illustration. It is built for
 * the compact layout density (ui.css), taken from the page. Reduced motion:
 * rows appear and leave in place, and the bell doesn't swing. */

interface NotificationInboxProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (a top bar with the bell, and a centered canvas). */
  embedded?: boolean
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<NotificationsCopy>
  /** The notifications it opens with. Default: a demo workspace's, timed from when the page opens. */
  notifications?: InboxNotification[]
  /** Notifications that arrive while the page is open, `after` ms from when it opens. Default: two demo arrivals. Pass [] for none. */
  incoming?: Arrival[]
  /** Where each kind reaches you, to start with. */
  preferences?: Preferences
  /** The kinds the System tab lists. Default: deploy, billing and security. */
  systemKinds?: readonly Kind[]
  /** Channels a kind always uses, whatever the switches say; those kinds also ignore Do not disturb. Default: security's email. */
  lockedChannels?: Partial<Record<Kind, readonly Channel[]>>
  /** The icon for each kind, on its notification and in the bell. Default: the five built-in kinds'; any other kind gets a bell. */
  kindIcons?: Record<string, ComponentType<IconProps>>
  /** Fires with every change to the switches. */
  onPreferencesChange?: (preferences: Preferences, quiet: boolean) => void
  /** Opening a notification (it's marked read too). */
  onOpen?: (notification: InboxNotification) => void
  /** The picture for an empty inbox: a scene by id, or your own node; `null` for none. Default: the notifications scene. */
  illustration?: IllustrationSlot
  /** Formats its times (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function NotificationInbox({
  theme,
  embedded = true,
  copy: copyProp,
  notifications,
  incoming = DEMO_ARRIVALS,
  preferences: initialPreferences = DEFAULT_PREFERENCES,
  systemKinds = SYSTEM_KINDS,
  lockedChannels = LOCKED,
  kindIcons = KIND_ICON,
  onPreferencesChange,
  onOpen,
  illustration,
  locale,
  className,
  ...rest
}: NotificationInboxProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const { announce, announcer } = useAnnouncer()
  // Null on the server and in hydration: times and Today depend on the browser's clock.
  const now = useNow(60_000)
  const [items, setItems] = useState<InboxNotification[] | null>(notifications ?? null)
  if (items === null && now !== null) setItems(demoNotifications(now))
  const [filter, setFilter] = useState<Filter>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [quiet, setQuiet] = useState(false)
  const inApp = useRef(preferences)
  useLayoutEffect(() => {
    inApp.current = preferences
  })

  // Arrivals, once the list is there. A kind with in-app off doesn't land.
  const ready = items !== null
  useEffect(() => {
    if (!ready) return
    const timers = incoming.map(({ after, notification }) =>
      setTimeout(() => {
        if (inApp.current[notification.kind]?.inApp === false) return
        setItems((list) => (list && !list.some((n) => n.id === notification.id) ? [{ ...notification, time: Date.now() }, ...list] : list))
      }, after),
    )
    return () => timers.forEach(clearTimeout)
  }, [ready, incoming])

  const list = items ?? []
  const unread = list.filter((n) => !n.read)
  const setRead = (ids: string[] | 'all', read: boolean) => setItems((l) => l && l.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, read } : n)))

  const open = (item: InboxNotification) => {
    if (!item.read) setRead([item.id], true)
    onOpen?.(item)
  }
  const toggleRead = (item: InboxNotification) => {
    setRead([item.id], !item.read)
    announce(item.read ? copy.announceUnread : copy.announceRead)
  }
  const archive = (item: InboxNotification) => {
    setItems((l) => l && l.filter((n) => n.id !== item.id))
    announce(copy.announceArchived(item.subject))
  }
  const markAll = () => {
    setRead('all', true)
    announce(copy.announceAllRead)
  }
  const changePreferences = (next: Preferences, nextQuiet: boolean) => {
    setPreferences(next)
    setQuiet(nextQuiet)
    onPreferencesChange?.(next, nextQuiet)
  }

  // The bell reads the same list.
  const centre: NotificationItem[] = list.map((n) => ({
    id: n.id,
    title: `${n.action} ${n.subject}`,
    body: n.body,
    time: n.time,
    read: n.read,
    mention: n.kind === 'mention',
    actor: n.actor,
    icon: kindIcons[n.kind] ?? BellIcon,
  }))

  const tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: copy.all },
    { value: 'mentions', label: copy.mentions },
    { value: 'system', label: copy.system },
  ]

  const empty = (tab: Filter) => {
    const [title, description] = unreadOnly
      ? [copy.noUnreadTitle, copy.noUnreadDescription]
      : tab === 'all'
        ? [copy.emptyTitle, copy.emptyDescription]
        : tab === 'mentions'
          ? [copy.noMentionsTitle, copy.noMentionsDescription]
          : [copy.noSystemTitle, copy.noSystemDescription]
    let media: ReactNode
    if (tab === 'all' && illustration !== null) {
      media = (
        <div data-slot="inbox-illustration" className="-mt-2 mb-2 flex justify-center">
          <Illustration scene={illustration} fallback="notifications" unit={15} />
        </div>
      )
    } else {
      media = <EmptyMedia variant="icon">{tab === 'mentions' ? <AtSignIcon /> : <InboxIcon />}</EmptyMedia>
    }
    return (
      <Empty className="border-0 py-10">
        <EmptyHeader>
          {media}
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {unreadOnly && list.some((n) => matches(n, tab, systemKinds)) && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setUnreadOnly(false)}>
              {copy.showAll}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  const inbox = (
    <Card className="w-full min-w-0 pb-2">
      <CardHeader>
        <CardTitle>
          <h2>{copy.inbox}</h2>
        </CardTitle>
        <CardDescription aria-live="polite" className="tabular-nums">
          {ready ? copy.unreadCount(unread.length) : copy.loading}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Toggle variant="outline" size="sm" pressed={unreadOnly} onPressedChange={setUnreadOnly} className="px-2.5">
            {copy.unreadOnly}
          </Toggle>
          <Button variant="ghost" size="sm" disabled={unread.length === 0} onClick={markAll} aria-label={copy.markAllRead} className="max-sm:w-control-sm max-sm:px-0">
            <CheckCheckIcon size={15} />
            <span className="max-sm:hidden">{copy.markAllRead}</span>
          </Button>
        </CardAction>
      </CardHeader>
      {/* The tabs sit on the card's content inset, lined up with the heading in
       * every style; the rows reach wider so their hover fills the card. */}
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="gap-2">
          <TabsList aria-label={copy.filters} className="w-full">
            {tabs.map((tab) => {
              const count = unread.filter((n) => matches(n, tab.value, systemKinds)).length
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="min-w-5 px-1.5 tabular-nums">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {tabs.map((tab) => {
            const shown = list.filter((n) => matches(n, tab.value, systemKinds) && (!unreadOnly || !n.read))
            return (
              // Everything's height at an app's size: a tab, Unread only or archiving rows never resize the card.
              <TabsContent key={tab.value} value={tab.value} className="-mx-[calc(var(--card-spacing)---spacing(2))] h-195.25 flex-none overflow-y-auto yj-scrollbar">
                {now === null || !ready ? (
                  <InboxSkeleton label={copy.loading} />
                ) : shown.length === 0 ? (
                  empty(tab.value)
                ) : (
                  <InboxList items={shown} now={now} copy={copy} kindIcons={kindIcons} onOpen={open} onToggleRead={toggleRead} onArchive={archive} />
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )

  const body = (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(92)]">
      {inbox}
      <PreferencesCard
        copy={copy}
        value={preferences}
        locked={lockedChannels}
        quiet={quiet}
        onQuietChange={(next) => changePreferences(preferences, next)}
        onChange={(kind, channel, on) => changePreferences({ ...preferences, [kind]: { ...preferences[kind], [channel]: on } as Record<Channel, boolean> }, quiet)}
      />
    </div>
  )

  const page = embedded ? (
    <AppPage {...rest} title={copy.title} description={copy.subtitle} width="fill" className={cn('text-fg', className)}>
      {body}
      {announcer}
    </AppPage>
  ) : (
    <div {...rest} className={cn('flex min-h-dvh flex-col bg-canvas text-fg', className)}>
      <header data-yj-tone="header" className="border-b border-line bg-chrome">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 text-ui font-semibold tracking-tight">
            <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-ui-xs text-on-accent">
              {copy.brand.charAt(0)}
            </span>
            {copy.brand}
          </span>
          <div className="ms-auto flex items-center gap-2">
            <NotificationCenter notifications={centre} onMarkRead={(id) => setRead([id], true)} onMarkAllRead={markAll} locale={copy.locale} />
            <Avatar size="sm" role="img" aria-label={copy.account}>
              <AvatarFallback className="text-ui-xs font-medium">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main aria-labelledby={titleId} className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-1">
          <h1 id={titleId} className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="text-ui text-pretty text-fg-muted">{copy.subtitle}</p>
        </div>
        {body}
      </main>
      {announcer}
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { NotificationInbox, type NotificationInboxProps }
