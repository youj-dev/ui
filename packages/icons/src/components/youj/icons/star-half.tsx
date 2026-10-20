import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const STAR = 'M12 3.3 L14.82 9.02 L21.13 9.93 L16.57 14.38 L17.64 20.67 L12 17.7 L6.36 20.67 L7.43 14.38 L2.87 9.93 L9.18 9.02 Z'

/** A half rating: the fill drains out of the left half and pours back in up to the middle. */
export const StarHalfIcon = createIcon({
  name: 'star-half',
  category: 'status',
  keywords: ['rating', 'half star', 'review', 'score', 'partial', 'stars'],
  variants: (k) => ({
    fill: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0, 1], transition: seq(k, 'deliberate', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <path d={STAR} />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.rect x="2" y="2" width="10" height="20" fill="currentColor" stroke="none" variants={v.fill} style={origin(2, 12)} />
      </g>
      <path d={STAR} />
    </>
  ),
})
