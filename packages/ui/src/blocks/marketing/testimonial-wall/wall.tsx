'use client'

import { useLayoutEffect, useRef, useState, type ElementType } from 'react'
import { Marquee } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { QuoteCard, QuoteCardSkeleton } from './card'
import type { TestimonialWallCopy, TestimonialWallQuote } from './data'

/* The wall: the quotes dealt into as many columns as the width holds (one
 * on a phone, two from 640px, three from 1024px), each column a vertical
 * Marquee drifting the other way from its neighbors at a speed of its own,
 * faded at both ends. A pointed-at column eases to a stop (the Marquee's
 * own hover hold) while the others recede, so the one being read comes
 * forward. Tabbing into a quote's link stops its column and brings the quote
 * clear of the fade. Screen readers read each quote once (the Marquee's
 * repeats are inert, which is also why the dimming is by column: an inert
 * repeat never takes the pointer's hover).
 * Still (paused by the app, reduced motion): the same columns stand at the
 * wall's height with a fade at the foot and Show all to unfold them. */

/** Each column's share of the speed, so neighbors never drift in step. */
const PACE = [1, 0.8, 1.2]

function columnsFor(width: number) {
  return width >= 1024 ? 3 : width >= 640 ? 2 : 1
}

interface WallProps {
  quotes: TestimonialWallQuote[]
  moving: boolean
  /** Pixels a second; 0 holds every column where it is. */
  speed: number
  loading: boolean
  copy: TestimonialWallCopy
  Link: ElementType
}

export function Wall({ quotes, moving, speed, loading, copy, Link }: WallProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(3)
  const [open, setOpen] = useState(false)
  // Measured before paint, so a phone never shows three columns first.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCount(columnsFor(el.offsetWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const columns = Array.from({ length: count }, (_, c) => quotes.filter((_, i) => i % count === c))

  if (loading)
    return (
      <div ref={ref} role="status" aria-label={copy.loading} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, c) => (
          <div key={c} className="flex flex-col gap-4">
            <QuoteCardSkeleton lines={4} />
            <QuoteCardSkeleton lines={2} />
          </div>
        ))}
      </div>
    )

  if (quotes.length === 0)
    return (
      <p ref={ref} className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-ui text-fg-muted">
        {copy.empty}
      </p>
    )

  if (moving)
    return (
      <div ref={ref} role="list" aria-label={copy.wallLabel} className="group/wall grid h-128 grid-rows-[minmax(0,1fr)] gap-4 sm:h-160" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {columns.map((column, c) => (
          <Marquee
            key={`${count}-${c}`}
            data-yj-wall-column=""
            direction={c % 2 ? 'down' : 'up'}
            speed={speed * (PACE[c] ?? 1)}
            gap={16}
            fade={96}
            className="h-full min-w-0 transition-opacity yj-duration-slow ease-standard group-has-[[data-yj-wall-column]:hover]/wall:not-hover:opacity-45"
          >
            {column.map((item) => (
              <div key={item.id} role="listitem" className="w-full">
                <QuoteCard item={item} copy={copy} Link={Link} />
              </div>
            ))}
          </Marquee>
        ))}
      </div>
    )

  return (
    <div ref={ref} className="flex flex-col items-center gap-6">
      <div
        role="list"
        aria-label={copy.wallLabel}
        // Folded, the foot fades out through a mask, so it reads on any background. Shown all, the quotes scroll in that same height, so the section never grows.
        className={cn(
          'relative grid w-full items-start gap-4',
          open ? '-m-1 h-162 overflow-y-auto p-1 yj-scrollbar' : 'max-h-160 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]',
        )}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {columns.map((column, c) => (
          <div key={`${count}-${c}`} className="flex min-w-0 flex-col gap-4">
            {column.map((item) => (
              <div key={item.id} role="listitem">
                <QuoteCard item={item} copy={copy} Link={Link} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Button variant="outline" aria-expanded={open} onClick={() => setOpen((was) => !was)}>
        {open ? copy.showFewer : copy.showAll}
      </Button>
    </div>
  )
}
