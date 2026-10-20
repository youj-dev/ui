import { m } from 'motion/react'
import { createIcon, after, drawIn, drawOut, origin, type IconVariants } from './icon-base'

/* Legs are drawn from the body outward, so shortening them curls them in. */
const LEGS = ['M8 11 L5.5 8.5', 'M8 13.5 H4.5', 'M8 16 L5.5 18.5', 'M16 11 L18.5 8.5', 'M16 13.5 H19.5', 'M16 16 L18.5 18.5']

/**
 * Bug ↔ fixed. The legs curl in, the antennae droop, and a slash is struck
 * through with a matching gap cut behind it. Reopening plays it back.
 * `active` = fixed.
 */
export const BugIcon = createIcon({
  name: 'bug',
  category: 'development',
  keywords: ['issue', 'debug', 'error', 'defect', 'fixed', 'beetle', 'qa'],
  states: ['bug', 'fixed'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const legs: IconVariants = Object.fromEntries(
      LEGS.map((_, i) => [
        `l${i}`,
        {
          rest: { pathLength: 1, transition: after(k, k.duration('fast') + (i % 3) * s, 'base') },
          active: { pathLength: 0.4, transition: after(k, (i % 3) * s, 'base', 'exit') },
        },
      ]),
    )
    const antenna = (dir: 1 | -1) => ({
      rest: { rotate: 0, transition: after(k, k.duration('fast'), 'base') },
      active: { rotate: 35 * dir, transition: after(k, k.duration('fast'), 'base', 'standard') },
    })
    return {
      ...legs,
      left: antenna(-1),
      right: antenna(1),
      slash: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', k.duration('base'), 'standard') },
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <path d="M8 11.5 A4 4 0 0 1 16 11.5 V15.5 A4 4 0 0 1 8 15.5 Z" />
        <path d="M12 11.5 V19.5" />
        <path d="M9.5 8 A2.5 2.5 0 0 1 14.5 8" />
        <m.path d="M10.23 6.23 L8.75 4.75" variants={v.left} style={origin(10.23, 6.23)} />
        <m.path d="M13.77 6.23 L15.25 4.75" variants={v.right} style={origin(13.77, 6.23)} />
        {LEGS.map((d, i) => (
          <m.path key={d} d={d} variants={v[`l${i}`]} />
        ))}
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
