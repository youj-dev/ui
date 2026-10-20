'use client'

import { carouselLabels } from '@youj/core/labels'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { PlayIcon } from '@youj/icons/components/youj/icons/play'
import { animate, m, useMotionValue, type AnimationPlaybackControls, type MotionValue } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useDirection, useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { Button } from './button'

/* shadcn's carousel on Embla: swipe, drag and flick with Embla's physics,
 * looping, responsive slides per view (give CarouselItem a basis, e.g.
 * `basis-1/2 md:basis-1/3`). youj adds:
 * - Timing from tokens: button, dot, thumbnail and key presses travel on the
 *   slow token (Speed scales it); reduced motion jumps. Drags keep following
 *   the finger either way, since that is the user's own movement.
 * - Arrow keys (flipped under RTL), Home / End, never stolen from text fields.
 * - Dots and thumbnails with a SlidingIndicator that glides to the current slide.
 * - Autoplay (`autoplay` or `autoplay={ms}`) that pauses while the pointer is
 *   over the carousel, while focus is inside it, while it is dragged and
 *   while the tab is hidden, with a play / pause control and a progress bar
 *   that is also its timer. It never starts under reduced motion.
 * - Accessibility: a region with aria-roledescription="carousel" (name it
 *   with aria-label), slides labeled "3 of 8", and a live region that says
 *   which slide is showing, silent while autoplay rotates (WAI-ARIA APG).
 * - CarouselCaption rises into place when its slide arrives. */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
  /** Advance on a timer: `true` for the default dwell (5000), or the dwell per slide in milliseconds. Pauses on hover, focus and drag; never starts under reduced motion. */
  autoplay?: boolean | number
  /** Called when the current slide changes, by any means. */
  onSlideChange?: (index: number) => void
}

interface CarouselContextValue {
  carouselRef: UseEmblaCarouselType[0]
  api: CarouselApi
  orientation: 'horizontal' | 'vertical'
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  canScrollPrev: boolean
  canScrollNext: boolean
  /** The selected snap. */
  selected: number
  snapCount: number
  /** Slide indexes shown by the selected snap. */
  selectedSlides: number[]
  slideCount: number
  autoplay: {
    enabled: boolean
    playing: boolean
    paused: boolean
    toggle: () => void
    progress: MotionValue<number>
  }
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = useContext(CarouselContext)
  if (!context) throw new Error('useCarousel must be used within a <Carousel />')
  return context
}

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  autoplay = false,
  onSlideChange,
  className,
  children,
  onKeyDownCapture,
  ...props
}: ComponentProps<'div'> & CarouselProps) {
  const k = useYouj()
  const dir = useDirection()
  const labels = useComponentLabels(carouselLabels)
  const [carouselRef, api] = useEmblaCarousel(
    {
      // Embla lays out and drags in the page's direction only when told it; an app's opts can still set it.
      direction: dir,
      // Embla's duration is an integration step count, not milliseconds: a step of about 12 lands the slow token.
      // The options are compared deeply, so a Speed change re-inits Embla with the new travel.
      duration: Math.max(8, Math.round(k.ms('slow') / 12)),
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  )
  const [state, setState] = useState({ prev: false, next: false, selected: 0, snaps: 0, slides: [0] as number[], count: 0 })
  const [said, setSaid] = useState('')
  const reduced = k.reduced
  const jump = reduced

  const sync = useCallback((embla: NonNullable<CarouselApi>) => {
    const selected = embla.selectedScrollSnap()
    setState({
      prev: embla.canScrollPrev(),
      next: embla.canScrollNext(),
      selected,
      snaps: embla.scrollSnapList().length,
      slides: embla.internalEngine().slideRegistry[selected] ?? [selected],
      count: embla.slideNodes().length,
    })
  }, [])

  useEffect(() => {
    if (api && setApi) setApi(api)
  }, [api, setApi])

  const onSlideChangeRef = useRef(onSlideChange)
  onSlideChangeRef.current = onSlideChange
  useEffect(() => {
    if (!api) return
    sync(api)
    const onSelect = (embla: NonNullable<CarouselApi>) => {
      sync(embla)
      onSlideChangeRef.current?.(embla.selectedScrollSnap())
    }
    api.on('reInit', sync).on('select', onSelect)
    return () => {
      api.off('reInit', sync).off('select', onSelect)
    }
  }, [api, sync])

  // Label every slide "n of N" unless it already has a name.
  useEffect(() => {
    if (!api) return
    const label = () => {
      const nodes = api.slideNodes()
      nodes.forEach((node, i) => {
        if (!node.hasAttribute('aria-label') || node.dataset.autoLabel !== undefined) {
          node.setAttribute('aria-label', labels.slidePosition(i + 1, nodes.length))
          node.dataset.autoLabel = ''
        }
      })
    }
    label()
    api.on('slidesChanged', label)
    return () => {
      api.off('slidesChanged', label)
    }
  }, [api, labels])

  /* ── Autoplay ─────────────────────────────────────────────────────────── */
  const delay = autoplay === true ? 5000 : typeof autoplay === 'number' ? autoplay : 0
  const enabled = delay > 0
  const [playing, setPlaying] = useState(enabled && !reduced)
  const [holds, setHolds] = useState({ hover: false, focus: false, drag: false, hidden: false })
  const paused = holds.hover || holds.focus || holds.drag || holds.hidden
  const progress = useMotionValue(0)
  const run = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    if (reduced) setPlaying(false)
  }, [reduced])

  useEffect(() => {
    if (!api || !enabled) return
    const down = () => setHolds((h) => ({ ...h, drag: true }))
    const settle = () => setHolds((h) => (h.drag ? { ...h, drag: false } : h))
    const visibility = () => setHolds((h) => ({ ...h, hidden: document.hidden }))
    api.on('pointerDown', down).on('pointerUp', settle).on('settle', settle)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      api.off('pointerDown', down).off('pointerUp', settle).off('settle', settle)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [api, enabled])

  // A new slide restarts the dwell.
  useEffect(() => {
    progress.set(0)
  }, [state.selected, progress])

  // The progress value is the timer: it runs while playing and unpaused, holds where it is while paused.
  useEffect(() => {
    if (!api || !enabled || !playing || paused) return
    const left = 1 - progress.get()
    run.current = animate(progress, 1, {
      duration: (delay * left) / 1000,
      ease: 'linear',
      onComplete: () => {
        progress.set(0)
        if (api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      },
    })
    return () => run.current?.stop()
  }, [api, enabled, playing, paused, delay, progress, state.selected])

  const toggle = useCallback(() => setPlaying((p) => !p), [])

  /* ── Navigation ───────────────────────────────────────────────────────── */
  const announce = useCallback(
    (index: number) => {
      if (!api) return
      setSaid(labels.slideOf(index + 1, api.scrollSnapList().length))
    },
    [api, labels],
  )
  const scrollPrev = useCallback(() => {
    if (!api) return
    api.scrollPrev(jump)
    announce(api.selectedScrollSnap())
  }, [api, jump, announce])
  const scrollNext = useCallback(() => {
    if (!api) return
    api.scrollNext(jump)
    announce(api.selectedScrollSnap())
  }, [api, jump, announce])
  const scrollTo = useCallback(
    (index: number) => {
      if (!api) return
      api.scrollTo(index, jump)
      announce(index)
    },
    [api, jump, announce],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(event)
    if (event.defaultPrevented || (event.target as HTMLElement).closest(EDITABLE)) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const back = orientation === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    const forward = orientation === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const key = event.key
    if (key !== back && key !== forward && key !== 'Home' && key !== 'End') return
    event.preventDefault()
    if (key === back) scrollPrev()
    else if (key === forward) scrollNext()
    else scrollTo(key === 'Home' ? 0 : (api?.scrollSnapList().length ?? 1) - 1)
  }

  const value = useMemo<CarouselContextValue>(
    () => ({
      carouselRef,
      api,
      orientation,
      scrollPrev,
      scrollNext,
      scrollTo,
      canScrollPrev: state.prev,
      canScrollNext: state.next,
      selected: state.selected,
      snapCount: state.snaps,
      selectedSlides: state.slides,
      slideCount: state.count,
      autoplay: { enabled, playing, paused, toggle, progress },
    }),
    [carouselRef, api, orientation, scrollPrev, scrollNext, scrollTo, state, enabled, playing, paused, toggle, progress],
  )

  return (
    <MotionFeatures>
      <CarouselContext.Provider value={value}>
        <div
          role="region"
          aria-roledescription={labels.carousel}
          data-slot="carousel"
          data-orientation={orientation}
          data-reduced-motion={reduced || undefined}
          onKeyDownCapture={handleKeyDown}
          onPointerEnter={enabled ? () => setHolds((h) => ({ ...h, hover: true })) : undefined}
          onPointerLeave={enabled ? () => setHolds((h) => ({ ...h, hover: false })) : undefined}
          onFocus={enabled ? () => setHolds((h) => ({ ...h, focus: true })) : undefined}
          onBlur={
            enabled
              ? (event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHolds((h) => ({ ...h, focus: false }))
                }
              : undefined
          }
          className={cn('relative', className)}
          {...props}
        >
          {children}
          {/* Silent while autoplay rotates, so it doesn't talk over the page every few seconds. */}
          <span aria-live={enabled && playing && !paused ? 'off' : 'polite'} aria-atomic className="sr-only" data-slot="carousel-status">
            {said}
          </span>
        </div>
      </CarouselContext.Provider>
    </MotionFeatures>
  )
}

function CarouselContent({ className, ...props }: ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel()
  return (
    <div ref={carouselRef} className="overflow-hidden own:rounded-[inherit]" data-slot="carousel-content">
      <div
        className={cn('own:flex touch-pan-y', orientation === 'horizontal' ? 'own:-ms-4' : 'own:-mt-4 flex-col touch-pan-x', className)}
        {...props}
      />
    </div>
  )
}

const ItemContext = createContext<{ active: boolean }>({ active: false })

function CarouselItem({ className, ...props }: ComponentProps<'div'>) {
  const { orientation, api, selectedSlides } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(-1)
  useLayoutEffect(() => {
    if (!api) return
    const find = () => setIndex(api.slideNodes().indexOf(ref.current!))
    find()
    api.on('slidesChanged', find)
    return () => {
      api.off('slidesChanged', find)
    }
  }, [api])
  const active = index >= 0 ? selectedSlides.includes(index) : false
  return (
    <ItemContext.Provider value={useMemo(() => ({ active }), [active])}>
      <div
        ref={ref}
        role="group"
        aria-roledescription={labels.slide}
        data-slot="carousel-item"
        data-active={active || undefined}
        className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'ps-4' : 'pt-4', className)}
        {...props}
      />
    </ItemContext.Provider>
  )
}

/** Text over or under a slide that rises into place, on the base token, as its slide arrives. Reduced motion: it is simply there. */
function CarouselCaption({ className, children, ...props }: ComponentProps<'div'>) {
  const { active } = useContext(ItemContext)
  const k = useYouj()
  const shown = active || k.reduced
  return (
    <m.div
      data-slot="carousel-caption"
      initial={false}
      animate={{ opacity: shown ? 1 : 0, y: shown || k.reduced ? 0 : 8 }}
      transition={shown ? { ...k.tween('base', 'enter'), delay: k.stagger('loose') } : k.tween('instant', 'exit')}
      className={className}
      {...(props as ComponentProps<typeof m.div>)}
    >
      {children}
    </m.div>
  )
}

type NavProps = ComponentProps<typeof Button>

function CarouselPrevious({ className, variant = 'outline', size = 'icon-sm', ...props }: NavProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      aria-label={labels.previousSlide}
      className={cn(
        'absolute touch-manipulation own:bg-chrome-float',
        orientation === 'horizontal' ? 'inset-y-0 -start-12 my-auto' : 'start-1/2 -top-12 -translate-x-1/2 rotate-90 rtl:translate-x-1/2',
        className,
      )}
      disabled={!canScrollPrev}
      // Reaching the first slide mustn't drop keyboard focus onto <body>.
      focusableWhenDisabled
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon trigger="none" className="rtl:-scale-x-100" />
    </Button>
  )
}

function CarouselNext({ className, variant = 'outline', size = 'icon-sm', ...props }: NavProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      aria-label={labels.nextSlide}
      className={cn(
        'absolute touch-manipulation own:bg-chrome-float',
        orientation === 'horizontal' ? 'inset-y-0 -end-12 my-auto' : 'start-1/2 -bottom-12 -translate-x-1/2 rotate-90 rtl:translate-x-1/2',
        className,
      )}
      disabled={!canScrollNext}
      focusableWhenDisabled
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon trigger="none" className="rtl:-scale-x-100" />
    </Button>
  )
}

/** One dot per snap, 24px apart so each clears the 24px target minimum; a pill glides to the current one. */
function CarouselDots({ className, 'aria-label': label, ...props }: ComponentProps<'div'>) {
  const { snapCount, selected, scrollTo } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  return (
    <div
      role="group"
      aria-label={label ?? labels.chooseSlide}
      data-slot="carousel-dots"
      className={cn('relative isolate own:flex items-center justify-center gap-4.5 own:py-2', className)}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={labels.slideNumber(i + 1)}
          aria-current={i === selected || undefined}
          onClick={() => scrollTo(i)}
          className={cn(
            'relative size-1.5 shrink-0 rounded-full bg-well outline-none',
            'transition-[background-color] yj-duration-fast ease-standard hover:bg-line-strong',
            'after:absolute after:-inset-2.25 focus-ring',
          )}
        />
      ))}
      <SlidingIndicator className="own:rounded-full own:bg-fg" />
    </div>
  )
}

/** A strip of thumbnails; put one CarouselThumb per slide inside. It scrolls the current thumbnail into view. */
function CarouselThumbs({ className, children, 'aria-label': label, ...props }: ComponentProps<'div'>) {
  const { selected } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  const k = useYouj()
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = strip.current
    const thumb = el?.querySelector<HTMLElement>('[aria-current]')
    if (!el || !thumb) return
    // Only the strip scrolls (scrollIntoView would move the page too). The strip is the thumbs' offsetParent.
    const start = thumb.offsetLeft
    const target = Math.min(Math.max(el.scrollLeft, start + thumb.offsetWidth - el.clientWidth + 4), start - 4)
    if (Math.abs(target - el.scrollLeft) > 1) el.scrollTo({ left: target, behavior: k.reduced ? 'auto' : 'smooth' })
  }, [selected, k.reduced])
  return (
    <div
      ref={strip}
      role="group"
      aria-label={label ?? labels.slideThumbnails}
      data-slot="carousel-thumbs"
      className={cn('relative isolate own:flex gap-2 overflow-x-auto own:p-1 [scrollbar-width:none]', className)}
      {...props}
    >
      {children}
      <SlidingIndicator className="own:rounded-lg own:bg-transparent own:ring-2 ring-focus" />
    </div>
  )
}

interface CarouselThumbProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** The snap this thumbnail shows. */
  index: number
  children: ReactNode
}

function CarouselThumb({ index, className, children, 'aria-label': label, ...props }: CarouselThumbProps) {
  const { selected, scrollTo } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  const current = index === selected
  return (
    <button
      type="button"
      aria-label={label ?? labels.slideNumber(index + 1)}
      aria-current={current || undefined}
      onClick={() => scrollTo(index)}
      data-slot="carousel-thumb"
      className={cn(
        'relative shrink-0 overflow-hidden own:rounded-lg outline-none focus-ring',
        'opacity-55 transition-opacity yj-duration-fast ease-standard hover:opacity-85 aria-[current]:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Play / pause for autoplay, with the dwell drawn as a ring of progress around the icon. Renders nothing without `autoplay`. */
function CarouselAutoplayToggle({ className, variant = 'ghost', size = 'icon-sm', ...props }: NavProps) {
  const { autoplay } = useCarousel()
  const labels = useComponentLabels(carouselLabels)
  if (!autoplay.enabled) return null
  return (
    <Button
      data-slot="carousel-autoplay"
      variant={variant}
      size={size}
      aria-label={autoplay.playing ? labels.pauseSlideRotation : labels.startSlideRotation}
      onClick={autoplay.toggle}
      className={cn('relative', className)}
      {...props}
    >
      {/* Wrapped, so the Button's optical icon insets (meant for icons beside a label) leave these centred. */}
      <span className="own:grid place-items-center">
        <PlayIcon active={autoplay.playing} className="size-3.5" />
      </span>
      {autoplay.playing && (
        <span aria-hidden className="pointer-events-none absolute inset-0.5">
          <svg viewBox="0 0 24 24" className="size-full -rotate-90 rtl:-scale-y-100">
            <circle cx="12" cy="12" r="11" fill="none" strokeWidth="1.25" className="stroke-line" />
            <m.circle
              cx="12"
              cy="12"
              r="11"
              fill="none"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="stroke-fg"
              style={{ pathLength: autoplay.progress }}
            />
          </svg>
        </span>
      )}
    </Button>
  )
}

export {
  type CarouselApi,
  type CarouselOptions,
  type CarouselProps,
  type CarouselThumbProps,
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
  useCarousel,
}
