'use client'

import { useId, type ComponentProps, type ElementType, type MouseEvent, type MouseEventHandler } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter, Reveal } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { ShimmerBorder } from '@youj/motion/interactions'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'

/* Pricing: a monthly / yearly segmented toggle whose indicator slides between
 * the two, three plans whose prices roll digit by digit to the new period's
 * figure (on yearly, the monthly price stands struck through beside it, so
 * the toggle shows what it saves), the recommended plan lifted and carrying
 * a traveling border light, and a feature comparison table under them whose
 * recommended column carries its marks filled (never a tinted band, which
 * turns to a grey stripe in a monochrome theme). Reduced motion: the prices
 * swap, the indicator jumps, the light stays still.
 *
 * Pass your own `plans`, `comparison`, `currency` and `locale`, handle a pick
 * with `onSelectPlan` and set `linkComponent` for your router; every string
 * is in `copy`. */

type PricingPeriod = 'monthly' | 'yearly'
type LinkComponent = ElementType

/** A call to action link. */
interface PricingCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A plan card. */
interface PricingPlan {
  id: string
  name: string
  /** One line under the name. */
  blurb: string
  /** The price per seat and month, when billed monthly or yearly. */
  price: Record<PricingPeriod, number>
  /** The plan's call to action; leave it out for none. */
  cta?: PricingCta
  /** Lifted, with a traveling border light and the "Most popular" badge. */
  featured?: boolean
  features: string[]
}

/** A comparison cell: included (`true`), not included (`false`), or a value. */
type PricingCell = boolean | string

/** A titled group of comparison rows; each row holds one value per plan, in plan order. */
interface PricingComparisonGroup {
  group: string
  rows: { feature: string; values: PricingCell[] }[]
}

const PLANS: PricingPlan[] = [
  {
    id: 'hobby',
    name: 'Hobby',
    blurb: 'For personal projects and experiments.',
    price: { monthly: 0, yearly: 0 },
    cta: { label: 'Start free', href: '#signup-hobby' },
    features: ['Unlimited previews', '100 GB bandwidth', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For teams shipping every day.',
    price: { monthly: 24, yearly: 19 },
    cta: { label: 'Start a free trial', href: '#signup-pro' },
    featured: true,
    features: ['Everything in Hobby', '1 TB bandwidth', 'Instant rollback', 'Preview comments', 'Email support'],
  },
  {
    id: 'scale',
    name: 'Scale',
    blurb: 'For products with serious traffic.',
    price: { monthly: 96, yearly: 79 },
    cta: { label: 'Talk to sales', href: '#signup-scale' },
    features: ['Everything in Pro', '5 TB bandwidth', 'SSO and audit logs', '99.99% uptime SLA', 'A named engineer'],
  },
]

const COMPARISON: PricingComparisonGroup[] = [
  {
    group: 'Deploys',
    rows: [
      { feature: 'Preview deployments', values: [true, true, true] },
      { feature: 'Concurrent builds', values: ['1', '4', '12'] },
      { feature: 'Instant rollback', values: [false, true, true] },
    ],
  },
  {
    group: 'Collaboration',
    rows: [
      { feature: 'Team members', values: ['1', 'Up to 20', 'Unlimited'] },
      { feature: 'Preview comments', values: [false, true, true] },
      { feature: 'SSO (SAML)', values: [false, false, true] },
    ],
  },
  {
    group: 'Support',
    rows: [
      { feature: 'Uptime SLA', values: [false, '99.9%', '99.99%'] },
      { feature: 'Support', values: ['Community', 'Email', 'Named engineer'] },
    ],
  },
]

const DEFAULT_COPY = {
  eyebrow: 'Pricing',
  title: 'Start free. Pay when it works.',
  description: 'Per seat, with usage included. No surprise invoices: we email before you reach a limit.',
  periodLabel: 'Billing period',
  monthly: 'Monthly',
  yearly: 'Yearly',
  /** Empty hides the badge. */
  saveBadge: 'Save 20% yearly',
  mostPopular: 'Most popular',
  perUnit: 'per seat / month',
  free: 'Free forever',
  billedMonthly: 'Billed monthly',
  billedYearly: (total: string) => `Billed ${total} yearly`,
  /** Read after the yearly price, where the monthly one is struck through: "$24 billed monthly". */
  monthlyPrice: (price: string) => `${price} billed monthly`,
  compareTitle: 'Compare plans',
  featureColumn: 'Feature',
  included: (plan: string) => `Included in ${plan}`,
  notIncluded: (plan: string) => `Not included in ${plan}`,
}

type PricingCopy = typeof DEFAULT_COPY
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

/** A cell's mark: in the featured plan's column, the check is filled and a value is set in full weight. */
function Value({ value, plan, featured, copy }: { value: PricingCell | undefined; plan: string; featured: boolean; copy: PricingCopy }) {
  if (value === true)
    return featured ? (
      <span className="inline-grid size-5 place-items-center rounded-full bg-accent text-on-accent">
        <CheckIcon size={12} strokeWidth={3} aria-label={copy.included(plan)} />
      </span>
    ) : (
      <span className="inline-flex text-fg">
        <CheckIcon size={16} strokeWidth={2.25} aria-label={copy.included(plan)} />
      </span>
    )
  if (value === false || value === undefined)
    return (
      <span className="text-fg-muted">
        <span aria-hidden>–</span>
        <span className="sr-only">{copy.notIncluded(plan)}</span>
      </span>
    )
  return <span className={featured ? 'font-medium text-fg' : 'text-fg'}>{value}</span>
}

interface PlanCardProps {
  /** Prefixes the plan's heading id, unique per block. */
  idBase: string
  plan: PricingPlan
  period: PricingPeriod
  copy: PricingCopy
  locale: string
  currency: string
  Link: LinkComponent
  Heading: HeadingTag
  onSelectPlan?: (plan: PricingPlan, period: PricingPeriod) => void
}

function PlanCard({ idBase, plan, period, copy, locale, currency, Link, Heading, onSelectPlan }: PlanCardProps) {
  const price = plan.price[period]
  const format: Intl.NumberFormatOptions = { style: 'currency', currency, maximumFractionDigits: 0 }
  const cta = plan.cta
  const headingId = `${idBase}-${plan.id}`
  // On yearly, the monthly price stands struck through beside the yearly one: what the toggle saves.
  const was = period === 'yearly' && plan.price.monthly > price ? numberFormat(locale, format).format(plan.price.monthly) : null
  const body = (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Heading id={headingId} className="text-ui-lg font-semibold text-fg">
            {plan.name}
          </Heading>
          {plan.featured && <Badge variant="solid">{copy.mostPopular}</Badge>}
        </div>
        <p className="text-ui text-fg-muted">{plan.blurb}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={price} mode="roll" format={format} locale={locale} inView={false} />
          </span>
          {was && (
            <Reveal as="span" key={period} variant="fade" inView={false} duration="fast" className="text-ui-lg text-fg-subtle tabular-nums">
              <s aria-hidden>{was}</s>
              <span className="sr-only">{copy.monthlyPrice(was)}</span>
            </Reveal>
          )}
          <span className="text-ui text-fg-muted">{copy.perUnit}</span>
        </p>
        <p className="text-ui-sm text-fg-muted">
          {price === 0
            ? copy.free
            : period === 'yearly'
              ? copy.billedYearly(numberFormat(locale, format).format(price * 12))
              : copy.billedMonthly}
        </p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          aria-describedby={headingId}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            cta.onClick?.(event)
            onSelectPlan?.(plan, period)
          }}
          className={buttonVariants({ variant: plan.featured ? 'default' : 'outline', size: 'lg', className: 'w-full' })}
        >
          {cta.label}
        </Link>
      )}
      <ul className="flex flex-col gap-2.5 border-t border-line pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-ui text-fg">
            <CheckIcon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
  return plan.featured ? (
    <ShimmerBorder idle="visible" className="bg-surface shadow-xl shadow-accent/10 lg:-my-3 lg:py-3">
      {body}
    </ShimmerBorder>
  ) : (
    <div className="rounded-xl border border-line bg-surface">{body}</div>
  )
}

interface PricingProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The billing period shown first, when uncontrolled. Default `yearly`. */
  defaultPeriod?: PricingPeriod
  /** The billing period shown, to control it. */
  period?: PricingPeriod
  /** Called when the visitor switches the billing period. */
  onPeriodChange?: (period: PricingPeriod) => void
  /** The plan cards, in order. Default: the demo's Hobby, Pro and Scale. */
  plans?: PricingPlan[]
  /** The comparison table's groups, one value per plan in each row. An empty array hides the table. Default: the demo's three groups. */
  comparison?: PricingComparisonGroup[]
  /** Called when a plan's call to action is chosen, with the period shown. */
  onSelectPlan?: (plan: PricingPlan, period: PricingPeriod) => void
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PricingCopy>
  /** The currency prices are in (ISO 4217). Default `USD`. */
  currency?: string
  /** The locale prices are formatted for (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The section heading's level; plan names and the comparison title sit one below. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function Pricing({
  theme,
  embedded = false,
  defaultPeriod = 'yearly',
  period: periodProp,
  onPeriodChange,
  plans = PLANS,
  comparison = COMPARISON,
  onSelectPlan,
  copy: copyProp,
  currency = 'USD',
  locale: localeProp,
  headingLevel = 2,
  linkComponent = 'a',
  className,
  ...rest
}: PricingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const [period, setPeriod] = useControllableState(periodProp, defaultPeriod)
  const Title = `h${headingLevel}` as HeadingTag
  const Sub = `h${headingLevel + 1}` as HeadingTag
  const titleId = useId()
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn(!embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <div className="flex items-center gap-3">
            <ToggleGroup
              variant="segmented"
              value={[period]}
              onValueChange={(value) => {
                const next = value[0] as PricingPeriod | undefined
                if (!next) return
                setPeriod(next)
                onPeriodChange?.(next)
              }}
              aria-label={copy.periodLabel}
            >
              <ToggleGroupItem value="monthly">{copy.monthly}</ToggleGroupItem>
              <ToggleGroupItem value="yearly">{copy.yearly}</ToggleGroupItem>
            </ToggleGroup>
            {copy.saveBadge && <Badge variant="success">{copy.saveBadge}</Badge>}
          </div>
        </Reveal>
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} idBase={titleId} plan={plan} period={period} copy={copy} locale={locale} currency={currency} Link={linkComponent} Heading={Sub} onSelectPlan={onSelectPlan} />
          ))}
        </div>
        {comparison.length > 0 && (
          <div className="flex flex-col gap-4">
            <Sub className="text-ui-lg font-semibold text-fg">{copy.compareTitle}</Sub>
            <div className="overflow-x-auto rounded-xl border border-line">
              <Table className="min-w-[32rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky start-0 z-10 w-2/5 max-md:bg-canvas max-sm:w-36">{copy.featureColumn}</TableHead>
                    {plans.map((plan) => (
                      <TableHead key={plan.id} className={cn(plan.featured && 'text-accent')}>
                        {plan.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                {comparison.map((section) => (
                  <TableBody key={section.group}>
                    <TableRow className="hover:bg-transparent">
                      <TableHead scope="rowgroup" colSpan={plans.length + 1} className="bg-transparent text-ui-sm font-medium text-fg-muted">
                        {section.group}
                      </TableHead>
                    </TableRow>
                    {section.rows.map((row) => (
                      <TableRow key={row.feature}>
                        <TableHead scope="row" className="sticky start-0 z-10 font-normal max-md:bg-canvas whitespace-normal text-fg [tbody>tr:last-child>&]:border-b-0">
                          {row.feature}
                        </TableHead>
                        {plans.map((plan, i) => (
                          <TableCell key={plan.id}>
                            <Value value={row.values[i]} plan={plan.name} featured={!!plan.featured} copy={copy} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                ))}
              </Table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Pricing }
export type { PricingProps, PricingCopy, PricingPlan, PricingCta, PricingPeriod, PricingCell, PricingComparisonGroup }
