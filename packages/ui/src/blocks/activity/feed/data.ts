import type { ComponentType } from 'react'
import {
  CircleDotIcon,
  FilePlusIcon,
  GitCommitIcon,
  GitMergeIcon,
  MessageIcon,
  RocketIcon,
  SignalIcon,
  StarIcon,
  TagIcon,
  UserPlusIcon,
  type IconProps,
} from '@youj/icons'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export interface ActivityFeedPerson {
  id: string
  name: string
  avatar?: string
}

export type ActivityFeedTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

/** One thing that happened. */
export interface ActivityFeedEvent {
  id: string
  /** A key of `types`: comment, status, priority, assign, label, commit, merge, deploy, create, star, or your own. */
  type: string
  actor: ActivityFeedPerson
  time: Date | number | string
  /** What it happened to: an issue, a doc, a branch. */
  target?: { label: string; href?: string }
  /** A comment's words, shown under the line. */
  excerpt?: string
  /** A field that changed: shown as from → to. */
  change?: { from?: string; to: string }
  /** Labels it gained. */
  labels?: string[]
  /** What it carried (commits, files): listed under the line, folded when there are many. */
  items?: { id: string; label: string; meta?: string; href?: string }[]
  /** An outcome: a deploy's result. */
  status?: { tone: ActivityFeedTone; label: string }
}

/** How a type of event reads: its icon, its words, which filter holds it, and what folds together. */
export interface ActivityFeedType {
  icon: ComponentType<IconProps>
  /** Spoken before the line and named in filters: "Comment". */
  label: string
  /** The words between who and what, given how many things were folded in: "pushed 3 commits to". */
  verb: (count: number) => string
  tone?: ActivityFeedTone
  /** Several people doing it to the same thing in a row fold into one line ("Mara, Theo and 3 others starred…"), or one person's run of it does ("pushed 5 commits"). */
  fold?: 'people' | 'items'
}

/** A filter: a name and the types it shows. */
export interface ActivityFeedFilter {
  id: string
  label: string
  types: string[] | 'all'
}

/** Every string the block shows or announces. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  title: 'Activity',
  demoData: 'Demo data',
  live: 'Live',
  filters: 'Filter activity',
  all: 'All',
  comments: 'Comments',
  changes: 'Changes',
  code: 'Code',
  people: 'People',
  everyone: 'Everyone',
  peopleCount: (n: number) => `${n} ${plural(n, 'person', 'people')}`,
  clearPeople: 'Everyone',
  today: 'Today',
  yesterday: 'Yesterday',
  justNow: 'just now',
  others: (n: number) => `${n} ${plural(n, 'other', 'others')}`,
  showItems: (n: number) => `Show all ${n}`,
  hideItems: 'Show fewer',
  newItems: (n: number) => `${n} new`,
  showNew: (n: number) => `Show ${n} new ${plural(n, 'event', 'events')}`,
  announceNew: (n: number) => `${n} new ${plural(n, 'event', 'events')} in the activity feed.`,
  loadMore: 'Show older activity',
  loadingMore: 'Loading older activity…',
  end: 'That’s everything.',
  emptyTitle: 'No activity yet',
  emptyDescription: 'Comments, changes and deploys will show up here as they happen.',
  noMatchesTitle: 'Nothing matches',
  noMatchesDescription: 'Nothing here fits these filters.',
  clearFilters: 'Clear filters',
  loading: 'Loading activity…',
  errorTitle: 'Activity didn’t load',
  retry: 'Retry',
  failed: 'That didn’t load. Try again.',
  types: {
    comment: { label: 'Comment', verb: () => 'commented on' },
    status: { label: 'Status', verb: () => 'moved' },
    priority: { label: 'Priority', verb: () => 'changed the priority of' },
    assign: { label: 'Assignment', verb: () => 'assigned' },
    label: { label: 'Labels', verb: () => 'labeled' },
    commit: { label: 'Commits', verb: (n: number) => `pushed ${n} ${plural(n, 'commit', 'commits')} to` },
    merge: { label: 'Merge', verb: () => 'merged' },
    deploy: { label: 'Deploy', verb: () => 'deployed' },
    create: { label: 'Created', verb: () => 'created' },
    star: { label: 'Star', verb: () => 'starred' },
  } as Record<string, { label: string; verb: (n: number) => string }>,
}

export type ActivityFeedCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its times and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const LOOK: Record<string, Pick<ActivityFeedType, 'icon' | 'tone' | 'fold'>> = {
  comment: { icon: MessageIcon },
  status: { icon: CircleDotIcon, tone: 'accent' },
  priority: { icon: SignalIcon },
  assign: { icon: UserPlusIcon },
  label: { icon: TagIcon },
  commit: { icon: GitCommitIcon, fold: 'items' },
  merge: { icon: GitMergeIcon, tone: 'accent' },
  deploy: { icon: RocketIcon },
  create: { icon: FilePlusIcon },
  star: { icon: StarIcon, tone: 'warning', fold: 'people' },
}

/** The built-in types, in the copy's words. */
export const defaultTypes = (copy: ActivityFeedCopy): Record<string, ActivityFeedType> =>
  Object.fromEntries(Object.entries(LOOK).map(([key, look]) => [key, { ...look, ...(copy.types[key] ?? { label: key, verb: () => key }) }]))

export const defaultFilters = (copy: ActivityFeedCopy): ActivityFeedFilter[] => [
  { id: 'all', label: copy.all, types: 'all' },
  { id: 'comments', label: copy.comments, types: ['comment'] },
  { id: 'changes', label: copy.changes, types: ['status', 'priority', 'assign', 'label', 'create'] },
  { id: 'code', label: copy.code, types: ['commit', 'merge', 'deploy'] },
]

/** The demo's clock, fixed so the server and the browser render the same times; it ticks on once mounted. */
export const DEMO_NOW = Date.UTC(2026, 9, 9, 15, 20)
const MIN = 60_000
const HOUR = 60 * MIN

const MARA: ActivityFeedPerson = { id: 'mara', name: 'Mara Okafor' }
const THEO: ActivityFeedPerson = { id: 'theo', name: 'Theo Lindqvist' }
const PRIYA: ActivityFeedPerson = { id: 'priya', name: 'Priya Raman' }
const JONAS: ActivityFeedPerson = { id: 'jonas', name: 'Jonas Weber' }
const AIKO: ActivityFeedPerson = { id: 'aiko', name: 'Aiko Tanaka' }
const CI: ActivityFeedPerson = { id: 'ci', name: 'Atlas CI' }

const CHECKOUT = { label: 'Checkout redesign', href: '#checkout-redesign' }
const EXPORT = { label: 'Export times out', href: '#export-times-out' }
const MAIN = { label: 'main' }

/** A product team's week, timed from the demo's now. */
export const demoEvents = (now: number): ActivityFeedEvent[] => [
  {
    id: 'e1',
    type: 'comment',
    actor: MARA,
    target: CHECKOUT,
    time: now - 12 * MIN,
    excerpt: 'Can we keep the old button colours until the A/B test ends?',
  },
  { id: 'e2', type: 'status', actor: THEO, target: CHECKOUT, time: now - 25 * MIN, change: { from: 'In progress', to: 'In review' } },
  { id: 'e3', type: 'commit', actor: JONAS, target: MAIN, time: now - 40 * MIN, items: [{ id: '4f2a91c', label: 'Stream rows in the CSV export' }] },
  { id: 'e4', type: 'commit', actor: JONAS, target: MAIN, time: now - 43 * MIN, items: [{ id: '9b1e07d', label: 'Add an index on created_at' }] },
  {
    id: 'e5',
    type: 'commit',
    actor: JONAS,
    target: MAIN,
    time: now - 47 * MIN,
    items: [{ id: 'e33c5aa', label: 'Raise the export timeout to a minute' }],
  },
  {
    id: 'e6',
    type: 'deploy',
    actor: CI,
    target: { label: 'web to production' },
    time: now - 55 * MIN,
    status: { tone: 'success', label: 'Ready in 2 min 14 sec' },
  },
  { id: 'e7', type: 'star', actor: PRIYA, target: { label: 'Pricing page v2' }, time: now - 65 * MIN },
  { id: 'e8', type: 'star', actor: AIKO, target: { label: 'Pricing page v2' }, time: now - 80 * MIN },
  { id: 'e9', type: 'star', actor: THEO, target: { label: 'Pricing page v2' }, time: now - 95 * MIN },
  { id: 'e10', type: 'assign', actor: AIKO, target: { label: 'Billing settings' }, time: now - 2 * HOUR, change: { to: 'Mara Okafor' } },
  { id: 'e11', type: 'label', actor: PRIYA, target: EXPORT, time: now - 3 * HOUR, labels: ['bug', 'customer'] },
  { id: 'e12', type: 'create', actor: MARA, target: { label: 'Q4 pricing launch' }, time: now - 23 * HOUR },
  {
    id: 'e13',
    type: 'comment',
    actor: THEO,
    target: EXPORT,
    time: now - 25 * HOUR,
    excerpt: 'Repro’d on staging with 52k rows: the request dies at 38 seconds.',
  },
  {
    id: 'e14',
    type: 'deploy',
    actor: CI,
    target: { label: 'api to staging' },
    time: now - 27 * HOUR,
    status: { tone: 'danger', label: 'Build failed: type error in billing.ts' },
  },
  { id: 'e15', type: 'merge', actor: JONAS, target: { label: 'Search v2 into main' }, time: now - 50 * HOUR },
  { id: 'e16', type: 'priority', actor: AIKO, target: { label: 'Billing settings' }, time: now - 52 * HOUR, change: { from: 'Low', to: 'High' } },
]

/** Older pages for Show older activity, timed from the demo's now. */
export const demoOlder = (now: number, page: number): ActivityFeedEvent[] =>
  page === 0
    ? [
        {
          id: 'o1',
          type: 'comment',
          actor: AIKO,
          target: { label: 'Billing settings' },
          time: now - 74 * HOUR,
          excerpt: 'Annual invoices need the VAT number on them.',
        },
        {
          id: 'o2',
          type: 'status',
          actor: MARA,
          target: { label: 'Billing settings' },
          time: now - 76 * HOUR,
          change: { from: 'Backlog', to: 'In progress' },
        },
        { id: 'o3', type: 'star', actor: JONAS, target: { label: 'Search v2' }, time: now - 80 * HOUR },
        { id: 'o4', type: 'star', actor: MARA, target: { label: 'Search v2' }, time: now - 81 * HOUR },
      ]
    : [
        { id: 'o5', type: 'create', actor: PRIYA, target: { label: 'Export times out' }, time: now - 98 * HOUR },
        {
          id: 'o6',
          type: 'deploy',
          actor: CI,
          target: { label: 'web to production' },
          time: now - 100 * HOUR,
          status: { tone: 'success', label: 'Ready in 1 min 58 sec' },
        },
      ]

/** What arrives while the demo is open, and how long after it opens. */
export const DEMO_ARRIVALS: { after: number; event: Omit<ActivityFeedEvent, 'time'> }[] = [
  {
    after: 6000,
    event: { id: 'live-1', type: 'comment', actor: PRIYA, target: CHECKOUT, excerpt: 'Agreed. The test ends Friday, so we swap them Monday.' },
  },
  {
    after: 13000,
    event: { id: 'live-2', type: 'commit', actor: JONAS, target: MAIN, items: [{ id: '1c9d2f0', label: 'Show a progress bar while exporting' }] },
  },
  {
    after: 14000,
    event: { id: 'live-3', type: 'commit', actor: JONAS, target: MAIN, items: [{ id: '7aa03b1', label: 'Retry an export once on timeout' }] },
  },
]
