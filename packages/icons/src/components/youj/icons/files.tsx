import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The top page slides aside a little, showing the one behind, and settles back on the stack. */
export const FilesIcon = createIcon({
  name: 'files',
  category: 'files',
  keywords: ['documents', 'pages', 'copies', 'multiple files', 'stack', 'duplicate'],
  variants: (k) => ({
    front: {
      rest: { x: 0, y: 0, rotate: 0, transition: k.tween('base') },
      active: { x: [0, 1.25, 0], y: [0, 0.5, 0], rotate: [0, 4, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    back: {
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, -0.75, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M4 17 V5 A2 2 0 0 1 6 3 H12.5" variants={v.back} />
      <m.g variants={v.front} style={origin(12.75, 21)}>
        <path d="M14.5 6 H9 A2 2 0 0 0 7 8 V19 A2 2 0 0 0 9 21 H17 A2 2 0 0 0 19 19 V10.5 Z" />
        <path d="M14.5 6 V10.5 H19" />
      </m.g>
    </>
  ),
})
