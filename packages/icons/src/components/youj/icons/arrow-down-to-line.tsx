import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const T = [0, 0.25, 0.55, 1]

/** Down to the end: the arrow winds up, drops to touch the line, and the line gives as it lands. */
export const ArrowDownToLineIcon = createIcon({
  name: 'arrow-down-to-line',
  category: 'arrows',
  keywords: ['scroll to bottom', 'bottom', 'last', 'download', 'align bottom', 'jump to end'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 3, 0], transition: seq(k, 'deliberate', T, ['standard', 'emphasized', 'emphasized']) },
    },
    bar: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0, 0.75, 0], transition: seq(k, 'deliberate', T, ['linear', 'emphasized', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M5 20 H19" variants={v.bar} />
      <m.g variants={v.arrow}>
        <path d="M12 4 V15.5" />
        <path d="M7 10.5 L12 15.5 L17 10.5" />
      </m.g>
    </>
  ),
})
