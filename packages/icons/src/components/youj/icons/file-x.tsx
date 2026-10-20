import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Rejected: the page shakes its head while each stroke of the × pinches in to its centre and snaps back. */
export const FileXIcon = createIcon({
  name: 'file-x',
  category: 'files',
  keywords: ['remove file', 'delete document', 'rejected', 'invalid', 'missing file', 'error'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      page: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [null, -1, 1, -0.6, 0.3, 0], transition: seq(k, 'deliberate', [0, 0.15, 0.35, 0.55, 0.75, 1]) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.page}>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M14.5 12 L9.5 17" variants={v.a} style={origin(12, 14.5)} />
      <m.path d="M9.5 12 L14.5 17" variants={v.b} style={origin(12, 14.5)} />
    </m.g>
  ),
})
