import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* An oblique hash: the slants lean 3 in 16 (a true italic angle) and the
 * crossbars are sheared with them, the upper one set half a unit right of the
 * lower, so the four strokes frame a parallelogram rather than a square. */
const LEFT = 'M10.75 4 L7.75 20'
const RIGHT = 'M16.25 4 L13.25 20'

/** A channel: the bars of the hash shuffle, the slants leaning further while the crossbars slide apart, then everything clicks back into its grid. */
export const HashIcon = createIcon({
  name: 'hash',
  category: 'communication',
  keywords: ['channel', 'hashtag', 'tag', 'number', 'topic', 'slack', 'room'],
  variants: (k) => {
    const t = seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'])
    const bar = (dx: number) => ({ rest: { x: 0, transition: k.tween('fast') }, active: { x: [null, dx, 0], transition: t } })
    const lean = { rest: { rotate: 0, transition: k.tween('fast') }, active: { rotate: [null, 8, 0], transition: t } }
    return { top: bar(-1), bottom: bar(1), left: lean, right: lean }
  },
  render: (v) => (
    <>
      <m.path d="M5.25 9.5 H19.75" variants={v.top} />
      <m.path d="M4.25 14.5 H18.75" variants={v.bottom} />
      <m.path d={LEFT} variants={v.left} style={origin(9.25, 12)} />
      <m.path d={RIGHT} variants={v.right} style={origin(14.75, 12)} />
    </>
  ),
})
