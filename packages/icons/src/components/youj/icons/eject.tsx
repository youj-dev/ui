import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Ejected: the triangle pops up off the bar and drops back. */
export const EjectIcon = createIcon({
  name: 'eject',
  category: 'media',
  keywords: ['eject', 'unmount', 'remove disk', 'open tray', 'media'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1, -2, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.5, 1], ['standard', 'emphasized', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M12.96 6.67 L17.32 11.96 A1.25 1.25 0 0 1 16.35 14 L7.65 14 A1.25 1.25 0 0 1 6.68 11.96 L11.04 6.67 A1.25 1.25 0 0 1 12.96 6.67 Z" variants={v.arrow} />
      <path d="M5.5 18.5 H18.5" />
    </>
  ),
})
