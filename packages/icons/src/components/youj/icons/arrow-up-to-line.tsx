import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const T = [0, 0.25, 0.55, 1]

/** Back to the top: the arrow winds down, shoots up to touch the line, and the line gives as it lands. */
export const ArrowUpToLineIcon = createIcon({
  name: 'arrow-up-to-line',
  category: 'arrows',
  keywords: ['scroll to top', 'top', 'first', 'upload', 'align top', 'back to top'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, -3, 0], transition: seq(k, 'deliberate', T, ['standard', 'emphasized', 'emphasized']) },
    },
    bar: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0, -0.75, 0], transition: seq(k, 'deliberate', T, ['linear', 'emphasized', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M5 4 H19" variants={v.bar} />
      <m.g variants={v.arrow}>
        <path d="M12 20 V8.5" />
        <path d="M7 13.5 L12 8.5 L17 13.5" />
      </m.g>
    </>
  ),
})
