import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** A heartbeat trace: a bright pulse runs along the line from left to right. */
export const ActivityIcon = createIcon({
  name: 'activity',
  category: 'data',
  keywords: ['pulse', 'health', 'heartbeat', 'monitor', 'vitals', 'status'],
  variants: (k) => ({
    base: {
      rest: { opacity: 1, transition: k.tween('base') },
      active: { opacity: [1, 0.25, 0.25, 1], transition: seq(k, 'deliberate', [0, 0.15, 0.8, 1], ['standard', 'linear', 'standard']) },
    },
    pulse: {
      rest: { pathLength: 0.35, pathOffset: 1, opacity: 0, transition: k.tween('fast') },
      active: {
        pathLength: [0, 0.35, 0.35, 0],
        pathOffset: [0, 0, 0.65, 1],
        opacity: [1, 1, 1, 1],
        transition: seq(k, 'deliberate', [0, 0.3, 0.8, 1], ['enter', 'linear', 'exit']),
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M2.5 12 H6 L9 4.5 L15 19.5 L18 12 H21.5" variants={v.base} />
      <m.path d="M2.5 12 H6 L9 4.5 L15 19.5 L18 12 H21.5" variants={v.pulse} />
    </>
  ),
})
