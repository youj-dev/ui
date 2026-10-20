'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { useSoundCue } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* Base UI tabs with a kinetic indicator. The selected tab is marked by a
 * motion SlidingIndicator that glides between tabs on the `smooth` spring
 * (transform-only, retargets mid-glide, jumps under reduced motion):
 * - `underline`: plain labels on the list's hairline, the selected one in full
 *   ink over a 2px accent bar (on the start edge when vertical).
 * - `pill`: a raised key in a recessed track.
 * Arrow keys move between tabs and select them (activateOnFocus), Home/End
 * jump, focus loops. A long horizontal list scrolls: its edges fade by how
 * far there is to go, chevrons appear for pointer users, and a newly selected
 * tab is scrolled into view. `inset` keeps a list that spans its container
 * (its hairline a full-bleed divider) on the content's inset; see TabsListProps. The incoming panel fades in with a 4px drift
 * from the side the selection moved to, while the panel area springs from the
 * old panel's height to the new one's (`smooth`), so what sits below glides
 * instead of jumping; the outgoing panel is pinned where it was, inert, and
 * fades out in place on the instant token. Reduced motion swaps at once.
 * With sound on, a selection sounds as the indicator sets off. */

type TabsVariant = 'underline' | 'pill'
type TabsOrientation = 'horizontal' | 'vertical'

const TabsOrientationContext = createContext<TabsOrientation>('horizontal')
/** The panel these tabs show now, so the next one can take over its place and height. */
const TabsShownPanelContext = createContext<RefObject<HTMLElement | null> | null>(null)
const TabsVariantContext = createContext<TabsVariant>('underline')

interface TabsProps extends TabsPrimitive.Root.Props {
  /** With sound on (`YoujProvider`’s `sound`), choosing a tab plays `select`. `false` keeps these tabs silent. Default true. */
  sound?: boolean
}

function Tabs({ className, orientation = 'horizontal', sound = true, onValueChange, ...props }: TabsProps) {
  const direction = useDirection()
  const cue = useSoundCue()
  const shown = useRef<HTMLElement | null>(null)
  return (
    <TabsShownPanelContext.Provider value={shown}>
      <TabsOrientationContext.Provider value={orientation}>
        <DirectionProvider direction={direction}>
          <TabsPrimitive.Root
            data-slot="tabs"
            orientation={orientation}
            onValueChange={(value, details) => {
              onValueChange?.(value, details)
              // Only a person's choice sounds, not a fallback when the selected tab goes away.
              if (sound && details.reason === 'none' && !details.isCanceled) cue('select')
            }}
            className={cn('group/tabs own:flex own:min-w-0 own:gap-[calc(var(--spacing)*(3_-_var(--ui--compact,0)))] data-[orientation=horizontal]:flex-col', className)}
            {...props}
          />
        </DirectionProvider>
      </TabsOrientationContext.Provider>
    </TabsShownPanelContext.Provider>
  )
}

/** Scroll-linked edge state of a horizontal scroller: how far there is to go on each side, in px. */
function useScrollEdges(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [edges, setEdges] = useState({ start: 0, end: 0, overflow: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let raf = 0
    const measure = () => {
      raf = 0
      const max = Math.max(el.scrollWidth - el.clientWidth, 0)
      // RTL scrollers count scrollLeft down from 0 to -max.
      const start = Math.min(Math.abs(el.scrollLeft), max)
      const next = { start, end: max - start, overflow: max > 1 }
      setEdges((prev) =>
        prev.overflow === next.overflow && Math.abs(prev.start - next.start) < 1 && Math.abs(prev.end - next.end) < 1 ? prev : next,
      )
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    el.addEventListener('scroll', schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(el)
    for (const child of Array.from(el.children)) resize.observe(child)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', schedule)
      resize.disconnect()
    }
  }, [ref, enabled])
  return edges
}

/** Width of the edge fade, and the clearance kept around a tab scrolled into view. */
const FADE = 24

interface TabsListProps extends TabsPrimitive.List.Props {
  /** Default 'underline'. */
  variant?: TabsVariant
  /** Selection follows focus as the arrow keys move. Default true: these panels show without latency (APG). */
  activateOnFocus?: boolean
  /**
   * For a horizontal list that spans its container, edge to edge: keep the
   * tabs on the content's inset, `--tabs-inset` (set it on the list; default
   * the card's `--card-spacing`, else 1rem). Underline tabs line their labels
   * up with it and their hairline still spans; a track (pill tabs) lines
   * its edge up with it.
   */
  inset?: boolean
}

function TabsList({ className, variant = 'underline', activateOnFocus = true, inset = false, children, style, ...props }: TabsListProps) {
  const k = useYouj()
  const orientation = useContext(TabsOrientationContext)
  const horizontal = orientation === 'horizontal'
  const ref = useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(ref, horizontal)
  const rtl = useDirection() === 'rtl'

  // Keep the selected tab in view when the selection moves (a click on a
  // half-hidden tab, or a controlled change). Never on mount: that would
  // scroll the page to the tabs.
  useEffect(() => {
    const list = ref.current
    if (!list || !horizontal) return
    const observer = new MutationObserver(() => {
      const active = list.querySelector<HTMLElement>('[role=tab][data-active]')
      if (!active || list.scrollWidth <= list.clientWidth) return
      const l = list.getBoundingClientRect()
      const t = active.getBoundingClientRect()
      const pad = FADE + 8
      const delta = t.left - pad < l.left ? t.left - pad - l.left : t.right + pad > l.right ? t.right + pad - l.right : 0
      if (Math.abs(delta) >= 1) list.scrollBy({ left: delta, behavior: k.reduced ? 'auto' : 'smooth' })
    })
    observer.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-active'] })
    return () => observer.disconnect()
  }, [k.reduced, horizontal])

  const scroll = (side: 'start' | 'end') => {
    const list = ref.current
    if (!list) return
    const step = list.clientWidth * 0.8 * (side === 'end' ? 1 : -1) * (rtl ? -1 : 1)
    list.scrollBy({ left: step, behavior: k.reduced ? 'auto' : 'smooth' })
  }

  // Fade each edge by how far there is to scroll on that side, so the mask
  // grows with the scroll instead of switching on.
  const left = Math.min(rtl ? edges.end : edges.start, FADE)
  const right = Math.min(rtl ? edges.start : edges.end, FADE)
  const mask = edges.overflow
    ? `linear-gradient(to right, transparent, black ${left}px, black calc(100% - ${right}px), transparent)`
    : undefined

  return (
    <TabsVariantContext.Provider value={variant}>
      <div
        data-slot="tabs-list-frame"
        data-variant={variant}
        data-orientation={orientation}
        className={cn(
          'relative own:flex min-w-0',
          'data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col',
          // Underline tabs sit on a line of the theme's stroke that spans the frame.
          'own:data-[variant=underline]:data-[orientation=horizontal]:shadow-[inset_0_calc(-1*var(--yj-stroke-width,1px))_0_var(--color-line)]',
          'data-[variant=underline]:data-[orientation=vertical]:border-s data-[variant=underline]:data-[orientation=vertical]:border-line',
        )}
      >
        <TabsPrimitive.List
          ref={ref}
          data-slot="tabs-list"
          data-variant={variant}
          data-overflow-start={edges.start > 1 || undefined}
          data-overflow-end={edges.end > 1 || undefined}
          data-reduced-motion={k.reduced || undefined}
          data-inset={(inset && horizontal) || undefined}
          activateOnFocus={activateOnFocus}
          className={cn(
            'relative isolate own:flex own:min-w-0 own:text-fg-muted',
            // Horizontal lists scroll when they run out of room; no scrollbar.
            horizontal ? 'overflow-x-auto [scrollbar-width:none] own:[&::-webkit-scrollbar]:hidden' : 'flex-col',
            variant === 'underline' && (horizontal ? 'own:items-stretch own:gap-1' : 'own:gap-0.5 own:ps-1.5'),
            variant === 'pill' && ['own:gap-0.5 own:rounded-choice own:[--ui--choice-inset:2px] own:p-(--ui--choice-inset)', horizontal ? 'own:h-control own:w-fit own:max-w-full own:bg-well' : ''],
            // The inset, resolved once (Bezel reads it too). A label sits a
            // tab's padding in from its tab, so the underline list pads by the
            // rest; a track moves in whole.
            inset &&
              horizontal && [
                '[--tabs-inset-x:var(--tabs-inset,var(--card-spacing,--spacing(4)))]',
                variant === 'underline' ? 'own:px-[max(0px,var(--tabs-inset-x)_-_--spacing(3))]' : 'own:mx-(--tabs-inset-x)',
              ],
            className,
          )}
          style={{ maskImage: mask, WebkitMaskImage: mask, ...style }}
          {...props}
        >
          {children}
          {variant === 'underline' &&
            (horizontal ? (
              <SlidingIndicator data-slot="tabs-indicator" variant="underline" className="own:bg-accent" />
            ) : (
              // Vertical: the bar stands on the start edge, over the hairline.
              <SlidingIndicator
                data-slot="tabs-indicator"
                className="own:bg-transparent before:absolute before:inset-y-1.5 before:-start-[calc(var(--spacing)*1.875)] before:w-0.5 own:before:rounded-full own:before:bg-accent"
              />
            ))}
          {variant === 'pill' && (
            <SlidingIndicator
              data-slot="tabs-indicator"
              // Inside the track: soft elevation only. In light the white key holds 3:1 against the track on its edge (ui.css --ui--key-edge).
              className={
                horizontal
                  ? 'own:rounded-choice-key own:bg-key own:shadow-sm-soft own:inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--key-edge)'
                  : 'own:rounded-md own:bg-selected'
              }
            />
          )}
        </TabsPrimitive.List>
        {edges.overflow &&
          (['start', 'end'] as const).map((side) => {
            const visible = side === 'start' ? edges.start > 1 : edges.end > 1
            return (
              // A pointer affordance only: keyboard users arrow through the
              // tabs, and the focused tab scrolls itself into view.
              <button
                key={side}
                type="button"
                tabIndex={-1}
                aria-hidden
                data-slot="tabs-scroll-button"
                data-side={side}
                data-visible={visible || undefined}
                onClick={() => scroll(side)}
                className={cn(
                  'absolute top-1/2 z-10 own:grid own:size-6 own:touch:yj-hit -translate-y-1/2 own:place-items-center own:rounded-md border border-line own:bg-overlay own:text-fg-muted own:shadow-xs',
                  'transition-[opacity,color,background-color] yj-duration-fast ease-standard own:hover:bg-hover hover:text-fg',
                  'pointer-events-none opacity-0 data-visible:pointer-events-auto data-visible:opacity-100',
                  side === 'start' ? 'start-1' : 'end-1',
                  '[&_svg]:size-3.5 rtl:[&_svg]:-scale-x-100',
                )}
              >
                {side === 'start' ? <ChevronLeftIcon trigger="none" /> : <ChevronRightIcon trigger="none" />}
              </button>
            )
          })}
      </div>
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const variant = useContext(TabsVariantContext)
  const horizontal = useContext(TabsOrientationContext) === 'horizontal'
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-variant={variant}
      className={cn(
        'relative own:inline-flex shrink-0 own:items-center own:gap-1.5 own:rounded-md own:text-ui font-medium whitespace-nowrap select-none',
        'transition-colors yj-duration-fast ease-standard hover:text-fg own:data-active:text-fg',
        // Not outline-none: in Tailwind v4 it zeroes the outline style the ring needs.
        'own:focus-visible:outline-2 own:focus-visible:outline-solid own:focus-visible:outline-focus',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        horizontal ? 'justify-center' : 'justify-start',
        // Underline: a full-height tab, so the bar sits on its bottom edge.
        // The ring is drawn inside the tab, so the scroller never clips it.
        variant === 'underline' && (horizontal ? 'own:h-control-lg own:px-3 own:focus-visible:-outline-offset-2' : 'own:h-control own:px-2.5 own:focus-visible:-outline-offset-2'),
        // Pill: a key filling the track; the ring fits in the track's padding.
        variant === 'pill' && (horizontal ? 'own:h-full own:rounded-choice-key own:px-2.5 own:focus-visible:outline-offset-0' : 'own:h-control own:px-2.5 own:focus-visible:-outline-offset-2'),
        // The track's padding and a bezel's shorter key stay in the target.
        horizontal && 'own:touch:yj-hit',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, render, ...props }: TabsPrimitive.Panel.Props) {
  const k = useYouj()
  const shown = useContext(TabsShownPanelContext)
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'own:min-w-0 flex-1 own:rounded-md own:text-ui own:focus-ring',
        // Arrives with a 4px drift from the side the selection moved to. The
        // outgoing panel is pinned over its old place (TabsPane) and fades
        // there; under reduced motion it leaves at once (Base UI keeps it
        // mounted for a frame, and it must not take up room meanwhile).
        'transition-[opacity,translate] yj-duration-base ease-enter data-starting-style:opacity-0',
        'data-ending-style:opacity-0 data-ending-style:yj-duration-instant data-ending-style:ease-standard own:reduced:data-ending-style:hidden',
        'data-[activation-direction=right]:data-starting-style:translate-x-1 data-[activation-direction=left]:data-starting-style:-translate-x-1',
        'data-[activation-direction=down]:data-starting-style:translate-y-1 data-[activation-direction=up]:data-starting-style:-translate-y-1',
        className,
      )}
      // A panel with a render of its own keeps it, without the height morph.
      render={
        render ??
        ((panelProps, state) => (
          <TabsPane {...panelProps} open={!state.hidden && state.transitionStatus !== 'ending'} shown={shown} reduced={k.reduced} spring={k.spring('smooth')} />
        ))
      }
      {...props}
    />
  )
}

const morphs = new WeakMap<HTMLElement, AnimationPlaybackControls>()

interface TabsPaneProps extends ComponentProps<'div'> {
  open: boolean
  shown: RefObject<HTMLElement | null> | null
  reduced: boolean
  spring: ReturnType<ReturnType<typeof useYouj>['spring']>
}

/* Where a panel takes over from the one shown before it. Both are siblings in
 * the tabs' flow, so with the newcomer out of flow for a moment the old panel
 * measures exactly where and how big it was; it's then pinned there (absolute,
 * out of flow, hidden from assistive tech) to fade, and the newcomer's height
 * springs from the old height to its own, then lets go of it. A switch
 * mid-morph starts from the height it has reached. */
function TabsPane({ open, shown, reduced, spring, ref: forwarded, ...props }: TabsPaneProps) {
  const own = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const el = own.current
    if (!el || !open || !shown) return
    release(el)
    const prev = shown.current
    shown.current = el
    if (reduced || !prev || prev === el || !prev.isConnected || prev.parentElement !== el.parentElement) return
    morphs.get(prev)?.stop()
    el.style.display = 'none'
    const from = { top: prev.offsetTop, left: prev.offsetLeft, width: prev.offsetWidth, height: prev.offsetHeight }
    Object.assign(prev.style, { position: 'absolute', top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`, margin: '0', pointerEvents: 'none' })
    prev.setAttribute('aria-hidden', 'true')
    el.style.display = ''
    const to = el.offsetHeight
    if (Math.abs(to - from.height) < 1) return
    // Held at the old height from this first paint; the spring takes it from there.
    Object.assign(el.style, { height: `${from.height}px`, flexBasis: 'auto', overflow: 'clip' })
    const controls = animate(el, { height: [from.height, to] }, spring)
    morphs.set(el, controls)
    controls.then(() => {
      if (morphs.get(el) === controls) settle(el)
    })
  }, [open, shown, reduced, spring])

  useEffect(() => {
    const el = own.current
    return () => {
      if (el) morphs.get(el)?.stop()
    }
  }, [])

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      own.current = node
      if (typeof forwarded === 'function') forwarded(node)
      else if (forwarded) forwarded.current = node
    },
    [forwarded],
  )

  return <div {...props} ref={ref} />
}

/** A morph is done: the panel takes its natural height again. */
function settle(el: HTMLElement) {
  morphs.delete(el)
  Object.assign(el.style, { height: '', flexBasis: '', overflow: '' })
}

/** A kept-mounted panel shown again drops the pin it faded out under. */
function release(el: HTMLElement) {
  if (el.style.position !== 'absolute') return
  Object.assign(el.style, { position: '', top: '', left: '', width: '', height: '', margin: '', pointerEvents: '' })
  el.removeAttribute('aria-hidden')
}

export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsListProps, type TabsProps }
