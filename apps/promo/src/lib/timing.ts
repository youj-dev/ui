import { Easing } from 'remotion'
import { spring as motionSpring } from 'motion'
import {
  durations,
  easings,
  springs,
  staggers,
  type DurationToken,
  type EasingToken,
  type SpringToken,
  type StaggerToken,
} from '@youj/core'

/* Choreography on youj's own motion contract. The film's moves (scenes
 * arriving, the camera, the explode) use the same duration, easing, stagger
 * and spring tokens as the components inside them, and the springs come from
 * Motion's own generator, so a `settle` here lands exactly like a `settle`
 * in a component. Everything is a pure function of the frame. */

export { FPS } from '../film/beats'
import { FPS } from '../film/beats'

/** Milliseconds to frames. */
export const frames = (ms: number) => (ms / 1000) * FPS

/** A duration token in frames. */
export const dur = (token: DurationToken) => frames(durations[token])

/** A stagger step in frames. */
export const stagger = (token: StaggerToken) => frames(staggers[token])

const easingCache = new Map<EasingToken, (t: number) => number>()
/** An easing token as a function of 0–1. */
export function ease(token: EasingToken) {
  let fn = easingCache.get(token)
  if (!fn) {
    const [x1, y1, x2, y2] = easings[token]
    fn = Easing.bezier(x1, y1, x2, y2)
    easingCache.set(token, fn)
  }
  return fn
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/**
 * Progress 0 → 1 of a tween that starts at `start` and runs for `length`
 * (a duration token or a number of frames), on an easing token.
 */
export function tween(frame: number, start: number, length: DurationToken | number, easing: EasingToken = 'standard') {
  const span = typeof length === 'number' ? length : dur(length)
  if (span <= 0) return frame >= start ? 1 : 0
  return ease(easing)(clamp01((frame - start) / span))
}

type Generator = { next: (ms: number) => { value: number; done: boolean } }
const springCache = new Map<SpringToken, Generator>()
/**
 * Progress 0 → 1 of a youj spring that starts at `start`. `settle`
 * overshoots (arrivals only); `snappy` and `smooth` land without it.
 */
export function spring(frame: number, start: number, token: SpringToken) {
  if (frame <= start) return 0
  let generator = springCache.get(token)
  if (!generator) {
    const { visualDuration, bounce } = springs[token]
    generator = motionSpring({ keyframes: [0, 1], visualDuration, bounce }) as unknown as Generator
    springCache.set(token, generator)
  }
  const state = generator.next(((frame - start) / FPS) * 1000)
  return state.done ? 1 : state.value
}

/** Linear mix. */
export const mix = (from: number, to: number, t: number) => from + (to - from) * t

/** 1 while `frame` is inside [from, to), easing in and out over `edge` frames. */
export function during(frame: number, from: number, to: number, edge: number, easing: EasingToken = 'standard') {
  return Math.min(tween(frame, from, edge, easing), 1 - tween(frame, to - edge, edge, easing))
}
