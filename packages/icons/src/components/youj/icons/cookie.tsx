import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* An r9 cookie with a bite out of the top right, and its chips. */
const COOKIE = 'M12 3 A9 9 0 1 0 21 12 A4 4 0 0 1 16.5 7.5 A4 4 0 0 1 12 3 Z'
const CHIPS = [
  [8, 9],
  [12.5, 12.5],
  [8, 15.5],
  [15.5, 16],
] as const

/** Cookie consent: the cookie wobbles on the spot and its chips pop in turn, as if asking to be taken. */
export const CookieIcon = createIcon({
  name: 'cookie',
  category: 'security',
  keywords: ['cookie', 'cookies', 'consent', 'privacy', 'gdpr', 'tracking', 'preferences'],
  variants: (k): IconVariants => ({
    cookie: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -10, 7, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1], ['standard', 'standard', 'emphasized']) },
    },
    ...Object.fromEntries(
      CHIPS.map((_, i) => [
        `c${i}`,
        {
          rest: { scale: 1, transition: k.tween('fast') },
          active: { scale: [null, 0.3, 1.3, 1], transition: seq(k, 'slow', [0, 0.3, 0.65, 1], ['exit', 'enter', 'standard'], k.duration('fast') + i * k.stagger('base')) },
        },
      ]),
    ),
  }),
  render: (v) => (
    <m.g variants={v.cookie} style={origin(12, 12)}>
      <path d={COOKIE} />
      {CHIPS.map(([x, y], i) => (
        <m.path key={`${x}-${y}`} d={`M${x} ${y} h.01`} strokeWidth={2.25} variants={v[`c${i}`]} style={origin(x, y)} />
      ))}
    </m.g>
  ),
})
