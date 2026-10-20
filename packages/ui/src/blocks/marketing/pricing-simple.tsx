'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ComponentType, type ElementType, type MouseEventHandler, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Counter, Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, RotateCcwIcon, ShieldCheckIcon, UsersIcon } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* One plan, said plainly. A single panel: on its inline start the price,
 * which rolls digit by digit to the new figure when the currency changes,
 * the one call to action and three reassurances; on its end everything the
 * plan includes, two columns of features that tick off one after another,
 * each check drawing itself as it lands, the first time the list scrolls
 * into view. Two questions people actually ask close it. Reduced motion:
 * the price swaps, and every check is already drawn.
 *
 * Pass your own `prices`, `features`, `reassurances`, `questions` and `cta`;
 * every string is in `copy`. */

type LinkComponent = ElementType
type HeadingLevel = 1 | 2 | 3

/** A call to action: always a link, rendered with `linkComponent`. */
interface PricingSimpleCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A reassurance under the call to action. */
interface PricingSimpleReassurance {
  icon?: ComponentType<{ size?: number; className?: string }>
  text: string
}

/** A question and its answer, closing the panel. */
interface PricingSimpleQuestion {
  question: string
  answer: ReactNode
}

const PRICES: Record<string, number> = { USD: 19, EUR: 18, GBP: 15 }

const FEATURES = [
  'Unlimited projects and previews',
  'Instant rollback to any deploy',
  'Edge network in 38 regions',
  '1 TB bandwidth per seat',
  'Preview comments and reviews',
  'Analytics without cookies',
  'SSO with SAML and SCIM',
  'Audit logs, kept for a year',
  'Encrypted secrets per environment',
  'Firewall and DDoS protection',
  '99.99% uptime SLA',
  'Support that answers in hours',
]

const REASSURANCES: PricingSimpleReassurance[] = [
  { icon: RotateCcwIcon, text: 'Full refund within 30 days, no questions asked.' },
  { icon: UsersIcon, text: 'Viewers and commenters are always free.' },
  { icon: ShieldCheckIcon, text: 'Cancel anytime. Your data stays exportable for 90 days.' },
]

/** The demo's two questions; the second links through `linkComponent`. */
const demoQuestions = (Link: LinkComponent): PricingSimpleQuestion[] => [
  { question: 'What counts as a seat?', answer: 'Anyone who can deploy. Reviewers who only comment on previews never count.' },
  {
    question: 'More than 50 seats?',
    answer: (
      <>
        Volume pricing starts on its own at seat 51.{' '}
        <Link href="#sales" className="rounded-sm font-medium text-fg underline decoration-line underline-offset-4 focus-ring hover:decoration-fg">
          Talk to us
        </Link>{' '}
        for a quote.
      </>
    ),
  },
]

const CTA: PricingSimpleCta = { label: 'Start a 14-day trial', href: '#trial' }

const DEFAULT_COPY = {
  eyebrow: 'Pricing',
  title: 'One plan. Everything in it.',
  description: 'No tiers to compare and nothing held back for an upsell. Choose how many people deploy, and ship.',
  currencyLabel: 'Currency',
  perUnit: 'per seat a month',
  billing: 'Billed yearly. Taxes calculated at checkout.',
  /** Under the call to action; empty hides it. */
  ctaNote: 'No card needed to start.',
  includedTitle: 'Everything’s included',
  includedDescription: 'No add-ons, no feature gates, and no “contact us” for SSO.',
}

type PricingSimpleCopy = typeof DEFAULT_COPY

const noSubscribe = () => () => {}

/** True once the element has scrolled into view (at once where IntersectionObserver is missing). */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null)
  const [observed, setSeen] = useState(false)
  const unsupported = useSyncExternalStore(noSubscribe, () => typeof IntersectionObserver === 'undefined', () => false)
  const seen = observed || unsupported
  useEffect(() => {
    const el = ref.current
    if (!el || unsupported) return
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [unsupported])
  return [ref, seen] as const
}

function Included({ features }: { features: string[] }) {
  const k = useYouj()
  const [ref, seen] = useSeen<HTMLUListElement>()
  const [ticked, setTicked] = useState(0)
  useEffect(() => {
    if (!seen || k.reduced) return
    // One feature at a time, on the loose stagger step: a list being checked off.
    const id = setInterval(() => setTicked((n) => Math.min(n + 1, features.length)), k.stagger('loose') * 1000)
    return () => clearInterval(id)
  }, [seen, k, features.length])
  const shown = k.reduced ? features.length : ticked
  return (
    <ul ref={ref} className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {features.map((feature, i) => (
        <li key={feature} className="flex items-start gap-3 text-ui">
          <span aria-hidden className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-accent-subtle text-accent">
            {i < shown ? <CheckIcon key="ticked" trigger={k.reduced ? 'none' : 'mount'} size={12} strokeWidth={2.5} /> : null}
          </span>
          <span className={cn('transition-colors yj-duration-base ease-standard', i < shown ? 'text-fg' : 'text-fg-muted')}>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

interface PricingSimpleProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, no section padding or max width). Default false. */
  embedded?: boolean
  /** The currency shown first, when uncontrolled. Default USD. */
  defaultCurrency?: string
  /** The currency shown, to control it. */
  currency?: string
  /** Called when the visitor picks another currency. */
  onCurrencyChange?: (currency: string) => void
  /** The price per seat and month in each currency (ISO 4217 keys), in the control's order. Default: `{ USD: 19, EUR: 18, GBP: 15 }`. */
  prices?: Record<string, number>
  /** What the plan includes, ticked off in two columns. Default: the demo's twelve. */
  features?: string[]
  /** The reassurances under the call to action. Default: the demo's three. */
  reassurances?: PricingSimpleReassurance[]
  /** The questions closing the panel; an empty array hides them. Default: the demo's two. */
  questions?: PricingSimpleQuestion[]
  /** The one call to action. Default: "Start a 14-day trial" to `#trial`. */
  cta?: PricingSimpleCta
  /** The product named on the price panel. Default: `{ name: 'Northwind' }`. */
  brand?: { name: string; logo?: ReactNode }
  /** BCP 47 locale for the price. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PricingSimpleCopy>
  /** The component for every link, e.g. Next.js `Link`; it gets `href`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** The section heading's level; the panel's heading sits one below it. Default 2. */
  headingLevel?: HeadingLevel
  /** Classes for the root section. */
  className?: string
}

function PricingSimple({
  theme,
  embedded = false,
  defaultCurrency = 'USD',
  currency: currencyProp,
  onCurrencyChange,
  prices = PRICES,
  features = FEATURES,
  reassurances = REASSURANCES,
  questions,
  cta = CTA,
  brand = { name: 'Northwind' },
  locale: localeProp,
  copy: copyProp,
  linkComponent: Link = 'a',
  headingLevel = 2,
  className,
  ...rest
}: PricingSimpleProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const [currency, setCurrency] = useControllableState(currencyProp, defaultCurrency)
  const currencies = Object.keys(prices)
  const price = prices[currency] ?? 0
  const faq = questions ?? demoQuestions(Link)
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Subheading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-5xl')}>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Heading>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        <Reveal delay={1} className="grid overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-sm md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-7 border-b border-line bg-transparent p-6 sm:p-8 md:border-e md:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-ui-lg font-semibold text-fg">
                {brand.logo}
                {brand.name}
              </p>
              {currencies.length > 1 && (
                <SegmentedControl
                  value={currency}
                  onValueChange={(value) => {
                    setCurrency(value as string)
                    onCurrencyChange?.(value as string)
                  }}
                  aria-label={copy.currencyLabel}
                  size="sm"
                >
                  {currencies.map((c) => (
                    <SegmentedControlItem key={c} value={c}>
                      {c}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tighter text-fg tabular-nums">
                  <Counter value={price} mode="roll" format={{ style: 'currency', currency, maximumFractionDigits: 0 }} locale={locale} inView={false} />
                </span>
                <span className="text-ui text-fg-muted">{copy.perUnit}</span>
              </p>
              <p className="text-ui-sm text-fg-muted">{copy.billing}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={cta.href} onClick={cta.onClick} data-yj-trigger="" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
                {cta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
              </Link>
              {copy.ctaNote && <p className="text-center text-ui-sm text-fg-muted">{copy.ctaNote}</p>}
            </div>
            {reassurances.length > 0 && (
              <ul className="flex flex-col gap-3 border-t border-line pt-6">
                {reassurances.map(({ icon: Icon = CheckIcon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-ui-sm text-fg-muted">
                    <Icon size={16} className="mt-px shrink-0 text-fg" />
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-8 p-6 sm:p-8 md:p-10">
            <div className="flex flex-col gap-1.5">
              <Subheading className="text-ui-lg font-semibold text-fg">{copy.includedTitle}</Subheading>
              <p className="text-ui text-fg-muted">{copy.includedDescription}</p>
            </div>
            <Included features={features} />
            {faq.length > 0 && (
              <dl className="mt-auto grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
                {faq.map(({ question, answer }) => (
                  <div key={question} className="flex flex-col gap-1">
                    <dt className="text-ui font-medium text-fg">{question}</dt>
                    <dd className="text-ui-sm text-pretty text-fg-muted">{answer}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PricingSimple }
export type { PricingSimpleProps, PricingSimpleCopy, PricingSimpleCta, PricingSimpleReassurance, PricingSimpleQuestion }
