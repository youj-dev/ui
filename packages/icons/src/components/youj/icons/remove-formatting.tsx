import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Clear formatting: each stroke of the × beside the letter pinches in to its centre and snaps back. */
export const RemoveFormattingIcon = createIcon({
  name: 'remove-formatting',
  category: 'editor',
  keywords: ['clear formatting', 'plain text', 'remove style', 'reset text', 'unformat'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return { a: pinch(0), b: pinch(1) }
  },
  render: (v) => (
    <>
      <path d="M4.5 4.5 H17.5" />
      <path d="M11 4.5 V19.5" />
      <m.path d="M15 15 L20 20" variants={v.a} style={origin(17.5, 17.5)} />
      <m.path d="M20 15 L15 20" variants={v.b} style={origin(17.5, 17.5)} />
    </>
  ),
})
