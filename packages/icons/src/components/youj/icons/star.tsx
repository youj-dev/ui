import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * A precise one-fifth turn: the star dips, rotates exactly one point and lands
 * on its own silhouette. Rest is 72° so leaving mid-turn completes forwards.
 */
export const StarIcon = createIcon({
  name: 'star',
  category: 'status',
  keywords: ['favorite', 'rating', 'bookmark', 'featured', 'review'],
  variants: (k) => ({
    star: {
      rest: { rotate: 72, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 72],
        scale: [1, 0.8, 1],
        transition: { rotate: k.tween('deliberate', 'enter'), scale: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => (
    <m.path
      d="M12 3.3 L14.82 9.02 L21.13 9.93 L16.57 14.38 L17.64 20.67 L12 17.7 L6.36 20.67 L7.43 14.38 L2.87 9.93 L9.18 9.02 Z"
      variants={v.star}
      style={origin(12, 12.9)}
    />
  ),
})
