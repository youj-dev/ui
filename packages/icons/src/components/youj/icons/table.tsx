import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* A landscape sheet (18 × 16, 2.5 corners) with a 4.5-unit header band, a
 * narrow key column that starts under the header, and one row rule half-way
 * down the body. The same frame carries rows and rows-2. */

/** A row is inserted: a new row line slides out from under the header rule and drops into place. */
export const TableIcon = createIcon({
  name: 'table',
  category: 'data',
  keywords: ['spreadsheet', 'grid', 'rows', 'columns', 'data', 'sheet', 'database', 'table-2'],
  variants: (k) => ({
    row: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [-5.75, 0], transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 8.5 H21" />
      <path d="M9.5 8.5 V20" />
      <m.path d="M3 14.25 H21" variants={v.row} />
    </>
  ),
})
