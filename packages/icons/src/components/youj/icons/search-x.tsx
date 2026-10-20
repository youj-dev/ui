import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** No results. The magnifier shakes its head, wagging from the end of its handle, while each stroke of the × pinches in to its center and snaps back. */
export const SearchXIcon = createIcon({
  name: 'search-x',
  category: 'navigation',
  keywords: ['no results', 'not found', 'nothing found', 'clear search', 'empty search', 'zero results', 'search'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      glass: {
        rest: { rotate: 0, transition: k.tween('fast') },
        active: { rotate: [null, -9, 7, -4, 2, 0], transition: seq(k, 'deliberate', [0, 0.15, 0.35, 0.55, 0.75, 1]) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.glass} style={origin(20.5, 20.5)}>
      <circle cx="10.5" cy="10.5" r="7" />
      <m.path d="M12.75 8.25 L8.25 12.75" variants={v.a} style={origin(10.5, 10.5)} />
      <m.path d="M8.25 8.25 L12.75 12.75" variants={v.b} style={origin(10.5, 10.5)} />
      <path d="M15.5 15.5 L20.5 20.5" />
    </m.g>
  ),
})
