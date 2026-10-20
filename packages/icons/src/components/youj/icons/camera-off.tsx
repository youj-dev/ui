import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Camera off: the slash is drawn through the camera again with a matching gap cut behind it. */
export const CameraOffIcon = createIcon({
  name: 'camera-off',
  category: 'media',
  keywords: ['camera off', 'no video', 'disabled camera', 'privacy', 'webcam off'],
  variants: (k) => ({
    slash: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <path d="M3 9 A2 2 0 0 1 5 7 H7.5 L9 4.5 H15 L16.5 7 H19 A2 2 0 0 1 21 9 V18 A2 2 0 0 1 19 20 H5 A2 2 0 0 1 3 18 Z" />
        <circle cx="12" cy="13.5" r="3" />
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
