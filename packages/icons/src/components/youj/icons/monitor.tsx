import { m, type TargetAndTransition } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'
import type { Youj } from '@youj/core'
import type { DurationToken, EasingToken } from '@youj/core'

/* Current runs from the foot up the neck and round the screen, but the
 * strokes are defined top-down: the two halves start at the top center, so
 * their clean start caps are what meet there (two dash ends meeting pinch),
 * and each half runs half a unit past the bottom center so its end is buried
 * in the other's stroke. */
const FOOT = ['M12 20.5 H8', 'M12 20.5 H16']
const NECK = 'M12 15.5 V20.5'
const FRAME = ['M12 3.5 H5 A2 2 0 0 0 3 5.5 V13.5 A2 2 0 0 0 5 15.5 H12.5', 'M12 3.5 H19 A2 2 0 0 1 21 5.5 V13.5 A2 2 0 0 1 19 15.5 H11.5']

/* Draws a stroke from its end back to its start: the dash grows while sliding to the path's start. */
function drawBack(k: Youj, token: DurationToken, delay: number, ease: EasingToken): TargetAndTransition {
  const grow = { ...k.tween(token, ease), delay }
  return {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    opacity: [0, 1],
    transition: { pathLength: grow, pathOffset: grow, opacity: { ...k.tween('instant', 'linear'), delay } },
  }
}

/** Power-on: current runs out along the foot, up the neck, and around both sides of the screen until they meet at the top. */
export const MonitorIcon = createIcon({
  name: 'monitor',
  category: 'devices',
  keywords: ['display', 'screen', 'desktop', 'computer', 'imac', 'device', 'system'],
  variants: (k) => {
    const step = k.duration('fast') * 0.75
    const back = { ...hidden, pathOffset: 1 }
    const whole = {
      pathLength: 1,
      pathOffset: 0,
      opacity: 1,
      transition: { pathLength: k.tween('fast'), pathOffset: k.tween('fast'), opacity: k.tween('instant', 'linear') },
    }
    return {
      foot: { from: hidden, rest: drawn(k), active: drawIn(k, 'fast', 0, 'standard') },
      neck: { from: back, rest: whole, active: drawBack(k, 'fast', step, 'standard') },
      frame: { from: back, rest: whole, active: drawBack(k, 'slow', step * 2, 'emphasized') },
    }
  },
  render: (v) => (
    <>
      {FOOT.map((d) => (
        <m.path key={d} d={d} variants={v.foot} />
      ))}
      {FRAME.map((d) => (
        <m.path key={d} d={d} variants={v.frame} />
      ))}
      <m.path d={NECK} variants={v.neck} />
    </>
  ),
})
