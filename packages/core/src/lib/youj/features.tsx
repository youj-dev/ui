'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { LazyMotion, PresenceContext } from 'motion/react'

/* Youj renders Motion's lightweight `m` components, which animate only
 * under a LazyMotion that supplies their features. The features are loaded
 * lazily, in their own chunk, so an app's first load carries none of Motion's
 * animation engine: 'animation' (Motion's domAnimation: animate, exit,
 * variants, hover/tap/focus) for everything, and 'max' (domMax: adds layout
 * animations and drag) only where a component needs them.
 *
 * YoujProvider supplies 'animation' for its whole tree. Every component
 * that renders `m` elements also wraps itself in MotionFeatures, which does
 * nothing under a boundary that already has what it needs, and otherwise
 * opens one: components work without a provider, and a layout component under
 * the provider loads 'max' just for itself. Until a chunk arrives, `m`
 * elements render their initial state; once it lands they animate, and every
 * boundary mounted later gets the loaded bundle synchronously. */

export type MotionFeatureSet = 'animation' | 'max'

type Bundle = Exclude<ComponentProps<typeof LazyMotion>['features'], () => unknown>

const loaded: Partial<Record<MotionFeatureSet, Bundle>> = {}

const load = {
  animation: () => import('./features-animation').then((mod) => (loaded.animation = mod.default)),
  max: () => import('./features-max').then((mod) => (loaded.max = mod.default)),
}

/** The loaded bundle when there is one (max covers animation), else its loader. */
function bundle(set: MotionFeatureSet) {
  if (set === 'animation') return loaded.max ?? loaded.animation ?? load.animation
  return loaded.max ?? load.max
}

const LEVEL: Record<MotionFeatureSet, number> = { animation: 1, max: 2 }

/** Whether motion is on here. YoujProvider's `motion={false}` turns it off: no boundary loads a chunk and `m` elements render statically (see provider.tsx). */
export const MotionEnabledContext = createContext(true)

/** The richest feature set an ancestor boundary supplies: 0 none, 1 animation, 2 max. */
const FeaturesContext = createContext(0)

export interface MotionFeaturesProps {
  /** 'max' adds layout animations and drag. Default 'animation'. */
  features?: MotionFeatureSet
  children: ReactNode
}

/**
 * Supplies Motion's animation features to the `m` elements inside it, loaded
 * lazily, unless a boundary above (YoujProvider, or another MotionFeatures)
 * already does. Wrap anything that renders `m` components.
 */
export function MotionFeatures({ features = 'animation', children }: MotionFeaturesProps) {
  const have = useContext(FeaturesContext)
  const enabled = useContext(MotionEnabledContext)
  const need = LEVEL[features]
  if (!enabled || have >= need) return children
  return (
    <FeaturesContext.Provider value={need}>
      <LazyMotion features={bundle(features)}>{children}</LazyMotion>
    </FeaturesContext.Provider>
  )
}

/** Starts loading a feature set now, say on route prefetch, so the first animation doesn't wait for it. */
export function preloadMotionFeatures(features: MotionFeatureSet = 'animation'): Promise<unknown> {
  // Not for an app with `motion={false}`: it never loads them, so don't call this there.
  const ready = bundle(features)
  return typeof ready === 'function' ? ready() : Promise.resolve(ready)
}

/**
 * Put this inside the child of an `AnimatePresence initial={false}`, below its
 * own `m` element (whose first animation should stay skipped), around content
 * that may hold `m` elements.
 *
 * Motion skips the first animation of every `m` element under such a child,
 * counted from when the element's visual element is created. Under lazy
 * features that is when the chunk arrives, so a change made in between (state
 * set in a mount effect: a Counter's first play, an element scrolled into
 * view) is swallowed and the element stays where it started. If the features
 * hadn't loaded when this first rendered, it stops the skip once mounted, so
 * elements created when they land animate to where they should be. With the
 * features loaded already it does nothing.
 */
export function PresenceSettled({ features = 'animation', children }: MotionFeaturesProps) {
  const presence = useContext(PresenceContext)
  const [late] = useState(() => typeof bundle(features) === 'function')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (late) setMounted(true)
  }, [late])
  const value = useMemo(
    () => (late && mounted && presence?.initial === false ? { ...presence, initial: undefined } : presence),
    [late, mounted, presence],
  )
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}
