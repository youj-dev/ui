import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* The band's legs sit 7.5 from the center, so scaling it by 1 + d/7.5 moves
 * each leg exactly as far as its cup. */
const HALF = 7.5

/** Bass drops: the ear cups thump outward twice on the beat and the headband flexes with them. */
export const HeadphonesIcon = createIcon({
  name: 'headphones',
  category: 'devices',
  keywords: ['audio', 'music', 'listen', 'earphones', 'sound', 'output', 'device'],
  variants: (k) => {
    const beat = seq(k, 'deliberate', [0, 0.14, 0.4, 0.54, 1], ['exit', 'emphasized', 'exit', 'emphasized'])
    const cup = (dir: 1 | -1) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, dir * 1.25, 0, dir * 0.75, 0], transition: beat },
    })
    return {
      band: {
        rest: { scaleX: 1, transition: k.tween('fast') },
        active: { scaleX: [null, 1 + 1.25 / HALF, 1, 1 + 0.75 / HALF, 1], transition: beat },
      },
      left: cup(-1),
      right: cup(1),
    }
  },
  render: (v) => (
    <>
      <m.path d="M4.5 13 V11.5 A7.5 7.5 0 0 1 19.5 11.5 V13" variants={v.band} style={origin(12, 12)} />
      <m.g variants={v.left}>
        <rect x="2.5" y="13" width="4" height="7.5" rx="2" />
      </m.g>
      <m.g variants={v.right}>
        <rect x="17.5" y="13" width="4" height="7.5" rx="2" />
      </m.g>
    </>
  ),
})
