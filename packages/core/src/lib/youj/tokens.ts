/* The motion contract. Every animated thing in the library reads its timing
 * from here (via useYouj) so the Storybook speed control, reduced-motion
 * setting and the theme's motion personality reach everything. Names are the
 * contract; values may be tuned. */

/** Durations in milliseconds, before time-scaling. */
export const durations = {
  instant: 80,
  fast: 140,
  base: 220,
  slow: 340,
  deliberate: 560,
} as const

/** Cubic-bezier control points. */
export const easings = {
  /** Default for anything moving between two resting states. */
  standard: [0.2, 0, 0, 1],
  /** Elements arriving: decelerate hard into place. */
  enter: [0.16, 1, 0.3, 1],
  /** Elements leaving: accelerate away. */
  exit: [0.4, 0, 1, 1],
  /** Hero moments: a short wind-up, a fast middle, a long precise landing. */
  emphasized: [0.6, 0, 0.1, 1],
  /** Constant-rate loops (spinners, marquees). */
  linear: [0, 0, 1, 1],
} as const

/** Springs expressed as perceived duration (seconds) + bounce, so they scale with time. */
export const springs = {
  /** UI feedback: presses, toggles, icon state flips. */
  snappy: { visualDuration: 0.2, bounce: 0 },
  /** Layout and position changes. */
  smooth: { visualDuration: 0.36, bounce: 0 },
  /** The one allowed overshoot: success and arrival moments. */
  settle: { visualDuration: 0.45, bounce: 0.3 },
} as const

/**
 * A spring token as physics: stiffness and damping from its perceived duration
 * (scaled by `timeScale`) and bounce, by Motion's own conversion, so an
 * uninterrupted spring settles exactly as `{ visualDuration, bounce }` would.
 * Motion drops the inherited velocity of a duration-defined spring; a physical
 * one keeps it, so a retarget mid-flight (a rapid toggle, a pointer sweep)
 * carries on from its speed instead of restarting from rest.
 */
export function springPhysics({ visualDuration, bounce }: { readonly visualDuration: number; readonly bounce: number }, timeScale = 1) {
  const root = (2 * Math.PI) / (Math.max(visualDuration * timeScale, 0.001) * 1.2)
  const stiffness = root * root
  return { type: 'spring' as const, stiffness, damping: 2 * Math.min(Math.max(1 - bounce, 0.05), 1) * root, mass: 1 }
}

/** Stagger step between siblings, in milliseconds. */
export const staggers = {
  tight: 24,
  base: 40,
  loose: 72,
} as const

export type DurationToken = keyof typeof durations
export type EasingToken = keyof typeof easings
export type SpringToken = keyof typeof springs
export type StaggerToken = keyof typeof staggers

/* Motion personalities. A theme picks one; every token above is re-valued by
 * it, in JS (useYouj) and in CSS (youj.css keeps the same numbers under
 * [data-yj-motion]). `precise` is the set above, so its values are the named
 * exports. The token names never change, only what they resolve to. */

export type MotionPersonality = 'precise' | 'calm' | 'lively'

export interface MotionTokens {
  durations: Record<DurationToken, number>
  easings: Record<EasingToken, readonly [number, number, number, number]>
  springs: Record<SpringToken, { readonly visualDuration: number; readonly bounce: number }>
  staggers: Record<StaggerToken, number>
}

export const motionPersonalities: Record<MotionPersonality, MotionTokens> = {
  /** Fast, confident, lands precisely. Overshoot only on `settle`. */
  precise: { durations, easings, springs, staggers },
  /** About 1.4× longer, with gentle curves at both ends and no overshoot anywhere, `settle` included. */
  calm: {
    durations: { instant: 110, fast: 190, base: 300, slow: 460, deliberate: 760 },
    easings: {
      standard: [0.4, 0, 0.2, 1],
      enter: [0.33, 1, 0.68, 1],
      exit: [0.4, 0, 0.6, 1],
      emphasized: [0.65, 0, 0.35, 1],
      linear: [0, 0, 1, 1],
    },
    springs: {
      snappy: { visualDuration: 0.3, bounce: 0 },
      smooth: { visualDuration: 0.5, bounce: 0 },
      settle: { visualDuration: 0.6, bounce: 0 },
    },
    staggers: { tight: 34, base: 56, loose: 100 },
  },
  /** About 15% shorter. Arrivals overshoot by ~3%, and springs keep a little bounce. */
  lively: {
    durations: { instant: 70, fast: 120, base: 190, slow: 290, deliberate: 480 },
    easings: {
      standard: [0.2, 0, 0, 1],
      enter: [0.34, 1.3, 0.64, 1],
      exit: [0.4, 0, 1, 1],
      emphasized: [0.6, 0, 0.2, 1.15],
      linear: [0, 0, 1, 1],
    },
    springs: {
      snappy: { visualDuration: 0.18, bounce: 0.15 },
      smooth: { visualDuration: 0.32, bounce: 0.12 },
      settle: { visualDuration: 0.4, bounce: 0.4 },
    },
    staggers: { tight: 20, base: 32, loose: 56 },
  },
}
