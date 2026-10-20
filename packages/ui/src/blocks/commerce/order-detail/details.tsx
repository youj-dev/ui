'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { useOrder } from './copy'
import { totals, type Address, type Order } from './data'
import { Eyebrow } from '../../../components/ui/typography'

function Panel({ title, heading: Heading, children }: { title: string; heading: 'h2' | 'h3'; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface">
      <Heading id={id} className="border-b border-line px-4 py-3 text-ui font-medium text-fg">
        {title}
      </Heading>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  )
}

function Row({ label, value, strong, positive }: { label: ReactNode; value: string; strong?: boolean; positive?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', strong ? 'mt-1 border-t border-line pt-3 text-ui font-medium text-fg' : 'text-ui-sm text-fg-muted')}>
      <Eyebrow render={<dt />} className={strong ? 'text-ui font-medium text-fg' : 'text-ui-sm text-fg-muted'}>
        {label}
      </Eyebrow>
      <dd className={cn('tabular-nums', positive && 'text-success-text', strong && 'text-lg font-semibold tracking-tight')}>{value}</dd>
    </div>
  )
}

/** The receipt and the card it was charged to (or refunded to, once canceled). */
export function PaymentSummary({ order, heading }: { order: Order; heading: 'h2' | 'h3' }) {
  const { copy, money, shortDate } = useOrder()
  const { subtotal, discount, tax, total } = totals(order)
  const refunded = order.cancelled
  return (
    <Panel title={copy.payment} heading={heading}>
      <dl className="flex flex-col gap-2">
        <Row label={copy.subtotal} value={money(subtotal)} />
        {order.discount && (
          <Row
            label={
              <>
                {copy.discount} <span className="font-mono text-ui-xs">{order.discount.code}</span>
              </>
            }
            value={`−${money(discount)}`}
            positive
          />
        )}
        <Row label={copy.shipping} value={order.shipping ? money(order.shipping) : copy.free} />
        <Row label={copy.tax((order.taxRate * 100).toFixed(3).replace(/\.?0+$/, ''))} value={money(tax)} />
        <Row label={copy.total} value={money(total)} strong />
        {refunded && <Row label={copy.refunded(shortDate(refunded.at))} value={`−${money(total)}`} positive />}
      </dl>
      <div className="flex items-center gap-3 rounded-lg border border-line p-3">
        <span
          aria-hidden
          className="grid h-7 w-10 shrink-0 place-items-center rounded-sm bg-fg text-ui-xs font-bold tracking-wide text-canvas italic"
        >
          {order.card.brand.toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <p className="text-ui text-fg">
            {order.card.brand} <span className="tabular-nums">•••• {order.card.last4}</span>
          </p>
          <p className="text-ui-sm text-fg-muted">
            {refunded ? copy.refundedOn(money(total), shortDate(refunded.at)) : copy.charged(money(total), shortDate(order.placed), order.card.exp)}
          </p>
        </div>
      </div>
    </Panel>
  )
}

function AddressBlock({ label, address }: { label: string; address: Address }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Eyebrow render={<p />} className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">
        {label}
      </Eyebrow>
      <address className="text-ui text-fg not-italic">
        <span className="font-medium">{address.name}</span>
        {address.lines.map((line) => (
          <span key={line} className="block text-fg-muted">
            {line}
          </span>
        ))}
        {address.phone && <span className="block text-fg-muted tabular-nums">{address.phone}</span>}
      </address>
    </div>
  )
}

/** Where it goes and who the invoice is made out to. */
export function Addresses({ order, heading }: { order: Order; heading: 'h2' | 'h3' }) {
  const { copy } = useOrder()
  return (
    <Panel title={copy.addresses} heading={heading}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <AddressBlock label={copy.shippingTo} address={order.shipTo} />
        <AddressBlock label={copy.billingTo} address={order.billTo} />
      </div>
      <p className="text-ui-sm text-fg-muted">
        {copy.receipts} <span className="text-fg">{order.email}</span>
      </p>
    </Panel>
  )
}
