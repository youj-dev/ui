import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A press: the shape squashes toward its base like a button pushed in, then springs back to its size. */
export const RectangleHorizontalIcon = createIcon({
  name: 'rectangle-horizontal',
  category: 'editor',
  keywords: ['rectangle', 'button', 'shape', 'pill', 'box', 'wide', 'landscape', 'rectangle-horizontal'],
  variants: (k) => {
    const press = seq(k, 'slow', [0, 0.3, 1], ['standard', 'emphasized'])
    return {
      shape: {
        rest: { scaleX: 1, scaleY: 1, transition: k.tween('fast') },
        active: { scaleX: [null, 1.03, 1], scaleY: [null, 0.84, 1], transition: press },
      },
    }
  },
  render: (v) => <m.rect x="3" y="7" width="18" height="10" rx="3" variants={v.shape} style={origin(12, 17)} />,
})
