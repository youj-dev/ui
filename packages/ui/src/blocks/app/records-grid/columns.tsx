'use client'

import { ArrowUpRightIcon, PackageIcon, PrinterIcon, RotateCcwIcon, TruckIcon } from '@youj/icons'
import { createDataGridColumns, type DataGridRowAction } from '../../tables/data-grid'
import { DEFAULT_COPY, type OrdersCopy } from './copy'
import { FULFILMENT, PAYMENT, TAGS, type Order } from './data'

const col = createDataGridColumns<Order>()

/** A status map with the copy's labels over the demo's tones. */
function labelled<T extends Record<string, { label: string; tone: string }>>(tones: T, labels: Record<keyof T, string>): T {
  return Object.fromEntries(Object.entries(tones).map(([key, value]) => [key, { ...value, label: labels[key as keyof T] }])) as T
}

/** Every column the page can show; the Columns menu brings back the ones it starts without. */
export function orderColumns(copy: OrdersCopy = DEFAULT_COPY, tags: Record<string, { label: string }> = TAGS, currency = 'USD') {
  const h = copy.columns
  return [
    col.identity('customer', {
      header: h.customer,
      size: 236,
      // The order number doubles as the row's handle: a click anywhere on the row finds it and opens the order.
      secondary: (o) => (
        <span data-order={o.id} className="font-mono tabular-nums">
          {o.id}
        </span>
      ),
    }),
    col.status('payment', { header: h.payment, options: labelled(PAYMENT, copy.payment), size: 124 }),
    col.status('fulfilment', { header: h.fulfilment, options: labelled(FULFILMENT, copy.fulfilment), size: 156 }),
    col.currency('total', { header: h.total, currency, size: 112 }),
    col.number('quantity', { header: h.quantity, size: 84, aggregate: 'sum' }),
    col.text('channel', { header: h.channel, groupable: true, facet: true, size: 132 }),
    col.tags('tags', { header: h.tags, options: tags, size: 180, minSize: 150, meta: { grow: true } }),
    col.text('country', { header: h.country, groupable: true, facet: true, size: 150 }),
    col.date('placedAt', { header: h.placedAt, size: 140 }),
    col.text('carrier', { header: h.carrier, groupable: true, facet: true, muted: true, size: 120 }),
    col.id('id', { header: h.id, size: 128 }),
    col.text('email', { header: h.email, muted: true, size: 220 }),
  ]
}

/** The columns a first visit shows; the rest wait in the Columns menu. */
export const HIDDEN = { quantity: false, carrier: false, id: false, email: false }

/** A step taken by hand. */
export type OrderStep = 'packed' | 'shipped' | 'delivered'

/** The step after this one, while there is one to take by hand. */
export const NEXT_STEP: Partial<Record<Order['fulfilment'], { to: OrderStep }>> = {
  unfulfilled: { to: 'packed' },
  packed: { to: 'shipped' },
  shipped: { to: 'delivered' },
}

export function orderActions(
  handlers: {
    open: (o: Order) => void
    label: (o: Order) => void
    advance: (o: Order) => void
    refund: (o: Order) => void
  },
  copy: OrdersCopy = DEFAULT_COPY,
): (o: Order) => DataGridRowAction<Order>[] {
  return (o) => {
    const step = o.payment === 'paid' ? NEXT_STEP[o.fulfilment] : undefined
    return [
      { label: copy.viewOrder, icon: ArrowUpRightIcon, inline: true, onSelect: handlers.open },
      { label: copy.printLabel, icon: PrinterIcon, inline: true, disabled: o.payment !== 'paid', onSelect: handlers.label },
      { label: step ? copy.markAs[step.to] : copy.nothingToShip, icon: step?.to === 'packed' ? PackageIcon : TruckIcon, disabled: !step, onSelect: handlers.advance },
      { label: copy.refund, icon: RotateCcwIcon, destructive: true, separated: true, disabled: o.payment !== 'paid', onSelect: handlers.refund },
    ]
  }
}
