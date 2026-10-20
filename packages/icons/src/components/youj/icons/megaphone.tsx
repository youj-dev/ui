import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* Waves round the center of the horn's mouth, inner first. */
const WAVES = ['M18 8.5 A3.5 3.5 0 0 1 18 13.5', 'M20.25 6.25 A6.75 6.75 0 0 1 20.25 15.75']

/** An announcement: the horn kicks back as it blasts, and the sound goes out from its mouth one wave after the other. */
export const MegaphoneIcon = createIcon({
  name: 'megaphone',
  category: 'communication',
  keywords: ['announcement', 'broadcast', 'marketing', 'promote', 'news', 'campaign', 'loud'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    return {
      horn: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [null, -0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
      },
      ...Object.fromEntries(
        WAVES.map((_, i) => [
          `w${i}`,
          {
            rest: { opacity: 1, x: 0, transition: k.tween('fast') },
            active: {
              opacity: [null, 0, 1],
              x: [null, -1.5, 0],
              transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'enter'], k.duration('instant') + i * s),
            },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.horn}>
        <path d="M2.5 9.5 A1.5 1.5 0 0 1 4 8 H8.5 L15.5 4 V17.5 L8.5 13.5 H4 A1.5 1.5 0 0 1 2.5 12 Z" />
        <path d="M5.5 13.5 V18 A1.5 1.5 0 0 0 8.5 18 V13.5" />
      </m.g>
      {WAVES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`w${i}`]} />
      ))}
    </>
  ),
})
