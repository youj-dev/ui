'use client'

import { CheckIcon, MailIcon, PackageIcon, PrinterIcon, RotateCcwIcon, TruckIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { NEXT_STEP } from './columns'
import { DEFAULT_COPY, type OrdersCopy } from './copy'
import { FULFILMENT, money, PAYMENT, type Fulfilment, type Order } from './data'

const tone = { success: 'success', warning: 'warning', danger: 'danger', accent: 'default', neutral: 'secondary' } as const

/** When an order was placed, as the sheet shows it: "29 Sep, 15:40", in UTC. */
export const formatPlaced = (date: Date) => dateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date)

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

const STEPS = ['placed', 'packed', 'shipped', 'delivered'] as const
const reached: Record<Fulfilment, number> = { unfulfilled: 0, packed: 1, shipped: 2, delivered: 3, returned: 3 }

function Heading({ children }: { children: string }) {
  return <h3 className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{children}</h3>
}

/** Where the order is on its way: done steps filled, the current one ringed. */
function Progress({ order, copy }: { order: Order; copy: OrdersCopy }) {
  const at = reached[order.fulfilment]
  return (
    <ol aria-label={copy.progress} className="grid grid-cols-4 gap-1.5">
      {STEPS.map((step, i) => {
        const done = i <= at
        return (
          <li key={step} aria-current={i === at ? 'step' : undefined} className="flex min-w-0 flex-col gap-2">
            <span aria-hidden className={cn('h-1 rounded-full bg-line', done && 'bg-accent', order.fulfilment === 'returned' && 'bg-danger')} />
            <span className={cn('flex items-center gap-1 truncate text-ui-sm', done ? 'text-fg' : 'text-fg-muted')}>
              {done && <CheckIcon size={12} aria-hidden className="shrink-0" />}
              {step === 'placed' ? copy.placed : copy.fulfilment[step]}
              <span className="sr-only">{done ? copy.done : copy.toDo}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

interface OrderSheetProps {
  open: boolean
  /** The order shown: kept while the sheet slides away, so it leaves with its content. */
  order: Order | undefined
  onClose: () => void
  onLabel: (o: Order) => void
  onAdvance: (o: Order) => void
  onRefund: (o: Order) => void
  onEmail: (o: Order) => void
  copy?: OrdersCopy
  locale: string
  currency?: string
  formatDate?: (date: Date) => string
}

/** The order, opened from its row: who, what, how far it has got, and the next step. */
export function OrderSheet({
  open,
  order,
  onClose,
  onLabel,
  onAdvance,
  onRefund,
  onEmail,
  copy = DEFAULT_COPY,
  locale,
  currency = 'USD',
  formatDate = formatPlaced,
}: OrderSheetProps) {
  const cash = (n: number, cents = false) => money(n, cents, locale, currency)
  const step = order && order.payment === 'paid' ? NEXT_STEP[order.fulfilment] : undefined
  const subtotal = order ? order.total - order.shipping : 0
  return (
    <Sheet open={open && order !== undefined} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="end" className="w-[min(--spacing(120),calc(100vw-1.5rem))]">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono tabular-nums">{order.id}</SheetTitle>
              <SheetDescription>
                {formatDate(new Date(order.placedAt))} · {order.channel}
              </SheetDescription>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant={tone[PAYMENT[order.payment].tone]}>{copy.payment[order.payment]}</Badge>
                <Badge variant={tone[FULFILMENT[order.fulfilment].tone]}>{copy.fulfilment[order.fulfilment]}</Badge>
              </div>
            </SheetHeader>
            <SheetBody className="gap-6">
              <Progress order={order} copy={copy} />

              <section aria-labelledby={`${order.id}-customer`} className="flex flex-col gap-3">
                <h3 id={`${order.id}-customer`} className="sr-only">
                  {copy.customer}
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(order.customer)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-fg">{order.customer}</span>
                    <span className="truncate text-ui-sm text-fg-muted">{order.email}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={copy.emailCustomer(order.customer)} onClick={() => onEmail(order)}>
                    <MailIcon />
                  </Button>
                </div>
                <address className="rounded-lg border border-line bg-transparent px-3 py-2.5 text-ui-sm leading-relaxed text-fg-muted not-italic">
                  <span className="text-fg">{order.customer}</span>
                  <br />
                  {order.address}, {order.city}
                  <br />
                  {order.country} · {order.carrier}
                </address>
              </section>

              <section className="flex flex-col gap-2">
                <Heading>{copy.items}</Heading>
                <ul className="flex flex-col divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.sku} className="flex items-baseline gap-3 py-2.5">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-fg">{item.name}</span>
                        <span className="font-mono text-ui-xs text-fg-muted">{item.sku}</span>
                      </div>
                      <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
                        {item.quantity} × {cash(item.price)}
                      </span>
                      <span className="w-20 text-end font-mono text-ui text-fg tabular-nums">{cash(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-ui-sm">
                  {[
                    [copy.subtotal, cash(subtotal, true)],
                    [copy.shipping, order.shipping ? cash(order.shipping, true) : copy.free],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 text-fg-muted">
                      <dt>{label}</dt>
                      <dd className="font-mono tabular-nums">{value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 pt-1 text-ui font-medium text-fg">
                    <dt>{copy.total}</dt>
                    <dd className="font-mono tabular-nums">{cash(order.total, true)}</dd>
                  </div>
                </dl>
              </section>
            </SheetBody>
            <SheetFooter>
              {order.payment === 'paid' && (
                <Button variant="ghost" className="me-auto text-danger-text hover:bg-danger-subtle hover:text-danger-text" onClick={() => onRefund(order)}>
                  <RotateCcwIcon size={16} />
                  <span className="max-sm:sr-only">{copy.refund}</span>
                </Button>
              )}
              <Button variant="outline" disabled={order.payment !== 'paid'} onClick={() => onLabel(order)}>
                <PrinterIcon size={16} />
                <span className="max-sm:sr-only">{copy.printLabel}</span>
              </Button>
              {step && (
                <Button onClick={() => onAdvance(order)}>
                  {step.to === 'packed' ? <PackageIcon size={16} /> : <TruckIcon size={16} />} {copy.markAs[step.to]}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
