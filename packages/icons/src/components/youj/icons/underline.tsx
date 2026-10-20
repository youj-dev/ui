import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/* The U stands on the editor letters' cap line (y 4) and its bowl is a little
 * deeper than a half circle, so it sits clear of the rule at y 20. */
const LETTER = 'M7 4 V11 C7 14.3 9.2 16.5 12 16.5 C14.8 16.5 17 14.3 17 11 V4'

/** The rule is struck beneath the letter from left to right while the letter lifts to make room, then settles onto it. */
export const UnderlineIcon = createIcon({
  name: 'underline',
  category: 'editor',
  keywords: ['underline', 'underscore', 'text', 'format', 'emphasis'],
  variants: (k) => ({
    letter: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1.25, 0], transition: seq(k, 'deliberate', [0, 0.3, 1], ['standard', 'emphasized']) },
    },
    rule: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
  }),
  render: (v) => (
    <>
      <m.path d={LETTER} variants={v.letter} />
      <m.path d="M5 20 H19" variants={v.rule} />
    </>
  ),
})
