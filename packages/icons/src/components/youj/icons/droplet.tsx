import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Wobbling like water: the drop stretches up, squashes down on its base and settles, with a glint inside that rides along. */
export const DropletIcon = createIcon({
  name: 'droplet',
  category: 'weather',
  keywords: ['water', 'drop', 'humidity', 'liquid', 'rain', 'hydration', 'fill', 'ink'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.25, 0.55, 0.8, 1], ['standard', 'standard', 'standard', 'emphasized'])
    return {
      drop: {
        rest: { scaleX: 1, scaleY: 1, transition: k.tween('base') },
        active: { scaleY: [null, 1.1, 0.9, 1.03, 1], scaleX: [null, 0.93, 1.08, 0.99, 1], transition: t },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.drop} style={origin(12, 21)}>
      <path d="M12 3 C12 3 5.5 10 5.5 14.5 A6.5 6.5 0 0 0 18.5 14.5 C18.5 10 12 3 12 3 Z" />
      <path d="M8.75 14.75 A3.25 3.25 0 0 0 11.25 17.75" />
    </m.g>
  ),
})
