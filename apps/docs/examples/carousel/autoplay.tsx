'use client'

import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselCaption,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from '@youj/react/carousel'

const STORIES = [
  { title: 'Studio sessions', body: 'Recorded live at Arc HQ with three artists and one speaker.', tone: 'var(--color-accent)' },
  { title: 'The acoustic lab', body: 'How a 12mm driver learned to fill a room.', tone: 'var(--color-success)' },
  { title: 'Made to be carried', body: 'Recycled aluminum, one seam, no screws.', tone: 'var(--color-warning)' },
  { title: 'Night mode', body: 'Warmer and quieter after ten, without a tap.', tone: 'var(--color-danger)' },
]

export default function CarouselAutoplay() {
  return (
    <Carousel autoplay={4000} opts={{ loop: true }} aria-label="Featured stories" className="w-full max-w-xl">
      <CarouselContent>
        {STORIES.map((story) => (
          <CarouselItem key={story.title}>
            <div
              className="flex aspect-[21/9] items-end overflow-hidden rounded-xl border border-line p-5"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${story.tone} 26%, var(--color-surface)), color-mix(in oklab, ${story.tone} 8%, var(--color-canvas)))`,
              }}
            >
              <CarouselCaption className="flex max-w-sm flex-col gap-1">
                <h3 className="text-[19px] leading-7 font-semibold tracking-tight text-fg">{story.title}</h3>
                <p className="text-ui text-fg-muted">{story.body}</p>
              </CarouselCaption>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-3 flex items-center justify-between">
        <CarouselAutoplayToggle />
        <CarouselDots />
        <span className="w-8" />
      </div>
    </Carousel>
  )
}
