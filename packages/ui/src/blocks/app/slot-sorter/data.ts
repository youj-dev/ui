/* A fictional mail product's inbox, Quill, as the demo: pass yours through the block's props. */

export type SlotSorterTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface SlotSorterSlot {
  id: string
  label: string
  /** The color of its segment and dot. Default: the chart colors in turn. */
  tone?: SlotSorterTone
  /** How many of today's items land in it. */
  count: number
  /** Not sorting: its segment is hatched and no item can be moved into it. */
  off?: boolean
}

export type SlotSorterConfidence = 'low' | 'medium' | 'high'

export interface SlotSorterItem {
  id: string
  /** Who or what it is, as the row shows it: the sender, the payee, the customer. */
  name: string
  /** A second line under the name: the subject, the memo. */
  detail: string
  /** The id of the slot it was sorted into. */
  slot: string
  /** How sure the sorting is. */
  confidence: SlotSorterConfidence
  /** The picture beside the name; the initials stand in for it. */
  image?: string
}

/** Item id → the id of the slot it sits in. */
export type SlotSorterAssignments = Record<string, string>

export const SLOTS: SlotSorterSlot[] = [
  { id: 'vip', label: 'VIP', tone: 'chart-3', count: 14 },
  { id: 'needs-you', label: 'Needs you', tone: 'accent', count: 6 },
  { id: 'fyi', label: 'FYI', tone: 'neutral', count: 31 },
  { id: 'receipts', label: 'Receipts', tone: 'neutral', count: 12, off: true },
]

export const ITEMS: SlotSorterItem[] = [
  { id: 'rui', name: 'Rui Ortega', detail: 'Contract redlines v3', slot: 'vip', confidence: 'high' },
  { id: 'dana', name: 'Dana Lee', detail: 'Can you approve the venue?', slot: 'fyi', confidence: 'low' },
  { id: 'mira', name: 'Mira Okafor', detail: 'Budget sign-off before Friday', slot: 'needs-you', confidence: 'medium' },
  { id: 'digest', name: 'Fernbit', detail: 'Weekly digest', slot: 'fyi', confidence: 'high' },
]

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

export const DEFAULT_COPY = {
  title: 'Split inbox',
  step: (current: number, total: number) => `Setup ${current} of ${total}`,
  heading: 'Sorted into slots as mail lands',
  splitLabel: 'Today’s split',
  total: (items: string, off: string) => `${items} threads · ${off} off`,
  splitAria: 'Threads by slot',
  slotOff: 'off',
  sortingLive: 'Sorting live',
  correctHint: 'Drag to correct',
  confidence: { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' } as Record<SlotSorterConfidence, string>,
  moveTo: 'Move to',
  row: (name: string, detail: string, slot: string, confidence: string) => `${name}, ${detail}. In ${slot}. ${confidence}.`,
  dragInstructions: (keys: string) => `Drag a thread onto a slot above, or choose its slot: press ${keys} on the slot button, or open its menu.`,
  moved: (name: string, slot: string, counts: string) => `Moved ${name}’s thread to ${slot}. ${counts}`,
  throughput: (items: string, seconds: string) => `${items} threads · ${seconds} s`,
  back: 'Back',
  turnOn: 'Turn on',
  turningOn: 'Turning on',
  turnedOn: 'On',
}

export type SlotSorterCopy = typeof DEFAULT_COPY
