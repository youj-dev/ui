import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

/* layout-grid's tiles. The thumbnails on the left are the grid's left
 * column; on the right each tile is split into a top cap and a bottom cup,
 * and each list line is the same six commands with its corners folded
 * flat, so a pair of lines inflates into a tile. */
const ROWS = [
  [
    ['M13.5 4.75 L13.5 4.75 C13.5 4.75 13.5 4.75 13.5 4.75 L20.5 4.75 C20.5 4.75 20.5 4.75 20.5 4.75 L20.5 4.75', 'M13.5 7 L13.5 5.5 C13.5 4.4 14.4 3.5 15.5 3.5 L18.5 3.5 C19.6 3.5 20.5 4.4 20.5 5.5 L20.5 7'],
    ['M13.5 9.25 L13.5 9.25 C13.5 9.25 13.5 9.25 13.5 9.25 L20.5 9.25 C20.5 9.25 20.5 9.25 20.5 9.25 L20.5 9.25', 'M13.5 7 L13.5 8.5 C13.5 9.6 14.4 10.5 15.5 10.5 L18.5 10.5 C19.6 10.5 20.5 9.6 20.5 8.5 L20.5 7'],
  ],
  [
    ['M13.5 14.75 L13.5 14.75 C13.5 14.75 13.5 14.75 13.5 14.75 L20.5 14.75 C20.5 14.75 20.5 14.75 20.5 14.75 L20.5 14.75', 'M13.5 17 L13.5 15.5 C13.5 14.4 14.4 13.5 15.5 13.5 L18.5 13.5 C19.6 13.5 20.5 14.4 20.5 15.5 L20.5 17'],
    ['M13.5 19.25 L13.5 19.25 C13.5 19.25 13.5 19.25 13.5 19.25 L20.5 19.25 C20.5 19.25 20.5 19.25 20.5 19.25 L20.5 19.25', 'M13.5 17 L13.5 18.5 C13.5 19.6 14.4 20.5 15.5 20.5 L18.5 20.5 C19.6 20.5 20.5 19.6 20.5 18.5 L20.5 17'],
  ],
] as const

/**
 * List ↔ grid, for view switchers. Row by row, each pair of lines bows apart
 * and rounds off into a tile beside its thumbnail; back to the list, the
 * tiles flatten into lines again, last row first. `active` = grid.
 */
export const LayoutListIcon = createIcon({
  name: 'layout-list',
  category: 'navigation',
  keywords: ['list', 'grid', 'view', 'layout', 'toggle view', 'gallery', 'rows', 'tiles'],
  states: ['list', 'grid'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    return Object.fromEntries(
      ROWS.flatMap((row, r) =>
        row.map(([line, half], i) => [
          `r${r}${i}`,
          {
            rest: { d: line, transition: { ...k.spring('snappy'), delay: (1 - r) * s } },
            active: { d: half, transition: { ...k.spring('snappy'), delay: r * s } },
          },
        ]),
      ),
    )
  },
  render: (v) => (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      {ROWS.flatMap((row, r) => row.map(([line], i) => <m.path key={line} d={line} variants={v[`r${r}${i}`]} />))}
    </>
  ),
})
