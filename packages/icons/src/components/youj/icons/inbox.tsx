import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A message drops in and the tray dips to catch it. */
export const InboxIcon = createIcon({
  name: 'inbox',
  category: 'communication',
  keywords: ['mail', 'messages', 'tray', 'received', 'archive'],
  variants: (k) => ({
    item: {
      rest: { y: 0, opacity: 0, transition: k.tween('fast') },
      active: {
        y: [-7, 3.5, 3.5, 3.5],
        opacity: [0, 1, 0, 0],
        transition: seq(k, 'deliberate', [0, 0.5, 0.8, 1], ['enter', 'linear', 'linear']),
      },
    },
    tray: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0, 1, 0], transition: seq(k, 'deliberate', [0, 0.42, 0.55, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M9.5 8 H14.5" variants={v.item} />
      <m.g variants={v.tray} style={origin(12, 20)}>
        <path d="M3 12.5 H8 L9.5 15 H14.5 L16 12.5 H21" />
        <path d="M6.5 5 H17.5 L21 12.5 V18 A2 2 0 0 1 19 20 H5 A2 2 0 0 1 3 18 V12.5 Z" />
      </m.g>
    </>
  ),
})
