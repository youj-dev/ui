import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Promoted to a heading: the letter grows taller from its baseline, crossbar riding up with it, and settles back. */
export const HeadingIcon = createIcon({
  name: 'heading',
  category: 'editor',
  keywords: ['heading', 'title', 'h1', 'header', 'text', 'format', 'section'],
  variants: (k) => {
    const t = seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'])
    return {
      stems: { rest: { scaleY: 1, transition: k.tween('fast') }, active: { scaleY: [null, 1.125, 1], transition: t } },
      bar: { rest: { y: 0, transition: k.tween('fast') }, active: { y: [null, -1, 0], transition: t } },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.stems} style={origin(12, 20)}>
        <path d="M6 20 V4" />
        <path d="M18 20 V4" />
      </m.g>
      <m.path d="M6 12 H18" variants={v.bar} />
    </>
  ),
})
