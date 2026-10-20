import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** A shell script. The prompt steps forward and the cursor blinks twice, waiting for input. */
export const FileTerminalIcon = createIcon({
  name: 'file-terminal',
  category: 'files',
  keywords: ['script', 'shell', 'bash', 'sh', 'console', 'command', 'cli', 'executable', 'file-terminal'],
  variants: (k) => ({
    prompt: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    cursor: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: {
        opacity: [null, 0, 0, 1, 1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.05, 0.25, 0.3, 0.55, 0.6, 0.8, 0.85], Array(7).fill('linear')),
      },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M8 12 L10.5 14.5 L8 17" variants={v.prompt} />
      <m.path d="M12.5 17 H16" variants={v.cursor} />
    </>
  ),
})
