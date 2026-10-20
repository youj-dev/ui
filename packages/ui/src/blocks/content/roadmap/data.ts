import { CalendarIcon, CircleDashedIcon, HammerIcon, RocketIcon, type IconProps } from '@youj/icons'
import type { ComponentType } from 'react'
import { dateTimeFormat } from '../../../lib/utils'

/* Relay's public roadmap: requests from the teams building on Relay's
 * realtime API, their votes, comments and how each moved through the
 * pipeline. Swap these fixtures for your feedback store. */

export type Status = 'review' | 'planned' | 'progress' | 'shipped'
/** An area's key in `categories`. */
export type Category = string
export type Sort = 'trending' | 'top' | 'new'

export const STATUS_ORDER: Status[] = ['review', 'planned', 'progress', 'shipped']

/** How each status looks; its words are `copy.status`. */
export const STATUS: Record<
  Status,
  { icon: ComponentType<IconProps>; badge: 'secondary' | 'default' | 'warning' | 'success'; tone: 'neutral' | 'accent' | 'warning' | 'success'; ink: string }
> = {
  review: { icon: CircleDashedIcon, badge: 'secondary', tone: 'neutral', ink: 'text-fg-muted' },
  planned: { icon: CalendarIcon, badge: 'default', tone: 'accent', ink: 'text-accent-text' },
  progress: { icon: HammerIcon, badge: 'warning', tone: 'warning', ink: 'text-warning-text' },
  shipped: { icon: RocketIcon, badge: 'success', tone: 'success', ink: 'text-success-text' },
}

/** The areas, key to name. */
export const CATEGORIES: Record<Category, string> = {
  sdks: 'SDKs',
  channels: 'Channels',
  presence: 'Presence',
  webhooks: 'Webhooks',
  dashboard: 'Dashboard',
}


export interface Comment {
  id: string
  author: string
  /** A Relay team member: their comments carry a badge. */
  team?: boolean
  body: string
  date: string
}

export interface RoadmapRequest {
  id: string
  title: string
  body: string
  category: Category
  status: Status
  /** Votes, not counting yours. */
  votes: number
  /** Votes in the last seven days; ranks Trending. */
  recent: number
  author: string
  /** One entry per status reached, in STATUS_ORDER: when, who moved it, and why. */
  history: { date: string; by: string; note?: string }[]
  comments: Comment[]
  /** Planned and in-progress work: the quarter it's aimed at. Shipped: the release. */
  target?: string
}

const c = (id: string, author: string, date: string, body: string, team?: boolean): Comment => ({ id, author, date, body, team })

export const REQUESTS: RoadmapRequest[] = [
  {
    id: 'rq-e2ee',
    title: 'End-to-end encrypted channels',
    body: 'We handle patient notes in shared documents. We need payloads encrypted on the client with keys Relay never sees, while keeping ordering and presence working.',
    category: 'channels',
    status: 'planned',
    votes: 387,
    recent: 41,
    author: 'Amara Osei',
    target: 'Q1 2027',
    history: [
      { date: '2026-04-02', by: 'Amara Osei' },
      { date: '2026-08-19', by: 'Jonas Weber', note: 'Scoped for Q1: client-held keys, with key rotation through the SDK.' },
    ],
    comments: [
      c('c1', 'Priya Raman', '2026-05-11', 'Same here for legal redlines. Even a per-channel opt-in would unblock us.'),
      c('c2', 'Jonas Weber', '2026-08-19', 'This is on the Q1 plan. Presence metadata stays readable so cursors keep working; payloads won’t be.', true),
    ],
  },
  {
    id: 'rq-search',
    title: 'Search across message history',
    body: 'Full-text search over a channel’s history from the SDK, with filters for sender and time range. Today we mirror everything into our own index just to search it.',
    category: 'channels',
    status: 'progress',
    votes: 342,
    recent: 55,
    author: 'Diego Ferraz',
    target: 'Q4 2026',
    history: [
      { date: '2026-02-14', by: 'Diego Ferraz' },
      { date: '2026-05-06', by: 'Mei Tanaka', note: 'Planned alongside the new storage engine.' },
      { date: '2026-09-02', by: 'Mei Tanaka', note: 'In private beta with 12 teams.' },
    ],
    comments: [
      c('c1', 'Lena Fischer', '2026-06-01', 'Would love fuzzy matching on names, our users misspell everything.'),
      c('c2', 'Mei Tanaka', '2026-09-02', 'Private beta is open. Reply here with your workspace ID and we’ll add you.', true),
      c('c3', 'Diego Ferraz', '2026-09-10', 'Beta works well on 4M messages. Queries come back under 80 ms for us.'),
    ],
  },
  {
    id: 'rq-dark',
    title: 'Dark mode for the dashboard',
    body: 'The dashboard is the only bright window left on my screen at 2 a.m. when an incident fires.',
    category: 'dashboard',
    status: 'review',
    votes: 301,
    recent: 9,
    author: 'Sam Okafor',
    history: [{ date: '2026-01-20', by: 'Sam Okafor' }],
    comments: [c('c1', 'Noor Haddad', '2026-03-03', 'Please follow the OS setting rather than a separate toggle.')],
  },
  {
    id: 'rq-swift',
    title: 'Swift SDK with async/await',
    body: 'The current iOS SDK is callback-based. A native Swift package with async sequences for channel events would fit SwiftUI apps far better.',
    category: 'sdks',
    status: 'review',
    votes: 212,
    recent: 31,
    author: 'Hana Kim',
    history: [{ date: '2026-08-28', by: 'Hana Kim' }],
    comments: [
      c('c1', 'Tomás Rivera', '2026-09-04', 'An AsyncStream per channel would be perfect.'),
      c('c2', 'Ines Carvalho', '2026-09-12', 'We’re sketching this now. Tell us which iOS version you target.', true),
    ],
  },
  {
    id: 'rq-kmp',
    title: 'Kotlin Multiplatform SDK',
    body: 'One SDK for Android and iOS through KMP, sharing the reconnection and offline queue logic.',
    category: 'sdks',
    status: 'planned',
    votes: 264,
    recent: 12,
    author: 'Viktor Lind',
    target: 'Q4 2026',
    history: [
      { date: '2026-03-17', by: 'Viktor Lind' },
      { date: '2026-07-22', by: 'Ines Carvalho', note: 'Planned after the Swift work lands.' },
    ],
    comments: [c('c1', 'Ines Carvalho', '2026-07-22', 'Planned. The offline queue will be shared code from day one.', true)],
  },
  {
    id: 'rq-rn-presence',
    title: 'Presence for React Native',
    body: 'Presence works on web but the React Native SDK can’t subscribe to joins and leaves yet.',
    category: 'presence',
    status: 'progress',
    votes: 176,
    recent: 20,
    author: 'Chloé Martin',
    target: 'Q4 2026',
    history: [
      { date: '2026-05-30', by: 'Chloé Martin' },
      { date: '2026-07-01', by: 'Mei Tanaka' },
      { date: '2026-09-15', by: 'Mei Tanaka', note: 'Building on the web implementation; background app states are the hard part.' },
    ],
    comments: [c('c1', 'Arjun Mehta', '2026-07-12', 'Please handle the app going to background without dropping the member instantly.')],
  },
  {
    id: 'rq-ttl',
    title: 'Message TTL per channel',
    body: 'Let a channel expire its messages after a set time, for ephemeral chat and compliance with our retention policy.',
    category: 'channels',
    status: 'review',
    votes: 148,
    recent: 22,
    author: 'Noor Haddad',
    history: [{ date: '2026-09-05', by: 'Noor Haddad' }],
    comments: [],
  },
  {
    id: 'rq-audit',
    title: 'Audit log API',
    body: 'Stream the dashboard’s audit log (key changes, member invites, channel deletions) into our SIEM.',
    category: 'dashboard',
    status: 'planned',
    votes: 133,
    recent: 7,
    author: 'Lena Fischer',
    target: 'Q4 2026',
    history: [
      { date: '2026-04-11', by: 'Lena Fischer' },
      { date: '2026-08-03', by: 'Jonas Weber' },
    ],
    comments: [c('c1', 'Lena Fischer', '2026-08-04', 'A webhook per event would be enough for us.')],
  },
  {
    id: 'rq-alerts',
    title: 'Usage alerts in Slack and email',
    body: 'Warn us before a project hits its monthly connection limit instead of after.',
    category: 'dashboard',
    status: 'progress',
    votes: 121,
    recent: 6,
    author: 'Tomás Rivera',
    target: 'Q4 2026',
    history: [
      { date: '2026-03-08', by: 'Tomás Rivera' },
      { date: '2026-06-10', by: 'Jonas Weber' },
      { date: '2026-09-18', by: 'Jonas Weber', note: 'Email first; Slack follows in October.' },
    ],
    comments: [],
  },
  {
    id: 'rq-webhook-filter',
    title: 'Filter webhooks by payload',
    body: 'Only deliver a webhook when the event matches a filter, say `type == "order.paid"`, so our workers stop discarding 90% of calls.',
    category: 'webhooks',
    status: 'review',
    votes: 96,
    recent: 18,
    author: 'Arjun Mehta',
    history: [{ date: '2026-09-09', by: 'Arjun Mehta' }],
    comments: [c('c1', 'Viktor Lind', '2026-09-11', 'JSONPath would cover every case we have.')],
  },
  {
    id: 'rq-rotate',
    title: 'Rotate webhook signing secrets',
    body: 'Rotate a signing secret with an overlap window where both the old and new secrets verify.',
    category: 'webhooks',
    status: 'planned',
    votes: 88,
    recent: 4,
    author: 'Priya Raman',
    target: 'Q4 2026',
    history: [
      { date: '2026-05-21', by: 'Priya Raman' },
      { date: '2026-09-01', by: 'Ines Carvalho' },
    ],
    comments: [],
  },
  {
    id: 'rq-ratelimit',
    title: 'Rate-limit headers on REST responses',
    body: 'Return the remaining quota and reset time in headers so clients can back off before they get a 429.',
    category: 'sdks',
    status: 'review',
    votes: 64,
    recent: 3,
    author: 'Ines Duarte',
    history: [{ date: '2026-06-27', by: 'Ines Duarte' }],
    comments: [],
  },
  {
    id: 'rq-presence',
    title: 'Presence channels',
    body: 'Know who is in a channel, with join, leave and cursor state, ordered with the messages.',
    category: 'presence',
    status: 'shipped',
    votes: 410,
    recent: 8,
    author: 'Mateo Silva',
    target: 'v3.9',
    history: [
      { date: '2025-11-04', by: 'Mateo Silva' },
      { date: '2026-01-15', by: 'Mei Tanaka' },
      { date: '2026-04-20', by: 'Mei Tanaka' },
      { date: '2026-09-08', by: 'Mei Tanaka', note: 'Shipped in 3.9 for web, Node and Go.' },
    ],
    comments: [c('c1', 'Mateo Silva', '2026-09-09', 'Swapped out our own heartbeat service for this in an afternoon. Thank you!')],
  },
  {
    id: 'rq-replay',
    title: 'Replay failed webhooks',
    body: 'Re-deliver webhooks from the last 30 days after an outage on our side, one by one or in bulk.',
    category: 'webhooks',
    status: 'shipped',
    votes: 290,
    recent: 5,
    author: 'Hana Kim',
    target: 'v3.8',
    history: [
      { date: '2025-12-01', by: 'Hana Kim' },
      { date: '2026-02-09', by: 'Jonas Weber' },
      { date: '2026-05-12', by: 'Jonas Weber' },
      { date: '2026-08-12', by: 'Jonas Weber', note: 'Shipped in 3.8 with bulk replay from the dashboard.' },
    ],
    comments: [],
  },
  {
    id: 'rq-delta',
    title: 'Delta sync for large documents',
    body: 'Send only what changed in a document instead of the whole record on every update.',
    category: 'channels',
    status: 'shipped',
    votes: 233,
    recent: 2,
    author: 'Viktor Lind',
    target: 'v3.7',
    history: [
      { date: '2025-10-18', by: 'Viktor Lind' },
      { date: '2026-01-06', by: 'Mei Tanaka' },
      { date: '2026-03-30', by: 'Mei Tanaka' },
      { date: '2026-07-14', by: 'Mei Tanaka', note: 'Binary deltas, 38% lighter on the wire.' },
    ],
    comments: [],
  },
  {
    id: 'rq-offline',
    title: 'Offline queue for mobile SDKs',
    body: 'Queue writes while the device is offline and flush them in order when it reconnects.',
    category: 'sdks',
    status: 'shipped',
    votes: 198,
    recent: 1,
    author: 'Chloé Martin',
    target: 'v3.6',
    history: [
      { date: '2025-09-02', by: 'Chloé Martin' },
      { date: '2025-12-10', by: 'Ines Carvalho' },
      { date: '2026-03-02', by: 'Ines Carvalho' },
      { date: '2026-06-24', by: 'Ines Carvalho' },
    ],
    comments: [],
  },
]

/** You: the reader of the public roadmap, signed in. */
export const ME = 'You'
export const TODAY = '2026-09-27'

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

export const ROADMAP_COPY = {
  brandSection: 'Roadmap',
  changelog: 'Changelog',
  eyebrow: 'Public roadmap',
  title: 'Shape what Relay builds next',
  description: 'Vote on requests, follow them from review to release, and see what’s shipping this quarter.',
  stats: (requests: number, shipped: number) => ` votes · ${requests} requests · ${shipped} shipped`,
  submit: 'Submit a request',
  view: 'View',
  requestsTab: 'Requests',
  roadmapTab: 'Roadmap',
  statusFilter: 'Status',
  areaFilter: 'Area',
  sort: 'Sort',
  allStatuses: 'All statuses',
  allAreas: 'All areas',
  sorts: { trending: 'Trending', top: 'Top', new: 'New' } as Record<Sort, string>,
  status: { review: 'Under review', planned: 'Planned', progress: 'In progress', shipped: 'Shipped' } as Record<Status, string>,
  votes: (count: number) => (count === 1 ? 'vote' : 'votes'),
  upvote: (title: string) => `Upvote ${title}`,
  upvoted: (title: string, votes: string) => `Upvoted ${title}. ${votes}.`,
  unvoted: (title: string, votes: string) => `Removed your vote from ${title}. ${votes}.`,
  emptyTitle: 'No requests yet',
  emptyDescription: 'Tell us what would make Relay better. The most-voted ideas go on the roadmap.',
  noMatchesTitle: 'Nothing matches these filters',
  noMatches: (status?: string, area?: string) => `No ${status ? `${status.toLowerCase()} ` : ''}requests${area ? ` in ${area}` : ''} yet.`,
  clearFilters: 'Clear filters',
  postedTitle: 'Request posted',
  postedDescription: 'You’ve voted for it and will hear when it moves.',
  noDetails: 'No details yet.',
  list: 'Requests',
  comments: (n: number) => (n === 1 ? ' comment' : ' comments'),
  thisWeek: (n: number) => `+${n} this week`,
  boardEmpty: {
    review: '',
    planned: 'Nothing planned yet. Vote in Requests to shape what comes next.',
    progress: 'Nothing is being built right now.',
    shipped: 'Nothing shipped from the roadmap yet.',
  } as Record<Status, string>,
  submitted: 'Submitted the request',
  movedTo: (status: string) => `Moved it to ${status}`,
  team: 'Relay team',
  released: (target: string) => `Released in ${target}`,
  aiming: (target: string) => `Aiming for ${target}`,
  requestedBy: (author: string, date: string) => `Requested by ${author} on ${date}`,
  following: 'You’ll get an email when this moves.',
  follow: 'Vote to follow its progress.',
  history: 'Status history',
  commentsTitle: 'Comments',
  noComments: 'No comments yet. Say how you’d use it.',
  commentOn: (title: string) => `Comment on ${title}`,
  yourComment: 'Your comment',
  commentPlaceholder: 'How would you use this? Details help us scope it.',
  postingAs: (viewer: string, date: string) => `Posting as ${viewer.toLowerCase()} · ${date}`,
  posting: 'Posting…',
  posted: 'Posted',
  comment: 'Comment',
  dialogDescription: 'Tell us what you’re trying to build. We read every request and reply within a week.',
  titleLabel: 'Title',
  titlePlaceholder: 'e.g. Message TTL per channel',
  titleTooShort: 'Give it a title of at least 8 characters.',
  similarFound: (n: number) => `${n} similar ${n === 1 ? 'request' : 'requests'} found. Vote on one instead of posting a duplicate.`,
  similarHeading: 'Already asked? Vote instead',
  details: 'Details',
  detailsPlaceholder: 'What are you building, and what gets in the way today?',
  detailsHint: 'Optional, but the use case is what gets things planned.',
  area: 'Area',
  cancel: 'Cancel',
  postRequest: 'Post request',
}
export type RoadmapCopy = typeof ROADMAP_COPY

/** "1,204 votes", in the locale. */
export const votesLabel = (n: number, copy: RoadmapCopy, locale: string) => `${n.toLocaleString(locale)} ${copy.votes(n)}`

export function shortDate(iso: string, locale: string, today = TODAY) {
  return dateTimeFormat(locale, { month: 'short', day: 'numeric', year: iso.startsWith(today.slice(0, 4)) ? undefined : 'numeric', timeZone: 'UTC' }).format(new Date(iso))
}

export function sortRequests(list: readonly RoadmapRequest[], sort: Sort) {
  const by: Record<Sort, (a: RoadmapRequest, b: RoadmapRequest) => number> = {
    trending: (a, b) => b.recent - a.recent || b.votes - a.votes,
    top: (a, b) => b.votes - a.votes,
    new: (a, b) => b.history[0]!.date.localeCompare(a.history[0]!.date),
  }
  return [...list].sort(by[sort])
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'add', 'support', 'please', 'our', 'can', 'all'])
const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? []

/** Up to three requests whose title or body shares words with a draft title, best first. */
export function similarRequests(list: readonly RoadmapRequest[], draft: string) {
  const query = words(draft)
  if (query.length === 0) return []
  return list
    .map((r) => {
      const title = words(r.title)
      const body = words(r.body)
      const score = query.reduce((sum, q) => sum + (title.some((w) => w.startsWith(q)) ? 2 : body.some((w) => w.startsWith(q)) ? 1 : 0), 0)
      return { r, score }
    })
    .filter((m) => m.score >= 2)
    .sort((a, b) => b.score - a.score || b.r.votes - a.r.votes)
    .slice(0, 3)
    .map((m) => m.r)
}
