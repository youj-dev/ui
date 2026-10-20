import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* A design-tool frame: four guides that cross at the frame's corners and run
 * on past them, like crop marks. The right and bottom guides are the edges a
 * resize handle drags. */

/** Resizing: the right and bottom edges are dragged out from the corner, then let go back to size. */
export const FrameIcon = createIcon({
  name: 'frame',
  category: 'editor',
  keywords: ['frame', 'artboard', 'board', 'canvas', 'layout', 'design', 'crop marks', 'container', 'resize'],
  variants: (k) => {
    const drag = seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized'])
    return {
      right: { rest: { x: 0, transition: k.tween('fast') }, active: { x: [null, 2, 0], transition: drag } },
      bottom: { rest: { y: 0, transition: k.tween('fast') }, active: { y: [null, 2, 0], transition: drag } },
    }
  },
  render: (v) => (
    <>
      <path d="M7 3.5 V20.5" />
      <path d="M3.5 7 H20.5" />
      <m.path d="M17 3.5 V20.5" variants={v.right} />
      <m.path d="M3.5 17 H20.5" variants={v.bottom} />
    </>
  ),
})
