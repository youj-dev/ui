import { m } from 'motion/react'
import { createIcon, drawIn, drawn, origin, seq } from './icon-base'

/** Editing a document: the pen scribbles and the line it writes is drawn again. */
export const FilePenIcon = createIcon({
  name: 'file-pen',
  category: 'files',
  keywords: ['edit document', 'write', 'compose', 'sign', 'draft', 'notes'],
  variants: (k) => ({
    pen: {
      rest: { x: 0, y: 0, rotate: 0, transition: k.tween('fast') },
      active: {
        x: [0, -1, 0.5, -0.75, 0],
        y: [0, 0.5, -0.5, 0.5, 0],
        rotate: [0, -4, 3, -2, 0],
        transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]),
      },
    },
    line: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M8.5 11 H11.5" variants={v.line} />
      <m.path d="M14.51 9.51 A1.4 1.4 0 0 1 16.49 11.49 L11.49 16.49 L8.25 17.75 L9.51 14.51 Z" variants={v.pen} style={origin(9, 17)} />
    </>
  ),
})
