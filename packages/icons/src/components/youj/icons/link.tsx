import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The two halves pull apart, the bar stretches thin, then they snap back together. */
export const LinkIcon = createIcon({
  name: 'link',
  category: 'actions',
  keywords: ['url', 'chain', 'connect', 'attach', 'hyperlink'],
  variants: (k) => {
    const t = seq(k, 'slow', [0, 0.45, 1], ['standard', 'emphasized'])
    return {
      left: { rest: { x: 0, transition: k.tween('fast') }, active: { x: [0, -2, 0], transition: t } },
      right: { rest: { x: 0, transition: k.tween('fast') }, active: { x: [0, 2, 0], transition: t } },
      bar: { rest: { scaleX: 1, transition: k.tween('fast') }, active: { scaleX: [1, 0.35, 1], transition: t } },
    }
  },
  render: (v) => (
    <>
      <m.path d="M9 16.5 H7.5 A4.5 4.5 0 0 1 7.5 7.5 H9" variants={v.left} />
      <m.path d="M15 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H15" variants={v.right} />
      <m.path d="M8.5 12 H15.5" variants={v.bar} style={origin(12, 12)} />
    </>
  ),
})
