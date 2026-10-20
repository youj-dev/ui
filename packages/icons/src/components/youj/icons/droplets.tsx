import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Humid: the two drops fall in turn, a short way each, and settle back. */
export const DropletsIcon = createIcon({
  name: 'droplets',
  category: 'weather',
  keywords: ['humidity', 'water', 'rain', 'moisture', 'liquid', 'dew'],
  variants: (k) => {
    const fall = (i: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose') * 2) },
    })
    return { a: fall(0), b: fall(1) }
  },
  render: (v) => (
    <>
      <m.path d="M9 4.5 C11.47 9.45 13.5 11.7 13.5 14.62 A4.5 4.5 0 0 1 4.5 14.62 C4.5 11.7 6.52 9.45 9 4.5 Z" variants={v.a} />
      <m.path d="M17.5 11 C19.01 14.02 20.25 15.4 20.25 17.18 A2.75 2.75 0 0 1 14.75 17.18 C14.75 15.4 15.98 14.02 17.5 11 Z" variants={v.b} />
    </>
  ),
})
