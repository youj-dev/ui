'use client'

import { Fragment, useId, type ComponentProps, type ElementType, type MouseEventHandler } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, QuoteIcon } from '@youj/icons'
import { AnchorNav } from '../../components/ui/anchor-nav'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { buttonVariants } from '../../components/ui/button'
import { cn, initials } from '../../lib/utils'
import {
  CHAPTERS,
  CUSTOMER,
  DEFAULT_COPY,
  FACTS,
  HEADLINE,
  METRICS,
  NEXT,
  QUOTE,
  SUMMARY,
  type CustomerStoryChapter,
  type CustomerStoryCopy,
  type CustomerStoryCustomer,
  type CustomerStoryFact,
  type CustomerStoryMetric,
  type CustomerStoryNext,
  type CustomerStoryQuote,
} from './customer-story/data'
import { Results } from './customer-story/results'

/* A customer story, set as a long read. A header names the customer (mark and
 * industry), the headline and a summary, with the facts beside it; the results
 * come first, each a figure counting up to where they are now, the change
 * since the start and a before and now bar on one scale; then the story in
 * chapters (the problem, the approach, the result) with a contents that
 * follows the reader (a scrollspy: the chapter in view is marked and the
 * contents bar glides to it) and a pull quote after the second. It ends on the
 * next story and a call to action. Reduced motion: the figures are simply
 * there and the contents bar jumps.
 *
 * Pass the story's pieces as props (`customer`, `headline`, `summary`,
 * `facts`, `metrics`, `chapters`, `quote`, `next`), the calls to action and
 * `locale`; every string is in `copy`. */

interface Cta {
  /** Default: the matching string in `copy`. */
  label?: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

interface CustomerStoryProps extends Omit<ComponentProps<'article'>, 'children' | 'title'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A story inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Who the story is about. Default: the demo's Lumen. */
  customer?: CustomerStoryCustomer
  /** The headline. */
  headline?: string
  /** A sentence or two under it. */
  summary?: string
  /** Facts beside the headline; `[]` hides them. */
  facts?: CustomerStoryFact[]
  /** The results; `[]` hides them. */
  metrics?: CustomerStoryMetric[]
  /** The story's chapters, in order; each gets a contents link. */
  chapters?: CustomerStoryChapter[]
  /** The pull quote after the second chapter; `null` hides it. */
  quote?: CustomerStoryQuote | null
  /** The next story; `null` hides it. */
  next?: CustomerStoryNext | null
  /** The solid call to action after the story. Default: "Talk to us" to `#contact`; `null` hides the band. */
  primaryCta?: Cta | null
  /** The quiet call to action beside it. Default: "Start free" to `#signup`. */
  secondaryCta?: Cta | null
  /** The locale numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CustomerStoryCopy>
  /** The headline's level; chapter headings sit one below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function CustomerStory({
  theme,
  embedded = false,
  customer = CUSTOMER,
  headline = HEADLINE,
  summary = SUMMARY,
  facts = FACTS,
  metrics = METRICS,
  chapters = CHAPTERS,
  quote = QUOTE,
  next = NEXT,
  primaryCta = { href: '#contact' },
  secondaryCta = { href: '#signup' },
  locale: localeProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: CustomerStoryProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const base = useId()
  const titleId = `${base}-title`
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Chapter = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const idOf = (chapter: CustomerStoryChapter) => `${base}-${chapter.id}`
  const quoteAt = Math.min(1, chapters.length - 1)
  const view = (
    <article aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-14', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(88))] lg:items-end lg:gap-14">
          <Reveal className="flex flex-col gap-5">
            <p className="flex items-center gap-3 text-ui-sm font-medium text-accent">
              <span className="flex items-center gap-2 text-fg">
                {customer.logo ?? (
                  <>
                    {customer.mark && (
                      <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
                        {customer.mark}
                      </svg>
                    )}
                    <span className="text-ui font-semibold">{customer.name}</span>
                  </>
                )}
              </span>
              <span aria-hidden className="h-4 w-px bg-line" />
              {copy.eyebrow}
            </p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl md:leading-[1.08]">
              {headline}
            </Title>
            <p className="max-w-2xl text-pretty text-ui-lg text-fg-muted">{summary}</p>
          </Reveal>
          {facts.length > 0 && (
            <dl aria-label={copy.factsLabel} className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-line bg-surface p-5">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-0.5">
                  <dt className="text-ui-sm text-fg-muted">{fact.label}</dt>
                  <dd className="text-ui font-medium text-fg">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        {metrics.length > 0 && (
          <section aria-label={copy.resultsTitle}>
            <Results metrics={metrics} locale={locale} copy={copy} label={copy.resultsTitle} />
          </section>
        )}

        {chapters.length > 0 && (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,--spacing(52))_minmax(0,1fr)] lg:gap-16">
            <AnchorNav items={chapters.map((c) => ({ id: idOf(c), label: c.heading }))} title={copy.onThisPage} className="max-lg:hidden lg:sticky lg:top-8 lg:self-start" />
            <div className="flex max-w-2xl flex-col gap-14">
              {chapters.map((chapter, i) => (
                <Fragment key={chapter.id}>
                  <section id={idOf(chapter)} aria-labelledby={`${idOf(chapter)}-h`} className="flex scroll-mt-8 flex-col gap-4">
                    <p aria-hidden className="font-mono text-ui-sm text-fg-muted tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <Chapter id={`${idOf(chapter)}-h`} className="text-balance text-2xl font-semibold tracking-tight">
                      {chapter.heading}
                    </Chapter>
                    {chapter.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-pretty text-ui-lg leading-relaxed text-fg-muted">
                        {paragraph}
                      </p>
                    ))}
                    {chapter.points && chapter.points.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-2">
                        {chapter.points.map((point) => (
                          <li key={point} className="flex items-start gap-2.5 text-ui text-fg">
                            <CheckIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  {quote && i === quoteAt && (
                    <figure aria-label={copy.quoteLabel} className="flex flex-col gap-5 rounded-2xl border border-line bg-linear-to-br from-accent/10 via-surface to-surface p-6 sm:p-8">
                      <QuoteIcon size={28} aria-hidden className="text-accent-line" />
                      <blockquote className="text-pretty text-xl leading-relaxed font-medium text-fg sm:text-2xl">
                        <p>“{quote.text}”</p>
                      </blockquote>
                      <figcaption className="flex items-center gap-3">
                        <Avatar size="lg">
                          {quote.avatar && <AvatarImage src={quote.avatar} alt="" />}
                          <AvatarFallback>{initials(quote.name)}</AvatarFallback>
                        </Avatar>
                        <span className="flex flex-col">
                          <span className="text-ui font-medium text-fg">{quote.name}</span>
                          <span className="text-ui-sm text-fg-muted">{quote.role}</span>
                        </span>
                      </figcaption>
                    </figure>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {(next || primaryCta) && (
          <footer className="grid gap-4 lg:grid-cols-2">
            {primaryCta && (
              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
                <h3 className="text-xl font-semibold tracking-tight">{copy.ctaTitle}</h3>
                <p className="text-pretty text-ui text-fg-muted">{copy.ctaDescription}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({})}>
                    {primaryCta.label ?? copy.ctaPrimary}
                  </Link>
                  {secondaryCta && (
                    <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ variant: 'outline' })}>
                      {secondaryCta.label ?? copy.ctaSecondary}
                    </Link>
                  )}
                </div>
              </div>
            )}
            {next && (
              <Link
                href={next.href}
                onClick={next.onClick}
                className="group/next flex flex-col justify-between gap-6 rounded-2xl border border-line bg-transparent p-6 transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring"
              >
                <span className="text-ui-sm font-medium text-fg-muted">{copy.next}</span>
                <span className="flex items-end justify-between gap-4">
                  <span className="flex flex-col gap-1">
                    <span className="text-ui-sm text-fg-muted">{next.customer}</span>
                    <span className="text-balance text-xl font-semibold tracking-tight text-fg">{next.title}</span>
                  </span>
                  <ArrowRightIcon size={20} aria-hidden className="shrink-0 transition-transform yj-duration-fast ease-standard group-hover/next:translate-x-1 rtl:-scale-x-100 rtl:group-hover/next:-translate-x-1" />
                </span>
              </Link>
            )}
          </footer>
        )}
      </div>
    </article>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CustomerStory }
export type {
  CustomerStoryProps,
  CustomerStoryCopy,
  CustomerStoryCustomer,
  CustomerStoryMetric,
  CustomerStoryChapter,
  CustomerStoryFact,
  CustomerStoryQuote,
  CustomerStoryNext,
}
