import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** Low ↔ high. The needle sweeps a quarter turn across the dial on its pivot and lands on its mark without overshoot. `active` = high. */
export const GaugeIcon = createIcon({
  name: 'gauge',
  category: 'data',
  keywords: ['speed', 'performance', 'meter', 'usage', 'load', 'dashboard', 'speedometer'],
  states: ['low', 'high'],
  variants: (k) => ({
    needle: {
      rest: { rotate: 0, transition: k.tween('slow', 'emphasized') },
      active: { rotate: 90, transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <path d="M4.21 18.5 A9 9 0 1 1 19.79 18.5" />
      <m.path d="M12 14 L7.76 9.76" variants={v.needle} style={origin(12, 14)} />
      <circle cx="12" cy="14" r="1" />
    </>
  ),
})
