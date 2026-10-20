import { m } from 'motion/react'
import { createIcon, seqFor } from './icon-base'

/** Three dots rise and brighten in a traveling wave. Loops by default; static fallback is three dots. */
export const LoaderDotsIcon = createIcon({
  name: 'loader-dots',
  category: 'status',
  keywords: ['loading', 'typing', 'ellipsis', 'progress', 'busy', 'more'],
  defaultTrigger: 'loop',
  loop: 'continuous',
  variants: (k) => {
    const dot = (i: number) => ({
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [0, -3, 0, 0],
        opacity: [0.35, 1, 0.35, 0.35],
        transition: {
          ...seqFor(k, k.duration('deliberate') * 1.5, [0, 0.22, 0.5, 1], ['standard', 'standard', 'linear'], i * k.stagger('loose') * 1.5),
          repeat: Infinity,
        },
      },
    })
    return { d0: dot(0), d1: dot(1), d2: dot(2) }
  },
  render: (v) => (
    <>
      {[6, 12, 18].map((x, i) => (
        <m.circle key={x} cx={x} cy="12" r="1.5" fill="currentColor" stroke="none" variants={v[`d${i}` as 'd0']} />
      ))}
    </>
  ),
})
