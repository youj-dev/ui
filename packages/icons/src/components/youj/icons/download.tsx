import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The arrow drops into the tray, the tray takes the weight, a fresh arrow slides in from above. */
export const DownloadIcon = createIcon({
  name: 'download',
  category: 'actions',
  keywords: ['save', 'export', 'get', 'fetch'],
  variants: (k) => {
    const t = [0, 0.38, 0.39, 1]
    return {
      arrow: {
        rest: { y: 0, opacity: 1, transition: k.tween('fast') },
        active: { y: [0, 7, -8, 0], opacity: [1, 0, 0, 1], transition: seq(k, 'deliberate', t, ['exit', 'linear', 'emphasized']) },
      },
      tray: {
        rest: { y: 0, scaleX: 1, transition: k.tween('fast') },
        active: {
          y: [0, 0, 1.25, 0],
          scaleX: [1, 1, 1.06, 1],
          transition: seq(k, 'deliberate', [0, 0.26, 0.4, 1], ['linear', 'exit', 'emphasized']),
        },
      },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.arrow}>
        <path d="M12 3.5 V14" />
        <path d="M7 9 L12 14 L17 9" />
      </m.g>
      <m.path d="M4 15 V18 A2 2 0 0 0 6 20 H18 A2 2 0 0 0 20 18 V15" variants={v.tray} style={origin(12, 20)} />
    </>
  ),
})
