'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ElementType, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import type { IllustrationSlot } from '@youj/illustrations'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CheckCheckIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, dateTimeFormat } from '../../lib/utils'
import { peopleByHandle } from './comment-thread/markdown'
import { useClock } from './comment-thread/time'
import {
  DEFAULT_COPY,
  DEMO_NOW,
  DEMO_PEOPLE,
  KINDS,
  type ActivityInboxCopy,
  type ActivityInboxKind,
  type ActivityInboxNotification,
  type ActivityInboxPerson,
  type Tab,
} from './inbox/data'
import { InboxEmpty, InboxError, InboxFooter, InboxSkeleton } from './inbox/parts'
import { InboxRow } from './inbox/row'
import { useInbox, type InboxHandlers, type InboxItem } from './inbox/use-inbox'

/* The notifications triage panel, for a popover or a side panel: Inbox,
 * Mentions and Snoozed, each with its unread count. A thread is one row
 * ("Mara and 2 others replied in…", 3 new), with its latest words and what
 * you can do in place: approve or decline a request, reply under it (the
 * Comment thread's composer, mentions included), snooze it (later today,
 * tomorrow, next week) or mark it done, with Undo. From the keyboard: ↑ ↓
 * (or J K) move, Enter opens, E done, S snooze, R reply, U read or unread.
 * News lands at the top and is announced; a thread with news is unread
 * again. Without `notifications`, a demo: a reply joins the launch thread,
 * then an invitation arrives. Reduced motion: rows move in place. */

interface ActivityInboxProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`. Default true; `false` draws its own page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  headingLevel?: 1 | 2 | 3
  locale?: string
  copy?: Partial<ActivityInboxCopy>
  /** The notifications, any order. Default: a workspace's, with news arriving (a demo, marked). */
  notifications?: ActivityInboxNotification[]
  /** Your own kinds (icon and tone), or changes to the built-in ones: reply, mention, assign, review, access, deploy. */
  kinds?: Record<string, ActivityInboxKind>
  /** Who can be @mentioned in a reply. Default: the demo's team. */
  people?: ActivityInboxPerson[]
  /** The signed-in person: their @mentions are lit. Default: the demo's Jordan. */
  user?: ActivityInboxPerson
  /** The tab on show, when your app owns it; pair with `onTabChange`. */
  tab?: Tab
  defaultTab?: Tab
  onTabChange?: (tab: Tab) => void
  now?: Date | number
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  demoMarker?: boolean
  /** The picture when the inbox is empty: a scene by id, your own node, or `null`. Default: the success scene. */
  illustration?: IllustrationSlot
  /** Renders the subjects' links: your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Opening a notification (Enter, or a press on the row); it's marked read too. */
  onOpen?: (notification: ActivityInboxNotification) => void
  onMarkRead?: InboxHandlers['onMarkRead']
  onMarkAllRead?: InboxHandlers['onMarkAllRead']
  onDone?: InboxHandlers['onDone']
  onSnooze?: InboxHandlers['onSnooze']
  onAction?: InboxHandlers['onAction']
  onReply?: InboxHandlers['onReply']
  /** Classes for its parts: `list` is the region under the header, the tabs and the notifications that scroll under them (its height, 520px at 100%, holds the card's size as tabs switch and rows come and go). */
  classNames?: { list?: string }
}

const USER: ActivityInboxPerson = { id: 'you', name: 'Jordan Diaz', handle: 'jordan' }
const TABS: Tab[] = ['inbox', 'mentions', 'snoozed']

function ActivityInbox({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  notifications,
  kinds: kindsProp,
  people = DEMO_PEOPLE,
  user = USER,
  tab: tabProp,
  defaultTab = 'inbox',
  onTabChange,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  demoMarker = true,
  illustration,
  linkComponent = 'a',
  onOpen,
  onMarkRead,
  onMarkAllRead,
  onDone,
  onSnooze,
  onAction,
  onReply,
  classNames,
  className,
  ...rest
}: ActivityInboxProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy: ActivityInboxCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const simulated = notifications === undefined
  const { now, read } = useClock(nowProp !== undefined ? +nowProp : simulated ? DEMO_NOW : undefined)
  const everyone = useMemo(() => (people.some((p) => p.id === user.id) ? people : [...people, user]), [people, user])
  const byHandle = useMemo(() => peopleByHandle(everyone), [everyone])
  const inbox = useInbox({
    notifications,
    copy,
    read,
    live: simulated && visible && !loading,
    people: byHandle,
    handlers: { onMarkRead, onMarkAllRead, onDone, onSnooze, onAction, onReply },
  })
  const kinds = { ...KINDS, ...kindsProp }
  const [tab, setTabState] = useControllableState(tabProp, defaultTab)
  const [focused, setFocused] = useState<string | null>(null)
  const [replying, setReplying] = useState<string | null>(null)
  const [snoozing, setSnoozing] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null)
  const { announce, announcer } = useAnnouncer()
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = (['h1', 'h2', 'h3'] as const)[level - 1]!

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(null), 6000)
    return () => clearTimeout(timer)
  }, [undo])

  const isSnoozed = (item: InboxItem) => item.snoozedUntil != null && (now === null || item.snoozedUntil > now)
  const lists: Record<Tab, InboxItem[]> = {
    inbox: inbox.items.filter((i) => !i.done && !isSnoozed(i)),
    mentions: inbox.items.filter((i) => !i.done && !isSnoozed(i) && i.mention),
    snoozed: inbox.items.filter((i) => !i.done && isSnoozed(i)),
  }
  const unread = lists.inbox.filter((i) => !i.read).length
  const setTab = (next: Tab) => {
    setTabState(next)
    onTabChange?.(next)
  }

  /** Focus the row for `id` (after the render that moves things). */
  const focusRow = (rowId: string | undefined) => {
    if (!rowId) return
    setFocused(rowId)
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLElement>(`[data-yj-row="${rowId.replace(/["\\]/g, '\\$&')}"] [data-slot=inbox-row]`)?.focus(),
    )
  }
  const open = (item: InboxItem) => {
    if (!item.read) void inbox.setRead(item, true)
    onOpen?.(item)
  }
  const done = (item: InboxItem, list: InboxItem[]) => {
    const at = list.indexOf(item)
    focusRow((list[at + 1] ?? list[at - 1])?.id)
    void inbox.done(item, true)
    announce(copy.announceDone(item.subject.label))
    setUndo({ label: copy.doneUndo(item.subject.label), run: () => void inbox.done(item, false) })
  }
  const snooze = (item: InboxItem, until: number | null, list: InboxItem[]) => {
    setSnoozing(null)
    if (until !== null) {
      const at = list.indexOf(item)
      focusRow((list[at + 1] ?? list[at - 1])?.id)
      const when = dateTimeFormat(locale, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(until)
      announce(copy.announceSnoozed(when))
      setUndo({ label: copy.snoozedUndo(item.subject.label, when), run: () => void inbox.snooze(item, item.snoozedUntil ?? null) })
    }
    void inbox.snooze(item, until)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>, list: InboxItem[]) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-yj-row]')
    if (!row || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement).closest('textarea, input, [role=menu]')) return
    const at = list.findIndex((i) => i.id === row.dataset.yjRow)
    const item = list[at]
    if (!item) return
    const key = event.key.toLowerCase()
    const move = key === 'arrowdown' || key === 'j' ? 1 : key === 'arrowup' || key === 'k' ? -1 : 0
    if (move) focusRow(list[Math.min(Math.max(at + move, 0), list.length - 1)]?.id)
    else if (key === 'home' || key === 'end') focusRow(list[key === 'home' ? 0 : list.length - 1]?.id)
    else if (key === 'enter' && (event.target as HTMLElement).dataset.slot === 'inbox-row') open(item)
    else if (key === 'e') done(item, list)
    else if (key === 's') setSnoozing(item.id)
    else if (key === 'r' && item.replyable) setReplying(item.id)
    else if (key === 'u') void inbox.setRead(item, !item.read)
    else return
    event.preventDefault()
  }

  const list = (which: Tab) => {
    const items = lists[which]
    if (!items.length) return <InboxEmpty tab={which} copy={copy} illustration={illustration} />
    const current = items.some((i) => i.id === focused) ? focused : items[0]!.id
    return (
      <PresenceList
        as="ul"
        aria-label={copy[which]}
        className="flex flex-col"
        onKeyDown={(event) => onKeyDown(event as KeyboardEvent<HTMLUListElement>, items)}
      >
        {items.map((item) => (
          <PresenceItem key={item.id} data-yj-row={item.id} className="list-none">
            <InboxRow
              item={item}
              kind={kinds[item.kind] ?? KINDS.reply!}
              copy={copy}
              now={now}
              people={everyone}
              byHandle={byHandle}
              me={user.id}
              inbox={inbox}
              focusable={item.id === current}
              replying={replying === item.id}
              snoozing={snoozing === item.id}
              linkComponent={linkComponent}
              onReplying={(on) => setReplying(on ? item.id : null)}
              onSnoozing={(on) => setSnoozing(on ? item.id : null)}
              onSnooze={(until) => snooze(item, until, items)}
              onDone={() => done(item, items)}
              onOpen={() => open(item)}
            />
          </PresenceItem>
        ))}
      </PresenceList>
    )
  }

  const card = (
    <Card className={cn('w-full gap-0 overflow-clip pb-0', !embedded && !fill && 'max-w-112', !embedded && 'shadow-lg')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={`${id}-title`}>{copy.title}</Title>
          {unread > 0 && (
            <Badge variant="default" className="tabular-nums">
              {copy.unread(unread)}
            </Badge>
          )}
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.markAllRead}
                  disabled={unread === 0}
                  onClick={() => {
                    void inbox.markAllRead()
                    announce(copy.announceAllRead)
                  }}
                />
              }
            >
              <CheckCheckIcon size={15} />
            </TooltipTrigger>
            <TooltipContent>{copy.markAllRead}</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      {/* One height for the tabs and their lists, the loading shapes and the error: switching tabs or clearing rows never resizes the card. */}
      <div className={cn('flex h-130 flex-col', classNames?.list)}>
        {loading ? (
          <InboxSkeleton label={copy.loading} />
        ) : error ? (
          <InboxError error={error} copy={copy} onRetry={onRetry} />
        ) : (
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="min-h-0 flex-1 gap-0">
            <TabsList aria-label={copy.tabs} className="mx-(--card-spacing) w-[calc(100%-var(--card-spacing)*2)]">
              {TABS.map((which) => {
                const count = lists[which].filter((i) => which === 'snoozed' || !i.read).length
                return (
                  <TabsTrigger key={which} value={which}>
                    {copy[which]}
                    {count > 0 && (
                      <Badge variant="secondary" className="min-w-5 px-1.5 tabular-nums">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {TABS.map((which) => (
              <TabsContent
                key={which}
                value={which}
                className="flex min-h-0 flex-col overflow-y-auto px-[calc(var(--card-spacing)-var(--spacing)*3)] py-2 yj-scrollbar"
              >
                {list(which)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
      <InboxFooter
        copy={copy}
        undo={undo?.label ?? null}
        onUndo={() => {
          undo?.run()
          setUndo(null)
        }}
      />
      <p role="status" className="sr-only">
        {inbox.message}
      </p>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={`${id}-title`} {...rest} className={cn('w-full', !fill && 'max-w-112', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={`${id}-title`}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  ActivityInbox,
  type ActivityInboxProps,
  type ActivityInboxCopy,
  type ActivityInboxNotification,
  type ActivityInboxKind,
  type ActivityInboxPerson,
}
export type { ActivityInboxAction, Tab as ActivityInboxTab } from './inbox/data'
