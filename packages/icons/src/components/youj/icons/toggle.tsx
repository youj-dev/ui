import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The knob is a capsule of six cubics (two half circles and two straights).
 * At rest the straights have zero length, so it is a circle; mid-throw the
 * leading end reaches the far side first and the knob stretches between
 * both stops before the trailing end catches up. */
const OFF = 'M8 9 C9.66 9 11 10.34 11 12 C11 13.66 9.66 15 8 15 C8 15 8 15 8 15 C6.34 15 5 13.66 5 12 C5 10.34 6.34 9 8 9 C8 9 8 9 8 9 Z'
const STRETCH = 'M16 9 C17.66 9 19 10.34 19 12 C19 13.66 17.66 15 16 15 C13.33 15 10.67 15 8 15 C6.34 15 5 13.66 5 12 C5 10.34 6.34 9 8 9 C10.67 9 13.33 9 16 9 Z'
const ON = 'M16 9 C17.66 9 19 10.34 19 12 C19 13.66 17.66 15 16 15 C16 15 16 15 16 15 C14.34 15 13 13.66 13 12 C13 10.34 14.34 9 16 9 C16 9 16 9 16 9 Z'

/**
 * Off ↔ on. The knob stretches across the track like a drop of mercury,
 * its far end arriving first, then gathers itself at the other stop and
 * fills; switching off drains it and throws it back the same way.
 * `active` = on.
 */
export const ToggleIcon = createIcon({
  name: 'toggle',
  category: 'system',
  keywords: ['switch', 'toggle', 'on', 'off', 'enable', 'disable', 'setting', 'preference'],
  states: ['off', 'on'],
  variants: (k) => {
    const throwTo = (to: string) => ({ d: [null, STRETCH, to], transition: seq(k, 'slow', [0, 0.45, 1], ['exit', 'emphasized']) })
    return {
      knob: { rest: throwTo(OFF), active: throwTo(ON) },
      fill: {
        rest: { ...throwTo(OFF), opacity: 0, transition: { ...throwTo(OFF).transition, opacity: k.tween('fast', 'exit') } },
        active: { ...throwTo(ON), opacity: 1, transition: { ...throwTo(ON).transition, opacity: { ...k.tween('base'), delay: k.duration('slow') * 0.6 } } },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="6.5" width="19" height="11" rx="5.5" />
      <m.path d={OFF} fill="currentColor" stroke="none" variants={v.fill} />
      <m.path d={OFF} variants={v.knob} />
    </>
  ),
})
