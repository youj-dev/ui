import { m } from 'motion/react'
import { createIcon, drawn } from './icon-base'

/** The cross is struck again, one stroke after the other, like marking a box closed. */
export const SquareXIcon = createIcon({
  name: 'square-x',
  category: 'actions',
  keywords: ['close', 'cancel', 'remove', 'delete', 'dismiss', 'x box'],
  variants: (k) => {
    const strike = (i: number) => ({
      rest: drawn(k),
      active: {
        pathLength: [1, 0, 1],
        transition: { ...k.tween('slow', 'emphasized'), times: [0, 0.01, 1], delay: i * k.duration('fast') },
      },
    })
    return { a: strike(0), b: strike(1) }
  },
  render: (v) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <m.path d="M9 9 L15 15" variants={v.a} />
      <m.path d="M15 9 L9 15" variants={v.b} />
    </>
  ),
})
