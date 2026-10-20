import { m } from 'motion/react'
import { after, createIcon, origin } from './icon-base'

/* sparkles' four-point star: each quarter one cubic from tip to tip, its
 * controls drawn in toward the center. On, the controls move out, so the
 * same four cubics swell into a fuller star. */
const SLIM = 'M11 4.5 C11.53 10.34 13.66 12.47 19.5 13 C13.66 13.53 11.53 15.66 11 21.5 C10.47 15.66 8.34 13.53 2.5 13 C8.34 12.47 10.47 10.34 11 4.5 Z'
const FULL = 'M11 4.5 C12.19 9.43 14.57 11.81 19.5 13 C14.57 14.19 12.19 16.57 11 21.5 C9.81 16.57 7.43 14.19 2.5 13 C7.43 11.81 9.81 9.43 11 4.5 Z'
const MINI = 'M18.5 2.5 C18.69 4.56 19.44 5.31 21.5 5.5 C19.44 5.69 18.69 6.44 18.5 8.5 C18.31 6.44 17.56 5.69 15.5 5.5 C17.56 5.31 18.31 4.56 18.5 2.5 Z'

/**
 * Off ↔ on, for AI features and smart modes. The star twirls a quarter turn
 * as it swells and fills, and a small companion star pops in beside it with
 * a settle; switching off deflates it and lets the companion go.
 * `active` = on.
 */
export const SparkleIcon = createIcon({
  name: 'sparkle',
  category: 'ai',
  keywords: ['ai', 'magic', 'smart', 'assistant', 'generate', 'new', 'star', 'copilot'],
  states: ['off', 'on'],
  variants: (k) => {
    const swell = (d: string, rotate: number) => ({ d, rotate, transition: k.tween('slow', 'emphasized') })
    return {
      star: { rest: swell(SLIM, 0), active: swell(FULL, 90) },
      fill: {
        rest: { ...swell(SLIM, 0), opacity: 0, transition: { ...k.tween('slow', 'emphasized'), opacity: k.tween('fast', 'exit') } },
        active: { ...swell(FULL, 90), opacity: 1, transition: { ...k.tween('slow', 'emphasized'), opacity: after(k, k.duration('base'), 'base') } },
      },
      mini: {
        rest: { scale: 0, rotate: -45, transition: k.tween('fast', 'exit') },
        active: { scale: 1, rotate: 0, transition: { ...k.spring('settle'), delay: k.duration('base') } },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={SLIM} fill="currentColor" stroke="none" variants={v.fill} style={origin(11, 13)} />
      <m.path d={SLIM} variants={v.star} style={origin(11, 13)} />
      <m.path d={MINI} variants={v.mini} style={origin(18.5, 5.5)} />
    </>
  ),
})
