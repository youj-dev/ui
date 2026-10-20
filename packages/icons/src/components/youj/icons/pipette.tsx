import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Picking a color: the bulb is squeezed and a drop forms at the tip of the
 * dropper and falls, and the bulb springs back.
 */
export const PipetteIcon = createIcon({
  name: 'pipette',
  category: 'editor',
  keywords: ['color picker', 'color picker', 'eyedropper', 'sample', 'pipette', 'dropper', 'design'],
  variants: (k) => ({
    bulb: {
      rest: { scaleX: 1, transition: k.tween('base') },
      active: { scaleX: [null, 0.65, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    drop: {
      rest: { y: 0, opacity: 0, transition: k.tween('fast') },
      active: {
        y: [0, 0, 2.5],
        opacity: [0, 1, 0],
        transition: { y: seq(k, 'deliberate', [0, 0.45, 1], ['linear', 'exit']), opacity: seq(k, 'deliberate', [0, 0.35, 1], ['enter', 'exit']) },
      },
    },
  }),
  render: (v) => (
    <>
      {/* Drawn upright, bulb up, and tipped over the 45° diagonal. */}
      <g transform="rotate(45 12 12)">
        <m.path d="M9.75 7 V4.25 A2.25 2.25 0 0 1 14.25 4.25 V7" variants={v.bulb} style={origin(12, 7)} />
        <path d="M8 7 H16" />
        <path d="M10.5 7 V16.5 L12 20.5 L13.5 16.5 V7" />
      </g>
      <m.path d="M6 19.5 h.01" strokeWidth={2} variants={v.drop} />
    </>
  ),
})
