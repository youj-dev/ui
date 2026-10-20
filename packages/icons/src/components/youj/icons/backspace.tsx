import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The key is pressed toward its point and each stroke of the × pinches in to its centre and snaps back. */
export const BackspaceIcon = createIcon({
  name: 'backspace',
  category: 'actions',
  keywords: ['delete', 'erase', 'clear', 'remove character', 'keyboard', 'delete key'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      key: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.key}>
      <path d="M9.19 5 L18.5 5 A2 2 0 0 1 20.5 7 L20.5 17 A2 2 0 0 1 18.5 19 L9.19 19 A1.5 1.5 0 0 1 8.05 18.48 L3.06 12.65 A1 1 0 0 1 3.06 11.35 L8.05 5.52 A1.5 1.5 0 0 1 9.19 5 Z" />
      <m.path d="M12 9.5 L17 14.5" variants={v.a} style={origin(14.5, 12)} />
      <m.path d="M17 9.5 L12 14.5" variants={v.b} style={origin(14.5, 12)} />
    </m.g>
  ),
})
