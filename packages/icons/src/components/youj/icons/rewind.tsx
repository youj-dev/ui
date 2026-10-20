import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Mirror of fast-forward: both triangles surge backward twice, the rear one chasing the front a beat behind. */
export const RewindIcon = createIcon({
  name: 'rewind',
  category: 'media',
  keywords: ['seek', 'back', 'replay', 'rewind', 'media', 'rw'],
  variants: (k) => {
    const surge = (delay: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, -1.5, 0, -1, 0], transition: seq(k, 'deliberate', [0, 0.18, 0.42, 0.6, 1], ['exit', 'emphasized', 'exit', 'emphasized'], delay) },
    })
    return { front: surge(0), rear: surge(k.stagger('base')) }
  },
  render: (v) => (
    <>
      <m.path d="M20.5 6 L12 12 L20.5 18 Z" variants={v.rear} />
      <m.path d="M12 6 L3.5 12 L12 18 Z" variants={v.front} />
    </>
  ),
})
