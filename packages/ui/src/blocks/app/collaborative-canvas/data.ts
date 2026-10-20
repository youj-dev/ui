import type { WhiteboardCursor, WhiteboardScene } from '../../../components/ui/whiteboard'
import type { CommentThreadItem, CommentThreadPerson } from '../../activity/comment-thread'
import type { DailyBarsDay, DailyBarsNote } from '../daily-bars/data'

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

/** A step of the path to the board; the last is the board itself. */
export interface CollaborativeCanvasCrumb {
  label: string
  href?: string
}

/** Someone else on the board: their pointer in board coordinates (leave `x` and `y` out while it's elsewhere). */
export type CollaborativeCanvasPerson = WhiteboardCursor

/** Every string the screen shows or speaks. */
export const DEFAULT_COPY = {
  /** The breadcrumbs' name. */
  path: 'Board location',
  people: 'People on this board',
  share: 'Share',
  shared: 'Link copied',
  demoData: 'Demo data',
  /** The pinned thread's title over its comments. */
  thread: 'Thread',
  signups: 'Sign-ups per day',
  signupsSubtitle: 'Last 14 days',
  activation: 'Activated',
  activationNote: 'vs last month',
}

export type CollaborativeCanvasCopy = typeof DEFAULT_COPY & { locale: string }

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A growth team's review of a made-up launch: sign-ups by day with the spike
 * on the pricing page launch, the activation rate, the notes around them,
 * two people moving about and two comment threads. Demo content — edit after
 * adding. */

export const DEMO_NOW = Date.UTC(2026, 9, 12, 15, 20)
const MIN = 60_000

export const PATH: CollaborativeCanvasCrumb[] = [
  { label: 'Acme', href: '#' },
  { label: 'Growth', href: '#' },
  { label: 'Q4 activation review' },
]

const SIGNUPS = [212, 228, 219, 174, 160, 231, 244, 236, 251, 498, 362, 271, 203, 186]
export const DAYS: DailyBarsDay[] = SIGNUPS.map((value, i) => ({ date: new Date(Date.UTC(2026, 8, 28 + i)).toISOString().slice(0, 10), value }))
export const PREVIOUS_TOTAL = 2604
export const NOTES: DailyBarsNote[] = [{ date: '2026-10-07', text: 'Pricing page launch' }]
export const ACTIVATION = [0.52, 0.55, 0.54, 0.58, 0.57, 0.61, 0.6, 0.63, 0.62, 0.64]

export const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'activation', type: 'embed', x: 0, y: 0, w: 264, h: 212, title: 'Activation, this month' },
    { id: 'signups', type: 'embed', x: 384, y: 0, w: 456, h: 424, title: 'Sign-ups, last 14 days' },
    {
      id: 'hypothesis',
      type: 'sticky',
      color: 'amber',
      width: 'medium',
      x: 0,
      y: 292,
      w: 264,
      h: 96,
      text: 'The pricing page, not the ad spend, drove the spike',
    },
    { id: 'ship', type: 'sticky', color: 'green', width: 'medium', x: 920, y: 24, w: 232, h: 80, text: 'Ship the shorter trial email on Thursday' },
    { id: 'check', type: 'sticky', color: 'blue', width: 'medium', x: 920, y: 184, w: 232, h: 80, text: 'Are SSO sign-ups counted twice?' },
    { id: 'k1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'activation' }, to: { shape: 'signups' }, label: 'same cohort' },
    { id: 'k2', type: 'connector', color: 'amber', width: 'thin', from: { shape: 'hypothesis' }, to: { shape: 'signups' }, route: 'elbow', label: 'test' },
    { id: 'k3', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'signups' }, to: { shape: 'ship' }, route: 'elbow' },
    { id: 'k4', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'signups' }, to: { shape: 'check' }, route: 'elbow' },
  ],
  pins: [
    { id: 'launch', shape: 'signups', x: 300, y: 120, author: 'Mara Lind' },
    { id: 'sso', shape: 'check', x: 212, y: 6, author: 'Theo Park' },
  ],
}

export const USER: CommentThreadPerson = { id: 'jordan', name: 'Jordan Lee', handle: 'jordan' }
const MARA: CommentThreadPerson = { id: 'mara', name: 'Mara Lind', handle: 'mara' }
const THEO: CommentThreadPerson = { id: 'theo', name: 'Theo Park', handle: 'theo' }
export const TEAM: CommentThreadPerson[] = [USER, MARA, THEO, { id: 'ana', name: 'Ana Ruiz', handle: 'ana' }]

export const THREADS: Record<string, CommentThreadItem[]> = {
  launch: [
    {
      id: 'launch',
      comments: [
        { id: 'l1', author: MARA, body: 'The spike on the 7th is the pricing launch. Can we hold the ad spend flat for a week to be sure?', createdAt: DEMO_NOW - 94 * MIN },
        { id: 'l2', author: USER, body: '@mara yes, paused the new campaigns until the 20th.', createdAt: DEMO_NOW - 71 * MIN },
      ],
    },
  ],
  sso: [
    {
      id: 'sso',
      comments: [{ id: 's1', author: THEO, body: 'SSO sign-ups land in both funnels, so the 7th may read high.', createdAt: DEMO_NOW - 40 * MIN }],
    },
  ],
}

/** Where the demo's people point, by tick: Ana reads the chart, Theo hovers his question. */
export function demoPeople(tick: number): CollaborativeCanvasPerson[] {
  return [
    { id: 'ana', name: 'Ana', x: 600 + Math.cos(tick / 2) * 110, y: 250 + Math.sin(tick / 3) * 60 },
    {
      id: 'theo',
      name: 'Theo',
      x: 980 + Math.sin(tick / 2.5) * 30,
      y: 280 + Math.cos(tick / 2) * 14,
      message: tick % 10 < 5 ? 'On the SSO numbers' : undefined,
    },
  ]
}
