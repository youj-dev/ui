import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The prompt steps forward and the cursor blinks twice, waiting for input. */
export const TerminalIcon = createIcon({
  name: 'terminal',
  category: 'development',
  keywords: ['console', 'cli', 'shell', 'command', 'code', 'prompt'],
  variants: (k) => ({
    prompt: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, 1.5, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    cursor: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: {
        opacity: [1, 0, 0, 1, 1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.05, 0.25, 0.3, 0.55, 0.6, 0.8, 0.85], Array(7).fill('linear')),
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M4 17 L10 11 L4 5" variants={v.prompt} />
      <m.path d="M12 19 H20" variants={v.cursor} />
    </>
  ),
})
