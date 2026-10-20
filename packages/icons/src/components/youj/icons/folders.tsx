import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The front folder lifts off the one behind it and settles back down. */
export const FoldersIcon = createIcon({
  name: 'folders',
  category: 'files',
  keywords: ['directories', 'collections', 'projects', 'multiple folders', 'workspace', 'groups'],
  variants: (k) => ({
    front: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.25, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    back: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, -0.5, 0], y: [0, 0.5, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M6 16.5 H4.5 A1.5 1.5 0 0 1 3 15 V5.5 A1.5 1.5 0 0 1 4.5 4 H7.5 L9 5.5 H16 A1.5 1.5 0 0 1 17.5 7 V9" variants={v.back} />
      <m.path
        d="M6 18.5 V9 A1.5 1.5 0 0 1 7.5 7.5 H10.5 L12 9 H19.5 A1.5 1.5 0 0 1 21 10.5 V18.5 A1.5 1.5 0 0 1 19.5 20 H7.5 A1.5 1.5 0 0 1 6 18.5 Z"
        variants={v.front}
      />
    </>
  ),
})
