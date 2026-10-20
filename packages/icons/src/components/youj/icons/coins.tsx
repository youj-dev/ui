import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* The front coin as four quarter arcs, and the same coin seen edge-on: its
 * rim squeezed to a thin sliver. Both share one structure so `d` can spin it. */
const FACE = 'M9.5 2.5 C13.37 2.5 16.5 5.63 16.5 9.5 C16.5 13.37 13.37 16.5 9.5 16.5 C5.63 16.5 2.5 13.37 2.5 9.5 C2.5 5.63 5.63 2.5 9.5 2.5 Z'
const EDGE = 'M9.5 2.5 C9.89 2.5 10.2 5.63 10.2 9.5 C10.2 13.37 9.89 16.5 9.5 16.5 C9.11 16.5 8.8 13.37 8.8 9.5 C8.8 5.63 9.11 2.5 9.5 2.5 Z'

/** A coin toss: the front coin spins a full turn on its axis, uncovering the coin behind it each time it turns edge-on. */
export const CoinsIcon = createIcon({
  name: 'coins',
  category: 'commerce',
  keywords: ['money', 'cash', 'currency', 'credits', 'balance', 'tokens', 'finance'],
  variants: (k) => {
    const spin = seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1], ['exit', 'enter', 'exit', 'enter'])
    return {
      coin: {
        rest: { d: FACE, transition: k.tween('fast') },
        active: { d: [FACE, EDGE, FACE, EDGE, FACE], transition: spin },
      },
      mark: {
        rest: { scaleX: 1, transition: k.tween('fast') },
        active: { scaleX: [1, 0, -1, 0, 1], transition: spin },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={FACE} fill="black" stroke="none" variants={v.coin} />
      </mask>
      <circle cx="14.5" cy="14.5" r="7" mask={`url(#${id}-m)`} />
      <m.path d={FACE} variants={v.coin} />
      <m.path d="M8.25 7.75 L9.5 7 V12" variants={v.mark} style={origin(9.5, 9.5)} />
    </>
  ),
})
