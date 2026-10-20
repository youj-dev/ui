import type { ComponentType } from 'react'
import { AtSignIcon, KeyIcon, MessageIcon, RocketIcon, UserPlusIcon, GitPullRequestIcon, type IconProps } from '@youj/icons'
import { DEFAULT_COPY as THREAD_COPY, demo, type CommentThreadPerson } from '../comment-thread/data'

export { demo }

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export type ActivityInboxPerson = CommentThreadPerson

/** A button on a notification: Approve, Decline, Merge. `done` is what the row says once it worked. */
export interface ActivityInboxAction {
  id: string
  label: string
  done: string
  variant?: 'default' | 'outline' | 'danger'
}

/** One notification: often a bundle ("Mara and 2 others replied in…"). */
export interface ActivityInboxNotification {
  id: string
  /** A key of `kinds`: reply, mention, assign, review, access, deploy, or your own. */
  kind: string
  /** Who; several when it's a bundle. None for the system's own. */
  actors: ActivityInboxPerson[]
  /** The words between who and what: "replied in", "requested access to". */
  action: string
  /** What it's about, and where that lives: "Q4 launch plan" in "Docs · Marketing". */
  subject: { label: string; href?: string; context?: string }
  time: Date | number | string
  read?: boolean
  /** The latest words (markdown-lite), under the line. */
  preview?: string
  /** How many new things it bundles: "3 new". */
  count?: number
  /** Shows under Mentions. */
  mention?: boolean
  /** Can be answered from here: Reply opens the composer under it. */
  replyable?: boolean
  actions?: ActivityInboxAction[]
  /** Snoozed until then: it waits under Snoozed and comes back on its own. */
  snoozedUntil?: Date | number | string | null
}

export interface ActivityInboxKind {
  icon: ComponentType<IconProps>
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

export const KINDS: Record<string, ActivityInboxKind> = {
  reply: { icon: MessageIcon },
  mention: { icon: AtSignIcon, tone: 'accent' },
  assign: { icon: UserPlusIcon },
  review: { icon: GitPullRequestIcon, tone: 'accent' },
  access: { icon: KeyIcon, tone: 'warning' },
  deploy: { icon: RocketIcon, tone: 'danger' },
}

export type Tab = 'inbox' | 'mentions' | 'snoozed'

/** Every string the block shows or announces, the composer's included. */
export const DEFAULT_COPY = {
  ...THREAD_COPY,
  title: 'Inbox',
  demoData: 'Demo data',
  tabs: 'Show',
  inbox: 'Inbox',
  mentions: 'Mentions',
  snoozed: 'Snoozed',
  unread: (n: number) => `${n} unread`,
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  unreadPrefix: 'Unread:',
  done: 'Done',
  snooze: 'Snooze',
  unsnooze: 'Unsnooze',
  laterToday: 'Later today',
  tomorrow: 'Tomorrow',
  nextWeek: 'Next week',
  until: (when: string) => `Until ${when}`,
  others: (n: number) => `${n} ${plural(n, 'other', 'others')}`,
  fresh: (n: number) => `${n} new`,
  reply: 'Reply',
  replyPlaceholder: 'Reply…',
  replyIn: (subject: string) => `Reply in ${subject}`,
  replied: 'You replied',
  undo: 'Undo',
  doneUndo: (subject: string) => `Done: ${subject}`,
  snoozedUndo: (subject: string, when: string) => `Snoozed ${subject} until ${when}`,
  keys: 'Keys',
  hintMove: 'move',
  hintDone: 'done',
  hintSnooze: 'snooze',
  hintReply: 'reply',
  hintRead: 'read',
  emptyTitle: 'You’re all caught up',
  emptyDescription: 'New replies, mentions and requests land here.',
  noMentionsTitle: 'No mentions',
  noMentionsDescription: 'When someone @mentions you, it lands here.',
  noSnoozedTitle: 'Nothing snoozed',
  noSnoozedDescription: 'Snooze a notification to have it come back when you’re ready.',
  loading: 'Loading notifications…',
  errorTitle: 'Notifications didn’t load',
  announceArrived: (summary: string) => `New: ${summary}`,
  announceDone: (subject: string) => `Done: ${subject}.`,
  announceSnoozed: (when: string) => `Snoozed until ${when}.`,
  announceRead: 'Marked as read.',
  announceUnread: 'Marked as unread.',
  announceAllRead: 'All marked as read.',
  announceReplied: 'Reply sent.',
}

export type ActivityInboxCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The demo's clock, fixed so the server and the browser render the same times; it ticks on once mounted. */
export const DEMO_NOW = Date.UTC(2026, 9, 9, 15, 20)
const MIN = 60_000
const HOUR = 60 * MIN

const MARA: ActivityInboxPerson = { id: 'mara', name: 'Mara Okafor', handle: 'mara' }
const THEO: ActivityInboxPerson = { id: 'theo', name: 'Theo Lindqvist', handle: 'theo' }
const PRIYA: ActivityInboxPerson = { id: 'priya', name: 'Priya Raman', handle: 'priya' }
const JONAS: ActivityInboxPerson = { id: 'jonas', name: 'Jonas Weber', handle: 'jonas' }
const AIKO: ActivityInboxPerson = { id: 'aiko', name: 'Aiko Tanaka', handle: 'aiko' }
export const DEMO_PEOPLE = [MARA, THEO, PRIYA, JONAS, AIKO]

export const demoNotifications = (now: number): ActivityInboxNotification[] => [
  {
    id: 'n-launch',
    kind: 'reply',
    actors: [MARA, PRIYA, JONAS],
    action: 'replied in',
    subject: { label: 'Q4 launch plan', href: '#q4-launch-plan', context: 'Docs · Marketing' },
    time: now - 4 * MIN,
    count: 3,
    preview: 'Works for me. Can we move social to **10:30**? The video export takes a while.',
    replyable: true,
  },
  {
    id: 'n-access',
    kind: 'access',
    actors: [AIKO],
    action: 'requested edit access to',
    subject: { label: 'Billing settings', context: 'Workspace' },
    time: now - 18 * MIN,
    actions: [
      { id: 'approve', label: 'Approve', done: 'Approved: Aiko can edit now' },
      { id: 'decline', label: 'Decline', done: 'Declined', variant: 'outline' },
    ],
  },
  {
    id: 'n-mention',
    kind: 'mention',
    actors: [THEO],
    action: 'mentioned you in',
    subject: { label: 'Export times out', href: '#export-times-out', context: 'Issues · ENG-482' },
    time: now - 52 * MIN,
    mention: true,
    preview: '@jordan can you confirm the 52k-row repro on staging before Friday?',
    replyable: true,
  },
  {
    id: 'n-review',
    kind: 'review',
    actors: [JONAS],
    action: 'asked you to review',
    subject: { label: 'Stream rows in the CSV export', href: '#pr-311', context: 'atlas/web · PR 311' },
    time: now - 2 * HOUR,
    actions: [{ id: 'merge', label: 'Approve', done: 'Approved' }],
  },
  {
    id: 'n-deploy',
    kind: 'deploy',
    actors: [],
    action: 'Deploy failed on',
    subject: { label: 'api · staging', context: 'Type error in billing.ts' },
    time: now - 5 * HOUR,
    read: true,
  },
  {
    id: 'n-assign',
    kind: 'assign',
    actors: [MARA],
    action: 'assigned you',
    subject: { label: 'Pricing page v2', context: 'Projects · Launch' },
    time: now - 26 * HOUR,
    read: true,
  },
  {
    id: 'n-snoozed',
    kind: 'mention',
    actors: [PRIYA],
    action: 'mentioned you in',
    subject: { label: 'Onboarding checklist', context: 'Docs · Growth' },
    time: now - 30 * HOUR,
    mention: true,
    read: true,
    preview: '@jordan let’s cut step three and fold it into the welcome email.',
    snoozedUntil: now + 20 * HOUR,
  },
]

/** What happens while the demo is open: another reply joins the launch thread, then a new request lands. */
export const DEMO_ARRIVALS: { after: number; update: (list: ActivityInboxNotification[], now: number) => ActivityInboxNotification[] }[] = [
  {
    after: 7000,
    update: (list, now) =>
      list.map((n) =>
        n.id === 'n-launch'
          ? {
              ...n,
              actors: [THEO, ...n.actors.filter((a) => a.id !== THEO.id)],
              count: (n.count ?? 1) + 1,
              time: now,
              read: false,
              preview: 'Moving social to 10:30 is fine. I’ll update the schedule.',
            }
          : n,
      ),
  },
  {
    after: 15000,
    update: (list, now) => [
      {
        id: 'n-invite',
        kind: 'access',
        actors: [THEO],
        action: 'invited you to',
        subject: { label: 'Design review', context: 'Calendar · Today, 4:30 PM' },
        time: now,
        actions: [
          { id: 'accept', label: 'Accept', done: 'Accepted' },
          { id: 'decline', label: 'Decline', done: 'Declined', variant: 'outline' },
        ],
      },
      ...list,
    ],
  },
]
