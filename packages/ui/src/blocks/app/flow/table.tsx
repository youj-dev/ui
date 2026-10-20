'use client'

import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import type { Box, Layout } from './layout'

/* The flow as numbers, step to step: every pair of nodes a path joins, in
 * stage and node order, with how many went that way and their share of
 * the node they left. It stands in the chart's room and scrolls there. */

interface TableProps {
  layout: Layout
  caption: string
  figure: (value: number) => string
  percent: (share: number) => string
  copy: { columnFrom: string; columnTo: string; columnValue: string; columnShare: string }
}

function Transitions({ layout, caption, figure, percent, copy }: TableProps) {
  const pairs = new Map<string, { from: Box; to: Box; value: number }>()
  for (const piece of layout.pieces) {
    const from = layout.boxes.get(piece.from)!
    const to = layout.boxes.get(piece.to)!
    const key = `${piece.from}>${piece.to}`
    pairs.set(key, { from, to, value: (pairs.get(key)?.value ?? 0) + piece.value })
  }
  const rows = [...pairs.entries()].sort(([, a], [, b]) => a.from.node.stage - b.from.node.stage || a.from.index - b.from.index || a.to.index - b.to.index)
  return (
    <table data-slot="flow-table" className="w-full caption-bottom border-separate border-spacing-0 text-ui-sm text-fg">
      <TableCaption className="text-start">{caption}</TableCaption>
      <TableHeader className="sticky top-0 z-[1] bg-surface">
        <TableRow>
          <TableHead scope="col">{copy.columnFrom}</TableHead>
          <TableHead scope="col">{copy.columnTo}</TableHead>
          <TableHead scope="col" className="text-end">
            {copy.columnValue}
          </TableHead>
          <TableHead scope="col" className="text-end">
            {copy.columnShare}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([key, { from, to, value }]) => (
          <TableRow key={key}>
            <TableHead scope="row" className="h-auto py-1.5 font-normal text-fg">
              {from.node.label}
            </TableHead>
            <TableCell className="py-1.5">{to.node.label}</TableCell>
            <TableCell className="py-1.5 text-end tabular-nums">{figure(value)}</TableCell>
            <TableCell className="py-1.5 text-end text-fg-muted tabular-nums">{percent(value / (from.value || 1))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </table>
  )
}

export { Transitions }
