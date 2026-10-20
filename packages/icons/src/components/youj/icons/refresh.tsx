import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * One full turn with a hard ease-out. Rest is 360°, not 0°, so leaving
 * mid-spin finishes the turn forwards instead of unwinding it.
 */
export const RefreshIcon = createIcon({
  name: 'refresh',
  category: 'actions',
  keywords: ['reload', 'sync', 'rotate', 'retry', 'update'],
  variants: (k) => ({
    spinner: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <m.g variants={v.spinner} style={origin(12, 12)}>
      <path d="M20.5 12 A8.5 8.5 0 1 1 18.01 5.99 L20.5 8.5" />
      <path d="M20.5 3.5 V8.5 H15.5" />
    </m.g>
  ),
})
