import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Match case: the capital and the small letter hop in turn. */
export const CaseSensitiveIcon = createIcon({
  name: 'case-sensitive',
  category: 'editor',
  keywords: ['match case', 'case sensitive', 'letters', 'uppercase', 'lowercase', 'font'],
  variants: (k) => {
    const hop = (i: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose') * 2) },
    })
    return { big: hop(0), small: hop(1) }
  },
  render: (v) => (
    <>
      <m.g variants={v.big}>
        <path d="M3 18 L7.5 6 L12 18" />
        <path d="M4.75 13.5 H10.25" />
      </m.g>
      <m.g variants={v.small}>
        <circle cx="17.25" cy="15.25" r="2.75" />
        <path d="M20 12.5 V18" />
      </m.g>
    </>
  ),
})
