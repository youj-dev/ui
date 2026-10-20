import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* Five rays from one centre, set a little low so the glyph sits optically centred. */
const RAYS = ['M12 12.4 L12 4.8', 'M12 12.4 L19.23 10.05', 'M12 12.4 L16.47 18.55', 'M12 12.4 L7.53 18.55', 'M12 12.4 L4.77 10.05']

/**
 * A fifth of a turn: the asterisk tightens, rotates exactly one ray and lands
 * on its own shape. Rest is 72° so leaving mid-turn completes forwards.
 */
export const AsteriskIcon = createIcon({
  name: 'asterisk',
  category: 'editor',
  keywords: ['required', 'mandatory', 'wildcard', 'footnote', 'star', 'multiply'],
  variants: (k) => ({
    glyph: {
      rest: { rotate: 72, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 72],
        scale: [1, 0.8, 1],
        transition: { rotate: k.tween('deliberate', 'enter'), scale: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.glyph} style={origin(12, 12.4)}>
      {RAYS.map((d) => (
        <path key={d} d={d} />
      ))}
    </m.g>
  ),
})
