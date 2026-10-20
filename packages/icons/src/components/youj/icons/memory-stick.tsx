import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Under load: the chips on the module light up in turn along the board. */
export const MemoryStickIcon = createIcon({
  name: 'memory-stick',
  category: 'devices',
  keywords: ['ram', 'memory', 'hardware', 'module', 'storage', 'chip'],
  variants: (k) => {
    const chip = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.25, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    return { c0: chip(0), c1: chip(1), c2: chip(2) }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="6" width="19" height="10.5" rx="1.5" />
      {[5.5, 10.5, 15.5].map((x, i) => (
        <m.rect key={x} x={x} y="9" width="3" height="4.5" rx="0.5" variants={v[`c${i}` as 'c0']} />
      ))}
      {[5.5, 9.5, 14.5, 18.5].map((x) => (
        <path key={x} d={`M${x} 16.5 V19`} />
      ))}
    </>
  ),
})
