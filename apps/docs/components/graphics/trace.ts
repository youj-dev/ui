import { cubicBezier, spring } from 'motion/react'
import { motionPersonalities, type DurationToken, type EasingToken, type MotionPersonality, type SpringToken } from '@youj/core'

/* Motion drawn the way animators chart it. A curve is a motion's progress
 * over time, read straight from the tokens (the theme's personality
 * included); sampled at equal time steps, its values are the "spacing":
 * ticks bunch where the motion is slow and spread where it's fast. The
 * curves hold the tokens' own timing, before Speed: a chart is the same at
 * any playback speed. */

export interface Curve {
  /** Length of the motion in ms (a spring's is the time it takes to settle). */
  duration: number
  /** Progress at `ms`: 0 at the start, 1 at rest (a spring may overshoot on the way). */
  at: (ms: number) => number
  /** The token spelled for a label, e.g. "spring.smooth" or "slow · enter". */
  name: string
  /** The token's own length in ms, as a label quotes it: a spring's perceived duration, a tween's duration. */
  token: number
}

/** One tick per this many ms of motion time: two frames at 60 fps. */
export const TICK_MS = 1000 / 30

export function tweenCurve(personality: MotionPersonality, duration: DurationToken, ease: EasingToken): Curve {
  const tokens = motionPersonalities[personality]
  const ms = tokens.durations[duration]
  const fn = cubicBezier(...tokens.easings[ease])
  return { duration: ms, at: (t) => (t <= 0 ? 0 : t >= ms ? 1 : fn(t / ms)), name: `${duration} · ${ease}`, token: ms }
}

export function springCurve(personality: MotionPersonality, token: SpringToken): Curve {
  const { visualDuration, bounce } = motionPersonalities[personality].springs[token]
  const gen = spring({ keyframes: [0, 1], visualDuration, bounce })
  // Landed: from here on it stays within half a percent of rest (the chart's last tick). Capped at 3 s.
  const step = 1000 / 120
  let settle = 3000
  for (let t = 3000; t >= 0; t -= step) {
    if (Math.abs(1 - gen.next(t).value) > 0.005) break
    settle = t
  }
  return {
    duration: Math.round(settle),
    at: (t) => (t <= 0 ? 0 : t >= settle ? 1 : gen.next(t).value),
    name: `spring.${token}`,
    token: Math.round(visualDuration * 1000),
  }
}

/** Progress at every tick from the start to the end of the motion, both included. */
export function spacing(curve: Curve, step = TICK_MS): number[] {
  const out: number[] = []
  for (let t = 0; t < curve.duration; t += step) out.push(curve.at(t))
  out.push(1)
  return out
}

/** SVG path data for a polyline. */
export function polyline(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
}
