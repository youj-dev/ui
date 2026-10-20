'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { AppPage } from '../../components/ui/app-page'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Skeleton } from '../../components/ui/skeleton'
import { toast, Toaster } from '../../components/ui/toast'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { cn } from '../../lib/utils'
import { BillingDetails } from './billing/billing-details'
import { ChangePlanDialog } from './billing/change-plan-dialog'
import {
  CARD,
  DEFAULT_COPY,
  DETAILS,
  INVOICES,
  moneyFormat,
  PLANS,
  SEATS,
  demo,
  type BillingCard,
  type BillingCardInput,
  type BillingCopy,
  type BillingCycle,
  type BillingInfo,
  type BillingInvoice,
  type BillingInvoiceStatus,
  type BillingPlan,
} from './billing/data'
import { InvoicesTable } from './billing/invoices-table'
import { PaymentMethod } from './billing/payment-method'
import { PlanCard } from './billing/plan-card'

/* Tern's billing settings: what the workspace pays for and where the money
 * comes from. The plan card states the plan, the per-seat price and the next
 * invoice (a Counter that retargets when the plan changes); Change plan opens
 * a dialog whose segmented Monthly / Annual switch retargets every price and
 * whose footer says what the next invoice becomes before you confirm. The card
 * on file updates in a dialog; billing details save inline once edited. The
 * invoice table filters by status (rows enter and leave through PresenceList),
 * downloads each invoice (Button onAction holds the row's button pending), and
 * a failed charge raises an Alert above everything with a retry that
 * settles the invoice, after which the Alert folds away. Pass your own
 * `plans`, `card`, `invoices` and `details`, wire the `on…` callbacks to your
 * billing provider (demo stand-ins run, and warn once in development, until you do), and set
 * `locale`/`currency`; every string is in `copy`. It is built for the compact
 * layout density (ui.css), taken from the page. Reduced motion: numbers, rows and
 * the alert change in place. */

type Filter = 'all' | 'paid' | 'open'

interface BillingProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** Starts with September's charge failed, which raises the payment alert. Only applies to the demo invoices. Default true. */
  failedPayment?: boolean
  /** The product in the top bar. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  /** The plans on offer, cheapest first. Default: Starter, Growth, Scale. */
  plans?: BillingPlan[]
  /** The current plan's id, to control it. Pair with `onChangePlan`. */
  plan?: string
  /** The current plan's id at first, when uncontrolled. Default 'growth'. */
  defaultPlan?: string
  /** The billing cycle, to control it. */
  cycle?: BillingCycle
  /** The billing cycle at first, when uncontrolled. Default 'monthly'. */
  defaultCycle?: BillingCycle
  /** Seats the workspace pays for. Default 14. */
  seats?: number
  /** The card on file. Default: a Visa ending 4242. */
  card?: BillingCard
  /** Every invoice, newest first; one with status `failed` raises the payment alert. Default: Tern's seven. */
  invoices?: BillingInvoice[]
  /** Who invoices are addressed to. Default: Tern Analytics GmbH. */
  details?: BillingInfo
  /** Formats every amount. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The ISO currency of every amount. Default 'USD'. */
  currency?: string
  /** The page title's level; section headings sit one below. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Shows skeleton rows in place of the invoices while they load. Default false. */
  loading?: boolean
  /** A load failure, shown under the title with a Retry button when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Retry button. */
  onRetry?: () => void
  /** Replaces the empty state shown when there are no invoices. Default: `copy.emptyInvoices`. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<BillingCopy>
  /** Switches plan or cycle; resolve when done, throw to show the error in the dialog. Default: a demo wait. */
  onChangePlan?: (change: { plan: BillingPlan; cycle: BillingCycle }) => Promise<unknown> | unknown
  /** Saves a new card from the form; resolve with the card on file (or nothing to show what was typed). Default: a demo wait. */
  onUpdatePayment?: (input: BillingCardInput) => Promise<BillingCard | void> | BillingCard | void
  /** Retries a failed charge; resolve when paid, throw when declined. Default: a demo wait. */
  onRetryPayment?: (invoice: BillingInvoice) => Promise<unknown> | unknown
  /** Fetches an invoice's PDF; resolve when it's ready. Default: a demo wait. */
  onDownloadInvoice?: (invoice: BillingInvoice) => Promise<unknown> | unknown
  /** Saves the billing details; resolve when saved, throw to show the error. Default: a demo wait. */
  onSaveDetails?: (details: BillingInfo) => Promise<unknown> | unknown
}

function Billing({
  theme,
  embedded = true,
  failedPayment = true,
  brand = { name: 'Tern' },
  plans = PLANS,
  plan: planProp,
  defaultPlan = 'growth',
  cycle: cycleProp,
  defaultCycle = 'monthly',
  seats = SEATS,
  card: cardProp = CARD,
  invoices: invoicesProp,
  details = DETAILS,
  locale: localeProp,
  currency = 'USD',
  headingLevel = 1,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  onChangePlan,
  onUpdatePayment,
  onRetryPayment,
  onDownloadInvoice,
  onSaveDetails,
  className,
  ...rest
}: BillingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const money = useMemo(() => moneyFormat(locale, currency), [locale, currency])
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const Heading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const [innerPlan, setPlan] = useState(defaultPlan)
  const [innerCycle, setCycle] = useState<BillingCycle>(defaultCycle)
  const plan = plans.find((p) => p.id === (planProp ?? innerPlan)) ?? plans[0]!
  const cycle = cycleProp ?? innerCycle
  const [card, setCard] = useState(cardProp)
  const initialInvoices = invoicesProp ?? (failedPayment ? INVOICES : INVOICES.map((i) => (i.status === 'failed' ? { ...i, status: 'paid' as const } : i)))
  const [invoices, setInvoices] = useState(initialInvoices)
  // New data from the app (after `loading`, or a refetch) replaces what's shown.
  const [source, setSource] = useState({ invoicesProp, cardProp })
  if (source.invoicesProp !== invoicesProp || source.cardProp !== cardProp) {
    setSource({ invoicesProp, cardProp })
    setInvoices(initialInvoices)
    setCard(cardProp)
  }
  const [filter, setFilter] = useState<Filter>('all')
  const [changing, setChanging] = useState(false)
  const failed = invoices.find((i) => i.status === 'failed')
  // The alert keeps its words while it folds away after the retry settles.
  const [lastFailed, setLastFailed] = useState(failed)
  if (failed && failed !== lastFailed) setLastFailed(failed)
  const failure = failed ?? lastFailed
  const shown = invoices.filter((i) => filter === 'all' || (filter === 'paid' ? i.status === 'paid' || i.status === 'refunded' : i.status === 'failed' || i.status === 'due'))
  const cardName = copy.cardSummary(card.brand, card.last4)

  const retry = async (invoice: BillingInvoice) => {
    await (onRetryPayment ? onRetryPayment(invoice) : demo('Billing: onRetryPayment', 1000))
    setInvoices((list) => list.map((i) => (i.id === invoice.id ? { ...i, status: 'paid' } : i)))
    toast.success(copy.paidToast(invoice.number), { description: copy.chargedTo(money(invoice.amount), cardName) })
  }

  const content = (
    <>
      {error && (
        <Alert variant="danger">
          <AlertTitle>{copy.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}

      <Alert variant="danger" open={!!failed}>
        <AlertTitle>{copy.failedTitle(failure?.period ?? '')}</AlertTitle>
        <AlertDescription>{copy.failedDescription(cardName, failure ? money(failure.amount) : '')}</AlertDescription>
        <AlertAction>
          <AsyncButton size="sm" pendingLabel={copy.charging} successLabel={copy.paid} errorLabel={copy.declined} onAction={() => failed && retry(failed)}>
            {copy.retryPayment}
          </AsyncButton>
        </AlertAction>
      </Alert>

      {/* Two columns by the page's width (AppPage, or the standalone main), not the window's: in a frame the sidebar takes its share. */}
      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_--spacing(88)]">
        <div className="flex min-w-0 flex-col gap-5">
          <PlanCard plan={plan} cycle={cycle} seats={seats} copy={copy} money={money} locale={locale} currency={currency} onChange={() => setChanging(true)} />
          <section aria-labelledby={`${titleId}-invoices`} className="overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
              <Heading id={`${titleId}-invoices`} className="me-auto text-ui font-medium text-fg">
                {copy.invoicesHeading}
              </Heading>
              <ToggleGroup variant="segmented" size="sm" aria-label={copy.showInvoices} className="w-48" value={[filter]} onValueChange={(next: unknown[]) => next[0] && setFilter(next[0] as Filter)}>
                <ToggleGroupItem value="all">{copy.filterAll}</ToggleGroupItem>
                <ToggleGroupItem value="paid">{copy.filterPaid}</ToggleGroupItem>
                <ToggleGroupItem value="open">
                  {copy.filterOpen} {failed && <Badge variant="danger">1</Badge>}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {loading ? (
              <div aria-busy className="flex flex-col gap-3 px-4 py-4">
                <span className="sr-only">{copy.loading}</span>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              (empty ?? <p className="px-4 py-10 text-center text-ui text-fg-muted">{copy.emptyInvoices}</p>)
            ) : shown.length > 0 ? (
              <InvoicesTable
                invoices={shown}
                copy={copy}
                money={money}
                onRetry={retry}
                onDownloadInvoice={onDownloadInvoice}
                onDownload={(invoice) => toast.success(copy.downloaded(invoice.number))}
              />
            ) : (
              <p className="px-4 py-10 text-center text-ui text-fg-muted">{copy.nothingOpen}</p>
            )}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <PaymentMethod
            card={card}
            copy={copy}
            onUpdatePayment={onUpdatePayment}
            onUpdate={(next) => {
              setCard(next)
              toast.success(copy.cardUpdated, { description: copy.cardSummary(next.brand, next.last4) })
            }}
          />
          <BillingDetails details={details} copy={copy} onSaveDetails={onSaveDetails} onSaved={() => toast.success(copy.detailsSaved, { description: copy.detailsSavedNote })} />
        </div>
      </div>
    </>
  )

  const overlays = (
    <>
      <ChangePlanDialog
        open={changing}
        onOpenChange={setChanging}
        plan={plan}
        cycle={cycle}
        plans={plans}
        seats={seats}
        copy={copy}
        money={money}
        locale={locale}
        currency={currency}
        onChangePlan={onChangePlan}
        onConfirm={(next, nextCycle) => {
          setPlan(next.id)
          setCycle(nextCycle)
          toast.success(copy.planChanged(next.name, nextCycle))
        }}
      />
      <Toaster />
    </>
  )

  if (embedded) {
    const view = (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.description}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        {content}
        {overlays}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
            {brand.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-semibold tracking-tight">{brand.name}</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="truncate text-fg-muted">{copy.breadcrumb}</span>
            <Badge variant="outline" className="ms-auto">
              {copy.planBadge(plan.name)}
            </Badge>
          </div>
        </header>
        <main className="@container mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
          <Reveal inView={false} variant="rise" className="flex flex-col gap-1">
            <Title className="text-xl font-semibold tracking-tight text-fg">{copy.title}</Title>
            <p className="text-ui text-fg-muted">{copy.description}</p>
          </Reveal>
          {content}
        </main>
        {overlays}
      </div>
    </ThemeScope>
  )
}

export {
  Billing,
  type BillingProps,
  type BillingCopy,
  type BillingPlan,
  type BillingCycle,
  type BillingCard,
  type BillingCardInput,
  type BillingInvoice,
  type BillingInvoiceStatus,
  type BillingInfo,
}
