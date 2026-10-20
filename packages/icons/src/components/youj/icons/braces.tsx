import { m } from 'motion/react'
import { createIcon, after, origin } from './icon-base'

const DOTS = [9.5, 12, 14.5]

/** An object fills in: the braces part to make room and three values are typed between them, held while hovered. */
export const BracesIcon = createIcon({
  name: 'braces',
  category: 'development',
  keywords: ['json', 'object', 'code', 'curly', 'data', 'schema', 'config'],
  variants: (k) => {
    const part = (x: number) => ({
      rest: { x: 0, transition: after(k, k.duration('fast'), 'base') },
      active: { x, transition: k.tween('base', 'standard') },
    })
    const dot = (i: number) => ({
      rest: { scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      active: { scale: 1, opacity: 1, transition: after(k, k.duration('fast') + i * k.stagger('loose'), 'fast', 'enter') },
    })
    return { left: part(-1.5), right: part(1.5), d0: dot(0), d1: dot(1), d2: dot(2) }
  },
  render: (v) => (
    <>
      <m.path d="M9 4 H8.5 A2 2 0 0 0 6.5 6 V10 A2 2 0 0 1 4.5 12 A2 2 0 0 1 6.5 14 V18 A2 2 0 0 0 8.5 20 H9" variants={v.left} />
      <m.path d="M15 4 H15.5 A2 2 0 0 1 17.5 6 V10 A2 2 0 0 0 19.5 12 A2 2 0 0 0 17.5 14 V18 A2 2 0 0 1 15.5 20 H15" variants={v.right} />
      {DOTS.map((x, i) => (
        <m.path key={x} d={`M${x} 12 h.01`} strokeWidth={2} variants={v[`d${i}` as 'd0']} style={origin(x, 12)} />
      ))}
    </>
  ),
})
