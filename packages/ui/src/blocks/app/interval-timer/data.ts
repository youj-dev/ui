import type { SegmentedRingInterval } from '../../../components/ui/segmented-ring'

/** What the ring's intervals are made of: kind, length in seconds and a label. */
export type IntervalTimerInterval = SegmentedRingInterval

/** What an interval works on: an exercise, a task, a step. Its `name` is the label of the intervals it runs in. */
export interface IntervalTimerItem {
  id: string
  name: string
  /** What an entry aims for: "12 reps". */
  target: string
  /** The count the logger starts at: reps, cycles, pours. */
  count: number
  /** The amount the logger starts at, in `copy.unit`; 0 for none (`copy.noAmount`). */
  amount: number
}

/** One logged entry: a set, a cycle, a pour. */
export interface IntervalTimerEntry {
  id: string
  /** An `IntervalTimerItem` id. */
  item: string
  count: number
  amount: number
}

export const ITEMS: IntervalTimerItem[] = [
  { id: 'swings', name: 'Kettlebell swings', target: '15 reps', count: 15, amount: 16 },
  { id: 'rows', name: 'Renegade rows', target: '10 reps', count: 10, amount: 12 },
  { id: 'squats', name: 'Goblet squats', target: '12 reps', count: 12, amount: 20 },
  { id: 'pushups', name: 'Push-ups', target: '15 reps', count: 15, amount: 0 },
]

const WORK = 40
const REST = 20
const ROUNDS = 8
/** Warm-up and cool-down, in seconds. */
const EASE_IN = 60

/** Warm-up, eight rounds of 40 s work and 20 s rest through the four exercises, cool-down. */
export const INTERVALS: SegmentedRingInterval[] = [
  { kind: 'warmup', duration: EASE_IN, label: 'Mobility' },
  ...Array.from({ length: ROUNDS }, (_, i) => {
    const work: SegmentedRingInterval = { kind: 'work', duration: WORK, label: ITEMS[i % ITEMS.length]!.name }
    return i < ROUNDS - 1 ? [work, { kind: 'rest', duration: REST } as SegmentedRingInterval] : [work]
  }).flat(),
  { kind: 'cooldown', duration: EASE_IN, label: 'Stretch' },
]

/** Where the demo opens: 24 s into round 3. */
export const ELAPSED = EASE_IN + 2 * (WORK + REST) + 24

export const ENTRIES: IntervalTimerEntry[] = [
  { id: 'l1', item: 'swings', count: 15, amount: 16 },
  { id: 'l2', item: 'rows', count: 10, amount: 12 },
]

export const DEFAULT_COPY = {
  title: 'Evening HIIT',
  subtitle: (minutes: number) => `8 rounds · ${minutes} min`,
  more: 'Workout options',
  now: 'Now',
  next: 'Next',
  then: (name: string) => `then ${name}`,
  rest: 'Rest',
  restHint: 'Breathe. Shake it out.',
  addRest: '+15 s',
  addRestLabel: 'Add 15 seconds of rest',
  skipRest: 'Skip rest',
  target: (target: string) => `Target ${target}`,
  log: 'Log set',
  logLabel: 'Set log',
  count: 'Reps',
  amount: 'Weight',
  unit: 'kg',
  noAmount: 'BW',
  noEntries: 'No sets logged yet.',
  entryNumber: (n: number) => `Set ${n}`,
  logged: (name: string, count: number, amount: string) => `Logged ${name}: ${count} × ${amount}`,
  total: 'Volume',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  restart: 'Restart',
  skip: 'Skip',
  skipLabel: 'Skip to the next interval',
  left: (time: string) => `${time} left`,
  done: 'Workout complete',
  loadingLabel: 'Loading the timer',
  errorTitle: 'Couldn’t load the timer.',
  retry: 'Retry',
  emptyTitle: 'Nothing to time yet',
  emptyDescription: 'Add intervals and what they work on.',
}

export type IntervalTimerCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
