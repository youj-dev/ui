import { createContext, useContext, useRef, type ReactNode } from 'react'
import { AnimatePresence, m, useIsPresent, type HTMLMotionProps, type Transition, type Variants } from 'motion/react'
import { useDirection, useYouj, type Youj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures, PresenceSettled } from '@youj/core/lib/youj/features'

/* Route transitions. Pages stack in one grid cell so outgoing and incoming
 * pages can overlap without absolute positioning or measuring.
 *   fade-through  out fast, in slightly later with a 2% scale-up (Material-style hand-off)
 *   slide         a push: both pages travel together; direction flips on "back"
 *   clip-reveal   the new page wipes in over the old (up for forward, down for back)
 *   curtain       a solid panel sweeps across, the page swaps while covered, then it sweeps away
 * Reduced motion: every variant becomes a short opacity crossfade, no travel.
 * Shared elements only fly under fade-through: when the page itself travels
 * (slide, clip-reveal, curtain) a flying element doubles the motion and the
 * two copies visibly disagree, so they render in place instead. */

export type PageVariant = 'fade-through' | 'slide' | 'clip-reveal' | 'curtain'
export type PageDirection = 'forward' | 'back'

export interface PageTransitionProps {
  /** Changing this key transitions to the new children. Usually the route path. */
  routeKey: string
  children: ReactNode
  /** Default 'fade-through'. */
  variant?: PageVariant
  /** Navigation direction; flips slide / clip-reveal / curtain. Forward travels toward the reading start, so slide and curtain mirror under RTL. Default 'forward'. */
  direction?: PageDirection
  /** Classes for the curtain panel. Default 'bg-accent'. */
  curtainClassName?: string
  className?: string
}

const INSTANT: Transition = { type: false }

const SharedEnabled = createContext(true)

/** `flip` is −1 under RTL: the horizontal variants mirror. */
function variantsFor(variant: PageVariant, k: Youj, flip: number): Variants {
  if (k.reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: k.tween('fast') },
      exit: { opacity: 0, transition: k.tween('fast') },
    }
  }
  switch (variant) {
    case 'fade-through':
      return {
        enter: { opacity: 0, scale: 0.98 },
        center: {
          opacity: 1,
          scale: 1,
          transition: { opacity: { ...k.tween('base', 'enter'), delay: k.duration('instant') }, scale: k.spring('smooth') },
        },
        exit: { opacity: 0, transition: k.tween('fast', 'exit') },
      }
    case 'slide':
      return {
        enter: (d: number) => ({ x: `${d * flip * 100}%` }),
        center: { x: '0%', transition: k.spring('smooth') },
        exit: (d: number) => ({ x: `${d * flip * -100}%`, transition: k.spring('smooth') }),
      }
    case 'clip-reveal':
      return {
        enter: (d: number) => ({ clipPath: d > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', y: d * 32 }),
        center: {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          transition: { clipPath: k.tween('slow', 'emphasized'), y: k.tween('deliberate', 'emphasized') },
        },
        exit: (d: number) => ({ opacity: 0.4, y: d * -16, transition: { ...k.tween('slow', 'standard'), opacity: k.tween('slow', 'exit') } }),
      }
    case 'curtain':
      // Out after the curtain covers, in instantly underneath it.
      return {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: INSTANT },
        exit: { opacity: 0, transition: { type: false, delay: k.duration('slow') } },
      }
  }
}

export function PageTransition({
  routeKey,
  children,
  variant = 'fade-through',
  direction = 'forward',
  curtainClassName,
  className,
}: PageTransitionProps) {
  const k = useYouj()
  const d = direction === 'forward' ? 1 : -1
  const flip = useDirection() === 'rtl' ? -1 : 1
  const variants = variantsFor(variant, k, flip)
  // The curtain runs on every navigation after the first render, including a return to the first route.
  const firstKey = useRef(routeKey)
  const navigated = useRef(false)
  if (routeKey !== firstKey.current) navigated.current = true
  const curtain = variant === 'curtain' && !k.reduced && navigated.current
  const curtainEases = [k.ease('emphasized'), k.ease('linear'), k.ease('standard')]

  return (
    <MotionFeatures>
      <SharedEnabled.Provider value={variant === 'fade-through'}>
        <div className={cn('relative grid overflow-hidden', className)}>
          <AnimatePresence initial={false} custom={d} mode={variant === 'curtain' && !k.reduced ? 'wait' : 'sync'}>
            <Page key={routeKey} custom={d} variants={variants} initial="enter" animate="center" exit="exit">
              <PresenceSettled>{children}</PresenceSettled>
            </Page>
          </AnimatePresence>
          {curtain && (
            <m.div
              key={routeKey}
              aria-hidden
              className={cn('pointer-events-none absolute inset-0 z-10 bg-accent', curtainClassName)}
              initial={{ x: `${d * flip * -101}%` }}
              animate={{ x: [`${d * flip * -101}%`, '0%', '0%', `${d * flip * 101}%`] }}
              transition={{
                duration: k.duration('slow') * 2 + k.duration('instant'),
                times: [0, 0.45, 0.55, 1],
                ease: curtainEases,
              }}
            />
          )}
        </div>
      </SharedEnabled.Provider>
    </MotionFeatures>
  )
}

/** The incoming page paints above the outgoing one while both are present; the outgoing one is inert, so it can't be tabbed into or clicked. */
function Page(props: HTMLMotionProps<'div'>) {
  const present = useIsPresent()
  return <m.div {...props} inert={!present || undefined} className="min-w-0 [grid-area:1/1]" style={{ zIndex: present ? 1 : 0 }} />
}

export interface SharedElementProps extends HTMLMotionProps<'div'> {
  /** Matching names on two pages morph into each other across a PageTransition. */
  name: string
}

/** Shared-element helper: the same `name` on the outgoing and incoming page flies between their positions (fade-through only). */
export function SharedElement({ name, transition, ...rest }: SharedElementProps) {
  const k = useYouj()
  const enabled = useContext(SharedEnabled)
  return <MotionFeatures features="max"><m.div layoutId={enabled ? name : undefined} transition={transition ?? (k.reduced ? INSTANT : k.spring('smooth'))} {...rest} /></MotionFeatures>
}
