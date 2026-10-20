import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const STREAKS = ['M3.5 9 H0.75', 'M3.5 12.5 H1.5']

/** Dispatch: the truck rocks back, surges forward nose-up as speed lines streak off its tail, then rolls back onto its mark. */
export const TruckIcon = createIcon({
  name: 'truck',
  category: 'commerce',
  keywords: ['shipping', 'delivery', 'dispatch', 'transport', 'logistics', 'freight', 'order'],
  variants: (k) => {
    const streak = (i: number) => ({
      rest: { pathLength: 0, pathOffset: 0, opacity: 0, transition: k.tween('fast') },
      active: {
        pathLength: [0, 1, 0],
        pathOffset: [0, 0, 1],
        opacity: [0, 1, 0],
        transition: seq(k, 'slow', [0, 0.45, 1], ['exit', 'linear'], k.duration('fast') + i * k.stagger('base')),
      },
    })
    return {
      truck: {
        rest: { x: 0, rotate: 0, transition: k.tween('base') },
        active: {
          x: [0, -0.5, 1, 0],
          rotate: [0, 1, -2, 0],
          transition: seq(k, 'deliberate', [0, 0.15, 0.5, 1], ['standard', 'exit', 'emphasized']),
        },
      },
      s0: streak(0),
      s1: streak(1),
    }
  },
  render: (v) => (
    <>
      {STREAKS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`s${i}` as 's0']} />
      ))}
      <m.g variants={v.truck} style={origin(7, 17.5)}>
        <path d="M5 17.5 H4.5 A2 2 0 0 1 2.5 15.5 V7 A2 2 0 0 1 4.5 5 H12.5 A2 2 0 0 1 14.5 7 V17.5" />
        <path d="M9 17.5 H15" />
        <path d="M14.5 9 H17.59 A1 1 0 0 1 18.3 9.29 L21.21 12.21 A1 1 0 0 1 21.5 12.91 V16.5 A1 1 0 0 1 20.5 17.5 H19" />
        <circle cx="7" cy="17.5" r="2" />
        <circle cx="17" cy="17.5" r="2" />
      </m.g>
    </>
  ),
})
