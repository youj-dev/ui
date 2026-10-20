'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { animate, m, useInView, useMotionValue, type AnimationPlaybackControls } from 'motion/react'
import { MotionFeatures, useDirection, usePortalContainer, useYouj, useYoujScope } from '@youj/core'
import { tourLabels, useComponentLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { Button } from './button'

/* Guided coach-marks: a dim scrim with a rounded cut-out over one element at
 * a time, and a card beside it with the step's title, text, the count and
 * Back / Next / Done. The cut-out takes the target's own corner radius plus
 * `spotlightPadding`.
 * - Motion: between steps the cut-out glides from where it was to the next
 *   target on the smooth spring, tracking the target live while the page
 *   scrolls it into view; the card's content fades in at its new place (the
 *   fast token). The scrim fades in and out with the overlays' yj-backdrop and
 *   the card opens with yj-pop. Reduced motion: the cut-out moves at once and
 *   the scroll is instant; only the card's content fades.
 * - Layout: the scrim is one element clipped by an even-odd path, so the hole
 *   is genuinely empty: with `allowInteraction` a click there reaches the
 *   target. Scroll, resize and the target's own size changes repaint it in the
 *   next frame. The card is a Base UI popover anchored to the target, so it
 *   flips and shifts to stay on screen and follows the target as it scrolls.
 * - Access: the card is a dialog named by the step's title and described by
 *   its text plus a keyboard hint; focus moves into it (to Next) and is trapped
 *   while the tour runs (released with `allowInteraction`, so the target can be
 *   used). The arrow keys go Back and Next (mirrored in RTL), Escape skips when
 *   `dismissible`, each step change is announced politely, and the target is
 *   described by the step's text while it is spotlighted. A step whose target
 *   is missing or hidden is skipped in the direction of travel. */

type TourPlacement = 'top' | 'bottom' | 'inline-start' | 'inline-end'

interface TourStep {
  /** The element to spotlight: a CSS selector (the first match in the document) or a ref. */
  target: string | RefObject<HTMLElement | null>
  title: ReactNode
  body?: ReactNode
  /** Where the card sits, from the target. It flips when there is no room. Default `bottom`. */
  placement?: TourPlacement
  /** Extra content under the text: a link, an image, a button that does the thing. */
  action?: ReactNode
}

interface TourProps {
  steps: TourStep[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Controlled step index. */
  step?: number
  defaultStep?: number
  onStepChange?: (step: number) => void
  /** Runs when Done is pressed on the last step (or Next runs past the last step that can be shown). */
  onComplete?: () => void
  /** Runs when the tour is left early, by Skip or Escape, with the step it was on. */
  onSkip?: (step: number) => void
  /** Clicks reach the spotlighted element, and focus is not trapped in the card, so the target can be used. Default false. */
  allowInteraction?: boolean
  /** Skip and Escape end the tour. With false the only ways out are Done and your own controls. Default true. */
  dismissible?: boolean
  /** Room around the target inside the cut-out, in px. Default 6. */
  spotlightPadding?: number
  /**
   * Where the scrim and card render. Default: the provider's portal container,
   * else `document.body`. An element of your own keeps the tour inside it; it
   * must be a positioning context for `fixed` children (give it a `transform`
   * or `contain: paint`).
   */
  container?: HTMLElement | null
  /** The card's classes. */
  className?: string
}

const isUsable = (el: HTMLElement | null): el is HTMLElement =>
  !!el?.isConnected && (typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true)

function resolveTarget(target: TourStep['target'] | undefined): HTMLElement | null {
  if (!target || typeof document === 'undefined') return null
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target.current
  return isUsable(el) ? el : null
}

interface Hole {
  x: number
  y: number
  w: number
  h: number
  r: number
}

const mix = (a: Hole, b: Hole, t: number): Hole => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  r: a.r + (b.r - a.r) * t,
})

const n = (v: number) => Math.round(v * 10) / 10

/** The scrim's outline: the whole box, then the rounded hole, filled even-odd so the hole stays empty. */
function scrimPath(width: number, height: number, { x, y, w, h, r }: Hole) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  const arc = `A${n(rr)},${n(rr)} 0 0 1`
  return (
    `M0,0H${n(width)}V${n(height)}H0Z` +
    `M${n(x + rr)},${n(y)}H${n(x + w - rr)}${arc} ${n(x + w)},${n(y + rr)}V${n(y + h - rr)}${arc} ${n(x + w - rr)},${n(y + h)}` +
    `H${n(x + rr)}${arc} ${n(x)},${n(y + h - rr)}V${n(y + rr)}${arc} ${n(x + rr)},${n(y)}Z`
  )
}

function Tour({
  steps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  onComplete,
  onSkip,
  allowInteraction = false,
  dismissible = true,
  spotlightPadding = 6,
  container,
  className,
}: TourProps) {
  const k = useYouj()
  const direction = useDirection()
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  const labels = useComponentLabels(tourLabels)
  const [open, setOpen] = useControllableState(openProp, defaultOpen)
  const [index, setIndex] = useControllableState(stepProp, defaultStep)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [scrim, setScrim] = useState<HTMLDivElement | null>(null)
  const ring = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const travel = useRef<1 | -1>(1)
  const shown = useRef<Hole | null>(null)
  const from = useRef<Hole | null>(null)
  const glide = useRef<AnimationPlaybackControls | null>(null)
  const progress = useMotionValue(1)
  const { politeRef, announce } = useLiveRegion()
  const bodyId = useId()
  const total = steps.length
  const current = steps[index]

  const close = useCallback(() => {
    setOpen(false)
    onOpenChange?.(false)
  }, [setOpen, onOpenChange])

  /** The first step from `start`, moving in `dir`, whose target is on the page: -1 or `total` when there is none. */
  const find = useCallback(
    (start: number, dir: 1 | -1) => {
      let i = start
      while (i >= 0 && i < total && !resolveTarget(steps[i]?.target)) i += dir
      return i
    },
    [total, steps],
  )

  const show = useCallback(
    (i: number) => {
      if (i === index) return
      setIndex(i)
      onStepChange?.(i)
    },
    [index, setIndex, onStepChange],
  )

  // A tour with nothing left to show only closes; one that showed something is complete.
  const finish = useCallback(() => {
    const showed = shown.current !== null
    close()
    if (showed) onComplete?.()
  }, [close, onComplete])

  const go = useCallback(
    (start: number, dir: 1 | -1) => {
      travel.current = dir
      const i = find(start, dir)
      if (i >= total) finish()
      else if (i >= 0) show(i)
    },
    [find, total, finish, show],
  )

  const skip = useCallback(() => {
    close()
    onSkip?.(index)
  }, [close, onSkip, index])

  // Resolve the step's target. A missing one is skipped in the direction of
  // travel (or forward when nothing is left behind it). Opening starts afresh,
  // and an uncontrolled tour starts again from `defaultStep`.
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    const opening = open && !wasOpen.current
    wasOpen.current = open
    if (!open) return
    if (opening) {
      shown.current = null
      from.current = null
      travel.current = 1
      if (stepProp === undefined && index !== defaultStep) {
        setIndex(defaultStep)
        return
      }
    }
    const el = resolveTarget(current?.target)
    if (el) return setTarget(el)
    const ahead = find(index, travel.current)
    if (ahead >= 0 && ahead < total) return show(ahead)
    const after = travel.current === -1 ? find(index, 1) : total
    if (after < total) show(after)
    else finish()
  }, [open, current, index, stepProp, defaultStep, setIndex, find, total, show, finish])

  // Bring the target into view when it isn't, centered so the card has room.
  useEffect(() => {
    if (!open || !target) return
    const rect = target.getBoundingClientRect()
    const fits = rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
    if (!fits) target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: k.reduced ? 'instant' : 'smooth' })
  }, [open, target, k.reduced])

  // Paint the cut-out: from where it was toward the target's live box, `progress` of the way.
  const paint = useCallback(() => {
    if (!scrim || !target) return
    const box = scrim.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0
    const pad = spotlightPadding
    const live: Hole = { x: rect.left - box.left - pad, y: rect.top - box.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2, r: radius + pad }
    const hole = from.current ? mix(from.current, live, progress.get()) : live
    shown.current = hole
    scrim.style.clipPath = `path(evenodd, '${scrimPath(box.width, box.height, hole)}')`
    const outline = ring.current
    if (outline) {
      outline.style.left = '0px'
      outline.style.transform = `translate(${n(hole.x)}px, ${n(hole.y)}px)`
      outline.style.width = `${n(hole.w)}px`
      outline.style.height = `${n(hole.h)}px`
      outline.style.borderRadius = `${n(Math.min(hole.r, hole.w / 2, hole.h / 2))}px`
    }
  }, [scrim, target, spotlightPadding, progress])

  // A new target: glide from the hole on screen (none on the first step, or with reduced motion).
  useLayoutEffect(() => {
    if (!target) return
    glide.current?.stop()
    if (shown.current && !k.reduced) {
      from.current = shown.current
      progress.jump(0)
      glide.current = animate(progress, 1, k.spring('smooth'))
    } else {
      from.current = null
      progress.jump(1)
    }
  }, [target, k, progress])

  useLayoutEffect(() => {
    if (!scrim || !target) return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(paint)
    }
    paint()
    const stop = progress.on('change', paint)
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(target)
    observer?.observe(scrim)
    return () => {
      cancelAnimationFrame(frame)
      stop()
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      observer?.disconnect()
    }
  }, [scrim, target, paint, progress])

  // The spotlighted element is described by the step's text.
  useEffect(() => {
    if (!open || !target) return
    const before = target.getAttribute('aria-describedby')
    target.setAttribute('aria-describedby', before ? `${before} ${bodyId}` : bodyId)
    return () => {
      if (before === null) target.removeAttribute('aria-describedby')
      else target.setAttribute('aria-describedby', before)
    }
  }, [open, target, bodyId])

  // Announce each step after the first, and keep focus in the card when its button goes away.
  const announced = useRef(false)
  useEffect(() => {
    if (!open || !target || !current) {
      announced.current = false
      return
    }
    if (announced.current) {
      const title = typeof current.title === 'string' ? current.title : (popup.current?.querySelector('[data-slot="tour-title"]')?.textContent ?? '')
      announce(labels.tourStepAnnounce(index + 1, total, title))
    }
    announced.current = true
    if (popup.current && !popup.current.contains(document.activeElement)) primary.current?.focus()
  }, [open, target, current, index, total, announce, labels])

  if (!current) return null
  const last = index === total - 1
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const field = (event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')
    if (field || event.altKey || event.metaKey || event.ctrlKey) return
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) {
      event.preventDefault()
      if (!last) go(index + 1, 1)
    } else if (event.key === backward) {
      event.preventDefault()
      go(index - 1, -1)
    }
  }

  return (
    <DirectionProvider direction={direction}>
      <PopoverPrimitive.Root
        open={open && target !== null}
        modal={allowInteraction ? false : 'trap-focus'}
        onOpenChange={(next, details) => {
          // Only Escape closes from inside Base UI; clicks outside the card never end a tour.
          if (!next && details.reason === 'escape-key' && dismissible) skip()
        }}
      >
        <PopoverPrimitive.Portal container={container ?? portalContainer} {...scope}>
          {!allowInteraction && <div data-slot="tour-blocker" aria-hidden className="fixed inset-0 z-50" />}
          <PopoverPrimitive.Backdrop
            ref={setScrim}
            data-slot="tour-scrim"
            className="yj-backdrop fixed inset-0 z-50 own:bg-scrim"
          >
            <div ref={ring} data-slot="tour-spotlight" aria-hidden className="pointer-events-none absolute top-0 own:ring-2 ring-accent" />
          </PopoverPrimitive.Backdrop>
          <PopoverPrimitive.Positioner
            anchor={target}
            side={current.placement ?? 'bottom'}
            align="center"
            sideOffset={spotlightPadding + 10}
            collisionPadding={12}
            className="isolate z-50 outline-none"
          >
            <PopoverPrimitive.Popup
              ref={popup}
              initialFocus={primary}
              data-slot="tour"
              data-yj-tone="overlay"
              onKeyDown={onKeyDown}
              className={cn(
                'yj-pop flex w-80 max-w-(--available-width) flex-col gap-3 own:rounded-xl border own:border-line own:bg-overlay own:p-4 text-ui own:text-fg own:shadow-md outline-none',
                className,
              )}
            >
              <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
              <MotionFeatures>
                <m.div
                  key={index}
                  initial={{ opacity: 0, y: k.reduced ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={k.tween('fast', 'enter')}
                  className="flex flex-col gap-1.5"
                >
                  <div className="own:flex items-center justify-between gap-2">
                    <span data-slot="tour-count" className="own:text-ui-sm own:text-fg-subtle own:tabular-nums">
                      {labels.tourStepOf(index + 1, total)}
                    </span>
                    {dismissible && !last && (
                      <Button variant="ghost" size="xs" className="-me-2 own:text-fg-muted" onClick={skip}>
                        {labels.skip}
                      </Button>
                    )}
                  </div>
                  <PopoverPrimitive.Title data-slot="tour-title" className="own:text-ui-lg own:font-semibold own:tracking-tight own:text-fg">
                    {current.title}
                  </PopoverPrimitive.Title>
                  <PopoverPrimitive.Description id={bodyId} data-slot="tour-body" className="own:text-ui own:text-fg-muted">
                    {current.body}
                    <span className="sr-only"> {labels.tourHint}</span>
                  </PopoverPrimitive.Description>
                  {current.action && <div className="pt-1.5">{current.action}</div>}
                </m.div>
              </MotionFeatures>
              <div className="own:flex items-center justify-between gap-3 pt-1">
                <div data-slot="tour-dots" aria-hidden className="own:flex items-center gap-1">
                  {steps.map((s, i) => (
                    <span
                      key={typeof s.target === 'string' ? `${s.target}-${i}` : i}
                      data-state={i === index ? 'active' : 'inactive'}
                      className="h-1.5 w-1.5 rounded-full bg-line-strong transition-[width,background-color] yj-duration-base ease-standard data-[state=active]:w-4 data-[state=active]:bg-accent"
                    />
                  ))}
                </div>
                <div className="own:flex items-center gap-2">
                  {index > 0 && (
                    <Button variant="outline" size="sm" onClick={() => go(index - 1, -1)}>
                      {labels.back}
                    </Button>
                  )}
                  <Button ref={primary} size="sm" onClick={() => (last ? go(total, 1) : go(index + 1, 1))}>
                    {last ? labels.done : labels.next}
                  </Button>
                </div>
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </DirectionProvider>
  )
}

interface TourBeaconProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** The button's accessible name. Default: the `tourStart` label ("Start the tour"). */
  label?: string
}

/* A small pulsing dot that starts a tour or marks something new. A ring
 * swells out of the accent dot and fades, on a deliberate beat, only while
 * the beacon is on screen. Reduced motion: the ring rests half-out, still. */
function TourBeacon({ label, className, ref, ...props }: TourBeaconProps) {
  const k = useYouj()
  const labels = useComponentLabels(tourLabels)
  const self = useRef<HTMLButtonElement | null>(null)
  const inView = useInView(self)
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      self.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const pulsing = inView && !k.reduced
  // One beat: the deliberate token three times over, so the ring reads as calm.
  const pulse = { ...k.tween('deliberate', 'exit'), duration: k.duration('deliberate') * 3 }
  return (
    <button
      ref={setRef}
      type="button"
      data-slot="tour-beacon"
      aria-label={label ?? labels.tourStart}
      className={cn('focus-ring relative own:inline-grid size-5 shrink-0 place-items-center own:rounded-full', className)}
      {...props}
    >
      <MotionFeatures>
        <m.span
          aria-hidden
          className="col-start-1 row-start-1 size-2.5 rounded-full bg-accent"
          initial={false}
          animate={pulsing ? { scale: [1, 2.6], opacity: [0.5, 0] } : { scale: 1.8, opacity: 0.3 }}
          transition={pulsing ? { ...pulse, repeat: Number.POSITIVE_INFINITY } : k.tween('instant')}
        />
      </MotionFeatures>
      <span aria-hidden className="col-start-1 row-start-1 size-2.5 rounded-full bg-accent" />
    </button>
  )
}

export { Tour, TourBeacon }
export type { TourBeaconProps, TourPlacement, TourProps, TourStep }
