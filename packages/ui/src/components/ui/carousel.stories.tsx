import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StarIcon, TruckIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselCaption,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselThumb,
  CarouselThumbs,
  type CarouselApi,
} from './carousel'

const meta: Meta<typeof Carousel> = {
  title: 'UI/Display/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "shadcn's carousel on Embla: swipe, drag and flick, looping, and responsive slides per view (a basis on each item). Buttons, dots, thumbnails and arrow keys travel on the slow token, which Speed scales; reduced motion jumps while drags still follow the finger. Dots and thumbnails wear a SlidingIndicator that glides to the current slide. `autoplay` pauses while the pointer is over the carousel, while focus is inside it, while it is dragged and while the tab is hidden; CarouselAutoplayToggle is its play / pause control and draws the dwell. It never starts under reduced motion. The region carries aria-roledescription=\"carousel\", slides are labeled \"3 of 8\", and a polite live region names the current slide (silent while autoplay rotates). CarouselCaption rises into place when its slide arrives.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Carousel>

/* The product: a speaker drawn in SVG from theme tokens, so it works in both themes and every preset. */
const COLORWAYS = [
  { name: 'Signature', tone: 'var(--color-accent)' },
  { name: 'Moss', tone: 'var(--color-success)' },
  { name: 'Amber', tone: 'var(--color-warning)' },
  { name: 'Clay', tone: 'var(--color-danger)' },
  { name: 'Mono', tone: 'var(--color-fg)' },
]
const SHOTS = [
  ...COLORWAYS.map((c) => ({ ...c, view: 'front' as const })),
  { ...COLORWAYS[0]!, view: 'side' as const, name: 'Profile' },
  { ...COLORWAYS[0]!, view: 'detail' as const, name: 'Grille detail' },
]

function Speaker({ tone, view, small }: { tone: string; view: 'front' | 'side' | 'detail'; small?: boolean }) {
  const body = `color-mix(in oklab, ${tone} 78%, var(--color-surface))`
  const deep = `color-mix(in oklab, ${tone} 55%, var(--color-fg))`
  return (
    <div
      className="relative grid size-full place-items-center overflow-hidden"
      style={{ background: `radial-gradient(120% 90% at 50% 20%, color-mix(in oklab, ${tone} 16%, var(--color-surface)), color-mix(in oklab, ${tone} 6%, var(--color-canvas)) 70%)` }}
    >
      <svg viewBox="0 0 200 160" className={small ? 'w-[80%]' : 'w-[62%] max-w-[420px]'} aria-hidden>
        <ellipse cx="100" cy="146" rx={view === 'side' ? 38 : 58} ry="6" fill="var(--color-fg)" opacity="0.12" />
        {view === 'detail' ? (
          <g>
            <rect x="10" y="4" width="180" height="140" rx="18" fill={body} />
            {Array.from({ length: 9 * 12 }, (_, i) => (
              <circle key={i} cx={24 + (i % 12) * 14} cy={20 + Math.floor(i / 12) * 14} r="3.2" fill={deep} opacity="0.85" />
            ))}
          </g>
        ) : view === 'side' ? (
          <g>
            <rect x="72" y="18" width="56" height="124" rx="22" fill={body} />
            <rect x="120" y="18" width="8" height="124" rx="4" fill={deep} opacity="0.35" />
            <circle cx="100" cy="36" r="3" fill={deep} />
          </g>
        ) : (
          <g>
            <rect x="46" y="14" width="108" height="128" rx="26" fill={body} />
            {Array.from({ length: 6 * 7 }, (_, i) => (
              <circle key={i} cx={64 + (i % 7) * 12} cy={48 + Math.floor(i / 7) * 12} r="2.4" fill={deep} opacity="0.8" />
            ))}
            <rect x="86" y="26" width="28" height="5" rx="2.5" fill={deep} opacity="0.55" />
          </g>
        )}
      </svg>
    </div>
  )
}

function Gallery() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const colorway = SHOTS[current]!.view === 'front' ? current : 0
  return (
    <div className="grid w-full max-w-[1040px] gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <Carousel
          setApi={setApi}
          onSlideChange={setCurrent}
          opts={{ loop: true }}
          aria-label="Arc speaker photos"
          className="group/gallery overflow-hidden rounded-xl border border-line bg-surface"
        >
          <CarouselContent className="ms-0">
            {SHOTS.map((shot, i) => (
              <CarouselItem key={i} aria-label={`${shot.name}, ${i + 1} of ${SHOTS.length}`} className="aspect-[4/3] ps-0">
                <Speaker tone={shot.tone} view={shot.view} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="start-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
          <CarouselNext className="end-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
          <Badge variant="secondary" className="absolute end-3 top-3 bg-canvas/80 youj-allow-glass tabular-nums backdrop-blur">
            {current + 1} / {SHOTS.length}
          </Badge>
          <CarouselThumbs className="border-t border-line bg-canvas px-3 py-3">
            {SHOTS.map((shot, i) => (
              <CarouselThumb key={i} index={i} aria-label={shot.name} className="size-16 border border-line">
                <Speaker tone={shot.tone} view={shot.view} small />
              </CarouselThumb>
            ))}
          </CarouselThumbs>
        </Carousel>
      </div>
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="success">New</Badge>
            <span className="flex items-center gap-1 text-ui-sm text-fg-muted">
              <StarIcon className="size-3.5 fill-current text-warning" /> 4.8 · 1,204 reviews
            </span>
          </div>
          <h2 className="text-[26px] leading-8 font-semibold tracking-tight text-fg">Arc Speaker</h2>
          <p className="text-ui-lg text-fg-muted">Room-filling sound from a body the size of a paperback. 20 hours a charge.</p>
        </div>
        <p className="text-[22px] font-semibold text-fg tabular-nums">$249</p>
        <div className="flex flex-col gap-2">
          <span className="text-ui-sm font-medium text-fg">
            Color <span className="font-normal text-fg-muted">{COLORWAYS[colorway]!.name}</span>
          </span>
          <div role="group" aria-label="Color" className="flex gap-2.5">
            {COLORWAYS.map((c, i) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                aria-pressed={i === colorway}
                onClick={() => api?.scrollTo(i)}
                className="size-7 rounded-full border border-line outline-none focus-ring aria-pressed:ring-2 aria-pressed:ring-focus aria-pressed:ring-offset-2 aria-pressed:ring-offset-canvas"
                style={{ background: `color-mix(in oklab, ${c.tone} 78%, var(--color-surface))` }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="lg" className="flex-1">
            Add to bag
          </Button>
          <Button size="lg" variant="outline">
            Save
          </Button>
        </div>
        <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
          <TruckIcon className="size-4" /> Free delivery by Thursday
        </p>
      </div>
    </div>
  )
}

/** A product gallery: drag or swipe the photos, use the arrows, the thumbnails or the color swatches. Focus the carousel and use ← → Home End. */
export const Hero: Story = {
  render: () => (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <Gallery />
    </div>
  ),
}

const STORIES = [
  { title: 'Studio sessions', body: 'Recorded live at Arc HQ with three artists and one speaker.', tone: 'var(--color-accent)' },
  { title: 'The acoustic lab', body: 'How a 12mm driver learned to fill a room.', tone: 'var(--color-success)' },
  { title: 'Made to be carried', body: 'Recycled aluminum, one seam, no screws.', tone: 'var(--color-warning)' },
  { title: 'Night mode', body: 'Warmer and quieter after ten, without a tap.', tone: 'var(--color-danger)' },
]

/** A looping banner with autoplay: it pauses while hovered or focused, the toggle stops it, and the caption rises in with each slide. Under reduced motion it doesn't start. */
export const Autoplay: Story = {
  render: () => (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <Carousel autoplay={4000} opts={{ loop: true }} aria-label="Featured stories" className="w-full max-w-[760px]">
        <CarouselContent>
          {STORIES.map((s, i) => (
            <CarouselItem key={i}>
              <div
                className="relative flex aspect-[21/9] items-end overflow-hidden rounded-xl border border-line p-6"
                style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${s.tone} 26%, var(--color-surface)), color-mix(in oklab, ${s.tone} 8%, var(--color-canvas)))` }}
              >
                <CarouselCaption className="flex max-w-sm flex-col gap-1">
                  <h3 className="text-[20px] leading-7 font-semibold tracking-tight text-fg">{s.title}</h3>
                  <p className="text-ui text-fg-muted">{s.body}</p>
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
    </div>
  ),
}

const PLANS = ['Starter', 'Team', 'Growth', 'Scale', 'Enterprise', 'Education', 'Non-profit']

/** Responsive slides per view: one on phones, two from `sm`, three from `lg`, with snaps that move by a page. */
export const SlidesPerView: Story = {
  render: () => (
    <div className="grid min-h-screen place-items-center bg-canvas px-16 py-6">
      <Carousel opts={{ align: 'start', slidesToScroll: 'auto' }} aria-label="Plans" className="w-full max-w-[880px]">
        <CarouselContent>
          {PLANS.map((plan, i) => (
            <CarouselItem key={plan} className="sm:basis-1/2 lg:basis-1/3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{plan}</CardTitle>
                  <CardDescription>For {['solo builders', 'small teams', 'growing teams', 'many teams', 'the whole company', 'classrooms', 'charities'][i]}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[22px] font-semibold text-fg tabular-nums">${[0, 12, 29, 59, 0, 4, 6][i]}</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots className="mt-3" />
      </Carousel>
    </div>
  ),
}
