import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* thumbs-up's hand and cuff, drawn in thumbs-up's own coordinates inside a
 * vertical mirror, so the pair is exact and the same gesture reads as a
 * thumb going down. */
const HAND =
  'M7 11 L9.53 6.51 A2.25 2.25 0 0 1 13.45 6.52 L13.73 7.01 A1.5 1.5 0 0 1 13.88 8.05 L13.38 10.4 A0.5 0.5 0 0 0 13.87 11 L18.04 11 A2 2 0 0 1 19.99 13.41 L18.83 18.91 A2 2 0 0 1 16.88 20.5 L7 20.5'

/**
 * Dislike → disliked, the pair to thumbs-up for rating answers. The hand
 * tips up on its wrist, flicks down past level and settles while the palm
 * fills; the cuff stays open. `active` = disliked.
 */
export const ThumbsDownIcon = createIcon({
  name: 'thumbs-down',
  category: 'people',
  keywords: ['dislike', 'downvote', 'disagree', 'bad', 'feedback', 'rating', 'not helpful'],
  states: ['dislike', 'disliked'],
  variants: (k) => ({
    hand: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -16, 5, 0], transition: seq(k, 'deliberate', [0, 0.32, 0.66, 1], ['standard', 'emphasized', 'standard']) },
    },
    fill: {
      rest: { opacity: 0, transition: k.tween('base') },
      active: { opacity: 1, transition: { ...k.tween('base', 'enter'), delay: k.duration('slow') * 0.55 } },
    },
  }),
  render: (v) => (
    <g transform="matrix(1 0 0 -1 0 24)">
      <m.g variants={v.hand} style={origin(5, 20.5)}>
        <m.path d={`${HAND} Z`} fill="currentColor" stroke="none" variants={v.fill} />
        <path d={HAND} />
        <path d="M7 11 H5 A2 2 0 0 0 3 13 V18.5 A2 2 0 0 0 5 20.5 H7 Z" />
      </m.g>
    </g>
  ),
})
