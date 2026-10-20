import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* The tip is a four-point sparkle drawn like sparkles' stars, so it lands on
 * its own silhouette after a quarter turn. */
const TIP = 'M17.5 3 C17.72 5.41 18.59 6.28 21 6.5 C18.59 6.72 17.72 7.59 17.5 10 C17.28 7.59 16.41 6.72 14 6.5 C16.41 6.28 17.28 5.41 17.5 3 Z'

/**
 * A flick of the wand: it swings from the wrist, the star at its tip spins
 * a quarter turn, and two glints wink on in its wake. Rest is the quarter
 * turn, so leaving mid-spin finishes forwards.
 */
export const WandIcon = createIcon({
  name: 'wand',
  category: 'ai',
  keywords: ['magic', 'ai', 'generate', 'auto', 'enhance', 'wizard', 'magic wand', 'fix'],
  variants: (k) => {
    const glint = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0, 1.25, 1], transition: seq(k, 'slow', [0, 0.3, 0.7, 1], ['exit', 'enter', 'standard'], k.duration('fast') + i * k.stagger('loose')) },
    })
    return {
      wand: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, -12, 3, 0], transition: seq(k, 'slow', [0, 0.35, 0.7, 1], ['standard', 'emphasized', 'standard']) },
      },
      tip: {
        rest: { rotate: 90, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 90], transition: k.tween('deliberate', 'enter') },
      },
      g0: glint(0),
      g1: glint(1),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.wand} style={origin(4, 20)}>
        <path d="M4 20 L13.5 10.5" />
        <m.path d={TIP} variants={v.tip} style={origin(17.5, 6.5)} />
      </m.g>
      <m.path d="M19.75 11.75 V14.25 M18.5 13 H21" variants={v.g0} style={origin(19.75, 13)} />
      <m.path d="M10.5 5 h.01" strokeWidth={2} variants={v.g1} style={origin(10.5, 5)} />
    </>
  ),
})
