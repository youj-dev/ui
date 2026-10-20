import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* zoom-in's lens and handle. The bar narrows by moving its ends, so its round
 * caps stay round. */
const BAR = 'M7.5 10.5 L13.5 10.5'
const NARROW = 'M9.5 10.5 L11.5 10.5'

/** Zoom out. The lens pulls back a step while the minus narrows and widens again. */
export const ZoomOutIcon = createIcon({
  name: 'zoom-out',
  category: 'actions',
  keywords: ['zoom', 'zoom out', 'shrink', 'smaller', 'reduce', 'magnify', 'minus', 'scale down'],
  variants: (k) => ({
    lens: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.9, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { d: BAR, transition: k.tween('fast') },
      active: { d: [null, NARROW, BAR], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('tight')) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.lens} style={origin(10.5, 10.5)}>
        <circle cx="10.5" cy="10.5" r="7" />
        <m.path d={BAR} variants={v.bar} />
      </m.g>
      <path d="M15.5 15.5 L20.5 20.5" />
    </>
  ),
})
