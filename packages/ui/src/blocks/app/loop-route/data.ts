import type { LoopRouteStop } from './loop'

/* A fictional plant's milk-run loop: pass yours through the block's props. */

export const STOPS: LoopRouteStop[] = [
  { id: 'store', name: 'Store', position: 0.03, cargo: 0, eta: 0, depot: true },
  { id: 'cut', name: 'Cut', position: 0.2, cargo: 2, eta: 0 },
  { id: 'weld-1', name: 'Weld 1', position: 0.36, cargo: 1, eta: 0 },
  { id: 'weld-2', name: 'Weld 2', position: 0.55, cargo: 2, eta: 3 },
  { id: 'paint', name: 'Paint', position: 0.7, cargo: 1, eta: 7 },
  { id: 'assy', name: 'Assy', position: 0.86, cargo: 4, eta: 11 },
]

/** Where the vehicle is on the loop, 0–1. */
export const PROGRESS = 0.43

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Milk run',
  minutes: (n: string) => `${n} min`,
  subtitle: (vehicle: string, time: string) => `${vehicle} · ${time} loop`,
  vehicle: 'Tugger 2',
  onRoute: 'On route',
  rushing: 'Rushing',
  mapLabel: (done: number, total: number, cargo: number) => `Route map: ${done} of ${total} stops done, ${cargo} ${plural(cargo, 'bin', 'bins')} on board`,
  loop: (n: number, of: number) => `Loop ${n} of ${of}`,
  onBoard: (n: string, count: number) => `${n} ${plural(count, 'bin', 'bins')} on board`,
  nextTag: (name: string, time: string) => `${name} ${time}`,
  upNext: 'Up next',
  cargo: (n: string, count: number) => `${n} ${plural(count, 'bin', 'bins')}`,
  eta: (time: string) => time,
  rush: 'now',
  state: { done: 'done', next: 'next stop', upcoming: 'upcoming', skipped: 'skipped' },
  skipped: 'Skipped',
  skip: 'Skip stop',
  skipping: 'Skipping',
  rushDelivery: 'Rush delivery',
  rushingNow: 'Rushing',
  rushed: 'On its way',
  announceSkipped: (name: string) => `${name} skipped`,
  announceRushed: (name: string) => `Rushing the delivery to ${name}`,
  none: 'No stops left on this loop.',
  loadingLabel: 'Loading the route',
  retry: 'Retry',
  emptyTitle: 'No stops on this loop',
  emptyDescription: 'The route shows up here once it has stops.',
}

export type LoopRouteCopy = typeof DEFAULT_COPY
