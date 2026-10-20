/* The bulk actions table's types, its English and its demo: a store's orders,
 * seeded so every render (server and browser) shows the same rows, dated
 * from a fixed moment. */

import { ArchiveIcon, CheckCircleIcon, CircleAlertIcon, CircleDashedIcon, CircleXIcon, ClockIcon, DownloadIcon, GlobeIcon, PrinterIcon, RotateCcwIcon, SmartphoneIcon, StoreIcon, TruckIcon } from '@youj/icons'

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

export type BulkActionsTableIcon = typeof GlobeIcon

/** A value one of the two status columns can hold: a badge in a tone, with the icon the column and its filter show. */
export interface BulkActionsTableStatus {
  id: string
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: BulkActionsTableIcon
  /** Drawn as an outlined, dashed badge: not started yet. */
  dashed?: boolean
  /** The rows in it count toward the headline total (`copy.description`). */
  counted?: boolean
}

/** Where a row came from: a name and the icon beside it, and a choice in the filter. */
export interface BulkActionsTableChannel {
  id: string
  label: string
  icon?: BulkActionsTableIcon
}

/** One row of the table. */
export interface BulkActionsTableRow {
  id: string
  /** What people call it: the number on the receipt. */
  ref: string
  party: { name: string; email: string; avatar?: string }
  /** A `BulkActionsTableStatus` id from `statuses`. */
  status: string
  /** A `BulkActionsTableStatus` id from `stages`. */
  stage: string
  /** A `BulkActionsTableChannel` id. */
  channel: string
  count: number
  amount: number
  /** When it happened (ISO). */
  at: string
}

/** Something to do to the selection: a button or menu entry with its key. */
export interface BulkActionsTableAction {
  id: string
  label: string
  icon?: BulkActionsTableIcon
  /** The key that runs it while rows are selected. */
  shortcut?: string
  /** A button in the bar; the others are in the menu. */
  primary?: boolean
  /** Styled as the one that can't be undone, last in the menu. */
  destructive?: boolean
  /** Asks first, with this as its description and the count in its title. */
  confirm?: string
  /** With no handler, downloads the selected rows as a CSV. */
  csv?: boolean
  /** What the live region says once it has run. Default: the label. */
  done?: string
  /** In each row's menu, set apart from the rest when `'separated'`. */
  inRow?: boolean | 'separated'
  /** Not offered for this row in its menu. */
  disabled?: (row: BulkActionsTableRow) => boolean
  /** What it does to a row here before (and unless) the app refuses it; `null` removes the row. */
  apply?: (row: BulkActionsTableRow) => BulkActionsTableRow | null
}

export const STATUSES: BulkActionsTableStatus[] = [
  { id: 'paid', label: 'Paid', tone: 'success', icon: CheckCircleIcon, counted: true },
  { id: 'pending', label: 'Pending', tone: 'warning', icon: ClockIcon },
  { id: 'refunded', label: 'Refunded', tone: 'neutral', icon: RotateCcwIcon },
  { id: 'failed', label: 'Failed', tone: 'danger', icon: CircleXIcon },
]

export const STAGES: BulkActionsTableStatus[] = [
  { id: 'unfulfilled', label: 'Unfulfilled', icon: CircleDashedIcon, dashed: true },
  { id: 'partial', label: 'Partial', tone: 'warning', icon: CircleAlertIcon },
  { id: 'fulfilled', label: 'Fulfilled', tone: 'neutral', icon: TruckIcon },
  { id: 'returned', label: 'Returned', tone: 'neutral', icon: RotateCcwIcon },
]

export const CHANNELS: BulkActionsTableChannel[] = [
  { id: 'web', label: 'Online store', icon: GlobeIcon },
  { id: 'ios', label: 'iOS app', icon: SmartphoneIcon },
  { id: 'android', label: 'Android app', icon: SmartphoneIcon },
  { id: 'store', label: 'In store', icon: StoreIcon },
]

export const ACTIONS: BulkActionsTableAction[] = [
  {
    id: 'fulfill',
    label: 'Fulfill',
    icon: TruckIcon,
    shortcut: 'F',
    primary: true,
    done: 'Fulfilled',
    inRow: true,
    disabled: (o) => o.stage === 'fulfilled' || o.status !== 'paid',
    apply: (o) => (o.status === 'paid' ? { ...o, stage: 'fulfilled' } : o),
  },
  { id: 'print', label: 'Print labels', icon: PrinterIcon, shortcut: 'P', primary: true, done: 'Sent to the printer', inRow: true },
  {
    id: 'paid',
    label: 'Mark as paid',
    icon: CheckCircleIcon,
    shortcut: 'M',
    done: 'Marked as paid',
    apply: (o) => (o.status === 'pending' || o.status === 'failed' ? { ...o, status: 'paid' } : o),
  },
  {
    id: 'refund',
    label: 'Refund',
    icon: RotateCcwIcon,
    shortcut: 'R',
    destructive: true,
    confirm: 'The customers get their money back on the card they paid with. This can’t be undone.',
    done: 'Refunded',
    apply: (o) => ({ ...o, status: 'refunded', stage: o.stage === 'unfulfilled' ? 'unfulfilled' : 'returned' }),
  },
  { id: 'archive', label: 'Archive', icon: ArchiveIcon, shortcut: 'A', done: 'Archived', inRow: 'separated', apply: () => null },
  { id: 'export', label: 'Export CSV', icon: DownloadIcon, shortcut: 'E', csv: true, done: 'Exported' },
]

export const DEFAULT_COPY = {
  title: 'Orders',
  description: (rows: string, total: string) => `${rows} orders · ${total} this month`,
  noun: 'orders',
  search: 'Search orders, customers, emails…',
  create: 'Create order',
  columns: { ref: 'Order', at: 'Date', party: 'Customer', channel: 'Channel', status: 'Payment', stage: 'Fulfillment', count: 'Items', amount: 'Total' },
  open: 'Open order',
  more: 'More actions',
  commandPlaceholder: 'Run an action on the selection…',
  commandEmpty: 'No action matches.',
  shortcutsHint: 'Shortcuts work while rows are selected.',
  countOf: (count: string, n: number) => `${count} ${new Intl.PluralRules('en').select(n) === 'one' ? 'order' : 'orders'}`,
  actionDone: (action: string, rows: string) => `${action}: ${rows}`,
  failed: 'Something went wrong. Try again.',
  dismiss: 'Dismiss',
  emptyTitle: 'No orders yet',
  emptyHint: 'Orders show up here as soon as a customer checks out.',
}

export type BulkActionsTableCopy = typeof DEFAULT_COPY

/** The moment the demo's dates count from, so the server and the browser agree. */
export const DEMO_NOW = Date.UTC(2026, 8, 29, 15, 0)

const FIRST = ['Hana', 'Oliver', 'Amara', 'Lucas', 'Ines', 'Noah', 'Yuki', 'Elena', 'Marcus', 'Zara', 'Theo', 'Leila', 'Rafael', 'Maya']
const LAST = ['Novak', 'Brennan', 'Okoye', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Haddad', 'Fischer', 'Adeyemi']

export function makeRows(count = 64): BulkActionsTableRow[] {
  let seed = 19
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const payments: string[] = ['paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'refunded', 'failed']
  const channels: string[] = ['web', 'web', 'web', 'ios', 'ios', 'android', 'store']
  let at = DEMO_NOW
  return Array.from({ length: count }, (_, i) => {
    at -= Math.round((0.4 + next() * 7) * 3_600_000)
    const payment = pick(payments)
    const fulfillment: string =
      payment === 'refunded' ? 'returned' : payment !== 'paid' ? 'unfulfilled' : i < 9 ? pick(['unfulfilled', 'unfulfilled', 'partial'] as const) : pick(['fulfilled', 'fulfilled', 'fulfilled', 'partial'] as const)
    const first = pick(FIRST)
    const last = pick(LAST)
    const items = 1 + Math.floor(next() * 5)
    return {
      id: `ord_${(0x8c41 + i * 613).toString(16)}`,
      ref: `#${1204 - i}`,
      party: { name: `${first} ${last}`, email: `${first.toLowerCase()}@${last.toLowerCase()}.mail` },
      status: payment,
      stage: fulfillment,
      channel: pick(channels),
      count: items,
      amount: Math.round((18 + next() * 140) * items * 100) / 100,
      at: new Date(at).toISOString(),
    }
  })
}
