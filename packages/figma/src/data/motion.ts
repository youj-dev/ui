import type { ThemeInput } from '@youj/core/lib/youj/theme'
import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { springAt } from '@youj/core/docs/lib/curves'
import type { KitMotion, Personality } from '../kit'

/* The motion tokens, for documentation: Figma can't animate them, so the kit
 * carries the numbers and the curves' shapes, and the motion stays in code. The
 * usage lines are the ones the Storybook Motion page shows. */

const USAGE: KitMotion['usage'] = {
  durations: {
    instant: 'Hover tints, press states, focus rings',
    fast: 'Icon flips, tooltips, small toggles',
    base: 'The default: menus, popovers, small moves',
    slow: 'Panels, sheets, larger layout moves',
    deliberate: 'Hero moments and page choreography',
  },
  easings: {
    standard: 'Between two resting states. The default.',
    enter: 'Arrivals. Full speed at once, long precise landing.',
    exit: 'Departures. Accelerates away, commits.',
    emphasized: 'Hero moves. Wind-up, whip, long landing.',
    linear: 'Constant rate: spinners, marquees, progress.',
  },
  springs: {
    snappy: 'Presses, toggles, icon state flips',
    smooth: 'Layout and position changes',
    settle: 'Success and arrival. The only overshoot.',
  },
  staggers: {
    tight: 'Dense lists: rows, menu items',
    base: 'The default step between siblings',
    loose: 'Hero sequences and feature grids',
  },
}

/** Samples per spring curve; the plot spans 1.6 × the visual duration, long enough to show the settle. */
const SAMPLES = 64
export const SPRING_SPAN = 1.6

export function kitMotion(themes: readonly ThemeInput[]): KitMotion {
  const personalities = Object.fromEntries(
    (Object.keys(motionPersonalities) as MotionPersonality[]).map((p) => {
      const t = motionPersonalities[p]
      return [
        p,
        {
          durations: { ...t.durations },
          easings: Object.fromEntries(Object.entries(t.easings).map(([k, v]) => [k, [...v]])),
          springs: Object.fromEntries(Object.entries(t.springs).map(([k, v]) => [k, { ...v }])),
          staggers: { ...t.staggers },
        },
      ]
    }),
  ) as unknown as KitMotion['personalities']

  const springCurves = Object.fromEntries(
    (Object.keys(personalities) as Personality[]).map((p) => [
      p,
      Object.fromEntries(
        Object.entries(personalities[p].springs).map(([name, shape]) => {
          const span = shape.visualDuration * SPRING_SPAN
          const points = Array.from({ length: SAMPLES + 1 }, (_, i) => Math.round(springAt(shape, (i / SAMPLES) * span) * 10000) / 10000)
          return [name, points]
        }),
      ),
    ]),
  ) as KitMotion['springCurves']

  return {
    personalities,
    themes: Object.fromEntries(themes.map((t) => [t.id!, t.motionPersonality ?? 'precise'])),
    usage: USAGE,
    springCurves,
  }
}
