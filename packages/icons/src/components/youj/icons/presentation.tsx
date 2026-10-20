import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The trend on the board is drawn again, left to right, as if being presented. */
export const PresentationIcon = createIcon({
  name: 'presentation',
  category: 'files',
  keywords: ['slides', 'deck', 'keynote', 'whiteboard', 'pitch', 'meeting', 'board'],
  variants: (k) => ({
    trend: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <path d="M3 4 H21" />
      <path d="M4.5 4 V13 A2 2 0 0 0 6.5 15 H17.5 A2 2 0 0 0 19.5 13 V4" />
      <path d="M12 15 V18" />
      <path d="M8.5 21 L12 18 L15.5 21" />
      <m.path d="M8 11.5 L10.75 8.75 L13 10.75 L16 7.5" variants={v.trend} />
    </>
  ),
})
