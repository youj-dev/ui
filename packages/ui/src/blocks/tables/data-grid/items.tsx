'use client'

import type { ReactNode } from 'react'
import type { RowData } from '@tanstack/react-table'
import { GridRow, type DataGridRowAction, type GridBodyContext, type GridItem } from './body'
import type { DataGridCopy } from './copy'
import type { GridColumnLayout } from './head'
import { DetailRow, FooterRow, GroupRow } from './lines'
import { metaOf, type DataGridColumn, type DataGridRow } from './model'

/** What every line of the body draws from: the layout, the selection, the open rows and the grid's callbacks. */
export interface ItemEnv<TData extends RowData> {
  navOf: (key: string) => number
  layout: readonly GridColumnLayout[]
  fillerAt: number | null
  span: number
  leafColumns: DataGridColumn<TData>[]
  isSelected: (row: DataGridRow<TData>) => boolean
  activeRowId?: string | null
  selectionEnabled: boolean
  expanded: Record<string, boolean>
  /** Rows animate in, out and between slots through PresenceList. Off when virtualized. */
  presence: boolean
  detailBase: string
  actionsOf?: (row: TData) => DataGridRowAction<TData>[]
  ctx: GridBodyContext
  renderDetail?: (row: TData) => ReactNode
  copy: DataGridCopy
  locale: string
}

const ariaRow = (line: number) => line + 2

/** One line of the body: a row, its detail panel, a group's heading or its footer. */
export function renderGridItem<TData extends RowData>(item: GridItem<TData>, env: ItemEnv<TData>, measure?: (el: HTMLElement | null) => void, virtualIndex?: number) {
  const nav = env.navOf(item.key)
  if (item.kind === 'row')
    return (
      <GridRow<TData>
        key={item.key}
        row={item.row}
        navIndex={nav}
        ariaRowIndex={ariaRow(nav)}
        selected={env.isSelected(item.row)}
        active={item.row.id === env.activeRowId}
        selectable={env.selectionEnabled && item.row.getCanSelect()}
        expanded={env.expanded[item.row.id] === true}
        stripe={item.stripe}
        columns={env.layout}
        fillerAt={env.fillerAt}
        presence={env.presence}
        detailId={`${env.detailBase}-${item.row.id}`}
        actions={env.actionsOf}
        ctx={env.ctx}
        measure={measure}
        virtualIndex={virtualIndex}
      />
    )
  if (item.kind === 'detail')
    return (
      <DetailRow
        key={item.key}
        id={`${env.detailBase}-${item.row.id}`}
        navIndex={nav}
        span={env.span}
        open={item.open}
        label={env.ctx.rowLabel(item.row.id)}
        presence={env.presence}
        measure={measure}
        virtualIndex={virtualIndex}
      >
        {env.renderDetail?.(item.row.original)}
      </DetailRow>
    )
  if (item.kind === 'group') {
    const n = item.group.rows.length
    const count = env.copy.itemCount(n.toLocaleString(env.locale), n, env.copy.noun)
    return (
      <GroupRow
        key={item.key}
        navIndex={nav}
        ariaRowIndex={ariaRow(nav)}
        span={env.span}
        label={item.group.label}
        count={n.toLocaleString(env.locale)}
        collapsed={item.group.collapsed}
        toggleLabel={`${item.group.key || '—'}, ${count}`}
        onToggle={() => env.ctx.toggleGroup(item.group.key)}
        presence={env.presence}
        measure={measure}
        virtualIndex={virtualIndex}
      />
    )
  }
  return (
    <FooterRow
      key={item.key}
      navIndex={nav}
      ariaRowIndex={ariaRow(nav)}
      columns={env.layout}
      fillerAt={env.fillerAt}
      caption={env.copy.groupTotal}
      values={env.leafColumns.map((column) => aggregateOf(column, item.group.rows, env.locale))}
      presence={env.presence}
      measure={measure}
      virtualIndex={virtualIndex}
    />
  )
}

/** A column's figure for a group's footer: its `aggregate` over the group's rows. */
function aggregateOf<TData extends RowData>(column: DataGridColumn<TData>, rows: DataGridRow<TData>[], locale: string): ReactNode {
  const meta = metaOf(column)
  const aggregate = meta?.aggregate
  if (!aggregate) return null
  const values = rows.map((row) => row.getValue(column.id))
  if (typeof aggregate === 'function') return aggregate(values)
  const numbers = values.map(Number).filter(Number.isFinite)
  if (numbers.length === 0) return null
  const sum = numbers.reduce((a, b) => a + b, 0)
  const value = aggregate === 'sum' ? sum : sum / numbers.length
  return meta?.formatAggregate ? meta.formatAggregate(value) : value.toLocaleString(locale)
}

/** A virtualized line's estimated height: rows, headings and footers are exact; only detail panels are measured. */
export function estimateLine<TData extends RowData>(items: GridItem<TData>[], index: number, rowHeight: number, scale: number) {
  const item = items[index]
  if (item?.kind === 'group') return 40 * scale
  if (item?.kind === 'footer') return 36 * scale
  if (item?.kind === 'detail') return item.open ? 220 : 0
  return rowHeight
}
