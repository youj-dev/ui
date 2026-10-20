import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Incoming call: the handset buzzes and signal arcs pulse out of the earpiece. */
export const PhoneIcon = createIcon({
  name: 'phone',
  category: 'communication',
  keywords: ['call', 'contact', 'ring', 'telephone', 'dial'],
  variants: (k) => {
    const wave = (i: number) => ({
      rest: { opacity: 0, scale: 0.6, transition: k.tween('fast') },
      active: {
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1, 1, 1],
        transition: seq(k, 'deliberate', [0, 0.3, 0.7, 1], ['emphasized', 'linear', 'exit'], i * k.stagger('loose')),
      },
    })
    return {
      handset: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [0, -10, 8, -8, 6, -3, 0], transition: seq(k, 'deliberate', [0, 0.12, 0.26, 0.4, 0.54, 0.7, 1]) },
      },
      w0: wave(0),
      w1: wave(1),
    }
  },
  render: (v) => (
    <>
      <m.path
        d="M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z"
        variants={v.handset}
        style={origin(12, 12)}
      />
      <m.path d="M14.5 6.5 A3 3 0 0 1 17.5 9.5" variants={v.w0} style={origin(14.5, 9.5)} />
      <m.path d="M14.5 3 A6.5 6.5 0 0 1 21 9.5" variants={v.w1} style={origin(14.5, 9.5)} />
    </>
  ),
})
