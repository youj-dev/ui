import type { ReactNode } from 'react'
import type { AccessorFn, CellContext, ColumnHelper, DeepKeys, DeepValue, Row, RowData } from '@tanstack/react-table'
import { columnLabel, type DataGridColumnDef, type DataGridColumnMeta, type DataGridFeatures, type DataGridOption, type DataGridOptionTone, type DataGridPerson } from './model'

/* What every column type is built from: the options it takes and the one
 * function that turns a type's own definition, under the caller's options,
 * into a TanStack column. */

export type Accessor<TData extends RowData> = DeepKeys<TData> | AccessorFn<TData>
export type ValueOf<TData extends RowData, A> = A extends AccessorFn<TData, infer R> ? R : A extends DeepKeys<TData> ? DeepValue<TData, A> : never

export interface DataGridColumnOptions<TData extends RowData, TValue> {
  /** Required when the accessor is a function. */
  id?: string
  header?: string | (() => ReactNode)
  size?: number
  minSize?: number
  maxSize?: number
  enableSorting?: boolean
  enableHiding?: boolean
  enableResizing?: boolean
  /** Draws the cell yourself. The type's sorting, search, filter and grouping stay. */
  render?: (value: TValue, row: TData) => ReactNode
  /** Anything the type sets, changed. */
  meta?: Partial<DataGridColumnMeta>
}

export type Options<TData extends RowData, TValue, Extra = object> = DataGridColumnOptions<TData, TValue> & Extra

/** The options of a status column: an object keyed by value, or a list. Their order is the sort and group order. */
export type DataGridStatusOptions = Readonly<Record<string, { label: string; tone?: DataGridOptionTone }>> | readonly DataGridOption[]

export function toOptions(options: DataGridStatusOptions | undefined): DataGridOption[] {
  if (!options) return []
  return Array.isArray(options)
    ? [...(options as readonly DataGridOption[])]
    : Object.entries(options as Record<string, { label: string; tone?: DataGridOptionTone }>).map(([value, option]) => ({ value, ...option }))
}

export const text = (value: unknown) => (value === null || value === undefined ? '' : String(value))
export const compare = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0)

/** A person-shaped value, or nothing. */
export function asPeople(value: unknown): DataGridPerson[] {
  return Array.isArray(value) ? value.filter((p): p is DataGridPerson => typeof p === 'object' && p !== null && 'id' in p && 'name' in p) : []
}

export interface ColumnBase<TData extends RowData, TValue> {
  meta: DataGridColumnMeta
  cell: (value: TValue, row: Row<DataGridFeatures, TData>, column: string) => ReactNode
  sortFn?: (a: Row<DataGridFeatures, TData>, b: Row<DataGridFeatures, TData>, columnId: string) => number
  size?: number
  minSize?: number
  enableSorting?: boolean
}

export type MakeColumn<TData extends RowData> = <TValue>(
  accessor: Accessor<TData>,
  options: DataGridColumnOptions<TData, TValue>,
  base: ColumnBase<TData, TValue>,
) => DataGridColumnDef<TData>

/** Builds one column: the type's own definition under the caller's options. */
export function columnMaker<TData extends RowData>(helper: ColumnHelper<DataGridFeatures, TData>): MakeColumn<TData> {
  return (accessor, options, base) => {
    const { render, meta, header, id, ...rest } = options
    const def = {
      id,
      header,
      size: base.size,
      minSize: base.minSize,
      enableSorting: base.enableSorting,
      ...(base.sortFn && { sortFn: base.sortFn }),
      ...(base.meta.facet && { filterFn: 'facet' }),
      ...rest,
      meta: { ...base.meta, ...meta },
      cell: (ctx: CellContext<DataGridFeatures, TData, unknown>) =>
        render ? render(ctx.getValue() as never, ctx.row.original) : base.cell(ctx.getValue() as never, ctx.row, columnLabel(ctx.column)),
    }
    return helper.accessor(accessor as never, def as never) as unknown as DataGridColumnDef<TData>
  }
}
