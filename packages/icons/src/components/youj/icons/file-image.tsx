import { m } from 'motion/react'
import { createIcon, seqFor } from './icon-base'

/* image's picture inside the page: the sun upper left, and a ridge rising
 * from the bottom-left corner to a peak and down to the right edge, both
 * slopes at 45° so they meet the outline cleanly. The sky clip runs a
 * stroke's width above the ridge, so the sun really sets behind it. */
const RIDGE = 'M5.59 20.41 L13.5 12.5 L19 18'
const SKY = 'M3 3 H21 V18.73 L13.5 11.23 L3 21.73 Z'

/** An image file. The sun sinks behind the ridge and rises again. */
export const FileImageIcon = createIcon({
  name: 'file-image',
  category: 'files',
  keywords: ['image file', 'photo', 'picture', 'png', 'jpg', 'svg', 'media', 'attachment', 'file-image'],
  variants: (k) => ({
    sun: {
      rest: { y: 0, transition: k.tween('base') },
      active: {
        y: [null, 7.5, 7.5, 0],
        transition: seqFor(k, k.duration('deliberate') * 1.2, [0, 0.35, 0.5, 1], ['standard', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-sky`}>
        <path d={SKY} />
      </clipPath>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <g clipPath={`url(#${id}-sky)`}>
        <m.circle cx="8.75" cy="12.25" r="1.25" variants={v.sun} />
      </g>
      <path d={RIDGE} />
    </>
  ),
})
