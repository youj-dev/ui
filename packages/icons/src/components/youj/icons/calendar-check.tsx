import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, type IconVariants } from './icon-base'

const CHECK = 'M8.5 15 L11 17.5 L16 12.5'
/* Each day dot, where it lands on the check, and how far along the stroke that
 * point is, so it can hand over to the pen as the check is drawn through it. */
const DOTS: { from: [number, number]; to: [number, number]; along: number }[] = [
  { from: [8, 14], to: [8.5, 15], along: 0 },
  { from: [12, 14], to: [12.67, 15.83], along: 0.56 },
  { from: [16, 14], to: [16, 12.5], along: 1 },
  { from: [8, 17.5], to: [9.75, 16.25], along: 0.17 },
  { from: [12, 17.5], to: [11, 17.5], along: 0.33 },
  { from: [16, 17.5], to: [14.33, 14.17], along: 0.78 },
]

/**
 * Open → booked. The day dots slide into line and a check is drawn through
 * them; unbooking breaks the check back into days that return to the grid.
 * `active` = booked.
 */
export const CalendarCheckIcon = createIcon({
  name: 'calendar-check',
  category: 'time',
  keywords: ['booked', 'scheduled', 'confirmed', 'event', 'rsvp', 'appointment', 'date'],
  states: ['open', 'booked'],
  variants: (k): IconVariants => {
    const gather = k.duration('base')
    const pen = k.duration('slow')
    const dots: IconVariants = Object.fromEntries(
      DOTS.map(({ from, to, along }, i) => [
        `d${i}`,
        {
          rest: {
            x: 0,
            y: 0,
            opacity: 1,
            transition: { x: after(k, k.duration('fast'), 'base'), y: after(k, k.duration('fast'), 'base'), opacity: k.tween('instant', 'linear') },
          },
          active: {
            x: to[0] - from[0],
            y: to[1] - from[1],
            opacity: 0,
            transition: { x: k.tween('base', 'emphasized'), y: k.tween('base', 'emphasized'), opacity: after(k, gather + along * pen * 0.6, 'instant', 'linear') },
          },
        },
      ]),
    )
    return { ...dots, check: { rest: drawOut(k, 'fast'), active: drawn(k, 'slow', gather) } }
  },
  render: (v) => (
    <>
      <path d="M3 10 V7 A2 2 0 0 1 5 5 H19 A2 2 0 0 1 21 7 V10 H3" />
      <path d="M3 10 V19 A2 2 0 0 0 5 21 H19 A2 2 0 0 0 21 19 V10" />
      <path d="M8 3 V7" />
      <path d="M16 3 V7" />
      {DOTS.map(({ from: [x, y] }, i) => (
        <m.path key={i} d={`M${x} ${y} h.01`} strokeWidth={2} variants={v[`d${i}`]} />
      ))}
      <m.path d={CHECK} variants={v.check} />
    </>
  ),
})
