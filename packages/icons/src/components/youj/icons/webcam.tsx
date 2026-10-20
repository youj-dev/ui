import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The lens looks around the room, left then right, and comes back to you. */
export const WebcamIcon = createIcon({
  name: 'webcam',
  category: 'devices',
  keywords: ['camera', 'video call', 'webcam', 'meeting', 'stream', 'facetime'],
  variants: (k) => ({
    lens: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -1.5, 1.5, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="10" r="7" />
      <m.circle cx="12" cy="10" r="2.75" variants={v.lens} />
      <path d="M12 17 V20.5" />
      <path d="M8 20.5 H16" />
    </>
  ),
})
