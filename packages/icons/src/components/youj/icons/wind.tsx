import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* Streams, and when each gust reaches it (in stagger steps). */
const STREAMS = [
  { d: 'M2.5 8.5 H12 A3 3 0 1 0 9 5.5', step: 1 },
  { d: 'M2.5 12 H18 A3 3 0 1 0 15 9', step: 0 },
  { d: 'M2.5 15.5 H14 A3 3 0 1 1 11 18.5', step: 2 },
]

/**
 * A gust: each stream is blown through, its tail running off into the curl,
 * and a fresh stream blows in from the left behind it, one after another.
 */
export const WindIcon = createIcon({
  name: 'wind',
  category: 'weather',
  keywords: ['breeze', 'air', 'gust', 'weather', 'blow', 'ventilation'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      STREAMS.map(({ step }, i) => [
        `s${i}`,
        {
          rest: { pathLength: 1, pathOffset: 0, opacity: 1, transition: k.tween('fast') },
          active: {
            pathOffset: [null, 1, 0, 0],
            pathLength: [null, 0, 0, 1],
            opacity: [null, 1, 0, 0, 1, 1],
            transition: {
              pathOffset: seq(k, 'deliberate', [0, 0.42, 0.43, 1], ['exit', 'linear', 'linear'], step * k.stagger('loose')),
              pathLength: seq(k, 'deliberate', [0, 0.42, 0.43, 1], ['exit', 'linear', 'emphasized'], step * k.stagger('loose')),
              opacity: seq(k, 'deliberate', [0, 0.32, 0.42, 0.43, 0.47, 1], ['linear', 'linear', 'linear', 'linear', 'linear'], step * k.stagger('loose')),
            },
          },
        },
      ]),
    ),
  render: (v) => (
    <>
      {STREAMS.map(({ d }, i) => (
        <m.path key={d} d={d} variants={v[`s${i}`]} />
      ))}
    </>
  ),
})
