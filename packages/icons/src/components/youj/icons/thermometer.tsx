import { m } from 'motion/react'
import { after, createIcon, origin, seq, type IconVariants } from './icon-base'

/* The column runs from the bulb's center (y 17) to the top of the tube
 * (y 6.5); its drawn length is the reading. */
const LOW = 4 / 10.5
/* Degree marks, and how far through the climb the level passes each one. */
const MARKS = [
  { y: 12, at: 0.35 },
  { y: 9, at: 0.6 },
  { y: 6, at: 0.9 },
]

/**
 * Low ↔ high. The bulb flushes and the mercury climbs the tube, nudging each
 * degree mark as it passes; cooling drains it back down. `active` = high.
 */
export const ThermometerIcon = createIcon({
  name: 'thermometer',
  category: 'weather',
  keywords: ['temperature', 'heat', 'hot', 'cold', 'climate', 'thermostat', 'weather'],
  states: ['low', 'high'],
  variants: (k): IconVariants => {
    const lead = k.duration('instant')
    const climb = k.duration('slow')
    return {
      mercury: {
        rest: { pathLength: LOW, transition: k.tween('slow', 'emphasized') },
        active: { pathLength: 1, transition: after(k, lead, 'slow', 'emphasized') },
      },
      bulb: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 1.5, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized']) },
      },
      ...Object.fromEntries(
        MARKS.map(({ at }, i) => [
          `m${i}`,
          {
            rest: { x: 0, transition: k.tween('fast') },
            active: { x: [null, 1, 0], transition: seq(k, 'base', [0, 0.35, 1], ['exit', 'emphasized'], lead + at * climb) },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <path d="M8.5 13.54 V5 A2 2 0 0 1 12.5 5 V13.54 A4 4 0 1 1 8.5 13.54 Z" />
      <m.path d="M10.5 17 V6.5" variants={v.mercury} />
      <m.circle cx="10.5" cy="17" r="1" fill="currentColor" variants={v.bulb} style={origin(10.5, 17)} />
      {MARKS.map(({ y }, i) => (
        <m.path key={y} d={`M15.5 ${y} H17.5`} variants={v[`m${i}`]} />
      ))}
    </>
  ),
})
