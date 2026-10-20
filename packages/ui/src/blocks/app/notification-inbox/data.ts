import { dateTimeFormat } from '../../../lib/utils'
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** What a notification is about. People write mentions and comments; the system sends the rest. */
export type Kind = 'mention' | 'comment' | 'deploy' | 'billing' | 'security' | (string & {})
export type Filter = 'all' | 'mentions' | 'system'
export type Channel = 'inApp' | 'email' | 'push'

export const SYSTEM_KINDS: readonly Kind[] = ['deploy', 'billing', 'security']
export const CHANNELS: readonly Channel[] = ['inApp', 'email', 'push']

export interface InboxNotification {
  id: string
  kind: Kind
  /** Who did it. Left out for the system's own notices. */
  actor?: { name: string; src?: string }
  /** What happened, after the actor's name when there is one: "mentioned you in". */
  action: string
  /** The thing it happened to: a doc, a deploy, an invoice. */
  subject: string
  /** A line of context: the comment, the error, the amount. */
  body?: string
  time: Date | number
  read?: boolean
}

/** Where each kind of notification reaches you. */
export type Preferences = Record<string, Record<Channel, boolean>>

export const DEFAULT_PREFERENCES: Preferences = {
  mention: { inApp: true, email: true, push: true },
  comment: { inApp: true, email: false, push: false },
  deploy: { inApp: true, email: false, push: true },
  billing: { inApp: true, email: true, push: false },
  security: { inApp: true, email: true, push: true },
}

/** Channels a kind always uses, whatever the switches say. */
export const LOCKED: Partial<Record<Kind, readonly Channel[]>> = { security: ['email'] }

export const matches = (item: InboxNotification, filter: Filter, systemKinds: readonly Kind[] = SYSTEM_KINDS) =>
  filter === 'all' || (filter === 'mentions' ? item.kind === 'mention' : systemKinds.includes(item.kind))

/** Every string the page shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  brand: 'Northwind',
  account: 'Your account',
  title: 'Notifications',
  subtitle: 'Mentions, replies and alerts from across your workspace.',
  inbox: 'Inbox',
  unreadCount: (n: number) => (n ? `${n} unread` : 'All read'),
  loading: 'Loading notifications…',
  filters: 'Filter notifications',
  all: 'All',
  mentions: 'Mentions',
  system: 'System',
  unreadOnly: 'Unread only',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  archive: 'Archive',
  open: (item: InboxNotification) => `${item.actor ? `${item.actor.name} ` : ''}${item.action} ${item.subject}`,
  unreadPrefix: 'Unread:',
  today: 'Today',
  earlier: 'Earlier',
  justNow: 'Just now',
  announceRead: 'Marked as read.',
  announceUnread: 'Marked as unread.',
  announceArchived: (subject: string) => `Archived ${subject}.`,
  announceAllRead: 'All notifications marked as read.',
  emptyTitle: 'You’re all caught up',
  emptyDescription: 'New mentions, replies and alerts will show up here as they happen.',
  noUnreadTitle: 'Nothing unread',
  noUnreadDescription: 'Everything here has been read. Turn off Unread only to see it all.',
  showAll: 'Show everything',
  noMentionsTitle: 'No mentions',
  noMentionsDescription: 'When someone @mentions you in a doc or a comment, it lands here.',
  noSystemTitle: 'No system notices',
  noSystemDescription: 'Deploys, billing and security alerts land here.',
  preferences: 'Preferences',
  preferencesDescription: 'Choose where each kind of notification reaches you.',
  kind: 'Notification',
  channels: { inApp: 'In-app', email: 'Email', push: 'Push' } satisfies Record<Channel, string>,
  kinds: {
    mention: { label: 'Mentions', description: 'Someone @mentions you' },
    comment: { label: 'Replies', description: 'Comments on your docs and threads' },
    deploy: { label: 'Deploys', description: 'Builds that fail or go live' },
    billing: { label: 'Billing', description: 'Invoices and plan changes' },
    security: { label: 'Security', description: 'New sign-ins and key changes' },
  } as Record<string, { label: string; description: string }>,
  channelFor: (channel: string, kind: string) => `${channel} for ${kind}`,
  required: (channel: string) => `${channel} is always on.`,
  quiet: 'Do not disturb',
  quietDescription: 'Pause email and push until 9:00 tomorrow. Security alerts still come through.',
  savedHint: 'Changes save as you make them.',
}
export type NotificationsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

/** Minutes ago, kept inside today, so today's notifications stay under Today even just after midnight. */
function today(now: number, minutes: number) {
  const midnight = new Date(now).setHours(0, 0, 0, 0)
  return Math.max(midnight, now - minutes * MINUTE)
}

/** A workspace's recent notifications, timed from `now`. */
export function demoNotifications(now: number): InboxNotification[] {
  return [
    {
      id: 'n1',
      kind: 'mention',
      actor: { name: 'Mara Okafor' },
      action: 'mentioned you in',
      subject: 'Q4 launch plan',
      body: 'Could you sanity-check the pricing table before Friday? The annual column looks off.',
      time: today(now, 4),
    },
    {
      id: 'n2',
      kind: 'deploy',
      action: 'Production deploy failed on',
      subject: 'web · main',
      body: 'The build step exited with code 1 after 2m 14s. The previous deploy is still live.',
      time: today(now, 23),
    },
    {
      id: 'n3',
      kind: 'comment',
      actor: { name: 'Theo Lindqvist' },
      action: 'replied on',
      subject: 'Onboarding checklist',
      body: 'Agreed. Let’s drop step three and fold it into the welcome email instead.',
      time: today(now, 52),
    },
    {
      id: 'n4',
      kind: 'security',
      action: 'New sign-in from',
      subject: 'Lisbon, Portugal',
      body: 'Chrome on macOS. If this wasn’t you, reset your password.',
      time: today(now, 128),
    },
    {
      id: 'n5',
      kind: 'mention',
      actor: { name: 'Priya Raman' },
      action: 'mentioned you in',
      subject: 'Settings redesign',
      body: 'The new density option is ready for a look whenever you have ten minutes.',
      time: today(now, 196),
      read: true,
    },
    {
      id: 'n6',
      kind: 'billing',
      action: 'Your invoice is ready for',
      subject: 'September',
      body: '$1,240.00, paid with the Visa ending 4242.',
      time: now - DAY - 3 * 60 * MINUTE,
      read: true,
    },
    {
      id: 'n7',
      kind: 'comment',
      actor: { name: 'Jonas Weber' },
      action: 'commented on',
      subject: 'API rate limits',
      body: 'Could we raise the burst limit for the EU region before the migration?',
      time: now - DAY - 7 * 60 * MINUTE,
      read: true,
    },
    {
      id: 'n8',
      kind: 'mention',
      actor: { name: 'Aiko Tanaka' },
      action: 'mentioned you in',
      subject: 'Hiring plan',
      body: 'Added you as the second interviewer for the design engineer loop.',
      time: now - 2 * DAY - 2 * 60 * MINUTE,
      read: true,
    },
    {
      id: 'n9',
      kind: 'deploy',
      action: 'Preview is ready for',
      subject: 'docs · search-v2',
      time: now - 3 * DAY,
      read: true,
    },
  ]
}

/** What arrives while the page is open, and how long after it opens. */
export interface Arrival {
  after: number
  notification: Omit<InboxNotification, 'time'>
}

export const DEMO_ARRIVALS: Arrival[] = [
  {
    after: 7000,
    notification: {
      id: 'live-1',
      kind: 'mention',
      actor: { name: 'Sam Carter' },
      action: 'mentioned you in',
      subject: 'Q4 launch plan',
      body: 'Pricing table’s fixed. Thanks for catching the annual column!',
    },
  },
  {
    after: 16000,
    notification: {
      id: 'live-2',
      kind: 'deploy',
      action: 'Production deploy is live on',
      subject: 'web · main',
      body: 'Serving from three regions. The fix for the build step went out with it.',
    },
  },
]

/** "4 min ago" today, the weekday this week, the date before that. */
export function when(time: Date | number, now: number, locale: string, justNow: string) {
  const date = new Date(time)
  const diff = now - date.getTime()
  if (diff < MINUTE) return justNow
  if (date.getTime() >= new Date(now).setHours(0, 0, 0, 0)) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    const minutes = Math.round(diff / MINUTE)
    return minutes < 60 ? rtf.format(-minutes, 'minute') : rtf.format(-Math.round(minutes / 60), 'hour')
  }
  return dateTimeFormat(locale, diff < 6 * DAY ? { weekday: 'short', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(date)
}

export const isToday = (time: Date | number, now: number) => +new Date(time) >= new Date(now).setHours(0, 0, 0, 0)
