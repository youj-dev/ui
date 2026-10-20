import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* theme's sun: an r4 core and eight rays from r6.5 to r9. The rays repeat
 * every 45°, so rest can sit at 45° and each hover turns them forwards. */
const RAYS =
  'M12 5.5 V3 M16.6 7.4 L18.36 5.64 M18.5 12 H21 M16.6 16.6 L18.36 18.36 M12 18.5 V21 M7.4 16.6 L5.64 18.36 M5.5 12 H3 M7.4 7.4 L5.64 5.64'

/** Clear skies: the rays turn one step round the sun while the core draws in a breath and glows back out. */
export const SunIcon = createIcon({
  name: 'sun',
  category: 'weather',
  keywords: ['sun', 'sunny', 'clear', 'weather', 'day', 'bright', 'summer', 'light'],
  variants: (k) => ({
    rays: {
      rest: { rotate: 45, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 45], transition: k.tween('deliberate', 'enter') },
    },
    core: {
      rest: { scale: 1, transition: k.tween('base') },
      active: { scale: [null, 0.85, 1], transition: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="12" cy="12" r="4" variants={v.core} style={origin(12, 12)} />
      <m.path d={RAYS} variants={v.rays} style={origin(12, 12)} />
    </>
  ),
})
