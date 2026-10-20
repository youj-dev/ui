import type { ComponentType } from 'react'

/* Three orders and the road each parcel took: ordered, packed, shipped,
 * through customs, out for delivery and delivered. One goes straight
 * through, one misses its first delivery attempt and is delivered on the
 * retry the next day, and one is refused at customs and returned to sender.
 * Values are in major units; times are milliseconds after the start. Swap
 * `ITEMS` for your tracking events and `STAGES` for your road. */

/** Where a step is on the road: not reached, under way, done, failed (or failing an attempt), or never reached because an earlier one failed. */
export type StepTrackerStepState = 'pending' | 'active' | 'done' | 'failed' | 'skipped'
/** How an item's road ended: all the way, or stopped part-way. */
export type StepTrackerOutcome = 'completed' | 'stopped'

/** One stop on the road, the same for every item: the columns of the rail. */
export interface StepTrackerStage {
  id: string
  label: string
  /** The headline while an item is on its way to this stop. Default: the label. */
  now?: string
  /** An icon before the stop's name in the detail. */
  icon?: ComponentType<{ size?: number }>
}

export interface StepTrackerAttempt {
  ok: boolean
  /** The exception code: "recipient_unavailable". */
  code: string
  /** In words: "No one was in to sign for it". */
  reason: string
  /** When it happened, ms after the start. */
  at: number
}

/** What happened to one item at one stop. */
export interface StepTrackerScan {
  /** The stop's id: the `id` of one of the stages. */
  id: string
  /** When it was scanned, ms after the start. */
  at: number
  /** Failed stops the road here; skipped means it never got this far. */
  outcome: 'ok' | 'failed' | 'skipped'
  /** Where it happened: "Reno, NV". */
  place?: string
  /** Its key facts, in order: a label and a short value each (the detail shows them on one line). */
  facts: [label: string, value: string][]
  /** Every attempt at this stop, when there was more than one. */
  attempts?: StepTrackerAttempt[]
}

export interface StepTrackerItem {
  /** The tracking number or reference shown in the footer. */
  id: string
  /** The short reference for the tab: "4822". */
  ref: string
  /** Who it is for. */
  subject: string
  /** Who handles it: the carrier, the bank, the agency. */
  handler: string
  /** Where it is going; shown in the tab and beside the subject. */
  place: string
  /** The amount shown as the total. */
  total: number
  currency: string
  outcome: StepTrackerOutcome
  /** Why it stopped, when it did. */
  stopReason?: string
  /** Wall-clock time of the start (ISO 8601). */
  created: string
  /** One per stage, in the stages' order. */
  scans: StepTrackerScan[]
}

export const STAGES: StepTrackerStage[] = [
  { id: 'ordered', label: 'Ordered', now: 'Order placed' },
  { id: 'packed', label: 'Packed', now: 'Being packed' },
  { id: 'shipped', label: 'Shipped', now: 'Leaving the warehouse' },
  { id: 'customs', label: 'Customs', now: 'Clearing customs' },
  { id: 'out', label: 'Out for delivery', now: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered', now: 'Arriving today' },
]

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const ITEMS: StepTrackerItem[] = [
  {
    id: 'NL4822771093CA',
    ref: '4822',
    subject: 'Ada Lovelace',
    handler: 'Northline Express',
    place: 'Toronto, ON',
    total: 1342.4,
    currency: 'USD',
    outcome: 'completed',
    created: '2026-09-28T14:02:09Z',
    scans: [
      {
        id: 'ordered',
        at: 0,
        outcome: 'ok',
        place: 'acme.shop',
        facts: [
          ['Items', '3 · 2.4 kg'],
          ['Ship to', '88 Queen St W, Toronto'],
          ['Service', 'International Priority'],
        ],
      },
      {
        id: 'packed',
        at: 3 * HOUR + 26 * MINUTE,
        outcome: 'ok',
        place: 'Reno, NV',
        facts: [
          ['Warehouse', 'Reno fulfillment'],
          ['Box', '38 × 28 × 14 cm'],
          ['Packed at', 'Station 14'],
        ],
      },
      {
        id: 'shipped',
        at: 9 * HOUR + 40 * MINUTE,
        outcome: 'ok',
        place: 'Oakland, CA',
        facts: [
          ['Carrier', 'Northline Express'],
          ['Flight', 'NL 318 · OAK → YYZ'],
          ['Tracking', 'NL4822771093CA'],
        ],
      },
      {
        id: 'customs',
        at: DAY + 11 * HOUR + 5 * MINUTE,
        outcome: 'ok',
        place: 'Toronto, ON',
        facts: [
          ['Port', 'Toronto Pearson (YYZ)'],
          ['Duties', '$41.20 · prepaid'],
          ['Decision', 'Released'],
        ],
      },
      {
        id: 'out',
        at: DAY + 18 * HOUR + 36 * MINUTE,
        outcome: 'ok',
        place: 'Mississauga, ON',
        facts: [
          ['Depot', 'Mississauga depot'],
          ['Route', 'Van 22 · stop 31 of 64'],
        ],
      },
      {
        id: 'delivered',
        at: 2 * DAY + 21 * HOUR + 54 * MINUTE,
        outcome: 'ok',
        place: 'Toronto, ON',
        facts: [
          ['Signed by', 'A. Lovelace'],
          ['Left at', 'Front desk'],
          ['Proof', 'Signature and photo'],
        ],
        attempts: [
          {
            ok: false,
            code: 'recipient_unavailable',
            reason: 'No one was in to sign for it. A notice was left; the driver tries again the next business day.',
            at: DAY + 23 * HOUR + 10 * MINUTE,
          },
          {
            ok: true,
            code: 'delivered',
            reason: 'Signed for at the front desk.',
            at: 2 * DAY + 21 * HOUR + 54 * MINUTE,
          },
        ],
      },
    ],
  },
  {
    id: 'NL4821506672CA',
    ref: '4821',
    subject: 'Mara Okafor',
    handler: 'Northline Express',
    place: 'Vancouver, BC',
    total: 101.3,
    currency: 'USD',
    outcome: 'completed',
    created: '2026-09-28T09:15:40Z',
    scans: [
      {
        id: 'ordered',
        at: 0,
        outcome: 'ok',
        place: 'iOS app',
        facts: [
          ['Items', '1 · 0.6 kg'],
          ['Ship to', '1201 Robson St, Vancouver'],
          ['Service', 'International Standard'],
        ],
      },
      {
        id: 'packed',
        at: HOUR + 52 * MINUTE,
        outcome: 'ok',
        place: 'Reno, NV',
        facts: [
          ['Warehouse', 'Reno fulfillment'],
          ['Box', 'Padded mailer'],
          ['Packed at', 'Station 3'],
        ],
      },
      {
        id: 'shipped',
        at: 6 * HOUR + 10 * MINUTE,
        outcome: 'ok',
        place: 'Reno, NV',
        facts: [
          ['Carrier', 'Northline Express'],
          ['Truck', 'Linehaul RNO → SEA'],
          ['Tracking', 'NL4821506672CA'],
        ],
      },
      {
        id: 'customs',
        at: 22 * HOUR + 30 * MINUTE,
        outcome: 'ok',
        place: 'Blaine, WA',
        facts: [
          ['Port', 'Pacific Highway crossing'],
          ['Duties', 'Under the de minimis, none owed'],
          ['Decision', 'Pre-cleared'],
        ],
      },
      {
        id: 'out',
        at: DAY + 21 * HOUR,
        outcome: 'ok',
        place: 'Burnaby, BC',
        facts: [
          ['Depot', 'Burnaby depot'],
          ['Route', 'Van 7 · stop 12 of 48'],
        ],
      },
      {
        id: 'delivered',
        at: 2 * DAY + 4 * HOUR + 20 * MINUTE,
        outcome: 'ok',
        place: 'Vancouver, BC',
        facts: [
          ['Left at', 'Parcel locker, lobby'],
          ['Proof', 'Photo'],
        ],
      },
    ],
  },
  {
    id: 'NL4823190455MX',
    ref: '4823',
    subject: 'Jon Park',
    handler: 'Northline Express',
    place: 'Mexico City',
    total: 2546,
    currency: 'USD',
    outcome: 'stopped',
    stopReason: 'no commercial invoice',
    created: '2026-09-28T16:40:12Z',
    scans: [
      {
        id: 'ordered',
        at: 0,
        outcome: 'ok',
        place: 'acme.shop',
        facts: [
          ['Items', '1 · 6.8 kg'],
          ['Ship to', 'Av. Durango 214, Roma Nte.'],
          ['Service', 'International Priority'],
        ],
      },
      {
        id: 'packed',
        at: 2 * HOUR + 5 * MINUTE,
        outcome: 'ok',
        place: 'Reno, NV',
        facts: [
          ['Warehouse', 'Reno fulfillment'],
          ['Box', '60 × 40 × 30 cm'],
          ['Packed at', 'Station 9'],
        ],
      },
      {
        id: 'shipped',
        at: 8 * HOUR + 30 * MINUTE,
        outcome: 'ok',
        place: 'Oakland, CA',
        facts: [
          ['Carrier', 'Northline Express'],
          ['Flight', 'NL 604 · OAK → MEX'],
          ['Tracking', 'NL4823190455MX'],
        ],
      },
      {
        id: 'customs',
        at: 2 * DAY + 3 * HOUR,
        outcome: 'failed',
        place: 'Mexico City',
        facts: [
          ['Port', 'Mexico City (MEX)'],
          ['Reason', 'No commercial invoice (over $1,000)'],
          ['Decision', 'Refused · return to sender'],
        ],
      },
      { id: 'out', at: 0, outcome: 'skipped', facts: [] },
      { id: 'delivered', at: 0, outcome: 'skipped', facts: [] },
    ],
  },
]

/** A stop's definition from its id (an unknown id shows as itself). */
export const stageOf = (stages: StepTrackerStage[], id: string): StepTrackerStage => stages.find((s) => s.id === id) ?? { id, label: id }

/** The stage a parcel stopped at: its last one that wasn't skipped. */
export const lastReached = (s: StepTrackerItem) => s.scans.reduce((last, stage, i) => (stage.outcome === 'skipped' ? last : i), 0)

/** Every stage's state once the journey is over. */
export const finalStates = (s: StepTrackerItem): StepTrackerStepState[] => s.scans.map((stage) => (stage.outcome === 'ok' ? 'done' : stage.outcome))

export const DEFAULT_COPY = {
  title: 'Shipments',
  subtitle: 'acme.shop · outbound orders',
  /** Names the tabs. */
  items: 'Recent shipments',
  replay: 'Replay',
  replayLabel: (ref: string) => `Replay the route of order ${ref}`,
  states: {
    pending: 'Not reached yet',
    active: 'Under way',
    done: 'Done',
    failed: 'Failed',
    skipped: 'Skipped',
  } as Record<StepTrackerStepState, string>,
  outcome: { completed: 'Delivered', stopped: 'Returned to sender' } as Record<StepTrackerOutcome, string>,
  /** The headline while a missed attempt waits for its retry. */
  attemptMissed: 'Delivery attempt missed',
  /** Under the headline: the latest scan, when and where. */
  lastScan: (time: string, place: string) => (place ? `${time} · ${place}` : time),
  /** Names the rail for assistive tech. */
  journey: (ref: string) => `Route of order ${ref}`,
  summary: 'Shipment summary',
  total: 'Order total',
  doorToDoor: 'Order to door',
  stoppedAfter: 'Stopped after',
  attempts: 'Attempts',
  missed: (n: number) => `${n} missed`,
  neverOut: 'never out',
  attempt: (n: number) => `Attempt ${n}`,
  tries: (n: number) => `${n} tries`,
  notReached: 'The parcel hasn’t got here yet.',
  working: 'On its way to the next scan…',
  retrying: 'The driver tries again the next day.',
  missedNote: 'attempt failed',
  skippedBecause: (stage: string) => `Skipped: the parcel stopped at ${stage.toLowerCase()} and went back to the sender.`,
  notify: 'Email tracking link',
  notifying: 'Sending',
  handlerSite: 'Open on carrier site',
  attemptFailed: (reason: string) => `Delivery attempt failed: ${reason}. Retrying the next day.`,
  completedOnRetry: (n: number) => `Delivered on attempt ${n}.`,
  stopped: (stage: string, reason: string) => `Refused at ${stage.toLowerCase()}: ${reason}. Returning to sender.`,
  completed: (place: string) => `Delivered in ${place}.`,
  loadingLabel: 'Loading shipments',
  retry: 'Retry',
  emptyTitle: 'No shipments yet',
  emptyDescription: 'Orders appear here once they ship.',
}

export type StepTrackerCopy = typeof DEFAULT_COPY & {
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
