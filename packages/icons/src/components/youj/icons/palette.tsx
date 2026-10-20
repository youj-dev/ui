import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* An r9 disc with a thumb notch at the lower right, and four wells of paint round the top. */
const PALETTE = 'M12 21 A9 9 0 1 1 21 12 C21 14.2 19.2 15.5 17 15.5 H15.75 C14.25 15.5 13.5 17 14.1 18.1 C14.6 19 14.25 21 12 21 Z'
const WELLS = [
  [7.5, 11.5],
  [9, 7.5],
  [13, 6.25],
  [16.75, 8.75],
] as const

/** Picking colors: the palette tips in the hand and each well of paint pops in turn, round the rim. */
export const PaletteIcon = createIcon({
  name: 'palette',
  category: 'editor',
  keywords: ['colour', 'color', 'paint', 'theme', 'design', 'swatches', 'appearance', 'brand'],
  variants: (k): IconVariants => ({
    palette: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -8, 0], transition: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
    ...Object.fromEntries(
      WELLS.map((_, i) => [
        `w${i}`,
        {
          rest: { scale: 1, transition: k.tween('fast') },
          active: { scale: [null, 0.3, 1.35, 1], transition: seq(k, 'slow', [0, 0.3, 0.65, 1], ['exit', 'enter', 'standard'], k.duration('fast') + i * k.stagger('loose')) },
        },
      ]),
    ),
  }),
  render: (v) => (
    <m.g variants={v.palette} style={origin(12, 12)}>
      <path d={PALETTE} />
      {WELLS.map(([x, y], i) => (
        <m.path key={x} d={`M${x} ${y} h.01`} strokeWidth={2.25} variants={v[`w${i}`]} style={origin(x, y)} />
      ))}
    </m.g>
  ),
})
