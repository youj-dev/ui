import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The two bars dip in turn, like a held breath, and the button gives slightly under the press. */
export const CirclePauseIcon = createIcon({
  name: 'circle-pause',
  category: 'media',
  keywords: ['pause', 'hold', 'stop', 'wait', 'media', 'pause button'],
  variants: (k) => {
    const dip = (i: number) => ({
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.5, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      ring: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [1, 0.94, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      a: dip(0),
      b: dip(1),
    }
  },
  render: (v) => (
    <>
      <m.circle cx="12" cy="12" r="9" variants={v.ring} style={origin(12, 12)} />
      <m.path d="M10 9 L10 15" variants={v.a} style={origin(10, 12)} />
      <m.path d="M14 9 L14 15" variants={v.b} style={origin(14, 12)} />
    </>
  ),
})
