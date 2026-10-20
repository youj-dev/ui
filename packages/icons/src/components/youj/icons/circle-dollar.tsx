import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A coin flips over and lands face up again. */
export const CircleDollarIcon = createIcon({
  name: 'circle-dollar',
  category: 'commerce',
  keywords: ['price', 'cost', 'money', 'payment', 'currency', 'coin', 'dollar'],
  variants: (k) => ({
    coin: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0, -1, 0, 1], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1], ['exit', 'enter', 'exit', 'enter']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.coin} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.4 C14.15 8.55 13.25 8 12 8 C10.6 8 9.5 8.75 9.5 9.9 C9.5 12.4 14.5 11.6 14.5 14.1 C14.5 15.25 13.4 16 12 16 C10.75 16 9.85 15.45 9.5 14.6" />
      <path d="M12 6.25 V8" />
      <path d="M12 16 V17.75" />
    </m.g>
  ),
})
