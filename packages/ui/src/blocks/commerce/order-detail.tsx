'use client'

import { useId, useMemo, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { ArrowLeftIcon, CircleXIcon, DownloadIcon, MailIcon, MessageDotsIcon, PhoneIcon, UndoIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Timeline } from '../../components/ui/timeline'
import { toast, Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { ORDER_DETAIL_COPY, OrderContext, orderFormat, type OrderDetailCopy } from './order-detail/copy'
import { DELIVERED, demo, NOW, ORDERS, SCAN_TYPES, totals, type Address, type Line, type Order, type Shipment } from './order-detail/data'
import { Addresses, PaymentSummary } from './order-detail/details'
import { OrderItems } from './order-detail/items'
import { ReturnDialog, type ReturnRequest } from './order-detail/return-dialog'
import { ShipmentPanel } from './order-detail/shipment'

/* Fieldwork's "where's my order" page. The header states the order, when it
 * was placed, what it came to and where it stands, with the invoice, a
 * return and support one press away. The delivery card leads with when the
 * package arrives; its tracker starts at Ordered and steps along the route to
 * where the package is (each connector fills in turn), the carrier's scans
 * run beneath as a Timeline, and Track package asks the carrier for news: a
 * new scan takes its slot at the top, the tracker steps on and the headline
 * morphs. An order that ships as two packages gets a tab per package. Return
 * items is a Dialog with a Wizard (items and quantities, a reason, how the
 * refund comes back, with the refund as a Counter), and a started return
 * marks its items and raises a note above the page. A canceled order shows
 * why and where the refund went instead of a tracker. Reduced motion: the
 * tracker is at its stage, new scans and numbers appear in place.
 *
 * Pass your `order` (lines, shipments with their scans, addresses, card),
 * `currency` and `locale`, and wire `onTrack`, `onReturn`,
 * `onDownloadInvoice` and `onContact`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

type OrderState = keyof typeof ORDERS

interface OrderDetailProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /**
   * A view inside another app (an account page): no store bar, a `section`
   * named by an `h2` instead of the page's `main` and `h1`, and no page
   * height or padding, so the host lays it out. Default false.
   */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1088px at 100% scale). Default false. */
  fill?: boolean
  /** The order: yours, or a demo state (split across two packages, one package in transit, delivered, or canceled). Default 'split'. */
  order?: OrderState | Order
  /** Asks the carrier for news about a package. Resolve true when there was (then pass the updated `order`), false when not. Default: the demo's next scan. */
  onTrack?: (shipment: Shipment) => Promise<boolean> | boolean
  /** Starts a return; resolve with the request as recorded (your RMA, say) or nothing. Reject to keep the dialog open. Default: a short demo wait. */
  onReturn?: (request: ReturnRequest) => Promise<ReturnRequest | void> | ReturnRequest | void
  /** Downloads the invoice. Default: a short demo wait and a toast. */
  onDownloadInvoice?: (order: Order) => Promise<unknown> | unknown
  /** Opens a support channel. Default: a toast per channel. */
  onContact?: (channel: 'chat' | 'email' | 'phone', order: Order) => void
  /** Support's email and phone in the contact menu. Default: Fieldwork's. */
  support?: { email: string; phone: string }
  /** The store's name and mark in the top bar. Default: Fieldwork. */
  brand?: { name: string; logo?: ReactNode }
  /** "All orders"; `null` hides it. Default '#orders'. */
  ordersHref?: string | null
  /** Renders "All orders", e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** An ISO 4217 code. Default 'USD'. */
  currency?: string
  /** A BCP 47 locale for money, dates and times. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Now, for "today" and "tomorrow" and the return's drop-off date. Default: the demo's now. */
  now?: Date | number
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<OrderDetailCopy>
}

const FIELDWORK_SUPPORT = { email: 'help@fieldwork.co', phone: '+1 800 555 0199' }

function OrderDetail({
  theme,
  embedded = false,
  fill = false,
  order: orderProp = 'split',
  onTrack,
  onReturn = async () => {
    await demo('OrderDetail: onReturn', 900)
  },
  onDownloadInvoice,
  onContact,
  support = FIELDWORK_SUPPORT,
  brand,
  ordersHref = '#orders',
  linkComponent: Link = 'a',
  currency,
  locale: localeProp,
  now = NOW,
  copy: copyProp,
  className,
  ...rest
}: OrderDetailProps) {
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Heading = embedded ? 'h3' : 'h2'
  const order = typeof orderProp === 'string' ? ORDERS[orderProp] : orderProp
  const locale = useLocale(localeProp)
  const format = useMemo(() => orderFormat({ ...ORDER_DETAIL_COPY, ...copyProp }, locale, currency, +now), [copyProp, locale, currency, now])
  const { copy, money, shortDate, clock } = format
  const [shipments, setShipments] = useState(order.shipments)
  // A new order from the app (after tracking, say) replaces what's shown.
  const [seenOrder, setSeenOrder] = useState(order)
  if (seenOrder !== order) {
    setSeenOrder(order)
    setShipments(order.shipments)
  }
  const [returning, setReturning] = useState<Record<string, number>>({})
  const [request, setRequest] = useState<ReturnRequest | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const { total } = totals(order)
  const count = order.lines.reduce((n, l) => n + l.quantity, 0)
  const arrived = (id?: string) => shipments.find((s) => s.id === id)?.stage === DELIVERED
  const eligible = order.lines.filter((l) => arrived(l.shipment) && (returning[l.id] ?? 0) < l.quantity).map((line) => ({ line, left: line.quantity - (returning[line.id] ?? 0) }))
  const pending = order.lines.filter((l) => !order.cancelled && !arrived(l.shipment))
  const delivered = shipments.filter((s) => s.stage === DELIVERED).length
  const status = order.cancelled
    ? { label: copy.canceled, variant: 'danger' as const }
    : delivered === shipments.length
      ? { label: copy.delivered, variant: 'success' as const }
      : delivered > 0
        ? { label: copy.someDelivered(delivered, shipments.length), variant: 'default' as const }
        : { label: copy.onItsWay, variant: 'default' as const }
  // Open on the package that hasn't arrived: that's the one people check on.
  const [tab, setTab] = useState(() => (shipments.find((s) => s.stage !== DELIVERED) ?? shipments[0])?.id)

  const track = async (id: string) => {
    const shipment = shipments.find((s) => s.id === id)!
    if (onTrack) return onTrack(shipment)
    await demo('OrderDetail: onTrack', 1100)
    const next = shipment.upcoming?.[0]
    if (!next) {
      const last = shipment.events.reduce((n, e) => Math.max(n, +new Date(e.time)), 0)
      toast(copy.noNewScans(shipment.carrier.split(' ')[0] ?? shipment.carrier), { description: copy.lastScan(shortDate(last), clock(last)) })
      return false
    }
    const now = Date.now()
    setShipments((list) =>
      list.map((s): Shipment =>
        s.id !== id
          ? s
          : {
              ...s,
              stage: Math.max(s.stage, next.stage),
              stamps: next.stage > s.stage ? [...s.stamps, now] : s.stamps,
              note: next.note ?? s.note,
              events: [...s.events, { id: `${id}-${s.events.length + 1}`, type: next.type, title: next.title, time: now }],
              upcoming: s.upcoming!.slice(1),
            },
      ),
    )
    return true
  }

  const panel = (s: Shipment) => <ShipmentPanel shipment={s} lines={order.lines.filter((l) => l.shipment === s.id)} onTrack={track} />
  const contact = (channel: 'chat' | 'email' | 'phone', toastTitle: string, description: string) => {
    if (onContact) onContact(channel, order)
    else toast(toastTitle, { description })
  }

  const content = (
    <>
      <Reveal inView={false} variant="rise" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {!embedded && ordersHref !== null && (
            <Link href={ordersHref} className="-ms-1 flex w-fit items-center gap-1 rounded-md px-1 text-ui-sm text-fg-muted hover:text-fg focus-ring">
              <ArrowLeftIcon size={14} className="rtl:-scale-x-100" />
              {copy.allOrders}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Title id={titleId} className="text-xl font-semibold tracking-tight text-fg">
              {copy.title(order.number)}
            </Title>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-ui text-fg-muted tabular-nums">{copy.placed(shortDate(order.placed), count, money(total))}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AsyncButton
            variant="outline"
            pendingLabel={copy.preparing}
            successLabel={copy.downloaded}
            onAction={async () => {
              if (onDownloadInvoice) return onDownloadInvoice(order)
              await demo('OrderDetail: onDownloadInvoice', 900)
              toast.success(copy.downloadedToast(order.number), { description: order.cancelled ? copy.downloadedCancelled : copy.downloadedFor(money(total), order.billTo.name) })
            }}
          >
            <DownloadIcon size={14} />
            {copy.downloadInvoice}
          </AsyncButton>
          {eligible.length > 0 && (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>
              <UndoIcon size={14} className="rtl:-scale-x-100" />
              {copy.returnItems}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <MessageDotsIcon size={14} />
              {copy.contactSupport}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onClick={() => contact('chat', copy.chatToast, copy.chatToastDetail(order.number))}>
                <MessageDotsIcon size={14} /> {copy.chat}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => contact('email', copy.emailToast, copy.emailToastDetail(support.email, order.number))}>
                <MailIcon size={14} /> {copy.emailUs(support.email)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => contact('phone', copy.callToast(support.phone), copy.callToastDetail)}>
                <PhoneIcon size={14} /> {copy.callUs(support.phone)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Reveal>

      <Alert variant="success" open={!!request}>
        <AlertTitle>{request ? copy.returnStarted(request.rma) : ''}</AlertTitle>
        <AlertDescription>
          {request
            ? copy.returnNote(shortDate(request.dropBy), money(request.refund), request.to === 'card' ? copy.toCard(order.card.brand, order.card.last4) : copy.asCredit)
            : ''}
        </AlertDescription>
      </Alert>

      <Stagger className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_--spacing(80)]" itemClassName="min-w-0">
        <div className="flex flex-col gap-5">
          <section aria-labelledby={`${titleId}-delivery`} className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <Heading id={`${titleId}-delivery`} className="text-ui font-medium text-fg">
                {order.cancelled ? copy.cancellation : shipments.length > 1 ? copy.deliveryPackages(shipments.length) : copy.delivery}
              </Heading>
            </div>
            <div className="p-4 sm:p-5">
              {order.cancelled ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-subtle text-danger-text">
                      <CircleXIcon size={20} trigger="mount" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-2xl font-semibold tracking-tight text-fg">{copy.canceledOn(shortDate(order.cancelled.at))}</p>
                      <p className="text-ui text-fg-muted">{copy.canceledRefund(order.cancelled.reason, money(total), order.card.brand, order.card.last4)}</p>
                    </div>
                  </div>
                  <Timeline events={order.cancelled.events} types={SCAN_TYPES} />
                </div>
              ) : shipments.length > 1 ? (
                <Tabs value={tab} onValueChange={(value) => setTab(value as string)} className="gap-5">
                  <TabsList variant="pill" aria-label={copy.packages}>
                    {shipments.map((s) => (
                      <TabsTrigger key={s.id} value={s.id}>
                        <span aria-hidden className={s.stage === DELIVERED ? 'size-1.5 rounded-full bg-success' : 'size-1.5 rounded-full bg-accent'} />
                        {s.name}
                        <span className="text-fg-muted">{s.stage === DELIVERED ? copy.packageDelivered : copy.packageOnItsWay}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {shipments.map((s) => (
                    // One package's room at an app's size: another, with a longer journey, scrolls in it.
                    <TabsContent key={s.id} value={s.id} className="h-148.75 flex-none overflow-y-auto yj-scrollbar">
                      {panel(s)}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                shipments[0] && panel(shipments[0])
              )}
            </div>
          </section>
          <OrderItems lines={order.lines} shipments={shipments} returning={returning} cancelled={!!order.cancelled} heading={Heading} />
        </div>
        <div className="flex flex-col gap-5">
          <PaymentSummary order={order} heading={Heading} />
          <Addresses order={order} heading={Heading} />
        </div>
      </Stagger>
    </>
  )

  const overlays = (
    <>
      <ReturnDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        order={order}
        eligible={eligible}
        pending={pending}
        onReturn={async (draft) => {
          const next = (await onReturn(draft)) ?? draft
          setRequest(next)
          setReturning((r) => {
            const out = { ...r }
            for (const [id, n] of Object.entries(next.units)) out[id] = (out[id] ?? 0) + n
            return out
          })
          return next
        }}
      />
      <Toaster />
    </>
  )

  if (embedded) {
    const view = (
      <OrderContext.Provider value={format}>
        {/* Its natural width is the standalone page's column (1088px at 100% scale). */}
        <section aria-labelledby={titleId} className={cn('flex flex-col gap-5 text-fg', !fill && 'max-w-272', className)} {...rest}>
          {content}
          {overlays}
        </section>
      </OrderContext.Provider>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <OrderContext.Provider value={format}>
        <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
          <header className="border-b border-line bg-surface">
            <div className={cn('mx-auto flex h-14 items-center gap-3 px-4 md:px-8', !fill && 'max-w-6xl')}>
              {brand?.logo ?? (
                <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
                    <path d="M2.5 5 8 2l5.5 3v6L8 14l-5.5-3z" />
                    <path d="M2.5 5 8 8l5.5-3M8 8v6" />
                  </svg>
                </span>
              )}
              <span className="font-semibold tracking-tight">{brand?.name ?? 'Fieldwork'}</span>
              <span aria-hidden className="text-fg-muted">/</span>
              <span className="truncate text-fg-muted">{copy.brandSection}</span>
              <span className="ms-auto truncate text-ui-sm text-fg-muted">{order.shipTo.name}</span>
            </div>
          </header>
          <main className={cn('mx-auto flex flex-col gap-5 px-4 py-8 md:px-8', !fill && 'max-w-6xl')}>{content}</main>
          {overlays}
        </div>
      </OrderContext.Provider>
    </ThemeScope>
  )
}

export { OrderDetail, ORDER_DETAIL_COPY }
export type { Address as OrderAddress, Line as OrderLine, Order, OrderDetailCopy, OrderDetailProps, ReturnRequest, Shipment as OrderShipment }
