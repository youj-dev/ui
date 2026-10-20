import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Mirror images with one structure: every vertex swings vertically through a
 * flat line to its reflection, and the arrowhead turns with the last one. */
const FALLING = 'M3 7 L9 13 L13 9 L21 17'
const RISING = 'M3 17 L9 11 L13 15 L21 7'
const HEAD_FALLING = 'M15 17 H21 V11'
const HEAD_RISING = 'M15 7 H21 V13'

/**
 * Falling ↔ rising. The trend flips through its flat midpoint to its mirror
 * image and the arrowhead turns with the line's end. `active` = rising.
 */
export const TrendingDownIcon = createIcon({
  name: 'trending-down',
  category: 'data',
  keywords: ['decline', 'decrease', 'loss', 'down', 'drop', 'chart', 'trend'],
  states: ['falling', 'rising'],
  variants: (k) => {
    const flip = (from: string, to: string) => ({
      rest: { d: from, transition: k.tween('slow', 'emphasized') },
      active: { d: to, transition: k.tween('slow', 'emphasized') },
    })
    return { line: flip(FALLING, RISING), head: flip(HEAD_FALLING, HEAD_RISING) }
  },
  render: (v) => (
    <>
      <m.path d={FALLING} variants={v.line} />
      <m.path d={HEAD_FALLING} variants={v.head} />
    </>
  ),
})
