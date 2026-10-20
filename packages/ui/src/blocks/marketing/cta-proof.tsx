'use client'

import { useId, useRef, useState, type ComponentProps, type ElementType } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Counter, Reveal, SlidingIndicator } from '@youj/motion'
import { ArrowRightIcon, SparkleIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { buttonVariants } from '../../components/ui/button'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  CUSTOMERS,
  DEFAULT_COPY,
  Mark,
  MORE,
  PRIMARY_CTA,
  SECONDARY_CTA,
  type CtaProofCopy,
  type CtaProofCta,
  type CtaProofCustomer,
  type CtaProofLogo,
} from './cta-proof/data'

/* A closing call to action set as a ledger. Four customers, each on one
 * ruled line: the measure they cared about, before and after, and the
 * change, in tabular figures from their own dashboards. Above the lines,
 * the person behind the chosen one says it in their own words, large, with
 * the opening quote mark hung in the margin. Picking a line (a toggle
 * button) glides the highlight to it and cross-fades the quote; the quotes
 * share one cell, so the panel keeps the longest one's height. Under the
 * lines a double rule draws across, like a total, and the last line is the
 * reader's own, holding the actions; pointing at the primary lights that
 * line. As the panel scrolls in, the lines print one after another and the
 * changes count up. Reduced motion: everything is in place, the quote swaps
 * and the highlight jumps.
 *
 * Pass your own `customers`, `logos` and CTAs; every string is in `copy`. */

type LinkComponent = ElementType

/* One grid for the column heads, the lines and (from lg, where its button fits the last column) the reader's line, so every figure sits on the same column. */
const COLUMNS = 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] md:gap-x-6'
const COLUMNS_LG = 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] lg:gap-x-6'

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

function Change({ change, locale }: { change: CtaProofCustomer['change']; locale?: string }) {
  return change.kind === 'share' ? (
    <>
      {change.value < 0 ? '−' : '+'}
      <Counter value={Math.round(Math.abs(change.value) * 100)} locale={locale} duration="deliberate" />%
    </>
  ) : (
    <>
      <Counter value={change.value} locale={locale} duration="deliberate" />×
    </>
  )
}

interface CtaProofProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width). Default false. */
  embedded?: boolean
  /** The ledger's lines, each with its quote. Default: the demo's four. */
  customers?: CtaProofCustomer[]
  /** The further customers named under the ledger; empty hides them. Default: the demo's four. */
  logos?: CtaProofLogo[]
  /** The index of the customer whose quote shows, to control it. */
  quote?: number
  /** The customer whose quote shows first, when uncontrolled. Default 0. */
  defaultQuote?: number
  /** Called with the index of the line picked. */
  onQuoteChange?: (index: number) => void
  /** The button on the reader's line. Default: "Start free" to `#signup`. */
  primaryCta?: CtaProofCta
  /** The text link under the ledger; `null` hides it. Default: "Talk to sales" to `#sales`. */
  secondaryCta?: CtaProofCta | null
  /** BCP 47 locale for the counted changes. Default: the runtime's. */
  locale?: string
  /** The headline's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CtaProofCopy>
  /** Renders every link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function CtaProof({
  theme,
  embedded = false,
  customers = CUSTOMERS,
  logos = MORE,
  quote,
  defaultQuote = 0,
  onQuoteChange,
  primaryCta = PRIMARY_CTA,
  secondaryCta = SECONDARY_CTA,
  locale,
  headingLevel = 2,
  copy: copyProp,
  linkComponent: Link = 'a',
  className,
  ...rest
}: CtaProofProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  const k = useYouj()
  const titleId = useId()
  const linesId = useId()
  const quoteId = useId()
  const [chosen, setIndex] = useControllableState(quote, defaultQuote)
  const index = chosen % Math.max(1, customers.length)
  // The quote is announced only once a person has picked one.
  const [picked, setPicked] = useState(false)
  const rule = useRef<HTMLDivElement>(null)
  const drawn = useInView(rule, { once: true, amount: 1 }) || k.reduced

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('group/proof', !embedded && 'bg-canvas px-4 py-20 text-fg sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10 md:gap-12', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal className="grid gap-x-16 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
          <div className="flex flex-col gap-3">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Heading id={titleId} className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              {copy.title}
            </Heading>
          </div>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>

        <Reveal variant="rise" delay={2}>
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
            <div id={quoteId} aria-live={picked ? 'polite' : 'off'} className="grid px-6 pt-8 pb-7 md:px-10 md:pt-12 md:pb-10">
              {customers.map((c, i) => {
                const shown = i === index
                return (
                  <figure
                    key={c.id}
                    aria-hidden={!shown}
                    inert={!shown}
                    className={cn(
                      'col-start-1 row-start-1 flex flex-col gap-6 transition-[opacity,translate,filter] ease-standard',
                      shown ? 'yj-duration-slow opacity-100' : 'invisible translate-y-2 opacity-0 blur-[2px] yj-duration-fast',
                    )}
                  >
                    <blockquote className="max-w-4xl text-pretty text-2xl leading-snug font-medium tracking-tight text-fg md:text-[1.875rem] md:leading-[1.25]">
                      {/* The opening mark hangs in the margin by its own width, so the words align with the column in any font. */}
                      <p className="relative">
                        <span aria-hidden className="absolute end-full">
                          “
                        </span>
                        {c.quote}
                        <span aria-hidden>”</span>
                      </p>
                    </blockquote>
                    <figcaption className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(c.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex flex-col">
                        <span className="text-ui font-medium text-fg">{c.name}</span>
                        <span className="text-ui-sm text-fg-muted">{c.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>

            <div className="border-t border-line pt-2">
              <h3 id={linesId} className="sr-only">
                {copy.linesLabel}
              </h3>
              <div aria-hidden className={cn('hidden px-10 pt-3 pb-2', COLUMNS)}>
                {copy.columns.map((head, i) => (
                  <Eyebrow key={head} className={cn(i > 1 && 'text-end')}>
                    {head}
                  </Eyebrow>
                ))}
              </div>
              <ol aria-labelledby={linesId} className="relative isolate flex flex-col">
                <SlidingIndicator className="rounded-none bg-transparent shadow-[inset_2px_0_0_var(--color-accent)] rtl:shadow-[inset_-2px_0_0_var(--color-accent)]" />
                {customers.map((c, i) => {
                  const current = i === index
                  return (
                    <Reveal key={c.id} as="li" variant="fade" inView={{ amount: 0.6 }} delay={i * 2} delayStep="loose">
                      <button
                        type="button"
                        aria-pressed={current}
                        aria-controls={quoteId}
                        onClick={() => {
                          setIndex(i)
                          setPicked(true)
                          onQuoteChange?.(i)
                        }}
                        className={cn(
                          'relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-6 py-3.5 text-start text-ui outline-none md:px-10',
                          'transition-colors yj-duration-fast ease-standard hover:bg-band focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
                          COLUMNS,
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5 font-medium text-fg">
                          <Mark id={c.id} logo={c.logo} className={cn('transition-colors yj-duration-fast', current ? 'text-fg' : 'text-fg-muted')} />
                          <span className="truncate">{c.company}</span>
                        </span>
                        <span className="col-start-1 row-start-2 min-w-0 truncate text-ui-sm text-fg-muted md:col-auto md:row-auto md:text-ui">
                          {c.measure}
                          <span className="md:hidden">
                            {' '}
                            · {c.before} → {c.after}
                          </span>
                        </span>
                        <span className="hidden text-end font-mono text-fg-muted tabular-nums md:block">
                          <span className="sr-only">{copy.from}</span>
                          {c.before}
                        </span>
                        <span className="hidden text-end font-mono text-fg tabular-nums md:block">
                          <span className="sr-only">{copy.to}</span>
                          {c.after}
                        </span>
                        <span className="col-start-2 row-start-1 text-end font-mono font-medium text-fg tabular-nums md:col-auto md:row-auto">
                          <span className="sr-only">, </span>
                          <Change change={c.change} locale={locale} />
                        </span>
                      </button>
                    </Reveal>
                  )
                })}
              </ol>
            </div>

            <div className="px-6 pt-2 pb-3 md:px-10">
              <div
                ref={rule}
                aria-hidden
                className={cn(
                  'h-1 border-y border-line transition-transform yj-duration-deliberate ease-emphasized ltr:origin-left rtl:origin-right',
                  drawn ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </div>
            {/* The reader's own line, on the ledger's columns: nothing before, a first deploy after, and the change is theirs to make. */}
            <Reveal variant="rise" inView={{ amount: 0.6 }} delay={9} delayStep="loose">
              <div
                data-yj-trigger=""
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 bg-transparent px-6 py-5 text-ui transition-colors yj-duration-base ease-standard md:gap-y-1 md:px-10',
                  'group-has-[[data-cta]:hover]/proof:bg-accent-subtle group-has-[[data-cta]:focus-visible]/proof:bg-accent-subtle',
                  COLUMNS_LG,
                )}
              >
                <span className="flex items-center gap-2.5 font-medium text-fg">
                  <SparkleIcon size={16} aria-hidden className="shrink-0 text-accent" />
                  {copy.readerName}
                </span>
                <span className="row-start-2 text-ui-sm text-fg-muted lg:row-auto lg:text-ui">
                  {copy.readerMeasure}
                  <span className="lg:hidden">
                    {' '}
                    · {copy.readerQualifier} {copy.readerAfter}
                  </span>
                </span>
                <span aria-hidden className="hidden text-end font-mono text-fg-muted lg:block">
                  —
                </span>
                <span className="hidden text-end font-mono text-fg tabular-nums lg:block">
                  <span className="sr-only">{copy.readerQualifier} </span>
                  {copy.readerAfter}
                </span>
                <span className="col-span-2 flex md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1 md:justify-end lg:col-auto lg:row-auto">
                  <Link
                    href={primaryCta.href}
                    onClick={primaryCta.onClick}
                    data-cta=""
                    className={buttonVariants({ size: 'lg', className: 'w-full gap-2 md:w-auto lg:-me-1' })}
                  >
                    {primaryCta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                  </Link>
                </span>
              </div>
            </Reveal>
          </div>
        </Reveal>

        <Reveal variant="fade" delay={4} className="flex flex-wrap items-center gap-x-6 gap-y-3 text-ui-sm text-fg-muted">
          {logos.length > 0 && (
            <>
              <span>
                {copy.moreBefore} <span className="font-mono text-fg tabular-nums">{copy.moreCount}</span> {copy.moreAfter}
              </span>
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {logos.map((logo) => (
                  <li key={logo.id} className="flex items-center gap-1.5 font-medium">
                    <Mark id={logo.id} logo={logo.logo} className="size-3.5" />
                    <span>{logo.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              onClick={secondaryCta.onClick}
              className="group/sales ms-auto inline-flex items-center gap-1.5 rounded-sm font-medium text-fg underline-offset-4 focus-ring hover:underline max-sm:ms-0"
            >
              {secondaryCta.label}
              <ArrowRightIcon
                size={14}
                aria-hidden
                className="transition-transform yj-duration-fast ease-standard group-hover/sales:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/sales:-translate-x-0.5"
              />
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CtaProof }
export type { CtaProofProps, CtaProofCopy, CtaProofCta, CtaProofCustomer, CtaProofLogo }
