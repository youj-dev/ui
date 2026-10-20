import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The tray pushes, the arrow launches out of the top and a new one rises from the tray. */
export const UploadIcon = createIcon({
  name: 'upload',
  category: 'actions',
  keywords: ['send', 'import', 'publish', 'share'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [0, 1, -9, 6, 0],
        opacity: [1, 1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.12, 0.42, 0.43, 1], ['standard', 'exit', 'linear', 'emphasized']),
      },
    },
    tray: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.2, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.arrow}>
        <path d="M12 14.5 V4" />
        <path d="M7 9 L12 4 L17 9" />
      </m.g>
      <m.path d="M4 15 V18 A2 2 0 0 0 6 20 H18 A2 2 0 0 0 20 18 V15" variants={v.tray} style={origin(12, 20)} />
    </>
  ),
})
