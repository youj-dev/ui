import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

const LEFT = 'M7.5 3 V6.67 A2 2 0 0 0 8.09 8.09 L12 12 L8.09 15.91 A2 2 0 0 0 7.5 17.33 V21'
const RIGHT = 'M16.5 3 V6.67 A2 2 0 0 1 15.91 8.09 L12 12 L15.91 15.91 A2 2 0 0 1 16.5 17.33 V21'

/**
 * Loops by default. The sand level drains down the funnel while the pile below
 * rises, then the glass turns over. The full pile, turned over, is exactly the
 * full top bulb, so the loop has no seam. Static fallback: a full top bulb.
 */
export const HourglassIcon = createIcon({
  name: 'hourglass',
  category: 'time',
  keywords: ['waiting', 'loading', 'pending', 'time', 'sand timer', 'busy', 'processing'],
  defaultTrigger: 'loop',
  loop: 'continuous',
  variants: (k) => {
    const loop = (times: number[]) => ({ ...seqFor(k, k.duration('deliberate') * 4, times, ['linear', 'linear']), repeat: Infinity })
    return {
      glass: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [0, 0, 180], transition: { ...seqFor(k, k.duration('deliberate') * 4, [0, 0.78, 1], ['linear', 'emphasized']), repeat: Infinity } },
      },
      top: {
        rest: { y: 0, scaleX: 1, transition: k.tween('base') },
        active: { y: [0, 3.5, 3.5], scaleX: [1, 0, 0], transition: loop([0, 0.72, 1]) },
      },
      pile: {
        rest: { y: 4.5, transition: k.tween('base') },
        active: { y: [4.5, 0, 0], transition: loop([0, 0.72, 1]) },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.glass} style={origin(12, 12)}>
      <path d="M5.5 3 H18.5" />
      <path d="M5.5 21 H18.5" />
      <path d={LEFT} />
      <path d={RIGHT} />
      <m.path d="M9.5 7.5 H14.5" variants={v.top} style={origin(12, 7.5)} />
      <m.path d="M9.5 16.5 H14.5" variants={v.pile} />
    </m.g>
  ),
})
