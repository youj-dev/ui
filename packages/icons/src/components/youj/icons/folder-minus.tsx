import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The bar pulls in from both ends and springs back out while the folder settles under it. */
export const FolderMinusIcon = createIcon({
  name: 'folder-minus',
  category: 'files',
  keywords: ['remove folder', 'collapse', 'delete folder', 'minus', 'subtract'],
  variants: (k) => ({
    folder: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.3, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.folder} style={origin(12, 19.5)}>
      <path d="M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V17.5 A2 2 0 0 1 19 19.5 H5 A2 2 0 0 1 3 17.5 Z" />
      <m.path d="M9 13 H15" variants={v.bar} style={origin(12, 13)} />
    </m.g>
  ),
})
