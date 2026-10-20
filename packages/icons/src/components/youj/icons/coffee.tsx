import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

const STEAM = ['M7.5 2.5 C8.25 3.5 6.75 4.5 7.5 5.5', 'M10.25 2.5 C11 3.5 9.5 4.5 10.25 5.5', 'M13 2.5 C13.75 3.5 12.25 4.5 13 5.5']

/** A break: steam curls up off the cup and fades, one wisp after another, and fresh wisps form again above it. */
export const CoffeeIcon = createIcon({
  name: 'coffee',
  category: 'time',
  keywords: ['coffee', 'break', 'away', 'cafe', 'tea', 'pause', 'drink', 'morning'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      STEAM.map((_, i) => [
        `s${i}`,
        {
          rest: { y: 0, opacity: 1, transition: k.tween('fast') },
          active: {
            y: [null, -1.75, 1, 0],
            opacity: [null, 0, 0, 1],
            transition: seq(k, 'deliberate', [0, 0.45, 0.5, 1], ['standard', 'linear', 'enter'], i * k.stagger('loose')),
          },
        },
      ]),
    ),
  render: (v) => (
    <>
      <path d="M4 9 H16.5 V15.5 A4 4 0 0 1 12.5 19.5 H8 A4 4 0 0 1 4 15.5 Z" />
      <path d="M16.5 10.5 H18 A2.5 2.5 0 0 1 18 15.5 H16.5" />
      {STEAM.map((d, i) => (
        <m.path key={d} d={d} variants={v[`s${i}`]} />
      ))}
    </>
  ),
})
