import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The grid on the page is ruled again, the row line first and then the column. */
export const FileSpreadsheetIcon = createIcon({
  name: 'file-spreadsheet',
  category: 'files',
  keywords: ['spreadsheet', 'csv', 'excel', 'sheet', 'table file', 'data file'],
  variants: (k) => ({
    row: { rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
    col: { rest: drawn(k), active: drawIn(k, 'base', k.duration('fast'), 'standard') },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <rect x="8" y="11" width="8" height="7" rx="1" />
      <m.path d="M8 14.5 H16" variants={v.row} />
      <m.path d="M12 11 V18" variants={v.col} />
    </>
  ),
})
