'use client'

import { useId } from 'react'
import { Badge } from '../../../components/ui/badge'
import { ProductMedia } from '../product-card'
import { useOrder } from './copy'
import { DELIVERED, lineVariant, type Line, type Shipment } from './data'

interface OrderItemsProps {
  lines: Line[]
  shipments: Shipment[]
  /** Units of each line with a return started, by line id. */
  returning: Record<string, number>
  cancelled?: boolean
  /** The heading level for the section: h2 on a page, h3 embedded. */
  heading: 'h2' | 'h3'
}

/** What was ordered: each line with its product in the colorway bought, variant, quantity and price, and which package it travels in when there are several. */
export function OrderItems({ lines, shipments, returning, cancelled = false, heading: Heading }: OrderItemsProps) {
  const headingId = useId()
  const { copy, money } = useOrder()
  const count = lines.reduce((n, l) => n + l.quantity, 0)
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <Heading id={headingId} className="text-ui font-medium text-fg">
          {copy.items}
        </Heading>
        <span className="text-ui-sm text-fg-muted tabular-nums">{copy.itemCount(count)}</span>
      </div>
      <ul className="divide-y divide-line">
        {lines.map((line) => {
          const shipment = shipments.find((s) => s.id === line.shipment)
          const back = returning[line.id] ?? 0
          return (
            <li key={line.id} className="flex items-start gap-3 px-4 py-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line">
                <ProductMedia product={line.product} color={line.color} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-ui font-medium text-fg">{line.product.name}</p>
                  <p className={cancelled ? 'text-ui text-fg-muted tabular-nums line-through' : 'text-ui text-fg tabular-nums'}>
                    {money(line.product.price * line.quantity)}
                  </p>
                </div>
                <p className="text-ui-sm text-fg-muted">
                  {lineVariant(line)}
                  {copy.qty(line.quantity)}
                  {line.quantity > 1 && copy.each(money(line.product.price))}
                </p>
                {(shipments.length > 1 || back > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {shipments.length > 1 && shipment && (
                      <Badge variant={shipment.stage === DELIVERED ? 'success' : 'secondary'}>
                        {`${shipment.name} ${shipment.stage === DELIVERED ? copy.packageDelivered : copy.packageOnItsWay}`}
                      </Badge>
                    )}
                    {back > 0 && <Badge variant="warning">{back === line.quantity ? copy.returnStartedBadge : copy.returning(back, line.quantity)}</Badge>}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
