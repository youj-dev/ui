'use client'

import { useState } from 'react'
import { Badge } from '@youj/react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselThumb,
  CarouselThumbs,
  type CarouselApi,
} from '@youj/react/carousel'

// Drawn from theme tokens, so the photos work in both themes and every preset; named so the names hold in every preset too.
const SHOTS = [
  { name: 'Signature', tone: 'var(--color-accent)' },
  { name: 'Moss', tone: 'var(--color-success)' },
  { name: 'Amber', tone: 'var(--color-warning)' },
  { name: 'Clay', tone: 'var(--color-danger)' },
  { name: 'Mono', tone: 'var(--color-fg)' },
]

function Speaker({ tone, small }: { tone: string; small?: boolean }) {
  const body = `color-mix(in oklab, ${tone} 78%, var(--color-surface))`
  const grille = `color-mix(in oklab, ${tone} 55%, var(--color-fg))`
  return (
    <div
      className="grid size-full place-items-center"
      style={{ background: `radial-gradient(120% 90% at 50% 20%, color-mix(in oklab, ${tone} 16%, var(--color-surface)), color-mix(in oklab, ${tone} 6%, var(--color-canvas)) 70%)` }}
    >
      <svg viewBox="0 0 200 160" className={small ? 'w-[80%]' : 'w-[52%]'} aria-hidden>
        <ellipse cx="100" cy="146" rx="58" ry="6" fill="var(--color-fg)" opacity="0.12" />
        <rect x="46" y="14" width="108" height="128" rx="26" fill={body} />
        {Array.from({ length: 42 }, (_, i) => (
          <circle key={i} cx={64 + (i % 7) * 12} cy={48 + Math.floor(i / 7) * 12} r="2.4" fill={grille} opacity="0.8" />
        ))}
      </svg>
    </div>
  )
}

export default function CarouselDemo() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Carousel
        setApi={setApi}
        onSlideChange={setCurrent}
        opts={{ loop: true }}
        aria-label="Arc speaker photos"
        className="group/gallery overflow-hidden rounded-xl border border-line bg-surface"
      >
        <CarouselContent className="ms-0">
          {SHOTS.map((shot, i) => (
            <CarouselItem key={shot.name} aria-label={`${shot.name}, ${i + 1} of ${SHOTS.length}`} className="aspect-[4/3] ps-0">
              <Speaker tone={shot.tone} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Inside the frame, shown on hover or focus (always on touch). */}
        <CarouselPrevious className="start-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
        <CarouselNext className="end-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
        <Badge variant="secondary" className="absolute end-3 top-3 bg-canvas/80 youj-allow-glass tabular-nums backdrop-blur">
          {current + 1} / {SHOTS.length}
        </Badge>
        <CarouselThumbs className="border-t border-line bg-canvas px-3 py-3">
          {SHOTS.map((shot, i) => (
            <CarouselThumb key={shot.name} index={i} aria-label={shot.name} className="size-14 border border-line">
              <Speaker tone={shot.tone} small />
            </CarouselThumb>
          ))}
        </CarouselThumbs>
      </Carousel>
      <div className="flex items-center gap-3">
        <span className="text-ui-sm text-fg-muted">
          Color <span className="font-medium text-fg">{SHOTS[current]!.name}</span>
        </span>
        {/* Anything can drive the carousel through its api. */}
        <div role="group" aria-label="Color" className="ms-auto flex gap-2">
          {SHOTS.map((shot, i) => (
            <button
              key={shot.name}
              type="button"
              aria-label={shot.name}
              aria-pressed={i === current}
              onClick={() => api?.scrollTo(i)}
              className="size-6 rounded-full border border-line outline-none focus-ring aria-pressed:ring-2 aria-pressed:ring-focus aria-pressed:ring-offset-2 aria-pressed:ring-offset-canvas"
              style={{ background: `color-mix(in oklab, ${shot.tone} 78%, var(--color-surface))` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
