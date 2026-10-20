'use client'

import { Badge } from '../../../components/ui/badge'
import { cn, numberFormat } from '../../../lib/utils'
import type { PairedBarsCopy, PairedBarsFigure, PairedBarsRow, PairedBarsSide } from './data'
import type { AxisScale, ScaleKind } from './scale'

/* The comparison as a table. Each row is a name (with its badges and a line
 * of detail), two bars on the one shared axis, the two numbers behind them,
 * and what each side charges a month. The axis lives in the header of the
 * bars column; its ticks draw a calm gridline in every row at the same
 * place, because every row's bars share that column's width. The bars are
 * for the eye (aria-hidden): the numbers carry the plan's name for a screen
 * reader, so the table reads row by row. */

const BAR = { 0: 'var(--color-chart-2)', 1: 'var(--color-chart-1)' } as const
const TONE = (side: PairedBarsSide, i: 0 | 1) => (side.tone ? `var(--color-${side.tone})` : BAR[i])

interface PairedBarsTableProps {
  sides: readonly [PairedBarsSide, PairedBarsSide]
  rows: readonly PairedBarsRow[]
  scale: AxisScale
  kind: ScaleKind
  copy: PairedBarsCopy
  format: Intl.NumberFormatOptions
  /** Bars are at their length; before that they are drawn empty and grow. */
  shown: boolean
  /** No width transition on the bars. */
  reduced: boolean
}

function Figure({ figure, copy }: { figure: PairedBarsFigure | undefined; copy: PairedBarsCopy }) {
  const money = numberFormat(copy.locale, {
    style: 'currency',
    currency: copy.currency,
    maximumFractionDigits: figure && Number.isInteger(figure.amount) && (figure.was === undefined || Number.isInteger(figure.was)) ? 0 : 2,
  })
  if (!figure)
    return (
      <>
        <span aria-hidden className="text-fg-subtle">
          –
        </span>
        <span className="sr-only">{copy.noFigure}</span>
      </>
    )
  return (
    <span className="inline-flex flex-col items-end">
      <span className="font-medium tabular-nums">{money.format(figure.amount)}</span>
      {figure.was !== undefined && (
        <del className="text-ui-xs text-fg-subtle tabular-nums">
          <span className="sr-only">{copy.was} </span>
          {money.format(figure.was)}
        </del>
      )}
    </span>
  )
}

function PairedBarsTable({ sides, rows, scale, kind, copy, format, shown, reduced }: PairedBarsTableProps) {
  const compact = numberFormat(copy.locale, { notation: 'compact', maximumFractionDigits: 1 })
  const grid = scale.ticks.map((t) => scale.position(t) * 100)
  const figures = rows.some((row) => row.figures)
  const head = 'h-10 px-3 align-middle text-ui-sm font-normal text-fg-muted'
  return (
    <table
      data-slot="paired-bars-table"
      aria-label={copy.tableLabel}
      className="w-full min-w-170 table-fixed border-separate bg-inherit border-spacing-0 text-ui"
    >
      <colgroup>
        <col className="w-[28%]" />
        <col />
        <col className="w-24" />
        {figures && <col className="w-28" />}
        {figures && <col className="w-28" />}
      </colgroup>
      <thead className="sticky top-0 z-10 bg-inherit">
        <tr>
          <th scope="col" className={cn(head, 'text-start')}>
            {copy.nameHeader}
          </th>
          <th scope="col" className="relative h-10 px-7 align-middle font-normal text-fg-muted">
            <span className="sr-only">{copy.chartHeader(kind)}</span>
            <span aria-hidden data-slot="paired-bars-axis" className="relative block h-5">
              {scale.ticks.map((t, i) => (
                <span key={t} className="absolute top-1/2 text-ui-sm tabular-nums" style={{ left: `${grid[i]}%`, translate: '-50% -50%' }}>
                  {compact.format(t)}
                </span>
              ))}
            </span>
          </th>
          <th scope="col" className={cn(head, 'text-end')}>
            {copy.valuesHeader}
          </th>
          {figures &&
            sides.map((side) => (
              <th key={side.id} scope="col" className={cn(head, 'text-end')}>
                {copy.figureHeader(side.label)}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} data-slot="paired-bars-row" className="group/row h-14">
            <th
              scope="row"
              className="rounded-s-lg px-3 text-start font-normal transition-colors yj-duration-fast ease-standard group-hover/row:bg-hover"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{row.name}</span>
                {row.badges?.map((badge) => (
                  <Badge key={badge.label} variant={badge.tone ?? 'secondary'}>
                    {badge.label}
                  </Badge>
                ))}
              </span>
              {row.detail && <span className="block truncate text-ui-sm text-fg-muted">{row.detail}</span>}
            </th>
            <td className="relative px-7 transition-colors yj-duration-fast ease-standard group-hover/row:bg-hover">
              <div aria-hidden className="absolute inset-x-7 inset-y-0">
                {grid.map((x, i) => (
                  <span key={scale.ticks[i]} className="absolute inset-y-0 w-px bg-line-subtle" style={{ left: `${x}%` }} />
                ))}
              </div>
              <div aria-hidden className="relative flex flex-col">
                {row.values.map((value, i) => (
                  <span key={sides[i]!.id} className="relative flex h-5 items-center">
                    <span
                      data-slot="paired-bars-bar"
                      data-yj-side={sides[i]!.id}
                      className={cn('block h-2 rounded-full', !reduced && 'transition-[width] yj-duration-base ease-standard')}
                      style={{
                        width: `${shown ? scale.position(value) * 100 : 0}%`,
                        background: TONE(sides[i]!, i as 0 | 1),
                        minWidth: value > 0 ? 6 : 0,
                      }}
                    />
                  </span>
                ))}
              </div>
            </td>
            <td className={cn('px-3 text-end transition-colors yj-duration-fast ease-standard group-hover/row:bg-hover', !figures && 'rounded-e-lg')}>
              {row.values.map((value, i) => (
                <span key={sides[i]!.id} className="flex h-5 items-center justify-between gap-2 text-ui-sm tabular-nums">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: TONE(sides[i]!, i as 0 | 1) }} />
                  <span className="sr-only">{sides[i]!.label} </span>
                  {numberFormat(copy.locale, row.format ?? format).format(value)}
                </span>
              ))}
            </td>
            {figures &&
              sides.map((side, i) => (
                <td
                  key={side.id}
                  className={cn(
                    'px-3 text-end transition-colors yj-duration-fast ease-standard group-hover/row:bg-hover',
                    i === sides.length - 1 && 'rounded-e-lg',
                  )}
                >
                  <Figure figure={row.figures?.[i]} copy={copy} />
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { PairedBarsTable }
