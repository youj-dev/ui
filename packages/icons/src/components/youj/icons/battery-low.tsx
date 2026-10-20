import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Low battery: the last cell blinks a warning. */
export const BatteryLowIcon = createIcon({
  name: 'battery-low',
  category: 'system',
  keywords: ['battery low', 'charge', 'power', 'energy', 'warning', 'drain'],
  variants: (k) => ({
    cell: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0, 1, 0, 1], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1], ['exit', 'enter', 'exit', 'enter']) },
    },
  }),
  render: (v) => (
    <>
      <rect x="2.5" y="7" width="16" height="10" rx="2" />
      <path d="M21.5 10.5 V13.5" />
      <m.path d="M6.5 10 V14" variants={v.cell} />
    </>
  ),
})
