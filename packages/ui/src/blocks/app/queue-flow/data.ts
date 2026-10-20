/* The desk's shape (channels → triage → teams), the demo's numbers, and the
 * model that moves them: every beat, channels bring new tickets, triage
 * routes them, each team answers what its agents can and the rest wait in
 * its queue, and what the assistant flags as spam goes to the spam folder.
 * Pure functions and a seeded random, so the server and the client (and
 * tests) see the same opening. The clock is fast-forwarded: a beat moves the
 * desk on a couple of hours. Swap `step` for your help desk's feed. */

import type { ReactNode } from 'react'

export type QueueFlowNodeKind = 'channel' | 'triage' | 'team' | 'sink'
export type QueueFlowIconName = 'mail' | 'phone' | 'messages' | 'route' | 'bot' | 'card' | 'code' | 'ban'
/** What a node's figure shows: tickets an hour, its p95 reply time, or what it rejects. */
export type QueueFlowLensId = 'volume' | 'reply' | 'rejected'
/** One choice of the lens: what each step's figure shows. The ids are the three readings; the labels are yours. */
export interface QueueFlowLens {
  id: QueueFlowLensId
  label: string
}
/** On target; over target (its queue past 60% of its limit); holding (a team it routes to is full); holding what it rejected. */
export type QueueFlowHealth = 'ok' | 'over' | 'holding' | 'sink'

export interface QueueFlowNode {
  id: string
  /** The name on the card: "Billing". */
  label: string
  kind: QueueFlowNodeKind
  /** What it is, in a few words: "refunds, invoices and plan changes". */
  about: string
  /** One of the built-in names, or your own icon. */
  icon: QueueFlowIconName | ReactNode
  /** Column (0 channels, 1 triage, 2 teams) and row within it, 0–2; halves sit between rows. */
  layer: 0 | 1 | 2
  lane: number
  /** Channels: new tickets an hour, on average. */
  rate?: number
  /** People who work it and the items each handles an hour. Without them a step keeps up with anything. */
  staff?: number
  perStaff?: number
  /** The share of what it reads that it rejects, sent down the route marked `reject`. */
  rejects?: number
  /** Its own p95 time to a first reply when no one waits, minutes. */
  reply: number
  /** Items that can wait for it before triage holds new ones back. */
  limit?: number
  /** How full its queue is when the demo opens, 0–1 of `limit`. Default: whatever the first readings leave. */
  opens?: number
  /** What a step that takes the rejected holds when the demo opens. Default 0. */
  holds?: number
}

export interface QueueFlowRoute {
  from: string
  to: string
  /** The share of what `from` sends on that takes this route. Default: all of it. */
  share?: number
  /** Only rejected items take it, into the step that holds them. */
  reject?: boolean
}

export interface QueueFlowNodeStats {
  /** Items an hour in, and on (routed, or answered by a team). */
  in: number
  out: number
  /** Rejected an hour. */
  rejected: number
  reply: number
  /** Items waiting. */
  waiting: number
  health: QueueFlowHealth
  /** Recent volume, oldest first. */
  history: number[]
}

export interface QueueFlowDesk {
  beat: number
  nodes: Record<string, QueueFlowNodeStats>
  /** Items an hour on each route, by `from>to`. */
  routes: Record<string, number>
  /** Items held by the step that takes the rejected ones. */
  held: number
  /** People per step, as staffed. */
  staff: Record<string, number>
}

export const NODES: QueueFlowNode[] = [
  { id: 'email', label: 'Email', kind: 'channel', about: 'support@ · shared inbox', icon: 'mail', layer: 0, lane: 0, rate: 90, reply: 2 },
  { id: 'phone', label: 'Phone', kind: 'channel', about: 'calls and callback requests', icon: 'phone', layer: 0, lane: 1, rate: 30, reply: 3 },
  { id: 'chat', label: 'Chat', kind: 'channel', about: 'in-app messenger · web and mobile', icon: 'messages', layer: 0, lane: 2, rate: 240, reply: 1 },
  {
    id: 'routing',
    label: 'Routing',
    kind: 'triage',
    about: 'tags topic and priority, routes to a team',
    icon: 'route',
    layer: 1,
    lane: 0.5,
    staff: 3,
    perStaff: 50,
    reply: 6,
    limit: 200,
  },
  {
    id: 'assistant',
    label: 'Assistant',
    kind: 'triage',
    about: 'answers common questions, hands off the rest',
    icon: 'bot',
    layer: 1,
    lane: 1.75,
    rejects: 0.04,
    reply: 1,
  },
  {
    id: 'billing',
    label: 'Billing',
    kind: 'team',
    about: 'refunds, invoices and plan changes',
    icon: 'card',
    layer: 2,
    lane: 0,
    staff: 4,
    perStaff: 11,
    reply: 18,
    limit: 120,
    opens: 0.52,
  },
  {
    id: 'technical',
    label: 'Technical',
    kind: 'team',
    about: 'bugs, integrations and outages',
    icon: 'code',
    layer: 2,
    lane: 1,
    staff: 10,
    perStaff: 20,
    reply: 24,
    limit: 300,
  },
  { id: 'spam', label: 'Spam', kind: 'sink', about: 'flagged tickets · deleted after 30 days', icon: 'ban', layer: 2, lane: 2, reply: 0, holds: 38 },
]

export const ROUTES: QueueFlowRoute[] = [
  { from: 'email', to: 'routing' },
  { from: 'phone', to: 'routing' },
  { from: 'chat', to: 'assistant' },
  { from: 'routing', to: 'billing', share: 0.45 },
  { from: 'routing', to: 'technical', share: 0.55 },
  // The assistant answers the other 60% itself.
  { from: 'assistant', to: 'technical', share: 0.4 },
  { from: 'assistant', to: 'spam', reject: true },
]

export const LENSES: QueueFlowLens[] = [
  { id: 'volume', label: 'Volume' },
  { id: 'reply', label: 'Reply time' },
  { id: 'rejected', label: 'Spam' },
]

export const routeKey = (r: QueueFlowRoute) => `${r.from}>${r.to}`

/** Seconds between readings. */
export const BEAT_SECONDS = 2
/** Readings kept for the charts. */
export const HISTORY = 24
/** A queue this full is over target; this full holds back what triage sends it. */
export const OVER_TARGET = 0.6
export const HOLDING = 0.9
/** The first reply the desk promises, p95, minutes. */
export const TARGET_MINUTES = 60

/** A small seeded random (mulberry32): the same opening everywhere. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const capacityOf = (node: QueueFlowNode, staff: Record<string, number>) => (node.perStaff ? (staff[node.id] ?? node.staff ?? 1) * node.perStaff : Infinity)

/** One beat of the desk, step by step in flow order. */
export function step(state: QueueFlowDesk, nodes: QueueFlowNode[], routes: QueueFlowRoute[], random: () => number): QueueFlowDesk {
  const beat = state.beat + 1
  const next: Record<string, QueueFlowNodeStats> = {}
  const flow: Record<string, number> = {}
  let held = state.held
  const ordered = [...nodes].sort((a, b) => a.layer - b.layer)
  for (const node of ordered) {
    const prev = state.nodes[node.id]
    const inbound = routes.filter((r) => r.to === node.id)
    // A channel's volume swings slowly around its mean, with a little noise on top.
    const swing = 1 + 0.07 * Math.sin(beat / 3 + node.lane * 2) + (random() - 0.5) * 0.05
    const incoming = node.layer === 0 ? (node.rate ?? 0) * swing : inbound.reduce((sum, r) => sum + (flow[routeKey(r)] ?? 0), 0)
    const capacity = capacityOf(node, state.staff)
    const waiting0 = prev?.waiting ?? 0
    const handled = Math.min(incoming + waiting0 / BEAT_SECONDS, capacity)
    const waiting = Math.min(node.limit ?? Infinity, Math.max(0, waiting0 + (incoming - handled) * BEAT_SECONDS))
    const fill = node.limit ? waiting / node.limit : 0
    const rejected = handled * (node.rejects ?? 0) * (0.8 + random() * 0.4)
    const out = node.layer === 2 ? handled : handled - rejected
    // Waiting shows in the reply time: a full queue adds up to a few times the step's own.
    const reply = node.reply * (1 + 4 * fill * fill) * (0.94 + random() * 0.12)
    next[node.id] = {
      in: incoming,
      out,
      rejected,
      reply,
      waiting,
      health: fill >= OVER_TARGET ? 'over' : 'ok',
      history: [...(prev?.history ?? []), node.layer === 2 ? incoming : out].slice(-HISTORY),
    }
    for (const r of routes.filter((r) => r.from === node.id)) flow[routeKey(r)] = r.reject ? rejected : out * (r.share ?? 1)
  }
  // Triage holds back what it sends a team whose queue is nearly full.
  for (const r of routes) {
    const target = nodes.find((n) => n.id === r.to)
    const to = next[r.to]
    if (!target?.limit || !to || to.waiting / target.limit < HOLDING) continue
    const from = next[r.from]
    if (from && from.health === 'ok') from.health = 'holding'
  }
  for (const r of routes.filter((r) => r.reject)) held += (flow[routeKey(r)] ?? 0) * BEAT_SECONDS
  const folder = next[routes.find((r) => r.reject)?.to ?? '']
  if (folder && held > 0) folder.health = 'sink'
  return { beat, nodes: next, routes: flow, held, staff: state.staff }
}

/** Where the demo opens: a minute of history, the steps that set `opens` part full, and `holds` in the step that takes the rejected. */
export function opening(nodes: QueueFlowNode[], routes: QueueFlowRoute[], seed = 7): QueueFlowDesk {
  const random = seeded(seed)
  const staff = Object.fromEntries(nodes.filter((n) => n.staff).map((n) => [n.id, n.staff!]))
  let state: QueueFlowDesk = { beat: 0, nodes: {}, routes: {}, held: 0, staff }
  for (let i = 0; i < HISTORY; i++) state = step(state, nodes, routes, random)
  // Start mid-story: a step that sets `opens` part full (it goes over target a few readings in), the rejected folder a small round-looking number.
  for (const node of nodes) {
    const stats = state.nodes[node.id]
    if (node.limit && node.opens !== undefined && stats) {
      stats.waiting = Math.min(stats.waiting, node.limit * node.opens)
      const fill = stats.waiting / node.limit
      stats.health = fill >= OVER_TARGET ? 'over' : 'ok'
      stats.reply = node.reply * (1 + 4 * fill * fill)
    }
  }
  return { ...state, held: nodes.reduce((sum, n) => sum + (n.holds ?? 0), 0) }
}

/** The desk's headline figures. */
export function totals(state: QueueFlowDesk, nodes: QueueFlowNode[], routes: QueueFlowRoute[]) {
  const channels = nodes.filter((n) => n.layer === 0)
  const volume = channels.reduce((sum, n) => sum + (state.nodes[n.id]?.out ?? 0), 0)
  const history = Array.from({ length: HISTORY }, (_, i) => channels.reduce((sum, n) => sum + (state.nodes[n.id]?.history[i] ?? 0), 0))
  const waiting = nodes.reduce((sum, n) => sum + (state.nodes[n.id]?.waiting ?? 0), 0)
  // The slowest way from a channel to a team, step by step.
  const slowest = (id: string): number => {
    const own = state.nodes[id]?.reply ?? 0
    const outs = routes.filter((r) => r.from === id && !r.reject)
    return own + (outs.length ? Math.max(...outs.map((r) => slowest(r.to))) : 0)
  }
  const reply = Math.max(0, ...channels.map((n) => slowest(n.id)))
  const worst = nodes.reduce<{ id: string; fill: number } | null>((top, n) => {
    const fill = n.limit ? (state.nodes[n.id]?.waiting ?? 0) / n.limit : 0
    return !top || fill > top.fill ? { id: n.id, fill } : top
  }, null)
  const rejected = routes.filter((r) => r.reject).reduce((sum, r) => sum + (state.routes[routeKey(r)] ?? 0), 0)
  return {
    volume,
    history,
    waiting,
    reply,
    worst,
    rejected,
    share: volume > 0 ? rejected / volume : 0,
  }
}

export const DEFAULT_COPY = {
  title: 'Support desk',
  subtitle: 'All channels · live',
  live: 'Live',
  demoData: 'Demo data',
  paused: 'Paused',
  pause: 'Pause the desk',
  resume: 'Resume the desk',
  /** Names the stat panel. */
  overview: 'Desk overview',
  volume: 'New tickets',
  reply: 'First reply p95',
  waiting: 'Waiting',
  sink: 'Spam held',
  perHour: '/h',
  ofTarget: (target: string) => `of the ${target} target`,
  deepest: (name: string) => `most at ${name}`,
  noneWaiting: 'No one waiting',
  rejectedShare: (share: string) => `${share} of tickets flagged`,
  lens: 'Show on each step',
  layers: ['Channels', 'Triage', 'Teams'],
  kinds: { channel: 'Channel', triage: 'Triage', team: 'Team', sink: 'Filter' } as Record<QueueFlowNodeKind, string>,
  /** Names the drawing's node buttons as a group. */
  graph: 'Support steps',
  health: {
    ok: 'On target',
    over: 'Over target',
    holding: 'Holding back',
    sink: 'Holding tickets',
  } as Record<QueueFlowHealth, string>,
  /** Names the routes table for assistive tech. */
  table: 'Routes and their volume',
  from: 'From',
  to: 'To',
  rate: 'Tickets an hour',
  in: 'In',
  new: 'New',
  routed: 'Routed',
  solved: 'Solved',
  waitingLabel: 'Waiting',
  staffLabel: 'Agents',
  held: 'Held',
  rejected: 'Flagged',
  reads: 'Gets tickets from',
  writes: 'Sends to',
  nothing: 'Nobody',
  staff: (added: number) => `Add ${added} agents`,
  staffing: 'Adding',
  staffed: (name: string, agents: number) => `${name} now has ${agents} agents. The queue is shrinking.`,
  purge: (count: string) => `Delete ${count}`,
  purging: 'Deleting',
  purged: (count: string) => `Deleted ${count} spam tickets.`,
  open: 'Open queue',
  overTarget: (name: string, percent: string) => `${name} is over target: its queue is ${percent} full.`,
  backOnTarget: (name: string) => `${name} is back on target.`,
  deskPaused: 'Desk paused. Figures hold until you resume.',
  deskResumed: 'Desk resumed.',
  updated: 'A new reading every 2 seconds',
  legend: { flowing: 'Flowing', slowed: 'Over target', sink: 'Spam' },
  history: (name: string) => `${name}, tickets an hour over the last 24 readings`,
}

export type QueueFlowCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

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
