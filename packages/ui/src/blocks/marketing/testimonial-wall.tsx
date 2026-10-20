'use client'

import { useId, useMemo, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, PlayIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Rating } from '../../components/ui/rating'
import { cn, numberFormat } from '../../lib/utils'
import { CTA, DEFAULT_COPY, QUOTES, RATING } from './testimonial-wall/data'
import type { TestimonialWallCopy, TestimonialWallCta, TestimonialWallQuote, TestimonialWallRating, TestimonialWallSource } from './testimonial-wall/data'
import { Wall } from './testimonial-wall/wall'

/* A wall of what customers say. The quotes are dealt into as many columns
 * as the width holds, and each column drifts on the kit Marquee, the other
 * way from its neighbors and at its own pace, with no seam and faded at both
 * ends. Point at a column and it eases to a stop while the others recede;
 * tab to a quote's link and its column brings it clear of the fade; one
 * button pauses the whole wall (and plays it again). Each card sets the
 * phrase that matters in full ink and the rest a step quieter, with its
 * stars, where it was said, a figure where there is one, and who said it.
 * The rating sits beside the heading. Screen readers read each quote once.
 * Reduced motion, or `autoplay={false}`: the columns stand still at the
 * wall's height, faded at the foot, with Show all to unfold them.
 *
 * Pass your own `quotes` (a `highlight` must appear in its quote verbatim),
 * `rating` (or `null`) and `cta` (or `null`); every string is in `copy`. */

interface TestimonialWallProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The quotes, dealt into the columns in order. Default: the demo's sixteen. */
  quotes?: TestimonialWallQuote[]
  /** The rating beside the heading; `null` hides it. Default: the demo's 4.8 from 2,314 reviews. */
  rating?: TestimonialWallRating | null
  /** The link under the wall; `null` hides it. Default: "Read all reviews". */
  cta?: TestimonialWallCta | null
  /** Let the columns drift. Default true (never under reduced motion). */
  autoplay?: boolean
  /** How fast the columns drift, in pixels a second. Default 24. */
  speed?: number
  /** Show skeletons in place of the wall, while the quotes load. Default false. */
  loading?: boolean
  /** The locale the rating is written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links (the call to action, a quote's original): pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<TestimonialWallCopy>
}

function TestimonialWall({
  theme,
  embedded = false,
  quotes = QUOTES,
  rating = RATING,
  cta = CTA,
  autoplay = true,
  speed = 24,
  loading = false,
  locale: localeProp,
  linkComponent: Link = 'a',
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: TestimonialWallProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [paused, setPaused] = useState(false)
  const moving = autoplay && !k.reduced
  const format = useMemo(
    () => ({ score: numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), count: numberFormat(locale) }),
    [locale],
  )
  const showControls = moving && !loading && quotes.length > 0

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal className="flex max-w-2xl flex-col gap-4">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          {rating && (
            <Reveal delay={2} className="flex shrink-0 flex-col gap-3 md:items-end">
              <div className="flex items-center gap-3">
                <p className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
                  <span aria-hidden>{format.score.format(rating.score)}</span>
                  <span className="sr-only">{copy.outOf(format.score.format(rating.score))}</span>
                </p>
                <div className="flex flex-col gap-1">
                  <span aria-hidden>
                    <Rating value={rating.score} readOnly allowHalf size="sm" />
                  </span>
                  <p className="text-ui-sm text-fg-muted">{copy.reviews(format.count.format(rating.count))}</p>
                </div>
              </div>
              {rating.sources && rating.sources.length > 0 && (
                <dl aria-label={copy.sourcesLabel} className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm">
                  {rating.sources.map((source) => (
                    <div key={source.name} className="flex items-baseline gap-1.5">
                      <dt className="text-fg-muted">{source.name}</dt>
                      <dd className="font-medium text-fg tabular-nums">{format.score.format(source.score)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Reveal>
          )}
        </div>

        <Wall quotes={quotes} moving={moving} speed={paused ? 0 : speed} loading={loading} copy={copy} Link={Link} />

        {(showControls || cta) && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            {showControls ? (
              <Button variant="ghost" size="sm" onClick={() => setPaused((was) => !was)} className="-ms-2.5">
                <PlayIcon active={!paused} className="size-3.5" />
                {paused ? copy.play : copy.pause}
              </Button>
            ) : (
              <span />
            )}
            {cta && (
              <Link
                href={cta.href}
                onClick={cta.onClick}
                className="group/cta inline-flex items-center gap-1.5 rounded-sm text-ui font-medium text-fg underline-offset-4 hover:underline focus-ring"
              >
                {cta.label}
                <ArrowRightIcon size={15} className="transition-transform yj-duration-fast ease-standard group-hover/cta:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/cta:-translate-x-0.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { TestimonialWall }
export type { TestimonialWallProps, TestimonialWallCopy, TestimonialWallQuote, TestimonialWallRating, TestimonialWallSource, TestimonialWallCta }
