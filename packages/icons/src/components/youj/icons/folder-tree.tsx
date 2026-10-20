import { m } from 'motion/react'
import { createIcon, drawIn, drawn, origin, seq } from './icon-base'

/** The branches are drawn out from the root and each child folder pops in at the end of its branch. */
export const FolderTreeIcon = createIcon({
  name: 'folder-tree',
  category: 'files',
  keywords: ['file tree', 'explorer', 'hierarchy', 'directory structure', 'nested folders', 'sitemap'],
  variants: (k) => {
    const child = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.6, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized'], k.duration('fast') + i * k.stagger('loose')) },
    })
    return {
      branches: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
      c0: child(0),
      c1: child(1),
    }
  },
  render: (v) => (
    <>
      <path d="M3 7 V4 A1 1 0 0 1 4 3 H5.5 L6.5 4 H8 A1 1 0 0 1 9 5 V7 A1 1 0 0 1 8 8 H4 A1 1 0 0 1 3 7 Z" />
      <m.path d="M6 8 V18 H12" variants={v.branches} />
      <m.path d="M6 10.5 H12" variants={v.branches} />
      <m.path d="M12 11.5 V8.5 A1 1 0 0 1 13 7.5 H15 L16 8.5 H20 A1 1 0 0 1 21 9.5 V11.5 A1 1 0 0 1 20 12.5 H13 A1 1 0 0 1 12 11.5 Z" variants={v.c0} style={origin(16.5, 10)} />
      <m.path d="M12 19 V16 A1 1 0 0 1 13 15 H15 L16 16 H20 A1 1 0 0 1 21 17 V19 A1 1 0 0 1 20 20 H13 A1 1 0 0 1 12 19 Z" variants={v.c1} style={origin(16.5, 17.5)} />
    </>
  ),
})
