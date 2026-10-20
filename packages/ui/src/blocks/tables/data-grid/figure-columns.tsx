'use client'

import { useContext } from 'react'
import type { Row, RowData } from '@tanstack/react-table'
import { GridEnvContext } from './cells'
import { compare, type Accessor, type MakeColumn, type Options, type ValueOf } from './column-kit'
import { FigureCell, MeterCell, TrendCell } from './figures'
import { numberFormat } from './format'
import type { DataGridFeatures, DataGridTone } from './model'

/** The column types for figures: a meter against a limit, a trend line, money and counts. */
export function figureColumns<TData extends RowData>(make: MakeColumn<TData>) {
  return {
    /** How much of a limit is used: a bar and "18/25". It warns at the limit and alarms past it, unless `tone` says otherwise. */
    meter<A extends Accessor<TData>>(
      accessor: A,
      options: Options<
        TData,
        ValueOf<TData, A>,
        { max: number | ((row: TData) => number); tone?: (ratio: number) => DataGridTone; format?: (n: number) => string }
      >,
    ) {
      const { max, tone = defaultMeterTone, format, ...rest } = options
      const maxOf = (row: TData) => (typeof max === 'function' ? max(row) : max)
      const ratio = (row: Row<DataGridFeatures, TData>, id: string) => {
        const limit = maxOf(row.original)
        return limit > 0 ? Number(row.getValue(id)) / limit : 0
      }
      return make(accessor, rest, {
        size: 170,
        minSize: 130,
        meta: { kind: 'meter', skeleton: 'meter', card: 'field' },
        sortFn: (a, b, id) => compare(ratio(a, id), ratio(b, id)),
        cell: (value, row, column) => {
          const limit = maxOf(row.original)
          const n = Number(value)
          return <LocaleMeter value={n} max={limit} tone={tone(limit > 0 ? n / limit : 0)} format={format} label={column} />
        },
      })
    },

    /** A word-sized line over a series and the change beside it. Sorts by the change. */
    trend<A extends Accessor<TData>>(
      accessor: A,
      options: Options<
        TData,
        ValueOf<TData, A>,
        {
          /** The change as a fraction (0.12 is +12%). Default: the last value against the first. */
          delta?: (row: TData) => number | null
          /** The line's color: `auto` (the first chart color, the danger ink while falling), a chart color (1–5) or any CSS color. Default auto. */
          color?: 'auto' | 1 | 2 | 3 | 4 | 5 | (string & {})
        }
      > = {},
    ) {
      const { delta, color = 'auto', ...rest } = options
      const series = (value: unknown) => (Array.isArray(value) ? (value as unknown[]).map(Number).filter(Number.isFinite) : [])
      const change = (row: TData, value: unknown) => {
        if (delta) return delta(row)
        const data = series(value)
        const first = data[0]
        const last = data[data.length - 1]
        return first !== undefined && last !== undefined && first !== 0 ? (last - first) / Math.abs(first) : null
      }
      const stroke = typeof color === 'number' ? `var(--color-chart-${color})` : color
      return make(accessor, rest, {
        size: 170,
        minSize: 140,
        meta: { kind: 'trend', skeleton: 'trend', card: 'field', align: 'start' },
        sortFn: (a, b, id) => compare(change(a.original, a.getValue(id)) ?? 0, change(b.original, b.getValue(id)) ?? 0),
        cell: (value, row) => <LocaleTrend data={series(value)} delta={change(row.original, value)} color={stroke} />,
      })
    },

    /** Money in tabular mono: the symbol and cents muted, and a unit after it ("/mo"). Groups total it. */
    currency<A extends Accessor<TData>>(
      accessor: A,
      options: Options<
        TData,
        ValueOf<TData, A>,
        { currency: string; unit?: string; decimals?: number; compact?: boolean }
      >,
    ) {
      const { currency, unit, decimals = 0, compact = false, ...rest } = options
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency,
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      }
      return make(accessor, rest, {
        size: 130,
        minSize: 96,
        meta: {
          kind: 'currency',
          numeric: true,
          skeleton: 'number',
          card: 'field',
          aggregate: 'sum',
          formatAggregate: (n) => <FigureCell value={n} options={format} unit={unit} />,
        },
        sortFn: (a, b, id) => compare(Number(a.getValue(id)) || 0, Number(b.getValue(id)) || 0),
        cell: (value) => <FigureCell value={value === null || value === undefined ? null : Number(value)} options={format} unit={unit} />,
      })
    },

    /** A count or measure in tabular mono, with a muted unit ("seats", "ms"). */
    number<A extends Accessor<TData>>(
      accessor: A,
      options: Options<
        TData,
        ValueOf<TData, A>,
        {
          unit?: string
          decimals?: number
          format?: Intl.NumberFormatOptions
          tone?: (value: number, row: TData) => DataGridTone | undefined
          /** A figure for each group's footer. */
          aggregate?: 'sum' | 'mean'
        }
      > = {},
    ) {
      const { unit, decimals = 0, format, tone, aggregate, ...rest } = options
      const numberOptions = format ?? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      return make(accessor, rest, {
        size: 110,
        minSize: 80,
        meta: {
          kind: 'number',
          numeric: true,
          skeleton: 'number',
          card: 'field',
          aggregate,
          formatAggregate: (n) => <FigureCell value={n} options={aggregate === 'mean' ? { ...numberOptions, maximumFractionDigits: 1 } : numberOptions} unit={unit} />,
        },
        sortFn: (a, b, id) => compare(Number(a.getValue(id)) || 0, Number(b.getValue(id)) || 0),
        cell: (value, row) => {
          const n = value === null || value === undefined ? null : Number(value)
          return <FigureCell value={n} options={numberOptions} unit={unit} tone={n === null ? undefined : tone?.(n, row.original)} />
        },
      })
    },
  }
}

/** Calm until it matters: it warns at the limit (a conversation, not an alarm) and alarms past it. */
function defaultMeterTone(ratio: number): DataGridTone {
  return ratio > 1 ? 'danger' : ratio >= 1 ? 'warning' : 'neutral'
}

/* Cells that format with the grid's locale, or name themselves after their row. */

function LocaleMeter({
  value,
  max,
  tone,
  format,
  label,
}: {
  value: number
  max: number
  tone: DataGridTone
  format?: (n: number) => string
  label: string
}) {
  const { locale } = useContext(GridEnvContext)
  return (
    <MeterCell
      value={value}
      max={max}
      tone={tone}
      label={label}
      format={format ?? ((n) => numberFormat(locale, { maximumFractionDigits: 1 }).format(n))}
    />
  )
}

function LocaleTrend({ data, delta, color }: { data: number[]; delta: number | null; color: string }) {
  const { locale } = useContext(GridEnvContext)
  return (
    <TrendCell
      data={data}
      delta={delta}
      color={color}
      format={(fraction) => numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(fraction)}
    />
  )
}
