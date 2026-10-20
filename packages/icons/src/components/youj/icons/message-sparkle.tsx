import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* message's bubble with a sparkles star in it; the star is symmetric under
 * a quarter turn, so rest can sit at 90° and every hover turns it forwards. */
const STAR = 'M12 6.25 C12.27 9.17 13.33 10.23 16.25 10.5 C13.33 10.77 12.27 11.83 12 14.75 C11.73 11.83 10.67 10.77 7.75 10.5 C10.67 10.23 11.73 9.17 12 6.25 Z'

/** Ask AI. The bubble lifts as if it were about to speak and the star inside turns a quarter, breathing in on the way. */
export const MessageSparkleIcon = createIcon({
  name: 'message-sparkle',
  category: 'ai',
  keywords: ['ai', 'ask ai', 'assistant', 'chat', 'copilot', 'prompt', 'answer', 'summarize'],
  variants: (k) => ({
    bubble: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    star: {
      rest: { rotate: 90, scale: 1, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 90], scale: [null, 0.7, 1], transition: { rotate: k.tween('deliberate', 'enter'), scale: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) } },
    },
  }),
  render: (v) => (
    <m.g variants={v.bubble}>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      <m.path d={STAR} variants={v.star} style={origin(12, 10.5)} />
    </m.g>
  ),
})
