import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const BANDS = [
  'M3.5 4.5 C8 6 16 6 20.5 4.5',
  'M6 9 C9.5 10.2 15 10.2 18.5 9',
  'M8.5 13.5 C11 14.4 14.5 14.4 16.5 13.5',
  'M10 17.5 C11.5 18.2 13.5 18.2 14.5 17.5',
  'M11.5 20.75 H12.5',
]

/** The funnel twists: each band sways the other way from the one above it. */
export const TornadoIcon = createIcon({
  name: 'tornado',
  category: 'weather',
  keywords: ['tornado', 'twister', 'storm', 'cyclone', 'whirlwind', 'severe weather'],
  variants: (k) => {
    const sway = (i: number) => ({
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, i % 2 ? -1.5 : 1.5, 0], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized'], i * k.stagger('base')) },
    })
    return Object.fromEntries(BANDS.map((_, i) => [`b${i}`, sway(i)]))
  },
  render: (v) => (
    <>
      {BANDS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`b${i}`]} />
      ))}
    </>
  ),
})
