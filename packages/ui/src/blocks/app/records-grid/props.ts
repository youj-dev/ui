import type { HTMLAttributes, ReactNode } from 'react'
import type { IllustrationSlot } from '@youj/illustrations'
import type { ThemeInput } from '@youj/core'
import type { DataGridView } from '../../tables/data-grid'
import type { OrdersCopy } from './copy'
import type { Fulfilment, LineItem, Order } from './data'

/** An order, one row of the grid. */
export type OrderRow = Order
export type OrderLine = LineItem
type Rows = (rows: OrderRow[]) => Promise<unknown> | unknown
type Row = (row: OrderRow) => Promise<unknown> | unknown

export interface RecordsGridProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The shop in the standalone top bar. Default: Fernhill, with its initial as the logo. */
  brand?: { name: string; logo?: ReactNode }
  /** The orders, newest first. Passing a new array replaces the rows. Default: `count` seeded demo orders. */
  orders?: OrderRow[]
  /** How many demo orders to load without `orders`. Default 2,400. */
  count?: number
  /** Loading, before the orders arrive. */
  loading?: boolean
  /** Replaces the rows with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** The error panel's Try again. Default: none. */
  onRetry?: () => void
  /** Replaces the grid when there are no orders. Default: the grid's empty state from `copy.empty…` and `illustration`. */
  empty?: ReactNode
  /** The picture in the empty state: a scene from the illustrations by id, or your own node. Default: the shopping bag. */
  illustration?: IllustrationSlot
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English. */
  copy?: Partial<OrdersCopy>
  /** Formats money. Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The currency totals are in. Default 'USD'. */
  currency?: string
  /** Formats when an order was placed, in its sheet. Default: "29 Sep, 15:40", in UTC. */
  formatDate?: (date: Date) => string
  /** The tags orders can carry, by key, with their labels. Default: the demo's five. */
  tags?: Record<string, { label: string }>
  /** The saved views, as tabs. Default: All, To ship, Payment issues and Returns, counted from the rows. */
  views?: DataGridView[]
  /** The open view's id (controlled). Default: uncontrolled. */
  view?: string
  /** The view open at first, uncontrolled. Default: the first. */
  defaultView?: string
  /** Called when another view opens. */
  onViewChange?: (view: string) => void
  /** The selected rows' ids (controlled). Default: uncontrolled. */
  selected?: string[]
  /** The rows selected at first, uncontrolled. Default: none. */
  defaultSelected?: string[]
  /** Called when the selection changes, with the ids and the rows. */
  onSelectedChange?: (ids: string[], rows: OrderRow[]) => void
  /** The id of the order open in the sheet, or null (controlled). Default: uncontrolled. */
  openOrder?: string | null
  /** The order open at first, uncontrolled. Default: none. */
  defaultOpenOrder?: string | null
  /** Called when an order opens in the sheet, or it closes (null). */
  onOpenOrderChange?: (id: string | null) => void
  /** The moment the stats and relative dates count from. Default: the demo's fixed Sep 29, 2026, 15:40 UTC, so server and browser agree. */
  now?: Date | number
  /** A click on a row: replaces opening its sheet (e.g. to route to the order's page). Default: opens the sheet. */
  onRowClick?: (row: OrderRow) => void
  /** An order opened in the sheet (row click, Enter, View order). Default: none. */
  onOpen?: (row: OrderRow) => void
  /** Mark as packed/shipped/delivered (row, sheet or selection), and Undo with each order's previous step. It moves at once and moves back if this rejects. Default: moved here only. */
  onFulfilmentChange?: (rows: OrderRow[], fulfilment: Fulfilment) => Promise<unknown> | unknown
  /** Refund: the order reads refunded at once and goes back if this rejects. Default: refunded here only, with Undo. */
  onRefund?: Row
  /** Print label, for a row or the selection. Default: a demo toast. */
  onPrintLabel?: Rows
  /** Email the customer, from the sheet. Default: a demo toast. */
  onEmail?: Row
  /** Export: the selection, or every order from the header. Default: a demo toast. */
  onExport?: Rows
  /** The header's Draft order. Default: does nothing. */
  onCreate?: () => Promise<unknown> | unknown
  /** The empty state's Share your shop. Default: does nothing. */
  onShare?: () => Promise<unknown> | unknown
  /** Header actions, replacing Export and Draft order. Default: those two. */
  actions?: ReactNode
  /** Classes on key parts. */
  classNames?: Partial<Record<'header' | 'stats' | 'grid', string>>
}
