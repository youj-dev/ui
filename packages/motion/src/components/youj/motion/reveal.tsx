'use client'

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import { m, useInView, type HTMLMotionProps, type TargetAndTransition, type Variants } from 'motion/react'
import { useYouj, type Youj } from '@youj/core/lib/youj/provider'
import type { DurationToken, EasingToken, StaggerToken } from '@youj/core/lib/youj/tokens'
import { useSettledEntrances } from './settled'
import { MotionFeatures } from '@youj/core/lib/youj/features'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import type { InView } from '@youj/core/lib/youj/vocabulary'

export type RevealVariant =
  | 'fade'
  | 'rise'
  | 'blur-in'
  | 'scale'
  | 'wipe-up'
  | 'wipe-down'
  | 'wipe-left'
  | 'wipe-right'

export const revealVariantNames: RevealVariant[] = [
  'fade',
  'rise',
  'blur-in',
  'scale',
  'wipe-up',
  'wipe-down',
  'wipe-left',
  'wipe-right',
]

/* Wipes grow from the named edge: wipe-up reveals bottom to top. */
const HIDDEN_CLIP = {
  'wipe-up': 'inset(100% 0% 0% 0%)',
  'wipe-down': 'inset(0% 0% 100% 0%)',
  'wipe-left': 'inset(0% 0% 0% 100%)',
  'wipe-right': 'inset(0% 100% 0% 0%)',
} as const
const SHOWN_CLIP = 'inset(0% 0% 0% 0%)'

/* Arrivals decelerate hard (enter); wipes and blurs get the longer 'deliberate' duration. */
const DEFAULT_TIMING: Record<RevealVariant, [DurationToken, EasingToken]> = {
  fade: ['slow', 'standard'],
  rise: ['slow', 'enter'],
  'blur-in': ['deliberate', 'enter'],
  scale: ['slow', 'enter'],
  'wipe-up': ['deliberate', 'enter'],
  'wipe-down': ['deliberate', 'enter'],
  'wipe-left': ['deliberate', 'enter'],
  'wipe-right': ['deliberate', 'enter'],
}

export interface RevealMotionOptions {
  variant: RevealVariant
  /** Travel for `rise` (px or any CSS length, e.g. '110%' for masked lines). Default 12. */
  distance?: number | string
  duration?: DurationToken
  ease?: EasingToken
}

/**
 * Variants shared by Reveal, Stagger and TextSplit. `shown` is a function of
 * `custom` (the delay in seconds) so a parent can orchestrate many children.
 */
export function revealVariants(k: Youj, { variant, distance = 12, duration, ease }: RevealMotionOptions): Variants {
  const [d, e] = DEFAULT_TIMING[variant]
  const enter = k.tween(duration ?? d, ease ?? e)
  const leave = k.tween('fast', 'exit')

  let hidden: TargetAndTransition
  let shown: TargetAndTransition
  switch (variant) {
    case 'fade':
      hidden = { opacity: 0 }
      shown = { opacity: 1 }
      break
    case 'rise':
      hidden = { opacity: 0, y: distance }
      shown = { opacity: 1, y: 0 }
      break
    case 'blur-in':
      hidden = { opacity: 0, filter: 'blur(8px)' }
      // No filter at rest: blur(0px) can keep a layer that softens the text.
      shown = { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }
      break
    case 'scale':
      hidden = { opacity: 0, scale: 0.94 }
      shown = { opacity: 1, scale: 1 }
      break
    default:
      hidden = { clipPath: HIDDEN_CLIP[variant] }
      shown = { clipPath: SHOWN_CLIP }
  }

  return {
    hidden: { ...hidden, transition: leave },
    shown: (delay: number = 0) => ({ ...shown, transition: { ...enter, delay } }),
  }
}

/** Set by Stagger around each child. Reveal reads it instead of its own trigger. */
export const StaggerItemContext = createContext<{ visible: boolean; delay: number } | null>(null)

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>

export type RevealTag =
  | 'div'
  | 'span'
  | 'section'
  | 'article'
  | 'header'
  | 'footer'
  | 'li'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'figure'

export interface RevealProps
  extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'animate' | 'exit' | 'custom' | 'children'> {
  as?: RevealTag
  variant?: RevealVariant
  /** When it plays: `false` on mount; `true` (the default) when scrolled into view, once, at 30% visible; or `{ once, amount, margin }`. */
  inView?: InView
  /** Delay as a multiple of the `delayStep` stagger token. `delay={2}` = two steps. */
  delay?: number
  delayStep?: StaggerToken
  duration?: DurationToken
  ease?: EasingToken
  /** Travel for `rise` (px or any CSS length, e.g. '110%' for masked lines). Default 12. */
  distance?: number | string
  children?: ReactNode
}

/**
 * Enters on mount or when scrolled into view. Inside AnimatePresence it also
 * exits. With reduced motion it renders in its final state.
 */
export function Reveal({
  as = 'div',
  variant = 'rise',
  inView: inViewProp,
  delay = 0,
  delayStep = 'base',
  duration,
  ease,
  distance,
  children,
  ...rest
}: RevealProps) {
  const k = useYouj()
  const settled = useSettledEntrances()
  const item = useContext(StaggerItemContext)
  const ref = useRef<HTMLDivElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.3 })
  const inView = useInView(ref, { once: when.once, amount: when.amount, margin: when.margin as InViewOptions['margin'] })
  const variants = useMemo(
    () => revealVariants(k, { variant, distance, duration, ease }),
    [k, variant, distance, duration, ease],
  )

  const visible = k.reduced || settled || (item ? item.visible : !when.onView || inView)
  const custom = (item?.delay ?? 0) + delay * k.stagger(delayStep)
  const Tag = m[as] as typeof m.div

  return (
    <MotionFeatures>
      <Tag
        ref={ref}
        {...rest}
        variants={variants}
        custom={custom}
        initial={k.reduced || settled ? false : 'hidden'}
        animate={visible ? 'shown' : 'hidden'}
        exit={k.reduced ? undefined : 'hidden'}
      >
        <StaggerItemContext.Provider value={null}>{children}</StaggerItemContext.Provider>
      </Tag>
    </MotionFeatures>
  )
}
