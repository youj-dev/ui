import { cn } from '@youj/react/lib/utils'
import type { Figure, Week } from '../data'
import { Delta, Num } from './num'

/* The week in figures, set like a ledger: label, dotted leader, figure,
 * change. Every figure rolls to the next week's. */

const USD = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const USD_CENTS = { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } as const
const COUNT = {} as const

const aov = (revenue: number, orders: number) => (orders ? revenue / orders : 0)

export function FigureLedger({ week, className }: { week: Week; className?: string }) {
  const rows: { label: string; figure: Figure; format: Intl.NumberFormatOptions; invert?: boolean }[] = [
    { label: 'Revenue', figure: week.revenue, format: USD },
    { label: 'Orders', figure: week.orders, format: COUNT },
    { label: 'Average order', figure: { value: aov(week.revenue.value, week.orders.value), previous: aov(week.revenue.previous, week.orders.previous) }, format: USD_CENTS },
    { label: 'New customers', figure: week.newCustomers, format: COUNT },
    // More refunds is bad news, so its arrow inks the other way.
    { label: 'Refunds', figure: week.refunds, format: USD, invert: true },
  ]
  return (
    <dl className={cn('flex flex-col', className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-2 border-b border-line py-2 last:border-b-0">
          <dt className="flex min-w-0 flex-1 items-baseline gap-2 text-ui-lg text-fg">
            <span className="shrink-0">{row.label}</span>
            <span aria-hidden className="min-w-4 flex-1 -translate-y-[0.3em] border-b border-dotted border-line-strong" />
          </dt>
          <dd className="text-ui-lg font-semibold text-fg">
            <Num value={row.figure.value} format={row.format} />
          </dd>
          <dd className="w-15 shrink-0 text-end">
            <Delta figure={row.figure} invert={row.invert} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
