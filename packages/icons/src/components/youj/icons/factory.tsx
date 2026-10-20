import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** At work: the windows along the floor light up in turn. */
export const FactoryIcon = createIcon({
  name: 'factory',
  category: 'commerce',
  keywords: ['factory', 'manufacturing', 'industry', 'plant', 'production', 'warehouse'],
  variants: (k) => {
    const light = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.2, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    return { w0: light(0), w1: light(1), w2: light(2) }
  },
  render: (v) => (
    <>
      <path d="M3 20.5 V10.5 L8 13.5 V10.5 L13 13.5 V10.5 L17.5 13.25 V4.5 A1 1 0 0 1 18.5 3.5 H20 A1 1 0 0 1 21 4.5 V20.5 Z" />
      {[7, 11, 15].map((x, i) => (
        <m.path key={x} d={`M${x} 17 h.01`} strokeWidth={2} variants={v[`w${i}` as 'w0']} />
      ))}
    </>
  ),
})
