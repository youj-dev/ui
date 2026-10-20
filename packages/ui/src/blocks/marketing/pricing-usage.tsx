'use client'

import { useEffect, useId, useState, type ComponentProps, type ElementType, type MouseEvent } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter, MorphLabel, Reveal } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { Slider } from '../../components/ui/slider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  estimate,
  METERS,
  money,
  over,
  PLANS,
  USAGE,
  type PricingUsageCopy,
  type PricingUsageCta,
  type PricingUsageMeter,
  type PricingUsagePlan,
  type PricingUsagePlans,
  type PricingUsageValues,
} from './pricing-usage/data'

/* Usage pricing as an estimator: three meters on linear, readable scales
 * (requests, bandwidth, build minutes), each with Pro's allowance notched
 * under its track. Beside them a receipt recomputes as you drag: every line
 * and the monthly total roll to their new figures (Counter), and the plan it
 * lands on crossfades (MorphLabel) from Hobby to Pro to Scale, taking the
 * call to action with it. The total is announced politely once dragging
 * settles. Reduced motion: figures and labels change in place.
 *
 * Pass your own `meters`, `plans`, `basePrice` and `committedFrom`, control
 * the `usage` if you like, and take the pick with `onSelectPlan`; every
 * string is in `copy`. */

type LinkComponent = ElementType
type HeadingLevel = 1 | 2 | 3

interface PricingUsageProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, no section padding or max width). Default false. */
  embedded?: boolean
  /** Where the meters start, when uncontrolled. Default: a busy Pro team (18M requests, 1.6 TB, 9,000 minutes). */
  defaultUsage?: PricingUsageValues
  /** Each meter's value, to control them. */
  usage?: PricingUsageValues
  /** Called with every meter's value when one moves. */
  onUsageChange?: (usage: PricingUsageValues) => void
  /** The meters, in order. Default: the demo's requests, bandwidth and build minutes. */
  meters?: PricingUsageMeter[]
  /** The free, base and committed plans the estimate moves between. Default: Hobby, Pro and Scale. */
  plans?: PricingUsagePlans
  /** The base plan's price for one seat, before overage. Default 24. */
  basePrice?: number
  /** The monthly total from which the estimate points at the committed plan. Default 400. */
  committedFrom?: number
  /** Called when the receipt's call to action is followed, with the plan, the usage and the monthly total. */
  onSelectPlan?: (plan: PricingUsagePlan, usage: PricingUsageValues, total: number) => void
  /** ISO 4217 currency of every price. Default `USD`. */
  currency?: string
  /** BCP 47 locale for every figure. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PricingUsageCopy>
  /** The component for every link, e.g. Next.js `Link`; it gets `href`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** The section heading's level. Default 2. */
  headingLevel?: HeadingLevel
  /** Classes for the root section. */
  className?: string
}

interface MeterRowProps {
  meter: PricingUsageMeter
  value: number
  basePlan: string
  copy: PricingUsageCopy
  locale: string
  onChange: (value: number) => void
}

function MeterRow({ meter, value, basePlan, copy, locale, onChange }: MeterRowProps) {
  const notch = ((meter.included - meter.min) / (meter.max - meter.min)) * 100
  const steps = over(meter, value)
  const fill = ((value - meter.min) / (meter.max - meter.min)) * 100
  return (
    <div className="flex flex-col gap-3 border-b border-line py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-ui font-medium text-fg">{meter.label}</p>
          <p className="text-ui-sm text-fg-muted">{copy.rate(meter.rate, basePlan)}</p>
        </div>
        <p aria-hidden className="shrink-0 font-mono text-2xl font-medium tracking-tight text-fg tabular-nums">
          {meter.show(value, locale)}
          <span className="ms-1.5 font-sans text-ui font-normal tracking-normal text-fg-muted">{meter.unit}</span>
        </p>
      </div>
      <Slider
        aria-label={`${meter.label} ${meter.unit}`}
        value={value}
        min={meter.min}
        max={meter.max}
        step={meter.step}
        largeStep={meter.step * 10}
        format={meter.format}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0]! : next)}
      />
      {/* The rule under the rail: a tick every 5%, a longer one every 25%, lit up to the value; the base allowance is the tall notch. */}
      <div aria-hidden className="relative -mt-1 h-8 font-mono text-ui-xs text-fg-muted tabular-nums">
        {Array.from({ length: 21 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'absolute top-0 w-px transition-colors yj-duration-fast ease-standard',
              i % 5 === 0 ? 'h-2' : 'h-1',
              i * 5 <= fill ? 'bg-line-strong' : 'bg-well',
            )}
            style={{ insetInlineStart: `${i * 5}%` }}
          />
        ))}
        <span className="absolute top-0 flex items-start gap-1.5" style={{ insetInlineStart: `${notch}%` }}>
          <span className={cn('h-3.5 w-px bg-fg-subtle transition-colors yj-duration-fast ease-standard', steps > 0 && 'bg-accent')} />
          <span className="pt-2.5">{copy.allowance(basePlan, meter.show(meter.included, locale))}</span>
        </span>
        <span className="absolute end-0 top-0 pt-3.5">{meter.show(meter.max, locale)}</span>
      </div>
    </div>
  )
}

interface ReceiptProps {
  usage: PricingUsageValues
  meters: PricingUsageMeter[]
  plans: PricingUsagePlans
  basePrice: number
  committedFrom: number
  currency: string
  locale: string
  copy: PricingUsageCopy
  Link: LinkComponent
  onSelectPlan?: PricingUsageProps['onSelectPlan']
}

function Receipt({ usage, meters, plans, basePrice, committedFrom, currency, locale, copy, Link, onSelectPlan }: ReceiptProps) {
  const { lines, total, tier, plan } = estimate(meters, usage, plans, basePrice, committedFrom)
  const free = tier === 'free'
  const format = money(locale, currency)
  const counter = { mode: 'roll', format: { style: 'currency', currency, maximumFractionDigits: 0 }, locale, inView: false } as const
  const [spoken, setSpoken] = useState('')
  const announcement = copy.announce(format.format(total), plan.name)
  useEffect(() => {
    // Announce the settled estimate, not every step of a drag.
    const timer = setTimeout(() => setSpoken(announcement), 700)
    return () => clearTimeout(timer)
  }, [announcement])
  const cta: PricingUsageCta | undefined = plan.cta
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface text-fg shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-line px-5 py-4">
        <p className="text-ui font-medium text-fg">{copy.estimateTitle}</p>
        <Badge variant={free ? 'success' : 'default'} className="overflow-hidden">
          <MorphLabel value={plan.id}>{copy.fits(plan.name)}</MorphLabel>
        </Badge>
      </div>
      <dl className="flex flex-col gap-3 px-5 py-4 text-ui">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{free ? copy.freeLine(plans.free.name) : copy.baseLine(plans.base.name)}</dt>
          <dd className="text-fg tabular-nums">
            <Counter value={free ? 0 : basePrice} {...counter} duration="base" />
          </dd>
        </div>
        {lines.map(({ meter, steps, cost }) => (
          <div key={meter.id} className="flex items-baseline justify-between gap-4">
            <dt className="flex min-w-0 flex-col">
              <span className="text-fg-muted">{meter.label}</span>
              <span className="text-ui-sm text-fg-muted">{free ? copy.withinFree : steps > 0 ? copy.over(meter.show(steps * meter.step, locale)) : copy.included}</span>
            </dt>
            <dd className={cn('tabular-nums', cost > 0 ? 'text-fg' : 'text-fg-muted')}>
              <Counter value={cost} {...counter} duration="base" />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-4 border-t border-dashed border-line px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <p className="text-ui text-fg-muted">{copy.total}</p>
          <p className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={total} {...counter} />
          </p>
        </div>
        <p className="min-h-10 text-ui-sm text-pretty text-fg-muted">{plan.note}</p>
        {cta && (
          <Link
            href={cta.href}
            data-yj-trigger=""
            className={buttonVariants({ size: 'lg', className: 'w-full overflow-hidden' })}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              cta.onClick?.(event)
              onSelectPlan?.(plan, usage, total)
            }}
          >
            <MorphLabel value={plan.id} contentClassName="inline-flex items-center gap-2 whitespace-nowrap">
              {cta.label}
              <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </MorphLabel>
          </Link>
        )}
      </div>
      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  )
}

function PricingUsage({
  theme,
  embedded = false,
  defaultUsage = USAGE,
  usage: usageProp,
  onUsageChange,
  meters = METERS,
  plans = PLANS,
  basePrice = 24,
  committedFrom = 400,
  onSelectPlan,
  currency = 'USD',
  locale: localeProp,
  copy: copyProp,
  linkComponent = 'a',
  headingLevel = 2,
  className,
  ...rest
}: PricingUsageProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const [usage, setUsage] = useControllableState(usageProp, defaultUsage)
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Heading>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description(plans.base.name, money(locale, currency).format(basePrice))}</p>
        </Reveal>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <Reveal className="flex flex-col" delay={1}>
            {meters.map((meter) => (
              <MeterRow
                key={meter.id}
                meter={meter}
                value={usage[meter.id] ?? meter.min}
                basePlan={plans.base.name}
                copy={copy}
                locale={locale}
                onChange={(value) => {
                  const next = { ...usage, [meter.id]: value }
                  setUsage(next)
                  onUsageChange?.(next)
                }}
              />
            ))}
          </Reveal>
          <Reveal delay={2}>
            <Receipt
              usage={usage}
              meters={meters}
              plans={plans}
              basePrice={basePrice}
              committedFrom={committedFrom}
              currency={currency}
              locale={locale}
              copy={copy}
              Link={linkComponent}
              onSelectPlan={onSelectPlan}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PricingUsage }
export type {
  PricingUsageProps,
  PricingUsageCopy,
  PricingUsageCta,
  PricingUsageMeter,
  PricingUsagePlan,
  PricingUsagePlans,
  PricingUsageValues,
}
