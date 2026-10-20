import {
  durations,
  easings,
  motionPersonalities,
  springs,
  staggers,
  type DurationToken,
  type EasingToken,
  type MotionPersonality,
  type SpringToken,
  type StaggerToken,
} from '@youj/core/lib/youj/tokens'
import type { StaggerOrder } from '@youj/motion'

/* The playground's state, and its link. Every choice that changes what's on
 * the stage is in the query string, so a view is shareable; defaults are left
 * out, so a plain /docs/motion/playground stays plain. A token travels by
 * name, custom values as numbers: `spring=0.5,0.2`, `duration=300`,
 * `ease=0.3,0,0.2,1`. The viewer's own speed stays out of links. */

export const TABS = ['springs', 'tweens', 'stagger', 'personalities', 'presence', 'reduced'] as const
export type PlaygroundTab = (typeof TABS)[number]

export type Bezier = [number, number, number, number]
export interface SpringValues {
  /** Seconds, before the time scale. */
  visualDuration: number
  bounce: number
}

export const SPRING_TOKENS = Object.keys(springs) as SpringToken[]
export const DURATION_TOKENS = Object.keys(durations) as DurationToken[]
/** Linear is for loops; a tween between two states never wants it. */
export const EASE_TOKENS = (Object.keys(easings) as EasingToken[]).filter((e) => e !== 'linear')
export const STAGGER_TOKENS = Object.keys(staggers) as StaggerToken[]
export const ORDERS: StaggerOrder[] = ['start', 'end', 'center', 'random']
export const VARIANTS = ['rise', 'fade', 'scale', 'blur-in'] as const
export type StaggerVariant = (typeof VARIANTS)[number]
export const MOMENTS = ['glide', 'arrival', 'enter', 'exit'] as const
export type Moment = (typeof MOMENTS)[number]
export const PRESETS = ['yj-pop', 'yj-dialog', 'yj-sheet-end', 'yj-toast'] as const
export type Preset = (typeof PRESETS)[number]
export const INTERACTIONS = ['insert', 'tabs', 'save', 'menu'] as const
export type Interaction = (typeof INTERACTIONS)[number]

export interface PlaygroundState {
  tab: PlaygroundTab
  spring: SpringToken | 'custom'
  /** The sliders' values while `spring` is custom (kept when a token is picked, so Custom brings them back). */
  springCustom: SpringValues
  duration: DurationToken | 'custom'
  /** Milliseconds, before the time scale. */
  durationCustom: number
  ease: EasingToken | 'custom'
  easeCustom: Bezier
  stagger: StaggerToken
  order: StaggerOrder
  variant: StaggerVariant
  moment: Moment
  preset: Preset
  interaction: Interaction
}

export const DEFAULT_STATE: PlaygroundState = {
  tab: 'springs',
  spring: 'smooth',
  springCustom: { visualDuration: 0.5, bounce: 0.2 },
  duration: 'base',
  durationCustom: 300,
  ease: 'enter',
  easeCustom: [0.3, 0, 0.2, 1],
  stagger: 'base',
  order: 'start',
  variant: 'rise',
  moment: 'glide',
  preset: 'yj-pop',
  interaction: 'insert',
}

/** The sliders' ranges. Links outside them are clamped. */
export const SPRING_RANGE = { visualDuration: [0.1, 1.2], bounce: [0, 0.8] } as const
export const DURATION_RANGE = [40, 1000] as const
export const BEZIER_Y_RANGE = [-0.5, 1.5] as const

const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, value))
/** Rounds away float noise, so 0.30000000000000004 reads and compares as 0.3. */
export const round = (value: number, places = 2) => Math.round(value * 10 ** places) / 10 ** places

const oneOf = <T extends string>(options: readonly T[], value: string | null, fallback: T): T =>
  value !== null && (options as readonly string[]).includes(value) ? (value as T) : fallback

/** Comma-separated finite numbers, exactly `count` of them, or null. */
function numbers(value: string | null, count: number): number[] | null {
  if (!value) return null
  const parts = value.split(',')
  if (parts.length !== count || parts.some((p) => p.trim() === '')) return null
  const list = parts.map(Number)
  return list.every(Number.isFinite) ? list : null
}

/** The token whose values these are in `personality`, if any. */
export function springTokenFor(values: SpringValues, personality: MotionPersonality = 'precise'): SpringToken | null {
  const table = motionPersonalities[personality].springs
  return SPRING_TOKENS.find((t) => round(table[t].visualDuration) === round(values.visualDuration) && round(table[t].bounce) === round(values.bounce)) ?? null
}

export function durationTokenFor(ms: number, personality: MotionPersonality = 'precise'): DurationToken | null {
  const table = motionPersonalities[personality].durations
  return DURATION_TOKENS.find((t) => table[t] === Math.round(ms)) ?? null
}

export function easeTokenFor(curve: Bezier, personality: MotionPersonality = 'precise'): EasingToken | null {
  const table = motionPersonalities[personality].easings
  return EASE_TOKENS.find((t) => table[t].every((v, i) => round(v) === round(curve[i]!))) ?? null
}

export function parseState(search: string): PlaygroundState {
  const p = new URLSearchParams(search)
  const d = DEFAULT_STATE
  const state: PlaygroundState = { ...d, springCustom: { ...d.springCustom }, easeCustom: [...d.easeCustom] }
  state.tab = oneOf(TABS, p.get('tab'), d.tab)

  const spring = p.get('spring')
  const springValues = numbers(spring, 2)
  if (springValues) {
    state.spring = 'custom'
    state.springCustom = {
      visualDuration: round(clamp(springValues[0]!, SPRING_RANGE.visualDuration)),
      bounce: round(clamp(springValues[1]!, SPRING_RANGE.bounce)),
    }
  } else state.spring = oneOf(SPRING_TOKENS, spring, d.spring)

  const duration = p.get('duration')
  if (duration !== null && /^\d{1,4}$/.test(duration)) {
    state.duration = 'custom'
    state.durationCustom = clamp(Number(duration), DURATION_RANGE)
  } else state.duration = oneOf(DURATION_TOKENS, duration, d.duration)

  const ease = p.get('ease')
  const curve = numbers(ease, 4)
  if (curve) {
    state.ease = 'custom'
    state.easeCustom = [
      round(clamp(curve[0]!, [0, 1])),
      round(clamp(curve[1]!, BEZIER_Y_RANGE)),
      round(clamp(curve[2]!, [0, 1])),
      round(clamp(curve[3]!, BEZIER_Y_RANGE)),
    ]
  } else state.ease = oneOf(EASE_TOKENS, ease, d.ease)

  state.stagger = oneOf(STAGGER_TOKENS, p.get('stagger'), d.stagger)
  state.order = oneOf(ORDERS, p.get('order'), d.order)
  state.variant = oneOf(VARIANTS, p.get('variant'), d.variant)
  state.moment = oneOf(MOMENTS, p.get('moment'), d.moment)
  state.preset = oneOf(PRESETS, p.get('preset'), d.preset)
  state.interaction = oneOf(INTERACTIONS, p.get('interaction'), d.interaction)
  return state
}

export function serializeState(state: PlaygroundState): string {
  const d = DEFAULT_STATE
  const p = new URLSearchParams()
  if (state.tab !== d.tab) p.set('tab', state.tab)
  if (state.spring === 'custom') p.set('spring', `${round(state.springCustom.visualDuration)},${round(state.springCustom.bounce)}`)
  else if (state.spring !== d.spring) p.set('spring', state.spring)
  if (state.duration === 'custom') p.set('duration', String(Math.round(state.durationCustom)))
  else if (state.duration !== d.duration) p.set('duration', state.duration)
  if (state.ease === 'custom') p.set('ease', state.easeCustom.map((v) => round(v)).join(','))
  else if (state.ease !== d.ease) p.set('ease', state.ease)
  if (state.stagger !== d.stagger) p.set('stagger', state.stagger)
  if (state.order !== d.order) p.set('order', state.order)
  if (state.variant !== d.variant) p.set('variant', state.variant)
  if (state.moment !== d.moment) p.set('moment', state.moment)
  if (state.preset !== d.preset) p.set('preset', state.preset)
  if (state.interaction !== d.interaction) p.set('interaction', state.interaction)
  // Numbers read as written: 0.5,0.2, not 0.5%2C0.2.
  return p.toString().replace(/%2C/gi, ',')
}

/** The spring in effect: a token's values in this personality, or the custom ones. */
export function springValues(state: Pick<PlaygroundState, 'spring' | 'springCustom'>, personality: MotionPersonality): SpringValues {
  return state.spring === 'custom' ? state.springCustom : { ...motionPersonalities[personality].springs[state.spring] }
}

/** The tween in effect, in milliseconds and control points. */
export function tweenValues(state: Pick<PlaygroundState, 'duration' | 'durationCustom' | 'ease' | 'easeCustom'>, personality: MotionPersonality) {
  const tokens = motionPersonalities[personality]
  return {
    ms: state.duration === 'custom' ? state.durationCustom : tokens.durations[state.duration],
    curve: (state.ease === 'custom' ? state.easeCustom : [...tokens.easings[state.ease]]) as Bezier,
  }
}

/** The nearest spring token to custom values, measured in felt duration first and bounce second. */
export function nearestSpring(values: SpringValues, personality: MotionPersonality): SpringToken {
  const table = motionPersonalities[personality].springs
  const distance = (t: SpringToken) => Math.abs(table[t].visualDuration - values.visualDuration) / 0.2 + Math.abs(table[t].bounce - values.bounce) / 0.3
  return SPRING_TOKENS.reduce((best, t) => (distance(t) < distance(best) ? t : best))
}

/** The nearest duration token, on the scale's own (geometric) steps. */
export function nearestDuration(ms: number, personality: MotionPersonality): DurationToken {
  const table = motionPersonalities[personality].durations
  const distance = (t: DurationToken) => Math.abs(Math.log(table[t] / Math.max(ms, 1)))
  return DURATION_TOKENS.reduce((best, t) => (distance(t) < distance(best) ? t : best))
}
