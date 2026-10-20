'use client'

import { useId, type ComponentProps, type ElementType, type MouseEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Collapse, Counter, MorphLabel, Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { Field, FieldDescription, FieldLabel } from '../../components/ui/field'
import { NumberInput } from '../../components/ui/number-input'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, money, PLANS, type PricingPickerCopy, type PricingPickerCta, type PricingPickerPeriod, type PricingPickerPlan } from './pricing-picker/data'

/* Choosing a plan the way a checkout does: the plans are radio cards (one
 * tab stop, arrow keys move between them), and the chosen one opens to show
 * what it includes (Collapse) as the last one closes. The billing period
 * sits over them, and the order summary holds the seats (where a checkout
 * keeps its quantity) and keeps the arithmetic honest: seats × the list
 * price, what yearly billing takes off (or would), and the total, each
 * rolling to its new figure (Counter), with the call to action crossfading
 * to the plan's name (MorphLabel). On wide screens the summary
 * stays in view while you choose; on phones it follows the picker.
 * Reduced motion: cards open in place and figures swap.
 *
 * Pass your own `plans` (each with its checkout `cta`), control the plan,
 * seats and period if you like, and take the order with `onSelectPlan`;
 * every string is in `copy`. */

type LinkComponent = ElementType
type HeadingLevel = 1 | 2 | 3

interface PricingPickerProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, no section padding or max width). Default false. */
  embedded?: boolean
  /** The plan chosen at first, when uncontrolled. Default `pro`. */
  defaultPlan?: string
  /** The chosen plan's id, to control it. */
  plan?: string
  /** Called when the visitor picks another plan. */
  onPlanChange?: (plan: string) => void
  /** Seats at first, when uncontrolled. Default 8. */
  defaultSeats?: number
  /** The seats, to control them. */
  seats?: number
  /** Called when the visitor changes the seats. */
  onSeatsChange?: (seats: number) => void
  /** The most seats the field allows. Default 500. */
  maxSeats?: number
  /** The billing period at first, when uncontrolled. Default yearly. */
  defaultPeriod?: PricingPickerPeriod
  /** The billing period, to control it. */
  period?: PricingPickerPeriod
  /** Called when the visitor switches the billing period. */
  onPeriodChange?: (period: PricingPickerPeriod) => void
  /** The plans, in order. Default: the demo's Hobby, Pro and Scale. */
  plans?: PricingPickerPlan[]
  /** Called when the summary's call to action is followed, with the plan, period and seats. */
  onSelectPlan?: (plan: PricingPickerPlan, period: PricingPickerPeriod, seats: number) => void
  /** The product the order summary names. Default: `{ name: 'Northwind' }`. */
  brand?: { name: string }
  /** ISO 4217 currency of every price. Default `USD`. */
  currency?: string
  /** BCP 47 locale for every figure. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PricingPickerCopy>
  /** The component for every link, e.g. Next.js `Link`; it gets `href`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** The section heading's level; the summary's heading sits one below it. Default 2. */
  headingLevel?: HeadingLevel
  /** Classes for the root section. */
  className?: string
}

interface Formatting {
  copy: PricingPickerCopy
  locale: string
  currency: string
}

function PlanCard({ plan, period, selected, fmt }: { plan: PricingPickerPlan; period: PricingPickerPeriod; selected: boolean; fmt: Formatting }) {
  const id = useId()
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface text-fg transition-[border-color,box-shadow] yj-duration-fast ease-standard',
        'hover:border-line-control has-data-checked:border-accent has-data-checked:shadow-sm has-data-checked:ring-1 has-data-checked:ring-accent',
      )}
    >
      <label className="flex cursor-pointer items-start gap-4 p-4 sm:p-5">
        <RadioGroupItem value={plan.id} aria-labelledby={`${id}-name`} aria-describedby={`${id}-blurb`} className="mt-1" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span id={`${id}-name`} className="text-ui-lg font-semibold text-fg">
              {plan.name}
            </span>
            {plan.badge && <Badge variant="default">{plan.badge}</Badge>}
          </span>
          <span id={`${id}-blurb`} className="text-ui text-pretty text-fg-muted">
            {plan.blurb}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-ui-lg font-semibold text-fg tabular-nums">
            <Counter
              value={plan.price[period]}
              mode="roll"
              format={{ style: 'currency', currency: fmt.currency, maximumFractionDigits: 0 }}
              locale={fmt.locale}
              inView={false}
              duration="base"
            />
          </span>
          <span className="text-ui-sm text-fg-muted">{fmt.copy.perUnit}</span>
        </span>
      </label>
      <Collapse open={selected}>
        <ul aria-label={fmt.copy.includes(plan.name)} className="grid gap-x-6 gap-y-2 border-t border-dashed border-line px-4 py-4 sm:grid-cols-2 sm:px-5 sm:ps-13">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-ui text-fg">
              <CheckIcon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" />
              {feature}
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  )
}

interface SummaryProps {
  plan: PricingPickerPlan
  seats: number
  period: PricingPickerPeriod
  fmt: Formatting
  brand: string
  Link: LinkComponent
  Heading: 'h2' | 'h3' | 'h4'
  onSelectPlan?: PricingPickerProps['onSelectPlan']
  /** The seats field, at the head of the order. */
  seatsField: ReactNode
}

function Summary({ plan, seats, period, fmt, brand, Link, Heading, onSelectPlan, seatsField }: SummaryProps) {
  const { copy } = fmt
  const format = money(fmt.locale, fmt.currency)
  const counter = { mode: 'roll', format: { style: 'currency', currency: fmt.currency, maximumFractionDigits: 0 }, locale: fmt.locale, inView: false } as const
  const list = plan.price.monthly * seats
  const saving = (plan.price.monthly - plan.price.yearly) * seats
  const total = plan.price[period] * seats
  const yearly = period === 'yearly'
  const cta: PricingPickerCta | undefined = plan.cta
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface text-fg shadow-sm lg:sticky lg:top-6">
      <div className="flex flex-col gap-0.5 border-b border-line px-5 py-4">
        <Heading className="text-ui font-medium text-fg-muted">{copy.summaryTitle}</Heading>
        <p className="overflow-hidden text-ui-lg font-semibold text-fg">
          <MorphLabel value={plan.id}>{copy.product(brand, plan.name)}</MorphLabel>
        </p>
      </div>
      <div className="border-b border-line px-5 py-4">{seatsField}</div>
      <dl className="flex flex-col gap-3 px-5 py-4 text-ui">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{copy.seatLine(seats, format.format(plan.price.monthly))}</dt>
          <dd className="text-fg tabular-nums">
            <Counter value={list} {...counter} duration="base" />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="flex flex-col">
            <span className="text-fg-muted">{copy.yearlyBilling}</span>
            {/* Its line is kept, hidden, when there's nothing to say: switching periods or plans never resizes the section. */}
            <span className={cn('text-ui-sm text-success-text', (yearly || saving <= 0) && 'invisible')}>{copy.switchToSave(format.format(saving))}</span>
          </dt>
          <dd className={cn('tabular-nums', yearly && saving > 0 ? 'text-success-text' : 'text-fg-muted')}>
            <span aria-hidden>−</span>
            <span className="sr-only">{copy.minus}</span>
            <Counter value={yearly ? saving : 0} {...counter} duration="base" />
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 border-t border-line px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <p className="text-ui text-fg-muted">{copy.totalLabel}</p>
          <p className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={total} {...counter} />
          </p>
        </div>
        <p className="text-ui-sm text-fg-muted">{total === 0 ? copy.free : yearly ? copy.billedYearly(format.format(total * 12)) : copy.billedMonthly}</p>
        {cta && (
          <Link
            href={cta.href}
            data-yj-trigger=""
            className={buttonVariants({ size: 'lg', className: 'w-full overflow-hidden' })}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              cta.onClick?.(event)
              onSelectPlan?.(plan, period, seats)
            }}
          >
            <MorphLabel value={plan.id} contentClassName="inline-flex items-center gap-2 whitespace-nowrap">
              {cta.label}
              <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </MorphLabel>
          </Link>
        )}
        {copy.trialNote && <p className="text-center text-ui-sm text-fg-muted">{copy.trialNote}</p>}
      </div>
    </div>
  )
}

function PricingPicker({
  theme,
  embedded = false,
  defaultPlan = 'pro',
  plan: planProp,
  onPlanChange,
  defaultSeats = 8,
  seats: seatsProp,
  onSeatsChange,
  maxSeats = 500,
  defaultPeriod = 'yearly',
  period: periodProp,
  onPeriodChange,
  plans = PLANS,
  onSelectPlan,
  brand = { name: 'Northwind' },
  currency = 'USD',
  locale: localeProp,
  copy: copyProp,
  linkComponent = 'a',
  headingLevel = 2,
  className,
  ...rest
}: PricingPickerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const fmt = { copy, locale: useLocale(localeProp), currency }
  const titleId = useId()
  const [planId, setPlanId] = useControllableState(planProp, defaultPlan)
  const [seats, setSeats] = useControllableState(seatsProp, defaultSeats)
  const [period, setPeriod] = useControllableState(periodProp, defaultPeriod)
  const plan = plans.find((p) => p.id === planId) ?? plans[0]!
  const solo = !!plan.singleSeat
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Heading>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <Reveal delay={1} className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SegmentedControl
                  value={period}
                  onValueChange={(value) => {
                    setPeriod(value as PricingPickerPeriod)
                    onPeriodChange?.(value as PricingPickerPeriod)
                  }}
                  aria-label={copy.periodLabel}
                >
                  <SegmentedControlItem value="monthly">{copy.monthly}</SegmentedControlItem>
                  <SegmentedControlItem value="yearly">{copy.yearly}</SegmentedControlItem>
                </SegmentedControl>
                {copy.saveBadge && <Badge variant="success">{copy.saveBadge}</Badge>}
              </div>
            </div>
            <RadioGroup
              aria-label={copy.planLabel}
              value={plan.id}
              onValueChange={(value) => {
                setPlanId(value as string)
                onPlanChange?.(value as string)
              }}
              className="gap-3"
            >
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} period={period} selected={p.id === plan.id} fmt={fmt} />
              ))}
            </RadioGroup>
          </Reveal>
          <Reveal delay={2}>
            <Summary
              plan={plan}
              seats={solo ? 1 : seats}
              period={period}
              fmt={fmt}
              brand={brand.name}
              Link={linkComponent}
              Heading={`h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'}
              onSelectPlan={onSelectPlan}
              seatsField={
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <FieldLabel>{copy.seatsLabel}</FieldLabel>
                    <NumberInput
                      value={solo ? 1 : seats}
                      onValueChange={(value) => {
                        const next = Math.max(1, value ?? 1)
                        setSeats(next)
                        onSeatsChange?.(next)
                      }}
                      min={1}
                      max={maxSeats}
                      disabled={solo}
                      className="w-32"
                    />
                  </div>
                  <FieldDescription>{solo ? copy.singleSeatHint(plan.name) : copy.seatsHint}</FieldDescription>
                </Field>
              }
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PricingPicker }
export type { PricingPickerProps, PricingPickerCopy, PricingPickerCta, PricingPickerPlan, PricingPickerPeriod }
