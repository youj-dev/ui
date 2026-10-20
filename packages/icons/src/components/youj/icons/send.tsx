import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The plane pulls back, flies out along its heading and glides back in from the opposite corner. */
export const SendIcon = createIcon({
  name: 'send',
  category: 'communication',
  keywords: ['message', 'submit', 'paper plane', 'deliver', 'share'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.14, 0.46, 0.47, 1], ['standard', 'exit', 'linear', 'emphasized'])
    return {
      plane: {
        rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
        active: { x: [0, -1.5, 16, -16, 0], y: [0, 1.5, -16, 16, 0], opacity: [1, 1, 0, 0, 1], transition: t },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.plane}>
      <path d="M21 3 L3 10.5 L10.5 13.5 L13.5 21 Z" />
      <path d="M21 3 L10.5 13.5" />
    </m.g>
  ),
})

