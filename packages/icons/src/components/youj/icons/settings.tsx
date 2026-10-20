import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

const GEAR =
  'M10.44 4.66 L10.76 2.58 A9.5 9.5 0 0 1 13.24 2.58 L13.56 4.66 A7.5 7.5 0 0 1 16.08 5.71 L17.78 4.46 A9.5 9.5 0 0 1 19.54 6.22 L18.29 7.92 A7.5 7.5 0 0 1 19.34 10.44 L21.42 10.76 A9.5 9.5 0 0 1 21.42 13.24 L19.34 13.56 A7.5 7.5 0 0 1 18.29 16.08 L19.54 17.78 A9.5 9.5 0 0 1 17.78 19.54 L16.08 18.29 A7.5 7.5 0 0 1 13.56 19.34 L13.24 21.42 A9.5 9.5 0 0 1 10.76 21.42 L10.44 19.34 A7.5 7.5 0 0 1 7.92 18.29 L6.22 19.54 A9.5 9.5 0 0 1 4.46 17.78 L5.71 16.08 A7.5 7.5 0 0 1 4.66 13.56 L2.58 13.24 A9.5 9.5 0 0 1 2.58 10.76 L4.66 10.44 A7.5 7.5 0 0 1 5.71 7.92 L4.46 6.22 A9.5 9.5 0 0 1 6.22 4.46 L7.92 5.71 A7.5 7.5 0 0 1 10.44 4.66 Z'

/**
 * The gear turns exactly one tooth-pitch (45°) with a heavy ease-out, as if
 * driven by a ratchet. Rest is 45° so leaving mid-turn completes forwards.
 */
export const SettingsIcon = createIcon({
  name: 'settings',
  category: 'system',
  keywords: ['gear', 'preferences', 'options', 'cog', 'config'],
  variants: (k) => ({
    gear: {
      rest: { rotate: 45, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 45], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={GEAR} variants={v.gear} style={origin(12, 12)} />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
})
