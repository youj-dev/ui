import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/* A geometric S on the editor letters' cap height (4 to 20), split where its
 * diagonal spine crosses the strike: the upper half ends at the center and
 * the lower half starts there, so the two can jolt apart. */
const UPPER = 'M16.4 6.6 C15.6 5 13.9 4 12 4 C9.6 4 7.6 5.6 7.6 7.8 C7.6 10.1 9.9 10.9 12 12'
const LOWER = 'M12 12 C14.1 13.1 16.4 14 16.4 16.3 C16.4 18.5 14.4 20 12 20 C10 20 8.4 19 7.6 17.4'

/** A pen stroke slashes through the letter from left to right, and its two halves jolt apart as it passes, then close. */
export const StrikethroughIcon = createIcon({
  name: 'strikethrough',
  category: 'editor',
  keywords: ['strikethrough', 'strike', 'delete', 'cross out', 'text', 'format'],
  variants: (k) => {
    const jolt = (dir: 1 | -1) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0, 1.25 * dir, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.4, 1], ['linear', 'exit', 'emphasized']) },
    })
    return {
      strike: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
      top: jolt(-1),
      bottom: jolt(1),
    }
  },
  render: (v) => (
    <>
      <m.path d={UPPER} variants={v.top} />
      <m.path d={LOWER} variants={v.bottom} />
      <m.path d="M4.5 12 H19.5" variants={v.strike} />
    </>
  ),
})
