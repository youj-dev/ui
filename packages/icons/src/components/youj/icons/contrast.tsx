import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** The dark half turns all the way over to the other side and back round. Rest is 360° so leaving mid-turn completes forwards. */
export const ContrastIcon = createIcon({
  name: 'contrast',
  category: 'editor',
  keywords: ['contrast', 'high contrast', 'invert', 'accessibility', 'brightness', 'tone'],
  variants: (k) => ({
    half: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" variants={v.half} style={origin(12, 12)} />
    </>
  ),
})
