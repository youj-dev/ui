import type { ReactNode } from 'react'
import { BookOpenIcon, DropletIcon, LeafIcon, SunriseIcon } from '@youj/icons'
import type { StreakDay, StreakTone } from '../../../components/ui/calendar-heatmap'

/** One thing with a run of days: a habit, a team's target, a subject. */
export interface StreaksItem {
  id: string
  name: string
  /** What a done day means: "5 km before 8:00". */
  detail: string
  /** Its mark in the disc beside the name; any icon, sized to the disc. Default: none. */
  icon?: ReactNode
  tone: StreakTone
  /** A day's full value: 1 for done-or-not, 8 for eight glasses. */
  max: number
  days: StreakDay[]
}

/** The demo's today: a Monday. */
export const TODAY = '2026-09-28'
export const WEEKS = 26
export const FREEZES = { left: 2, total: 3 }

const DAY = 86_400_000
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)
const T = Math.round(Date.parse(`${TODAY}T00:00:00Z`) / DAY)

/** A small seeded random, so the demo history is the same on every render and in every test. */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

interface Shape {
  /** How often an older day was done. */
  rate: number
  /** The run that ends yesterday, in days. */
  run: number
  /** Days before that run: `gap` missed days, then an older run of `older` days. */
  gap?: number
  older?: number
  /** Days ago that a freeze covered. */
  frozen?: number[]
  /** Whether today is already done. */
  today?: boolean
  max?: number
  seed: number
}

/** An item's history over the demo's weeks, with the runs the story needs at its end. */
export function history({ rate, run, gap = 0, older = 0, frozen = [], today = false, max = 1, seed }: Shape): StreakDay[] {
  const next = random(seed)
  const days: StreakDay[] = []
  for (let n = T - WEEKS * 7; n <= T; n++) {
    const ago = T - n
    // Most days land mid-scale; about one in five goes all the way.
    const value = max > 1 ? Math.max(1, Math.min(max, Math.round(max * (next() < 0.2 ? 1 : 0.25 + next() * 0.5)))) : 1
    if (ago === 0) {
      if (today) days.push({ date: iso(n), value })
      continue
    }
    if (frozen.includes(ago)) days.push({ date: iso(n), frozen: true })
    else if (ago <= run) days.push({ date: iso(n), value })
    else if (ago <= run + gap) continue
    else if (ago <= run + gap + older || next() < rate) days.push({ date: iso(n), value })
  }
  return days
}

/** The day before an ISO date. */
export const yesterdayOf = (date: string) => iso(Math.round(Date.parse(`${date}T00:00:00Z`) / DAY) - 1)

/** Each item counts something, so a dot's heat is how much: kilometres, pages, glasses, minutes. */
export const ITEMS: StreaksItem[] = [
  { id: 'run', name: 'Morning run', detail: 'Up to 8 km before 8:00', icon: <SunriseIcon />, tone: 'chart-1', max: 8, days: history({ rate: 0.62, run: 23, gap: 1, older: 41, frozen: [9], max: 8, seed: 7 }) },
  { id: 'read', name: 'Read', detail: 'Up to 40 pages before bed', icon: <BookOpenIcon />, tone: 'chart-2', max: 40, days: history({ rate: 0.38, run: 0, gap: 1, older: 18, max: 40, seed: 11 }) },
  { id: 'water', name: 'Drink water', detail: '8 glasses', icon: <DropletIcon />, tone: 'chart-5', max: 8, days: history({ rate: 0.8, run: 12, gap: 2, older: 9, today: true, max: 8, seed: 3 }) },
  { id: 'meditate', name: 'Meditate', detail: 'Up to 20 minutes', icon: <LeafIcon />, tone: 'chart-3', max: 20, days: history({ rate: 0.45, run: 9, gap: 1, older: 6, today: true, max: 20, seed: 5 }) },
]

export const DEFAULT_COPY = {
  title: 'Habits',
  subtitle: (done: number, total: number) => `${done} of ${total} done today`,
  more: 'More options',
  list: 'Your habits',
  history: (weeks: number) => `Last ${weeks} weeks`,
  onTrack: 'On track',
  atRisk: 'At risk',
  doneToday: 'Done today',
  /** Shown when yesterday broke a run a freeze could save. */
  rescue: (days: number) => `Yesterday slipped by. Use a freeze to keep your ${days}-day run going.`,
  useFreeze: 'Use a freeze',
  freezing: 'Freezing…',
  frozen: (name: string) => `Yesterday is frozen. ${name} is back on track.`,
  noFreezes: 'No freezes left this month',
  today: 'Today',
  streak: (days: number) => `${days}-day streak`,
  /** A run yesterday broke, which a freeze could still save. */
  held: (days: number) => `Missed yesterday · ${days}-day run on hold`,
  noStreak: 'No streak yet',
  showAll: (count: number) => `Show all ${count}`,
  showFewer: 'Show fewer',
  markDone: (name: string) => `Mark done: ${name}`,
  show: (name: string) => `Show ${name}`,
  resets: 'Resets at midnight',
  newItem: 'New habit',
  loadingLabel: 'Loading',
  errorTitle: 'Couldn’t load your habits.',
  retry: 'Retry',
  emptyTitle: 'Nothing to track yet',
  emptyDescription: 'Add one and its days appear here.',
}

export type StreaksCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
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
