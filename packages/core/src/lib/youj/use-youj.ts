import { useContext, useMemo, useSyncExternalStore } from 'react'
import type { Transition } from 'motion/react'
import { motionPersonalities, springPhysics, type DurationToken, type EasingToken, type MotionPersonality, type SpringToken, type StaggerToken } from './tokens'
import { MotionContext } from './provider-context'
import { createMediaStore } from './store'

export interface Youj {
  /** True when motion should be replaced by an instant or static alternative. */
  reduced: boolean
  timeScale: number
  /** The theme's motion personality; every token below is valued by it. */
  motionPersonality: MotionPersonality
  /** Scaled duration in seconds (Motion's unit). */
  duration: (token: DurationToken) => number
  /** Scaled duration in milliseconds (for CSS / WAAPI / rAF code). */
  ms: (token: DurationToken) => number
  ease: (token: EasingToken) => [number, number, number, number]
  /** Scaled stagger step in seconds. */
  stagger: (token: StaggerToken) => number
  /** A ready Motion transition from tokens. */
  tween: (duration: DurationToken, ease?: EasingToken) => Transition
  /** A spring transition as physics (stiffness, damping, mass), so a retarget keeps the running velocity. */
  spring: (token: SpringToken) => ReturnType<typeof springPhysics>
}

/* The OS reduced-motion preference, as an external store. A server can't know
 * it, so the server snapshot is false, and React uses that snapshot for the
 * hydration render too: server HTML and the first client render always agree,
 * and hydrated components re-render with the real value straight after.
 * Components mounted later read the real value from their first render. */
const osReduced = createMediaStore('(prefers-reduced-motion: reduce)', false)
const serverOsReduced = () => false

export function useYouj(): Youj {
  const { timeScale, reducedMotion, personality } = useContext(MotionContext)
  const os = useSyncExternalStore(osReduced.subscribe, osReduced.matches, serverOsReduced)
  // 'always' is known on the server, so it applies from the first render.
  const reduced = reducedMotion === 'always' || (reducedMotion === 'user' && os)
  const motionPersonality = personality ?? 'precise'

  return useMemo(() => {
    const { durations, easings, springs, staggers } = motionPersonalities[motionPersonality]
    const ms = (t: DurationToken) => durations[t] * timeScale
    const duration = (t: DurationToken) => ms(t) / 1000
    const ease = (t: EasingToken) => [...easings[t]] as [number, number, number, number]
    return {
      reduced,
      timeScale,
      motionPersonality,
      duration,
      ms,
      ease,
      stagger: (t) => (staggers[t] * timeScale) / 1000,
      tween: (d, e = 'standard') => ({ type: 'tween', duration: duration(d), ease: ease(e) }),
      spring: (t) => springPhysics(springs[t], timeScale),
    }
  }, [reduced, timeScale, motionPersonality])
}
