import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A curious tilt: the question mark cocks its head on its base, and the dot hops a beat later. */
export const CircleHelpIcon = createIcon({
  name: 'circle-help',
  category: 'status',
  keywords: ['help', 'question', 'faq', 'support', 'unknown', 'hint', 'docs'],
  variants: (k) => ({
    hook: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -16, 6, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1], ['standard', 'emphasized', 'standard']) },
    },
    dot: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1.75, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('loose') * 2) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path
        d="M9.25 9.5 C9.25 7.98 10.48 6.75 12 6.75 C13.52 6.75 14.75 7.98 14.75 9.5 C14.75 11.5 12 11.75 12 13.5"
        variants={v.hook}
        style={origin(12, 13.5)}
      />
      <m.path d="M12 16.75 h.01" variants={v.dot} />
    </>
  ),
})
