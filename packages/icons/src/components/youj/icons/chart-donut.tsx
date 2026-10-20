import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** The ring turns a full revolution, carrying its slices round. Rest is 360° so leaving mid-turn completes forwards. */
export const ChartDonutIcon = createIcon({
  name: 'chart-donut',
  category: 'data',
  keywords: ['donut chart', 'ring chart', 'breakdown', 'share', 'proportion', 'analytics'],
  variants: (k) => ({
    ring: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <m.g variants={v.ring} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 7.5 L12 3" />
      <path d="M15.9 14.25 L19.79 16.5" />
      <path d="M8.1 14.25 L4.21 16.5" />
    </m.g>
  ),
})
