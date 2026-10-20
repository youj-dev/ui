import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Three sparkles twinkle out of phase: the big one breathes, the small ones blink and turn. */
export const SparklesIcon = createIcon({
  name: 'sparkles',
  category: 'ai',
  keywords: ['ai', 'magic', 'new', 'generate', 'shine', 'stars'],
  variants: (k) => ({
    big: {
      rest: { scale: 1, transition: k.tween('base') },
      active: { scale: [1, 0.78, 1], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
    small: {
      rest: { scale: 1, rotate: 0, transition: k.tween('base') },
      active: {
        scale: [1, 0, 1],
        rotate: [0, 45, 90],
        transition: seq(k, 'slow', [0, 0.5, 1], ['exit', 'emphasized'], k.stagger('loose')),
      },
    },
    tiny: {
      rest: { scale: 1, opacity: 1, transition: k.tween('base') },
      active: {
        scale: [1, 0, 1.3, 1],
        opacity: [1, 0, 1, 1],
        transition: seq(k, 'slow', [0, 0.4, 0.75, 1], ['exit', 'enter', 'standard'], k.stagger('loose') * 2.5),
      },
    },
  }),
  render: (v) => (
    <>
      <m.path
        d="M10 5 C10.5 10.5 12.5 12.5 18 13 C12.5 13.5 10.5 15.5 10 21 C9.5 15.5 7.5 13.5 2 13 C7.5 12.5 9.5 10.5 10 5 Z"
        variants={v.big}
        style={origin(10, 13)}
      />
      <m.path
        d="M18 2.5 C18.2 4.8 19.2 5.8 21.5 6 C19.2 6.2 18.2 7.2 18 9.5 C17.8 7.2 16.8 6.2 14.5 6 C16.8 5.8 17.8 4.8 18 2.5 Z"
        variants={v.small}
        style={origin(18, 6)}
      />
      <m.g variants={v.tiny} style={origin(19.5, 18.5)}>
        <path d="M19.5 17 V20" />
        <path d="M18 18.5 H21" />
      </m.g>
    </>
  ),
})
