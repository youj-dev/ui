import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The bits flip: each digit turns over in place, one after another. */
export const BinaryIcon = createIcon({
  name: 'binary',
  category: 'development',
  keywords: ['bits', 'binary code', 'zeros and ones', 'data', 'machine code', 'digital'],
  variants: (k) => {
    const flip = (i: number) => ({
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0, 1], transition: seq(k, 'slow', [0, 0.5, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    return { g0: flip(0), g1: flip(1), g2: flip(2), g3: flip(3) }
  },
  render: (v) => (
    <>
      <m.g variants={v.g0} style={origin(7, 6.5)}>
        <path d="M7 3.5 V9.5" />
        <path d="M5.5 4.75 L7 3.5" />
      </m.g>
      <m.rect x="14" y="3.5" width="4" height="6" rx="2" variants={v.g1} style={origin(16, 6.5)} />
      <m.rect x="5" y="14.5" width="4" height="6" rx="2" variants={v.g2} style={origin(7, 17.5)} />
      <m.g variants={v.g3} style={origin(16, 17.5)}>
        <path d="M16 14.5 V20.5" />
        <path d="M14.5 15.75 L16 14.5" />
      </m.g>
    </>
  ),
})
