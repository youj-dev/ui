'use client'

import type { ElementType } from 'react'
import { StarIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { initials } from '../../../lib/utils'
import type { TestimonialWallCopy, TestimonialWallQuote } from './data'

/* One testimonial: where it was said and its stars on top, a figure where
 * there is one, the words (the phrase that matters in full ink, the rest a
 * step quieter), and who said it. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

/** Its stars as plain glyphs, quieter than the kit's Rating tiles on a wall of many. */
function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex items-center gap-0.5 text-fg">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={14} strokeWidth={1.5} trigger="none" aria-hidden className={i < Math.round(value) ? 'fill-current' : 'text-fg-subtle'} />
      ))}
    </span>
  )
}

/** The words, with the highlighted phrase in full ink. */
function Words({ quote, highlight }: { quote: string; highlight?: string }) {
  const at = highlight ? quote.indexOf(highlight) : -1
  if (!highlight || at < 0) return <>{quote}</>
  return (
    <>
      {quote.slice(0, at)}
      <strong className="font-medium text-fg">{highlight}</strong>
      {quote.slice(at + highlight.length)}
    </>
  )
}

interface CardProps {
  item: TestimonialWallQuote
  copy: TestimonialWallCopy
  Link: ElementType
}

export function QuoteCard({ item, copy, Link }: CardProps) {
  const { author } = item
  const name = <span className="truncate text-ui font-medium text-fg">{author.name}</span>
  return (
    <figure
      data-slot="testimonial-wall-card"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-xs"
    >
      {(item.rating !== undefined || item.source) && (
        <div className="flex min-h-4 items-center justify-between gap-3">
          {item.rating !== undefined ? (
            <Stars value={item.rating} label={copy.rated(String(item.rating))} />
          ) : (
            <span />
          )}
          {item.source && <span className={`text-ui-xs text-fg-subtle ${VOICE}`}>{item.source}</span>}
        </div>
      )}
      {item.metric && (
        <p className="flex flex-col gap-0.5">
          <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">{item.metric.value}</span>
          <span className="text-ui-sm text-fg-muted">{item.metric.label}</span>
        </p>
      )}
      <blockquote className="text-pretty text-ui leading-relaxed text-fg-muted">
        <p>
          “<Words quote={item.quote} highlight={item.highlight} />”
        </p>
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <Avatar size="sm">
          {author.avatar && <AvatarImage src={author.avatar} alt="" />}
          <AvatarFallback className="text-ui-xs">{initials(author.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          {item.href ? (
            <Link href={item.href} className="truncate rounded-sm hover:underline focus-ring">
              {name}
            </Link>
          ) : (
            name
          )}
          <span className="truncate text-ui-sm text-fg-muted">{author.company ? `${author.role}, ${author.company}` : author.role}</span>
        </span>
        {item.mark && (
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0 fill-current text-fg-subtle">
            {item.mark}
          </svg>
        )}
      </figcaption>
    </figure>
  )
}

export function QuoteCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={i === lines - 1 ? 'h-3.5 w-2/3' : 'h-3.5 w-full'} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  )
}
