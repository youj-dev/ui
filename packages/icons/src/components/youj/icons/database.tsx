import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Records sync: each ring of the cylinder lifts in turn, bottom to top. */
export const DatabaseIcon = createIcon({
  name: 'database',
  category: 'data',
  keywords: ['storage', 'server', 'sql', 'data', 'records', 'backend'],
  variants: (k) => {
    const ring = (i: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
    })
    return { bottom: ring(0), middle: ring(1), top: ring(2) }
  },
  render: (v) => (
    <>
      <m.ellipse cx="12" cy="5.5" rx="8" ry="3" variants={v.top} />
      <path d="M4 5.5 V18.5" />
      <path d="M20 5.5 V18.5" />
      <m.path d="M4 12 A8 3 0 0 0 20 12" variants={v.middle} />
      <m.path d="M4 18.5 A8 3 0 0 0 20 18.5" variants={v.bottom} />
    </>
  ),
})
