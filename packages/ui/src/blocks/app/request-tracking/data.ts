import type { ReactNode } from 'react'

/** One step of a request and where it stands. */
export interface TrackingStep {
  title: string
  /** A line under the title: who has it, what is happening. */
  detail?: ReactNode
  /** When it happened, or is expected to: a Date, ms since the epoch or an ISO string. */
  at?: Date | number | string
  state: 'done' | 'current' | 'upcoming' | 'failed'
}

/** A tracked request. */
export interface TrackingResult {
  reference: string
  /** What it is, e.g. “Order 48213 · 3 items”. */
  title: string
  /** Where it stands in a word or two, e.g. “Packing”; shown as a badge. */
  status: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  /** The expected finish, shown under the title. */
  eta?: Date | number | string
  steps: TrackingStep[]
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

const T0 = Date.UTC(2026, 9, 6, 9, 14)
const HOUR = 3_600_000

export const ORDER: TrackingResult = {
  reference: 'ORD-48213',
  title: 'Order 48213 · 3 items',
  status: 'Packing',
  eta: T0 + 50 * HOUR,
  steps: [
    { title: 'Order placed', detail: 'We have your order and the address it goes to.', at: T0, state: 'done' },
    { title: 'Payment confirmed', detail: 'Your card was charged and a receipt is in your inbox.', at: T0 + HOUR / 4, state: 'done' },
    { title: 'Packing', detail: 'Your three items are being boxed at our Leipzig warehouse.', at: T0 + 20 * HOUR, state: 'current' },
    { title: 'Shipped', detail: 'Handed to the carrier, with a tracking link by email.', at: T0 + 26 * HOUR, state: 'upcoming' },
    { title: 'Delivered', detail: 'Usually one to two days after it ships.', state: 'upcoming' },
  ],
}

export const DEFAULT_COPY = {
  title: 'Track your order',
  description: 'Enter the order number from your confirmation email to see where it stands.',
  lookupLabel: 'Look up an order',
  referenceLabel: 'Order number',
  placeholder: 'ORD-48213',
  referenceHint: 'It starts with ORD- and is in your confirmation email.',
  track: 'Track',
  tracking: 'Looking up…',
  tracked: 'Found',
  retry: 'Try again',
  emptyReference: 'Enter the order number from your email.',
  notFound: 'We couldn’t find that order. Check the number and try again.',
  resultLabel: (reference: string) => `Order ${reference}`,
  stepsLabel: 'Progress',
  expected: 'Expected',
  found: (reference: string) => `Showing order ${reference}.`,
  states: { done: 'Done', current: 'In progress', upcoming: 'Coming up', failed: 'Stopped' } as Record<TrackingStep['state'], string>,
}

export type RequestTrackingCopy = typeof DEFAULT_COPY

/** How far along a request is, 0 to 1 (the current step counts half), and whether it's finished or stopped. */
export function standing(result: TrackingResult | null) {
  if (!result || !result.steps.length) return { progress: undefined, done: false, stopped: false }
  const done = result.steps.filter((s) => s.state === 'done').length
  const current = result.steps.some((s) => s.state === 'current') ? 0.5 : 0
  return {
    progress: (done + current) / result.steps.length,
    done: done === result.steps.length,
    stopped: result.steps.some((s) => s.state === 'failed'),
  }
}
