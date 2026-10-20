'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckCircleIcon, LockIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyMedia } from '../../components/ui/empty'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  COUNTRIES,
  DEFAULT_COPY,
  money,
  PAYMENT,
  paymentErrors,
  PLANS,
  PROMO_CODES,
  quote,
  demo,
  type Country,
  type Payment,
  type Period,
  type Plan,
  type SubscriptionCheckoutCopy,
  type SubscriptionOrder,
} from './subscription-checkout/data'
import { OrderSummary } from './subscription-checkout/order-summary'
import { PaymentStep } from './subscription-checkout/payment-step'
import { PlanStep } from './subscription-checkout/plan-step'

/* From choosing a plan to paying for it, in a two-step Wizard beside a
 * sticky order summary. Plan: a Monthly / Yearly switch (its key glides, and
 * every price rolls to its new figure through Counter), plans as choice
 * cards, and seats on a NumberInput. Payment: plain inputs standing in for a
 * provider's secure fields, clearly marked as a placeholder, with the card
 * number grouped and the expiry slashed as you type. The summary follows
 * every choice: the list price, the yearly discount and a promo code (each
 * line grows in when it applies), the tax for the chosen country and the
 * total due today. Subscribing runs through the Wizard's Finish, then the
 * page turns into the confirmation with a check that draws itself and the
 * receipt. There is no real payment integration. Reduced motion: steps swap
 * in place and numbers change without rolling.
 *
 * Pass your `plans`, `countries` (with their tax), `promoCodes`, `brand`,
 * `currency` and `locale`, own the plan, period and seats when the URL
 * should hold them, and take the order through `onSubscribe`; every string
 * is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface SubscriptionCheckoutProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Any of the checkout's strings, to rewrite or translate. */
  copy?: Partial<SubscriptionCheckoutCopy>
  /** The plans to choose from. Default: the demo's three. */
  plans?: Plan[]
  /** The chosen plan's id, controlled: pair it with `onPlanChange`. */
  plan?: string
  /** The plan chosen first, when the checkout owns it. Default 'pro'. */
  defaultPlan?: string
  onPlanChange?: (plan: string) => void
  /** The billing period, controlled: pair it with `onPeriodChange`. */
  period?: Period
  /** The period first shown, when the checkout owns it. Default 'yearly'. */
  defaultPeriod?: Period
  onPeriodChange?: (period: Period) => void
  /** The seat count, controlled: pair it with `onSeatsChange`. */
  seats?: number
  /** The seats first set, when the checkout owns them. Default 5. */
  defaultSeats?: number
  onSeatsChange?: (seats: number) => void
  /** The countries you sell to, with the tax each adds. Default: the demo's eight. */
  countries?: Country[]
  /** The payment form's starting values (a signed-in buyer's email and country, say). */
  defaultPayment?: Partial<Payment>
  /** The product in the header: `{ name, logo? }`. Default: `copy.brand` with its initial. */
  brand?: { name: string; logo?: ReactNode }
  /** An ISO 4217 code. Default: `copy.currency` ('USD'). */
  currency?: string
  /** A BCP 47 locale for prices. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Codes and the share each takes off, like `{ LAUNCH20: 0.2 }`. */
  promoCodes?: Record<string, number>
  /** Takes the order to your payment provider. Reject to stay on the step. */
  onSubscribe?: (order: SubscriptionOrder) => unknown
  /** The confirmation's "Go to your workspace". */
  onDone?: () => void
}

function SubscriptionCheckout({
  theme,
  copy: copyProp,
  plans = PLANS,
  plan: planProp,
  defaultPlan = 'pro',
  onPlanChange,
  period: periodProp,
  defaultPeriod = 'yearly',
  onPeriodChange,
  seats: seatsProp,
  defaultSeats = 5,
  onSeatsChange,
  countries = COUNTRIES,
  defaultPayment,
  brand,
  currency,
  locale,
  promoCodes = PROMO_CODES,
  onSubscribe = () => demo('SubscriptionCheckout: onSubscribe', 1400),
  onDone,
  className,
  ...rest
}: SubscriptionCheckoutProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, ...(currency && { currency }), locale: useLocale(locale ?? copyProp?.locale) }
  const [planId, setOwnedPlan] = useControllableState(planProp, defaultPlan)
  const [period, setOwnedPeriod] = useControllableState<Period>(periodProp, defaultPeriod)
  const [seats, setOwnedSeats] = useControllableState(seatsProp, defaultSeats)
  const setPlanId = (next: string) => (setOwnedPlan(next), onPlanChange?.(next))
  const setPeriod = (next: Period) => (setOwnedPeriod(next), onPeriodChange?.(next))
  const setSeats = (next: number) => (setOwnedSeats(next), onSeatsChange?.(next))
  const [promo, setPromo] = useState<string>()
  const [payment, setPayment] = useState<Payment>(() => ({ ...PAYMENT, country: countries[0]?.code ?? PAYMENT.country, ...defaultPayment }))
  const [showErrors, setShowErrors] = useState(false)
  const [order, setOrder] = useState<SubscriptionOrder>()
  const plan = plans.find((p) => p.id === planId) ?? plans[0]!
  const country = countries.find((c) => c.code === payment.country) ?? countries[0] ?? COUNTRIES[0]!
  const total = quote(plan, period, seats, promo ? (promoCodes[promo] ?? 0) : 0, country.taxRate).total

  const subscribe = async () => {
    // Named field by field, so the card number and CVC never reach the order.
    const { email, holder, card, expiry, country: countryCode, postal } = payment
    const next: SubscriptionOrder = { plan: plan.id, period, seats, promo, total, payment: { email: email.trim(), holder, expiry, country: countryCode, postal, last4: card.replace(/\s/g, '').slice(-4) } }
    await onSubscribe(next)
    setOrder(next)
  }

  const page = (
    <div className={cn('relative isolate min-h-dvh bg-canvas text-fg', className)} {...rest}>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <span className="inline-flex items-center gap-2 text-ui font-semibold tracking-tight">
            {brand?.logo ?? (
              <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-ui-xs text-on-accent">
                {(brand?.name ?? copy.brand).charAt(0)}
              </span>
            )}
            {brand?.name ?? copy.brand}
          </span>
          <span className="flex items-center gap-3">
            <Badge variant="warning" className="max-sm:hidden">
              {copy.demo}
            </Badge>
            <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
              <LockIcon size={14} /> {copy.secure}
            </span>
          </span>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        {order ? (
          <Reveal inView={false} variant="rise" className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-6 text-center">
            <EmptyMedia variant="icon" className="mb-0 size-16">
              <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
            </EmptyMedia>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{copy.doneTitle(plan.name)}</h1>
              <p className="text-ui text-pretty text-fg-muted">{copy.doneDescription(order.payment.email)}</p>
            </div>
            <Card className="w-full text-start">
              <CardContent>
                <h2 className="mb-3 text-ui-sm font-medium text-fg-muted">{copy.receipt}</h2>
                <dl className="flex flex-col gap-2 text-ui">
                  {[
                    [plan.name, `${order.period === 'yearly' ? copy.yearly : copy.monthly} · ${copy.seatLine(order.seats, money(plan.price, copy), order.period)}`],
                    [copy.total, money(order.total, copy)],
                    [copy.card, copy.paidWith(order.payment.last4)],
                  ].map(([term, value]) => (
                    <div key={term} className="flex items-baseline justify-between gap-4">
                      <dt className="text-fg-muted">{term}</dt>
                      <dd className="text-end text-fg tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
            <Button size="lg" onClick={onDone}>
              {copy.open} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </Button>
          </Reveal>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
              <p className="text-ui text-pretty text-fg-muted">{copy.subtitle}</p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(88)] lg:gap-8">
              <Card>
                <CardContent>
                  <Wizard
                    headingLevel={2}
                    backLabel={copy.back}
                    nextLabel={copy.next}
                    finishLabel={copy.subscribe(money(total, copy))}
                    finishSuccessLabel={copy.subscribed}
                    onComplete={subscribe}
                  >
                    <WizardStep id="plan" title={copy.stepPlan} description={copy.stepPlanDescription}>
                      <PlanStep plans={plans} plan={plan.id} period={period} seats={seats} copy={copy} onPlan={setPlanId} onPeriod={setPeriod} onSeats={setSeats} />
                    </WizardStep>
                    <WizardStep
                      id="payment"
                      title={copy.stepPayment}
                      description={copy.stepPaymentDescription}
                      validate={() => {
                        setShowErrors(true)
                        return Object.keys(paymentErrors(payment, copy)).length === 0
                      }}
                    >
                      <PaymentStep value={payment} onChange={setPayment} showErrors={showErrors} copy={copy} countries={countries} />
                    </WizardStep>
                  </Wizard>
                </CardContent>
              </Card>
              <OrderSummary plan={plan} period={period} seats={seats} country={country} promo={promo} codes={promoCodes} copy={copy} onPromo={setPromo} />
            </div>
          </>
        )}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { SubscriptionCheckout, DEFAULT_COPY as SUBSCRIPTION_CHECKOUT_COPY }
export type { Country as SubscriptionCountry, Payment as SubscriptionPayment, Period as SubscriptionPeriod, Plan as SubscriptionPlan, SubscriptionCheckoutCopy, SubscriptionCheckoutProps, SubscriptionOrder }
