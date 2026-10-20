import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const TILES = [
  [3.5, 3.5],
  [13.5, 3.5],
  [13.5, 13.5],
  [3.5, 13.5],
] as const

/** Tiles dip one after another, clockwise, like a layout reflowing. */
export const LayoutGridIcon = createIcon({
  name: 'layout-grid',
  category: 'navigation',
  keywords: ['apps', 'dashboard', 'tiles', 'gallery', 'grid'],
  variants: (k) => {
    const tile = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.7, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
    })
    return { t0: tile(0), t1: tile(1), t2: tile(2), t3: tile(3) }
  },
  render: (v) => (
    <>
      {TILES.map(([x, y], i) => (
        <m.rect
          key={i}
          x={x}
          y={y}
          width="7"
          height="7"
          rx="2"
          variants={v[`t${i}` as 't0']}
          style={origin(x + 3.5, y + 3.5)}
        />
      ))}
    </>
  ),
})
