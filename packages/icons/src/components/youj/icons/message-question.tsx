import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A puzzled question: the question mark tilts one way and the other while its dot bobs. */
export const MessageQuestionIcon = createIcon({
  name: 'message-question',
  category: 'communication',
  keywords: ['help', 'faq', 'support chat', 'ask', 'question', 'unclear'],
  variants: (k) => ({
    hook: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -14, 10, -4, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
    dot: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.stagger('loose')) },
    },
  }),
  render: (v) => (
    <>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      <m.path d="M10 8.5 C10 7.4 10.9 6.5 12 6.5 C13.1 6.5 14 7.4 14 8.5 C14 10 12 10.25 12 11.75" variants={v.hook} style={origin(12, 11.75)} />
      <m.path d="M12 14 h.01" strokeWidth={2} variants={v.dot} />
    </>
  ),
})
