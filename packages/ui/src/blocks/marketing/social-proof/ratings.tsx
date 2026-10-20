'use client'

import { useMemo, useRef } from 'react'
import { useInView } from 'motion/react'
import { Counter } from '@youj/motion'
import { Progress } from '../../../components/ui/progress'
import { Rating } from '../../../components/ui/rating'
import type { SocialProofCopy, SocialProofRating } from './data'
import { numberFormat } from '../../../lib/utils'

/* The rating summary: the average rolling up to its figure beside five
 * stars, how the reviews split across 5 to 1 stars (bars that fill once the
 * card scrolls into view), and the review sites it comes from. */

const MAX = 5

interface RatingSummaryProps {
  rating: SocialProofRating
  locale: string
  copy: SocialProofCopy
}

export function RatingSummary({ rating, locale, copy }: RatingSummaryProps) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.4 })
  const { number, score, percent } = useMemo(
    () => ({
      number: numberFormat(locale),
      score: numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      percent: numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
    }),
    [locale],
  )
  return (
    <div ref={ref} role="group" aria-label={copy.ratingTitle} className="flex w-full flex-col gap-5 rounded-2xl border border-line bg-surface p-5 lg:w-80">
      <div className="flex items-center gap-4">
        <p className="flex items-baseline text-5xl font-semibold tracking-tight text-fg tabular-nums">
          <span aria-hidden>
            <Counter value={rating.score} mode="roll" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} locale={locale} duration="deliberate" />
          </span>
          <span className="sr-only">{copy.outOf(score.format(rating.score), MAX)}</span>
        </p>
        <div className="flex flex-col gap-1">
          <Rating value={rating.score} readOnly size="sm" aria-label={copy.outOf(score.format(rating.score), MAX)} />
          <p className="text-ui-sm text-fg-muted">{copy.reviews(number.format(rating.count))}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {rating.distribution.map((share, i) => {
          const stars = MAX - i
          return (
            <li key={stars} aria-label={copy.stars(stars, percent.format(share / 100))} className="grid grid-cols-[--spacing(4)_minmax(0,1fr)_--spacing(10)] items-center gap-2 text-ui-sm text-fg-muted tabular-nums">
              <span aria-hidden>{stars}</span>
              <Progress value={seen ? share : 0} aria-hidden />
              <span aria-hidden className="text-end">
                {percent.format(share / 100)}
              </span>
            </li>
          )
        })}
      </ul>
      {rating.sources && rating.sources.length > 0 && (
        <dl aria-label={copy.sources} className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-ui-sm">
          {rating.sources.map((source) => (
            <div key={source.name} className="flex items-baseline gap-1.5">
              <dt className="text-fg-muted">{source.name}</dt>
              <dd className="font-medium text-fg tabular-nums">{score.format(source.score)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
