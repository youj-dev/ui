import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const RIBS = [7.5, 12, 16.5]

/** Shipped: the container is lifted a touch and its ribs ripple from one end to the other. */
export const ContainerIcon = createIcon({
  name: 'container',
  category: 'development',
  keywords: ['docker', 'shipping', 'deploy', 'image', 'pod', 'cargo'],
  variants: (k) => {
    const rib = (i: number) => ({
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.55, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      box: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, -1, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
      r0: rib(0),
      r1: rib(1),
      r2: rib(2),
    }
  },
  render: (v) => (
    <m.g variants={v.box}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      {RIBS.map((x, i) => (
        <m.path key={x} d={`M${x} 9 V15`} variants={v[`r${i}` as 'r0']} style={origin(x, 12)} />
      ))}
    </m.g>
  ),
})
