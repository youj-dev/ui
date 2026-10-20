import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The columns rise into place one by one under the roof, which settles on top. */
export const LandmarkIcon = createIcon({
  name: 'landmark',
  category: 'commerce',
  keywords: ['bank', 'government', 'institution', 'museum', 'finance', 'courthouse', 'building'],
  variants: (k) => {
    const col = (i: number) => ({
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.4, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      roof: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, 1, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['exit', 'emphasized']) },
      },
      c0: col(0),
      c1: col(1),
      c2: col(2),
    }
  },
  render: (v) => (
    <>
      <m.path d="M12.9 3.45 L19.6 7.15 C20.2 7.5 19.95 8.5 19.25 8.5 H4.75 C4.05 8.5 3.8 7.5 4.4 7.15 L11.1 3.45 A1.9 1.9 0 0 1 12.9 3.45 Z" variants={v.roof} />
      {[7, 12, 17].map((x, i) => (
        <m.path key={x} d={`M${x} 11.5 V17`} variants={v[`c${i}` as 'c0']} style={origin(x, 17)} />
      ))}
      <path d="M3.5 20.5 H20.5" />
    </>
  ),
})
