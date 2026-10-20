import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Fitting it in: the piece lifts out, turns to find the fit, and drops back into place with a small settle. */
export const PuzzleIcon = createIcon({
  name: 'puzzle',
  category: 'system',
  keywords: ['extension', 'plugin', 'integration', 'add-on', 'module', 'app'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.3, 0.45, 0.75, 1], ['standard', 'linear', 'exit', 'enter'])
    return {
      piece: {
        rest: { y: 0, rotate: 0, transition: k.tween('fast') },
        active: { y: [null, -2, -2, 0.35, 0], rotate: [null, -10, -10, 1, 0], transition: t },
      },
    }
  },
  render: (v) => (
    <m.path
      d="M4 9 A2 2 0 0 1 6 7 H9.5 A2 2 0 1 1 12.5 7 H15 A2 2 0 0 1 17 9 V10.5 A2 2 0 1 1 17 13.5 V18 A2 2 0 0 1 15 20 H6 A2 2 0 0 1 4 18 Z"
      variants={v.piece}
      style={origin(12, 12)}
    />
  ),
})
